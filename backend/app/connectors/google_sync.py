"""Google Sync service — fetches Gmail and Calendar data via REST APIs and saves to local JSONL files."""

import json
import os
import time
from datetime import datetime, timezone
from pathlib import Path

import httpx
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models import SourceConnection
from app.security.encryption import decrypt, encrypt

DATA_DIR = Path(__file__).resolve().parents[2] / "data"


async def get_google_credentials(session: AsyncSession, user_id: str) -> dict | None:
    """Retrieve and decrypt Google credentials for a user."""
    # Find Google connection (e.g. gmail or google_calendar social auth)
    result = await session.execute(
        select(SourceConnection).where(
            SourceConnection.user_id == user_id,
            SourceConnection.source_type.in_(["gmail", "google_calendar"]),
        )
    )
    conn = result.scalars().first()
    if not conn or not conn.encrypted_credentials:
        return None

    try:
        creds_str = decrypt(conn.encrypted_credentials)
        if not creds_str:
            return None
        creds = json.loads(creds_str)

        # Check if access token is expired and needs refreshing
        now = time.time()
        # Buffer of 60 seconds
        if creds.get("expires_at", 0) - 60 < now and creds.get("refresh_token"):
            creds = await refresh_google_tokens(session, conn, creds)

        return creds
    except Exception as e:
        print(f"Error resolving Google credentials: {e}")
        return None


async def refresh_google_tokens(session: AsyncSession, conn: SourceConnection, creds: dict) -> dict:
    """Use refresh token to get a new Google access token."""
    client_id = os.getenv("GOOGLE_CLIENT_ID")
    client_secret = os.getenv("GOOGLE_CLIENT_SECRET")

    if not client_id or not client_secret:
        raise ValueError("Missing GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET env variables")

    payload = {
        "client_id": client_id,
        "client_secret": client_secret,
        "refresh_token": creds["refresh_token"],
        "grant_type": "refresh_token",
    }

    async with httpx.AsyncClient() as client:
        res = await client.post("https://oauth2.googleapis.com/token", data=payload)
        if res.status_code != 200:
            raise Exception(f"Failed to refresh Google token: {res.text}")

        token_data = res.json()

        # Update credentials dictionary
        creds["access_token"] = token_data["access_token"]
        if "refresh_token" in token_data:
            creds["refresh_token"] = token_data["refresh_token"]
        creds["expires_at"] = time.time() + token_data["expires_in"]

        # Save back to database (encrypted)
        conn.encrypted_credentials = encrypt(json.dumps(creds))
        await session.commit()
        await session.refresh(conn)

        return creds


def write_jsonl(file_path: Path, items: list):
    """Write list of dictionaries to a JSONL file."""
    file_path.parent.mkdir(parents=True, exist_ok=True)
    with open(file_path, "w", encoding="utf-8") as f:
        for item in items:
            f.write(json.dumps(item) + "\n")


async def sync_gmail(access_token: str) -> bool:
    """Fetch Gmail inbox and sent items and save them locally."""
    headers = {"Authorization": f"Bearer {access_token}"}

    async with httpx.AsyncClient() as client:
        # 1. Fetch Inbox Messages
        inbox_items = []
        res = await client.get(
            "https://gmail.googleapis.com/gmail/v1/users/me/messages",
            headers=headers,
            params={"q": "label:INBOX", "maxResults": 15},
        )
        if res.status_code == 200:
            msg_list = res.json().get("messages", [])
            for m in msg_list:
                m_res = await client.get(
                    f"https://gmail.googleapis.com/gmail/v1/users/me/messages/{m['id']}",
                    headers=headers,
                )
                if m_res.status_code == 200:
                    detail = m_res.json()
                    headers_dict = {
                        h["name"].lower(): h["value"]
                        for h in detail.get("payload", {}).get("headers", [])
                    }
                    inbox_items.append(
                        {
                            "id": detail.get("id"),
                            "from": headers_dict.get("from", "Unknown"),
                            "to": headers_dict.get("to", "Unknown"),
                            "subject": headers_dict.get("subject", "(No Subject)"),
                            "snippet": detail.get("snippet", ""),
                            "date": headers_dict.get("date", ""),
                            "labels": detail.get("labelIds", []),
                            "thread_id": detail.get("threadId"),
                        }
                    )
        write_jsonl(DATA_DIR / "gmail" / "inbox.jsonl", inbox_items)

        # 2. Fetch Sent Messages
        sent_items = []
        res = await client.get(
            "https://gmail.googleapis.com/gmail/v1/users/me/messages",
            headers=headers,
            params={"q": "label:SENT", "maxResults": 15},
        )
        if res.status_code == 200:
            msg_list = res.json().get("messages", [])
            for m in msg_list:
                m_res = await client.get(
                    f"https://gmail.googleapis.com/gmail/v1/users/me/messages/{m['id']}",
                    headers=headers,
                )
                if m_res.status_code == 200:
                    detail = m_res.json()
                    headers_dict = {
                        h["name"].lower(): h["value"]
                        for h in detail.get("payload", {}).get("headers", [])
                    }
                    sent_items.append(
                        {
                            "id": detail.get("id"),
                            "from": headers_dict.get("from", "Unknown"),
                            "to": headers_dict.get("to", "Unknown"),
                            "subject": headers_dict.get("subject", "(No Subject)"),
                            "snippet": detail.get("snippet", ""),
                            "date": headers_dict.get("date", ""),
                            "thread_id": detail.get("threadId"),
                        }
                    )
        write_jsonl(DATA_DIR / "gmail" / "sent.jsonl", sent_items)

    return True


async def sync_calendar(access_token: str) -> bool:
    """Fetch Calendar events and save them locally."""
    headers = {"Authorization": f"Bearer {access_token}"}
    time_min = datetime.now(timezone.utc).isoformat()

    async with httpx.AsyncClient() as client:
        res = await client.get(
            "https://www.googleapis.com/calendar/v3/calendars/primary/events",
            headers=headers,
            params={
                "timeMin": time_min,
                "maxResults": 15,
                "singleEvents": "true",
                "orderBy": "startTime",
            },
        )
        if res.status_code != 200:
            print(f"Failed to sync Google Calendar: {res.text}")
            return False

        events_data = res.json().get("items", [])
        events = []
        for e in events_data:
            events.append(
                {
                    "id": e.get("id"),
                    "summary": e.get("summary", "(No Title)"),
                    "description": e.get("description", ""),
                    "start_datetime": e.get("start", {}).get("dateTime")
                    or e.get("start", {}).get("date")
                    or "",
                    "end_datetime": e.get("end", {}).get("dateTime")
                    or e.get("end", {}).get("date")
                    or "",
                    "location": e.get("location", ""),
                    "attendees": [a.get("email") for a in e.get("attendees", []) if a.get("email")],
                    "status": e.get("status", "confirmed"),
                }
            )

        write_jsonl(DATA_DIR / "google_calendar" / "events.jsonl", events)

    return True


async def sync_google_data(session: AsyncSession, user_id: str) -> bool:
    """Run full Google Gmail & Calendar sync task for a connected user."""
    creds = await get_google_credentials(session, user_id)
    if not creds:
        return False

    token = creds.get("access_token")
    if not token:
        return False

    try:
        gmail_ok = await sync_gmail(token)
        cal_ok = await sync_calendar(token)
        return gmail_ok and cal_ok
    except Exception as e:
        print(f"Error during Google API synchronization: {e}")
        return False

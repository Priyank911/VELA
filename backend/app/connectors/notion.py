"""Notion connector — syncs Notion pages to local JSONL files."""

import json
from pathlib import Path

import httpx
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.connectors.base import BaseConnector
from app.db.models import SourceConnection
from app.security.encryption import decrypt

DATA_DIR = Path(__file__).resolve().parents[2] / "data"


class NotionConnector(BaseConnector):
    name = "notion"
    display_name = "Notion"
    description = "Connect Notion to track projects, notes, and career goals"
    icon = "📝"

    async def authenticate(self, credentials: dict) -> bool:
        return bool(credentials.get("access_token"))

    async def test_connection(self) -> bool:
        return True

    def get_available_tables(self) -> list[str]:
        return ["notion.pages"]


async def get_notion_credentials(session: AsyncSession, user_id: str) -> dict | None:
    """Retrieve and decrypt Notion credentials for a user."""
    result = await session.execute(
        select(SourceConnection).where(
            SourceConnection.user_id == user_id, SourceConnection.source_type == "notion"
        )
    )
    conn = result.scalars().first()
    if not conn or not conn.encrypted_credentials:
        return None
    try:
        return json.loads(decrypt(conn.encrypted_credentials))
    except Exception:
        return None


async def sync_notion_data(session: AsyncSession, user_id: str) -> bool:
    """Query Notion Search API for pages shared with the integration and save to JSONL."""
    creds = await get_notion_credentials(session, user_id)
    if not creds or not creds.get("access_token"):
        print(f"No active Notion credentials found for user {user_id}")
        return False

    access_token = creds["access_token"]
    headers = {
        "Authorization": f"Bearer {access_token}",
        "Notion-Version": "2022-06-28",
        "Content-Type": "application/json",
    }

    try:
        async with httpx.AsyncClient() as client:
            res = await client.post(
                "https://api.notion.com/v1/search",
                headers=headers,
                json={"filter": {"property": "object", "value": "page"}, "page_size": 25},
            )

            if res.status_code != 200:
                print(f"Failed to fetch Notion search results: {res.status_code} - {res.text}")
                return False

            results = res.json().get("results", [])
            pages = []

            for r in results:
                page_id = r.get("id")
                url = r.get("url", "")
                last_edited = r.get("last_edited_time", "")

                # Extract title from properties
                title = ""
                properties = r.get("properties", {})
                for prop_name, prop_val in properties.items():
                    if isinstance(prop_val, dict) and prop_val.get("type") == "title":
                        title_parts = prop_val.get("title", [])
                        title = "".join(t.get("plain_text", "") for t in title_parts)
                        break

                if not title:
                    title = "Untitled Page"

                pages.append(
                    {
                        "page_id": str(page_id),
                        "title": title,
                        "type": "page",
                        "content": f"Notion page metadata. URL: {url}",
                        "tags": [],
                        "last_edited": str(last_edited),
                    }
                )

            # Write to pages.jsonl
            file_path = DATA_DIR / "notion" / "pages.jsonl"
            file_path.parent.mkdir(parents=True, exist_ok=True)
            with open(file_path, "w", encoding="utf-8") as f:
                for p in pages:
                    f.write(json.dumps(p) + "\n")

            print(f"Successfully synced {len(pages)} Notion pages to local storage.")
            return True

    except Exception as e:
        print(f"Error executing Notion sync: {e}")
        return False

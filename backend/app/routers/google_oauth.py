"""Google OAuth 2.0 flow router — handles login redirects and credential exchange callback."""

import os
import json
import time
import urllib.parse
import httpx
from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import RedirectResponse
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.database import get_session
from app.db import crud
from app.connectors.google_sync import sync_google_data
from app.security.encryption import encrypt, decrypt
from app.db.models import SourceConnection

router = APIRouter(prefix="/api/connectors/google", tags=["google_oauth"])

@router.get("/login")
async def google_login(user_id: str = Query(..., description="ID of the user initiating OAuth")):
    """Redirect user to Google Authorization server."""
    client_id = os.getenv("GOOGLE_CLIENT_ID")
    redirect_uri = os.getenv("GOOGLE_REDIRECT_URI", "http://localhost:8000/api/connectors/google/callback")
    
    if not client_id:
         raise HTTPException(status_code=400, detail="GOOGLE_CLIENT_ID environment variable is not configured.")

    scopes = [
        "https://www.googleapis.com/auth/gmail.readonly",
        "https://www.googleapis.com/auth/calendar.readonly"
    ]
    
    params = {
        "client_id": client_id,
        "redirect_uri": redirect_uri,
        "response_type": "code",
        "scope": " ".join(scopes),
        "access_type": "offline",
        "prompt": "consent",
        "state": user_id
    }
    
    auth_url = f"https://accounts.google.com/o/oauth2/v2/auth?{urllib.parse.urlencode(params)}"
    return RedirectResponse(url=auth_url)

@router.get("/callback")
async def google_callback(
    code: str = Query(..., description="OAuth authorization code"),
    state: str = Query(..., description="User ID passed in state"),
    session: AsyncSession = Depends(get_session)
):
    """Callback target for Google OAuth redirection. Exchanges code for tokens."""
    client_id = os.getenv("GOOGLE_CLIENT_ID")
    client_secret = os.getenv("GOOGLE_CLIENT_SECRET")
    redirect_uri = os.getenv("GOOGLE_REDIRECT_URI")
    frontend_url = os.getenv("FRONTEND_URL")

    if not client_id or not client_secret:
         raise HTTPException(status_code=500, detail="Google Client credentials not configured on backend.")

    token_payload = {
        "client_id": client_id,
        "client_secret": client_secret,
        "code": code,
        "grant_type": "authorization_code",
        "redirect_uri": redirect_uri
    }

    async with httpx.AsyncClient() as client:
        res = await client.post("https://oauth2.googleapis.com/token", data=token_payload)
        if res.status_code != 200:
             # Redirect back to frontend with error flag
             return RedirectResponse(url=f"{frontend_url}/?error=google_auth_failed")
        
        token_data = res.json()
        
        # Prepare credentials structure
        creds = {
            "access_token": token_data["access_token"],
            "refresh_token": token_data.get("refresh_token"),
            "expires_at": time.time() + token_data["expires_in"]
        }
        
        # If refresh_token was not returned, check if we have an existing one in DB to preserve
        if not creds["refresh_token"]:
             from sqlalchemy import select
             result = await session.execute(
                 select(SourceConnection).where(
                     SourceConnection.user_id == state,
                     SourceConnection.source_type.in_(["gmail", "google_calendar"])
                 )
             )
             existing_conn = result.scalars().first()
             if existing_conn and existing_conn.encrypted_credentials:
                 try:
                     old_creds = json.loads(decrypt(existing_conn.encrypted_credentials))
                     creds["refresh_token"] = old_creds.get("refresh_token")
                 except Exception:
                     pass

        # Encrypt the credentials
        encrypted_creds = encrypt(json.dumps(creds))
        
        # Create/Update connection status for Gmail
        await crud.upsert_connection(
            session,
            user_id=state,
            source_type="gmail",
            status="connected",
            tables=["gmail.inbox", "gmail.sent"],
            credentials=encrypted_creds
        )
        
        # Create/Update connection status for Google Calendar
        await crud.upsert_connection(
            session,
            user_id=state,
            source_type="google_calendar",
            status="connected",
            tables=["google_calendar.events"],
            credentials=encrypted_creds
        )
        
        # Run initial fetch to populate listings locally
        await sync_google_data(session, state)
        
        # Redirect back to VELA dashboard
        return RedirectResponse(url=f"{frontend_url}/?sync=google_success")

"""Notion OAuth 2.0 flow router — handles login redirects and credential exchange callback."""

import os
import json
import urllib.parse
import httpx
from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import RedirectResponse
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.database import get_session
from app.db import crud
from app.connectors.notion import sync_notion_data
from app.security.encryption import encrypt

router = APIRouter(prefix="/api/connectors/notion", tags=["notion_oauth"])


@router.get("/login")
async def notion_login(user_id: str = Query(..., description="ID of the user initiating Notion OAuth")):
    """Redirect user to Notion's authorization page."""
    client_id = os.getenv("NOTION_CLIENT_ID")
    redirect_uri = os.getenv("NOTION_REDIRECT_URI")
    
    if not client_id:
        raise HTTPException(status_code=400, detail="NOTION_CLIENT_ID environment variable is not configured.")

    params = {
        "client_id": client_id,
        "redirect_uri": redirect_uri,
        "response_type": "code",
        "owner": "user",
        "state": user_id
    }
    
    auth_url = f"https://api.notion.com/v1/oauth/authorize?{urllib.parse.urlencode(params)}"
    return RedirectResponse(url=auth_url)


@router.get("/callback")
async def notion_callback(
    code: str = Query(..., description="Notion auth code"),
    state: str = Query(..., description="User ID passed in state"),
    session: AsyncSession = Depends(get_session)
):
    """Callback target for Notion OAuth. Exchanges code for access token."""
    client_id = os.getenv("NOTION_CLIENT_ID")
    client_secret = os.getenv("NOTION_CLIENT_SECRET")
    redirect_uri = os.getenv("NOTION_REDIRECT_URI")
    frontend_url = os.getenv("FRONTEND_URL")

    if not client_id or not client_secret:
        raise HTTPException(status_code=500, detail="Notion Client credentials not configured on backend.")

    # Exchange authorization code for token
    async with httpx.AsyncClient() as client:
        try:
            res = await client.post(
                "https://api.notion.com/v1/oauth/token",
                json={
                    "grant_type": "authorization_code",
                    "code": code,
                    "redirect_uri": redirect_uri
                },
                auth=(client_id, client_secret),
                headers={"Content-Type": "application/json"}
            )
            
            if res.status_code != 200:
                print(f"Notion token exchange failed: {res.status_code} - {res.text}")
                return RedirectResponse(url=f"{frontend_url}/?error=notion_auth_failed")
                
            token_data = res.json()
            access_token = token_data.get("access_token")
            if not access_token:
                return RedirectResponse(url=f"{frontend_url}/?error=notion_auth_failed")
                
            creds = {"access_token": access_token}
            encrypted_creds = encrypt(json.dumps(creds))
            
            # Save connection status to DB
            await crud.upsert_connection(
                session,
                user_id=state,
                source_type="notion",
                status="connected",
                tables=["notion.pages"],
                credentials=encrypted_creds
            )
            
            # Trigger initial fetch to populate listings locally
            await sync_notion_data(session, state)
            
            return RedirectResponse(url=f"{frontend_url}/?sync=notion_success")
            
        except Exception as e:
            print(f"Error during Notion OAuth callback: {e}")
            return RedirectResponse(url=f"{frontend_url}/?error=notion_auth_failed")

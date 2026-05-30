"""Connector management router."""

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.database import get_session
from app.db import crud
from app.connectors.registry import get_all_connectors_info, get_connector

router = APIRouter(prefix="/api/connectors", tags=["connectors"])


class ConnectRequest(BaseModel):
    user_id: str
    source_type: str
    credentials: dict = {}


class DisconnectRequest(BaseModel):
    user_id: str
    source_type: str


@router.get("/registry")
async def get_registry():
    """Return all available connectors with their metadata."""
    return get_all_connectors_info()


@router.get("/status/{user_id}")
async def get_status(user_id: str, session: AsyncSession = Depends(get_session)):
    """Return all connector statuses for a user."""
    connections = await crud.get_connections(session, user_id)
    conn_map = {c.source_type: c for c in connections}

    all_connectors = get_all_connectors_info()
    for connector in all_connectors:
        name = connector["name"]
        if name in conn_map:
            db_conn = conn_map[name]
            connector["status"] = db_conn.status
            connector["tables"] = db_conn.tables_available or connector["tables"]
    return all_connectors


@router.post("/connect")
async def connect_source(req: ConnectRequest, session: AsyncSession = Depends(get_session)):
    """Connect a data source."""
    connector = get_connector(req.source_type)
    if not connector:
        raise HTTPException(status_code=400, detail=f"Unknown source: {req.source_type}")

    try:
        success = await connector.authenticate(req.credentials)
        if not success:
            raise HTTPException(status_code=401, detail="Authentication failed")

        tables = connector.get_available_tables()
        conn = await crud.upsert_connection(
            session, req.user_id, req.source_type,
            status="connected", tables=tables
        )
        return {"status": "connected", "tables": tables}

    except HTTPException:
        raise
    except Exception as e:
        await crud.upsert_connection(
            session, req.user_id, req.source_type, status="error"
        )
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/disconnect")
async def disconnect_source(req: DisconnectRequest,
                             session: AsyncSession = Depends(get_session)):
    """Disconnect a data source."""
    await crud.delete_connection(session, req.user_id, req.source_type)
    return {"status": "disconnected"}

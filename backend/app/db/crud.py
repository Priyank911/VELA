"""CRUD operations for all Vela database models."""

import uuid
from datetime import datetime, timezone
from typing import Optional
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.models import User, SourceConnection, Conversation, GraphSnapshot, UserMemory, TrackedApplication


def _uuid() -> str:
    return str(uuid.uuid4())


def _now() -> datetime:
    return datetime.now(timezone.utc)


# ---- Users ----

async def get_or_create_user(session: AsyncSession, email: str) -> User:
    result = await session.execute(select(User).where(User.email == email))
    user = result.scalar_one_or_none()
    if user:
        return user
    user = User(id=_uuid(), email=email)
    session.add(user)
    await session.commit()
    await session.refresh(user)
    return user


async def get_user(session: AsyncSession, user_id: str) -> Optional[User]:
    result = await session.execute(select(User).where(User.id == user_id))
    return result.scalar_one_or_none()


async def update_user(session: AsyncSession, user_id: str, **kwargs) -> Optional[User]:
    user = await get_user(session, user_id)
    if not user:
        return None
    for key, value in kwargs.items():
        if hasattr(user, key) and value is not None:
            setattr(user, key, value)
    user.updated_at = _now()
    await session.commit()
    await session.refresh(user)
    return user


# ---- Source Connections ----

async def get_connections(session: AsyncSession, user_id: str) -> list[SourceConnection]:
    result = await session.execute(select(SourceConnection).where(SourceConnection.user_id == user_id))
    return list(result.scalars().all())


async def upsert_connection(session: AsyncSession, user_id: str, source_type: str,
                            status: str = "connected", tables: list = None,
                            credentials: str = "") -> SourceConnection:
    result = await session.execute(
        select(SourceConnection).where(
            SourceConnection.user_id == user_id,
            SourceConnection.source_type == source_type
        )
    )
    conn = result.scalar_one_or_none()
    if conn:
        conn.status = status
        conn.tables_available = tables or conn.tables_available
        conn.encrypted_credentials = credentials or conn.encrypted_credentials
        conn.connected_at = _now()
    else:
        conn = SourceConnection(
            id=_uuid(), user_id=user_id, source_type=source_type,
            status=status, tables_available=tables or [],
            encrypted_credentials=credentials, connected_at=_now()
        )
        session.add(conn)
    await session.commit()
    await session.refresh(conn)
    return conn


async def delete_connection(session: AsyncSession, user_id: str, source_type: str) -> bool:
    result = await session.execute(
        select(SourceConnection).where(
            SourceConnection.user_id == user_id,
            SourceConnection.source_type == source_type
        )
    )
    conn = result.scalar_one_or_none()
    if conn:
        await session.delete(conn)
        await session.commit()
        return True
    return False


# ---- Conversations ----

async def create_conversation(session: AsyncSession, user_id: str, title: str = "New conversation") -> Conversation:
    conv = Conversation(id=_uuid(), user_id=user_id, title=title, messages=[])
    session.add(conv)
    await session.commit()
    await session.refresh(conv)
    return conv


async def get_conversation(session: AsyncSession, conversation_id: str) -> Optional[Conversation]:
    result = await session.execute(select(Conversation).where(Conversation.id == conversation_id))
    return result.scalar_one_or_none()


async def get_user_conversations(session: AsyncSession, user_id: str) -> list[Conversation]:
    result = await session.execute(
        select(Conversation).where(Conversation.user_id == user_id).order_by(Conversation.updated_at.desc())
    )
    return list(result.scalars().all())


async def append_message(session: AsyncSession, conversation_id: str, role: str, content: str) -> Optional[Conversation]:
    conv = await get_conversation(session, conversation_id)
    if not conv:
        return None
    msgs = list(conv.messages or [])
    msgs.append({"id": _uuid(), "role": role, "content": content, "timestamp": _now().isoformat()})
    conv.messages = msgs
    conv.updated_at = _now()
    await session.commit()
    await session.refresh(conv)
    return conv


# ---- Graph Snapshots ----

async def save_graph(session: AsyncSession, conversation_id: str, nodes: list, edges: list) -> GraphSnapshot:
    snap = GraphSnapshot(id=_uuid(), conversation_id=conversation_id, nodes=nodes, edges=edges)
    session.add(snap)
    await session.commit()
    return snap


# ---- User Memories ----

async def add_memory(session: AsyncSession, user_id: str, memory_type: str, content: dict) -> UserMemory:
    mem = UserMemory(id=_uuid(), user_id=user_id, memory_type=memory_type, content=content)
    session.add(mem)
    await session.commit()
    await session.refresh(mem)
    return mem


async def get_memories(session: AsyncSession, user_id: str) -> list[UserMemory]:
    result = await session.execute(
        select(UserMemory).where(UserMemory.user_id == user_id).order_by(UserMemory.created_at.desc())
    )
    return list(result.scalars().all())


# ---- Tracked Applications ----

async def add_application(session: AsyncSession, user_id: str, company_name: str,
                          job_title: str = "", status: str = "applied",
                          notes: str = "") -> TrackedApplication:
    app = TrackedApplication(
        id=_uuid(), user_id=user_id, company_name=company_name,
        job_title=job_title, status=status, notes=notes,
        applied_date=_now().isoformat()
    )
    session.add(app)
    await session.commit()
    await session.refresh(app)
    return app


async def get_applications(session: AsyncSession, user_id: str) -> list[TrackedApplication]:
    result = await session.execute(
        select(TrackedApplication).where(TrackedApplication.user_id == user_id).order_by(TrackedApplication.created_at.desc())
    )
    return list(result.scalars().all())


async def update_application(session: AsyncSession, app_id: str, **kwargs) -> Optional[TrackedApplication]:
    result = await session.execute(select(TrackedApplication).where(TrackedApplication.id == app_id))
    app = result.scalar_one_or_none()
    if not app:
        return None
    for key, value in kwargs.items():
        if hasattr(app, key) and value is not None:
            setattr(app, key, value)
    await session.commit()
    await session.refresh(app)
    return app

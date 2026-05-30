"""CRUD operations for all Vela database models."""

import uuid
from datetime import datetime, timezone
from typing import Optional

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models import (
    Conversation,
    GraphSnapshot,
    JobListing,
    SourceConnection,
    TrackedApplication,
    User,
    UserMemory,
)


def _uuid() -> str:
    return str(uuid.uuid4())


def _now() -> datetime:
    return datetime.now(timezone.utc).replace(tzinfo=None)


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
    result = await session.execute(
        select(SourceConnection).where(SourceConnection.user_id == user_id)
    )
    return list(result.scalars().all())


async def upsert_connection(
    session: AsyncSession,
    user_id: str,
    source_type: str,
    status: str = "connected",
    tables: list = None,
    credentials: str = "",
) -> SourceConnection:
    result = await session.execute(
        select(SourceConnection).where(
            SourceConnection.user_id == user_id, SourceConnection.source_type == source_type
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
            id=_uuid(),
            user_id=user_id,
            source_type=source_type,
            status=status,
            tables_available=tables or [],
            encrypted_credentials=credentials,
            connected_at=_now(),
        )
        session.add(conn)
    await session.commit()
    await session.refresh(conn)
    return conn


async def delete_connection(session: AsyncSession, user_id: str, source_type: str) -> bool:
    result = await session.execute(
        select(SourceConnection).where(
            SourceConnection.user_id == user_id, SourceConnection.source_type == source_type
        )
    )
    conn = result.scalar_one_or_none()
    if conn:
        await session.delete(conn)
        await session.commit()
        return True
    return False


# ---- Conversations ----


async def create_conversation(
    session: AsyncSession, user_id: str, title: str = "New conversation"
) -> Conversation:
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
        select(Conversation)
        .where(Conversation.user_id == user_id)
        .order_by(Conversation.updated_at.desc())
    )
    return list(result.scalars().all())


async def append_message(
    session: AsyncSession, conversation_id: str, role: str, content: str
) -> Optional[Conversation]:
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


async def save_graph(
    session: AsyncSession, conversation_id: str, nodes: list, edges: list
) -> GraphSnapshot:
    snap = GraphSnapshot(id=_uuid(), conversation_id=conversation_id, nodes=nodes, edges=edges)
    session.add(snap)
    await session.commit()
    return snap


# ---- User Memories ----


async def add_memory(
    session: AsyncSession, user_id: str, memory_type: str, content: dict
) -> UserMemory:
    mem = UserMemory(id=_uuid(), user_id=user_id, memory_type=memory_type, content=content)
    session.add(mem)
    await session.commit()
    await session.refresh(mem)
    return mem


async def get_memories(session: AsyncSession, user_id: str) -> list[UserMemory]:
    result = await session.execute(
        select(UserMemory)
        .where(UserMemory.user_id == user_id)
        .order_by(UserMemory.created_at.desc())
    )
    return list(result.scalars().all())


# ---- Tracked Applications ----


async def add_application(
    session: AsyncSession,
    user_id: str,
    company_name: str,
    job_title: str = "",
    status: str = "applied",
    notes: str = "",
) -> TrackedApplication:
    app = TrackedApplication(
        id=_uuid(),
        user_id=user_id,
        company_name=company_name,
        job_title=job_title,
        status=status,
        notes=notes,
        applied_date=_now().isoformat(),
    )
    session.add(app)
    await session.commit()
    await session.refresh(app)
    return app


async def get_applications(session: AsyncSession, user_id: str) -> list[TrackedApplication]:
    result = await session.execute(
        select(TrackedApplication)
        .where(TrackedApplication.user_id == user_id)
        .order_by(TrackedApplication.created_at.desc())
    )
    return list(result.scalars().all())


async def update_application(
    session: AsyncSession, app_id: str, **kwargs
) -> Optional[TrackedApplication]:
    result = await session.execute(
        select(TrackedApplication).where(TrackedApplication.id == app_id)
    )
    app = result.scalar_one_or_none()
    if not app:
        return None
    for key, value in kwargs.items():
        if hasattr(app, key) and value is not None:
            setattr(app, key, value)
    await session.commit()
    await session.refresh(app)
    return app


# ---- Job Listings ----


async def upsert_job_listings(session: AsyncSession, jobs_data: list[dict]) -> list[JobListing]:
    if not jobs_data:
        return []

    job_ids = [str(j["job_id"]) for j in jobs_data if j.get("job_id")]
    if not job_ids:
        return []

    # Query existing
    result = await session.execute(select(JobListing).where(JobListing.job_id.in_(job_ids)))
    existing_jobs = {job.job_id: job for job in result.scalars().all()}

    upserted = []
    for jd in jobs_data:
        job_id = str(jd.get("job_id"))
        if not job_id:
            continue

        if job_id in existing_jobs:
            # Update existing
            job = existing_jobs[job_id]
            for key, value in jd.items():
                if hasattr(job, key) and value is not None:
                    setattr(job, key, value)
        else:
            # Create new
            job = JobListing(
                id=_uuid(),
                job_id=job_id,
                title=jd.get("title", ""),
                company=jd.get("company", "Unknown Company"),
                location=jd.get("location", "Remote/US"),
                salary_min=jd.get("salary_min"),
                salary_max=jd.get("salary_max"),
                description=jd.get("description", ""),
                requirements=jd.get("requirements", []),
                experience_level=jd.get("experience_level", "mid"),
                job_type=jd.get("job_type", "full_time"),
                url=jd.get("url", ""),
                posted_date=jd.get("posted_date", ""),
                source=jd.get("source", "adzuna"),
                created_at=_now(),
            )
            session.add(job)
        upserted.append(job)

    await session.commit()
    return upserted


async def get_all_job_listings(session: AsyncSession) -> list[JobListing]:
    result = await session.execute(select(JobListing).order_by(JobListing.created_at.desc()))
    return list(result.scalars().all())


async def prune_old_job_listings(session: AsyncSession, days: int = 30) -> int:
    from datetime import timedelta

    from sqlalchemy import delete

    cutoff = _now() - timedelta(days=days)

    result = await session.execute(delete(JobListing).where(JobListing.created_at < cutoff))
    await session.commit()
    return getattr(result, "rowcount", 0) or 0

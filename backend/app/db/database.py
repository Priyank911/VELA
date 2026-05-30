"""Async SQLAlchemy database engine and session management."""

import os
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import DeclarativeBase

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite+aiosqlite:///./vela.db")

engine = create_async_engine(DATABASE_URL, echo=False, future=True)
async_session_factory = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)


class Base(DeclarativeBase):
    pass


async def get_session() -> AsyncSession:
    async with async_session_factory() as session:
        yield session


async def init_db():
    """Create all tables."""
    from app.db.models import User, SourceConnection, Conversation, GraphSnapshot, UserMemory, TrackedApplication  # noqa
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

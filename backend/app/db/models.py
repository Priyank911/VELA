"""SQLAlchemy ORM models for Vela."""

import uuid
from datetime import datetime, timezone

from sqlalchemy import JSON, Column, DateTime, ForeignKey, Integer, String, Text

from app.db.database import Base


def _uuid() -> str:
    return str(uuid.uuid4())


def _now() -> datetime:
    return datetime.now(timezone.utc).replace(tzinfo=None)


class User(Base):
    __tablename__ = "users"

    id = Column(String, primary_key=True, default=_uuid)
    email = Column(String, unique=True, nullable=False, index=True)
    display_name = Column(String, default="")
    role_preference = Column(String, default="")
    skills = Column(JSON, default=list)
    resume_text = Column(Text, default="")
    career_notes = Column(JSON, default=dict)
    tracked_companies = Column(JSON, default=list)
    created_at = Column(DateTime, default=_now)
    updated_at = Column(DateTime, default=_now, onupdate=_now)


class SourceConnection(Base):
    __tablename__ = "source_connections"

    id = Column(String, primary_key=True, default=_uuid)
    user_id = Column(String, ForeignKey("users.id"), nullable=False, index=True)
    source_type = Column(String, nullable=False)
    encrypted_credentials = Column(Text, default="")
    status = Column(String, default="disconnected")  # connected / disconnected / error
    tables_available = Column(JSON, default=list)
    connected_at = Column(DateTime, default=_now)


class Conversation(Base):
    __tablename__ = "conversations"

    id = Column(String, primary_key=True, default=_uuid)
    user_id = Column(String, ForeignKey("users.id"), nullable=False, index=True)
    title = Column(String, default="New conversation")
    messages = Column(JSON, default=list)
    created_at = Column(DateTime, default=_now)
    updated_at = Column(DateTime, default=_now, onupdate=_now)


class GraphSnapshot(Base):
    __tablename__ = "graph_snapshots"

    id = Column(String, primary_key=True, default=_uuid)
    conversation_id = Column(String, ForeignKey("conversations.id"), nullable=False)
    nodes = Column(JSON, default=list)
    edges = Column(JSON, default=list)
    created_at = Column(DateTime, default=_now)


class UserMemory(Base):
    __tablename__ = "user_memories"

    id = Column(String, primary_key=True, default=_uuid)
    user_id = Column(String, ForeignKey("users.id"), nullable=False, index=True)
    memory_type = Column(String, default="note")  # meeting / company / preference / note
    content = Column(JSON, default=dict)
    created_at = Column(DateTime, default=_now)


class TrackedApplication(Base):
    __tablename__ = "tracked_applications"

    id = Column(String, primary_key=True, default=_uuid)
    user_id = Column(String, ForeignKey("users.id"), nullable=False, index=True)
    company_name = Column(String, nullable=False)
    job_title = Column(String, default="")
    status = Column(String, default="applied")  # applied / interviewing / offered / rejected
    applied_date = Column(String, default="")
    notes = Column(Text, default="")
    last_email_date = Column(String, default="")
    created_at = Column(DateTime, default=_now)


class JobListing(Base):
    __tablename__ = "job_listings"

    id = Column(String, primary_key=True, default=_uuid)
    job_id = Column(String, unique=True, nullable=False, index=True)
    title = Column(String, nullable=False)
    company = Column(String, default="Unknown Company")
    location = Column(String, default="Remote/US")
    salary_min = Column(Integer, nullable=True)
    salary_max = Column(Integer, nullable=True)
    description = Column(Text, default="")
    requirements = Column(JSON, default=list)
    experience_level = Column(String, default="mid")
    job_type = Column(String, default="full_time")
    url = Column(String, default="")
    posted_date = Column(String, default="")
    source = Column(String, default="adzuna")
    created_at = Column(DateTime, default=_now)

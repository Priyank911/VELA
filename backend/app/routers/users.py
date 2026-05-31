"""User management router."""

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from app.db import crud
from app.db.database import get_session

router = APIRouter(prefix="/api/users", tags=["users"])


class InitUserRequest(BaseModel):
    email: str


class UpdateUserRequest(BaseModel):
    display_name: str | None = None
    role_preference: str | None = None
    skills: list[str] | None = None
    resume_text: str | None = None
    tracked_companies: list[str] | None = None


class MemoryRequest(BaseModel):
    memory_type: str = "note"
    content: dict = {}


@router.post("/init")
async def init_user(req: InitUserRequest, session: AsyncSession = Depends(get_session)):
    try:
        user = await crud.get_or_create_user(session, req.email)
        return {
            "id": user.id,
            "email": user.email,
            "display_name": user.display_name or "",
            "role_preference": user.role_preference or "",
            "skills": user.skills or [],
            "resume_text": user.resume_text or "",
            "tracked_companies": user.tracked_companies or [],
            "created_at": str(user.created_at),
            "updated_at": str(user.updated_at),
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{user_id}")
async def get_user(user_id: str, session: AsyncSession = Depends(get_session)):
    user = await crud.get_user(session, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return {
        "id": user.id,
        "email": user.email,
        "display_name": user.display_name or "",
        "role_preference": user.role_preference or "",
        "skills": user.skills or [],
        "resume_text": user.resume_text or "",
        "tracked_companies": user.tracked_companies or [],
        "created_at": str(user.created_at),
        "updated_at": str(user.updated_at),
    }


@router.put("/{user_id}")
async def update_user(
    user_id: str, req: UpdateUserRequest, session: AsyncSession = Depends(get_session)
):
    data = {k: v for k, v in req.model_dump().items() if v is not None}
    user = await crud.update_user(session, user_id, **data)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return {"status": "updated", "id": user.id}


@router.post("/{user_id}/memory")
async def add_memory(
    user_id: str, req: MemoryRequest, session: AsyncSession = Depends(get_session)
):
    mem = await crud.add_memory(session, user_id, req.memory_type, req.content)
    return {"id": mem.id, "status": "stored"}


@router.get("/{user_id}/memories")
async def get_memories(user_id: str, session: AsyncSession = Depends(get_session)):
    mems = await crud.get_memories(session, user_id)
    return [
        {
            "id": m.id,
            "memory_type": m.memory_type,
            "content": m.content,
            "created_at": str(m.created_at),
        }
        for m in mems
    ]


@router.get("/{user_id}/applications")
async def get_applications(user_id: str, session: AsyncSession = Depends(get_session)):
    apps = await crud.get_applications(session, user_id)
    return [
        {
            "id": a.id,
            "company_name": a.company_name,
            "job_title": a.job_title,
            "status": a.status,
            "applied_date": a.applied_date,
            "notes": a.notes or "",
            "created_at": str(a.created_at),
        }
        for a in apps
    ]


class ResumeUploadRequest(BaseModel):
    resume_text: str


@router.post("/{user_id}/resume")
async def upload_resume(
    user_id: str, req: ResumeUploadRequest, session: AsyncSession = Depends(get_session)
):
    """Upload or update the user's resume text."""
    user = await crud.update_user(session, user_id, resume_text=req.resume_text)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return {"status": "uploaded", "length": len(req.resume_text)}


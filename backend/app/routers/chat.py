"""Chat and streaming router — the core agent interaction endpoint."""

import asyncio

from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from app.agent.streaming import stream_manager
from app.agent.vela_agent import VelaAgent
from app.db import crud
from app.db.database import get_session

router = APIRouter(tags=["chat"])


class AskRequest(BaseModel):
    user_id: str
    message: str
    conversation_id: str | None = None


@router.post("/api/ask")
async def ask_agent(req: AskRequest, session: AsyncSession = Depends(get_session)):
    """Submit a query to the agent. Returns conversation_id for SSE streaming."""
    # Get or create conversation
    if req.conversation_id:
        conv = await crud.get_conversation(session, req.conversation_id)
        if not conv:
            conv = await crud.create_conversation(session, req.user_id, req.message[:50])
    else:
        conv = await crud.create_conversation(session, req.user_id, req.message[:50])

    # Save user message
    await crud.append_message(session, conv.id, "user", req.message)

    # Reload conversation to get updated messages
    conv = await crud.get_conversation(session, conv.id)
    history = conv.messages or []

    # Get user context
    user = await crud.get_user(session, req.user_id)
    connections = await crud.get_connections(session, req.user_id)
    memories = await crud.get_memories(session, req.user_id)

    connected_sources = [c.source_type for c in connections if c.status == "connected"]
    if "jobs" not in connected_sources:
        connected_sources.append("jobs")

    user_context = {
        "role_preference": user.role_preference if user else "",
        "skills": user.skills if user else [],
        "resume_text": user.resume_text if user else "",
        "tracked_companies": user.tracked_companies if user else [],
        "memories": [{"memory_type": m.memory_type, "content": m.content} for m in memories],
    }

    # Create agent and run in background
    agent = VelaAgent(
        user_id=req.user_id,
        conversation_id=conv.id,
        connected_sources=connected_sources,
        user_context=user_context,
        conversation_history=history,
    )

    async def _run_agent():
        try:
            answer = await agent.run(req.message)
            # Save assistant message
            async with async_session_factory() as save_session:
                await crud.append_message(save_session, conv.id, "assistant", answer)
        except Exception as e:
            await stream_manager.emit_error(conv.id, str(e))
            await stream_manager.emit_done(conv.id)

    # Import session factory for background task
    from app.db.database import async_session_factory

    asyncio.create_task(_run_agent())

    return {"conversation_id": conv.id, "status": "processing"}


@router.get("/api/stream/{conversation_id}")
async def stream_events(conversation_id: str, request: Request):
    """SSE endpoint — streams graph events and answer chunks."""
    queue = stream_manager.subscribe(conversation_id)

    async def event_generator():
        try:
            while True:
                if await request.is_disconnected():
                    break
                try:
                    event = await asyncio.wait_for(queue.get(), timeout=30.0)
                    yield event
                    # Check if this was the done event
                    if '"type": "done"' in event or '"type":"done"' in event:
                        break
                except asyncio.TimeoutError:
                    # Send heartbeat
                    yield ": heartbeat\n\n"
        finally:
            stream_manager.unsubscribe(conversation_id)

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )


@router.get("/api/conversations/{user_id}")
async def list_conversations(user_id: str, session: AsyncSession = Depends(get_session)):
    convs = await crud.get_user_conversations(session, user_id)
    return [
        {
            "id": c.id,
            "title": c.title,
            "created_at": str(c.created_at),
            "updated_at": str(c.updated_at),
        }
        for c in convs
    ]


@router.get("/api/conversations/{conversation_id}/history")
async def get_history(conversation_id: str, session: AsyncSession = Depends(get_session)):
    conv = await crud.get_conversation(session, conversation_id)
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found")
    return {
        "id": conv.id,
        "title": conv.title,
        "messages": conv.messages or [],
        "created_at": str(conv.created_at),
    }

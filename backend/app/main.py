"""Vela FastAPI Application — Main Entry Point."""

import os
from contextlib import asynccontextmanager

from dotenv import load_dotenv

# Load .env before anything else
env_path = os.path.join(os.path.dirname(__file__), "..", ".env")
if os.path.exists(env_path):
    load_dotenv(env_path)
else:
    load_dotenv()

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.db.database import init_db
from app.routers import chat, connectors, google_oauth, notion_oauth, users


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Initialize database on startup and start background scheduler."""
    await init_db()

    # Start background job sync scheduler (fetches CSE jobs daily)
    from app.services.scheduler import start_job_scheduler

    start_job_scheduler(interval_hours=24.0)

    yield


app = FastAPI(
    title="Vela — Personal AI Career Agent",
    description="AI-powered career companion API",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS
frontend_url = os.getenv("FRONTEND_URL", "http://localhost:3000")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[frontend_url, "http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Global exception handler
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    return JSONResponse(
        status_code=500,
        content={
            "error": type(exc).__name__,
            "message": str(exc),
            "suggestion": "Check the backend logs for details.",
        },
    )


# Include routers
app.include_router(users.router)
app.include_router(connectors.router)
app.include_router(chat.router)
app.include_router(google_oauth.router)
app.include_router(notion_oauth.router)


@app.get("/health")
async def health():
    api_key = os.getenv("ANTHROPIC_API_KEY", "")
    return {
        "status": "healthy",
        "mode": "live" if api_key else "demo",
        "version": "1.0.0",
    }


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)

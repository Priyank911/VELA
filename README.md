# VELA — Personal AI Career Agent

> Your AI-powered career companion. Connect your data, ask anything, and watch Vela work.

## What is Vela?

Vela is a full-stack personal AI career agent web application. Connect your Gmail, Google Calendar, Notion, LinkedIn, and job sources through a live sidebar, type one natural language query, and watch a real-time reasoning graph build as the agent executes multi-source Coral SQL queries to find jobs, draft emails, analyze your resume, schedule prep, and synthesize a complete career action plan.

## Features

- **Resume Analysis** — Upload or paste your resume, get targeted improvement suggestions
- **Job Search** — Find matching roles based on your skills and preferences
- **Smart Email Drafting** — Personalized outreach emails for each opportunity
- **Application Tracking** — Track every application, interview, and response
- **Gmail Monitoring** — Get notified when tracked companies respond
- **Calendar Management** — Schedule interviews, prep sessions, and reminders
- **Memory & Notes** — "Remember my meeting on Friday" — Vela remembers everything
- **YouTube Recommendations** — Skill-building video suggestions based on your projects
- **Company Research** — LinkedIn-powered company insights and culture analysis
- **Live Reasoning Graph** — Watch the AI think in real-time with React Flow visualization

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 14, React Flow 11, Tailwind CSS, Zustand |
| Backend | Python FastAPI, Anthropic SDK, SQLAlchemy |
| Database | SQLite (dev) / PostgreSQL (prod) |
| Data Layer | Coral CLI with custom source specs |
| Streaming | Server-Sent Events (SSE) |

## Quick Start

### 1. Backend
```bash
cd Vela/backend
pip install -r requirements.txt
cp .env.example .env  # Add your ANTHROPIC_API_KEY
uvicorn app.main:app --reload --port 8000
```

### 2. Frontend
```bash
cd Vela/frontend
npm install
npm run dev
```

### 3. Open
Navigate to `http://localhost:3000`

## Demo Mode

Vela works fully without API keys! The mock agent simulates realistic responses with:
- 20+ job listings from companies like Stripe, Vercel, Notion
- Gmail inbox with recruiter emails and interview confirmations
- Calendar events with upcoming interviews
- Notion pages with project notes

## Architecture

```
Browser → Next.js :3000 → API Routes → FastAPI :8000
                                            ↓
                                    VelaAgent (Claude)
                                    ↓           ↓
                              Coral SQL    Direct APIs
                              ↓
                         JSONL Data Files
```

## Coral Source Specs

Vela includes custom Coral source specs for:
- `jobs` — Job listings table
- `gmail` — Inbox and sent email tables
- `google_calendar` — Calendar events table
- `notion` — Pages and tasks table

## License

MIT

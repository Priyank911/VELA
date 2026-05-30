"""Tool definitions for Claude's tool-use format."""

VELA_TOOLS = [
    {
        "name": "coral_sql",
        "description": "Execute a SQL query against connected Coral data sources. Use this to query gmail.inbox, gmail.sent, google_calendar.events, notion.pages, jobs.listings tables.",
        "input_schema": {
            "type": "object",
            "properties": {
                "query": {"type": "string", "description": "The SQL query to execute"},
                "source": {
                    "type": "string",
                    "description": "Primary source being queried (gmail, calendar, notion, jobs)",
                },
            },
            "required": ["query"],
        },
    },
    {
        "name": "search_jobs",
        "description": "Search job listings with filters. Returns matching positions.",
        "input_schema": {
            "type": "object",
            "properties": {
                "title": {"type": "string", "description": "Job title to search for"},
                "location": {"type": "string", "description": "Location filter"},
                "experience_level": {"type": "string", "description": "junior, mid, senior"},
                "salary_min": {"type": "integer", "description": "Minimum salary"},
                "keywords": {
                    "type": "array",
                    "items": {"type": "string"},
                    "description": "Skill keywords",
                },
            },
            "required": ["title"],
        },
    },
    {
        "name": "draft_email",
        "description": "Generate a personalized outreach or follow-up email for a job opportunity or professional contact.",
        "input_schema": {
            "type": "object",
            "properties": {
                "recipient_name": {"type": "string", "description": "Name of the recipient"},
                "recipient_email": {"type": "string", "description": "Email address"},
                "company": {"type": "string", "description": "Company name"},
                "job_title": {"type": "string", "description": "Position title"},
                "email_type": {
                    "type": "string",
                    "description": "outreach, follow_up, thank_you, or application",
                },
                "context": {
                    "type": "string",
                    "description": "Additional context for personalization",
                },
            },
            "required": ["company", "email_type"],
        },
    },
    {
        "name": "analyze_resume",
        "description": "Analyze the user's resume and provide improvement suggestions. Identifies weak areas, missing keywords, and formatting issues.",
        "input_schema": {
            "type": "object",
            "properties": {
                "target_role": {"type": "string", "description": "The role they're targeting"},
                "focus_areas": {
                    "type": "array",
                    "items": {"type": "string"},
                    "description": "Specific areas to focus on",
                },
            },
            "required": [],
        },
    },
    {
        "name": "track_application",
        "description": "Track a job application. Stores company, role, status for follow-up reminders.",
        "input_schema": {
            "type": "object",
            "properties": {
                "company_name": {"type": "string", "description": "Company name"},
                "job_title": {"type": "string", "description": "Position title"},
                "status": {
                    "type": "string",
                    "description": "applied, interviewing, offered, rejected",
                },
                "notes": {"type": "string", "description": "Additional notes"},
            },
            "required": ["company_name"],
        },
    },
    {
        "name": "store_memory",
        "description": "Store information the user wants to remember — meetings, dates, preferences, notes. The agent remembers everything.",
        "input_schema": {
            "type": "object",
            "properties": {
                "memory_type": {
                    "type": "string",
                    "description": "meeting, company, preference, note, deadline",
                },
                "content": {"type": "string", "description": "What to remember"},
                "date": {"type": "string", "description": "Associated date if any (ISO format)"},
            },
            "required": ["memory_type", "content"],
        },
    },
    {
        "name": "search_youtube",
        "description": "Search YouTube for learning videos based on skills, technologies, or project topics to help career growth.",
        "input_schema": {
            "type": "object",
            "properties": {
                "query": {"type": "string", "description": "What to search for"},
                "skill_level": {
                    "type": "string",
                    "description": "beginner, intermediate, advanced",
                },
                "max_results": {"type": "integer", "description": "Number of results (default 5)"},
            },
            "required": ["query"],
        },
    },
    {
        "name": "check_calendar",
        "description": "Check the user's calendar for upcoming events, interviews, and meetings.",
        "input_schema": {
            "type": "object",
            "properties": {
                "days_ahead": {
                    "type": "integer",
                    "description": "How many days ahead to check (default 7)",
                },
                "event_type": {
                    "type": "string",
                    "description": "Filter: interview, meeting, prep, all",
                },
            },
            "required": [],
        },
    },
    {
        "name": "schedule_event",
        "description": "Add an event to the user's calendar — interviews, prep sessions, reminders.",
        "input_schema": {
            "type": "object",
            "properties": {
                "title": {"type": "string", "description": "Event title"},
                "date": {"type": "string", "description": "Date (ISO format)"},
                "time": {"type": "string", "description": "Time (HH:MM)"},
                "duration_minutes": {
                    "type": "integer",
                    "description": "Duration in minutes (default 60)",
                },
                "description": {"type": "string", "description": "Event description"},
            },
            "required": ["title", "date"],
        },
    },
    {
        "name": "get_company_info",
        "description": "Get information about a company — culture, size, tech stack, open roles from LinkedIn and other sources.",
        "input_schema": {
            "type": "object",
            "properties": {
                "company_name": {"type": "string", "description": "Company name"},
                "info_type": {
                    "type": "string",
                    "description": "overview, culture, tech_stack, open_roles, all",
                },
            },
            "required": ["company_name"],
        },
    },
    {
        "name": "check_email_notifications",
        "description": "Check Gmail inbox for responses from tracked companies. Flags recruiter replies, interview invitations, and status updates.",
        "input_schema": {
            "type": "object",
            "properties": {
                "companies": {
                    "type": "array",
                    "items": {"type": "string"},
                    "description": "Company names to check for",
                },
                "days_back": {
                    "type": "integer",
                    "description": "How many days back to check (default 7)",
                },
            },
            "required": [],
        },
    },
]

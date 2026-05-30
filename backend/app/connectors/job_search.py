"""Adzuna Job Search API connector — fetches live jobs and saves them to listings.jsonl."""

import json
import os
from pathlib import Path

import httpx

DATA_DIR = Path(__file__).resolve().parents[2] / "data"


def clean_html(text: str) -> str:
    """Strip basic HTML tags if returned in API snippets."""
    import re

    clean = re.compile("<.*?>")
    return re.sub(clean, "", text)


def infer_experience_level(title: str) -> str:
    """Infer experience level from job title."""
    title_lower = title.lower()
    if any(w in title_lower for w in ["senior", "sr.", "lead", "principal", "manager"]):
        return "senior"
    if any(w in title_lower for w in ["junior", "jr.", "intern", "entry"]):
        return "junior"
    return "mid"


async def export_db_to_jsonl(session) -> bool:
    """Export all job listings from the database to listings.jsonl."""
    try:
        from app.db.crud import get_all_job_listings

        jobs = await get_all_job_listings(session)
        file_path = DATA_DIR / "jobs" / "listings.jsonl"
        file_path.parent.mkdir(parents=True, exist_ok=True)

        job_listings = []
        for j in jobs:
            job_listings.append(
                {
                    "job_id": j.job_id,
                    "title": j.title,
                    "company": j.company,
                    "location": j.location,
                    "salary_min": j.salary_min,
                    "salary_max": j.salary_max,
                    "description": j.description,
                    "requirements": j.requirements or [],
                    "experience_level": j.experience_level,
                    "job_type": j.job_type,
                    "url": j.url,
                    "posted_date": j.posted_date,
                    "source": j.source,
                }
            )

        with open(file_path, "w", encoding="utf-8") as f:
            for job in job_listings:
                f.write(json.dumps(job) + "\n")
        return True
    except Exception as e:
        print(f"Error exporting database jobs to JSONL: {e}")
        return False


async def fetch_and_sync_live_jobs(query: str, location: str = None, session=None) -> bool:
    """Fetch live jobs from Adzuna API, write them to DB, and sync to listings.jsonl."""
    app_id = os.getenv("ADZUNA_APP_ID")
    app_key = os.getenv("ADZUNA_APP_KEY")

    if not app_id or not app_key:
        print("Adzuna API credentials not configured. Job search is in demo fallback mode.")
        return False

    url = "https://api.adzuna.com/v1/api/jobs/us/search/1"
    params = {"app_id": app_id, "app_key": app_key, "what": query, "results_per_page": 15}

    if location:
        params["where"] = location

    try:
        async with httpx.AsyncClient() as client:
            res = await client.get(url, params=params)
            if res.status_code != 200:
                print(f"Adzuna API returned error: {res.status_code} - {res.text}")
                return False

            results = res.json().get("results", [])
            job_listings = []

            for r in results:
                title = clean_html(r.get("title", ""))
                company = r.get("company", {}).get("display_name", "Unknown Company")
                location_name = r.get("location", {}).get("display_name", "Remote/US")

                # Build parsed job listing object
                job_listings.append(
                    {
                        "job_id": str(r.get("id")),
                        "title": title,
                        "company": company,
                        "location": location_name,
                        "salary_min": int(r.get("salary_min")) if r.get("salary_min") else None,
                        "salary_max": int(r.get("salary_max")) if r.get("salary_max") else None,
                        "description": clean_html(r.get("description", "")),
                        "requirements": [],
                        "experience_level": infer_experience_level(title),
                        "job_type": r.get("contract_type", "full_time").replace("_", " "),
                        "url": r.get("redirect_url", ""),
                        "posted_date": r.get("created", ""),
                        "source": "adzuna",
                    }
                )

            if not job_listings:
                print(f"No job listings returned from Adzuna for query '{query}'.")
                return True

            # Save to Database and then export to JSONL
            from app.db.crud import upsert_job_listings
            from app.db.database import async_session_factory

            if session is not None:
                await upsert_job_listings(session, job_listings)
                await export_db_to_jsonl(session)
            else:
                async with async_session_factory() as local_session:
                    await upsert_job_listings(local_session, job_listings)
                    await export_db_to_jsonl(local_session)

            print(f"Successfully synced {len(job_listings)} live jobs from Adzuna to DB and JSONL.")
            return True

    except Exception as e:
        print(f"Error executing live job search: {e}")
        return False

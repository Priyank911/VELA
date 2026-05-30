import asyncio
from pathlib import Path

from dotenv import load_dotenv

# Load env
env_path = Path(__file__).resolve().parents[2] / ".env"
if env_path.exists():
    load_dotenv(env_path)

from sqlalchemy import text

from app.db.database import async_session_factory, init_db
from app.services.scheduler import run_daily_job_sync


async def main():
    print("Initializing Database...")
    await init_db()

    print("Clearing duplicate test jobs from database...")
    async with async_session_factory() as session:
        await session.execute(text("DELETE FROM job_listings"))
        await session.commit()
        print("Database cleared.")

    print("Running background sync to fetch diverse CSE job listings...")
    # This runs the loop for all 19 CSE queries (DevOps, ML, AI, Backend, Frontend, SDE, QA, etc.)
    await run_daily_job_sync()

    # Verify diversity
    async with async_session_factory() as session:
        from app.db.crud import get_all_job_listings

        jobs = await get_all_job_listings(session)
        print("\nVerification:")
        print(f"Total jobs in DB: {len(jobs)}")

        # Check unique companies
        companies = set(j.company for j in jobs)
        print(f"Unique companies: {len(companies)}")
        print(f"Sample companies: {list(companies)[:10]}")


if __name__ == "__main__":
    asyncio.run(main())

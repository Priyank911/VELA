"""Background task scheduler to fetch and prune computer science job listings daily."""

import asyncio
import logging

from app.connectors.job_search import fetch_and_sync_live_jobs
from app.db.crud import prune_old_job_listings
from app.db.database import async_session_factory

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("VELA_SCHEDULER")

# Extensive list of CSE and software development related job queries to maximize database coverage
CSE_QUERIES = [
    "Software Engineer",
    "SDE",
    "Software Developer",
    "Backend Developer",
    "Frontend Developer",
    "Full Stack Developer",
    "DevOps Engineer",
    "Site Reliability Engineer",
    "Cloud Engineer",
    "Data Engineer",
    "Machine Learning Engineer",
    "AI Engineer",
    "Cybersecurity Analyst",
    "Security Engineer",
    "Data Scientist",
    "Database Administrator",
    "Systems Engineer",
    "QA Engineer",
    "Mobile Developer",
]

# Keep a reference to the task so it isn't garbage collected
_scheduler_task = None


async def run_daily_job_sync():
    """Fetch jobs for all CSE queries sequentially, spacing them out to prevent rate-limiting."""
    logger.info("Starting daily CSE job synchronization...")

    async with async_session_factory() as session:
        # 1. Prune jobs older than 30 days
        try:
            pruned_count = await prune_old_job_listings(session, days=30)
            logger.info(f"Pruned {pruned_count} job listings older than 30 days.")
        except Exception as e:
            logger.error(f"Error pruning old job listings: {e}")

        # 2. Sequential fetch with delay to prevent rate limit issues
        successful_queries = 0
        for i, query in enumerate(CSE_QUERIES):
            logger.info(f"[{i+1}/{len(CSE_QUERIES)}] Fetching live jobs for query: '{query}'...")
            try:
                # fetch_and_sync_live_jobs will upsert to DB and automatically export to JSONL
                ok = await fetch_and_sync_live_jobs(query=query, location=None, session=session)
                if ok:
                    successful_queries += 1
                else:
                    logger.warning(f"Failed to fetch jobs for query: '{query}'")
            except Exception as e:
                logger.error(f"Exception during job fetch for '{query}': {e}")

            # Wait 3 seconds between queries to be gentle on the Adzuna API rate limits
            await asyncio.sleep(3.0)

        logger.info(
            f"Completed job sync. Successfully fetched {successful_queries}/{len(CSE_QUERIES)} queries."
        )


async def _scheduler_loop(interval_hours: float = 24.0):
    """Infinite loop executing the job sync at set intervals."""
    # Add a small startup delay to let the app initialize fully
    await asyncio.sleep(5.0)

    while True:
        try:
            await run_daily_job_sync()
        except Exception as e:
            logger.error(f"Error in scheduler loop execution: {e}")

        logger.info(f"Scheduler sleeping for {interval_hours} hours...")
        await asyncio.sleep(interval_hours * 3600)


def start_job_scheduler(interval_hours: float = 24.0):
    """Start the background task scheduler."""
    global _scheduler_task
    if _scheduler_task is not None:
        logger.warning("Job scheduler is already running.")
        return

    logger.info(f"Initializing VELA job scheduler background task (Interval: {interval_hours}h)...")
    _scheduler_task = asyncio.create_task(_scheduler_loop(interval_hours))

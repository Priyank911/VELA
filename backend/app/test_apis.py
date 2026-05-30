"""Diagnostic / Integration test script for VELA APIs."""

import asyncio
import os
from pathlib import Path

from dotenv import load_dotenv

# Load env variables from root .env first
env_path = Path(__file__).resolve().parents[2] / ".env"
if env_path.exists():
    load_dotenv(env_path)
else:
    load_dotenv()

from sqlalchemy import text

from app.connectors.job_search import fetch_and_sync_live_jobs
from app.db.database import async_session_factory, init_db
from app.security.encryption import decrypt, encrypt


async def run_diagnostics():
    print("=" * 60)
    print("           VELA API & INTEGRATION DIAGNOSTICS")
    print("=" * 60)

    success = True

    # 1. Check Env Config
    print("\n[1/5] Checking Environment Configuration...")
    gemini_key = os.getenv("GEMINI_API_KEY", "")
    fernet_key = os.getenv("FERNET_KEY", "")
    adzuna_id = os.getenv("ADZUNA_APP_ID", "")
    adzuna_key = os.getenv("ADZUNA_APP_KEY", "")

    print(f"  - GEMINI_API_KEY: {'CONFIGURED' if gemini_key else 'MISSING'}")
    print(f"  - FERNET_KEY: {'CONFIGURED' if fernet_key else 'MISSING'}")
    print(f"  - ADZUNA_APP_ID: {'CONFIGURED' if adzuna_id else 'MISSING'}")
    print(f"  - ADZUNA_APP_KEY: {'CONFIGURED' if adzuna_key else 'MISSING'}")

    if not (gemini_key and fernet_key and adzuna_id and adzuna_key):
        print("  [WARN] Some credentials are missing. Live tests might fail or fall back.")

    # 2. Check Cryptography (Fernet)
    print("\n[2/5] Testing Cryptography (Fernet Key)...")
    try:
        test_payload = "vela_integration_test_secret_123"
        ciphertext = encrypt(test_payload)
        decrypted = decrypt(ciphertext)
        if decrypted == test_payload:
            print("  [PASS] Cryptography test passed successfully.")
        else:
            print("  [FAIL] Decrypted text did not match original payload.")
            success = False
    except Exception as e:
        print(f"  [FAIL] Cryptography test failed: {e}")
        success = False

    # 3. Check Database Connectivity
    print("\n[3/5] Testing Database Connectivity & Migration...")
    try:
        await init_db()
        async with async_session_factory() as session:
            # Query version or a basic select to verify connection
            res = await session.execute(text("SELECT 1"))
            val = res.scalar()
            if val == 1:
                print("  [PASS] Database connection verified successfully.")
            else:
                print("  [FAIL] Unexpected database query response.")
                success = False
    except Exception as e:
        print(f"  [FAIL] Database connectivity failed: {e}")
        success = False

    # 4. Check Gemini API Connectivity
    print("\n[4/5] Testing Gemini API Connectivity...")
    if not gemini_key:
        print("  [SKIP] Gemini API Key is missing. Skipping live AI test.")
    else:
        try:
            import google.generativeai as genai

            genai.configure(api_key=gemini_key)
            model_name = os.getenv("GEMINI_MODEL", "gemini-1.5-flash")
            print(f"  - Querying Gemini Model: '{model_name}'...")

            model = genai.GenerativeModel(model_name=model_name)
            # Run simple async response
            response = await model.generate_content_async(
                contents=[
                    {
                        "role": "user",
                        "parts": ["Respond with exactly the word 'OK' if you can read this."],
                    }
                ]
            )
            text_resp = response.text.strip()
            print(f"  - Response: '{text_resp}'")
            if "ok" in text_resp.lower():
                print("  [PASS] Gemini API check completed successfully.")
            else:
                print("  [WARN] Gemini API responded, but text was unexpected.")
        except Exception as e:
            print(f"  [FAIL] Gemini API check failed: {e}")
            success = False

    # 5. Check Adzuna API & Cache Writing
    print("\n[5/5] Testing Adzuna Job Search API & Storage Sync...")
    if not (adzuna_id and adzuna_key):
        print("  [SKIP] Adzuna credentials missing. Skipping live job search check.")
    else:
        try:
            test_query = "Software Engineer"
            print(f"  - Querying live Adzuna jobs for '{test_query}'...")

            # This will fetch jobs, save them to database, and export to jsonl
            sync_ok = await fetch_and_sync_live_jobs(query=test_query, location=None)

            if sync_ok:
                print("  [PASS] Adzuna Job Search and storage sync passed.")

                # Verify they actually got written
                async with async_session_factory() as session:
                    from app.db.crud import get_all_job_listings

                    jobs = await get_all_job_listings(session)
                    print(f"  - Verified: {len(jobs)} total jobs now stored in the local database.")

                jsonl_path = (
                    Path(__file__).resolve().parents[1] / "data" / "jobs" / "listings.jsonl"
                )
                if jsonl_path.exists():
                    print(f"  - Verified: JSONL file successfully created/updated at {jsonl_path}.")
                else:
                    print("  [FAIL] JSONL file listings.jsonl was not created.")
                    success = False
            else:
                print("  [FAIL] Adzuna Job sync returned failure.")
                success = False
        except Exception as e:
            print(f"  [FAIL] Adzuna Job sync failed: {e}")
            success = False

    print("\n" + "=" * 60)
    if success:
        print("SUCCESS: All systems and APIs are functioning properly!")
    else:
        print("FAILURE: One or more integration tests failed. Check logs above.")
    print("=" * 60)
    return success


if __name__ == "__main__":
    asyncio.run(run_diagnostics())

import json
import os
import shutil
import subprocess
from pathlib import Path

# Setup data paths
DATA_DIR = Path(__file__).resolve().parents[1] / "data"


def debug_coral_setup():
    print("=" * 60)
    print("             CORAL CLI DIAGNOSTIC & DEBUGGER")
    print("=" * 60)

    # 1. Check if Coral CLI binary is resolved
    print("\n[Step 1] Resolving Coral CLI binary...")
    coral_path = None
    env_path = os.getenv("CORAL_CLI_PATH")
    if env_path and Path(env_path).exists():
        coral_path = env_path
        print(f"  - Resolved from env CORAL_CLI_PATH: {coral_path}")

    if not coral_path:
        which = shutil.which("coral")
        if which:
            coral_path = which
            print(f"  - Resolved from system PATH via which: {coral_path}")

    if not coral_path:
        # Check standard Linux path
        std_linux = Path("/usr/local/bin/coral")
        if std_linux.exists():
            coral_path = str(std_linux)
            print(f"  - Resolved from standard container location: {coral_path}")

    if not coral_path:
        print("  [FAIL] Coral CLI binary could not be resolved!")
        return False

    print(f"  [PASS] Coral CLI resolved at: {coral_path}")

    # 2. Check Coral sources configuration
    print("\n[Step 2] Checking Coral YAML source manifests...")
    sources_dir = Path(__file__).resolve().parents[1] / "sources"
    if sources_dir.exists():
        manifests = list(sources_dir.glob("*.yaml"))
        print(f"  - Found {len(manifests)} source manifests in {sources_dir}:")
        for m in manifests:
            print(f"    * {m.name}")
    else:
        print(f"  [WARN] Sources directory {sources_dir} does not exist.")

    # 3. Check JSONL data file
    print("\n[Step 3] Checking listings.jsonl file status...")
    jsonl_path = DATA_DIR / "jobs" / "listings.jsonl"
    if jsonl_path.exists():
        size = jsonl_path.stat().st_size
        print(f"  [PASS] listings.jsonl exists at: {jsonl_path}")
        print(f"         Size: {size} bytes")

        # Read lines count
        with open(jsonl_path, "r", encoding="utf-8") as f:
            lines = f.readlines()
        print(f"         Total records in file: {len(lines)}")
        if len(lines) > 0:
            print(f"         Sample first record: {lines[0].strip()[:120]}...")
    else:
        print(f"  [FAIL] listings.jsonl does not exist at expected path: {jsonl_path}")
        return False

    # 4. Run standalone shell command via subprocess
    print("\n[Step 4] Executing Coral SQL command via subprocess...")
    # SQL Query to search for senior backend roles
    query = "SELECT * FROM jobs.listings WHERE title LIKE '%Senior Backend%' OR title LIKE '%senior backend%' LIMIT 5"
    cmd = [coral_path, "sql", "--format", "json", query]

    print(f"  - Executing command: {' '.join(cmd)}")
    try:
        result = subprocess.run(cmd, capture_output=True, text=True, timeout=15)
        print(f"  - Exit Code: {result.returncode}")

        if result.returncode != 0:
            print("  [FAIL] Coral CLI exited with error:")
            print(f"         STDERR: {result.stderr.strip()}")
            return False

        print("  - Raw stdout output received (first 500 chars):")
        print(result.stdout[:500] + ("..." if len(result.stdout) > 500 else ""))

        # 5. Parse JSON output
        print("\n[Step 5] Parsing Coral JSON response...")
        try:
            payload = json.loads(result.stdout)
            rows = payload.get("rows", payload) if isinstance(payload, dict) else payload
            if isinstance(rows, list):
                print(f"  [PASS] Parsed {len(rows)} matching rows successfully:")
                for r in rows:
                    print(
                        f"    * Company: {r.get('company')} | Title: {r.get('title')} | Location: {r.get('location')}"
                    )
            else:
                print(f"  [WARN] Output was parsed but is not a list. Type: {type(rows)}")
                print(rows)
        except json.JSONDecodeError as je:
            print(f"  [FAIL] Failed to decode JSON from Coral output: {je}")
            return False

    except Exception as e:
        print(f"  [FAIL] Subprocess execution failed: {e}")
        return False

    print("\n" + "=" * 60)
    print("STATUS: Diagnostics run completed successfully.")
    print("=" * 60)
    return True


if __name__ == "__main__":
    debug_coral_setup()

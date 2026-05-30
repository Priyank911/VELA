"""Coral CLI subprocess wrapper — executes SQL queries via coral.exe."""

import json
import os
import shutil
import subprocess
import time
from pathlib import Path
from typing import Any


class CoralExecutor:
    """Wraps the Coral CLI binary for SQL execution with timing and fallback."""

    def __init__(self):
        self.coral_path = self._resolve_coral()
        self.data_dir = Path(__file__).resolve().parents[2] / "data"

    def _resolve_coral(self) -> str | None:
        env_path = os.getenv("CORAL_CLI_PATH")
        if env_path and Path(env_path).exists():
            return env_path
        which = shutil.which("coral")
        if which:
            return which
        # Fallback to known location
        fallback = Path("d:/On-Hackathon/Coral-demo/coral/coral.exe")
        if fallback.exists():
            return str(fallback)
        return None

    @property
    def available(self) -> bool:
        return self.coral_path is not None and Path(self.coral_path).exists()

    def execute_sql(self, query: str) -> dict[str, Any]:
        """Execute SQL via Coral CLI. Returns {rows, row_count, latency_ms, error}."""
        start = time.monotonic()

        if not self.available:
            return self._fallback_query(query, start)

        try:
            result = subprocess.run(
                [self.coral_path, "sql", "--format", "json", query],
                capture_output=True, text=True, timeout=30,
            )
            latency = int((time.monotonic() - start) * 1000)

            if result.returncode != 0:
                return {
                    "rows": [], "row_count": 0, "latency_ms": latency,
                    "error": result.stderr.strip() or "Coral SQL execution failed"
                }

            payload = json.loads(result.stdout)
            rows = payload.get("rows", payload) if isinstance(payload, dict) else payload
            if not isinstance(rows, list):
                rows = [rows] if rows else []

            return {"rows": rows, "row_count": len(rows), "latency_ms": latency, "error": None}

        except subprocess.TimeoutExpired:
            return {"rows": [], "row_count": 0, "latency_ms": 30000, "error": "Query timed out (30s)"}
        except json.JSONDecodeError:
            latency = int((time.monotonic() - start) * 1000)
            return {"rows": [], "row_count": 0, "latency_ms": latency, "error": "Failed to parse Coral output"}
        except Exception as e:
            latency = int((time.monotonic() - start) * 1000)
            return {"rows": [], "row_count": 0, "latency_ms": latency, "error": str(e)}

    def _fallback_query(self, query: str, start: float) -> dict[str, Any]:
        """Fallback to local JSONL data when Coral CLI unavailable."""
        query_lower = query.lower()
        rows = []

        table_map = {
            "jobs.listings": self.data_dir / "jobs" / "listings.jsonl",
            "gmail.inbox": self.data_dir / "gmail" / "inbox.jsonl",
            "gmail.sent": self.data_dir / "gmail" / "sent.jsonl",
            "google_calendar.events": self.data_dir / "google_calendar" / "events.jsonl",
            "notion.pages": self.data_dir / "notion" / "pages.jsonl",
        }

        for table_name, file_path in table_map.items():
            if table_name in query_lower and file_path.exists():
                rows = self._read_jsonl(file_path)
                break

        latency = int((time.monotonic() - start) * 1000)
        return {"rows": rows, "row_count": len(rows), "latency_ms": latency, "error": None}

    def _read_jsonl(self, path: Path) -> list[dict]:
        rows = []
        try:
            with open(path, "r", encoding="utf-8") as f:
                for line in f:
                    line = line.strip()
                    if line:
                        rows.append(json.loads(line))
        except Exception:
            pass
        return rows


# Global singleton
coral_executor = CoralExecutor()

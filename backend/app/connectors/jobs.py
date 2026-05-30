"""Jobs connector — always connected, uses local JSONL data."""

from app.connectors.base import BaseConnector


class JobsConnector(BaseConnector):
    name = "jobs"
    display_name = "Job Listings"
    description = "Built-in job database with positions from top companies"
    icon = "💼"
    always_connected = True

    async def authenticate(self, credentials: dict) -> bool:
        return True

    async def test_connection(self) -> bool:
        return True

    def get_available_tables(self) -> list[str]:
        return ["jobs.listings"]

"""Notion connector — mock mode for demo."""

from app.connectors.base import BaseConnector


class NotionConnector(BaseConnector):
    name = "notion"
    display_name = "Notion"
    description = "Connect Notion to track projects, notes, and career goals"
    icon = "📝"

    async def authenticate(self, credentials: dict) -> bool:
        return True

    async def test_connection(self) -> bool:
        return True

    def get_available_tables(self) -> list[str]:
        return ["notion.pages"]

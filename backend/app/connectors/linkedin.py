"""LinkedIn connector — session token approach, mock mode for demo."""

from app.connectors.base import BaseConnector


class LinkedInConnector(BaseConnector):
    name = "linkedin"
    display_name = "LinkedIn"
    description = "Connect LinkedIn to discover companies, roles, and network connections"
    icon = "💼"

    async def authenticate(self, credentials: dict) -> bool:
        return True

    async def test_connection(self) -> bool:
        return True

    def get_available_tables(self) -> list[str]:
        return ["linkedin.profiles"]

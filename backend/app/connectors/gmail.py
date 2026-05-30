"""Gmail connector — mock mode for demo."""

from app.connectors.base import BaseConnector


class GmailConnector(BaseConnector):
    name = "gmail"
    display_name = "Gmail"
    description = "Connect your Gmail to track recruiter emails and application responses"
    icon = "📧"

    async def authenticate(self, credentials: dict) -> bool:
        # In production: Google OAuth 2.0 flow
        # In demo: always succeeds
        return True

    async def test_connection(self) -> bool:
        return True

    def get_available_tables(self) -> list[str]:
        return ["gmail.inbox", "gmail.sent"]

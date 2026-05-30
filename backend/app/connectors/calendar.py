"""Google Calendar connector — mock mode for demo."""

from app.connectors.base import BaseConnector


class CalendarConnector(BaseConnector):
    name = "google_calendar"
    display_name = "Google Calendar"
    description = "Connect your calendar to manage interviews and prep sessions"
    icon = "📅"

    async def authenticate(self, credentials: dict) -> bool:
        return True

    async def test_connection(self) -> bool:
        return True

    def get_available_tables(self) -> list[str]:
        return ["google_calendar.events"]

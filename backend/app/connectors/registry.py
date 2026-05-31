"""Connector registry — maps source names to connector classes."""

from app.connectors.calendar import CalendarConnector
from app.connectors.gmail import GmailConnector
from app.connectors.jobs import JobsConnector
from app.connectors.notion import NotionConnector

# LinkedIn removed — requires paid API access not available in free tier
CONNECTOR_REGISTRY = {
    "jobs": JobsConnector,
    "gmail": GmailConnector,
    "google_calendar": CalendarConnector,
    "notion": NotionConnector,
}


def get_all_connectors_info() -> list[dict]:
    """Return metadata for all available connectors (for UI sidebar)."""
    result = []
    for name, cls in CONNECTOR_REGISTRY.items():
        instance = cls()
        info = instance.get_source_info()
        info["status"] = "connected" if instance.always_connected else "disconnected"
        result.append(info)
    return result


def get_connector(source_type: str):
    """Get a connector instance by source type name."""
    cls = CONNECTOR_REGISTRY.get(source_type)
    if cls:
        return cls()
    return None

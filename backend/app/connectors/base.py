"""Base connector interface."""

from abc import ABC, abstractmethod
from typing import Any


class BaseConnector(ABC):
    """Abstract base class for all data source connectors."""

    name: str = ""
    display_name: str = ""
    description: str = ""
    icon: str = ""
    always_connected: bool = False

    @abstractmethod
    async def authenticate(self, credentials: dict) -> bool:
        """Authenticate with the data source. Returns True on success."""
        ...

    @abstractmethod
    async def test_connection(self) -> bool:
        """Test if the connection is working."""
        ...

    @abstractmethod
    def get_available_tables(self) -> list[str]:
        """Return list of SQL table names available after connection."""
        ...

    def get_source_info(self) -> dict[str, Any]:
        """Return connector metadata for the UI."""
        return {
            "name": self.name,
            "display_name": self.display_name,
            "description": self.description,
            "icon": self.icon,
            "tables": self.get_available_tables(),
            "always_connected": self.always_connected,
        }

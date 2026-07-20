"""
Storage Plugin Interface

The runtime graph can be persisted to multiple backends.
SQLite is the default. Other backends are plugins.

Usage:
  plugin = load_plugin("storage", "sqlite")
  plugin.write(graph, "path/to/runtime/graph.db")
  graph = plugin.read("path/to/runtime/graph.db")
"""

from typing import Optional


class StoragePlugin:
    """Base interface for storage backends."""

    @property
    def name(self) -> str:
        raise NotImplementedError

    def write(self, graph, path: str):
        """Serialize a RuntimeGraph to storage."""
        raise NotImplementedError

    def read(self, path: str):
        """Deserialize a RuntimeGraph from storage."""
        raise NotImplementedError

    def exists(self, path: str) -> bool:
        """Check if a runtime graph exists at path."""
        raise NotImplementedError

    def delete(self, path: str):
        """Remove a runtime graph."""
        raise NotImplementedError

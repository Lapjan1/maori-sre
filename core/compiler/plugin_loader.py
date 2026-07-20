"""
Plugin Discovery and Loading

The compiler discovers plugins via a plugin registry.
Plugins are optional — the compiler works without any.

Types:
  - embedding: Vector embedding generation
  - storage:   Runtime graph persistence
  - tts:       Text-to-speech
  - stt:       Speech-to-text
  - lesson:    Lesson progression strategies
"""

from typing import Dict, Optional, Type
from pathlib import Path


class PluginRegistry:
    """Registry for SRE compiler plugins."""

    def __init__(self):
        self._plugins: Dict[str, Dict[str, Type]] = {
            "embedding": {},
            "storage": {},
            "tts": {},
            "stt": {},
            "lesson": {},
        }

    def register(self, plugin_type: str, name: str, plugin_class: Type):
        """Register a plugin class."""
        if plugin_type not in self._plugins:
            raise ValueError(f"Unknown plugin type: {plugin_type}")
        self._plugins[plugin_type][name] = plugin_class

    def get(self, plugin_type: str, name: str):
        """Get a plugin instance by type and name."""
        plugins = self._plugins.get(plugin_type, {})
        cls = plugins.get(name)
        if cls is None:
            raise ValueError(f"Plugin not found: {plugin_type}/{name}")
        return cls()

    def list_available(self, plugin_type: str) -> list:
        """List available plugin names for a type."""
        return list(self._plugins.get(plugin_type, {}).keys())


# Global plugin registry
registry = PluginRegistry()


def discover_plugins(plugin_dirs: list = None):
    """
    Discover and register plugins from directories.
    
    Scans each directory for Python files implementing plugin interfaces.
    
    Args:
        plugin_dirs: List of directory paths to scan.
                     Defaults to ['plugins'] relative to project root.
    """
    # TODO: Phase 2 — implement auto-discovery
    pass

"""
Lesson Strategy Plugin Interface

Different lesson progression strategies can be plugged in.
The default strategy follows the SRE progression model (concrete → abstract,
high-frequency → low-frequency, simple templates → complex templates).

Usage:
  plugin = load_plugin("lesson", "default")
  levels = plugin.build(graph, languages=["mi", "af", "en"])
"""

from typing import List, Dict, Optional
from dataclasses import dataclass


@dataclass
class LessonLevel:
    """A progression level in the learning path."""
    level: int
    label: str
    entities: List[str]
    templates: List[str]
    games: List[str]
    prerequisites: List[int]  # level numbers


class LessonPlugin:
    """Base interface for lesson progression strategies."""

    @property
    def name(self) -> str:
        raise NotImplementedError

    def build(self, graph, languages: Optional[List[str]] = None,
              config: Optional[Dict] = None) -> List[LessonLevel]:
        """
        Generate lesson progression from the runtime graph.
        
        Args:
            graph: RuntimeGraph instance
            languages: Language codes to target
            config: Strategy-specific configuration
        
        Returns:
            Ordered list of LessonLevel objects
        """
        raise NotImplementedError

    def get_level(self, level_id: int) -> Optional[LessonLevel]:
        """Get a specific level from the last build."""
        raise NotImplementedError

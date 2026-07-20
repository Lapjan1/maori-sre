"""
Lesson Structure Builder

Traverses the compiled graph to produce progression paths for learners.

Strategy:
  - Level 1: High-frequency, concrete THING entities + simple identity templates
  - Level 2: Common ACTION entities + present-tense templates
  - Level 3: PERSON + PLACE + location/direction templates
  - Level 4: PROPERTY + STATE + descriptive templates
  - Level 5: Complex interactions, cultural affordances

Each level specifies:
  - Entities to learn (with their representations and affordances)
  - Grammar templates to master
  - Games unlocked at this level
  - Required interactions to have experienced

Output: Lesson plan JSON files consumable by applications.

Usage:
  from compiler.lesson_builder import build_lessons
  lessons = build_lessons(graph, languages=["mi", "af", "en"])
"""

from typing import List, Dict


class LessonLevel:
    """A learning progression level."""
    
    def __init__(self, level: int, label: str):
        self.level = level
        self.label = label
        self.entities: List[str] = []
        self.templates: List[str] = []
        self.games: List[str] = []
        self.prerequisites: List[str] = []


def build_lessons(graph, languages: List[str] = None) -> List[LessonLevel]:
    """
    Auto-generate lesson progression from the runtime graph.
    
    Uses entity frequency, concreteness, and relationship density
    to order content from foundational to advanced.
    
    Args:
        graph: A RuntimeGraph instance
        languages: Language codes to generate lessons for
    
    Returns:
        Ordered list of LessonLevel objects
    """
    levels = []
    
    # TODO: Phase 2 — implement lesson generation
    # 1. Score entities by: concreteness, frequency, affordance count
    # 2. Group into levels (50 → 100 → 200 → all)
    # 3. Assign grammar templates by complexity
    # 4. Assign games based on available modalities
    # 5. Build prerequisite chains
    
    return levels

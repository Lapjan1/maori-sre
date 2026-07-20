"""
Learning Graph — Second Compiler Target

The Runtime Graph stores KNOWLEDGE (what exists, how things relate).
The Learning Graph stores ACQUISITION (the optimal order for humans to learn).

These are related but not identical:
  - "water" appears in Lesson 1 (high frequency, concrete, essential)
  - "hydrogen" appears in Lesson 20+ (abstract, requires prior knowledge)
  - "whānau" appears in Lesson 3 (culturally important, despite abstractness)

The Learning Graph maps:
  Entity → Difficulty Score (1-10)
  Entity → Prerequisites (entities that must be known first)
  Entity → Lesson Level
  Entity → Stories that teach it
  Template → Lesson Level
  Story → Prerequisites (stories that should come before)
"""

from typing import List, Dict, Optional, Set
from dataclasses import dataclass, field
import json
import hashlib


@dataclass
class LearningNode:
    """An entity's position in the learning progression."""
    entity_id: str
    difficulty: int  # 1-10
    level: int       # Lesson level (1-based)
    prerequisites: List[str] = field(default_factory=list)  # entity_ids
    stories: List[str] = field(default_factory=list)  # story_ids
    templates: List[str] = field(default_factory=list)
    concreteness: float = 1.0  # 0.0 (abstract) to 1.0 (concrete)
    frequency: float = 0.5     # 0.0 (rare) to 1.0 (common)


@dataclass
class StoryNode:
    """A story's position in the learning progression."""
    story_id: str
    level: int
    difficulty: int
    prerequisites: List[str] = field(default_factory=list)  # story_ids
    entities_taught: List[str] = field(default_factory=list)
    templates_taught: List[str] = field(default_factory=list)


class LearningGraph:
    """The compiled learning progression."""
    
    def __init__(self):
        self.entities: Dict[str, LearningNode] = {}
        self.stories: Dict[str, StoryNode] = {}
        self.levels: Dict[int, dict] = {}  # level -> metadata
    
    def add_entity(self, node: LearningNode):
        self.entities[node.entity_id] = node
    
    def add_story(self, node: StoryNode):
        self.stories[node.story_id] = node
    
    def get_level(self, level_num: int) -> dict:
        """Get all entities and stories at a given level."""
        entities = [e for e in self.entities.values() if e.level == level_num]
        stories = [s for s in self.stories.values() if s.level == level_num]
        return {
            "level": level_num,
            "entities": sorted(e.entity_id for e in entities),
            "stories": sorted(s.story_id for s in stories),
            "new_templates": list(set(
                t for e in entities for t in e.templates
            )),
        }
    
    def to_dict(self) -> dict:
        return {
            "total_entities": len(self.entities),
            "total_stories": len(self.stories),
            "levels": sorted(self.levels.keys()),
            "entities": {
                eid: {
                    "level": e.level,
                    "difficulty": e.difficulty,
                    "prerequisites": e.prerequisites,
                    "concreteness": e.concreteness,
                    "frequency": e.frequency,
                    "stories": e.stories,
                    "templates": e.templates,
                }
                for eid, e in sorted(self.entities.items())
            },
            "stories": {
                sid: {
                    "level": s.level,
                    "difficulty": s.difficulty,
                    "prerequisites": s.prerequisites,
                    "entities_taught": s.entities_taught,
                    "templates_taught": s.templates_taught,
                }
                for sid, s in sorted(self.stories.items())
            },
        }


def build_learning_graph(stories: List[dict], entities: List[dict]) -> LearningGraph:
    """
    Build a Learning Graph from compiled stories and entities.
    
    Algorithm:
      - Difficulty = f(category, concreteness, affordance_count)
      - Level = ceil(difficulty / 2)  (rough grouping)
      - Prerequisites = entities referenced by this entity's relationships
      - Stories: level = max(entity levels in story)
    """
    graph = LearningGraph()
    
    # Score each entity for difficulty
    category_base = {
        "THING": 1, "PERSON": 1, "PLACE": 1, "ACTION": 2,
        "STATE": 3, "PROPERTY": 3, "TIME": 3, "QUANTITY": 2,
        "EMOTION": 4, "EVENT": 4, "RELATION": 5, "SOCIAL": 5,
    }
    
    for ent in entities:
        eid = ent.get("entity_id", "")
        cat = ent.get("category", "THING")
        props = ent.get("properties", {})
        affordances = props.get("affordances", [])
        
        base = category_base.get(cat, 3)
        aff_penalty = max(0, 3 - len(affordances)) * 0.5  # fewer affordances = harder
        difficulty = min(10, max(1, base + aff_penalty))
        level = min(10, max(1, int((difficulty + 1) // 2)))
        
        # Concrete THING/PLACE/PERSON level 1, abstract SOCIAL level 4+
        concreteness = 1.0
        if cat in ("SOCIAL", "RELATION", "EMOTION", "EVENT", "STATE", "TIME"):
            concreteness = 0.4
        elif cat in ("PROPERTY", "ACTION", "QUANTITY"):
            concreteness = 0.7
        
        # Frequency estimate
        frequency = min(1.0, max(0.1, len(affordances) / 5))
        
        node = LearningNode(
            entity_id=eid,
            difficulty=difficulty,
            level=level,
            concreteness=concreteness,
            frequency=frequency,
        )
        graph.add_entity(node)
    
    # Process stories
    for story in stories:
        sid = story.get("story_id", "")
        story_level = story.get("level", 1)
        entity_ids = [e["entity_id"] for e in story.get("entities", [])]
        
        # A story's difficulty is the max difficulty of its entities
        max_diff = 1
        for eid in entity_ids:
            if eid in graph.entities:
                max_diff = max(max_diff, graph.entities[eid].difficulty)
        
        node = StoryNode(
            story_id=sid,
            level=story_level,
            difficulty=max_diff,
            entities_taught=entity_ids,
        )
        graph.add_story(node)
        
        # Link entities to this story
        for eid in entity_ids:
            if eid in graph.entities:
                if sid not in graph.entities[eid].stories:
                    graph.entities[eid].stories.append(sid)
    
    # Build level metadata
    max_level = max(
        [e.level for e in graph.entities.values()] +
        [s.level for s in graph.stories.values()] +
        [1]
    )
    for level_num in range(1, max_level + 1):
        graph.levels[level_num] = graph.get_level(level_num)
    
    return graph

"""
Experience Reader — Parses experience YAML files into structured documents.
Supports multiple experience types: story, dialogue, observation, procedure,
question, song, proverb, game.
"""

from pathlib import Path
from typing import List, Dict, Any, Optional
import yaml

EXPERIENCE_TYPES = ["story", "dialogue", "observation", "procedure",
                    "question", "song", "proverb", "game"]


class ExperienceDocument:
    """A parsed experience with all its semantic components."""
    
    def __init__(self, data: dict):
        self.raw = data
        self.experience_id = data.get("experience_id", "UNKNOWN")
        self.type = data.get("type", "story")
        self.level = data.get("level", 1)
        self.title = data.get("title", {})
        self.content = data.get("content", {})
        self.entities = data.get("entities", [])
        self.affordances = data.get("affordances", [])
        self.interactions = data.get("interactions", [])
        self.relationships = data.get("relationships", [])
        self.language_mappings = data.get("language_mappings", [])
        self.metadata = data.get("metadata", {})
        
        if self.type not in EXPERIENCE_TYPES:
            raise ValueError(f"Unknown experience type: {self.type}. "
                             f"Must be one of: {EXPERIENCE_TYPES}")
    
    @property
    def word_count(self) -> int:
        """Approximate word count across all languages."""
        total = 0
        for text in self.content.values():
            if isinstance(text, str):
                total += len(text.split())
        return max(1, total)
    
    def to_canonical_docs(self, source_file: str = "") -> Dict[str, List[Dict]]:
        """Extract all canonical source documents from the experience."""
        docs = {
            "entities": [],
            "affordances": [],
            "interactions": [],
            "relationships": [],
            "language_mappings": [],
        }
        
        file_ref = source_file or f"experiences/{self.experience_id}.yaml"
        
        for ent in self.entities:
            doc = {
                "entity_id": ent["entity_id"],
                "category": ent["category"],
                "label": ent.get("label", {}),
                "definition": ent.get("definition", ""),
                "properties": ent.get("properties", {}),
                "_file": file_ref,
                "_line": 1,
                "_source_experience": self.experience_id,
            }
            docs["entities"].append(doc)
        
        for aff in self.affordances:
            doc = {
                "entity_id": aff["entity_id"],
                "action": aff["action"],
                "description": aff.get("description", ""),
                "typical_actors": aff.get("typical_actors", []),
                "typical_outcome": aff.get("typical_outcome", []),
                "_file": file_ref,
                "_line": 1,
                "_source_experience": self.experience_id,
            }
            if "outcome" in aff:
                doc["typical_outcome"] = [aff["outcome"]]
            docs["affordances"].append(doc)
        
        for interaction in self.interactions:
            doc = {
                "interaction_id": interaction.get(
                    "interaction_id",
                    f"INT_{self.experience_id}_{len(docs['interactions'])}"
                ),
                "participants": interaction.get("participants", []),
                "action": interaction.get("action", ""),
                "outcomes": [
                    {"entity_id": o} if isinstance(o, str) else o
                    for o in interaction.get("outcomes", [])
                ],
                "location": interaction.get("location", ""),
                "language_examples": interaction.get("sentences", {}),
                "_file": file_ref,
                "_line": 1,
                "_source_experience": self.experience_id,
            }
            if "from_state" in interaction and "to_state" in interaction:
                doc["outcomes"].append({"entity_id": interaction["to_state"]})
            docs["interactions"].append(doc)
        
        for rel in self.relationships:
            doc = {
                "source": rel["source"],
                "type": rel["type"],
                "target": rel["target"],
                "strength": rel.get("strength", 1.0),
                "_file": file_ref,
                "_line": 1,
                "_source_experience": self.experience_id,
            }
            docs["relationships"].append(doc)
        
        for mapping in self.language_mappings:
            doc = {
                "entity_id": mapping["entity_id"],
                "language": mapping["language"],
                "surface": mapping["surface"],
                "pronunciation": mapping.get("pronunciation", {}),
                "grammar": mapping.get("grammar", {}),
                "usage": mapping.get("usage", {}),
                "_file": file_ref,
                "_line": 1,
                "_source_experience": self.experience_id,
            }
            docs["language_mappings"].append(doc)
        
        return docs


def read_experience(path: str) -> ExperienceDocument:
    """Read an experience YAML file and return an ExperienceDocument."""
    file_path = Path(path)
    if not file_path.exists():
        raise FileNotFoundError(f"Experience not found: {path}")
    
    with open(file_path, "r", encoding="utf-8") as f:
        data = yaml.safe_load(f)
    
    return ExperienceDocument(data)


def discover_experiences(experiences_dir: str) -> List[Path]:
    """Discover all experience YAML files in a directory tree."""
    base = Path(experiences_dir)
    if not base.exists():
        return []
    return sorted(base.rglob("*.yaml"))

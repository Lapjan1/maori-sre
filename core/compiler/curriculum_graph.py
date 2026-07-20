"""
Curriculum Graph — Third Compiler Target

Nodes: Experiences (stories, dialogues, observations, procedures, etc.)
Edges: Shared semantic structures (same entities, same affordances, same templates)

The Curriculum Graph enables the compiler to recommend learning paths:
  "Learn Experience B after Experience A because 82% of concepts overlap."

This is distinct from the Runtime Graph (what exists) and the Learning Graph
(optimal order of acquisition). The Curriculum Graph models pedagogical
connections between experiences.

Metrics:
  - Semantic overlap: % of entities shared between two experiences
  - Scaffolding score: how well Experience A prepares for Experience B
  - Cognitive progression: smooth increase in difficulty/cognitive load
"""

from typing import List, Dict, Set, Tuple, Optional
from dataclasses import dataclass, field
import json
import math


@dataclass
class CurriculumEdge:
    """A pedagogical connection between two experiences."""
    from_id: str
    to_id: str
    semantic_overlap: float = 0.0    # 0.0–1.0
    scaffolding_score: float = 0.0    # 0.0–1.0
    difficulty_gap: float = 0.0
    shared_entities: List[str] = field(default_factory=list)


@dataclass
class ExperienceNode:
    """An experience in the curriculum graph."""
    experience_id: str
    experience_type: str
    level: int
    difficulty: float
    cognitive_load: str  # low, medium, high
    entity_ids: List[str] = field(default_factory=list)
    concept_ids: List[str] = field(default_factory=list)


class CurriculumGraph:
    """The compiled curriculum graph."""
    
    def __init__(self):
        self.experiences: Dict[str, ExperienceNode] = {}
        self.edges: List[CurriculumEdge] = []
        self.recommendations: Dict[str, List[str]] = {}  # exp_id -> recommended next
    
    def add_experience(self, node: ExperienceNode):
        self.experiences[node.experience_id] = node
    
    def compute_overlaps(self):
        """Compute semantic overlap for all experience pairs."""
        ids = list(self.experiences.keys())
        for i in range(len(ids)):
            for j in range(len(ids)):
                if i == j:
                    continue
                a = self.experiences[ids[i]]
                b = self.experiences[ids[j]]
                
                set_a = set(a.entity_ids)
                set_b = set(b.entity_ids)
                
                if not set_a or not set_b:
                    continue
                
                shared = set_a & set_b
                overlap = len(shared) / max(len(set_a | set_b), 1)
                
                # Compute scaffolding score
                # How well does A prepare for B?
                # Higher if A's entities overlap with B's, and A's difficulty <= B's
                prep_score = 0.0
                if shared:
                    prep_score = len(shared) / max(len(set_b), 1)
                    if a.difficulty > b.difficulty:
                        prep_score *= 0.7  # penalty if A is harder than B
                
                edge = CurriculumEdge(
                    from_id=ids[i],
                    to_id=ids[j],
                    semantic_overlap=round(overlap, 3),
                    scaffolding_score=round(prep_score, 3),
                    difficulty_gap=b.difficulty - a.difficulty,
                    shared_entities=sorted(shared),
                )
                self.edges.append(edge)
    
    def compute_recommendations(self, min_overlap: float = 0.1):
        """
        For each experience, find the best next experiences.
        
        Best = high scaffolding score + positive difficulty gap +
               similar cognitive load + different type (variety).
        """
        self.recommendations = {}
        
        for exp_id in self.experiences:
            candidates = [
                e for e in self.edges
                if e.from_id == exp_id
                and e.scaffolding_score >= min_overlap
            ]
            
            # Score: scaffolding * (1 + difficulty_gap bonus if positive)
            scored = []
            for c in candidates:
                bonus = 1.0
                if c.difficulty_gap > 0:
                    bonus = 1.0 + min(c.difficulty_gap * 0.1, 0.5)
                
                # Variety bonus: prefer different experience types
                from_type = self.experiences[exp_id].experience_type
                to_type = self.experiences[c.to_id].experience_type
                if from_type != to_type:
                    bonus *= 1.2
                
                score = c.scaffolding_score * bonus
                scored.append((score, c.to_id))
            
            scored.sort(reverse=True)
            self.recommendations[exp_id] = [s[1] for s in scored[:3]]
    
    def to_dict(self) -> dict:
        return {
            "total_experiences": len(self.experiences),
            "total_edges": len(self.edges),
            "experiences": {
                eid: {
                    "type": e.experience_type,
                    "level": e.level,
                    "difficulty": e.difficulty,
                    "cognitive_load": e.cognitive_load,
                    "entity_count": len(e.entity_ids),
                    "recommended_next": self.recommendations.get(eid, []),
                }
                for eid, e in sorted(self.experiences.items())
            },
            "edges": [
                {
                    "from": e.from_id,
                    "to": e.to_id,
                    "overlap": e.semantic_overlap,
                    "scaffolding": e.scaffolding_score,
                }
                for e in sorted(self.edges, key=lambda x: -x.semantic_overlap)
            ],
        }


def build_curriculum_graph(compiled_experiences: List[dict]) -> CurriculumGraph:
    """
    Build a Curriculum Graph from compiled experience data.
    
    Args:
        compiled_experiences: List of compiled experience dicts
                              (from experience compiler output)
    
    Returns:
        Populated CurriculumGraph with recommendations
    """
    graph = CurriculumGraph()
    
    # Difficulty mapping for cognitive load
    load_to_diff = {"low": 1, "medium": 3, "high": 6}
    
    for exp in compiled_experiences:
        meta = exp.get("metadata", {})
        load = meta.get("cognitive_load", "low")
        difficulty = meta.get("difficulty", load_to_diff.get(load, 3))
        
        entity_ids = [e["entity_id"] for e in exp.get("entities", [])]
        concept_ids = meta.get("concepts_taught", [])
        
        node = ExperienceNode(
            experience_id=exp["experience_id"],
            experience_type=exp.get("type", "story"),
            level=exp.get("level", 1),
            difficulty=difficulty,
            cognitive_load=load,
            entity_ids=entity_ids,
            concept_ids=concept_ids,
        )
        graph.add_experience(node)
    
    graph.compute_overlaps()
    graph.compute_recommendations()
    
    return graph

"""
INF004 — Reverse Affordance (Requirement Transitivity)

IF
  person requires entity_a
  AND entity_a requires entity_b
THEN
  INFER person requires entity_b
  WITH confidence = min(conf(R1), conf(R2))
"""

from typing import List
from compiler.inference.rule import Rule, RuleMetadata, InferredFact


class Inf004Rule(Rule):

    metadata = RuleMetadata(
        id="INF004",
        name="Requirement Transitivity",
        description="If a person requires X and X requires Y, then the person requires Y",
        priority=40,
        deterministic=True,
    )

    def apply(self, graph) -> List[InferredFact]:
        facts = []

        # Collect all "requires" relationships from edges
        requires_edges = [e for e in graph.edges if e.type == "requires"]

        # Build adjacency list: entity -> list of (required_entity, strength)
        requires_map = {}
        for edge in requires_edges:
            src = edge.source
            tgt = edge.target
            if src not in requires_map:
                requires_map[src] = []
            requires_map[src].append((tgt, edge.strength))

        # For each entity that requires something, transitively derive requirements
        for entity_id in requires_map:
            direct = requires_map[entity_id]
            # For each directly required entity, check what IT requires
            for required_id, strength1 in direct:
                if required_id in requires_map:
                    for transitive_id, strength2 in requires_map[required_id]:
                        # Don't add self-requirements
                        if transitive_id == entity_id:
                            continue

                        confidence = min(strength1, strength2)
                        fact = InferredFact(
                            predicate="requires",
                            subject=entity_id,
                            object=transitive_id,
                            rule_id="INF004",
                            confidence=round(confidence, 4),
                            supporting_facts=[],
                            source_provenances=[
                                {
                                    "type": "requires_edge",
                                    "subject": entity_id,
                                    "required": required_id,
                                    "strength": strength1,
                                },
                                {
                                    "type": "requires_edge",
                                    "subject": required_id,
                                    "required": transitive_id,
                                    "strength": strength2,
                                },
                            ],
                        )
                        facts.append(fact)

        return facts

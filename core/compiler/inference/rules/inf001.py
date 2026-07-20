"""
INF001 — Affordance Inheritance

IF
  a is_a b
  AND b affords action X
THEN
  INFER a affords action X
  WITH confidence = confidence(b → X) * 0.9
"""

from typing import List
from compiler.inference.rule import Rule, RuleMetadata, InferredFact


class Inf001Rule(Rule):

    metadata = RuleMetadata(
        id="INF001",
        name="Affordance Inheritance",
        description="Subtypes inherit affordances from their parent types",
        priority=10,
        deterministic=True,
    )

    def apply(self, graph) -> List[InferredFact]:
        facts = []

        # Find all is_a edges
        is_a_edges = [e for e in graph.edges if e.type == "is_a"]

        for edge in is_a_edges:
            child_id = edge.source
            parent_id = edge.target

            child_node = graph.get_node(child_id)
            parent_node = graph.get_node(parent_id)
            if not child_node or not parent_node:
                continue

            # Get parent affordances
            parent_affs = parent_node.properties.get("affordances", [])
            child_affs = child_node.properties.get("affordances", [])

            child_actions = {a["action"] for a in child_affs}

            for aff in parent_affs:
                if aff["action"] not in child_actions:
                    # Derive a child affordance by inheritance
                    parent_confidence = edge.strength if hasattr(edge, 'strength') else 1.0
                    confidence = parent_confidence * 0.9

                    fact = InferredFact(
                        predicate="affords",
                        subject=child_id,
                        object=aff["action"],
                        rule_id="INF001",
                        confidence=round(confidence, 4),
                        supporting_facts=[],
                        source_provenances=[
                            {
                                "type": "is_a_edge",
                                "subject": child_id,
                                "object": parent_id,
                                "strength": edge.strength,
                            },
                            {
                                "type": "parent_affordance",
                                "entity": parent_id,
                                "action": aff["action"],
                            },
                        ],
                    )
                    facts.append(fact)

        return facts

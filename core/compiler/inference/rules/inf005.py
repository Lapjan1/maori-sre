"""
INF005 — Template Applicability

IF
  action is_a TransferAction
  AND Actor is_a Person
  AND Patient is_a Thing
  AND Recipient is_a Person
THEN
  SUGGEST template GIVE_001
  WITH relevance = 0.95
"""

from typing import List
from compiler.inference.rule import Rule, RuleMetadata, InferredFact


class Inf005Rule(Rule):

    metadata = RuleMetadata(
        id="INF005",
        name="Template Applicability",
        description="Given entities and semantic roles, suggest matching sentence templates",
        priority=50,
        deterministic=True,
    )

    def apply(self, graph) -> List[InferredFact]:
        facts = []

        # Build a map of entity_id -> category
        entity_categories = {}
        for node_id, node in graph.nodes.items():
            entity_categories[node_id] = node.category

        # Collect all interactions (from experience compilation)
        for node_id, node in graph.nodes.items():
            interactions = node.properties.get("interactions", [])
            for interaction in interactions:
                action = interaction.get("action", "")
                parts = interaction.get("participants", [])

                # Extract roles
                roles = {}
                for part in parts:
                    role = part.get("role", "")
                    entity = part.get("entity_id", "")
                    roles[role] = entity

                actor_cat = entity_categories.get(roles.get("Actor", ""), "")
                patient_cat = entity_categories.get(roles.get("Patient", ""), "")
                recipient_cat = entity_categories.get(roles.get("Recipient", ""), "")

                # Check for GIVE template: Actor=Person, Patient=Thing, Recipient=Person
                if (actor_cat == "PERSON" and patient_cat == "THING"
                        and recipient_cat == "PERSON"):
                    fact = InferredFact(
                        predicate="suggests_template",
                        subject=interaction.get("interaction_id", node_id),
                        object="GIVE_001",
                        rule_id="INF005",
                        confidence=0.95,
                        supporting_facts=[],
                        source_provenances=[
                            {
                                "type": "role_match",
                                "actor": roles.get("Actor", ""),
                                "actor_category": actor_cat,
                                "patient": roles.get("Patient", ""),
                                "patient_category": patient_cat,
                                "recipient": roles.get("Recipient", ""),
                                "recipient_category": recipient_cat,
                                "suggested_template": "GIVE_001",
                            }
                        ],
                    )
                    facts.append(fact)

        return facts

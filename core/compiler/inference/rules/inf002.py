"""
INF002 — Compositional Affordance

IF
  tool is_a Tool
  AND person uses tool to act on patient
  AND action has outcome state
THEN
  INFER tool affords action on patient
  WITH confidence = confidence(uses) * 0.85
"""

from typing import List
from compiler.inference.rule import Rule, RuleMetadata, InferredFact


class Inf002Rule(Rule):

    metadata = RuleMetadata(
        id="INF002",
        name="Compositional Affordance",
        description="If a tool is used for an action, the tool affords that action",
        priority=20,
        deterministic=True,
    )

    def apply(self, graph) -> List[InferredFact]:
        facts = []

        # Find all interaction documents (from experience compilation)
        # Interactions have uses/tool/action/patient structure
        for node_id, node in graph.nodes.items():
            interactions = node.properties.get("interactions", [])
            for interaction in interactions:
                tool_id = interaction.get("tool_used")
                action = interaction.get("action")
                patient = interaction.get("patient")
                confidence = interaction.get("confidence", 1.0)

                if not tool_id or not action:
                    continue

                # Check that the tool node exists
                tool_node = graph.get_node(tool_id)
                if not tool_node:
                    continue

                # Derive: tool affords action (optionally on patient)
                derived_conf = confidence * 0.85

                fact = InferredFact(
                    predicate="affords",
                    subject=tool_id,
                    object=action,
                    rule_id="INF002",
                    confidence=round(derived_conf, 4),
                    supporting_facts=[],
                    source_provenances=[
                        {
                            "type": "interaction",
                            "interaction_id": interaction.get("interaction_id", ""),
                            "action": action,
                            "tool": tool_id,
                            "patient": patient,
                        }
                    ],
                )
                facts.append(fact)

        return facts

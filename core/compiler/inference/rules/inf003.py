"""
INF003 — Chain Affordance

IF
  entity_a affords action_X
  AND action_X results_in state_Y
THEN
  INFER entity_a affords state_Y (indirectly)
  WITH confidence = confidence(action_X → Y) * 0.8
"""

from typing import List
from compiler.inference.rule import Rule, RuleMetadata, InferredFact


class Inf003Rule(Rule):

    metadata = RuleMetadata(
        id="INF003",
        name="Chain Affordance",
        description="If A affords action X, and X results in state Y, then A indirectly affords Y",
        priority=30,
        deterministic=True,
    )

    def apply(self, graph) -> List[InferredFact]:
        facts = []

        # Collect all entity affordances (subject -> action)
        entity_actions = []  # (entity_id, action_name, confidence)
        for node_id, node in graph.nodes.items():
            for aff in node.properties.get("affordances", []):
                action = aff.get("action", "")
                conf = aff.get("confidence", 1.0)
                entity_actions.append((node_id, action, conf))

        # Collect all action results (action -> (state, confidence))
        action_results = []  # (action_name, state_id, confidence)
        for node_id, node in graph.nodes.items():
            for aff in node.properties.get("affordances", []):
                for outcome in aff.get("typical_outcome", []):
                    action_results.append((aff.get("action", ""), outcome, aff.get("confidence", 1.0)))

        # Also check edges for "results_in" type
        for edge in graph.edges:
            if edge.type == "results_in":
                action_results.append((edge.source, edge.target, edge.strength))

        # Chain: entity affords action AND action results_in state -> entity affords state
        for entity_id, action, ent_conf in entity_actions:
            for act_name, state_id, res_conf in action_results:
                if act_name == action:
                    # Entity affords this action, and action results in this state
                    confidence = ent_conf * res_conf * 0.8

                    fact = InferredFact(
                        predicate="affords",
                        subject=entity_id,
                        object=state_id,
                        rule_id="INF003",
                        confidence=round(confidence, 4),
                        supporting_facts=[
                            InferredFact(
                                predicate="affords",
                                subject=entity_id,
                                object=action,
                                rule_id="explicit",
                                confidence=ent_conf,
                            ),
                        ],
                        source_provenances=[
                            {
                                "type": "chain",
                                "subject": entity_id,
                                "action": action,
                                "state": state_id,
                            }
                        ],
                    )
                    facts.append(fact)

        return facts

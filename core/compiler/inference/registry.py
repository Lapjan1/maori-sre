"""
Rule Registry

Discovers and manages inference rules.
Rules are registered explicitly (not via automatic scanning) for determinism.
"""

from typing import Dict, List, Optional, Type
from compiler.inference.rule import Rule, InferredFact

# Import all rule modules so Rule subclasses are defined
from compiler.inference.rules import _import_all_rules


class RuleRegistry:
    """
    Registry of all available inference rules.
    
    Rules are ordered by priority for deterministic execution.
    """

    def __init__(self):
        self._rules: Dict[str, Rule] = {}
        self._register_defaults()

    def _register_defaults(self):
        """Register all rules discovered via rules package."""
        for rule_cls in _import_all_rules():
            instance = rule_cls()
            self._rules[instance.metadata.id] = instance

    def register(self, rule: Rule):
        if rule.metadata.id in self._rules:
            raise ValueError(f"Rule {rule.metadata.id} already registered")
        self._rules[rule.metadata.id] = rule

    def get(self, rule_id: str) -> Optional[Rule]:
        return self._rules.get(rule_id)

    def get_all(self) -> List[Rule]:
        return list(self._rules.values())

    def get_ordered(self) -> List[Rule]:
        """Return rules sorted by priority (lower = first)."""
        return sorted(self._rules.values(), key=lambda r: r.metadata.priority)

    @property
    def count(self) -> int:
        return len(self._rules)

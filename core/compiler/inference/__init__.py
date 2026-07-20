"""
SRE Inference Engine

Deterministic forward-chaining inference system.
Applies rule modules (INF001–INF100) to derive new facts from the Runtime Graph.

Architecture:
  - rule.py:    Base Rule interface, InferredFact model, ConfidenceStrategy
  - registry.py: Rule discovery and registration
  - engine.py:  Fixed-point execution engine
  - rules/:     Individual rule modules (inf001.py, inf002.py, ...)
"""

from compiler.inference.rule import Rule, RuleMetadata, InferredFact, ConfidenceStrategy, MultiplicativeConfidence
from compiler.inference.registry import RuleRegistry
from compiler.inference.engine import InferenceEngine, InferenceReport

__all__ = [
    "Rule", "RuleMetadata", "InferredFact", "ConfidenceStrategy", "MultiplicativeConfidence",
    "RuleRegistry",
    "InferenceEngine", "InferenceReport",
]

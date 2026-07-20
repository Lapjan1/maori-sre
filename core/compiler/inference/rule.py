"""
Rule Interface and Core Types

Every inference rule is an independent module implementing the Rule base class.
The engine knows nothing about individual rules — it only calls apply() and
collects InferredFact results.
"""

from dataclasses import dataclass, field
from typing import List, Optional, Dict, Any
from abc import ABC, abstractmethod


@dataclass
class RuleMetadata:
    """Self-declared metadata for an inference rule."""
    id: str                    # e.g. "INF001"
    name: str                  # e.g. "Affordance Inheritance"
    description: str           # Human-readable explanation
    priority: int = 100        # Lower = earlier execution (default: 100)
    deterministic: bool = True # Can this rule produce different results on re-run?


@dataclass
class InferredFact:
    """
    A derived fact produced by an inference rule.
    
    Facts are an intermediate representation — they are collected, deduplicated,
    and only then committed to the RuntimeGraph.
    """
    predicate: str       # e.g. "affords", "supports", "requires"
    subject: str         # e.g. "THING_001"
    object: str          # e.g. "ACTION_001"
    rule_id: str         # e.g. "INF001"
    confidence: float    # 0.0–1.0
    supporting_facts: List['InferredFact'] = field(default_factory=list)
    source_provenances: List[Dict[str, Any]] = field(default_factory=list)

    def key(self) -> tuple:
        """Unique key for deduplication."""
        return (self.predicate, self.subject, self.object, self.rule_id)

    def provenance_tree(self, indent: int = 0) -> str:
        """Render provenance as an indented tree for debugging and education."""
        prefix = "  " * indent
        lines = [
            f"{prefix}{self.subject} {self.predicate} {self.object}",
            f"{prefix}  via {self.rule_id} (confidence: {self.confidence:.3f})",
        ]
        for sf in self.supporting_facts:
            lines.append(sf.provenance_tree(indent + 2))
        return "\n".join(lines)

    def to_dict(self) -> dict:
        return {
            "predicate": self.predicate,
            "subject": self.subject,
            "object": self.object,
            "rule_id": self.rule_id,
            "confidence": self.confidence,
            "supporting_facts": [sf.to_dict() for sf in self.supporting_facts],
            "source_provenances": self.source_provenances,
        }


class ConfidenceStrategy(ABC):
    """Strategy pattern for computing confidence of inferred facts."""

    @abstractmethod
    def compute(self, source_confidences: List[float]) -> float:
        ...


class MultiplicativeConfidence(ConfidenceStrategy):
    """Confidence = product of all source confidences."""

    def compute(self, source_confidences: List[float]) -> float:
        if not source_confidences:
            return 1.0
        product = 1.0
        for c in source_confidences:
            product *= c
        return product


class Rule(ABC):
    """Base class for all inference rules."""

    metadata: RuleMetadata

    @abstractmethod
    def apply(self, graph) -> List[InferredFact]:
        """
        Apply this rule to the given RuntimeGraph.
        
        Returns a list of InferredFact objects (possibly empty).
        The engine handles deduplication and convergence.
        """
        ...

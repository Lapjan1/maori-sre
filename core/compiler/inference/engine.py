"""
Fixed-Point Inference Engine

Executes rules in priority order, iterating until no new facts are derived
or max_iterations is reached. Collects all InferredFact objects, deduplicates
them, and provides a mechanism to commit them to the RuntimeGraph.
"""

from dataclasses import dataclass, field
from typing import List, Dict, Set, Optional, Tuple
from datetime import datetime, timezone

from compiler.inference.rule import InferredFact
from compiler.inference.registry import RuleRegistry
from compiler.graph_builder import RuntimeGraph, GraphEdge
from compiler.diagnostics import DiagnosticBag
from compiler.provenance import make_provenance


@dataclass
class InferenceReport:
    """Summary of an inference run."""
    rules_executed: int = 0
    iterations: int = 0
    total_new_facts: int = 0
    duplicates_skipped: int = 0
    conflicts: int = 0
    elapsed_ms: float = 0.0
    facts: List[InferredFact] = field(default_factory=list)

    def summary(self) -> str:
        parts = [
            f"Rules executed: {self.rules_executed}",
            f"Iterations: {self.iterations}",
            f"New facts: {self.total_new_facts}",
            f"Duplicates skipped: {self.duplicates_skipped}",
        ]
        if self.conflicts:
            parts.append(f"Conflicts: {self.conflicts}")
        parts.append(f"Elapsed: {self.elapsed_ms:.0f} ms")
        return " | ".join(parts)

    def to_dict(self) -> dict:
        return {
            "rules_executed": self.rules_executed,
            "iterations": self.iterations,
            "total_new_facts": self.total_new_facts,
            "duplicates_skipped": self.duplicates_skipped,
            "conflicts": self.conflicts,
            "elapsed_ms": round(self.elapsed_ms, 1),
        }


class InferenceEngine:
    """
    Forward-chaining inference engine with fixed-point iteration.
    
    Usage:
        engine = InferenceEngine(graph, registry)
        report = engine.run()
        engine.commit()  # adds inferred facts as edges to the graph
    """

    def __init__(
        self,
        graph: RuntimeGraph,
        registry: Optional[RuleRegistry] = None,
        diagnostics: Optional[DiagnosticBag] = None,
        max_iterations: int = 10,
    ):
        self.graph = graph
        self.registry = registry or RuleRegistry()
        self.diagnostics = diagnostics or DiagnosticBag()
        self.max_iterations = max_iterations

        # Dedup tracking: set of (predicate, subject, object)
        self._known: Set[Tuple[str, str, str]] = set()
        self._facts: List[InferredFact] = []
        self._new_facts_count = 0
        self._duplicates_skipped = 0

        # Seed with existing graph edges so we don't re-derive
        self._seed_known_facts()

    def _seed_known_facts(self):
        """Pre-populate known facts from existing graph edges."""
        for edge in self.graph.edges:
            # Explicit edges are known with confidence 1.0
            self._known.add((edge.type, edge.source, edge.target))
        # Also seed affordances from nodes
        for node_id, node in self.graph.nodes.items():
            for aff in node.properties.get("affordances", []):
                action = aff.get("action", "")
                self._known.add(("affords", node_id, action))

    def _is_duplicate(self, fact: InferredFact) -> bool:
        return fact.key() in self._known

    def _add_fact(self, fact: InferredFact):
        self._facts.append(fact)
        self._known.add(fact.key())
        self._new_facts_count += 1

    def run(self) -> InferenceReport:
        """
        Execute all rules in fixed-point iteration.
        
        Returns an InferenceReport with statistics.
        """
        start = datetime.now(timezone.utc)
        rules = self.registry.get_ordered()
        report = InferenceReport()
        report.rules_executed = len(rules)

        for iteration in range(1, self.max_iterations + 1):
            iteration_new = 0

            for rule in rules:
                try:
                    new_facts = rule.apply(self.graph)
                except Exception as e:
                    self.diagnostics.warn(
                        f"INFERENCE",
                        "engine",
                        0,
                        f"Rule {rule.metadata.id} raised: {e}",
                    )
                    continue

                for fact in new_facts:
                    if self._is_duplicate(fact):
                        report.duplicates_skipped += 1
                        continue
                    self._add_fact(fact)
                    iteration_new += 1

            report.iterations = iteration

            if iteration_new == 0:
                # Converged
                break
        else:
            self.diagnostics.warn(
                "INFERENCE",
                "engine",
                0,
                f"Inference did not converge within {self.max_iterations} iterations",
            )

        elapsed = (datetime.now(timezone.utc) - start).total_seconds() * 1000
        report.total_new_facts = self._new_facts_count
        report.elapsed_ms = elapsed
        report.facts = self._facts

        return report

    def commit(self):
        """
        Commit all inferred facts as edges on the RuntimeGraph.
        
        Inferred facts are added with:
          - edge type = predicate (e.g. "affords")
          - strength = confidence
          - provenance indicating it was inferred
        """
        from compiler.provenance import Provenance
        for fact in self._facts:
            base = make_provenance(f"inferred/{fact.rule_id}", 0, fact.confidence)
            provenance = Provenance(
                source_file=base.source_file,
                source_line=base.source_line,
                compiler_version=base.compiler_version,
                timestamp=base.timestamp,
                content_hash=base.content_hash,
                confidence=base.confidence,
                inferred=True,
                inference_rule=fact.rule_id,
                supporting_facts=tuple(sf.to_dict() for sf in fact.supporting_facts),
            )

            edge = GraphEdge(
                source=fact.subject,
                type=fact.predicate,
                target=fact.object,
                strength=fact.confidence,
                properties={
                    "inferred": True,
                    "rule_id": fact.rule_id,
                    "supporting_facts": [sf.to_dict() for sf in fact.supporting_facts],
                },
                provenance=provenance,
            )
            self.graph.add_edge(edge)

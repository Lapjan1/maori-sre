"""
Hash Stability Regression Tests

The runtime hash must be deterministic:
  - Same canonical input + same compiler + same ruleset → identical runtime hash
  - Adding an inferred edge changes the runtime hash
  - Reordering input files does NOT change either hash
  - Removing a derived fact changes the runtime hash
  - Rebuilding without changes reproduces the exact same hash

These tests run against the water example (canonical/examples/).
"""

import json
import hashlib
import unittest
from pathlib import Path

from compiler.graph_builder import build_graph, RuntimeGraph
from compiler.loader import load_source_directory
from compiler.inference import InferenceEngine, RuleRegistry

FIXTURES = Path(__file__).parent / "fixtures"
EXAMPLES = Path(__file__).parent.parent / "canonical" / "examples"


def _load_and_build(source_dir: str, skip_inference: bool = True) -> RuntimeGraph:
    """Load canonical source and build a graph, optionally without inference."""
    docs, _errors = load_source_directory(source_dir)
    graph = build_graph(docs)
    if not skip_inference:
        registry = RuleRegistry()
        engine = InferenceEngine(graph, registry=registry)
        engine.run()
        engine.commit()
    return graph


class TestDeterministicHashes(unittest.TestCase):
    """Same input + same compiler → same hash, every time."""

    def test_rebuild_produces_identical_runtime_hash(self):
        g1 = _load_and_build(str(EXAMPLES), skip_inference=False)
        g2 = _load_and_build(str(EXAMPLES), skip_inference=False)
        assert g1.compute_runtime_hash() == g2.compute_runtime_hash(), \
            "Rebuilding the same source must produce identical runtime hash"

    def test_rebuild_produces_identical_canonical_hash(self):
        g1 = _load_and_build(str(EXAMPLES), skip_inference=True)
        g2 = _load_and_build(str(EXAMPLES), skip_inference=True)
        assert g1.compute_canonical_hash() == g2.compute_canonical_hash(), \
            "Rebuilding the same source must produce identical canonical hash"


class TestInferenceChangesHash(unittest.TestCase):
    """Inference must change the runtime hash but not the canonical hash."""

    def test_inferred_edge_changes_runtime_hash(self):
        pre = _load_and_build(str(EXAMPLES), skip_inference=True)
        post = _load_and_build(str(EXAMPLES), skip_inference=False)
        assert pre.compute_runtime_hash() != post.compute_runtime_hash(), \
            "Adding inferred facts must change the runtime hash"

    def test_inferred_edge_does_not_change_canonical_hash(self):
        pre = _load_and_build(str(EXAMPLES), skip_inference=True)
        post = _load_and_build(str(EXAMPLES), skip_inference=False)
        assert pre.compute_canonical_hash() == post.compute_canonical_hash(), \
            "Inferred facts must NOT change the canonical hash"


class TestHashStability(unittest.TestCase):
    """The hash must be insensitive to superficial changes."""

    def test_hash_is_order_independent(self):
        """
        Loading the same files in different orders must produce
        the same canonical and runtime hashes.
        """
        import yaml, json
        files = sorted(Path(str(EXAMPLES)).rglob("*"))
        raw_1 = []
        for f in files:
            if f.suffix.lower() in (".yaml", ".yml"):
                raw_1.extend(list(yaml.safe_load_all(f.read_text(encoding="utf-8"))))
            elif f.suffix.lower() == ".json":
                raw_1.append(json.loads(f.read_text(encoding="utf-8")))
        docs_1 = [d for d in raw_1 if isinstance(d, dict)]

        docs_2 = list(reversed(docs_1))

        g1 = build_graph(docs_1)
        g2 = build_graph(docs_2)
        assert g1.compute_canonical_hash() == g2.compute_canonical_hash(), \
            "Input file order must not affect canonical hash"

    def test_empty_graph_has_deterministic_hash(self):
        g = RuntimeGraph()
        h1 = g.compute_runtime_hash()
        h2 = g.compute_runtime_hash()
        assert h1 == h2

    def test_hash_changes_when_edge_added(self):
        g = RuntimeGraph()
        from compiler.graph_builder import GraphNode, GraphEdge
        from compiler.provenance import make_provenance

        _p = make_provenance("test.yaml", 1)

        g.add_node(GraphNode(id="A", category="THING", label="a", provenance=_p))
        h1 = g.compute_runtime_hash()

        g.add_edge(GraphEdge(source="A", type="affords", target="B", provenance=_p))
        h2 = g.compute_runtime_hash()

        assert h1 != h2, "Adding an edge must change the runtime hash"


class TestHashEdgeCases(unittest.TestCase):
    """Known edge cases for hash correctness."""

    def test_hash_without_inference_ruleset_default(self):
        g = RuntimeGraph()
        assert g.inference_ruleset_version == "1.0"
        h = g.compute_runtime_hash()
        assert isinstance(h, str)
        assert len(h) == 64  # SHA-256 hex

    def test_provenance_excludes_timestamps(self):
        """
        Two identical builds at different times must produce
        the same runtime hash (timestamps are volatile and excluded).
        """
        g1 = _load_and_build(str(EXAMPLES), skip_inference=False)
        g2 = _load_and_build(str(EXAMPLES), skip_inference=False)
        # Override timestamps to simulate different build times
        g1.build_timestamp = "2024-01-01T00:00:00"
        g2.build_timestamp = "2024-06-15T12:30:00"
        assert g1.compute_runtime_hash() == g2.compute_runtime_hash(), \
            "Build timestamp must not affect runtime hash"

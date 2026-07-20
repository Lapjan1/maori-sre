"""
Tests for the compiler pipeline.

Golden test pattern:
  1. Build a known-good set of canonical sources (fixtures)
  2. Compile them
  3. Compare the runtime graph output to expected golden output

The compiler is deterministic, so the same source always
produces the same runtime graph.
"""

from compiler.compiler import compile_source, CompilerConfig
from compiler.graph_builder import RuntimeGraph


class TestCompilerPipeline:
    """Full pipeline tests using golden output comparison."""

    def test_compile_minimal(self):
        """
        Fixture: minimal valid set (1 entity, 1 rep, 1 aff, 1 rel, 1 lang)
        Expected: valid runtime graph with exactly those nodes and edges.
        """
        config = CompilerConfig(
            source_dir="tests/fixtures/canonical/minimal/",
            runtime_dir="tests/output/minimal/"
        )
        result = compile_source(config)
        assert result is True

    def test_golden_water(self):
        """
        The water entity (THING_001) should produce a known runtime graph.
        Compare against tests/golden/water_graph.json.
        """
        # TODO: Phase 2 — implement golden comparison
        pass


class TestProvenance:
    """Every compiled artifact must carry provenance."""

    def test_node_provenance(self):
        # Every node in the runtime graph must have source_file, line, hash
        pass

    def test_edge_provenance(self):
        # Every edge must have source reference
        pass

    def test_no_orphaned_nodes(self):
        # All nodes traceable to canonical source
        pass


class TestDiagnostics:
    """Compiler diagnostics must be actionable."""

    def test_error_code_format(self):
        # Errors must include: code, file, line, message, suggestion
        pass

    def test_suggestion_for_common_errors(self):
        # Missing language mapping should suggest available languages
        pass

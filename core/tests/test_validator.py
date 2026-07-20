"""
Tests for the canonical source validator.

Each test case:
  - Input: A set of source documents (fixtures)
  - Expected: Specific validation errors or clean validation

Golden test pattern:
  - Input fixture → compile → compare output to golden file
"""

from compiler.validator import validate_source


class TestReferenceResolution:
    """Entity references must resolve to existing entities."""

    def test_valid_references(self):
        errors = validate_source("tests/fixtures/canonical/valid_refs/")
        assert len(errors) == 0

    def test_broken_reference(self):
        errors = validate_source("tests/fixtures/canonical/broken_ref/")
        # TODO: Phase 2 — expect specific E003 error
        pass

    def test_self_loop_reference(self):
        # TODO: Phase 2 — expect specific E005 error
        pass


class TestCycleDetection:
    """Relationship graphs must be acyclic."""

    def test_simple_cycle(self):
        # TODO: Phase 2 — detect is_a cycles
        pass

    def test_no_cycle(self):
        # TODO: Phase 2 — valid DAG passes
        pass


class TestContractValidation:
    """Domain contract invariants must hold."""

    def test_affordance_not_static_property(self):
        # V023: Affordance must not be a static property
        # e.g., "tree is_a plant" is a relationship, not an affordance
        pass

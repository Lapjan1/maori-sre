"""
Tests for the Canonical Source Language.

Strategy:
  - Each schema is tested against valid and invalid example documents.
  - Fixtures are in tests/fixtures/canonical/.
  - Golden outputs are in tests/golden/ (expected compiled graphs).
"""

import json
from pathlib import Path
import pytest


def load_schema(name: str) -> dict:
    path = Path(__file__).parent.parent / "canonical" / name
    with open(path) as f:
        return json.load(f)


class TestEntitySchema:
    """Validates entity.schema.json against known-good and known-bad examples."""

    def test_valid_entity(self):
        # TODO: Phase 2 — implement
        pass

    def test_invalid_entity_missing_category(self):
        # TODO: Phase 2 — implement
        pass

    def test_invalid_entity_id_format(self):
        # TODO: Phase 2 — implement
        pass


class TestRepresentationSchema:
    # TODO: Phase 2 — implement
    pass


class TestAffordanceSchema:
    # TODO: Phase 2 — implement
    pass


class TestInteractionSchema:
    # TODO: Phase 2 — implement
    pass


class TestRelationshipSchema:
    # TODO: Phase 2 — implement
    pass


class TestLanguageSchema:
    # TODO: Phase 2 — implement
    pass

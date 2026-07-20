"""
SRE Evaluation Suite

Tests for the semantic model itself, not for the compiler.
These validate that the SRE can faithfully represent reality.

Run:  python -m evaluation.narrative_compression <runtime_dir>
"""

import sys
import io

# Force UTF-8 output for all evaluation scripts
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8")

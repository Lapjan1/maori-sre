"""
SRE Compiler — Semantic Representation Engine

Transforms canonical source documents into deterministic runtime graphs.
"""

from compiler.compiler import compile_source, CompilerConfig, CompileResult
from compiler.validator import validate_source
from compiler.graph_builder import RuntimeGraph
from compiler.diagnostics import DiagnosticBag
from compiler.provenance import Provenance, make_provenance

__all__ = [
    "compile_source", "CompilerConfig", "CompileResult",
    "validate_source",
    "RuntimeGraph",
    "DiagnosticBag",
    "Provenance", "make_provenance",
]

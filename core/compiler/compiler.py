"""
SRE Compiler — Main Pipeline

Orchestrates the full build pipeline:
  1. Load → 2. Validate → 3. Build Graph → 4. Inference → 5. Write

Usage:
  from compiler.compiler import compile_source
  result = compile_source("path/to/source/", "path/to/runtime/")
"""

import json
import sys
from pathlib import Path
from typing import Optional
from dataclasses import dataclass

from compiler.validator import validate_source
from compiler.graph_builder import build_graph, RuntimeGraph
from compiler.diagnostics import DiagnosticBag
from compiler.inference import InferenceEngine, RuleRegistry, InferenceReport


@dataclass
class CompilerConfig:
    """Configuration for the compiler pipeline."""
    source_dir: str
    runtime_dir: str
    skip_validation: bool = False
    skip_inference: bool = False
    force_rebuild: bool = False
    languages: list = None

    def __post_init__(self):
        if self.languages is None:
            self.languages = ["mi", "af", "en"]


class CompileResult:
    """Result of a compilation run."""
    def __init__(self):
        self.success = False
        self.graph: Optional[RuntimeGraph] = None
        self.diagnostics: Optional[DiagnosticBag] = None
        self.output_path: Optional[str] = None
        self.graph_hash: Optional[str] = None
        self.inference_report: Optional[InferenceReport] = None


def compile_source(config: CompilerConfig) -> CompileResult:
    """
    Compile canonical source documents into a runtime graph.

    Pipeline stages:
      1. Load and validate source documents
      2. Build runtime graph from validated documents
      3. Apply inference rules to derive new facts
      4. Write runtime artifacts to disk

    Returns:
        CompileResult with success/failure, graph, diagnostics, and output path.
    """
    result = CompileResult()

    # Stage 1: Validate
    bag, documents = validate_source(config.source_dir)
    result.diagnostics = bag

    if bag.has_errors():
        bag.print_all()
        print(f"\nCompilation failed: {bag.summary()}", file=sys.stderr)
        result.success = False
        return result

    # Stage 2: Build graph
    graph = build_graph(documents)
    result.graph = graph

    if not config.skip_validation:
        warnings = [d for d in bag.diagnostics if d.severity == "warning"]
        if warnings:
            bag.print_all()

    # Stage 2.5: Inference
    if not config.skip_inference:
        registry = RuleRegistry()
        engine = InferenceEngine(graph, registry=registry, diagnostics=bag)
        report = engine.run()
        result.inference_report = report

        if report.total_new_facts > 0:
            engine.commit()

        print(f"Inference: {report.summary()}")
        if report.total_new_facts > 0:
            for fact in report.facts[:5]:
                print(f"  {fact.subject} {fact.predicate} {fact.object} [{fact.rule_id}]")
            if len(report.facts) > 5:
                print(f"  ... and {len(report.facts) - 5} more")
    else:
        print("Inference: skipped")

    # Compute both hashes
    result.graph_hash = graph.compute_runtime_hash()

    # Stage 3: Write runtime artifacts
    runtime_path = Path(config.runtime_dir)
    runtime_path.mkdir(parents=True, exist_ok=True)

    # Write graph.json
    graph_path = runtime_path / "graph.json"
    with open(graph_path, "w", encoding="utf-8") as f:
        json.dump(graph.to_dict(), f, indent=2, ensure_ascii=False)

    # Write manifest.json
    manifest = {
        "compiler_version": graph.compiler_version,
        "canonical_version": graph.canonical_version,
        "inference_ruleset_version": graph.inference_ruleset_version,
        "build_timestamp": graph.build_timestamp,
        "canonical_hash": graph.compute_canonical_hash(),
        "runtime_hash": graph.compute_runtime_hash(),
        "node_count": len(graph.nodes),
        "edge_count": len(graph.edges),
        "source_dir": config.source_dir,
        "inference": result.inference_report.to_dict() if result.inference_report else None,
    }
    manifest_path = runtime_path / "manifest.json"
    with open(manifest_path, "w", encoding="utf-8") as f:
        json.dump(manifest, f, indent=2)

    result.output_path = str(runtime_path)
    result.success = True

    print(f"\nCompilation successful: {len(graph.nodes)} nodes, {len(graph.edges)} edges")
    print(f"Graph hash: {result.graph_hash}")
    print(f"Runtime written to: {result.output_path}")

    return result

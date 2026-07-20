"""
Build River World Runtime Graph

Loads compiled experiences, builds the graph, runs inference,
and writes the runtime artifacts.
"""

import json
from pathlib import Path

from compiler.graph_builder import build_graph
from compiler.inference import InferenceEngine, RuleRegistry


def build_river_world():
    exp_dir = Path("../output/experiences")
    runtime_dir = Path("../runtime/river_world")

    all_docs = []
    for f in sorted(exp_dir.glob("*.json")):
        data = json.load(open(f, "r", encoding="utf-8"))
        eid = data.get("experience_id", f.stem)
        for key in ["entities", "affordances", "interactions", "relationships", "language_mappings"]:
            for doc in data.get(key, []):
                doc["_file"] = f.name
                doc["_line"] = 1
                doc["_source_experience"] = eid
                all_docs.append(doc)

    print(f"Total canonical documents: {len(all_docs)}")

    graph = build_graph(all_docs)
    print(f"Graph: {len(graph.nodes)} nodes, {len(graph.edges)} edges")

    registry = RuleRegistry()
    engine = InferenceEngine(graph, registry=registry)
    report = engine.run()
    if report.total_new_facts > 0:
        engine.commit()
    print(f"Inference: {report.summary()}")

    runtime_dir.mkdir(parents=True, exist_ok=True)

    manifest = {
        "compiler_version": graph.compiler_version,
        "canonical_version": graph.canonical_version,
        "inference_ruleset_version": graph.inference_ruleset_version,
        "build_timestamp": graph.build_timestamp,
        "canonical_hash": graph.compute_canonical_hash(),
        "runtime_hash": graph.compute_runtime_hash(),
        "node_count": len(graph.nodes),
        "edge_count": len(graph.edges),
        "source_dir": str(exp_dir),
        "inference": {
            "rules_executed": report.rules_executed,
            "iterations": report.iterations,
            "total_new_facts": report.total_new_facts,
            "duplicates_skipped": report.duplicates_skipped,
        },
    }

    with open(runtime_dir / "manifest.json", "w", encoding="utf-8") as f:
        json.dump(manifest, f, indent=2)

    with open(runtime_dir / "graph.json", "w", encoding="utf-8") as f:
        json.dump(graph.to_dict(), f, indent=2, ensure_ascii=False)

    print(f"\nRuntime written to {runtime_dir}")
    print(f"Canonical hash: {manifest['canonical_hash']}")
    print(f"Runtime hash:   {manifest['runtime_hash']}")
    print(f"Nodes: {manifest['node_count']}, Edges: {manifest['edge_count']}")

    # Compute reuse metrics
    all_entities = set()
    all_refs = set()
    entity_exp_map = {}
    for doc in all_docs:
        if doc.get("category"):  # entity docs
            eid = doc["entity_id"]
            all_entities.add(eid)
            src = doc.get("_source_experience", "?")
            if eid not in entity_exp_map:
                entity_exp_map[eid] = []
            entity_exp_map[eid].append(src)

    reuse_counts = {e: len(exp) for e, exp in entity_exp_map.items()}
    avg_reuse = sum(reuse_counts.values()) / max(len(reuse_counts), 1)

    # Count inferred vs explicit
    explicit_facts = len(graph.edges)
    inferred_facts = sum(1 for e in graph.edges if e.properties.get("inferred", False))
    yield_pct = round(inferred_facts / max(explicit_facts, 1) * 100, 1)

    print(f"\n--- Corpus Alpha Metrics ---")
    print(f"Entities: {len(all_entities)}")
    print(f"Explicit edges: {explicit_facts - inferred_facts}")
    print(f"Inferred edges: {inferred_facts}")
    print(f"Total edges: {explicit_facts}")
    print(f"Inference yield: {yield_pct}%")
    print(f"Avg entity reuse: {avg_reuse:.1f} experiences")

    # Semantic density across experiences
    for f in sorted(exp_dir.glob("*.json")):
        data = json.load(open(f, "r", encoding="utf-8"))
        print(f"  {data['experience_id']}: {data['semantic_density']} density, {data['reuse_ratio']} reuse, {len(data['entities'])} entities")

    return manifest


if __name__ == "__main__":
    build_river_world()

"""
Build River World App — Full Pipeline

1. Compile experiences from YAML to JSON
2. Build Runtime Graph with inference
3. Bundle experiences into app JS
4. Copy assets
"""

import sys, os, json
from pathlib import Path

ROOT = Path(__file__).parent.parent
CORE = ROOT / "core"

sys.path.insert(0, str(CORE))

def step(label):
    print(f"\n=== {label} ===")

def main():
    # Step 1: Compile experiences
    step("Compile experiences")
    from compiler.experience import compile_all_experiences
    exps_dir = ROOT / "experiences" / "river_world"
    out_dir = ROOT / "output" / "experiences"
    results = compile_all_experiences(str(exps_dir), str(out_dir))
    ok = sum(1 for r in results if r.success)
    print(f"  {ok}/{len(results)} compiled")

    # Step 2: Build runtime graph with inference
    step("Build Runtime Graph")
    from compiler.graph_builder import build_graph
    from compiler.inference import InferenceEngine, RuleRegistry

    all_docs = []
    for f in sorted(out_dir.glob("*.json")):
        data = json.load(open(f, "r", encoding="utf-8"))
        eid = data.get("experience_id", f.stem)
        for key in ["entities", "affordances", "interactions", "relationships", "language_mappings"]:
            for doc in data.get(key, []):
                doc["_file"] = f.name
                doc["_line"] = 1
                doc["_source_experience"] = eid
                all_docs.append(doc)

    graph = build_graph(all_docs)
    registry = RuleRegistry()
    engine = InferenceEngine(graph, registry=registry)
    report = engine.run()
    if report.total_new_facts > 0:
        engine.commit()

    runtime_dir = ROOT / "runtime" / "river_world"
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

    print(f"  {len(graph.nodes)} nodes, {len(graph.edges)} edges")
    print(f"  Hash: {manifest['runtime_hash'][:12]}...")
    print(f"  Inferred: {report.total_new_facts} facts")

    # Step 3: Bundle experiences for app
    step("Bundle app experiences")
    app_dir = ROOT / "apps" / "river_world"
    app_dir.mkdir(parents=True, exist_ok=True)

    experiences = []
    for f in sorted(out_dir.glob("*.json")):
        data = json.load(open(f, "r", encoding="utf-8"))
        experiences.append({
            "id": data["experience_id"],
            "type": data["type"],
            "level": data["level"],
            "title": data["title"],
            "content": data["content"],
            "entities": [
                {"id": e["entity_id"], "category": e["category"], "label": e.get("label", {})}
                for e in data.get("entities", [])
            ],
            "interactions": [
                {"id": i.get("interaction_id", f"INT_{n}"), "sentences": i.get("sentences", {}), "action": i.get("action", "")}
                for n, i in enumerate(data.get("interactions", []))
            ],
        })

    js = "const EXPERIENCES = " + json.dumps(experiences, indent=2, ensure_ascii=False) + ";"
    with open(app_dir / "experiences.js", "w", encoding="utf-8") as f:
        f.write(js)

    print(f"  Bundled {len(experiences)} experiences")

    # Step 4: Copy audio/images if they exist
    step("Done")
    print(f"  App ready: {app_dir}")
    print(f"  Serve: python -m http.server 8080 --directory {app_dir}")
    print(f"  Or open index.html directly from file system")

if __name__ == "__main__":
    main()

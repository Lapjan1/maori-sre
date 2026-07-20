"""
Print Corpus Alpha metrics from the compiled runtime.
"""

import json
from pathlib import Path


graph = json.load(open("../runtime/river_world/graph.json", "r", encoding="utf-8"))
manifest = json.load(open("../runtime/river_world/manifest.json", "r", encoding="utf-8"))

nodes = graph["nodes"]
edges = graph["edges"]
inf_edges = [e for e in edges if e.get("properties", {}).get("inferred")]
exp_edges = [e for e in edges if not e.get("properties", {}).get("inferred")]

# Categorize nodes
cats = {}
for n in nodes:
    c = n["category"]
    cats[c] = cats.get(c, 0) + 1

# Categorize inferred edges by rule
rules = {}
for e in inf_edges:
    r = e["properties"].get("rule_id", "?")
    rules[r] = rules.get(r, 0) + 1

print("=== Corpus Alpha — River World ===")
print()
print("Build:")
print(f"  Canonical hash: {manifest['canonical_hash']}")
print(f"  Runtime hash:   {manifest['runtime_hash']}")
print()
print("Nodes:")
for c, n in sorted(cats.items()):
    print(f"  {c}: {n}")
print(f"  Total: {len(nodes)}")
print()
print("Edges:")
print(f"  Explicit: {len(exp_edges)}")
print(f"  Inferred: {len(inf_edges)}")
print(f"  Total:    {len(edges)}")
print()
print("Inference:")
print(f"  Yield: {len(inf_edges)}/{len(edges)} = {len(inf_edges)/max(len(edges),1)*100:.0f}%")
for r, n in sorted(rules.items()):
    print(f"  {r}: {n} facts")
print()
print("Inferred facts:")
for e in sorted(inf_edges, key=lambda x: x["source"]):
    src = e["source"]
    tgt = e["target"]
    rid = e["properties"]["rule_id"]
    conf = e["strength"]
    src_label = next((n["label"] for n in nodes if n["id"] == src), src)
    tgt_label = next((n["label"] for n in nodes if n["id"] == tgt), tgt)
    print(f"  {src_label} ({src}) -- {e['type']} --> {tgt_label} ({tgt})  [{rid}, conf={conf}]")

print()
print("Experiences:")
exp_dir = Path("../output/experiences")
for f in sorted(exp_dir.glob("*.json")):
    exp = json.load(open(f, "r", encoding="utf-8"))
    eid = exp["experience_id"]
    etype = exp["type"]
    nents = len(exp["entities"])
    density = exp["semantic_density"]
    ninters = len(exp.get("interactions", []))
    nrels = len(exp.get("relationships", []))
    naffs = len(exp.get("affordances", []))
    print(f"  {eid} [{etype}]: {nents} entities, {ninters} interactions, {nrels} relationships, {naffs} affordances, density={density}")

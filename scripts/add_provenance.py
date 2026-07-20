"""Update audio_refs in surface_forms.yaml: rename package and add provenance."""
import sys, io
from pathlib import Path
import yaml

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace")

ROOT = Path(__file__).parent.parent
YAML_PATH = ROOT / "experiences" / "river_world" / "surface_forms.yaml"
RESULTS_PATH = ROOT / "scripts" / "teaka_results.json"

import json
with open(RESULTS_PATH, encoding="utf-8") as f:
    results = json.load(f)

with open(YAML_PATH, encoding="utf-8") as f:
    data = yaml.safe_load(f)

updated = 0
for entry in data.get("surface_forms", []):
    if entry.get("lang") != "mi":
        continue
    pron = entry.get("pronunciation")
    if not pron:
        continue
    refs = pron.get("audio_refs")
    if not refs:
        continue
    for ref in refs:
        word = entry["text"]
        info = results.get(word)
        word_id = info.get("word_id") if info else None

        ref["package"] = "mi_teaka_v1"
        if word_id:
            ref["source_url"] = f"https://maoridictionary.co.nz/word/{word_id}"
        ref["retrieved"] = "2026-07-20"
        ref["source_license"] = "Copyright John C Moorfield / Te Aka Māori Dictionary — educational use"

    updated += 1

with open(YAML_PATH, "w", encoding="utf-8") as f:
    yaml.dump(data, f, allow_unicode=True, default_flow_style=False, sort_keys=False)

print(f"Updated {updated} surface forms")

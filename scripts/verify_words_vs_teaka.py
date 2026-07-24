"""Verify every YAML word_id maps to the correct headword on Te Aka."""
import re, yaml, json, time
from pathlib import Path
from urllib.request import urlopen, Request
from urllib.error import URLError

ROOT = Path(__file__).parent.parent

# Load YAML
yaml_file = ROOT / "experiences/river_world/surface_forms.yaml"
with open(yaml_file, encoding="utf-8") as f:
    data = yaml.safe_load(f)

# Build lookup: word_id -> expected text(s)
entries = {}
for entry in data["surface_forms"]:
    if entry["lang"] != "mi":
        continue
    pron = entry.get("pronunciation") or {}
    for ar in pron.get("audio_refs") or []:
        src = ar.get("source_url", "")
        m = re.search(r'/word/(\d+)$', src)
        if not m:
            continue
        wid = int(m.group(1))
        entries.setdefault(wid, []).append({
            "sf_id": entry["id"],
            "entity_id": entry["entity_id"],
            "expected": entry["text"],
        })

ok = 0
mismatches = []
for wid in sorted(entries):
    url = f"https://maoridictionary.co.nz/word/{wid}"
    req = Request(url, headers={"User-Agent": "Mozilla/5.0"})
    try:
        with urlopen(req, timeout=15) as resp:
            html = resp.read().decode("utf-8")
    except URLError as e:
        mismatches.append((wid, None, f"FETCH FAILED: {e}"))
        time.sleep(1)
        continue

    # Extract headword from <title>: "{headword} - Te Aka ..."
    title_m = re.search(r'<title>(.*?)</title>', html, re.DOTALL)
    if not title_m:
        mismatches.append((wid, None, "NO TITLE TAG"))
        time.sleep(0.5)
        continue
    title_text = title_m.group(1)
    headword = title_text.split(" - Te Aka")[0].strip()

    for info in entries[wid]:
        expected = info["expected"]
        if headword.lower() == expected.lower():
            ok += 1
        else:
            mismatches.append((wid, headword, expected, info))
    time.sleep(0.5)

# Write results to file (avoid console encoding issues)
results_path = ROOT / "scripts" / "verify_words_results.txt"
with open(results_path, "w", encoding="utf-8") as f:
    f.write(f"Verified: {ok} correct\n")
    f.write(f"Mismatches: {len(mismatches)}\n\n")
    if mismatches:
        f.write("=== MISMATCHES ===\n")
        for item in mismatches:
            if len(item) == 4:
                wid, actual, expected, info = item
                f.write(f"word/{wid}: Te Aka says '{actual}' but YAML expects '{expected}' (sf={info['sf_id']}, entity={info['entity_id']})\n")
            else:
                wid, _, msg = item
                f.write(f"word/{wid}: {msg}\n")

print(f"Done. Results written to scripts/verify_words_results.txt")
print(f"  Correct: {ok}")
print(f"  Mismatches: {len(mismatches)}")

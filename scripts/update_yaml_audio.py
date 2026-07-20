"""
Update surface_forms.yaml with audio_refs from Te Aka download results.
Also rename audio files with spaces in names.
"""
import json, os, shutil, io, sys
from pathlib import Path
import yaml

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace")

ROOT = Path(__file__).parent.parent
YAML_PATH = ROOT / "experiences" / "river_world" / "surface_forms.yaml"
AUDIO_DIR = ROOT / "experiences" / "river_world" / "voices" / "mi_placeholder_v1" / "audio"
RESULTS_PATH = ROOT / "scripts" / "teaka_results.json"

with open(RESULTS_PATH, encoding="utf-8") as f:
    results = json.load(f)

# Build sf_id -> audio_filename mapping
sf_audio = {}
for word, info in results.items():
    if not info.get("word_id"):
        continue
    orig_fname = f"{word}.mp3"
    new_fname = orig_fname.replace(" ", "_")
    orig_path = AUDIO_DIR / orig_fname
    new_path = AUDIO_DIR / new_fname

    if orig_path.exists() and orig_fname != new_fname:
        if new_path.exists():
            os.remove(new_path)
        print(f"Renaming: {orig_fname} -> {new_fname}")
        shutil.move(str(orig_path), str(new_path))

    if new_path.exists():
        audio_filename = new_fname
    elif orig_path.exists():
        audio_filename = orig_fname
    else:
        print(f"Audio file not found for: {word}")
        continue

    for sf_id in info["sf_ids"]:
        sf_audio[sf_id] = {
            "ref": audio_filename,
            "package": "mi_placeholder_v1",
            "speaker": "Te Aka Māori Dictionary",
            "dialect": "Standard",
            "quality": "field",
            "speed": "normal",
        }

# Read YAML
with open(YAML_PATH, encoding="utf-8") as f:
    content = f.read()

data = yaml.safe_load(content)

updated = 0
no_audio = []
for entry in data.get("surface_forms", []):
    if entry.get("lang") != "mi":
        continue
    sf_id = entry["id"]
    if sf_id in sf_audio:
        audio_ref = sf_audio[sf_id]
        if "pronunciation" not in entry or entry["pronunciation"] is None:
            entry["pronunciation"] = {}
        pron = entry["pronunciation"]
        if "audio_refs" not in pron:
            pron["audio_refs"] = []
        pron["audio_refs"].append(audio_ref)
        updated += 1
    else:
        no_audio.append(sf_id)
        print(f"No audio for {sf_id} ({entry['text']})")

# Write YAML back
with open(YAML_PATH, "w", encoding="utf-8") as f:
    yaml.dump(data, f, allow_unicode=True, default_flow_style=False, sort_keys=False)

print(f"\nUpdated {updated} surface forms with audio_refs")
if no_audio:
    print(f"Skipped (no audio): {', '.join(no_audio)}")

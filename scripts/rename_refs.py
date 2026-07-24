"""Update all audio refs in surface_forms.js files to use word_id filenames."""
import re, sys
from pathlib import Path

ROOT = Path(__file__).parent.parent

def update_refs(filepath):
    path = Path(filepath)
    text = path.read_text(encoding="utf-8")

    # Find all ref → source_url pairs
    pattern = r'"ref": "(\w+)\.mp3".*?"source_url": "https://maoridictionary\.co\.nz/word/(\d+)"'
    matches = re.findall(pattern, text, re.DOTALL)

    if not matches:
        print(f"No ref/source_url pairs found in {filepath}")
        return

    replacements = {}
    for name, wid in matches:
        old = f'"ref": "{name}.mp3"'
        new = f'"ref": "{wid}.mp3"'
        replacements[old] = new

    count = 0
    for old, new in replacements.items():
        if old in text:
            text = text.replace(old, new)
            count += 1

    path.write_text(text, encoding="utf-8")
    print(f"  {count} replacements in {filepath}")

for fname in [
    "packages/language-data/surface_forms.js",
    "docs/packages/language-data/surface_forms.js",
]:
    fp = ROOT / fname
    if fp.exists():
        print(f"Processing {fname}:")
        update_refs(fp)
    else:
        print(f"Not found: {fname}")

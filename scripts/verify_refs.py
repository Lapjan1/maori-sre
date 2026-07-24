"""Verify audio refs match their source_url word_ids."""
import re
from pathlib import Path

path = Path(__file__).parent.parent / "packages/language-data/surface_forms.js"
text = path.read_text(encoding="utf-8")

pattern = r'"ref": "(\d+\.mp3)".*?"source_url": "https://maoridictionary\.co\.nz/word/([^"]+)"'
matches = re.findall(pattern, text, re.DOTALL)
bad = 0
for ref, wid in matches:
    fid = ref.replace(".mp3", "")
    if fid != wid:
        print(f"  MISMATCH: ref={ref} but word={wid}")
        bad += 1
if bad == 0:
    print("All refs match their source_url word_ids.")
else:
    print(f"{bad} mismatches found.")

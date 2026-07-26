"""
Acquire missing Māori MP3 audio from Te Aka CDN.

Reads audio_index.js, checks which MP3s are missing on disk,
and downloads them from Google Cloud Storage.
"""
import re, json, sys, os, io, time, urllib.request, urllib.error
from pathlib import Path

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

root = Path(__file__).resolve().parent.parent
os.chdir(root)

AUDIO_DIR = root / 'docs' / 'voices' / 'mi_teaka_v1' / 'audio'
AUDIO_DIR.mkdir(parents=True, exist_ok=True)

CDN = 'https://storage.googleapis.com/maori-dictionary-prod2-web-assets/public/{word_id}.mp3'

def fix_json(s):
    s = re.sub(r'/\*.*?\*/', '', s, flags=re.DOTALL)
    s = re.sub(r'//[^\n]*', '', s)
    return re.sub(r',(\s*[\]}])', r'\1', s)

def extract_balanced(s, start, open_ch='{', close_ch='}'):
    depth = 0; in_str = False; escape = False
    for i in range(start, len(s)):
        ch = s[i]
        if escape: escape = False; continue
        if ch == '\\' and in_str: escape = True; continue
        if ch == '"' and not escape: in_str = not in_str; continue
        if in_str: continue
        if ch == open_ch:
            if depth == 0: obj_start = i
            depth += 1
        elif ch == close_ch:
            depth -= 1
            if depth == 0: return s[obj_start:i+1]
    return None

# Load audio_index.js
with open('packages/language-data/audio_index.js', 'r', encoding='utf-8') as f:
    c = fix_json(f.read())

entries = []
for m in re.finditer(r'"((?:[^"\\]|\\.)+)"\s*:\s*\{', c):
    word = m.group(1)
    start = m.end() - 1
    obj = extract_balanced(c, start)
    if obj:
        try:
            entry = json.loads(obj)
            wid = entry.get('word_id', '')
            if wid and re.match(r'^\d+$', wid):
                entries.append({'word': word, 'word_id': wid})
        except:
            pass

print(f'Found {len(entries)} entries in audio_index.js')

downloaded = 0
skipped = 0
errors = 0

for i, e in enumerate(entries):
    wid = e['word_id']
    dest = AUDIO_DIR / f'{wid}.mp3'

    if dest.exists() and dest.stat().st_size > 0:
        skipped += 1
        continue

    url = CDN.format(word_id=wid)
    print(f'[{i+1}/{len(entries)}] {e["word"]} → {wid}.mp3', end='')
    try:
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
        with urllib.request.urlopen(req, timeout=30) as resp:
            data = resp.read()
        with open(dest, 'wb') as f:
            f.write(data)
        print(f' ✓ ({len(data)} bytes)')
        downloaded += 1
    except Exception as ex:
        print(f' ✗ {ex}')
        errors += 1
    time.sleep(0.3)

print(f'\nDone: {downloaded} downloaded, {skipped} already exist, {errors} errors')

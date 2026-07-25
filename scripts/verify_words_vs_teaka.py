"""
Full Māori word audit: extract every unique word from experience text,
find its word_id, verify against live Te Aka, check MP3 on disk.
Exits non-zero if mismatches or unresolved NO_IDs remain (CI mode).

Usage:
  python scripts/verify_words_vs_teaka.py           # interactive
  python scripts/verify_words_vs_teaka.py --ci       # exit 1 on issues
"""
import re, json, sys, os, time, urllib.request, urllib.error
from pathlib import Path

CI_MODE = '--ci' in sys.argv

sys.stdout.reconfigure(encoding='utf-8')
root = Path(__file__).resolve().parent.parent
os.chdir(root)

def fix_json(s):
    s = re.sub(r'/\*.*?\*/', '', s, flags=re.DOTALL)
    s = re.sub(r'//[^\n]*', '', s)
    return re.sub(r',(\s*[\]}])', r'\1', s)

def extract_balanced(s, start, open_ch='{', close_ch='}'):
    depth = 0
    in_str = False
    escape = False
    for i in range(start, len(s)):
        ch = s[i]
        if escape:
            escape = False
            continue
        if ch == '\\' and in_str:
            escape = True
            continue
        if ch == '"' and not escape:
            in_str = not in_str
            continue
        if in_str:
            continue
        if ch == open_ch:
            if depth == 0:
                obj_start = i
            depth += 1
        elif ch == close_ch:
            depth -= 1
            if depth == 0:
                return s[obj_start:i+1]
    return None

# ── 1. Load experiences ──
with open('packages/language-data/experiences.js', 'r', encoding='utf-8') as f:
    c = f.read()
m = re.search(r'var EXPERIENCES = ', c)
arr = extract_balanced(c, m.end(), '[', ']')
experiences = json.loads(fix_json(arr))
print(f'Loaded {len(experiences)} experiences')

# ── 2. Audio index: word -> word_id ──
audio_index = {}
with open('packages/language-data/audio_index.js', 'r', encoding='utf-8') as f:
    c = fix_json(f.read())
for m in re.finditer(r'"((?:[^"\\]|\\.)+)"\s*:\s*\{', c):
    word = m.group(1)
    start = m.end() - 1
    obj = extract_balanced(c, start)
    if obj:
        try:
            entry = json.loads(obj)
            wid = entry.get('word_id', '')
            if wid:
                audio_index[word.lower()] = {
                    'word_id': str(wid),
                    'filename': entry.get('filename', '')
                }
        except:
            pass
print(f'Audio index entries: {len(audio_index)}')

# ── 3. Surface form word -> word_id (from audio_ref filenames) ──
sf_word_ids = {}
with open('packages/language-data/surface_forms.js', 'r', encoding='utf-8') as f:
    c = f.read()

for m in re.finditer(r'"id":\s*"(SF_MI_\w+)"', c):
    sf_id = m.group(1)
    start = m.start()
    end = c.find('},', start)
    if end == -1:
        end = c.find('}', start + 5) + 1
    else:
        end = end + 1
    block = c[start:end]
    tm = re.search(r'"text":\s*"([^"]*)"', block)
    if not tm:
        continue
    word = tm.group(1).lower()
    rm = re.findall(r'"ref":\s*"(\d+)\.mp3"', block)
    if rm:
        sf_word_ids[word] = rm[0]

print(f'Surface form word->ID mappings: {len(sf_word_ids)}')

# ── 4. Extract all unique Māori words from experience text ──

def tokenize_maori(text):
    return re.findall(r"[a-zāēīōūÄËÏÖÜ]+", text.lower())

all_words = {}
word_sources = {}

for exp in experiences:
    eid = exp.get('id', '')
    content = exp.get('content', {})
    mi_text = content.get('mi', '')
    if not mi_text:
        continue
    for sent in mi_text.split('\n'):
        sent = sent.strip()
        if not sent:
            continue
        for tok in tokenize_maori(sent):
            if tok not in all_words:
                all_words[tok] = {'count': 0, 'sources': []}
            all_words[tok]['count'] += 1
            if len(all_words[tok]['sources']) < 3:
                all_words[tok]['sources'].append((eid, sent.strip()))

words_sorted = sorted(all_words.keys())
print(f'Unique Māori words in text: {len(words_sorted)}')

def fetch_teaka(word_id):
    url = f'https://maoridictionary.co.nz/word/{word_id}'
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
    try:
        with urllib.request.urlopen(req, timeout=15) as resp:
            html = resp.read().decode('utf-8')
    except urllib.error.URLError:
        return None, 'FETCH_FAIL'
    title_m = re.search(r'<title>(.*?)</title>', html, re.DOTALL)
    if not title_m:
        return None, 'NO_TITLE'
    headword = title_m.group(1).split(' - Te Aka')[0].strip()
    return headword, None

def normalize(w):
    s = w.lower().replace('ā','a').replace('ē','e').replace('ī','i').replace('ō','o').replace('ū','u')
    parts = re.split(r'[,;:]', s)
    if len(parts) > 1 and all(p.strip() == parts[0].strip() for p in parts):
        s = parts[0]
    return re.sub(r'[^a-z]', '', s)

print()
HDR = f"{'Word':22s} {'Cnt':4s} {'WordID':8s} {'Te Aka Headword':30s} {'Status':14s} {'MP3':6s} {'Sources'}"
print('=' * 130)
print('Māori Word Audit')
print(HDR)
print('-' * 130)

results = {'ok': 0, 'mismatch': 0, 'no_id': 0, 'unverified': 0}
teaka_checks = 0

for word in words_sorted:
    info = all_words[word]
    freq = info['count']
    sources = ', '.join(set(s[0] for s in info['sources']))

    word_id = '—'
    headword = '—'
    status = 'NO_ID'
    mp3 = '—'

    if word in sf_word_ids:
        word_id = sf_word_ids[word]
    if word_id == '—':
        norm = normalize(word)
        if norm in audio_index:
            word_id = audio_index[norm]['word_id']

    if word_id != '—':
        mp3_path = f'docs/voices/mi_teaka_v1/audio/{word_id}.mp3'
        if os.path.exists(mp3_path):
            mp3 = 'YES'

        if teaka_checks < 120:
            actual, err = fetch_teaka(word_id)
            teaka_checks += 1
            if err:
                status = 'FETCH_ERR'
            elif actual:
                headword = actual[:28]
                nw = normalize(word)
                na = normalize(actual)
                if nw == na:
                    if word.lower() != actual.lower():
                        status = 'OK(macron)'
                    else:
                        status = 'OK'
                    results['ok'] += 1
                else:
                    status = 'MISMATCH'
                    results['mismatch'] += 1
            time.sleep(0.35)
        else:
            status = 'UNVERIFIED'
            results['unverified'] += 1
    else:
        results['no_id'] += 1

    print(f'{word:22s} {freq:4d} {word_id:8s} {headword:30s} {status:14s} {mp3:6s} {sources[:50]}')

print('=' * 130)
total = len(words_sorted)
print(f'Total words: {total}')
print(f'  Verified:       {results["ok"]} ({results["ok"]/total*100:.0f}%)')
print(f'  Mismatch:       {results["mismatch"]}')
print(f'  No word_id:     {results["no_id"]}')
print(f'  Unverified:     {results["unverified"]}')
print()

# Words without IDs — list them
no_id = [(w, all_words[w]) for w in words_sorted if w not in sf_word_ids and normalize(w) not in audio_index]
if no_id:
    print(f'Words with NO word_id ({len(no_id)}):')
    for w, info in no_id:
        exps = ', '.join(set(s[0] for s in info['sources']))
        print(f'  "{w}" in {exps}')

# Words with mismatches — deeper check
print(f'\nChecking mismatches in detail...')
mismatches_found = []
for word in words_sorted:
    word_id = '—'
    if word in sf_word_ids:
        word_id = sf_word_ids[word]
    if word_id == '—':
        norm = normalize(word)
        if norm in audio_index:
            word_id = audio_index[norm]['word_id']
    if word_id != '—':
        actual, err = fetch_teaka(word_id)
        teaka_checks += 1
        if not err and actual:
            if normalize(word) != normalize(actual):
                mismatches_found.append((word, word_id, actual))
        time.sleep(0.35)
        if teaka_checks >= 200:
            break

if mismatches_found:
    print(f'\nMISMATCHES ({len(mismatches_found)}):')
    for w, wid, actual in mismatches_found:
        print(f'  "{w}" → word/{wid} → Te Aka says "{actual}"')
else:
    print('No mismatches found.')

# Entity labels not in text
print(f'\nEntity Māori labels not checked (multi-word phrases):')
entity_words = set()
for exp in experiences:
    for ent in exp.get('entities', []):
        labels = ent.get('label', {})
        mi = labels.get('mi', '')
        if mi:
            for tok in tokenize_maori(mi):
                entity_words.add(tok)
text_words = set(all_words.keys())
only_in_entities = entity_words - text_words
if only_in_entities:
    for w in sorted(only_in_entities):
        print(f'  "{w}"')

# ── Classification summary ──
print()
print('=' * 70)
print('CLASSIFICATION SUMMARY')
print('=' * 70)
classified_no_id = {
    'name': 'English placeholder [name], not a Māori word',
    'whakakīia': "derived passive form of whakakī (9519) — resolved via StoryAudioResolver",
}
unresolved_no_id = [w for w, _ in no_id if w not in classified_no_id]
if no_id:
    for w, _ in no_id:
        note = classified_no_id.get(w, 'UNRESOLVED')
        print(f'  NO_ID: "{w}" → {note}')

real_issues = mismatches_found + [(w, '', '') for w, _ in no_id if w not in classified_no_id]
print(f'  → {len(real_issues)} real issue(s) remain: {len(mismatches_found)} mismatch(es) + {len(unresolved_no_id)} unresolved NO_ID')

# ── CI exit code ──
if CI_MODE:
    if real_issues:
        print(f'\n⚠  CI FAILURE: {len(real_issues)} issue(s) remain')
        sys.exit(1)
    else:
        print(f'\n✓  CI PASS')
        sys.exit(0)

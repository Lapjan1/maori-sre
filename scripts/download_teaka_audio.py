"""
Download Māori audio clips from Te Aka Māori Dictionary.

For each unique Māori surface form in surface_forms.yaml:
1. Search Te Aka (maoridictionary.co.nz)
2. Find the word entry matching our word
3. Extract the word ID from the audio element
4. Download the MP3 from Google Cloud Storage

Output:
- MP3 files in experiences/river_world/voices/mi_placeholder_v1/audio/
- results.json mapping: word -> {word_id, entity_ids, audio_path, status}
"""

import json, sys, time, re, io
from pathlib import Path

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace")

import requests
from bs4 import BeautifulSoup

ROOT = Path(__file__).parent.parent
YAML_PATH = ROOT / "experiences" / "river_world" / "surface_forms.yaml"
VOICE_DIR = ROOT / "experiences" / "river_world" / "voices" / "mi_placeholder_v1"
AUDIO_DIR = VOICE_DIR / "audio"
RESULTS_PATH = ROOT / "scripts" / "teaka_results.json"

TE_AKA_SEARCH = "https://maoridictionary.co.nz/search"
GCS_AUDIO = "https://storage.googleapis.com/maori-dictionary-prod2-web-assets/public/{word_id}.mp3"

DELAY = 1.5


def parse_yaml_simple(path):
    """Minimal YAML parser - extract only the fields we need."""
    import yaml
    with open(path, encoding="utf-8") as f:
        data = yaml.safe_load(f)

    mi_words = {}
    for entry in data.get("surface_forms", []):
        if entry.get("lang") == "mi":
            text = entry["text"]
            eid = entry["entity_id"]
            sf_id = entry["id"]
            if text not in mi_words:
                mi_words[text] = {"entity_ids": {}, "sf_ids": {}}
            mi_words[text]["entity_ids"][eid] = True
            mi_words[text]["sf_ids"][sf_id] = True
    return mi_words, data


def search_teaka(word):
    """Search Te Aka Māori Dictionary and return BeautifulSoup of results page."""
    params = {"keywords": word}
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
    }
    resp = requests.get(TE_AKA_SEARCH, params=params, headers=headers, timeout=15)
    resp.raise_for_status()
    return BeautifulSoup(resp.text, "html.parser")


def extract_word_entries(soup):
    """Extract word entries from search results page.

    Returns list of dicts: {title, word_id, audio_url}
    """
    entries = []
    for section in soup.find_all("section", class_="word-def"):
        h2 = section.find("h2", class_="title")
        if not h2:
            continue
        title = h2.get_text(strip=True)

        audio = section.find("audio")
        word_id = None
        audio_url = None
        if audio and audio.get("src"):
            src = audio["src"]
            m = re.search(r'/public/(\d+)\.mp3', src)
            if m:
                word_id = m.group(1)
                audio_url = src

        if word_id:
            entries.append({
                "title": title,
                "word_id": word_id,
                "audio_url": audio_url,
            })
    return entries


def find_matching_entry(word, entries):
    """Find the entry that exactly matches our word.

    Returns (entry, index) or (None, None) if no match.
    """
    word_lower = word.lower().strip()
    for i, entry in enumerate(entries):
        if entry["title"].lower().strip() == word_lower:
            return entry, i
    return None, None


MANUAL_OVERRIDES = {
    "wai": {"result_index": 1},  # 2nd result (water, not "who?") - 0-indexed = 1
}


def download_mp3(url, dest_path):
    """Download MP3 from URL to destination path."""
    resp = requests.get(url, timeout=30)
    resp.raise_for_status()
    with open(dest_path, "wb") as f:
        f.write(resp.content)


def main():
    AUDIO_DIR.mkdir(parents=True, exist_ok=True)

    mi_words, raw_yaml = parse_yaml_simple(YAML_PATH)
    print(f"Found {len(mi_words)} unique Māori words to look up:\n")

    results = {}

    for word_idx, (word, info) in enumerate(sorted(mi_words.items())):
        entity_ids = list(info["entity_ids"].keys())
        sf_ids = list(info["sf_ids"].keys())

        print(f"[{word_idx+1}/{len(mi_words)}] {word} (entities: {', '.join(entity_ids)})")

        override = MANUAL_OVERRIDES.get(word)

        try:
            soup = search_teaka(word)
            entries = extract_word_entries(soup)

            if not entries:
                print(f"  -> No entries with audio found on Te Aka")
                results[word] = {"word_id": None, "status": "no_entries", "entity_ids": entity_ids}
                continue

            if override is not None:
                idx = override.get("result_index", 0)
                if idx < len(entries):
                    entry = entries[idx]
                    match_type = "manual_override"
                else:
                    print(f"  -> Override index {idx} out of range ({len(entries)} entries), trying auto")
                    entry, _ = find_matching_entry(word, entries)
                    match_type = "auto_fallback"
            else:
                entry, match_idx = find_matching_entry(word, entries)
                match_type = "auto"

            if entry is None:
                # Try first entry as fallback
                print(f"  -> No exact match, using first entry: '{entries[0]['title']}'")
                entry = entries[0]
                match_type = "first_fallback"

            word_id = entry["word_id"]
            audio_url = entry["audio_url"]
            print(f"  -> Matched: '{entry['title']}' (ID: {word_id}, type: {match_type})")

            fname = f"{word}.mp3"
            dest = AUDIO_DIR / fname

            if dest.exists() and dest.stat().st_size > 0:
                print(f"  -> Already exists, skipping download")
                status = "exists"
            else:
                download_mp3(audio_url, dest)
                print(f"  -> Downloaded: {fname} ({dest.stat().st_size} bytes)")
                status = "downloaded"

            results[word] = {
                "word_id": word_id,
                "audio_url": audio_url,
                "file": f"audio/{fname}",
                "entity_ids": entity_ids,
                "sf_ids": sf_ids,
                "status": status,
                "match_type": match_type,
            }

        except Exception as e:
            print(f"  -> ERROR: {e}")
            results[word] = {"word_id": None, "status": f"error: {e}", "entity_ids": entity_ids}

        if word_idx < len(mi_words) - 1:
            time.sleep(DELAY)

    with open(RESULTS_PATH, "w", encoding="utf-8") as f:
        json.dump(results, f, indent=2, ensure_ascii=False)

    print(f"\nResults saved to {RESULTS_PATH}")
    print(f"\nSummary:")
    ok = sum(1 for v in results.values() if v.get("word_id"))
    fail = sum(1 for v in results.values() if not v.get("word_id"))
    print(f"  Success: {ok}")
    print(f"  Failed:  {fail}")
    print(f"  Total:   {len(results)}")


if __name__ == "__main__":
    main()

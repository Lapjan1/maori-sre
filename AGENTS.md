# Project Conventions

## Rule 1: Spelling Uniformity
Every Māori word must use its correct orthographic spelling — including macrons (ā, ē, ī, ō, ū) — everywhere it appears in the UI: paragraphs, sentences, word chips, hyperlinks, labels, buttons. No variation between display contexts.

### Filename convention (practical exception)
MP3 filenames use the Te Aka word_id as the filename (plain ASCII, no macrons) to avoid filesystem and URL encoding issues. Display text always uses correct Māori macrons.
- ✅ File: `1173.mp3`, Display: `hīkoi`
- ✅ File: `9019.mp3`, Display: `wai`
- ❌ If a future MP3 filename contains macrons (e.g. `mākona.mp3`), rename it to word_id (`3553.mp3`)

## Rule 2: Māori Capitalization
Follow Te Taura Whiri i te Reo Māori orthography guidelines:
- **Sentences** start with a capital letter (as in English)
- **Proper names** — people, places, tribes, organisations — always capitalised
- **Te** capitalised when first word of a name
- **Geographical features** — the common noun (maunga, awa, moana) stays lowercase after the proper name: *Taranaki maunga*, *Waikato awa*, *Taupō moana*
- **Māori** and **Pākehā** are always capitalised

## Rule 3: Reference Library Architecture

The canonical audio source is **Te Aka Māori Dictionary** (`maoridictionary.co.nz`). Every Māori word is identified by its Te Aka `word_id` — a unique numeric key.

### Reference chain
```
Te Aka word_id (e.g. 1173)
  → entity_id (e.g. ACTION_002)
  → surface_form_id (e.g. SF_MI_ACTION_002)
  → surface text (e.g. "hīkoi")
```

### Audio ref format
`audio_refs` use the Te Aka word_id as the filename:
```yaml
- ref: 1173.mp3
  package: mi_teaka_v1
  source_url: https://maoridictionary.co.nz/word/1173
```
- MP3 files on disk stored as `{word_id}.mp3` (e.g. `1173.mp3`)
- Words without a Te Aka entry use a `LOCAL_` prefix: `LOCAL_001.mp3`

### Compound decomposition
Multi-word expressions with no single Te Aka entry decompose to individual word IDs:
```
"kore matewai" → no direct entry → ["kore_id" , "matewai_id"]
```
The audio layer concatenates individual word audio. The `teaka_results.json` registry tracks word_id lookups and marks unresolved entries (`word_id: null`).

### Sentence library (`sentences.yaml`)
Defines full sentences as ordered sequences of word IDs:
```yaml
sentences:
- id: SENT_001
  lang: mi
  text: Kei te hīkoi te kurī ki te awa
  en: The dog walks to the river
  words: [1173, 3309, 563]
```
Sentence IDs follow the pattern `SENT_{experience}_{number}` (e.g. `SENT_RIVER_001`).

### Passage library (`passages.yaml`)
Groups sentence IDs into multi-sentence stories/lessons:
```yaml
passages:
- id: PASS_RIVER_001
  sentences: [SENT_RIVER_001, SENT_RIVER_002, ...]
  en: The dog walks to the river story
```
Passage IDs match the existing Afrikaans `RIVER_001`–`RIVER_010` pattern for cross-language parallelism.

### Mapping data
- `teaka_results.json` — auto-generated Te Aka word_id → entity_id → sf_id registry
- `surface_forms.yaml` — the source of truth for surface forms (word text + pronunciation + audio_refs)
- `sentences.yaml` — sentence definitions
- `passages.yaml` — passage/lesson definitions

## Rule 4: Audio Fallback Hierarchy

When playing a paragraph/passage, resolve audio as a nested fallback — only descending when the current level has no native recording:

1. **Paragraph** — full native recording (single audio for the entire passage). If unavailable:
2. **Compose from sentences** — play each sentence sequentially. For each sentence:
   - **Sentence** — full native recording for that sentence. If unavailable:
   - **Compose from words** — play each word sequentially. For each word:
     - **Word** — native word audio (via Te Aka word_id, respecting compound decomposition). If unavailable:
     - **TTS** — browser text-to-speech

A passage with partial coverage (e.g. 3 of 5 sentences have native audio) plays the available sentences natively and falls back within each missing sentence individually (sentence → words → TTS).

## Rule 5: Attribution & Error Reporting

### Audio data partner
**Te Aka Māori Dictionary** (`maoridictionary.co.nz`) is our canonical audio data partner. All MP3 audio is sourced from their CDN under educational use (Copyright John C Moorfield / Te Aka Māori Dictionary).

### Attribution
Every `audio_ref` in `surface_forms.yaml` includes `source_url`, `source_license`, and `retrieved` date. The player UI must display "Audio from Te Aka Māori Dictionary" or similar attribution.

### Error reporting upstream
If we discover an actual error in Te Aka's data (headword, pronunciation, or definition), report it via `maoridictionary.co.nz/contact`. Do not silently correct Te Aka data — report first, then track the outcome.

### Ordinary corrections
If a word_id mapping in *our* data (YAML / JS) disagrees with Te Aka, assume we are wrong first, verify against the live page, and correct our side. This was the case with `whakaki` → `whakakī` (word_id 9519): the error was a missing macron in our YAML, not in Te Aka's entry.

## Rule 6: Regression Audit

Before committing changes that add, modify, or re-map Māori words, run the audit as a regression check:

```bash
python scripts/verify_words_vs_teaka.py --ci
```

This test:
- Extracts every unique Māori word from all 30 experience texts
- Resolves each to a Te Aka word_id (via `audio_index.js` or `surface_forms.js`)
- Fetches the live Te Aka page and compares headwords
- Classifies known exceptions (`name` → placeholder, `whakakīia` → derived passive)
- Exits with code 1 if any actual mismatch or unresolved NO_ID remains

**Target:** 0 mismatches, 0 unresolved NO_ID (103/103 verified or classified).

**Current state (2026-07-24):** 101/103 direct verification, 2 explicitly classified (`name`, `whakakīia`).

---

## Progress Log

### Session 2026-07-24 — Data Consolidation & WIFE Curriculum Merge

**Objective:** Consolidate all language data files into single source of truth (`packages/language-data/`); merge CORE_20 WIFE curriculum; fix word_id audio mappings.

#### Completed
1. **6 word_id corrections** verified live vs Te Aka: kia 2583→2597, kite 4989→2722, koe 2694→2761, nui 53700→4488, pōuri 7064→5962, tēnei 8184→7927
2. **pātai word_id** fixed: was 6541 (rārangi piro/goal line) → corrected to 5343 (ask/question)
3. **77 MP3s downloaded** from Te Aka CDN for corrected + previously missing word_ids
4. **Data consolidation complete**: `audio_index.js`, `surface_forms.js`, `experiences.js`, `voice_packages.js` now load from `../../packages/language-data/` in both `apps/river-world/` and `docs/` index.html
5. **Duplicate files deleted** from `apps/river-world/` and `docs/` (local copies of audio_index.js, surface_forms.js, experiences.js, voice_packages.js, curriculum-wife.js)
6. **`curriculum-wife.js`** added to script tags; `app.js` merges CORE_20 paragraph content (replaces short exp.content with long-form paragraphs + situation)
7. **5 surface_forms macron fixes**: māoa, kāinga, tō, ngā, ōna
8. **2 NO_ID words classified**: `name` (English placeholder), `whakakīia` (derived passive)
9. **Audit CI check passes**: `python scripts/verify_words_vs_teaka.py --ci` — 101 verified, 0 mismatches, 2 classified
10. **Deploy script & sw.js updated** to reflect new file structure

#### Identified Bugs
1. **WIFE Afrikaans audio silent** — `AF_PASSAGE_WIFE_*` entries in `afrikaans-phrases.js` lack a `text` field. When `speak()` resolves the passage, it passes `undefined` as `fallbackText` to `_playNative()`. The `_highlightOnPlay` callback crashes on `undefined.toLowerCase()`, halting execution before `_playNativeWithCallback` is ever called — so no native audio plays AND no TTS fallback fires. **Fixed:** `audio.js` lines 111 & 126 now use `passage[0].text || text` and `s.text || text` to fall back to the button's original `text` parameter when the phrase entry lacks a `text` field.
2. RIVER experiences: Afrikaans native audio works correctly (118 .webm files)
3. Word chip audio works for both RIVER and WIFE (PhraseComposer composition + StoryAudioResolver)

#### Relevant Files
- `packages/language-data/audio_index.js` — single source, all word_id fixes applied
- `packages/language-data/surface_forms.js` — single source, word_id + macron fixes
- `packages/language-data/experiences.js` — single source, RIVER + WIFE experience data
- `packages/language-data/curriculum-wife.js` — CORE_20 long-form paragraphs
- `packages/language-data/voice_packages.js` — mi_teaka_v1 + af_v1 package defs
- `packages/language-data/afrikaans-phrases.js` — AF_PASSAGE_WIFE_* entries (missing `text` field)
- `apps/river-world/audio.js` — `speak()` function (fix location for bug #1)
- `apps/river-world/app.js` — CORE_20 merge logic

### Session 2026-07-25 — Recorder Refactor: Unified Source, Correct Language Display

**Objective:** Remove 4 separate source selectors from the voice-contrib recorder; use the single unified `EXPERIENCES` array; show correct target-language text (not Māori key phrase) for Phrase/Reading modes; add curriculum context for contributors.

#### Completed
1. **Removed source selector** from `apps/voice-contrib/index.html` and `docs/voice-contrib/index.html` — `river_world`, `wife_core_20`, and `af_phrases` sources replaced by single implicit EXPERIENCES source
2. **Removed `_populateSources()`**, `_onSourceChange()`, `_entityIdsForSource()` from `recorder.js`
3. **`_loadPhrases()` rewritten** — uses `EXPERIENCES` directly; derives target text from `exp.title[lang]` or primary entity label in the target language instead of the last line of content (which was always the Māori key phrase)
4. **`_loadReadings()` rewritten** — uses `EXPERIENCES` directly; shows full `exp.content[lang]` text
5. **Added `_expTargetLabel()`** helper that picks the primary entity label in the target language, falling back to title
6. **Added curriculum context to card** — new `phrase-context` element shows `exp_id · Level N · Type` so contributors know which experience they're recording for
7. **Fixed reference audio path** — `_playNative()` now tries multiple candidate paths (`../river-world/voices/...`, `../voices/...`, `../../apps/river-world/voices/...`) to work from any serving directory
8. **Updated contribution YAML** — includes `experience_id`, `experience_level` in addition to existing fields
9. **Both copies updated** — `apps/voice-contrib/` and `docs/voice-contrib/` in sync

#### Relevant Files
- `apps/voice-contrib/index.html` — removed source-selector, added phrase-context
- `apps/voice-contrib/recorder.js` — full rewrite of source-dependent functions
- `apps/voice-contrib/styles.css` — added `.phrase-context` style
- `docs/voice-contrib/index.html` — same HTML changes
- `docs/voice-contrib/recorder.js` — synced from apps copy
- `docs/voice-contrib/styles.css` — synced from apps copy

### Session 2026-07-25 — Batch Audio Index: 24 Words Added

**Objective:** Add 24 common Māori words to `audio_index.js` with correct Te Aka word_ids and native audio, reducing TTS fallback during word-by-word playback.

#### Completed
1. **Batch lookup script** found 24 word_ids by querying Te Aka search API for each word's canonical entry
2. **Corrected two wrong IDs** after manual verification:
   - `muri`: 14140 (to sigh/breeze) → **4283** (locative: after/behind) — found via search results HTML parsing
   - `whai`: 10744 (to have/possess) → **9302** (to follow/chase) — confirmed "whai muri" needs the "follow" meaning
3. **24 entries added** to `audio_index.js` in both `packages/language-data/` and `docs/packages/language-data/`:
   `ahurea`, `etahi`, `hei`, `hou`, `ina`, `iwi`, `kupu`, `mama`, `me`, `mea`, `mua`, `muri`, `neke`, `oati`, `ranei`, `tikanga`, `tino`, `tohu`, `tono`, `tonu`, `tuatahi`, `tuku`, `wa`, `whai`
4. **24 MP3s downloaded** from Te Aka CDN to both `apps/river-world/voices/` and `docs/voices/` (168 total entries, 24 new)
5. **All verified** — every entry has valid word_id, byte count, and MP3 file on disk

#### Key Lesson
The batch lookup script (search API) can return a word_id for a *different sense* of the same word (e.g., `muri` = "sigh" instead of "after"). Always verify against the live entry page when multiple meanings exist.

#### Relevant Files
- `packages/language-data/audio_index.js` — 24 new entries + byte counts
- `docs/packages/language-data/audio_index.js` — synced copy
- `apps/river-world/voices/mi_teaka_v1/audio/` — 24 new MP3s
- `docs/voices/mi_teaka_v1/audio/` — 24 new MP3s

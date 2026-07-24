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

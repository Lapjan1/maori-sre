# Architecture

## The stack in one sentence

The SRE takes a semantic model of reality, maps it into surface forms
in any number of languages, attaches pronunciations and audio, compiles
everything into a graph, and serves it to applications.

## Layers

```
Reality
    │
    ▼
Semantic Representation        core/canonical/
    │                             Entities, affordances, interactions
    │                             Language-independent.
    ▼
Surface Forms                  languages/*/surface_forms.yaml
    │                             Words, phrases, pronunciations,
    │                             audio references per language.
    ▼
Voice Packages                 languages/*/voices/
    │                             Audio recordings. One package per
    │                             speaker or source.
    ▼
Experiences                    experiences/*.yaml
    │                             Stories, dialogues, observations.
    │                             Written in one or more languages.
    ▼
Compiler                       core/compiler/
    │                             Validates, links, infers, and
    │                             produces a runtime graph.
    ▼
Runtime Graph                  core/runtime/  (or output/)
    │                             Immutable compiled artifact.
    │                             An application never reads source YAML.
    ▼
Applications                   apps/
                                  Offline PWA, dictionary browser,
                                  conversational AI, etc.
```

## What each layer does

### Semantic Representation (canonical)

This is the source of truth. It defines what exists in the world:

- **Entities** — things, places, people, actions, states
- **Categories** — how entities group (ANIMAL, PERSON, ACTION, STATE, ...)
- **Affordances** — what an entity can do or what can be done to it
- **Interactions** — reusable patterns that connect entities

This layer is language-independent. It answers the question:
*What is there, and what can happen?*

### Surface Forms

A surface form is a word or phrase in one language that represents an
entity. Every entity can have surface forms in any number of languages:

```yaml
THING_001:                   # entity
  en: water                  # English surface form
  mi: wai                    # Māori surface form
  af: water                  # Afrikaans surface form
```

Each surface form carries a Pronunciation object:

- IPA transcription (if available)
- Syllable breakdown
- Stress markers
- Audio references (pointing into voice packages)

### Voice Packages

A voice package is a bundle of audio recordings from a single source:

- **mi_teaka_v1** — 30 recordings from Te Aka Māori Dictionary
- **en_placeholder_v1** — placeholder (TTS fallback)
- **af_placeholder_v1** — placeholder (TTS fallback)

Voice packages are independent of surface forms. A surface form
references an audio file in a package. The same recording can be
referenced from any number of surface forms.

### Experiences

An experience is a structured narrative that teaches language in
context — not isolated vocabulary. Ten experiences exist so far in
the River World corpus:

- RIVER_001 — The Child Drinks Water
- RIVER_002 — Mother Gives Water to the Child
- RIVER_003 — Dog Drinks from the River
- RIVER_004 — Rain Fills the River
- RIVER_005 — Tree Grows Beside the River
- RIVER_006 — Fish Live in the River
- RIVER_007 — Family Catches a Fish
- RIVER_008 — Family Cooks the Fish
- RIVER_009 — Family Shares Food
- RIVER_010 — The Child Thanks the Mother

Each experience has:

- **Title** in all supported languages
- **Content** — connected sentences in each language
- **Entities** — the semantic entities that appear
- **Interactions** — which entity actions the learner can trigger

### Compiler

The compiler does three things:

1. **Validates** — checks canonical schemas, surface form completeness,
   audio reference integrity, graph invariants
2. **Infers** — applies inference rules (INF001–005) to derive edges
   and relationships automatically
3. **Bundles** — produces a flat runtime graph: JavaScript files for
   the PWA, JSON for API consumers, or binary for embedded devices

The compiler is the only thing that writes to the runtime layer.

### Runtime Graph

The compiled graph is immutable. Applications never read source YAML.
They consume pre-compiled bundles:

- `experiences.js` — all experiences
- `surface_forms.js` — all surface forms with index
- `voice_packages.js` — all voice packages with metadata

### Applications

The first application is an offline PWA that runs entirely in the
browser with no backend server:

- River World — Māori–English–Afrikaans learning
- Service worker caches all assets for offline use
- Audio plays from local MP3 files via voice packages
- No telemetry, no accounts, no cloud dependencies

## Data flow in one example

```
Entity:       THING_001 (water)
Canonical:    { category: THING, affordances: [can_be_drunk] }

Surface Form (mi):  wai
Pronunciation:      { syllables: [wai], audio_refs: [wai.mp3] }

Voice Package:      mi_teaka_v1/audio/wai.mp3
                   (downloaded from Te Aka Māori Dictionary)

Experience:   RIVER_001
              "Ka inu te tamaiti i te wai."
              Entity THING_001 appears as "wai" in the sentence.

Compiler:     Links THING_001 → SF_MI_THING_001 → mi_teaka_v1
              Infers edges: water is drinkable, river contains water

Runtime:      experiences.js, surface_forms.js, voice_packages.js

App:          User taps "wai" → Audio.speak("wai", "mi", "THING_001")
              → _playNative → new Audio("voices/mi_teaka_v1/audio/wai.mp3")
              → native speaker audio plays
```

## Design principles

1. **Meaning first** — Everything starts from semantics, not vocabulary.
   The engine models what things *are*, not just what they are *called*.

2. **Language-independent core** — The canonical layer has no language
   information. Languages are added as layers on top.

3. **Immutable runtime** — The compiled graph is never edited. All
   changes happen in source YAML and flow through the compiler.

4. **Provenance tracking** — Every asset carries its source. Where a
   recording came from, who recorded it, under what license.

5. **Offline-first** — The application must work without internet.
   Downloads happen once at install time.

6. **No vendor lock-in** — The runtime graph is plain data structures.
   Any application can consume it without using the SRE compiler.

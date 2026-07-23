# Co-Sense: One-Page Architecture Summary

## Core Idea

Every language-learning experience (story) is stored as a **shared semantic representation**. Languages are renderers, not translation pairs.

```
Story (shared scene)
    ↓
Semantic representation (entities + roles + relations)
    ↓
Entity model (THING, PERSON, STATE, ACTION, PLACE, PARTICLE...)
    ↓
Language renderers (en / mi / af surface forms)
    ↓
Audio layer (native recordings → TTS fallback)
```

## System Layers

| Layer | What it does | Current state |
|-------|-------------|---------------|
| **10 River World stories** | Narrative experiences with multilingual content | 49/49 sentences fully resolvable |
| **Entity model** | ~60 semantic entities across 6 types | All linked to surface forms in 3 languages |
| **Surface forms** | Orthographic text + pronunciation + audio refs per entity per language | 131 Māori words with MP3s from Te Aka |
| **Audio resolution** | Fallback chain: direct → composed → atomic → dictionary → TTS | Every sentence playable |
| **Requirement matrix** | (language × entity × voice_type) coverage status | 4 voice profiles tracked |
| **Coverage engine** | explicit / legacy / missing per voice type | Recording queues generated |
| **Contribution pipeline** | pending → validated → approved → canonical | Governs which audio is playable |
| **Acquisition planner** | 3 planners: structural / horizon / probabilistic | Predicts which word to acquire next |

## Data Flow

```
EXPERIENCE (story text)
    ↓
ENTITY EXTRACTION (who, what, where, action, state)
    ↓
SURFACE FORMS (per language: text + pronunciation + audio refs)
    ↓
COVERAGE ANALYSIS (which sentences are playable?)
    ↓
GAP ANALYSIS (which words are blocking which sentences?)
    ↓
PLANNER (structural → horizon → probabilistic → recommendation)
    ↓
ACQUISITION (download audio + create entity/SF/contribution records)
    ↓
UPDATED COVERAGE (feedback to planner via prediction ledger)
```

## Audio Resolution Chain

```
Direct native recording (AF_PHRASES)
  → Entity-level audio (surface_forms.pronunciation.audio_refs)
    → Composed audio (PhraseComposer concatenates atomic recordings)
      → Atomic sequence (StoryAudioResolver tokenizes sentences)
        → Dictionary lookup (AUDIO_INDEX fallback)
          → TTS (browser speechSynthesis)
```

Governance gate: only `approved` or `canonical` contributions are playable.

## Recording Policy (4 Voice Types)

Every surface form requires audio for all four profiles:

| Profile | Purpose |
|---------|---------|
| male_adult | Adult male voice |
| female_adult | Adult female voice |
| male_child | Child male voice |
| female_child | Child female voice |

Current: 131 Māori entries all unclassified (legacy). Needs voice-type assignment.

## Current Status

- **Coverage**: 49/49 sentences (100%), 10/10 stories
- **Audio files**: 131 Māori MP3s (Te Aka), ~50 Afrikaans WebM (Hannes)
- **Prediction record**: 17/17 accurate predictions
- **Live at**: https://lapjan1.github.io/maori-sre/

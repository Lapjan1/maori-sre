# SRE Architecture

## Core Principle: Hub-and-Spoke

Every language connects to a shared semantic representation. No direct
language-to-language pathways.

```
          English
              │
              ▼
       ┌──────────────┐
       │              │
       │    SHARED    │
       │  SEMANTIC    │
       │  REPRESENT.  │
       │              │
       └──────────────┘
          ▲    ▲    ▲
          │    │    │
     Afrikaans Māori  ...
```

Adding a new language = new spoke. No pairwise translation paths.

---

## Layers

```
┌────────────────────────────────────────────┐
│ 1. SURFACE                                 │
│    text, audio, pronunciation per language │
│    stored in: SURFACE_FORMS, AF_PHRASES    │
└────────────────────┬───────────────────────┘
                     ▼
┌────────────────────────────────────────────┐
│ 2. LINGUISTIC FUNCTION                     │
│    grammatical role of each element        │
│    e.g. "am" = state, "get" = experience   │
│    — not yet modeled —                     │
└────────────────────┬───────────────────────┘
                     ▼
┌────────────────────────────────────────────┐
│ 3. SEMANTIC INTENT                         │
│    what is being expressed                 │
│    e.g. VISIT_COLD, VISIT_KIA_ORA          │
│    stored in: experiences[].phrase_id      │
└────────────────────┬───────────────────────┘
                     ▼
┌────────────────────────────────────────────┐
│ 4. CONCEPTUAL REPRESENTATION               │
│    entities, categories, relations         │
│    e.g. PERSON ── EXPERIENCES ── COLD      │
│    stored in: entities[], semantic graph   │
└────────────────────────────────────────────┘
```

---

## Language Resolution Flow

When the user views content:

```
experience.content
    │
    ├── panel A lang → text in that language
    │   (falls back to en, then to any available)
    │
    └── panel B lang → text in that language
```

When the user plays audio:

```
phrase_id (e.g. VISIT_KIA_ORA)
    │
    ├── AF_PHRASES → find by intent → play audio_ref
    │   (for phrase-level playback)
    │
    └── SURFACE_FORMS → find by lang + entity → play audio_ref
        (for word-level playback)
```

---

## Dual-Panel UI

```
┌──────────────────────────────────────────────────────┐
│  [Lang A ▼]  [swap ⇅]  [Lang B ▼]                    │
│  ┌────────────────────┐  ┌────────────────────┐       │
│  │                    │  │                    │       │
│  │  Content in A      │  │  Content in B      │       │
│  │  (with audio ▶)    │  │  (with audio ▶)    │       │
│  │                    │  │                    │       │
│  │  Entities in A     │  │  Entities in B     │       │
│  │                    │  │                    │       │
│  └────────────────────┘  └────────────────────┘       │
└──────────────────────────────────────────────────────┘
```

Each panel independently chooses:
- display language
- audio output language (via voice package)

Swap button exchanges the two selections.

---

## Sidebar Curriculum Selector

Unchanged — sits to the left, selects which set of experiences
(River World, Wife's Core 20, River Course) populates both panels.

---

## Audio Architecture

Each panel can play audio independently. Audio source resolution:

1. phrase_id → AF_PHRASES[].audio_refs (full phrase recording)
2. entity_id → SURFACE_FORMS[].pronunciation.audio_refs (word recording)
3. fallback → browser TTS in the panel's language

---

## Future Layers (not yet built)

- LINGUISTIC FUNCTION: a grammar-role model per language
  (e.g. what case/tense/aspect each surface form carries)

- COMPOSITION: combine entities into novel sentences not
  in the original corpus, using the linguistic function layer

- EVENT STRUCTURE: formal representation of who-does-what-to-whom

# SRE Architecture

## Core Principle: Hub-and-Spoke

Every language connects to a shared semantic representation. No direct
language-to-language pathways.

```
                 ┌─────────────┐
                 │   SCENE     │
                 │  (shared)   │
                 └──────┬──────┘
                        │
          ┌─────────────┼─────────────┐
          ▼             ▼             ▼
      ENGLISH       AFRIKAANS        MĀORI
```

Adding a new language = new spoke. No pairwise translation paths.

Language selector is a **renderer/view selector**, not a translation database selector.

---

## Four-Layer Model

```
┌─────────────────────────────────────────┐
│ 1. USER INTERFACE                       │
│                                         │
│  [English ▼]  ⇄  [Afrikaans ▼]         │
│                                         │
│  User chooses the view.                 │
└─────────────────────┬───────────────────┘
                      ▼
┌─────────────────────────────────────────┐
│ 2. LANGUAGE LAYER                       │
│                                         │
│  Surface forms per language.            │
│  Text + audio + pronunciation.          │
│  Stored in: SURFACE_FORMS, AF_PHRASES   │
└─────────────────────┬───────────────────┘
                      ▼
┌─────────────────────────────────────────┐
│ 3. LINGUISTIC REPRESENTATION            │
│                                         │
│  Grammar roles per element.             │
│  What function does each word serve?    │
│  e.g. "a" = indefinite article (ENG)    │
│        "'n" = indefinite article (AFR)  │
│  — being discovered from examples —     │
└─────────────────────┬───────────────────┘
                      ▼
┌─────────────────────────────────────────┐
│ 4. SHARED WORLD MODEL                   │
│                                         │
│  Actors • Actions • Objects             │
│  Relations • Time • Space • State       │
│                                         │
│  Scene representation:                  │
│    ACTOR: child                         │
│    ACTION: walk                         │
│    DESTINATION: river                   │
│    DIRECTION: toward                    │
└─────────────────────┬───────────────────┘
                      ▼
┌─────────────────────────────────────────┐
│ 5. EXPERIENCE / FUNCTION                │
│                                         │
│  What is happening?                     │
│  What is being expressed?               │
│  What is the speaker doing?             │
│  e.g. NARRATION: describing an event    │
└─────────────────────────────────────────┘
```

This means:

```
WORLD ≠ REPRESENTATION ≠ LANGUAGE ≠ USER INTERFACE
```

---

## Scene Representation

Each scene is a structured event, not a text string.

```
SCENE: child-walks-to-river
─────────────────────────────────

ACTOR:    child (animate, singular, agent)
ACTION:   walk (motion, self-propelled)
DESTINATION: river (geographic feature, definite)
DIRECTION: toward (approach)

FUNCTION: NARRATION — describing an observed event
```

Language renderers then produce surface forms from this structure:

| Role       | English         | Afrikaans       |
|------------|-----------------|-----------------|
| DET        | A               | 'n              |
| ACTOR      | child           | Kind            |
| ACTION     | walks           | loop            |
| DIRECTION  | to              | na              |
| DET        | the             | die             |
| DEST       | river           | rivier          |

The same scene in Māori may produce a different structure entirely
(e.g. location marked by a particle rather than a preposition).

---

## Dual-Panel UI

```
┌──────────────────────────────────────────────────────┐
│  [English ▼] [Voice ▼]  ⇅  [Afrikaans ▼] [Voice ▼]  │
├──────────────────────────────────────────────────────┤
│  ┌────────────────────┐  ┌────────────────────┐       │
│  │ ENGLISH            │  │ AFRIKAANS          │       │
│  │                    │  │                    │       │
│  │ A child walks to   │  │ 'n Kind loop na    │       │
│  │ the river.         │  │ die rivier.        │       │
│  │                    │  │                    │       │
│  │ ▶ CHILD  ▶ WALK   │  │ ▶ KIND  ▶ LOOP     │       │
│  │ ▶ RIVER            │  │ ▶ RIVIER           │       │
│  └────────────────────┘  └────────────────────┘       │
└──────────────────────────────────────────────────────┘
```

Each panel is an independent renderer of the shared scene.

Swap button exchanges the two language selections — no translation
pathway is stored, only the renderer changes.

---

## Scene Trace: "A child walks to the river"

### English

| Token  | Role          | Notes                    |
|--------|---------------|--------------------------|
| A      | DET (indef)   | marks first mention      |
| child  | ACTOR         | singular, common noun    |
| walks  | ACTION        | 3sg present, motion      |
| to     | DIRECTION     | preposition, approach    |
| the    | DET (def)     | marks known destination  |
| river  | DESTINATION   | singular, common noun    |

### Afrikaans

| Token   | Role          | Notes                        |
|---------|---------------|------------------------------|
| 'n      | DET (indef)   | matches English "a"          |
| Kind    | ACTOR         | capitalised (common noun)    |
| loop    | ACTION        | "walk", cognate with "lope"  |
| na      | DIRECTION     | "to/toward", preposition     |
| die     | DET (def)     | matches English "the"        |
| rivier  | DESTINATION   | "river", cognate             |

### Māori (constructed)

A Māori rendering of this scene might differ structurally —
e.g. using a locative particle rather than a preposition.

```
Kei te hīkoi te tamaiti ki te awa.
```

| Token        | Role          | Notes                         |
|--------------|---------------|-------------------------------|
| Kei te       | TENSE/ASPECT  | present continuous marker     |
| hīkoi        | ACTION        | "walk" (verb)                 |
| te           | DET (def)     | definite article              |
| tamaiti      | ACTOR         | "child"                       |
| ki           | DIRECTION     | "to/toward" (locative parti.) |
| te           | DET (def)     | definite article              |
| awa          | DESTINATION   | "river"                       |

Note: Māori may not require an indefinite article, so the grammar
of "a child" vs "the child" is carried differently.

### What the trace reveals

1. **Word order**: English/Afrikaans SVO; Māori VSO
2. **Articles**: English/Afrikaans have indefinite; Māori may omit
3. **Direction marking**: English/Afrikaans use prepositions;
   Māori uses a locative particle before the noun
4. **Tense**: English marks on verb (walks); Afrikaans uses
   simple present; Māori uses aspect marker (kei te)
5. **Cognates**: "walk/loop" and "river/rivier" share Germanic roots;
   Māori "awa" is unrelated

The shared representation must be abstract enough to accommodate
these differences while preserving the scene meaning.

---

## Sidebar Curriculum Selector

Left sidebar selects which set of scenes populates both panels:
- River World
- Wife's Core 20

---

## Audio Architecture

Each panel plays audio independently:

1. phrase_id → AF_PHRASES[].audio_refs (full phrase recording)
2. entity_id → SURFACE_FORMS[].pronunciation.audio_refs (word)
3. fallback → browser TTS in the panel's language

---

## Roadmap (revised)

### Phase 1 — Trace scenes through all three languages
Take one scene at a time. Discover the shared representation.
Identify where languages align and where they diverge.

### Phase 2 — Build the scene representation model
Formalise ACTOR, ACTION, DESTINATION, etc. into a reusable schema.
Each scene becomes structured data, not just text strings.

### Phase 3 — Build per-language renderers
Each language gets a renderer that maps the shared scene
to its own surface form, applying its own grammar rules.

### Phase 4 — Expand language coverage
Add more scenes. Add more languages. The renderer is the
interface between the shared world and each language.

---

## Future Layers (not yet built)

- COMPOSITION: combine known entities into novel scenes
- EVENT STRUCTURE: formal who-does-what-to-whom model
- GRAMMAR RULES: per-language rendering templates

---

## Design Principles

See [`DESIGN.md`](./DESIGN.md) for the Co-Sense product design principles
(Progressive Depth, Content/Interaction Separation, and Complexity
Beneath the Interface).

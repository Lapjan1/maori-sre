# SRE Architecture

## Core Principle: Hub-and-Spoke

Every language connects to a shared semantic representation. No direct
language-to-language pathways.

```
                 ┌─────────────┐
                 │  EXPERIENCE │
                 │   ENTITY    │
                 └──────┬──────┘
          ┌─────────────┼─────────────┐
          ▼             ▼             ▼
      ENGLISH       AFRIKAANS        MĀORI
```

This means Co-Sense is **not** `Language A → Language B`. It is:

> **Language A ↔ Shared entity model ↔ Language B**

The learner is not memorising a one-way mapping between two strings. They observe how different languages express the same represented experience.

Any language can pair with any other — English↔Māori, Afrikaans↔English, Māori↔Afrikaans — because no pair has a direct translation pathway. The language selector is a **renderer/view selector**, not a translation database selector.

Adding a new language = adding a new spoke. The system becomes more powerful without changing its architecture.

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

## Learner Model (future)

Co-Sense tracks the learner's relationship to each entity and phrase, not
just their current position in a curriculum.

The system holds three distinct models:

```
1. WORLD / EXPERIENCE MODEL  —  shared, stable
2. LANGUAGE MODEL            —  per-language realizations
3. LEARNER MODEL             —  per-learner, updated by interaction
```

The learner model records how a specific learner has engaged with each
entity across languages:

```
ENTITY: tamaiti

LEARNER STATE:
  exposures: 5
  audio_listens: 3
  explorations: 2
  successful_recalls: 1
  last_seen: 2026-07-23
```

The learner model is **not a single confidence score**. Learning is
multi-dimensional — the same entity can be mastered in one direction
and weak in another:

```
ENTITY: tamaiti

                    English    Afrikaans    Māori
visual recog        high       high         high
audio recog         high       medium       low
production          low        low          low
cross-pair recall   EN→MI:med  AF→MI:low
sentence comp.      —          —            low
```

This means the learner model stores **state estimates per entity per
language per skill dimension**, not a scalar mastery value. The shared
entity model is the natural reference point — each language's
realization can be independently weak or strong.

This enables a feedback loop:

```
EXPERIENCE → PRESENTATION → INTERACTION → OBSERVATION
                                               ↓
                                        MODEL UPDATE
                                               ↓
                                   NEXT PRESENTATION
```

The learner model does not require retraining a neural network — it
updates deterministically from interaction signals (listened, clicked,
marked, recalled). Over time it can predict which entities need
reintroduction, at what interval, and in which language context.

```
ENTITY MODEL (stable)          LEARNER MODEL (per-learner)
──────────────────────         ──────────────────────────
                               ┌─────────────────────────┐
┌─────────────────────────┐    │ tamaiti: confidence 0.42 │
│ tamaiti                  │    │ kind:   confidence 0.85 │
│   ├── mi: "tamaiti"     │    │ loop:   confidence 0.31 │
│   ├── en: "child"       │    │ rivier: confidence 0.68 │
│   └── af: "kind"        │    └─────────────────────────┘
└─────────────────────────┘
```

The learner model is the reason Co-Sense can improve through use. The
experience model is stable; the learner's relationship to it changes.

---

## Audio Architecture

Each panel plays audio independently:

1. phrase_id → AF_PHRASES[].audio_refs (full phrase recording)
2. entity_id → SURFACE_FORMS[].pronunciation.audio_refs (word)
3. fallback → browser TTS in the panel's language

---

## Roadmap

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

### Phase 5 — Learner interaction signals
Capture view, listen, click, explore, and recall events per
entity per learner. Store as observation history.

### Phase 6 — Learner model inference
Derive confidence scores from observation history. Predict
which entities need reintroduction and at what interval.

---

## Future Layers (not yet built)

- LEARNER MODEL: per-entity state (exposure count, confidence)
- COMPOSITION: combine known entities into novel scenes
- EVENT STRUCTURE: formal who-does-what-to-whom model
- GRAMMAR RULES: per-language rendering templates
- SPACED REPETITION: schedule reintroductions from learner model

---

## Design Principles

See [`DESIGN.md`](./DESIGN.md) for the Co-Sense product design principles
(Progressive Depth, Content/Interaction Separation, Complexity
Beneath the Interface, and The Interface Exposes the Data Model).

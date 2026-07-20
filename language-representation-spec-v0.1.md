# Semantic Representation Engine (SRE) — Specification v0.1

> *The Semantic Representation Engine (SRE) models how reality can be represented, experienced, related, and expressed. Language is one projection of that representation, not the representation itself.*
>
> A universal representation engine for multilingual semantic learning.

---

## Table of Contents

1. [Philosophy](#1-philosophy)
2. [The Stack](#2-the-stack)
3. [Ontology — The Universal Categories](#3-ontology--the-universal-categories)
4. [Representations Layer](#4-representations-layer)
5. [Affordances Layer](#5-affordances-layer)
6. [Interactions Layer](#6-interactions-layer)
7. [Relationship Taxonomy](#7-relationship-taxonomy)
8. [Semantic Roles](#8-semantic-roles)
9. [Language Mapping Layer](#9-language-mapping-layer)
10. [Media Layer](#10-media-layer)
11. [Learning Layer](#11-learning-layer)
12. [AI Conversation Layer](#12-ai-conversation-layer)
13. [Appendix: Māori-Specific Considerations](#13-appendix-mori-specific-considerations)
14. [Implementation Roadmap](#14-implementation-roadmap)

---

## 1. Philosophy

### 1.1 Where Meaning Comes From

A child does not first learn the concept "apple." A child experiences:

```
see apple
touch apple
pick apple
eat apple
taste sweet
hunger disappears
mother smiles
```

**Meaning is created by interaction, not by definition.**

A dictionary can describe an apple. But understanding comes from what the apple *affords* — picking, eating, sharing, cooking — and the interactions that realize those affordances.

This is the central insight of the Semantic Representation Engine (SRE).

### 1.2 The Full Hierarchy

```
Reality
   │
   ▼
Observation             ← raw sensory input
   │
   ▼
Representation          ← stable multi-modal pattern (image, sound, feel, function)
   │
   ▼
Affordances             ← what actions an entity makes possible
   │
   ▼
Interactions            ← actual events that realize affordances
   │
   ▼
Relationships           ← static links between entities
   │
   ▼
Meaning                 ← semantic value derived from the above
   │
   ▼
Concept                 ← named, identifiable unit of meaning
   │
   ▼
Language                ← linguistic projection
   │
   ▼
Speech / Writing        ← modality-specific output
```

The SRE models every layer of this hierarchy explicitly.

### 1.3 What This Engine Is

The SRE is **not** a dictionary, not a knowledge graph, not a translation system. It is a structured model of meaning that:

- Stores **representations** (multi-modal) as the primary unit of perception
- Records **affordances** (what actions an entity enables) as the primary unit of function
- Logs **interactions** (actual events) as the primary unit of experience
- Connects entities via static **relationships**
- Projects meaning into any **language** via a mapping layer
- Enables **learning** (progression, spaced repetition, games, conversation)
- Supports **AI generation** constrained by the learner's current representation space

### 1.4 The Four Invariants

These rules never change. Every implementation decision must satisfy them.

**Invariant 1 — Reality precedes language.**
Nothing exists because it has a word. Words refer to representations of reality. The ontology of what exists is language-independent.

**Invariant 2 — Meaning is interaction.**
Meaning is acquired through interactions that realize affordances. Definitions are compressed descriptions of repeated interactions, not the source of meaning.

**Invariant 3 — Languages are projections.**
No language is privileged. English, Afrikaans, Māori, Hebrew, Greek, Japanese, and any future language are all projections over the same semantic space. Adding a language adds a mapping layer; it does not change the engine.

**Invariant 4 — AI reasons over representations.**
The AI never internally maps word to word. It receives an entity's representations, affordances, and interactions, and generates language from those. Language is the output layer, not the reasoning layer.

### 1.5 Reality as an Open Interface

"Reality" is intentionally left undefined. The engine receives **observed entities** through an interface — it does not care whether they come from:

- a human entering data
- a photograph
- a microphone
- a sensor
- another AI
- a book
- a PDF
- a video

The engine only knows that an observation has occurred and a representation has been produced. This makes the SRE future-proof against new input modalities.

### 1.6 Design Principles

1. **Reality-first, not language-first.** Representations exist before words.
2. **Affordance over identity.** What something enables is often more fundamental than what it is.
3. **Interaction over definition.** Meaning comes from doing, not from describing.
4. **One representation, many projections.** Every node can be realized as image, audio, text, gesture.
5. **Semantic roles over grammatical roles.** "Actor" is a role in reality. "Subject" is one language's way of expressing it.
6. **Extensibility.** Adding a new language is adding a new mapping layer. Adding a new modality is adding a new representation type.
7. **Offline-first.** All data lives locally. No API dependency for core functionality.

---

## 2. The Stack

```
┌─────────────────────────────────────────────┐
│                 REALITY                      │
└──────────────────┬──────────────────────────┘
                   │ observed
                   ▼
┌─────────────────────────────────────────────┐
│         ONTOLOGY (universal categories)      │
│  THING PERSON PLACE ACTION STATE PROPERTY   │
│  RELATION EVENT TIME QUANTITY EMOTION       │
│  SOCIAL                                     │
└──────────────────┬──────────────────────────┘
                   │ instantiated as
                   ▼
┌─────────────────────────────────────────────┐
│      REPRESENTATIONS (multi-modal nodes)     │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  │
│  │  Visual  │  │  Auditory │  │  Tactile  │  │
│  └──────────┘  └──────────┘  └──────────┘  │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  │
│  │ Olfactory│  │  Kinetic │  │ Temporal │  │
│  └──────────┘  └──────────┘  └──────────┘  │
│                    ...                       │
└──────────────────┬──────────────────────────┘
                   │ affords
                   ▼
┌─────────────────────────────────────────────┐
│      AFFORDANCES (possible actions)          │
│  An entity enables or makes possible certain │
│  actions. These are the "verbs" of reality.   │
│                                              │
│  hammer → {hold, swing, hit, build, repair}  │
│  water  → {drink, wash, swim, pour, freeze}  │
│  waka   → {travel, carry, fish, belong}      │
└──────────────────┬──────────────────────────┘
                   │ realized by
                   ▼
┌─────────────────────────────────────────────┐
│      INTERACTIONS (actual events)            │
│  Specific instances where affordances are    │
│  actualized by actors at a time and place.   │
│                                              │
│  [child] [climbed] [tree] [yesterday]        │
│  [mother] [gave] [water] [to child] [today]  │
└──────────────────┬──────────────────────────┘
                   │ connected via
                   ▼
┌─────────────────────────────────────────────┐
│        RELATIONSHIPS (typed, directed)       │
│  is_a │ part_of │ made_of │ requires        │
│  caused_by │ located_in │ opposite_of       │
│  kin_of │ associated_with │ ...             │
└──────────────────┬──────────────────────────┘
                   │ projected via
                   ▼
┌─────────────────────────────────────────────┐
│       LANGUAGE MAPPING LAYER                 │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  │
│  │ English  │  │Afrikaans │  │  Māori   │  │
│  └──────────┘  └──────────┘  └──────────┘  │
└──────────────────┬──────────────────────────┘
                   │ rendered as
                   ▼
┌─────────────────────────────────────────────┐
│         SURFACE FORMS (speech/writing)       │
│  Text │ Audio │ Video │ Gesture │ ...       │
└─────────────────────────────────────────────┘
```

---

## 3. Ontology — The Universal Categories

### 3.1 Top-Level Categories

Every entity belongs to exactly one top-level category. These are categories of **reality**, not of language.

| ID | Category | Description | Examples |
|----|----------|-------------|----------|
| `THING` | Physical Object | Tangible entities | tree, water, stone, house |
| `PERSON` | Human Actor | People and personified beings | mother, chief, child |
| `PLACE` | Location | Spatial locations | river, mountain, home, village |
| `ACTION` | Dynamic Event | Something that happens or is done | run, eat, give, speak |
| `STATE` | Condition | A mode of being | be_happy, be_tired, be_sacred |
| `PROPERTY` | Attribute | A quality of something | red, big, hot, sacred |
| `RELATION` | Abstract Link | A connection between things | kinship, ownership, causality |
| `EVENT` | Complex Occurrence | A structured happening | ceremony, meal, journey |
| `TIME` | Temporal | Points or spans of time | day, night, season, now |
| `QUANTITY` | Amount | Numbers, counts, measures | one, many, all, some |
| `EMOTION` | Feeling | Internal affective states | love, fear, joy, grief |
| `SOCIAL` | Social Function | Culturally-defined constructs | family, authority, custom |

### 3.2 Entity ID Scheme

Every entity receives a unique, permanent ID.

```
[CATEGORY]_[3-digit sequence]

Examples:
THING_001     = water
PERSON_001    = mother
ACTION_001    = eat
STATE_001     = be_happy
PLACE_001     = home
SOCIAL_001    = whānau
```

IDs never change. If an entity is deprecated, the ID is retired, not reused.

### 3.3 Entity Record (Skeleton)

```yaml
entity_id: THING_001
category: THING
label:
  default: water
  short: H₂O
definition: >
  A clear, colorless, odorless liquid essential for life.
  Composed of hydrogen and oxygen (H₂O).
properties:
  natural: true
  essential: true
  states: [liquid, solid(ice), gas(vapor)]
```

---

## 4. Representations Layer

### 4.1 What Is a Representation?

A representation captures **how an entity is perceived** across sensory modalities. Representations precede language. A dog image needs no label.

### 4.2 Modality Types

| Modality | Description | Example (DOG) |
|----------|-------------|---------------|
| `visual` | What it looks like | Four legs, tail, fur, floppy ears |
| `auditory` | What it sounds like | Bark, whine, pant |
| `tactile` | What it feels like | Soft fur, wet nose, warm body |
| `olfactory` | What it smells like | Musky, wet-dog smell |
| `kinetic` | How it moves | Runs, jumps, wags tail |
| `temporal` | Its temporal patterns | Lifespan ~10-15 years, diurnal |
| `spatial` | Where it exists | Homes, farms, parks |

### 4.3 Representation Record

```yaml
representation:
  entity_id: THING_002        # dog
  modalities:
    visual:
      primary: "four-legged mammal with tail and fur"
      colors: [black, white, brown, golden, spotted]
      size_range: [0.2m, 1.0m]
      distinguishing: "floppy ears, panting tongue"
      images:
        - /media/visual/THING_002_01.webp
        - /media/visual/THING_002_02.webp
    auditory:
      sounds:
        - type: bark
          description: "short sharp vocalization"
          audio: /media/audio/THING_002_bark.wav
        - type: whine
          audio: /media/audio/THING_002_whine.wav
    kinetic:
      gait: runs_on_all_fours
      speed: "up to 45 km/h"
      special: [can swim, can dig, can jump]
    temporal:
      lifespan_years: [10, 15]
      activity_pattern: diurnal
```

### 4.4 Representation-First Teaching

A new entity can be introduced without any language:

1. Show **visual** representation (picture of a dog)
2. Play **auditory** representation (dog bark)
3. Show **kinetic** representation (video of dog running)
4. *Only then* introduce the word in the target language

This mirrors first-language acquisition.

---

## 5. Affordances Layer

### 5.1 What Is an Affordance?

An **affordance** is an action an entity makes possible for a given actor. The term comes from James Gibson's ecological psychology: a chair *affords sitting*, a path *affords walking*, water *affords drinking*.

Affordances bridge perception and action. They are **not** static properties (relationship: `chair is_a furniture`) and **not** functions (function: `chair used_for sitting`). They are the set of possible interactions an entity invites.

### 5.2 Affordance vs. Relationship

```
Relationship (static):   Tree is_a plant
                         Tree has_part leaf
                         Tree located_in forest

Affordance (dynamic):    Tree affords climbing
                         Tree affords shade
                         Tree affords sitting_under
                         Tree affords cutting
                         Tree affords burning
                         Tree affords planting
                         Tree affords looking_at
```

Relationships describe what something **is**. Affordances describe what something **enables**.

### 5.3 Affordance Record

```yaml
affordance:
  entity_id: THING_002            # dog
  affordances:
    - action: pat
      description: "Dog affords being petted"
      typical_actors: [PERSON]
      typical_outcome: STATE_003   # pleasure/calm
      cultural_notes: "Ask owner before petting an unfamiliar dog"
    - action: walk
      description: "Dog affords being walked on a leash"
      typical_actors: [PERSON]
      typical_outcome: STATE_004   # exercise
      equipment: [leash, collar]
    - action: guard
      description: "Dog affords guarding property"
      typical_actors: [PERSON]
      target: PLACE_003            # home
      typical_outcome: STATE_005   # safety
    - action: play_fetch
      description: "Dog affords playing fetch"
      typical_actors: [PERSON]
      equipment: [ball, stick]
```

### 5.4 Affordance Categories

| Category | Description | Example (knife) |
|----------|-------------|-----------------|
| `manipulation` | Physical handling | hold, grip, wield |
| `transformation` | Changing state of something | cut, slice, carve, stab |
| `consumption` | Using up | (none for knife) |
| `social` | Enabling social interaction | share_food, prepare_meal |
| `spatial` | Movement or placement | carry, store, drop |
| `cultural` | Culturally-specific | ritual_slaughter (certain contexts) |
| `symbolic` | Representing something | status_symbol, heirloom |
| `constraint` | Limiting or preventing | block, restrict (knife in locked drawer) |

### 5.5 Affordance-First Teaching

A learner can understand an entity through its affordances before learning its name:

```
Imagine you are walking.
You feel hot.
You stand under something.
Now you have shade.

That thing affords shade.
That thing is... a tree.
```

The AI can generate this kind of teaching experience from the affordance data.

---

## 6. Interactions Layer

### 6.1 What Is an Interaction?

An **interaction** is a specific event where one or more actors realize an affordance. Where affordances are possibilities, interactions are actualities.

### 6.2 Interaction Record

```yaml
interaction:
  interaction_id: INT_001
  label: "Child climbs tree"
  participants:
    - role: Actor
      entity: PERSON_003            # child
    - role: Patient
      entity: THING_003             # tree
  action: climb                     # must correspond to an affordance of THING_003
  time:
    label: yesterday
    reference: RELATIVE
  location:
    entity: PLACE_004               # backyard
  outcome:
    description: "Child reached the top branch"
    emotional_result: EMOTION_003   # joy
  language:
    en: "The child climbed the tree yesterday"
    mi: "I piki te tamaiti i te rākau inanahi"
```

### 6.3 Interaction as Meaning

Interactions are where meaning is **created**. A learner who has never seen a tree can understand it through interactions:

```
Interaction 1: [Child] [climbed] [tree] → joy
Interaction 2: [Person] [sat_under] [tree] → shade
Interaction 3: [Tree] [dropped] [apple] → food
```

Each interaction adds a new dimension to the entity's meaning.

### 6.4 Interaction Templates

```yaml
interaction_template:
  id: IT_GIVE
  label: "Transfer of Object"
  participants:
    - role: Actor
      category: PERSON
    - role: Patient
      category: THING
    - role: Recipient
      category: PERSON
  action: give                      # must be an affordance of Actor toward Patient
  outcomes:
    - Recipient now has Patient
    - Actor no longer has Patient
  language_examples:
    en: "[Actor] gave [Patient] to [Recipient]"
    mi: "I hōmai e [Actor] te [Patient] ki [Recipient]"
```

---

## 7. Relationship Taxonomy

### 7.1 Universal Relationship Types

Relationships connect two entities. They are **static** — they describe what something is or how it relates to other things, not what it enables.

#### 7.1.1 Hierarchical

| Type | Inverse | Meaning |
|------|---------|---------|
| `is_a` | `has_subtype` | Taxonomic. dog is_a animal |
| `part_of` | `has_part` | Mereological. finger part_of hand |
| `instance_of` | `has_instance` | Individual to class. this_tree instance_of TREE |

#### 7.1.2 Physical

| Type | Inverse | Meaning |
|------|---------|---------|
| `made_of` | `forms` | Material composition |
| `located_in` | `contains` | Spatial containment |
| `located_at` | `has_location` | Position |
| `originates_from` | `produces` | Source or origin |
| `transforms_to` | `transforms_from` | State change |

#### 7.1.3 Temporal

| Type | Inverse | Meaning |
|------|---------|---------|
| `occurs_before` | `occurs_after` | Temporal sequence |
| `occurs_during` | `contains_event` | Temporal containment |
| `causes` | `caused_by` | Causal relationship |

#### 7.1.4 Abstract

| Type | Inverse | Meaning |
|------|---------|---------|
| `symbolizes` | `symbolized_by` | Symbolic or cultural meaning |
| `opposite_of` | (symmetric) | Antonymy |
| `similar_to` | (symmetric) | Synonymy |
| `associated_with` | (symmetric) | General association |

#### 7.1.5 Kinship & Social

| Type | Inverse | Meaning |
|------|---------|---------|
| `parent_of` | `child_of` | Direct parent-child |
| `ancestor_of` | `descendant_of` | Lineage |
| `kin_of` | (symmetric) | Extended kinship |
| `belongs_to` | `has_authority_over` | Ownership, guardianship |

### 7.2 Relationship Record

```yaml
relation:
  type: is_a
  source: THING_002        # dog
  target: THING_020        # animal
  strength: 1.0
  confidence: 1.0
  source: manual
```

### 7.3 Affordances vs. Relationships — Summary

| Dimension | Relationships | Affordances |
|-----------|---------------|-------------|
| Nature | Static, declarative | Dynamic, action-oriented |
| Question answered | "What is X?" | "What can I do with X?" |
| Example | Tree is_a plant | Tree affords climbing |
| Language mapping | Nouns, adjectives | Verbs, situations |
| Learning mode | Definition, memorization | Experience, interaction |
| AI use | Factual recall | Scenario generation |

---

## 8. Semantic Roles

### 8.1 Universal Semantic Roles

| Role | Symbol | Definition | Example |
|------|--------|------------|---------|
| `Actor` | A | The entity that performs or initiates | mother |
| `Action` | V | The event or state | give |
| `Patient` | P | The entity affected or changed | water |
| `Instrument` | I | The means by which the action occurs | hand |
| `Recipient` | R | The entity that receives | child |
| `Location` | L | Where the situation occurs | home |
| `Time` | T | When the situation occurs | today |
| `Reason` | RSN | Cause or motivation | thirst |
| `Goal` | G | The purpose or intended outcome | nourish |
| `Manner` | M | How the action is performed | gently |
| `Source` | S | Origin point | well |
| `Experiencer` | E | Entity that perceives or feels | |
| `Stimulus` | ST | Thing perceived or felt | |

### 8.2 Sentence Template

```yaml
template_id: GIVE_001
label: Transfer of Object
roles:
  Actor:        required: true   # must be PERSON
  Action:       required: true   # must be a transfer action
  Patient:      required: true   # must be THING
  Recipient:    required: true   # must be PERSON
  Location:     required: false
  Time:         required: false
examples:
  - en: "Mother gave water to the child"
  - af: "Ma het water aan die kind gegee"
  - mi: "I hōmai e te whaea te wai ki te tamaiti"
```

---

## 9. Language Mapping Layer

### 9.1 Language Record

```yaml
language_id: mi
name: Māori
iso_639_1: mi
iso_639_2: mri
script: Latin
typology: VSO
features:
  - determiners: [te, ngā]
  - tam_markers: [e...ana, kua, i, ka]
  - passive_suffixes: true
```

### 9.2 Lexical Realization

```yaml
realization:
  entity: THING_001              # water
  language: mi
  surface: wai
  pronunciation:
    ipa: wai
    approx: "why"
    audio: /audio/mi/THING_001.wav
  grammar:
    word_class: noun
    category: common
  usage:
    register: neutral
  common_mistakes:
    - "Can be confused with waiū (milk)"
```

### 9.3 Grammatical Realization

Grammar is a **projection function** from semantic roles to surface syntax.

```yaml
grammar_projection:
  language: mi
  template: GIVE_001
  word_order: V A P R
  realizations:
    Action:
      lemma: hōmai
      form: "I hōmai" if past, "Kei te hōmai" if present
    Actor:
      particle: "e"
      determiner: "te"
    Patient:
      particle: "i"
    Recipient:
      particle: "ki"
```

### 9.4 Cross-Language Disambiguation

```yaml
disambiguation:
  entity: SOCIAL_001             # whānau
  language_mappings:
    en:
      primary: family
      accuracy: partial
      notes: >
        'Whānau' includes extended kin and community,
        not just nuclear family.
    af:
      primary: familie
      accuracy: partial
```

---

## 10. Media Layer

### 10.1 Media Record

```yaml
media:
  media_id: MEDIA_001
  entity: THING_001              # water
  type: image
  format: webp
  path: /media/images/THING_001.webp
  alt_text:
    en: "A clear glass of water on a wooden table"
    mi: "He karaihe wai mārama i runga i te tēpu rākau"
```

### 10.2 Pronunciation Audio

```yaml
pronunciation:
  language: mi
  surface: wai
  audio: /audio/mi/words/THING_001.wav
  duration_ms: 800
  piper_model: voices/mi_NZ-hinewave-medium.onnx
```

---

## 11. Learning Layer

### 11.1 Progression Model

```yaml
progression:
  level: 1
  label: "Foundation — Representations & Affordances"
  total_entities: 50
  key_entities:
    - THING_001      # water
    - PERSON_001     # mother
    - ACTION_001     # eat
    - ACTION_002     # drink
    - SOCIAL_002     # greeting
  key_affordances:
    - entity: THING_001         # water
      focus: [drink, wash, pour]
    - entity: ACTION_001        # eat
      focus: [hunger, taste, share]
  grammar_templates:
    - IDENTITY_001              # "He [NOUN] tēnei"
    - ACTION_PRESENT_001        # "Kei te [VERB] ahau"
    - POSSESSION_001            # "He [NOUN] tāku"
  skills:
    - match_representation      # picture → entity
    - identify_affordance       # entity → what it enables
    - listen_and_identify       # audio → entity
    - speak                     # entity → target language word
    - simple_sentences          # template → sentence
  games_unlocked:
    - MEMORY_CARDS
    - HEAR_CHOOSE
    - PICTURE_SAY
    - AFFORDANCE_MATCH          # "What can you do with this?"
```

### 11.2 Spaced Repetition

```yaml
review:
  entity: THING_001
  language: mi
  learner: <id>
  state:
    stage: 3
    interval_hours: 24
    ease_factor: 2.5
    next_review: 2026-07-21T10:00:00Z
    correct_streak: 3
    last_score: 0.95
```

### 11.3 Game Definitions

```yaml
game:
  - id: PICTURE_SAY
    type: production
    modality_in: visual
    modality_out: speech
    description: "Show an image, learner says the word"

  - id: HEAR_CHOOSE
    type: recognition
    modality_in: audio
    modality_out: selection
    description: "Play audio, learner selects matching image"

  - id: AFFORDANCE_MATCH
    type: association
    modality_in: visual + text
    modality_out: selection
    description: "Given an entity, select what it affords"

  - id: INTERACT
    type: scenario
    modality_in: text
    modality_out: speech
    description: "Describe a scenario, learner responds with appropriate action"
    ai_evaluated: true
```

---

## 12. AI Conversation Layer

### 12.1 Principle

The AI teaches from **representations** and **affordances**, not from dictionary entries. When it introduces a new word, it first establishes meaning through experience.

### 12.2 Learner Capability Profile

```yaml
conversation_profile:
  learner_id: <id>
  level: 1
  known_entities:
    - THING_001              # water
    - THING_005              # bread
    - PERSON_001             # mother
    - ACTION_001             # eat
    - ACTION_002             # drink
  known_affordances:
    - THING_001: [drink, pour]
    - THING_005: [eat, share, break]
  known_templates:
    - IDENTITY_001
    - ACTION_PRESENT_001
  constraints:
    max_sentence_length: 5
    no_english: false
    correct_mistakes: true
    persona: "friendly Māori grandmother"
```

### 12.3 AI Prompt Template

```
You are a language teaching assistant in the Semantic Representation Engine.

The learner knows these entities:
{known_entities}

Each entity has these representations (visual, auditory, kinetic):
{representations}

Each entity affords these actions:
{affordances}

The learner knows these sentence templates:
{templates}

Target language: {language}

Teaching approach:
- When introducing a new entity, start with its representation and affordances,
  not its translation.
- Example: "Imagine you feel hot. You find something to drink. It is cool and
  clear. That thing is... wai." (not "Wai = water.")
- Use only known entities and templates.
- Correct mistakes gently by repeating the correct form.
- Never switch to {fallback_language} unless the learner asks.
- Maximum {max_words} unique words in your responses.
- Maximum {max_length} words per sentence.

Persona: {persona}

The learner just said: "{learner_input}"

Respond in {language} only.
```

### 12.4 Conversation Flow

```
AI:   "Kia ora! Titiro ki tēnei."
      (Hello! Look at this.)
      [shows picture of water]

AI:   "He aha tēnei? He wai. Ka taea e koe te inu."
      (What is this? It is water. You can drink it.)

User: "He wai"
      (attempting the word)

AI:   "Tino pai! He wai tēnei. Kei te inu koe?"
      (Very good! This is water. Are you drinking?)

      [shows picture of bread]

AI:   "He aha tēnei?"
      (What is this?)

User: "He... parāoa?"
      (hesitating)

AI:   "Āe, he parāoa! Ka taea e koe te kai."
      (Yes, it's bread! You can eat it.)
```

### 12.5 Affordance-Based Teaching Script

```yaml
teaching_script:
  entity: THING_003             # tree
  language: mi
  levels:
    - level: 1                  # representation + affordance
      prompt: >
        Imagine you are walking. The sun is hot. You stand under
        something tall. It gives you shade. What is it?
      answer: rākau

    - level: 2                  # interaction
      prompt: >
        A bird lives in the rākau. The bird sings. Where is the bird?
      answer: Kei runga i te rākau te manu

    - level: 3                  # cultural affordance
      prompt: >
        In Māori tradition, the rākau is used for carving waka.
        What does the rākau afford?
      answer: "Te rākau affords: whakairo (carving)"  # code-switch allowed
```

---

## 13. Appendix: Māori-Specific Considerations

### 13.1 Entities with Distributed English Mapping

| Entity | Māori | English | Notes |
|--------|-------|---------|-------|
| SOCIAL_001 | whānau | family (partial) | Extended kinship group, not nuclear family |
| STATE_002 | mana | prestige / authority / spiritual power | Combines status, influence, spiritual authority |
| STATE_003 | tapu | sacred / restricted | State of sacredness requiring restrictions |
| THING_010 | whenua | land / placenta | Physical earth + ancestral connection + birth |
| RELATION_005 | kaitiakitanga | guardianship | Obligation to protect across generations |
| EMOTION_002 | aroha | love / compassion | Active compassion, not passive feeling |
| THING_011 | wairua | spirit / soul | Spiritual dimension |

### 13.2 Māori Affordances (Key Examples)

These capture what each entity **enables** in Māori cultural context:

```yaml
entity: THING_012              # waka (canoe)
affordances:
  - travel_across_water
  - carry_people
  - carry_goods
  - fish
  - explore
  - belong                  # waka as tribal identity
  - ceremony                # waka as part of formal occasions
  - connect_ancestors       # waka as voyaging vessel of ancestors
---
entity: PLACE_002              # marae (meeting ground)
affordances:
  - gather
  - host_visitors
  - hold_ceremony
  - mourn
  - celebrate
  - debate
  - teach
  - connect_whakapapa       # genealogy
---
entity: STATE_003              # tapu
affordances:
  - restrict_access
  - protect_sacred_things
  - define_boundaries
  - require_ritual
```

### 13.3 Initial Grammar Projections

| Construction | Semantic Role Mapping | Example |
|-------------|----------------------|---------|
| Identity | `He [THING] tēnei` | He wai tēnei |
| Present action | `Kei te [ACTION] [ACTOR] i te [PATIENT]` | Kei te kai ahau i te parāoa |
| Past action | `I [ACTION] [ACTOR] i te [PATIENT]` | I kai ahau i te parāoa |
| Future | `Ka [ACTION] [ACTOR] i te [PATIENT]` | Ka kai ahau i te parāoa |
| Possession | `He [THING] tāku` | He whare tāku |
| Location | `Kei [PLACE] [ACTOR]` | Kei te kāinga ahau |
| Negation (identity) | `Ehara [THING] tēnei` | Ehara wai tēnei |
| Stative | `Kua [STATE] [ACTOR]` | Kua mate ahau |

### 13.4 Cultural Affordance-First Learning Path

For culturally dense Māori concepts, the engine **never** teaches by translation. Instead:

1. **Representation**: Show images/video of a pōwhiri (welcome ceremony)
2. **Affordances**: "This place affords: gathering, hosting, ceremony, mourning, celebrating"
3. **Interaction**: "People are arriving. They are being welcomed. Where are they?"
4. **Language**: Only now introduce the word "marae"

---

## 14. The SRE as a Compiler

The SRE is not a database. It is a **compiler**.

```
Author
   │
   ▼
Canonical Source (JSON)        ← Layer 1: what authors write
   │
   ▼
Compiler                       ← Layer 2: validates, compiles, builds
   │
   ├── validator.py
   ├── compiler.py
   ├── graph_builder.py
   ├── embedding_builder.py
   ├── lesson_builder.py
   └── grammar_builder.py
   │
   ▼
Runtime Graph                  ← Layer 3: compiled artifacts
   │
   ├── graph.db
   ├── embeddings/
   ├── indexes/
   └── cache/
   │
   ▼
Applications                   ← Layer 4: consumers of the runtime
   │
   ├── language-learning
   ├── dictionary
   ├── translator
   ├── chat
   └── api
```

Applications never touch the source. They query the runtime. The runtime can be rebuilt from source at any time — the source is the canonical truth.

### 14.1 What the Compiler Does

Given a set of canonical source documents (JSON), the compiler:

1. **Validates** every document against its schema and the domain contracts
2. **Resolves** all entity references (checks for orphans, detects cycles)
3. **Builds the graph** — inserts nodes and edges into the runtime graph store
4. **Indexes** — builds search indexes (text, embedding, relationship)
5. **Generates lesson structures** — traverses the graph to produce progression paths
6. **Generates grammar projections** — pre-compiles sentence templates
7. **Caches** — stores pre-computed pronunciation audio paths, game layouts

The output is a **Runtime Graph** that applications query through a stable API.

### 14.2 Source vs. Runtime

| Dimension | Canonical Source | Runtime Graph |
|-----------|-----------------|---------------|
| Format | JSON (author-written) | SQLite + vector indexes + caches |
| Truth | Yes | No (derived) |
| Edition | Human-editable | Machine-optimized |
| Versioned | Yes (git) | No (rebuilt) |
| Portable | Yes | No (implementation-specific) |
| Schema | JSON Schema | DDL + index definitions |

### 14.3 Why This Matters for AI

The runtime graph contains pre-computed artifacts that the AI needs:

- **Entity embeddings** for semantic similarity
- **Pre-computed affordance chains** (if you do X, then Y becomes available)
- **Grammar indexes** (fast lookup of how to express a semantic role in any language)
- **Lesson state** (what the learner knows, spaced repetition buckets, next review)

The AI never queries raw JSON. It queries the compiled graph. This makes it fast enough for real-time conversation.

## 15. Implementation Roadmap

### Phase 0 — Specification (complete)
- [x] Ontology categories defined
- [x] Representations layer designed
- [x] Affordances layer designed
- [x] Interactions layer designed
- [x] Relationship taxonomy defined
- [x] Semantic roles defined
- [x] Language mapping architecture defined
- [x] AI conversation layer with affordance-based teaching
- [x] Māori-specific mappings and affordances
- [x] Domain contracts defined
- [x] **Spec freeze v0.1**

### Phase 1 — Canonical Source Language (complete)
- [x] Entity schema (JSON Schema + validation)
- [x] Representation schema (multi-modal)
- [x] Affordance schema (action possibilities)
- [x] Interaction schema (actual events)
- [x] Relationship schema (typed, directed)
- [x] Language mapping schema (lexical + grammar projections)
- [x] Template schema (semantic role patterns)
- [x] Domain contracts as code (validate against schemas)
- [x] Formal semantics (mathematical definitions, cardinality, inference rules)
- [x] Validation rules (83 machine-enforceable rules with severity levels)
- [x] Compiler pipeline specification (11 stages, deterministic, provenance-mandatory)
- [x] Diagnostics system (structured, actionable error reporting with suggestions)
- [x] Plugin architecture (embedding, storage, tts, stt, lesson — all optional)
- [x] Test framework (fixtures, golden outputs, error case fixtures)

### Phase 2 — Compiler
- [ ] **Validator** — implement schema + contract validation (stages 1–3)
- [ ] **Diagnostics** — structured error reporting with suggestions
- [ ] **Compiler pipeline** — orchestrate load → validate → infer → build → write
- [ ] **Graph builder** — produce runtime graph nodes and edges
- [ ] **Provenance attacher** — trace every artifact to source location
- [ ] **Indexer** — full-text + relationship search indexes
- [ ] **Lesson builder** (plugin) — auto-generate progression from graph
- [ ] **Grammar builder** (plugin) — compile semantic roles to renderers
- [ ] **Embedding builder** (plugin, optional) — vector similarity search skipped if absent
- [ ] **CLI tool** — `sre validate`, `sre build`, `sre serve`, `sre init`

### Phase 3 — Runtime
- [ ] Graph store (SQLite DDL — nodes, edges, properties, provenance)
- [ ] Search indexes (full-text on labels, definitions, surface forms)
- [ ] Cache layer (pre-computed lesson plans, pronunciation paths)
- [ ] Runtime API (FastAPI — read-only for apps)

### Phase 4 — Content
- [ ] Seed 50 core entities with representations and affordances
- [ ] Māori surface forms with pronunciation audio
- [ ] Afrikaans surface forms
- [ ] English surface forms
- [ ] Sentence templates (initial 20)

### Phase 5 — Speech
- [ ] Piper TTS integration (compiler generates audio)
- [ ] Whisper STT integration (app-level recognition)
- [ ] Pronunciation comparison engine

### Phase 6 — Applications
- [ ] Flashcard system
- [ ] Progression/lesson system
- [ ] Game modules (including affordance-based games)
- [ ] AI conversation sandbox
- [ ] Dictionary browser
- [ ] Translation tool (concept-aware, not word-for-word)

### Phase 7 — Extension
- [ ] New language addition toolkit
- [ ] Community contribution format
- [ ] Export/import
- [ ] Alternative runtime backends (Neo4j, Postgres, DuckDB, FAISS)

---

## 16. Architecture Freeze

The architecture described in this specification is **frozen as of v0.1**.

The following rule applies starting from this point:

> **No architectural changes unless implementation exposes a real limitation.**

This is not a prohibition on improvement. It is a discipline. The specification is treated as stable. Future changes must be driven by evidence from implementation, not by increasingly elegant abstractions.

Changes that are explicitly permitted after freeze:
- Bug fixes in schema definitions
- Additional validation rules (Vnnn) that catch real authoring errors
- Additional inference rules (INFnnn) derived from observed gaps
- Performance optimizations in the compiler that do not change output
- Additional compiler targets (Neo4j, Postgres, FAISS backends)

Changes that require a spec revision (v0.2):
- New ontology categories
- Changes to the relationship taxonomy
- Changes to domain contracts that invalidate existing source documents
- Changes to the compiler pipeline that break determinism
- Removing provenance requirements

*End of Specification v0.1*

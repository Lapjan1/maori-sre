# Co-Sense Design Principles

## 1. Progressive Depth

Co-Sense should present a simple, usable surface while making deeper functionality available through interaction.

The user controls the depth of engagement.

A user may simply:

Read → Listen → Continue

A curious user may:

Read → Click words → Explore meaning

An advanced user may:

Compare → Analyze → Review → Revisit

The application must not force advanced learning methodology, questionnaires, or additional workflow onto users who do not need it.

## 2. Content and Interaction Are Separate

Curriculum provides content. The interaction pipeline remains invariant.

Different curricula, experiences, and language pairs should use the same presentation and interaction model wherever possible.

```
Curriculum
    ↓
Experience Data
    ↓
Universal Presentation Pipeline
    ↓
Top Learning Panel
    ↓
Bottom Parallel Panel
```

## 3. Complexity Belongs Beneath the Interface

The data model may support richer states and learning functionality without requiring a new user flow.

For example:

```
viewed
  ↓
listened
  ↓
explored
  ↓
marked
  ↓
reviewed
  ↓
mastered
```

These states should be introduced only when they provide genuine value.

The user should never be required to understand the underlying learning system in order to use Co-Sense.

## 4. The Interface Exposes the Data Model

The visual structure of the interface should reflect the structure of the underlying data model.

A learner does not compare two arbitrary strings. They learn a cross-lingual correspondence for the same entity. The UI should communicate **one entity → two language realizations** without requiring the learner to mentally reconstruct this structure.

For example, chip pairs (`[MI] tamaiti` + `[AF] kind`) are grouped visually at the entity level, not scattered by language. The gap between pairs is larger than the gap within a pair, making the entity boundary explicit.

> The interface should surface the data model's structure, not the rendering algorithm's.

> Keep the surface simple. Let interaction reveal depth.

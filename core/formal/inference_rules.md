# SRE Inference Rules

> *Logical rules for deriving new facts from existing ones. These rules are applied during compilation, not at runtime.*

---

## Rule INF001 — Affordance Inheritance

```
IF
  a is_a b
  AND b affords action X
THEN
  INFER a affords action X
  WITH confidence(a → X) = confidence(b → X) * 0.9
```

*Rationale: Subtypes inherit affordances from their parents, with slight discount for indirectness.*

## Rule INF002 — Compositional Affordance

```
IF
  tool is_a Tool
  AND person uses tool to act on patient
  AND action has outcome state
THEN
  INFER tool affords action on patient
  WITH confidence = confidence(uses) * 0.85
```

*Rationale: If a tool is used for an action, the tool affords that action.*

## Rule INF003 — Chain Affordance

```
IF
  entity_a affords action_X
  AND action_X results_in state_Y
THEN
  INFER entity_a affords state_Y (indirectly)
  WITH confidence = confidence(action_X → Y) * 0.8
```

*Rationale: If water affords drinking, and drinking results in hydration, then water indirectly affords hydration.*

## Rule INF004 — Reverse Affordance

```
IF
  person requires entity_a
  AND entity_a requires entity_b
THEN
  INFER person requires entity_b
  WITH confidence = min(confidence(R1), confidence(R2))
```

*Rationale: Need is transitive.*

## Rule INF005 — Template Applicability

```
IF
  action is_a TransferAction
  AND Actor is_a Person
  AND Patient is_a Thing
  AND Recipient is_a Person
THEN
  SUGGEST template GIVE_001
  WITH relevance = 0.95
```

*Rationale: Given a set of entities and their semantic categories, suggest matching templates.*

## Rule INF006 — Linguistic Disambiguation

```
IF
  entity_id maps to surface_1 in language L
  AND entity_id maps to surface_2 in language L
  AND surface_1 ≠ surface_2
THEN
  FLAG ambiguity
  REQUIRE disambiguation note
```

*Rationale: A single entity must not map to two different surface forms in the same language without explanation.*

## Rule INF007 — Semantic Similarity

```
IF
  entity_a and entity_b share ≥ 3 affordances
  AND entity_a is_a category
  AND entity_b is_a category
THEN
  INFER entity_a similar_to entity_b
  WITH strength = (shared affordances) / (total unique affordances)
```

*Rationale: Entities with similar affordance profiles are semantically similar.*

## Rule INF008 — Lesson Ordering

```
IF
  entity_a is concrete (observable)
  AND entity_b is abstract (not directly observable)
THEN
  entity_a SHOULD precede entity_b in lesson progression
```

*Rationale: Concrete entities are learned before abstract ones.*

## Rule INF009 — Concept Prerequisite

```
IF
  template_a requires concept_X as Actor
  AND template_b does not require concept_X
THEN
  concept_X SHOULD precede template_a
```

*Rationale: Concepts required by templates must be learned before the templates.*

## Rule INF010 — Cultural Context

```
IF
  affordance is cultural
  AND learner language L has no surface form for this entity
THEN
  FLAG cultural_gap
  REQUIRE cultural_notes in teaching material
```

*Rationale: Cultural affordances without direct language mapping need special teaching treatment.*

## Rule Application

Inference rules are applied by the compiler in a deterministic order:

1. Inheritance rules (INF001) — first, to propagate affordances through taxonomy
2. Compositional rules (INF002–004) — second, to derive indirect affordances
3. Similarity rules (INF007) — third, to compute semantic clusters
4. Ordering rules (INF008–009) — fourth, to structure lessons
5. Validation rules (INF006, INF010) — last, to flag issues for author attention

Each inference records its provenance: which rule, which source facts, and computed confidence.

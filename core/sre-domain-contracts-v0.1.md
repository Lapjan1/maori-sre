# SRE Domain Contracts v0.1

> *Before tables. Before JSON. Before API routes.*
>
> These contracts define what must always be true in the Semantic Representation Engine.

---

## How to Read

Each contract is a statement of an invariant: a rule that no implementation may violate.

- `MUST` — the rule is mandatory.
- `MUST NOT` — the rule is a prohibition.
- `SHOULD` — the rule is recommended but not enforced by the engine core.
- `cardinality` — how many of something may exist.

---

## 1. Entity Contracts

The entity is the fundamental unit of the engine. Everything else references entities.

```
ENTITY_001 — Identity
An entity MUST have exactly one entity_id.
An entity_id MUST be unique across all entities.
An entity_id MUST be permanent. Once assigned, it MUST NOT be reused.
An entity_id MUST follow the pattern [CATEGORY]_[3-digit zero-padded number].

ENTITY_002 — Category
An entity MUST belong to exactly one ontology category.
The category MUST be one of: THING, PERSON, PLACE, ACTION, STATE, PROPERTY,
RELATION, EVENT, TIME, QUANTITY, EMOTION, SOCIAL.

ENTITY_003 — Label
An entity MUST have at least one label.
An entity SHOULD have a 'default' label in a neutral form.
An entity MAY have labels in multiple languages (via the Language Mapping Layer),
but the default label is language-neutral.

ENTITY_004 — Definition
An entity MAY have a definition.
A definition is prose text, not structured data.
A definition MUST NOT replace representations or affordances.

ENTITY_005 — Existence
An entity exists independently of any language.
Removing all language mappings for an entity MUST NOT delete the entity.
An entity with zero language mappings is valid but inert for language learning.
```

---

## 2. Representation Contracts

Representations are multi-modal observations of an entity.

```
REP_001 — Ownership
A representation MUST belong to exactly one entity.
An entity MAY have zero or more representations.

REP_002 — Modality
A representation MUST specify exactly one modality type.
Modality types are: visual, auditory, tactile, olfactory, kinetic, temporal, spatial.
Additional modalities MAY be added to this list in future versions.
A custom modality MUST NOT conflict with the invariants.

REP_003 — Uniqueness
An entity MUST NOT have two representations of the same modality
with substantially identical content (content-based uniqueness, not reference-based).

REP_004 — Language Independence
A representation MUST NOT require a language to interpret.
Images, sounds, and tactile patterns stand on their own.
If a representation requires a caption, the caption is metadata, not the representation.

REP_005 — Source
Every representation MUST declare its source type: manual | sensor | ai_generated | derived.
Every representation MUST declare its confidence (0.0–1.0).
A manually curated representation SHALL be considered confidence 1.0 by convention.
```

---

## 3. Affordance Contracts

Affordances describe what actions an entity makes possible.

```
AFF_001 — Ownership
An affordance MUST belong to at least one entity.
An affordance MAY belong to multiple entities (e.g., "drink" is afforded by both
water and cup, but in different ways).

AFF_002 — Action Basis
Every affordance MUST reference exactly one action entity (category: ACTION).
The affordance is the relationship "[Entity] enables [Action]."

AFF_003 — Actor Constraint (Optional)
An affordance MAY specify which actor types can realize it.
Example: "stoop" is afforded by a doorway but only for actors taller than the door.
If unspecified, any PERSON actor is assumed.

AFF_004 — Outcome (Optional)
An affordance MAY specify a typical outcome (STATE, EMOTION, or EVENT).
Example: "eating bread affords: hunger disappears."

AFF_005 — Cultural Flag
An affordance MAY be flagged as culturally specific.
A culturally flagged affordance MUST include a cultural_notes field.
Example: "knife affords ritual_slaughter" — requires cultural_notes.

AFF_006 — Affordance vs. Relationship
An affordance MUST describe a possible action, not a static property.
Static properties (is_a, part_of, made_of) are relationships, not affordances.
If it answers "What can you do with X?" it is an affordance.
If it answers "What is X?" it is a relationship.
```

---

## 4. Interaction Contracts

Interactions are actual events where affordances are realized.

```
INT_001 — Participants
An interaction MUST have at least one participant with role Actor.
An interaction MAY have multiple participants.
Each participant MUST reference an existing entity.

INT_002 — Action
An interaction MUST reference exactly one action (entity of category ACTION).
The action SHOULD be an affordance of at least one participating entity.
The engine MUST warn if the action is not a known affordance, but MUST NOT reject it.
(This allows novel interactions to extend the affordance model.)

INT_003 — Time
An interaction SHOULD have a time.
Time MAY be absolute (ISO 8601) or relative (label: "yesterday", reference: RELATIVE).
If time is absent, the interaction is timeless (a general truth).

INT_004 — Location
An interaction MAY have a location.
A location MUST reference an entity of category PLACE or a geographic coordinate.

INT_005 — Outcome (Optional)
An interaction MAY specify one or more outcomes.
Each outcome MUST reference an existing entity (typically STATE, EMOTION, or EVENT).

INT_006 — Immutability
Once recorded, an interaction MUST NOT be modified.
If an interaction was recorded incorrectly, a new interaction supersedes it.
The old interaction is marked superseded, not deleted.
This preserves the event log as an auditable record.
```

---

## 5. Relationship Contracts

Relationships are static, typed links between two entities.

```
REL_001 — Binary
A relationship MUST connect exactly two entities: a source and a target.
A relationship MUST NOT connect an entity to itself (no reflexive relationships).
Exception: kin_of is symmetric but still logged as a single row.

REL_002 — Type
A relationship MUST have exactly one type from the defined taxonomy:
is_a, has_subtype, part_of, has_part, instance_of, has_instance,
made_of, forms, located_in, contains, located_at, has_location,
originates_from, produces, transforms_to, transforms_from,
occurs_before, occurs_after, occurs_during, contains_event,
causes, caused_by, symbolizes, symbolized_by,
opposite_of, similar_to, associated_with,
parent_of, child_of, ancestor_of, descendant_of, kin_of,
belongs_to, has_authority_over
Additional relationship types MAY be added but MUST NOT conflict with the invariants.

REL_003 — Direction
Every relationship type has a defined direction and may have an inverse.
The inverse relationship MUST NOT be stored separately (it is derived).
Example: storing part_of is sufficient; has_part is derived.

REL_004 — Affordance Separation
A relationship MUST NOT describe a possible action.
Describing possible actions is the role of affordances (see AFF_006).
This is the hard boundary between the Relationship and Affordance layers.

REL_005 — Strength (Optional)
A relationship MAY have a strength value (0.0–1.0).
Strength represents how typical or defining the relationship is.
Example: dog is_a animal (strength 1.0), dog associated_with cat (strength 0.3).
```

---

## 6. Language Mapping Contracts

Language mappings project entities and representations into surface forms.

```
LANG_001 — Language Identity
Every language MUST have a unique language_id following ISO 639-1 (two-letter code).
If ISO 639-1 is unavailable, ISO 639-2 (three-letter code) is used.
A language MUST have a name in its own script and in English.

LANG_002 — Entity to Surface
An entity MAY have zero or one surface forms per language.
A surface form (word, phrase) plus pronunciation is the lexical realization.
An entity with no surface form in a language is "unexpressed" in that language.
This is valid — some concepts lack direct expression in some languages.

LANG_003 — Pronunciation
Every surface form SHOULD have a pronunciation guide.
Pronunciation MUST include at least one of: IPA notation, approximate English
pronunciation, or an audio file reference.
Pronunciation audio MUST use the format /audio/{language}/{entity_id}.{ext}.

LANG_004 — Grammar Projection
Every language MUST define how semantic roles project to surface syntax.
A grammar projection covers: word order, particles, determiners, inflections,
TAM markers, and any language-specific grammatical features.

LANG_005 — Disambiguation
If an entity maps imprecisely to a surface form in a language, the mapping
MUST include a disambiguation note explaining the difference.
The disambiguation note MUST include: primary surface form, accuracy level
(exact | partial | approximate), and explanation.
Example: whānau → "family" (partial: "Includes extended kin, not nuclear only").

LANG_006 — No Privileged Language
No language mapping is the "source of truth."
All language mappings are equally derived from the entity's representations and
affordances. English is not special.
```

---

## 7. Template Contracts

Templates are reusable patterns for sentence generation.

```
TMP_001 — Language Independence
A template MUST be language-independent. It defines semantic role bindings only.
Language-specific surface rendering is handled by the Language Mapping Layer.

TMP_002 — Role Binding
A template MUST specify which semantic roles are required and which are optional.
A template MAY specify constraints on the entity categories that may fill each role.
Example: Recipient MUST be PERSON.

TMP_003 — Instantiation
Instantiating a template means binding entity_ids to roles.
The engine MUST validate that each bound entity satisfies the category constraint.
The engine MUST validate that the Action role entity is a known affordance of the
Actor entity (warning if not, rejection is configurable).

TMP_004 — Examples
A template SHOULD have example instantiations in at least one language.
Examples are for human readability and testing, not for generation.
```

---

## 8. AI Conversation Contracts

Constraints on how the AI generates conversation from the engine.

```
AI_001 — Representation-Bound
The AI MUST receive representation and affordance data, not dictionary entries.
The AI MUST NOT receive word-for-word translations as its primary input.
Word-for-word mappings MAY be provided as a fallback, not as the primary signal.

AI_002 — Learner-Constrained
The AI MUST receive a learner capability profile.
The AI MUST NOT use entities, templates, or vocabulary outside the learner's
current level.
The AI MAY introduce new entities if and only if it first presents their
representations and affordances (not their translation).

AI_003 — Error Correction
When the AI corrects a learner's error, it MUST:
1. Repeat the correct form
2. Continue the conversation naturally
3. NOT explain the grammar rule unless asked
Correction through example, not through meta-commentary.

AI_004 — Language Lock
The AI MUST respond in the target language only.
The AI MUST NOT switch to the learner's native language unless the learner
explicitly asks.
Exception: disambiguation notes MAY include the native language in parentheses.
```

---

## 9. Storage Contracts

Contracts for how the engine persists data.

```
STO_001 — Contracts Over Storage
The domain contracts are the source of truth.
Any storage layer (SQLite, Postgres, JSON files, in-memory) is an implementation
detail that MUST satisfy all domain contracts.

STO_002 — Referential Integrity
Every entity reference MUST resolve to an existing entity_id.
Orphaned references MUST be detected and reported.
The engine MUST NOT silently ignore broken references.

STO_003 — Auditability
Every write operation (create, update, delete) MUST be logged with:
- timestamp
- operator or system agent
- before/after state (or delta)
This log MAY be append-only and MAY be separate from the primary data store.

STO_004 — Import/Export
The engine MUST support lossless export and import of all data in JSON format.
The export format MUST include a version number matching the spec version.
The import process MUST validate all data against the JSON Schema before writing.
```

---

## 10. Cross-Cutting Contracts

Contracts that apply across all layers.

```
CROSS_001 — Imports Are Food
Every entity_id forms a directed graph. The engine MUST detect and reject cycles
in relationship graphs. Self-referential relationships are forbidden.
Exception: opposite_of and similar_to involve pairs but are not cycles.

CROSS_002 — Versioning
Every data record SHOULD carry a version number.
The engine SHOULD support data migration between spec versions.
A migration script MUST be provided for each breaking change.

CROSS_003 — Extensibility
New entity categories, relationship types, and modality types MAY be added
as long as they do not violate the existing invariants.
The engine MUST validate additions against the invariants at startup.

CROSS_004 — No Hardcoding
No language-specific logic may be hardcoded into the engine core.
All language-specific behavior MUST be expressed through the Language Mapping Layer.
The engine core MUST NOT know that Māori uses "te" and "ngā" — that lives in the
Māori grammar projection.
```

---

## Validation Summary

| Contract | Validates | Rejects |
|----------|-----------|---------|
| ENTITY_001–005 | entity_id format, uniqueness, permanence, category membership | Invalid IDs, duplicate IDs, missing categories |
| REP_001–005 | modality type, source, confidence | Missing source, unknown modality |
| AFF_001–006 | action reference, cultural flag when needed | Missing action, static property as affordance |
| INT_001–006 | participant references, action reference, time format | Broken entity refs, modified immutable fields |
| REL_001–005 | binary endpoints, type membership, direction, cycles | Self-loops, cycles, affordance/relationship confusion |
| LANG_001–006 | ISO code, pronunciation, disambiguation for partial maps | Missing pronunciation, missing disambiguation on partial |
| TMP_001–003 | role constraints, category constraints | Wrong category bound to role |
| AI_001–004 | profile adherence, language lock | Vocabulary outside learner's level |
| STO_001–004 | referential integrity, audit trail, version match | Orphaned refs, version mismatch on import |
| CROSS_001–004 | cycle detection, no hardcoded language | Cycles, language-specific logic in core |

---

*End of Domain Contracts v0.1*

# SRE Validation Rules

> *Machine-enforceable rules that every valid canonical source must satisfy. These rules are checked by the validator (Stage 2) and diagnoser (Stage 3).*

---

## Conventions

```
PASS   — Rule satisfied
FAIL   — Rule violated (blocks compilation)
WARN   — Rule advisory (reported but does not block)
```

---

## Entity Rules

| ID | Rule | Severity | Checks |
|----|------|----------|--------|
| V001 | `entity_id` matches `[CAT]_NNN` | FAIL | Regex validation |
| V002 | `category` is a known ontology category | FAIL | Enum membership |
| V003 | `label.default` is non-empty | FAIL | String length > 0 |
| V004 | `entity_id` is unique across all entities | FAIL | No duplicates |
| V005 | `entity_id` is not a previously retired ID | FAIL | Check retired ID registry |
| V006 | Entity has at least one representation | WARN | No entity should be unobservable |
| V007 | Entity has at least one affordance | WARN | No entity should be inert |
| V008 | Entity has at least one language mapping | WARN | No entity is inexpressible |

## Representation Rules

| ID | Rule | Severity | Checks |
|----|------|----------|--------|
| V010 | Entity referenced by `entity_id` exists | FAIL | Reference resolution |
| V011 | `modality` is a known modality type | FAIL | Enum membership |
| V012 | `content` is non-empty | FAIL | At least one content field |
| V013 | `source` is a known source type | FAIL | Enum membership |
| V014 | `confidence` is in [0, 1] | FAIL | Numeric range |
| V015 | If `modality=visual`, at least one image media | WARN | Visual modality should have images |
| V016 | If `modality=auditory`, at least one audio media | WARN | Auditory modality should have audio |

## Affordance Rules

| ID | Rule | Severity | Checks |
|----|------|----------|--------|
| V020 | Entity referenced by `entity_id` exists | FAIL | Reference resolution |
| V021 | Action referenced by `action` exists | FAIL | Must be ACTION entity |
| V022 | `cultural=true` implies `cultural_notes` exists | FAIL | Required field |
| V023 | Affordance describes a possible action, not a static property | FAIL | Semantic check (natural language heuristic) |
| V024 | `typical_outcome` references valid entities | FAIL | Reference resolution |
| V025 | Each entity should afford at least one action | WARN | Inert entities have no purpose |

## Interaction Rules

| ID | Rule | Severity | Checks |
|----|------|----------|--------|
| V030 | `interaction_id` is unique | FAIL | No duplicates |
| V031 | At least one participant has role `Actor` | FAIL | Required role |
| V032 | All participant `entity_id` references resolve | FAIL | Reference resolution |
| V033 | `action` references a valid ACTION entity | FAIL | Reference resolution |
| V034 | `superseded_by` references a valid interaction | FAIL | Reference resolution |
| V035 | Interaction is not modified after recording | FAIL | Immutability check (hash comparison) |

## Relationship Rules

| ID | Rule | Severity | Checks |
|----|------|----------|--------|
| V040 | `source` and `target` are different | FAIL | No self-loops |
| V041 | Both entity references resolve | FAIL | Reference resolution |
| V042 | `type` is a known relationship type | FAIL | Enum membership |
| V043 | No cycles in `is_a` chain | FAIL | Cycle detection (DFS) |
| V044 | No cycles in `part_of` chain | FAIL | Cycle detection (DFS) |
| V045 | `strength` is in [0, 1] | FAIL | Numeric range |
| V046 | Only one relationship per (source, type, target) | FAIL | No duplicates |

## Language Mapping Rules

| ID | Rule | Severity | Checks |
|----|------|----------|--------|
| V050 | Entity referenced by `entity_id` exists | FAIL | Reference resolution |
| V051 | `language_id` is a valid ISO code | FAIL | ISO 639-1 or 639-2 |
| V052 | `surface` is non-empty | FAIL | String length > 0 |
| V053 | Pronunciation has at least one of: ipa, approx, audio | FAIL | At least one pronunciation field |
| V054 | `accuracy=partial` implies `disambiguation.notes` exists | FAIL | Required field |
| V055 | No duplicate (entity_id, language_id) pairs | FAIL | Unique per-language mapping |
| V056 | Each entity has a mapping in at least one language | WARN | Entity is unexpressed everywhere |
| V057 | If `accuracy=exact`, no disambiguation notes needed | WARN | Unnecessary notes |

## Template Rules

| ID | Rule | Severity | Checks |
|----|------|----------|--------|
| V060 | Template has at least one role binding | FAIL | Empty templates are useless |
| V061 | All role constraints reference valid categories | FAIL | Reference resolution |
| V062 | Examples validate against the role schema | FAIL | Example matches template structure |
| V063 | Action role is constrained to ACTION category | FAIL | Action must be an action |

## Grammar Projection Rules

| ID | Rule | Severity | Checks |
|----|------|----------|--------|
| V070 | Language referenced by `language_id` is registered | FAIL | Language must exist |
| V071 | Template referenced by `template_id` exists | FAIL | Template must exist |
| V072 | `word_order` uses only valid role symbols | FAIL | Only A, V, P, I, R, L, T, M, S, E, ST |
| V073 | Every role in the template has a realization rule | FAIL | All template roles must have rendering rules |

## Provenance Rules

| ID | Rule | Severity | Checks |
|----|------|----------|--------|
| V080 | Every node has a provenance record | FAIL | Mandatory tracing |
| V081 | Every edge has a provenance record | FAIL | Mandatory tracing |
| V082 | Provenance `source_file` exists | FAIL | File must exist on disk |
| V083 | Provenance `hash` matches file content | FAIL | Content integrity check |

# Course Specification Format

A machine-readable format for defining SRE courses as a layer above
the core compiler. This format captures learner goals, semantic intent,
interaction context, and review status — information that vocabulary
lists cannot express.

## Relationship to SRE

```
Course spec (this format)
    │
    ├── learner goals
    ├── experience sequence
    ├── semantic intent per phrase
    ├── learner priority per phrase
    ├── interaction rehearsals
    └── candidate surface forms (language-agnostic)
            │
            ▼
    Native-speaker review
            │
            ▼
    Approved language packages
            │
            ▼
    SRE Core Compiler
            │
            ▼
    Runtime Graph
```

The course spec does not replace the compiler. It is an input to the
language-package authoring process that feeds the compiler.

## File format

YAML, validated against `visit-course.schema.json`.

## Top-level structure

```yaml
course:
  id: unique_course_id
  title: Human-readable title
  description: Short description
  learner_profile: Who this is for
  language: Target language code
  bridge_language: Bridge language code (e.g., en, af)
  experiences: [list of experience objects]
```

## Experience object

```yaml
- id: unique_experience_id
  title: Human-readable title
  scenario: What happens in the world
  level: 1|2|3
  entities:
    - id: entity_id
      category: THING|PERSON|ACTION|STATE|PLACE|ANIMAL|EMOTION|QUALITY
      label:
        default: English label
  affordances:
    - actor: entity_id
      action: description
      patient: entity_id (optional)
  phrases:
    - id: unique_phrase_id
      semantic_intent: what the learner intends to communicate
      surface_form:
        language_code: text
      learner_priority: MUST_SAY|RECOGNIZE|CULTURAL
      review_status: UNVERIFIED|PENDING|VERIFIED
  interactions:
    - situation: description of the situation
      learner_action: what the learner does
      expected_intent: what the learner intends to communicate
      candidate_responses:
        - phrase_id
  content:
    language_code: narrative text
  rehearsal:
    - role: family|learner|narrator
      text: what is said
      expected: what the learner should understand or do
```

## Phrase priority levels

| Level | Meaning |
|---|---|
| MUST_SAY | Learner wants to produce this phrase actively |
| RECOGNIZE | Learner wants to understand when heard |
| CULTURAL | Learner should know what is happening even without speaking |

## Review status levels

| Status | Meaning |
|---|---|
| UNVERIFIED | Machine-drafted, not reviewed |
| PENDING | Submitted for native-speaker review |
| VERIFIED | Confirmed by native speaker or authoritative source |

## Interaction rehearsal

Each experience should include at least one rehearsal scenario that
simulates the real-world situation. Rehearsals test whether the learner
can participate in the interaction, not just recall phrases.

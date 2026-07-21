# White Paper Review — July 21 2026

Overall score: ~8.5-9/10 (first draft)

## Scores by area

| Area | Score |
|---|---|
| Originality | 9.5/10 |
| Architecture | 9.5/10 |
| Technical clarity | 9/10 |
| Writing | 8.5/10 |
| Academic positioning | 7/10 |
| Evidence | 6/10 |

## What worked

- Abstract immediately states the contribution: "semantic rather than lexical model"
- Problem statement is clear (language loss, documentation-learning gap)
- Compiler pipeline chapter (11 stages) reads like engineering documentation — gives confidence
- Limitations section builds credibility

## What needs work

### 1. Not enough linguistics
- Cites Gibson, WordNet, FrameNet, ConceptNet — good start
- Missing cognitive linguistics: Fillmore, Lakoff, Langacker, Talmy, Tomasello
- The ideas overlap with cognitive linguistics but no engagement with that literature

### 2. Related Work too short (~1 page)
- Should cover: language documentation, knowledge representation, ontologies, cognitive linguistics, educational theory, language revitalisation, speech technology
- Needs 5-6 pages

### 3. Formal model too small
- Defines sets (E, C, R...) then stops
- Could define compiler formally: `Compile : Canonical -> Runtime`
- Inference rules, projection, language mapping, composition, hash function, confidence algebra — all already in the project, none formalised

### 4. Evaluation is descriptive, not tabular
- Needs a metrics table:
  - Experiences, Entities, Languages, Surface Forms, Inference Yield, Runtime Size, Compile Time

### 5. Missing chapter: "Why semantics first?"
- The paper asserts semantics-first but never defends it
- Should discuss: ambiguity, translation, polysemy, endangered languages, language-independent reasoning
- This is the central thesis — needs its own section

### 6. One weak sentence
- "The SRE takes a different starting point" — too mild
- Better: "Existing language technologies generally model language directly. SRE instead models the underlying semantic world from which language is expressed."

### 7. Too few references (10)
- v2 should target 40-60
- Work sits at intersection of linguistics, knowledge representation, education, compiler design, AI — each community expects its foundational works

## What impressed most

> "The compiler preserves license metadata through compilation..."

Almost nobody thinks about knowledge provenance and licensing as part of the semantic model.

## Recommendation

Do not submit v1. Expand:
- Literature review
- Theoretical justification ("why semantics first")
- Evaluation metrics
- Formal mathematical formalism

Then it could be taken seriously at a computational linguistics / language technology workshop.

## Suggested new title

**"Semantic Representation Before Language: An Open Compiler Architecture for Language Learning and Preservation"**

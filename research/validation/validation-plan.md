# SRE Validation Plan

**Status:** Proposed
**Date:** July 2026
**White Paper:** v2.0 (963 lines, 30 references)

## Overview

Version 1 of SRE answered "Can we build it?" — yes, demonstrated by the
River World PWA. Version 2 asks "Is it correct?" — a fundamentally
different question requiring empirical validation across five dimensions.

---

## Dimension 1: Linguistic Validation

**Question:** Is the ontology internally coherent from a linguistic
perspective?

**Approach:** Expert review by a linguist (or structured self-review
using linguistic criteria). Focus on:
- Entity category boundaries (do ANIMAL and THING overlap?)
- Affordance granularity (is "drink" an affordance of water or an
  independent action entity?)
- Relationship consistency (are is_a chains acyclic and well-founded?)
- Language mapping completeness (what justifies a "complete" mapping?)

**Status:** Not started.

**See:** `experiment-001.md`

---

## Dimension 2: Computational Validation

**Question:** Is the compiler deterministic and reproducible?

**Approach:** Hash-based reproducibility test.
1. Clone repository to clean environment.
2. Run compiler on canonical source files.
3. Record SHA-256 hash of every output artifact.
4. Repeat on a different OS/architecture.
5. Verify hashes match exactly.

**Success criterion:** Bit-identical output across environments.

**Status:** Compiler does not yet exist as a standalone executable.
Current build is manual (author edits JS bundles directly).

**See:** `experiment-002.md`

---

## Dimension 3: Educational Validation

**Question:** Does semantic-first learning produce better outcomes than
vocabulary-first learning?

**Approach:** Controlled experiment (n=10+).
- Control group: learns 33 words via flashcards + word lists.
- Treatment group: learns 33 words via River World (10 experiences).
- Measure: retention (immediate), transfer (novel sentences),
  sentence generation (free recall), delayed recall (7 days).

**Success criterion:** Treatment group outperforms control on transfer
and sentence generation by >= 1 effect size.

**Status:** Not started. Requires ethics clearance if using human subjects.

**See:** `experiment-003.md` (TODO: create)

---

## Dimension 4: Cultural Validation

**Question:** Does the Maaori language package feel authentic to Maaori
speakers?

**Approach:** Community review.
- Recruit 3-5 Maaori speakers (varying fluency levels).
- Present River World experiences in Maaori mode.
- Structured interview: accuracy, naturalness, missing concepts,
  cultural appropriateness.

**Success criterion:** No speaker reports that content is incorrect or
culturally inappropriate. At least 3 of 5 would recommend to a learner.

**Status:** Not started. Requires community relationships.

**See:** `experiment-004.md` (TODO: create)

---

## Dimension 5: Extensibility Validation

**Question:** Can a new language be added without modifying the
compiler?

**Approach:** Add Spanish.
- Author surface forms for all 33 entities (Spanish).
- Author audio references or TTS fallback.
- Add to language selector.
- Verify all experiences render in Spanish.
- Measure: person-hours, lines of config, compiler changes (should be 0).

**Success criterion:** Spanish works with zero compiler modifications.
Total effort under 4 hours for a bilingual speaker.

**Status:** Not started.

**See:** `experiment-005.md` (TODO: create)

---

## Validation Pipeline

```
Linguistic ──> Computational ──> Educational ──> Cultural ──> Extensibility
    │               │                │               │              │
    ▼               ▼                ▼               ▼              ▼
  1-2 wks         1 wk            4-6 wks         2-4 wks         1-2 wks
   expert        engineer         human           community       solo
   review        test             subjects        engagement      author
```

Validation is sequential where later dimensions depend on earlier
results. Computational validation is a prerequisite for educational
(there is no point testing a non-reproducible system). Cultural
validation is intentionally last — it requires a stable, linguistically
validated package.

---

## Acceptance criteria for Paper Two

The white paper "Evaluating a Semantic-First Language Learning
Architecture" should include results from at least 3 of 5 dimensions.
Minimum: Computational + Educational + Extensibility.

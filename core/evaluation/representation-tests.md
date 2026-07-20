# SRE Representation Quality Tests

> *These tests validate the semantic model, not the compiler. They answer one question: can the SRE represent reality faithfully enough for a learner to acquire genuine understanding?*

---

## How to Run

```bash
# Test a single entity
sre query --graph core/runtime/water/ find water

# Run all representation tests
cd core && python -m evaluation.run_tests
```

---

## 1. Basic Entity Integrity

Every entity must have:

| Requirement | Check |
|-------------|-------|
| Entity ID | Valid `CAT_NNN` format |
| Category | One of 12 ontology categories |
| Label | Non-empty default |
| Representation | At least one modality |
| Affordance | At least one action |
| Language mapping | At least one language |

**Test:** `THING_001` (water) — PASS

---

## 2. Polysemy Test

Some words carry multiple distinct meanings. The SRE must represent these as separate entities sharing a surface form, not as one entity with multiple definitions.

| Surface | Entity 1 | Entity 2 |
|---------|----------|----------|
| "bank" | THING_050 — financial institution | THING_051 — river bank |
| "light" | PROPERTY_010 — electromagnetic brightness | PROPERTY_011 — low weight |
| "ring" | THING_052 — jewelry | ACTION_020 — to call |

**Test:** `sre query --graph <runtime> find bank` returns TWO distinct entities.

---

## 3. Metaphor Chain Test

Metaphors connect literal and abstract concepts. The engine should represent these as related but distinct affordance patterns.

| Entity | Literal Affordance | Metaphorical Affordance |
|--------|-------------------|------------------------|
| light (PROPERTY_010) | affords illuminating | affords understanding (knowledge as light) |
| heavy (PROPERTY_012) | affords weighting_down | affords difficulty (burden as weight) |
| path (THING_060) | affords walking | affords method (path as approach) |

**Test:** Querying `light` returns related affordances including `understanding` with provenance noting the metaphorical extension.

---

## 4. Cultural Asymmetry Test

Some concepts map poorly between languages. The engine must handle this without forcing false equivalence.

| Concept | Māori | English | Afrikaans | Mapping Accuracy |
|---------|-------|---------|-----------|------------------|
| whānau | whānau | family | familie | partial |
| snow | hukarere | snow | sneeu | partial (Māori has multiple snow words) |
| river | awa | river | rivier | exact |
| land | whenua | land | land | partial (whenua also = placenta) |

**Test:** Each partial mapping includes a `disambiguation.accuracy: partial` note explaining the difference.

---

## 5. Inference Test

Given base facts, the engine should derive implicit facts.

| Rule | Input | Expected Output |
|------|-------|-----------------|
| INF001 (Affordance Inheritance) | Tree is_a Plant. Plant affords growing. | Tree affords growing. |
| INF003 (Chain Affordance) | Water affords drinking. Drinking results_in hydrated. | Water affords hydrated. |
| INF005 (Template Applicability) | Person drinks Water. | SUGGEST template ACTION_PRESENT_001. |

**Test:** Compile with inference enabled. Verify derived affordances appear in the runtime graph with `confidence < 1.0` and provenance tracing to the inference rule.

---

## 6. Sentence Generation Test

Given templates and language mappings, the engine should generate grammatically correct sentences.

| Template | Bindings | Expected (mi) |
|----------|----------|---------------|
| IDENTITY_001 | Patient=THING_001 | "He wai tēnei" |
| ACTION_PRESENT_001 | Actor=PERSON_003, Action=ACTION_001, Patient=THING_001 | "Kei te inu te tamaiti i te wai" |
| POSSESSION_001 | Possessor=PERSON_003, Possessed=THING_020 | "He kurī tāku" (assumes PERSON_003 owns THING_020) |

**Test:** All template instantiations produce valid sentences matching expected forms.

---

## 7. Distinguishability Test

Similar entities must be distinguishable through their affordance + representation profiles.

| Entity A | Entity B | Distinguishing Feature |
|----------|----------|------------------------|
| cup (THING_070) | glass (THING_071) | mug (THING_072) — handle, material, typical use |
| river (PLACE_005) | stream (PLACE_006) | size, flow rate |
| walk (ACTION_030) | run (ACTION_031) | speed, breathlessness |

**Test:** No two entities have identical affordance + representation profiles. Each has at least one unique distinguishing attribute.

---

## 8. Cross-Language Roundtrip Test

A concept → surface in L1 → back to concept → surface in L2 should yield the expected word.

| Concept | en → concept → mi |
|---------|-------------------|
| THING_001 | "water" → THING_001 → "wai" |
| THING_100 | "tree" → THING_100 → "rākau" |

**Test:** Roundtrip is correct for all entities with mappings in both languages.

---

## 9. Learner Progression Test

The lesson builder should produce a sensible ordering: concrete before abstract, frequent before rare, simple templates before complex.

| Level | Content Type | Example |
|-------|-------------|---------|
| 1 | Concrete THING + identity template | "He wai tēnei" |
| 2 | Common ACTION + present tense | "Kei te kai ahau" |
| 3 | PERSON + PLACE + location | "Kei te kāinga te whaea" |
| 4 | PROPERTY + STATE + description | "He nui te rākau" |
| 5 | Complex interactions + cultural affordances | Marae protocols |

**Test:** Generate lesson plan for 500 entities. Verify level 1 contains only concrete, observable entities. Verify cultural concepts appear at level 3+.

---

## 11. Narrative Compression Test

Can the SRE infer semantic relationships that were never explicitly stated?

Input: A set of related stories about water, thirst, drinking, rivers.

Query: "What quenches thirst?"

Expected: The SRE should infer that WATER quenches thirst via the chain:
- water affords drinking → drinking causes hydrated → hydrated is opposite_of thirsty

This validates that the inference system (INF rules) can compress multiple
narratives into implicit knowledge.

**Test:** `python -m evaluation.narrative_compression <runtime_dir>`

## 10. Spoken Interaction Test

The SRE should enable a conversation loop:

1. AI presents entity through representation (image/audio)
2. Learner produces word in target language
3. STT recognizes and evaluates pronunciation
4. Feedback given
5. Correct pronunciation played via TTS

**Test:** Full loop for 10 entities. Measure recognition accuracy and feedback relevance.

---

## Test Coverage Matrix

| Test | Status | Priority | Depends On |
|------|--------|----------|------------|
| 1. Basic Entity Integrity | ✅ PASS | P0 | — |
| 2. Polysemy | 🟡 Not tested | P0 | Content: bank, light, ring entities |
| 3. Metaphor Chain | 🟡 Not tested | P1 | Content: metaphorical affordances |
| 4. Cultural Asymmetry | 🟡 Not tested | P0 | Content: whānau, whenua, snow |
| 5. Inference | 🔴 Not implemented | P1 | INF rules in compiler |
| 6. Sentence Generation | 🟡 Not tested | P1 | Grammar builder plugin |
| 7. Distinguishability | 🟡 Not tested | P0 | Content: minimally distinct pairs |
| 8. Cross-Language Roundtrip | 🟡 Not tested | P0 | Content: 50+ bilingual mappings |
| 9. Learner Progression | 🔴 Not implemented | P2 | Lesson builder plugin |
| 10. Spoken Interaction | 🔴 Not implemented | P2 | TTS + STT plugins |
| 11. Narrative Compression | 🟡 Not tested | P1 | Chained affordances + opposites |

---

## Running Tests

```bash
# Automated test runner
python -m evaluation.run_tests

# Manual entity inspection
sre query --graph runtime/graph.json find water

# Affordance search
sre query --graph runtime/graph.json affords drink
```

## Adding New Tests

Every test must specify:
- **Purpose**: What aspect of the representation is being validated
- **Input**: Entities, relationships, affordances, or templates to compile
- **Expected**: The specific behavior or output that constitutes passing
- **Failure mode**: What it means if the test fails (model gap vs. implementation bug)

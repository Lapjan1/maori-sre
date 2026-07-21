# Semantic Representation Engine (SRE)

## Architecture and Design of an Open Infrastructure for Language Documentation, Teaching, and Preservation

**Version 1.0 — July 2026**

---

## Abstract

We present the Semantic Representation Engine (SRE), an open infrastructure
for representing, teaching, and preserving human languages through a
semantic rather than lexical model. The SRE begins with a language-
independent representation of entities, affordances, and interactions,
then projects these through language-specific surface forms, pronunciations,
audio recordings, and narrative experiences. A deterministic compiler
validates, infers, and bundles the result into a flat runtime graph
consumable by offline applications.

The system is designed for a specific problem: most of the world's ~7,000
languages are endangered, and existing language documentation and learning
tools treat vocabulary, grammar, audio, and stories as disconnected
artefacts. The SRE unifies them within a single coherent graph. It does
not require large corpora or machine learning—it requires one knowledgeable
speaker and a structured way to encode what they know.

We describe the formal semantics, compiler pipeline, inference rules,
provenance model, layered licensing framework, and a working prototype
(the River World PWA) that demonstrates the approach with Māori,
English, and Afrikaans across 10 connected learning experiences.

---

## 1. Introduction

### 1.1 The problem

Of the roughly 7,000 living languages in the world, approximately 3,000
are endangered [1]. A language disappears every few weeks as the last
fluent speakers pass away [2]. Revitalisation efforts face a common
bottleneck: they must document what remains before it is lost, then
transform that documentation into usable learning materials.

Existing tools fall into two camps. **Documentation tools** (dictionaries,
recorders, field notebooks) capture raw linguistic data but do not
produce learning experiences. **Learning platforms** (flashcard apps,
courseware) deliver vocabulary drills but do not incorporate the semantic
and narrative context that makes language learnable. The data rarely
flows between them.

### 1.2 The approach

The SRE takes a different starting point. Instead of modelling words,
it models **meaning** — what exists in a world (entities), what those
entities can do or have done to them (affordances), and how they
interact (interactions). Language is then layered on top: surface forms
(words and phrases) in any number of languages, each with pronunciation,
audio, and grammatical properties.

This reverses the conventional order. Rather than building up to
meaning from vocabulary, the SRE starts with meaning and projects it
into language.

### 1.3 Design goals

1. **Speaker-minimal input** — A single fluent speaker should be able
   to create a usable language package.
2. **Language independence** — The core engine has no language-specific
   code. All language knowledge is data.
3. **Offline-first** — Resulting applications must work without internet
   access, appropriate for communities with limited connectivity.
4. **Provenance tracking** — Every fact in the system traces to its
   source, with license and attribution metadata.
5. **Community ownership** — Language data retains community-controlled
   licensing; only the engine is open source.

---

## 2. Formal Model

### 2.1 Universe of discourse

Let:

- **E** = set of entities
- **C** = set of ontology categories
- **A** = set of action types
- **R** = set of relationship types
- **L** = set of language codes
- **S** = set of surface forms (strings)
- **P** = set of provenance records

### 2.2 Entity

An entity is the fundamental unit of semantic representation:

```
e ∈ E
e = (id, cat, label, def, props)
```

where:
- `id` — unique identifier, format `[CAT]_NNN`
- `cat ∈ C` — exactly one ontology category (THING, PERSON, ACTION, STATE, PLACE, ...)
- `label` — non-empty set of labels with a distinguished `default`
- `def` — optional prose definition
- `props` — optional key-value properties

**Invariant**: Entity IDs are permanent. Once assigned, never reassigned.

### 2.3 Affordance

An affordance represents what an entity can do or what can be done to it:

```
a = (e_id, act, desc, actors, outcome, equip, cultural)
```

Affordances are grounded in ecological psychology [3]: they describe
possibilities for action, not static properties. A river _affords_
drinking from, swimming in, and flowing through. These are not facts
about the river's substance but about its relationship to actors.

### 2.4 Language Mapping

A language mapping is a function projecting entities into surface forms:

```
λ : L → (E → S × Pron × Gram × Usage)
```

Each language is an equally valid projection over the same semantic
space. No language is privileged.

### 2.5 Surface Form and Pronunciation

A surface form is a word or phrase in a specific language representing
an entity. Each surface form carries a Pronunciation:

```
pron ∈ Pron
pron = (ipa, syllables, stress, audio_refs)
```

where `audio_refs` links to voice package files with provenance:

```
audio_ref ∈ AudioRef
audio_ref = (ref, package, speaker, dialect, quality,
             source_url, retrieved, source_license)
```

### 2.6 Relationship

Relationships connect entities:

```
rel = (src, type, tgt, strength, meta)
```

Relationship types include `is_a` (taxonomic), `part_of` (meronymic),
`located_in` (spatial), `requires` (dependency), `similar_to` (analogy).

**Constraint**: No cycles in `is_a` or `part_of` chains.

### 2.7 Interaction

An interaction records a specific event:

```
i = (i_id, parts, act, time, loc, outcomes)
```

Interactions are immutable once recorded. If erroneous, they are marked
`superseded`, never deleted or modified.

### 2.8 Experience

An experience is the smallest complete learning unit — a story, dialogue,
observation, procedure, or game. Each experience embeds entities,
affordances, and interactions within a narrative context. Experiences
are scored for semantic density and entity reuse to ensure graph cohesion.

### 2.9 Confidence

Every fact carries a confidence score derived from its source:

| Source type | Default confidence |
|-------------|-------------------|
| Direct observation (manual) | 1.0 |
| Imported dictionary | 0.95 |
| Wikipedia-sourced | 0.90 |
| LLM-generated | 0.65 |
| User guess | 0.40 |
| Derived (inferred) | product of source confidences |

Confidence is multiplicative for derived facts:

```
confidence(derived) = Π confidence(sources)
```

---

## 3. Compiler Pipeline

The compiler transforms validated source documents into a runtime graph
through eleven stages, applied deterministically:

### Stage 1: Load

Discover and parse source files (YAML, JSON, Markdown). Group by
document type. No validation is performed at this stage.

### Stage 2: Validate

Apply JSON Schema validation and domain-specific contract checks:
entity ID format, reference resolution, cycle detection, cardinality
constraints. All validation rules (V001–V083) are defined in the formal
specification and checked automatically.

### Stage 3: Diagnose

Produce structured diagnostics with error codes, file:line precision,
and suggested fixes. Errors halt the pipeline; warnings do not.

### Stage 4: Infer

Apply inference rules (INF001–INF010) to derive implicit facts. See
Section 4.

### Stage 5: Build Graph

Create graph nodes for entities and edges for relationships,
affordances, and interactions. Attach representations and language
mappings as node properties.

### Stage 6: Attach Provenance

Trace every node and edge to its source file, line, compiler version,
timestamp, and content hash.

### Stage 7: Index

Build full-text, frequency, and relationship indexes for fast runtime
lookup.

### Stages 8–10 (Plugin)

Optionally build lessons, grammar projections, and vector embeddings
through swappable plugins. Plugin output is deterministic given the
same input.

### Stage 11: Write

Serialize the runtime graph atomically. Either all artifacts are
written, or none are.

### Pipeline guarantees

1. Stages 1–3 are deterministic and language-agnostic.
2. Stages 4–7 are deterministic. Same source → same graph.
3. Stages 8–10 accept plugins without changing core output.
4. Stage 11 writes atomically.

---

## 4. Inference Rules

Inference rules derive new facts from existing ones during compilation.
Each inference records its rule, source facts, and computed confidence.

### INF001 — Affordance Inheritance

```
IF entity_a is_a entity_b AND entity_b affords action X
THEN INFER entity_a affords action X
WITH confidence = confidence(b → X) × 0.9
```

Subtypes inherit affordances from their parents. A dog is an animal;
an animal can drink; therefore a dog can drink.

### INF002 — Compositional Affordance

```
IF tool affords action on patient
AND person uses tool to act on patient
THEN INFER tool affords action on patient
WITH confidence = confidence(uses) × 0.85
```

If a net is used for catching fish, the net affords catching fish.

### INF003 — Chain Affordance

```
IF entity_a affords action_X AND action_X results_in state_Y
THEN INFER entity_a indirectly affords state_Y
```

If water affords drinking and drinking results in hydration, then water
indirectly affords hydration.

### INF004 — Reverse Affordance (Need Transitivity)

```
IF person requires entity_a AND entity_a requires entity_b
THEN INFER person requires entity_b
```

### INF005 — Template Applicability

Suggest grammatical templates given entity categories.

### INF006 — Linguistic Disambiguation

Flag when one entity maps to multiple surface forms in the same
language without explanation.

### INF007 — Semantic Similarity

```
IF entity_a and entity_b share ≥ 3 affordances
THEN INFER entity_a similar_to entity_b
```

### INF008 — Lesson Ordering

Concrete entities should precede abstract ones in lesson progression.

### INF009 — Concept Prerequisite

Required concepts must be learned before templates that use them.

### INF010 — Cultural Context

Flag cultural affordances without direct language mapping for special
pedagogical treatment.

---

## 5. Provenance

Provenance is not optional in the SRE. Every node and edge in the
runtime graph carries:

```yaml
provenance:
  source_file: "languages/mi/surface_forms.yaml"
  source_line: 142
  compiler_version: "0.1.0"
  timestamp: "2026-07-20T12:00:00Z"
  hash: "sha256:a1b2c3..."
```

Audio references carry additional provenance:

```yaml
audio_ref:
  ref: "wai.mp3"
  package: "mi_teaka_v1"
  source_url: "https://maoridictionary.co.nz/word/9019"
  retrieved: "2026-07-20"
  source_license: "Copyright John C Moorfield — educational use"
```

This enables:
- **Auditability** — Every fact can be traced to its source.
- **License compliance** — Applications can enforce per-asset licensing.
- **Community attribution** — Contributors receive credit for their data.
- **Error correction** — Erroneous facts can be traced and corrected.

---

## 6. Layered Licensing

The SRE uses a layered licensing model to respect both software freedom
and community data sovereignty:

| Layer | License |
|-------|---------|
| Engine (core/, scripts/, compiler) | Apache 2.0 |
| Language packages | Community chooses |
| Voice packages | Contributor chooses |
| Media assets | Original license retained |

The engine is fully open source (Apache 2.0) — anyone can use it,
modify it, build commercial products on it, without asking permission.

Language data remains under community control. A Māori community may
choose CC BY-SA 4.0, a traditional knowledge license, or any other
terms they consider appropriate. The compiler preserves license
metadata through compilation, so the runtime graph can enforce
per-asset restrictions if needed.

This is a deliberate design decision: the _infrastructure_ is shared,
but the _knowledge_ belongs to its creators.

---

## 7. Implementation: River World

The first application is an offline Progressive Web App (PWA) called
River World — a Māori–English–Afrikaans learning experience.

### Corpus

- **33 entities** across 8 categories (THING, PERSON, ACTION, STATE,
  PLACE, ANIMAL, EMOTION, QUALITY)
- **99 surface forms** (33 × 3 languages)
- **10 experiences** (stories, observations, procedures, dialogues)
- **48 graph edges** (relationships, affordances, interactions)
- **38% inference yield** (percentage of total edges derived by
  inference rules rather than written manually)

### Voice packages

- **mi_teaka_v1** — 30 native speaker recordings from Te Aka Māori
  Dictionary, covering 32 of 33 Māori surface forms
- **en_placeholder_v1** — English TTS fallback
- **af_placeholder_v1** — Afrikaans TTS fallback

### Architecture

The app runs entirely in the browser:

1. **Data layer** — Compiled JS bundles (experiences, surface forms,
   voice packages)
2. **Audio layer** — Fallback chain: native recording → other package
   recording → Web Speech API TTS
3. **Application layer** — Experience renderer, language selector,
   voice package selector, entity chip system for inline audio
4. **Offline layer** — Service worker caches all assets; no backend

### Semantic density

The River World corpus achieves a semantic density of approximately
0.7 entities per sentence (target: 0.5+ for beginner content) and an
entity reuse ratio of approximately 0.6 (target: 0.6+ for intermediate
content), indicating strong graph cohesion.

---

## 8. Related Work

### Language documentation

Tools like ELAN [4], FLEx [5], and SayMore [6] are widely used for
linguistic fieldwork. They excel at annotation, transcription, and
interlinear glossing but do not produce learning applications. The SRE
complements these tools by consuming their output (or equivalent data)
and producing a pedagogically structured runtime graph.

### Language learning platforms

Duolingo, Memrise, and Anki are effective for vocabulary acquisition
but model word pairs rather than semantic relationships. They do not
preserve community provenance or support offline deployment for
underserved communities.

### Semantic networks

WordNet [7], FrameNet [8], and ConceptNet [9] model lexical and
conceptual relationships at scale. The SRE's entity graph is similar
in spirit but designed for smaller, curated corpora where every fact
has traceable provenance. The SRE also adds affordances (action
possibilities) as a first-class semantic primitive, which is absent
from most lexical databases.

### Multilingual semantic models

BabelNet [10] and other multilingual ontologies project meaning across
languages automatically. The SRE does not attempt automatic projection —
it requires human-authored mappings — but it does provide the
structural framework for those mappings to be composed, validated, and
deployed.

---

## 9. Limitations and Future Work

### Limitations

1. **Scale** — The SRE is designed for curated rather than corpus-
   driven language models. It is appropriate for endangered languages
   with limited documentation but would not replace statistical or
   neural approaches for large languages with abundant data.

2. **Grammar** — The current implementation handles surface forms and
   pronunciations but does not model inflectional morphology or syntax
   beyond sentence templates. Full grammatical modelling is future work.

3. **Speaker requirement** — The system requires a speaker who can
   model entities, write surface forms, and compose experiences. For
   languages with no living speakers, the SRE can serve as a repository
   for historical documentation but cannot generate new content.

4. **Audio quality** — Current voice packages rely on existing
   recordings (Te Aka Māori Dictionary) whose license terms may not
   permit redistribution. Community-recorded replacements are needed
   for production use.

### Future work

1. **White paper publication** — Formal publication in a linguistics or
   language technology venue.
2. **Corpus expansion** — Scaling River World from 10 to 50+ experiences
   to validate graph cohesion at larger sizes.
3. **Additional languages** — Adding languages from different families
   (Polynesian, Germanic, Bantu, etc.) to stress-test the language-
   independent core.
4. **Grammar modelling** — Adding morphological paradigm support and
   syntactic template composition.
5. **Community pilot** — Deploying with an endangered-language community
   to test real-world usability and iterating on the workflow.
6. **Import tools** — Building converters from existing dictionary
   formats (XML, JSON, CSV) to reduce the cost of creating a new
   language package.

---

## 10. Conclusion

The Semantic Representation Engine proposes that language documentation
and teaching can be unified within a single semantic graph — that
vocabulary, pronunciation, audio, grammar, narrative, and learning
progression are not separate artefacts but projections of a shared
underlying model.

The architecture is deliberately minimal: entities represent what
exists, affordances represent what can happen, surface forms represent
how languages express these, and experiences place them in human
context. The compiler ensures consistency; provenance ensures
accountability; layered licensing ensures community control.

For the ~3,000 endangered languages where every fluent speaker counts,
this approach offers a path from raw documentation to deployable
learning application without requiring large datasets, cloud
infrastructure, or proprietary software.

---

## References

[1] Moseley, C. (ed.). (2010). *Atlas of the World's Languages in Danger*,
3rd ed. UNESCO Publishing.

[2] Krauss, M. (1992). "The world's languages in crisis." *Language*,
68(1), 4–10.

[3] Gibson, J. J. (1979). *The Ecological Approach to Visual Perception*.
Houghton Mifflin.

[4] Wittenburg, P., Brugman, H., Russel, A., Klassmann, A., & Slootjes, H.
(2006). "ELAN: a Professional Framework for Multimodality Research."
*Proceedings of LREC 2006*.

[5] SIL International. *FieldWorks Language Explorer (FLEx)*.
https://software.sil.org/fieldworks/

[6] SIL International. *SayMore*. https://software.sil.org/saymore/

[7] Miller, G. A. (1995). "WordNet: A Lexical Database for English."
*Communications of the ACM*, 38(11), 39–41.

[8] Baker, C. F., Fillmore, C. J., & Lowe, J. B. (1998). "The Berkeley
FrameNet Project." *Proceedings of COLING-ACL 1998*.

[9] Speer, R., Chin, J., & Havasi, C. (2017). "ConceptNet 5.5: An Open
Multilingual Graph of General Knowledge." *Proceedings of AAAI 2017*.

[10] Navigli, R., & Ponzetto, S. P. (2012). "BabelNet: The Automatic
Construction, Evaluation and Application of a Wide-Coverage Multilingual
Semantic Network." *Artificial Intelligence*, 193, 217–250.

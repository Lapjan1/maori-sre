# SRE Formal Semantics

> *Mathematical description of the Semantic Representation Engine. This is the source of truth for all reasoning about the system.*

---

## 1. Universe of Discourse

Let **E** be the set of all entities.
Let **C** be the set of ontology categories.
Let **M** be the set of modality types.
Let **R** be the set of relationship types.
Let **A** be the set of action types.
Let **L** be the set of language codes.
Let **S** be the set of surface forms (strings).
Let **P** be the set of provenance records.

## 2. Entity

An entity is a tuple:

```
e ∈ E
e = (id, cat, label, def, props)
```

where:
- `id` — unique identifier, format `[CAT]_NNN`
- `cat ∈ C` — exactly one ontology category
- `label` — non-empty set of labels, with a distinguished `default` label
- `def` — optional prose definition
- `props` — optional key-value properties

**Invariant**: `id` is permanent. Once assigned, it is never reassigned.

## 3. Representation

A representation is a tuple:

```
r ∈ Rep
r = (e_id, mod, content, media, meta)
```

where:
- `e_id ∈ E` — the entity being represented
- `mod ∈ M` — the modality of this representation
- `content` — the representation data (structure depends on modality)
- `media` — optional set of media file references
- `meta` — provenance metadata

**Constraint**: For a given `e_id` and `mod`, there exists at most one representation with substantially identical content.

## 4. Affordance

An affordance is a tuple:

```
a ∈ Aff
a = (e_id, act, desc, actors, outcome, equip, cultural)
```

where:
- `e_id ∈ E` — the entity that affords the action
- `act ∈ A` — the action afforded
- `desc` — natural language description
- `actors ⊆ C` — entity categories that typically realize this affordance
- `outcome ⊆ E` — expected resulting states/emotions
- `equip` — optional required equipment
- `cultural` — boolean flag with optional notes

**Constraint**: Each affordance describes a *possible* action, not a static property.

## 5. Interaction

An interaction is a tuple:

```
i ∈ Int
i = (i_id, parts, act, time, loc, outcomes, lang_ex, superseded)
```

where:
- `i_id` — unique interaction identifier
- `parts` — set of participant-role pairs, at least one with role=Actor
- `act ∈ A` — the action performed
- `time` — optional temporal specification (absolute or relative)
- `loc` — optional location
- `outcomes` — optional set of resulting entities
- `lang_ex` — optional language-specific example sentences
- `superseded` — optional reference to a superseding interaction

**Invariant**: Once recorded, an interaction is immutable. If erroneous, it is marked `superseded`, not deleted.

## 6. Relationship

A relationship is a tuple:

```
rel ∈ Rel
rel = (src, type, tgt, strength, meta)
```

where:
- `src ∈ E` — source entity
- `type ∈ R` — relationship type from the defined taxonomy
- `tgt ∈ E` — target entity (must differ from src)
- `strength ∈ [0, 1]` — how typical or defining
- `meta` — provenance metadata

**Constraint**: No cycles in `is_a` or `part_of` chains.

## 7. Language Mapping

A language mapping is a function:

```
λ : L → (E → S × Pron × Gram × Usage)
```

where:
- `L` — language codes
- `E` — entities
- `S` — surface forms (words/phrases)
- `Pron` — pronunciation (IPA, approximation, audio path)
- `Gram` — grammatical properties (word class, inflection rules)
- `Usage` — usage notes (register, dialect, frequency, disambiguation)

**Invariant**: No language is privileged. All mappings are equally projections over the same semantic space.

## 8. Grammar Projection

A grammar projection is a function:

```
γ : L × T → (RoleBindings → SurfaceString)
```

where:
- `T` — set of sentence templates
- `RoleBindings` — a mapping from semantic roles to entity IDs
- `SurfaceString` — a well-formed sentence in the target language

## 9. Provenance

Every compiled artifact carries a provenance record:

```
p ∈ P
p = (source_file, source_line, compiler_version, timestamp, hash)
```

**Invariant**: Every node and edge in the runtime graph must have a provenance record tracing it to specific canonical source.

## 10. Confidence

Every fact has a confidence score:

| Source Type | Default Confidence |
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

## 11. Compilation

Compilation is a function:

```
compile : Source → RuntimeGraph
```

where:
- `Source` — set of validated canonical documents
- `RuntimeGraph` — a tuple `(N, E_edges, R_edges, A_edges, Indexes)`
  - `N` — set of graph nodes (one per entity + derived nodes)
  - `E_edges` — entity relationship edges
  - `R_edges` — representation edges
  - `A_edges` — affordance edges
  - `Indexes` — search indexes (text, embedding, frequency)

**Invariant**: Compilation is deterministic. Same source + same compiler version → same runtime graph.

# SRE Cardinality Rules

> *The number of things that may exist.*

---

## Entity

| Relation | Cardinality | Notes |
|----------|-------------|-------|
| Entity → Category | exactly 1 | One ontology category per entity |
| Entity → Label | 1..N | At least one label; one must be `default` |
| Entity → Definition | 0..1 | Optional prose |
| Entity → Properties | 0..1 | Optional, arbitrary key-value |

## Representation

| Relation | Cardinality | Notes |
|----------|-------------|-------|
| Entity → Representation | 0..N | An entity may have many representations |
| Representation → Entity | exactly 1 | Each representation belongs to one entity |
| Representation → Modality | exactly 1 | One modality per representation |
| Entity × Modality → Content | 0..1 | At most one representation per (entity, modality) with same content |

## Affordance

| Relation | Cardinality | Notes |
|----------|-------------|-------|
| Entity → Affordance | 0..N | An entity may afford many actions |
| Affordance → Entity | 1..N | An affordance may apply to multiple entities |
| Affordance → Action | exactly 1 | Each affordance references one action |
| Affordance → Typical Actor | 0..N | Zero or more actor categories |
| Affordance → Typical Outcome | 0..N | Zero or more outcome entities |

## Interaction

| Relation | Cardinality | Notes |
|----------|-------------|-------|
| Interaction → Participants | 1..N | At least one participant (must include Actor) |
| Participant → Entity | exactly 1 | Each participant is an entity |
| Interaction → Action | exactly 1 | One action per interaction |
| Interaction → Time | 0..1 | Optional |
| Interaction → Location | 0..1 | Optional |
| Interaction → Outcome | 0..N | Optional outcomes |

## Relationship

| Relation | Cardinality | Notes |
|----------|-------------|-------|
| Relationship → Source | exactly 1 | One source entity |
| Relationship → Target | exactly 1 | One target entity (≠ source) |
| Relationship → Type | exactly 1 | One type from taxonomy |
| (Source, Type, Target) | 0..1 | No duplicate relationships |

## Language Mapping

| Relation | Cardinality | Notes |
|----------|-------------|-------|
| Entity × Language → Surface | 0..1 | Zero or one surface form per entity per language |
| Entity × Language → Pronunciation | 0..1 | Zero or one pronunciation record |
| Entity × Language → Disambiguation | 0..1 | Only present for partial mappings |

## Grammar Projection

| Relation | Cardinality | Notes |
|----------|-------------|-------|
| Language × Template → Renderer | exactly 1 | Every language must define rendering for each active template |
| Template → Role | 1..N | At least one role binding per template |

## Provenance

| Relation | Cardinality | Notes |
|----------|-------------|-------|
| Runtime Node → Provenance | exactly 1 | Every node traces to source |
| Runtime Edge → Provenance | exactly 1 | Every edge traces to source |

## Plugin

| Relation | Cardinality | Notes |
|----------|-------------|-------|
| Compiler → Plugin | 0..N | Zero or more plugins of each type |
| Embedding Plugin → Runtime | optional | Embeddings are never mandatory |

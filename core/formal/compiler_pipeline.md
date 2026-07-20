# SRE Compiler Pipeline

> *The compiler transforms canonical source documents into a runtime graph. This document defines the pipeline stages, their inputs and outputs, and the order guarantees.*

---

## Overview

```
Source Files
    │
    ▼
┌─────────────┐
│  Stage 1    │  Loader
│  Load       │  - Discover source files (*.yaml, *.json, *.md)
└─────────────┘  - Parse into document objects
    │             - Group by document type
    ▼
┌─────────────┐
│  Stage 2    │  Validator
│  Validate   │  - Schema validation (JSON Schema)
└─────────────┘  - Contract validation (domain invariants)
    │             - Reference resolution
    │             - Cycle detection
    ▼
┌─────────────┐
│  Stage 3    │  Diagnoser
│  Diagnose   │  - Produce structured diagnostics
└─────────────┘  - Error codes with file:line precision
    │             - Suggested fixes
    │             - Halt on errors, report warnings
    ▼
┌─────────────┐
│  Stage 4    │  Inferer
│  Infer      │  - Apply inference rules (INF001–INF010)
└─────────────┘  - Derive implicit affordances, relationships, similarities
    │             - Attach provenance and confidence
    ▼
┌─────────────┐
│  Stage 5    │  Graph Builder
│  Build      │  - Create graph nodes for entities
└─────────────┘  - Create graph edges for relationships, affordances
    │             - Attach representations as node properties
    │             - Attach language mappings as node properties
    ▼
┌─────────────┐
│  Stage 6    │  Provenance Attacher
│  Provenance │  - Trace every node and edge to source
└─────────────┘  - Store source_file, line, compiler_version, timestamp, hash
    │
    ▼
┌─────────────┐
│  Stage 7    │  Indexer
│  Index      │  - Full-text search index (labels, definitions, surface forms)
└─────────────┘  - Frequency index (for spaced repetition)
    │             - Relationship index (fast graph traversal)
    ▼
┌─────────────┐
│  Stage 8    │  Lesson Builder (plugin)
│  Lessons    │  - Traverse graph to produce progression paths
└─────────────┘  - Assign entities and templates to levels
    │             - Unlock games and interactions
    ▼
┌─────────────┐
│  Stage 9    │  Grammar Builder (plugin)
│  Grammar    │  - Pre-compile sentence templates per language
└─────────────┘  - Produce rendering functions
    │
    ▼
┌─────────────┐
│  Stage 10   │  Embedding Builder (plugin, optional)
│  Embeddings │  - Generate vector embeddings for semantic search
└─────────────┘  - Skip if no embedding plugin configured
    │
    ▼
┌─────────────┐
│  Stage 11   │  Writer
│  Write      │  - Serialize runtime graph to storage
└─────────────┘  - Write indexes, caches, compiled grammar
    │             - Write compiler manifest (version, timestamp, source hash)
    ▼
      Runtime
```

## Pipeline Guarantees

1. **Stages 1–3 are deterministic and language-agnostic.** No plugin can change their behavior.

2. **Stage 3 (Diagnose) halts the pipeline on errors.** Warnings do not halt.

3. **Stages 4–7 are deterministic.** Same source always produces the same graph, indexes, and provenance.

4. **Stages 8–10 accept plugins.** Plugins may be swapped without changing core output.

5. **Stage 11 writes atomically.** Either all runtime artifacts are written, or none are. A partial write is treated as failure.

6. **Provenance is mandatory.** Stages 5–10 must attach provenance to every emitted artifact.

## Error Codes

| Code | Stage | Description |
|------|-------|-------------|
| E001 | 2 | Invalid schema — document does not match its JSON Schema |
| E002 | 2 | Missing required field |
| E003 | 2 | Unknown entity reference — entity_id not found |
| E004 | 2 | Cycle detected — relationship graph contains a cycle |
| E005 | 2 | Self-loop — entity references itself |
| E006 | 3 | Ambiguous mapping — entity has multiple surfaces in same language |
| E007 | 3 | Missing disambiguation — partial mapping lacks notes |
| E008 | 4 | Inference overflow — too many derived facts (configurable limit) |
| E009 | 6 | Missing provenance — artifact lacks source trace |
| E010 | 11 | Write failure — could not write runtime artifact |

## Compilation Modes

| Mode | Stages | Use Case |
|------|--------|----------|
| `validate` | 1–3 | CI, pre-commit hooks |
| `build` | 1–9 | Production compilation, no embeddings |
| `build --with-embeddings` | 1–10 | Full compilation with semantic search |
| `watch` | 1–11, re-run on file change | Development |

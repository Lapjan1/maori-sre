# Semantic Representation Engine (SRE)

> A compiler for structured semantic knowledge. Transforms canonical representations of entities, affordances, interactions, and language mappings into optimized runtime graphs for language learning, semantic search, and conversational AI.

## Repositories

```
core/           SRE-Core — compiler, canonical schemas, plugins, tests
languages/      SRE-Languages — language packages (maori, afrikaans, english, ...)
apps/           SRE-Apps — consumers of the runtime graph
```

## Quick Start

```bash
# Validate canonical source
sre validate core/canonical/examples/

# Compile to runtime graph
sre build core/canonical/examples/ --out core/runtime/

# Serve the runtime API
sre serve core/runtime/ --port 8080
```

## Applications

- **Māori Language Learning** — first application. Offline Māori–English–Afrikaans learning with speech recognition, TTS, and AI conversation.
- **Dictionary** — concept-aware multilingual dictionary browser.
- **Semantic Search** — search by meaning across all languages.

## Status

**v0.1** — Architecture frozen. Phase 2 (Compiler implementation) ready to begin.

## Architecture

| Layer | Path | Description |
|-------|------|-------------|
| Canonical Source | `core/canonical/` | JSON Schema — the source language of the SRE |
| Compiler | `core/compiler/` | Validates, compiles, and builds runtime artifacts |
| Runtime | `core/runtime/` | Compiled graph (immutable, never edited) |
| Plugins | `core/plugins/` | Optional embedding, storage, TTS, STT, lesson plugins |
| Formal | `core/formal/` | Mathematical semantics, inference rules, invariants |
| Tests | `core/tests/` | Golden output comparison, contract checks |
| Languages | `languages/` | Language packages (data only, no code) |
| Apps | `apps/` | Runtime consumers |

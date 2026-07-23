# SRE System Map

The architecture registry lives in JSON files under `architecture/`. This document provides a human-oriented overview.

## System Layers

```
LAYER 1: CORE ENGINE             core/                          (Python)
LAYER 2: DATA PACKAGES           packages/language-data/        (JS globals)
LAYER 3: RUNTIME APPS            apps/river-world/              (JS PWA)
LAYER 4: CONTRIBUTION TOOLS      apps/voice-contrib/            (JS tools)
LAYER 5: ACQUISITION AGENTS      scripts/                       (Node.js)
LAYER 6: DEPLOYMENT              docs/                          (GitHub Pages)
```

---

## Layer 1 — Core Engine (`core/`)

Python compiler library. Compiles YAML canonical source into a deterministic
runtime graph with forward-chaining inference. Not currently used by the
runtime apps (which use hand-authored JS data files), but is the formal
compilation pipeline.

Key sub-layers:
- **Compiler**: validate → build graph → infer → write
- **Canonical schemas**: JSON Schema for entities, affordances, interactions
- **Inference engine**: 5 rules (INF001-INF005) with confidence propagation
- **Language support**: SurfaceForm/VoicePackage dataclasses + JS generation

See `architecture/components.json` → core-compiler, core-languages, core-inference.

---

## Layer 2 — Data Packages (`packages/language-data/`)

The canonical data layer. All files are JS globals loaded in-browser.

| File | What it holds |
|------|---------------|
| `surface_forms.js` | Every surface form (mi/en/af) across all entities, with pronunciation + audio refs |
| `experiences.js` | 10 River World stories with multilingual content and entity arrays |
| `curriculum-wife.js` | 20 Wife's Core 20 essential Māori phrases |
| `contributions.js` | ~48 contribution records with governance lifecycle |
| `audio_index.js` | 131 Māori word → MP3 mappings (Te Aka dictionary) |
| `voice_packages.js` | 4 voice package definitions (mi_teaka, af_v1, placeholders) |
| `afrikaans-phrases.js` | Hannes' Afrikaans passage recordings |
| `phrase-composer.js` | Multi-word audio composition engine |
| `story-audio-resolver.js` | Sentence → audio unit sequence resolver |
| `audio-resolution.js` | Coverage analysis (direct/composed/partial/TTS) |
| `audio-coverage.js` | Coverage query layer over RequirementMatrix |
| `requirement-matrix.js` | (lang × entity × voice_type) status inventory |
| `audio.js` | Runtime playback: native → composed → TTS |

### Data Flow

```
surface_forms.js ─┬→ phrase-composer.js ─→ audio-resolution.js
                  ├→ story-audio-resolver.js
                  ├→ audio.js (runtime)
                  └→ requirement-matrix.js ─→ audio-coverage.js
```

---

## Layer 3 — Runtime App (`apps/river-world/`)

The Co-Sense dual-panel language learning PWA.

- `index.html` — entry point (also deployed as `docs/index.html`)
- `app.js` — main controller: curriculum rendering, language switching, review mode
- `audio.js` — audio playback layer (copy, modified for runtime)
- `session.js` — event-sourced learner log (localStorage)
- `sw.js` — service worker for offline caching
- Data files are **copies** of the packages/language-data/ originals

### Script Load Order (critical dependency chain)

```
experiences.js + surface_forms.js + curriculum-wife.js
    → voice_packages.js + audio_index.js + session.js
        → afrikaans-phrases.js + phrase-composer.js + story-audio-resolver.js
            → audio.js
                → app.js
```

---

## Layer 4 — Contribution Tools (`apps/voice-contrib/`)

Tools for recording and managing voice contributions.

| Page | Purpose |
|------|---------|
| `index.html` + `recorder.js` | Record audio, generate YAML+file bundles |
| `dashboard.html` | Coverage dashboard per language/voice type |
| `inventory.html` | Classify legacy recordings with voice types |
| `vocab-gap.html` | Prioritize vocabulary recording by coverage gain |
| `reviewer.js` | (Stub) Review workflow for Phase 2 |

---

## Layer 5 — Acquisition Agents (`scripts/`)

### Acquisition Planner (`acquisition-planner.js`)
The primary agent. Three planners:
1. **Structural planner** — rank candidates by immediate coverage gain
2. **Horizon planner** — 2-step trajectory planning for co-dependency clusters
3. **Probabilistic planner** — expected utility with calibrated distributions

**State files**:
- `.agent-state-hash` — SHA-256 of coverage state for change detection
- `.agent-prediction-ledger.json` — 17 prediction records with outcomes

### Support Scripts
- `story-gap-analysis.js` — per-sentence gap analysis
- `evaluate-acquisition-loop.js` — reconstruct and evaluate acquisition sequences
- `find-word-ids.js` — discover Te Aka word IDs by scanning ID ranges
- `download_teaka_audio.py` — download MP3s from Te Aka
- `add_provenance.py` / `update_yaml_audio.py` — integrate downloaded audio
- `build_app.py` — compile YAML → runtime graph
- `rebuild_js.py` — regenerate JS bundles from YAML

---

## Layer 6 — Deployment (`docs/`)

GitHub Pages serves `docs/` as `https://lapjan1.github.io/maori-sre/`.

### Path Translation

| Repo path | Served at |
|-----------|-----------|
| `docs/index.html` | `/maori-sre/` |
| `docs/voice-contrib/index.html` | `/maori-sre/voice-contrib/` |
| `docs/packages/language-data/*.js` | `/maori-sre/packages/language-data/` |
| `docs/voices/*/audio/*` | `/maori-sre/voices/*/audio/*` |

**Critical**: Script paths must be relative to the GitHub Pages site root
(`/maori-sre/`), not the repo root. This differs from development paths
where scripts resolve from `apps/river-world/`.

---

## Recording Policy (Language Policy)

Every surface form in the curriculum must eventually have explicit audio
recordings for all four voice profiles:

| Voice Type | Label |
|------------|-------|
| `male_adult` | Male adult |
| `female_adult` | Female adult |
| `male_child` | Male child |
| `female_child` | Female child |

Coverage status per voice type:
- **explicit** — has audio_ref tagged with this voice_type
- **legacy** — has audio_refs but none tagged (voice_type: null)
- **missing** — no audio_refs at all

Current state (mi_teaka_v1): all 131 entries are **legacy** (voice_type: null).
Classification via inventory tool is the next step.

---

## Contribution Governance Pipeline

```
pending → validated → approved → canonical
    ↓ (any stage)
  rejected
```

- **pending**: proposed with source + speaker metadata
- **validated**: source confirmed, file integrity checked
- **approved**: entity_id + voice_type assigned; recording becomes playable
- **canonical**: permanent inclusion; irreversible
- **rejected**: record preserved for audit

Runtime gate: `CONTRIBUTIONS.isRefPlayable()` checks approved/canonical status.

---

## Registers

| Registry | File | What it records |
|----------|------|-----------------|
| Components | `architecture/components.json` | Every file, its exports, dependencies, and consumers |
| Structures | `architecture/structures.json` | Every data type, its fields, and consuming components |
| Flows | `architecture/flows.json` | Every pipeline, state transition, and feedback loop |
| Experiments | `architecture/experiments.json` | Experiments, architectural decisions, and findings |

---

## Maintenance

The architecture agent (`architecture-tracker`) observes `git diff` and
proposes updates to the JSON registries when components are added or
changed. See `.agents/architecture-tracker/SKILL.md`.

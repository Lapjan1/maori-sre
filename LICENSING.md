# Licensing

The SRE project uses a **layered licensing model**. Different parts of the
project have different licenses by design. This lets communities control
their own language data while sharing the engine.

## Layers

```
Layer                 License
─────────────────────────────────────────────────────
SRE Core (engine)     Apache 2.0
Compiler              Apache 2.0
Runtime               Apache 2.0
Formal specs          Apache 2.0
Scripts / tools       Apache 2.0
Test framework        Apache 2.0

Language packages    Varies per package
Voice packages       Varies per package
Media / recordings   Varies per asset
Application code     Varies per application
```

## The engine is open

Everything under `core/`, `scripts/`, and the compiler is Apache 2.0.
You can use it, modify it, distribute it, build commercial products on
top of it. Attribution is required. Patent protection is included.

## Language packages have their own licenses

A language package (`languages/`) contains the semantic data for one
language: entity definitions, surface forms, grammar mappings,
pronunciation guides. Each package has its own `LICENSE` file in its
root directory.

- A community may choose **CC BY-SA 4.0** to share freely.
- A language with existing documentation standards may use a specific
  compatible license.
- A community may choose a more restrictive license if needed.

The SRE project does not dictate what license a language package must
use. The compiler preserves provenance and license metadata for every
asset at compile time, so it is always clear what license applies.

## Voice packages have their own licenses

Voice packages (`voices/`) contain audio recordings, either recorded
by native speakers or synthesised. Each voice package has its own
license.

- Our Māori voice package (mi_teaka_v1) uses audio from Te Aka Māori
  Dictionary, used under educational fair-dealing principles. Long-term,
  community-recorded replacements are planned.
- Placeholder voice packages use CC BY-SA 4.0 because they contain no
  real audio.
- A community that records its own speakers may choose any license.

## Media and recording provenance

The SRE compiler tracks provenance for every audio_ref:

```yaml
audio_refs:
  - ref: wai.mp3
    package: mi_teaka_v1
    speaker: Te Aka Māori Dictionary
    source_url: https://maoridictionary.co.nz/word/9019
    retrieved: 2026-07-20
    source_license: Copyright John C Moorfield — educational use
```

This metadata is carried through compilation and into the runtime graph.
Applications can display it, audit it, or enforce license restrictions.

## Why layered licensing?

Most language software falls into one of two camps:

1. **Proprietary** — the community contributes data, but the company
   owns it. The community has no control.
2. **All-or-nothing open source** — everything must use the same license.
   Communities lose control of their cultural data.

Layered licensing gives communities the best of both:

- The **engine** is open — anyone can build tools, apps, and research
  on it without asking permission.
- The **data** is controlled by its creators — a community can publish
  its language under terms it chooses.

This is not a compromise. It is a deliberate design decision that
respects both software freedom and cultural sovereignty.

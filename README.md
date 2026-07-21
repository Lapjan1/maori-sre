# Semantic Representation Engine (SRE)

> An open semantic infrastructure for documenting, teaching, and
> preserving human languages.

Languages are not dictionaries. Language emerges from shared experience.
Existing software usually models words. SRE models meaning.

**[Read why this project exists →](WHY.md)**

## Quick start

```bash
# Validate canonical source
sre validate core/canonical/examples/

# Compile to runtime graph
sre build core/canonical/examples/ --out core/runtime/

# Serve the runtime API
sre serve core/runtime/ --port 8080
```

## Documentation

| Document | What it covers |
|----------|---------------|
| [WHY.md](WHY.md) | Vision and motivation |
| [ARCHITECTURE.md](ARCHITECTURE.md) | How the system fits together |
| [LICENSING.md](LICENSING.md) | Licensing philosophy (layered model) |
| [CONTRIBUTING.md](CONTRIBUTING.md) | How to contribute |
| core/formal/*.md | Formal semantics and invariants |
| core/sre-domain-contracts-v0.1.md | Domain contracts |

## Repository layout

```
core/           SRE-Core — compiler, canonical schemas, plugins, tests
languages/      SRE-Languages — language packages (maori, afrikaans, english, ...)
apps/           SRE-Apps — consumers of the runtime graph
experiences/    SRE-Experiences — structured narratives
scripts/        Build and utility scripts
```

## Status

**v0.1** — Architecture frozen. Compiler implementation in progress.
First application (River World PWA) live at
[lapjan1.github.io/maori-sre/](https://lapjan1.github.io/maori-sre/).

## License

The SRE engine (core/, scripts/, compiler) is Apache 2.0.
Language packages, voice packages, and media assets have their own
licenses. See [LICENSE](LICENSE) and [LICENSING.md](LICENSING.md).

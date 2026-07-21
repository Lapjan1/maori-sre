# Knowledge Representation — Literature Map

**Status:** Outline. Ready for population by reviewer.

## Core question
How has AI and computer science represented meaning, and where does
SRE fit in that landscape?

## Current references
- [7] Miller (1995) — WordNet
- [8] Baker et al (1998) — FrameNet
- [9] Speer et al (2017) — ConceptNet
- [10] Navigli & Ponzetto (2012) — BabelNet
- [13] Lenat (1995) — Cyc
- [14] Niles & Pease (2001) — SUMO
- [15] Gangemi et al (2002) — DOLCE
- [12] Bird & Simons (2003) — Portability

## Landscape

### Formal ontologies (top-down)
Cyc, SUMO, DOLCE — philosophically rigorous but too heavy for language
documentation by non-specialists. SRE's flat 8-category system is
deliberately simpler.

### Lexical semantics (word-level)
WordNet (synsets), FrameNet (frames), BabelNet (multilingual) — model
word-to-concept relationships. SRE starts from concepts, not words,
reversing the direction.

### Semantic graphs (crowd-sourced)
ConceptNet — large coverage, weak provenance. SRE makes the opposite
trade-off: small coverage, strong provenance.

### Graph standards (engineering)
RDF, OWL, SPARQL — the Semantic Web stack. SRE does not use these.
Its graph is an application-specific JS object, not a standards-compliant
knowledge graph. This is a limitation for interoperability.

## Papers to find (suggested)
- Berners-Lee et al (2001) — The Semantic Web
- Sowa (1984) — Conceptual Structures
- Guarino (1998) — Formal Ontology and Information Systems
- Hitzler et al (2009) — OWL primer
- RDF 1.1 specification

## Research lineage note
> SRE's entity graph shares structural features with conceptual graphs
> (Sowa) and frame-based KR (Minsky), but its design priorities are
> determined by the language documentation use case: small curated
> graphs with full provenance, rather than large inference-oriented
> knowledge bases.

# SRE Validation Metrics

## Corpus metrics (current)
Measured from River World v1 compiled bundles.

| Metric | Value | Notes |
|---|---|---|
| Entities | 33 | 8 categories |
| Surface forms | 99 | 33 x 3 languages |
| Languages | 3 | Maaori, English, Afrikaans |
| Experiences | 10 | stories, dialogues, procedures |
| Graph edges | 48 | relationships + affordances + interactions |
| Inferred edges | 18 | from INF001-INF010 |
| Inference yield | 38% | inferred / total edges |
| Semantic density | 0.70 | entities per sentence |
| Entity reuse | 0.60 | fraction of experiences per entity |
| Runtime size | 65 KB | all JS bundles (uncompressed) |
| Audio recordings | 30 | Maaori, from Te Aka dictionary |

## Educational metrics (targets)
To be measured in Experiment 003.

| Metric | Control (flashcard) | Treatment (River World) | Target delta |
|---|---|---|---|
| Immediate recall (24h) | TBD | TBD | +20% |
| Transfer (novel sentences) | TBD | TBD | +0.5 SD |
| Sentence generation | TBD | TBD | +1.0 SD |
| Delayed recall (7d) | TBD | TBD | +30% |

## Extensibility metrics (targets)
To be measured in Experiment 005.

| Metric | Target |
|---|---|
| Person-hours to add language | < 4 |
| Compiler changes required | 0 |
| Lines of config per language | < 100 |

## Computational metrics (current)

| Metric | Value |
|---|---|
| Compile time | N/A (no compiler) |
| Determinism | N/A (no compiler) |
| Bundle hash stability | N/A (manual build) |

# SRE Experience Format v0.1

> *An experience is the smallest complete learning unit. Every experience contains semantic structure embedded in human context.*

---

## Types

| Type | Description | Example |
|------|-------------|---------|
| `story` | A narrative with arc | "The child drinks water" |
| `dialogue` | A conversation between actors | "Kia ora" — "Kia ora e hoa" |
| `observation` | A factual statement | "The tree is tall" |
| `procedure` | A sequence of actions | "Wash your hands" |
| `question` | An interrogative | "Where is the river?" |
| `song` | A musical/rhythmic text | A waiata or nursery rhyme |
| `proverb` | A culturally compressed saying | "He aha te mea nui o te ao" |
| `game` | A structured play activity | Memory card matching |

## Common Structure

All experience types share:

```yaml
experience_id: NATURE_001
type: story                              # one of the types above
level: 1
title:
  en: "..."
  mi: "..."
  af: "..."
content:                                  # type-specific content
  en: "..."
  mi: "..."
  af: "..."
entities: [...]                           # entities introduced or used
affordances: [...]                        # affordances to add
interactions: [...]                       # interactions to record
relationships: [...]                      # relationships to establish
language_mappings: [...]                  # lexical realizations
metadata:
  difficulty: 1-10
  cognitive_load: low|medium|high
  emotional_weight: low|medium|high
  cultural_centrality:
    mi: low|medium|high                   # per language
    en: low|medium|high
    af: low|medium|high
  concepts_taught: [...]
  grammar_patterns: [...]
```

---

## Metrics

Every experience is measured for:

**Semantic Density**

```
density = (entities + affordances + interactions + relationships) / word_count
```

Higher density = richer learning per word. Target: 0.5+ for beginner content.

**Reuse Ratio**

```
reuse = existing_entities / total_entities
```

Higher reuse = better graph cohesion. Target: 0.6+ for intermediate content.

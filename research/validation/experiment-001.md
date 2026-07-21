# Experiment 001: Linguistic Ontology Review

## Question
Is the SRE ontology (entities, categories, affordances, relationships)
internally coherent from a linguistic perspective?

## Method
Structured self-review using criteria from linguistic ontology design.

## Criteria

### Category boundaries
For each pair of categories (THING/ANIMAL, ACTION/STATE, etc.):
- Can an entity belong to both? If so, is the boundary clear?
- Are there borderline cases in the River World corpus?

### Affordance granularity
- Are affordances attached to the right entities?
- Example: "drink" is an ACTION entity that appears as an affordance
  of water, river, and cup. Is this circular (ACTION affords ACTION)?
- Should affordances be properties of entities or independent entities?

### Relationship consistency
- Verify all is_a chains are acyclic.
- Verify all part_of chains are acyclic.
- Check for redundant edges (is_a + affordance inheritance).

### Language mapping completeness
- Does every entity have at least one surface form per declared language?
- Are missing mappings documented (e.g., cultural concepts with no
  direct equivalent)?

## Corpus to review
- 33 entities across 8 categories
- 99 surface forms across 3 languages
- 48 graph edges
- 10 inference rules

## Deliverable
Written review (2-3 pages) addressing each criterion with specific
examples from the River World corpus. Recommendations for ontology
changes if needed.

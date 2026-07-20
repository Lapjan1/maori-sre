# SRE Content Plan: 500 Semantic Entities

> *A progression from concrete to abstract, designed to test the semantic model at scale.*

---

## Principles

1. **Concrete before abstract** — start with observable THING entities, build to states and social constructs.
2. **High-frequency first** — entities a learner encounters daily before specialized or rare ones.
3. **Minimum viable contrast** — include minimal pairs (cup/glass/mug) to test distinguishability.
4. **Cultural density** — deliberately include concepts with asymmetrical language mappings.
5. **Affordance richness** — each entity should afford 2–5 actions, increasing with complexity.

---

## Domain Breakdown

| # | Domain | Count | Key Entities | Tests |
|---|--------|-------|-------------|-------|
| 1 | Nature | 50 | water, tree, river, mountain, sky, earth, fire, wind, rain, snow, cloud, sun, moon, star, ocean, lake, forest, rock, sand, grass, flower, leaf, seed, root, branch, bird, fish, insect, animal, dog, cat, cow, horse, sheep, pig, chicken, mouse, snake, frog, turtle, whale, dolphin, eagle, owl, spider, bee, ant, butterfly, worm, shell | Cultural asymmetry (snow), affordance chains |
| 2 | Food | 40 | bread, rice, milk, egg, fish, meat, apple, banana, orange, grape, water, juice, tea, coffee, sugar, salt, honey, butter, cheese, soup, salad, cake, cookie, chocolate, corn, potato, tomato, onion, garlic, lemon, coconut, mango, melon, berries, nuts, oil, vinegar, pepper, spices, meal | Polysemy (chicken = animal + food) |
| 3 | Body | 30 | head, hair, face, eye, ear, nose, mouth, tooth, tongue, neck, shoulder, arm, hand, finger, thumb, chest, back, stomach, leg, knee, foot, toe, skin, bone, heart, lung, blood, brain, muscle, voice | Part_of hierarchy depth |
| 4 | Family & People | 30 | mother, father, child, baby, brother, sister, grandmother, grandfather, aunt, uncle, cousin, friend, neighbour, chief, teacher, doctor, baby, teenager, adult, elder, ancestor, descendant, husband, wife, family, community, stranger, guest, host, name | Cultural: whānau vs family |
| 5 | House & Home | 30 | house, room, door, window, floor, wall, roof, bed, table, chair, cupboard, kitchen, bathroom, bedroom, garden, fence, gate, key, lamp, mirror, clock, shelf, drawer, stairs, balcony, yard, shed, chimney, mat, curtain | Part_of depth |
| 6 | Clothing | 20 | shirt, pants, dress, skirt, jacket, coat, shoe, sock, hat, belt, glove, scarf, glasses, ring, necklace, uniform, pocket, button, zip, fabric | Cultural variation |
| 7 | Actions (Core) | 50 | eat, drink, sleep, wake, sit, stand, walk, run, jump, swim, fly, crawl, climb, fall, push, pull, lift, carry, throw, catch, open, close, enter, exit, give, take, buy, sell, speak, listen, see, hear, touch, smell, taste, think, know, remember, forget, want, need, like, dislike, love, fear, hope, believe, create, destroy, change | Verb-argument structure variety |
| 8 | States & Emotions | 40 | happy, sad, angry, afraid, calm, excited, tired, hungry, thirsty, sick, healthy, hot, cold, warm, cool, wet, dry, clean, dirty, full, empty, bright, dark, loud, quiet, fast, slow, heavy, light, hard, soft, rough, smooth, sharp, dull, new, old, young, strong, weak | Metaphor (heavy = difficult) |
| 9 | Places & Travel | 30 | home, school, work, shop, market, hospital, church, park, beach, forest, city, village, road, path, bridge, river, mountain, field, farm, airport, station, port, island, cave, valley, hill, desert, jungle, north, south | Spatial relations |
| 10 | Time | 25 | day, night, morning, afternoon, evening, today, yesterday, tomorrow, week, month, year, season, spring, summer, autumn, winter, hour, minute, second, now, then, before, after, always, never | Temporal relations |
| 11 | Numbers & Quantity | 15 | one, two, three, four, five, ten, hundred, many, few, all, some, none, half, whole, enough | Grammar agreement triggers |
| 12 | Weather & Environment | 20 | rain, wind, storm, thunder, lightning, cloud, fog, frost, ice, snow, flood, drought, heat, cold, season, climate, sky, horizon, shadow, rainbow | Cultural: multiple snow words |
| 13 | School & Work | 25 | teacher, student, lesson, book, pen, paper, desk, board, homework, exam, class, school, university, work, job, boss, colleague, meeting, office, computer, phone, letter, email, news, story | Abstract affordances |
| 14 | Faith & Culture | 30 | god, prayer, song, ceremony, blessing, sacred, feast, holiday, tradition, ancestor, spirit, soul, symbol, ritual, priest, temple, gathering, offering, thanksgiving, creation, story, proverb, chief, elder, welcome, farewell, gift, guest, host, peace | Cultural density, disambiguation |
| 15 | Social | 30 | greeting, farewell, thank you, please, sorry, yes, no, help, share, give, receive, visit, invite, accept, refuse, promise, agree, disagree, praise, blame, forgive, thank, celebrate, mourn, welcome, host, guest, friend, enemy, stranger | Speech act affordances |
| 16 | Grammar & Function Words | 35 | I, you (sg), you (pl), he, she, we, they, this, that, here, there, what, who, where, when, why, how, yes, no, not, and, or, but, if, because, very, too, also, only, still, already, yet, just, about, around | Function words with no entity mapping |

---

## Entity Creation Checklist

For each entity:

- [ ] Entity ID (CAT_NNN) consistent across all files
- [ ] Category assigned correctly
- [ ] Default label in English as lingua franca
- [ ] Definition (1 sentence, clear)
- [ ] At least 1 representation (visual or auditory)
- [ ] At least 2 affordances (action → outcome)
- [ ] At least 1 language mapping (English minimum)
- [ ] Māori language mapping with pronunciation
- [ ] Afrikaans language mapping with pronunciation
- [ ] Relationships to other entities (is_a, part_of, located_in, etc.)
- [ ] Common mistakes (if applicable)
- [ ] Cultural notes (if culturally specific)

---

## File Organization

```
languages/
  maori/
    language.yaml
    lexicon/        # entity → surface
    grammar/        # projection rules
  afrikaans/
    language.yaml
    lexicon/
    grammar/
  english/
    language.yaml
    lexicon/
    grammar/

content/
  nature/
    THING_001-water.yaml
    THING_100-tree.yaml
    ...
  food/
    ...
```

Each entity file is a self-contained canonical source document (YAML, multi-doc format).

---

## Quality Gates

| Milestone | Entities | Check |
|-----------|----------|-------|
| M1 | 50 | All validate without errors. Graph compiles. REPL queries work. |
| M2 | 150 | Polysemy tests pass. Cultural asymmetry mappings exist. |
| M3 | 300 | Distinguishability test passes. Lesson builder produces sensible progression. |
| M4 | 500 | All representation tests pass. Sentence generation works for 90% of templates. |

---

## Entity ID Ranges

| Range | Domain |
|-------|--------|
| THING_001–050 | Nature (elements, landscape) |
| THING_051–100 | Nature (plants, animals) |
| THING_101–140 | Food |
| THING_141–170 | Body |
| THING_171–200 | House & Home |
| THING_201–220 | Clothing |
| THING_221–250 | Places & Travel |
| THING_251–300 | (spare) |
| PERSON_001–050 | Family & People |
| PERSON_051–100 | School & Work |
| PLACE_001–050 | Specific places |
| ACTION_001–080 | Core actions |
| STATE_001–060 | States & emotions |
| PROPERTY_001–040 | Attributes |
| EVENT_001–030 | Complex events |
| TIME_001–030 | Time entities |
| QUANTITY_001–020 | Numbers & quantity |
| EMOTION_001–030 | Emotions (also covered by STATE) |
| SOCIAL_001–040 | Social constructs |
| RELATION_001–020 | Abstract relations |

Total allocated: ~730 IDs for 500 entities, leaving room for expansion.

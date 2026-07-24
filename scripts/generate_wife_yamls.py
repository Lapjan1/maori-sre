"""
Generate WIFE World YAML files from curriculum-wife.js data.
Creates 20 single-phrase story YAML files + surface_forms.yaml.
"""
import sys, json, os, re
from pathlib import Path

ROOT = Path(__file__).parent.parent
WIFE_DIR = ROOT / "experiences" / "wife_world"

# Preprocess: eval the JS to get CORE_20 array
# We'll just hardcode the key data from curriculum-wife.js
WIFE_PHRASES = [
    # (id, type, phrase_mi, phrase_en, phrase_af, entities, interactions, lang_entities)
    # entities: list of (entity_id, category, label_mi, label_en, label_af, definition)
    # interactions: (action, actor_ids, sentence_mi, sentence_en, sentence_af)
    # lang_entities: list of entity_ids that need language_mappings

    ("WIFE_001", "dialogue",
     "Kia ora.", "Hello / thank you.", "Hallo / dankie.",
     [("PHRASE_KIA_ORA", "PHRASE", "kia ora", "hello / thank you", "hallo / dankie",
       "The most important Māori word — hello, thank you, and good wishes.")],
     ("SOCIAL_GREET", ["PERSON_ANY"], "Kia ora.", "Hello.", "Hallo."),
     ["PHRASE_KIA_ORA"]),

    ("WIFE_002", "dialogue",
     "Kei te pēhea koe?", "How are you?", "Hoe gaan dit?",
     [("PHRASE_HOW_ARE_YOU", "PHRASE", "Kei te pēhea koe?", "How are you?", "Hoe gaan dit?",
       "A common greeting asking how someone is.")],
     ("SOCIAL_ASK_HEALTH", ["PERSON_ANY", "PERSON_ANY"], "Kei te pēhea koe?", "How are you?", "Hoe gaan dit?"),
     ["PHRASE_HOW_ARE_YOU"]),

    ("WIFE_003", "dialogue",
     "Kei te pai.", "I am well.", "Dit gaan goed.",
     [("PHRASE_I_AM_WELL", "PHRASE", "Kei te pai", "I am well", "Dit gaan goed",
       "Standard positive response to 'Kei te pēhea koe?'.")],
     ("SOCIAL_RESPOND", ["PERSON_ANY"], "Kei te pai.", "I am well.", "Dit gaan goed."),
     ["PHRASE_I_AM_WELL"]),

    ("WIFE_004", "dialogue",
     "Haere mai.", "Welcome / come here.", "Welkom / kom hier.",
     [("PHRASE_WELCOME", "PHRASE", "Haere mai", "Welcome", "Welkom",
       "Used to welcome someone arriving.")],
     ("SOCIAL_WELCOME", ["PERSON_ANY"], "Haere mai.", "Welcome.", "Welkom."),
     ["PHRASE_WELCOME"]),

    ("WIFE_005", "dialogue",
     "Ko [name] tōku ingoa.", "My name is [name].", "My naam is [name].",
     [("PHRASE_MY_NAME", "PHRASE", "tōku ingoa", "my name", "my naam",
       "Used to introduce yourself.")],
     ("SOCIAL_INTRODUCE", ["PERSON_ANY"], "Ko [name] tōku ingoa.", "My name is [name].", "My naam is [name]."),
     ["PHRASE_MY_NAME", "CONCEPT_INGOA", "POSSESSIVE_TOKU"]),

    ("WIFE_006", "dialogue",
     "Nō hea koe?", "Where are you from?", "Van waar af kom jy?",
     [("PHRASE_WHERE_FROM", "PHRASE", "Nō hea", "Where from?", "Waarvandaan?",
       "Ask someone where they are from.")],
     ("SOCIAL_ASK_ORIGIN", ["PERSON_ANY", "PERSON_ANY"], "Nō hea koe?", "Where are you from?", "Van waar af kom jy?"),
     ["PHRASE_WHERE_FROM", "CONCEPT_HEA"]),

    ("WIFE_007", "dialogue",
     "Nō Āwherika ki te Tonga ahau.", "I am from South Africa.", "Ek is van Suid-Afrika.",
     [("PHRASE_FROM_SA", "PHRASE", "Āwherika ki te Tonga", "South Africa", "Suid-Afrika",
       "South Africa — telling people where you are from.")],
     ("SOCIAL_SAY_ORIGIN", ["PERSON_ANY"], "Nō Āwherika ki te Tonga ahau.", "I am from South Africa.", "Ek is van Suid-Afrika."),
     ["PHRASE_FROM_SA", "PLACE_AWHERIKA", "PLACE_TONGA"]),

    ("WIFE_008", "dialogue",
     "Tēnā koutou.", "Greetings all.", "Groete aan almal.",
     [("PHRASE_GREET_ALL", "PHRASE", "Tēnā koutou", "Greetings all", "Groete aan almal",
       "Greeting three or more people at once.")],
     ("SOCIAL_GREET_GROUP", ["PERSON_ANY", "PERSON_GROUP"], "Tēnā koutou.", "Greetings all.", "Groete aan almal."),
     ["PHRASE_GREET_ALL", "DETERMINER_TENA", "PERSON_KOUTOU"]),

    ("WIFE_009", "dialogue",
     "Kei hea te wharepaku?", "Where is the bathroom?", "Waar is die badkamer?",
     [("PHRASE_WHERE_BATHROOM", "PHRASE", "wharepaku", "bathroom", "badkamer",
       "Ask where the bathroom is.")],
     ("SOCIAL_ASK_LOCATION", ["PERSON_ANY"], "Kei hea te wharepaku?", "Where is the bathroom?", "Waar is die badkamer?"),
     ["PHRASE_WHERE_BATHROOM", "THING_WHARE"]),

    ("WIFE_010", "dialogue",
     "Noho mai.", "Please sit / stay.", "Sit gerus / bly.",
     [("PHRASE_NOHO_MAI", "PHRASE", "Noho mai", "Please sit", "Sit gerus",
       "Invite someone to sit down.")],
     ("SOCIAL_OFFER_SEAT", ["PERSON_ANY", "PERSON_ANY"], "Noho mai.", "Please sit.", "Sit gerus."),
     ["PHRASE_NOHO_MAI"]),

    ("WIFE_011", "dialogue",
     "Kei te hiakai au.", "I am hungry.", "Ek is honger.",
     [("PHRASE_HUNGRY", "PHRASE", "hiakai", "hungry", "honger",
       "Let someone know you are hungry.")],
     ("SOCIAL_EXPRESS_NEED", ["PERSON_ANY"], "Kei te hiakai au.", "I am hungry.", "Ek is honger."),
     ["PHRASE_HUNGRY", "STATE_HIAKAI"]),

    ("WIFE_012", "dialogue",
     "Kei te matewai au.", "I am thirsty.", "Ek is dors.",
     [("PHRASE_THIRSTY", "PHRASE", "matewai", "thirsty", "dors",
       "Tell someone you are thirsty.")],
     ("SOCIAL_EXPRESS_NEED", ["PERSON_ANY"], "Kei te matewai au.", "I am thirsty.", "Ek is dors."),
     ["PHRASE_THIRSTY", "STATE_MATEWAI"]),

    ("WIFE_013", "dialogue",
     "He wai, koa.", "Some water, please.", "Water, asseblief.",
     [("PHRASE_WATER_PLEASE", "PHRASE", "He wai, koa", "Some water, please", "Water, asseblief",
       "A polite way to ask for water.")],
     ("SOCIAL_REQUEST", ["PERSON_ANY"], "He wai, koa.", "Some water, please.", "Water, asseblief."),
     ["PHRASE_WATER_PLEASE", "THING_WAI"]),

    ("WIFE_014", "dialogue",
     "Kia ora mō te kai.", "Thank you for the food.", "Dankie vir die kos.",
     [("PHRASE_THANK_FOOD", "PHRASE", "Kia ora mō te kai", "Thank you for the food", "Dankie vir die kos",
       "Graceful thanks before or after a meal.")],
     ("SOCIAL_THANK", ["PERSON_ANY"], "Kia ora mō te kai.", "Thank you for the food.", "Dankie vir die kos."),
     ["PHRASE_THANK_FOOD", "THING_KAI"]),

    ("WIFE_015", "dialogue",
     "Haere rā.", "Goodbye (to those staying).", "Totsiens (vir dié wat bly).",
     [("PHRASE_GOODBYE_STAY", "PHRASE", "Haere rā", "Goodbye (to those staying)", "Totsiens",
       "Use when you are leaving and others are staying.")],
     ("SOCIAL_FAREWELL", ["PERSON_ANY", "PERSON_ANY"], "Haere rā.", "Goodbye.", "Totsiens."),
     ["PHRASE_GOODBYE_STAY"]),

    ("WIFE_016", "dialogue",
     "E noho rā.", "Goodbye (to those leaving).", "Totsiens (as die een wat vertrek).",
     [("PHRASE_GOODBYE_LEAVE", "PHRASE", "E noho rā", "Goodbye (to those leaving)", "Totsiens",
       "Use when others are staying and you are leaving.")],
     ("SOCIAL_FAREWELL", ["PERSON_ANY", "PERSON_ANY"], "E noho rā.", "Goodbye.", "Totsiens."),
     ["PHRASE_GOODBYE_LEAVE"]),

    ("WIFE_017", "dialogue",
     "Ka hoki mai au.", "I will return.", "Ek sal weer kom.",
     [("PHRASE_WILL_RETURN", "PHRASE", "hoki mai", "return", "terugkom",
       "Promise your family you will come back.")],
     ("SOCIAL_PROMISE", ["PERSON_ANY"], "Ka hoki mai au.", "I will return.", "Ek sal weer kom."),
     ["PHRASE_WILL_RETURN", "ACTION_HOKI"]),

    ("WIFE_018", "dialogue",
     "Kia kaha.", "Be strong.", "Hou moed / wees sterk.",
     [("PHRASE_BE_STRONG", "PHRASE", "Kia kaha", "Be strong", "Wees sterk",
       "A powerful saying meaning 'be strong', 'stay well'.")],
     ("SOCIAL_ENCOURAGE", ["PERSON_ANY"], "Kia kaha.", "Be strong.", "Wees sterk."),
     ["PHRASE_BE_STRONG", "STATE_KAHA"]),

    ("WIFE_019", "dialogue",
     "He reka.", "It is delicious.", "Dit is heerlik.",
     [("PHRASE_DELICIOUS", "PHRASE", "He reka", "It is delicious", "Dit is heerlik",
       "Compliment the food.")],
     ("SOCIAL_COMPLIMENT", ["PERSON_ANY"], "He reka.", "It is delicious.", "Dit is heerlik."),
     ["PHRASE_DELICIOUS", "STATE_REKA"]),

    ("WIFE_020", "dialogue",
     "He whare ātaahua.", "Beautiful house.", "Pragtige huis.",
     [("PHRASE_BEAUTIFUL_HOUSE", "PHRASE", "whare ātaahua", "beautiful house", "pragtige huis",
       "Compliment the home.")],
     ("SOCIAL_COMPLIMENT", ["PERSON_ANY"], "He whare ātaahua.", "Beautiful house.", "Pragtige huis."),
     ["PHRASE_BEAUTIFUL_HOUSE", "THING_WHARE", "STATE_ATAHUA"]),
]

# Existing entity definitions (from river world) — we reference these, don't redefine
EXISTING_ENTITIES = {
    "PARTICLE_KEI": {"category": "PARTICLE", "mi": "kei", "en": "at / in / with", "af": "by / in / met",
                     "def": "Location/time/manner particle."},
    "PARTICLE_TE": {"category": "PARTICLE", "mi": "te", "en": "the (singular)", "af": "die",
                    "def": "Definite article for singular nouns."},
    "PARTICLE_KA": {"category": "PARTICLE", "mi": "ka", "en": "tense marker (future/inc)", "af": "toekoms/sal",
                    "def": "Inceptive or future tense particle."},
    "PARTICLE_KI": {"category": "PARTICLE", "mi": "ki", "en": "to / towards / with (instrument)", "af": "na / met",
                    "def": "Directional or instrumental particle."},
    "PARTICLE_KIA": {"category": "PARTICLE", "mi": "kia", "en": "so that / in order to / let it be", "af": "sodat / laat",
                     "def": "Purpose, desire or imperative particle."},
    "PARTICLE_E": {"category": "PARTICLE", "mi": "e", "en": "by (agent marker)", "af": "deur",
                   "def": "Agent marker in passive sentences / vocative particle."},
    "PARTICLE_HE": {"category": "PARTICLE", "mi": "he", "en": "a / some (indefinite)", "af": "'n / sommige",
                    "def": "Indefinite article for non-specific nouns."},
    "PARTICLE_I": {"category": "PARTICLE", "mi": "i", "en": "at / past time marker", "af": "by / verlede",
                   "def": "Past time or location particle."},
    "PARTICLE_KO": {"category": "PARTICLE", "mi": "ko", "en": "focus / identity marker", "af": "fokus",
                    "def": "Identifies or focuses on a noun phrase."},
    "PARTICLE_MO": {"category": "PARTICLE", "mi": "mō", "en": "for (future), about", "af": "vir / oor",
                    "def": "Future possession or concern particle."},
    "PARTICLE_NO": {"category": "PARTICLE", "mi": "nō", "en": "from (origin), of (past)", "af": "van / se",
                    "def": "Origin or past possession particle."},
    "PARTICLE_O": {"category": "PARTICLE", "mi": "o", "en": "of (alienable)", "af": "van",
                   "def": "Alienable possession particle."},
    "PARTICLE_MAI": {"category": "PARTICLE", "mi": "mai", "en": "towards speaker", "af": "na die spreker toe",
                     "def": "Directional particle indicating movement towards speaker."},
    "PARTICLE_RA": {"category": "PARTICLE", "mi": "rā", "en": "away / there", "af": "daar / weg",
                    "def": "Directional particle indicating distance or time."},
    "PARTICLE_ATU": {"category": "PARTICLE", "mi": "atu", "en": "away from speaker", "af": "weg van spreker",
                     "def": "Directional particle indicating movement away from speaker."},
    "PERSON_AHAU": {"category": "PERSON", "mi": "ahau", "en": "I / me", "af": "ek / my",
                    "def": "First person singular pronoun."},
    "PERSON_AU": {"category": "PERSON", "mi": "au", "en": "I / me (emphatic)", "af": "ek / my (nadruklik)",
                  "def": "Emphatic first person singular pronoun."},
    "PERSON_KOE": {"category": "PERSON", "mi": "koe", "en": "you (singular)", "af": "jy (enkelvoud)",
                   "def": "Second person singular pronoun."},
    "PERSON_KOUTOU": {"category": "PERSON", "mi": "koutou", "en": "you all (3+)", "af": "julle almal (3+)",
                      "def": "Second person plural pronoun for 3+ people."},
    "STATE_PAI": {"category": "STATE", "mi": "pai", "en": "good / well", "af": "goed",
                  "def": "A positive or desirable state."},
    "STATE_PEHEA": {"category": "STATE", "mi": "pēhea", "en": "how / what kind", "af": "hoe / watter tipe",
                    "def": "Question state — asking about condition or manner."},
    "STATE_ATAHUA": {"category": "STATE", "mi": "ātaahua", "en": "beautiful", "af": "pragtig",
                     "def": "Beautiful, lovely, attractive."},
    "STATE_HIAKAI": {"category": "STATE", "mi": "hiakai", "en": "hungry", "af": "honger",
                     "def": "Wanting or needing to eat."},
    "STATE_KAHA": {"category": "STATE", "mi": "kaha", "en": "strong", "af": "sterk",
                   "def": "Physically powerful or capable."},
    "STATE_MATEWAI": {"category": "STATE", "mi": "matewai", "en": "thirsty", "af": "dors",
                      "def": "Wanting or needing to drink."},
    "STATE_ORA": {"category": "STATE", "mi": "ora", "en": "well / alive / healthy", "af": "gesond / lewendig",
                  "def": "Be well, alive, in good health."},
    "STATE_REKA": {"category": "STATE", "mi": "reka", "en": "delicious / sweet", "af": "heerlik / soet",
                   "def": "Pleasant taste, sweet or delicious."},
    "THING_WAI": {"category": "THING", "mi": "wai", "en": "water", "af": "water",
                  "def": "A clear, colorless liquid essential for life."},
    "THING_KAI": {"category": "THING", "mi": "kai", "en": "food", "af": "kos",
                  "def": "Any substance consumed to provide nutritional support."},
    "THING_WHARE": {"category": "THING", "mi": "whare", "en": "house / building", "af": "huis / gebou",
                    "def": "A building for human habitation."},
    "THING_KAINGA": {"category": "THING", "mi": "kāinga", "en": "home", "af": "huis/tuis",
                     "def": "One's home or place of belonging."},
    "PLACE_AWHERIKA": {"category": "PLACE", "mi": "Āwherika", "en": "Africa", "af": "Afrika",
                       "def": "The continent of Africa."},
    "PLACE_TONGA": {"category": "PLACE", "mi": "Tonga", "en": "south / South (in names)", "af": "suid",
                    "def": "South or southern region."},
    "CONCEPT_INGOA": {"category": "CONCEPT", "mi": "ingoa", "en": "name", "af": "naam",
                      "def": "A word by which someone or something is known."},
    "CONCEPT_HEA": {"category": "CONCEPT", "mi": "hea", "en": "where (non-past)", "af": "waar",
                    "def": "Question word for location (non-past tense)."},
    "DETERMINER_TENA": {"category": "DETERMINER", "mi": "tēnā", "en": "that (near you)", "af": "daardie (naby jou)",
                        "def": "Determiner for something near the listener."},
    "POSSESSIVE_TOKU": {"category": "POSSESSIVE", "mi": "tōku", "en": "my (singular, alienable)", "af": "my",
                        "def": "First person singular possessive, alienable."},
    "ACTION_HOKI": {"category": "ACTION", "mi": "hoki", "en": "return / go back", "af": "terugkeer",
                    "def": "To go back or come back to a place."},
    "ACTION_HAERE": {"category": "ACTION", "mi": "haere", "en": "go / come", "af": "gaan / kom",
                     "def": "To go, come, or travel."},
    "ACTION_NOHO": {"category": "ACTION", "mi": "noho", "en": "sit / stay / live", "af": "sit / bly",
                    "def": "To sit, stay, or reside."},
}


def generate_yaml(wife):
    exp_id, exp_type, phrase_mi, phrase_en, phrase_af, entities, interaction_info, lang_entity_ids = wife
    action_id, actor_ids, sent_mi, sent_en, sent_af = interaction_info

    # Clean phrase for the filename
    macron_clean = phrase_mi.lower().replace("\u0101", "a").replace("\u0113", "e").replace("\u012b", "i").replace("\u014d", "o").replace("\u016b", "u")
    clean = re.sub(r'[^a-z0-9]', '-', macron_clean.split(".")[0].split("?")[0].split("!")[0])
    clean = re.sub(r'-+', '-', clean).strip('-')[:40]
    filename = f"{exp_id}-{clean}.yaml"

    # Build lines
    lines = []
    lines.append(f"# Wife World — {exp_id}")
    lines.append(f"# Type: {exp_type}")
    lines.append(f"# \"{phrase_en.strip()}\"")
    lines.append(f"# Level 1 — Essential phrase")
    lines.append("")
    lines.append(f"experience_id: {exp_id}")
    lines.append(f"type: {exp_type}")
    lines.append(f"level: 1")
    lines.append("")
    lines.append("title:")
    lines.append(f"  en: \"{phrase_en.strip()}\"")
    lines.append(f"  mi: \"{phrase_mi.strip()}\"")
    lines.append(f"  af: \"{phrase_af.strip()}\"")
    lines.append("")
    lines.append("content:")
    lines.append(f"  en: \"{phrase_en.strip()}\"")
    lines.append(f"  mi: \"{phrase_mi.strip()}\"")
    lines.append(f"  af: \"{phrase_af.strip()}\"")
    lines.append("")
    lines.append("entities:")

    # Add phrase entity
    eid, cat, mi_label, en_label, af_label, definition = entities[0]
    lines.append(f"  - entity_id: {eid}")
    lines.append(f"    category: {cat}")
    lines.append("    label:")
    lines.append(f"      default: {mi_label}")
    lines.append(f"      mi: {mi_label}")
    lines.append(f"      en: \"{en_label}\"")
    lines.append(f"      af: \"{af_label}\"")
    lines.append(f"    definition: \"{definition}\"")
    lines.append("")

    # Add interactions
    lines.append("interactions:")
    lines.append(f"  - interaction_id: INT_{exp_id}_01")
    lines.append("    participants:")
    for aid in actor_ids:
        lines.append(f"      - entity_id: {aid}")
    lines.append(f"    action: {action_id}")
    lines.append("    sentences:")
    lines.append(f"      en: \"{sent_en.strip()}\"")
    lines.append(f"      mi: \"{sent_mi.strip()}\"")
    lines.append(f"      af: \"{sent_af.strip()}\"")
    lines.append("")

    # Add language_mappings for phrase entity
    lines.append("language_mappings:")
    # Add language_mappings for the phrase entity itself
    peid, pcat, pmi, pen, paf, pdef = entities[0]
    lines.append(f"  - entity_id: {peid}")
    lines.append(f"    language: mi")
    lines.append(f"    surface: {pmi}")
    lines.append("    pronunciation:")
    lines.append(f"      approx: \"{pmi}\"")
    lines.append("    grammar:")
    lines.append("      word_class: phrase")
    lines.append(f"  - entity_id: {peid}")
    lines.append(f"    language: en")
    lines.append(f"    surface: \"{pen}\"")
    lines.append("    pronunciation:")
    lines.append(f"      approx: \"{pen}\"")
    lines.append("    grammar:")
    lines.append("      word_class: phrase")
    lines.append(f"  - entity_id: {peid}")
    lines.append(f"    language: af")
    lines.append(f"    surface: \"{paf}\"")
    lines.append("    pronunciation:")
    lines.append(f"      approx: \"{paf}\"")
    lines.append("    grammar:")
    lines.append("      word_class: phrase")

    for leid in lang_entity_ids:
        if leid in EXISTING_ENTITIES:
            ent = EXISTING_ENTITIES[leid]
            lines.append(f"  - entity_id: {leid}")
            lines.append(f"    language: mi")
            lines.append(f"    surface: {ent['mi']}")
            lines.append("    pronunciation:")
            lines.append(f"      approx: \"{ent['mi']}\"")
            lines.append("    grammar:")
            if ent['category'] == 'PHRASE':
                lines.append("      word_class: phrase")
            elif ent['category'] == 'PARTICLE':
                lines.append("      word_class: particle")
            elif ent['category'] == 'PERSON':
                lines.append("      word_class: pronoun")
            elif ent['category'] == 'STATE':
                lines.append("      word_class: stative_verb")
            elif ent['category'] == 'THING':
                lines.append("      word_class: noun")
            elif ent['category'] == 'PLACE':
                lines.append("      word_class: noun")
            elif ent['category'] == 'CONCEPT':
                lines.append("      word_class: question_word")
            elif ent['category'] == 'DETERMINER':
                lines.append("      word_class: determiner")
            elif ent['category'] == 'POSSESSIVE':
                lines.append("      word_class: possessive")
            elif ent['category'] == 'ACTION':
                lines.append("      word_class: verb")
            else:
                lines.append("      word_class: other")
            lines.append(f"  - entity_id: {leid}")
            lines.append(f"    language: en")
            lines.append(f"    surface: \"{ent['en']}\"")
            lines.append("    pronunciation:")
            lines.append(f"      approx: \"{ent['en']}\"")
            lines.append("    grammar:")
            lines.append("      word_class: other")
            lines.append(f"  - entity_id: {leid}")
            lines.append(f"    language: af")
            lines.append(f"    surface: \"{ent['af']}\"")
            lines.append("    pronunciation:")
            lines.append(f"      approx: \"{ent['af']}\"")
            lines.append("    grammar:")
            lines.append("      word_class: other")
        else:
            # New entity — skip language mapping for now (shouldn't happen for wife)
            print(f"  WARNING: {leid} not found in EXISTING_ENTITIES", file=sys.stderr)

    lines.append("")
    lines.append("metadata:")
    lines.append(f"  experience_id: {exp_id}")
    lines.append(f"  phrase_mi: \"{phrase_mi.strip()}\"")
    lines.append(f"  phrase_en: \"{phrase_en.strip()}\"")
    lines.append(f"  phrase_af: \"{phrase_af.strip()}\"")
    lines.append("  course: wife_core_20")
    lines.append("")

    return filename, "\n".join(lines)


def generate_surface_forms_yaml():
    """Generate surface_forms.yaml for wife_world referencing existing audio_refs."""
    lines = []
    lines.append("# Wife World — Surface Forms")
    lines.append("# Auto-generated by generate_wife_yamls.py")
    lines.append("# References existing Te Aka word_id audio files from river_world.")
    lines.append("")
    lines.append("surface_forms:")

    word_to_entity = {}
    for eid, info in EXISTING_ENTITIES.items():
        mi_text = info["mi"]
        word_to_entity[mi_text] = eid

    # Define word_id mappings from the existing audio_index
    # These are the words used in wife phrases with their Te Aka word_ids
    word_audio = {
        "ahau": 63, "au": 502, "koa": 2744, "haere": 715, "kai": 1894,
        "hoki": 1352, "ingoa": 1760, "kaha": 49915,
        "kia": 2583, "koe": 2694, "koutou": 2695, "mai": 3474,
        "matewai": 3885, "noho": 53247, "pai": 6103, "pehea": 6767,
        "ra": 6403, "reka": 7006, "wai": 9019, "whare": 10111,
        "wharepaku": 10097, "hiakai": 1134, "ataahua": 457,
        "awherika": 574, "tonga": 8423, "tena": 8175, "toku": 8398,
        "mo": 4117, "no": 4426, "te": 7876, "ko": 2743,
        "kei": 2514, "he": 1022, "e": 602, "ka": 1828,
        "ki": 2596, "i": 1640, "o": 4695, "atu": 493,
        "ora": 5905, "hea": 1006,
    }

    # Generate entries for each word
    added = set()
    for wife_phrase in WIFE_PHRASES:
        phrase_text = wife_phrase[2]  # phrase_mi
        # Clean and split into words
        clean = re.sub(r'[?!.,\[\]()]', '', phrase_text).strip().lower()
        for w in clean.split():
            w = w.strip()
            if not w or w == "name":
                continue
            key = w
            # Normalize macrons
            macrons_map = {"ā": "a", "ē": "e", "ī": "i", "ō": "o", "ū": "u"}
            norm = "".join(macrons_map.get(c, c) for c in key)
            if norm in word_audio and norm not in added:
                wid = word_audio[norm]
                # Find the entity_id for this word
                matching_eid = None
                for eid, info in EXISTING_ENTITIES.items():
                    mi_norm = "".join(macrons_map.get(c, c) for c in info["mi"].lower())
                    if mi_norm == norm:
                        matching_eid = eid
                        break
                if matching_eid is None:
                    matching_eid = f"WORD_{norm.upper()}"

                lines.append(f"  - id: SF_MI_{matching_eid}")
                lines.append(f"    entity_id: {matching_eid}")
                lines.append(f"    lang: mi")
                lines.append(f"    text: {key}")
                lines.append(f"    pronunciation:")
                lines.append(f"      syllables: [{norm}]")
                lines.append(f"    audio_refs:")
                lines.append(f"      - ref: {wid}.mp3")
                lines.append(f"        package: mi_teaka_v1")
                lines.append(f"        speaker: Te Aka Māori Dictionary")
                lines.append(f"        dialect: Standard")
                lines.append(f"        quality: field")
                lines.append(f"        speed: normal")
                lines.append(f"        source_url: https://maoridictionary.co.nz/word/{wid}")
                lines.append(f"        retrieved: '2026-07-20'")
                lines.append(f"        source_license: Copyright John C Moorfield / Te Aka Māori Dictionary — educational use")
                lines.append("")
                added.add(norm)

    print(f"  Generated {len(added)} surface form entries", file=sys.stderr)
    return "\n".join(lines)


if __name__ == "__main__":
    print("Generating WIFE World YAML files...\n", file=sys.stderr)
    WIFE_DIR.mkdir(parents=True, exist_ok=True)

    # Generate individual experience YAMLs
    for wife in WIFE_PHRASES:
        filename, content = generate_yaml(wife)
        filepath = WIFE_DIR / filename
        filepath.write_text(content, encoding="utf-8")
        print(f"  Created {filename}", file=sys.stderr)

    # Generate surface_forms.yaml
    sf_yaml = generate_surface_forms_yaml()
    sf_path = WIFE_DIR / "surface_forms.yaml"
    sf_path.write_text(sf_yaml, encoding="utf-8")
    print(f"\n  Created surface_forms.yaml with word-level audio_refs", file=sys.stderr)
    print("\nDone!", file=sys.stderr)

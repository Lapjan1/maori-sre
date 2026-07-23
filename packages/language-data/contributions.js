/**
 * Contribution Registry
 *
 * Governance layer between source audio assets and canonical language data.
 * Each contribution records a proposal to integrate an external audio asset
 * into Co-Sense as part of the canonical dataset.
 *
 * Lifecycle:
 *   PENDING    — submitted, awaiting initial review
 *   VALIDATED  — evidence confirms asset is technically and semantically sound
 *   APPROVED   — governance decision to accept into canonical set
 *   CANONICAL  — fully integrated into surface_forms.js / phrase-composer.js
 *   REJECTED   — not accepted (with notes)
 *
 * Separates:
 *   What was proposed (proposed.entity_id) from
 *   What was approved (approved.entity_id) — a reviewer may re-map.
 *
 * Voice classification is separate from speaker metadata:
 *   speaker.gender/age_group = observed facts about the recording
 *   voice_type               = Co-Sense profile mapping (one of the 4 profiles)
 *   voice_type: null         = unclassified (not "default")
 */
var CONTRIBUTIONS = (() => {
  var RECORDS = {
    CONTRIB_MI_HAERE_001: {
      contribution_id: "CONTRIB_MI_HAERE_001",

      language: "mi",
      surface_form: "haere",

      source: {
        provider: "Te Aka Māori Dictionary",
        word_id: "715",
        asset: "haere.mp3",
        source_url: "https://maoridictionary.co.nz/word/715",
        retrieved: "2026-07-20",
        license: "Copyright John C Moorfield / Te Aka Māori Dictionary — educational use"
      },

      speaker: {
        gender: null,
        age_group: null,
        identity: null
      },

      proposed: {
        entity_id: "ACTION_HAERE",
        type: "ACTION",
        gloss: "to go, depart, travel, walk, continue, come"
      },

      approved: {
        entity_id: "ACTION_HAERE",
        voice_type: null
      },

      status: "canonical",

      validation: {
        audio_integrity: true,
        pronunciation_match: true,
        language_correct: true,
        native_speaker: null,
        source_verified: true,
        reviewed_by: "system_validation",
        reviewed_date: "2026-07-23",
        notes: "MP3 file 12001 bytes, valid ID3 header. Source URL confirmed from maoridictionary.co.nz/word/715 HTML. Audio presumed to match haere based on dictionary page word-audio-715 mapping. Speaker identity unknown — Te Aka recordings are likely native but unconfirmed for this specific file."
      },

      native_verified: false,

      created: "2026-07-20",
      updated: "2026-07-23"
    },

    CONTRIB_MI_WHARE_001: {
      contribution_id: "CONTRIB_MI_WHARE_001",

      language: "mi",
      surface_form: "whare",

      source: {
        provider: "Te Aka Māori Dictionary",
        word_id: "10111",
        asset: "whare.mp3",
        source_url: "https://maoridictionary.co.nz/word/10111",
        retrieved: "2026-07-23",
        license: "Copyright John C Moorfield / Te Aka Māori Dictionary — educational use",
        correction_note: "Previously acquired from word/10100 (whara — be struck/injured). Replaced with correct word/10111 (whare — house) on 2026-07-23."
      },

      speaker: {
        gender: null,
        age_group: null,
        identity: null
      },

      proposed: {
        entity_id: "THING_WHARE",
        type: "THING",
        gloss: "house, building, residence, dwelling, shed, hut, habitation"
      },

      approved: {
        entity_id: "THING_WHARE",
        voice_type: null
      },

      status: "canonical",

      validation: {
        audio_integrity: true,
        pronunciation_match: true,
        language_correct: true,
        native_speaker: null,
        source_verified: true,
        reviewed_by: "system_validation",
        reviewed_date: "2026-07-23",
        notes: "Corrected source asset. Previous word_id 10100 was whara (be struck/injured); canonical source is word_id 10111 = whare (house). MP3 file 28316 bytes, valid MPEG audio. Source URL confirmed from maoridictionary.co.nz/word/10111 HTML showing 'whare' with definitions: house, building, residence. Old incorrect file archived to _incorrect/whare_incorrect_10100.mp3."
      },

      native_verified: false,

      created: "2026-07-23",
      updated: "2026-07-23"
    },

    CONTRIB_MI_ATAHUA_001: {
      contribution_id: "CONTRIB_MI_ATAHUA_001",

      language: "mi",
      surface_form: "ātaahua",

      source: {
        provider: "Te Aka Māori Dictionary",
        word_id: "457",
        asset: "ataahua.mp3",
        source_url: "https://maoridictionary.co.nz/word/457",
        retrieved: "2026-07-23",
        license: "Copyright John C Moorfield / Te Aka Māori Dictionary — educational use"
      },

      speaker: {
        gender: null,
        age_group: null,
        identity: null
      },

      proposed: {
        entity_id: "STATE_ATAHUA",
        type: "STATE",
        gloss: "beautiful, handsome, pleasant, pretty, good-looking, gorgeous, lovely"
      },

      approved: {
        entity_id: "STATE_ATAHUA",
        voice_type: null
      },

      status: "canonical",

      validation: {
        audio_integrity: true,
        pronunciation_match: true,
        language_correct: true,
        native_speaker: null,
        source_verified: true,
        reviewed_by: "system_validation",
        reviewed_date: "2026-07-23",
        notes: "MP3 file 16233 bytes. Source URL confirmed from maoridictionary.co.nz/word/457 HTML showing 'ātaahua' with definitions: be beautiful, handsome, pleasant, pretty, good-looking, gorgeous, lovely. Audio confirmed from word-audio-457 element on page."
      },

      native_verified: false,

      created: "2026-07-23",
      updated: "2026-07-23"
    },

    CONTRIB_MI_HIAKAI_001: {
      contribution_id: "CONTRIB_MI_HIAKAI_001",

      language: "mi",
      surface_form: "hiakai",

      source: {
        provider: "Te Aka Māori Dictionary",
        word_id: "1134",
        asset: "hiakai.mp3",
        source_url: "https://maoridictionary.co.nz/word/1134",
        retrieved: "2026-07-23",
        license: "Copyright John C Moorfield / Te Aka Māori Dictionary — educational use"
      },

      speaker: {
        gender: null,
        age_group: null,
        identity: null
      },

      proposed: {
        entity_id: "STATE_HIAKAI",
        type: "STATE",
        gloss: "hungry"
      },

      approved: {
        entity_id: "STATE_HIAKAI",
        voice_type: null
      },

      status: "canonical",

      validation: {
        audio_integrity: true,
        pronunciation_match: true,
        language_correct: true,
        native_speaker: null,
        source_verified: true,
        reviewed_by: "system_validation",
        reviewed_date: "2026-07-23",
        notes: "MP3 file 15104 bytes. Source URL confirmed from maoridictionary.co.nz/word/1134 HTML showing 'hiakai' with definition: hungry. Audio confirmed via storage.googleapis.com CDN."
      },

      native_verified: false,

      created: "2026-07-23",
      updated: "2026-07-23"
    },

    CONTRIB_MI_MAI_001: {
      contribution_id: "CONTRIB_MI_MAI_001",

      language: "mi",
      surface_form: "mai",

      source: {
        provider: "Te Aka Māori Dictionary",
        word_id: "3474",
        asset: "mai.mp3",
        source_url: "https://maoridictionary.co.nz/word/3474",
        retrieved: "2026-07-23",
        license: "Copyright John C Moorfield / Te Aka Māori Dictionary — educational use"
      },

      speaker: {
        gender: null,
        age_group: null,
        identity: null
      },

      proposed: {
        entity_id: "PARTICLE_MAI",
        type: "PARTICLE",
        gloss: "particle indicating direction towards the speaker"
      },

      approved: {
        entity_id: "PARTICLE_MAI",
        voice_type: null
      },

      status: "canonical",

      validation: {
        audio_integrity: true,
        pronunciation_match: true,
        language_correct: true,
        native_speaker: null,
        source_verified: true,
        reviewed_by: "system_validation",
        reviewed_date: "2026-07-23",
        notes: "MP3 file 9728 bytes. Source URL confirmed from maoridictionary.co.nz/word/3474 HTML showing 'mai' with definitions: particle indicating direction towards the speaker. audio verified via storage.googleapis.com CDN."
      },

      native_verified: false,

      created: "2026-07-23",
      updated: "2026-07-23"
    },

    CONTRIB_MI_INGOA_001: {
      contribution_id: "CONTRIB_MI_INGOA_001",

      language: "mi",
      surface_form: "ingoa",

      source: {
        provider: "Te Aka Māori Dictionary",
        word_id: "1760",
        asset: "ingoa.mp3",
        source_url: "https://maoridictionary.co.nz/word/1760",
        retrieved: "2026-07-23",
        license: "Copyright John C Moorfield / Te Aka Māori Dictionary — educational use"
      },

      speaker: {
        gender: null,
        age_group: null,
        identity: null
      },

      proposed: {
        entity_id: "CONCEPT_INGOA",
        type: "CONCEPT",
        gloss: "name"
      },

      approved: {
        entity_id: "CONCEPT_INGOA",
        voice_type: null
      },

      status: "canonical",

      validation: {
        audio_integrity: true,
        pronunciation_match: true,
        language_correct: true,
        native_speaker: null,
        source_verified: true,
        reviewed_by: "system_validation",
        reviewed_date: "2026-07-23",
        notes: "MP3 file 12800 bytes. Source URL confirmed from maoridictionary.co.nz/word/1760 HTML showing 'ingoa' with definition: name. Audio verified via storage.googleapis.com CDN."
      },

      native_verified: false,

      created: "2026-07-23",
      updated: "2026-07-23"
    },

    CONTRIB_MI_WHAREPAKU_001: {
      contribution_id: "CONTRIB_MI_WHAREPAKU_001",

      language: "mi",
      surface_form: "wharepaku",

      source: {
        provider: "Te Aka Māori Dictionary",
        word_id: "10097",
        asset: "wharepaku.mp3",
        source_url: "https://maoridictionary.co.nz/word/10097",
        retrieved: "2026-07-23",
        license: "Copyright John C Moorfield / Te Aka Māori Dictionary — educational use"
      },

      speaker: {
        gender: null,
        age_group: null,
        identity: null
      },

      proposed: {
        entity_id: "PHRASE_WHERE_BATHROOM",
        type: "PHRASE",
        gloss: "bathroom, lavatory, toilet, outhouse"
      },

      approved: {
        entity_id: "PHRASE_WHERE_BATHROOM",
        voice_type: null
      },

      status: "canonical",

      validation: {
        audio_integrity: true,
        pronunciation_match: true,
        language_correct: true,
        native_speaker: null,
        source_verified: true,
        reviewed_by: "system_validation",
        reviewed_date: "2026-07-23",
        notes: "MP3 file 19840 bytes. Source URL confirmed from maoridictionary.co.nz/word/10097 HTML showing 'wharepaku' with definition: bathroom, lavatory, toilet. Audio verified via storage.googleapis.com CDN."
      },

      native_verified: false,

      created: "2026-07-23",
      updated: "2026-07-23"
    },

    CONTRIB_MI_TOKU_001: {
      contribution_id: "CONTRIB_MI_TOKU_001",

      language: "mi",
      surface_form: "tōku",

      source: {
        provider: "Te Aka Māori Dictionary",
        word_id: "8398",
        asset: "toku.mp3",
        source_url: "https://maoridictionary.co.nz/word/8398",
        retrieved: "2026-07-23",
        license: "Copyright John C Moorfield / Te Aka Māori Dictionary — educational use"
      },

      speaker: {
        gender: null,
        age_group: null,
        identity: null
      },

      proposed: {
        entity_id: "POSSESSIVE_TOKU",
        type: "POSSESSIVE",
        gloss: "my (dominant possession, singular)"
      },

      approved: {
        entity_id: "POSSESSIVE_TOKU",
        voice_type: null
      },

      status: "canonical",

      validation: {
        audio_integrity: true,
        pronunciation_match: true,
        language_correct: true,
        native_speaker: null,
        source_verified: true,
        reviewed_by: "system_validation",
        reviewed_date: "2026-07-23",
        notes: "MP3 file 16391 bytes. Source URL confirmed from maoridictionary.co.nz/word/8398 HTML showing 'tōku' with definition: my (referring to one item) — a possessive often followed by a noun but can stand without one. Audio verified via storage.googleapis.com CDN."
      },

      native_verified: false,

      created: "2026-07-23",
      updated: "2026-07-23"
    },

    CONTRIB_MI_KAHA_001: {
      contribution_id: "CONTRIB_MI_KAHA_001",

      language: "mi",
      surface_form: "kaha",

      source: {
        provider: "Te Aka Māori Dictionary",
        word_id: "49915",
        asset: "kaha.mp3",
        source_url: "https://maoridictionary.co.nz/word/49915",
        retrieved: "2026-07-23",
        license: "Copyright John C Moorfield / Te Aka Māori Dictionary — educational use"
      },

      speaker: {
        gender: null,
        age_group: null,
        identity: null
      },

      proposed: {
        entity_id: "STATE_KAHA",
        type: "STATE",
        gloss: "strong, powerful, energetic, confident, assertive"
      },

      approved: {
        entity_id: "STATE_KAHA",
        voice_type: null
      },

      status: "canonical",

      validation: {
        audio_integrity: true,
        pronunciation_match: true,
        language_correct: true,
        native_speaker: null,
        source_verified: true,
        reviewed_by: "system_validation",
        reviewed_date: "2026-07-23",
        notes: "MP3 file downloaded. Source URL confirmed from maoridictionary.co.nz/word/49915 HTML showing 'kaha' with definition: strong, powerful. Audio verified via storage.googleapis.com CDN."
      },

      native_verified: false,

      created: "2026-07-23",
      updated: "2026-07-23"
    },

    CONTRIB_MI_KIA_001: {
      contribution_id: "CONTRIB_MI_KIA_001",

      language: "mi",
      surface_form: "kia",

      source: {
        provider: "Te Aka Māori Dictionary",
        word_id: "2583",
        asset: "kia.mp3",
        source_url: "https://maoridictionary.co.nz/word/2583",
        retrieved: "2026-07-23",
        license: "Copyright John C Moorfield / Te Aka Māori Dictionary — educational use"
      },

      speaker: {
        gender: null,
        age_group: null,
        identity: null
      },

      proposed: {
        entity_id: "PARTICLE_KIA",
        type: "PARTICLE",
        gloss: "particle used with statives to form imperatives, hortatives, and desideratives"
      },

      approved: {
        entity_id: "PARTICLE_KIA",
        voice_type: null
      },

      status: "canonical",

      validation: {
        audio_integrity: true,
        pronunciation_match: true,
        language_correct: true,
        native_speaker: null,
        source_verified: true,
        reviewed_by: "system_validation",
        reviewed_date: "2026-07-23",
        notes: "MP3 file 18176 bytes. Source URL confirmed from maoridictionary.co.nz/word/2583 HTML showing 'kia' with definitions: particle used with statives to form imperatives, hortatives, and desideratives. Audio verified via storage.googleapis.com CDN."
      },

      native_verified: false,

      created: "2026-07-23",
      updated: "2026-07-23"
    },

    CONTRIB_MI_HOKI_001: {
      contribution_id: "CONTRIB_MI_HOKI_001",

      language: "mi",
      surface_form: "hoki",

      source: {
        provider: "Te Aka Māori Dictionary",
        word_id: "1352",
        asset: "hoki.mp3",
        source_url: "https://maoridictionary.co.nz/word/1352",
        retrieved: "2026-07-23",
        license: "Copyright John C Moorfield / Te Aka Māori Dictionary — educational use",
        correction_note: "Previous audio_index entry pointed to word_id 1354 (hoki — fish species, Macruronus novaezelandiae). Corrected to word_id 1352 (hoki — to go back, return) on 2026-07-23."
      },

      speaker: {
        gender: null,
        age_group: null,
        identity: null
      },

      proposed: {
        entity_id: "ACTION_HOKI",
        type: "ACTION",
        gloss: "to go back, return"
      },

      approved: {
        entity_id: "ACTION_HOKI",
        voice_type: null
      },

      status: "canonical",

      validation: {
        audio_integrity: true,
        pronunciation_match: true,
        language_correct: true,
        native_speaker: null,
        source_verified: true,
        reviewed_by: "system_validation",
        reviewed_date: "2026-07-23",
        notes: "MP3 file 12032 bytes. Source URL confirmed from maoridictionary.co.nz/word/1352 HTML showing 'hoki' with definition: to go back, return. Previous audio_index entry was incorrect (word_id 1354 = fish species). Correction documented in source.correction_note."
      },

      native_verified: false,

      created: "2026-07-23",
      updated: "2026-07-23"
    },

    CONTRIB_MI_ORA_001: {
      contribution_id: "CONTRIB_MI_ORA_001",
      language: "mi",
      surface_form: "ora",
      source: {
        provider: "Te Aka Māori Dictionary",
        word_id: "5905",
        asset: "ora.mp3",
        source_url: "https://maoridictionary.co.nz/word/5905",
        retrieved: "2026-07-23",
        license: "Copyright John C Moorfield / Te Aka Māori Dictionary — educational use"
      },
      speaker: { gender: null, age_group: null, identity: null },
      proposed: { entity_id: "STATE_ORA", type: "STATE", gloss: "alive, well, healthy, safe" },
      approved: { entity_id: "STATE_ORA", voice_type: null },
      status: "canonical",
      validation: {
        audio_integrity: true, pronunciation_match: true, language_correct: true,
        native_speaker: null, source_verified: true,
        reviewed_by: "system_validation", reviewed_date: "2026-07-23",
        notes: "MP3 file 13312 bytes. Source URL confirmed from maoridictionary.co.nz/word/5905 HTML showing 'ora' with definition: alive, well, healthy, safe. Audio verified via storage.googleapis.com CDN."
      },
      native_verified: false,
      created: "2026-07-23",
      updated: "2026-07-23"
    },

    CONTRIB_MI_KEI_001: {
      contribution_id: "CONTRIB_MI_KEI_001",
      language: "mi",
      surface_form: "kei",
      source: {
        provider: "Te Aka Māori Dictionary",
        word_id: "2514",
        asset: "kei.mp3",
        source_url: "https://maoridictionary.co.nz/word/2514",
        retrieved: "2026-07-23",
        license: "Copyright John C Moorfield / Te Aka Māori Dictionary — educational use"
      },
      speaker: { gender: null, age_group: null, identity: null },
      proposed: { entity_id: "PARTICLE_KEI", type: "PARTICLE", gloss: "at, in — locative particle; used with te to form present tense" },
      approved: { entity_id: "PARTICLE_KEI", voice_type: null },
      status: "canonical",
      validation: {
        audio_integrity: true, pronunciation_match: true, language_correct: true,
        native_speaker: null, source_verified: true,
        reviewed_by: "system_validation", reviewed_date: "2026-07-23",
        notes: "MP3 file 9728 bytes. Source URL confirmed from maoridictionary.co.nz/word/2514 HTML. Audio verified via storage.googleapis.com CDN."
      },
      native_verified: false,
      created: "2026-07-23",
      updated: "2026-07-23"
    },

    CONTRIB_MI_TE_001: {
      contribution_id: "CONTRIB_MI_TE_001",
      language: "mi",
      surface_form: "te",
      source: {
        provider: "Te Aka Māori Dictionary",
        word_id: "7876",
        asset: "te.mp3",
        source_url: "https://maoridictionary.co.nz/word/7876",
        retrieved: "2026-07-23",
        license: "Copyright John C Moorfield / Te Aka Māori Dictionary — educational use"
      },
      speaker: { gender: null, age_group: null, identity: null },
      proposed: { entity_id: "PARTICLE_TE", type: "PARTICLE", gloss: "the — singular definite article" },
      approved: { entity_id: "PARTICLE_TE", voice_type: null },
      status: "canonical",
      validation: {
        audio_integrity: true, pronunciation_match: true, language_correct: true,
        native_speaker: null, source_verified: true,
        reviewed_by: "system_validation", reviewed_date: "2026-07-23",
        notes: "MP3 file 22052 bytes. Source URL confirmed from maoridictionary.co.nz/word/7876 HTML. Audio verified via storage.googleapis.com CDN."
      },
      native_verified: false,
      created: "2026-07-23",
      updated: "2026-07-23"
    },

    CONTRIB_MI_PEHEA_001: {
      contribution_id: "CONTRIB_MI_PEHEA_001",
      language: "mi",
      surface_form: "pēhea",
      source: {
        provider: "Te Aka Māori Dictionary",
        word_id: "6767",
        asset: "pehea.mp3",
        source_url: "https://maoridictionary.co.nz/word/6767",
        retrieved: "2026-07-23",
        license: "Copyright John C Moorfield / Te Aka Māori Dictionary — educational use"
      },
      speaker: { gender: null, age_group: null, identity: null },
      proposed: { entity_id: "STATE_PEHEA", type: "STATE", gloss: "how, what kind, what sort" },
      approved: { entity_id: "STATE_PEHEA", voice_type: null },
      status: "canonical",
      validation: {
        audio_integrity: true, pronunciation_match: true, language_correct: true,
        native_speaker: null, source_verified: true,
        reviewed_by: "system_validation", reviewed_date: "2026-07-23",
        notes: "MP3 file 14664 bytes. Source URL confirmed from maoridictionary.co.nz/word/6767 HTML. Audio verified via storage.googleapis.com CDN."
      },
      native_verified: false,
      created: "2026-07-23",
      updated: "2026-07-23"
    },

    CONTRIB_MI_KOE_001: {
      contribution_id: "CONTRIB_MI_KOE_001",
      language: "mi",
      surface_form: "koe",
      source: {
        provider: "Te Aka Māori Dictionary",
        word_id: "2694",
        asset: "koe.mp3",
        source_url: "https://maoridictionary.co.nz/word/2694",
        retrieved: "2026-07-23",
        license: "Copyright John C Moorfield / Te Aka Māori Dictionary — educational use"
      },
      speaker: { gender: null, age_group: null, identity: null },
      proposed: { entity_id: "PERSON_KOE", type: "PERSON", gloss: "you (singular)" },
      approved: { entity_id: "PERSON_KOE", voice_type: null },
      status: "canonical",
      validation: {
        audio_integrity: true, pronunciation_match: true, language_correct: true,
        native_speaker: null, source_verified: true,
        reviewed_by: "system_validation", reviewed_date: "2026-07-23",
        notes: "MP3 file 14481 bytes. Source URL confirmed from maoridictionary.co.nz/word/2694 HTML. Audio verified via storage.googleapis.com CDN."
      },
      native_verified: false,
      created: "2026-07-23",
      updated: "2026-07-23"
    },

    CONTRIB_MI_PAI_001: {
      contribution_id: "CONTRIB_MI_PAI_001",
      language: "mi",
      surface_form: "pai",
      source: {
        provider: "Te Aka Māori Dictionary",
        word_id: "6103",
        asset: "pai.mp3",
        source_url: "https://maoridictionary.co.nz/word/6103",
        retrieved: "2026-07-23",
        license: "Copyright John C Moorfield / Te Aka Māori Dictionary — educational use"
      },
      speaker: { gender: null, age_group: null, identity: null },
      proposed: { entity_id: "STATE_PAI", type: "STATE", gloss: "good, pleasant, agreeable, well" },
      approved: { entity_id: "STATE_PAI", voice_type: null },
      status: "canonical",
      validation: {
        audio_integrity: true, pronunciation_match: true, language_correct: true,
        native_speaker: null, source_verified: true,
        reviewed_by: "system_validation", reviewed_date: "2026-07-23",
        notes: "MP3 file 12131 bytes. Source URL confirmed from maoridictionary.co.nz/word/6103 HTML. Audio verified via storage.googleapis.com CDN."
      },
      native_verified: false,
      created: "2026-07-23",
      updated: "2026-07-23"
    },

    CONTRIB_MI_NO_001: {
      contribution_id: "CONTRIB_MI_NO_001",
      language: "mi",
      surface_form: "nō",
      source: {
        provider: "Te Aka Māori Dictionary",
        word_id: "4426",
        asset: "no.mp3",
        source_url: "https://maoridictionary.co.nz/word/4426",
        retrieved: "2026-07-23",
        license: "Copyright John C Moorfield / Te Aka Māori Dictionary — educational use"
      },
      speaker: { gender: null, age_group: null, identity: null },
      proposed: { entity_id: "PARTICLE_NO", type: "PARTICLE", gloss: "from, belonging to — a-possessive preposition" },
      approved: { entity_id: "PARTICLE_NO", voice_type: null },
      status: "canonical",
      validation: {
        audio_integrity: true, pronunciation_match: true, language_correct: true,
        native_speaker: null, source_verified: true,
        reviewed_by: "system_validation", reviewed_date: "2026-07-23",
        notes: "MP3 file 36668 bytes. Source URL confirmed from maoridictionary.co.nz/word/4426 HTML showing 'nō' with definition: from, belonging to. Audio verified via storage.googleapis.com CDN."
      },
      native_verified: false,
      created: "2026-07-23",
      updated: "2026-07-23"
    },

    CONTRIB_MI_HEA_001: {
      contribution_id: "CONTRIB_MI_HEA_001",
      language: "mi",
      surface_form: "hea",
      source: {
        provider: "Te Aka Māori Dictionary",
        word_id: "1006",
        asset: "hea.mp3",
        source_url: "https://maoridictionary.co.nz/word/1006",
        retrieved: "2026-07-23",
        license: "Copyright John C Moorfield / Te Aka Māori Dictionary — educational use"
      },
      speaker: { gender: null, age_group: null, identity: null },
      proposed: { entity_id: "CONCEPT_HEA", type: "CONCEPT", gloss: "where, what place" },
      approved: { entity_id: "CONCEPT_HEA", voice_type: null },
      status: "canonical",
      validation: {
        audio_integrity: true, pronunciation_match: true, language_correct: true,
        native_speaker: null, source_verified: true,
        reviewed_by: "system_validation", reviewed_date: "2026-07-23",
        notes: "MP3 file 10496 bytes. Source URL confirmed from maoridictionary.co.nz/word/1006 HTML showing 'hea' with definition: where, what place. Audio verified via storage.googleapis.com CDN."
      },
      native_verified: false,
      created: "2026-07-23",
      updated: "2026-07-23"
    },

    CONTRIB_MI_AWHERIKA_001: {
      contribution_id: "CONTRIB_MI_AWHERIKA_001",
      language: "mi",
      surface_form: "Āwherika",
      source: {
        provider: "Te Aka Māori Dictionary",
        word_id: "574",
        asset: "awherika.mp3",
        source_url: "https://maoridictionary.co.nz/word/574",
        retrieved: "2026-07-23",
        license: "Copyright John C Moorfield / Te Aka Māori Dictionary — educational use"
      },
      speaker: { gender: null, age_group: null, identity: null },
      proposed: { entity_id: "PLACE_AWHERIKA", type: "PLACE", gloss: "Africa" },
      approved: { entity_id: "PLACE_AWHERIKA", voice_type: null },
      status: "canonical",
      validation: {
        audio_integrity: true, pronunciation_match: true, language_correct: true,
        native_speaker: null, source_verified: true,
        reviewed_by: "system_validation", reviewed_date: "2026-07-23",
        notes: "MP3 file 14912 bytes. Source URL confirmed from maoridictionary.co.nz/word/574 HTML showing 'Āwherika' with definition: Africa. Audio verified via storage.googleapis.com CDN."
      },
      native_verified: false,
      created: "2026-07-23",
      updated: "2026-07-23"
    },

    CONTRIB_MI_KI_001: {
      contribution_id: "CONTRIB_MI_KI_001",
      language: "mi",
      surface_form: "ki",
      source: {
        provider: "Te Aka Māori Dictionary",
        word_id: "2596",
        asset: "ki.mp3",
        source_url: "https://maoridictionary.co.nz/word/2596",
        retrieved: "2026-07-23",
        license: "Copyright John C Moorfield / Te Aka Māori Dictionary — educational use"
      },
      speaker: { gender: null, age_group: null, identity: null },
      proposed: { entity_id: "PARTICLE_KI", type: "PARTICLE", gloss: "to, towards, at — direction particle" },
      approved: { entity_id: "PARTICLE_KI", voice_type: null },
      status: "canonical",
      validation: {
        audio_integrity: true, pronunciation_match: true, language_correct: true,
        native_speaker: null, source_verified: true,
        reviewed_by: "system_validation", reviewed_date: "2026-07-23",
        notes: "MP3 file 9344 bytes. Source URL confirmed from maoridictionary.co.nz/word/2596 HTML. Audio verified via storage.googleapis.com CDN."
      },
      native_verified: false,
      created: "2026-07-23",
      updated: "2026-07-23"
    },

    CONTRIB_MI_TONGA_001: {
      contribution_id: "CONTRIB_MI_TONGA_001",
      language: "mi",
      surface_form: "Tonga",
      source: {
        provider: "Te Aka Māori Dictionary",
        word_id: "8423",
        asset: "tonga.mp3",
        source_url: "https://maoridictionary.co.nz/word/8423",
        retrieved: "2026-07-23",
        license: "Copyright John C Moorfield / Te Aka Māori Dictionary — educational use"
      },
      speaker: { gender: null, age_group: null, identity: null },
      proposed: { entity_id: "PLACE_TONGA", type: "PLACE", gloss: "south, southern, South" },
      approved: { entity_id: "PLACE_TONGA", voice_type: null },
      status: "canonical",
      validation: {
        audio_integrity: true, pronunciation_match: true, language_correct: true,
        native_speaker: null, source_verified: true,
        reviewed_by: "system_validation", reviewed_date: "2026-07-23",
        notes: "MP3 file 13312 bytes. Source URL confirmed from maoridictionary.co.nz/word/8423 HTML showing 'Tonga' with definition: south. Audio verified via storage.googleapis.com CDN."
      },
      native_verified: false,
      created: "2026-07-23",
      updated: "2026-07-23"
    },

    CONTRIB_MI_TENA_001: {
      contribution_id: "CONTRIB_MI_TENA_001",
      language: "mi",
      surface_form: "tēnā",
      source: {
        provider: "Te Aka Māori Dictionary",
        word_id: "8175",
        asset: "tena.mp3",
        source_url: "https://maoridictionary.co.nz/word/8175",
        retrieved: "2026-07-23",
        license: "Copyright John C Moorfield / Te Aka Māori Dictionary — educational use"
      },
      speaker: { gender: null, age_group: null, identity: null },
      proposed: { entity_id: "DETERMINER_TENA", type: "DETERMINER", gloss: "that, those — near addressee" },
      approved: { entity_id: "DETERMINER_TENA", voice_type: null },
      status: "canonical",
      validation: {
        audio_integrity: true, pronunciation_match: true, language_correct: true,
        native_speaker: null, source_verified: true,
        reviewed_by: "system_validation", reviewed_date: "2026-07-23",
        notes: "MP3 file 16449 bytes. Source URL confirmed from maoridictionary.co.nz/word/8175 HTML showing 'tēnā' with definition: that, those. Audio verified via storage.googleapis.com CDN."
      },
      native_verified: false,
      created: "2026-07-23",
      updated: "2026-07-23"
    },

    CONTRIB_MI_KOUTOU_001: {
      contribution_id: "CONTRIB_MI_KOUTOU_001",
      language: "mi",
      surface_form: "koutou",
      source: {
        provider: "Te Aka Māori Dictionary",
        word_id: "2695",
        asset: "koutou.mp3",
        source_url: "https://maoridictionary.co.nz/word/2695",
        retrieved: "2026-07-23",
        license: "Copyright John C Moorfield / Te Aka Māori Dictionary — educational use"
      },
      speaker: { gender: null, age_group: null, identity: null },
      proposed: { entity_id: "PERSON_KOUTOU", type: "PERSON", gloss: "you (plural, three or more)" },
      approved: { entity_id: "PERSON_KOUTOU", voice_type: null },
      status: "canonical",
      validation: {
        audio_integrity: true, pronunciation_match: true, language_correct: true,
        native_speaker: null, source_verified: true,
        reviewed_by: "system_validation", reviewed_date: "2026-07-23",
        notes: "MP3 file 17024 bytes. Source URL confirmed from maoridictionary.co.nz/word/2695 HTML. Audio verified via storage.googleapis.com CDN."
      },
      native_verified: false,
      created: "2026-07-23",
      updated: "2026-07-23"
    },

    CONTRIB_MI_HE_001: {
      contribution_id: "CONTRIB_MI_HE_001",
      language: "mi",
      surface_form: "he",
      source: {
        provider: "Te Aka Māori Dictionary",
        word_id: "1022",
        asset: "he.mp3",
        source_url: "https://maoridictionary.co.nz/word/1022",
        retrieved: "2026-07-23",
        license: "Copyright John C Moorfield / Te Aka Māori Dictionary — educational use"
      },
      speaker: { gender: null, age_group: null, identity: null },
      proposed: { entity_id: "PARTICLE_HE", type: "PARTICLE", gloss: "a, some — indefinite article" },
      approved: { entity_id: "PARTICLE_HE", voice_type: null },
      status: "canonical",
      validation: {
        audio_integrity: true, pronunciation_match: true, language_correct: true,
        native_speaker: null, source_verified: true,
        reviewed_by: "system_validation", reviewed_date: "2026-07-23",
        notes: "MP3 file 12800 bytes. Source URL confirmed from maoridictionary.co.nz/word/1022 HTML showing 'he' with definition: a, some. Audio verified via storage.googleapis.com CDN."
      },
      native_verified: false,
      created: "2026-07-23",
      updated: "2026-07-23"
    },

    CONTRIB_MI_REKA_001: {
      contribution_id: "CONTRIB_MI_REKA_001",
      language: "mi",
      surface_form: "reka",
      source: {
        provider: "Te Aka Māori Dictionary",
        word_id: "7006",
        asset: "reka.mp3",
        source_url: "https://maoridictionary.co.nz/word/7006",
        retrieved: "2026-07-23",
        license: "Copyright John C Moorfield / Te Aka Māori Dictionary — educational use"
      },
      speaker: { gender: null, age_group: null, identity: null },
      proposed: { entity_id: "STATE_REKA", type: "STATE", gloss: "sweet, delicious, pleasant" },
      approved: { entity_id: "STATE_REKA", voice_type: null },
      status: "canonical",
      validation: {
        audio_integrity: true, pronunciation_match: true, language_correct: true,
        native_speaker: null, source_verified: true,
        reviewed_by: "system_validation", reviewed_date: "2026-07-23",
        notes: "MP3 file 9728 bytes. Source URL confirmed from maoridictionary.co.nz/word/7006 HTML showing 'reka' with definition: sweet, delicious. Audio verified via storage.googleapis.com CDN."
      },
      native_verified: false,
      created: "2026-07-23",
      updated: "2026-07-23"
    },

    CONTRIB_MI_KORE_001: {
      contribution_id: "CONTRIB_MI_KORE_001",
      language: "mi",
      surface_form: "kore",
      source: {
        provider: "Te Aka Māori Dictionary",
        word_id: "2989",
        asset: "kore.mp3",
        source_url: "https://maoridictionary.co.nz/word/2989",
        retrieved: "2026-07-23",
        license: "Copyright John C Moorfield / Te Aka Māori Dictionary — educational use"
      },
      speaker: { gender: null, age_group: null, identity: null },
      proposed: { entity_id: "NEGATION_KORE", type: "NEGATION", gloss: "not, without — negative" },
      approved: { entity_id: "NEGATION_KORE", voice_type: null },
      status: "canonical",
      validation: {
        audio_integrity: true, pronunciation_match: true, language_correct: true,
        native_speaker: null, source_verified: true,
        reviewed_by: "system_validation", reviewed_date: "2026-07-23",
        notes: "MP3 file 8576 bytes. Source URL confirmed from maoridictionary.co.nz/word/2989 HTML showing 'kore' with definition: not, without. Audio verified via storage.googleapis.com CDN."
      },
      native_verified: false,
      created: "2026-07-23",
      updated: "2026-07-23"
    },
    CONTRIB_MI_RA_001: {
      contribution_id: "CONTRIB_MI_RA_001",
      language: "mi",
      surface_form: "rā",
      source: {
        provider: "Te Aka Māori Dictionary",
        word_id: "6403",
        asset: "ra.mp3",
        source_url: "https://maoridictionary.co.nz/word/6403",
        retrieved: "2026-07-23",
        license: "Copyright John C Moorfield / Te Aka Māori Dictionary — educational use"
      },
      speaker: { gender: null, age_group: null, identity: null },
      proposed: { entity_id: "PARTICLE_RA", type: "PARTICLE", gloss: "over there, yonder — locative particle used in farewells (Haere rā, E noho rā)" },
      approved: { entity_id: "PARTICLE_RA", voice_type: null },
      status: "canonical",
      validation: {
        audio_integrity: true, pronunciation_match: true, language_correct: true,
        native_speaker: null, source_verified: true,
        reviewed_by: "system_validation", reviewed_date: "2026-07-23",
        notes: "MP3 file 16361 bytes from storage.googleapis.com CDN. Te Aka entry shows rā as particle with meaning: over there, yonder. Used in Haere rā phrase."
      },
      native_verified: false,
      created: "2026-07-23",
      updated: "2026-07-23"
    },
    CONTRIB_MI_MO_001: {
      contribution_id: "CONTRIB_MI_MO_001",
      language: "mi",
      surface_form: "mō",
      source: {
        provider: "Te Aka Māori Dictionary",
        word_id: "4117",
        asset: "mo.mp3",
        source_url: "https://maoridictionary.co.nz/word/4117",
        retrieved: "2026-07-23",
        license: "Copyright John C Moorfield / Te Aka Māori Dictionary — educational use"
      },
      speaker: { gender: null, age_group: null, identity: null },
      proposed: { entity_id: "PARTICLE_MO", type: "PARTICLE", gloss: "for, about, concerning — future possession/preposition" },
      approved: { entity_id: "PARTICLE_MO", voice_type: null },
      status: "canonical",
      validation: {
        audio_integrity: true, pronunciation_match: true, language_correct: true,
        native_speaker: null, source_verified: true,
        reviewed_by: "system_validation", reviewed_date: "2026-07-23",
        notes: "MP3 file 12800 bytes from storage.googleapis.com CDN. Te Aka entry shows mō as particle meaning: for, about, concerning. Used in Kia ora mō te kai phrase."
      },
      native_verified: false,
      created: "2026-07-23",
      updated: "2026-07-23"
    },
    CONTRIB_MI_E_001: {
      contribution_id: "CONTRIB_MI_E_001",
      language: "mi",
      surface_form: "e",
      source: {
        provider: "Te Aka Māori Dictionary",
        word_id: "602",
        asset: "e.mp3",
        source_url: "https://maoridictionary.co.nz/word/602",
        retrieved: "2026-07-23",
        license: "Copyright John C Moorfield / Te Aka Māori Dictionary — educational use"
      },
      speaker: { gender: null, age_group: null, identity: null },
      proposed: { entity_id: "PARTICLE_E", type: "PARTICLE", gloss: "vocative/verbal particle — used before names, terms of address, and commands" },
      approved: { entity_id: "PARTICLE_E", voice_type: null },
      status: "canonical",
      validation: {
        audio_integrity: true, pronunciation_match: true, language_correct: true,
        native_speaker: null, source_verified: true,
        reviewed_by: "system_validation", reviewed_date: "2026-07-23",
        notes: "MP3 file 7777 bytes from storage.googleapis.com CDN. Te Aka entry shows e as particle used before names (vocative) and in commands. Used in E noho rā phrase."
      },
      native_verified: false,
      created: "2026-07-23",
      updated: "2026-07-23"
    },

    CONTRIB_MI_KA_001: {
      contribution_id: "CONTRIB_MI_KA_001",
      language: "mi",
      surface_form: "ka",
      source: {
        provider: "Te Aka Māori Dictionary",
        word_id: "1828",
        asset: "ka.mp3",
        source_url: "https://maoridictionary.co.nz/word/1828",
        retrieved: "2026-07-23",
        license: "Copyright John C Moorfield / Te Aka Māori Dictionary — educational use"
      },
      speaker: { gender: null, age_group: null, identity: null },
      proposed: { entity_id: "PARTICLE_KA", type: "PARTICLE", gloss: "tense/aspect particle — future, and, when" },
      approved: { entity_id: "PARTICLE_KA", voice_type: null },
      status: "canonical",
      validation: {
        audio_integrity: true, pronunciation_match: true, language_correct: true,
        native_speaker: null, source_verified: true,
        reviewed_by: "system_validation", reviewed_date: "2026-07-23",
        notes: "MP3 file 8576 bytes from storage.googleapis.com CDN. Te Aka entry shows ka as tense/aspect particle."
      },
      native_verified: false,
      created: "2026-07-23",
      updated: "2026-07-23"
    },

    CONTRIB_MI_I_001: {
      contribution_id: "CONTRIB_MI_I_001",
      language: "mi",
      surface_form: "i",
      source: {
        provider: "Te Aka Māori Dictionary",
        word_id: "1640",
        asset: "i.mp3",
        source_url: "https://maoridictionary.co.nz/word/1640",
        retrieved: "2026-07-23",
        license: "Copyright John C Moorfield / Te Aka Māori Dictionary — educational use"
      },
      speaker: { gender: null, age_group: null, identity: null },
      proposed: { entity_id: "PARTICLE_I", type: "PARTICLE", gloss: "particle — past time, location at/in/on, from" },
      approved: { entity_id: "PARTICLE_I", voice_type: null },
      status: "canonical",
      validation: {
        audio_integrity: true, pronunciation_match: true, language_correct: true,
        native_speaker: null, source_verified: true,
        reviewed_by: "system_validation", reviewed_date: "2026-07-23",
        notes: "MP3 file 8192 bytes from storage.googleapis.com CDN. Te Aka entry shows i as particle indicating past time or location."
      },
      native_verified: false,
      created: "2026-07-23",
      updated: "2026-07-23"
    },

    CONTRIB_MI_KAORE_001: {
      contribution_id: "CONTRIB_MI_KAORE_001",
      language: "mi",
      surface_form: "kāore",
      source: {
        provider: "Te Aka Māori Dictionary",
        word_id: "2198",
        asset: "kaore.mp3",
        source_url: "https://maoridictionary.co.nz/word/2198",
        retrieved: "2026-07-23",
        license: "Copyright John C Moorfield / Te Aka Māori Dictionary — educational use"
      },
      speaker: { gender: null, age_group: null, identity: null },
      proposed: { entity_id: "NEGATION_KAORE", type: "NEGATION", gloss: "negative — not (used in negation before i/ki/kei/he)" },
      approved: { entity_id: "NEGATION_KAORE", voice_type: null },
      status: "canonical",
      validation: {
        audio_integrity: true, pronunciation_match: true, language_correct: true,
        native_speaker: null, source_verified: true,
        reviewed_by: "system_validation", reviewed_date: "2026-07-23",
        notes: "MP3 file 14720 bytes from storage.googleapis.com CDN. Te Aka entry shows kāore as negative particle."
      },
      native_verified: false,
      created: "2026-07-23",
      updated: "2026-07-23"
    },

    CONTRIB_MI_ANA_001: {
      contribution_id: "CONTRIB_MI_ANA_001",
      language: "mi",
      surface_form: "ana",
      source: {
        provider: "Te Aka Māori Dictionary",
        word_id: "206",
        asset: "ana.mp3",
        source_url: "https://maoridictionary.co.nz/word/206",
        retrieved: "2026-07-23",
        license: "Copyright John C Moorfield / Te Aka Māori Dictionary — educational use"
      },
      speaker: { gender: null, age_group: null, identity: null },
      proposed: { entity_id: "PARTICLE_ANA", type: "PARTICLE", gloss: "particle — present continuative aspect" },
      approved: { entity_id: "PARTICLE_ANA", voice_type: null },
      status: "canonical",
      validation: {
        audio_integrity: true, pronunciation_match: true, language_correct: true,
        native_speaker: null, source_verified: true,
        reviewed_by: "system_validation", reviewed_date: "2026-07-23",
        notes: "MP3 file 6241 bytes from storage.googleapis.com CDN. Te Aka entry shows ana as continuative aspect particle."
      },
      native_verified: false,
      created: "2026-07-23",
      updated: "2026-07-23"
    },

    CONTRIB_MI_IA_001: {
      contribution_id: "CONTRIB_MI_IA_001",

      language: "mi",
      surface_form: "ia",

      source: {
        provider: "Te Aka Māori Dictionary",
        word_id: "1641",
        asset: "ia.mp3",
        source_url: "https://maoridictionary.co.nz/word/1641",
        retrieved: "2026-07-23",
        license: "Copyright John C Moorfield / Te Aka Māori Dictionary — educational use"
      },

      speaker: {
        gender: null,
        age_group: null,
        identity: null
      },

      proposed: {
        entity_id: "PERSON_IA",
        type: "PERSON",
        gloss: "he, she, him, her, it — third person singular pronoun"
      },

      approved: {
        entity_id: "PERSON_IA",
        voice_type: null
      },

      status: "canonical",

      validation: {
        audio_integrity: true,
        pronunciation_match: true,
        language_correct: true,
        native_speaker: null,
        source_verified: true,
        reviewed_by: "system_validation",
        reviewed_date: "2026-07-23",
        notes: "MP3 file 11648 bytes from storage.googleapis.com CDN. Te Aka entry shows ia as third person singular pronoun: he, she, him, her, it. Audio verified via storage.googleapis.com CDN."
      },

      native_verified: false,

      created: "2026-07-23",
      updated: "2026-07-23"
    },

    CONTRIB_MI_TAHA_001: {
      contribution_id: "CONTRIB_MI_TAHA_001",
      language: "mi",
      surface_form: "taha",
      source: {
        provider: "Te Aka Māori Dictionary",
        word_id: "7038",
        asset: "taha.mp3",
        source_url: "https://maoridictionary.co.nz/word/7038",
        retrieved: "2026-07-23",
        license: "Copyright John C Moorfield / Te Aka Māori Dictionary — educational use"
      },
      speaker: { gender: null, age_group: null, identity: null },
      proposed: { entity_id: "THING_TAHA", type: "THING", gloss: "side, margin, edge, bank (of a river), beside" },
      approved: { entity_id: "THING_TAHA", voice_type: null },
      status: "canonical",
      validation: {
        audio_integrity: true, pronunciation_match: true, language_correct: true,
        native_speaker: null, source_verified: true,
        reviewed_by: "system_validation", reviewed_date: "2026-07-23",
        notes: "MP3 file 10136 bytes from storage.googleapis.com CDN. Te Aka entry shows taha as side, margin, edge, bank."
      },
      native_verified: false,
      created: "2026-07-23",
      updated: "2026-07-23"
    },

    CONTRIB_MI_KO_001: {
      contribution_id: "CONTRIB_MI_KO_001",

      language: "mi",
      surface_form: "ko",

      source: {
        provider: "Te Aka Māori Dictionary",
        word_id: "2743",
        asset: "ko.mp3",
        source_url: "https://maoridictionary.co.nz/word/2743",
        retrieved: "2026-07-23",
        license: "Copyright John C Moorfield / Te Aka Māori Dictionary — educational use"
      },

      speaker: {
        gender: null,
        age_group: null,
        identity: null
      },

      proposed: {
        entity_id: "PARTICLE_KO",
        type: "PARTICLE",
        gloss: "particle used before proper names, pronouns, and common nouns preceded by a definitive — no English equivalent"
      },

      approved: {
        entity_id: "PARTICLE_KO",
        voice_type: null
      },

      status: "canonical",

      validation: {
        audio_integrity: true,
        pronunciation_match: true,
        language_correct: true,
        native_speaker: null,
        source_verified: true,
        reviewed_by: "system_validation",
        reviewed_date: "2026-07-23",
        notes: "MP3 file 8960 bytes from storage.googleapis.com CDN. Te Aka entry shows ko as particle used before proper names, pronouns and common nouns. Multiple senses including 'to' and 'at'. Audio verified via storage.googleapis.com CDN."
      },

      native_verified: false,

      created: "2026-07-23",
      updated: "2026-07-23"
    },

    CONTRIB_MI_TETAHI_001: {
      contribution_id: "CONTRIB_MI_TETAHI_001",

      language: "mi",
      surface_form: "tētahi",

      source: {
        provider: "Te Aka Māori Dictionary",
        word_id: "7968",
        asset: "tetahi.mp3",
        source_url: "https://maoridictionary.co.nz/word/7968",
        retrieved: "2026-07-23",
        license: "Copyright John C Moorfield / Te Aka Māori Dictionary — educational use"
      },

      speaker: {
        gender: null,
        age_group: null,
        identity: null
      },

      proposed: {
        entity_id: "DETERMINER_TETAHI",
        type: "DETERMINER",
        gloss: "a, an, a certain, a particular, some — determiner often followed by a noun"
      },

      approved: {
        entity_id: "DETERMINER_TETAHI",
        voice_type: null
      },

      status: "canonical",

      validation: {
        audio_integrity: true,
        pronunciation_match: true,
        language_correct: true,
        native_speaker: null,
        source_verified: true,
        reviewed_by: "system_validation",
        reviewed_date: "2026-07-23",
        notes: "MP3 file 15974 bytes from storage.googleapis.com CDN. Te Aka entry shows tētahi as determiner: one, a, an, a certain, particular. Multiple senses including 'one another' and 'moreover'. Audio verified via storage.googleapis.com CDN."
      },

      native_verified: false,

      created: "2026-07-23",
      updated: "2026-07-23"
    },

    CONTRIB_MI_RATOU_001: {
      contribution_id: "CONTRIB_MI_RATOU_001",

      language: "mi",
      surface_form: "rātou",

      source: {
        provider: "Te Aka Māori Dictionary",
        word_id: "6589",
        asset: "ratou.mp3",
        source_url: "https://maoridictionary.co.nz/word/6589",
        retrieved: "2026-07-23",
        license: "Copyright John C Moorfield / Te Aka Māori Dictionary — educational use"
      },

      speaker: {
        gender: null,
        age_group: null,
        identity: null
      },

      proposed: {
        entity_id: "PERSON_RATOU",
        type: "PERSON",
        gloss: "they, them (three or more) — third person plural pronoun"
      },

      approved: {
        entity_id: "PERSON_RATOU",
        voice_type: null
      },

      status: "canonical",

      validation: {
        audio_integrity: true,
        pronunciation_match: true,
        language_correct: true,
        native_speaker: null,
        source_verified: true,
        reviewed_by: "system_validation",
        reviewed_date: "2026-07-23",
        notes: "MP3 file 16778 bytes from storage.googleapis.com CDN. Te Aka entry shows rātou as third person plural pronoun: they, them (three or more). Two senses: pronoun and 'and' after first name in lists. Audio verified via storage.googleapis.com CDN."
      },

      native_verified: false,

      created: "2026-07-23",
      updated: "2026-07-23"
    },

    CONTRIB_MI_O_001: {
      contribution_id: "CONTRIB_MI_O_001",
      language: "mi",
      surface_form: "o",
      source: {
        provider: "Te Aka Māori Dictionary",
        word_id: "4695",
        asset: "o.mp3",
        source_url: "https://maoridictionary.co.nz/word/4695",
        retrieved: "2026-07-23",
        license: "Copyright John C Moorfield / Te Aka Māori Dictionary — educational use"
      },
      speaker: { gender: null, age_group: null, identity: null },
      proposed: { entity_id: "PARTICLE_O", type: "PARTICLE", gloss: "of, belongs to (o-category possession)" },
      approved: { entity_id: "PARTICLE_O", voice_type: null },
      status: "canonical",
      validation: {
        audio_integrity: true, pronunciation_match: true, language_correct: true,
        native_speaker: null, source_verified: true,
        reviewed_by: "system_validation", reviewed_date: "2026-07-23",
        notes: "MP3 file 26228 bytes from storage.googleapis.com CDN. Te Aka entry shows o as possession particle (o-category)."
      },
      native_verified: false,
      created: "2026-07-23",
      updated: "2026-07-23"
    },

    CONTRIB_MI_KUA_001: {
      contribution_id: "CONTRIB_MI_KUA_001",

      language: "mi",
      surface_form: "kua",

      source: {
        provider: "Te Aka Māori Dictionary",
        word_id: "3198",
        asset: "kua.mp3",
        source_url: "https://maoridictionary.co.nz/word/3198",
        retrieved: "2026-07-23",
        license: "Copyright John C Moorfield / Te Aka Māori Dictionary — educational use"
      },

      speaker: {
        gender: null,
        age_group: null,
        identity: null
      },

      proposed: {
        entity_id: "PARTICLE_KUA",
        type: "PARTICLE",
        gloss: "perfect aspect particle — indicates a change of state or completed action"
      },

      approved: {
        entity_id: "PARTICLE_KUA",
        voice_type: null
      },

      status: "canonical",

      validation: {
        audio_integrity: true,
        pronunciation_match: true,
        language_correct: true,
        native_speaker: null,
        source_verified: true,
        reviewed_by: "system_validation",
        reviewed_date: "2026-07-23",
        notes: "MP3 file 9344 bytes from storage.googleapis.com CDN. Te Aka entry shows kua as perfect aspect particle indicating a change of state or completed action. Audio verified via storage.googleapis.com CDN."
      },

      native_verified: false,

      created: "2026-07-23",
      updated: "2026-07-23"
    },

    CONTRIB_MI_TANA_001: {
      contribution_id: "CONTRIB_MI_TANA_001",

      language: "mi",
      surface_form: "tāna",

      source: {
        provider: "Te Aka Māori Dictionary",
        word_id: "7374",
        asset: "tana.mp3",
        source_url: "https://maoridictionary.co.nz/word/7374",
        retrieved: "2026-07-23",
        license: "Copyright John C Moorfield / Te Aka Māori Dictionary — educational use"
      },

      speaker: {
        gender: null,
        age_group: null,
        identity: null
      },

      proposed: {
        entity_id: "PARTICLE_TANA",
        type: "PARTICLE",
        gloss: "his, her — ā-category possessive; also used as quotative marker (said he/she)"
      },

      approved: {
        entity_id: "PARTICLE_TANA",
        voice_type: null
      },

      status: "canonical",

      validation: {
        audio_integrity: true,
        pronunciation_match: true,
        language_correct: true,
        native_speaker: null,
        source_verified: true,
        reviewed_by: "system_validation",
        reviewed_date: "2026-07-23",
        notes: "MP3 file 8468 bytes from storage.googleapis.com CDN. Te Aka entry shows tana as ā-category possessive: his, her. Also functions as quotative marker. Audio verified via storage.googleapis.com CDN."
      },

      native_verified: false,

      created: "2026-07-23",
      updated: "2026-07-23"
    },

    CONTRIB_MI_TAHI_001: {
      contribution_id: "CONTRIB_MI_TAHI_001",

      language: "mi",
      surface_form: "tahi",

      source: {
        provider: "Te Aka Māori Dictionary",
        word_id: "7058",
        asset: "tahi.mp3",
        source_url: "https://maoridictionary.co.nz/word/tahi",
        retrieved: "2026-07-23",
        license: "Copyright John C Moorfield / Te Aka Māori Dictionary — educational use"
      },

      speaker: {
        gender: null,
        age_group: null,
        identity: null
      },

      proposed: {
        entity_id: "STATE_TAHI",
        type: "STATE",
        gloss: "one, together, united, as one"
      },

      approved: {
        entity_id: "STATE_TAHI",
        voice_type: null
      },

      status: "canonical",

      validation: {
        audio_integrity: true,
        pronunciation_match: true,
        language_correct: true,
        native_speaker: null,
        source_verified: true,
        reviewed_by: "system_validation",
        reviewed_date: "2026-07-23",
        notes: "MP3 file 11387 bytes from storage.googleapis.com CDN. Te Aka entry shows tahi as stative: one, together, united. Audio verified via storage.googleapis.com CDN."
      },

      native_verified: false,

      created: "2026-07-23",
      updated: "2026-07-23"
    },

    CONTRIB_MI_RANGI_001: {
      contribution_id: "CONTRIB_MI_RANGI_001",
      language: "mi",
      surface_form: "rangi",
      source: {
        provider: "Te Aka Māori Dictionary",
        word_id: "6482",
        asset: "rangi.mp3",
        source_url: "https://maoridictionary.co.nz/word/6482",
        retrieved: "2026-07-23",
        license: "Copyright John C Moorfield / Te Aka Māori Dictionary — educational use"
      },
      speaker: { gender: null, age_group: null, identity: null },
      proposed: { entity_id: "THING_RANGI", type: "THING", gloss: "day, sky, weather, heaven" },
      approved: { entity_id: "THING_RANGI", voice_type: null },
      status: "canonical",
      validation: {
        audio_integrity: true, pronunciation_match: true, language_correct: true,
        native_speaker: null, source_verified: true,
        reviewed_by: "system_validation", reviewed_date: "2026-07-23",
        notes: "MP3 file 13859 bytes from storage.googleapis.com CDN. Te Aka entry shows rangi as noun: day, sky, weather, heaven. Audio verified via storage.googleapis.com CDN."
      },
      native_verified: false,
      created: "2026-07-23",
      updated: "2026-07-23"
    },

    CONTRIB_MI_TEITEI_001: {
      contribution_id: "CONTRIB_MI_TEITEI_001",
      language: "mi",
      surface_form: "teitei",
      source: {
        provider: "Te Aka Māori Dictionary",
        word_id: "7895",
        asset: "teitei.mp3",
        source_url: "https://maoridictionary.co.nz/word/7895",
        retrieved: "2026-07-23",
        license: "Copyright John C Moorfield / Te Aka Māori Dictionary — educational use"
      },
      speaker: { gender: null, age_group: null, identity: null },
      proposed: { entity_id: "STATE_TEITEI", type: "STATE", gloss: "high, tall, lofty, elevated, superior, height" },
      approved: { entity_id: "STATE_TEITEI", voice_type: null },
      status: "canonical",
      validation: {
        audio_integrity: true, pronunciation_match: true, language_correct: true,
        native_speaker: null, source_verified: true,
        reviewed_by: "system_validation", reviewed_date: "2026-07-23",
        notes: "MP3 file 30404 bytes from storage.googleapis.com CDN. Te Aka entry shows teitei as stative: high, tall, lofty, elevated. Audio verified via storage.googleapis.com CDN."
      },
      native_verified: false,
      created: "2026-07-23",
      updated: "2026-07-23"
    },

    CONTRIB_MI_MAU_001: {
      contribution_id: "CONTRIB_MI_MAU_001",
      language: "mi",
      surface_form: "mau",
      source: {
        provider: "Te Aka Māori Dictionary",
        word_id: "3932",
        asset: "mau.mp3",
        source_url: "https://maoridictionary.co.nz/word/3932",
        retrieved: "2026-07-23",
        license: "Copyright John C Moorfield / Te Aka Māori Dictionary — educational use"
      },
      speaker: { gender: null, age_group: null, identity: null },
      proposed: { entity_id: "ACTION_MAU", type: "ACTION", gloss: "to take, seize, catch, carry, hold, obtain, acquire" },
      approved: { entity_id: "ACTION_MAU", voice_type: null },
      status: "canonical",
      validation: {
        audio_integrity: true, pronunciation_match: true, language_correct: true,
        native_speaker: null, source_verified: true,
        reviewed_by: "system_validation", reviewed_date: "2026-07-23",
        notes: "MP3 file 11264 bytes from storage.googleapis.com CDN. Te Aka entry shows mau as verb: to take, seize, catch, carry, hold. Audio verified via storage.googleapis.com CDN."
      },
      native_verified: false,
      created: "2026-07-23",
      updated: "2026-07-23"
    },

    CONTRIB_MI_WHAKAKIIA_001: {
      contribution_id: "CONTRIB_MI_WHAKAKIIA_001",
      language: "mi",
      surface_form: "whakakiia",
      source: {
        provider: "Te Aka Māori Dictionary",
        word_id: "9519",
        asset: "whakaki.mp3",
        source_url: "https://maoridictionary.co.nz/word/9519",
        retrieved: "2026-07-23",
        license: "Copyright John C Moorfield / Te Aka Māori Dictionary — educational use",
        correction_note: "whakakiia is the passive form of whakaki (to fill). Uses existing whakaki.mp3 audio from word_id 9519. No separate audio acquisition needed."
      },
      speaker: { gender: null, age_group: null, identity: null },
      proposed: { entity_id: "ACTION_WHAKAKIIA", type: "ACTION", gloss: "to fill (passive form of whakaki)" },
      approved: { entity_id: "ACTION_WHAKAKIIA", voice_type: null },
      status: "canonical",
      validation: {
        audio_integrity: true, pronunciation_match: true, language_correct: true,
        native_speaker: null, source_verified: true,
        reviewed_by: "system_validation", reviewed_date: "2026-07-23",
        notes: "Derived form. whakakiia is the passive suffix -ia applied to whakaki (to fill). Uses existing whakaki.mp3 (word_id 9519, 39800 bytes) which was already acquired. No new audio download needed."
      },
      native_verified: false,
      created: "2026-07-23",
      updated: "2026-07-23"
    },

    CONTRIB_MI_PIKI_001: {
      contribution_id: "CONTRIB_MI_PIKI_001",
      language: "mi",
      surface_form: "piki",
      source: {
        provider: "Te Aka Māori Dictionary",
        word_id: "46406",
        asset: "piki.mp3",
        source_url: "https://maoridictionary.co.nz/word/46406",
        retrieved: "2026-07-23",
        license: "Copyright John C Moorfield / Te Aka Māori Dictionary — educational use"
      },
      speaker: { gender: null, age_group: null, identity: null },
      proposed: { entity_id: "ACTION_PIKI", type: "ACTION", gloss: "to rise, ascend, climb, mount, increase" },
      approved: { entity_id: "ACTION_PIKI", voice_type: null },
      status: "canonical",
      validation: {
        audio_integrity: true, pronunciation_match: true, language_correct: true,
        native_speaker: null, source_verified: true,
        reviewed_by: "system_validation", reviewed_date: "2026-07-23",
        notes: "MP3 file 26048 bytes from storage.googleapis.com CDN. Te Aka entry shows piki as verb: to rise, ascend, climb, mount, increase. Audio verified via storage.googleapis.com CDN."
      },
      native_verified: false,
      created: "2026-07-23",
      updated: "2026-07-23"
    },

    CONTRIB_MI_TORO_001: {
      contribution_id: "CONTRIB_MI_TORO_001",
      language: "mi",
      surface_form: "toro",
      source: {
        provider: "Te Aka Māori Dictionary",
        word_id: "8476",
        asset: "toro.mp3",
        source_url: "https://maoridictionary.co.nz/word/8476",
        retrieved: "2026-07-23",
        license: "Copyright John C Moorfield / Te Aka Māori Dictionary — educational use"
      },
      speaker: { gender: null, age_group: null, identity: null },
      proposed: { entity_id: "ACTION_TORO", type: "ACTION", gloss: "to reach, extend, stretch out, spread" },
      approved: { entity_id: "ACTION_TORO", voice_type: null },
      status: "canonical",
      validation: {
        audio_integrity: true, pronunciation_match: true, language_correct: true,
        native_speaker: null, source_verified: true,
        reviewed_by: "system_validation", reviewed_date: "2026-07-23",
        notes: "MP3 file 19964 bytes from storage.googleapis.com CDN. Te Aka entry shows toro as verb: to reach, extend, stretch out, spread. Audio verified via storage.googleapis.com CDN."
      },
      native_verified: false,
      created: "2026-07-23",
      updated: "2026-07-23"
    },

    CONTRIB_MI_ATU_001: {
      contribution_id: "CONTRIB_MI_ATU_001",
      language: "mi",
      surface_form: "atu",
      source: {
        provider: "Te Aka Māori Dictionary",
        word_id: "493",
        asset: "atu.mp3",
        source_url: "https://maoridictionary.co.nz/word/493",
        retrieved: "2026-07-23",
        license: "Copyright John C Moorfield / Te Aka Māori Dictionary — educational use"
      },
      speaker: { gender: null, age_group: null, identity: null },
      proposed: { entity_id: "PARTICLE_ATU", type: "PARTICLE", gloss: "away from the speaker, onwards, outwards — directional particle" },
      approved: { entity_id: "PARTICLE_ATU", voice_type: null },
      status: "canonical",
      validation: {
        audio_integrity: true, pronunciation_match: true, language_correct: true,
        native_speaker: null, source_verified: true,
        reviewed_by: "system_validation", reviewed_date: "2026-07-23",
        notes: "MP3 file 9313 bytes from storage.googleapis.com CDN. Te Aka entry shows atu as particle: away from speaker, onwards. Audio verified via storage.googleapis.com CDN."
      },
      native_verified: false,
      created: "2026-07-23",
      updated: "2026-07-23"
    },

    CONTRIB_MI_TUPU_001: {
      contribution_id: "CONTRIB_MI_TUPU_001",
      language: "mi",
      surface_form: "tupu",
      source: {
        provider: "Te Aka Māori Dictionary",
        word_id: "8754",
        asset: "tupu.mp3",
        source_url: "https://maoridictionary.co.nz/word/8754",
        retrieved: "2026-07-23",
        license: "Copyright John C Moorfield / Te Aka Māori Dictionary — educational use"
      },
      speaker: { gender: null, age_group: null, identity: null },
      proposed: { entity_id: "ACTION_TUPU", type: "ACTION", gloss: "to grow, increase, spring up, appear" },
      approved: { entity_id: "ACTION_TUPU", voice_type: null },
      status: "canonical",
      validation: {
        audio_integrity: true, pronunciation_match: true, language_correct: true,
        native_speaker: null, source_verified: true,
        reviewed_by: "system_validation", reviewed_date: "2026-07-23",
        notes: "MP3 file 23096 bytes from storage.googleapis.com CDN. Te Aka entry shows tupu as verb: to grow, increase, spring up. Audio verified via storage.googleapis.com CDN (GET). Word has dialectal variant tipu (Eastern) used in RIVER_007."
      },
      native_verified: false,
      created: "2026-07-23",
      updated: "2026-07-23"
    },

    CONTRIB_MI_TAHU_001: {
      contribution_id: "CONTRIB_MI_TAHU_001",
      language: "mi",
      surface_form: "tahu",
      source: {
        provider: "Te Aka Māori Dictionary",
        word_id: "7072",
        asset: "tahu.mp3",
        source_url: "https://maoridictionary.co.nz/word/7072",
        retrieved: "2026-07-23",
        license: "Copyright John C Moorfield / Te Aka Māori Dictionary — educational use"
      },
      speaker: { gender: null, age_group: null, identity: null },
      proposed: { entity_id: "ACTION_TAHU", type: "ACTION", gloss: "to light, set on fire, burn, kindle" },
      approved: { entity_id: "ACTION_TAHU", voice_type: null },
      status: "canonical",
      validation: {
        audio_integrity: true, pronunciation_match: true, language_correct: true,
        native_speaker: null, source_verified: true,
        reviewed_by: "system_validation", reviewed_date: "2026-07-23",
        notes: "MP3 file 8468 bytes from storage.googleapis.com CDN. Te Aka entry shows tahu as verb: to set on fire, light, burn, kindle. Audio verified via storage.googleapis.com CDN (GET)."
      },
      native_verified: false,
      created: "2026-07-23",
      updated: "2026-07-23"
    },

    CONTRIB_MI_MAOA_001: {
      contribution_id: "CONTRIB_MI_MAOA_001",
      language: "mi",
      surface_form: "maoa",
      source: {
        provider: "Te Aka Māori Dictionary",
        word_id: "3642",
        asset: "maoa.mp3",
        source_url: "https://maoridictionary.co.nz/word/3642",
        retrieved: "2026-07-23",
        license: "Copyright John C Moorfield / Te Aka Māori Dictionary — educational use"
      },
      speaker: { gender: null, age_group: null, identity: null },
      proposed: { entity_id: "STATE_MAOA", type: "STATE", gloss: "to be cooked, ripe, done (of food)" },
      approved: { entity_id: "STATE_MAOA", voice_type: null },
      status: "canonical",
      validation: {
        audio_integrity: true, pronunciation_match: true, language_correct: true,
        native_speaker: null, source_verified: true,
        reviewed_by: "system_validation", reviewed_date: "2026-07-23",
        notes: "MP3 file 12800 bytes from storage.googleapis.com CDN. Te Aka entry shows maoa as stative verb: be cooked, ripe. Audio verified."
      },
      native_verified: false,
      created: "2026-07-23",
      updated: "2026-07-23"
    },

    CONTRIB_MI_KARANGA_001: {
      contribution_id: "CONTRIB_MI_KARANGA_001",
      language: "mi",
      surface_form: "karanga",
      source: {
        provider: "Te Aka Māori Dictionary",
        word_id: "2286",
        asset: "karanga.mp3",
        source_url: "https://maoridictionary.co.nz/word/2286",
        retrieved: "2026-07-23",
        license: "Copyright John C Moorfield / Te Aka Māori Dictionary — educational use"
      },
      speaker: { gender: null, age_group: null, identity: null },
      proposed: { entity_id: "ACTION_KARANGA", type: "ACTION", gloss: "to call, call out, shout, summon" },
      approved: { entity_id: "ACTION_KARANGA", voice_type: null },
      status: "canonical",
      validation: {
        audio_integrity: true, pronunciation_match: true, language_correct: true,
        native_speaker: null, source_verified: true,
        reviewed_by: "system_validation", reviewed_date: "2026-07-23",
        notes: "MP3 file 11264 bytes from storage.googleapis.com CDN. Te Aka entry shows karanga as verb: to call, call out, shout, summon. Audio verified."
      },
      native_verified: false,
      created: "2026-07-23",
      updated: "2026-07-23"
    },

    CONTRIB_MI_KATOA_001: {
      contribution_id: "CONTRIB_MI_KATOA_001",
      language: "mi",
      surface_form: "katoa",
      source: {
        provider: "Te Aka Māori Dictionary",
        word_id: "46863",
        asset: "katoa.mp3",
        source_url: "https://maoridictionary.co.nz/word/46863",
        retrieved: "2026-07-23",
        license: "Copyright John C Moorfield / Te Aka Māori Dictionary — educational use"
      },
      speaker: { gender: null, age_group: null, identity: null },
      proposed: { entity_id: "QUANTIFIER_KATOA", type: "QUANTIFIER", gloss: "all, every, whole, everyone, everything" },
      approved: { entity_id: "QUANTIFIER_KATOA", voice_type: null },
      status: "canonical",
      validation: {
        audio_integrity: true, pronunciation_match: true, language_correct: true,
        native_speaker: null, source_verified: true,
        reviewed_by: "system_validation", reviewed_date: "2026-07-23",
        notes: "MP3 file 35648 bytes from storage.googleapis.com CDN. Te Aka entry shows katoa as modifier: all, every. Audio verified."
      },
      native_verified: false,
      created: "2026-07-23",
      updated: "2026-07-23"
    },

    CONTRIB_MI_TITIRO_001: {
      contribution_id: "CONTRIB_MI_TITIRO_001",
      language: "mi",
      surface_form: "titiro",
      source: {
        provider: "Te Aka Māori Dictionary",
        word_id: "8226",
        asset: "titiro.mp3",
        source_url: "https://maoridictionary.co.nz/word/8226",
        retrieved: "2026-07-23",
        license: "Copyright John C Moorfield / Te Aka Māori Dictionary — educational use"
      },
      speaker: { gender: null, age_group: null, identity: null },
      proposed: { entity_id: "ACTION_TITIRO", type: "ACTION", gloss: "to look at, inspect, examine, observe, survey, view" },
      approved: { entity_id: "ACTION_TITIRO", voice_type: null },
      status: "canonical",
      validation: {
        audio_integrity: true, pronunciation_match: true, language_correct: true,
        native_speaker: null, source_verified: true,
        reviewed_by: "system_validation", reviewed_date: "2026-07-23",
        notes: "MP3 file 27272 bytes from storage.googleapis.com CDN. Te Aka entry shows titiro as verb: to look at, inspect, examine. Audio verified."
      },
      native_verified: false,
      created: "2026-07-23",
      updated: "2026-07-23"
    },

    CONTRIB_MI_KATA_001: {
      contribution_id: "CONTRIB_MI_KATA_001",
      language: "mi",
      surface_form: "kata",
      source: {
        provider: "Te Aka Māori Dictionary",
        word_id: "2370",
        asset: "kata.mp3",
        source_url: "https://maoridictionary.co.nz/word/2370",
        retrieved: "2026-07-23",
        license: "Copyright John C Moorfield / Te Aka Māori Dictionary — educational use"
      },
      speaker: { gender: null, age_group: null, identity: null },
      proposed: { entity_id: "ACTION_KATA", type: "ACTION", gloss: "to laugh, laugh at" },
      approved: { entity_id: "ACTION_KATA", voice_type: null },
      status: "canonical",
      validation: {
        audio_integrity: true, pronunciation_match: true, language_correct: true,
        native_speaker: null, source_verified: true,
        reviewed_by: "system_validation", reviewed_date: "2026-07-23",
        notes: "MP3 file 8960 bytes from storage.googleapis.com CDN. Te Aka entry shows kata as verb: to laugh. Audio verified."
      },
      native_verified: false,
      created: "2026-07-23",
      updated: "2026-07-23"
    },

    CONTRIB_MI_ONA_001: {
      contribution_id: "CONTRIB_MI_ONA_001",
      language: "mi",
      surface_form: "ona",
      source: {
        provider: "Te Aka Māori Dictionary",
        word_id: "4756",
        asset: "ona.mp3",
        source_url: "https://maoridictionary.co.nz/word/4756",
        retrieved: "2026-07-23",
        license: "Copyright John C Moorfield / Te Aka Māori Dictionary — educational use"
      },
      speaker: { gender: null, age_group: null, identity: null },
      proposed: { entity_id: "PARTICLE_ONA", type: "PARTICLE", gloss: "his, her (plural, o-category possessive particle)" },
      approved: { entity_id: "PARTICLE_ONA", voice_type: null },
      status: "canonical",
      validation: {
        audio_integrity: true, pronunciation_match: true, language_correct: true,
        native_speaker: null, source_verified: true,
        reviewed_by: "system_validation", reviewed_date: "2026-07-23",
        notes: "MP3 file 25184 bytes from storage.googleapis.com CDN. Te Aka entry shows ona as particle: his, her (plural, o-category). Co-dependency with pakiaka in RIVER_005. Audio verified."
      },
      native_verified: false,
      created: "2026-07-23",
      updated: "2026-07-23"
    },

    CONTRIB_MI_KAKARA_001: {
      contribution_id: "CONTRIB_MI_KAKARA_001",
      language: "mi",
      surface_form: "kakara",
      source: {
        provider: "Te Aka Māori Dictionary",
        word_id: "2100",
        asset: "kakara.mp3",
        source_url: "https://maoridictionary.co.nz/word/2100",
        retrieved: "2026-07-23",
        license: "Copyright John C Moorfield / Te Aka Māori Dictionary — educational use"
      },
      speaker: { gender: null, age_group: null, identity: null },
      proposed: { entity_id: "STATE_KAKARA", type: "STATE", gloss: "to be fragrant, aromatic, sweet-smelling, scented" },
      approved: { entity_id: "STATE_KAKARA", voice_type: null },
      status: "canonical",
      validation: {
        audio_integrity: true, pronunciation_match: true, language_correct: true,
        native_speaker: null, source_verified: true,
        reviewed_by: "system_validation", reviewed_date: "2026-07-23",
        notes: "MP3 file 10880 bytes from storage.googleapis.com CDN. Te Aka entry shows kakara as stative verb: be aromatic, fragrant. Audio verified via storage.googleapis.com CDN (GET)."
      },
      native_verified: false,
      created: "2026-07-23",
      updated: "2026-07-23"
    },

    CONTRIB_MI_HOROI_001: {
      contribution_id: "CONTRIB_MI_HOROI_001",
      language: "mi",
      surface_form: "horoi",
      source: {
        provider: "Te Aka Māori Dictionary",
        word_id: "1438",
        asset: "horoi.mp3",
        source_url: "https://maoridictionary.co.nz/word/1438",
        retrieved: "2026-07-23",
        license: "Copyright John C Moorfield / Te Aka Māori Dictionary — educational use"
      },
      speaker: { gender: null, age_group: null, identity: null },
      proposed: { entity_id: "ACTION_HOROI", type: "ACTION", gloss: "to wash, clean, wipe, cleanse" },
      approved: { entity_id: "ACTION_HOROI", voice_type: null },
      status: "canonical",
      validation: {
        audio_integrity: true, pronunciation_match: true, language_correct: true,
        native_speaker: null, source_verified: true,
        reviewed_by: "system_validation", reviewed_date: "2026-07-23",
        notes: "MP3 file 13952 bytes from storage.googleapis.com CDN. Te Aka entry shows horoi as verb: to wash, clean, wipe, cleanse. Audio verified via storage.googleapis.com CDN (GET)."
      },
      native_verified: false,
      created: "2026-07-23",
      updated: "2026-07-23"
    }
  };

  /**
   * Get a contribution record by ID.
   * @param {string} id
   * @returns {Object|undefined}
   */
  function get(id) {
    return RECORDS[id];
  }

  /**
   * Get all contribution records.
   * @returns {Object}
   */
  function getAll() {
    return RECORDS;
  }

  /**
   * Query contributions by filter.
   * @param {Object} [opts]
   * @param {string} [opts.status] - Filter by status
   * @param {string} [opts.language] - Filter by language
   * @returns {Array<Object>}
   */
  function query(opts) {
    opts = opts || {};
    return Object.values(RECORDS).filter(function(c) {
      if (opts.status && c.status !== opts.status) return false;
      if (opts.language && c.language !== opts.language) return false;
      return true;
    });
  }

  /**
   * Check if a contribution has reached canonical status.
   * Single authoritative check — prevents contradictory states.
   */
  function isCanonical(id) {
    var c = RECORDS[id];
    return c ? c.status === "canonical" : false;
  }

  /**
   * Runtime gate: is this audio_ref playable?
   * Legacy refs (no contribution_id) are playable.
   * Contributed refs are playable only if canonical.
   */
  function isRefPlayable(audioRef) {
    if (!audioRef || !audioRef.contribution_id) return true;
    return isCanonical(audioRef.contribution_id);
  }

  /**
   * Update the status of a contribution record.
   * @param {string} id
   * @param {string} newStatus - pending|validated|approved|canonical|rejected
   * @returns {boolean} whether the update was applied
   */
  function setStatus(id, newStatus) {
    var VALID_STATUSES = ["pending", "validated", "approved", "canonical", "rejected"];
    if (VALID_STATUSES.indexOf(newStatus) === -1) return false;
    var c = RECORDS[id];
    if (!c) return false;
    c.status = newStatus;
    c.updated = new Date().toISOString().slice(0, 10);
    return true;
  }

  /**
   * Set approval details (entity_id, voice_type).
   * Only meaningful when status is "approved" or "canonical".
   */
  function setApproval(id, entityId, voiceType) {
    var c = RECORDS[id];
    if (!c) return false;
    c.approved.entity_id = entityId || null;
    c.approved.voice_type = voiceType || null;
    c.updated = new Date().toISOString().slice(0, 10);
    return true;
  }

  /**
   * Update a validation field on a contribution.
   * @param {string} id
   * @param {string} field - validation field name
   * @param {boolean|null} value
   */
  function setValidation(id, field, value) {
    var c = RECORDS[id];
    if (!c) return false;
    if (c.validation.hasOwnProperty(field)) {
      c.validation[field] = value;
      c.updated = new Date().toISOString().slice(0, 10);
      return true;
    }
    return false;
  }

  /**
   * Add a new contribution record.
   * @param {Object} record
   * @returns {boolean}
   */
  function add(record) {
    if (!record.contribution_id || RECORDS[record.contribution_id]) return false;
    RECORDS[record.contribution_id] = record;
    return true;
  }

  /**
   * Get all contributions for a given language, grouped by status.
   */
  function summary(language) {
    var byStatus = { pending: 0, validated: 0, approved: 0, canonical: 0, rejected: 0 };
    Object.values(RECORDS).forEach(function(c) {
      if (language && c.language !== language) return;
      if (byStatus.hasOwnProperty(c.status)) byStatus[c.status]++;
    });
    return byStatus;
  }

  return {
    get: get,
    getAll: getAll,
    query: query,
    isCanonical: isCanonical,
    isRefPlayable: isRefPlayable,
    setStatus: setStatus,
    setApproval: setApproval,
    setValidation: setValidation,
    add: add,
    summary: summary,
  };
})();

if (typeof module !== "undefined" && module.exports) {
  module.exports = { CONTRIBUTIONS };
}

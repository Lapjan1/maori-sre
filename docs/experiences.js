const EXPERIENCES = [
  {
    "id": "RIVER_001",
    "type": "story",
    "level": 1,
    "title": {
      "en": "The Child Drinks Water",
      "mi": "Ka Inu te Tamaiti i te Wai",
      "af": "Die Kind Drink Water"
    },
    "content": {
      "en": "A child walks to the river. The child is thirsty. The child drinks water from the river. Now the child is not thirsty.\n",
      "mi": "Ka hīkoi te tamaiti ki te awa. Kei te matewai te tamaiti. Ka inu te tamaiti i te wai mai i te awa. Kāore te tamaiti i te matewai ināianei.\n",
      "af": "'n Kind loop na die rivier. Die kind is dors. Die kind drink water uit die rivier. Nou is die kind nie dors nie.\n"
    },
    "entities": [
      {
        "id": "PERSON_003",
        "category": "PERSON",
        "label": {
          "default": "child",
          "mi": "tamaiti",
          "af": "kind"
        }
      },
      {
        "id": "THING_001",
        "category": "THING",
        "label": {
          "default": "water",
          "mi": "wai",
          "af": "water"
        }
      },
      {
        "id": "PLACE_005",
        "category": "PLACE",
        "label": {
          "default": "river",
          "mi": "awa",
          "af": "rivier"
        }
      },
      {
        "id": "STATE_001",
        "category": "STATE",
        "label": {
          "default": "thirsty",
          "mi": "matewai",
          "af": "dors"
        }
      },
      {
        "id": "STATE_002",
        "category": "STATE",
        "label": {
          "default": "hydrated",
          "mi": "kore matewai",
          "af": "nie dors nie"
        }
      },
      {
        "id": "ACTION_001",
        "category": "ACTION",
        "label": {
          "default": "drink",
          "mi": "inu",
          "af": "drink"
        }
      },
      {
        "id": "ACTION_002",
        "category": "ACTION",
        "label": {
          "default": "walk",
          "mi": "hīkoi",
          "af": "loop"
        }
      }
    ],
    "interactions": [
      {
        "id": "INT_R001_01",
        "sentences": {},
        "action": "ACTION_002"
      },
      {
        "id": "INT_R001_02",
        "sentences": {},
        "action": "ACTION_001"
      },
      {
        "id": "INT_R001_03",
        "sentences": {},
        "action": ""
      }
    ]
  },
  {
    "id": "RIVER_002",
    "type": "story",
    "level": 1,
    "title": {
      "en": "Mother Gives Water to the Child",
      "mi": "Ka Hoatu te Whaea i te Wai ki te Tamaiti",
      "af": "Ma Gee Water aan die Kind"
    },
    "content": {
      "en": "The mother sees the child is thirsty. She takes a cup. She fills the cup with water from the river. She gives the cup to the child. The child drinks. The child is happy.\n",
      "mi": "Ka kite te whaea kei te matewai te tamaiti. Ka mau ia ki te kapu. Ka whakakiia e ia te kapu ki te wai mai i te awa. Ka hoatu e ia te kapu ki te tamaiti. Ka inu te tamaiti. Kei te koa te tamaiti.\n",
      "af": "Die ma sien die kind is dors. Sy vat 'n koppie. Sy vul die koppie met water uit die rivier. Sy gee die koppie aan die kind. Die kind drink. Die kind is bly.\n"
    },
    "entities": [
      {
        "id": "PERSON_010",
        "category": "PERSON",
        "label": {
          "default": "mother",
          "mi": "whaea",
          "af": "ma"
        }
      },
      {
        "id": "THING_103",
        "category": "THING",
        "label": {
          "default": "cup",
          "mi": "kapu",
          "af": "koppie"
        }
      },
      {
        "id": "ACTION_010",
        "category": "ACTION",
        "label": {
          "default": "give",
          "mi": "hoatu",
          "af": "gee"
        }
      },
      {
        "id": "ACTION_012",
        "category": "ACTION",
        "label": {
          "default": "fill",
          "mi": "whakaki",
          "af": "vul"
        }
      },
      {
        "id": "STATE_010",
        "category": "STATE",
        "label": {
          "default": "happy",
          "mi": "koa",
          "af": "bly"
        }
      }
    ],
    "interactions": [
      {
        "id": "INT_R002_01",
        "sentences": {},
        "action": ""
      },
      {
        "id": "INT_R002_02",
        "sentences": {},
        "action": "ACTION_012"
      },
      {
        "id": "INT_R002_03",
        "sentences": {},
        "action": "ACTION_010"
      },
      {
        "id": "INT_R002_04",
        "sentences": {},
        "action": "ACTION_001"
      }
    ]
  },
  {
    "id": "RIVER_003",
    "type": "observation",
    "level": 1,
    "title": {
      "en": "Dog Drinks from the River",
      "mi": "Ka Inu te Kurī i te Awa",
      "af": "Die Hond Drink uit die Rivier"
    },
    "content": {
      "en": "A dog walks to the river. The dog is thirsty. The dog drinks water from the river. The dog is no longer thirsty.\n",
      "mi": "Ka hīkoi te kurī ki te awa. Kei te matewai te kurī. Ka inu te kurī i te wai mai i te awa. Kāore te kurī i te matewai ināianei.\n",
      "af": "'n Hond loop na die rivier. Die hond is dors. Die hond drink water uit die rivier. Die hond is nie meer dors nie.\n"
    },
    "entities": [
      {
        "id": "THING_101",
        "category": "ANIMAL",
        "label": {
          "default": "dog",
          "mi": "kurī",
          "af": "hond"
        }
      }
    ],
    "interactions": [
      {
        "id": "INT_R003_01",
        "sentences": {},
        "action": "ACTION_002"
      },
      {
        "id": "INT_R003_02",
        "sentences": {},
        "action": "ACTION_001"
      }
    ]
  },
  {
    "id": "RIVER_004",
    "type": "observation",
    "level": 2,
    "title": {
      "en": "Rain Fills the River",
      "mi": "Ka Whakaki te Ua i te Awa",
      "af": "Die Reën Vul die Rivier"
    },
    "content": {
      "en": "The sky is dark. Rain falls from the sky. The rain fills the river. The river rises. The water flows.\n",
      "mi": "He pōuri te rangi. Ka heke te ua i te rangi. Ka whakaki te ua i te awa. Ka piki te awa. Ka rere te wai.\n",
      "af": "Die lug is donker. Reën val uit die lug. Die reën vul die rivier. Die rivier styg. Die water vloei.\n"
    },
    "entities": [
      {
        "id": "THING_106",
        "category": "THING",
        "label": {
          "default": "rain",
          "mi": "ua",
          "af": "reën"
        }
      },
      {
        "id": "ACTION_013",
        "category": "ACTION",
        "label": {
          "default": "fall",
          "mi": "heke",
          "af": "val"
        }
      },
      {
        "id": "ACTION_014",
        "category": "ACTION",
        "label": {
          "default": "flow",
          "mi": "rere",
          "af": "vloei"
        }
      }
    ],
    "interactions": [
      {
        "id": "INT_R004_01",
        "sentences": {},
        "action": "ACTION_013"
      },
      {
        "id": "INT_R004_02",
        "sentences": {},
        "action": "ACTION_012"
      },
      {
        "id": "INT_R004_03",
        "sentences": {},
        "action": "ACTION_014"
      }
    ]
  },
  {
    "id": "RIVER_005",
    "type": "observation",
    "level": 2,
    "title": {
      "en": "Tree Grows Beside the River",
      "mi": "Ka Tipu te Rākau i te Taha o te Awa",
      "af": "Boom Groei Langs die Rivier"
    },
    "content": {
      "en": "A tall tree grows beside the river. Its roots reach into the water. The tree drinks from the river. The tree grows tall and strong.\n",
      "mi": "Ka tipu tētahi rākau teitei i te taha o te awa. Ka toro atu ōna pakiaka ki te wai. Ka inu te rākau i te awa. Ka tupu teitei te rākau.\n",
      "af": "'n Groot boom groei langs die rivier. Sy wortels strek na die water. Die boom drink uit die rivier. Die boom groei lank en sterk.\n"
    },
    "entities": [
      {
        "id": "THING_100",
        "category": "THING",
        "label": {
          "default": "tree",
          "mi": "rākau",
          "af": "boom"
        }
      },
      {
        "id": "ACTION_015",
        "category": "ACTION",
        "label": {
          "default": "grow",
          "mi": "tipu",
          "af": "groei"
        }
      }
    ],
    "interactions": [
      {
        "id": "INT_R005_01",
        "sentences": {},
        "action": "ACTION_015"
      },
      {
        "id": "INT_R005_02",
        "sentences": {},
        "action": "ACTION_001"
      }
    ]
  },
  {
    "id": "RIVER_006",
    "type": "observation",
    "level": 1,
    "title": {
      "en": "Fish Live in the River",
      "mi": "Ka Noho te Ika ki te Awa",
      "af": "Vis Woon in die Rivier"
    },
    "content": {
      "en": "Fish live in the river. The water is their home. They swim in the water.\n",
      "mi": "Ka noho te ika ki te awa. Ko te wai tō rātou kāinga. Ka kauhoe rātou i te wai.\n",
      "af": "Visse woon in die rivier. Die water is hul tuiste. Hulle swem in die water.\n"
    },
    "entities": [
      {
        "id": "THING_102",
        "category": "ANIMAL",
        "label": {
          "default": "fish",
          "mi": "ika",
          "af": "vis"
        }
      },
      {
        "id": "ACTION_016",
        "category": "ACTION",
        "label": {
          "default": "live",
          "mi": "noho",
          "af": "woon"
        }
      },
      {
        "id": "ACTION_017",
        "category": "ACTION",
        "label": {
          "default": "swim",
          "mi": "kauhoe",
          "af": "swem"
        }
      }
    ],
    "interactions": [
      {
        "id": "INT_R006_01",
        "sentences": {},
        "action": "ACTION_016"
      },
      {
        "id": "INT_R006_02",
        "sentences": {},
        "action": "ACTION_017"
      }
    ]
  },
  {
    "id": "RIVER_007",
    "type": "procedure",
    "level": 2,
    "title": {
      "en": "Family Catches a Fish",
      "mi": "Ka Hopu te Whānau i te Ika",
      "af": "Familie Vang 'n Vis"
    },
    "content": {
      "en": "The family goes to the river. The mother has a net. She catches a fish from the river. The fish is big. The family is happy.\n",
      "mi": "Ka haere te whānau ki te awa. Kei te whaea he kupenga. Ka hopu ia i tētahi ika i te awa. He nui te ika. Kei te koa te whānau.\n",
      "af": "Die familie gaan na die rivier. Die ma het 'n net. Sy vang 'n vis in die rivier. Die vis is groot. Die familie is bly.\n"
    },
    "entities": [
      {
        "id": "PERSON_011",
        "category": "PERSON",
        "label": {
          "default": "family",
          "mi": "whānau",
          "af": "familie"
        }
      },
      {
        "id": "THING_107",
        "category": "THING",
        "label": {
          "default": "net",
          "mi": "kupenga",
          "af": "net"
        }
      },
      {
        "id": "ACTION_018",
        "category": "ACTION",
        "label": {
          "default": "catch",
          "mi": "hopu",
          "af": "vang"
        }
      }
    ],
    "interactions": [
      {
        "id": "INT_R007_01",
        "sentences": {},
        "action": ""
      },
      {
        "id": "INT_R007_02",
        "sentences": {},
        "action": "ACTION_018"
      }
    ]
  },
  {
    "id": "RIVER_008",
    "type": "procedure",
    "level": 2,
    "title": {
      "en": "Family Cooks the Fish",
      "mi": "Ka Tunu te Whānau i te Ika",
      "af": "Familie Kook die Vis"
    },
    "content": {
      "en": "The family makes a fire. They clean the fish. They cook the fish over the fire. The fish smells good.\n",
      "mi": "Ka tahu te whānau i te ahi. Ka horoi rātou i te ika. Ka tunu rātou i te ika ki te ahi. He kakara reka te ika.\n",
      "af": "Die familie maak 'n vuur. Hulle maak die vis skoon. Hulle kook die vis oor die vuur. Die vis ruik lekker.\n"
    },
    "entities": [
      {
        "id": "THING_104",
        "category": "THING",
        "label": {
          "default": "fire",
          "mi": "ahi",
          "af": "vuur"
        }
      },
      {
        "id": "THING_105",
        "category": "THING",
        "label": {
          "default": "food",
          "mi": "kai",
          "af": "kos"
        }
      },
      {
        "id": "ACTION_019",
        "category": "ACTION",
        "label": {
          "default": "cook",
          "mi": "tunu",
          "af": "kook"
        }
      }
    ],
    "interactions": [
      {
        "id": "INT_R008_01",
        "sentences": {},
        "action": ""
      },
      {
        "id": "INT_R008_02",
        "sentences": {},
        "action": "ACTION_019"
      }
    ]
  },
  {
    "id": "RIVER_009",
    "type": "dialogue",
    "level": 2,
    "title": {
      "en": "Family Shares Food",
      "mi": "Ka Tohatoha te Whānau i te Kai",
      "af": "Familie Deel Kos"
    },
    "content": {
      "en": "The food is ready. The mother calls the family. \"Come and eat,\" she says. Everyone sits together. The mother shares the fish. The child eats. \"This is delicious,\" says the child. The family is happy.\n",
      "mi": "Kua māoa te kai. Ka karanga te whaea ki te whānau. \"Haere mai ki te kai,\" tāna. Ka noho tahi te katoa. Ka tohatoha te whaea i te ika. Ka kai te tamaiti. \"He reka tēnei,\" e kī ana te tamaiti. Kei te koa te whānau.\n",
      "af": "Die kos is gereed. Die ma roep die familie. \"Kom en eet,\" sê sy. Almal sit saam. Die ma deel die vis. Die kind eet. \"Dit is heerlik,\" sê die kind. Die familie is bly.\n"
    },
    "entities": [
      {
        "id": "ACTION_020",
        "category": "ACTION",
        "label": {
          "default": "share",
          "mi": "tohatoha",
          "af": "deel"
        }
      },
      {
        "id": "ACTION_021",
        "category": "ACTION",
        "label": {
          "default": "eat",
          "mi": "kai",
          "af": "eet"
        }
      },
      {
        "id": "STATE_011",
        "category": "STATE",
        "label": {
          "default": "full",
          "mi": "mākona",
          "af": "versadig"
        }
      }
    ],
    "interactions": [
      {
        "id": "INT_R009_01",
        "sentences": {},
        "action": ""
      },
      {
        "id": "INT_R009_02",
        "sentences": {},
        "action": ""
      },
      {
        "id": "INT_R009_03",
        "sentences": {},
        "action": "ACTION_020"
      },
      {
        "id": "INT_R009_04",
        "sentences": {},
        "action": "ACTION_021"
      },
      {
        "id": "INT_R009_05",
        "sentences": {},
        "action": ""
      }
    ]
  },
  {
    "id": "RIVER_010",
    "type": "story",
    "level": 1,
    "title": {
      "en": "The Child Thanks the Mother",
      "mi": "Ka Whakawhetai te Tamaiti ki te Whaea",
      "af": "Die Kind Bedank die Ma"
    },
    "content": {
      "en": "The child is full. The child looks at the mother. \"Thank you, Mother, for the food,\" says the child. The mother smiles. \"You are welcome, my child,\" she says. The family is together.\n",
      "mi": "Kua mākona te tamaiti. Ka titiro te tamaiti ki te whaea. \"Ngā mihi e te whaea mō te kai,\" e kī ana te tamaiti. Ka kata te whaea. \"Ko tēnei te whakautu, e taku tamaiti,\" tāna. Kei te noho tahi te whānau.\n",
      "af": "Die kind is versadig. Die kind kyk na die ma. \"Dankie, Ma, vir die kos,\" sê die kind. Die ma glimlag. \"Jy is welkom, my kind,\" sê sy. Die familie is saam.\n"
    },
    "entities": [
      {
        "id": "ACTION_022",
        "category": "ACTION",
        "label": {
          "default": "thank",
          "mi": "whakawhetai",
          "af": "bedank"
        }
      },
      {
        "id": "STATE_012",
        "category": "STATE",
        "label": {
          "default": "grateful",
          "mi": "whakawhetai",
          "af": "dankbaar"
        }
      },
      {
        "id": "STATE_013",
        "category": "STATE",
        "label": {
          "default": "together",
          "mi": "noho tahi",
          "af": "saam"
        }
      }
    ],
    "interactions": [
      {
        "id": "INT_R010_01",
        "sentences": {},
        "action": ""
      },
      {
        "id": "INT_R010_02",
        "sentences": {},
        "action": "ACTION_022"
      },
      {
        "id": "INT_R010_03",
        "sentences": {},
        "action": ""
      },
      {
        "id": "INT_R010_04",
        "sentences": {},
        "action": ""
      }
    ]
  }
];
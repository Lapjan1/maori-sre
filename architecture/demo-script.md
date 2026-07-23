# Demo Script — Co-Sense for Te Hiku Media

Target: ~4 minutes. Conversational, not polished.

---

### 0:00–0:20 — Purpose

> "This is Co-Sense, a prototype I built. The idea is that instead of storing translations between languages, it stores a shared semantic representation of each experience, and each language renders from that. I'd love Māori language expertise to evaluate whether the representation is linguistically sound."

---

### 0:20–1:05 — Open a story

Live site: `https://lapjan1.github.io/maori-sre/`

- Left panel: English, Right panel: Māori
- Select story "The Child Drinks Water" (RIVER_001)

> "Each story has the same content in three languages — English, Māori, Afrikaans. The panels are independent renderers of the same underlying scene."

Read the Māori sentence aloud (slowly):
> *"Ka hīkoi te tamaiti ki te awa. Kei te matewai te tamaiti..."*

> "This is where the demo gets interesting."

---

### 1:05–2:05 — Click a word

Click **tamaiti** (appears as a word chip below the sentence).

Show the detail panel:
- Entity ID: PERSON_003
- Type: PERSON
- Pronunciation: ta-ma-i-ti
- Play audio (Te Aka MP3 plays)

> "Every word is linked to a semantic entity — PERSON_003, 'child', 'tamaiti', 'kind'. The same entity in each language. When you click a word in any language, it shows the same entity from the other language's perspective."

Click **wai** → play audio.
Click **awa** (river) → play audio.

> "These recordings come from Te Aka Māori Dictionary, with full provenance tracking — source URL, retrieval date, license."

---

### 2:05–2:35 — Switch panel to Afrikaans

Swap right panel from Māori to Afrikaans (voice: Hannes).

> "The same entity model means the Afrikaans panel renders from the same representation. Different words, same meaning."

Click **kind** → play Hannes' recording.
Click **rivier** → play recording.

> "Afrikaans audio was recorded by a community contributor named Hannes. Same semantic model, different language renderer."

---

### 2:35–3:30 — Show the planner (terminal)

Switch to terminal. Run:
```
node scripts/acquisition-planner.js ledger
```

> "Under the hood, the system treats language acquisition as a state-transition problem. It knows which sentences are fully resolvable and which words are missing."

Show ledger output — 17 predictions, all accurate.

> "This is the prediction ledger. Every time a word was acquired, the planner predicted how many sentences it would unlock, then logged the actual outcome. All 17 predictions were accurate."

> "The planner uses three strategies — structural (immediate gain), horizon (what future state does this create), and probabilistic (expected utility under uncertainty)."

---

### 3:30–4:00 — The ask

> "The application is working — 49 out of 49 sentences have full audio — but I need someone with Māori language expertise to evaluate whether the semantic representation is accurate and whether the pedagogy makes sense from a Māori perspective."

> "Specifically, I'd like review of the 10 River World stories — the Māori content, entity classifications, and whether the way I've structured the language aligns with how te reo Māori actually works."

> "I'd be happy to send a link to the live site or do a longer walkthrough whenever works."

---

### Notes for recording

- Don't script it — use this as a guide and speak naturally
- If something breaks or doesn't load, just say "that's still being fixed" and move on
- Keep the terminal part brief — the app itself is more compelling
- End with the specific ask, not a general "what do you think?"

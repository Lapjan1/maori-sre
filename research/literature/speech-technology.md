# Speech Technology — Literature Map

**Status:** Outline. Ready for population by reviewer.

## Core question
How do speech systems fit into SRE's architecture, and what speech
technologies are relevant for low-resource languages?

## Current references
- [28] Duddington (2012) — eSpeak
- [29] Black & Taylor (1997) — Festival
- [30] McAuliffe et al (2017) — Montreal Forced Aligner

## SRE's relationship to speech tech
SRE does not implement speech technology. It orchestrates it:
- Preference order: human recording > TTS (any engine)
- Audio references carry full provenance (speaker, source, license)
- TTS is a fallback, not a goal

## Relevant work for low-resource languages
- Common Voice (Mozilla) — crowd-sourced speech corpus, many languages
- Whisper (OpenAI) — ASR, useful for transcribing field recordings
- Coqui TTS / Piper — neural TTS for low-resource languages
- NCHLT (South Africa) — 11 languages, speech corpora + TTS
- Te Hiku Media — Maaori language models (Rangi, Papa Reo)
- Festival — older but supports many languages via flite

## Papers to find (suggested)
- Radford et al (2023) — Whisper
- Arik et al (2017) — Deep Voice (neural TTS)
- van Niekerk et al (2017) — NCHLT speech corpora
- Common Voice publications
- Besacier et al (2014) — Automatic speech recognition for under-resourced languages

## Research lineage note
> SRE's audio model is not novel — it is a simple fallback chain. The
> novel aspect is the provenance layer: recording-level attribution is
> rare in speech technology and essential for community-controlled
> language work.

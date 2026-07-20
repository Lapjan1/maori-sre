/**
 * River World — Audio Layer
 *
 * Fallback chain:
 *   1. Native recording (audio_ref in surface form pronunciation)
 *   2. Cached TTS audio (not yet implemented)
 *   3. Web Speech API
 *   4. No audio available (silent fail)
 */
const Audio = (() => {
  const AUDIO_BASE = "audio/";

  function speak(text, lang, entityId) {
    // Step 1: Try native recording via surface form
    if (entityId) {
      const sfId = SURFACE_FORM_INDEX[entityId]?.[lang];
      if (sfId) {
        const sf = SURFACE_FORMS[sfId];
        const bestRef = _bestAudioRef(sf);
        if (bestRef) {
          _playNative(bestRef.ref);
          return;
        }
      }
    }

    // Step 2: (Reserved) Cached TTS — not yet implemented

    // Step 3: Web Speech API
    if ("speechSynthesis" in window) {
      _speakWeb(text, lang);
      return;
    }

    // Step 4: No audio available
    console.debug("Audio: no native recording, no Web Speech available.");
  }

  function _bestAudioRef(surfaceForm) {
    if (!surfaceForm?.pronunciation?.audio_refs) return null;
    const refs = surfaceForm.pronunciation.audio_refs;
    // Prefer studio quality, then field, never tts
    const ranked = refs
      .filter((r) => r.quality !== "tts")
      .sort((a, b) => {
        const order = { studio: 0, field: 1 };
        return (order[a.quality] ?? 2) - (order[b.quality] ?? 2);
      });
    return ranked[0] || null;
  }

  function _playNative(relPath) {
    try {
      const audio = new Audio(AUDIO_BASE + relPath);
      audio.play().catch(() => {
        // File not found — fall through to Web Speech will be handled
        // by the caller if they call speak() again; we fail silently.
        console.debug("Audio: native file not found:", relPath);
      });
    } catch (e) {
      console.debug("Audio: failed to play native:", relPath, e);
    }
  }

  function _speakWeb(text, lang) {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = _mapLang(lang);
    utterance.rate = 0.9;
    utterance.pitch = 1.0;
    window.speechSynthesis.speak(utterance);
  }

  function _mapLang(lang) {
    const map = { mi: "mi-NZ", en: "en-US", af: "af-ZA" };
    return map[lang] || lang;
  }

  return { speak };
})();

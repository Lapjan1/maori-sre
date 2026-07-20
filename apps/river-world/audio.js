/**
 * River World — Audio Layer
 *
 * Architecture:
 *   Entity (semantic) → Surface Form → Voice Package → Audio File
 *
 * Fallback chain:
 *   1. Current voice package native recording (audio_ref in surface form)
 *   2. Any other voice package recording for the same surface form
 *   3. Web Speech API (TTS)
 *   4. No audio available (silent fail)
 */
const Audio = (() => {
  let _selectedPackages = {};  // { lang: packageId }

  function init() {
    if (typeof VOICE_PACKAGES !== "undefined" && typeof DEFAULT_VOICE_PACKAGES !== "undefined") {
      _selectedPackages = { ...DEFAULT_VOICE_PACKAGES };
    }
  }

  function setVoicePackage(lang, packageId) {
    _selectedPackages[lang] = packageId;
    try {
      localStorage.setItem("river_world_voice_pkg", JSON.stringify(_selectedPackages));
    } catch (e) { /* ignore */ }
  }

  function getVoicePackage(lang) {
    return _selectedPackages[lang] || DEFAULT_VOICE_PACKAGES?.[lang] || null;
  }

  function getAvailablePackages(lang) {
    if (typeof VOICE_PACKAGES === "undefined") return [];
    return Object.values(VOICE_PACKAGES).filter((p) => p.language === lang);
  }

  function speak(text, lang, entityId) {
    // Step 1: Try native recording from surface form
    if (entityId) {
      const sfId = SURFACE_FORM_INDEX?.[entityId]?.[lang];
      if (sfId) {
        const sf = SURFACE_FORMS[sfId];
        const bestRef = _bestAudioRef(sf, lang);
        if (bestRef) {
          _playNative(bestRef, sf.text || text, lang);
          return;
        }
      }
    }

    // Step 2: (Reserved) Cached TTS

    // Step 3: Web Speech API
    if ("speechSynthesis" in window) {
      _speakWeb(text, lang);
      return;
    }

    // Step 4: No audio available
    console.debug("Audio: no native recording, no Web Speech.");
  }

  function _bestAudioRef(surfaceForm, lang) {
    if (!surfaceForm?.pronunciation?.audio_refs) return null;
    const refs = surfaceForm.pronunciation.audio_refs;
    const currentPkg = getVoicePackage(lang);

    // Rank: current package studio > current package field > other studio > other field
    const ranked = refs
      .filter((r) => r.quality !== "tts")
      .sort((a, b) => {
        const aCurrent = a.package === currentPkg ? 0 : 10;
        const bCurrent = b.package === currentPkg ? 0 : 10;
        const order = { studio: 0, field: 1 };
        const aRank = aCurrent + (order[a.quality] ?? 2);
        const bRank = bCurrent + (order[b.quality] ?? 2);
        return aRank - bRank;
      });
    return ranked[0] || null;
  }

  function _playNative(audioRef, fallbackText, lang) {
    const pkg = VOICE_PACKAGES?.[audioRef.package];
    const basePath = pkg?.base_path || "audio/";
    const fullPath = basePath + audioRef.ref;

    const audio = new Audio(fullPath);
    audio.play().catch(() => {
      console.debug("Audio: file not found:", fullPath);
      if (fallbackText && lang && "speechSynthesis" in window) {
        _speakWeb(fallbackText, lang);
      }
    });
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

  return { init, speak, setVoicePackage, getVoicePackage, getAvailablePackages };
})();

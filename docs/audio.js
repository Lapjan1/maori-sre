/**
 * River World — Audio Layer
 *
 * Architecture:
 *   Entity (semantic) → Surface Form → Voice Package → Audio File
 *
 * Playback strategy:
 *   Web Audio API (fetch + decode + play) for native recordings,
 *   with speechSynthesis TTS as fallback if fetch/decoding fails
 *   or no native recording exists.
 */
const Audio = (() => {
  let _selectedPackages = {};
  let _ctx = null;

  function _getCtx() {
    if (!_ctx) {
      _ctx = new (window.AudioContext || window.webkitAudioContext)();
    }
    return _ctx;
  }

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
    if (entityId) {
      const sfId = SURFACE_FORM_INDEX?.[entityId]?.[lang];
      if (sfId) {
        const sf = SURFACE_FORMS[sfId];
        const bestRef = _bestAudioRef(sf, lang);
        if (bestRef) {
          _playNative(bestRef, text, lang);
          return;
        }
      }
    }
    _tryTTS(text, lang);
  }

  function _bestAudioRef(surfaceForm, lang) {
    if (!surfaceForm?.pronunciation?.audio_refs) return null;
    const refs = surfaceForm.pronunciation.audio_refs;
    const currentPkg = getVoicePackage(lang);

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

    fetch(fullPath)
      .then((r) => {
        if (!r.ok) throw new Error("HTTP " + r.status);
        return r.arrayBuffer();
      })
      .then((buf) => _getCtx().decodeAudioData(buf))
      .then((decoded) => {
        const ctx = _getCtx();
        if (ctx.state === "suspended") ctx.resume();
        const src = ctx.createBufferSource();
        src.buffer = decoded;
        src.connect(ctx.destination);
        src.start(0);
      })
      .catch(() => {
        console.warn("Audio: native failed:", fullPath, "falling back to TTS");
        _tryTTS(fallbackText, lang);
      });
  }

  function _tryTTS(text, lang) {
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = _mapLang(lang);
      utterance.rate = 0.9;
      utterance.pitch = 1.0;
      window.speechSynthesis.speak(utterance);
    }
  }

  function _mapLang(lang) {
    const map = { mi: "mi-NZ", en: "en-US", af: "af-ZA" };
    return map[lang] || lang;
  }

  return { init, speak, setVoicePackage, getVoicePackage, getAvailablePackages };
})();

/**
 * Audio — Web Speech API TTS wrapper.
 * Works offline in most browsers.
 * Currently supports: en (good), mi (varies by OS), af (varies by OS).
 */
const Audio = (() => {
  const langMap = { en: "en-US", mi: "mi-NZ", af: "af-ZA" };

  function speak(text, lang, rate = 0.85) {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = langMap[lang] || lang;
    u.rate = rate;
    // Try to find a voice for this language
    const voices = window.speechSynthesis.getVoices();
    const voice = voices.find((v) => v.lang.startsWith(lang));
    if (voice) u.voice = voice;
    window.speechSynthesis.speak(u);
    return u;
  }

  function stop() {
    if (window.speechSynthesis) window.speechSynthesis.cancel();
  }

  function isSpeaking() {
    return window.speechSynthesis && window.speechSynthesis.speaking;
  }

  return { speak, stop, isSpeaking };
})();

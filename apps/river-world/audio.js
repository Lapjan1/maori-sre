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

  function _isPlayable(audioRef) {
    if (!audioRef || !audioRef.contribution_id) return true;
    if (typeof CONTRIBUTIONS === "undefined") return true;
    return CONTRIBUTIONS.isRefPlayable(audioRef);
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

  function speak(text, lang, entityId, phraseId) {
    // 1. Entity lookup → surface form → play all audio_refs (supports multi-word sequences)
    if (entityId) {
      const sfId = SURFACE_FORM_INDEX?.[entityId]?.[lang];
      if (sfId) {
        const sf = SURFACE_FORMS[sfId];
        const refs = sf?.pronunciation?.audio_refs?.filter((r) => r.quality !== "tts" && _isPlayable(r)) || [];
        if (refs.length) {
          const currentPkg = getVoicePackage(lang);
          const sorted = [...refs].sort((a, b) => {
            const aCur = a.package === currentPkg ? 0 : 10;
            const bCur = b.package === currentPkg ? 0 : 10;
            const order = { studio: 0, field: 1 };
            return (aCur + (order[a.quality] ?? 2)) - (bCur + (order[b.quality] ?? 2));
          });
          if (text && text.includes(" / ") && sorted.length > 1) {
            // Multi-word phrase: play all refs sequentially
            _playSequence(sorted, text, lang, 0);
          } else {
            // Single word: use best ref
            _playNative(sorted[0], text, lang);
          }
          return;
        }
      }
      // 1b. No direct recording — try composed audio from component entities
      if (typeof PhraseComposer !== "undefined" && PhraseComposer.hasComposition(entityId)) {
        var components = PhraseComposer.resolve(entityId, lang);
        if (components.length) {
          var allRefs = [];
          var allTexts = [];
          components.forEach(function(c) {
            var playableRefs = (c.audio_refs || []).filter(_isPlayable);
            if (playableRefs.length) {
              allRefs.push(playableRefs[0]);
              allTexts.push(c.text);
            }
          });
          if (allRefs.length) {
            _playSequence(allRefs, allTexts, lang, 0);
            return;
          }
        }
      }
    }
    // 2. Phrase / sentence-level recordings (any language) — passage first, then sentences
    if (phraseId) {
      var registry = _getPhraseRegistry(lang);
      if (registry) {
        // 2a. Full passage recording (single audio for entire text)
        var passage = registry.filter(function(p) {
          return (p.intent === phraseId || p.id === phraseId) && p.type === "passage" && p.audio_refs && p.audio_refs.length;
        });
        if (passage.length) {
          var bestRef = _bestRefFromList(passage[0].audio_refs, lang);
          if (bestRef) {
            _playNative(bestRef, passage[0].text, lang);
            return;
          }
        }
        // 2b. Sentence-level recordings (play each sentence that has audio, word-compose rest)
        var sentences = registry.filter(function(p) {
          return p.intent === phraseId && p.audio_refs && p.audio_refs.length;
        });
        if (sentences.length) {
          var seqRefs = [];
          var seqTexts = [];
          sentences.forEach(function(s) {
            var ref = _bestRefFromList(s.audio_refs, lang);
            if (ref) {
              seqRefs.push(ref);
              seqTexts.push(s.text);
            }
          });
          if (seqRefs.length) {
            _playSequence(seqRefs, seqTexts, lang, 0);
            return;
          }
        }
      }
    }
    // 2c. Atomic sequence: word-by-word native concatenation (fallback for full passages)
    if (typeof StoryAudioResolver !== "undefined") {
      var resolved = StoryAudioResolver.resolveSentence(text, lang);
      if (resolved.missing.length === 0 && resolved.sequence.length > 0) {
        var allRefs = [];
        var allTexts = [];
        var allHaveAudio = true;
        resolved.sequence.forEach(function(item) {
          if (item.audio_ref) {
            allRefs.push(item.audio_ref);
            allTexts.push(item.text);
          } else {
            allHaveAudio = false;
          }
        });
        if (allHaveAudio && allRefs.length > 0) {
          _playSequence(allRefs, allTexts, lang, 0, 180);
          return;
        }
      }
    }
    // 3. TTS fallback
    _tryTTS(text, lang);
  }

  /**
   * Get the phrase/sentence registry for a given language.
   * Each language can define a global {LANG}_PHRASES array (e.g. AF_PHRASES, MI_PHRASES).
   * When the registry exists, the playback hierarchy checks it for full recordings
   * before falling back to word-by-word composition.
   */
  function _getPhraseRegistry(lang) {
    var varName = lang.toUpperCase() + "_PHRASES";
    return window[varName] || null;
  }

  function _playSequence(refs, fallbackText, lang, idx, gapMs) {
    if (idx >= refs.length) return;
    var gap = gapMs != null ? gapMs : (refs.length > 3 ? 250 : 400);
    var perTokenText = Array.isArray(fallbackText) ? fallbackText[idx] : fallbackText;
    _playNativeWithCallback(refs[idx], perTokenText, lang, function() {
      setTimeout(function() { _playSequence(refs, fallbackText, lang, idx + 1, gap); }, gap);
    });
  }

  function _bestRefFromList(refs, lang) {
    if (!refs?.length) return null;
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
    _playNativeWithCallback(audioRef, fallbackText, lang, null);
  }

  function _playNativeWithCallback(audioRef, fallbackText, lang, onDone) {
    if (!audioRef) {
      _tryTTS(fallbackText, lang);
      if (onDone) onDone();
      return;
    }
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
        src.onended = () => { if (onDone) onDone(); };
        src.start(0);
      })
      .catch(() => {
        console.warn("Audio: native failed:", fullPath, "falling back to TTS");
        _tryTTS(fallbackText, lang);
        if (onDone) onDone();
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

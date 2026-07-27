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
    // Ensure AudioContext is created/resumed synchronously in the user gesture context
    // (Browsers block audio outside user gesture handlers)
    var _spCtx = _getCtx();
    if (_spCtx.state === "suspended") { _spCtx.resume(); }
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
      // Entity-level failed — TTS directly, don't cascade to phrase level
      if (_onWordStart) { _onWordStart(text, 0, 1); }
      _tryTTS(text, lang, function() { if (_onWordStart) { _onWordStart = null; } });
      return;
    }
    // 2. Phrase / sentence-level recordings (any language) — passage first, then sentences
    if (phraseId) {
      var registry = _getPhraseRegistry(lang);
      if (registry) {
        // 2a. Full passage recording (single audio for entire text)
        var passage = registry.filter(function(p) {
          return (p.intent === phraseId || p.id === phraseId || p.source_experience === phraseId) && p.type === "passage" && p.audio_refs && p.audio_refs.length;
        });
        if (passage.length) {
          var bestRef = _bestRefFromList(passage[0].audio_refs, lang);
          if (bestRef) {
            _playNative(bestRef, passage[0].text || text, lang);
            return;
          }
        }
        // 2b. Sentence-level recordings (play each sentence that has audio, word-compose rest)
        var sentences = registry.filter(function(p) {
          return (p.intent === phraseId || p.source_experience === phraseId) && p.audio_refs && p.audio_refs.length;
        });
        if (sentences.length) {
          var seqRefs = [];
          var seqTexts = [];
          sentences.forEach(function(s) {
            var ref = _bestRefFromList(s.audio_refs, lang);
            if (ref) {
              seqRefs.push(ref);
              seqTexts.push(s.text || text);
            }
          });
          if (seqRefs.length) {
            _playSequence(seqRefs, seqTexts, lang, 0);
            return;
          }
        }
      }
    }
    // 2c. Sentence-by-sentence: split text on sentence boundaries, resolve each independently
    // Each sentence first checks the phrase registry for a native recording; if unavailable,
    // falls back to word-by-word composition. This mirrors the UI's sentence structure.
    if (typeof StoryAudioResolver !== "undefined") {
      console.log("Audio: speak() received text length =", text.length, "text =", text.substring(0, 80)+"...", "text.last40 =", text.substring(text.length - 40));
      var sentenceParts = text.match(/[^.!?]*[.!?]+/g);
      if (!sentenceParts || sentenceParts.length === 0) sentenceParts = [text];
      console.log("Audio: sentenceParts count =", sentenceParts ? sentenceParts.length : 0, "parts[0]=", sentenceParts && sentenceParts[0] ? sentenceParts[0].substring(0, 30) : "(none)");
      var allSeqRefs = [];
      var allSeqTexts = [];
      var hasResolved = false;
      sentenceParts.forEach(function(part, pi) {
        console.log("Audio: processing sentence part", pi, "=", part.substring(0, 40));
        var trimmed = part.trim();
        if (!trimmed) return;
        var nativeRef = null;
        if (registry) {
          var nativeSentence = registry.filter(function(p) {
            return (p.intent === phraseId || p.id === phraseId || p.source_experience === phraseId) && p.text === trimmed && p.audio_refs && p.audio_refs.length;
          });
          if (nativeSentence.length) {
            nativeRef = _bestRefFromList(nativeSentence[0].audio_refs, lang);
          }
        }
        if (nativeRef) {
          allSeqRefs.push(nativeRef);
          allSeqTexts.push(trimmed);
          hasResolved = true;
        } else {
          var resolved = StoryAudioResolver.resolveSentence(trimmed, lang);
          if (resolved.sequence && resolved.sequence.length > 0) {
            resolved.sequence.forEach(function(item) {
              allSeqRefs.push(item.audio_ref || null);
              allSeqTexts.push(item.text);
            });
            hasResolved = true;
          }
        }
      });
      console.log("Audio: loop done, allSeqRefs.length =", allSeqRefs.length, "hasResolved =", hasResolved);
      if (hasResolved) {
        _playSequence(allSeqRefs, allSeqTexts, lang, 0, 180);
        return;
      }
    }
    // 3. TTS fallback
    if (_onWordStart) { _onWordStart(text, 0, 1); }
    _tryTTS(text, lang, function() { if (_onWordStart) { _onWordStart = null; } });
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
    if (idx >= refs.length) {
      if (_onWordStart) { _onWordStart = null; }
      console.log("Audio: sequence complete,", refs.length, "words");
      return;
    }
    var gap = gapMs != null ? gapMs : (refs.length > 3 ? 250 : 400);
    var perTokenText = Array.isArray(fallbackText) ? fallbackText[idx] : fallbackText;
    console.log("Audio: playing word", idx + 1 + "/" + refs.length, "=", perTokenText ? perTokenText.substring(0, 20) : "(null)");
    if (_onWordStart) { _onWordStart(perTokenText, idx, refs.length); }
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
    if (_onWordStart) { _onWordStart(fallbackText, 0, 1); }
    _playNativeWithCallback(audioRef, fallbackText, lang, function() {
      if (_onWordStart) { _onWordStart = null; }
    });
  }

  async function _playNativeWithCallback(audioRef, fallbackText, lang, onDone) {
    if (!audioRef) {
      _tryTTS(fallbackText, lang, onDone);
      return;
    }
    const pkg = VOICE_PACKAGES?.[audioRef.package];
    const basePath = pkg?.base_path || "audio/";
    const fullPath = basePath + audioRef.ref;

    try {
      const r = await fetch(fullPath);
      if (!r.ok) throw new Error("HTTP " + r.status);
      const buf = await r.arrayBuffer();
      const decoded = await _getCtx().decodeAudioData(buf);
      const ctx = _getCtx();
      if (ctx.state === "suspended") await ctx.resume();
      const src = ctx.createBufferSource();
      src.buffer = decoded;
      src.connect(ctx.destination);
      await new Promise(function(resolve) {
        src.onended = function() {
          if (onDone) onDone();
          resolve();
        };
        src.start(0);
      });
    } catch (e) {
      console.warn("Audio: native failed:", fullPath, "falling back to TTS");
      _tryTTS(fallbackText, lang, onDone);
    }
  }

  function _tryTTS(text, lang, onDone) {
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = _mapLang(lang);
      utterance.rate = 0.9;
      utterance.pitch = 1.0;
      utterance.onend = function() { if (onDone) onDone(); };
      utterance.onerror = function() { if (onDone) onDone(); };
      window.speechSynthesis.speak(utterance);
    } else {
      if (onDone) onDone();
    }
  }

  function _mapLang(lang) {
    const map = { mi: "mi-NZ", en: "en-US", af: "af-ZA" };
    return map[lang] || lang;
  }

  /**
   * Callback fired when each word in a sequence begins playing.
   * Signature: function(text, wordIndex, totalWords)
   * Set to null to disable. Cleared automatically after sequence ends.
   */
  var _onWordStart = null;

  return { init, speak, setVoicePackage, getVoicePackage, getAvailablePackages, set onWordStart(cb) { _onWordStart = cb; }, get onWordStart() { return _onWordStart; } };
})();

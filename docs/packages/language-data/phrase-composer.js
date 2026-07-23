/**
 * Phrase Audio Composer
 *
 * Constructs audio for a phrase from approved native recordings of its
 * constituent surface forms, when no direct phrase recording exists.
 *
 * Fallback chain:
 *   1. Direct phrase recording (full native audio)
 *   2. Composed audio (approved word-level recordings assembled)
 *   3. TTS fallback
 *
 * Composition is defined declaratively: each missing phrase maps to an
 * ordered sequence of component entity IDs. The composer resolves each
 * entity to its surface form and audio ref for the target language.
 *
 * Provenance is preserved: the composed output retains references to
 * every component recording.
 *
 * Vocabulary gap analysis extracts component words from missing phrases,
 * matches against existing atomic recordings, and prioritizes by reuse.
 */
var PhraseComposer = (() => {
  var COMPOSITIONS = {
    PHRASE_WATER_PLEASE: ["THING_WAI", "STATE_010"],
    PHRASE_THANK_FOOD: ["THING_KAI"],
    PHRASE_GOODBYE_LEAVE: ["ACTION_016"],
    PHRASE_NOHO_MAI: ["ACTION_016"],
    PHRASE_WELCOME: ["ACTION_HAERE"],
    PHRASE_GOODBYE_STAY: ["ACTION_HAERE"],
    PHRASE_BEAUTIFUL_HOUSE: ["THING_WHARE", "STATE_ATAHUA"],
    PHRASE_HUNGRY: ["STATE_HIAKAI"],
    PHRASE_WILL_RETURN: ["ACTION_HOKI"],
  };

  function hasComposition(entityId) {
    return !!COMPOSITIONS[entityId];
  }

  function getComponents(entityId) {
    return COMPOSITIONS[entityId] || [];
  }

  function resolve(entityId, lang) {
    var components = COMPOSITIONS[entityId];
    if (!components) return [];
    if (typeof SURFACE_FORMS === "undefined" || typeof SURFACE_FORM_INDEX === "undefined") return [];
    var result = [];
    components.forEach(function(compEntityId) {
      var idx = SURFACE_FORM_INDEX[compEntityId];
      if (!idx) return;
      var sfId = idx[lang];
      if (!sfId) return;
      var sf = SURFACE_FORMS[sfId];
      if (!sf) return;
      var refs = sf.pronunciation && sf.pronunciation.audio_refs ? sf.pronunciation.audio_refs : [];
      var nonTts = refs.filter(function(r) { return r.quality !== "tts"; });
      if (nonTts.length === 0) return;
      result.push({
        entity_id: compEntityId,
        text: sf.text,
        audio_refs: nonTts,
      });
    });
    return result;
  }

  function list() {
    return Object.keys(COMPOSITIONS);
  }

  /**
   * Get atomic vocabulary: single-word surface forms with non-TTS audio.
   * Returns a map: lowercase text → { entity_id, text, lang }
   */
  function _atomicVocabulary(lang) {
    var vocab = {};
    if (typeof SURFACE_FORMS === "undefined") return vocab;
    Object.values(SURFACE_FORMS).forEach(function(sf) {
      if (sf.lang !== lang) return;
      var text = (sf.text || "").trim();
      // Only single words (no spaces), no multi-word compounds
      if (text.indexOf(" ") !== -1) return;
      var refs = sf.pronunciation && sf.pronunciation.audio_refs ? sf.pronunciation.audio_refs : [];
      var hasAudio = refs.some(function(r) { return r.quality !== "tts"; });
      if (!hasAudio) return;
      vocab[text.toLowerCase()] = {
        entity_id: sf.entity_id,
        text: text,
        lang: lang,
      };
    });
    return vocab;
  }

  /**
   * Extract individual words from a phrase text, lowercased, punctuation stripped.
   */
  function _words(phraseText) {
    return (phraseText || "")
      .toLowerCase()
      .replace(/[^a-zāēīōūäëöü\s-]/g, "")
      .split(/\s+/)
      .filter(Boolean);
  }

  /**
   * Vocabulary gap analysis for a language.
   *
   * For each surface form in the given language that has NO non-TTS audio:
   *   1. Extract individual words
   *   2. Match each word against atomic vocabulary
   *   3. For unmatched words, count how many phrases they appear in
   *
   * Returns:
   *   { gap, byWord, stats }
   *     gap[] — each missing phrase with word-level breakdown
   *     byWord[] — prioritized recording candidates
   *     stats  — coverage summary
   */
  function vocabularyGap(lang) {
    if (typeof SURFACE_FORMS === "undefined") {
      return { gap: [], byWord: [], stats: { total: 0, direct: 0, composable: 0, ttsOnly: 0 } };
    }

    var atomic = _atomicVocabulary(lang);

    // Collect surface forms that lack audio (the gap)
    var missingSfs = [];
    Object.values(SURFACE_FORMS).forEach(function(sf) {
      if (sf.lang !== lang) return;
      var refs = sf.pronunciation && sf.pronunciation.audio_refs ? sf.pronunciation.audio_refs : [];
      var hasAudio = refs.some(function(r) { return r.quality !== "tts"; });
      if (!hasAudio) {
        missingSfs.push(sf);
      }
    });

    // Word frequency across all missing phrases
    var wordFreq = {};
    var gapAnalysis = [];

    missingSfs.forEach(function(sf) {
      var phraseWords = _words(sf.text);
      var wordBreakdown = [];
      var seenWords = {};

      phraseWords.forEach(function(w) {
        if (seenWords[w]) return;
        seenWords[w] = true;

        var match = atomic[w];
        wordBreakdown.push({
          word: w,
          matched: !!match,
          entity_id: match ? match.entity_id : null,
          entity_text: match ? match.text : null,
        });

        if (!match) {
          wordFreq[w] = (wordFreq[w] || 0) + 1;
        }
      });

      gapAnalysis.push({
        entity_id: sf.entity_id,
        text: sf.text,
        surface_form_id: sf.id,
        words: wordBreakdown,
        composableWords: wordBreakdown.filter(function(w) { return w.matched; }).length,
        totalWords: wordBreakdown.length,
      });
    });

    // Build prioritized word list
    var byWord = Object.keys(wordFreq)
      .map(function(w) {
        return {
          word: w,
          count: wordFreq[w],
          hasAudio: false,
          entity_id: null,
        };
      })
      .sort(function(a, b) { return b.count - a.count; });

    // Stats
    var total = missingSfs.length + (Object.values(SURFACE_FORMS).filter(function(sf) {
      if (sf.lang !== lang) return false;
      var refs = sf.pronunciation && sf.pronunciation.audio_refs ? sf.pronunciation.audio_refs : [];
      return refs.some(function(r) { return r.quality !== "tts"; });
    }).length);

    // Count how many missing phrases can be at least partially composed
    var composable = gapAnalysis.filter(function(g) { return g.composableWords > 0; }).length;
    var direct = total - missingSfs.length;
    var ttsOnly = gapAnalysis.filter(function(g) { return g.composableWords === 0; }).length;

    return {
      gap: gapAnalysis,
      byWord: byWord,
      stats: {
        total: total,
        direct: direct,
        missing: missingSfs.length,
        composable: composable,
        ttsOnly: ttsOnly,
      },
    };
  }

  /**
   * Composition coverage: how many surface forms fall into each tier.
   */
  function compositionCoverage(lang) {
    if (typeof SURFACE_FORMS === "undefined") {
      return { direct: 0, composed: 0, partial: 0, tts: 0, total: 0 };
    }
    var direct = 0;
    var composed = 0;
    var partial = 0;
    var tts = 0;
    var total = 0;

    Object.values(SURFACE_FORMS).forEach(function(sf) {
      if (sf.lang !== lang) return;
      total++;
      var refs = sf.pronunciation && sf.pronunciation.audio_refs ? sf.pronunciation.audio_refs : [];
      var hasAudio = refs.some(function(r) { return r.quality !== "tts"; });
      if (hasAudio) {
        direct++;
      } else if (hasComposition(sf.entity_id)) {
        var comps = getComponents(sf.entity_id);
        var resolved = resolve(sf.entity_id, lang);
        if (resolved.length === comps.length && comps.length > 0) {
          composed++;
        } else if (resolved.length > 0) {
          partial++;
        } else {
          tts++;
        }
      } else {
        tts++;
      }
    });

    return { direct: direct, composed: composed, partial: partial, tts: tts, total: total };
  }

  return {
    hasComposition: hasComposition,
    getComponents: getComponents,
    resolve: resolve,
    list: list,
    vocabularyGap: vocabularyGap,
    compositionCoverage: compositionCoverage,
  };
})();

if (typeof module !== "undefined" && module.exports) {
  module.exports = { PhraseComposer };
}

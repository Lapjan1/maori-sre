/**
 * Story Audio Resolver
 *
 * Resolves a story sentence to an ordered sequence of native audio units.
 *
 * Complements the existing fallback chain:
 *   DIRECT_NATIVE → COMPOSED_PHRASE → ATOMIC_SEQUENCE → TTS
 *
 * Architecture:
 *   Sentence → tokens → entity lookup → surface form → audio_refs
 *
 * Uses SURFACE_FORM_INDEX to map each token to its entity,
 * with audio_index.js as a fallback for dictionary words without entities.
 */
var StoryAudioResolver = (() => {
  var MACRONS = {"\u0101":"a","\u0113":"e","\u012b":"i","\u014d":"o","\u016b":"u"};
  var _cached = {};

  function _normalize(text) {
    var result = text.toLowerCase().trim();
    result = result.replace(/[^a-z\u0101\u0113\u012b\u014d\u016b\s-]/g, '');
    var out = "";
    for (var i = 0; i < result.length; i++) {
      out += MACRONS[result[i]] || result[i];
    }
    return out;
  }

  function _isPlayable(audioRef) {
    if (!audioRef || !audioRef.contribution_id) return true;
    if (typeof CONTRIBUTIONS === "undefined") return true;
    return CONTRIBUTIONS.isRefPlayable(audioRef);
  }

  function _ensureIndex(lang) {
    if (_cached[lang]) return _cached[lang];
    var idx = {};
    if (typeof SURFACE_FORM_INDEX === "undefined") return idx;
    Object.keys(SURFACE_FORM_INDEX).forEach(function(entityId) {
      var sfId = SURFACE_FORM_INDEX[entityId][lang];
      if (!sfId) return;
      var sf = SURFACE_FORMS[sfId];
      if (!sf || !sf.text) return;
      var norm = _normalize(sf.text);
      idx[norm] = entityId;
    });
    _cached[lang] = idx;
    return idx;
  }

  /**
   * Tokenize a sentence into normalized word tokens.
   * Strips punctuation, lowercases, resolves macrons.
   */
  function tokenize(sentence) {
    var norm = _normalize(sentence);
    return norm.split(/\s+/).filter(Boolean);
  }

  /**
   * Resolve a sentence to an ordered list of audio units.
   *
   * Returns:
   *   {
   *     sequence: [{ entity_id, text, audio_ref }],
   *     missing: [ word, ... ]
   *   }
   *
   * Each entity may represent one or more tokens (multi-word entities like
   * "noho tahi" are resolved as a single unit via lookahead matching).
   * Tokens without entity or audio_index matches land in `missing[]`.
   */
  function resolveSentence(sentence, lang) {
    var tokens = tokenize(sentence);
    var idx = _ensureIndex(lang);
    var sequence = [];
    var missing = [];
    var i = 0;

    while (i < tokens.length) {
      var matched = false;
      // Multi-word lookahead (max 3 tokens)
      for (var lookahead = 3; lookahead >= 1; lookahead--) {
        if (i + lookahead > tokens.length) continue;
        var phrase = tokens.slice(i, i + lookahead).join(" ");
        var entityId = idx[phrase];
        if (entityId) {
          var sfId = SURFACE_FORM_INDEX[entityId][lang];
          var sf = SURFACE_FORMS[sfId];
          var refs = sf && sf.pronunciation && sf.pronunciation.audio_refs
            ? sf.pronunciation.audio_refs.filter(function(r) {
                return r.quality !== "tts" && _isPlayable(r);
              })
            : [];
          // Skip multi-word entity match if entity has no audio_refs
          // so individual words can be resolved via audio_index lookup
          if (lookahead > 1 && refs.length === 0) continue;
          sequence.push({
            entity_id: entityId,
            text: sf ? sf.text : phrase,
            audio_ref: refs.length > 0 ? refs[0] : null,
          });
          i += lookahead;
          matched = true;
          break;
        }
      }
      if (matched) continue;

      // No entity match — try audio_index dictionary lookup
      var audioInfo = typeof lookupAudio !== "undefined" ? lookupAudio(tokens[i]) : null;
      if (audioInfo) {
        sequence.push({
          entity_id: null,
          text: tokens[i],
          audio_ref: {
            ref: audioInfo.filename,
            package: "mi_teaka_v1",
            quality: "field",
          },
        });
      } else {
        sequence.push({
          entity_id: null,
          text: tokens[i],
          audio_ref: null,
        });
        missing.push(tokens[i]);
      }
      i++;
    }

    return { sequence: sequence, missing: missing };
  }

  /**
   * Can every token in the sentence be resolved to native audio?
   */
  function isFullyResolvable(sentence, lang) {
    var r = resolveSentence(sentence, lang);
    return r.missing.length === 0 &&
      r.sequence.length > 0 &&
      r.sequence.every(function(e) { return e.audio_ref !== null; });
  }

  /**
   * Resolution tier for this sentence.
   * Returns "atomic_sequence" if every token resolves, "tts" otherwise.
   */
  function tier(sentence, lang) {
    var r = resolveSentence(sentence, lang);
    if (r.sequence.length === 0) return "tts";
    if (r.missing.length > 0) return "tts";
    if (!r.sequence.every(function(e) { return e.audio_ref !== null; })) return "tts";
    return "atomic_sequence";
  }

  return {
    resolveSentence: resolveSentence,
    tokenize: tokenize,
    isFullyResolvable: isFullyResolvable,
    tier: tier,
  };
})();

if (typeof module !== "undefined" && module.exports) {
  module.exports = { StoryAudioResolver };
}

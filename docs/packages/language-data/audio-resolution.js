/**
 * Audio Resolution Query Layer
 *
 * Answers: "How can this phrase currently be played?"
 *
 * Tiers:
 *   direct   — full native recording available (playable audio_ref)
 *   composed — all constituent components resolve to playable audio
 *   partial  — some constituent components resolve, rest would need TTS
 *   tts      — no playable native audio in any form
 *
 * This is a query-only layer. It does not track what "should" exist
 * (that is RequirementMatrix). It answers what the system can actually
 * play right now, respecting the contribution governance gate.
 *
 * Orthogonal to RequirementMatrix:
 *   RequirementMatrix = what should exist?  (voice × language × entity)
 *   AudioResolution   = what can play now?  (per entity + aggregate coverage)
 *   ContributionGate  = which assets are approved? (runtime check)
 */
var AudioResolution = (function() {
  function _isPlayable(audioRef) {
    if (!audioRef || !audioRef.contribution_id) return true;
    if (typeof CONTRIBUTIONS === "undefined") return true;
    return CONTRIBUTIONS.isRefPlayable(audioRef);
  }

  function _getSurfaceForm(entityId, lang) {
    if (typeof SURFACE_FORM_INDEX === "undefined" || typeof SURFACE_FORMS === "undefined") return null;
    var idx = SURFACE_FORM_INDEX[entityId];
    if (!idx) return null;
    var sfId = idx[lang];
    if (!sfId) return null;
    return SURFACE_FORMS[sfId] || null;
  }

  function _hasPlayableDirect(entityId, lang) {
    var sf = _getSurfaceForm(entityId, lang);
    if (!sf) return false;
    var refs = sf.pronunciation && sf.pronunciation.audio_refs ? sf.pronunciation.audio_refs : [];
    return refs.some(function(r) { return r.quality !== "tts" && _isPlayable(r); });
  }

  /**
   * Resolve the audio status for a single entity in a language.
   * @returns {"direct"|"composed"|"partial"|"tts"}
   */
  function status(entityId, lang) {
    if (_hasPlayableDirect(entityId, lang)) return "direct";

    if (typeof PhraseComposer !== "undefined" && PhraseComposer.hasComposition(entityId)) {
      var comps = PhraseComposer.getComponents(entityId);
      var resolved = PhraseComposer.resolve(entityId, lang);
      if (resolved.length === comps.length && comps.length > 0) return "composed";
      if (resolved.length > 0) return "partial";
    }

    return "tts";
  }

  /**
   * Check if an entity can produce any native audio (direct or composed).
   */
  function playable(entityId, lang) {
    return status(entityId, lang) !== "tts";
  }

  /**
   * Aggregate coverage for a language across all surface forms.
   * @returns {{ direct: number, composed: number, partial: number, tts: number, total: number }}
   */
  function coverage(lang) {
    if (typeof SURFACE_FORMS === "undefined") {
      return { direct: 0, composed: 0, partial: 0, tts: 0, total: 0 };
    }
    var counts = { direct: 0, composed: 0, partial: 0, tts: 0, total: 0 };

    Object.values(SURFACE_FORMS).forEach(function(sf) {
      if (sf.lang !== lang) return;
      counts.total++;
      var s = status(sf.entity_id, lang);
      counts[s]++;
    });

    return counts;
  }

  /**
   * Gain analysis: for each missing atomic word, compute how acquiring it
   * would move compositions through the resolution tiers.
   *
   * Metrics per word:
   *   usedIn          — total compositions that reference this entity
   *   createsPartial  — TTS→partial: compositions currently at TTS that
   *                     would become partial (at least one component resolves)
   *   becomesComplete — partial/tts→composed: compositions where this word
   *                     is the only remaining missing component
   *
   * Priority order: becomesComplete > createsPartial > usedIn
   *
   * @param {string} lang
   * @returns {Array<{entity_id:string, word:string, usedIn:number, createsPartial:number, becomesComplete:number}>}
   */
  function gainAnalysis(lang) {
    if (typeof PhraseComposer === "undefined" || typeof SURFACE_FORMS === "undefined") {
      return [];
    }

    var allCompositions = PhraseComposer.list();
    var index = {};

    allCompositions.forEach(function(phraseId) {
      var comps = PhraseComposer.getComponents(phraseId);
      var phraseStatus = status(phraseId, lang);
      if (phraseStatus === "composed" || phraseStatus === "direct") return;

      comps.forEach(function(compEntityId) {
        var compStatus = status(compEntityId, lang);
        if (compStatus !== "tts") return;

        if (!index[compEntityId]) {
          var sf = _getSurfaceForm(compEntityId, lang);
          index[compEntityId] = {
            entity_id: compEntityId,
            word: sf ? sf.text : compEntityId,
            usedIn: 0,
            createsPartial: 0,
            becomesComplete: 0,
          };
        }

        index[compEntityId].usedIn++;

        var otherMissing = comps.filter(function(e) {
          return e !== compEntityId && status(e, lang) === "tts";
        });

        if (phraseStatus === "partial") {
          if (otherMissing.length === 0) {
            index[compEntityId].becomesComplete++;
          }
        } else {
          // TTS → if we resolve this, at least we create a partial
          index[compEntityId].createsPartial++;
          if (otherMissing.length === 0) {
            // Only component — moves directly to composed
            index[compEntityId].becomesComplete++;
          }
        }
      });
    });

    var arr = Object.keys(index).map(function(k) { return index[k]; });
    arr.sort(function(a, b) {
      return b.becomesComplete - a.becomesComplete
          || b.createsPartial - a.createsPartial
          || b.usedIn - a.usedIn;
    });
    return arr;
  }

  return {
    status: status,
    playable: playable,
    coverage: coverage,
    gainAnalysis: gainAnalysis,
  };
})();

if (typeof module !== "undefined" && module.exports) {
  module.exports = { AudioResolution };
}

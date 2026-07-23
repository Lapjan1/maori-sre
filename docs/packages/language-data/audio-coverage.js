/**
 * Audio Coverage Engine
 *
 * Thin query layer over RequirementMatrix. Provides the same public API
 * as before (coverage, recordingQueue, legacyQueue, summary) but derives
 * all state from the canonical requirement matrix.
 *
 * Three coverage states per voice profile (defined in RequirementMatrix):
 *   explicit — has audio_ref tagged with this voice_type
 *   legacy   — has audio_refs but none tagged for this voice
 *   missing  — no audio_refs at all
 */
var AudioCoverage = (() => {
  /**
   * Calculate coverage for a language.
   * Returns explicit, legacy, and missing counts per voice profile.
   */
  function coverage(lang, source) {
    if (typeof RequirementMatrix === "undefined") {
      return { lang, langLabel: lang, total: 0, uniqueEntities: 0, withAudio: 0, noAudio: 0, uniqueWithAudio: 0, pct: 0, byVoice: {} };
    }
    var matrixRows = RequirementMatrix.generate({ lang: lang, source: source });
    var byEntity = {};
    matrixRows.forEach(function(r) {
      if (!byEntity[r.entity_id]) {
        byEntity[r.entity_id] = {
          entity_id: r.entity_id,
          text: r.text,
          lang: r.lang,
          anyAudio: false,
        };
      }
      if (r.coverage_status === "explicit" || r.coverage_status === "legacy") {
        byEntity[r.entity_id].anyAudio = true;
      }
    });
    var entities = Object.values(byEntity);
    var total = entities.length;
    var withAudio = entities.filter(function(e) { return e.anyAudio; });
    var uniqueTotal = entities.length;
    var uniqueWithAudio = withAudio.length;

    // Per-voice breakdown from matrix
    var byVoice = {};
    RequirementMatrix.VOICE_TYPES.forEach(function(vt) {
      var vRows = matrixRows.filter(function(r) { return r.voice_type === vt; });
      var expl = vRows.filter(function(r) { return r.coverage_status === "explicit"; }).length;
      var leg = vRows.filter(function(r) { return r.coverage_status === "legacy"; }).length;
      var miss = vRows.filter(function(r) { return r.coverage_status === "missing"; }).length;
      byVoice[vt] = {
        label: RequirementMatrix.VOICE_LABELS[vt],
        total: vRows.length,
        recorded: expl + leg,
        explicit: expl,
        legacy: leg,
        missing: miss,
        pct: vRows.length ? Math.round(((expl + leg) / vRows.length) * 100) : 0,
        explicitPct: vRows.length ? Math.round((expl / vRows.length) * 100) : 0,
      };
    });

    return {
      lang: lang,
      langLabel: RequirementMatrix.LANG_LABELS[lang] || lang,
      total: total,
      uniqueEntities: uniqueTotal,
      withAudio: withAudio.length,
      noAudio: total - withAudio.length,
      uniqueWithAudio: uniqueWithAudio,
      pct: total ? Math.round((withAudio.length / total) * 100) : 0,
      byVoice: byVoice,
    };
  }

  /**
   * Generate recording queue for a language and voice type.
   * Returns entries with NO audio at all (genuinely missing).
   */
  function recordingQueue(lang, voiceType, source) {
    if (typeof RequirementMatrix === "undefined") return [];
    return RequirementMatrix.missing({ lang: lang, voiceType: voiceType, source: source }).map(function(r) {
      return { entityId: r.entity_id, text: r.text, surfaceFormId: r.surface_form_id, lang: r.lang };
    });
  }

  /**
   * Legacy-only queue: entries that have audio but not tagged for the specified voice_type.
   */
  function legacyQueue(lang, voiceType, source) {
    if (typeof RequirementMatrix === "undefined") return [];
    return RequirementMatrix.legacy({ lang: lang, voiceType: voiceType, source: source }).map(function(r) {
      return { entityId: r.entity_id, text: r.text, surfaceFormId: r.surface_form_id, lang: r.lang };
    });
  }

  function summary(source) {
    if (typeof RequirementMatrix === "undefined") {
      return { langs: {}, totalForms: 0, totalRecorded: 0, overallPct: 0 };
    }
    var s = RequirementMatrix.summary({ source: source });
    var langs = {};
    Object.keys(s.byLang).forEach(function(l) {
      langs[l] = coverage(l, source);
    });
    var totalForms = Object.values(langs).reduce(function(acc, d) { return acc + d.total; }, 0);
    var totalRecorded = Object.values(langs).reduce(function(acc, d) { return acc + d.withAudio; }, 0);
    return {
      langs: langs,
      totalForms: totalForms,
      totalRecorded: totalRecorded,
      overallPct: totalForms ? Math.round((totalRecorded / totalForms) * 100) : 0,
    };
  }

  return {
    coverage: coverage,
    recordingQueue: recordingQueue,
    legacyQueue: legacyQueue,
    summary: summary,
    VOICE_TYPES: RequirementMatrix ? RequirementMatrix.VOICE_TYPES : ["male_adult", "female_adult", "male_child", "female_child"],
    VOICE_LABELS: RequirementMatrix ? RequirementMatrix.VOICE_LABELS : {},
  };
})();

if (typeof module !== "undefined" && module.exports) {
  module.exports = { AudioCoverage };
}

/**
 * Audio Coverage Engine
 *
 * Calculates required vs existing audio assets across all languages
 * and voice profiles. Generates the recording queue automatically.
 *
 * Voice profiles per language:
 *   male_adult, female_adult, male_child, female_child
 *
 * Coverage = required surface forms − approved audio recordings
 * The queue shrinks as recordings are approved.
 */
var AudioCoverage = (() => {
  const VOICE_TYPES = ["male_adult", "female_adult", "male_child", "female_child"];
  const VOICE_LABELS = {
    male_adult: "Male adult",
    female_adult: "Female adult",
    male_child: "Male child",
    female_child: "Female child",
  };
  const LANG_LABELS = { mi: "Māori", en: "English", af: "Afrikaans" };

  /**
   * Get all surface forms for a language, optionally filtered by entity IDs.
   */
  function _formsForLang(lang, entityFilter) {
    if (typeof SURFACE_FORMS === "undefined") return [];
    let list = Object.values(SURFACE_FORMS).filter((sf) => sf.lang === lang);
    if (entityFilter && entityFilter.size) {
      list = list.filter((sf) => entityFilter.has(sf.entity_id));
    }
    return list;
  }

  /**
   * Get entity IDs used by a specific curriculum source.
   */
  function _entityIdsForSource(source) {
    const ids = new Set();
    let exps = [];
    if (source === "river_world" && typeof EXPERIENCES !== "undefined") exps = EXPERIENCES;
    else if (source === "wife_core_20" && typeof CORE_20 !== "undefined") exps = CORE_20;
    else if (source === "all") {
      if (typeof EXPERIENCES !== "undefined") exps = exps.concat(EXPERIENCES);
      if (typeof CORE_20 !== "undefined") exps = exps.concat(CORE_20);
    }
    exps.forEach((e) => {
      (e.entities || []).forEach((en) => ids.add(en.entity_id || en.id));
    });
    return ids;
  }

  /**
   * Calculate coverage for a language:
   *   total forms, forms with audio, forms per voice type, missing list.
   */
  function coverage(lang, source) {
    const entityFilter = source ? _entityIdsForSource(source) : null;
    const forms = _formsForLang(lang, entityFilter);
    const total = forms.length;
    const withAudio = forms.filter((sf) => {
      const refs = sf?.pronunciation?.audio_refs || [];
      return refs.some((r) => r.quality !== "tts");
    });
    const byVoice = {};
    const missing = {};
    VOICE_TYPES.forEach((vt) => {
      byVoice[vt] = forms.filter((sf) => {
        const refs = sf?.pronunciation?.audio_refs || [];
        return refs.some((r) => r.quality !== "tts" && (!r.voice_type || r.voice_type === vt));
      });
      missing[vt] = forms.filter((sf) => {
        const refs = sf?.pronunciation?.audio_refs || [];
        return !refs.some((r) => r.quality !== "tts" && (!r.voice_type || r.voice_type === vt));
      });
    });
    const uniqueWithAudio = new Set(withAudio.map((sf) => sf.entity_id)).size;
    const uniqueTotal = new Set(forms.map((sf) => sf.entity_id)).size;

    return {
      lang,
      langLabel: LANG_LABELS[lang] || lang,
      total,
      uniqueEntities: uniqueTotal,
      withAudio: withAudio.length,
      uniqueWithAudio,
      pct: total ? Math.round((withAudio.length / total) * 100) : 0,
      byVoice: Object.fromEntries(
        VOICE_TYPES.map((vt) => [
          vt,
          {
            label: VOICE_LABELS[vt],
            total,
            recorded: byVoice[vt].length,
            pct: total ? Math.round((byVoice[vt].length / total) * 100) : 0,
          },
        ])
      ),
    };
  }

  /**
   * Generate full recording queue for a language and voice type.
   * Returns array of { entityId, text, source } sorted by need.
   */
  function recordingQueue(lang, voiceType, source) {
    const entityFilter = source ? _entityIdsForSource(source) : null;
    const forms = _formsForLang(lang, entityFilter);
    const needed = forms.filter((sf) => {
      const refs = sf?.pronunciation?.audio_refs || [];
      return !refs.some((r) => r.quality !== "tts" && (!r.voice_type || r.voice_type === voiceType));
    });
    const seen = new Set();
    const result = [];
    needed.forEach((sf) => {
      const key = sf.entity_id + ":" + sf.text;
      if (seen.has(key)) return;
      seen.add(key);
      result.push({
        entityId: sf.entity_id,
        text: sf.text,
        surfaceFormId: sf.id,
        lang,
      });
    });
    return result;
  }

  /**
   * Generate summary across all languages.
   */
  function summary(source) {
    const langs = Object.keys(LANG_LABELS);
    const data = {};
    langs.forEach((lang) => {
      data[lang] = coverage(lang, source);
    });
    const totalForms = Object.values(data).reduce((s, d) => s + d.total, 0);
    const totalRecorded = Object.values(data).reduce((s, d) => s + d.withAudio, 0);
    return {
      langs: data,
      totalForms,
      totalRecorded,
      overallPct: totalForms ? Math.round((totalRecorded / totalForms) * 100) : 0,
    };
  }

  return { coverage, recordingQueue, summary, VOICE_TYPES, VOICE_LABELS };
})();

if (typeof module !== "undefined" && module.exports) {
  module.exports = { AudioCoverage };
}

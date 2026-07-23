/**
 * Requirement Matrix
 *
 * Canonical inventory of all required (language × surface_form × voice_type)
 * tuples. Derives coverage status from existing audio_refs:
 *
 *   explicit — audio_ref with matching voice_type exists
 *   legacy   — audio_ref exists but none tagged for this voice
 *   missing  — no audio_refs at all
 *
 * Verification status (native_verified) is a separate quality dimension,
 * tracked per (lang, entity_id).
 *
 * The matrix is the single derived truth for coverage, recording queues,
 * and the dashboard.
 */
var RequirementMatrix = (() => {
  const VOICE_TYPES = ["male_adult", "female_adult", "male_child", "female_child"];
  const VOICE_LABELS = {
    male_adult: "Male adult",
    female_adult: "Female adult",
    male_child: "Male child",
    female_child: "Female child",
  };
  const LANG_LABELS = { mi: "Māori", en: "English", af: "Afrikaans" };

  // Per-language native verification store (ephemeral; seed from data files in future)
  const _verification = {};

  function _entitySources() {
    const map = {};
    function add(list, source) {
      (list || []).forEach(function(exp) {
        (exp.entities || []).forEach(function(en) {
          var id = en.entity_id || en.id;
          if (!map[id]) map[id] = [];
          if (map[id].indexOf(source) === -1) map[id].push(source);
        });
      });
    }
    if (typeof EXPERIENCES !== "undefined") add(EXPERIENCES, "river_world");
    if (typeof CORE_20 !== "undefined") add(CORE_20, "wife_core_20");
    return map;
  }

  function _surfaceFormText(sf) {
    return sf.text || sf.default || "";
  }

  function _audioRefs(sf) {
    return sf && sf.pronunciation && sf.pronunciation.audio_refs
      ? sf.pronunciation.audio_refs
      : [];
  }

  /**
   * Generate requirement matrix entries.
   *
   * @param {Object} [options]
   * @param {string} [options.lang]       — filter by language code
   * @param {string} [options.voiceType]  — filter by voice type
   * @param {string} [options.source]     — filter by curriculum source
   * @param {string} [options.coverageStatus] — filter by "explicit"|"legacy"|"missing"
   * @returns {Array<Object>}
   */
  function generate(options) {
    options = options || {};
    if (typeof SURFACE_FORMS === "undefined") return [];

    var entitySources = _entitySources();

    // Collect and filter surface forms
    var forms = Object.values(SURFACE_FORMS);
    if (options.lang) forms = forms.filter(function(sf) { return sf.lang === options.lang; });
    if (options.source) {
      forms = forms.filter(function(sf) {
        var srcs = entitySources[sf.entity_id] || [];
        return srcs.indexOf(options.source) !== -1;
      });
    }

    var voices = options.voiceType ? [options.voiceType] : VOICE_TYPES;

    var result = [];
    forms.forEach(function(sf) {
      var refs = _audioRefs(sf);
      var nonTts = refs.filter(function(r) { return r.quality !== "tts"; });
      var text = _surfaceFormText(sf);
      var verified = _verification[sf.lang + ":" + sf.entity_id] || false;

      voices.forEach(function(vt) {
        var isExplicit = nonTts.some(function(r) { return r.voice_type === vt; });
        var status = isExplicit ? "explicit" : (nonTts.length > 0 ? "legacy" : "missing");

        if (options.coverageStatus && status !== options.coverageStatus) return;

        result.push({
          entity_id: sf.entity_id,
          lang: sf.lang,
          text: text,
          voice_type: vt,
          surface_form_id: sf.id,
          sources: entitySources[sf.entity_id] || [],
          coverage_status: status,
          audio_refs: nonTts.map(function(r) {
            return { ref: r.ref, quality: r.quality, voice_type: r.voice_type || null };
          }),
          native_verified: verified,
        });
      });
    });

    return result;
  }

  /**
   * Mark a (lang, entity_id) pair as natively verified.
   */
  function verify(lang, entityId) {
    _verification[lang + ":" + entityId] = true;
  }

  /**
   * Remove native verification for a (lang, entity_id) pair.
   */
  function unverify(lang, entityId) {
    delete _verification[lang + ":" + entityId];
  }

  /**
   * Check if a (lang, entity_id) pair is natively verified.
   */
  function isVerified(lang, entityId) {
    return _verification[lang + ":" + entityId] || false;
  }

  /**
   * Get all missing entries (shorthand). Returns entries with coverage_status === "missing".
   */
  function missing(options) {
    var opts = Object.assign({}, options, { coverageStatus: "missing" });
    return generate(opts);
  }

  /**
   * Get all legacy entries (shorthand).
   */
  function legacy(options) {
    var opts = Object.assign({}, options, { coverageStatus: "legacy" });
    return generate(opts);
  }

  /**
   * Get all explicit entries (shorthand).
   */
  function explicit(options) {
    var opts = Object.assign({}, options, { coverageStatus: "explicit" });
    return generate(opts);
  }

  /**
   * Aggregated counts grouped by language and status.
   */
  function summary(options) {
    var rows = generate(options);
    var byLang = {};
    rows.forEach(function(r) {
      if (!byLang[r.lang]) {
        byLang[r.lang] = {
          lang: r.lang,
          langLabel: LANG_LABELS[r.lang] || r.lang,
          total: 0, explicit: 0, legacy: 0, missing: 0,
        };
      }
      byLang[r.lang].total++;
      byLang[r.lang][r.coverage_status]++;
    });
    var langs = Object.keys(byLang);
    var totalForms = langs.reduce(function(s, l) { return s + byLang[l].total; }, 0);
    var totalExplicit = langs.reduce(function(s, l) { return s + byLang[l].explicit; }, 0);
    return {
      byLang: byLang,
      totalForms: totalForms,
      totalExplicit: totalExplicit,
      overallPct: totalForms ? Math.round((totalExplicit / totalForms) * 100) : 0,
    };
  }

  /**
   * Per-voice summary: for each voice_type, how many explicit/legacy/missing per language.
   */
  function voiceSummary(options) {
    var rows = generate(options);
    var out = {};
    rows.forEach(function(r) {
      if (!out[r.voice_type]) out[r.voice_type] = {};
      if (!out[r.voice_type][r.lang]) {
        out[r.voice_type][r.lang] = { total: 0, explicit: 0, legacy: 0, missing: 0 };
      }
      out[r.voice_type][r.lang].total++;
      out[r.voice_type][r.lang][r.coverage_status]++;
    });
    return out;
  }

  return {
    generate: generate,
    verify: verify,
    unverify: unverify,
    isVerified: isVerified,
    missing: missing,
    legacy: legacy,
    explicit: explicit,
    summary: summary,
    voiceSummary: voiceSummary,
    VOICE_TYPES: VOICE_TYPES,
    VOICE_LABELS: VOICE_LABELS,
    LANG_LABELS: LANG_LABELS,
  };
})();

if (typeof module !== "undefined" && module.exports) {
  module.exports = { RequirementMatrix };
}

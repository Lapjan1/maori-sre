/**
 * Acquisition Planner — Three-Planner Architecture with Conflict Diagnostics
 *
 * Three models, same state, diverging estimates:
 *   Structural:   raw × confidence  (model-based structural estimate)
 *   Horizon:      U(A) + max U(B | state')  (strategic trajectory value)
 *   Probabilistic: Σ P(outcome) × U(outcome)  (empirical expected value)
 *
 * Usage:
 *   node scripts/acquisition-planner.js                (all objectives, compare)
 *   node scripts/acquisition-planner.js max-coverage    (single objective)
 *   node scripts/acquisition-planner.js log <word> <predicted_gain> <actual_gain>  (record outcome)
 *   node scripts/acquisition-planner.js ledger          (show prediction history)
 */
var MACRONS = {"\u0101":"a","\u0113":"e","\u012b":"i","\u014d":"o","\u016b":"u"};
function normalize(text) {
  var result = text.toLowerCase().trim();
  result = result.replace(/[^a-z\u0101\u0113\u012b\u014d\u016b\s-]/g, "");
  var out = "";
  for (var i = 0; i < result.length; i++) { out += MACRONS[result[i]] || result[i]; }
  return out;
}

var fs = require("fs");
var path = require("path");
var DATA = path.join(__dirname, "..", "packages", "language-data");

eval(fs.readFileSync(path.join(DATA, "experiences.js"), "utf8"));
eval(fs.readFileSync(path.join(DATA, "surface_forms.js"), "utf8"));
eval(fs.readFileSync(path.join(DATA, "audio_index.js"), "utf8"));

// ── Persistence files ──
var HASH_FILE = path.join(__dirname, "..", ".agent-state-hash");
var LEDGER_FILE = path.join(__dirname, "..", ".agent-prediction-ledger.json");

function loadPersistedHash() {
  try { return fs.readFileSync(HASH_FILE, "utf8").trim(); } catch(e) { return null; }
}
function persistHash(hash) {
  try { fs.writeFileSync(HASH_FILE, hash, "utf8"); } catch(e) { /* ignore */ }
}

function loadLedger() {
  try { return JSON.parse(fs.readFileSync(LEDGER_FILE, "utf8")); } catch(e) { return []; }
}
function appendLedger(entry) {
  var ledger = loadLedger();
  ledger.push(entry);
  fs.writeFileSync(LEDGER_FILE, JSON.stringify(ledger, null, 2), "utf8");
  return ledger;
}
function persistLedger(ledger) {
  fs.writeFileSync(LEDGER_FILE, JSON.stringify(ledger, null, 2), "utf8");
}

// ── Confidence model: calibrate by gap type ──
function calibrateConfidence(ledger) {
  var byType = {};
  ledger.forEach(function(e) {
    if (!byType[e.gap_type]) byType[e.gap_type] = [];
    byType[e.gap_type].push(e);
  });
  var conf = { default: 0.8 };
  Object.keys(byType).forEach(function(type) {
    var entries = byType[type];
    if (entries.length === 0) { conf[type] = 0.8; return; }
    var sumAbsErr = 0;
    entries.forEach(function(e) { sumAbsErr += Math.abs(e.error); });
    // max possible error = predicted_gain (worst: predicted 4, actual 0 → error 4)
    var maxPredicted = 0;
    entries.forEach(function(e) { if (e.predicted_gain > maxPredicted) maxPredicted = e.predicted_gain; });
    var maxErr = maxPredicted || 4;
    var mae = sumAbsErr / entries.length;
    conf[type] = Math.max(0.1, Math.min(0.99, 1 - mae / maxErr));
  });
  return conf;
}

// ── Error classification ──
function classifyError(entry) {
  if (entry.error === 0) return "accurate";
  if (entry.actual_gain > entry.predicted_gain) return "underprediction";
  if (entry.predicted_gain > 0 && entry.actual_gain === 0) return "co_dependency";
  return "overprediction";
}

// ── Outcome calibration: from error history to probability distribution ──
function calibrateOutcomes(ledger) {
  // Build per-gap-type outcome histograms
  var byType = {};
  ledger.forEach(function(e) {
    if (!byType[e.gap_type]) byType[e.gap_type] = [];
    byType[e.gap_type].push(e);
  });
  var result = { default: { unlocked: 0.80, partial: 0.12, blocked: 0.08 } };
  Object.keys(byType).forEach(function(type) {
    var entries = byType[type];
    if (entries.length === 0) {
      result[type] = { unlocked: 0.80, partial: 0.12, blocked: 0.08 };
      return;
    }
    var unlocked = 0, partial = 0, blocked = 0;
    entries.forEach(function(e) {
      if (e.error === 0) { unlocked++; }
      else if (e.predicted_gain > 0 && e.actual_gain === 0) { blocked++; }
      else { partial++; }
    });
    result[type] = {
      unlocked: Math.round(unlocked / entries.length * 100) / 100,
      partial: Math.round(partial / entries.length * 100) / 100,
      blocked: Math.round(blocked / entries.length * 100) / 100,
    };
    // Normalize to exactly 1.0
    var sum = result[type].unlocked + result[type].partial + result[type].blocked;
    if (sum > 0 && sum !== 1.0) {
      result[type].unlocked = Math.round(result[type].unlocked / sum * 100) / 100;
      result[type].partial = Math.round(result[type].partial / sum * 100) / 100;
      result[type].blocked = Math.round(result[type].blocked / sum * 100) / 100;
    }
  });
  return result;
}

// Simulate a single outcome: given base deterministic state and outcome type,
// adjust the gain
function applyOutcome(baseState, outcomeType, predictedGain) {
  // Deep-ish clone: re-analyze with the same entity/audio maps
  // For simplicity, compute the outcome-adjusted coverage
  var totalSentences = baseState.length;
  var baseFull = baseState.filter(function(s) { return s.full; }).length;

  if (outcomeType === "unlocked") {
    // Full gain achieved
    return baseFull + predictedGain;
  } else if (outcomeType === "blocked") {
    // No gain
    return baseFull;
  } else {
    // Partial: half the gain (at least 0, at most predictedGain - 1)
    var partialGain = Math.max(0, Math.ceil(predictedGain * 0.5));
    return baseFull + partialGain;
  }
}

// ── State representation ──
var entityText = {};
Object.keys(SURFACE_FORM_INDEX).forEach(function(eid) {
  var idx = SURFACE_FORM_INDEX[eid];
  if (idx && idx.mi) {
    var sf = SURFACE_FORMS[idx.mi];
    if (sf && sf.text) entityText[eid] = normalize(sf.text);
  }
});
var textToEntity = {};
Object.keys(entityText).forEach(function(eid) { textToEntity[entityText[eid]] = eid; });

var stories = EXPERIENCES.filter(function(e) {
  return e.type === "story" || e.type === "observation" || e.type === "procedure" || e.type === "dialogue";
});
var allSentences = [];
stories.forEach(function(story) {
  var mi = story.content && story.content.mi;
  if (!mi) return;
  var raw = mi.replace(/["""]/g, "").trim();
  var sents = raw.split(/[.?!\n]+/).map(function(s) { return s.trim(); }).filter(Boolean);
  sents.forEach(function(s) { allSentences.push({ story_id: story.id, sentence: s }); });
});

function analyze(state) {
  var sentenceResults = [];
  allSentences.forEach(function(item) {
    var tokens = normalize(item.sentence).split(/\s+/).filter(Boolean);
    var wordStates = [];
    tokens.forEach(function(t) {
      var hasEntity = !!state.textToEntity[t];
      var hasAudio = !!AUDIO_INDEX[t];
      wordStates.push({
        word: t, hasEntity: hasEntity, hasAudio: hasAudio,
        gapType: !hasEntity && hasAudio ? "ENTITY_INTEGRATION" :
                 hasEntity && !hasAudio ? "AUDIO_ACQUISITION" :
                 !hasEntity && !hasAudio ? "JOINT_ACQUISITION" : "NONE"
      });
    });
    var allGaps = wordStates.filter(function(w) { return w.gapType !== "NONE"; });
    var blockingGaps = allGaps.filter(function(w) { return w.gapType === "JOINT_ACQUISITION"; });
    sentenceResults.push({
      story_id: item.story_id, raw: item.sentence, tokens: tokens,
      total: tokens.length, resolved: tokens.length - blockingGaps.length,
      full: blockingGaps.length === 0, all_gaps: allGaps, blocking_gaps: blockingGaps
    });
  });
  return sentenceResults;
}

function computeStateHash(state) {
  var parts = [];
  state.forEach(function(sr) {
    if (!sr.full) {
      parts.push(sr.story_id + ":" + sr.blocking_gaps.map(function(g) { return g.word; }).sort().join(","));
    }
  });
  return parts.sort().join("|");
}

// ── Objectives ──
var OBJECTIVES = {
  "max-coverage": {
    label: "Maximize Coverage",
    weights: { coverage: 1.0, completion: 0.0, reuse: 0.0, cost: 0.0 },
    description: "Only the number of sentences unlocked matters."
  },
  "complete-stories": {
    label: "Complete Stories First",
    weights: { coverage: 0.3, completion: 2.0, reuse: 0.5, cost: 0.0 },
    description: "Strong bonus for finishing the last sentence in a story."
  },
  "minimize-recordings": {
    label: "Minimize Recordings",
    weights: { coverage: 1.0, completion: 0.5, reuse: 1.0, cost: -1.5 },
    description: "Penalizes high-cost acquisitions."
  },
  "balanced": {
    label: "Balanced",
    weights: { coverage: 1.0, completion: 1.0, reuse: 0.5, cost: 0.0 },
    description: "Equal weight on coverage and completion."
  }
};

function computeRawUtility(candidate, weights) {
  return (candidate.coverageGain || 0) * weights.coverage
       + (candidate.completionBonus || 0) * weights.completion
       + (candidate.crossStoryReuse || 0) * weights.reuse
       + (candidate.acquisitionCost || 0) * weights.cost;
}

function buildCandidates(state) {
  var wordInfo = {};
  state.forEach(function(sr) {
    if (sr.full) return;
    sr.all_gaps.forEach(function(w) {
      if (!wordInfo[w.word]) {
        wordInfo[w.word] = { word: w.word, gapType: w.gapType, sentences: [], stories: {}, is_blocking: false };
      }
      wordInfo[w.word].sentences.push({ story_id: sr.story_id, raw: sr.raw, total_blocking: sr.blocking_gaps.length });
      wordInfo[w.word].stories[sr.story_id] = true;
      if (w.gapType === "JOINT_ACQUISITION") wordInfo[w.word].is_blocking = true;
    });
  });

  return Object.keys(wordInfo).map(function(k) {
    var info = wordInfo[k];
    var storyCount = Object.keys(info.stories).length;
    var sentenceCount = info.sentences.length;
    var coverageGain = info.sentences.filter(function(s) { return s.total_blocking === 1 && info.is_blocking; }).length;
    var completionBonus = 0;
    if (coverageGain > 0) {
      var completed = {};
      info.sentences.forEach(function(s) {
        if (s.total_blocking === 1 && info.is_blocking) completed[s.story_id] = true;
      });
      completionBonus = Object.keys(completed).length;
    }
    return {
      word: info.word, gapType: info.gapType, is_blocking: info.is_blocking,
      coverageGain: coverageGain, completionBonus: completionBonus,
      crossStoryReuse: storyCount, acquisitionCost: sentenceCount,
      sentenceCount: sentenceCount, storyCount: storyCount, sentences: info.sentences
    };
  });
}

function findClusters(state) {
  var map = {};
  state.forEach(function(sr) {
    if (sr.blocking_gaps.length < 2) return;
    var words = sr.blocking_gaps.map(function(w) { return w.word; });
    words.forEach(function(w) {
      words.forEach(function(w2) {
        if (w < w2) {
          var key = w + " + " + w2;
          if (!map[key]) map[key] = { words: [w, w2], sentences: [], stories: {} };
          map[key].sentences.push({ story_id: sr.story_id, raw: sr.raw });
          map[key].stories[sr.story_id] = true;
        }
      });
    });
  });
  return map;
}

// ── Subcommand: log a prediction outcome ──
function cmdLog(word, predictedGainStr, actualGainStr) {
  var predicted = parseInt(predictedGainStr, 10);
  var actual = parseInt(actualGainStr, 10);
  if (isNaN(predicted) || isNaN(actual)) {
    console.log("Usage: node scripts/acquisition-planner.js log <word> <predicted_gain> <actual_gain>");
    process.exit(1);
  }
  var entry = {
    action: word,
    predicted_gain: predicted,
    actual_gain: actual,
    error: actual - predicted,
    abs_error: Math.abs(actual - predicted),
    gap_type: "JOINT_ACQUISITION",
    objective: "balanced",
    outcome: "unknown",
    error_class: null,
    timestamp: new Date().toISOString()
  };
  entry.outcome = entry.error === 0 ? "accurate" : (entry.error > 0 ? "underprediction" : "overprediction");
  entry.error_class = classifyError(entry);
  appendLedger(entry);
  console.log("Logged: " + word + " predicted=" + predicted + " actual=" + actual + " error=" + entry.error + " (" + entry.error_class + ")");
}

// ── Subcommand: show ledger ──
function cmdLedger() {
  var ledger = loadLedger();
  var conf = calibrateConfidence(ledger);
  if (ledger.length === 0) {
    console.log("Prediction ledger is empty.");
    return;
  }
  console.log("╔══════════════════════════════════════════════════════════════════╗");
  console.log("║  PREDICTION LEDGER — " + String(ledger.length).length + " entries                               ║");
  console.log("╚══════════════════════════════════════════════════════════════════╝");
  console.log("");
  console.log("  Word          Pred  Actual  Error  Outcome          Class");
  console.log("  ────────────── ───── ─────── ────── ──────────────── ────────────────");
  ledger.forEach(function(e) {
    var w = String(e.action);
    while (w.length < 14) w += " ";
    var pg = String(e.predicted_gain);
    while (pg.length < 5) pg += " ";
    var ag = String(e.actual_gain);
    while (ag.length < 7) ag += " ";
    var err = String(e.error);
    while (err.length < 6) err += " ";
    var oc = e.outcome || "?";
    while (oc.length < 16) oc += " ";
    var ec = e.error_class || "?";
    console.log("  " + w + pg + ag + err + oc + ec);
  });
  console.log("");
  console.log("───────────────────────────────────────────────────────────────");
  console.log("  CALIBRATED CONFIDENCE BY GAP TYPE");
  console.log("───────────────────────────────────────────────────────────────");
  Object.keys(conf).forEach(function(type) {
    console.log("  " + type + ": " + Math.round(conf[type] * 100) + "%");
  });
  console.log("───────────────────────────────────────────────────────────────");
  console.log("  ERROR STATISTICS");
  console.log("───────────────────────────────────────────────────────────────");
  var errors = ledger.map(function(e) { return e.error; });
  var absErrors = ledger.map(function(e) { return e.abs_error; });
  var meanErr = errors.reduce(function(s, v) { return s + v; }, 0) / errors.length;
  var meanAbsErr = absErrors.reduce(function(s, v) { return s + v; }, 0) / absErrors.length;
  var maxErr = Math.max.apply(null, absErrors);
  var byClass = {};
  ledger.forEach(function(e) {
    var cls = e.error_class || "unknown";
    if (!byClass[cls]) byClass[cls] = 0;
    byClass[cls]++;
  });
  console.log("  Mean error:       " + meanErr.toFixed(2));
  console.log("  Mean abs error:   " + meanAbsErr.toFixed(2));
  console.log("  Max abs error:    " + maxErr);
  console.log("  Total entries:    " + ledger.length);
  console.log("");
  Object.keys(byClass).forEach(function(cls) {
    console.log("  " + cls + ": " + byClass[cls] + " (" + Math.round(byClass[cls] / ledger.length * 100) + "%)");
  });
}

// ── Simulate acquiring a word ──
function simulateAcquire(word, baseEntityText, baseTTE) {
  var n = normalize(word);
  var simEntityText = {};
  Object.keys(baseEntityText).forEach(function(k) { simEntityText[k] = baseEntityText[k]; });
  var simTTE = {};
  Object.keys(baseTTE).forEach(function(k) { simTTE[k] = baseTTE[k]; });
  // Add the word as a new entity
  var simEid = "SIM_" + n;
  simEntityText[simEid] = n;
  simTTE[n] = simEid;
  var simState = analyze({ entityText: simEntityText, textToEntity: simTTE });
  var simCandidates = buildCandidates(simState);
  var simFull = simState.filter(function(s) { return s.full; }).length;
  return { state: simState, candidates: simCandidates, total: simState.length, full: simFull };
}

// Compute 2-step plan: action A, then best follow-up B in resulting state
function compute2StepPlans(candidates, state, entityText, tte, objectiveKey, weights) {
  var totalSentences = state.length;
  var currentCoverage = state.filter(function(s) { return s.full; }).length;
  return candidates.map(function(a) {
    var sim = simulateAcquire(a.word, entityText, tte);
    var afterCoverage = sim.full;
    var step1Gain = afterCoverage - currentCoverage;
    // Find best follow-up B in simulated state
    var bestFollowUp = null;
    var bestBUtility = -999;
    sim.candidates.forEach(function(b) {
      var bRaw = computeRawUtility(b, weights);
      if (bRaw > bestBUtility) {
        bestBUtility = bRaw;
        bestFollowUp = b;
      }
    });
    return {
      word: a.word,
      gapType: a.gapType,
      step1Gain: step1Gain,
      step1Raw: computeRawUtility(a, weights),
      step1Coverage: afterCoverage,
      step2Word: bestFollowUp ? bestFollowUp.word : null,
      step2Raw: bestBUtility > 0 ? bestBUtility : 0,
      step2Gain: bestFollowUp ? bestFollowUp.coverageGain : 0,
      totalRaw: Math.round((computeRawUtility(a, weights) + Math.max(0, bestBUtility)) * 10) / 10,
      totalGain: step1Gain + (bestFollowUp ? bestFollowUp.coverageGain : 0),
    };
  });
}

// ── Main planning function ──
function main(objectiveKey) {
  var currentEntityText = {};
  Object.keys(entityText).forEach(function(eid) { currentEntityText[eid] = entityText[eid]; });
  var currentTTE = {};
  Object.keys(currentEntityText).forEach(function(eid) { currentTTE[currentEntityText[eid]] = eid; });
  var currentState = analyze({ entityText: currentEntityText, textToEntity: currentTTE });

  var totalSentences = currentState.length;
  var fullSentences = currentState.filter(function(s) { return s.full; }).length;
  var coverage = ((fullSentences / totalSentences) * 100).toFixed(1);

  // ── Termination detection ──
  var newHash = computeStateHash(currentState);
  var previousHash = loadPersistedHash();
  var stateChanged = (previousHash === null) || (newHash !== previousHash);
  if (!stateChanged) {
    console.log("╔══════════════════════════════════════════════════════════════════╗");
    console.log("║  STATE UNCHANGED                                               ║");
    console.log("║  " + newHash.slice(0, 48) + "  ║");
    console.log("║  Agent stops — no action taken since last analysis.            ║");
    console.log("╚══════════════════════════════════════════════════════════════════╝");
    return;
  }
  persistHash(newHash);
  var isFirstRun = (previousHash === null);

  // ── Load prediction ledger for confidence and outcome calibration ──
  var ledger = loadLedger();
  var confidenceByType = calibrateConfidence(ledger);
  var outcomeDistByType = calibrateOutcomes(ledger);

  var candidates = buildCandidates(currentState);

  // Attach confidence and expected utility per objective
  candidates.forEach(function(c) {
    c.confidence = confidenceByType[c.gapType] || confidenceByType.default;
    c.outcomes = outcomeDistByType[c.gapType] || outcomeDistByType.default;
    c.expectedUtilities = {};
    c.probabilisticUtilities = {};
    Object.keys(OBJECTIVES).forEach(function(key) {
      var raw = computeRawUtility(c, OBJECTIVES[key].weights);
      c.expectedUtilities[key] = Math.round(raw * c.confidence * 10) / 10;
    });
  });

  // ── Probabilistic expected utility ──
  // For each candidate, compute expected utility across outcome distribution
  candidates.forEach(function(c) {
    var baseFull = currentState.filter(function(s) { return s.full; }).length;
    c.outcomeStates = {};
    ["unlocked", "partial", "blocked"].forEach(function(outcome) {
      var adjFull = applyOutcome(currentState, outcome, c.coverageGain);
      var adjGain = adjFull - baseFull;
      c.outcomeStates[outcome] = { gain: adjGain, coverage: adjFull };
    });
    Object.keys(OBJECTIVES).forEach(function(key) {
      var weights = OBJECTIVES[key].weights;
      var eu = 0;
      ["unlocked", "partial", "blocked"].forEach(function(outcome) {
        var prob = c.outcomes[outcome] || 0;
        var gain = c.outcomeStates[outcome].gain;
        // Temporary candidate with adjusted gain for utility computation
        var adjusted = { coverageGain: gain, completionBonus: gain > 0 ? 1 : 0,
          crossStoryReuse: c.crossStoryReuse, acquisitionCost: c.acquisitionCost };
        var util = computeRawUtility(adjusted, weights);
        eu += prob * util;
      });
      c.probabilisticUtilities[key] = Math.round(eu * 10) / 10;
    });
  });

  // Compute 2-step plans for each objective
  var plansByObjective = {};
  Object.keys(OBJECTIVES).forEach(function(key) {
    plansByObjective[key] = compute2StepPlans(candidates, currentState, currentEntityText, currentTTE, key, OBJECTIVES[key].weights);
  });

  var clusters = findClusters(currentState);

  // ── Output header ──
  console.log("╔══════════════════════════════════════════════════════════════════╗");
  console.log("║  ACQUISITION PLANNER — Deterministic + Probabilistic            ║");
  console.log("╚══════════════════════════════════════════════════════════════════╝");
  console.log("");
  console.log("  Coverage: " + fullSentences + "/" + totalSentences + " (" + coverage + "%)");
  console.log("  State hash: " + newHash.slice(0, 16) + "...");
  console.log("  State changed: " + stateChanged);
  console.log("  Ledger entries: " + ledger.length);
  console.log("");

  // ── Confidence summary ──
  console.log("───────────────────────────────────────────────────────────────");
  console.log("  CONFIDENCE BY GAP TYPE");
  console.log("───────────────────────────────────────────────────────────────");
  Object.keys(confidenceByType).forEach(function(type) {
    var label = type === "ENTITY_INTEGRATION" ? "Entity integration" :
                type === "AUDIO_ACQUISITION" ? "Audio acquisition" :
                type === "JOINT_ACQUISITION" ? "Joint acquisition" : type;
    var pct = Math.round(confidenceByType[type] * 100);
    var bar = "";
    for (var i = 0; i < pct / 5; i++) bar += "█";
    for (var i = pct / 5; i < 20; i++) bar += "░";
    console.log("  " + label + ": " + pct + "% " + bar);
  });
  console.log("");

  // ── Show all objectives ──
  console.log("───────────────────────────────────────────────────────────────");
  console.log("  OBJECTIVES");
  console.log("───────────────────────────────────────────────────────────────");
  Object.keys(OBJECTIVES).forEach(function(key) {
    var o = OBJECTIVES[key];
    console.log("  " + o.label + "  [" + key + "]");
    console.log("    " + o.description);
    console.log("");
  });

  // ── Compare recommendations ──
  console.log("───────────────────────────────────────────────────────────────");
  console.log("  RECOMMENDATIONS BY OBJECTIVE (expected = raw × confidence)");
  console.log("───────────────────────────────────────────────────────────────");

  function pad(s, n) { s = String(s); while (s.length < n) s += " "; return s; }

  Object.keys(OBJECTIVES).forEach(function(key) {
    var sorted = candidates.slice().sort(function(a, b) {
      var diff = b.expectedUtilities[key] - a.expectedUtilities[key];
      if (diff !== 0) return diff;
      return b.coverageGain - a.coverageGain;
    });

    console.log("\n  " + OBJECTIVES[key].label + " [" + key + "]:");
    console.log("  " + pad("Word", 14) + pad("Type", 10) + pad("Raw", 6) + pad("Conf", 6) + pad("Expected", 8) + pad("Gain", 6));
    console.log("  " + pad("", 14, "-") + " " + pad("", 10, "-") + " " + pad("", 6, "-") + " " + pad("", 6, "-") + " " + pad("", 8, "-") + " " + pad("", 6, "-"));

    sorted.forEach(function(c, i) {
      var typeLabel = c.gapType === "ENTITY_INTEGRATION" ? "entity" :
                      c.gapType === "AUDIO_ACQUISITION" ? "audio" : "joint";
      var raw = computeRawUtility(c, OBJECTIVES[key].weights);
      var confPct = Math.round(c.confidence * 100);
      console.log("  " + (i+1) + ". " + pad(c.word, 12) + pad(typeLabel, 10) + pad(Math.round(raw * 10) / 10, 6) + pad(confPct + "%", 6) + pad(c.expectedUtilities[key], 8) + pad(c.coverageGain, 6));
    });

    var top = sorted[0];
    if (top) {
      console.log("");
      console.log("  Best action: " + top.word + " (expected utility: " + top.expectedUtilities[key] + ", confidence: " + Math.round(top.confidence * 100) + "%)");
      top.sentences.forEach(function(s) {
        var isFull = s.total_blocking === 0 || (s.total_blocking === 1 && top.is_blocking);
        console.log("    " + (isFull ? "✓" : " ") + " [" + s.story_id + "] " + s.raw + (isFull ? "  ← FULLY RESOLVABLE" : ""));
      });
      var coDeps = sorted.filter(function(r) {
        return r.word !== top.word && r.is_blocking && r.coverageGain === 0;
      }).filter(function(r) {
        return r.sentences.some(function(s1) {
          return top.sentences.some(function(s2) { return s1.raw === s2.raw; });
        });
      });
      if (coDeps.length > 0 && top.coverageGain === 0) {
        console.log("  ⚠ Co-dependent: " + top.word + " + " + coDeps.map(function(r) { return r.word; }).join(" + "));
      }
    }
  });

  // ── Consensus ──
  console.log("\n───────────────────────────────────────────────────────────────");
  console.log("  CONSENSUS ANALYSIS");
  console.log("───────────────────────────────────────────────────────────────");
  var consensus = {};
  Object.keys(OBJECTIVES).forEach(function(key) {
    var sorted = candidates.slice().sort(function(a, b) { return b.expectedUtilities[key] - a.expectedUtilities[key]; });
    sorted.slice(0, 3).forEach(function(c) {
      if (!consensus[c.word]) consensus[c.word] = [];
      consensus[c.word].push(key);
    });
  });
  Object.keys(consensus).sort(function(a, b) { return consensus[b].length - consensus[a].length; }).forEach(function(word) {
    console.log("  " + pad(word, 12) + " → " + consensus[word].length + "/" + Object.keys(OBJECTIVES).length + " objectives");
  });

  // ── Co-dependency clusters ──
  console.log("\n───────────────────────────────────────────────────────────────");
  console.log("  CO-DEPENDENCY CLUSTERS");
  console.log("───────────────────────────────────────────────────────────────");
  var depsList = Object.keys(clusters).sort();
  if (depsList.length > 0) {
    depsList.forEach(function(k) {
      var d = clusters[k];
      console.log("  " + k + "  →  " + d.sentences.length + " sentence(s) in " + Object.keys(d.stories).join(", "));
    });
  } else { console.log("  (none)"); }

  // ── Planning horizon ──
  console.log("\n───────────────────────────────────────────────────────────────");
  console.log("  PLANNING HORIZON — 2-Step Plans (greedy vs planned)");
  console.log("───────────────────────────────────────────────────────────────");

  Object.keys(OBJECTIVES).forEach(function(key) {
    var plans = plansByObjective[key].slice().sort(function(a, b) {
      return b.totalRaw - a.totalRaw;
    });
    var weights = OBJECTIVES[key].weights;

    console.log("\n  " + OBJECTIVES[key].label + " [" + key + "]:");
    console.log("  " + pad("Step1", 14) + pad("Gain", 6) + pad("→Step2", 14) + pad("Gain", 6) + pad("Total", 8) + pad("Coverage", 8));
    console.log("  " + pad("", 14, "-") + " " + pad("", 6, "-") + " " + pad("", 14, "-") + " " + pad("", 6, "-") + " " + pad("", 8, "-") + " " + pad("", 8, "-"));

    plans.slice(0, 12).forEach(function(p) {
      var s1 = p.word;
      var s2 = p.step2Word || "(none)";
      var s1gain = p.step1Gain;
      var s2gain = p.step2Gain;
      console.log("  " + pad(s1, 12) + pad(s1gain, 6) + "→ " + pad(s2, 12) + pad(s2gain, 6) + pad(p.totalRaw, 8) + pad(p.step1Coverage + "/" + totalSentences, 8));
    });

    // Show best plan
    var bestPlan = plans[0];
    if (bestPlan) {
      console.log("");
      console.log("  Best 2-step: " + bestPlan.word + " → " + (bestPlan.step2Word || "(done)"));
      console.log("  Total utility: " + bestPlan.totalRaw + " (step1: " + bestPlan.step1Raw + " + step2: " + bestPlan.step2Raw + ")");
      console.log("  Coverage after step1: " + bestPlan.step1Coverage + "/" + totalSentences);

      // Compare to greedy: what does 1-step ranking pick?
      var greedyCandidates = candidates.slice().sort(function(a, b) {
        return b.expectedUtilities[key] - a.expectedUtilities[key];
      });
      var greedy = greedyCandidates[0];
      if (greedy && greedy.word !== bestPlan.word) {
        var greedyPlan = plansByObjective[key].filter(function(p) { return p.word === greedy.word; })[0];
        console.log("");
        console.log("  ** Greedy would pick: " + greedy.word + " (1-step utility: " + greedy.expectedUtilities[key] + ")");
        console.log("  ** But " + bestPlan.word + " → " + bestPlan.step2Word + " has higher total utility: " + bestPlan.totalRaw + " vs " + (greedyPlan ? greedyPlan.totalRaw : greedy.expectedUtilities[key]));
        console.log("  ** Difference: " + (bestPlan.totalRaw - (greedyPlan ? greedyPlan.totalRaw : greedy.expectedUtilities[key])));
      }
    }
  });

  // ── Probabilistic planner ──
  console.log("\n══════════════════════════════════════════════════════════════════");
  console.log("  PROBABILISTIC PLANNER — Expected Utility Under Uncertainty");
  console.log("══════════════════════════════════════════════════════════════════");

  Object.keys(OBJECTIVES).forEach(function(key) {
    var weighted = candidates.slice().sort(function(a, b) {
      return b.probabilisticUtilities[key] - a.probabilisticUtilities[key];
    });

    console.log("\n  " + OBJECTIVES[key].label + " [" + key + "]:");
    console.log("  " + pad("Word", 14) + pad("Type", 10) + pad("P(unlock)", 10) + pad("P(part)", 9) + pad("P(block)", 9) + pad("Expected", 8) + pad("Determin", 9));
    console.log("  " + pad("", 14, "-") + " " + pad("", 10, "-") + " " + pad("", 10, "-") + " " + pad("", 9, "-") + " " + pad("", 9, "-") + " " + pad("", 8, "-") + " " + pad("", 9, "-"));

    weighted.forEach(function(c, i) {
      var typeLabel = c.gapType === "ENTITY_INTEGRATION" ? "entity" :
                      c.gapType === "AUDIO_ACQUISITION" ? "audio" : "joint";
      var pu = Math.round((c.outcomes.unlocked || 0) * 100);
      var pp = Math.round((c.outcomes.partial || 0) * 100);
      var pb = Math.round((c.outcomes.blocked || 0) * 100);
      console.log("  " + (i+1) + ". " + pad(c.word, 12) + pad(typeLabel, 10) + pad(pu + "%", 10) + pad(pp + "%", 9) + pad(pb + "%", 9) + pad(c.probabilisticUtilities[key], 8) + pad(c.expectedUtilities[key], 9));
    });

    var topProb = weighted[0];
    var topDet = candidates.slice().sort(function(a, b) { return b.expectedUtilities[key] - a.expectedUtilities[key]; })[0];
    if (topProb && topDet) {
      console.log("");
      if (topProb.word !== topDet.word) {
        console.log("  Decision differs from deterministic planner!");
        console.log("    Probabilistic picks: " + topProb.word + " (EU: " + topProb.probabilisticUtilities[key] + ")");
        console.log("    Deterministic picks: " + topDet.word + " (EU: " + topDet.expectedUtilities[key] + ")");
        console.log("    Gap type: " + topProb.gapType + " | P(unlock): " + Math.round((topProb.outcomes.unlocked || 0) * 100) + "%");
      } else {
        console.log("  Same decision as deterministic: " + topProb.word);
        console.log("    Deterministic utility: " + topDet.expectedUtilities[key] + " | Expected utility: " + topProb.probabilisticUtilities[key]);
        console.log("    P(unlock): " + Math.round((topProb.outcomes.unlocked || 0) * 100) + "% | P(partial): " + Math.round((topProb.outcomes.partial || 0) * 100) + "% | P(blocked): " + Math.round((topProb.outcomes.blocked || 0) * 100) + "%");
      }
    }
  });

  // ── Three-planner comparison ──
  console.log("\n══════════════════════════════════════════════════════════════════");
  console.log("  THREE-PLANNER COMPARISON — Divergence as Diagnostic Signal");
  console.log("══════════════════════════════════════════════════════════════════");

  Object.keys(OBJECTIVES).forEach(function(key) {
    var detCandidates = candidates.slice().sort(function(a, b) { return b.expectedUtilities[key] - a.expectedUtilities[key]; });
    var plans = plansByObjective[key];
    var planMap = {};
    plans.forEach(function(p) { planMap[p.word] = p; });
    var probCandidates = candidates.slice().sort(function(a, b) { return b.probabilisticUtilities[key] - a.probabilisticUtilities[key]; });
    var probMap = {};
    probCandidates.forEach(function(c) { probMap[c.word] = c; });

    var topDet = detCandidates[0];
    var topHorizon = plans.slice().sort(function(a, b) { return b.totalRaw - a.totalRaw; })[0];
    var topProb = probCandidates[0];

    console.log("\n  " + OBJECTIVES[key].label + " [" + key + "]:");
    console.log("  " + pad("Word", 14) + pad("Type", 10) + pad("Struct", 8) + pad("Horizon", 8) + pad("Probab", 8) + pad("ΔH-S", 6) + pad("ΔP-S", 6));
    console.log("  " + pad("", 14, "-") + " " + pad("", 10, "-") + " " + pad("", 8, "-") + " " + pad("", 8, "-") + " " + pad("", 8, "-") + " " + pad("", 6, "-") + " " + pad("", 6, "-"));

    detCandidates.forEach(function(c) {
      var typeLabel = c.gapType === "ENTITY_INTEGRATION" ? "entity" :
                      c.gapType === "AUDIO_ACQUISITION" ? "audio" : "joint";
      var struct = c.expectedUtilities[key];
      var horizon = planMap[c.word] ? planMap[c.word].totalRaw : struct;
      var prob = probMap[c.word] ? probMap[c.word].probabilisticUtilities[key] : struct;
      var dh = Math.round((horizon - struct) * 10) / 10;
      var dp = Math.round((prob - struct) * 10) / 10;
      var rank = detCandidates.indexOf(c) + 1;
      if (rank > 12) return; // only show top 12
      console.log("  " + (rank) + ". " + pad(c.word, 12) + pad(typeLabel, 10) + pad(struct, 8) + pad(horizon, 8) + pad(prob, 8) + pad((dh >= 0 ? "+" : "") + dh, 6) + pad((dp >= 0 ? "+" : "") + dp, 6));
    });

    // Diagnostic: classify consensus/conflict for top candidates
    console.log("");
    function classifyPattern(structV, horizonV, probV) {
      var vals = [structV, horizonV, probV].sort(function(a,b) { return a - b; });
      var spread = vals[2] - vals[0];
      var hDelta = horizonV - structV;
      var pDelta = probV - structV;
      if (spread < 0.3) return { label: "all agree", code: "AAAA" };
      if (Math.abs(hDelta) > Math.abs(pDelta) * 2 && Math.abs(hDelta) >= 0.5) return { label: "trajectory effect dominates", code: "TRAJ" };
      if (Math.abs(pDelta) > Math.abs(hDelta) * 2 && Math.abs(pDelta) >= 0.5) return { label: "empirical correction dominates", code: "EMPC" };
      if (hDelta > 0.5 && pDelta < -0.3) return { label: "trajectory vs empirical conflict", code: "CONF" };
      if (pDelta > 0.3 && hDelta < -0.3) return { label: "empirical vs trajectory conflict", code: "CONF" };
      return { label: "mixed divergence", code: "MIX" };
    }

    // Show top 5 with diagnostics
    var top5 = detCandidates.slice(0, 5);
    console.log("  CONFLICT DIAGNOSTICS — Top 5 candidates:");
    console.log("  " + pad("Word", 14) + pad("Pattern", 34) + pad("ValueVar", 8) + pad("σ", 6));
    console.log("  " + pad("", 14, "-") + " " + pad("", 34, "-") + " " + pad("", 8, "-") + " " + pad("", 6, "-"));

    top5.forEach(function(c) {
      var sv = c.expectedUtilities[key];
      var hv = planMap[c.word] ? planMap[c.word].totalRaw : sv;
      var pv = probMap[c.word] ? probMap[c.word].probabilisticUtilities[key] : sv;
      var diag = classifyPattern(sv, hv, pv);
      var vals = [sv, hv, pv];
      var mean = vals.reduce(function(s, v) { return s + v; }, 0) / vals.length;
      var variance = vals.reduce(function(s, v) { return s + (v - mean) * (v - mean); }, 0) / vals.length;
      var stdDev = Math.round(Math.sqrt(variance) * 10) / 10;
      var valueRange = Math.round((Math.max.apply(null, vals) - Math.min.apply(null, vals)) * 10) / 10;
      console.log("  " + pad(c.word, 12) + pad(diag.label, 34) + pad(valueRange, 8) + pad(stdDev, 6));
    });

    console.log("");
    var winners = {};
    [topDet, topHorizon, topProb].forEach(function(action, i) {
      if (!action) return;
      var label = i === 0 ? "structural" : i === 1 ? "horizon" : "probabilistic";
      if (!winners[action.word]) winners[action.word] = [];
      winners[action.word].push(label);
    });

    console.log("  Best by structural:   " + topDet.word + " (" + topDet.expectedUtilities[key] + ")");
    console.log("  Best by horizon:      " + topHorizon.word + " (" + topHorizon.totalRaw + ")");
    console.log("  Best by probabilistic:" + topProb.word + " (" + topProb.probabilisticUtilities[key] + ")");

    var allSame = (topDet.word === topHorizon.word && topHorizon.word === topProb.word);
    if (allSame) {
      console.log("  ACTION CONSENSUS: HIGH (all three pick " + topDet.word + ")");
      var sv = topDet.expectedUtilities[key];
      var hv = planMap[topDet.word] ? planMap[topDet.word].totalRaw : sv;
      var pv = probMap[topDet.word] ? probMap[topDet.word].probabilisticUtilities[key] : sv;
      var vals = [sv, hv, pv];
      var mean = vals.reduce(function(s, v) { return s + v; }, 0) / vals.length;
      var variance = vals.reduce(function(s, v) { return s + (v - mean) * (v - mean); }, 0) / vals.length;
      var stdDev = Math.round(Math.sqrt(variance) * 10) / 10;
      console.log("  VALUE VARIANCE: " + stdDev + " (std dev across three planners)");
      console.log("  TRAJECTORY DIVERGENCE: " + (Math.round((hv - sv) * 10) / 10) + " (horizon − structural)");
    } else {
      console.log("  ** ACTION CONSENSUS: LOW — planners disagree **");
      Object.keys(winners).forEach(function(w) {
        console.log("    " + w + " preferred by: " + winners[w].join(", "));
      });
    }
  });

  // ── Termination ──
  console.log("\n───────────────────────────────────────────────────────────────");
  console.log("  TERMINATION LOGIC");
  console.log("───────────────────────────────────────────────────────────────");
  console.log("  Hash file: " + HASH_FILE);
  console.log("  First run: " + isFirstRun);
  console.log("  State changed: " + stateChanged);
  console.log("  Next run with same state → agent stops.");

  // ── Prediction error note ──
  console.log("\n───────────────────────────────────────────────────────────────");
  console.log("  PREDICTION ERROR TRACKING");
  console.log("───────────────────────────────────────────────────────────────");
  console.log("  Ledger file: " + LEDGER_FILE);
  console.log("  After acting, log actual outcome:");
  console.log("    node scripts/acquisition-planner.js log " + (candidates[0] ? candidates[0].word : "<word>") + " <predicted> <actual>");
  console.log("  This calibrates confidence for future recommendations.");
}

// ── CLI dispatch ──
var cmd = process.argv[2];
if (cmd === "log") {
  cmdLog(process.argv[3], process.argv[4], process.argv[5]);
} else if (cmd === "ledger") {
  cmdLedger();
} else if (cmd === "all" || !cmd) {
  main("max-coverage");
} else if (OBJECTIVES[cmd]) {
  main(cmd);
} else {
  console.log("Unknown command: " + cmd);
  console.log("Usage:");
  console.log("  node scripts/acquisition-planner.js                    (show all objectives)");
  console.log("  node scripts/acquisition-planner.js <objective>       (single objective)");
  console.log("  node scripts/acquisition-planner.js log <w> <p> <a>   (record outcome)");
  console.log("  node scripts/acquisition-planner.js ledger            (show history)");
}

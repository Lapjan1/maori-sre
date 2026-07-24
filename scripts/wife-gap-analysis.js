/**
 * Wife Core 20 Gap Analysis
 *
 * For each WIFE practice phrase, tokenize and check every word against:
 *   1) SURFACE_FORM_INDEX (entity-driven)
 *   2) AUDIO_INDEX (dictionary fallback)
 *
 * Usage: node scripts/wife-gap-analysis.js
 */
var fs = require("fs");
var path = require("path");

var MACRONS = {"\u0101":"a","\u0113":"e","\u012b":"i","\u014d":"o","\u016b":"u"};
function normalize(text) {
  var result = text.toLowerCase().trim();
  result = result.replace(/[^a-z\u0101\u0113\u012b\u014d\u016b\s-]/g, "");
  var out = "";
  for (var i = 0; i < result.length; i++) {
    out += MACRONS[result[i]] || result[i];
  }
  return out;
}

var DATA = path.join(__dirname, "..", "packages", "language-data");
eval(fs.readFileSync(path.join(DATA, "curriculum-wife.js"), "utf8"));
eval(fs.readFileSync(path.join(DATA, "surface_forms.js"), "utf8"));
eval(fs.readFileSync(path.join(DATA, "audio_index.js"), "utf8"));

// Build entity → normalized Māori text map
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

// Extract target phrases from each WIFE practice
var phrases = [];
CORE_20.forEach(function(exp) {
  var mi = exp.title && exp.title.mi;
  if (!mi) return;
  // Also extract from content.mi last line (after \n\n) which is the target phrase
  var contentMi = exp.content && exp.content.mi || "";
  var lines = contentMi.split("\n").map(function(s) { return s.trim(); }).filter(Boolean);
  var targetLine = lines[lines.length - 1] || "";

  phrases.push({
    id: exp.id,
    phrase_id: exp.phrase_id,
    title_mi: mi,
    content_target: targetLine,
  });
});

// Analyze each phrase
var allTokens = {};
var phraseResults = [];

phrases.forEach(function(phrase) {
  var source = phrase.content_target && phrase.content_target !== phrase.title_mi ? phrase.content_target : phrase.title_mi;
  source = source.replace(/[?!.]/g, "").trim();
  var tokens = normalize(source).split(/\s+/).filter(Boolean);

  var resolved = [];
  var missing = [];
  var audioFallback = [];

  tokens.forEach(function(t) {
    if (textToEntity[t]) {
      resolved.push({ word: t, source: "entity:" + textToEntity[t] });
    } else if (AUDIO_INDEX[t]) {
      audioFallback.push({ word: t, source: "audio_index:" + AUDIO_INDEX[t].filename });
    } else {
      missing.push(t);
      allTokens[t] = (allTokens[t] || 0) + 1;
    }
  });

  phraseResults.push({
    id: phrase.id,
    phrase_id: phrase.phrase_id,
    raw: source,
    normalized: tokens.join(" "),
    total: tokens.length,
    resolved: resolved.length,
    audioFallback: audioFallback.length,
    missing: missing.length,
    resolved_words: resolved,
    audio_words: audioFallback,
    missing_words: missing,
    full: missing.length === 0,
  });
});

// Output
console.log("══════════════════════════════════════════════════");
console.log("  WIFE CORE 20 GAP ANALYSIS — Māori Atomic Resolution");
console.log("══════════════════════════════════════════════════\n");

phraseResults.forEach(function(pr) {
  var icon = pr.full ? "✓" : "✗";
  console.log("  %s  %s  [%s]", icon, pr.id, pr.phrase_id);
  console.log("      Phrase: \"%s\"", pr.raw);
  console.log("      Tokens: %d  Resolved: %d  AudioFallback: %d  Missing: %d",
    pr.total, pr.resolved, pr.audioFallback, pr.missing);
  if (pr.resolved_words.length > 0) {
    console.log("      Entity:   %s", pr.resolved_words.map(function(w) { return w.word; }).join(", "));
  }
  if (pr.audio_words.length > 0) {
    console.log("      Audio:    %s", pr.audio_words.map(function(w) { return w.word + " (" + w.source.split(":")[1] + ")"; }).join(", "));
  }
  if (pr.missing_words.length > 0) {
    console.log("      MISSING:  %s", pr.missing_words.join(", "));
  }
  console.log();
});

console.log("──────────────────────────────────────────────");
console.log("  SUMMARY");
console.log("──────────────────────────────────────────────\n");
var total = phraseResults.length;
var full = phraseResults.filter(function(p) { return p.full; }).length;
var pct = ((full / total) * 100).toFixed(0);
console.log("  %s/%s phrases fully resolvable (%s%%)", full, total, pct);

// Priority list of missing words
var missingWordList = Object.keys(allTokens)
  .map(function(w) { return { word: w, count: allTokens[w] }; })
  .sort(function(a, b) { return b.count - a.count; });

console.log("  %d unique missing words:\n", missingWordList.length);
if (missingWordList.length > 0) {
  console.log("  Rank  Word      Count  HasAudio  InEntities");
  console.log("  ----  ----      -----  --------  ----------");
  missingWordList.forEach(function(m, i) {
    var ha = AUDIO_INDEX[m.word] ? "yes" : "no";
    var ie = textToEntity[m.word] ? "yes" : "no";
    console.log("  #%d    %-10s %-3d     %-5s    %-5s", i + 1, m.word, m.count, ha, ie);
  });
  console.log();
} else {
  console.log("  (none — all words covered)\n");
}

// Coverage by word
console.log("──────────────────────────────────────────────");
console.log("  WORD COVERAGE IN WIFE PHRASES");
console.log("──────────────────────────────────────────────\n");
var allWords = {};
phraseResults.forEach(function(pr) {
  pr.resolved_words.concat(pr.audio_words).concat(pr.missing_words.map(function(w) { return { word: w }; })).forEach(function(w) {
    if (!allWords[w.word]) allWords[w.word] = { inEntity: false, inAudio: false, count: 0 };
    allWords[w.word].count++;
    if (w.source && w.source.startsWith("entity")) allWords[w.word].inEntity = true;
    else if (textToEntity[w.word]) allWords[w.word].inEntity = true;
    if (w.source && w.source.startsWith("audio_index")) allWords[w.word].inAudio = true;
    else if (AUDIO_INDEX[w.word]) allWords[w.word].inAudio = true;
  });
});
Object.keys(allWords).sort().forEach(function(w) {
  var info = allWords[w];
  var status = info.inEntity ? (info.inAudio ? "entity+audio" : "entity only") : (info.inAudio ? "audio only" : "MISSING");
  console.log("  %-12s appears %d time(s) — %s", w, info.count, status);
});
console.log();

// Co-dependency analysis
console.log("──────────────────────────────────────────────");
console.log("  CO-DEPENDENCY CLUSTERS");
console.log("──────────────────────────────────────────────\n");
var deps = {};
phraseResults.forEach(function(pr) {
  if (pr.missing_words.length < 2) return;
  for (var i = 0; i < pr.missing_words.length; i++) {
    for (var j = i + 1; j < pr.missing_words.length; j++) {
      var a = pr.missing_words[i], b = pr.missing_words[j];
      var key = a < b ? a + " + " + b : b + " + " + a;
      if (!deps[key]) deps[key] = { words: [a, b], phrases: [] };
      deps[key].phrases.push(pr.id + " (" + pr.raw + ")");
    }
  }
});
var depKeys = Object.keys(deps);
if (depKeys.length > 0) {
  depKeys.forEach(function(k) {
    console.log("  %s → %s", k, deps[k].phrases.join("; "));
  });
} else {
  console.log("  (none — all missing words are singletons)");
}
console.log();

// Best next acquisition
console.log("──────────────────────────────────────────────");
console.log("  BEST NEXT ACQUISITION");
console.log("──────────────────────────────────────────────\n");
if (missingWordList.length > 0) {
  var top = missingWordList[0];
  var unlocked = phraseResults.filter(function(pr) {
    return !pr.full && pr.missing_words.indexOf(top.word) !== -1;
  });
  console.log("  Acquire \"%s\" → unlocks %d/%d unresolved phrases", top.word, unlocked.length, total - full);
  unlocked.forEach(function(pr) {
    var remaining = pr.missing_words.filter(function(w) { return w !== top.word; });
    var note = remaining.length === 0 ? "→ FULLY RESOLVABLE" : "→ " + remaining.length + " word(s) still missing: " + remaining.join(", ");
    console.log("    %s %s", pr.id, note);
    console.log("      \"%s\"", pr.raw);
  });
}
console.log();

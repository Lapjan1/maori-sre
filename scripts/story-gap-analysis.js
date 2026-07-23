/**
 * Story Gap Analysis
 *
 * For each story sentence, tokenize and check every word against:
 *   1) SURFACE_FORM_INDEX (entity-driven)
 *   2) AUDIO_INDEX (dictionary fallback)
 *
 * Reports which words are missing, how frequently each missing word
 * appears across unresolved sentences, and which single acquisition
 * would unlock the most sentences.
 *
 * Usage: node scripts/story-gap-analysis.js
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

// Load data files
var DATA = path.join(__dirname, "..", "packages", "language-data");
var expPath = path.join(DATA, "experiences.js");
var sfPath = path.join(DATA, "surface_forms.js");
var aiPath = path.join(DATA, "audio_index.js");

var expSrc = fs.readFileSync(expPath, "utf8");
var sfSrc = fs.readFileSync(sfPath, "utf8");
var aiSrc = fs.readFileSync(aiPath, "utf8");

// Extract EXPERIENCES
eval(expSrc);
eval(sfSrc);
eval(aiSrc);

// Build entity → normalized Māori text map
var entityText = {};
Object.keys(SURFACE_FORM_INDEX).forEach(function(eid) {
  var idx = SURFACE_FORM_INDEX[eid];
  if (idx && idx.mi) {
    var sf = SURFACE_FORMS[idx.mi];
    if (sf && sf.text) {
      entityText[eid] = normalize(sf.text);
    }
  }
});

// Build reverse map: normalized text → entity_id
var textToEntity = {};
Object.keys(entityText).forEach(function(eid) {
  textToEntity[entityText[eid]] = eid;
});

// Extract stories, split into sentences
var stories = EXPERIENCES.filter(function(e) { return e.type === "story" || e.type === "observation" || e.type === "procedure" || e.type === "dialogue"; });

var allSentences = [];
stories.forEach(function(story) {
  var mi = story.content && story.content.mi;
  if (!mi) return;
  var raw = mi.replace(/["""]/g, "").trim();
  var sents = raw.split(/[.?!\n]+/).map(function(s) { return s.trim(); }).filter(Boolean);
  sents.forEach(function(s) {
    allSentences.push({ story_id: story.id, sentence: s });
  });
});

// Analyze each sentence
var summary = [];
var missingWords = {};
var sentenceResults = [];

allSentences.forEach(function(item) {
  var tokens = normalize(item.sentence).split(/\s+/).filter(Boolean);
  var resolved = [];
  var missing = [];

  tokens.forEach(function(t) {
    if (textToEntity[t]) {
      resolved.push({ word: t, source: "entity:" + textToEntity[t] });
    } else if (AUDIO_INDEX[t]) {
      resolved.push({ word: t, source: "audio_index" });
    } else {
      missing.push(t);
      missingWords[t] = (missingWords[t] || 0) + 1;
    }
  });

  sentenceResults.push({
    story_id: item.story_id,
    raw: item.sentence,
    normalized: tokens.join(" "),
    total: tokens.length,
    resolved: resolved.length,
    missing: missing.length,
    missing_words: missing,
    full: missing.length === 0,
  });
});

// Group by story
var byStory = {};
sentenceResults.forEach(function(sr) {
  if (!byStory[sr.story_id]) byStory[sr.story_id] = { total: 0, full: 0, partial: 0, sentences: [] };
  byStory[sr.story_id].total++;
  byStory[sr.story_id].sentences.push(sr);
  if (sr.full) byStory[sr.story_id].full++;
  else byStory[sr.story_id].partial++;
});

// Build cross-story missing word table
var wordAcrossStories = {};
sentenceResults.forEach(function(sr) {
  if (sr.missing_words.length === 0) return;
  var seen = {};
  sr.missing_words.forEach(function(w) {
    if (seen[w]) return;
    seen[w] = true;
    if (!wordAcrossStories[w]) wordAcrossStories[w] = { stories: {}, sentence_count: 0, total: 0 };
    wordAcrossStories[w].stories[sr.story_id] = true;
    wordAcrossStories[w].sentence_count++;
    wordAcrossStories[w].total++;
  });
});

// Output
console.log("══════════════════════════════════════════════════");
console.log("  STORY GAP ANALYSIS — Māori Atomic Resolution");
console.log("══════════════════════════════════════════════════\n");

Object.keys(byStory).sort().forEach(function(sid) {
  var s = byStory[sid];
  var pct = ((s.full / s.total) * 100).toFixed(0);
  var bar = "█".repeat(Math.round(s.full / s.total * 20)) + "░".repeat(20 - Math.round(s.full / s.total * 20));
  console.log("  %s  %s/%s  %s%  %s", bar, s.full, s.total, pct, sid);
  s.sentences.forEach(function(sr) {
    var icon = sr.full ? "✓" : "✗";
    console.log("    %s  [%s/%s]  %s", icon, sr.resolved, sr.total, sr.raw.substring(0, 60));
    if (!sr.full) {
      console.log("        missing: %s", sr.missing_words.join(", "));
    }
  });
  console.log();
});

// Priority list
console.log("──────────────────────────────────────────────");
console.log("  PRIORITY — Missing Words by Coverage Impact");
console.log("──────────────────────────────────────────────\n");

var ranked = Object.keys(wordAcrossStories)
  .map(function(w) {
    var info = wordAcrossStories[w];
    var storyCount = Object.keys(info.stories).length;
    return {
      word: w,
      stories: storyCount,
      sentences: info.sentence_count,
      total_mentions: info.total,
      story_list: Object.keys(info.stories).sort().join(", "),
      has_audio: !!AUDIO_INDEX[w],
      in_surface_forms: !!textToEntity[w],
    };
  })
  .sort(function(a, b) {
    if (b.stories !== a.stories) return b.stories - a.stories;
    return b.sentences - a.sentences;
  });

  function pad(s, n) { s = String(s); while (s.length < n) s += " "; return s; }
  console.log("  Rank  Word" + pad("", 8) + "Stories  Sentences  HasAudio  InEntities  Needs");
  console.log("  ----  ----" + pad("", 8) + "-------  ---------  --------  ----------  -----");
ranked.forEach(function(r, i) {
  var action = r.has_audio ? "entity" : "entity+audio";
  console.log("  #" + (i + 1) + "    " + pad(r.word, 12) + pad(r.stories, 5) + "    " + pad(r.sentences, 5) + "        " + pad(r.has_audio ? "yes" : "no", 8) + "  " + pad(r.in_surface_forms ? "yes" : "no", 10) + "  " + action);
});
console.log();

// If you acquire the top word
if (ranked.length > 0) {
  console.log("──────────────────────────────────────────────");
  console.log("  BEST NEXT ACQUISITION");
  console.log("──────────────────────────────────────────────\n");
  var top = ranked[0];
  var unlocked = sentenceResults.filter(function(sr) {
    return !sr.full && sr.missing_words.indexOf(top.word) !== -1;
  });
  console.log("  Acquire \"%s\" → unlocks %d sentences across %d stories:",
    top.word, unlocked.length, top.stories);
  unlocked.forEach(function(sr) {
    var story = byStory[sr.story_id];
    var after = sr.missing_words.filter(function(w) { return w !== top.word; });
    var remaining = after.length;
    var note = remaining === 0 ? "→ FULLY RESOLVABLE" : "→ " + remaining + " word(s) still missing: " + after.join(", ");
    console.log("    ✓ %s: %s", sr.story_id, note);
    console.log("      \"%s\"", sr.raw.substring(0, 70));
  });
  console.log();
  console.log("  After acquiring \"%s\":", top.word);
  var afterPct = {};
  var afterFull = {};
  Object.keys(byStory).sort().forEach(function(sid) {
    var oldFull = byStory[sid].full;
    var newFull = sentenceResults.filter(function(sr) {
      if (sr.story_id !== sid) return false;
      if (sr.full) return true;
      return sr.missing_words.length === 1 && sr.missing_words[0] === top.word;
    }).length;
    var pct = ((newFull / byStory[sid].total) * 100).toFixed(0);
    afterPct[sid] = pct;
    afterFull[sid] = newFull;
  });
  Object.keys(byStory).sort().forEach(function(sid) {
    var bar = "█".repeat(Math.round(afterFull[sid] / byStory[sid].total * 20)) + "░".repeat(20 - Math.round(afterFull[sid] / byStory[sid].total * 20));
    console.log("    %s  %s/%s  %s%  %s (+%d)", bar, afterFull[sid], byStory[sid].total, afterPct[sid], sid, afterFull[sid] - byStory[sid].full);
  });
  console.log();
}

// Full coverage table
console.log("──────────────────────────────────────────────");
console.log("  CURRENT COVERAGE");
console.log("──────────────────────────────────────────────\n");
var totalSentences = sentenceResults.length;
var fullSentences = sentenceResults.filter(function(s) { return s.full; }).length;
var pct = ((fullSentences / totalSentences) * 100).toFixed(1);
console.log("  %s/%s sentences fully resolvable (%s%%)", fullSentences, totalSentences, pct);
console.log("  %d unique missing words across all stories", ranked.length);
console.log();

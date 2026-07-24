/**
 * Check which Wife Core 20 words have audio files vs. TTS-only.
 */
var fs = require("fs");
var MACRONS = {"\u0101":"a","\u0113":"e","\u012b":"i","\u014d":"o","\u016b":"u"};
function norm(t) {
  var r = t.toLowerCase().trim();
  r = r.replace(/[^a-z\u0101\u0113\u012b\u014d\u016b\s-]/g, "");
  var o = "";
  for (var i = 0; i < r.length; i++) o += MACRONS[r[i]] || r[i];
  return o;
}

eval(fs.readFileSync("packages/language-data/surface_forms.js", "utf8"));
eval(fs.readFileSync("packages/language-data/audio_index.js", "utf8"));
eval(fs.readFileSync("packages/language-data/curriculum-wife.js", "utf8"));

// Collect all unique words from Wife 20 phrases
var allWords = {};
CORE_20.forEach(function(exp) {
  var mi = exp.title && exp.title.mi;
  if (!mi) return;
  var clean = mi.replace(/[?!.[\]()]/g, "").trim();
  var words = norm(clean).split(/\s+/).filter(Boolean);
  words.forEach(function(w) { allWords[w] = (allWords[w] || 0) + 1; });
});

console.log("WIFE 20 — Word Audio Coverage\n");
console.log("Word" + " ".repeat(14) + "Count  AudioFile      Status");
console.log("-".repeat(45));

var withAudio = 0, withoutAudio = 0;
Object.keys(allWords).sort().forEach(function(w) {
  var ai = AUDIO_INDEX[w];
  var file = ai ? (ai.filename || ai.file || "yes") : "—";
  var status = ai ? "HAS AUDIO" : "NO AUDIO / TTS";
  var count = allWords[w];
  if (ai) withAudio++; else withoutAudio++;
  var pad = 16 - w.length;
  if (pad < 1) pad = 1;
  console.log("  " + w + " ".repeat(pad) + count + "       " + file + " ".repeat(Math.max(1, 12 - file.length)) + status);
});

console.log("\nSummary: " + withAudio + " words with audio, " + withoutAudio + " words TTS-only");

// Also show phrase-level audio coverage
console.log("\n\nPHRASE-LEVEL AUDIO COVERAGE\n");
console.log("Phrase" + " ".repeat(28) + "HasPhraseAudio  WordAudioStatus");
console.log("-".repeat(60));

var fullAudio = 0, partialAudio = 0, noPhraseAudio = 0;
CORE_20.forEach(function(exp) {
  var mi = exp.title && exp.title.mi;
  if (!mi) return;
  var clean = mi.replace(/[?!.[\]()]/g, "").trim();
  var words = norm(clean).split(/\s+/).filter(Boolean);
  var allHaveAudio = words.every(function(w) { return !!AUDIO_INDEX[w]; });
  var status = allHaveAudio ? "ALL WORDS HAVE AUDIO" : "SOME WORDS MISSING";
  var pad = 38 - clean.length;
  if (pad < 1) pad = 1;
  console.log("  " + clean + " ".repeat(pad) + "—              " + status);
  if (allHaveAudio) fullAudio++; else partialAudio++;
});

console.log("\nSummary: " + fullAudio + "/20 phrases have full word-level audio, " + partialAudio + " have gaps");

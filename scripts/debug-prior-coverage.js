/**
 * Debug: compute coverage without the 10 session entities.
 */
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

var fs = require("fs");
var DATA = "C:\\Users\\dshan\\Downloads\\Maori\\packages\\language-data";
eval(fs.readFileSync(DATA + "\\surface_forms.js", "utf8"));
eval(fs.readFileSync(DATA + "\\audio_index.js", "utf8"));
eval(fs.readFileSync(DATA + "\\experiences.js", "utf8"));

var sessionEntities = [
  "PARTICLE_KUA","PARTICLE_TANA","STATE_TAHI","THING_RANGI",
  "STATE_TEITEI","ACTION_MAU","ACTION_WHAKAKIIA","ACTION_PIKI",
  "ACTION_TORO","PARTICLE_ATU"
];

// Build entity text map WITHOUT session entities
var entityText = {};
Object.keys(SURFACE_FORM_INDEX).forEach(function(eid) {
  if (sessionEntities.indexOf(eid) !== -1) return;
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

var fullCount = 0, totalCount = allSentences.length;
allSentences.forEach(function(item) {
  var tokens = normalize(item.sentence).split(/\s+/).filter(Boolean);
  var missing = tokens.filter(function(t) { return !textToEntity[t] && !AUDIO_INDEX[t]; });
  if (missing.length === 0) fullCount++;
});

console.log("Prior coverage (without 10 session entities): " + fullCount + "/" + totalCount);

// Check how many pre-session entities have mi text
var miCount = 0;
Object.keys(SURFACE_FORM_INDEX).forEach(function(eid) {
  if (sessionEntities.indexOf(eid) !== -1) return;
  var idx = SURFACE_FORM_INDEX[eid];
  if (idx && idx.mi) {
    var sf = SURFACE_FORMS[idx.mi];
    if (sf && sf.text) miCount++;
  }
});
console.log("Pre-session entities in SURFACE_FORM_INDEX: " + Object.keys(SURFACE_FORM_INDEX).length);
console.log("Pre-session entities with mi text: " + miCount);

// Also print the mi texts to see what's available
console.log("\nPre-session mi texts:");
Object.keys(entityText).forEach(function(eid) {
  console.log("  " + eid + " => \"" + entityText[eid] + "\"");
});

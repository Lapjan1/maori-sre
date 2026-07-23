/**
 * Find Te Aka word IDs by searching the live website.
 *
 * Usage: node scripts/find-word-ids.js
 */
var https = require("https");

var TARGETS = [
  // word, expected type/description
  ["ratou", "rātou"],
  ["tetahi", "tētahi"],
  ["ko", "ko"],
  ["kua", "kua"],
  ["tana", "tāna"],
  ["tahi", "tahi (noho tahi)"],
  ["rangi", "rangi"],
  ["teitei", "teitei"],
  ["mau", "mau"],
  ["piki", "piki"],
];

var wordIdCandidates = {};
// Pronouns cluster around 1642-2700
// Let's check known ranges
var KNOWN = {
  "ia": 1641, "koe": 2694, "koutou": 2695, "ka": 1828, "i": 1640,
  "te": 7876, "ki": 2596, "ke": 2514, "he": 1022, "no": 4426,
  "mo": 4117, "ra": 6403, "e": 602, "mai": 3474, "kia": 2583,
  "kore": 2989, "ana": 206, "o": 4695, "taha": 7038
};

function fetchWordPage(wordId) {
  return new Promise(function(resolve, reject) {
    var url = "https://maoridictionary.co.nz/word/" + wordId;
    https.get(url, { timeout: 10000 }, function(res) {
      var data = "";
      res.on("data", function(chunk) { data += chunk; });
      res.on("end", function() {
        resolve({ wordId: wordId, html: data });
      });
    }).on("error", function(err) {
      reject(err);
    });
  });
}

function extractWordFromPage(html) {
  // Look for the word heading: <h2 class="title  ">WORD</h2>
  var match = html.match(/<h2 class="title\s*">([^<]+)<\/h2>/);
  if (match) return match[1].trim().toLowerCase();
  return null;
}

function extractTypeFromPage(html) {
  var match = html.match(/<strong>\(([^)]+)\)<\/strong>/);
  if (match) return match[1].toLowerCase();
  return null;
}

async function main() {
  var results = {};

  // Try all word IDs from 1600 to 1620 (before ia=1641)
  // and around common ranges
  var ranges = [
    [1600, 1660],   // ia cluster
    [2680, 2720],   // koe/koutou cluster
    [1800, 1860],   // ka cluster
    [7800, 7900],   // te cluster
    [100, 300],     // early words (ana=206)
    [6000, 7100],   // later words (ra=6403, taha=7038)
    [4600, 4750],   // o=4695
    [200, 230],     // ana
    [1000, 1100],   // he=1022
    [2400, 2700],   // kei=2514, kia=2583, ki=2596
    [4400, 4450],   // no=4426
    [4100, 4130],   // mo=4117
    [2900, 3100],   // kore=2989
  ];

  var found = {};

  for (var ri = 0; ri < ranges.length; ri++) {
    var start = ranges[ri][0];
    var end = ranges[ri][1];
    console.log("Scanning range " + start + "–" + end + "...");

    for (var wid = start; wid <= end; wid++) {
      try {
        var result = await fetchWordPage(wid);
        var word = extractWordFromPage(result.html);
        if (word) {
          if (!found[word]) found[word] = [];
          found[word].push(wid);
          // Check if this is one of our targets
          TARGETS.forEach(function(t) {
            var normalized = t[0];
            if (word.indexOf(normalized) !== -1 && !results[normalized]) {
              results[normalized] = { wordId: wid, word: word, desc: t[1] };
            }
          });
        }
      } catch(e) {
        // skip
      }
    }
  }

  console.log("\n═══════════════════════════════════════");
  console.log("  FOUND WORD IDs");
  console.log("═══════════════════════════════════════\n");
  TARGETS.forEach(function(t) {
    var key = t[0];
    if (results[key]) {
      console.log("  %s → word/%s (%s)", key, results[key].wordId, results[key].desc);
    } else {
      console.log("  %s → NOT FOUND", key);
    }
  });
  console.log();
}

main().catch(console.error);

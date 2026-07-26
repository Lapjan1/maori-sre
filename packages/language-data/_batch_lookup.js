const https = require('https');
const fs = require('fs');

// Words to look up: common Māori words missing from audio_index
const words = [
  'kupu', 'whai', 'iwi', 'me', 'tino', 'hei', 'mea', 'wa',
  'muri', 'hou', 'tohu', 'tonu', 'ina', 'ranei', 'mua',
  'mama', 'neke', 'tuatahi', 'etahi', 'tikanga', 'tuku',
  'tono', 'oati', 'ahurea'
];

function fetch(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { timeout: 8000 }, (res) => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => resolve({ status: res.statusCode, data, url: res.headers.location || url }));
    }).on('error', reject);
  });
}

async function main() {
  // Use the Te Aka search page which returns a page with the word link
  for (const word of words) {
    const url = `https://maoridictionary.co.nz/search?&keywords=${encodeURIComponent(word)}`;
    const result = await fetch(url);
    if (result.status !== 200) {
      console.log(`${word}: HTTP ${result.status}`);
      continue;
    }
    // Extract word_id from the search results: look for /word/\d+
    const matches = result.data.match(/maoridictionary\.co\.nz\/word\/(\d+)/);
    if (matches) {
      console.log(`${word}: ${matches[1]}`);
    } else {
      console.log(`${word}: NO_ID`);
    }
  }
}

main().catch(console.error);

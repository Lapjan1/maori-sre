const CACHE = "river-world-v19";
const URLS = [
  "index.html",
  "app.js",
  "session.js",
  "audio.js",
  "packages/language-data/curriculum-wife.js",
  "packages/language-data/experiences.js",
  "packages/language-data/surface_forms.js",
  "packages/language-data/voice_packages.js",
  "packages/language-data/audio_index.js",
  "packages/language-data/afrikaans-phrases.js",
  "manifest.json",
];

self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(CACHE).then((c) => c.addAll(URLS))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((ks) => Promise.all(
      ks.filter((k) => k !== CACHE).map((k) => caches.delete(k))
    ))
  );
  self.clients.claim();
});

self.addEventListener("fetch", (e) => {
  e.respondWith(
    caches.match(e.request).then((r) => r || fetch(e.request))
  );
});

const CACHE = "river-world-v10";
const URLS = [
  "index.html",
  "app.js",
  "audio_index.js",
  "session.js",
  "audio.js",
  "surface_forms.js",
  "voice_packages.js",
  "experiences.js",
  "curriculum-wife.js",
  "curriculum-river.js",
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

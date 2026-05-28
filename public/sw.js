// RecallOS service worker — enables installability + a fast offline shell.
// Deliberately conservative: never caches API responses or the /share handler.
const CACHE = "recallos-v2";
const SHELL = [
  "/dashboard",
  "/inbox",
  "/capture",
  "/manifest.webmanifest",
  "/icon.svg",
];

self.addEventListener("install", (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(SHELL).catch(() => undefined)),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;

  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;
  // Always hit the network for API calls and the share-target handler.
  if (url.pathname.startsWith("/api") || url.pathname.startsWith("/share")) return;

  // Network-first for page navigations, with an offline shell fallback.
  if (req.mode === "navigate") {
    event.respondWith(
      fetch(req).catch(() =>
        caches.match(req).then((cached) => cached || caches.match("/dashboard")),
      ),
    );
    return;
  }

  // Cache-first for static same-origin assets.
  event.respondWith(caches.match(req).then((cached) => cached || fetch(req)));
});

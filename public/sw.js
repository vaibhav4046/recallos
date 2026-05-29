// Musemint service worker — enables installability + a fast offline shell.
// Deliberately conservative: never caches API responses or the /share handler.
const CACHE = "musemint-v1";
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

// --- Notifications -------------------------------------------------------
// Used by both the in-app local alert (registration.showNotification) and, once
// VAPID keys are configured server-side, real Web Push delivered while the app
// is closed. The payload shape is { title, body, url }.
self.addEventListener("push", (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch {
    data = { body: event.data && event.data.text ? event.data.text() : "" };
  }
  const title = data.title || "Musemint";
  const options = {
    body: data.body || "You have saved ideas waiting.",
    icon: "/icon-192.png",
    badge: "/icon-192.png",
    tag: data.tag || "musemint-digest",
    data: { url: data.url || "/inbox" },
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const target = (event.notification.data && event.notification.data.url) || "/inbox";
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => {
      for (const client of clients) {
        if ("focus" in client) {
          return Promise.resolve(
            "navigate" in client ? client.navigate(target).catch(() => undefined) : undefined,
          ).then(() => client.focus());
        }
      }
      return self.clients.openWindow(target);
    }),
  );
});

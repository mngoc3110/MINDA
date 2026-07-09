// MINDA Service Worker — Cache-first for static assets, network-first for API
const CACHE_NAME = "minda-v2";
const STATIC_ASSETS = [
  "/manifest.json",
  "/logo.png",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
];

// Install: cache static assets
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

// Activate: clean old caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Fetch: network-first for API, cache-first for static
self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  // Skip non-GET requests and unsupported protocols (like chrome-extension://)
  if (event.request.method !== "GET" || !url.protocol.startsWith("http")) return;

  // API calls: always network
  if (url.pathname.startsWith("/api")) return;

  // HTML Pages (Next.js Pages): Always Network First!
  if (event.request.mode === "navigate") {
     event.respondWith(
       fetch(event.request).catch(() => caches.match(event.request))
     );
     return;
  }

  // Static assets: cache-first
  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      return fetch(event.request).then((response) => {
        if (response.ok && response.type === "basic" && url.protocol.startsWith("http")) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, clone).catch(() => {});
          });
        }
        return response;
      }).catch(() => null);
    })
  );
});

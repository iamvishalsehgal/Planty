// Planty service worker — precache shell + stale-while-revalidate
const CACHE = "planty-v3.0.2";
const PRECACHE_URLS = ["/", "/index.html", "/offline.html"];

// Precache core app shell assets on install
self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(PRECACHE_URLS))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (e) => {
  if (e.request.method !== "GET") return;

  e.respondWith(
    caches.open(CACHE).then((cache) =>
      cache.match(e.request).then((cached) => {
        const fetchPromise = fetch(e.request)
          .then((response) => {
            if (response.ok) cache.put(e.request, response.clone());
            return response;
          })
          .catch(() => cached);

        // Return cached immediately, update in background
        return cached || fetchPromise;
      })
      .catch(() => {
        // If navigation request fails (offline, not cached), serve fallback
        if (e.request.mode === "navigate") {
          return cache.match("/offline.html");
        }
        throw new Error("offline");
      })
    )
  );
});

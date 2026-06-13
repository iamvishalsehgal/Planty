const CACHE = 'planty-v4.2';
const SHELL = ['/manifest.json', '/icon-512.png', '/favicon.svg'];

// Install — pre-cache static assets (NOT index.html — always network-first)
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE).then(cache => cache.addAll(SHELL).catch(e => {
            console.warn('SW: failed to cache some shell assets', e);
        }))
    );
    self.skipWaiting();
});

// Activate — clean old caches, claim clients
self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(keys =>
            Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
        ).then(() => self.clients.claim())
    );
});

// Fetch — network-first for HTML, cache-first for assets, network-only for API
self.addEventListener('fetch', event => {
    if (event.request.method !== 'GET') return;
    const url = new URL(event.request.url);

    // Never cache API calls
    if (url.pathname.startsWith('/api/')) return;

    // Navigation requests (HTML pages) — network-first, cache fallback
    if (event.request.mode === 'navigate') {
        event.respondWith(
            fetch(event.request).then(response => {
                // Cache the fresh response for offline fallback
                if (response.ok && response.type === 'basic') {
                    const clone = response.clone();
                    caches.open(CACHE).then(cache => cache.put(event.request, clone));
                }
                return response;
            }).catch(() => caches.match(event.request))
        );
        return;
    }

    // Static assets — cache-first, network fallback
    event.respondWith(
        caches.match(event.request).then(cached =>
            cached || fetch(event.request).then(response => {
                if (response.ok && response.type === 'basic') {
                    const clone = response.clone();
                    caches.open(CACHE).then(cache => cache.put(event.request, clone));
                }
                return response;
            })
        )
    );
});

// Notification trigger from main page
self.addEventListener('message', event => {
    if (event.data && event.data.type === 'NOTIFY_PLANTS') {
        const plants = event.data.plants || [];
        plants.forEach(plant => {
            self.registration.showNotification('Planty 🌱', {
                body: plant.message,
                icon: '/icon-512.png',
                badge: '/icon-512.png',
                tag: `plant-${plant.id}`,
                renotify: true,
                vibrate: [200, 100, 200],
                data: { url: self.location.origin }
            });
        });
    }
});

// Notification click — focus or open window
self.addEventListener('notificationclick', event => {
    event.notification.close();
    event.waitUntil(
        clients.matchAll({ type: 'window' }).then(clientList => {
            if (clientList.length > 0) return clientList[0].focus();
            return clients.openWindow(event.notification.data.url || '/');
        })
    );
});

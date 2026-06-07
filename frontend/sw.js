const CACHE = 'planty-v3.9';
const SHELL = ['/', '/index.html', '/manifest.json', '/icon-512.png', '/icon-512.png'];

// Install — pre-cache app shell
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE).then(cache => cache.addAll(SHELL))
    );
    self.skipWaiting();
});

// Activate — clean old caches
self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(keys =>
            Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
        ).then(() => self.clients.claim())
    );
});

// Fetch — cache-first with network fallback
self.addEventListener('fetch', event => {
    if (event.request.method !== 'GET') return;
    event.respondWith(
        caches.match(event.request).then(cached =>
            cached || fetch(event.request).then(response => {
                // Cache successful same-origin responses
                if (response.ok && new URL(event.request.url).origin === self.location.origin) {
                    const clone = response.clone();
                    caches.open(CACHE).then(cache => cache.put(event.request, clone));
                }
                return response;
            }).catch(() => {
                // Offline fallback — return cached index for navigation requests
                if (event.request.mode === 'navigate') {
                    return caches.match('/index.html');
                }
                return new Response('Offline', { status: 503 });
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

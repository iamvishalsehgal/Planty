self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', e => e.waitUntil(self.clients.claim()));

// Listen for notification trigger messages from the main page
self.addEventListener('message', event => {
    if (event.data && event.data.type === 'NOTIFY_PLANTS') {
        const plants = event.data.plants || [];
        plants.forEach(plant => {
            self.registration.showNotification('Planty 🌱', {
                body: plant.message,
                icon: '/favicon.ico',
                badge: '/favicon.ico',
                tag: `plant-${plant.id}`,
                renotify: true,
                data: { url: self.location.origin }
            });
        });
    }
});

self.addEventListener('notificationclick', event => {
    event.notification.close();
    event.waitUntil(
        clients.matchAll({ type: 'window' }).then(clientList => {
            if (clientList.length > 0) return clientList[0].focus();
            return clients.openWindow(event.notification.data.url || '/');
        })
    );
});

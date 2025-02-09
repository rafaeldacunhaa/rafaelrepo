const CACHE_NAME = 'cronnaclimba-v1';
const urlsToCache = [
  '/',
  '/js/script.js',
  '/js/components/Timer.js',
  '/js/components/UIManager.js',
  '/js/components/BlocoManager.js',
  '/js/components/NotificationManager.js',
  '/js/services/AudioService.js',
  '/js/services/ThemeService.js',
  '/js/services/WorkerService.js',
  '/js/data/templates.js',
  '/css/styles.css',
  '/tempo-acabando.mp3',
  '/tempo-esgotado.mp3'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Cache aberto');
        return cache.addAll(urlsToCache);
      })
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        if (response) {
          return response;
        }
        return fetch(event.request);
      })
  );
});

self.addEventListener('activate', (event) => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window' })
      .then((clientList) => {
        for (const client of clientList) {
          if (client.url === '/' && 'focus' in client) {
            return client.focus();
          }
        }
        if (clients.openWindow) {
          return clients.openWindow('/');
        }
      })
  );
}); 
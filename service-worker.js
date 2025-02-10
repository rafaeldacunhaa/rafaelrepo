const CACHE_NAME = 'cronnaclimba-v2';
const urlsToCache = [
  './',
  './css/styles.css',
  './tempo-acabando.mp3',
  './tempo-esgotado.mp3'
];

// Arquivos que não devem ser cacheados
const noCacheFiles = [
  './js/script.js',
  './js/components/Timer.js',
  './js/components/UIManager.js',
  './js/components/BlocoManager.js',
  './js/components/NotificationManager.js',
  './js/services/AudioService.js',
  './js/services/ThemeService.js',
  './js/services/WorkerService.js',
  './js/data/templates.js'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Cache aberto');
        return cache.addAll(urlsToCache).catch(error => {
          console.error('Erro ao adicionar arquivos ao cache:', error);
          return Promise.all(
            urlsToCache.map(url =>
              cache.add(url).catch(err => {
                console.error(`Erro ao adicionar ${url} ao cache:`, err);
                return Promise.resolve();
              })
            )
          );
        });
      })
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    (async () => {
      // Para arquivos que não devem ser cacheados, sempre buscar da rede
      if (noCacheFiles.some(file => event.request.url.includes(file))) {
        try {
          return await fetch(event.request);
        } catch (error) {
          console.error('Erro ao buscar arquivo da rede:', error);
          return caches.match(event.request);
        }
      }

      // Para outros arquivos, tentar cache primeiro
      const cachedResponse = await caches.match(event.request);
      if (cachedResponse) {
        return cachedResponse;
      }

      try {
        return await fetch(event.request);
      } catch (error) {
        console.error('Erro ao buscar arquivo:', error);
        return new Response('Erro de rede', { status: 503 });
      }
    })()
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
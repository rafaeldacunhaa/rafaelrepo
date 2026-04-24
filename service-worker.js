// Substitui o SW antigo (que usava cache-first). Ao ativar, apaga todos os
// caches, se desregistra e força reload das janelas abertas para que voltem a
// usar a rede diretamente. Manter este arquivo no repositório por tempo
// indefinido — qualquer cliente que ainda tenha o SW antigo registrado vai
// buscá-lo ao checar update e só assim termina de ser limpo.
self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    try {
      const cacheNames = await caches.keys();
      await Promise.all(cacheNames.map((name) => caches.delete(name)));
    } catch (error) {
      console.error('Erro ao apagar caches:', error);
    }

    try {
      await self.registration.unregister();
    } catch (error) {
      console.error('Erro ao desregistrar service worker:', error);
    }

    try {
      const clientsList = await self.clients.matchAll({ type: 'window' });
      await Promise.all(
        clientsList.map((client) =>
          client.navigate(client.url).catch((err) =>
            console.error('Erro ao recarregar cliente:', err)
          )
        )
      );
    } catch (error) {
      console.error('Erro ao listar clientes:', error);
    }
  })());
});

self.addEventListener('fetch', (event) => {
  event.respondWith(fetch(event.request));
});

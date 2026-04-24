// Compat shim: nenhum service worker é registrado.
// Mantido apenas para apagar SW antigos e caches que ainda podem estar instalados nos clientes.
export class WorkerService {
    constructor() {
        this.cleanup();
    }
    async cleanup() {
        try {
            if ('serviceWorker' in navigator) {
                const registrations = await navigator.serviceWorker.getRegistrations();
                await Promise.all(registrations.map((reg) => reg.unregister()));
            }
            if ('caches' in window) {
                const cacheNames = await caches.keys();
                await Promise.all(cacheNames.map((name) => caches.delete(name)));
            }
        }
        catch (error) {
            console.error('Erro ao limpar Service Worker / caches:', error);
        }
    }
}
//# sourceMappingURL=WorkerService.js.map

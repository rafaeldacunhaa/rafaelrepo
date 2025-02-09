export class WorkerService {
    constructor() {
        this.worker = null;
        this.registration = null;
        this.registerServiceWorker();
    }
    async getRegistration() {
        if (!this.registration) {
            this.registration = await this.registerServiceWorker();
        }
        return this.registration;
    }
    async registerServiceWorker() {
        if ('serviceWorker' in navigator) {
            try {
                const registration = await navigator.serviceWorker.register('./service-worker.js');
                console.log('Service Worker registrado com sucesso:', registration);
                registration.addEventListener('updatefound', () => {
                    const newWorker = registration.installing;
                    if (newWorker) {
                        newWorker.addEventListener('statechange', () => {
                            if (newWorker.state === 'installed') {
                                if (navigator.serviceWorker.controller) {
                                    this.notifyUpdate();
                                }
                            }
                        });
                    }
                });
                if (registration.waiting) {
                    this.notifyUpdate();
                }
                this.registration = registration;
                return registration;
            }
            catch (error) {
                console.error('Erro ao registrar Service Worker:', error);
                return null;
            }
        }
        return null;
    }
    notifyUpdate() {
        const updateNotification = document.getElementById('updateNotification');
        if (updateNotification) {
            updateNotification.classList.remove('hidden');
            const updateButton = updateNotification.querySelector('#updateButton');
            if (updateButton) {
                updateButton.addEventListener('click', () => {
                    window.location.reload();
                });
            }
        }
    }
}
//# sourceMappingURL=WorkerService.js.map
export class WorkerService {
    private worker: ServiceWorker | null = null;
    private registration: ServiceWorkerRegistration | null = null;

    constructor() {
        this.registerServiceWorker();
    }

    public async getRegistration(): Promise<ServiceWorkerRegistration | null> {
        if (!this.registration) {
            this.registration = await this.registerServiceWorker();
        }
        return this.registration;
    }

    private async registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
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
            } catch (error) {
                console.error('Erro ao registrar Service Worker:', error);
                return null;
            }
        }
        return null;
    }

    private notifyUpdate(): void {
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
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
export class WorkerService {
    constructor() {
        this.worker = null;
        this.registration = null;
        this.registerServiceWorker();
    }
    getRegistration() {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.registration) {
                this.registration = yield this.registerServiceWorker();
            }
            return this.registration;
        });
    }
    registerServiceWorker() {
        return __awaiter(this, void 0, void 0, function* () {
            if ('serviceWorker' in navigator) {
                try {
                    const registration = yield navigator.serviceWorker.register('./service-worker.js');
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
        });
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
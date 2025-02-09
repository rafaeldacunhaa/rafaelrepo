var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
export class NotificationManager {
    constructor(workerService) {
        this.titleInterval = null;
        this.originalTitle = document.title;
        this.workerService = workerService;
        this.setupNotifications();
    }
    setupNotifications() {
        return __awaiter(this, void 0, void 0, function* () {
            if (!('Notification' in window)) {
                console.log('Notificações não são suportadas neste navegador');
                return;
            }
            if (Notification.permission === 'default') {
                yield Notification.requestPermission();
            }
        });
    }
    startTitleAlert(message) {
        if (this.titleInterval) {
            clearInterval(this.titleInterval);
        }
        let isOriginal = true;
        document.title = `🔔 ${message}`;
        this.titleInterval = window.setInterval(() => {
            document.title = isOriginal ? `🔔 ${message}` : this.originalTitle;
            isOriginal = !isOriginal;
        }, 1000);
    }
    sendNotification(message) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!("Notification" in window))
                return;
            if (Notification.permission === "granted") {
                try {
                    const registration = yield this.workerService.getRegistration();
                    if (!registration) {
                        throw new Error('Service Worker não registrado');
                    }
                    yield registration.showNotification("⏰ CronnaClimba 2.0", {
                        body: message,
                        icon: "https://www.climba.dev/wp-content/uploads/2019/09/climba_rgb-01-300x100.png",
                        badge: "https://www.climba.dev/wp-content/uploads/2019/09/climba_rgb-01-300x100.png",
                        vibrate: [200, 100, 200, 100, 200],
                        tag: 'timer-notification',
                        renotify: true,
                        requireInteraction: true,
                        silent: false
                    });
                }
                catch (e) {
                    // Fallback para notificação simples
                    new Notification("⏰ CronnaClimba 2.0", {
                        body: message,
                        icon: "https://www.climba.dev/wp-content/uploads/2019/09/climba_rgb-01-300x100.png"
                    });
                }
            }
        });
    }
    stopTitleAlert() {
        if (this.titleInterval) {
            clearInterval(this.titleInterval);
            this.titleInterval = null;
            document.title = this.originalTitle;
        }
    }
}
//# sourceMappingURL=NotificationManager.js.map
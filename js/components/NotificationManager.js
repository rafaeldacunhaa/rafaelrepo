export class NotificationManager {
    constructor() {
        this.titleInterval = null;
        this.originalTitle = document.title;
        this.setupNotifications();
    }
    async setupNotifications() {
        if (!('Notification' in window)) {
            console.log('Notificações não são suportadas neste navegador');
            return;
        }
        if (Notification.permission === 'default') {
            await Notification.requestPermission();
        }
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
    async sendNotification(message) {
        if (!("Notification" in window))
            return;
        if (Notification.permission !== "granted")
            return;
        try {
            const notification = new Notification("⏰ CronnaClimba 2.0", {
                body: message,
                icon: "https://www.climba.dev/wp-content/uploads/2019/09/climba_rgb-01-300x100.png",
                tag: 'timer-notification',
                requireInteraction: true,
                silent: false
            });
            notification.onclick = () => {
                window.focus();
                notification.close();
            };
        }
        catch (e) {
            console.error('Erro ao exibir notificação:', e);
        }
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

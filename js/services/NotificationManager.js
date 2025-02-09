export class NotificationManager {
    constructor() {
        this.titleInterval = null;
        this.originalTitle = document.title;
        this.requestNotificationPermission();
    }
    async requestNotificationPermission() {
        try {
            if (!('Notification' in window)) {
                console.log('Este navegador não suporta notificações desktop');
                return;
            }
            if (Notification.permission !== 'granted') {
                const permission = await Notification.requestPermission();
                console.log('Permissão de notificação:', permission);
            }
        }
        catch (error) {
            console.error('Erro ao solicitar permissão de notificação:', error);
        }
    }
    startTitleAlert(message) {
        if (this.titleInterval) {
            this.stopTitleAlert();
        }
        let isOriginal = true;
        this.titleInterval = window.setInterval(() => {
            document.title = isOriginal ? message : this.originalTitle;
            isOriginal = !isOriginal;
        }, 1000);
    }
    stopTitleAlert() {
        if (this.titleInterval) {
            clearInterval(this.titleInterval);
            this.titleInterval = null;
            document.title = this.originalTitle;
        }
    }
    sendNotification(message) {
        try {
            if (!('Notification' in window)) {
                console.log('Este navegador não suporta notificações desktop');
                return;
            }
            if (Notification.permission === 'granted') {
                new Notification('CronnaClimba', {
                    body: message,
                    icon: 'https://cdn-icons-png.flaticon.com/512/147/147186.png'
                });
            }
        }
        catch (error) {
            console.error('Erro ao enviar notificação:', error);
        }
    }
}
//# sourceMappingURL=NotificationManager.js.map
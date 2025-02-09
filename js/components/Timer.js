"use strict";
class Timer {
    constructor() {
        this.endTime = null;
        this.duration = 0;
        this.interval = null;
        this.playedWarning = false;
        this.playedEnd = false;
        this.titleInterval = null;
        this.isPageVisible = true;
        this.isPaused = false;
        this.timeDisplay = document.getElementById('timeDisplay');
        this.progressBar = document.getElementById('progressBar');
        this.timerContainer = document.getElementById('timerRunning');
        this.audioService = new window.AudioService();
        this.originalTitle = document.title;
        console.log('Timer inicializado!');
        // Adicionar listener de visibilidade
        document.addEventListener('visibilitychange', () => {
            this.isPageVisible = !document.hidden;
        });
    }
    start(milliseconds, onEnd) {
        // Limpar título e intervalos anteriores
        if (this.titleInterval) {
            clearInterval(this.titleInterval);
            document.title = this.originalTitle;
        }
        this.duration = milliseconds;
        this.endTime = Date.now() + milliseconds;
        this.playedWarning = false;
        this.playedEnd = false;
        this.onEnd = onEnd;
        if (this.interval) {
            clearInterval(this.interval);
        }
        // Limpar estados visuais
        this.timerContainer.classList.remove('timer-ending', 'timer-ended');
        this.timeDisplay.classList.remove('blink', 'text-yellow-500', 'text-red-500');
        this.interval = window.setInterval(() => this.tick(), 100);
        this.timerContainer.classList.remove('hidden');
    }
    tick() {
        if (!this.endTime)
            return;
        const remaining = this.endTime - Date.now();
        this.updateDisplay(remaining);
        this.updateProgress(remaining);
        // Verificar alertas
        if (remaining <= this.duration * 0.1 && !this.playedWarning && remaining > 0) {
            this.handleTimeWarning();
        }
        if (remaining <= 0 && !this.playedEnd) {
            this.handleTimeEnd();
            if (this.onEnd) {
                this.onEnd();
            }
        }
    }
    handleTimeWarning() {
        this.playedWarning = true;
        this.timerContainer.classList.add('timer-ending');
        this.timeDisplay.classList.add('text-yellow-500');
        this.audioService.playSound('tempoAcabandoSound', {
            volume: 0.6,
            repeat: 2,
            interval: 2000
        });
    }
    handleTimeEnd() {
        this.playedEnd = true;
        this.timerContainer.classList.remove('timer-ending');
        this.timerContainer.classList.add('timer-ended');
        this.timeDisplay.classList.add('text-red-500', 'blink');
        // Adicionar verificação de som anterior
        if (this.isPageVisible) {
            const audio = document.getElementById('tempoEsgotadoSound');
            if (audio && !audio.paused) { // Verificar se não está tocando
                this.audioService.playSound('tempoEsgotadoSound', {
                    volume: 0.8,
                    repeat: 3,
                    interval: 1500
                });
            }
        }
        // Atualizar título
        this.startTitleAlert('⏰ TEMPO ESGOTADO!');
        // Enviar notificação
        this.sendNotification('Tempo finalizado!');
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
        if (!("Notification" in window))
            return;
        if (Notification.permission === "granted") {
            try {
                navigator.serviceWorker.ready.then(registration => {
                    registration.showNotification("⏰ CronnaClimba 2.0", {
                        body: message,
                        icon: "https://www.climba.dev/wp-content/uploads/2019/09/climba_rgb-01-300x100.png",
                        badge: "https://www.climba.dev/wp-content/uploads/2019/09/climba_rgb-01-300x100.png",
                        vibrate: [200, 100, 200, 100, 200],
                        tag: 'timer-notification',
                        renotify: true,
                        requireInteraction: true,
                        silent: false
                    });
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
    }
    updateDisplay(remaining) {
        const absRemaining = Math.abs(remaining);
        const isNegative = remaining < 0;
        const minutes = Math.floor(absRemaining / 60000);
        const seconds = Math.floor((absRemaining % 60000) / 1000);
        this.timeDisplay.textContent = `${isNegative ? '-' : ''}${minutes}:${seconds.toString().padStart(2, '0')}`;
    }
    updateProgress(remaining) {
        const progress = ((this.duration - remaining) / this.duration) * 100;
        this.progressBar.style.width = `${Math.min(100, Math.max(0, progress))}%`;
    }
    stop() {
        if (this.interval) {
            clearInterval(this.interval);
            this.interval = null;
        }
        this.timerContainer.classList.add('hidden');
        this.timerContainer.classList.remove('timer-ending', 'timer-ended');
        this.timeDisplay.classList.remove('blink', 'text-yellow-500', 'text-red-500');
        if (this.titleInterval) {
            clearInterval(this.titleInterval);
            document.title = this.originalTitle;
        }
    }
    reset() {
        this.stop();
        this.endTime = null;
        this.duration = 0;
        this.playedWarning = false;
        this.playedEnd = false;
        this.isPaused = false;
        this.updateDisplay(0);
        this.updateProgress(0);
    }
    pause() {
        if (this.interval) {
            clearInterval(this.interval);
            this.interval = null;
        }
        this.isPaused = true;
    }
    resume() {
        if (!this.isPaused || !this.endTime)
            return;
        const remaining = this.endTime - Date.now();
        this.start(remaining);
        this.isPaused = false;
    }
}
// Tornar o Timer disponível globalmente
window.Timer = Timer;

class Timer {
    private timeDisplay: HTMLElement;
    private progressBar: HTMLElement;
    private timerContainer: HTMLElement;
    private endTime: number | null = null;
    private duration: number = 0;
    private interval: number | null = null;
    private audioService: any; // Será instanciado no construtor
    private playedWarning: boolean = false;
    private playedEnd: boolean = false;
    private onEnd?: () => void;  // Callback para quando o timer terminar
    private originalTitle: string;
    private titleInterval: number | null = null;
    private isPageVisible: boolean = true;
    private isPaused: boolean = false;

    constructor() {
        this.timeDisplay = document.getElementById('timeDisplay')!;
        this.progressBar = document.getElementById('progressBar')!;
        this.timerContainer = document.getElementById('timerRunning')!;
        this.audioService = new (window as any).AudioService();
        this.originalTitle = document.title;
        console.log('Timer inicializado!');

        // Adicionar listener de visibilidade
        document.addEventListener('visibilitychange', () => {
            this.isPageVisible = !document.hidden;
        });
    }

    start(milliseconds: number, onEnd?: () => void): void {
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

    private tick(): void {
        if (!this.endTime) return;
        
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

    private handleTimeWarning(): void {
        this.playedWarning = true;
        this.timerContainer.classList.add('timer-ending');
        this.timeDisplay.classList.add('text-yellow-500');
        this.audioService.playSound('tempoAcabandoSound', { 
            volume: 0.6, 
            repeat: 2, 
            interval: 2000 
        });
    }

    private handleTimeEnd(): void {
        this.playedEnd = true;
        this.timerContainer.classList.remove('timer-ending');
        this.timerContainer.classList.add('timer-ended');
        this.timeDisplay.classList.add('text-red-500', 'blink');
        
        if (this.isPageVisible) {
            const audio = document.getElementById('tempoEsgotadoSound') as HTMLAudioElement;
            if (audio && audio.paused) {
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

    private startTitleAlert(message: string): void {
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

    private sendNotification(message: string): void {
        if (!("Notification" in window)) return;

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
            } catch (e) {
                // Fallback para notificação simples
                new Notification("⏰ CronnaClimba 2.0", {
                    body: message,
                    icon: "https://www.climba.dev/wp-content/uploads/2019/09/climba_rgb-01-300x100.png"
                });
            }
        }
    }

    private updateDisplay(remaining: number): void {
        const absRemaining = Math.abs(remaining);
        const isNegative = remaining < 0;
        const minutes = Math.floor(absRemaining / 60000);
        const seconds = Math.floor((absRemaining % 60000) / 1000);
        this.timeDisplay.textContent = `${isNegative ? '-' : ''}${minutes}:${seconds.toString().padStart(2, '0')}`;
    }

    private updateProgress(remaining: number): void {
        const progress = ((this.duration - remaining) / this.duration) * 100;
        this.progressBar.style.width = `${Math.min(100, Math.max(0, progress))}%`;
    }

    stop(): void {
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

    reset(): void {
        this.stop();
        this.endTime = null;
        this.duration = 0;
        this.playedWarning = false;
        this.playedEnd = false;
        this.isPaused = false;
        this.updateDisplay(0);
        this.updateProgress(0);
    }

    pause(): void {
        if (this.interval) {
            clearInterval(this.interval);
            this.interval = null;
        }
        this.isPaused = true;
    }

    resume(): void {
        if (!this.isPaused || !this.endTime) return;
        
        const remaining = this.endTime - Date.now();
        this.start(remaining);
        this.isPaused = false;
    }
}

// Tornar o Timer disponível globalmente
(window as any).Timer = Timer; 
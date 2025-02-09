import { TimerEvents, TimerStatus, TimerCallback, AudioServiceInterface, NotificationManagerInterface } from '../types/Timer.types';

export class Timer {
    private endTime: number | null = null;
    private duration: number = 0;
    private interval: number | null = null;
    private playedWarning: boolean = false;
    private playedEnd: boolean = false;
    private titleInterval: number | null = null;
    private isPageVisible: boolean = true;
    private isPaused: boolean = false;
    private timeDisplay: HTMLElement;
    private progressBar: HTMLElement;
    private timerContainer: HTMLElement;
    private audioService: AudioServiceInterface;
    private notificationManager: NotificationManagerInterface;
    private originalTitle: string;
    private callbacks: Map<keyof TimerEvents, TimerCallback<any>[]>;
    private status: TimerStatus = 'stopped';
    private onEnd?: () => void;

    constructor(audioService: AudioServiceInterface, notificationManager: NotificationManagerInterface) {
        this.audioService = audioService;
        this.notificationManager = notificationManager;
        this.timeDisplay = document.getElementById('timeDisplay') as HTMLElement;
        this.progressBar = document.getElementById('progressBar') as HTMLElement;
        this.timerContainer = document.getElementById('timerRunning') as HTMLElement;
        this.originalTitle = document.title;
        this.callbacks = new Map();

        document.addEventListener('visibilitychange', () => {
            this.isPageVisible = !document.hidden;
        });

        console.log('Timer inicializado!');
    }

    on<K extends keyof TimerEvents>(event: K, callback: TimerCallback<TimerEvents[K]>): void {
        if (!this.callbacks.has(event)) {
            this.callbacks.set(event, []);
        }
        this.callbacks.get(event)?.push(callback);
    }

    private emit<K extends keyof TimerEvents>(event: K, data: TimerEvents[K]): void {
        const callbacks = this.callbacks.get(event) || [];
        callbacks.forEach(callback => callback(data));
    }

    start(milliseconds: number, onEnd?: () => void): void {
        if (this.titleInterval) {
            clearInterval(this.titleInterval);
            document.title = this.originalTitle;
        }
        
        this.timerContainer.classList.remove('hidden');
        
        this.duration = milliseconds;
        this.endTime = Date.now() + milliseconds;
        this.playedWarning = false;
        this.playedEnd = false;
        this.onEnd = onEnd;
        
        if (this.interval) {
            clearInterval(this.interval);
        }
        
        this.timerContainer.classList.remove('timer-ending', 'timer-ended');
        this.timeDisplay.classList.remove('blink', 'text-yellow-500', 'text-red-500');
        
        this.updateDisplay(milliseconds);
        this.updateProgress(milliseconds);
        
        this.interval = window.setInterval(() => this.tick(), 100);
        this.status = 'running';
        this.emit('start', { duration: milliseconds });
    }

    private tick(): void {
        if (!this.endTime) return;
        
        const remaining = this.endTime - Date.now();
        this.updateDisplay(remaining);
        this.updateProgress(remaining);

        if (remaining <= this.duration * 0.1 && !this.playedWarning && remaining > 0) {
            this.handleTimeWarning();
        }
        
        if (remaining <= 0 && !this.playedEnd) {
            this.handleTimeEnd();
            if (this.onEnd) {
                this.onEnd();
            }
        }
        
        this.emit('tick', { remaining });
    }

    private handleTimeWarning(): void {
        this.playedWarning = true;
        this.timerContainer.classList.add('timer-ending');
        this.timeDisplay.classList.add('text-yellow-500');
        this.audioService.playSound('tempoAcabandoSound', {
            volume: 1,
            repeat: 2,
            interval: 500
        });
    }

    private handleTimeEnd(): void {
        this.playedEnd = true;
        this.timerContainer.classList.remove('timer-ending');
        this.timerContainer.classList.add('timer-ended');
        this.timeDisplay.classList.add('text-red-500', 'blink');
        
        // Tocar o som sempre, independente da visibilidade
        this.audioService.playSound('tempoEsgotadoSound', {
            volume: 1,
            repeat: 2,
            interval: 1000
        });
        
        // Alterar título sempre
        this.notificationManager.startTitleAlert('⏰ TEMPO ESGOTADO!');
        
        // Enviar notificação do browser apenas se a página não estiver visível
        if (!this.isPageVisible) {
            this.notificationManager.sendNotification('Tempo finalizado!');
        }
        
        this.emit('timeUp', { remaining: 0 });
    }

    private updateDisplay(remaining: number): void {
        const absRemaining = Math.abs(remaining);
        const isNegative = remaining < 0;
        const minutes = Math.floor(absRemaining / 60000);
        const seconds = Math.floor((absRemaining % 60000) / 1000);
        this.timeDisplay.textContent = `${isNegative ? '-' : ''}${minutes}:${seconds.toString().padStart(2, '0')}`;
    }

    private updateProgress(remaining: number): void {
        if (!this.duration) return;
        
        // Garantir que os números são tratados como números
        const remainingNum = Number(remaining);
        const durationNum = Number(this.duration);
        
        let progress;
        const isTimeOver = remainingNum <= 0;
        
        if (isTimeOver) {
            progress = 100;
        } else {
            // Calcular o tempo decorrido desde o início
            const timeElapsed = durationNum - remainingNum;
            // Calcular a porcentagem com precisão de 2 casas decimais
            progress = Number((timeElapsed / durationNum * 100).toFixed(2));
        }
        
        // Garantir que o progresso esteja entre 0 e 100
        progress = Math.min(100, Math.max(0, progress));
        
        // Aplicar o progresso com unidade % e forçar atualização do estilo
        this.progressBar.style.cssText = `width: ${progress}% !important; transition: width 0.3s linear;`;
        
        // Debug
        console.log('Debug Progresso:', {
            duration: durationNum,
            remaining: remainingNum,
            isTimeOver: isTimeOver,
            progress: progress
        });
    }

    stop(): void {
        if (this.interval) {
            clearInterval(this.interval);
            this.interval = null;
        }
        
        this.timerContainer.classList.add('hidden');
        this.timerContainer.classList.remove('timer-ending', 'timer-ended');
        this.timeDisplay.classList.remove('blink', 'text-yellow-500', 'text-red-500');
        
        // Parar a animação do título
        this.notificationManager.stopTitleAlert();
        
        this.status = 'stopped';
        this.emit('stop', undefined);
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
        this.notificationManager.stopTitleAlert();
    }

    pause(): void {
        if (this.status === 'running') {
            if (this.interval) {
                clearInterval(this.interval);
            }
            this.status = 'paused';
            this.isPaused = true;
            this.emit('pause', undefined);
        }
    }

    resume(): void {
        if (this.status === 'paused' && this.endTime) {
            this.isPaused = false;
            const remaining = this.endTime - Date.now();
            this.endTime = Date.now() + remaining;
            this.interval = window.setInterval(() => this.tick(), 100);
            this.status = 'running';
            this.emit('start', { duration: remaining });
        }
    }

    getStatus(): TimerStatus {
        return this.status;
    }

    getRemaining(): number {
        if (!this.endTime) return 0;
        return Math.max(0, this.endTime - Date.now());
    }
}

// Tornar o Timer disponível globalmente
(window as any).Timer = Timer; 
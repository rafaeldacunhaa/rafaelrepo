import { TimerEvents, TimerStatus, TimerCallback, AudioServiceInterface, NotificationManagerInterface } from '../types/Timer.types';
import { PiPController } from './PiPController.js';
import { TitleManager } from './TitleManager.js';

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
    private callbacks: Map<string, Function[]> = new Map();
    private status: TimerStatus = 'stopped';
    private onEnd?: () => void;
    private pipController: PiPController;
    private titleManager: TitleManager;
    private lastEndSound: number = 0;
    private readonly END_SOUND_INTERVAL = 5 * 60 * 1000; // 5 minutos em milissegundos
    private lastUpdateTime: number = 0;

    constructor(audioService: AudioServiceInterface, notificationManager: NotificationManagerInterface) {
        this.audioService = audioService;
        this.notificationManager = notificationManager;
        this.timeDisplay = document.getElementById('timeDisplay') as HTMLElement;
        this.progressBar = document.getElementById('progressBar') as HTMLElement;
        this.timerContainer = document.getElementById('timerRunning') as HTMLElement;
        this.originalTitle = document.title;
        this.pipController = new PiPController();
        this.titleManager = new TitleManager();

        document.addEventListener('visibilitychange', () => {
            this.isPageVisible = !document.hidden;
        });

        // Atualizar PiP quando o timer atualizar
        this.on('tick', () => this.updatePiP());
        this.on('stop', () => {
            this.pipController.close();
            this.titleManager.reset();
        });
        this.on('pause', () => this.updatePiP());
        this.on('start', () => this.updatePiP());

        console.log('Timer inicializado!');
    }

    private emit(event: string, ...args: any[]): void {
        const eventCallbacks = this.callbacks.get(event);
        if (eventCallbacks) {
            eventCallbacks.forEach(callback => callback(...args));
        }
    }

    private on(event: string, callback: Function): void {
        if (!this.callbacks.has(event)) {
            this.callbacks.set(event, []);
        }
        this.callbacks.get(event)?.push(callback);
    }

    private off(event: string, callback: Function): void {
        const eventCallbacks = this.callbacks.get(event);
        if (eventCallbacks) {
            const index = eventCallbacks.indexOf(callback);
            if (index !== -1) {
                eventCallbacks.splice(index, 1);
            }
        }
    }

    start(milliseconds: number, onEnd?: () => void): void {
        this.cleanup(); // Limpa recursos anteriores
        
        this.timerContainer.classList.remove('hidden');
        
        this.duration = milliseconds;
        this.endTime = Date.now() + milliseconds;
        this.playedWarning = false;
        this.playedEnd = false;
        this.onEnd = onEnd;
        this.lastUpdateTime = milliseconds;
        
        this.timerContainer.classList.remove('timer-ending', 'timer-ended');
        this.timeDisplay.classList.remove('blink', 'text-yellow-500', 'text-red-500');
        
        this.updateDisplay(milliseconds);
        this.updateProgress(milliseconds);
        
        this.interval = window.setInterval(() => this.tick(), 250); // Reduzido para 250ms
        this.status = 'running';
        this.emit('start', { duration: milliseconds });
    }

    private tick(): void {
        if (this.status !== 'running' || !this.endTime) return;

        const remaining = this.getRemaining();
        
        // Aviso quando falta 10% do tempo
        if (remaining <= this.duration * 0.1 && !this.playedWarning && remaining > 0) {
            this.handleTimeWarning();
        }
        
        // Quando o tempo acaba
        if (remaining <= 0) {
            if (!this.playedEnd) {
                this.handleTimeEnd();
            } else {
                // Tocar som novamente a cada 5 minutos após o término
                const timeSinceLastSound = Date.now() - this.lastEndSound;
                if (timeSinceLastSound >= this.END_SOUND_INTERVAL) {
                    this.playEndSound();
                }
            }
        }

        // Atualiza a UI apenas se houver mudança significativa (a cada segundo)
        if (Math.floor(remaining / 1000) !== Math.floor(this.lastUpdateTime / 1000)) {
            this.updateDisplay(remaining);
            this.updateProgress(remaining);
            this.emit('tick', remaining);
            this.lastUpdateTime = remaining;
        }
    }

    private handleTimeWarning(): void {
        this.playedWarning = true;
        this.timerContainer.classList.add('timer-ending');
        this.timeDisplay.classList.add('text-[#151634]');
        this.audioService.playSound('tempoAcabandoSound', {
            volume: 1,
            repeat: 2,
            interval: 500
        });
    }

    private playEndSound(): void {
        this.audioService.playSound('tempoEsgotadoSound', {
            volume: 1,
            repeat: 2,
            interval: 1000
        });
        this.lastEndSound = Date.now();
    }

    private async handleTimeEnd(): Promise<void> {
        this.playedEnd = true;
        this.timerContainer.classList.remove('timer-ending');
        this.timerContainer.classList.add('timer-ended');
        this.timeDisplay.classList.remove('text-[#151634]');
        this.timeDisplay.classList.add('text-red-500', 'blink');
        
        this.playEndSound();
        
        if (!this.isPageVisible) {
            this.titleManager.startBlinking('⏰ TEMPO ESGOTADO!');
            this.notificationManager.sendNotification('Tempo finalizado!');
        }
        
        const nextBlocoButtonGreen = document.getElementById('nextBlocoButtonGreen');
        if (nextBlocoButtonGreen) {
            nextBlocoButtonGreen.classList.remove('hidden');
        }
        
        if (this.onEnd) {
            this.onEnd();
        }
    }

    private updateDisplay(remaining: number): void {
        const absRemaining = Math.abs(remaining);
        const isNegative = remaining < 0;
        const minutes = Math.floor(absRemaining / 60000);
        const seconds = Math.floor((absRemaining % 60000) / 1000);
        const timeStr = `${isNegative ? '-' : ''}${minutes}:${seconds.toString().padStart(2, '0')}`;
        this.timeDisplay.textContent = timeStr;
        this.titleManager.updateTimeRemaining(timeStr);
    }

    private updateProgress(remaining: number): void {
        if (!this.duration) return;
        
        const remainingNum = Number(remaining);
        const durationNum = Number(this.duration);
        
        let progress;
        const isTimeOver = remainingNum <= 0;
        
        if (isTimeOver) {
            progress = 100;
        } else {
            const timeElapsed = durationNum - remainingNum;
            progress = Number((timeElapsed / durationNum * 100).toFixed(2));
        }
        
        progress = Math.min(100, Math.max(0, progress));
        
        this.progressBar.style.cssText = `width: ${progress}% !important; transition: width 0.3s linear;`;
    }

    stop(): void {
        this.cleanup();
        
        this.timerContainer.classList.add('hidden');
        this.timerContainer.classList.remove('timer-ending', 'timer-ended');
        this.timeDisplay.classList.remove('blink', 'text-[#151634]', 'text-red-500');
        
        const nextBlocoButtonGreen = document.getElementById('nextBlocoButtonGreen');
        if (nextBlocoButtonGreen) {
            nextBlocoButtonGreen.classList.add('hidden');
        }
        
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
        this.titleManager.reset();
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
        return this.endTime - Date.now();
    }

    private updatePiP(): void {
        this.pipController.updateInfo({
            timeDisplay: this.timeDisplay.textContent || '',
            blocoName: this.getCurrentBlocoName(),
            status: this.status,
            duration: this.duration,
            remaining: this.getRemaining(),
            progress: this.getProgressPercentage()
        });
    }

    private getCurrentBlocoName(): string {
        const blocoName = document.getElementById('currentBlocoName');
        return blocoName?.textContent || '';
    }

    private getProgressPercentage(): number {
        if (!this.duration || !this.endTime) return 0;
        const remaining = this.endTime - Date.now();
        const progress = ((this.duration - remaining) / this.duration) * 100;
        return Math.min(100, Math.max(0, progress));
    }

    private cleanup(): void {
        if (this.interval) {
            clearInterval(this.interval);
            this.interval = null;
        }
        if (this.titleInterval) {
            clearInterval(this.titleInterval);
            this.titleInterval = null;
            document.title = this.originalTitle;
        }
        
        // Limpa callbacks antigos
        this.callbacks.clear();
        
        // Reseta o PiP e Title
        this.pipController.close();
        this.titleManager.reset();
    }
}

(window as any).Timer = Timer; 
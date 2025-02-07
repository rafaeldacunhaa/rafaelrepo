import { TimerConfig, TimerStatus, TimerEvents } from '../types/Timer.types';
import { NotificationService } from '../services/NotificationService';
import { AudioService } from '../services/AudioService';

export class Timer {
    private currentTime: number;
    private duration: number;
    private status: TimerStatus;
    private interval?: number;
    
    private readonly notificationService: NotificationService;
    private readonly audioService: AudioService;

    constructor(config: TimerConfig) {
        this.currentTime = 0;
        this.duration = config.duration || 0;
        this.status = 'idle';
        this.notificationService = new NotificationService();
        this.audioService = new AudioService();
    }

    public start(): void {
        if (this.status === 'running') return;
        
        this.status = 'running';
        this.interval = window.setInterval(() => this.tick(), 100);
    }

    private tick(): void {
        this.currentTime += 100;
        
        if (this.currentTime >= this.duration) {
            this.handleTimeEnd();
        } else if (this.isNearingEnd()) {
            this.handleTimeWarning();
        }
        
        this.updateDisplay();
    }

    private handleTimeEnd(): void {
        this.status = 'ended';
        this.audioService.playSound('tempoEsgotadoSound');
        this.notificationService.notify('Tempo finalizado!');
        clearInterval(this.interval);
    }

    private isNearingEnd(): boolean {
        return this.currentTime >= this.duration * 0.9;
    }

    private updateDisplay(): void {
        // Lógica de atualização do display
    }
} 
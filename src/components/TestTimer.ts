import { TestTimerStatus, TestTimerConfig } from '../types/TestTimer.types';

export class TestTimer {
    private status: TestTimerStatus = 'idle';
    private element: HTMLElement;
    private duration: number;
    private remaining: number;
    private interval?: number;

    constructor(config: TestTimerConfig) {
        this.element = config.element;
        this.duration = config.duration;
        this.remaining = config.duration;
    }

    start(): void {
        if (this.status === 'running') return;
        
        this.status = 'running';
        this.interval = window.setInterval(() => {
            this.remaining -= 1000;
            this.updateDisplay();
            
            if (this.remaining <= 0) {
                this.stop();
            }
        }, 1000);
    }

    stop(): void {
        if (this.interval) {
            clearInterval(this.interval);
        }
        this.status = 'ended';
    }

    private updateDisplay(): void {
        const minutes = Math.floor(this.remaining / 60000);
        const seconds = Math.floor((this.remaining % 60000) / 1000);
        this.element.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }
} 
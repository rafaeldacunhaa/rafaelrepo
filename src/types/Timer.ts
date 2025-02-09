export interface Timer {
    start(milliseconds: number, onComplete?: () => void): void;
    stop(): void;
    reset(): void;
    pause(): void;
    resume(): void;
    getStatus(): 'running' | 'paused' | 'stopped';
} 
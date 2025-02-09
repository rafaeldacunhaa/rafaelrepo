export interface TimerOptions {
    volume?: number;
    repeat?: number;
    interval?: number;
}

export interface TimerEvents {
    start: { duration: number };
    tick: { remaining: number };
    timeUp: { remaining: number };
    pause: void;
    stop: void;
}

export type TimerStatus = 'stopped' | 'running' | 'paused';

export interface TimerCallback<T> {
    (data: T): void;
}

export interface AudioServiceInterface {
    playSound: (soundId: string, options?: TimerOptions) => void;
    stopSound: (soundId: string) => void;
}

export interface NotificationManagerInterface {
    startTitleAlert: (message: string) => void;
    sendNotification: (message: string) => void;
    stopTitleAlert: () => void;
} 
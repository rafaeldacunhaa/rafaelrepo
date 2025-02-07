export type TestTimerStatus = 'idle' | 'running' | 'paused' | 'ended';

export interface TestTimerConfig {
    duration: number;
    element: HTMLElement;
} 
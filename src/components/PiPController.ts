import { PiPManager } from './PiPManager.js';
import { TimerStatus } from '../types/Timer.types';
import type { PiPInfo } from './PiPManager.js';

export class PiPController {
    private pipManager: PiPManager;
    private pipButton: HTMLElement | null;

    constructor() {
        this.pipManager = new PiPManager();
        this.pipButton = document.getElementById('pipButton');
        this.setupPiPButton();
    }

    private setupPiPButton(): void {
        if (this.pipButton) {
            this.pipButton.addEventListener('click', () => this.togglePiP());
        }
    }

    public async togglePiP(): Promise<void> {
        if (this.pipManager.isOpen()) {
            this.pipManager.close();
            this.updatePiPButton(false);
            return;
        }

        await this.pipManager.open(this.getLastInfo());
        this.updatePiPButton(true);
    }

    private lastInfo: PiPInfo | null = null;

    public updateInfo(info: {
        timeDisplay: string;
        blocoName: string;
        status: TimerStatus;
        duration: number;
        remaining: number;
        progress: number;
    }): void {
        this.lastInfo = info;
        if (this.pipManager.isOpen()) {
            this.pipManager.update(info);
        }
    }

    private getLastInfo(): PiPInfo {
        return this.lastInfo || {
            timeDisplay: '0:00',
            blocoName: 'Timer em execução',
            status: 'stopped',
            duration: 0,
            remaining: 0,
            progress: 0
        };
    }

    public close(): void {
        this.pipManager.close();
        this.updatePiPButton(false);
    }

    private updatePiPButton(isOpen: boolean): void {
        if (this.pipButton) {
            const icon = this.pipButton.querySelector('i');
            if (icon) {
                icon.setAttribute('data-lucide', isOpen ? 'picture-in-picture-off' : 'picture-in-picture-2');
                (window as any).lucide.createIcons();
            }
        }
    }
} 
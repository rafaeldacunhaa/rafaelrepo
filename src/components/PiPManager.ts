export interface PiPInfo {
    timeDisplay: string;
    blocoName: string;
    status: 'running' | 'paused' | 'stopped';
    duration: number;
    remaining: number;
    progress: number;
}

export class PiPManager {
    private pipWindow: any = null;
    private updateCallbacks: Set<() => void> = new Set();

    public async open(initialInfo: PiPInfo): Promise<void> {
        if (this.pipWindow) {
            return;
        }

        try {
            if ('documentPictureInPicture' in window) {
                this.pipWindow = await (window as any).documentPictureInPicture.requestWindow({
                    width: 400,
                    height: 300
                });

                this.setupStyles();
                this.renderContent(initialInfo);
            }
        } catch (error) {
            console.log('Picture-in-Picture não suportado:', error);
        }
    }

    public close(): void {
        if (this.pipWindow) {
            this.pipWindow.close();
            this.pipWindow = null;
            this.updateCallbacks.clear();
        }
    }

    public isOpen(): boolean {
        return this.pipWindow !== null;
    }

    public update(info: PiPInfo): void {
        if (!this.pipWindow) return;

        const container = this.pipWindow.document.querySelector('.pip-container');
        const timeElement = this.pipWindow.document.querySelector('.time');
        const progressElement = this.pipWindow.document.querySelector('.progress-fill');
        const statusElement = this.pipWindow.document.querySelector('.status');
        const messageElement = this.pipWindow.document.querySelector('.message');
        const infoElements = this.pipWindow.document.querySelectorAll('.info');

        // Atualizar classes do timer baseado no estado
        if (timeElement) {
            timeElement.className = 'time';
            if (info.remaining <= info.duration * 0.1 && info.remaining > 0) {
                timeElement.classList.add('warning');
                container?.classList.add('timer-ending');
            } else {
                container?.classList.remove('timer-ending');
            }
            if (info.remaining <= 0) {
                timeElement.classList.add('ended', 'blink');
            }
        }

        if (timeElement) timeElement.textContent = info.timeDisplay;
        if (messageElement) messageElement.textContent = info.blocoName || 'Timer em execução';
        if (progressElement) progressElement.style.width = `${info.progress}%`;
        if (statusElement) statusElement.textContent = this.getStatusText(info.status);

        const endTime = new Date(Date.now() + info.remaining);
        const endTimeStr = endTime.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
        const totalMinutes = Math.ceil(info.duration / 1000 / 60);
        const remainingMinutes = Math.ceil(info.remaining / 1000 / 60);

        if (infoElements[0]) infoElements[0].textContent = `Duração total: ${totalMinutes} minutos`;
        if (infoElements[1]) infoElements[1].textContent = `Restante: ${remainingMinutes} minutos (${Math.round(info.progress)}%)`;
        if (infoElements[2]) infoElements[2].textContent = `Término previsto: ${endTimeStr}`;
    }

    private setupStyles(): void {
        const style = document.createElement('style');
        style.textContent = `
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

            body { 
                margin: 0; 
                display: flex; 
                align-items: center; 
                justify-content: center;
                background: white; /* bg-white */
                color: rgb(31 41 55); /* text-gray-800 */
                font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji";
            }

            @media (prefers-color-scheme: dark) {
                body {
                    background: rgb(17 24 39); /* dark:bg-gray-800 */
                    color: rgb(243 244 246); /* dark:text-gray-100 */
                }
            }

            .pip-container {
                text-align: center;
                padding: 20px;
                width: 100%;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                min-height: 100vh;
            }

            .time {
                font-size: 64px;
                font-weight: 700;
                line-height: 1;
                margin-bottom: 16px;
                font-variant-numeric: tabular-nums;
                transition: color 0.3s;
            }

            .time.warning {
                color: #151634 !important;
            }

            .time.ended {
                color: rgb(239 68 68) !important; /* text-red-500 */
            }

            .time.blink {
                animation: blink 1s infinite;
            }

            @keyframes blink {
                0% { opacity: 1; }
                50% { opacity: 0.5; }
                100% { opacity: 1; }
            }

            .message {
                font-size: 24px;
                font-weight: 600;
                color: rgb(31 41 55); /* text-gray-800 */
                margin-bottom: 12px;
            }

            @media (prefers-color-scheme: dark) {
                .message {
                    color: rgb(243 244 246); /* dark:text-gray-100 */
                }
            }

            .info {
                font-size: 14px;
                color: rgb(107 114 128); /* text-gray-500 */
                margin-bottom: 4px;
            }

            @media (prefers-color-scheme: dark) {
                .info {
                    color: rgb(156 163 175); /* dark:text-gray-400 */
                }
            }

            .status {
                display: inline-block;
                padding: 4px 8px;
                border-radius: 6px;
                background: rgb(243 244 246); /* bg-gray-100 */
                color: rgb(75 85 99); /* text-gray-600 */
                font-size: 12px;
                font-weight: 500;
                margin-bottom: 12px;
            }

            @media (prefers-color-scheme: dark) {
                .status {
                    background: rgb(55 65 81); /* dark:bg-gray-700 */
                    color: rgb(209 213 219); /* dark:text-gray-300 */
                }
            }

            .progress-container {
                width: 100%;
                max-width: 400px;
                height: 6px;
                background: rgb(229 231 235); /* bg-gray-200 */
                border-radius: 9999px;
                overflow: hidden;
                margin-top: 24px;
            }

            @media (prefers-color-scheme: dark) {
                .progress-container {
                    background: rgb(55 65 81); /* dark:bg-gray-700 */
                }
            }

            .progress-fill {
                height: 100%;
                background: #151634;
                border-radius: 9999px;
                transition: width 0.3s linear;
            }

            .timer-ending .progress-fill {
                animation: pulse 2s infinite;
            }

            @keyframes pulse {
                0% { opacity: 1; }
                50% { opacity: 0.7; }
                100% { opacity: 1; }
            }
        `;
        this.pipWindow.document.head.appendChild(style);
    }

    private renderContent(info: PiPInfo): void {
        const container = document.createElement('div');
        container.className = 'pip-container';

        const endTime = new Date(Date.now() + info.remaining);
        const endTimeStr = endTime.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
        const totalMinutes = Math.ceil(info.duration / 1000 / 60);
        const remainingMinutes = Math.ceil(info.remaining / 1000 / 60);

        const timeClasses = ['time'];
        if (info.remaining <= info.duration * 0.1 && info.remaining > 0) {
            timeClasses.push('warning');
            container.classList.add('timer-ending');
        }
        if (info.remaining <= 0) {
            timeClasses.push('ended', 'blink');
        }

        container.innerHTML = `
            <div class="status">${this.getStatusText(info.status)}</div>
            <div class="${timeClasses.join(' ')}">${info.timeDisplay}</div>
            <div class="message">${info.blocoName || 'Timer em execução'}</div>
            <div class="info">Duração total: ${totalMinutes} minutos</div>
            <div class="info">Restante: ${remainingMinutes} minutos (${Math.round(info.progress)}%)</div>
            <div class="info">Término previsto: ${endTimeStr}</div>
            <div class="progress-container">
                <div class="progress-fill" style="width: ${info.progress}%"></div>
            </div>
        `;
        this.pipWindow.document.body.appendChild(container);
    }

    private getStatusText(status: 'running' | 'paused' | 'stopped'): string {
        switch (status) {
            case 'running':
                return '▶️ Em execução';
            case 'paused':
                return '⏸️ Pausado';
            case 'stopped':
                return '⏹️ Parado';
            default:
                return '';
        }
    }
} 
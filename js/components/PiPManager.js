export class PiPManager {
    constructor() {
        this.pipWindow = null;
        this.updateCallbacks = new Set();
    }
    async open(initialInfo) {
        if (this.pipWindow) {
            return;
        }
        try {
            if ('documentPictureInPicture' in window) {
                this.pipWindow = await window.documentPictureInPicture.requestWindow({
                    width: 400,
                    height: 300
                });
                this.setupStyles();
                this.renderContent(initialInfo);
            }
        }
        catch (error) {
            console.log('Picture-in-Picture não suportado:', error);
        }
    }
    close() {
        if (this.pipWindow) {
            this.pipWindow.close();
            this.pipWindow = null;
            this.updateCallbacks.clear();
        }
    }
    isOpen() {
        return this.pipWindow !== null;
    }
    update(info) {
        if (!this.pipWindow)
            return;
        const timeElement = this.pipWindow.document.querySelector('.time');
        const progressElement = this.pipWindow.document.querySelector('.progress-fill');
        const statusElement = this.pipWindow.document.querySelector('.status');
        const messageElement = this.pipWindow.document.querySelector('.message');
        const infoElements = this.pipWindow.document.querySelectorAll('.info');
        if (timeElement)
            timeElement.textContent = info.timeDisplay;
        if (messageElement)
            messageElement.textContent = info.blocoName || 'Timer em execução';
        if (progressElement)
            progressElement.style.width = `${info.progress}%`;
        if (statusElement)
            statusElement.textContent = this.getStatusText(info.status);
        const endTime = new Date(Date.now() + info.remaining);
        const endTimeStr = endTime.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
        const totalMinutes = Math.ceil(info.duration / 1000 / 60);
        const remainingMinutes = Math.ceil(info.remaining / 1000 / 60);
        if (infoElements[0])
            infoElements[0].textContent = `Duração total: ${totalMinutes} minutos`;
        if (infoElements[1])
            infoElements[1].textContent = `Restante: ${remainingMinutes} minutos (${Math.round(info.progress)}%)`;
        if (infoElements[2])
            infoElements[2].textContent = `Término previsto: ${endTimeStr}`;
    }
    setupStyles() {
        const style = document.createElement('style');
        style.textContent = `
            body { 
                margin: 0; 
                display: flex; 
                align-items: center; 
                justify-content: center;
                background: #151634;
                color: white;
                font-family: system-ui;
            }
            .pip-container {
                text-align: center;
                padding: 20px;
                width: 100%;
            }
            .time {
                font-size: 48px;
                font-weight: bold;
                margin-bottom: 10px;
                font-variant-numeric: tabular-nums;
            }
            .message {
                font-size: 18px;
                opacity: 0.9;
                margin-bottom: 8px;
            }
            .info {
                font-size: 14px;
                opacity: 0.7;
                margin-bottom: 4px;
            }
            .status {
                display: inline-block;
                padding: 4px 8px;
                border-radius: 4px;
                background: rgba(255,255,255,0.1);
                font-size: 12px;
                margin-bottom: 12px;
            }
            .progress-bar {
                width: 100%;
                height: 6px;
                background: rgba(255,255,255,0.2);
                border-radius: 3px;
                margin-top: 15px;
            }
            .progress-fill {
                height: 100%;
                background: white;
                border-radius: 3px;
                transition: width 0.3s linear;
            }
        `;
        this.pipWindow.document.head.appendChild(style);
    }
    renderContent(info) {
        const container = document.createElement('div');
        container.className = 'pip-container';
        const endTime = new Date(Date.now() + info.remaining);
        const endTimeStr = endTime.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
        const totalMinutes = Math.ceil(info.duration / 1000 / 60);
        const remainingMinutes = Math.ceil(info.remaining / 1000 / 60);
        container.innerHTML = `
            <div class="status">${this.getStatusText(info.status)}</div>
            <div class="time">${info.timeDisplay}</div>
            <div class="message">${info.blocoName || 'Timer em execução'}</div>
            <div class="info">Duração total: ${totalMinutes} minutos</div>
            <div class="info">Restante: ${remainingMinutes} minutos (${Math.round(info.progress)}%)</div>
            <div class="info">Término previsto: ${endTimeStr}</div>
            <div class="progress-bar">
                <div class="progress-fill" style="width: ${info.progress}%"></div>
            </div>
        `;
        this.pipWindow.document.body.appendChild(container);
    }
    getStatusText(status) {
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
//# sourceMappingURL=PiPManager.js.map
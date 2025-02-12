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
                    width: 300,
                    height: 200
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
        const container = this.pipWindow.document.querySelector('.pip-container');
        const timeElement = this.pipWindow.document.querySelector('.time');
        const progressElement = this.pipWindow.document.querySelector('.progress-fill');
        const statusElement = this.pipWindow.document.querySelector('.status');
        const messageElement = this.pipWindow.document.querySelector('.message');
        const nextBlockElement = this.pipWindow.document.querySelector('.next-block');
        const nextBlockTitleElement = this.pipWindow.document.querySelector('.next-block-title');
        const body = this.pipWindow.document.body;
        // Atualizar classes do timer baseado no estado
        if (timeElement) {
            timeElement.className = 'time';
            if (info.remaining <= info.duration * 0.1 && info.remaining > 0) {
                body.classList.add('timer-ending');
                body.classList.remove('timer-ended');
            }
            else if (info.remaining <= 0) {
                body.classList.add('timer-ended');
                body.classList.remove('timer-ending');
            }
            else {
                body.classList.remove('timer-ending', 'timer-ended');
            }
        }
        if (timeElement)
            timeElement.textContent = info.timeDisplay;
        if (messageElement)
            messageElement.textContent = info.blocoName || 'Timer em execução';
        if (progressElement)
            progressElement.style.width = `${info.progress}%`;
        if (statusElement)
            statusElement.textContent = this.getStatusText(info.status);
        // Atualizar próximo bloco
        const nextBlock = this.getNextBlock();
        if (nextBlockElement && nextBlockTitleElement) {
            if (nextBlock) {
                nextBlockTitleElement.textContent = nextBlock;
                nextBlockElement.style.display = 'block';
            }
            else {
                nextBlockElement.style.display = 'none';
            }
        }
    }
    setupStyles() {
        const style = document.createElement('style');
        style.textContent = `
            body { 
                margin: 0; 
                display: flex; 
                align-items: center; 
                justify-content: center;
                background: white;
                color: rgb(31 41 55);
                font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif;
                min-height: 100vh;
                transition: background-color 0.3s ease;
            }

            body.timer-ending {
                background: #151634 !important;
                color: white !important;
            }

            body.timer-ended {
                background: rgb(239 68 68) !important;
                color: white !important;
            }

            @media (prefers-color-scheme: dark) {
                body {
                    background: rgb(17 24 39);
                    color: rgb(243 244 246);
                }
            }

            .pip-container {
                text-align: center;
                padding: 12px;
                width: 100%;
                display: grid;
                grid-template-columns: 1fr;
                grid-gap: 8px;
                align-items: center;
                justify-items: center;
            }

            .status {
                display: inline-block;
                padding: 2px 6px;
                border-radius: 4px;
                background: rgba(255, 255, 255, 0.2);
                color: currentColor;
                font-size: 11px;
                font-weight: 500;
                backdrop-filter: blur(4px);
            }

            .time {
                font-size: 48px;
                font-weight: 700;
                line-height: 1;
                font-variant-numeric: tabular-nums;
                transition: color 0.3s;
                margin: 4px 0;
                color: currentColor;
            }

            .message {
                font-size: 14px;
                font-weight: 600;
                margin: 0;
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
                color: currentColor;
            }

            .next-block {
                font-size: 11px;
                opacity: 0.7;
                margin-top: 8px;
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
                width: 100%;
                text-align: center;
                color: currentColor;
                padding: 4px;
                border-radius: 4px;
                background: rgba(255, 255, 255, 0.1);
            }

            .next-block-label {
                font-weight: 600;
                margin-right: 4px;
                opacity: 0.8;
            }

            .next-block-title {
                font-weight: 500;
            }

            .progress-container {
                width: 100%;
                height: 4px;
                background: rgba(0, 0, 0, 0.1);
                border-radius: 9999px;
                overflow: hidden;
                margin-top: 8px;
            }

            body.timer-ending .progress-container,
            body.timer-ended .progress-container {
                background: rgba(255, 255, 255, 0.2);
            }

            .progress-fill {
                height: 100%;
                background: currentColor;
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
    renderContent(info) {
        const container = document.createElement('div');
        container.className = 'pip-container';
        const timeClasses = ['time'];
        if (info.remaining <= info.duration * 0.1 && info.remaining > 0) {
            timeClasses.push('warning');
            container.classList.add('timer-ending');
        }
        if (info.remaining <= 0) {
            timeClasses.push('ended', 'blink');
        }
        // Buscar o próximo bloco
        const nextBlock = this.getNextBlock();
        const nextBlockHtml = nextBlock ? `
            <div class="next-block">
                <span class="next-block-label">Próximo:</span>
                <span class="next-block-title">${nextBlock}</span>
            </div>
        ` : '';
        container.innerHTML = `
            <div class="header">
                <div class="status">${this.getStatusText(info.status)}</div>
                <div class="message">${info.blocoName || 'Timer em execução'}</div>
            </div>
            <div class="${timeClasses.join(' ')}">${info.timeDisplay}</div>
            ${nextBlockHtml}
            <div class="progress-container">
                <div class="progress-fill" style="width: ${info.progress}%"></div>
            </div>
        `;
        this.pipWindow.document.body.innerHTML = '';
        this.pipWindow.document.body.appendChild(container);
    }
    getNextBlock() {
        const blocosList = document.getElementById('blocoList');
        if (!blocosList)
            return null;
        // Encontrar o bloco ativo atual
        const activeBloco = blocosList.querySelector('.border-indigo-500, .border-indigo-400');
        if (!activeBloco)
            return null;
        // Pegar o próximo elemento que seja um bloco
        const nextBloco = activeBloco.nextElementSibling;
        if (!nextBloco)
            return null;
        // Pegar o título do bloco - ajustando o seletor para pegar o texto do bloco
        const titleElement = nextBloco.querySelector('[data-bloco-title]') ||
            nextBloco.querySelector('.bloco-title') ||
            nextBloco.querySelector('.font-medium');
        return titleElement?.textContent?.trim() || null;
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
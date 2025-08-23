export class PiPManager {
    constructor() {
        this.pipWindow = null;
        this.updateCallbacks = new Set();
        this.lastButtonState = false;
        this.pipVisibilityCheckInterval = null;
        this.isPiPVisible = true;
        this.pipLostFocusTime = null;
        this.wasAutoOpened = false;
        this.VISIBILITY_CHECK_INTERVAL = 2000; // 2 segundos
        this.PIP_LOST_FOCUS_THRESHOLD = 5000; // 5 segundos
        this.nextBlockHandler = (event) => {
            console.log('PiP: Clique no botão próximo');
            const nextButton = document.getElementById('nextBlocoButtonGreen');
            if (nextButton) {
                // Foca na janela principal
                window.focus();
                // Clica no botão
                nextButton.click();
            }
        };
    }
    async open(initialInfo) {
        if (this.pipWindow) {
            return;
        }
        try {
            if ('documentPictureInPicture' in window) {
                this.pipWindow = await window.documentPictureInPicture.requestWindow({
                    width: 200,
                    height: 80
                });
                this.setupStyles();
                this.renderContent(initialInfo);
                this.startVisibilityMonitoring();
                this.isPiPVisible = true;
                this.pipLostFocusTime = null;
                this.wasAutoOpened = false; // Reset ao abrir manualmente
            }
        }
        catch (error) {
            console.log('Picture-in-Picture não suportado:', error);
        }
    }
    close() {
        if (this.pipWindow) {
            this.stopVisibilityMonitoring();
            this.pipWindow.close();
            this.pipWindow = null;
            this.updateCallbacks.clear();
            this.isPiPVisible = true;
            this.pipLostFocusTime = null;
            this.wasAutoOpened = false;
            // Disparar evento de que o PiP foi fechado
            const event = new CustomEvent('pipClosed', {
                detail: { pipManager: this }
            });
            document.dispatchEvent(event);
        }
    }
    isOpen() {
        return this.pipWindow !== null;
    }
    isVisible() {
        return this.isPiPVisible;
    }
    hasLostFocus() {
        return this.pipLostFocusTime !== null;
    }
    wasOpenedAutomatically() {
        return this.wasAutoOpened;
    }
    markAsAutoOpened() {
        this.wasAutoOpened = true;
    }
    resetAutoOpenState() {
        this.wasAutoOpened = false;
    }
    startVisibilityMonitoring() {
        if (this.pipVisibilityCheckInterval) {
            clearInterval(this.pipVisibilityCheckInterval);
        }
        this.pipVisibilityCheckInterval = window.setInterval(() => {
            this.checkPiPVisibility();
        }, this.VISIBILITY_CHECK_INTERVAL);
    }
    stopVisibilityMonitoring() {
        if (this.pipVisibilityCheckInterval) {
            clearInterval(this.pipVisibilityCheckInterval);
            this.pipVisibilityCheckInterval = null;
        }
    }
    checkPiPVisibility() {
        if (!this.pipWindow)
            return;
        try {
            // Verificar se a janela PiP ainda está ativa
            const isWindowActive = !this.pipWindow.closed;
            if (isWindowActive) {
                // PiP está ativo
                if (!this.isPiPVisible) {
                    console.log('PiP: Recuperou visibilidade');
                    this.isPiPVisible = true;
                    this.pipLostFocusTime = null;
                }
            }
            else {
                // PiP foi fechado
                console.log('PiP: Janela foi fechada');
                this.close();
            }
        }
        catch (error) {
            // Se houver erro ao acessar a janela PiP, provavelmente foi fechada
            console.log('PiP: Erro ao verificar visibilidade, fechando...');
            this.close();
        }
    }
    onPiPVisibilityChanged(isVisible) {
        // Disparar evento customizado para notificar outros componentes
        const event = new CustomEvent('pipVisibilityChanged', {
            detail: {
                isVisible,
                pipManager: this
            }
        });
        document.dispatchEvent(event);
    }
    async restore() {
        if (!this.pipWindow || this.pipWindow.closed) {
            // Se a janela foi fechada, reabrir
            const lastInfo = this.getLastInfo();
            await this.open(lastInfo);
        }
        else {
            // Se ainda está aberta mas não visível, focar nela
            try {
                this.pipWindow.focus();
                this.isPiPVisible = true;
                this.pipLostFocusTime = null;
                this.onPiPVisibilityChanged(true);
            }
            catch (error) {
                console.log('PiP: Erro ao focar janela, reabrindo...');
                const lastInfo = this.getLastInfo();
                await this.open(lastInfo);
            }
        }
    }
    getLastInfo() {
        // Buscar informações atuais do timer
        const timeDisplay = document.getElementById('timeDisplay')?.textContent || '00:00';
        const blocoName = document.getElementById('currentBlocoName')?.textContent || 'Timer em execução';
        const progressBar = document.getElementById('progressBar');
        const progress = progressBar ? parseFloat(progressBar.style.width || '0') : 0;
        // Determinar status baseado nas classes do botão de pause
        const pauseButton = document.getElementById('pauseButton');
        let status = 'stopped';
        if (pauseButton) {
            if (pauseButton.textContent?.includes('Pausar')) {
                status = 'running';
            }
            else if (pauseButton.textContent?.includes('Continuar')) {
                status = 'paused';
            }
        }
        // Calcular duração e tempo restante
        const duration = this.calculateDuration();
        const remaining = this.calculateRemaining();
        return {
            timeDisplay,
            blocoName,
            status,
            duration,
            remaining,
            progress
        };
    }
    calculateDuration() {
        // Buscar duração total dos blocos
        const blocosList = document.getElementById('blocoList');
        if (!blocosList)
            return 0;
        let totalDuration = 0;
        const blocos = blocosList.querySelectorAll('li');
        blocos.forEach(bloco => {
            const durationText = bloco.textContent?.match(/(\d+)min/);
            if (durationText) {
                totalDuration += parseInt(durationText[1]) * 60; // Converter para segundos
            }
        });
        return totalDuration;
    }
    calculateRemaining() {
        // Buscar tempo restante do timer atual
        const timeDisplay = document.getElementById('timeDisplay');
        if (!timeDisplay)
            return 0;
        const timeText = timeDisplay.textContent || '';
        const timeParts = timeText.split(':').map(Number);
        if (timeParts.length === 2) {
            // Formato MM:SS
            return timeParts[0] * 60 + timeParts[1];
        }
        else if (timeParts.length === 3) {
            // Formato HH:MM:SS
            return timeParts[0] * 3600 + timeParts[1] * 60 + timeParts[2];
        }
        return 0;
    }
    update(info) {
        if (!this.pipWindow)
            return;
        // Verificar se o estado do botão e do próximo bloco
        const currentButtonState = this.isNextButtonVisible();
        const hasNextBlock = this.getNextBlock() !== null;
        const hasNextBlockContainer = !!this.pipWindow.document.querySelector('.next-block-container');
        // Se houve mudança no estado, forçamos uma re-renderização completa
        if (currentButtonState !== this.lastButtonState ||
            (hasNextBlock && !hasNextBlockContainer)) {
            console.log('PiP: Estado mudou, re-renderizando conteúdo', {
                buttonStateChanged: currentButtonState !== this.lastButtonState,
                currentButtonState,
                lastButtonState: this.lastButtonState,
                hasNextBlock,
                hasNextBlockContainer
            });
            this.renderContent(info);
            this.lastButtonState = currentButtonState;
            return;
        }
        // Continua com a atualização normal se não houve mudança no botão
        const container = this.pipWindow.document.querySelector('.pip-container');
        const timeElement = this.pipWindow.document.querySelector('.time');
        const progressElement = this.pipWindow.document.querySelector('.progress-fill');
        const statusElement = this.pipWindow.document.querySelector('.status');
        const messageElement = this.pipWindow.document.querySelector('.message');
        const nextBlockContainer = this.pipWindow.document.querySelector('.next-block-container');
        const nextBlockButton = this.pipWindow.document.querySelector('.next-block-button');
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
        if (nextBlockContainer) {
            if (nextBlock) {
                const titleElement = nextBlockContainer.querySelector('.next-block-title');
                if (titleElement) {
                    titleElement.textContent = nextBlock;
                }
                nextBlockContainer.style.display = 'flex';
            }
            else {
                nextBlockContainer.style.display = 'none';
            }
        }
    }
    setupStyles() {
        const style = document.createElement('style');
        style.textContent = `
            body { 
                margin: 0; 
                padding: 0;
                display: flex; 
                align-items: center; 
                justify-content: center;
                background: rgba(255, 255, 255, 0.98);
                color: rgb(31 41 55);
                font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif;
                min-height: 100vh;
                transition: all 0.3s ease;
                backdrop-filter: blur(8px);
                border-radius: 6px;
                overflow: hidden;
                box-sizing: border-box;
            }

            body.timer-ending {
                background: rgba(21, 22, 52, 0.98) !important;
                color: white !important;
            }

            body.timer-ended {
                background: rgba(239, 68, 68, 0.98) !important;
                color: white !important;
            }

            @media (prefers-color-scheme: dark) {
                body {
                    background: rgba(17, 24, 39, 0.98);
                    color: rgb(243 244 246);
                }
            }

            .pip-container {
                width: 100%;
                height: 100%;
                display: flex;
                align-items: center;
                justify-content: center;
                padding: 4px;
                box-sizing: border-box;
            }

            .main-row {
                display: flex;
                align-items: center;
                gap: 8px;
                width: 100%;
                height: 100%;
            }

            .left-section {
                display: flex;
                flex-direction: column;
                align-items: center;
                gap: 2px;
                flex-shrink: 0;
            }

            .right-section {
                display: flex;
                flex-direction: column;
                gap: 3px;
                flex: 1;
                min-width: 0;
            }

            .status {
                display: inline-block;
                padding: 1px 2px;
                border-radius: 2px;
                background: rgba(0, 0, 0, 0.06);
                color: currentColor;
                font-size: 7px;
                font-weight: 500;
                opacity: 0.8;
                line-height: 1;
            }

            .time {
                font-size: 20px;
                font-weight: 700;
                line-height: 1;
                font-variant-numeric: tabular-nums;
                transition: color 0.3s;
                margin: 0;
                color: currentColor;
            }

            .message {
                font-size: 9px;
                font-weight: 500;
                margin: 0;
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
                color: currentColor;
                opacity: 0.9;
                line-height: 1;
            }

            .progress-container {
                width: 100%;
                height: 2px;
                background: rgba(0, 0, 0, 0.08);
                border-radius: 9999px;
                overflow: hidden;
            }

            body.timer-ending .progress-container,
            body.timer-ended .progress-container {
                background: rgba(255, 255, 255, 0.15);
            }

            .progress-fill {
                height: 100%;
                background: currentColor;
                border-radius: 9999px;
                transition: width 0.3s linear;
            }

            .next-info {
                display: flex;
                align-items: center;
                gap: 2px;
                font-size: 7px;
                opacity: 0.7;
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
            }

            .next-label {
                font-weight: 600;
                opacity: 0.8;
            }

            .next-title {
                font-weight: 500;
                max-width: 60px;
                overflow: hidden;
                text-overflow: ellipsis;
            }

            .next-button {
                background: rgba(0, 0, 0, 0.08);
                color: currentColor;
                border: none;
                border-radius: 2px;
                padding: 1px 3px;
                font-size: 7px;
                cursor: pointer;
                transition: background-color 0.2s;
                line-height: 1;
                margin-left: auto;
            }

            .next-button:hover {
                background: rgba(0, 0, 0, 0.15);
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
        // Buscar o próximo bloco e verificar se o botão verde está visível
        const nextBlock = this.getNextBlock();
        const isNextButtonVisible = this.isNextButtonVisible();
        console.log('PiP: Renderizando conteúdo:', {
            nextBlock,
            isNextButtonVisible
        });
        // Layout horizontal ultra-compacto
        let html = `
            <div class="main-row">
                <div class="left-section">
                    <div class="status">${this.getStatusText(info.status)}</div>
                    <div class="${timeClasses.join(' ')}">${info.timeDisplay}</div>
                </div>
                <div class="right-section">
                    <div class="message">${info.blocoName || 'Timer'}</div>
                    <div class="progress-container">
                        <div class="progress-fill" style="width: ${info.progress}%"></div>
                    </div>
        `;
        // Se tiver próximo bloco, adiciona de forma compacta
        if (nextBlock) {
            html += `
                    <div class="next-info">
                        <span class="next-label">→</span>
                        <span class="next-title">${nextBlock}</span>
                    </div>
            `;
            // Se o botão estiver visível, adiciona ele
            if (isNextButtonVisible) {
                html += `
                    <button class="next-button" id="pipNextBlockButton" title="Próximo bloco">
                        ⏭️
                    </button>
                `;
            }
        }
        html += `
                </div>
            </div>
        `;
        container.innerHTML = html;
        // Adicionar handler para o botão de próximo bloco
        if (this.pipWindow) {
            const nextButton = container.querySelector('#pipNextBlockButton');
            if (nextButton) {
                nextButton.addEventListener('click', this.nextBlockHandler);
            }
        }
        this.pipWindow.document.body.innerHTML = '';
        this.pipWindow.document.body.appendChild(container);
    }
    getNextBlock() {
        const blocosList = document.getElementById('blocoList');
        if (!blocosList) {
            console.log('PiP: Lista de blocos não encontrada');
            return null;
        }
        // Encontrar o bloco ativo atual
        const activeBloco = blocosList.querySelector('.border-indigo-500, .border-indigo-400');
        if (!activeBloco) {
            console.log('PiP: Nenhum bloco ativo encontrado');
            return null;
        }
        // Pegar o próximo elemento que seja um bloco (elemento li)
        const nextBloco = activeBloco.nextElementSibling;
        if (!nextBloco || nextBloco.tagName !== 'LI') {
            console.log('PiP: Não há próximo bloco');
            return null;
        }
        // Pegar o título do bloco
        const titleElement = nextBloco.querySelector('[data-bloco-title]') ||
            nextBloco.querySelector('.bloco-title') ||
            nextBloco.querySelector('.font-medium');
        const title = titleElement?.textContent?.trim() || null;
        console.log('PiP: Próximo bloco encontrado:', title);
        return title;
    }
    isNextButtonVisible() {
        const nextButton = document.getElementById('nextBlocoButtonGreen');
        if (!nextButton) {
            console.log('PiP: Botão próximo não encontrado');
            return false;
        }
        // Verifica se há próximo bloco antes de verificar se o botão está visível
        const nextBlock = this.getNextBlock();
        if (!nextBlock) {
            console.log('PiP: Não há próximo bloco, botão não deve ser visível');
            return false;
        }
        // Verifica se o botão está oculto por qualquer meio
        const isHidden = nextButton.classList.contains('hidden');
        const computedStyle = window.getComputedStyle(nextButton);
        const isDisplayNone = computedStyle.display === 'none';
        const isVisibilityHidden = computedStyle.visibility === 'hidden';
        const isOpacityZero = computedStyle.opacity === '0';
        const isVisible = !isHidden && !isDisplayNone && !isVisibilityHidden && !isOpacityZero;
        console.log('PiP: Estado do botão próximo:', {
            element: nextButton,
            classes: nextButton.classList.toString(),
            isHidden,
            display: computedStyle.display,
            visibility: computedStyle.visibility,
            opacity: computedStyle.opacity,
            isVisible,
            hasNextBlock: !!nextBlock
        });
        return isVisible;
    }
    getStatusText(status) {
        switch (status) {
            case 'running':
                return '▶';
            case 'paused':
                return '⏸';
            case 'stopped':
                return '⏹';
            default:
                return '';
        }
    }
}
//# sourceMappingURL=PiPManager.js.map
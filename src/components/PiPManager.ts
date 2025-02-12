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
    private lastButtonState: boolean = false;

    public async open(initialInfo: PiPInfo): Promise<void> {
        if (this.pipWindow) {
            return;
        }

        try {
            if ('documentPictureInPicture' in window) {
                this.pipWindow = await (window as any).documentPictureInPicture.requestWindow({
                    width: 300,
                    height: 200
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
            } else if (info.remaining <= 0) {
                body.classList.add('timer-ended');
                body.classList.remove('timer-ending');
            } else {
                body.classList.remove('timer-ending', 'timer-ended');
            }
        }

        if (timeElement) timeElement.textContent = info.timeDisplay;
        if (messageElement) messageElement.textContent = info.blocoName || 'Timer em execução';
        if (progressElement) progressElement.style.width = `${info.progress}%`;
        if (statusElement) statusElement.textContent = this.getStatusText(info.status);

        // Atualizar próximo bloco
        const nextBlock = this.getNextBlock();
        if (nextBlockContainer) {
            if (nextBlock) {
                const titleElement = nextBlockContainer.querySelector('.next-block-title');
                if (titleElement) {
                    titleElement.textContent = nextBlock;
                }
                nextBlockContainer.style.display = 'flex';
            } else {
                nextBlockContainer.style.display = 'none';
            }
        }
    }

    private setupStyles(): void {
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

            .next-block-container {
                display: flex;
                flex-direction: column;
                gap: 8px;
                width: 100%;
            }

            .next-block {
                font-size: 11px;
                opacity: 0.7;
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

            .next-block-button {
                background: rgba(255, 255, 255, 0.2);
                color: currentColor;
                border: none;
                border-radius: 4px;
                padding: 6px 12px;
                font-size: 12px;
                font-weight: 500;
                cursor: pointer;
                transition: background-color 0.2s;
                width: 100%;
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 4px;
            }

            .next-block-button:hover {
                background: rgba(255, 255, 255, 0.3);
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

    private nextBlockHandler = (event: Event) => {
        console.log('PiP: Clique no botão próximo');
        
        const nextButton = document.getElementById('nextBlocoButtonGreen');
        if (nextButton) {
            // Foca na janela principal
            window.focus();
            
            // Clica no botão
            nextButton.click();
        }
    };

    private renderContent(info: PiPInfo): void {
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

        // Primeiro criamos o HTML base
        let html = `
            <div class="header">
                <div class="status">${this.getStatusText(info.status)}</div>
                <div class="message">${info.blocoName || 'Timer em execução'}</div>
            </div>
            <div class="${timeClasses.join(' ')}">${info.timeDisplay}</div>
        `;

        // Se tiver próximo bloco, adiciona o container
        if (nextBlock) {
            html += `
                <div class="next-block-container">
                    <div class="next-block">
                        <span class="next-block-label">Próximo:</span>
                        <span class="next-block-title">${nextBlock}</span>
                    </div>
            `;

            // Se o botão estiver visível, adiciona ele
            if (isNextButtonVisible) {
                html += `
                    <button class="next-block-button" id="pipNextBlockButton">
                        ⏭️ Abrir aplicação e ir para próximo bloco
                    </button>
                `;
            }

            html += `</div>`;
        }

        // Adiciona a barra de progresso
        html += `
            <div class="progress-container">
                <div class="progress-fill" style="width: ${info.progress}%"></div>
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

    private getNextBlock(): string | null {
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

        // Pegar o próximo elemento que seja um bloco
        const nextBloco = activeBloco.nextElementSibling;
        if (!nextBloco) {
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

    private isNextButtonVisible(): boolean {
        const nextButton = document.getElementById('nextBlocoButtonGreen');
        if (!nextButton) {
            console.log('PiP: Botão próximo não encontrado');
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
            isVisible
        });
        
        return isVisible;
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
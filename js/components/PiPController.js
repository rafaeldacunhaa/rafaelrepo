import { PiPManager } from './PiPManager.js';
export class PiPController {
    constructor() {
        this.autoPiPEnabled = true;
        this.isPageVisible = true;
        this.autoPiPCheckInterval = null;
        this.lastInfo = null;
        this.pipManager = new PiPManager();
        this.pipButton = document.getElementById('pipButton');
        this.pipStatusIndicator = null;
        this.setupPiPButton();
        this.setupEventListeners();
        this.setupVisibilityMonitoring();
        this.startAutoPiPCheck();
    }
    startAutoPiPCheck() {
        // Verificar a cada 2 segundos se deve abrir o PiP automaticamente
        this.autoPiPCheckInterval = window.setInterval(() => {
            this.checkAndOpenPiPIfNeeded();
        }, 2000);
    }
    checkAndOpenPiPIfNeeded() {
        // Só verificar se o auto-PiP está ativo, a página não está visível e o PiP não está aberto
        if (this.autoPiPEnabled && !this.isPageVisible && !this.pipManager.isOpen()) {
            // Verificar se há um timer rodando
            if (this.isTimerRunning()) {
                console.log('PiP: Verificação periódica - Timer ativo e PiP fechado, abrindo automaticamente');
                this.openPiPAutomatically();
            }
        }
    }
    setupVisibilityMonitoring() {
        // Monitorar mudanças de visibilidade da página
        document.addEventListener('visibilitychange', () => {
            const wasVisible = this.isPageVisible;
            this.isPageVisible = !document.hidden;
            console.log('PiP: Mudança de visibilidade:', { wasVisible, isVisible: this.isPageVisible });
            // Se a página perdeu visibilidade e o PiP não está aberto
            if (!this.isPageVisible && !this.pipManager.isOpen() && this.autoPiPEnabled) {
                console.log('PiP: Página perdeu foco, abrindo PiP automaticamente');
                this.openPiPAutomatically();
            }
        });
        // Monitorar quando a janela perde foco (mudança para outra aplicação)
        window.addEventListener('blur', () => {
            console.log('PiP: Janela perdeu foco, verificando se deve abrir PiP');
            if (!this.pipManager.isOpen() && this.autoPiPEnabled) {
                console.log('PiP: Janela perdeu foco, abrindo PiP automaticamente');
                this.openPiPAutomatically();
            }
        });
        // Monitorar quando o PiP é fechado para permitir reabertura automática
        document.addEventListener('pipClosed', () => {
            console.log('PiP: PiP foi fechado, permitindo reabertura automática');
            // Não precisa resetar estado, apenas permitir que abra novamente
        });
    }
    async openPiPAutomatically() {
        try {
            // Verificar se há um timer rodando antes de abrir o PiP
            if (this.isTimerRunning()) {
                console.log('PiP: Timer ativo, abrindo PiP automaticamente');
                // Obter informações atuais do timer
                const currentInfo = this.getLastInfo();
                if (currentInfo) {
                    await this.pipManager.open(currentInfo);
                    this.updatePiPButton(true, true, false);
                    // Marcar que foi aberto automaticamente
                    this.pipManager.markAsAutoOpened();
                    // Mostrar notificação informativa
                    this.showAutoPiPNotification();
                }
                else {
                    console.log('PiP: Não foi possível obter informações do timer');
                }
            }
            else {
                console.log('PiP: Nenhum timer ativo, não abrindo PiP automaticamente');
            }
        }
        catch (error) {
            console.log('PiP: Erro ao abrir automaticamente:', error);
        }
    }
    isTimerRunning() {
        // Verificar se há um timer ativo usando o estado real
        const timerRunning = document.getElementById('timerRunning');
        if (!timerRunning)
            return false;
        // Verificar se o timer está visível
        const isVisible = !timerRunning.classList.contains('hidden');
        if (!isVisible)
            return false;
        // Verificar se o timer está rodando usando o estado real do Timer
        if (window.timer && typeof window.timer.getStatus === 'function') {
            const status = window.timer.getStatus();
            return status === 'running';
        }
        // Fallback: verificar se o botão de pause mostra "Pausar" (indicando que está rodando)
        const pauseButton = document.getElementById('pauseButton');
        if (!pauseButton || !pauseButton.textContent)
            return false;
        const isRunning = pauseButton.textContent.includes('Pausar');
        return isRunning;
    }
    showAutoPiPNotification() {
        // Criar notificação informativa
        const notification = document.createElement('div');
        notification.className = 'pip-lost-notification';
        notification.style.background = '#10b981'; // Verde para indicar ação automática
        notification.innerHTML = `
            <div style="display: flex; align-items: center; gap: 8px;">
                <i data-lucide="info" style="width: 16px; height: 16px;"></i>
                <span>PiP aberto automaticamente - Timer rodando em segundo plano</span>
            </div>
        `;
        // Adicionar ao DOM
        document.body.appendChild(notification);
        // Criar ícones Lucide
        if (window.lucide) {
            window.lucide.createIcons();
        }
        // Remover após 5 segundos
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 5000);
        // Permitir fechar clicando
        notification.addEventListener('click', () => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        });
    }
    async toggleAutoPiP() {
        this.autoPiPEnabled = !this.autoPiPEnabled;
        console.log('PiP: Auto-abertura', this.autoPiPEnabled ? 'ativada' : 'desativada');
        // Atualizar o botão para mostrar o estado
        this.updateAutoPiPButton();
        // Se desativou o auto-PiP e o PiP foi aberto automaticamente, fechar
        if (!this.autoPiPEnabled && this.pipManager.wasOpenedAutomatically()) {
            console.log('PiP: Auto-PiP desativado, fechando PiP automático');
            this.pipManager.close();
            this.updatePiPButton(false, true, false);
        }
    }
    updateAutoPiPButton() {
        if (this.pipButton) {
            // Adicionar indicador visual de que o auto-PiP está ativo
            if (this.autoPiPEnabled) {
                this.pipButton.classList.add('auto-pip-enabled');
                this.pipButton.title = 'Auto-PiP ativo - Clique para desativar';
            }
            else {
                this.pipButton.classList.remove('auto-pip-enabled');
                this.pipButton.title = 'Auto-PiP desativado - Clique para ativar';
            }
        }
    }
    setupPiPButton() {
        if (this.pipButton) {
            this.pipButton.addEventListener('click', () => this.togglePiP());
            // Adicionar indicador de status
            this.createStatusIndicator();
            // Configurar estado inicial do auto-PiP
            this.updateAutoPiPButton();
        }
    }
    createStatusIndicator() {
        if (!this.pipButton)
            return;
        // Criar indicador de status simplificado
        this.pipStatusIndicator = document.createElement('div');
        this.pipStatusIndicator.className = 'pip-status-indicator';
        this.pipStatusIndicator.innerHTML = `
            <div class="pip-status-dot"></div>
        `;
        // Estilos básicos para o indicador
        this.pipStatusIndicator.style.cssText = `
            position: absolute;
            top: -2px;
            right: -2px;
            width: 8px;
            height: 8px;
            pointer-events: none;
        `;
        // Estilos para o dot
        const dot = this.pipStatusIndicator.querySelector('.pip-status-dot');
        if (dot) {
            dot.style.cssText = `
                width: 100%;
                height: 100%;
                border-radius: 50%;
                background: #10b981;
                border: 1px solid white;
                transition: all 0.3s ease;
            `;
        }
        this.pipButton.appendChild(this.pipStatusIndicator);
        this.pipStatusIndicator.style.display = 'none';
    }
    setupEventListeners() {
        // Escutar eventos de mudança de visibilidade do PiP
        document.addEventListener('pipVisibilityChanged', ((event) => {
            const customEvent = event;
            this.handlePiPVisibilityChanged(customEvent.detail);
        }));
    }
    handlePiPVisibilityChanged(detail) {
        console.log('PiP: Visibilidade mudou:', detail);
        // Atualizar o botão baseado no estado atual
        this.updatePiPButton(this.pipManager.isOpen(), detail.isVisible, false);
    }
    async togglePiP() {
        if (this.pipManager.isOpen()) {
            this.pipManager.close();
            this.updatePiPButton(false, true, false);
            return;
        }
        await this.pipManager.open(this.getLastInfo());
        this.updatePiPButton(true, true, false);
    }
    async restorePiP() {
        if (this.pipManager.isOpen()) {
            await this.pipManager.restore();
            // Mostrar notificação de sucesso
            this.showRestoreNotification();
        }
    }
    showRestoreNotification() {
        // Criar notificação visual
        const notification = document.createElement('div');
        notification.className = 'pip-lost-notification';
        notification.innerHTML = `
            <div style="display: flex; align-items: center; gap: 8px;">
                <i data-lucide="check-circle" style="width: 16px; height: 16px; color: #10b981;"></i>
                <span>PiP restaurado com sucesso!</span>
            </div>
        `;
        // Adicionar ao DOM
        document.body.appendChild(notification);
        // Criar ícones Lucide
        if (window.lucide) {
            window.lucide.createIcons();
        }
        // Remover após 3 segundos
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 3000);
        // Permitir fechar clicando
        notification.addEventListener('click', () => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        });
    }
    updateInfo(info) {
        this.lastInfo = info;
        if (this.pipManager.isOpen()) {
            this.pipManager.update(info);
        }
    }
    getLastInfo() {
        return this.lastInfo || {
            timeDisplay: '0:00',
            blocoName: 'Timer em execução',
            status: 'stopped',
            duration: 0,
            remaining: 0,
            progress: 0
        };
    }
    close() {
        this.pipManager.close();
        this.updatePiPButton(false, true, false);
        // Parar verificação periódica
        if (this.autoPiPCheckInterval) {
            clearInterval(this.autoPiPCheckInterval);
            this.autoPiPCheckInterval = null;
        }
    }
    updatePiPButton(isOpen, isVisible, hasLostFocus) {
        if (this.pipButton) {
            const icon = this.pipButton.querySelector('i');
            if (icon) {
                if (isOpen) {
                    icon.setAttribute('data-lucide', 'picture-in-picture-off');
                    this.pipButton.classList.remove('pip-lost-focus');
                    this.pipButton.title = 'Fechar janela flutuante';
                }
                else {
                    icon.setAttribute('data-lucide', 'picture-in-picture-2');
                    this.pipButton.classList.remove('pip-lost-focus');
                    this.pipButton.title = 'Abrir em janela flutuante';
                }
                // Atualizar ícones Lucide se disponível
                if (window.lucide) {
                    window.lucide.createIcons();
                }
            }
            // Atualizar indicador de status
            if (isOpen) {
                // Indicador de status simplificado
                if (this.pipStatusIndicator) {
                    this.pipStatusIndicator.style.display = 'block';
                }
            }
            else {
                // Indicador de status simplificado
                if (this.pipStatusIndicator) {
                    this.pipStatusIndicator.style.display = 'none';
                }
            }
        }
    }
}
//# sourceMappingURL=PiPController.js.map
import { TimerController } from './TimerController.js';
import { UIManager } from './UIManager.js';

export class KeyboardManager {
    private timerController: TimerController;
    private uiManager: UIManager;
    private boundHandleKeyboardShortcut: (e: KeyboardEvent) => void;

    constructor(timerController: TimerController, uiManager: UIManager) {
        this.timerController = timerController;
        this.uiManager = uiManager;
        this.boundHandleKeyboardShortcut = this.handleKeyboardShortcut.bind(this);
        this.setupKeyboardShortcuts();
        console.log('KeyboardManager inicializado');
    }

    private setupKeyboardShortcuts(): void {
        // Remover event listeners anteriores se existirem
        document.removeEventListener('keydown', this.boundHandleKeyboardShortcut);
        
        // Adicionar novo event listener
        document.addEventListener('keydown', this.boundHandleKeyboardShortcut);
        console.log('Event listeners de teclado configurados');
    }

    private handleKeyboardShortcut(e: KeyboardEvent): void {
        console.log('Tecla pressionada:', e.key);

        // Verificar se é cmd+enter (Mac) ou ctrl+enter (Windows/Linux)
        if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
            console.log('Atalho Cmd/Ctrl + Enter detectado');
            e.preventDefault();
            this.uiManager.handleAddBloco();
            return;
        }

        // Ignorar outros atalhos se estiver em um input
        if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
            console.log('Ignorando atalho pois o foco está em um input');
            return;
        }

        switch(e.key.toLowerCase()) {
            case 'enter':  // Enter para iniciar timer
                console.log('Atalho Enter detectado');
                e.preventDefault();
                if (this.timerController.getStatus() === 'running') {
                    this.timerController.pause();
                } else if (this.timerController.getStatus() === 'paused') {
                    this.timerController.pause();
                } else {
                    this.timerController.start();
                }
                break;
            case 'escape':  // Esc para sair do timer
                console.log('Atalho Escape detectado');
                this.timerController.stop();
                break;
        }
    }

    // Método para recarregar os event listeners
    public reloadEventListeners(): void {
        console.log('Recarregando event listeners de teclado');
        this.setupKeyboardShortcuts();
    }
} 
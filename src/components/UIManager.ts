import { Timer } from './Timer.js';
import { BlocoManager } from './BlocoManager.js';
import { AudioService } from '../services/AudioService.js';
import { TimerController } from './TimerController.js';
import { BlocoRenderer } from './BlocoRenderer.js';
import { TemplateManager } from './TemplateManager.js';
import { KeyboardManager } from './KeyboardManager.js';

export class UIManager {
    private timerController: TimerController;
    private blocoManager: BlocoManager;
    private blocoRenderer: BlocoRenderer;
    private templateManager: TemplateManager;
    private keyboardManager: KeyboardManager;

    constructor(timer: Timer, blocoManager: BlocoManager, audioService: AudioService) {
        console.log('Iniciando UIManager...');
        this.blocoManager = blocoManager;
        this.timerController = new TimerController(timer, blocoManager);
        this.blocoRenderer = new BlocoRenderer(blocoManager);
        this.templateManager = new TemplateManager(blocoManager, this.blocoRenderer);
        this.keyboardManager = new KeyboardManager(this.timerController, this);

        this.initialize();
        this.setupEventListeners();
        console.log('UIManager inicializado com sucesso');
    }

    private initialize(): void {
        console.log('Inicializando UI...');
        this.blocoRenderer.render();
        console.log('UI inicializada');
    }

    private setupEventListeners(): void {
        console.log('Configurando event listeners...');
        
        // Timer controls
        document.getElementById('startButton')?.addEventListener('click', () => {
            console.log('Botão start clicado');
            this.timerController.start();
        });
        
        document.getElementById('stopButton')?.addEventListener('click', () => {
            console.log('Botão stop clicado');
            this.timerController.stop();
        });
        
        document.getElementById('resetButton')?.addEventListener('click', () => {
            console.log('Botão reset clicado');
            this.timerController.reset();
        });
        
        document.getElementById('pauseButton')?.addEventListener('click', () => {
            console.log('Botão pause clicado');
            this.timerController.pause();
        });

        // Bloco controls
        document.getElementById('addBlocoButton')?.addEventListener('click', () => {
            console.log('Botão adicionar bloco clicado');
            this.handleAddBloco();
        });
        
        document.getElementById('resetBlocosButton')?.addEventListener('click', () => {
            console.log('Botão resetar blocos clicado');
            this.handleResetBlocos();
        });
        
        document.getElementById('prevBlocoButton')?.addEventListener('click', () => {
            console.log('Botão bloco anterior clicado');
            this.handlePrevBloco();
        });
        
        document.getElementById('nextBlocoButton')?.addEventListener('click', () => {
            console.log('Botão próximo bloco clicado');
            this.handleNextBloco();
        });

        // Recarregar event listeners do teclado
        this.keyboardManager.reloadEventListeners();
        
        console.log('Event listeners configurados');
    }

    public handleAddBloco(): void {
        console.log('Iniciando handleAddBloco');
        
        if (!this.validateTimerMode()) {
            return;
        }

        const inputs = this.getTimeInputs();
        if (!inputs) {
            return;
        }

        const { hours, minutes, seconds } = this.parseTimeInputs(inputs);
        console.log('Valores dos inputs:', { hours, minutes, seconds });
        
        const totalMinutes = Math.ceil((hours * 60) + minutes + (seconds / 60));
        console.log('Total de minutos:', totalMinutes);
        
        if (totalMinutes <= 0) {
            alert('Por favor, configure um tempo válido primeiro.');
            return;
        }

        const title = this.createBlocoTitle(hours, minutes, seconds);
        console.log('Título do bloco:', title);
        
        this.blocoManager.addBloco(title, totalMinutes);
        this.blocoRenderer.render();
        this.clearTimeInputs(inputs);
    }

    private validateTimerMode(): boolean {
        const timerManualMode = document.getElementById('timerManualMode');
        console.log('Timer manual mode element:', timerManualMode);
        console.log('Timer manual mode classes:', timerManualMode?.classList.toString());
        
        if (!timerManualMode || timerManualMode.classList.contains('hidden')) {
            console.error('O modo timer manual precisa estar ativo para adicionar blocos');
            return false;
        }
        return true;
    }

    private getTimeInputs(): { hours: HTMLInputElement, minutes: HTMLInputElement, seconds: HTMLInputElement } | null {
        const hoursInput = document.getElementById('hours') as HTMLInputElement;
        const minutesInput = document.getElementById('minutes') as HTMLInputElement;
        const secondsInput = document.getElementById('seconds') as HTMLInputElement;

        console.log('Inputs encontrados:', {
            hours: hoursInput,
            minutes: minutesInput,
            seconds: secondsInput
        });

        if (!hoursInput || !minutesInput || !secondsInput) {
            console.error('Elementos de input não encontrados');
            return null;
        }

        return { hours: hoursInput, minutes: minutesInput, seconds: secondsInput };
    }

    private parseTimeInputs(inputs: { hours: HTMLInputElement, minutes: HTMLInputElement, seconds: HTMLInputElement }): { hours: number, minutes: number, seconds: number } {
        const hours = parseInt(inputs.hours.value || '0');
        const minutes = parseInt(inputs.minutes.value || '0');
        const seconds = parseInt(inputs.seconds.value || '0');

        console.log('Valores parseados:', { hours, minutes, seconds });

        return { hours, minutes, seconds };
    }

    private createBlocoTitle(hours: number, minutes: number, seconds: number): string {
        let title = '';
        if (hours > 0) {
            title += `${hours}h `;
        }
        if (minutes > 0 || seconds > 0) {
            title += `${minutes}min`;
        }
        if (seconds > 0) {
            title += ` ${seconds}s`;
        }
        return title.trim();
    }

    private clearTimeInputs(inputs: { hours: HTMLInputElement, minutes: HTMLInputElement, seconds: HTMLInputElement }): void {
        inputs.hours.value = '0';
        inputs.minutes.value = '0';
        inputs.seconds.value = '0';
    }

    private handleResetBlocos(): void {
        console.log('Resetando blocos...');
        this.blocoManager.resetBlocos();
        this.blocoRenderer.render();
        
        // Limpar os inputs de tempo
        const hoursInput = document.getElementById('hours') as HTMLInputElement;
        const minutesInput = document.getElementById('minutes') as HTMLInputElement;
        const secondsInput = document.getElementById('seconds') as HTMLInputElement;
        
        if (hoursInput) hoursInput.value = '0';
        if (minutesInput) minutesInput.value = '0';
        if (secondsInput) secondsInput.value = '0';
        
        console.log('Blocos resetados com sucesso');
    }

    private handlePrevBloco(): void {
        const blocos = this.blocoManager.getBlocos();
        if (blocos.length === 0) return;

        const currentIndex = blocos.findIndex(b => b.isActive);
        if (currentIndex === -1) return;

        const prevIndex = (currentIndex - 1 + blocos.length) % blocos.length;
        this.updateActiveBloco(currentIndex, prevIndex);
    }

    private handleNextBloco(): void {
        const blocos = this.blocoManager.getBlocos();
        if (blocos.length === 0) return;

        const currentIndex = blocos.findIndex(b => b.isActive);
        if (currentIndex === -1) return;

        const nextIndex = (currentIndex + 1) % blocos.length;
        this.updateActiveBloco(currentIndex, nextIndex);
    }

    private updateActiveBloco(currentIndex: number, newIndex: number): void {
        const blocos = this.blocoManager.getBlocos();
        blocos[currentIndex].isActive = false;
        blocos[newIndex].isActive = true;
        this.blocoManager.setCurrentBlocoIndex(newIndex);

        const newBloco = blocos[newIndex];
        const milliseconds = newBloco.duration * 60 * 1000;
        this.timerController.start();

        this.blocoRenderer.render();
    }
} 
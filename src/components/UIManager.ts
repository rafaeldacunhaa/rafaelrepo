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
    private boundEventListeners: Map<string, EventListener> = new Map();

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

        // Adiciona listener para limpar recursos quando a página for fechada
        window.addEventListener('unload', () => this.cleanup());
    }

    private initialize(): void {
        console.log('Inicializando UI...');
        this.blocoRenderer.render();
        console.log('UI inicializada');
    }

    private cleanup(): void {
        console.log('Limpando recursos do UIManager...');
        // Remove todos os event listeners
        this.boundEventListeners.forEach((listener, elementId) => {
            const element = document.getElementById(elementId);
            if (element) {
                element.removeEventListener('click', listener);
            }
        });
        this.boundEventListeners.clear();
        
        // Limpa outros recursos
        this.keyboardManager.cleanup();
        this.timerController.cleanup();
    }

    private addEventListenerWithCleanup(elementId: string, event: string, handler: EventListener): void {
        const element = document.getElementById(elementId);
        if (element) {
            // Remove listener antigo se existir
            const oldListener = this.boundEventListeners.get(elementId);
            if (oldListener) {
                element.removeEventListener(event, oldListener);
            }
            
            // Adiciona novo listener
            element.addEventListener(event, handler);
            this.boundEventListeners.set(elementId, handler);
        }
    }

    private setupEventListeners(): void {
        console.log('Configurando event listeners...');
        
        // Timer controls
        this.addEventListenerWithCleanup('startButton', 'click', () => {
            console.log('Botão start clicado');
            this.timerController.restartFromBeginning();
        });

        this.addEventListenerWithCleanup('toggleBlocosOverview', 'click', () => {
            console.log('Toggle da lista de blocos clicado');
            const blocosOverview = document.getElementById('blocosOverview');
            if (blocosOverview) {
                blocosOverview.classList.toggle('translate-x-full');
            }
        });

        this.addEventListenerWithCleanup('closeBlocksButton', 'click', () => {
            console.log('Botão fechar lista de blocos clicado');
            const blocosOverview = document.getElementById('blocosOverview');
            if (blocosOverview) {
                blocosOverview.classList.add('translate-x-full');
            }
        });

        // Botões predefinidos de tempo - usando delegação de eventos
        const timeButtonsContainer = document.querySelector('.time-buttons-container');
        if (timeButtonsContainer) {
            const timeButtonHandler = (e: Event) => {
                const target = e.target as HTMLElement;
                if (target.classList.contains('predefined-time')) {
                    const timeInSeconds = parseInt(target.dataset.time || '0');
                    console.log('Botão predefinido clicado:', timeInSeconds, 'segundos');
                    
                    if (timeInSeconds > 0) {
                        const hours = Math.floor(timeInSeconds / 3600);
                        const minutes = Math.floor((timeInSeconds % 3600) / 60);
                        const seconds = timeInSeconds % 60;
                        
                        const inputs = this.getTimeInputs();
                        if (inputs) {
                            inputs.hours.value = hours.toString();
                            inputs.minutes.value = minutes.toString();
                            inputs.seconds.value = seconds.toString();
                        }
                    }
                }
            };
            
            timeButtonsContainer.addEventListener('click', timeButtonHandler);
            this.boundEventListeners.set('timeButtonsContainer', timeButtonHandler);
        }

        // Outros botões de controle
        this.addEventListenerWithCleanup('stopButton', 'click', () => {
            console.log('Botão stop clicado');
            this.timerController.stop();
        });

        this.addEventListenerWithCleanup('resetButton', 'click', () => {
            console.log('Botão reset clicado');
            this.timerController.reset();
        });

        this.addEventListenerWithCleanup('pauseButton', 'click', () => {
            console.log('Botão pause clicado');
            this.timerController.pause();
        });

        this.addEventListenerWithCleanup('nextBlocoButtonGreen', 'click', () => {
            console.log('Botão próximo (verde) clicado');
            this.handleNextBloco();
            const nextBlocoButtonGreen = document.getElementById('nextBlocoButtonGreen');
            if (nextBlocoButtonGreen) {
                nextBlocoButtonGreen.classList.add('hidden');
            }
        });

        // Bloco controls
        this.addEventListenerWithCleanup('addBlocoButton', 'click', () => {
            console.log('Botão adicionar bloco clicado');
            this.handleAddBloco();
        });

        this.addEventListenerWithCleanup('resetBlocosButton', 'click', () => {
            console.log('Botão resetar blocos clicado');
            this.handleResetBlocos();
        });

        this.addEventListenerWithCleanup('prevBlocoButton', 'click', () => {
            console.log('Botão bloco anterior clicado');
            this.handlePrevBloco();
        });

        this.addEventListenerWithCleanup('nextBlocoButton', 'click', () => {
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
        
        // Converter tudo para segundos primeiro
        const totalSeconds = (hours * 3600) + (minutes * 60) + seconds;
        console.log('Total de segundos:', totalSeconds);
        
        if (totalSeconds <= 0) {
            alert('Por favor, configure um tempo válido primeiro.');
            return;
        }

        // Converter para minutos com precisão de 2 casas decimais
        const totalMinutes = totalSeconds / 60;
        console.log('Total de minutos:', totalMinutes);

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
        console.log('Iniciando navegação para próximo bloco...');
        const blocos = this.blocoManager.getBlocos();
        if (blocos.length === 0) {
            console.log('Não há blocos para navegar');
            return;
        }

        const currentIndex = blocos.findIndex(b => b.isActive);
        console.log('Índice atual:', currentIndex);
        if (currentIndex === -1) {
            console.log('Nenhum bloco ativo encontrado');
            return;
        }

        const nextIndex = (currentIndex + 1) % blocos.length;
        console.log('Próximo índice:', nextIndex);
        this.updateActiveBloco(currentIndex, nextIndex);
    }

    private updateActiveBloco(currentIndex: number, newIndex: number): void {
        console.log('Atualizando bloco ativo de', currentIndex, 'para', newIndex);
        const blocos = this.blocoManager.getBlocos();
        
        // Parar o timer atual
        this.timerController.stop();
        
        // Atualizar o estado no BlocoManager
        this.blocoManager.setCurrentBlocoIndex(newIndex);
        
        // Atualizar a interface
        this.blocoRenderer.render();
        
        // Iniciar o timer com o novo bloco
        this.timerController.start();
        
        // Esconder o botão verde se estiver visível
        const nextBlocoButtonGreen = document.getElementById('nextBlocoButtonGreen');
        if (nextBlocoButtonGreen) {
            nextBlocoButtonGreen.classList.add('hidden');
        }
    }
} 
import { TimerController } from './TimerController.js';
import { BlocoRenderer } from './BlocoRenderer.js';
import { TemplateManager } from './TemplateManager.js';
import { KeyboardManager } from './KeyboardManager.js';
export class UIManager {
    constructor(timer, blocoManager, audioService) {
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
    initialize() {
        console.log('Inicializando UI...');
        this.blocoRenderer.render();
        console.log('UI inicializada');
    }
    setupEventListeners() {
        console.log('Configurando event listeners...');
        // Timer controls
        document.getElementById('startButton')?.addEventListener('click', () => {
            console.log('Botão start clicado');
            this.timerController.restartFromBeginning();
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
        // Botão verde de próximo bloco
        document.getElementById('nextBlocoButtonGreen')?.addEventListener('click', () => {
            console.log('Botão próximo (verde) clicado');
            this.handleNextBloco();
            // Esconder o botão após clicar
            const nextBlocoButtonGreen = document.getElementById('nextBlocoButtonGreen');
            if (nextBlocoButtonGreen) {
                nextBlocoButtonGreen.classList.add('hidden');
            }
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
    handleAddBloco() {
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
    validateTimerMode() {
        const timerManualMode = document.getElementById('timerManualMode');
        console.log('Timer manual mode element:', timerManualMode);
        console.log('Timer manual mode classes:', timerManualMode?.classList.toString());
        if (!timerManualMode || timerManualMode.classList.contains('hidden')) {
            console.error('O modo timer manual precisa estar ativo para adicionar blocos');
            return false;
        }
        return true;
    }
    getTimeInputs() {
        const hoursInput = document.getElementById('hours');
        const minutesInput = document.getElementById('minutes');
        const secondsInput = document.getElementById('seconds');
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
    parseTimeInputs(inputs) {
        const hours = parseInt(inputs.hours.value || '0');
        const minutes = parseInt(inputs.minutes.value || '0');
        const seconds = parseInt(inputs.seconds.value || '0');
        console.log('Valores parseados:', { hours, minutes, seconds });
        return { hours, minutes, seconds };
    }
    createBlocoTitle(hours, minutes, seconds) {
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
    clearTimeInputs(inputs) {
        inputs.hours.value = '0';
        inputs.minutes.value = '0';
        inputs.seconds.value = '0';
    }
    handleResetBlocos() {
        console.log('Resetando blocos...');
        this.blocoManager.resetBlocos();
        this.blocoRenderer.render();
        // Limpar os inputs de tempo
        const hoursInput = document.getElementById('hours');
        const minutesInput = document.getElementById('minutes');
        const secondsInput = document.getElementById('seconds');
        if (hoursInput)
            hoursInput.value = '0';
        if (minutesInput)
            minutesInput.value = '0';
        if (secondsInput)
            secondsInput.value = '0';
        console.log('Blocos resetados com sucesso');
    }
    handlePrevBloco() {
        const blocos = this.blocoManager.getBlocos();
        if (blocos.length === 0)
            return;
        const currentIndex = blocos.findIndex(b => b.isActive);
        if (currentIndex === -1)
            return;
        const prevIndex = (currentIndex - 1 + blocos.length) % blocos.length;
        this.updateActiveBloco(currentIndex, prevIndex);
    }
    handleNextBloco() {
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
    updateActiveBloco(currentIndex, newIndex) {
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
//# sourceMappingURL=UIManager.js.map
export class UIEventHandler {
    constructor(timerController, blocoManager, blocoRenderer) {
        this.timerController = timerController;
        this.blocoManager = blocoManager;
        this.blocoRenderer = blocoRenderer;
        this.setupEventListeners();
    }
    setupEventListeners() {
        // Timer controls
        document.getElementById('startButton')?.addEventListener('click', () => this.timerController.start());
        document.getElementById('stopButton')?.addEventListener('click', () => this.timerController.stop());
        document.getElementById('resetButton')?.addEventListener('click', () => this.timerController.reset());
        document.getElementById('pauseButton')?.addEventListener('click', () => this.timerController.pause());
        // Bloco controls
        const addBlocoButton = document.getElementById('addBlocoButton');
        console.log('Botão addBloco encontrado:', addBlocoButton);
        addBlocoButton?.addEventListener('click', () => this.handleAddBloco());
        document.getElementById('resetBlocosButton')?.addEventListener('click', () => this.handleResetBlocos());
        document.getElementById('prevBlocoButton')?.addEventListener('click', () => this.handlePrevBloco());
        document.getElementById('nextBlocoButton')?.addEventListener('click', () => this.handleNextBloco());
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
        this.blocoManager.resetBlocos();
        this.blocoRenderer.render();
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
        const blocos = this.blocoManager.getBlocos();
        if (blocos.length === 0)
            return;
        const currentIndex = blocos.findIndex(b => b.isActive);
        if (currentIndex === -1)
            return;
        const nextIndex = (currentIndex + 1) % blocos.length;
        this.updateActiveBloco(currentIndex, nextIndex);
    }
    updateActiveBloco(currentIndex, newIndex) {
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
//# sourceMappingURL=UIEventHandler.js.map
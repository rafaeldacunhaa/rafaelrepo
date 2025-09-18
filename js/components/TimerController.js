export class TimerController {
    constructor(timer, blocoManager) {
        this.timer = timer;
        this.blocoManager = blocoManager;
    }
    getStatus() {
        return this.timer.getStatus();
    }
    start() {
        const blocos = this.blocoManager.getBlocos();
        if (blocos.length > 0) {
            this.startWithCurrentBlock();
            return;
        }
        this.startWithManualTime();
    }
    restartFromBeginning() {
        const blocos = this.blocoManager.getBlocos();
        if (blocos.length > 0) {
            const firstUnfinishedIndex = this.blocoManager.findFirstUnfinishedBlocoIndex();
            if (firstUnfinishedIndex !== -1) {
                this.blocoManager.setCurrentBlocoIndex(firstUnfinishedIndex);
                this.startWithCurrentBlock();
                return;
            }
            // Todos concluídos: iniciar via tempo manual (com possível autocriação de bloco)
            this.startWithManualTime();
            return;
        }
        this.startWithManualTime();
    }
    stop() {
        this.timer.stop();
    }
    reset() {
        this.timer.reset();
    }
    pause() {
        const pauseButton = document.getElementById('pauseButton');
        if (!pauseButton)
            return;
        if (this.timer.getStatus() === 'running') {
            this.timer.pause();
            pauseButton.textContent = '▶️ Continuar';
        }
        else if (this.timer.getStatus() === 'paused') {
            this.timer.resume();
            pauseButton.textContent = '⏸️ Pausar';
        }
    }
    startWithCurrentBlock() {
        const blocos = this.blocoManager.getBlocos();
        if (blocos.length === 0)
            return;
        const currentBloco = this.blocoManager.getCurrentBloco();
        if (!currentBloco)
            return;
        const milliseconds = currentBloco.duration * 60 * 1000;
        console.log('Iniciando bloco:', currentBloco.title);
        this.timer.start(milliseconds);
    }
    startWithManualTime() {
        const endHourInput = document.getElementById('endHour');
        if (endHourInput?.value) {
            this.startWithEndTime(endHourInput.value);
            return;
        }
        this.startWithDuration();
    }
    startWithEndTime(endTimeStr) {
        const [hours, minutes] = endTimeStr.split(':').map(Number);
        const now = new Date();
        const endTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hours, minutes);
        const milliseconds = endTime.getTime() - now.getTime();
        if (milliseconds <= 0) {
            alert('Por favor, selecione um horário futuro.');
            return;
        }
        // Autocriar bloco se não houver nenhum não concluído
        this.maybeCreateBlockFromMilliseconds(milliseconds);
        this.timer.start(milliseconds);
    }
    startWithDuration() {
        const hoursInput = document.getElementById('hours');
        const minutesInput = document.getElementById('minutes');
        const secondsInput = document.getElementById('seconds');
        if (!this.validateInputs([hoursInput, minutesInput, secondsInput])) {
            return;
        }
        const hours = parseInt(hoursInput.value) || 0;
        const minutes = parseInt(minutesInput.value) || 0;
        const seconds = parseInt(secondsInput.value) || 0;
        const totalMilliseconds = (hours * 3600 + minutes * 60 + seconds) * 1000;
        if (totalMilliseconds <= 0) {
            alert('Por favor, insira um tempo válido.');
            return;
        }
        // Autocriar bloco se não houver nenhum não concluído
        this.maybeCreateBlockFromMilliseconds(totalMilliseconds);
        this.timer.start(totalMilliseconds);
    }
    maybeCreateBlockFromMilliseconds(milliseconds) {
        if (milliseconds <= 0)
            return;
        const firstUnfinishedIndex = this.blocoManager.findFirstUnfinishedBlocoIndex();
        const hasUnfinished = firstUnfinishedIndex !== -1;
        // Se não houver blocos não concluídos, criar um bloco automático sem nome
        if (!hasUnfinished) {
            const minutes = milliseconds / 60000;
            this.blocoManager.addBloco('', minutes);
            const newIndex = this.blocoManager.getBlocos().length - 1;
            this.blocoManager.setCurrentBlocoIndex(newIndex);
        }
    }
    validateInputs(inputs) {
        if (inputs.some(input => !input)) {
            console.error('Elementos de input não encontrados');
            return false;
        }
        return true;
    }
    validateTimerInput(e) {
        const input = e.target;
        const value = input.value;
        const cleanValue = value.replace(/[^0-9]/g, '');
        if (cleanValue.length > 3) {
            input.value = cleanValue.slice(0, 3);
        }
        else {
            input.value = cleanValue;
        }
    }
    cleanup() {
        console.log('Limpando recursos do TimerController');
        this.stop();
        this.reset();
    }
}
//# sourceMappingURL=TimerController.js.map
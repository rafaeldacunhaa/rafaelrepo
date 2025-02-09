import { Timer } from './Timer.js';
import { BlocoManager } from './BlocoManager.js';

export class TimerController {
    private timer: Timer;
    private blocoManager: BlocoManager;

    constructor(timer: Timer, blocoManager: BlocoManager) {
        this.timer = timer;
        this.blocoManager = blocoManager;
    }

    public getStatus(): 'running' | 'paused' | 'stopped' {
        return this.timer.getStatus();
    }

    public start(): void {
        const blocos = this.blocoManager.getBlocos();
        if (blocos.length > 0) {
            this.startWithCurrentBlock();
            return;
        }

        this.startWithManualTime();
    }

    public restartFromBeginning(): void {
        const blocos = this.blocoManager.getBlocos();
        if (blocos.length > 0) {
            // Sempre começa do primeiro bloco quando reinicia
            this.blocoManager.setCurrentBlocoIndex(0);
            this.startWithCurrentBlock();
            return;
        }

        this.startWithManualTime();
    }

    public stop(): void {
        this.timer.stop();
    }

    public reset(): void {
        this.timer.reset();
    }

    public pause(): void {
        const pauseButton = document.getElementById('pauseButton');
        if (!pauseButton) return;

        if (this.timer.getStatus() === 'running') {
            this.timer.pause();
            pauseButton.textContent = '▶️ Continuar';
        } else if (this.timer.getStatus() === 'paused') {
            this.timer.resume();
            pauseButton.textContent = '⏸️ Pausar';
        }
    }

    public startWithCurrentBlock(): void {
        const blocos = this.blocoManager.getBlocos();
        if (blocos.length === 0) return;

        const currentBloco = this.blocoManager.getCurrentBloco();
        if (!currentBloco) return;

        const milliseconds = currentBloco.duration * 60 * 1000;
        console.log('Iniciando bloco:', currentBloco.title);
        this.timer.start(milliseconds);
    }

    private startWithManualTime(): void {
        const endHourInput = document.getElementById('endHour') as HTMLInputElement;
        if (endHourInput?.value) {
            this.startWithEndTime(endHourInput.value);
            return;
        }

        this.startWithDuration();
    }

    private startWithEndTime(endTimeStr: string): void {
        const [hours, minutes] = endTimeStr.split(':').map(Number);
        const now = new Date();
        const endTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hours, minutes);
        const milliseconds = endTime.getTime() - now.getTime();

        if (milliseconds <= 0) {
            alert('Por favor, selecione um horário futuro.');
            return;
        }

        this.timer.start(milliseconds);
    }

    private startWithDuration(): void {
        const hoursInput = document.getElementById('hours') as HTMLInputElement;
        const minutesInput = document.getElementById('minutes') as HTMLInputElement;
        const secondsInput = document.getElementById('seconds') as HTMLInputElement;

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

        this.timer.start(totalMilliseconds);
    }

    private validateInputs(inputs: (HTMLInputElement | null)[]): inputs is HTMLInputElement[] {
        if (inputs.some(input => !input)) {
            console.error('Elementos de input não encontrados');
            return false;
        }
        return true;
    }

    public validateTimerInput(e: Event): void {
        const input = e.target as HTMLInputElement;
        const value = input.value;
        
        const cleanValue = value.replace(/[^0-9]/g, '');
        
        if (cleanValue.length > 3) {
            input.value = cleanValue.slice(0, 3);
        } else {
            input.value = cleanValue;
        }
    }
} 
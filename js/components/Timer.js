import { PiPController } from './PiPController.js';
import { TitleManager } from './TitleManager.js';
export class Timer {
    constructor(audioService, notificationManager) {
        this.endTime = null;
        this.duration = 0;
        this.interval = null;
        this.playedWarning = false;
        this.playedEnd = false;
        this.titleInterval = null;
        this.isPageVisible = true;
        this.isPaused = false;
        this.systemCallbacks = new Map(); // Para callbacks do sistema que não devem ser limpos
        this.callbacks = new Map(); // Para callbacks temporários
        this.status = 'stopped';
        this.lastEndSound = 0;
        this.END_SOUND_INTERVAL = 5 * 60 * 1000; // 5 minutos em milissegundos
        this.lastUpdateTime = 0;
        this.lastPiPTime = '';
        this.lastPiPProgress = 0;
        this.lastPiPStatus = 'stopped';
        this.audioService = audioService;
        this.notificationManager = notificationManager;
        this.timeDisplay = document.getElementById('timeDisplay');
        this.progressBar = document.getElementById('progressBar');
        this.timerContainer = document.getElementById('timerRunning');
        this.originalTitle = document.title;
        this.pipController = new PiPController();
        this.titleManager = new TitleManager();
        document.addEventListener('visibilitychange', () => {
            this.isPageVisible = !document.hidden;
        });
        // Registrar callbacks do sistema que não devem ser limpos
        this.registerSystemCallback('tick', () => this.updatePiP());
        this.registerSystemCallback('stop', () => {
            this.pipController.close();
            this.titleManager.reset();
        });
        this.registerSystemCallback('pause', () => this.updatePiP());
        this.registerSystemCallback('start', () => this.updatePiP());
        console.log('Timer inicializado!');
    }
    registerSystemCallback(event, callback) {
        if (!this.systemCallbacks.has(event)) {
            this.systemCallbacks.set(event, []);
        }
        const callbacks = this.systemCallbacks.get(event);
        if (!callbacks.includes(callback)) {
            callbacks.push(callback);
        }
    }
    emit(event, ...args) {
        // Executar callbacks do sistema primeiro
        const systemCallbacks = this.systemCallbacks.get(event);
        if (systemCallbacks) {
            [...systemCallbacks].forEach(callback => callback(...args));
        }
        // Depois executar callbacks temporários
        const eventCallbacks = this.callbacks.get(event);
        if (eventCallbacks) {
            [...eventCallbacks].forEach(callback => callback(...args));
        }
    }
    on(event, callback) {
        if (!this.callbacks.has(event)) {
            this.callbacks.set(event, []);
        }
        const callbacks = this.callbacks.get(event);
        if (!callbacks.includes(callback)) {
            callbacks.push(callback);
        }
    }
    off(event, callback) {
        const eventCallbacks = this.callbacks.get(event);
        if (eventCallbacks) {
            const index = eventCallbacks.indexOf(callback);
            if (index !== -1) {
                eventCallbacks.splice(index, 1);
            }
        }
    }
    start(milliseconds, onEnd) {
        this.cleanup(); // Limpa recursos anteriores
        this.timerContainer.classList.remove('hidden');
        this.duration = milliseconds;
        this.endTime = Date.now() + milliseconds;
        this.playedWarning = false;
        this.playedEnd = false;
        this.onEnd = onEnd;
        this.lastUpdateTime = milliseconds;
        this.timerContainer.classList.remove('timer-ending', 'timer-ended');
        this.timeDisplay.classList.remove('blink', 'text-yellow-500', 'text-red-500');
        this.updateDisplay(milliseconds);
        this.updateProgress(milliseconds);
        this.interval = window.setInterval(() => this.tick(), 250); // Reduzido para 250ms
        this.status = 'running';
        this.emit('start', { duration: milliseconds });
    }
    tick() {
        if (this.status !== 'running' || !this.endTime)
            return;
        const remaining = this.getRemaining();
        // Aviso quando falta 10% do tempo
        if (remaining <= this.duration * 0.1 && !this.playedWarning && remaining > 0) {
            this.handleTimeWarning();
        }
        // Quando o tempo acaba
        if (remaining <= 0) {
            if (!this.playedEnd) {
                this.handleTimeEnd();
            }
            else {
                // Tocar som novamente a cada 5 minutos após o término
                const timeSinceLastSound = Date.now() - this.lastEndSound;
                if (timeSinceLastSound >= this.END_SOUND_INTERVAL) {
                    this.playEndSound();
                }
            }
        }
        // Atualiza a UI apenas se houver mudança significativa (a cada segundo)
        if (Math.floor(remaining / 1000) !== Math.floor(this.lastUpdateTime / 1000)) {
            this.updateDisplay(remaining);
            this.updateProgress(remaining);
            this.emit('tick', remaining);
            this.lastUpdateTime = remaining;
        }
    }
    handleTimeWarning() {
        this.playedWarning = true;
        this.timerContainer.classList.add('timer-ending');
        this.timeDisplay.classList.add('text-[#151634]');
        this.audioService.playSound('tempoAcabandoSound', {
            volume: 1,
            repeat: 2,
            interval: 500
        });
    }
    playEndSound() {
        this.audioService.playSound('tempoEsgotadoSound', {
            volume: 1,
            repeat: 2,
            interval: 1000
        });
        this.lastEndSound = Date.now();
    }
    async handleTimeEnd() {
        this.playedEnd = true;
        this.timerContainer.classList.remove('timer-ending');
        this.timerContainer.classList.add('timer-ended');
        this.timeDisplay.classList.remove('text-[#151634]');
        this.timeDisplay.classList.add('text-red-500', 'blink');
        this.playEndSound();
        if (!this.isPageVisible) {
            this.titleManager.startBlinking('⏰ TEMPO ESGOTADO!');
            this.notificationManager.sendNotification('Tempo finalizado!');
        }
        const nextBlocoButtonGreen = document.getElementById('nextBlocoButtonGreen');
        if (nextBlocoButtonGreen) {
            nextBlocoButtonGreen.classList.remove('hidden');
        }
        if (this.onEnd) {
            this.onEnd();
        }
    }
    updateDisplay(remaining) {
        const absRemaining = Math.abs(remaining);
        const isNegative = remaining < 0;
        const minutes = Math.floor(absRemaining / 60000);
        const seconds = Math.floor((absRemaining % 60000) / 1000);
        const timeStr = `${isNegative ? '-' : ''}${minutes}:${seconds.toString().padStart(2, '0')}`;
        this.timeDisplay.textContent = timeStr;
        this.titleManager.updateTimeRemaining(timeStr);
    }
    updateProgress(remaining) {
        if (!this.duration)
            return;
        const remainingNum = Number(remaining);
        const durationNum = Number(this.duration);
        let progress;
        const isTimeOver = remainingNum <= 0;
        if (isTimeOver) {
            progress = 100;
        }
        else {
            const timeElapsed = durationNum - remainingNum;
            progress = Number((timeElapsed / durationNum * 100).toFixed(2));
        }
        progress = Math.min(100, Math.max(0, progress));
        this.progressBar.style.cssText = `width: ${progress}% !important; transition: width 0.3s linear;`;
    }
    stop() {
        this.cleanup();
        this.timerContainer.classList.add('hidden');
        this.timerContainer.classList.remove('timer-ending', 'timer-ended');
        this.timeDisplay.classList.remove('blink', 'text-[#151634]', 'text-red-500');
        const nextBlocoButtonGreen = document.getElementById('nextBlocoButtonGreen');
        if (nextBlocoButtonGreen) {
            nextBlocoButtonGreen.classList.add('hidden');
        }
        this.status = 'stopped';
        this.emit('stop', undefined);
    }
    reset() {
        this.stop();
        this.endTime = null;
        this.duration = 0;
        this.playedWarning = false;
        this.playedEnd = false;
        this.isPaused = false;
        this.updateDisplay(0);
        this.updateProgress(0);
        this.titleManager.reset();
    }
    pause() {
        if (this.status === 'running') {
            if (this.interval) {
                clearInterval(this.interval);
            }
            this.status = 'paused';
            this.isPaused = true;
            this.emit('pause', undefined);
        }
    }
    resume() {
        if (this.status === 'paused' && this.endTime) {
            this.cleanup(); // Limpa recursos anteriores
            this.isPaused = false;
            const remaining = this.endTime - Date.now();
            this.endTime = Date.now() + remaining;
            this.interval = window.setInterval(() => this.tick(), 250); // Corrigido para 250ms
            this.status = 'running';
            this.emit('start', { duration: remaining });
        }
    }
    getStatus() {
        return this.status;
    }
    getRemaining() {
        if (!this.endTime)
            return 0;
        return this.endTime - Date.now();
    }
    updatePiP() {
        const currentTime = this.timeDisplay.textContent || '';
        const currentProgress = this.getProgressPercentage();
        if (currentTime !== this.lastPiPTime ||
            Math.abs(currentProgress - this.lastPiPProgress) > 1 ||
            this.status !== this.lastPiPStatus) {
            this.pipController.updateInfo({
                timeDisplay: currentTime,
                blocoName: this.getCurrentBlocoName(),
                status: this.status,
                duration: this.duration,
                remaining: this.getRemaining(),
                progress: currentProgress
            });
            this.lastPiPTime = currentTime;
            this.lastPiPProgress = currentProgress;
            this.lastPiPStatus = this.status;
        }
    }
    getCurrentBlocoName() {
        const blocoName = document.getElementById('currentBlocoName');
        return blocoName?.textContent || '';
    }
    getProgressPercentage() {
        if (!this.duration || !this.endTime)
            return 0;
        const remaining = this.endTime - Date.now();
        const progress = ((this.duration - remaining) / this.duration) * 100;
        return Math.min(100, Math.max(0, progress));
    }
    cleanup() {
        if (this.interval) {
            clearInterval(this.interval);
            this.interval = null;
        }
        if (this.titleInterval) {
            clearInterval(this.titleInterval);
            this.titleInterval = null;
            document.title = this.originalTitle;
        }
        // Limpa apenas callbacks temporários
        this.callbacks.clear();
    }
}
window.Timer = Timer;
//# sourceMappingURL=Timer.js.map
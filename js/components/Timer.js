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
        this.callbacks = new Map();
        this.status = 'stopped';
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
        // Atualizar PiP quando o timer atualizar
        this.on('tick', () => this.updatePiP());
        this.on('stop', () => {
            this.pipController.close();
            this.titleManager.reset();
        });
        this.on('pause', () => this.updatePiP());
        this.on('start', () => this.updatePiP());
        console.log('Timer inicializado!');
    }
    emit(event, ...args) {
        const eventCallbacks = this.callbacks.get(event);
        if (eventCallbacks) {
            eventCallbacks.forEach(callback => callback(...args));
        }
    }
    on(event, callback) {
        if (!this.callbacks.has(event)) {
            this.callbacks.set(event, []);
        }
        this.callbacks.get(event)?.push(callback);
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
        if (this.titleInterval) {
            clearInterval(this.titleInterval);
            document.title = this.originalTitle;
        }
        this.timerContainer.classList.remove('hidden');
        this.duration = milliseconds;
        this.endTime = Date.now() + milliseconds;
        this.playedWarning = false;
        this.playedEnd = false;
        this.onEnd = onEnd;
        if (this.interval) {
            clearInterval(this.interval);
        }
        this.timerContainer.classList.remove('timer-ending', 'timer-ended');
        this.timeDisplay.classList.remove('blink', 'text-yellow-500', 'text-red-500');
        this.updateDisplay(milliseconds);
        this.updateProgress(milliseconds);
        this.interval = window.setInterval(() => this.tick(), 100);
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
        if (remaining <= 0 && !this.playedEnd) {
            this.handleTimeEnd();
        }
        this.updateDisplay(remaining);
        this.updateProgress(remaining);
        this.emit('tick', remaining);
        requestAnimationFrame(() => this.tick());
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
    async handleTimeEnd() {
        this.playedEnd = true;
        this.timerContainer.classList.remove('timer-ending');
        this.timerContainer.classList.add('timer-ended');
        this.timeDisplay.classList.remove('text-[#151634]');
        this.timeDisplay.classList.add('text-red-500', 'blink');
        this.audioService.playSound('tempoEsgotadoSound', {
            volume: 1,
            repeat: 2,
            interval: 1000
        });
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
        if (this.interval) {
            clearInterval(this.interval);
            this.interval = null;
        }
        this.timerContainer.classList.add('hidden');
        this.timerContainer.classList.remove('timer-ending', 'timer-ended');
        this.timeDisplay.classList.remove('blink', 'text-[#151634]', 'text-red-500');
        const nextBlocoButtonGreen = document.getElementById('nextBlocoButtonGreen');
        if (nextBlocoButtonGreen) {
            nextBlocoButtonGreen.classList.add('hidden');
        }
        this.titleManager.reset();
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
            this.isPaused = false;
            const remaining = this.endTime - Date.now();
            this.endTime = Date.now() + remaining;
            this.interval = window.setInterval(() => this.tick(), 100);
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
        this.pipController.updateInfo({
            timeDisplay: this.timeDisplay.textContent || '',
            blocoName: this.getCurrentBlocoName(),
            status: this.status,
            duration: this.duration,
            remaining: this.getRemaining(),
            progress: this.getProgressPercentage()
        });
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
}
window.Timer = Timer;
//# sourceMappingURL=Timer.js.map
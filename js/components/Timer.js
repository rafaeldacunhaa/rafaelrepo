import { PiPController } from './PiPController.js';
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
        document.addEventListener('visibilitychange', () => {
            this.isPageVisible = !document.hidden;
        });
        // Atualizar PiP quando o timer atualizar
        this.on('tick', () => this.updatePiP());
        this.on('stop', () => this.pipController.close());
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
        if (remaining <= 0) {
            this.handleTimeEnd();
            return;
        }
        this.updateDisplay(remaining);
        this.updateProgress(remaining);
        this.emit('tick', remaining);
        requestAnimationFrame(() => this.tick());
    }
    handleTimeWarning() {
        this.playedWarning = true;
        this.timerContainer.classList.add('timer-ending');
        this.timeDisplay.classList.add('text-yellow-500');
        this.audioService.playSound('tempoAcabandoSound', {
            volume: 1,
            repeat: 2,
            interval: 500
        });
    }
    async handleTimeEnd() {
        this.status = 'stopped';
        this.emit('stop');
        this.updateDisplay(0);
        this.audioService.playSound('tempoEsgotadoSound', {
            volume: 1,
            repeat: 2,
            interval: 1000
        });
        if (!this.isPageVisible) {
            try {
                if ('documentPictureInPicture' in window) {
                    const pipWindow = await window.documentPictureInPicture.requestWindow({
                        width: 400,
                        height: 300
                    });
                    const style = document.createElement('style');
                    style.textContent = `
                        body { 
                            margin: 0; 
                            display: flex; 
                            align-items: center; 
                            justify-content: center;
                            background: #151634;
                            color: white;
                            font-family: system-ui;
                        }
                        .pip-container {
                            text-align: center;
                            padding: 20px;
                        }
                        .message {
                            font-size: 24px;
                            font-weight: bold;
                        }
                    `;
                    pipWindow.document.head.appendChild(style);
                    const container = document.createElement('div');
                    container.className = 'pip-container';
                    container.innerHTML = `
                        <div class="message">Tempo Esgotado!</div>
                    `;
                    pipWindow.document.body.appendChild(container);
                    document.addEventListener('visibilitychange', () => {
                        if (!document.hidden && pipWindow) {
                            pipWindow.close();
                        }
                    }, { once: true });
                }
            }
            catch (error) {
                console.log('Picture-in-Picture não suportado:', error);
            }
        }
        this.notificationManager.sendNotification('Tempo finalizado!');
        if (this.onEnd) {
            this.onEnd();
        }
    }
    updateDisplay(remaining) {
        const absRemaining = Math.abs(remaining);
        const isNegative = remaining < 0;
        const minutes = Math.floor(absRemaining / 60000);
        const seconds = Math.floor((absRemaining % 60000) / 1000);
        this.timeDisplay.textContent = `${isNegative ? '-' : ''}${minutes}:${seconds.toString().padStart(2, '0')}`;
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
        this.timeDisplay.classList.remove('blink', 'text-yellow-500', 'text-red-500');
        const nextBlocoButtonGreen = document.getElementById('nextBlocoButtonGreen');
        if (nextBlocoButtonGreen) {
            nextBlocoButtonGreen.classList.add('hidden');
        }
        this.notificationManager.stopTitleAlert();
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
        this.notificationManager.stopTitleAlert();
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
        return Math.max(0, this.endTime - Date.now());
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
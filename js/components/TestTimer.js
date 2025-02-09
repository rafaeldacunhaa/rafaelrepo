export class TestTimer {
    constructor(config) {
        this.status = 'idle';
        this.element = config.element;
        this.duration = config.duration;
        this.remaining = config.duration;
    }
    start() {
        if (this.status === 'running')
            return;
        this.status = 'running';
        this.interval = window.setInterval(() => {
            this.remaining -= 1000;
            this.updateDisplay();
            if (this.remaining <= 0) {
                this.stop();
            }
        }, 1000);
    }
    stop() {
        if (this.interval) {
            clearInterval(this.interval);
        }
        this.status = 'ended';
    }
    updateDisplay() {
        const minutes = Math.floor(this.remaining / 60000);
        const seconds = Math.floor((this.remaining % 60000) / 1000);
        this.element.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }
}
//# sourceMappingURL=TestTimer.js.map
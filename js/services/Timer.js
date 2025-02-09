export class Timer {
    constructor() {
        this.interval = null;
        this.endTime = null;
        this.callbacks = new Map();
        this.status = 'stopped'; // stopped, running, paused
    }

    on(event, callback) {
        if (!this.callbacks.has(event)) {
            this.callbacks.set(event, []);
        }
        this.callbacks.get(event).push(callback);
    }

    emit(event, data) {
        const callbacks = this.callbacks.get(event) || [];
        callbacks.forEach(callback => callback(data));
    }

    start(duration) {
        this.stop();
        this.endTime = Date.now() + duration;
        this.status = 'running';

        this.interval = setInterval(() => {
            const remaining = this.endTime - Date.now();
            
            if (remaining <= 0) {
                this.emit('timeUp', { remaining: 0 });
                this.stop();
            } else {
                this.emit('tick', { remaining });
            }
        }, 100);

        this.emit('start', { duration });
    }

    stop() {
        if (this.interval) {
            clearInterval(this.interval);
            this.interval = null;
        }
        this.status = 'stopped';
        this.emit('stop');
    }

    pause() {
        if (this.status === 'running') {
            clearInterval(this.interval);
            this.status = 'paused';
            this.emit('pause');
        }
    }

    resume() {
        if (this.status === 'paused') {
            const remaining = this.endTime - Date.now();
            this.start(remaining);
        }
    }

    getStatus() {
        return this.status;
    }

    getRemaining() {
        if (!this.endTime) return 0;
        return Math.max(0, this.endTime - Date.now());
    }
} 
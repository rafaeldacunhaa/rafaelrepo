export class TitleManager {
    constructor() {
        this.isBlinking = false;
        this.blinkInterval = null;
        this.originalTitle = document.title;
    }
    updateTimeRemaining(timeDisplay) {
        if (!this.isBlinking) {
            document.title = `${timeDisplay} - ${this.originalTitle}`;
        }
    }
    startBlinking(message) {
        this.isBlinking = true;
        let showMessage = true;
        if (this.blinkInterval) {
            clearInterval(this.blinkInterval);
        }
        this.blinkInterval = window.setInterval(() => {
            document.title = showMessage ? message : this.originalTitle;
            showMessage = !showMessage;
        }, 1000);
    }
    stopBlinking() {
        if (this.blinkInterval) {
            clearInterval(this.blinkInterval);
            this.blinkInterval = null;
        }
        this.isBlinking = false;
        document.title = this.originalTitle;
    }
    reset() {
        this.stopBlinking();
        document.title = this.originalTitle;
    }
}
//# sourceMappingURL=TitleManager.js.map
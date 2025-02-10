export class TitleManager {
    private originalTitle: string;
    private isBlinking: boolean = false;
    private blinkInterval: number | null = null;

    constructor() {
        this.originalTitle = document.title;
    }

    public updateTimeRemaining(timeDisplay: string): void {
        if (!this.isBlinking) {
            document.title = `${timeDisplay} - ${this.originalTitle}`;
        }
    }

    public startBlinking(message: string): void {
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

    public stopBlinking(): void {
        if (this.blinkInterval) {
            clearInterval(this.blinkInterval);
            this.blinkInterval = null;
        }
        this.isBlinking = false;
        document.title = this.originalTitle;
    }

    public reset(): void {
        this.stopBlinking();
        document.title = this.originalTitle;
    }
} 
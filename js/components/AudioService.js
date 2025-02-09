export class AudioService {
    constructor() {
        this.audio = new Audio();
    }
    playSound(soundUrl) {
        this.audio.src = soundUrl;
        this.audio.play().catch(error => {
            console.error('Erro ao tocar som:', error);
        });
    }
    stopSound() {
        this.audio.pause();
        this.audio.currentTime = 0;
    }
}
//# sourceMappingURL=AudioService.js.map
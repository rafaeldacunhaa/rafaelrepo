export class AudioService {
    constructor() {
        this.sounds = new Map();
        this.initializeSounds();
        console.log('AudioService inicializado!');
    }
    playSound(soundId, options = {}) {
        const sound = this.sounds.get(soundId);
        if (!sound)
            return;
        const { volume = 1, repeat = 1, interval = 0 } = options;
        // Configurar volume
        sound.volume = volume;
        // Função para tocar o som
        const play = () => {
            sound.currentTime = 0;
            sound.play().catch(error => console.log('Erro ao tocar som:', error));
        };
        // Tocar som com repetição se necessário
        if (repeat > 1 && interval > 0) {
            let count = 0;
            const intervalId = setInterval(() => {
                play();
                count++;
                if (count >= repeat) {
                    clearInterval(intervalId);
                }
            }, interval);
        }
        else {
            play();
        }
    }
    initializeSounds() {
        // Mapear os sons existentes do HTML
        const soundElements = document.querySelectorAll('audio[id]');
        soundElements.forEach(sound => {
            this.sounds.set(sound.id, sound);
        });
    }
    stopSound(soundId) {
        const sound = this.sounds.get(soundId);
        if (sound) {
            sound.pause();
            sound.currentTime = 0;
        }
    }
}
// Tornar o AudioService disponível globalmente
window.AudioService = AudioService;
//# sourceMappingURL=AudioService.js.map
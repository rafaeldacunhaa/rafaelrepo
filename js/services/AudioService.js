"use strict";
class AudioService {
    constructor() {
        this.sounds = new Map();
        this.initializeSounds();
        console.log('AudioService inicializado!');
    }
    playSound(id, options = {}) {
        const sound = this.sounds.get(id);
        if (!sound)
            return;
        const { volume = 1, repeat = 1, interval = 1000 } = options;
        let playCount = 0;
        const playWithRetry = () => {
            sound.volume = volume;
            sound.currentTime = 0;
            const playPromise = sound.play();
            if (playPromise !== undefined) {
                playPromise.then(() => {
                    playCount++;
                    if (playCount < repeat) {
                        setTimeout(playWithRetry, interval);
                    }
                }).catch(error => {
                    console.log("Erro ao tocar som:", error);
                    setTimeout(playWithRetry, 1000);
                });
            }
        };
        playWithRetry();
    }
    initializeSounds() {
        ['alertSound', 'tempoEsgotadoSound', 'tempoAcabandoSound'].forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                this.sounds.set(id, element);
            }
        });
    }
}
// Tornar o AudioService disponível globalmente
window.AudioService = AudioService;

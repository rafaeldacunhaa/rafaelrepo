import { StorageService } from '../services/StorageService.js';
export class BlocoManager {
    constructor() {
        this.blocos = [];
        this.currentBlocoIndex = -1;
        this.loadFromStorage();
    }
    loadFromStorage() {
        this.blocos = StorageService.loadBlocos();
        this.currentBlocoIndex = StorageService.loadCurrentBlocoIndex();
        console.log('Estado carregado do storage:', {
            blocos: this.blocos,
            currentBlocoIndex: this.currentBlocoIndex
        });
    }
    saveToStorage() {
        StorageService.saveBlocos(this.blocos);
        StorageService.saveCurrentBlocoIndex(this.currentBlocoIndex);
        console.log('Estado salvo no storage:', {
            blocos: this.blocos,
            currentBlocoIndex: this.currentBlocoIndex
        });
    }
    addBloco(title, duration) {
        const bloco = {
            id: crypto.randomUUID(),
            title,
            duration,
            isActive: false
        };
        this.blocos.push(bloco);
        // Se for o primeiro bloco, define ele como atual
        if (this.blocos.length === 1) {
            this.currentBlocoIndex = 0;
            bloco.isActive = true;
        }
        this.saveToStorage();
    }
    removeBloco(id) {
        this.blocos = this.blocos.filter(bloco => bloco.id !== id);
        if (this.blocos.length === 0) {
            this.currentBlocoIndex = -1;
        }
        this.saveToStorage();
    }
    getBlocos() {
        return this.blocos;
    }
    getCurrentBloco() {
        if (this.currentBlocoIndex === -1 || this.blocos.length === 0) {
            return null;
        }
        return this.blocos[this.currentBlocoIndex];
    }
    setCurrentBlocoIndex(index) {
        if (index >= 0 && index < this.blocos.length) {
            // Desativar o bloco atual se existir
            if (this.currentBlocoIndex !== -1) {
                this.blocos[this.currentBlocoIndex].isActive = false;
            }
            // Atualizar o índice e ativar o novo bloco
            this.currentBlocoIndex = index;
            this.blocos[this.currentBlocoIndex].isActive = true;
            this.saveToStorage();
        }
    }
    setNextBloco() {
        if (this.blocos.length === 0) {
            return null;
        }
        // Desativar o bloco atual
        if (this.currentBlocoIndex !== -1) {
            this.blocos[this.currentBlocoIndex].isActive = false;
        }
        // Avançar para o próximo bloco
        this.currentBlocoIndex = (this.currentBlocoIndex + 1) % this.blocos.length;
        this.blocos[this.currentBlocoIndex].isActive = true;
        this.saveToStorage();
        return this.blocos[this.currentBlocoIndex];
    }
    resetBlocos() {
        this.blocos = [];
        this.currentBlocoIndex = -1;
        StorageService.clear();
    }
    clearBlocos() {
        this.blocos = [];
        this.currentBlocoIndex = -1;
        StorageService.clear();
    }
    updateBloco(id, title, duration) {
        const bloco = this.blocos.find(b => b.id === id);
        if (bloco) {
            bloco.title = title;
            bloco.duration = duration;
            this.saveToStorage();
        }
    }
}
//# sourceMappingURL=BlocoManager.js.map
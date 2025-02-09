export class BlocoManager {
    constructor() {
        this.blocos = [];
        this.currentBlocoIndex = -1;
        // Não precisa fazer nada no construtor
    }
    addBloco(title, duration) {
        const bloco = {
            id: crypto.randomUUID(),
            title,
            duration,
            isActive: false
        };
        this.blocos.push(bloco);
    }
    removeBloco(id) {
        this.blocos = this.blocos.filter(bloco => bloco.id !== id);
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
        return this.blocos[this.currentBlocoIndex];
    }
    resetBlocos() {
        this.blocos = [];
        this.currentBlocoIndex = -1;
    }
    clearBlocos() {
        this.blocos = [];
        this.currentBlocoIndex = -1;
    }
    updateBloco(id, title, duration) {
        const bloco = this.blocos.find(b => b.id === id);
        if (bloco) {
            bloco.title = title;
            bloco.duration = duration;
        }
    }
}
//# sourceMappingURL=BlocoManager.js.map
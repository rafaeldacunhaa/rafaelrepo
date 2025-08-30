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
            duration: Number(duration.toFixed(2)),
            isActive: false,
            isDone: false
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
            // Verificar se o bloco não está concluído
            if (this.blocos[index].isDone) {
                console.log('Tentativa de ativar bloco concluído, procurando próximo não concluído...');
                const nextUnfinishedIndex = this.findNextUnfinishedBlocoIndex(index - 1);
                if (nextUnfinishedIndex !== -1) {
                    index = nextUnfinishedIndex;
                }
                else {
                    console.log('Nenhum bloco não concluído encontrado');
                    return;
                }
            }
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
        // Avançar para o próximo bloco não concluído
        this.currentBlocoIndex = this.findNextUnfinishedBlocoIndex(this.currentBlocoIndex);
        if (this.currentBlocoIndex !== -1) {
            this.blocos[this.currentBlocoIndex].isActive = true;
            this.saveToStorage();
            return this.blocos[this.currentBlocoIndex];
        }
        return null;
    }
    findFirstUnfinishedBlocoIndex() {
        const unfinishedIndex = this.blocos.findIndex(bloco => !bloco.isDone);
        return unfinishedIndex !== -1 ? unfinishedIndex : -1;
    }
    findNextUnfinishedBlocoIndex(currentIndex) {
        if (this.blocos.length === 0)
            return -1;
        // Começar a procurar a partir do próximo índice
        let nextIndex = (currentIndex + 1) % this.blocos.length;
        const startIndex = nextIndex;
        do {
            if (!this.blocos[nextIndex].isDone) {
                return nextIndex;
            }
            nextIndex = (nextIndex + 1) % this.blocos.length;
        } while (nextIndex !== startIndex);
        // Se não encontrou nenhum não concluído, retorna -1
        return -1;
    }
    findPrevUnfinishedBlocoIndex(currentIndex) {
        if (this.blocos.length === 0)
            return -1;
        // Começar a procurar a partir do índice anterior
        let prevIndex = (currentIndex - 1 + this.blocos.length) % this.blocos.length;
        const startIndex = prevIndex;
        do {
            if (!this.blocos[prevIndex].isDone) {
                return prevIndex;
            }
            prevIndex = (prevIndex - 1 + this.blocos.length) % this.blocos.length;
        } while (prevIndex !== startIndex);
        // Se não encontrou nenhum não concluído, retorna -1
        return -1;
    }
    resetBlocos() {
        this.blocos = [];
        this.currentBlocoIndex = -1;
        StorageService.clear();
        console.log('Blocos resetados e storage limpo');
    }
    updateBloco(id, title, duration) {
        const bloco = this.blocos.find(b => b.id === id);
        if (bloco) {
            bloco.title = title;
            bloco.duration = duration;
            this.saveToStorage();
        }
    }
    toggleBlocoDone(id) {
        const bloco = this.blocos.find(b => b.id === id);
        if (bloco) {
            bloco.isDone = !bloco.isDone;
            this.saveToStorage();
        }
    }
    markBlocoAsDone(id) {
        const bloco = this.blocos.find(b => b.id === id);
        if (bloco) {
            bloco.isDone = true;
            this.saveToStorage();
        }
    }
    markBlocoAsNotDone(id) {
        const bloco = this.blocos.find(b => b.id === id);
        if (bloco) {
            bloco.isDone = false;
            this.saveToStorage();
        }
    }
}
//# sourceMappingURL=BlocoManager.js.map
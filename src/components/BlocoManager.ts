interface Bloco {
    id: string;
    title: string;
    duration: number;
    isActive: boolean;
}

export class BlocoManager {
    private blocos: Bloco[] = [];
    private currentBlocoIndex: number = -1;

    constructor() {
        // Não precisa fazer nada no construtor
    }

    addBloco(title: string, duration: number): void {
        const bloco: Bloco = {
            id: crypto.randomUUID(),
            title,
            duration,
            isActive: false
        };
        this.blocos.push(bloco);
    }

    removeBloco(id: string): void {
        this.blocos = this.blocos.filter(bloco => bloco.id !== id);
    }

    getBlocos(): Bloco[] {
        return this.blocos;
    }

    getCurrentBloco(): Bloco | null {
        if (this.currentBlocoIndex === -1 || this.blocos.length === 0) {
            return null;
        }
        return this.blocos[this.currentBlocoIndex];
    }

    setCurrentBlocoIndex(index: number): void {
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

    setNextBloco(): Bloco | null {
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

    resetBlocos(): void {
        this.blocos = [];
        this.currentBlocoIndex = -1;
    }

    clearBlocos(): void {
        this.blocos = [];
        this.currentBlocoIndex = -1;
    }

    updateBloco(id: string, title: string, duration: number): void {
        const bloco = this.blocos.find(b => b.id === id);
        if (bloco) {
            bloco.title = title;
            bloco.duration = duration;
        }
    }
} 
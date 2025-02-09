import { Bloco } from '../types/Bloco.js';
import { StorageService } from '../services/StorageService.js';

export class BlocoManager {
    private blocos: Bloco[] = [];
    private currentBlocoIndex: number = -1;

    constructor() {
        this.loadFromStorage();
    }

    private loadFromStorage(): void {
        this.blocos = StorageService.loadBlocos();
        this.currentBlocoIndex = StorageService.loadCurrentBlocoIndex();
        console.log('Estado carregado do storage:', {
            blocos: this.blocos,
            currentBlocoIndex: this.currentBlocoIndex
        });
    }

    private saveToStorage(): void {
        StorageService.saveBlocos(this.blocos);
        StorageService.saveCurrentBlocoIndex(this.currentBlocoIndex);
        console.log('Estado salvo no storage:', {
            blocos: this.blocos,
            currentBlocoIndex: this.currentBlocoIndex
        });
    }

    public addBloco(title: string, duration: number): void {
        const bloco: Bloco = {
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

    public removeBloco(id: string): void {
        this.blocos = this.blocos.filter(bloco => bloco.id !== id);
        if (this.blocos.length === 0) {
            this.currentBlocoIndex = -1;
        }
        this.saveToStorage();
    }

    public getBlocos(): Bloco[] {
        return this.blocos;
    }

    public getCurrentBloco(): Bloco | null {
        if (this.currentBlocoIndex === -1 || this.blocos.length === 0) {
            return null;
        }
        return this.blocos[this.currentBlocoIndex];
    }

    public setCurrentBlocoIndex(index: number): void {
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

    public setNextBloco(): Bloco | null {
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

    public resetBlocos(): void {
        this.blocos = [];
        this.currentBlocoIndex = -1;
        StorageService.clear();
    }

    public clearBlocos(): void {
        this.blocos = [];
        this.currentBlocoIndex = -1;
        StorageService.clear();
    }

    public updateBloco(id: string, title: string, duration: number): void {
        const bloco = this.blocos.find(b => b.id === id);
        if (bloco) {
            bloco.title = title;
            bloco.duration = duration;
            this.saveToStorage();
        }
    }
} 
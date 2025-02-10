import { BlocoManager } from './BlocoManager.js';
import { Bloco } from '../types/Bloco.js';

export class BlocoRenderer {
    private blocoManager: BlocoManager;

    constructor(blocoManager: BlocoManager) {
        this.blocoManager = blocoManager;
    }

    public render(): void {
        console.log('Renderizando blocos...');
        
        // Atualizar visibilidade dos elementos
        this.updateVisibility();
        
        const blocos = this.blocoManager.getBlocos();
        if (blocos.length === 0) {
            return;
        }

        this.renderMainList();
        this.renderOverview();
        this.updateSummary();
    }

    private renderMainList(): void {
        const blocosList = document.getElementById('blocoList');
        if (!blocosList) {
            console.error('Elemento blocoList não encontrado');
            return;
        }

        const blocos = this.blocoManager.getBlocos();
        const templateElement = document.getElementById('blocoTemplate') as HTMLTemplateElement;
        if (!templateElement) {
            console.error('Template de bloco não encontrado');
            return;
        }

        const templateContent = templateElement.innerHTML;
        blocosList.innerHTML = blocos.map(bloco => this.renderBlocoItem(bloco, templateContent)).join('');

        this.updateLucideIcons();
        this.setupBlocoEventListeners(blocos);
    }

    private renderBlocoItem(bloco: Bloco, template: string): string {
        return template
            .replace(/\${id}/g, bloco.id)
            .replace(/\${title}/g, bloco.title)
            .replace(/\${duration}/g, bloco.duration.toString())
            .replace(/\${activeClass}/g, bloco.isActive ? 'border-2 border-indigo-500 dark:border-indigo-400' : '');
    }

    private updateLucideIcons(): void {
        (window as any).lucide.createIcons();
    }

    private setupBlocoEventListeners(blocos: Bloco[]): void {
        blocos.forEach(bloco => {
            const element = document.getElementById(`bloco-${bloco.id}`);
            if (!element) return;

            const editBtn = element.querySelector('.edit-bloco');
            const deleteBtn = element.querySelector('.delete-bloco');

            editBtn?.addEventListener('click', () => this.handleEditBloco(bloco.id));
            deleteBtn?.addEventListener('click', () => this.handleDeleteBloco(bloco.id));
        });
    }

    private renderOverview(): void {
        const blocos = this.blocoManager.getBlocos();
        const blocosOverview = document.getElementById('blocosOverview');
        const blocosOverviewList = document.getElementById('blocosOverviewList');

        if (blocosOverview) {
            blocosOverview.classList.toggle('translate-x-full', blocos.length === 0);
        }

        if (blocosOverviewList) {
            blocosOverviewList.innerHTML = blocos.map(bloco => this.renderOverviewItem(bloco)).join('');
        }

        this.updateCurrentBlocoName(blocos);
    }

    private renderOverviewItem(bloco: Bloco): string {
        return `
            <li class="p-3 rounded-lg ${bloco.isActive ? 'bg-indigo-100 dark:bg-indigo-900' : 'bg-gray-50 dark:bg-gray-700'}">
                <div class="font-medium ${bloco.isActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-800 dark:text-white'}">${bloco.title}</div>
                <div class="text-sm text-gray-600 dark:text-gray-400">${bloco.duration} minutos</div>
            </li>
        `;
    }

    private updateCurrentBlocoName(blocos: Bloco[]): void {
        const currentBlocoName = document.getElementById('currentBlocoName');
        const activeBloco = blocos.find(b => b.isActive);
        
        if (currentBlocoName && activeBloco) {
            currentBlocoName.textContent = activeBloco.title;
        }
    }

    private updateSummary(): void {
        const blocos = this.blocoManager.getBlocos();
        const blocosSummary = document.getElementById('blocosSummary');
        
        if (blocosSummary) {
            blocosSummary.classList.toggle('hidden', blocos.length === 0);
            if (blocos.length > 0) {
                this.updateBlocosSummary(blocos);
            }
        }
    }

    private updateBlocosSummary(blocos: Bloco[]): void {
        const totalMinutes = blocos.reduce((total, bloco) => total + bloco.duration, 0);
        const hours = Math.floor(totalMinutes / 60);
        const minutes = totalMinutes % 60;

        this.updateTempoTotal(hours, minutes);
        this.updateHorarioTermino(totalMinutes);
    }

    private updateTempoTotal(hours: number, minutes: number): void {
        const tempoTotal = document.getElementById('tempoTotal');
        if (tempoTotal) {
            tempoTotal.textContent = `${hours}:${minutes.toString().padStart(2, '0')}`;
        }
    }

    private updateHorarioTermino(totalMinutes: number): void {
        const horarioTermino = document.getElementById('horarioTermino');
        if (horarioTermino) {
            const now = new Date();
            now.setMinutes(now.getMinutes() + totalMinutes);
            horarioTermino.textContent = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
        }
    }

    private handleEditBloco(id: string): void {
        const blocos = this.blocoManager.getBlocos();
        const bloco = blocos.find(b => b.id === id);
        if (!bloco) return;

        const newTitle = prompt('Novo título:', bloco.title);
        const newDuration = prompt('Nova duração (minutos):', bloco.duration.toString());

        if (newTitle && newDuration) {
            const duration = parseInt(newDuration);
            if (!isNaN(duration) && duration > 0) {
                this.blocoManager.updateBloco(id, newTitle, duration);
                this.render();
            }
        }
    }

    private handleDeleteBloco(id: string): void {
        if (confirm('Tem certeza que deseja excluir este bloco?')) {
            this.blocoManager.removeBloco(id);
            this.render();
        }
    }

    private updateVisibility(): void {
        const blocos = this.blocoManager.getBlocos();
        const hasBlocks = blocos.length > 0;

        // Elementos principais
        const blocosPanel = document.getElementById('blocosPanel');
        const toggleBlocosOverview = document.getElementById('toggleBlocosOverview');

        if (hasBlocks) {
            // Mostrar o painel de blocos
            if (blocosPanel) {
                blocosPanel.classList.remove('hidden');
                // Primeiro definir a largura
                requestAnimationFrame(() => {
                    blocosPanel.style.width = '350px';
                    blocosPanel.style.marginLeft = '32px'; // equivalente a ml-8
                    // Depois fazer o fade in
                    setTimeout(() => {
                        blocosPanel.classList.remove('opacity-0');
                    }, 50);
                });
            }
        } else {
            // Esconder o painel de blocos
            if (blocosPanel) {
                // Primeiro esconder o conteúdo
                blocosPanel.classList.add('opacity-0');
                // Depois retrair o painel
                setTimeout(() => {
                    blocosPanel.style.width = '0';
                    blocosPanel.style.marginLeft = '0';
                }, 300);
            }
        }

        // Atualizar visibilidade do botão de toggle
        if (toggleBlocosOverview) {
            toggleBlocosOverview.classList.toggle('hidden', !hasBlocks);
        }
    }
} 
import { BlocoManager } from './BlocoManager.js';
import { Bloco } from '../types/Bloco.js';

export class BlocoRenderer {
    private blocoManager: BlocoManager;
    private lastRenderState: string = '';
    private boundEventListeners: Map<string, { edit: Function, delete: Function }> = new Map();

    constructor(blocoManager: BlocoManager) {
        this.blocoManager = blocoManager;
    }

    public render(): void {
        console.log('Renderizando blocos...');
        
        const blocos = this.blocoManager.getBlocos();
        const currentState = JSON.stringify(blocos);
        
        // Só renderiza se houver mudança real no estado
        if (this.lastRenderState === currentState) {
            console.log('Estado não mudou, pulando renderização');
            return;
        }
        
        this.lastRenderState = currentState;
        
        // Atualizar visibilidade dos elementos
        this.updateVisibility();
        
        if (blocos.length === 0) {
            this.cleanup();
            return;
        }

        this.renderMainList();
        this.renderOverview();
        this.updateSummary();
    }

    private cleanup(): void {
        // Limpa event listeners antigos
        this.boundEventListeners.forEach((listeners, id) => {
            const element = document.getElementById(`bloco-${id}`);
            if (element) {
                const editBtn = element.querySelector('.edit-bloco');
                const deleteBtn = element.querySelector('.delete-bloco');
                
                editBtn?.removeEventListener('click', listeners.edit as any);
                deleteBtn?.removeEventListener('click', listeners.delete as any);
            }
        });
        this.boundEventListeners.clear();
        
        // Limpa conteúdo das listas
        const blocosList = document.getElementById('blocoList');
        const blocosOverviewList = document.getElementById('blocosOverviewList');
        if (blocosList) blocosList.innerHTML = '';
        if (blocosOverviewList) blocosOverviewList.innerHTML = '';
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

        // Criar um fragmento para todas as atualizações
        const fragment = document.createDocumentFragment();
        const templateContent = templateElement.innerHTML;
        
        blocos.forEach(bloco => {
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = this.renderBlocoItem(bloco, templateContent);
            const blocoElement = tempDiv.firstElementChild;
            if (blocoElement) {
                this.setupBlocoEventListeners(blocoElement as HTMLElement, bloco);
                fragment.appendChild(blocoElement);
            }
        });

        // Limpa listeners antigos
        this.cleanup();
        
        // Atualiza o DOM uma única vez
        blocosList.innerHTML = '';
        blocosList.appendChild(fragment);

        // Atualiza ícones após todas as mudanças no DOM
        requestAnimationFrame(() => {
            this.updateLucideIcons();
        });
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

    private setupBlocoEventListeners(element: HTMLElement, bloco: Bloco): void {
        const editBtn = element.querySelector('.edit-bloco');
        const deleteBtn = element.querySelector('.delete-bloco');

        // Criar funções bound para os listeners
        const editListener = () => this.handleEditBloco(bloco.id);
        const deleteListener = () => this.handleDeleteBloco(bloco.id);

        // Adicionar os listeners
        editBtn?.addEventListener('click', editListener);
        deleteBtn?.addEventListener('click', deleteListener);

        // Armazenar os listeners para limpeza posterior
        this.boundEventListeners.set(bloco.id, {
            edit: editListener,
            delete: deleteListener
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
            // Criar um fragmento para todas as atualizações
            const fragment = document.createDocumentFragment();
            blocos.forEach(bloco => {
                const tempDiv = document.createElement('div');
                tempDiv.innerHTML = this.renderOverviewItem(bloco);
                const blocoElement = tempDiv.firstElementChild;
                if (blocoElement) {
                    fragment.appendChild(blocoElement);
                }
            });

            blocosOverviewList.innerHTML = '';
            blocosOverviewList.appendChild(fragment);
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

        // Cache dos elementos DOM
        const blocosPanel = document.getElementById('blocosPanel');
        const toggleBlocosOverview = document.getElementById('toggleBlocosOverview');

        if (hasBlocks && blocosPanel) {
            blocosPanel.classList.remove('hidden');
            // Usar RAF para otimizar animações
            requestAnimationFrame(() => {
                if (blocosPanel) {
                    blocosPanel.style.width = '350px';
                    blocosPanel.style.marginLeft = '32px';
                    requestAnimationFrame(() => {
                        blocosPanel.classList.remove('opacity-0');
                    });
                }
            });
        } else if (blocosPanel) {
            blocosPanel.classList.add('opacity-0');
            // Usar RAF para otimizar animações
            requestAnimationFrame(() => {
                if (blocosPanel) {
                    blocosPanel.style.width = '0';
                    blocosPanel.style.marginLeft = '0';
                }
            });
        }

        if (toggleBlocosOverview) {
            toggleBlocosOverview.classList.toggle('hidden', !hasBlocks);
        }
    }
} 
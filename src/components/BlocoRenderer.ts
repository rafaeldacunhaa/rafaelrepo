import { BlocoManager } from './BlocoManager.js';
import { Bloco } from '../types/Bloco.js';

export class BlocoRenderer {
    private blocoManager: BlocoManager;
    private lastRenderState: string = '';
    private boundEventListeners: Map<string, { edit: Function, delete: Function, toggleDone: Function, save: Function, cancel: Function }> = new Map();
    private isFirstRender: boolean = true;
    private isInitialLoad: boolean = true;
    private hasInitialBlocks: boolean = false;

    constructor(blocoManager: BlocoManager) {
        this.blocoManager = blocoManager;
        this.hasInitialBlocks = this.blocoManager.getBlocos().length > 0;
        
        // Se já existem blocos, configura o painel como já aberto
        if (this.hasInitialBlocks) {
            this.setupInitialPanelState();
        }
    }

    private setupInitialPanelState(): void {
        requestAnimationFrame(() => {
            const blocosPanel = document.getElementById('blocosPanel');
            if (blocosPanel) {
                // Remove transições temporariamente
                blocosPanel.style.transition = 'none';
                blocosPanel.classList.remove('hidden', 'opacity-0');
                blocosPanel.style.width = '350px';
                blocosPanel.style.marginLeft = '32px';
                
                // Força um reflow
                blocosPanel.offsetHeight;
                
                // Restaura as transições
                requestAnimationFrame(() => {
                    blocosPanel.style.transition = '';
                });
            }

            const toggleBlocosOverview = document.getElementById('toggleBlocosOverview');
            if (toggleBlocosOverview) {
                toggleBlocosOverview.classList.remove('hidden');
            }
        });
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
        
        // Sair de todos os modos de edição antes de re-renderizar
        this.exitAllEditModes();
        
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

    public renderActiveBlocoOnly(): void {
        // Renderiza apenas o bloco ativo sem re-renderizar toda a lista
        // Isso é útil quando apenas o status ativo muda
        const blocos = this.blocoManager.getBlocos();
        const activeBloco = blocos.find(b => b.isActive);
        
        if (activeBloco) {
            // Atualizar apenas o nome do bloco ativo na interface do timer
            this.updateCurrentBlocoName(blocos);
            
            // Atualizar apenas o overview se necessário
            this.renderOverview();
        }
    }

    private cleanup(): void {
        // Limpa event listeners antigos
        this.boundEventListeners.forEach((listeners, id) => {
            const element = document.getElementById(`bloco-${id}`);
            if (element) {
                const toggleDoneBtn = element.querySelector('.toggle-done-bloco');
                const editBtn = element.querySelector('.edit-bloco');
                const deleteBtn = element.querySelector('.delete-bloco');
                const saveBtn = element.querySelector('.save-bloco');
                const cancelBtn = element.querySelector('.cancel-edit');
                
                toggleDoneBtn?.removeEventListener('click', listeners.toggleDone as any);
                editBtn?.removeEventListener('click', listeners.edit as any);
                deleteBtn?.removeEventListener('click', listeners.delete as any);
                saveBtn?.removeEventListener('click', listeners.save as any);
                cancelBtn?.removeEventListener('click', listeners.cancel as any);
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
        const doneClass = bloco.isDone ? 'bg-green-50 dark:bg-green-900/30 border-l-4 border-l-green-500' : '';
        const doneTextClass = bloco.isDone ? 'line-through text-gray-500 dark:text-gray-400' : '';
        const doneButtonClass = bloco.isDone ? 'text-green-600 dark:text-green-400' : 'text-gray-400 dark:text-gray-500';
        const doneButtonTitle = bloco.isDone ? 'Marcar como não feito' : 'Marcar como feito';
        const doneIcon = bloco.isDone ? 'check-circle' : 'circle';

        return template
            .replace(/\${id}/g, bloco.id)
            .replace(/\${title}/g, bloco.title)
            .replace(/\${duration}/g, bloco.duration.toString())
            .replace(/\${activeClass}/g, bloco.isActive ? 'border-2 border-indigo-500 dark:border-indigo-400' : '')
            .replace(/\${doneClass}/g, doneClass)
            .replace(/\${doneTextClass}/g, doneTextClass)
            .replace(/\${doneButtonClass}/g, doneButtonClass)
            .replace(/\${doneButtonTitle}/g, doneButtonTitle)
            .replace(/\${doneIcon}/g, doneIcon);
    }

    private updateLucideIcons(): void {
        (window as any).lucide.createIcons();
    }

    private setupBlocoEventListeners(element: HTMLElement, bloco: Bloco): void {
        const toggleDoneBtn = element.querySelector('.toggle-done-bloco');
        const editBtn = element.querySelector('.edit-bloco');
        const deleteBtn = element.querySelector('.delete-bloco');
        const saveBtn = element.querySelector('.save-bloco');
        const cancelBtn = element.querySelector('.cancel-edit');

        // Criar funções bound para os listeners
        const toggleDoneListener = () => this.handleToggleDoneBloco(bloco.id);
        const editListener = () => this.handleEditBlocoInline(bloco.id);
        const deleteListener = () => this.handleDeleteBloco(bloco.id);
        const saveListener = () => this.handleSaveBlocoInline(bloco.id);
        const cancelListener = () => this.handleCancelEditInline(bloco.id);

        // Adicionar os listeners
        toggleDoneBtn?.addEventListener('click', toggleDoneListener);
        editBtn?.addEventListener('click', editListener);
        deleteBtn?.addEventListener('click', deleteListener);
        saveBtn?.addEventListener('click', saveListener);
        cancelBtn?.addEventListener('click', cancelListener);

        // Armazenar os listeners para limpeza posterior
        this.boundEventListeners.set(bloco.id, {
            edit: editListener,
            delete: deleteListener,
            toggleDone: toggleDoneListener,
            save: saveListener,
            cancel: cancelListener
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
        const doneClass = bloco.isDone ? 'bg-green-100 dark:bg-green-900' : '';
        const doneTextClass = bloco.isDone ? 'line-through text-gray-500 dark:text-gray-400' : '';
        const doneIcon = bloco.isDone ? '✓' : '';
        
        return `
            <li class="p-3 rounded-lg ${bloco.isActive ? 'bg-indigo-100 dark:bg-indigo-900' : doneClass || 'bg-gray-50 dark:bg-gray-700'}">
                <div class="font-medium ${bloco.isActive ? 'text-indigo-600 dark:text-indigo-400' : doneTextClass || 'text-gray-800 dark:text-white'} flex items-center gap-2">
                    ${bloco.title}
                    ${doneIcon ? `<span class="text-green-600 dark:text-green-400 text-sm">${doneIcon}</span>` : ''}
                </div>
                <div class="text-sm text-gray-600 dark:text-gray-400">${bloco.duration} minutos</div>
            </li>
        `;
    }

    private updateCurrentBlocoName(blocos: Bloco[]): void {
        const currentBlocoName = document.getElementById('currentBlocoName');
        const activeBloco = blocos.find(b => b.isActive);
        
        if (currentBlocoName) {
            if (activeBloco) {
            currentBlocoName.textContent = activeBloco.title;
            } else {
                // Verificar se todos os blocos estão concluídos
                const allDone = blocos.length > 0 && blocos.every(b => b.isDone);
                if (allDone) {
                    currentBlocoName.textContent = '🎉 Todos os blocos concluídos!';
                } else {
                    currentBlocoName.textContent = 'Nenhum bloco ativo';
                }
            }
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
        const doneCount = blocos.filter(bloco => bloco.isDone).length;
        const totalCount = blocos.length;

        this.updateTempoTotal(hours, minutes);
        this.updateHorarioTermino(totalMinutes);
        this.updateBlocosProgress(doneCount, totalCount);
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

    private updateBlocosProgress(doneCount: number, totalCount: number): void {
        const blocosSummary = document.getElementById('blocosSummary');
        if (blocosSummary && totalCount > 0) {
            const progressElement = blocosSummary.querySelector('.blocos-progress');
            if (progressElement) {
                let progressText = `${doneCount}/${totalCount} blocos concluídos`;
                
                // Adicionar mensagem especial quando todos estão concluídos
                if (doneCount === totalCount) {
                    progressText += ' 🎉 Todos concluídos!';
                    progressElement.classList.add('text-green-600', 'dark:text-green-400', 'font-medium');
                } else {
                    progressElement.classList.remove('text-green-600', 'dark:text-green-400', 'font-medium');
                }
                
                progressElement.textContent = progressText;
            }
        }
    }

    private handleEditBlocoInline(id: string): void {
        const element = document.getElementById(`bloco-${id}`);
        if (!element) return;

        // Salvar valores originais para cancelamento
        const originalTitle = element.querySelector('.bloco-title')?.textContent || '';
        const originalDuration = element.querySelector('.bloco-duration')?.textContent?.replace('min', '') || '';
        
        element.setAttribute('data-original-title', originalTitle);
        element.setAttribute('data-original-duration', originalDuration);

        // Alternar para modo de edição
        const viewMode = element.querySelector('.bloco-view-mode');
        const editMode = element.querySelector('.bloco-edit-mode');
        const viewButtons = element.querySelector('.bloco-view-buttons');
        const editButtons = element.querySelector('.bloco-edit-buttons');

        if (viewMode && editMode && viewButtons && editButtons) {
            viewMode.classList.add('hidden');
            editMode.classList.remove('hidden');
            viewButtons.classList.add('hidden');
            editButtons.classList.remove('hidden');
        }

        // Focar no campo de título
        const titleInput = element.querySelector('.bloco-title-input') as HTMLInputElement;
        const durationInput = element.querySelector('.bloco-duration-input') as HTMLInputElement;
        
        if (titleInput) {
            titleInput.focus();
            titleInput.select();
            
            // Adicionar listeners para teclas
            const handleKeyPress = (e: KeyboardEvent) => {
                if (e.key === 'Enter') {
                    this.handleSaveBlocoInline(id);
                } else if (e.key === 'Escape') {
                    this.handleCancelEditInline(id);
                }
            };
            
            const handleDurationKeyPress = (e: KeyboardEvent) => {
                if (e.key === 'Enter') {
                    this.handleSaveBlocoInline(id);
                } else if (e.key === 'Escape') {
                    this.handleCancelEditInline(id);
                }
            };
            
            titleInput.addEventListener('keydown', handleKeyPress);
            if (durationInput) {
                durationInput.addEventListener('keydown', handleDurationKeyPress);
            }
            
            // Armazenar listeners para limpeza posterior
            element.setAttribute('data-key-listeners', 'true');
        }
    }

    private handleSaveBlocoInline(id: string): void {
        const element = document.getElementById(`bloco-${id}`);
        if (!element) return;

        const titleInput = element.querySelector('.bloco-title-input') as HTMLInputElement;
        const durationInput = element.querySelector('.bloco-duration-input') as HTMLInputElement;

        if (!titleInput || !durationInput) return;

        const newTitle = titleInput.value.trim();
        const newDuration = parseInt(durationInput.value);

        // Validações
        if (!newTitle) {
            alert('O nome do bloco não pode estar vazio.');
            return;
        }

        if (isNaN(newDuration) || newDuration <= 0) {
            alert('A duração deve ser um número maior que zero.');
            return;
        }

        // Atualizar o bloco
        this.blocoManager.updateBloco(id, newTitle, newDuration);
        
        // Voltar para modo de visualização
        this.exitEditMode(element);
        
        // Re-renderizar para atualizar a interface
        this.render();
    }

    private handleCancelEditInline(id: string): void {
        const element = document.getElementById(`bloco-${id}`);
        if (!element) return;

        // Restaurar valores originais
        const originalTitle = element.getAttribute('data-original-title') || '';
        const originalDuration = element.getAttribute('data-original-duration') || '';

        const titleInput = element.querySelector('.bloco-title-input') as HTMLInputElement;
        const durationInput = element.querySelector('.bloco-duration-input') as HTMLInputElement;

        if (titleInput && durationInput) {
            titleInput.value = originalTitle;
            durationInput.value = originalDuration;
        }

        // Voltar para modo de visualização
        this.exitEditMode(element);
    }

    private exitEditMode(element: HTMLElement): void {
        const viewMode = element.querySelector('.bloco-view-mode');
        const editMode = element.querySelector('.bloco-edit-mode');
        const viewButtons = element.querySelector('.bloco-view-buttons');
        const editButtons = element.querySelector('.bloco-edit-buttons');

        if (viewMode && editMode && viewButtons && editButtons) {
            viewMode.classList.remove('hidden');
            editMode.classList.add('hidden');
            viewButtons.classList.remove('hidden');
            editButtons.classList.add('hidden');
        }

        // Limpar listeners de teclado se existirem
        if (element.getAttribute('data-key-listeners') === 'true') {
            element.removeAttribute('data-key-listeners');
        }
    }

    private handleToggleDoneBloco(id: string): void {
        this.blocoManager.toggleBlocoDone(id);
        this.render();
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
        const wasEmpty = !this.lastRenderState || this.lastRenderState === '[]';
        
        // Só deve animar se:
        // 1. Não é a carga inicial E
        // 2. Estava vazio antes E
        // 3. Agora tem blocos
        const shouldAnimate = !this.isInitialLoad && wasEmpty && hasBlocks;

        // Cache dos elementos DOM
        const blocosPanel = document.getElementById('blocosPanel');
        const toggleBlocosOverview = document.getElementById('toggleBlocosOverview');

        if (hasBlocks && blocosPanel) {
            // Verificar se o painel já está visível e configurado
            const isAlreadyVisible = this.isPanelStable();

            if (this.isInitialLoad && this.hasInitialBlocks) {
                // Na carga inicial com blocos, apenas mantém o estado
                blocosPanel.classList.remove('hidden', 'opacity-0');
                blocosPanel.style.width = '350px';
                blocosPanel.style.marginLeft = '32px';
            } else if (shouldAnimate) {
                // Anima apenas quando adiciona o primeiro bloco
                blocosPanel.classList.remove('hidden');
                requestAnimationFrame(() => {
                    if (blocosPanel) {
                        blocosPanel.style.width = '350px';
                        blocosPanel.style.marginLeft = '32px';
                        requestAnimationFrame(() => {
                            blocosPanel.classList.remove('opacity-0');
                        });
                    }
                });
            } else if (!isAlreadyVisible) {
                // Só anima se não estiver já visível
                blocosPanel.classList.remove('hidden', 'opacity-0');
                blocosPanel.style.width = '350px';
                blocosPanel.style.marginLeft = '32px';
            } else {
                // Painel já está estável, não faz nada - evita a piscada
                console.log('Painel de blocos já está estável, pulando animação');
            }
            
            // Mostrar mensagem especial se todos os blocos estiverem concluídos
            this.showAllDoneMessage(blocos);
        } else if (blocosPanel) {
            blocosPanel.classList.add('opacity-0');
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

        // Marca que não é mais a carga inicial após a primeira atualização
        this.isInitialLoad = false;
    }

    private showAllDoneMessage(blocos: Bloco[]): void {
        const allDone = blocos.length > 0 && blocos.every(b => b.isDone);
        const blocosList = document.getElementById('blocoList');
        
        if (allDone && blocosList) {
            // Adicionar mensagem de parabéns no final da lista
            const congratsElement = blocosList.querySelector('.all-done-message');
            if (!congratsElement) {
                const congratsDiv = document.createElement('div');
                congratsDiv.className = 'all-done-message p-4 text-center bg-green-50 dark:bg-green-900/30 rounded-lg border-2 border-green-200 dark:border-green-700';
                congratsDiv.innerHTML = `
                    <div class="text-green-700 dark:text-green-300 font-medium text-lg mb-2">🎉 Parabéns!</div>
                    <div class="text-green-600 dark:text-green-400 text-sm">Todos os blocos foram concluídos com sucesso!</div>
                `;
                blocosList.appendChild(congratsDiv);
            }
        } else if (blocosList) {
            // Remover mensagem de parabéns se não estiver mais tudo concluído
            const congratsElement = blocosList.querySelector('.all-done-message');
            if (congratsElement) {
                congratsElement.remove();
            }
        }
    }

    public exitAllEditModes(): void {
        // Sair de todos os modos de edição ativos
        const editingElements = document.querySelectorAll('.bloco-item[data-key-listeners="true"]');
        editingElements.forEach(element => {
            this.exitEditMode(element as HTMLElement);
        });
    }

    private isPanelStable(): boolean {
        const blocosPanel = document.getElementById('blocosPanel');
        if (!blocosPanel) return false;
        
        return !blocosPanel.classList.contains('hidden') && 
               !blocosPanel.classList.contains('opacity-0') &&
               blocosPanel.style.width === '350px' &&
               blocosPanel.style.marginLeft === '32px';
    }
} 
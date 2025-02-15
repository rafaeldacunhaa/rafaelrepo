export class BlocoRenderer {
    constructor(blocoManager) {
        this.lastRenderState = '';
        this.boundEventListeners = new Map();
        this.isFirstRender = true;
        this.isInitialLoad = true;
        this.hasInitialBlocks = false;
        this.blocoManager = blocoManager;
        this.hasInitialBlocks = this.blocoManager.getBlocos().length > 0;
        // Se já existem blocos, configura o painel como já aberto
        if (this.hasInitialBlocks) {
            this.setupInitialPanelState();
        }
    }
    setupInitialPanelState() {
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
    render() {
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
    cleanup() {
        // Limpa event listeners antigos
        this.boundEventListeners.forEach((listeners, id) => {
            const element = document.getElementById(`bloco-${id}`);
            if (element) {
                const editBtn = element.querySelector('.edit-bloco');
                const deleteBtn = element.querySelector('.delete-bloco');
                editBtn?.removeEventListener('click', listeners.edit);
                deleteBtn?.removeEventListener('click', listeners.delete);
            }
        });
        this.boundEventListeners.clear();
        // Limpa conteúdo das listas
        const blocosList = document.getElementById('blocoList');
        const blocosOverviewList = document.getElementById('blocosOverviewList');
        if (blocosList)
            blocosList.innerHTML = '';
        if (blocosOverviewList)
            blocosOverviewList.innerHTML = '';
    }
    renderMainList() {
        const blocosList = document.getElementById('blocoList');
        if (!blocosList) {
            console.error('Elemento blocoList não encontrado');
            return;
        }
        const blocos = this.blocoManager.getBlocos();
        const templateElement = document.getElementById('blocoTemplate');
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
                this.setupBlocoEventListeners(blocoElement, bloco);
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
    renderBlocoItem(bloco, template) {
        return template
            .replace(/\${id}/g, bloco.id)
            .replace(/\${title}/g, bloco.title)
            .replace(/\${duration}/g, bloco.duration.toString())
            .replace(/\${activeClass}/g, bloco.isActive ? 'border-2 border-indigo-500 dark:border-indigo-400' : '');
    }
    updateLucideIcons() {
        window.lucide.createIcons();
    }
    setupBlocoEventListeners(element, bloco) {
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
    renderOverview() {
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
    renderOverviewItem(bloco) {
        return `
            <li class="p-3 rounded-lg ${bloco.isActive ? 'bg-indigo-100 dark:bg-indigo-900' : 'bg-gray-50 dark:bg-gray-700'}">
                <div class="font-medium ${bloco.isActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-800 dark:text-white'}">${bloco.title}</div>
                <div class="text-sm text-gray-600 dark:text-gray-400">${bloco.duration} minutos</div>
            </li>
        `;
    }
    updateCurrentBlocoName(blocos) {
        const currentBlocoName = document.getElementById('currentBlocoName');
        const activeBloco = blocos.find(b => b.isActive);
        if (currentBlocoName && activeBloco) {
            currentBlocoName.textContent = activeBloco.title;
        }
    }
    updateSummary() {
        const blocos = this.blocoManager.getBlocos();
        const blocosSummary = document.getElementById('blocosSummary');
        if (blocosSummary) {
            blocosSummary.classList.toggle('hidden', blocos.length === 0);
            if (blocos.length > 0) {
                this.updateBlocosSummary(blocos);
            }
        }
    }
    updateBlocosSummary(blocos) {
        const totalMinutes = blocos.reduce((total, bloco) => total + bloco.duration, 0);
        const hours = Math.floor(totalMinutes / 60);
        const minutes = totalMinutes % 60;
        this.updateTempoTotal(hours, minutes);
        this.updateHorarioTermino(totalMinutes);
    }
    updateTempoTotal(hours, minutes) {
        const tempoTotal = document.getElementById('tempoTotal');
        if (tempoTotal) {
            tempoTotal.textContent = `${hours}:${minutes.toString().padStart(2, '0')}`;
        }
    }
    updateHorarioTermino(totalMinutes) {
        const horarioTermino = document.getElementById('horarioTermino');
        if (horarioTermino) {
            const now = new Date();
            now.setMinutes(now.getMinutes() + totalMinutes);
            horarioTermino.textContent = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
        }
    }
    handleEditBloco(id) {
        const blocos = this.blocoManager.getBlocos();
        const bloco = blocos.find(b => b.id === id);
        if (!bloco)
            return;
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
    handleDeleteBloco(id) {
        if (confirm('Tem certeza que deseja excluir este bloco?')) {
            this.blocoManager.removeBloco(id);
            this.render();
        }
    }
    updateVisibility() {
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
            if (this.isInitialLoad && this.hasInitialBlocks) {
                // Na carga inicial com blocos, apenas mantém o estado
                blocosPanel.classList.remove('hidden', 'opacity-0');
                blocosPanel.style.width = '350px';
                blocosPanel.style.marginLeft = '32px';
            }
            else if (shouldAnimate) {
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
            }
            else {
                // Para outras situações, apenas atualiza sem animação
                blocosPanel.classList.remove('hidden', 'opacity-0');
                blocosPanel.style.width = '350px';
                blocosPanel.style.marginLeft = '32px';
            }
        }
        else if (blocosPanel) {
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
}
//# sourceMappingURL=BlocoRenderer.js.map
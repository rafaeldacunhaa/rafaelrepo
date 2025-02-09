export class BlocoRenderer {
    constructor(blocoManager) {
        this.blocoManager = blocoManager;
    }
    render() {
        this.renderMainList();
        this.renderOverview();
        this.updateSummary();
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
        const templateContent = templateElement.innerHTML;
        blocosList.innerHTML = blocos.map(bloco => this.renderBlocoItem(bloco, templateContent)).join('');
        this.updateLucideIcons();
        this.setupBlocoEventListeners(blocos);
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
    setupBlocoEventListeners(blocos) {
        blocos.forEach(bloco => {
            const element = document.getElementById(`bloco-${bloco.id}`);
            if (!element)
                return;
            const editBtn = element.querySelector('.edit-bloco');
            const deleteBtn = element.querySelector('.delete-bloco');
            editBtn?.addEventListener('click', () => this.handleEditBloco(bloco.id));
            deleteBtn?.addEventListener('click', () => this.handleDeleteBloco(bloco.id));
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
            blocosOverviewList.innerHTML = blocos.map(bloco => this.renderOverviewItem(bloco)).join('');
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
}
//# sourceMappingURL=BlocoRenderer.js.map
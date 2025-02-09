import { Timer } from './Timer.js';
import { BlocoManager } from './BlocoManager.js';
import { AudioService } from '../services/AudioService.js';
import { reunioesPredefinidas, BlocoTemplate, ReunioesPredefinidas } from '../data/templates.js';

export class UIManager {
    private timer: Timer;
    private blocoManager: BlocoManager;
    private audioService: AudioService;
    private templates: { [key: string]: string } = {};

    constructor(timer: Timer, blocoManager: BlocoManager, audioService: AudioService) {
        this.timer = timer;
        this.blocoManager = blocoManager;
        this.audioService = audioService;
        this.setupKeyboardShortcuts();
        this.setupTemplates();
    }

    setupEventListeners(): void {
        // Timer controls
        document.getElementById('startButton')?.addEventListener('click', () => this.handleStartTimer());
        document.getElementById('stopButton')?.addEventListener('click', () => this.handleStopTimer());
        document.getElementById('resetButton')?.addEventListener('click', () => this.handleResetTimer());
        document.getElementById('pauseButton')?.addEventListener('click', () => this.handlePauseTimer());

        // Bloco controls
        document.getElementById('addBlocoButton')?.addEventListener('click', () => this.handleAddBloco());
        document.getElementById('resetBlocosButton')?.addEventListener('click', () => this.handleResetBlocos());
        document.getElementById('prevBlocoButton')?.addEventListener('click', () => this.handlePrevBloco());
        document.getElementById('nextBlocoButton')?.addEventListener('click', () => this.handleNextBloco());
        
        // Timer input validation
        const timerInput = document.getElementById('timerInput') as HTMLInputElement;
        if (timerInput) {
            timerInput.addEventListener('input', (e) => this.validateTimerInput(e));
        }
    }

    initializeTemplates(): void {
        const templateElements = document.querySelectorAll('[type="text/template"]');
        templateElements.forEach(element => {
            const id = element.id;
            if (id) {
                this.templates[id] = element.textContent || '';
            }
        });
    }

    private setupKeyboardShortcuts(): void {
        document.addEventListener('keydown', (e) => {
            // Ignorar atalhos se estiver em um input
            if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

            switch(e.key.toLowerCase()) {
                case ' ':  // Espaço
                    e.preventDefault();
                    if (this.timer.getStatus() === 'running') {
                        this.handlePauseTimer();
                    } else if (this.timer.getStatus() === 'paused') {
                        this.handlePauseTimer();
                    } else {
                        this.handleStartTimer();
                    }
                    break;
                case 'escape':
                    this.handleStopTimer();
                    break;
                case 'r':
                    this.handleResetTimer();
                    break;
            }
        });
    }

    private handleStartTimer(): void {
        // Verificar se existem blocos configurados
        const blocos = this.blocoManager.getBlocos();
        if (blocos.length > 0) {
            this.startTimerWithCurrentBlock();
            return;
        }

        // Verificar se estamos no modo horário final
        const endHourInput = document.getElementById('endHour') as HTMLInputElement;
        if (endHourInput?.value) {
            const [hours, minutes] = endHourInput.value.split(':').map(Number);
            const now = new Date();
            const endTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hours, minutes);
            const milliseconds = endTime.getTime() - now.getTime();

            if (milliseconds <= 0) {
                alert('Por favor, selecione um horário futuro.');
                return;
            }

            this.timer.start(milliseconds);
            return;
        }

        // Modo timer manual
        const hoursInput = document.getElementById('hours') as HTMLInputElement;
        const minutesInput = document.getElementById('minutes') as HTMLInputElement;
        const secondsInput = document.getElementById('seconds') as HTMLInputElement;

        // Verificar se todos os elementos existem
        if (!hoursInput || !minutesInput || !secondsInput) {
            console.error('Elementos de input não encontrados');
            return;
        }

        const hours = parseInt(hoursInput.value) || 0;
        const minutes = parseInt(minutesInput.value) || 0;
        const seconds = parseInt(secondsInput.value) || 0;
        
        const totalMilliseconds = (hours * 3600 + minutes * 60 + seconds) * 1000;
        
        if (totalMilliseconds <= 0) {
            alert('Por favor, insira um tempo válido.');
            return;
        }

        this.timer.start(totalMilliseconds);
    }

    private handleStopTimer(): void {
        this.timer.stop();
    }

    private handleResetTimer(): void {
        this.timer.reset();
    }

    private handlePauseTimer(): void {
        const pauseButton = document.getElementById('pauseButton');
        if (!pauseButton) return;

        if (this.timer.getStatus() === 'running') {
            this.timer.pause();
            pauseButton.textContent = '▶️ Continuar';
        } else if (this.timer.getStatus() === 'paused') {
            this.timer.resume();
            pauseButton.textContent = '⏸️ Pausar';
        }
    }

    private handleAddBloco(): void {
        // Obter os valores dos inputs de tempo
        const hoursInput = document.getElementById('hours') as HTMLInputElement;
        const minutesInput = document.getElementById('minutes') as HTMLInputElement;
        const secondsInput = document.getElementById('seconds') as HTMLInputElement;
        
        if (!hoursInput || !minutesInput || !secondsInput) {
            console.error('Elementos de input não encontrados');
            return;
        }

        const hours = parseInt(hoursInput.value) || 0;
        const minutes = parseInt(minutesInput.value) || 0;
        const seconds = parseInt(secondsInput.value) || 0;
        
        // Converter para minutos totais
        const totalMinutes = Math.ceil((hours * 60) + minutes + (seconds / 60));
        
        if (totalMinutes <= 0) {
            alert('Por favor, configure um tempo válido primeiro.');
            return;
        }

        // Criar título automático baseado no tempo
        let title = '';
        if (hours > 0) {
            title += `${hours}h `;
        }
        if (minutes > 0 || seconds > 0) {
            title += `${minutes}min`;
        }
        if (seconds > 0) {
            title += ` ${seconds}s`;
        }
        title = title.trim();

        // Adicionar o bloco
        this.blocoManager.addBloco(title, totalMinutes);
        this.renderBlocos();

        // Limpar os campos do timer
        hoursInput.value = '0';
        minutesInput.value = '0';
        secondsInput.value = '0';
    }

    private handleResetBlocos(): void {
        this.blocoManager.resetBlocos();
        this.renderBlocos();
    }

    private validateTimerInput(e: Event): void {
        const input = e.target as HTMLInputElement;
        const value = input.value;
        
        // Remover caracteres não numéricos
        const cleanValue = value.replace(/[^0-9]/g, '');
        
        // Limitar a 3 dígitos
        if (cleanValue.length > 3) {
            input.value = cleanValue.slice(0, 3);
        } else {
            input.value = cleanValue;
        }
    }

    private renderBlocos(): void {
        // Renderizar na lista principal
        const blocosList = document.getElementById('blocoList');
        if (!blocosList) {
            console.error('Elemento blocoList não encontrado');
            return;
        }

        const blocos = this.blocoManager.getBlocos();
        const currentBloco = this.blocoManager.getCurrentBloco();

        // Primeiro, obter o template do DOM
        const templateElement = document.getElementById('blocoTemplate') as HTMLTemplateElement;
        if (!templateElement) {
            console.error('Template de bloco não encontrado');
            return;
        }

        const templateContent = templateElement.innerHTML;
        blocosList.innerHTML = blocos.map(bloco => {
            return templateContent
                .replace(/\${id}/g, bloco.id)
                .replace(/\${title}/g, bloco.title)
                .replace(/\${duration}/g, bloco.duration.toString())
                .replace(/\${activeClass}/g, bloco.isActive ? 'active' : '');
        }).join('');

        // Renderizar na visão geral durante o timer
        const blocosOverviewList = document.getElementById('blocosOverviewList');
        if (blocosOverviewList) {
            blocosOverviewList.innerHTML = blocos.map(bloco => `
                <li class="p-3 rounded-lg ${bloco.isActive ? 'bg-indigo-100 dark:bg-indigo-900' : 'bg-gray-50 dark:bg-gray-700'}">
                    <div class="font-medium ${bloco.isActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-800 dark:text-white'}">${bloco.title}</div>
                    <div class="text-sm text-gray-600 dark:text-gray-400">${bloco.duration} minutos</div>
                </li>
            `).join('');
        }

        // Atualizar nome do bloco atual no timer
        const currentBlocoName = document.getElementById('currentBlocoName');
        if (currentBlocoName && currentBloco) {
            currentBlocoName.textContent = currentBloco.title;
        }

        // Atualizar ícones do Lucide após renderizar
        (window as any).lucide.createIcons();

        // Adicionar event listeners para os botões de cada bloco
        blocos.forEach(bloco => {
            const element = document.getElementById(`bloco-${bloco.id}`);
            if (!element) return;

            const editBtn = element.querySelector('.edit-bloco');
            const deleteBtn = element.querySelector('.delete-bloco');

            editBtn?.addEventListener('click', () => this.handleEditBloco(bloco.id));
            deleteBtn?.addEventListener('click', () => this.handleDeleteBloco(bloco.id));
        });

        // Atualizar a visibilidade do sumário dos blocos
        const blocosSummary = document.getElementById('blocosSummary');
        if (blocosSummary) {
            blocosSummary.classList.toggle('hidden', blocos.length === 0);
            if (blocos.length > 0) {
                this.updateBlocosSummary(blocos);
            }
        }

        // Atualizar visibilidade do painel lateral
        const blocosOverview = document.getElementById('blocosOverview');
        if (blocosOverview) {
            blocosOverview.classList.toggle('translate-x-full', blocos.length === 0);
        }
    }

    private updateBlocosSummary(blocos: any[]): void {
        const totalMinutes = blocos.reduce((total, bloco) => total + bloco.duration, 0);
        const hours = Math.floor(totalMinutes / 60);
        const minutes = totalMinutes % 60;

        const tempoTotal = document.getElementById('tempoTotal');
        if (tempoTotal) {
            tempoTotal.textContent = `${hours}:${minutes.toString().padStart(2, '0')}`;
        }

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
                this.renderBlocos();
            }
        }
    }

    private handleDeleteBloco(id: string): void {
        if (confirm('Tem certeza que deseja excluir este bloco?')) {
            this.blocoManager.removeBloco(id);
            this.renderBlocos();
        }
    }

    private setupTemplates(): void {
        const reuniaoTemplateSelect = document.getElementById('reuniaoTemplate') as HTMLSelectElement;
        if (!reuniaoTemplateSelect) {
            console.error('Elemento reuniaoTemplate não encontrado');
            return;
        }

        // Limpar opções existentes
        reuniaoTemplateSelect.innerHTML = '<option value="" disabled selected>Templates</option>';

        // Adicionar templates
        Object.keys(reunioesPredefinidas).forEach(templateName => {
            const option = document.createElement('option');
            option.value = templateName;
            option.textContent = templateName.charAt(0).toUpperCase() + templateName.slice(1);
            reuniaoTemplateSelect.appendChild(option);
        });

        // Adicionar event listener
        reuniaoTemplateSelect.addEventListener('change', () => {
            const selectedTemplate = reuniaoTemplateSelect.value;
            if (!selectedTemplate) return;

            const templateBlocos = reunioesPredefinidas[selectedTemplate];
            if (!templateBlocos) {
                console.error('Template não encontrado:', selectedTemplate);
                return;
            }

            // Limpar completamente os blocos existentes
            this.blocoManager.clearBlocos();

            // Adicionar os novos blocos
            templateBlocos.forEach(bloco => {
                this.blocoManager.addBloco(bloco.name, bloco.duration);
            });

            // Atualizar a interface
            this.renderBlocos();

            // Resetar o select
            reuniaoTemplateSelect.selectedIndex = 0;
        });
    }

    private startTimerWithCurrentBlock(): void {
        const currentBloco = this.blocoManager.getCurrentBloco() || this.blocoManager.setNextBloco();
        if (currentBloco) {
            // Converter minutos para milissegundos
            const milliseconds = currentBloco.duration * 60 * 1000;
            this.timer.start(milliseconds, () => {
                // Quando o timer terminar, passar para o próximo bloco
                const nextBloco = this.blocoManager.setNextBloco();
                if (nextBloco) {
                    this.startTimerWithCurrentBlock();
                }
            });
            this.renderBlocos();
        }
    }

    private handlePrevBloco(): void {
        const blocos = this.blocoManager.getBlocos();
        if (blocos.length === 0) return;

        // Encontrar o índice do bloco atual
        const currentIndex = blocos.findIndex(b => b.isActive);
        if (currentIndex === -1) return;

        // Calcular o índice anterior
        const prevIndex = (currentIndex - 1 + blocos.length) % blocos.length;

        // Desativar o bloco atual
        blocos[currentIndex].isActive = false;

        // Ativar o bloco anterior
        blocos[prevIndex].isActive = true;
        this.blocoManager.setCurrentBlocoIndex(prevIndex);

        // Iniciar o timer com o novo bloco
        const prevBloco = blocos[prevIndex];
        const milliseconds = prevBloco.duration * 60 * 1000;
        this.timer.start(milliseconds, () => {
            const nextBloco = this.blocoManager.setNextBloco();
            if (nextBloco) {
                this.startTimerWithCurrentBlock();
            }
        });

        this.renderBlocos();
    }

    private handleNextBloco(): void {
        const blocos = this.blocoManager.getBlocos();
        if (blocos.length === 0) return;

        // Encontrar o índice do bloco atual
        const currentIndex = blocos.findIndex(b => b.isActive);
        if (currentIndex === -1) return;

        // Calcular o próximo índice
        const nextIndex = (currentIndex + 1) % blocos.length;

        // Desativar o bloco atual
        blocos[currentIndex].isActive = false;

        // Ativar o próximo bloco
        blocos[nextIndex].isActive = true;
        this.blocoManager.setCurrentBlocoIndex(nextIndex);

        // Iniciar o timer com o novo bloco
        const nextBloco = blocos[nextIndex];
        const milliseconds = nextBloco.duration * 60 * 1000;
        this.timer.start(milliseconds, () => {
            const nextBloco = this.blocoManager.setNextBloco();
            if (nextBloco) {
                this.startTimerWithCurrentBlock();
            }
        });

        this.renderBlocos();
    }
} 
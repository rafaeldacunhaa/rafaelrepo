export class TabManager {
    private timerManualTab: HTMLElement | null;
    private horarioFinalTab: HTMLElement | null;
    private timerManualMode: HTMLElement | null;
    private horarioFinalMode: HTMLElement | null;
    private startBlocosQueueButton: HTMLElement | null;

    constructor() {
        this.timerManualTab = document.getElementById('timerManualTab');
        this.horarioFinalTab = document.getElementById('horarioFinalTab');
        this.timerManualMode = document.getElementById('timerManualMode');
        this.horarioFinalMode = document.getElementById('horarioFinalMode');
        this.startBlocosQueueButton = document.getElementById('startBlocosQueueButton');

        this.initialize();
    }

    private initialize(): void {
        if (!this.timerManualTab || !this.horarioFinalTab || !this.timerManualMode || !this.horarioFinalMode) {
            console.error('Elementos das tabs não encontrados');
            return;
        }

        // Configurar event listeners
        this.timerManualTab.addEventListener('click', () => this.switchToManualMode());
        this.horarioFinalTab.addEventListener('click', () => this.switchToFinalMode());

        // Iniciar com o modo manual ativo
        this.switchToManualMode();
    }

    private switchToManualMode(): void {
        if (!this.timerManualTab || !this.horarioFinalTab || !this.timerManualMode || !this.horarioFinalMode) return;

        // Atualizar classes das tabs
        this.timerManualTab.classList.add('bg-white', 'dark:bg-gray-800', 'shadow');
        this.timerManualTab.classList.remove('text-gray-600', 'dark:text-gray-300');
        
        this.horarioFinalTab.classList.remove('bg-white', 'dark:bg-gray-800', 'shadow');
        this.horarioFinalTab.classList.add('text-gray-600', 'dark:text-gray-300');

        // Mostrar/ocultar modos
        this.timerManualMode.classList.remove('hidden');
        this.horarioFinalMode.classList.add('hidden');

        this.timerManualTab.setAttribute('aria-selected', 'true');
        this.horarioFinalTab.setAttribute('aria-selected', 'false');
        this.timerManualTab.tabIndex = 0;
        this.horarioFinalTab.tabIndex = -1;
        this.timerManualMode.removeAttribute('aria-hidden');
        this.horarioFinalMode.setAttribute('aria-hidden', 'true');

        this.startBlocosQueueButton?.classList.remove('hidden');
    }

    private switchToFinalMode(): void {
        if (!this.timerManualTab || !this.horarioFinalTab || !this.timerManualMode || !this.horarioFinalMode) return;

        // Atualizar classes das tabs
        this.horarioFinalTab.classList.add('bg-white', 'dark:bg-gray-800', 'shadow');
        this.horarioFinalTab.classList.remove('text-gray-600', 'dark:text-gray-300');
        
        this.timerManualTab.classList.remove('bg-white', 'dark:bg-gray-800', 'shadow');
        this.timerManualTab.classList.add('text-gray-600', 'dark:text-gray-300');

        // Mostrar/ocultar modos
        this.timerManualMode.classList.add('hidden');
        this.horarioFinalMode.classList.remove('hidden');

        this.timerManualTab.setAttribute('aria-selected', 'false');
        this.horarioFinalTab.setAttribute('aria-selected', 'true');
        this.timerManualTab.tabIndex = -1;
        this.horarioFinalTab.tabIndex = 0;
        this.timerManualMode.setAttribute('aria-hidden', 'true');
        this.horarioFinalMode.removeAttribute('aria-hidden');

        this.startBlocosQueueButton?.classList.add('hidden');
    }
} 
export class TabManager {
    constructor() {
        this.timerManualTab = document.getElementById('timerManualTab');
        this.horarioFinalTab = document.getElementById('horarioFinalTab');
        this.timerManualMode = document.getElementById('timerManualMode');
        this.horarioFinalMode = document.getElementById('horarioFinalMode');
        this.initialize();
    }
    initialize() {
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
    switchToManualMode() {
        if (!this.timerManualTab || !this.horarioFinalTab || !this.timerManualMode || !this.horarioFinalMode)
            return;
        // Atualizar classes das tabs
        this.timerManualTab.classList.add('bg-white', 'dark:bg-gray-800', 'shadow');
        this.timerManualTab.classList.remove('text-gray-600', 'dark:text-gray-300');
        this.horarioFinalTab.classList.remove('bg-white', 'dark:bg-gray-800', 'shadow');
        this.horarioFinalTab.classList.add('text-gray-600', 'dark:text-gray-300');
        // Mostrar/ocultar modos
        this.timerManualMode.classList.remove('hidden');
        this.horarioFinalMode.classList.add('hidden');
    }
    switchToFinalMode() {
        if (!this.timerManualTab || !this.horarioFinalTab || !this.timerManualMode || !this.horarioFinalMode)
            return;
        // Atualizar classes das tabs
        this.horarioFinalTab.classList.add('bg-white', 'dark:bg-gray-800', 'shadow');
        this.horarioFinalTab.classList.remove('text-gray-600', 'dark:text-gray-300');
        this.timerManualTab.classList.remove('bg-white', 'dark:bg-gray-800', 'shadow');
        this.timerManualTab.classList.add('text-gray-600', 'dark:text-gray-300');
        // Mostrar/ocultar modos
        this.timerManualMode.classList.add('hidden');
        this.horarioFinalMode.classList.remove('hidden');
    }
}
//# sourceMappingURL=TabManager.js.map
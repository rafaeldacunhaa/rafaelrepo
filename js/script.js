import { Timer } from './components/Timer.js';
import { BlocoManager } from './components/BlocoManager.js';
import { UIManager } from './components/UIManager.js';
import { AudioService } from './services/AudioService.js';
import { NotificationManager } from './components/NotificationManager.js';
import { ThemeService } from './services/ThemeService.js';
import { WorkerService } from './services/WorkerService.js';
import { TabManager } from './components/TabManager.js';
console.log('Módulos importados com sucesso');
document.addEventListener('DOMContentLoaded', () => {
    console.log('Iniciando aplicação...');
    try {
        // Inicializar serviços base
        console.log('Inicializando AudioService...');
        const audioService = new AudioService();
        window.audioService = audioService;
        console.log('Inicializando WorkerService...');
        const workerService = new WorkerService();
        window.workerService = workerService;
        console.log('Inicializando NotificationManager...');
        const notificationManager = new NotificationManager(workerService);
        window.notificationManager = notificationManager;
        console.log('Inicializando ThemeService...');
        const themeService = new ThemeService();
        window.themeService = themeService;
        console.log('Serviços base inicializados');
        // Inicializar componentes principais
        console.log('Inicializando Timer...');
        const timer = new Timer(audioService, notificationManager);
        window.timer = timer;
        console.log('Inicializando BlocoManager...');
        const blocoManager = new BlocoManager();
        window.blocoManager = blocoManager;
        console.log('Componentes principais inicializados');
        // Inicializar gerenciador de UI
        console.log('Inicializando UIManager...');
        const uiManager = new UIManager(timer, blocoManager, audioService);
        window.uiManager = uiManager;
        console.log('Inicializando TabManager...');
        const tabManager = new TabManager();
        window.tabManager = tabManager;
        console.log('UI Manager inicializado');
        // Inicializar ícones
        console.log('Inicializando ícones...');
        window.lucide.createIcons();
        console.log('Aplicação inicializada com sucesso');
    }
    catch (error) {
        console.error('Erro durante a inicialização:', error);
    }
});
//# sourceMappingURL=script.js.map
import { Timer } from './components/Timer.js';
import { BlocoManager } from './components/BlocoManager.js';
import { UIManager } from './components/UIManager.js';
import { NotificationManager } from './components/NotificationManager.js';
import { AudioService } from './services/AudioService.js';
import { ThemeService } from './services/ThemeService.js';
import { WorkerService } from './services/WorkerService.js';

document.addEventListener('DOMContentLoaded', function() {
    // Inicializar serviços
    const audioService = new AudioService();
    const themeService = new ThemeService();
    const workerService = new WorkerService();
    const notificationManager = new NotificationManager(workerService);
    
    // Inicializar componentes principais
    const timer = new Timer(audioService, notificationManager);
    const blocoManager = new BlocoManager();
    const uiManager = new UIManager(timer, blocoManager, audioService);
    
    // Configurar event listeners principais
    uiManager.setupEventListeners();
    
    // Inicializar ícones e templates
    (window as any).lucide.createIcons();
    uiManager.initializeTemplates();
}); 
import { TimerController } from './TimerController.js';
import { BlocoManager } from './BlocoManager.js';
import { BlocoRenderer } from './BlocoRenderer.js';

// Removendo esta classe pois está duplicando funcionalidade com UIManager
// export class UIEventHandler {
//     private timerController: TimerController;
//     private blocoManager: BlocoManager;
//     private blocoRenderer: BlocoRenderer;

//     constructor(timerController: TimerController, blocoManager: BlocoManager, blocoRenderer: BlocoRenderer) {
//         this.timerController = timerController;
//         this.blocoManager = blocoManager;
//         this.blocoRenderer = blocoRenderer;
//         this.setupEventListeners();
//     }
// } 
import { Timer } from '../components/Timer';
import { BlocoManager } from '../components/BlocoManager';
import { UIManager } from '../components/UIManager';
import { AudioService } from '../services/AudioService';
import { NotificationManager } from '../components/NotificationManager';
import { ThemeService } from '../services/ThemeService';
import { WorkerService } from '../services/WorkerService';
import { TabManager } from '../components/TabManager';

declare global {
    interface Window {
        timer: Timer;
        blocoManager: BlocoManager;
        uiManager: UIManager;
        audioService: AudioService;
        notificationManager: NotificationManager;
        themeService: ThemeService;
        workerService: WorkerService;
        tabManager: TabManager;
        lucide: {
            createIcons: () => void;
        };
    }
} 
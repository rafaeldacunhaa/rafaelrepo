import { PiPManager } from './PiPManager.js';
export class PiPController {
    constructor() {
        this.lastInfo = null;
        this.pipManager = new PiPManager();
        this.pipButton = document.getElementById('pipButton');
        this.setupPiPButton();
    }
    setupPiPButton() {
        if (this.pipButton) {
            this.pipButton.addEventListener('click', () => this.togglePiP());
        }
    }
    async togglePiP() {
        if (this.pipManager.isOpen()) {
            this.pipManager.close();
            this.updatePiPButton(false);
            return;
        }
        await this.pipManager.open(this.getLastInfo());
        this.updatePiPButton(true);
    }
    updateInfo(info) {
        this.lastInfo = info;
        if (this.pipManager.isOpen()) {
            this.pipManager.update(info);
        }
    }
    getLastInfo() {
        return this.lastInfo || {
            timeDisplay: '0:00',
            blocoName: 'Timer em execução',
            status: 'stopped',
            duration: 0,
            remaining: 0,
            progress: 0
        };
    }
    close() {
        this.pipManager.close();
        this.updatePiPButton(false);
    }
    updatePiPButton(isOpen) {
        if (this.pipButton) {
            const icon = this.pipButton.querySelector('i');
            if (icon) {
                icon.setAttribute('data-lucide', isOpen ? 'picture-in-picture-off' : 'picture-in-picture-2');
                window.lucide.createIcons();
            }
        }
    }
}
//# sourceMappingURL=PiPController.js.map
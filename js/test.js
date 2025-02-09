"use strict";
class TestTypeScript {
    constructor() {
        this.element = document.createElement('div');
        this.element.className = 'fixed top-20 right-4 bg-white p-4 rounded shadow z-50';
        this.showMessage({
            text: "TypeScript está rafael funcionando! ✨",
            color: "#151634"
        });
        document.body.appendChild(this.element);
    }
    showMessage(msg) {
        this.element.innerHTML = `
            <p style="color: ${msg.color}; font-weight: bold;">
                ${msg.text}
            </p>
        `;
    }
}
// Inicializar quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', () => {
    new TestTypeScript();
});
//# sourceMappingURL=test.js.map
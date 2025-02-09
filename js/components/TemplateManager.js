import { reunioesPredefinidas } from '../data/templates.js';
export class TemplateManager {
    constructor(blocoManager, blocoRenderer) {
        this.templates = {};
        console.log('TemplateManager inicializado', { blocoManager, blocoRenderer });
        this.blocoManager = blocoManager;
        this.blocoRenderer = blocoRenderer;
        this.initializeTemplates();
        this.setupTemplates();
    }
    initializeTemplates() {
        console.log('Inicializando templates...');
        const templateElements = document.querySelectorAll('[type="text/template"]');
        console.log('Templates encontrados:', templateElements.length);
        templateElements.forEach(element => {
            const id = element.id;
            if (id) {
                this.templates[id] = element.textContent || '';
                console.log(`Template ${id} carregado`);
            }
        });
        console.log('Templates disponíveis:', this.templates);
    }
    setupTemplates() {
        console.log('Configurando templates...');
        const reuniaoTemplateSelect = document.getElementById('reuniaoTemplate');
        if (!reuniaoTemplateSelect) {
            console.error('Elemento reuniaoTemplate não encontrado');
            return;
        }
        this.populateTemplateSelect(reuniaoTemplateSelect);
        this.setupTemplateListener(reuniaoTemplateSelect);
        console.log('Templates configurados com sucesso');
    }
    populateTemplateSelect(select) {
        console.log('Populando select com templates:', Object.keys(reunioesPredefinidas));
        select.innerHTML = '<option value="" disabled selected>Templates</option>';
        Object.keys(reunioesPredefinidas).forEach(templateName => {
            const option = document.createElement('option');
            option.value = templateName;
            option.textContent = templateName.charAt(0).toUpperCase() + templateName.slice(1);
            select.appendChild(option);
            console.log(`Opção adicionada: ${templateName}`);
        });
    }
    setupTemplateListener(select) {
        select.addEventListener('change', (e) => {
            console.log('Template selecionado - evento change disparado');
            const target = e.target;
            const selectedTemplate = target.value;
            console.log('Template selecionado:', selectedTemplate);
            if (!selectedTemplate) {
                console.log('Nenhum template selecionado');
                return;
            }
            this.applyTemplate(selectedTemplate);
            target.selectedIndex = 0;
        });
    }
    applyTemplate(templateName) {
        console.log('Aplicando template:', templateName);
        const templateBlocos = reunioesPredefinidas[templateName];
        console.log('Blocos do template:', templateBlocos);
        if (!templateBlocos) {
            console.error('Template não encontrado:', templateName);
            return;
        }
        console.log('Resetando blocos existentes...');
        this.blocoManager.resetBlocos();
        console.log('Adicionando novos blocos...');
        templateBlocos.forEach(bloco => {
            console.log('Adicionando bloco:', bloco);
            this.blocoManager.addBloco(bloco.name, bloco.duration);
        });
        console.log('Renderizando blocos...');
        this.blocoRenderer.render();
        console.log('Template aplicado com sucesso');
    }
}
//# sourceMappingURL=TemplateManager.js.map
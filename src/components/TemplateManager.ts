import { reunioesPredefinidas, BlocoTemplate } from '../data/templates.js';
import { BlocoManager } from './BlocoManager.js';
import { BlocoRenderer } from './BlocoRenderer.js';

export class TemplateManager {
    private blocoManager: BlocoManager;
    private blocoRenderer: BlocoRenderer;
    private templates: { [key: string]: string } = {};

    constructor(blocoManager: BlocoManager, blocoRenderer: BlocoRenderer) {
        console.log('TemplateManager inicializado', { blocoManager, blocoRenderer });
        this.blocoManager = blocoManager;
        this.blocoRenderer = blocoRenderer;
        this.initializeTemplates();
        this.setupTemplates();
    }

    public initializeTemplates(): void {
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

    private setupTemplates(): void {
        console.log('Configurando templates...');
        const reuniaoTemplateSelect = document.getElementById('reuniaoTemplate') as HTMLSelectElement;
        if (!reuniaoTemplateSelect) {
            console.error('Elemento reuniaoTemplate não encontrado');
            return;
        }

        this.populateTemplateSelect(reuniaoTemplateSelect);
        this.setupTemplateListener(reuniaoTemplateSelect);
        console.log('Templates configurados com sucesso');
    }

    private populateTemplateSelect(select: HTMLSelectElement): void {
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

    private setupTemplateListener(select: HTMLSelectElement): void {
        select.addEventListener('change', (e) => {
            console.log('Template selecionado - evento change disparado');
            const target = e.target as HTMLSelectElement;
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

    private applyTemplate(templateName: string): void {
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
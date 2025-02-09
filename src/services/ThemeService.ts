class ThemeService {
    private themeToggle: HTMLElement;
    private moonIcon: HTMLElement;

    constructor() {
        this.themeToggle = document.getElementById('themeToggle')!;
        this.moonIcon = this.themeToggle.querySelector('i')!;
        this.initializeTheme();
        console.log('ThemeService inicializado!');
    }

    private initializeTheme(): void {
        // Verificar tema salvo
        if (localStorage.theme === 'dark' || 
            (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
            document.documentElement.classList.add('dark');
            this.updateThemeIcon(true);
        }

        // Adicionar listener para toggle
        this.themeToggle.addEventListener('click', () => {
            const isDark = document.documentElement.classList.toggle('dark');
            this.updateThemeIcon(isDark);
            localStorage.setItem('theme', isDark ? 'dark' : 'light');
        });
    }

    private updateThemeIcon(isDark: boolean): void {
        this.moonIcon.setAttribute('data-lucide', isDark ? 'sun' : 'moon');
        (window as any).lucide.createIcons();
    }
}

// Tornar o ThemeService disponível globalmente
(window as any).ThemeService = ThemeService; 
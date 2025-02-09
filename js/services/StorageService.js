export class StorageService {
    static saveBlocos(blocos) {
        try {
            localStorage.setItem(this.BLOCOS_KEY, JSON.stringify(blocos));
            console.log('Blocos salvos:', blocos);
        }
        catch (error) {
            console.error('Erro ao salvar blocos:', error);
        }
    }
    static loadBlocos() {
        try {
            const blocosJson = localStorage.getItem(this.BLOCOS_KEY);
            if (!blocosJson) {
                console.log('Nenhum bloco encontrado no storage');
                return [];
            }
            const blocos = JSON.parse(blocosJson);
            console.log('Blocos carregados:', blocos);
            return blocos;
        }
        catch (error) {
            console.error('Erro ao carregar blocos:', error);
            return [];
        }
    }
    static saveCurrentBlocoIndex(index) {
        try {
            localStorage.setItem(this.CURRENT_BLOCO_INDEX_KEY, index.toString());
            console.log('Índice do bloco atual salvo:', index);
        }
        catch (error) {
            console.error('Erro ao salvar índice do bloco atual:', error);
        }
    }
    static loadCurrentBlocoIndex() {
        try {
            const index = localStorage.getItem(this.CURRENT_BLOCO_INDEX_KEY);
            if (!index) {
                console.log('Nenhum índice encontrado no storage');
                return -1;
            }
            const parsedIndex = parseInt(index);
            console.log('Índice do bloco atual carregado:', parsedIndex);
            return parsedIndex;
        }
        catch (error) {
            console.error('Erro ao carregar índice do bloco atual:', error);
            return -1;
        }
    }
    static clear() {
        try {
            localStorage.removeItem(this.BLOCOS_KEY);
            localStorage.removeItem(this.CURRENT_BLOCO_INDEX_KEY);
            console.log('Storage limpo com sucesso');
        }
        catch (error) {
            console.error('Erro ao limpar storage:', error);
        }
    }
}
StorageService.BLOCOS_KEY = 'cronnaclimba_blocos';
StorageService.CURRENT_BLOCO_INDEX_KEY = 'cronnaclimba_current_bloco_index';
//# sourceMappingURL=StorageService.js.map
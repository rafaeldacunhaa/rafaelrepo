# Melhorias no Sistema Picture-in-Picture (PiP)

## Problema Identificado
Quando outro sistema abre um Picture-in-Picture, ele pode sobrepor o cronômetro, tornando-o invisível para o usuário.

## Soluções Implementadas

### 1. **Auto-Abertura Inteligente do PiP** ⭐ **NOVO!**
- **Abertura automática** sempre que você sair da aba ou aplicação
- **Garantia de visibilidade** do cronômetro em segundo plano
- **Indicador visual** mostrando que o auto-PiP está ativo
- **Controle manual** para ativar/desativar a funcionalidade

### 2. **Detecção Automática de Perda de Visibilidade**
- Monitoramento contínuo da visibilidade da janela PiP a cada 2 segundos
- Detecção automática quando o PiP é sobreposto ou perde foco
- Sistema robusto de recuperação de estado

### 3. **Indicadores Visuais Inteligentes**
- **Dot de Status**: Indicador colorido no canto do botão PiP
  - 🟢 Verde: PiP ativo e visível
  - 🟡 Amarelo: PiP ativo mas perdido/perdendo foco
  - Invisível: PiP não está ativo

- **Indicador de Auto-PiP**: 🔄 Símbolo verde quando ativo
- **Tooltip Informativo**: Mostra o status atual ao passar o mouse
- **Animação de Alerta**: Botão pisca quando o PiP está perdido

### 4. **Notificações Múltiplas**
- **Notificações Desktop**: Alertas nativos do sistema operacional
- **Notificações Visuais**: Alertas na interface web
- **Notificações Interativas**: Clique para restaurar o PiP
- **Notificações de Auto-Abertura**: Informam quando o PiP foi aberto automaticamente

### 5. **Sistema de Recuperação Inteligente**
- **Restauração Automática**: Tenta focar na janela PiP existente
- **Reabertura Inteligente**: Se necessário, reabre com informações atuais
- **Preservação de Estado**: Mantém timer, blocos e progresso

### 6. **Melhorias na Interface**
- **Botão Adaptativo**: Muda ícone e cor baseado no estado
- **Feedback Visual**: Animações e transições suaves
- **Acessibilidade**: Tooltips e títulos informativos

## Como Funciona

### Auto-Abertura Automática
```typescript
// Monitora mudanças de visibilidade da página
document.addEventListener('visibilitychange', () => {
    if (!this.isPageVisible && !this.pipManager.isOpen() && this.autoPiPEnabled) {
        // Abrir PiP automaticamente quando sair da aba
        this.openPiPAutomatically();
    }
});

// Monitora quando a janela perde foco
window.addEventListener('blur', () => {
    if (!this.pipManager.isOpen() && this.autoPiPEnabled) {
        // Abrir PiP automaticamente quando mudar de aplicação
        this.openPiPAutomatically();
    }
});
```

### Monitoramento de Visibilidade
```typescript
// Verifica a cada 2 segundos se o PiP ainda está visível
private checkPiPVisibility(): void {
    const isWindowActive = !this.pipWindow.closed;
    const isWindowVisible = this.pipWindow.document.visibilityState === 'visible';
    
    if (isWindowActive && isWindowVisible) {
        // PiP está visível
        this.isPiPVisible = true;
    } else {
        // PiP perdeu visibilidade
        this.isPiPVisible = false;
        this.showPiPLostNotification();
    }
}
```

### Sistema de Eventos
- `pipVisibilityChanged`: Disparado quando a visibilidade muda
- `pipButtonStateChanged`: Disparado quando o estado do botão muda
- `visibilitychange`: Disparado quando a aba perde/ganha foco
- `blur/focus`: Disparado quando a janela perde/ganha foco
- Integração com sistema de notificações nativo

### Recuperação Automática
```typescript
public async restore(): Promise<void> {
    if (!this.pipWindow || this.pipWindow.closed) {
        // Reabrir se foi fechado
        await this.open(this.getLastInfo());
    } else {
        // Focar se ainda está aberto
        this.pipWindow.focus();
    }
}
```

## Benefícios

1. **Visibilidade Garantida**: Usuário sempre sabe o estado do PiP
2. **Auto-Abertura Inteligente**: PiP abre automaticamente quando necessário
3. **Recuperação Rápida**: Um clique restaura a visibilidade
4. **Experiência Fluida**: Transições suaves e feedback visual
5. **Robustez**: Funciona mesmo com múltiplos sistemas PiP
6. **Acessibilidade**: Múltiplas formas de notificação
7. **Nunca Esquece**: Timer sempre visível quando você sai da aba

## Configurações

- **Auto-PiP**: Ativado por padrão (configurável)
- **Intervalo de Verificação**: 2 segundos (configurável)
- **Timeout de Notificação**: 10 segundos para notificações visuais
- **Notificações Desktop**: Requer permissão do usuário
- **Animações**: Suaves e não intrusivas

## Compatibilidade

- ✅ Chrome/Edge (suporte nativo ao Document PiP)
- ✅ Firefox (suporte básico)
- ✅ Safari (suporte limitado)
- ✅ Notificações desktop em todos os sistemas
- ✅ Fallback para notificações visuais quando necessário

## Uso

### Auto-PiP Ativo (Padrão)
1. **Iniciar timer** normalmente
2. **Mudar de aba** ou aplicação
3. **PiP abre automaticamente** com o cronômetro
4. **Voltar à aba** quando quiser
5. **PiP permanece aberto** até você fechar manualmente

### Controle Manual
1. **Abrir PiP**: Clique no botão com ícone de janela
2. **Monitorar Status**: Observe o dot de status no botão
3. **Recuperar se Perdido**: Clique no botão amarelo ou nas notificações
4. **Fechar**: Clique no botão com ícone de fechar

### Desativar Auto-PiP
1. **Clique no botão PiP** quando estiver ativo
2. **Sistema pergunta** se deseja desativar
3. **PiP fecha** e não abre mais automaticamente
4. **Reativar**: Clique novamente no botão

## Indicadores Visuais

- **🔄 Verde**: Auto-PiP ativo (padrão)
- **🟢 Verde**: PiP ativo e visível
- **🟡 Amarelo**: PiP ativo mas perdido
- **Sem indicador**: PiP não está ativo

## Manutenção

O sistema é auto-gerenciado e não requer intervenção manual. As verificações de visibilidade são executadas automaticamente e os recursos são limpos quando o PiP é fechado. O auto-PiP garante que você nunca esqueça que há um cronômetro rodando em segundo plano.

document.addEventListener('DOMContentLoaded', function() {
    // Elementos do DOM
    const timeDisplay = document.getElementById('timeDisplay');
    const startButton = document.getElementById('startButton');
    const resetButton = document.getElementById('resetButton');
    const progressBar = document.getElementById('progressBar');
    const timerRunning = document.getElementById('timerRunning');
    const timerContainer = document.getElementById('timerContainer');
    const currentBlocoName = document.getElementById('currentBlocoName');
    const blocoList = document.getElementById('blocoList');
    const addBlocoButton = document.getElementById('addBlocoButton');
    const reuniaoTemplate = document.getElementById('reuniaoTemplate');
    const blocosOverview = document.getElementById('blocosOverview');
    const blocosOverviewList = document.getElementById('blocosOverviewList');
    const toggleBlocosOverview = document.getElementById('toggleBlocosOverview');
    
    // Sons
    const alertSound = document.getElementById('alertSound');
    const tempoEsgotadoSound = document.getElementById('tempoEsgotadoSound');
    const tempoAcabandoSound = document.getElementById('tempoAcabandoSound');

    // Variáveis de estado
    let timer = null;
    let endTime = null;
    let duration = null;
    let currentSeconds = 0;
    let totalSeconds = 0;
    let isTimeOut = false;
    let currentBlocoIndex = 0;
    let alertRepeatInterval, playedAlertOnce = false;
    const blocos = [];
    let currentBlocoStartTime;
    let originalTitle = document.title;
    let titleInterval;
    let isPageVisible = true;
    let worker;
    let isTitleAlertActive = false;

    // Configuração do tema
    const themeToggle = document.getElementById('themeToggle');
    const moonIcon = themeToggle.querySelector('i');

    function updateThemeIcon(isDark) {
        moonIcon.setAttribute('data-lucide', isDark ? 'sun' : 'moon');
        lucide.createIcons();
    }

    themeToggle.addEventListener('click', () => {
        document.documentElement.classList.toggle('dark');
        const isDark = document.documentElement.classList.contains('dark');
        updateThemeIcon(isDark);
        localStorage.setItem('theme', isDark ? 'dark' : 'light');
    });

    // Verificar tema salvo
    if (localStorage.theme === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
        document.documentElement.classList.add('dark');
        updateThemeIcon(true);
    }

    // Configuração de tela cheia
    const fullscreenButton = document.getElementById('fullscreenButton');
    const fullscreenIcon = fullscreenButton.querySelector('i');

    fullscreenButton.addEventListener('click', () => {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen();
            fullscreenIcon.setAttribute('data-lucide', 'minimize');
        } else {
            document.exitFullscreen();
            fullscreenIcon.setAttribute('data-lucide', 'maximize');
        }
        lucide.createIcons();
    });

    // Atualização do relógio atual
    function updateCurrentTime() {
        const currentTime = document.getElementById('currentTime');
        const now = new Date();
        currentTime.textContent = now.toLocaleTimeString('pt-BR', { hour12: false });
    }

    setInterval(updateCurrentTime, 1000);
    updateCurrentTime();

    // Funções básicas
    function formatTime(milliseconds) {
        const totalSeconds = Math.floor(milliseconds / 1000);
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = totalSeconds % 60;

        if (hours > 0) {
            return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
        }
        return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    }

    function playSound(soundId) {
        const audio = document.getElementById(soundId);
        audio.play().catch(error => console.log('Erro ao tocar som:', error));
    }

    function updateDisplay(remaining) {
        const isTimeOver = remaining <= 0;
        const absRemaining = Math.abs(remaining);
        
        // Atualizar tempo com sinal negativo quando necessário
        timeDisplay.textContent = `${isTimeOver ? '-' : ''}${formatTime(absRemaining)}`;
        
        // Corrigir cálculo e aplicação da barra de progresso
        let progress;
        if (isTimeOver) {
            progress = 100;
        } else {
            // Calcular o tempo decorrido desde o início
            const timeElapsed = duration - remaining;
            // Calcular a porcentagem com precisão de 2 casas decimais
            progress = Number((timeElapsed / duration * 100).toFixed(2));
        }
        
        // Garantir que o progresso esteja entre 0 e 100
        progress = Math.min(100, Math.max(0, progress));
        
        // Aplicar o progresso com unidade % e forçar atualização do estilo
        progressBar.style.cssText = `width: ${progress}% !important; transition: width 0.1s linear;`;
        
        // Log para debug
        console.log({
            duration,
            remaining,
            timeElapsed: duration - remaining,
            progress,
            width: progressBar.style.width
        });

        const timerContainer = document.getElementById('timerRunning');

        if (isTimeOver) {
            if (!playedAlertOnce) {
                playedAlertOnce = true;
                playAlertSound('tempoEsgotadoSound', { 
                    volume: 0.8, 
                    repeat: 3, 
                    interval: 1500 
                });
                
                // Adicionar classes para tempo esgotado
                timerContainer.classList.remove('timer-ending');
                timerContainer.classList.add('timer-ended');
                timeDisplay.classList.add('text-red-500', 'blink');
                document.title = '⏰ TEMPO ESGOTADO!';

                // Mostrar botão de próximo bloco se houver blocos
                if (blocos.length > 0 && currentBlocoIndex < blocos.length - 1) {
                    showNextBloco();
                }
            }
        }
        else if (remaining <= duration * 0.1) {
            // Adicionar classes para tempo acabando
            timerContainer.classList.add('timer-ending');
            timerContainer.classList.remove('timer-ended');
            timeDisplay.classList.add('text-yellow-500');
            
            if (!timeDisplay.dataset.warningPlayed) {
                timeDisplay.dataset.warningPlayed = 'true';
                playAlertSound('tempoAcabandoSound', { 
                    volume: 0.6, 
                    repeat: 2, 
                    interval: 2000 
                });
            }
        }
        else {
            // Estado normal
            timerContainer.classList.remove('timer-ending', 'timer-ended');
            timeDisplay.classList.remove('text-red-500', 'text-yellow-500', 'blink');
        }
    }

    function startTimer(milliseconds) {
        // Limpar timer anterior se existir
        if (timer) {
            clearInterval(timer);
        }

        // Configurar novo timer
        duration = milliseconds; // Garantir que duration seja definido antes de updateDisplay
        endTime = Date.now() + milliseconds;
        timerRunning.classList.remove('hidden');
        timeDisplay.classList.remove('text-red-500', 'text-yellow-500');
        delete timeDisplay.dataset.warningPlayed;
        document.title = originalTitle;
        playedAlertOnce = false;

        // Primeira atualização com o tempo total
        updateDisplay(milliseconds);
        
        // Iniciar atualizações periódicas
        timer = setInterval(() => {
            const now = Date.now();
            const remaining = endTime - now;
            updateDisplay(remaining);
        }, 100);
    }

    function resetTimer() {
        if (timer) {
            clearInterval(timer);
            timer = null;
        }
        timerRunning.classList.add('hidden');
        timeDisplay.classList.remove('text-red-500', 'text-yellow-500');
        delete timeDisplay.dataset.warningPlayed;
        document.title = originalTitle;
    }

    // Event Listeners
    startButton.addEventListener('click', () => {
        stopTitleAlert();
        playedAlertOnce = false;
        document.getElementById('timerRunning').classList.remove('hidden');

        if (blocos.length > 0) {
            // Mostrar o botão toggle e o blocosOverview
            document.getElementById('toggleBlocosOverview').classList.remove('hidden');
            const blocosOverview = document.getElementById('blocosOverview');
            blocosOverview.classList.remove('translate-x-full');
            document.getElementById('timerContainer').style.width = 'calc(100% - 320px)';
            
            currentBlocoIndex = 0;
            startBlocosTimer();
            updateNavigationButtons();
            updateBlocosOverview();
        } else {
            // Timer normal sem blocos
            document.getElementById('toggleBlocosOverview').classList.add('hidden');
            document.getElementById('blocosOverview').classList.add('translate-x-full');
            document.getElementById('timerContainer').style.width = '100%';
            
            let duration;
            if (!timerManualMode.classList.contains('hidden')) {
                const hours = parseInt(document.getElementById('hours').value) || 0;
                const minutes = parseInt(document.getElementById('minutes').value) || 0;
                const seconds = parseInt(document.getElementById('seconds').value) || 0;
                duration = (hours * 3600 + minutes * 60 + seconds) * 1000;
            } else {
                const endTimeInput = document.getElementById('endHour').value;
                if (endTimeInput) {
                    const now = new Date();
                    const [hours, minutes] = endTimeInput.split(':').map(Number);
                    const endDateTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hours, minutes);
                    
                    if (endDateTime < now) {
                        endDateTime.setDate(endDateTime.getDate() + 1);
                    }
                    
                    duration = endDateTime - now;
                }
            }

            if (duration > 0) {
                startTimer(duration);
            }
        }
    });

    resetButton.addEventListener('click', resetTimer);

    // Tema escuro
    themeToggle.addEventListener('click', () => {
        const isDark = document.documentElement.classList.toggle('dark');
        const icon = themeToggle.querySelector('i');
        icon.setAttribute('data-lucide', isDark ? 'sun' : 'moon');
        lucide.createIcons();
        localStorage.setItem('theme', isDark ? 'dark' : 'light');
    });

    // Relógio
    function updateClock() {
        const now = new Date();
        document.getElementById('currentTime').textContent = 
            now.toLocaleTimeString('pt-BR');
    }
    setInterval(updateClock, 1000);
    updateClock();

    // Inicializar ícones
    lucide.createIcons();

    // Atualizar a inicialização dos templates no select
    function initializeTemplates() {
        const reuniaoTemplate = document.getElementById('reuniaoTemplate');
        
        // Limpar opções existentes
        reuniaoTemplate.innerHTML = '<option value="" disabled selected>Templates</option>';
        
        // Adicionar cada template como uma opção
        Object.entries(window.reunioesPredefinidas).forEach(([key, template]) => {
            const option = document.createElement('option');
            option.value = key;
            // Capitalizar primeira letra do nome do template
            option.textContent = key.charAt(0).toUpperCase() + key.slice(1);
            reuniaoTemplate.appendChild(option);
        });
    }

    // Inicializar templates
    initializeTemplates();

    // Evento de mudança do template
    reuniaoTemplate.addEventListener('change', function() {
        const selectedTemplate = this.value;
        if (window.reunioesPredefinidas[selectedTemplate]) {
            // Limpar blocos existentes
            blocos.length = 0;
            document.getElementById('blocoList').innerHTML = '';
            
            // Adicionar novos blocos do template
            window.reunioesPredefinidas[selectedTemplate].forEach((bloco, index) => {
                // Converter duração de minutos para milissegundos
                const duration = bloco.duration * 60000; // Multiplicar por 60000 para converter minutos em milissegundos
                blocos.push({ name: bloco.name, duration: duration });
                renderBloco(bloco.name, duration, index);
            });
            
            // Atualizar sumário
            updateBlocosSummary();
            
            // Atualizar visão geral dos blocos
            updateBlocosOverview();
            
            // Resetar o índice do bloco atual
            currentBlocoIndex = 0;
            
            // Atualizar botões de navegação
            updateNavigationButtons();
        }
    });

    // Configuração das tabs
    const tabButtons = document.querySelectorAll('.flex.mb-6.bg-gray-100 button');
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            tabButtons.forEach(btn => {
                btn.classList.remove('bg-white', 'dark:bg-gray-800', 'shadow');
                btn.classList.add('text-gray-600', 'dark:text-gray-300');
            });
            button.classList.add('bg-white', 'dark:bg-gray-800', 'shadow');
            button.classList.remove('text-gray-600', 'dark:text-gray-300');
        });
    });

    // Configuração das tabs de modo de timer
    const timerManualTab = document.getElementById('timerManualTab');
    const horarioFinalTab = document.getElementById('horarioFinalTab');
    const timerManualMode = document.getElementById('timerManualMode');
    const horarioFinalMode = document.getElementById('horarioFinalMode');

    timerManualTab.addEventListener('click', () => {
        timerManualMode.classList.remove('hidden');
        horarioFinalMode.classList.add('hidden');
    });

    horarioFinalTab.addEventListener('click', () => {
        horarioFinalMode.classList.remove('hidden');
        timerManualMode.classList.add('hidden');
    });

    // Inicializar Web Worker
    function initWorker() {
        if (typeof(Worker) !== "undefined") {
            const workerBlob = new Blob([`
                let timer;
                
                self.onmessage = function(e) {
                    if (e.data.action === 'start') {
                        clearInterval(timer);
                        const endTime = e.data.endTime;
                        const initialDuration = e.data.duration;
                        let warningTriggered = false;
                        let timeUpTriggered = false;
                        
                        timer = setInterval(() => {
                            const now = Date.now();
                            const remainingTime = endTime - now;
                            
                            if (!warningTriggered && remainingTime <= initialDuration * 0.1 && remainingTime > 0) {
                                warningTriggered = true;
                                self.postMessage({ 
                                    type: 'timeWarning',
                                    message: '⚠️ TEMPO ACABANDO ⚠️'
                                });
                            }
                            
                            if (!timeUpTriggered && remainingTime <= 0) {
                                timeUpTriggered = true;
                                self.postMessage({ 
                                    type: 'timeUp',
                                    message: '⏰ TEMPO ESGOTADO ⏰'
                                });
                                clearInterval(timer);
                            }
                        }, 100);
                    } else if (e.data.action === 'stop') {
                        clearInterval(timer);
                    }
                };
            `], { type: 'text/javascript' });

            worker = new Worker(URL.createObjectURL(workerBlob));
            
            worker.onmessage = function(e) {
                if (e.data.type === 'timeWarning') {
                    playSound('tempoAcabandoSound');
                    sendNotification("Tempo acabando!");
                    startTitleAlert("TEMPO ACABANDO!");
                } else if (e.data.type === 'timeUp') {
                    stopTitleAlert();
                    playSound('tempoEsgotadoSound');
                    sendNotification("Tempo finalizado!");
                    startTitleAlert("TEMPO ESGOTADO!");
                }
            };
        }
    }

    // Funções auxiliares
    function startTitleAlert(message) {
        clearInterval(titleInterval);
        isTitleAlertActive = true;
        let isOriginal = true;
        
        document.title = `🔔 ${message}`;
        
        titleInterval = setInterval(() => {
            document.title = isOriginal ? `🔔 ${message}` : originalTitle;
            isOriginal = !isOriginal;
        }, 1000);
    }

    function stopTitleAlert() {
        if (titleInterval) {
            clearInterval(titleInterval);
            titleInterval = null;
        }
        document.title = originalTitle;
        isTitleAlertActive = false;
    }

    function sendNotification(message) {
        if (!("Notification" in window)) {
            return;
        }

        if (Notification.permission === "granted") {
            try {
                navigator.serviceWorker.ready.then(registration => {
                    registration.showNotification("⏰ CronnaClimba 2.0", {
                        body: message,
                        icon: "https://www.climba.dev/wp-content/uploads/2019/09/climba_rgb-01-300x100.png",
                        badge: "https://www.climba.dev/wp-content/uploads/2019/09/climba_rgb-01-300x100.png",
                        vibrate: [200, 100, 200, 100, 200],
                        tag: 'timer-notification',
                        renotify: true,
                        requireInteraction: true,
                        silent: false
                    });
                });
            } catch (e) {
                new Notification("⏰ CronnaClimba 2.0", {
                    body: message,
                    icon: "https://www.climba.dev/wp-content/uploads/2019/09/climba_rgb-01-300x100.png"
                });
            }
        }
    }

    // Inicialização
    initWorker();
    lucide.createIcons();

    function renderBloco(name, duration, index = blocos.length - 1) {
        const hours = Math.floor(duration / (1000 * 60 * 60));
        const minutes = Math.floor((duration % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((duration % (1000 * 60)) / 1000);
        
        const timeString = [
            hours > 0 ? `${hours}h` : null,
            minutes > 0 ? `${minutes}m` : null,
            seconds > 0 ? `${seconds}s` : null
        ].filter(Boolean).join(' ');

        const li = document.createElement('li');
        li.className = 'flex items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg cursor-move';
        li.dataset.index = index;
        li.innerHTML = `
            <i data-lucide="grip-vertical" class="text-gray-400 mr-2"></i>
            <input type="text" class="bloco-name-input bg-transparent border-none focus:ring-2 focus:ring-indigo-500 rounded px-2 py-1 flex-grow text-gray-800 dark:text-white" 
                   value="${name}">
            <span class="text-gray-600 dark:text-gray-300 mx-4">${timeString}</span>
            <div class="flex gap-2">
                <button class="delete-bloco p-1 text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-200">
                    <i data-lucide="trash-2" class="w-4 h-4"></i>
                </button>
            </div>
        `;

        const nameInput = li.querySelector('.bloco-name-input');
        const deleteButton = li.querySelector('.delete-bloco');

        nameInput.addEventListener('change', () => {
            blocos[index].name = nameInput.value;
            updateBlocosSummary();
        });

        deleteButton.addEventListener('click', () => deleteBloco(index));

        const blocoList = document.getElementById('blocoList');
        const existingItem = blocoList.children[index];
        if (existingItem) {
            blocoList.replaceChild(li, existingItem);
        } else {
            blocoList.appendChild(li);
        }

        lucide.createIcons();
        updateBlocosSummary();
    }

    // Adicionar bloco
    addBlocoButton.addEventListener('click', () => {
        const hours = parseInt(document.getElementById('hours').value) || 0;
        const minutes = parseInt(document.getElementById('minutes').value) || 0;
        const seconds = parseInt(document.getElementById('seconds').value) || 0;
        const duration = (hours * 3600 + minutes * 60 + seconds) * 1000;

        if (duration > 0) {
            const blocoNumber = blocos.length + 1;
            const name = `Bloco ${blocoNumber}`;
            blocos.push({ name, duration });
            renderBloco(name, duration);
        }
    });

    // Inicializar Sortable
    new Sortable(blocoList, {
        animation: 150,
        handle: '[data-lucide="grip-vertical"]',
        onEnd: function(evt) {
            const newIndex = evt.newIndex;
            const oldIndex = evt.oldIndex;
            
            const [movedBloco] = blocos.splice(oldIndex, 1);
            blocos.splice(newIndex, 0, movedBloco);
            
            blocoList.innerHTML = '';
            blocos.forEach((bloco, idx) => {
                renderBloco(bloco.name, bloco.duration, idx);
            });
            
            lucide.createIcons();
        }
    });

    // Função para atualizar o sumário dos blocos
    function updateBlocosSummary() {
        const blocosSummaryDiv = document.getElementById('blocosSummary');
        const tempoTotalElement = document.getElementById('tempoTotal');
        const horarioTerminoElement = document.getElementById('horarioTermino');
        
        if (blocos.length > 0) {
            blocosSummaryDiv.classList.remove('hidden');
            
            // Calcular tempo total em milissegundos
            const tempoTotalMs = blocos.reduce((total, bloco) => total + bloco.duration, 0);
            
            // Formatar tempo total
            const hours = Math.floor(tempoTotalMs / (1000 * 60 * 60));
            const minutes = Math.floor((tempoTotalMs % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((tempoTotalMs % (1000 * 60)) / 1000);
            
            tempoTotalElement.textContent = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
            
            // Calcular horário de término
            const now = new Date();
            const endTime = new Date(now.getTime() + tempoTotalMs);
            horarioTerminoElement.textContent = endTime.toLocaleTimeString('pt-BR', { 
                hour: '2-digit', 
                minute: '2-digit' 
            });
        } else {
            blocosSummaryDiv.classList.add('hidden');
        }
    }

    // Função para deletar bloco
    function deleteBloco(index) {
        if (confirm('Tem certeza que deseja excluir este bloco?')) {
            blocos.splice(index, 1);
            const blocoList = document.getElementById('blocoList');
            blocoList.removeChild(blocoList.children[index]);
            
            // Recriar a lista para atualizar os índices
            blocoList.innerHTML = '';
            blocos.forEach((bloco, idx) => {
                renderBloco(bloco.name, bloco.duration, idx);
            });
            
            updateBlocosSummary();
        }
    }

    // Função para iniciar timer de blocos
    function startBlocosTimer(specificIndex = null) {
        if (specificIndex !== null) {
            currentBlocoIndex = specificIndex;
        }
        
        if (currentBlocoIndex < blocos.length && currentBlocoIndex >= 0) {
            clearInterval(alertRepeatInterval);
            stopTitleAlert();
            
            playedAlertOnce = false;
            window.playedEndingSound = false;
            isTimeOut = false;
            
            const nextBlocoButton = document.getElementById('startNextBlocoButton');
            if (nextBlocoButton) nextBlocoButton.remove();
            
            const bloco = blocos[currentBlocoIndex];
            document.getElementById('currentBlocoName').textContent = bloco.name;
            currentBlocoStartTime = Date.now();
            
            const timerContainer = document.getElementById('timerRunning');
            const timeDisplay = document.getElementById('timeDisplay');
            timerContainer.classList.remove('timer-ending', 'timer-ended');
            timeDisplay.classList.remove('blink');
            
            startTimer(bloco.duration, true);
            updateNavigationButtons();
            updateBlocosOverview();
        }
    }

    // Função para atualizar botões de navegação
    function updateNavigationButtons() {
        const prevButton = document.getElementById('prevBlocoButton');
        const nextButton = document.getElementById('nextBlocoButton');
        
        if (prevButton && nextButton) {
            prevButton.disabled = currentBlocoIndex <= 0;
            nextButton.disabled = currentBlocoIndex >= blocos.length - 1;
            
            [prevButton, nextButton].forEach(button => {
                if (button.disabled) {
                    button.classList.add('opacity-50', 'cursor-not-allowed');
                    button.classList.remove('hover:bg-gray-300', 'dark:hover:bg-gray-600');
                } else {
                    button.classList.remove('opacity-50', 'cursor-not-allowed');
                    button.classList.add('hover:bg-gray-300', 'dark:hover:bg-gray-600');
                }
            });
        }
    }

    // Event listeners para navegação de blocos
    document.getElementById('prevBlocoButton')?.addEventListener('click', () => {
        if (currentBlocoIndex > 0) {
            currentBlocoIndex--;
            startBlocosTimer(currentBlocoIndex);
        }
    });

    document.getElementById('nextBlocoButton')?.addEventListener('click', () => {
        if (currentBlocoIndex < blocos.length - 1) {
            currentBlocoIndex++;
            startBlocosTimer(currentBlocoIndex);
        }
    });

    // Toggle da barra lateral
    document.getElementById('toggleBlocosOverview').addEventListener('click', () => {
        const blocosOverview = document.getElementById('blocosOverview');
        const timerContainer = document.getElementById('timerContainer');
        const isOpen = !blocosOverview.classList.contains('translate-x-full');
        
        blocosOverview.classList.toggle('translate-x-full');
        
        if (isOpen) {
            timerContainer.style.width = '100%';
        } else {
            timerContainer.style.width = 'calc(100% - 320px)';
        }
        
        const icon = document.querySelector('#toggleBlocosOverview i');
        icon.setAttribute('data-lucide', isOpen ? 'panel-left' : 'panel-right');
        lucide.createIcons();
    });

    // Função para atualizar visão geral dos blocos
    function updateBlocosOverview() {
        const blocosOverviewList = document.getElementById('blocosOverviewList');
        blocosOverviewList.innerHTML = '';
        
        blocos.forEach((bloco, index) => {
            const li = document.createElement('li');
            li.className = `p-3 rounded-lg transition-colors ${
                index === currentBlocoIndex ? 'bg-[#151634] text-white' : 'bg-gray-50 dark:bg-gray-700'
            }`;
            
            const hours = Math.floor(bloco.duration / (1000 * 60 * 60));
            const minutes = Math.floor((bloco.duration % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((bloco.duration % (1000 * 60)) / 1000);
            
            const timeString = [
                hours > 0 ? `${hours}h` : null,
                minutes > 0 ? `${minutes}m` : null,
                seconds > 0 ? `${seconds}s` : null
            ].filter(Boolean).join(' ');

            li.innerHTML = `
                <div class="flex items-center justify-between">
                    <div class="flex items-center gap-2">
                        ${index === currentBlocoIndex ? '<i data-lucide="play" class="w-4 h-4"></i>' : ''}
                        <span class="${index === currentBlocoIndex ? 'font-medium' : ''}">${bloco.name}</span>
                    </div>
                    <span class="text-sm ${index === currentBlocoIndex ? 'text-gray-200' : 'text-gray-500 dark:text-gray-400'}">${timeString}</span>
                </div>
            `;
            
            blocosOverviewList.appendChild(li);
        });
        
        lucide.createIcons();
    }

    // Atalhos de teclado
    document.addEventListener('keydown', function(e) {
        // Verificar se não está em um input de texto
        const isInputFocused = document.activeElement.tagName === 'INPUT' && 
                              document.activeElement.type !== 'number';
        
        // Se estiver em um input de texto, só processa Enter
        if (isInputFocused && e.key !== 'Enter') {
            return;
        }

        // Timer em execução
        if (!timerRunning.classList.contains('hidden')) {
            // ESC - Parar timer
            if (e.key === 'Escape') {
                resetTimer();
            }
            // ENTER - Próximo bloco (se existir)
            else if (e.key === 'Enter') {
                const nextButton = document.getElementById('startNextBlocoButton');
                if (nextButton) {
                    nextButton.click();
                }
            }
            // Setas esquerda/direita para navegação entre blocos
            else if (e.key === 'ArrowLeft') {
                const prevButton = document.getElementById('prevBlocoButton');
                if (prevButton && !prevButton.disabled) {
                    prevButton.click();
                }
            }
            else if (e.key === 'ArrowRight') {
                const nextButton = document.getElementById('nextBlocoButton');
                if (nextButton && !nextButton.disabled) {
                    nextButton.click();
                }
            }
        }
        // Tela de configuração
        else {
            // CMD/CTRL + ENTER - Adicionar bloco
            if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                addBlocoButton.click();
            }
            // ENTER - Iniciar timer
            else if (e.key === 'Enter') {
                startButton.click();
            }
        }
    });

    // Melhorar sistema de sons
    function playAlertSound(soundId, options = {}) {
        const {
            volume = 1,
            repeat = 1,
            interval = 1000
        } = options;

        const audio = document.getElementById(soundId);
        let playCount = 0;

        function playWithRetry() {
            audio.volume = volume;
            const playPromise = audio.play();

            if (playPromise !== undefined) {
                playPromise.then(() => {
                    playCount++;
                    if (playCount < repeat) {
                        setTimeout(playWithRetry, interval);
                    }
                }).catch(error => {
                    console.log("Erro ao tocar som:", error);
                    // Tentar novamente em caso de erro
                    setTimeout(playWithRetry, 1000);
                });
            }
        }

        audio.currentTime = 0; // Resetar o áudio
        playWithRetry();
    }

    // Adicionar função showNextBloco
    function showNextBloco() {
        // Verificar se existe próximo bloco
        if (currentBlocoIndex + 1 >= blocos.length) {
            return;
        }

        const nextBloco = blocos[currentBlocoIndex + 1];
        const buttonsContainer = document.querySelector('#timerRunning .flex.gap-4.justify-center');
        
        // Remover botão anterior se existir
        const existingNextButton = document.getElementById('startNextBlocoButton');
        if (existingNextButton) existingNextButton.remove();
        
        // Criar botão para próximo bloco
        const nextBlocoButton = document.createElement('button');
        nextBlocoButton.id = 'startNextBlocoButton';
        nextBlocoButton.className = 'px-12 py-6 bg-green-500 hover:bg-green-600 text-white rounded-lg text-2xl font-medium transition-colors';
        nextBlocoButton.innerHTML = `
            <span class="block text-lg opacity-75">Próximo Bloco:</span>
            <span class="block">${nextBloco.name}</span>
        `;
        
        // Adicionar ao container de botões
        buttonsContainer.appendChild(nextBlocoButton);
        
        // Adicionar evento ao botão
        nextBlocoButton.addEventListener('click', () => {
            nextBlocoButton.remove();
            const timerContainer = document.getElementById('timerRunning');
            timerContainer.classList.remove('timer-ended');
            timeDisplay.classList.remove('blink', 'text-red-500', 'text-yellow-500');
            
            // Resetar estados
            playedAlertOnce = false;
            window.playedEndingSound = false;
            clearInterval(alertRepeatInterval);
            stopTitleAlert();
            
            currentBlocoIndex++;
            startBlocosTimer();
        });
    }

    // Adicionar tooltips para os atalhos
    const tooltips = {
        startButton: 'Pressione Enter para iniciar',
        resetButton: 'Pressione ESC para parar',
        addBlocoButton: 'Pressione Cmd/Ctrl + Enter para adicionar bloco',
        prevBlocoButton: 'Pressione ← para bloco anterior',
        nextBlocoButton: 'Pressione → para próximo bloco'
    };

    Object.entries(tooltips).forEach(([id, text]) => {
        const element = document.getElementById(id);
        if (element) {
            element.setAttribute('title', text);
        }
    });

    // Adicionar estilos para tooltips
    const style = document.createElement('style');
    style.textContent = `
        [title] {
            position: relative;
        }

        [title]:hover::after {
            content: attr(title);
            position: absolute;
            bottom: 100%;
            left: 50%;
            transform: translateX(-50%);
            padding: 5px 10px;
            background: rgba(0, 0, 0, 0.8);
            color: white;
            border-radius: 4px;
            font-size: 12px;
            white-space: nowrap;
            z-index: 1000;
            margin-bottom: 5px;
        }

        /* Estilo para mostrar foco via teclado */
        button:focus-visible {
            outline: 2px solid var(--climba-blue);
            outline-offset: 2px;
        }
        
        /* Esconder outline quando foco for via mouse */
        button:focus:not(:focus-visible) {
            outline: none;
        }
    `;
    document.head.appendChild(style);

    // Adicionar/atualizar os estilos CSS
    const timerStyles = document.createElement('style');
    timerStyles.textContent = `
        /* Estado de tempo acabando */
        .timer-ending {
            background-color: #fef3c7 !important; /* Amarelo claro */
            transition: background-color 0.5s ease;
        }

        .timer-ending .text-yellow-500 {
            color: #d97706 !important; /* Laranja/amarelo escuro */
        }

        /* Estado de tempo esgotado */
        .timer-ended {
            background-color: #dc2626 !important; /* Vermelho */
            color: white !important;
            transition: background-color 0.5s ease;
        }

        .timer-ended .text-gray-800,
        .timer-ended .dark\\:text-white {
            color: white !important;
        }

        /* Animação piscante para alerta */
        @keyframes blink {
            0% { opacity: 1; }
            50% { opacity: 0.5; }
            100% { opacity: 1; }
        }

        .blink {
            animation: blink 1s infinite;
        }
    `;
    document.head.appendChild(timerStyles);

    // Adicionar/atualizar os estilos CSS para a barra de progresso
    const progressStyles = document.createElement('style');
    progressStyles.textContent = `
        #progressBar {
            transition: width 0.1s linear;
            min-width: 0;
            max-width: 100%;
        }
    `;
    document.head.appendChild(progressStyles);
}); 
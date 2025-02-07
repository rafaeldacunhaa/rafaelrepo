import { TestTimer } from './components/TestTimer';

document.addEventListener('DOMContentLoaded', () => {
    const testContainer = document.createElement('div');
    testContainer.className = 'fixed top-4 right-4 bg-white p-4 rounded shadow';
    testContainer.innerHTML = `
        <h3 class="text-lg font-bold mb-2">Timer de Teste (TypeScript)</h3>
        <div id="test-timer" class="text-2xl mb-2">5:00</div>
        <button id="test-start" class="bg-blue-500 text-white px-4 py-2 rounded">
            Iniciar Teste
        </button>
    `;

    document.body.appendChild(testContainer);

    const timerElement = document.getElementById('test-timer')!;
    const startButton = document.getElementById('test-start')!;

    const timer = new TestTimer({
        duration: 5 * 60 * 1000, // 5 minutos
        element: timerElement
    });

    startButton.addEventListener('click', () => timer.start());
}); 
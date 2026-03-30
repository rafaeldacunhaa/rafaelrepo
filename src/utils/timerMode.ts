/** Modo visível nas tabs do painel de timer (ver TabManager / cronnaclimba.html). */

export function isHorarioFinalModeActive(): boolean {
    const el = document.getElementById('horarioFinalMode');
    return el !== null && !el.classList.contains('hidden');
}

export function isTimerManualModeActive(): boolean {
    const el = document.getElementById('timerManualMode');
    return el !== null && !el.classList.contains('hidden');
}

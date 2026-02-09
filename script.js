const minutesInput = document.getElementById('minutes');
const secondsInput = document.getElementById('seconds');
const startBtn = document.getElementById('start-btn');
const resetBtn = document.getElementById('reset-btn');
const stopBtn = document.getElementById('stop-btn');
const displayPanel = document.getElementById('display-panel');
const setupPanel = document.getElementById('setup-panel');
const timerDisplay = document.getElementById('timer-display');
const body = document.body;

let totalSeconds = 0;
let initialTotalSeconds = 0;
let isRunning = false;
let audioContext = null;
const hornAudio = new Audio('horn.mp3');

// Select all reveal masks
const towerMasks = document.querySelectorAll('.tower-reveal-mask');

// Ensure they start hidden
towerMasks.forEach(mask => {
    mask.style.clipPath = 'inset(100% 0 0 0)';
});

let animationFrameId;
let endTime;
let duration;
let lastBeepSecond = -1;

function formatTime(totalSecs) {
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

function updateDisplay(secs) {
    if (secs < 0) secs = 0;
    timerDisplay.textContent = formatTime(Math.ceil(secs));
}

function updateTowers(progress) {
    // Progress is 0.0 to 1.0 (0% done to 100% done)
    // Inset: 100% (hidden) -> 0% (visible)
    const percentage = Math.max(0, Math.min(100, (1 - progress) * 100));

    towerMasks.forEach(mask => {
        mask.style.clipPath = `inset(${percentage}% 0 0 0)`;
    });
}

function tick() {
    const now = Date.now();
    const timeLeft = endTime - now;

    if (timeLeft <= 0) {
        finishTimer();
        return;
    }

    // Update Display (integral seconds)
    const secondsLeft = timeLeft / 1000;
    updateDisplay(secondsLeft);

    // Update Towers (smooth progress)
    const elapsed = duration - timeLeft;
    const progress = elapsed / duration;
    updateTowers(progress);

    // Urgent Mode Check & Beep
    const currentSecond = Math.ceil(secondsLeft);
    if (currentSecond <= 10 && currentSecond > 0) {
        body.classList.add('urgent-mode');
        if (currentSecond !== lastBeepSecond) {
            playBeep();
            lastBeepSecond = currentSecond;
        }
    } else {
        body.classList.remove('urgent-mode');
    }

    animationFrameId = requestAnimationFrame(tick);
}

function startCountdown() {
    if (isRunning) return;

    if (!audioContext) {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioContext.state === 'suspended') {
        audioContext.resume();
    }

    // Calculate end time based on totalSeconds
    duration = totalSeconds * 1000; // Use actual timer duration
    endTime = Date.now() + duration;
    lastBeepSecond = -1;

    isRunning = true;

    // UI Updates
    setupPanel.classList.add('hidden');
    displayPanel.classList.remove('hidden');
    startBtn.classList.add('hidden');
    stopBtn.classList.remove('hidden');
    resetBtn.classList.add('hidden');

    // Start animation loop
    tick();
}

function initTimer() {
    const mins = parseInt(minutesInput.value) || 0;
    const secs = parseInt(secondsInput.value) || 0;
    totalSeconds = mins * 60 + secs;
    initialTotalSeconds = totalSeconds;

    if (totalSeconds <= 0) return;

    startCountdown();
}

function stopTimer() {
    cancelAnimationFrame(animationFrameId);
    isRunning = false;

    // Capture remaining time for resume
    const now = Date.now();
    const remainingMs = endTime - now;
    totalSeconds = Math.max(0, remainingMs / 1000);

    stopBtn.classList.add('hidden');
    startBtn.classList.remove('hidden');
    resetBtn.classList.remove('hidden');
    startBtn.textContent = "Resume";
}

function resetTimer() {
    cancelAnimationFrame(animationFrameId);
    isRunning = false;
    body.classList.remove('urgent-mode');
    body.classList.remove('finished');

    // Reset towers
    updateTowers(0); // 0 progress = hidden

    setupPanel.classList.remove('hidden');
    displayPanel.classList.add('hidden');

    stopBtn.classList.add('hidden');
    resetBtn.classList.add('hidden');
    startBtn.classList.remove('hidden');
    startBtn.textContent = "Start Bouwen";
}

function finishTimer() {
    cancelAnimationFrame(animationFrameId);
    isRunning = false;
    updateDisplay(0);
    updateTowers(1); // 1.0 progress = fully visible

    body.classList.remove('urgent-mode');
    body.classList.add('finished');

    // Reset and play horn
    hornAudio.currentTime = 0;
    hornAudio.play().catch(e => console.log("Audio play failed", e));

    stopBtn.classList.add('hidden');
    startBtn.classList.add('hidden');
    resetBtn.classList.remove('hidden');
}

function playBeep() {
    if (!audioContext) return;

    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(800, audioContext.currentTime);

    gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.1);

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.start();
    oscillator.stop(audioContext.currentTime + 0.1);
}

startBtn.onclick = function () {
    if (startBtn.textContent === "Resume") {
        startCountdown();
    } else {
        initTimer();
    }
};

stopBtn.addEventListener('click', stopTimer);
resetBtn.addEventListener('click', resetTimer);

minutesInput.addEventListener('change', function () {
    if (this.value < 0) this.value = 0;
    if (this.value > 99) this.value = 99;
});
secondsInput.addEventListener('change', function () {
    if (this.value < 0) this.value = 0;
    if (this.value > 59) this.value = 59;
});

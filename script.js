const minutesInput = document.getElementById('minutes');
const secondsInput = document.getElementById('seconds');
const startBtn = document.getElementById('start-btn');
const resetBtn = document.getElementById('reset-btn');
const stopBtn = document.getElementById('stop-btn');
const displayPanel = document.getElementById('display-panel');
const setupPanel = document.getElementById('setup-panel');
const timerDisplay = document.getElementById('timer-display');
const body = document.body;

let countdownInterval;
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
    // Remove transition initially to prevent "closing" animation on reload if any
    mask.style.transition = 'none';
});

function formatTime(totalSecs) {
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

function updateDisplay(secs) {
    timerDisplay.textContent = formatTime(secs);
}

function updateTowers(currentSecs) {
    if (initialTotalSeconds <= 0) return;
    const progress = 1 - (currentSecs / initialTotalSeconds); // 0 to 1
    const percentage = Math.max(0, Math.min(100, (1 - progress) * 100)); // 100% to 0% inset

    towerMasks.forEach(mask => {
        mask.style.clipPath = `inset(${percentage}% 0 0 0)`;
    });
}

function startCountdown() {
    if (isRunning) return;

    if (!audioContext) {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioContext.state === 'suspended') {
        audioContext.resume();
    }

    isRunning = true;

    // UI Updates
    setupPanel.classList.add('hidden');
    displayPanel.classList.remove('hidden');
    startBtn.classList.add('hidden');
    stopBtn.classList.remove('hidden');
    resetBtn.classList.add('hidden');

    updateDisplay(totalSeconds);

    // Animate towers
    towerMasks.forEach(mask => {
        // Re-enable transition for smooth animation
        mask.style.transition = 'clip-path 1s linear';
    });
    updateTowers(totalSeconds); // Init pos

    countdownInterval = setInterval(() => {
        totalSeconds--;
        updateDisplay(totalSeconds);
        updateTowers(totalSeconds);

        if (totalSeconds <= 10 && totalSeconds > 0) {
            body.classList.add('urgent-mode');
            playBeep();
        } else {
            body.classList.remove('urgent-mode');
        }

        if (totalSeconds <= 0) {
            finishTimer();
        }
    }, 1000);
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
    clearInterval(countdownInterval);
    isRunning = false;
    towerMasks.forEach(mask => {
        mask.style.transition = 'none';
    });
    stopBtn.classList.add('hidden');
    startBtn.classList.remove('hidden');
    resetBtn.classList.remove('hidden');
    startBtn.textContent = "Resume";
}

function resetTimer() {
    clearInterval(countdownInterval);
    isRunning = false;
    body.classList.remove('urgent-mode');
    body.classList.remove('finished');

    // Reset towers
    towerMasks.forEach(mask => {
        mask.style.transition = 'none';
        mask.style.clipPath = 'inset(100% 0 0 0)'; // Full hidden
    });

    setupPanel.classList.remove('hidden');
    displayPanel.classList.add('hidden');

    stopBtn.classList.add('hidden');
    resetBtn.classList.add('hidden');
    startBtn.classList.remove('hidden');
    startBtn.textContent = "Start Bouwen";
}

function finishTimer() {
    clearInterval(countdownInterval);
    isRunning = false;
    updateDisplay(0);
    // Ensure towers are fully drawn
    towerMasks.forEach(mask => {
        mask.style.clipPath = 'inset(0% 0 0 0)'; // Full reveal
    });

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

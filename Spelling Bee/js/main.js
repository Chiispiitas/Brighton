"use strict";

/* ==============================================
   Configuration & State
============================================== */
let hiddenMode = true; // default: hidden word mode
let currentDifficulty = 'easy';  // default
let WORDLIST_PATH = `wordlists/4TH-5TH/${currentDifficulty}.txt`;
const AUDIO_DIR = 'audio';
const AUDIO_EXT = '.mp3';

/**
 * Converts a display word to an audio file name. By default:
 *   - lowercases the word
 *   - trims spaces
 *   - replaces internal spaces with dashes
 */
function wordToAudioBasename(word) {
    return word.trim().toLowerCase().replace(/\s+/g, '-');
}

/** @typedef {'pending'|'ok'|'err'|'skip'} Mark */
let pool = [];        // remaining words
let current = null;   // current word string
let marks = [];       // per-character marks
let ptr = 0;          // index of next character to mark

// Timer state
let t0 = 0;           // epoch ms when started
let acc = 0;          // accumulated ms when paused
let raf = null;       // requestAnimationFrame id

// DOM references
const elWord = document.getElementById('word');
const elSecretWord = document.getElementById('secret-word');
const elAudio = document.getElementById('audio');
const elWrongAudio = document.getElementById('wrong-audio');
const elCorrectAudio = document.getElementById('correct-audio');
const btnPlay = document.getElementById('play-audio');
const btnNext = document.getElementById('next-word');
const elTimer = document.getElementById('timer');
const btnTStart = document.getElementById('timer-start');
const btnTStop = document.getElementById('timer-stop');
const btnTReset = document.getElementById('timer-reset');
const btnEasy = document.getElementById('btn-easy');
const btnMedium = document.getElementById('btn-medium');
const btnHard = document.getElementById('btn-hard');
const elPoolSelect = document.getElementById('pool-select');

/* ==============================================
   Wordlist Loading
============================================== */
async function loadWordlist() {
    const res = await fetch(WORDLIST_PATH, { cache: 'no-store' });
    if (!res.ok) {
        throw new Error('Failed to load wordlist.txt');
    }
    const text = await res.text();
    // split lines, trim, ignore empties, keep unique
    const seen = new Set();
    const words = [];
    for (const raw of text.split(/\r?\n/)) {
        const w = raw.trim();
        if (!w) continue;
        if (!seen.has(w)) {
            seen.add(w);
            words.push(w);
        }
    }
    return words;
}

/* ==============================================
   Rendering
============================================== */
function renderWord() {
    if (!current) {
        elWord.textContent = '—';
        return;
    }
    const frag = document.createDocumentFragment();

    // reflect mode in a data-attribute (optional, useful for CSS targeting)
    elWord.dataset.mode = hiddenMode ? 'hidden' : 'normal';

    [...current].forEach((ch, i) => {
        const span = document.createElement('span');
        span.className = 'char';

        const m = marks[i] || 'pending';
        if (m === 'ok') span.classList.add('ok');
        else if (m === 'err') span.classList.add('err');
        else if (m === 'skip') span.classList.add('skip');

        // Determine what to display
        let displayCh = ch;

        if (hiddenMode) {
            // In hidden mode: letters are dots until revealed (ok/err)
            if (/[A-Za-z]/.test(ch)) {
                if (m === 'pending') {
                    displayCh = '•';         // dot for unrevealed letter
                    span.classList.add('dot');
                } else {
                    displayCh = ch;          // reveal when marked ok/err
                }
            } else {
                // Non-letters (spaces, hyphens, punctuation) remain visible
                displayCh = ch;
            }
        } else {
            // Normal mode: show characters as-is
            displayCh = ch;
        }

        span.textContent = displayCh;

        if (i === ptr) span.classList.add('active');
        frag.appendChild(span);
    });
    elWord.replaceChildren(frag);
}

    // Move pointer to next markable character; auto-skip non-letters
function advancePtr() {
    while (ptr < current.length) {
        const ch = current[ptr];
        if (/[A-Za-z]/.test(ch)) return; // stop on a letter
        // otherwise auto-mark as skip and advance
        if (!marks[ptr]) {
            marks[ptr] = 'skip';
        }
        ptr++;
    }
}

function resetMarks() {
    marks = new Array(current.length).fill('pending');
    ptr = 0;
    advancePtr();
    renderWord();
}

function toggleWordMode() {
    hiddenMode = !hiddenMode;
    renderWord();
}

function setCurrentWord(w) {
    current = w;
    elSecretWord.textContent = w;
    const src = `${AUDIO_DIR}/${wordToAudioBasename(w)}${AUDIO_EXT}`;
    elAudio.src = src;
    resetMarks();
}

function playAudio() {
    elAudio.currentTime = 0;
    elAudio.playbackRate = 0.75;
    elAudio.play().catch(() => {});
}

function playWrongAudio() {
    elWrongAudio.currentTime = 0;
    elWrongAudio.play().catch(() => {});
}

function playCorrectAudio() {
    elCorrectAudio.currentTime = 0;
    elCorrectAudio.play().catch(() => {});
}

/* ==============================================
   Marking Logic (O/P/Backspace)
============================================== */
function mark(type) {
    if (!current) return;
    if (ptr >= current.length) return;
    // ensure we are at a letter; advancePtr already does skipping
    if (!/[A-Za-z]/.test(current[ptr])) {
        advancePtr();
        renderWord();
        return;
    }

    marks[ptr] = type;
    ptr++;
    advancePtr();
    renderWord();

    // Trigger confetti when all are correct
    if (isAllMarked() && !hadAnyError()) {
        launchConfetti();
        playCorrectAudio();
    } else if (isAllMarked()) {
        playWrongAudio();
    }
}

function undo() {
    if (!current) return;
    // step back to previous index that is not skip
    do {
        if (ptr <= 0) break;
        ptr--;
    } while (marks[ptr] === 'skip');

    if (ptr >= 0) {
        marks[ptr] = 'pending';
    }
    // also clear any trailing skips if we stepped before them
    renderWord();
}

function isAllMarked() {
    return marks.every(m => m && m !== 'pending');
}

function hadAnyError() {
    return marks.some(m => m === 'err');
}

/* ==============================================
   Confetti Effect
============================================== */
function launchConfetti() {
    const container = document.getElementById('confetti-container');
    const colors = ['#ef233c', '#21c55d', '#ffd166', '#3a86ff', '#ff006e'];
    const pieces = 70; // number of pieces

    for (let i = 0; i < pieces; i++) {
        const conf = document.createElement('div');
        conf.className = 'confetti';
        conf.style.background = colors[Math.floor(Math.random() * colors.length)];

        // random direction (circle)
        const angle = Math.random() * 2 * Math.PI;
        const radius = 200 + Math.random() * 400; // how far each piece flies
        const dx = Math.cos(angle) * radius;
        const dy = Math.sin(angle) * radius;
        conf.style.setProperty('--dx', dx);
        conf.style.setProperty('--dy', dy);

        // random size, rotation, delay
        conf.style.width = 6 + Math.random() * 8 + 'px';
        conf.style.height = 6 + Math.random() * 8 + 'px';
        conf.style.animationDelay = (Math.random() * 0.15) + 's';
        conf.style.transform = `translate(-50%, -50%) rotate(${Math.random() * 360}deg)`;

        container.appendChild(conf);
        setTimeout(() => conf.remove(), 1200);
    }
}

/* ==============================================
   Timer
============================================== */
function fmt(ms) {
    const total = Math.max(0, Math.floor(ms));
    const tenths = Math.floor((total % 1000) / 100);
    const s = Math.floor(total / 1000);
    const mm = String(Math.floor(s / 60)).padStart(2, '0');
    const ss = String(s % 60).padStart(2, '0');
    return `${mm}:${ss}.${tenths}`;
}

function tick() {
    const now = performance.now();
    elTimer.textContent = fmt(acc + (now - t0));
    raf = requestAnimationFrame(tick);
}

function timerStart() {
    if (raf) return;
    t0 = performance.now();
    raf = requestAnimationFrame(tick);
}

function timerStop() {
    if (!raf) return;
    cancelAnimationFrame(raf);
    raf = null;
    acc = parseTime(elTimer.textContent);
}

function timerReset() {
    if (raf) {
        cancelAnimationFrame(raf);
        raf = null;
    }
    acc = 0;
    elTimer.textContent = '00:00.0';
}

function parseTime(txt) {
    // mm:ss.t (tenths)
    const m = txt.match(/(\d{2}):(\d{2})\.(\d)/);
    if (!m) return 0;
    const mm = +m[1], ss = +m[2], t = +m[3];
    return ((mm * 60) + ss) * 1000 + t * 100;
}

/* ==============================================
   Word Navigation
============================================== */
function nextWord() {
    if (!current) {
        drawRandom();
        return;
    }

    const complete = isAllMarked();
    const anyErr = hadAnyError();

    // Remove if complete and no errors
    if (complete && !anyErr) {
        pool = pool.filter(w => w !== current);
    }

    // Draw next from remaining pool; if empty, reload from original file (optional)
    if (pool.length === 0) {
        // Optional: keep current displayed and disable next
        btnNext.disabled = true;
        return;
    }

    drawRandom();
}

function drawRandom() {
    const idx = Math.floor(Math.random() * pool.length);
    setCurrentWord(pool[idx]);
    timerReset();
}

async function changeDifficulty(level) {
    currentDifficulty = level;

    const selectedPool = elPoolSelect ? elPoolSelect.value : 'default';
    WORDLIST_PATH = `wordlists/${selectedPool}/${level}.txt`;

    // Visually highlight active difficulty
    [btnEasy, btnMedium, btnHard].forEach(b => b.classList.remove('primary'));
    if (level === 'easy') btnEasy.classList.add('primary');
    if (level === 'medium') btnMedium.classList.add('primary');
    if (level === 'hard') btnHard.classList.add('primary');

    // Reload the word pool
    try {
        const words = await loadWordlist();
        pool = words.slice();
        if (pool.length === 0) {
            elWord.textContent = `No words in ${WORDLIST_PATH}`;
            btnNext.disabled = true;
            return;
        }
        btnNext.disabled = false;
        drawRandom();
    } catch (err) {
        console.error(err);
        elWord.textContent = `Could not load ${WORDLIST_PATH}`;
    }
}

/* ==============================================
   Keyboard Bindings
============================================== */
function onKey(e) {
    // Avoid using inputs (none in UI, but safeguard)
    if (['INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName)) return;

    if (e.key === 'o' || e.key === 'O') {
        e.preventDefault();
        mark('ok');
        return;
    }
    if (e.key === 'p' || e.key === 'P') {
        e.preventDefault();
        mark('err');
        return;
    }
    if (e.key === 'Backspace') {
        e.preventDefault();
        undo();
        return;
    }

    // Quality of life: Space = play audio, S = Start, T = Stop, R = Reset, N = Next
    if (e.code === 'Space') {
        e.preventDefault();
        playAudio();
        return;
    }
    if (e.key === 's' || e.key === 'S') {
        timerStart();
        return;
    }
    if (e.key === 't' || e.key === 'T') {
        timerStop();
        return;
    }
    if (e.key === 'r' || e.key === 'R') {
        timerReset();
        return;
    }
    if (e.key === 'n' || e.key === 'N') {
        nextWord();
        return;
    }

    // Show secret word while holding "I"
    window.addEventListener('keydown', e => {
    if (e.key === 'i' || e.key === 'I') {
        elSecretWord.classList.add('visible');
    }
    });

    window.addEventListener('keyup', e => {
    if (e.key === 'i' || e.key === 'I') {
        elSecretWord.classList.remove('visible');
    }
    });
}

/* ==============================================
   Wire Up UI
============================================== */
btnPlay.addEventListener('click', playAudio);
btnNext.addEventListener('click', nextWord);
btnTStart.addEventListener('click', timerStart);
btnTStop.addEventListener('click', timerStop);
btnTReset.addEventListener('click', timerReset);
window.addEventListener('keydown', onKey, { capture: true });
btnEasy.addEventListener('click', () => changeDifficulty('easy'));
btnMedium.addEventListener('click', () => changeDifficulty('medium'));
btnHard.addEventListener('click', () => changeDifficulty('hard'));
elWord.addEventListener('click', toggleWordMode);
elPoolSelect.addEventListener('change', () => { changeDifficulty(currentDifficulty); });

/* ==============================================
   Initialize
============================================== */
(async function init() {
    try {
        const words = await loadWordlist();
        pool = words.slice();
        if (pool.length === 0) {
            elWord.textContent = 'Add words to wordlist.txt';
            btnNext.disabled = true;
            return;
        }
        // drawRandom();
    } catch (err) {
        console.error(err);
        elWord.textContent = 'Could not load wordlist.txt';
        btnNext.disabled = true;
    }
})();

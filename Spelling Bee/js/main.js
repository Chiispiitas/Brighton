"use strict";

/* ==============================================
   Configuration & State
============================================== */
let hiddenMode = true; // default: hidden word mode
let currentDifficulty = 'easy';
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

/** @typedef {'pending'|'ok'|'err'|'reveal'|'skip'} Mark */
let pool = [];
let current = null;
let marks = [];
let ptr = 0;

// DOM references
const elWord = document.getElementById('word');
const elSecretWord = document.getElementById('secret-word');
const elAudio = document.getElementById('audio');
const elWrongAudio = document.getElementById('wrong-audio');
const elCorrectAudio = document.getElementById('correct-audio');
const btnPlay = document.getElementById('play-audio');
const btnNext = document.getElementById('next-word');
const btnNextLetter = document.getElementById('next-letter');
const btnEasy = document.getElementById('btn-easy');
const btnMedium = document.getElementById('btn-medium');
const btnHard = document.getElementById('btn-hard');
const elPoolSelect = document.getElementById('pool-select');
const elVolumeSlider = document.getElementById('volume-slider');
const elVolumeValue = document.getElementById('volume-value');

// Word-pronunciation audio is routed through Web Audio so the slider can
// amplify above the HTMLMediaElement 100% ceiling (up to 200% / gain 2.0).
let wordAudioContext = null;
let wordAudioSource = null;
let wordAudioGain = null;
let wordVolume = 1;

async function ensureWordAudioGraph() {
    if (!wordAudioContext) {
        const AudioContextClass = window.AudioContext || window.webkitAudioContext;
        if (!AudioContextClass) return;

        wordAudioContext = new AudioContextClass();
        wordAudioSource = wordAudioContext.createMediaElementSource(elAudio);
        wordAudioGain = wordAudioContext.createGain();
        wordAudioSource.connect(wordAudioGain);
        wordAudioGain.connect(wordAudioContext.destination);
        wordAudioGain.gain.value = wordVolume;
    }

    if (wordAudioContext.state === 'suspended') {
        await wordAudioContext.resume();
    }
}

function setWordVolume(percent) {
    const value = Math.max(0, Math.min(200, Number(percent) || 0));
    wordVolume = value / 100;

    if (elVolumeSlider) elVolumeSlider.value = String(value);
    if (elVolumeValue) elVolumeValue.textContent = `${Math.round(value)}%`;

    if (wordAudioGain) {
        wordAudioGain.gain.value = wordVolume;
    } else {
        // Native media volume supports 0–100%. Values above 100% become
        // effective as soon as Web Audio is initialized on first playback.
        elAudio.volume = Math.min(1, wordVolume);
    }
}

/* ==============================================
   Wordlist Loading
============================================== */
async function loadWordlist() {
    const res = await fetch(WORDLIST_PATH, { cache: 'no-store' });
    if (!res.ok) {
        throw new Error('Failed to load wordlist.txt');
    }

    const text = await res.text();
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
        if (btnNextLetter) btnNextLetter.disabled = true;
        return;
    }

    const frag = document.createDocumentFragment();
    elWord.dataset.mode = hiddenMode ? 'hidden' : 'normal';

    [...current].forEach((ch, i) => {
        const span = document.createElement('span');
        span.className = 'char';

        const m = marks[i] || 'pending';
        if (m === 'ok') span.classList.add('ok');
        else if (m === 'err') span.classList.add('err');
        else if (m === 'reveal') span.classList.add('revealed');
        else if (m === 'skip') span.classList.add('skip');

        let displayCh = ch;

        if (hiddenMode) {
            if (/[A-Za-z]/.test(ch)) {
                if (m === 'pending') {
                    displayCh = '•';
                    span.classList.add('dot');
                } else {
                    displayCh = ch;
                }
            }
        }

        span.textContent = displayCh;

        if (i === ptr) span.classList.add('active');
        frag.appendChild(span);
    });

    elWord.replaceChildren(frag);
    if (btnNextLetter) btnNextLetter.disabled = ptr >= current.length;
}

// Move pointer to next markable character; auto-skip non-letters.
function advancePtr() {
    while (ptr < current.length) {
        const ch = current[ptr];
        if (/[A-Za-z]/.test(ch)) return;

        if (!marks[ptr] || marks[ptr] === 'pending') {
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
    elAudio.src = `${AUDIO_DIR}/${wordToAudioBasename(w)}${AUDIO_EXT}`;
    resetMarks();
}

async function playAudio() {
    elAudio.pause();
    elAudio.currentTime = 0;

    // Pronunciation must always play at the recorded, regular speed.
    elAudio.defaultPlaybackRate = 1;
    elAudio.playbackRate = 1;

    try {
        await ensureWordAudioGraph();
    } catch (err) {
        console.warn('Could not initialize amplified audio; using native volume.', err);
    }

    elAudio.playbackRate = 1;
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
   Letter Progress (O / P / Next Letter / Backspace)
============================================== */
function mark(type) {
    if (!current || ptr >= current.length) return;

    if (!/[A-Za-z]/.test(current[ptr])) {
        advancePtr();
        renderWord();
        return;
    }

    marks[ptr] = type;
    ptr++;
    advancePtr();
    renderWord();

    if (!isAllMarked()) return;

    // A neutral Next Letter reveal still celebrates completion, but does not
    // add a correct/incorrect color or play a correctness sound.
    if (type === 'reveal') {
        if (!hadAnyError()) launchConfetti();
        return;
    }

    if (!hadAnyError()) {
        launchConfetti();
        playCorrectAudio();
    } else {
        playWrongAudio();
    }
}

function revealNextLetter() {
    mark('reveal');
}

function undo() {
    if (!current) return;

    do {
        if (ptr <= 0) break;
        ptr--;
    } while (marks[ptr] === 'skip');

    if (ptr >= 0) {
        marks[ptr] = 'pending';
    }

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
    const pieces = 70;

    for (let i = 0; i < pieces; i++) {
        const conf = document.createElement('div');
        conf.className = 'confetti';
        conf.style.background = colors[Math.floor(Math.random() * colors.length)];

        const angle = Math.random() * 2 * Math.PI;
        const radius = 200 + Math.random() * 400;
        const dx = Math.cos(angle) * radius;
        const dy = Math.sin(angle) * radius;
        conf.style.setProperty('--dx', dx);
        conf.style.setProperty('--dy', dy);

        conf.style.width = 6 + Math.random() * 8 + 'px';
        conf.style.height = 6 + Math.random() * 8 + 'px';
        conf.style.animationDelay = (Math.random() * 0.15) + 's';
        conf.style.transform = `translate(-50%, -50%) rotate(${Math.random() * 360}deg)`;

        container.appendChild(conf);
        setTimeout(() => conf.remove(), 1200);
    }
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

    // Remove from the remaining pool when the word was completed without errors.
    if (complete && !anyErr) {
        pool = pool.filter(w => w !== current);
    }

    if (pool.length === 0) {
        btnNext.disabled = true;
        return;
    }

    drawRandom();
}

function drawRandom() {
    const idx = Math.floor(Math.random() * pool.length);
    setCurrentWord(pool[idx]);
}

async function changeDifficulty(level) {
    currentDifficulty = level;

    const selectedPool = elPoolSelect ? elPoolSelect.value : 'default';
    WORDLIST_PATH = `wordlists/${selectedPool}/${level}.txt`;

    [btnEasy, btnMedium, btnHard].forEach(b => b.classList.remove('primary'));
    if (level === 'easy') btnEasy.classList.add('primary');
    if (level === 'medium') btnMedium.classList.add('primary');
    if (level === 'hard') btnHard.classList.add('primary');

    try {
        const words = await loadWordlist();
        pool = words.slice();

        if (pool.length === 0) {
            current = null;
            elWord.textContent = `No words in ${WORDLIST_PATH}`;
            btnNext.disabled = true;
            if (btnNextLetter) btnNextLetter.disabled = true;
            return;
        }

        btnNext.disabled = false;
        drawRandom();
    } catch (err) {
        console.error(err);
        current = null;
        elWord.textContent = `Could not load ${WORDLIST_PATH}`;
        btnNext.disabled = true;
        if (btnNextLetter) btnNextLetter.disabled = true;
    }
}

/* ==============================================
   Keyboard Bindings
============================================== */
function onKey(e) {
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

    if (e.code === 'Space') {
        e.preventDefault();
        playAudio();
        return;
    }

    if (e.key === 'n' || e.key === 'N') {
        e.preventDefault();
        nextWord();
    }
}

function showSecretWord(e) {
    if (e.key === 'i' || e.key === 'I') {
        elSecretWord.classList.add('visible');
    }
}

function hideSecretWord(e) {
    if (e.key === 'i' || e.key === 'I') {
        elSecretWord.classList.remove('visible');
    }
}

/* ==============================================
   Wire Up UI
============================================== */
btnPlay.addEventListener('click', playAudio);
btnNext.addEventListener('click', nextWord);
btnNextLetter.addEventListener('click', revealNextLetter);
window.addEventListener('keydown', onKey, { capture: true });
window.addEventListener('keydown', showSecretWord);
window.addEventListener('keyup', hideSecretWord);
btnEasy.addEventListener('click', () => changeDifficulty('easy'));
btnMedium.addEventListener('click', () => changeDifficulty('medium'));
btnHard.addEventListener('click', () => changeDifficulty('hard'));
elWord.addEventListener('click', toggleWordMode);
elPoolSelect.addEventListener('change', () => { changeDifficulty(currentDifficulty); });

if (elVolumeSlider) {
    elVolumeSlider.addEventListener('input', () => setWordVolume(elVolumeSlider.value));
}

// Lock pronunciation playback to 1× even if another script or browser action
// tries to alter the media element's playback rate.
elAudio.defaultPlaybackRate = 1;
elAudio.playbackRate = 1;
elAudio.addEventListener('ratechange', () => {
    if (elAudio.defaultPlaybackRate !== 1) elAudio.defaultPlaybackRate = 1;
    if (elAudio.playbackRate !== 1) elAudio.playbackRate = 1;
});

setWordVolume(elVolumeSlider ? elVolumeSlider.value : 100);

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
            btnNextLetter.disabled = true;
            return;
        }

        btnNextLetter.disabled = true;
        // The first word is still drawn when Next Word is pressed.
    } catch (err) {
        console.error(err);
        elWord.textContent = 'Could not load wordlist.txt';
        btnNext.disabled = true;
        btnNextLetter.disabled = true;
    }
})();

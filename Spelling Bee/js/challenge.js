"use strict";
(() => {
  const words = [...new Set([
    "indictment", "penchant", "paradigm", "epitome", "puerile", "synonymous", "jeopardy", "nonchalant", "vehemence", "ascetic",
    "archetypal", "myriad", "ameliorate", "panacea", "malleable", "debacle", "succinct", "boisterous", "convivial", "zealotry",
    "bureaucracy", "sacrilege", "pseudonym", "obsolescence", "hierarchy", "hypocrisy", "asymmetrical", "annihilate", "innocuous", "iridescent",
    "irreconcilable", "embezzlement", "homogeneous", "colloquial", "penitentiary", "presumptuous", "mausoleum", "supercilious", "intermittent", "harangue",
    "connoisseurship", "bourgeois", "denouement", "acquiescence", "surreptitious", "pusillanimous", "idiosyncrasy", "ecclesiastical", "insouciant", "legerdemain",
    "desiccate", "unconscionable", "verisimilitude", "vicissitude", "raconteur", "phlegmatic", "bureaucracy", "paraphernalia", "prescience", "sacrilege"
  ])];
  const audio = document.getElementById("pronunciation"), listen = document.getElementById("listen"), next = document.getElementById("next");
  const label = document.getElementById("listen-label"), progress = document.getElementById("progress"), status = document.getElementById("status");
  const reveal = document.getElementById("reveal"), revealedWord = document.getElementById("revealed-word");
  const storageKey = "bee-mixed-challenge-v1";
  let deck, index = 0, generation = 0;
  function shuffle() {
    const result = [...words];
    for (let i = result.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [result[i], result[j]] = [result[j], result[i]]; }
    return result;
  }
  try {
    const saved = JSON.parse(sessionStorage.getItem(storageKey));
    if (Array.isArray(saved?.deck) && saved.deck.length === words.length && new Set(saved.deck).size === words.length && saved.deck.every(word => words.includes(word)) && Number.isInteger(saved.index) && saved.index >= 0 && saved.index <= words.length) {
      deck = saved.deck; index = saved.index;
    }
  } catch { /* The challenge also works without browser storage. */ }
  if (!deck) deck = shuffle();
  function save() { try { sessionStorage.setItem(storageKey, JSON.stringify({ deck, index })); } catch { /* Current page state remains available. */ } }
  function load() {
    generation++; audio.pause(); listen.dataset.playing = "false"; status.textContent = ""; save();
    const complete = index === deck.length;
    document.getElementById("heading").textContent = complete ? "Challenge complete" : "Spelling challenge";
    progress.textContent = complete ? `${deck.length} words` : `Word ${index + 1} of ${deck.length}`;
    listen.hidden = complete;
    reveal.hidden = complete; reveal.disabled = true; reveal.textContent = "Reveal word"; reveal.setAttribute("aria-expanded", "false");
    revealedWord.hidden = true; revealedWord.textContent = "";
    next.textContent = complete ? "Start again" : index === deck.length - 1 ? "Finish" : "Next word →";
    label.textContent = "Play audio";
    if (complete) audio.removeAttribute("src");
    else audio.src = `audio/${encodeURIComponent(deck[index].toLowerCase().replace(/\s+/g, "-"))}.mp3`;
    audio.load();
  }
  async function play() {
    if (index === deck.length) return;
    const run = generation;
    audio.currentTime = 0; status.textContent = "Loading audio…";
    try {
      await audio.play();
      if (run !== generation) return;
      listen.dataset.playing = "true"; label.textContent = "Play again"; status.textContent = "";
    } catch (error) {
      if (run !== generation) return;
      listen.dataset.playing = "false";
      status.textContent = error.name === "NotAllowedError" ? "Press Play audio to listen." : "Audio could not play. Try again or move to the next word.";
    }
  }
  audio.addEventListener("ended", () => { listen.dataset.playing = "false"; if (audio.ended && index < deck.length) reveal.disabled = false; });
  audio.addEventListener("error", () => { if (index < deck.length) status.textContent = "Audio could not load. Try again or move to the next word."; });
  listen.addEventListener("click", play);
  reveal.addEventListener("click", () => {
    if (reveal.disabled || index === deck.length) return;
    const show = revealedWord.hidden;
    revealedWord.textContent = show ? deck[index] : ""; revealedWord.hidden = !show;
    reveal.textContent = show ? "Hide word" : "Reveal word"; reveal.setAttribute("aria-expanded", String(show));
  });
  next.addEventListener("click", () => {
    if (index === deck.length) { deck = shuffle(); index = 0; }
    else index++;
    load(); if (index < deck.length) play();
  });
  load();
})();

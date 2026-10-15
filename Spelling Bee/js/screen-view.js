"use strict";
(() => {
  const Model = window.BeeScreen;
  const Cloud = window.SpellingCloud;
  const params = new URLSearchParams(location.search);
  const preview = params.has("preview");
  const demo = params.has("demo");
  const stage = document.getElementById("broadcast");
  const scene = document.getElementById("scene");
  const join = document.getElementById("screen-join");
  let state = Model.initial(), code = "", pageOffset = 0, lastCue = "", failures = 0;
  let pollGeneration = 0, displaySignature = "", transitionTimer;
  const escape = value => String(value ?? "").replace(/[&<>"']/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[char]));
  const tag = value => `<div class="eyebrow">${escape(value)}</div>`;
  const title = (value, extra = "") => `<h1 class="headline ${extra}">${escape(value)}</h1>`;
  const current = () => state.contestants.find(row => row.id === state.currentId);
  const nameClass = value => value.length > 55 ? "name-xlong" : value.length > 28 ? "name-long" : "";
  const lower = row => `<div class="lower-third"><span>#${escape(row?.number || "—")}</span><strong>${escape(row?.name || "Contestant to be announced")}</strong><span>${escape(row?.group || "")}</span></div>`;
  function cards(rows) {
    return rows.map((row, index) => `<div class="contestant-card ${row.status} ${row.id === state.currentId ? "current" : ""}" style="--i:${index}"><span class="number">${escape(row.number)}</span><div class="identity"><strong>${escape(row.name)}</strong><small>${escape(row.group)}</small></div><span class="status">${row.status === "eliminated" ? "Completed" : row.id === state.currentId ? "Now spelling" : row.status === "finalist" ? "Finalist" : "In contention"}</span></div>`).join("");
  }
  function paged(rows, size) {
    const count = Math.max(1, Math.ceil(rows.length / size));
    const page = (Math.floor(state.boardPage) + (state.autoBoard ? pageOffset : 0)) % count;
    return { rows: rows.slice(page * size, (page + 1) * size), label: `${page + 1} / ${count}` };
  }
  function confetti() { return `<div class="confetti" aria-hidden="true">${Array.from({ length: 20 }, (_, index) => `<i style="--i:${index}"></i>`).join("")}</div>`; }
  function content() {
    const row = current();
    if (state.scene === "standby") return `<div class="standby-layout"><div>${tag("WELCOME TO THE STAGE")}<h1 class="headline">THE POWER<br>OF <em>EVERY LETTER.</em></h1><p class="subline">Lev-Vigotsky Spelling Bee</p><div class="standby-rule">OUR SPELLERS. THEIR MOMENT.</div></div><img class="hero-crest" src="assets/logo.png" alt="School crest"></div>`;
    if (state.scene === "board" || state.scene === "finalists") {
      const finalists = state.scene === "finalists";
      const all = finalists ? state.contestants.filter(item => item.status === "finalist") : state.contestants;
      const page = paged(all, finalists ? 6 : 8);
      return `<div class="board-heading"><div>${tag(finalists ? "THE FINAL STRETCH" : "THE FIELD")}${title(finalists ? "Meet your finalists" : "Competition board")}</div><span class="page-label">${page.label}</span></div>${all.length ? finalists ? `<div class="finalists-grid">${page.rows.map(item => `<article class="finalist-card"><span class="number">#${escape(item.number)}</span><strong class="${nameClass(item.name)}">${escape(item.name)}</strong><small>${escape(item.group)}</small></article>`).join("")}</div>` : `<div class="board-grid">${cards(page.rows)}</div>` : `<div class="empty-state">${finalists ? "Finalists will be announced shortly." : "The contestants will be announced shortly."}</div>`}`;
    }
    if (state.scene === "round") return `${tag("A NEW CHAPTER BEGINS")}${title(state.round, "round-number " + nameClass(state.round))}<div class="round-line"></div><p class="subline">Take a breath. Take the stage. Make every letter count.</p>`;
    if (state.scene === "spelling") return `<div class="speller-layout"><div>${tag("NOW SPELLING")}<span class="speller-number">SPELLER #${escape(row?.number || "—")}</span>${title(row?.name || "The stage is yours", `speller-name ${nameClass(row?.name || "")}`)}<span class="group-pill">${escape(row?.group || "Lev-Vigotsky Spelling Bee")}</span></div><div class="timer-box ${state.timer.visible ? "" : "off"}" id="timer-box"><strong id="timer-value">${Model.remaining(state.timer)}</strong><span>SECONDS</span></div></div>`;
    if (["definition", "example"].includes(state.scene)) {
      const value = state[state.scene] || "Word information will appear shortly.";
      return `${tag(state.scene === "definition" ? "WORD DEFINITION" : "IN A SENTENCE")}<p class="quote ${value.length > 280 ? "xlong" : value.length > 150 ? "long" : ""}">${escape(value)}</p>${lower(row)}`;
    }
    if (state.scene === "pending") return `${tag("THE JUDGES ARE DELIBERATING")}${title("Every letter.<br>Every moment.".replace("<br>", " "))}<div class="pending-dots" aria-hidden="true"><i></i><i></i><i></i></div>${lower(row)}`;
    if (state.scene === "result") {
      const outcome = state.result === "correct" ? "Correct!" : state.result === "incorrect" ? "Well played." : "The word is…";
      return `<div class="result-${state.result}">${tag(state.result === "incorrect" ? "THANK YOU FOR YOUR COURAGE" : state.result === "correct" ? "ANOTHER WORD. ANOTHER VICTORY." : "WORD REVEAL")}<div class="result-rule"></div>${title(outcome)}${state.revealWord ? `<div class="reveal-word ${state.revealWord.length > 60 ? "xlong" : state.revealWord.length > 28 ? "long" : ""}">${escape(state.revealWord)}</div>` : ""}${lower(row)}</div>${state.result === "correct" ? confetti() : ""}`;
    }
    if (state.scene === "break") return `${tag("INTERMISSION")}${title("A moment<br>to recharge.".replace("<br>", " "))}<p class="subline">${escape(state.message)}</p>${state.timer.visible ? `<div class="standby-rule">RETURNING IN <strong id="break-timer">${Model.remaining(state.timer)}s</strong></div>` : ""}`;
    if (state.scene === "podium") {
      const placed = place => state.contestants.find(item => item.place === place);
      const podiumCard = (place, cls) => { const item = placed(place); return `<article class="podium-card ${cls}"><div class="place">${place === 1 ? "1ST" : place === 2 ? "2ND" : "3RD"}</div><strong>${escape(item?.name || "To be announced")}</strong><small>${escape(item?.group || "")}</small></article>`; };
      return `<div class="podium-title">${tag("EXCELLENCE, LETTER BY LETTER")}${title("Our champions")}</div><div class="podium">${podiumCard(2, "second")}${podiumCard(1, "first")}${podiumCard(3, "third")}</div>${placed(1) ? confetti() : ""}`;
    }
    return `<div class="closing-layout"><img src="assets/logo.png" alt="School crest">${tag("LEV-VIGOTSKY SPELLING BEE")}${title("Beyond the last letter.")}<p class="subline">${escape(state.closing)}</p></div>`;
  }
  function draw() {
    stage.classList.toggle("quiet", state.motion === "quiet");
    stage.dataset.scene = state.scene;
    stage.dataset.revision = String(state.revision);
    document.getElementById("round-bug").textContent = state.round;
    document.getElementById("footer-copy").textContent = demo ? "REHEARSAL · SAMPLE CONTESTANTS" : "KNOWLEDGE · COURAGE · EXCELLENCE";
    scene.innerHTML = `<div class="scene-fit"><div class="scene-content">${content()}</div></div>`;
    fitScene();
    updateTimer();
  }
  function fitScene() {
    const wrapper = scene.querySelector(".scene-fit");
    if (!wrapper) return;
    wrapper.style.transform = "";
    const scale = Math.min(1, scene.clientHeight / Math.max(1, wrapper.scrollHeight));
    if (scale < 1) wrapper.style.transform = `scale(${scale})`;
  }
  function apply(next) {
    const normalized = Model.normalize(next);
    const signature = JSON.stringify(normalized);
    if (signature === displaySignature) return;
    if (normalized.revision < state.revision && !preview && !demo) return;
    displaySignature = signature;
    const cue = normalized.cueId || normalized.scene;
    const changed = cue !== lastCue;
    lastCue = cue; state = normalized;
    if (changed) pageOffset = 0;
    clearTimeout(transitionTimer);
    const stinger = document.getElementById("transition");
    stinger.classList.remove("play");
    if (changed && state.motion === "full" && !matchMedia("(prefers-reduced-motion: reduce)").matches) {
      void stinger.offsetWidth; stinger.classList.add("play");
      transitionTimer = setTimeout(draw, 310);
    } else draw();
  }
  function updateTimer() {
    const seconds = Model.remaining(state.timer);
    const timer = document.getElementById("timer-value");
    if (timer) timer.textContent = seconds;
    const box = document.getElementById("timer-box");
    box?.classList.toggle("low", seconds <= 10);
    box?.classList.toggle("expired", seconds === 0);
    const breakTimer = document.getElementById("break-timer");
    if (breakTimer) breakTimer.textContent = `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
  }
  async function connect(value) {
    const requested = Cloud.normalizeSessionCode(value);
    if (!requested) return;
    const generation = ++pollGeneration;
    document.getElementById("join-error").textContent = "Connecting…";
    async function poll() {
      try {
        const found = await Cloud.fetchPresenter(requested);
        if (generation !== pollGeneration) return;
        if (!found?.screenBroadcast || !found.broadcast) throw new Error("Screen not found. Open Screen View from Admin View.");
        code = requested;
        apply(found.broadcast); failures = 0;
        join.classList.add("hidden"); document.getElementById("signal").classList.add("hidden");
        const url = new URL(location.href); url.searchParams.set("session", code); history.replaceState(null, "", url);
      } catch (error) {
        if (generation !== pollGeneration) return;
        failures++;
        if (!code) { join.classList.remove("hidden"); document.getElementById("join-error").textContent = error.message; }
        else if (failures >= 3) document.getElementById("signal").classList.remove("hidden");
      }
      if (generation === pollGeneration) setTimeout(poll, Math.min(800 * Math.max(1, failures), 5000));
    }
    await poll();
  }
  join.addEventListener("submit", event => { event.preventDefault(); connect(document.getElementById("screen-code").value); });
  window.addEventListener("message", event => {
    if (!preview || event.source !== parent || event.origin !== location.origin || event.data?.type !== "bee-screen-preview") return;
    apply(event.data.state);
  });
  let controlTimer;
  document.addEventListener("pointermove", () => { document.body.classList.add("show-controls"); clearTimeout(controlTimer); controlTimer = setTimeout(() => document.body.classList.remove("show-controls"), 2200); });
  async function fullscreen() { try { if (document.fullscreenElement) await document.exitFullscreen(); else await document.documentElement.requestFullscreen(); } catch { /* Native browser fullscreen remains available. */ } }
  document.getElementById("fullscreen").addEventListener("click", fullscreen);
  document.addEventListener("keydown", event => { if (event.key.toLowerCase() === "f" && !/INPUT|TEXTAREA/.test(event.target.tagName)) fullscreen(); });
  setInterval(updateTimer, 200);
  window.addEventListener("resize", fitScene);
  document.fonts?.ready.then(fitScene);
  setInterval(() => { if (["board", "finalists"].includes(state.scene) && state.autoBoard) { pageOffset++; draw(); } }, 8000);
  draw();
  if (preview) document.getElementById("fullscreen").remove();
  else if (demo) {
    const sample = Model.initial();
    sample.contestants = ["Isabella Martinez", "Santiago Lopez", "Valentina Torres", "Mateo Andrade", "Sofia Castillo", "Daniel Perez"].map((name, index) => ({ id: String(index), name, number: String(index + 1), group: `Grade ${index % 3 + 5}`, status: "finalist", place: index < 3 ? index + 1 : 0 }));
    sample.currentId = "0"; sample.definition = "The ability to face something difficult with confidence.";
    sample.example = "It takes _____ to stand on this stage."; sample.result = "correct";
    let index = 0;
    const advance = () => { sample.scene = Model.scenes[index++ % Model.scenes.length][0]; sample.cueId = String(index); sample.revealWord = sample.scene === "result" ? "COURAGE" : ""; apply(sample); };
    advance(); setInterval(advance, 7000);
  } else if (params.get("session")) connect(params.get("session"));
  else join.classList.remove("hidden");
})();

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
  let pollGeneration = 0, displaySignature = "";
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
  const canAnimate = () => state.motion === "full" && !matchMedia("(prefers-reduced-motion: reduce)").matches;
  function content() {
    const row = current();
    if (state.scene === "standby") return `<div class="centered-layout">${title("Spelling Bee")}</div>`;
    if (state.scene === "board" || state.scene === "finalists") {
      const finalists = state.scene === "finalists";
      const all = finalists ? state.contestants.filter(item => item.status === "finalist") : state.contestants;
      const page = paged(all, finalists ? 6 : 8);
      return `<div class="board-heading">${title(finalists ? "Finalists" : "Competition board")}<span class="page-label">${page.label}</span></div>${all.length ? finalists ? `<div class="finalists-grid">${page.rows.map(item => `<article class="finalist-card"><span class="number">#${escape(item.number)}</span><strong class="${nameClass(item.name)}">${escape(item.name)}</strong><small>${escape(item.group)}</small></article>`).join("")}</div>` : `<div class="board-grid">${cards(page.rows)}</div>` : `<div class="empty-state">${finalists ? "Finalists pending" : "Contestants pending"}</div>`}`;
    }
    if (state.scene === "round") return `<div class="centered-layout">${title(state.round, "round-number " + nameClass(state.round))}</div>`;
    if (state.scene === "spelling") return `<div class="speller-layout"><div>${tag("Now spelling")}<span class="speller-number">#${escape(row?.number || "—")}</span>${title(row?.name || "Contestant pending", `speller-name ${nameClass(row?.name || "")}`)}<span class="group-pill">${escape(row?.group || "")}</span></div><div class="timer-box ${state.timer.visible ? "" : "off"}" id="timer-box"><strong id="timer-value">${Model.remaining(state.timer)}</strong><span>seconds</span></div></div>`;
    if (["definition", "example"].includes(state.scene)) {
      const value = state[state.scene] || "";
      return `${tag(state.scene === "definition" ? "Definition" : "Example")}<p class="quote ${value.length > 280 ? "xlong" : value.length > 150 ? "long" : ""}">${escape(value)}</p>${lower(row)}`;
    }
    if (state.scene === "pending") return `${title("Decision pending")}<div class="pending-dots" aria-hidden="true"><i></i><i></i><i></i></div>${lower(row)}`;
    if (state.scene === "result") {
      const outcome = state.result === "correct" ? "Correct" : state.result === "incorrect" ? "Incorrect" : "Word reveal";
      return `<div class="result-${state.result}">${title(outcome)}${state.revealWord ? `<div class="reveal-word ${state.revealWord.length > 60 ? "xlong" : state.revealWord.length > 28 ? "long" : ""}">${escape(state.revealWord)}</div>` : ""}${lower(row)}</div>`;
    }
    if (state.scene === "break") {
      const message = state.message === "We’ll be back shortly" ? "" : state.message;
      return `<div class="centered-layout">${title("Break")}${message ? `<p class="subline">${escape(message)}</p>` : ""}${state.timer.visible ? `<div class="break-countdown">Resumes in <strong id="break-timer">${Model.remaining(state.timer)}s</strong></div>` : ""}</div>`;
    }
    if (state.scene === "podium") {
      const placed = place => state.contestants.find(item => item.place === place);
      const podiumCard = (place, cls) => { const item = placed(place); return `<article class="podium-card ${cls}"><div class="place">${place === 1 ? "1ST" : place === 2 ? "2ND" : "3RD"}</div><strong>${escape(item?.name || "To be announced")}</strong><small>${escape(item?.group || "")}</small></article>`; };
      return `<div class="podium-title">${title("Podium")}</div><div class="podium">${podiumCard(2, "second")}${podiumCard(1, "first")}${podiumCard(3, "third")}</div>`;
    }
    const closing = state.closing === "Thank you for being part of the bee." ? "" : state.closing;
    return `<div class="centered-layout">${title("Spelling Bee")}${closing ? `<p class="subline">${escape(closing)}</p>` : ""}</div>`;
  }
  function draw({ animate = false } = {}) {
    stage.classList.toggle("quiet", state.motion === "quiet");
    stage.dataset.scene = state.scene;
    stage.dataset.revision = String(state.revision);
    document.getElementById("round-bug").textContent = state.round;
    document.getElementById("footer-copy").textContent = demo ? "REHEARSAL · SAMPLE CONTESTANTS" : "";
    scene.querySelectorAll(".scene-outgoing").forEach(layer => layer.remove());
    const previous = scene.querySelector(".scene-fit");
    const next = document.createElement("div");
    next.className = "scene-fit";
    next.innerHTML = `<div class="scene-content">${content()}</div>`;
    if (previous && animate && canAnimate()) {
      previous.classList.add("scene-outgoing");
      previous.setAttribute("aria-hidden", "true");
      previous.querySelectorAll("[id]").forEach(element => element.removeAttribute("id"));
      const outgoing = previous.querySelector(".scene-content");
      const computed = getComputedStyle(outgoing);
      const start = { opacity: computed.opacity, transform: computed.transform, filter: computed.filter };
      outgoing.getAnimations().forEach(animation => animation.cancel());
      const fade = outgoing.animate([start, { opacity: 0, transform: "translateY(-4px)", filter: "blur(1px)" }], { duration: 300, easing: "ease-in-out", fill: "forwards" });
      fade.finished.then(() => previous.remove()).catch(() => previous.remove());
      scene.append(next);
      const entrance = next.firstElementChild.animate([
        { opacity: 0, transform: "translateY(8px)", filter: "blur(1.5px)" },
        { opacity: 1, transform: "translateY(0)", filter: "blur(0)" }
      ], { duration: 760, delay: 100, easing: "cubic-bezier(.22,1,.36,1)", fill: "both" });
      entrance.finished.then(() => entrance.cancel()).catch(() => {});
    } else scene.replaceChildren(next);
    fitScene();
    updateTimer();
  }
  function fitScene() {
    const wrapper = scene.querySelector(".scene-fit:not(.scene-outgoing)");
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
    const visual = value => { const { revision, timer, ...fields } = value; return JSON.stringify({ ...fields, timerVisible: timer.visible }); };
    const contentChanged = visual(normalized) !== visual(state);
    lastCue = cue; state = normalized;
    if (changed) pageOffset = 0;
    if (contentChanged) draw({ animate: true });
    else { stage.dataset.revision = String(state.revision); updateTimer(); }
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
  setInterval(() => {
    const rows = state.scene === "finalists" ? state.contestants.filter(row => row.status === "finalist") : state.contestants;
    const size = state.scene === "finalists" ? 6 : 8;
    if (["board", "finalists"].includes(state.scene) && state.autoBoard && rows.length > size) { pageOffset++; draw({ animate: true }); }
  }, 8000);
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

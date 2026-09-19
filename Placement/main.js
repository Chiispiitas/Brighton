"use strict";

(() => {
  const PLACEMENT_VERSION = "2026-09-19.4";
  const STORAGE_KEY = "brighton-placement-session-v1";
  const MAX_LISTENING_PLAYS = 3;
  const modules = window.BRIGHTON_PLACEMENT_MODULES || {};

  const els = {
    startScreen: document.querySelector("#startScreen"),
    transitionScreen: document.querySelector("#transitionScreen"),
    placementShell: document.querySelector("#placementShell"),
    studentForm: document.querySelector("#studentForm"),
    studentName: document.querySelector("#studentName"),
    startBtn: document.querySelector("#startBtn"),
    formError: document.querySelector("#formError"),
    candidateName: document.querySelector("#candidateName"),
    transitionStage: document.querySelector("#transitionStage"),
    transitionLabel: document.querySelector("#transitionLabel"),
    stageCard: document.querySelector("#stageCard"),
    stageIndex: document.querySelector("#stageIndex"),
    stageEyebrow: document.querySelector("#stageEyebrow"),
    stageTitle: document.querySelector("#stageTitle"),
    stageNote: document.querySelector("#stageNote"),
    introScan: document.querySelector("#introScan"),
    stageRoot: document.querySelector("#placementStageRoot")
  };

  const apiBase = String(window.BRIGHTON_SITE_CONFIG?.API_BASE_URL || "").replace(/\/$/, "");

  let session = null;
  let currentModuleId = null;
  let currentQuestionIndex = 0;
  let moduleAnswers = [];
  let listeningPlays = {};
  let questionStartedAt = 0;
  let locked = false;
  let activeAudio = null;

  function makeClientSessionId() {
    if (window.crypto?.randomUUID) return window.crypto.randomUUID();
    return `placement-${Date.now()}-${Math.random().toString(36).slice(2)}-${Math.random().toString(36).slice(2)}`;
  }

  function loadLocalSession() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      const saved = JSON.parse(raw);
      if (!saved?.sessionId || !saved?.clientSessionId || saved.placementVersion !== PLACEMENT_VERSION) return null;
      return saved;
    } catch (error) {
      console.warn("Could not restore placement session.", error);
      return null;
    }
  }

  function saveLocalSession() {
    if (!session) return;

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        ...session,
        currentModuleId,
        currentQuestionIndex,
        moduleAnswers,
        listeningPlays
      }));
    } catch (error) {
      console.warn("Could not cache placement session.", error);
    }
  }

  async function apiPost(path, body) {
    if (!apiBase) throw new Error("Placement service is unavailable.");

    const response = await fetch(`${apiBase}/${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });

    const payload = await response.json().catch(() => ({}));
    if (!response.ok || !payload?.success) {
      throw new Error(payload?.error || "Placement service error.");
    }

    return payload;
  }

  async function startRemoteSession(name, clientSessionId) {
    return apiPost("startPlacement", {
      clientSessionId,
      studentName: name,
      placementVersion: PLACEMENT_VERSION
    });
  }

  function setTransition(stage, label) {
    els.transitionStage.textContent = stage;
    els.transitionLabel.textContent = label;
  }

  function showTransition(stage, label, callback, delay = 900) {
    stopActiveAudio();
    setTransition(stage, label);
    els.placementShell.classList.add("hidden");
    els.startScreen.classList.add("hidden");
    els.transitionScreen.classList.remove("hidden");

    window.setTimeout(() => {
      els.transitionScreen.classList.add("hidden");
      callback();
    }, delay);
  }

  function openShell() {
    els.startScreen.classList.add("hidden");
    els.transitionScreen.classList.add("hidden");
    els.placementShell.classList.remove("hidden");
  }

  function setShellStage(stageNumber) {
    const nodes = Array.from(document.querySelectorAll(".shell-node"));
    const tracks = Array.from(document.querySelectorAll(".shell-track"));

    nodes.forEach((node, index) => {
      const number = index + 1;
      node.classList.toggle("active", number === stageNumber);
      node.classList.toggle("done", number < stageNumber);
    });

    tracks.forEach((track, index) => {
      track.classList.toggle("done", index < stageNumber - 1);
    });
  }

  function moduleData(moduleId) {
    return modules[moduleId] || null;
  }

  function configureStage(data) {
    const isReading = data.phase === "reading";
    const isListening = data.phase === "listening";
    const isCalibration = data.phase === "calibration";

    els.stageCard.classList.add("question-mode");
    els.stageCard.classList.toggle("reading-mode", isReading);
    els.stageCard.classList.toggle("listening-mode", isListening);
    els.introScan.classList.add("hidden");

    if (isReading) {
      setShellStage(2);
      els.stageIndex.textContent = "02";
      els.stageEyebrow.textContent = "Reading";
      els.stageTitle.textContent = "Read.";
      els.stageNote.textContent = "";
      return;
    }

    if (isListening) {
      setShellStage(3);
      els.stageIndex.textContent = "03";
      els.stageEyebrow.textContent = "Listening";
      els.stageTitle.textContent = "Listen.";
      els.stageNote.textContent = "";
      return;
    }

    setShellStage(1);
    els.stageIndex.textContent = "01";
    els.stageEyebrow.textContent = isCalibration ? "Calibration" : "Language";
    els.stageTitle.textContent = isCalibration ? "Find your starting point." : "Keep going.";
    els.stageNote.textContent = "Choose the best answer.";
  }

  function startModule(moduleId) {
    const data = moduleData(moduleId);

    if (!data?.items?.length) {
      if (session?.phase === "speaking") renderSpeakingHandoff();
      return;
    }

    stopActiveAudio();
    currentModuleId = moduleId;
    currentQuestionIndex = 0;
    moduleAnswers = [];
    session.phase = data.phase;
    session.moduleId = moduleId;
    saveLocalSession();

    openShell();
    configureStage(data);
    renderQuestion();
  }

  function resumeSavedSession(saved) {
    session = {
      clientSessionId: saved.clientSessionId,
      sessionId: saved.sessionId,
      placementVersion: saved.placementVersion,
      studentName: saved.studentName || "",
      phase: saved.phase || "calibration",
      moduleId: saved.moduleId || saved.currentModuleId || "calibration-01",
      provisionalLevel: saved.provisionalLevel || "",
      startedAt: saved.startedAt || ""
    };

    currentModuleId = saved.currentModuleId || session.moduleId;
    currentQuestionIndex = Math.max(0, Number(saved.currentQuestionIndex) || 0);
    moduleAnswers = Array.isArray(saved.moduleAnswers) ? saved.moduleAnswers : [];
    listeningPlays = saved.listeningPlays && typeof saved.listeningPlays === "object"
      ? saved.listeningPlays
      : {};

    els.candidateName.textContent = session.studentName;

    if (session.phase === "speaking" || /^speaking-/.test(currentModuleId || "")) {
      renderSpeakingHandoff();
      return;
    }

    const data = moduleData(currentModuleId);
    if (!data?.items?.length) return;

    currentQuestionIndex = Math.min(currentQuestionIndex, Math.max(0, data.items.length - 1));
    openShell();
    configureStage(data);
    renderQuestion();
  }

  function renderProgress(total) {
    return `
      <div class="question-progress" aria-label="Question ${currentQuestionIndex + 1} of ${total}">
        <span class="question-counter">${String(currentQuestionIndex + 1).padStart(2, "0")} / ${String(total).padStart(2, "0")}</span>
        <div class="question-pips" style="--question-count:${total}" aria-hidden="true">
          ${Array.from({ length: total }, (_, index) => `<i class="${index < currentQuestionIndex ? "done" : index === currentQuestionIndex ? "active" : ""}"></i>`).join("")}
        </div>
      </div>
    `;
  }

  function renderOptions(item, gridClass = "answer-grid", disabled = false) {
    return `
      <div class="${gridClass}">
        ${item.options.map((option, index) => `
          <button class="answer-choice" type="button" data-option-id="${escapeAttr(option.id)}" ${disabled ? "disabled" : ""}>
            <span class="choice-key">${index + 1}</span>
            <span>${escapeHtml(option.text)}</span>
          </button>
        `).join("")}
      </div>
    `;
  }

  function renderStandardQuestion(data, item) {
    return `
      <div class="question-screen">
        ${renderProgress(data.items.length)}
        <h3 class="question-prompt">${escapeHtml(item.prompt)}</h3>
        ${renderOptions(item)}
      </div>
    `;
  }

  function renderReadingQuestion(data, item) {
    return `
      <div class="question-screen reading-screen">
        ${renderProgress(data.items.length)}
        <div class="reading-layout">
          <article class="reading-passage">
            <span class="reading-label">${escapeHtml(data.title || "Text")}</span>
            <p>${escapeHtml(data.passage || "")}</p>
          </article>
          <section class="reading-question">
            <h3 class="question-prompt reading-question-prompt">${escapeHtml(item.prompt)}</h3>
            ${renderOptions(item, "answer-grid reading-answer-grid")}
          </section>
        </div>
      </div>
    `;
  }

  function listeningPlayCount(itemId) {
    return Math.max(0, Math.min(MAX_LISTENING_PLAYS, Number(listeningPlays[itemId]) || 0));
  }

  function listeningPlayLabel(count) {
    const left = Math.max(0, MAX_LISTENING_PLAYS - count);
    if (!left) return "No plays left";
    return `Play · ${left} left`;
  }

  function renderListeningQuestion(data, item) {
    const plays = listeningPlayCount(item.id);
    const canAnswer = plays > 0;

    return `
      <div class="question-screen listening-screen">
        ${renderProgress(data.items.length)}
        <div class="listening-layout">
          <section class="audio-question-player">
            <div class="audio-orb" aria-hidden="true">
              <i></i><i></i><i></i><i></i><i></i>
            </div>
            <button id="listenPlayBtn" class="listen-play-btn" type="button" ${plays >= MAX_LISTENING_PLAYS ? "disabled" : ""}>
              <span class="listen-play-icon" aria-hidden="true">▶</span>
              <span id="listenPlayText">${listeningPlayLabel(plays)}</span>
            </button>
            <div class="play-dots" aria-label="${plays} of ${MAX_LISTENING_PLAYS} plays used">
              ${Array.from({ length: MAX_LISTENING_PLAYS }, (_, index) => `<i class="${index < plays ? "used" : ""}"></i>`).join("")}
            </div>
            <p id="listenStatus" class="listen-status" aria-live="polite">${canAnswer ? "" : "Play the audio."}</p>
            <audio id="questionAudio" preload="auto" src="${escapeAttr(item.audio)}"></audio>
          </section>

          <section class="listening-question">
            <h3 class="question-prompt listening-question-prompt">${escapeHtml(item.prompt)}</h3>
            ${renderOptions(item, "answer-grid listening-answer-grid", !canAnswer)}
          </section>
        </div>
      </div>
    `;
  }

  function renderQuestion() {
    stopActiveAudio();

    const data = moduleData(currentModuleId);
    const item = data?.items?.[currentQuestionIndex];

    if (!item) {
      finishModule();
      return;
    }

    locked = false;
    questionStartedAt = performance.now();

    if (data.phase === "reading") {
      els.stageRoot.innerHTML = renderReadingQuestion(data, item);
    } else if (data.phase === "listening") {
      els.stageRoot.innerHTML = renderListeningQuestion(data, item);
      attachListeningPlayer(item);
    } else {
      els.stageRoot.innerHTML = renderStandardQuestion(data, item);
    }

    els.stageRoot.querySelectorAll(".answer-choice").forEach((button) => {
      button.addEventListener("click", () => chooseAnswer(button.dataset.optionId, button));
    });
  }

  function attachListeningPlayer(item) {
    const audio = els.stageRoot.querySelector("#questionAudio");
    const playBtn = els.stageRoot.querySelector("#listenPlayBtn");
    const playText = els.stageRoot.querySelector("#listenPlayText");
    const status = els.stageRoot.querySelector("#listenStatus");

    if (!audio || !playBtn) return;

    activeAudio = audio;
    audio.controls = false;
    audio.defaultPlaybackRate = 1;
    audio.playbackRate = 1;

    audio.addEventListener("ratechange", () => {
      if (audio.playbackRate !== 1) audio.playbackRate = 1;
    });

    audio.addEventListener("ended", () => {
      playBtn.classList.remove("playing");
      if (listeningPlayCount(item.id) < MAX_LISTENING_PLAYS) playBtn.disabled = false;
      status.textContent = "";
    });

    audio.addEventListener("error", () => {
      playBtn.classList.remove("playing");
      playBtn.disabled = false;
      status.textContent = "Audio unavailable.";
    });

    playBtn.addEventListener("click", async () => {
      const used = listeningPlayCount(item.id);
      if (used >= MAX_LISTENING_PLAYS || !audio.paused) return;

      playBtn.disabled = true;
      playBtn.classList.add("playing");
      status.textContent = "Playing";

      try {
        audio.currentTime = 0;
        audio.playbackRate = 1;
        await audio.play();

        const nextCount = used + 1;
        listeningPlays[item.id] = nextCount;
        saveLocalSession();

        if (playText) playText.textContent = listeningPlayLabel(nextCount);

        const dots = Array.from(els.stageRoot.querySelectorAll(".play-dots i"));
        dots.forEach((dot, index) => dot.classList.toggle("used", index < nextCount));

        els.stageRoot.querySelectorAll(".answer-choice").forEach((choice) => {
          choice.disabled = false;
        });

        if (nextCount >= MAX_LISTENING_PLAYS) {
          playBtn.setAttribute("data-final-play", "true");
        }
      } catch (error) {
        console.error("Listening audio failed:", error);
        playBtn.disabled = false;
        playBtn.classList.remove("playing");
        status.textContent = "Audio unavailable.";
      }
    });
  }

  function stopActiveAudio() {
    if (!activeAudio) return;

    try {
      activeAudio.pause();
      activeAudio.currentTime = 0;
    } catch {}

    activeAudio = null;
  }

  function chooseAnswer(optionId, button) {
    if (locked || button?.disabled) return;
    locked = true;

    const data = moduleData(currentModuleId);
    const item = data.items[currentQuestionIndex];
    const responseTimeMs = Math.max(0, Math.round(performance.now() - questionStartedAt));

    if (data.phase === "listening") stopActiveAudio();

    moduleAnswers.push({
      itemId: item.id,
      optionId,
      responseTimeMs,
      plays: data.phase === "listening" ? listeningPlayCount(item.id) : 0
    });

    button.classList.add("selected");
    els.stageRoot.querySelectorAll(".answer-choice").forEach((choice) => {
      choice.disabled = true;
    });

    saveLocalSession();

    window.setTimeout(() => {
      currentQuestionIndex += 1;
      if (currentQuestionIndex >= data.items.length) finishModule();
      else {
        saveLocalSession();
        renderQuestion();
      }
    }, 240);
  }

  async function finishModule() {
    stopActiveAudio();

    const submittedModuleId = currentModuleId;
    const answers = [...moduleAnswers];

    els.stageRoot.innerHTML = `
      <div class="module-finish">
        <div class="module-finish-mark">✓</div>
        <p>Adapting</p>
        <div class="mini-loader" aria-hidden="true"><span></span></div>
      </div>
    `;

    try {
      const result = await apiPost("placementStep", {
        sessionId: session.sessionId,
        clientSessionId: session.clientSessionId,
        placementVersion: PLACEMENT_VERSION,
        moduleId: submittedModuleId,
        answers
      });

      session.phase = result.nextPhase || session.phase;
      session.provisionalLevel = result.provisionalLevel || session.provisionalLevel || "";
      session.moduleId = result.nextModuleId || "";
      currentModuleId = result.nextModuleId || "";
      currentQuestionIndex = 0;
      moduleAnswers = [];
      saveLocalSession();

      if (result.nextPhase === "language" && moduleData(result.nextModuleId)) {
        showTransition("01", "Adapting", () => startModule(result.nextModuleId));
        return;
      }

      if (result.nextPhase === "reading" && moduleData(result.nextModuleId)) {
        showTransition("02", "Reading", () => startModule(result.nextModuleId));
        return;
      }

      if (result.nextPhase === "listening" && moduleData(result.nextModuleId)) {
        showTransition("03", "Listening", () => startModule(result.nextModuleId));
        return;
      }

      if (result.nextPhase === "speaking") {
        showTransition("04", "Speaking", renderSpeakingHandoff);
        return;
      }

      throw new Error("Unexpected placement route.");
    } catch (error) {
      console.error(error);
      renderModuleRetry(submittedModuleId, answers);
    }
  }

  function renderModuleRetry(moduleId, answers) {
    els.stageRoot.innerHTML = `
      <div class="retry-card">
        <strong>Connection lost.</strong>
        <button class="secondary-action" type="button">Retry</button>
      </div>
    `;

    els.stageRoot.querySelector("button")?.addEventListener("click", () => {
      currentModuleId = moduleId;
      moduleAnswers = answers;
      finishModule();
    });
  }

  function renderSpeakingHandoff() {
    stopActiveAudio();
    openShell();
    setShellStage(4);
    els.stageCard.classList.remove("question-mode", "reading-mode", "listening-mode");
    els.stageIndex.textContent = "04";
    els.stageEyebrow.textContent = "Speaking";
    els.stageTitle.textContent = "Speak.";
    els.stageNote.textContent = "";
    els.introScan.classList.add("hidden");
    els.stageRoot.innerHTML = `
      <div class="speaking-handoff">
        <span class="mic-mark" aria-hidden="true"></span>
        <strong>Speaking</strong>
      </div>
    `;
  }

  function enterCalibration(name) {
    els.candidateName.textContent = name;
    showTransition("01", "Calibration", () => startModule("calibration-01"), 1050);
  }

  function escapeHtml(value) {
    return String(value ?? "").replace(/[&<>"']/g, (char) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;"
    }[char]));
  }

  function escapeAttr(value) {
    return escapeHtml(value);
  }

  document.addEventListener("keydown", (event) => {
    if (locked || els.placementShell.classList.contains("hidden")) return;

    const number = Number(event.key);
    if (!Number.isInteger(number) || number < 1 || number > 4) return;

    const buttons = els.stageRoot.querySelectorAll(".answer-choice");
    buttons[number - 1]?.click();
  });

  els.studentForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const name = els.studentName.value.trim().replace(/\s+/g, " ");
    els.formError.textContent = "";

    if (name.length < 2) {
      els.studentName.focus();
      els.formError.textContent = "Enter your full name.";
      return;
    }

    els.startBtn.disabled = true;
    const clientSessionId = makeClientSessionId();

    try {
      const result = await startRemoteSession(name, clientSessionId);

      session = {
        clientSessionId,
        sessionId: result.sessionId,
        placementVersion: result.placementVersion || PLACEMENT_VERSION,
        studentName: name,
        phase: "calibration",
        moduleId: result.moduleId || "calibration-01",
        provisionalLevel: "",
        startedAt: new Date().toISOString()
      };

      currentModuleId = "calibration-01";
      currentQuestionIndex = 0;
      moduleAnswers = [];
      listeningPlays = {};
      saveLocalSession();
      enterCalibration(name);
    } catch (error) {
      console.error(error);
      els.formError.textContent = "Couldn't start. Try again.";
      els.startBtn.disabled = false;
    }
  });

  const savedSession = loadLocalSession();
  if (savedSession) resumeSavedSession(savedSession);
})();
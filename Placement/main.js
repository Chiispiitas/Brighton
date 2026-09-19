"use strict";

(() => {
  const PLACEMENT_VERSION = "2026-09-19.3";
  const STORAGE_KEY = "brighton-placement-session-v1";
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
  let questionStartedAt = 0;
  let locked = false;

  function makeClientSessionId() {
    if (window.crypto?.randomUUID) return window.crypto.randomUUID();
    return `placement-${Date.now()}-${Math.random().toString(36).slice(2)}-${Math.random().toString(36).slice(2)}`;
  }

  function saveLocalSession() {
    if (!session) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        ...session,
        currentModuleId,
        currentQuestionIndex,
        moduleAnswers
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
    const isCalibration = data.phase === "calibration";

    els.stageCard.classList.add("question-mode");
    els.stageCard.classList.toggle("reading-mode", isReading);
    els.introScan.classList.add("hidden");

    if (isReading) {
      setShellStage(2);
      els.stageIndex.textContent = "02";
      els.stageEyebrow.textContent = "Reading";
      els.stageTitle.textContent = "Read.";
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
      renderListeningHandoff();
      return;
    }

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

  function renderOptions(item, gridClass = "answer-grid") {
    return `
      <div class="${gridClass}">
        ${item.options.map((option, index) => `
          <button class="answer-choice" type="button" data-option-id="${escapeAttr(option.id)}">
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

  function renderQuestion() {
    const data = moduleData(currentModuleId);
    const item = data?.items?.[currentQuestionIndex];

    if (!item) {
      finishModule();
      return;
    }

    locked = false;
    questionStartedAt = performance.now();

    els.stageRoot.innerHTML = data.phase === "reading"
      ? renderReadingQuestion(data, item)
      : renderStandardQuestion(data, item);

    els.stageRoot.querySelectorAll(".answer-choice").forEach((button) => {
      button.addEventListener("click", () => chooseAnswer(button.dataset.optionId, button));
    });
  }

  function chooseAnswer(optionId, button) {
    if (locked) return;
    locked = true;

    const data = moduleData(currentModuleId);
    const item = data.items[currentQuestionIndex];
    const responseTimeMs = Math.max(0, Math.round(performance.now() - questionStartedAt));

    moduleAnswers.push({
      itemId: item.id,
      optionId,
      responseTimeMs
    });

    button.classList.add("selected");
    els.stageRoot.querySelectorAll(".answer-choice").forEach((choice) => {
      choice.disabled = true;
    });

    saveLocalSession();

    window.setTimeout(() => {
      currentQuestionIndex += 1;
      if (currentQuestionIndex >= data.items.length) finishModule();
      else renderQuestion();
    }, 240);
  }

  async function finishModule() {
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

      if (result.nextPhase === "listening") {
        showTransition("03", "Listening", renderListeningHandoff);
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

  function renderListeningHandoff() {
    openShell();
    setShellStage(3);
    els.stageCard.classList.remove("question-mode", "reading-mode");
    els.stageIndex.textContent = "03";
    els.stageEyebrow.textContent = "Listening";
    els.stageTitle.textContent = "Listen.";
    els.stageNote.textContent = "";
    els.introScan.classList.add("hidden");
    els.stageRoot.innerHTML = `
      <div class="listening-handoff">
        <span class="listening-ring"><i></i></span>
        <strong>Listening</strong>
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

      saveLocalSession();
      enterCalibration(name);
    } catch (error) {
      console.error(error);
      els.formError.textContent = "Couldn't start. Try again.";
      els.startBtn.disabled = false;
    }
  });
})();
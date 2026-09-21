"use strict";

(() => {
  const PLACEMENT_VERSION = "2026-09-20.1";
  const STORAGE_KEY = "brighton-placement-session-v1";
  const RESTART_NAME_KEY = "brighton-placement-restart-name";
  const RESTART_PHONE_KEY = "brighton-placement-restart-phone";
  const ECUADOR_ISO2 = "ec";
  const INACTIVITY_LIMIT_MS = 60 * 60 * 1000;
  const ACTIVITY_SYNC_INTERVAL_MS = 5 * 60 * 1000;
  const MAX_LISTENING_PLAYS = 3;
  // Wix Velo HTTP functions reject request bodies above 512 KB. Speaking audio
  // is sent inline as Base64, so keep a deliberate safety margin below that cap.
  const WIX_HTTP_BODY_SAFE_BYTES = 480 * 1024;
  const SPEAKING_AUDIO_BITS_PER_SECOND = 24000;
  const SPEAKING_MAX_BASE64_CHARS = 400000;
  const modules = window.BRIGHTON_PLACEMENT_MODULES || {};

  const els = {
    startScreen: document.querySelector("#startScreen"),
    transitionScreen: document.querySelector("#transitionScreen"),
    placementShell: document.querySelector("#placementShell"),
    studentForm: document.querySelector("#studentForm"),
    studentName: document.querySelector("#studentName"),
    phoneNumber: document.querySelector("#phoneNumber"),
    startBtn: document.querySelector("#startBtn"),
    restartTestBtn: document.querySelector("#restartTestBtn"),
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
  const phoneInput = initialisePhoneInput();

  let session = null;
  let currentModuleId = null;
  let currentQuestionIndex = 0;
  let moduleAnswers = [];
  let listeningPlays = {};
  let questionStartedAt = 0;
  let locked = false;
  let activeAudio = null;

  let speakingStream = null;
  let speakingRecorder = null;
  let speakingChunks = [];
  let speakingRecognition = null;
  let speakingRecognitionDisabled = false;
  let speakingRecognitionError = "";
  let speakingRecognitionStarts = 0;
  let speakingRecognitionResults = 0;
  let speakingRecordingActive = false;
  let speakingCaptureMode = "recorder+recognition";
  let lastSpeakingAttemptMetrics = null;
  let speakingInterimTranscript = "";
  let speakingTranscriptParts = [];
  let speakingConfidenceSamples = [];
  let speakingSegmentCount = 0;
  let speakingAudioContext = null;
  let speakingAnalyser = null;
  let speakingMeterTimer = null;
  let speakingTimer = null;
  let speakingStartedAt = 0;
  let speakingAutoStoppedByTimeLimit = false;
  let speakingSpeechFrames = 0;
  let speakingTotalFrames = 0;
  let speakingNoiseFloor = 0.018;
  let speakingThreshold = 0.035;
  let lastActivityAt = 0;
  let lastActivitySyncAt = 0;
  let inactivityTimer = null;
  let expiringForInactivity = false;

  function initialisePhoneInput() {
    if (!els.phoneNumber || typeof window.intlTelInput !== "function") return null;

    try {
      return window.intlTelInput(els.phoneNumber, {
        initialCountry: ECUADOR_ISO2,
        countryOrder: [ECUADOR_ISO2],
        countrySearch: true,
        countrySelectorMode: "DROPDOWN",
        dropdownParent: document.body,
        separateDialCode: true,
        matchDropdownWidth: true,
        strictMode: false,
        placeholderNumberPolicy: "AGGRESSIVE",
        placeholderNumberType: "MOBILE",
        customPlaceholder: (exampleNumber) => exampleNumber
          ? exampleNumber.replace(/\d/g, "0")
          : "Phone number"
      });
    } catch (error) {
      console.warn("Could not initialise international phone input.", error);
      return null;
    }
  }

  function ecuadorPhoneFromDigits(value) {
    const digits = String(value || "").replace(/\D/g, "");
    if (/^09\d{8}$/.test(digits)) return `+593${digits.slice(1)}`;
    if (/^9\d{8}$/.test(digits)) return `+593${digits}`;
    return "";
  }

  function normalisePhoneForSubmit() {
    const rawValue = String(els.phoneNumber?.value || "").trim();

    if (!phoneInput) {
      return ecuadorPhoneFromDigits(rawValue);
    }

    const selectedCountry = phoneInput.getSelectedCountryData?.() || {};
    if (String(selectedCountry.iso2 || "").toLowerCase() === ECUADOR_ISO2) {
      const ecuadorNumber = ecuadorPhoneFromDigits(rawValue);
      if (!ecuadorNumber) return "";

      try {
        phoneInput.setNumber(ecuadorNumber);
      } catch {}
      return ecuadorNumber;
    }

    try {
      if (phoneInput.isValidNumber() !== true) return "";
      const normalized = String(phoneInput.getNumber() || "").trim();
      return /^\+[1-9]\d{7,14}$/.test(normalized) ? normalized : "";
    } catch (error) {
      console.warn("Could not validate phone number.", error);
      return "";
    }
  }

  function phoneValidationMessage() {
    const selectedCountry = phoneInput?.getSelectedCountryData?.() || {};
    if (String(selectedCountry.iso2 || "").toLowerCase() === ECUADOR_ISO2) {
      return "Enter a valid Ecuadorian phone number: 09XXXXXXXX or 9XXXXXXXX.";
    }

    const countryName = String(selectedCountry.name || "").trim();
    return countryName
      ? `Enter a valid phone number for ${countryName}.`
      : "Enter a valid phone number.";
  }

  function restorePhoneInput(value) {
    const phone = String(value || "").trim();
    if (!phone) return;

    if (phoneInput) {
      try {
        phoneInput.setNumber(phone);
        return;
      } catch {}
    }

    els.phoneNumber.value = phone;
  }

  function makeClientSessionId() {
    if (window.crypto?.randomUUID) return window.crypto.randomUUID();
    return `placement-${Date.now()}-${Math.random().toString(36).slice(2)}-${Math.random().toString(36).slice(2)}`;
  }

  function localActivityTimestamp(saved) {
    const explicit = Number(saved?.lastActivityAt);
    if (Number.isFinite(explicit) && explicit > 0) return explicit;

    const fallback = Date.parse(saved?.updatedAt || saved?.startedAt || "");
    return Number.isFinite(fallback) ? fallback : 0;
  }

  function clearLocalPlacementProgress() {
    window.clearTimeout(inactivityTimer);
    inactivityTimer = null;

    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      console.warn("Could not clear saved placement session.", error);
    }
  }

  function loadLocalSession() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;

      const saved = JSON.parse(raw);
      if (!saved?.sessionId || !saved?.clientSessionId || saved.placementVersion !== PLACEMENT_VERSION) {
        localStorage.removeItem(STORAGE_KEY);
        return null;
      }

      const isActive = saved.status !== "completed" && saved.phase !== "result";
      const savedActivityAt = localActivityTimestamp(saved);

      if (isActive && savedActivityAt && Date.now() - savedActivityAt >= INACTIVITY_LIMIT_MS) {
        const expired = {
          sessionId: saved.sessionId,
          clientSessionId: saved.clientSessionId,
          placementVersion: saved.placementVersion
        };

        localStorage.removeItem(STORAGE_KEY);
        window.setTimeout(() => {
          expireRemoteSession(expired).catch(() => {});
        }, 0);
        return null;
      }

      lastActivityAt = savedActivityAt || Date.now();
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
        lastActivityAt: lastActivityAt || Date.now(),
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

    // text/plain is deliberately used so GitHub Pages/file previews do not
    // require a browser OPTIONS preflight before the Wix HTTP function.
    const serializedBody = JSON.stringify(body);
    const requestBytes = new Blob([serializedBody]).size;

    if (requestBytes > WIX_HTTP_BODY_SAFE_BYTES) {
      const error = new Error("Placement request is too large for the Wix HTTP endpoint.");
      error.code = "WIX_BODY_TOO_LARGE";
      throw error;
    }

    const response = await fetch(`${apiBase}/${path}`, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=UTF-8" },
      body: serializedBody
    });

    const responseText = await response.text();
    let payload = {};
    try { payload = responseText ? JSON.parse(responseText) : {}; } catch {}

    if (!response.ok || !payload?.success) {
      throw new Error(payload?.error || `Placement service returned ${response.status}.`);
    }

    return payload;
  }

  function blobToBase64(blob) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.addEventListener("load", () => {
        const result = String(reader.result || "");
        const comma = result.indexOf(",");
        resolve(comma >= 0 ? result.slice(comma + 1) : result);
      }, { once: true });

      reader.addEventListener("error", () => {
        reject(reader.error || new Error("Could not prepare the audio recording."));
      }, { once: true });

      reader.readAsDataURL(blob);
    });
  }

  async function startRemoteSession(name, phoneNumber, clientSessionId) {
    return apiPost("brightonPlacementStart", {
      clientSessionId,
      studentName: name,
      phoneNumber,
      placementVersion: PLACEMENT_VERSION
    });
  }

  async function resumeRemoteSession(saved) {
    return apiPost("brightonPlacementResume", {
      sessionId: saved.sessionId,
      clientSessionId: saved.clientSessionId,
      placementVersion: PLACEMENT_VERSION
    });
  }

  async function fetchPlacementResult() {
    return apiPost("brightonPlacementResult", {
      sessionId: session.sessionId,
      clientSessionId: session.clientSessionId,
      placementVersion: PLACEMENT_VERSION
    });
  }

  async function touchRemoteActivity() {
    if (!session || session.status === "completed" || session.phase === "result") return;

    try {
      const result = await apiPost("brightonPlacementActivity", {
        sessionId: session.sessionId,
        clientSessionId: session.clientSessionId,
        placementVersion: PLACEMENT_VERSION
      });

      if (result.expired) {
        clearLocalPlacementProgress();
        cleanupSpeakingMedia();
        session = null;
        window.location.reload();
      }
    } catch (error) {
      console.warn("Could not sync placement activity.", error);
    }
  }

  async function expireRemoteSession(savedSession = session) {
    if (!savedSession?.sessionId || !savedSession?.clientSessionId) return;

    await apiPost("brightonPlacementExpire", {
      sessionId: savedSession.sessionId,
      clientSessionId: savedSession.clientSessionId,
      placementVersion: savedSession.placementVersion || PLACEMENT_VERSION
    });
  }

  function scheduleInactivityExpiry() {
    window.clearTimeout(inactivityTimer);
    inactivityTimer = null;

    if (!session || session.status === "completed" || session.phase === "result") return;

    const remaining = Math.max(0, INACTIVITY_LIMIT_MS - (Date.now() - lastActivityAt));

    inactivityTimer = window.setTimeout(() => {
      expirePlacementForInactivity();
    }, remaining + 50);
  }

  function markPlacementActivity({ syncServer = true } = {}) {
    if (!session || session.status === "completed" || session.phase === "result") return;

    lastActivityAt = Date.now();
    session.lastActivityAt = lastActivityAt;
    saveLocalSession();
    scheduleInactivityExpiry();

    if (syncServer && lastActivityAt - lastActivitySyncAt >= ACTIVITY_SYNC_INTERVAL_MS) {
      lastActivitySyncAt = lastActivityAt;
      touchRemoteActivity();
    }
  }

  async function expirePlacementForInactivity() {
    if (expiringForInactivity || !session || session.status === "completed" || session.phase === "result") return;
    if (Date.now() - lastActivityAt < INACTIVITY_LIMIT_MS) {
      scheduleInactivityExpiry();
      return;
    }

    expiringForInactivity = true;
    const expiredSession = {
      sessionId: session.sessionId,
      clientSessionId: session.clientSessionId,
      placementVersion: session.placementVersion || PLACEMENT_VERSION
    };

    stopActiveAudio();
    cleanupSpeakingMedia();
    clearLocalPlacementProgress();
    session = null;

    try {
      await Promise.race([
        expireRemoteSession(expiredSession),
        new Promise((resolve) => window.setTimeout(resolve, 1500))
      ]);
    } catch {}

    window.location.reload();
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
      els.stageTitle.textContent = "Reading";
      els.stageNote.textContent = "";
      return;
    }

    if (isListening) {
      setShellStage(3);
      els.stageIndex.textContent = "03";
      els.stageEyebrow.textContent = "Listening";
      els.stageTitle.textContent = "Listening";
      els.stageNote.textContent = "";
      return;
    }

    setShellStage(1);
    els.stageIndex.textContent = "01";
    els.stageEyebrow.textContent = isCalibration ? "Calibration" : "Language";
    els.stageTitle.textContent = "Grammar";
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

  async function resumeSavedSession(saved) {
    let remote = null;

    try {
      remote = await resumeRemoteSession(saved);
    } catch (error) {
      const message = String(error?.message || "");
      console.warn("Could not verify saved placement session.", error);

      if (/placement session not found|completed placement not found/i.test(message)) {
        clearLocalPlacementProgress();
        return;
      }
    }

    if (remote?.expired) {
      clearLocalPlacementProgress();
      return;
    }

    session = {
      clientSessionId: saved.clientSessionId,
      sessionId: saved.sessionId,
      placementVersion: remote?.placementVersion || saved.placementVersion,
      studentName: remote?.studentName || saved.studentName || "",
      phoneNumber: remote?.phoneNumber || saved.phoneNumber || "",
      status: remote?.status || saved.status || "active",
      phase: remote?.phase || saved.phase || "calibration",
      moduleId: remote?.moduleId || saved.moduleId || saved.currentModuleId || "calibration-01",
      provisionalLevel: remote?.provisionalLevel || saved.provisionalLevel || "",
      finalLevel: remote?.finalLevel || saved.finalLevel || "",
      completedAt: remote?.completedAt || saved.completedAt || "",
      startedAt: saved.startedAt || "",
      resultSummary: remote?.result || saved.resultSummary || null
    };

    const serverModuleId = session.moduleId;
    const sameModule = saved.currentModuleId === serverModuleId;

    currentModuleId = serverModuleId;
    currentQuestionIndex = sameModule ? Math.max(0, Number(saved.currentQuestionIndex) || 0) : 0;
    moduleAnswers = sameModule && Array.isArray(saved.moduleAnswers) ? saved.moduleAnswers : [];
    listeningPlays = saved.listeningPlays && typeof saved.listeningPlays === "object"
      ? saved.listeningPlays
      : {};

    els.candidateName.textContent = session.studentName;

    if (session.status !== "completed" && session.phase !== "result") {
      lastActivityAt = Date.now();
      session.lastActivityAt = lastActivityAt;
      lastActivitySyncAt = lastActivityAt;
      saveLocalSession();
      scheduleInactivityExpiry();
    } else {
      saveLocalSession();
    }

    if (session.status === "completed" || session.phase === "result") {
      let result = session.resultSummary;

      if (!result) {
        try {
          const response = await fetchPlacementResult();
          result = response.result;
          session.resultSummary = result;
          saveLocalSession();
        } catch (error) {
          console.warn("Could not reload placement result details.", error);
        }
      }

      renderPlacementResult(result || {
        studentName: session.studentName,
        phoneNumber: session.phoneNumber || "",
        finalLevel: session.finalLevel || session.provisionalLevel,
        completedAt: session.completedAt
      });
      return;
    }

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
      const result = await apiPost("brightonPlacementStep", {
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
        // The stage card already shows the "Adapting" loader while the next
        // language route is calculated. Do not add a second full-screen
        // transition here.
        startModule(result.nextModuleId);
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

  function speakingModule() {
    return moduleData(currentModuleId) || moduleData(session?.moduleId);
  }

  function isMobileSpeechDevice() {
    const ua = String(navigator.userAgent || "");
    const mobileUa = /Android|iPhone|iPad|iPod|Mobile|SamsungBrowser/i.test(ua);
    const touchTablet = Number(navigator.maxTouchPoints || 0) > 1 && Math.min(window.innerWidth || 9999, screen?.width || 9999) <= 1100;
    return mobileUa || touchTablet;
  }

  function speechRecognitionConstructor() {
    return window.SpeechRecognition || window.webkitSpeechRecognition || null;
  }

  function isOperaBrowser() {
    const ua = String(navigator.userAgent || "");
    return /\bOPR\//i.test(ua) || /Opera/i.test(ua);
  }

  function speakingBrowserFamily() {
    const ua = String(navigator.userAgent || "");
    if (/\bOPR\//i.test(ua) || /Opera/i.test(ua)) return "Opera";
    if (/Edg\//i.test(ua)) return "Edge";
    if (/CriOS\//i.test(ua) || /Chrome\//i.test(ua)) return "Chrome";
    if (/FxiOS\//i.test(ua) || /Firefox\//i.test(ua)) return "Firefox";
    if (/Safari\//i.test(ua)) return "Safari";
    return "Other";
  }

  function speakingPlatformFamily() {
    const ua = String(navigator.userAgent || "");
    const platform = String(navigator.platform || "");
    if (/iPhone|iPad|iPod/i.test(ua)) return "iOS";
    if (/Android/i.test(ua)) return "Android";
    if (/Mac/i.test(platform) || /Macintosh/i.test(ua)) return "macOS";
    if (/Win/i.test(platform) || /Windows/i.test(ua)) return "Windows";
    if (/Linux/i.test(platform) || /Linux/i.test(ua)) return "Linux";
    return "Other";
  }

  function releaseSpeakingCaptureStream() {
    if (speakingStream) {
      speakingStream.getTracks().forEach((track) => {
        try { track.stop(); } catch {}
      });
      speakingStream = null;
    }

    if (speakingAudioContext) {
      try { speakingAudioContext.close(); } catch {}
      speakingAudioContext = null;
      speakingAnalyser = null;
    }
  }

  const SPEAKING_COPY_STOPWORDS = new Set([
    "a", "an", "the", "and", "or", "but", "to", "of", "in", "on", "at", "for", "with",
    "is", "am", "are", "was", "were", "be", "been", "being", "i", "you", "he", "she",
    "it", "we", "they", "my", "your", "his", "her", "our", "their", "this", "that",
    "these", "those", "do", "does", "did", "what", "where", "when", "why", "how",
    "there", "here", "one", "thing", "say", "tell", "talk", "describe", "explain", "give"
  ]);

  const SPEAKING_ORIGINAL_WORD_TARGET = {
    "speaking-prea1": 2,
    "speaking-a1": 4,
    "speaking-a2": 6,
    "speaking-b1": 8,
    "speaking-b1plus": 10,
    "speaking-b2": 12,
    "speaking-c1": 14
  };

  function speakingTokens(text) {
    return String(text || "")
      .toLowerCase()
      .match(/[a-z]+(?:'[a-z]+)?/g) || [];
  }

  function ngramCopyRatio(answerTokens, promptTokens, size) {
    if (answerTokens.length < size || promptTokens.length < size) return 0;

    const promptNgrams = new Set();
    for (let i = 0; i <= promptTokens.length - size; i += 1) {
      promptNgrams.add(promptTokens.slice(i, i + size).join(" "));
    }

    let copied = 0;
    const total = answerTokens.length - size + 1;

    for (let i = 0; i <= answerTokens.length - size; i += 1) {
      if (promptNgrams.has(answerTokens.slice(i, i + size).join(" "))) copied += 1;
    }

    return total ? copied / total : 0;
  }

  function analysePromptRepeating(transcript, prompt, moduleId = currentModuleId) {
    const answerTokens = speakingTokens(transcript);
    const promptTokens = speakingTokens(prompt);

    if (answerTokens.length < 5 || !promptTokens.length) {
      return {
        shouldRetry: false,
        promptCopyRatio: 0,
        bigramCopyRatio: 0,
        originalMeaningfulWords: 0
      };
    }

    const availablePromptWords = new Map();
    promptTokens.forEach((word) => {
      availablePromptWords.set(word, (availablePromptWords.get(word) || 0) + 1);
    });

    let copiedWords = 0;
    for (const word of answerTokens) {
      const left = availablePromptWords.get(word) || 0;
      if (left > 0) {
        copiedWords += 1;
        availablePromptWords.set(word, left - 1);
      }
    }

    const promptWordSet = new Set(promptTokens);
    const originalWords = new Set(
      answerTokens.filter((word) =>
        !promptWordSet.has(word) &&
        !SPEAKING_COPY_STOPWORDS.has(word) &&
        word.length > 2
      )
    );

    const promptCopyRatio = copiedWords / answerTokens.length;
    const bigramCopyRatio = ngramCopyRatio(answerTokens, promptTokens, 2);
    const originalTarget = SPEAKING_ORIGINAL_WORD_TARGET[moduleId] || 6;

    const shouldRetry =
      promptCopyRatio >= .82 ||
      (
        promptCopyRatio >= .65 &&
        bigramCopyRatio >= .42 &&
        originalWords.size < originalTarget
      );

    return {
      shouldRetry,
      promptCopyRatio,
      bigramCopyRatio,
      originalMeaningfulWords: originalWords.size
    };
  }

  function renderSpeakingAnswerRetry() {
    cleanupSpeakingMedia();

    els.stageRoot.innerHTML = `
      <div class="speaking-retry">
        <strong>Give your answer.</strong>
        <p class="speaking-status">Answer the question. Do not read or repeat the question. Say your ideas. Give your answer again.</p>
        <div class="speaking-error-actions">
          <button id="retrySpeakingAnswerBtn" class="secondary-action" type="button">Try again</button>
        </div>
      </div>
    `;

    els.stageRoot.querySelector("#retrySpeakingAnswerBtn")?.addEventListener("click", renderSpeakingPrompt);
  }

  function mobileTranscriptSpeechRatio(transcript, durationSeconds) {
    const words = String(transcript || "").trim().split(/\s+/).filter(Boolean).length;
    if (!words || durationSeconds <= 0) return 0;
    const estimatedSpeechSeconds = words / 2.2;
    return Math.max(.35, Math.min(.88, estimatedSpeechSeconds / durationSeconds));
  }

  function hasLiveAudioTrack(stream) {
    return Boolean(
      stream?.active &&
      stream.getAudioTracks?.().some((track) => track.readyState === "live")
    );
  }

  async function ensureSpeakingMic() {
    if (hasLiveAudioTrack(speakingStream)) return speakingStream;

    if (!navigator.mediaDevices?.getUserMedia) {
      throw new Error("Microphone capture is not supported in this browser.");
    }

    // Dispose of stale/ended tracks before asking Android for the microphone
    // again. Some Chromium-based mobile browsers keep a dead MediaStream
    // object around after backgrounding or switching apps.
    if (speakingStream) {
      speakingStream.getTracks?.().forEach((track) => {
        try { track.stop(); } catch {}
      });
      speakingStream = null;
    }

    const enhancedConstraints = {
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true
      }
    };

    // Android/vendor Chromium browsers are more reliable when microphone
    // permission is requested with the simplest constraint first. Desktop
    // browsers can still use the enhanced constraints first.
    const attempts = speakingPlatformFamily() === "Android"
      ? [{ audio: true }, enhancedConstraints]
      : [enhancedConstraints, { audio: true }];

    let lastError = null;

    for (const constraints of attempts) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        if (hasLiveAudioTrack(stream)) {
          speakingStream = stream;
          return speakingStream;
        }

        stream?.getTracks?.().forEach((track) => {
          try { track.stop(); } catch {}
        });
        lastError = new Error("The browser returned no live microphone track.");
      } catch (error) {
        lastError = error;

        // A real permission/security denial will not be fixed by changing
        // optional audio constraints, so do not trigger a second prompt.
        if (["NotAllowedError", "SecurityError"].includes(String(error?.name || ""))) {
          break;
        }
      }
    }

    throw lastError || new Error("Microphone capture failed.");
  }

  async function setupSpeakingAnalyser() {
    const stream = await ensureSpeakingMic();
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;

    // Metering is enhancement-only. A Web Audio failure must never make a
    // working microphone look unavailable on Android.
    if (!AudioContextClass) return null;

    try {
      if (!speakingAudioContext || speakingAudioContext.state === "closed") {
        speakingAudioContext = new AudioContextClass();
        const source = speakingAudioContext.createMediaStreamSource(stream);
        speakingAnalyser = speakingAudioContext.createAnalyser();
        speakingAnalyser.fftSize = 1024;
        source.connect(speakingAnalyser);
      }

      if (speakingAudioContext.state === "suspended") {
        try {
          await speakingAudioContext.resume();
        } catch (error) {
          console.warn("Speaking meter could not resume; recording can continue.", error);
          return null;
        }
      }

      return speakingAnalyser;
    } catch (error) {
      console.warn("Speaking meter unavailable; recording can continue.", error);
      speakingAnalyser = null;

      if (speakingAudioContext) {
        try { await speakingAudioContext.close(); } catch {}
        speakingAudioContext = null;
      }

      return null;
    }
  }

  function rmsFromAnalyser(analyser) {
    if (!analyser) return 0;
    const data = new Uint8Array(analyser.fftSize);
    analyser.getByteTimeDomainData(data);

    let sum = 0;
    for (const sample of data) {
      const normalized = (sample - 128) / 128;
      sum += normalized * normalized;
    }

    return Math.sqrt(sum / data.length);
  }

  async function runMicCheck() {
    const button = els.stageRoot.querySelector("#micCheckBtn");
    const status = els.stageRoot.querySelector("#micCheckStatus");
    const meter = els.stageRoot.querySelector("#micCheckMeter");

    if (button) button.disabled = true;
    if (status) status.textContent = "Checking";

    try {
      const analyser = await setupSpeakingAnalyser();
      const samples = [];

      if (analyser) {
        await new Promise((resolve) => {
          const started = performance.now();
          const timer = window.setInterval(() => {
            const rms = rmsFromAnalyser(analyser);
            samples.push(rms);
            if (meter) meter.style.setProperty("--mic-level", String(Math.min(1, rms * 10)));

            if (performance.now() - started >= 1200) {
              window.clearInterval(timer);
              resolve();
            }
          }, 80);
        });

        const sorted = samples.slice().sort((a, b) => a - b);
        speakingNoiseFloor = sorted[Math.floor(sorted.length * 0.45)] || 0.018;
        speakingThreshold = Math.max(0.024, speakingNoiseFloor * 1.9);
      } else {
        // MediaRecorder can work even when Web Audio analysis is unavailable.
        await new Promise((resolve) => window.setTimeout(resolve, 250));
      }

      if (status) status.textContent = "Microphone ready";
      window.setTimeout(renderSpeakingPrompt, 450);
    } catch (error) {
      console.error(error);
      renderSpeakingTechnicalError("Microphone unavailable.");
    }
  }

  function renderSpeakingHandoff() {
    stopActiveAudio();
    currentModuleId = session?.moduleId || currentModuleId;
    openShell();
    setShellStage(4);
    els.stageCard.classList.remove("question-mode", "reading-mode", "listening-mode");
    els.stageCard.classList.add("speaking-mode");
    els.stageIndex.textContent = "04";
    els.stageEyebrow.textContent = "Speaking";
    els.stageTitle.textContent = "Speaking";
    els.stageNote.textContent = "";
    els.introScan.classList.add("hidden");

    els.stageRoot.innerHTML = `
      <div class="speaking-check">
        <div class="mic-check-visual" id="micCheckMeter" aria-hidden="true">
          <span class="mic-mark"></span>
          <i></i>
        </div>
        <button id="micCheckBtn" class="primary-btn speaking-primary" type="button">
          <span>Check microphone</span><span aria-hidden="true">→</span>
        </button>
        <p id="micCheckStatus" class="speaking-status" aria-live="polite"></p>
      </div>
    `;

    els.stageRoot.querySelector("#micCheckBtn")?.addEventListener("click", runMicCheck);
  }

  function renderSpeakingPrompt() {
    const data = speakingModule();
    if (!data?.prompt) return;

    els.stageRoot.innerHTML = `
      <div class="speaking-prompt-screen">
        <div class="speaking-prompt-card">
          <span class="speaking-prompt-label">Your prompt</span>
          <h3>${escapeHtml(data.prompt)}</h3>
        </div>
        <div class="speaking-record-panel">
          <span class="speaking-target">≈ ${Number(data.targetSeconds) || 40}s</span>
          <button id="startSpeakingBtn" class="record-btn" type="button">
            <span class="record-dot" aria-hidden="true"></span>
            <span>Record answer</span>
          </button>
          <p class="speaking-status">Answer the question. Do not read or repeat it.</p>
        </div>
      </div>
    `;

    els.stageRoot.querySelector("#startSpeakingBtn")?.addEventListener("click", startSpeakingRecording);
  }

  function commitInterimTranscript() {
    const text = String(speakingInterimTranscript || "").trim();
    if (!text) return;
    speakingTranscriptParts.push(text);
    speakingSegmentCount += 1;
    speakingInterimTranscript = "";
  }

  function startSpeechRecognition() {
    const Recognition = speechRecognitionConstructor();
    if (!Recognition || speakingRecognitionDisabled || !speakingRecordingActive) return;

    try {
      const recognition = new Recognition();
      speakingRecognition = recognition;
      recognition.lang = "en-US";

      // Continuous recognition is reliable on desktop but is a common failure
      // point on Android/Samsung/iOS. Mobile uses short recognition sessions
      // that restart while the answer is active.
      try { recognition.continuous = !isMobileSpeechDevice(); } catch {}
      recognition.interimResults = true;
      recognition.maxAlternatives = 1;
      speakingRecognitionStarts += 1;

      recognition.onresult = (event) => {
        const interimParts = [];

        for (let i = event.resultIndex; i < event.results.length; i += 1) {
          const result = event.results[i];
          if (!result?.[0]) continue;

          const text = String(result[0].transcript || "").trim();
          if (!text) continue;

          if (result.isFinal) {
            speakingTranscriptParts.push(text);
            speakingSegmentCount += 1;
            speakingRecognitionResults += 1;

            const confidence = Number(result[0].confidence);
            if (Number.isFinite(confidence) && confidence > 0) {
              speakingConfidenceSamples.push(confidence);
            }
          } else {
            interimParts.push(text);
          }
        }

        speakingInterimTranscript = interimParts.join(" ").trim();
      };

      recognition.onerror = (event) => {
        const code = String(event?.error || "unknown");
        speakingRecognitionError = code;

        if (["not-allowed", "service-not-allowed", "audio-capture"].includes(code)) {
          speakingRecognitionDisabled = true;
          speakingInterimTranscript = "";
          recognition.onend = null;
        }
      };

      recognition.onend = () => {
        // Some mobile implementations end with only interim text.
        commitInterimTranscript();
        if (!speakingRecognitionDisabled && speakingRecordingActive) {
          window.setTimeout(startSpeechRecognition, isMobileSpeechDevice() ? 120 : 220);
        }
      };

      recognition.start();
    } catch {
      // Recognition is enhancement-only. MediaRecorder remains the fallback.
      speakingRecognitionDisabled = true;
    }
  }

  function stopSpeechRecognition() {
    commitInterimTranscript();
    if (!speakingRecognition) return;
    try { speakingRecognition.onend = null; speakingRecognition.stop(); } catch {}
    speakingRecognition = null;
  }

  function startSpeakingMeter() {
    window.clearInterval(speakingMeterTimer);

    speakingMeterTimer = window.setInterval(() => {
      const rms = rmsFromAnalyser(speakingAnalyser);
      speakingTotalFrames += 1;
      if (rms >= speakingThreshold) speakingSpeechFrames += 1;

      const meter = els.stageRoot.querySelector("#recordingMeter");
      if (meter) meter.style.setProperty("--mic-level", String(Math.min(1, rms * 9)));
    }, 90);
  }

  function createSpeakingMediaRecorder(stream) {
    if (!window.MediaRecorder) {
      throw new Error("Audio recording is not supported in this browser.");
    }

    const preferredTypes = [
      "audio/webm;codecs=opus",
      "audio/webm",
      "audio/ogg;codecs=opus",
      "audio/ogg",
      "audio/mp4;codecs=mp4a.40.2",
      "audio/mp4",
      "audio/aac"
    ];

    const supportedTypes = preferredTypes.filter((type) => {
      try {
        return typeof MediaRecorder.isTypeSupported !== "function" ||
          MediaRecorder.isTypeSupported(type);
      } catch {
        return false;
      }
    });

    const attempts = [
      ...supportedTypes.map((mimeType) => ({ mimeType, audioBitsPerSecond: SPEAKING_AUDIO_BITS_PER_SECOND })),
      ...supportedTypes.map((mimeType) => ({ mimeType })),
      { audioBitsPerSecond: SPEAKING_AUDIO_BITS_PER_SECOND },
      {}
    ];

    let lastError = null;

    for (const options of attempts) {
      try {
        return Object.keys(options).length
          ? new MediaRecorder(stream, options)
          : new MediaRecorder(stream);
      } catch (error) {
        lastError = error;
      }
    }

    throw lastError || new Error("Could not create an audio recorder.");
  }

  function startSpeakingMediaRecorder(recorder) {
    try {
      // A longer timeslice reduces WebM/MP4 container overhead while still
      // yielding data often enough for stable mobile recording.
      recorder.start(1000);
      return;
    } catch (error) {
      console.warn("Timed MediaRecorder start failed; retrying without timeslice.", error);
    }

    if (recorder.state === "inactive") {
      recorder.start();
      return;
    }

    throw new Error("Could not start audio recording.");
  }

  async function startSpeakingRecording() {
    const data = speakingModule();

    try {
      speakingChunks = [];
      lastSpeakingAttemptMetrics = null;
      speakingTranscriptParts = [];
      speakingInterimTranscript = "";
      speakingRecognitionDisabled = true;
      speakingRecognitionError = "";
      speakingRecognitionStarts = 0;
      speakingRecognitionResults = 0;
      speakingConfidenceSamples = [];
      speakingSegmentCount = 0;
      speakingSpeechFrames = 0;
      speakingTotalFrames = 0;
      speakingStartedAt = performance.now();
      speakingAutoStoppedByTimeLimit = false;
      speakingRecordingActive = true;
      speakingCaptureMode = "media-recorder";

      const stream = await ensureSpeakingMic();

      // Metering is best-effort; it must not block recording on Android.
      try {
        await setupSpeakingAnalyser();
      } catch (error) {
        console.warn("Speaking meter setup failed; continuing without it.", error);
      }

      speakingRecorder = createSpeakingMediaRecorder(stream);

      speakingRecorder.addEventListener("dataavailable", (event) => {
        if (event.data?.size) speakingChunks.push(event.data);
      });

      speakingRecorder.addEventListener("stop", finishSpeakingRecording, { once: true });
      startSpeakingMediaRecorder(speakingRecorder);
      startSpeakingMeter();
      renderSpeakingRecording(data);
    } catch (error) {
      speakingRecordingActive = false;
      console.error("Speaking recording start failed:", error);

      const name = String(error?.name || "");
      const message = /MediaRecorder|audio recorder|recording is not supported/i.test(String(error?.message || ""))
        ? "Audio recording is unavailable in this browser."
        : ["NotAllowedError", "SecurityError"].includes(name)
          ? "Microphone access was blocked by the browser."
          : "Microphone unavailable.";

      renderSpeakingTechnicalError(message);
    }
  }

  function renderSpeakingRecording(data) {
    const fallbackMaximum = Math.max(Number(data.targetSeconds) || 40, Number(data.minimumSeconds) || 20) + 15;
    const maximumSeconds = Math.max(
      Number(data.maximumSeconds) || fallbackMaximum,
      Number(data.minimumSeconds) || 15
    );

    els.stageRoot.innerHTML = `
      <div class="speaking-recording">
        <div id="recordingMeter" class="recording-meter" aria-hidden="true">
          <i></i><i></i><i></i><i></i><i></i><i></i><i></i>
        </div>
        <span class="recording-live"><i></i> Recording</span>
        <strong id="speakingTimer">00:00</strong>
        <p class="speaking-recording-prompt">${escapeHtml(data.prompt)}</p>
        <p id="speakingCutoffWarning" class="speaking-cutoff-warning" role="status" aria-live="polite"></p>
        <button id="stopSpeakingBtn" class="stop-record-btn" type="button" disabled>Finish answer</button>
      </div>
    `;

    const button = els.stageRoot.querySelector("#stopSpeakingBtn");
    const timer = els.stageRoot.querySelector("#speakingTimer");
    const warning = els.stageRoot.querySelector("#speakingCutoffWarning");
    const minimumSeconds = Number(data.minimumSeconds) || 15;

    window.clearInterval(speakingTimer);
    speakingTimer = window.setInterval(() => {
      const elapsed = Math.max(0, (performance.now() - speakingStartedAt) / 1000);
      const seconds = Math.floor(elapsed);
      const remainingSeconds = Math.max(0, Math.ceil(maximumSeconds - elapsed));

      if (timer) timer.textContent = `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;
      if (button && elapsed >= minimumSeconds) button.disabled = false;

      if (warning) {
        if (remainingSeconds <= 10 && remainingSeconds > 0) {
          warning.textContent = `Your response will be submitted automatically in ${remainingSeconds} second${remainingSeconds === 1 ? "" : "s"}.`;
          warning.classList.add("is-visible");
        } else {
          warning.textContent = "";
          warning.classList.remove("is-visible");
        }
      }

      if (elapsed >= maximumSeconds) {
        speakingAutoStoppedByTimeLimit = true;
        stopSpeakingRecording();
      }
    }, 200);

    button?.addEventListener("click", () => {
      speakingAutoStoppedByTimeLimit = false;
      stopSpeakingRecording();
    });
  }

  async function settleMobileSpeechRecognition() {
    const recognition = speakingRecognition;

    if (!recognition) {
      commitInterimTranscript();
      return;
    }

    await new Promise((resolve) => {
      let settled = false;
      const finish = () => {
        if (settled) return;
        settled = true;
        speakingRecognition = null;
        commitInterimTranscript();
        resolve();
      };

      recognition.onend = finish;

      try {
        recognition.stop();
      } catch {
        finish();
        return;
      }

      window.setTimeout(finish, 900);
    });
  }

  async function stopSpeakingRecording() {
    if (!speakingRecordingActive) return;

    speakingRecordingActive = false;
    window.clearInterval(speakingTimer);
    window.clearInterval(speakingMeterTimer);

    if (!speakingRecorder || speakingRecorder.state !== "recording") {
      renderSpeakingTechnicalError("We couldn't process your answer.");
      return;
    }

    speakingRecorder.stop();
  }

  async function finishSpeakingRecording() {
    const data = speakingModule();
    const durationSeconds = Math.max(0, (performance.now() - speakingStartedAt) / 1000);
    const speechRatio = speakingTotalFrames
      ? speakingSpeechFrames / speakingTotalFrames
      : 0;
    const speechSeconds = durationSeconds * speechRatio;
    const audioActivityAvailable = Boolean(speakingAnalyser && speakingTotalFrames > 0);
    const recorderMimeType = String(speakingRecorder?.mimeType || speakingChunks[0]?.type || "audio/webm");
    const audioBlob = new Blob(speakingChunks, { type: recorderMimeType });
    const recordedBytes = audioBlob.size;

    if (durationSeconds < 5 || recordedBytes < 1200) {
      renderSpeakingTechnicalError("We couldn't detect enough audio. Try again.");
      return;
    }

    els.stageRoot.innerHTML = `
      <div class="module-finish speaking-analysis">
        <div class="module-finish-mark">✓</div>
        <p>Checking answer</p>
        <div class="mini-loader" aria-hidden="true"><span></span></div>
      </div>
    `;

    try {
      const audioBase64 = await blobToBase64(audioBlob);

      if (!audioBase64 || audioBase64.length > SPEAKING_MAX_BASE64_CHARS) {
        renderSpeakingTechnicalError("The recording is too large to send. Try again.");
        return;
      }

      const speakingMetrics = {
        durationSeconds,
        speechSeconds,
        speechRatio,
        transcript: "",
        transcriptAvailable: false,
        recognitionConfidence: 0,
        segmentCount: 0,
        recordedBytes,
        audioBase64,
        audioMimeType: recorderMimeType,
        autoStoppedByTimeLimit: speakingAutoStoppedByTimeLimit,
        maximumSeconds: Number(data.maximumSeconds) || null,
        audioActivityAvailable,
        speechRecognitionAvailable: Boolean(speechRecognitionConstructor()),
        recorderMimeType,
        audioBitsPerSecond: Number(speakingRecorder?.audioBitsPerSecond) || SPEAKING_AUDIO_BITS_PER_SECOND,
        captureMode: speakingCaptureMode,
        recognitionError: "",
        recognitionStarts: 0,
        recognitionResults: 0,
        legacyCaptureEstimate: false,
        browserFamily: speakingBrowserFamily(),
        platformFamily: speakingPlatformFamily()
      };
      lastSpeakingAttemptMetrics = speakingMetrics;

      const result = await apiPost("brightonPlacementSubmitSpeaking", {
        sessionId: session.sessionId,
        clientSessionId: session.clientSessionId,
        placementVersion: PLACEMENT_VERSION,
        moduleId: currentModuleId,
        promptId: data.promptId,
        ...speakingMetrics
      });

      if (result.speakingRetryReason === "prompt-repeat") {
        renderSpeakingAnswerRetry();
        return;
      }

      if (result.speakingError) {
        const providerDiagnostic = {
          speakingErrorCode: result.speakingErrorCode || "technical",
          providerStatus: Number(result.providerStatus) || 0,
          providerCode: result.providerCode || "",
          providerTransport: result.providerTransport || ""
        };
        console.error("Brighton Speaking provider error", providerDiagnostic);
        const technicalReference = [
          providerDiagnostic.providerStatus || "",
          providerDiagnostic.providerCode || providerDiagnostic.speakingErrorCode || "",
          providerDiagnostic.providerTransport || ""
        ].filter(Boolean).join(" · ");
        renderSpeakingTechnicalError(
          "We couldn't process your answer. Try again.",
          technicalReference
        );
        return;
      }

      session.phase = "result";
      session.finalLevel = result.finalLevel;
      session.status = "completed";
      session.confidence = result.confidence;
      session.completedAt = result.result?.completedAt || new Date().toISOString();
      session.resultSummary = result.result || null;
      saveLocalSession();

      cleanupSpeakingMedia();
      renderPlacementResult(result.result || result);
    } catch (error) {
      console.error(error);

      if (error?.code === "WIX_BODY_TOO_LARGE") {
        renderSpeakingTechnicalError("The recording is too large to send. Try again.");
      } else if (lastSpeakingAttemptMetrics) {
        renderSpeakingSubmitRetry(lastSpeakingAttemptMetrics);
      } else {
        renderSpeakingTechnicalError("We couldn't prepare your answer. Try again.");
      }
    }
  }


  function renderSpeakingTechnicalError(message, technicalReference = "") {
    cleanupSpeakingMedia();

    els.stageRoot.innerHTML = `
      <div class="speaking-retry">
        <strong>${escapeHtml(message)}</strong>
        ${technicalReference
          ? `<small class="speaking-technical-reference">Technical code: ${escapeHtml(technicalReference)}</small>`
          : ""}
        <div class="speaking-error-actions">
          <button id="retrySpeakingBtn" class="secondary-action" type="button">Try again</button>
          <button id="skipSpeakingBtn" class="secondary-action speaking-skip-action" type="button">I cannot speak now</button>
        </div>
      </div>
    `;

    els.stageRoot.querySelector("#retrySpeakingBtn")?.addEventListener("click", renderSpeakingHandoff);
    els.stageRoot.querySelector("#skipSpeakingBtn")?.addEventListener("click", skipSpeakingAfterError);
  }

  async function skipSpeakingAfterError() {
    const button = els.stageRoot.querySelector("#skipSpeakingBtn");
    if (button) button.disabled = true;

    try {
      const result = await apiPost("brightonPlacementSkipSpeaking", {
        sessionId: session.sessionId,
        clientSessionId: session.clientSessionId,
        placementVersion: PLACEMENT_VERSION,
        moduleId: currentModuleId,
        diagnostics: lastSpeakingAttemptMetrics
          ? {
              durationSeconds: lastSpeakingAttemptMetrics.durationSeconds,
              recordedBytes: lastSpeakingAttemptMetrics.recordedBytes,
              audioMimeType: lastSpeakingAttemptMetrics.audioMimeType,
              captureMode: lastSpeakingAttemptMetrics.captureMode,
              browserFamily: lastSpeakingAttemptMetrics.browserFamily,
              platformFamily: lastSpeakingAttemptMetrics.platformFamily,
              audioActivityAvailable: lastSpeakingAttemptMetrics.audioActivityAvailable
            }
          : {
              browserFamily: speakingBrowserFamily(),
              platformFamily: speakingPlatformFamily(),
              speechRecognitionAvailable: Boolean(speechRecognitionConstructor()),
              recognitionError: speakingRecognitionError,
              captureMode: speakingCaptureMode
            }
      });

      session.phase = "result";
      session.finalLevel = result.finalLevel || session.provisionalLevel;
      session.status = "completed";
      session.completedAt = result.result?.completedAt || new Date().toISOString();
      session.resultSummary = result.result || null;
      saveLocalSession();

      cleanupSpeakingMedia();
      renderPlacementResult(result.result || { finalLevel: session.finalLevel });
    } catch (error) {
      console.error(error);
      if (button) button.disabled = false;
    }
  }

  function renderSpeakingSubmitRetry(metrics) {
    els.stageRoot.innerHTML = `
      <div class="retry-card">
        <strong>Connection lost.</strong>
        <button id="retrySpeakingSubmitBtn" class="secondary-action" type="button">Retry</button>
      </div>
    `;

    els.stageRoot.querySelector("#retrySpeakingSubmitBtn")?.addEventListener("click", async () => {
      const data = speakingModule();

      try {
        const result = await apiPost("brightonPlacementSubmitSpeaking", {
          sessionId: session.sessionId,
          clientSessionId: session.clientSessionId,
          placementVersion: PLACEMENT_VERSION,
          moduleId: currentModuleId,
          promptId: data.promptId,
          ...metrics
        });

        if (result.speakingRetryReason === "prompt-repeat") {
          renderSpeakingAnswerRetry();
          return;
        }

        if (result.speakingError) {
          renderSpeakingTechnicalError("We couldn't process your answer.");
          return;
        }

        session.phase = "result";
        session.finalLevel = result.finalLevel;
        session.status = "completed";
        session.confidence = result.confidence;
        session.completedAt = result.result?.completedAt || new Date().toISOString();
        session.resultSummary = result.result || null;
        saveLocalSession();

        cleanupSpeakingMedia();
        renderPlacementResult(result.result || result);
      } catch (error) {
        console.error(error);
      }
    });
  }

  function cleanupSpeakingRecorderOnly() {
    speakingRecordingActive = false;
    window.clearInterval(speakingTimer);
    window.clearInterval(speakingMeterTimer);
    stopSpeechRecognition();
    speakingRecorder = null;
  }

  function cleanupSpeakingMedia() {
    cleanupSpeakingRecorderOnly();

    if (speakingStream) {
      speakingStream.getTracks().forEach((track) => track.stop());
      speakingStream = null;
    }

    if (speakingAudioContext) {
      try { speakingAudioContext.close(); } catch {}
      speakingAudioContext = null;
      speakingAnalyser = null;
    }
  }

  function levelDescription(level) {
    return ({
      "PRE-A1": "Starter",
      "A1": "Beginner",
      "A2": "Elementary",
      "B1": "Intermediate",
      "B1+": "Intermediate Plus",
      "B2": "Upper Intermediate",
      "C1": "Advanced"
    })[level] || "";
  }

  function resultDate(value) {
    const date = value ? new Date(value) : new Date();
    if (Number.isNaN(date.getTime())) return "";
    return date.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric"
    });
  }

  function resultSkillCard(skill, key) {
    const safeSkill = skill || {};
    const skipped = Boolean(safeSkill.skipped);
    const hasNumericScore =
      safeSkill.score !== null &&
      safeSkill.score !== undefined &&
      safeSkill.score !== "" &&
      Number.isFinite(Number(safeSkill.score));
    const score = hasNumericScore
      ? Math.max(0, Math.min(100, Number(safeSkill.score)))
      : 0;
    const level = safeSkill.level || "—";
    const description = safeSkill.description || (safeSkill.level ? levelDescription(safeSkill.level) : "");

    return `
      <div class="certificate-skill ${skipped ? "skipped" : ""}">
        <div class="skill-ring" style="--skill-score:${skipped ? 0 : score}">
          <span>${escapeHtml(safeSkill.displayScore || "—")}</span>
        </div>
        <strong>${escapeHtml(safeSkill.label || key)}</strong>
        <span class="skill-level">${escapeHtml(skipped ? "Not scored" : level)}</span>
        <small>${escapeHtml(skipped ? "Speaking skipped" : description)}</small>
      </div>
    `;
  }

  function resultScale(level) {
    const bands = ["PRE-A1", "A1", "A2", "B1", "B1+", "B2", "C1"];
    return bands.map((band) => `
      <div class="certificate-band ${band === level ? "active" : ""}">
        <strong>${escapeHtml(band)}</strong>
        <span>${escapeHtml(levelDescription(band))}</span>
      </div>
    `).join("");
  }

  function resultFilename(result) {
    const name = String(result.studentName || "student")
      .trim()
      .replace(/[^a-z0-9]+/gi, "-")
      .replace(/^-|-$/g, "")
      .toLowerCase() || "student";
    return `brighton-placement-${name}.png`;
  }

  async function captureResultImage() {
    const certificate = document.querySelector("#resultCertificate");
    if (!certificate) throw new Error("Result is not available.");
    if (!window.html2canvas) throw new Error("Image export is unavailable.");

    if (document.fonts?.ready) {
      try { await document.fonts.ready; } catch {}
    }

    const canvas = await window.html2canvas(certificate, {
      backgroundColor: "#ffffff",
      scale: Math.min(2.5, Math.max(2, window.devicePixelRatio || 1)),
      useCORS: true,
      logging: false,
      windowWidth: certificate.scrollWidth,
      windowHeight: certificate.scrollHeight
    });

    return new Promise((resolve, reject) => {
      canvas.toBlob((blob) => {
        if (blob) resolve(blob);
        else reject(new Error("Could not create result image."));
      }, "image/png", .96);
    });
  }

  async function saveResultImage(result) {
    const button = document.querySelector("#saveResultBtn");
    if (button) button.disabled = true;

    try {
      const blob = await captureResultImage();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = resultFilename(result);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (error) {
      console.error(error);
    } finally {
      if (button) button.disabled = false;
    }
  }

  async function shareResultImage(result) {
    const button = document.querySelector("#shareResultBtn");
    if (button) button.disabled = true;

    try {
      const blob = await captureResultImage();
      const file = new File([blob], resultFilename(result), { type: "image/png" });

      if (navigator.share && navigator.canShare?.({ files: [file] })) {
        await navigator.share({
          title: "Brighton Placement Result",
          text: `${result.studentName || "Student"} · ${result.finalLevel || ""}`,
          files: [file]
        });
        return;
      }

      if (navigator.share) {
        await navigator.share({
          title: "Brighton Placement Result",
          text: `${result.studentName || "Student"} · ${result.finalLevel || ""}`,
          url: window.location.href
        });
        return;
      }

      await saveResultImage(result);
    } catch (error) {
      if (error?.name !== "AbortError") console.error(error);
    } finally {
      if (button) button.disabled = false;
    }
  }

  async function restartPlacementTest() {
    const inProgress = Boolean(session && session.status !== "completed" && session.phase !== "result");
    const message = inProgress
      ? "Restart this placement test from the beginning? Your current progress will be lost."
      : "Start a new placement test?";

    if (!window.confirm(message)) return;

    const name = String(session?.studentName || els.studentName.value || "").trim();
    const phoneNumber = String(session?.phoneNumber || els.phoneNumber?.value || "").trim();
    const activeSession = inProgress
      ? {
          sessionId: session.sessionId,
          clientSessionId: session.clientSessionId,
          placementVersion: session.placementVersion || PLACEMENT_VERSION
        }
      : null;

    stopActiveAudio();
    cleanupSpeakingMedia();
    clearLocalPlacementProgress();

    try {
      if (name) sessionStorage.setItem(RESTART_NAME_KEY, name);
      else sessionStorage.removeItem(RESTART_NAME_KEY);
      if (phoneNumber) sessionStorage.setItem(RESTART_PHONE_KEY, phoneNumber);
      else sessionStorage.removeItem(RESTART_PHONE_KEY);
    } catch {}

    if (activeSession) {
      try {
        await Promise.race([
          expireRemoteSession(activeSession),
          new Promise((resolve) => window.setTimeout(resolve, 1200))
        ]);
      } catch {}
    }

    window.location.reload();
  }

  function renderPlacementResult(payload) {
    const result = payload?.result || payload || {};
    const finalLevel = result.finalLevel || session?.finalLevel || session?.provisionalLevel || "—";
    const finalDescription = result.finalDescription || levelDescription(finalLevel);
    const studentName = result.studentName || session?.studentName || "";
    const phoneNumber = result.phoneNumber || session?.phoneNumber || "";
    const completedAt = result.completedAt || session?.completedAt || new Date().toISOString();
    const resultId = result.resultId || `BR-${String(session?.sessionId || "").slice(-8).toUpperCase()}`;
    const skills = result.skills || {};

    session.resultSummary = {
      ...result,
      studentName,
      phoneNumber,
      finalLevel,
      finalDescription,
      completedAt,
      resultId
    };
    session.finalLevel = finalLevel;
    session.phase = "result";
    session.status = "completed";
    session.completedAt = completedAt;
    window.clearTimeout(inactivityTimer);
    inactivityTimer = null;
    saveLocalSession();

    openShell();
    els.placementShell.classList.add("result-shell");
    setShellStage(4);
    els.stageCard.classList.remove("question-mode", "reading-mode", "listening-mode", "speaking-mode");
    els.stageCard.classList.add("result-mode");
    els.stageIndex.textContent = "✓";
    els.stageEyebrow.textContent = "Placement complete";
    els.stageTitle.textContent = "";
    els.stageNote.textContent = "";
    els.introScan.classList.add("hidden");

    els.stageRoot.innerHTML = `
      <div class="result-page">
        <article id="resultCertificate" class="result-certificate">
          <header class="certificate-header">
            <img src="../Exams/assets/brighton-logo.png" alt="Brighton English School" />
            <div>
              <span>Adaptive Placement Test</span>
              <strong>English placement result</strong>
            </div>
          </header>

          <section class="certificate-hero">
            <p class="certificate-kicker">This result belongs to</p>
            <h3>${escapeHtml(studentName)}</h3>
            <p class="certificate-copy">and reflects the level reached in the Brighton adaptive placement assessment.</p>

            <div class="level-art" aria-hidden="true">
              <i></i><i></i><i></i><i></i>
              <div class="level-art-core">
                <span>English level</span>
                <strong>${escapeHtml(finalLevel)}</strong>
                <small>${escapeHtml(finalDescription)}</small>
              </div>
            </div>
          </section>

          <section class="certificate-results">
            <h4>Understanding the result</h4>
            <div class="certificate-scale">
              ${resultScale(finalLevel)}
            </div>

            <p class="certificate-explainer">
              ${finalLevel === "B1+"
                ? "B1+ is Brighton English School's internal bridge band between CEFR B1 and B2."
                : "The overall band is produced by Brighton's adaptive Language Use, Reading and Listening route, with Speaking included when it can be processed."}
            </p>

            <div class="certificate-skills">
              ${resultSkillCard(skills.language, "Language Use")}
              ${resultSkillCard(skills.reading, "Reading")}
              ${resultSkillCard(skills.listening, "Listening")}
              ${resultSkillCard(skills.speaking, "Speaking")}
            </div>
          </section>

          <footer class="certificate-footer">
            <div><span>Result ID</span><strong>${escapeHtml(resultId)}</strong></div>
            <div><span>Completed</span><strong>${escapeHtml(resultDate(completedAt))}</strong></div>
            <p>Placement result · not a CEFR certification</p>
          </footer>
        </article>

        <div class="result-actions" data-html2canvas-ignore="true">
          <button id="saveResultBtn" class="result-action primary-result-action" type="button">
            <span>Save image</span><span aria-hidden="true">↓</span>
          </button>
          <button id="shareResultBtn" class="result-action" type="button">
            <span>Share</span><span aria-hidden="true">↗</span>
          </button>
          <button id="restartResultBtn" class="result-action restart-result-action" type="button">
            <span>Restart test</span><span aria-hidden="true">↻</span>
          </button>
        </div>
      </div>
    `;

    document.querySelector("#saveResultBtn")?.addEventListener("click", () => saveResultImage(session.resultSummary));
    document.querySelector("#shareResultBtn")?.addEventListener("click", () => shareResultImage(session.resultSummary));
    document.querySelector("#restartResultBtn")?.addEventListener("click", restartPlacementTest);

    window.scrollTo({ top: 0, behavior: "smooth" });
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

  ["pointerdown", "touchstart", "keydown"].forEach((eventName) => {
    document.addEventListener(eventName, () => markPlacementActivity(), {
      capture: true,
      passive: eventName !== "keydown"
    });
  });

  document.addEventListener("keydown", (event) => {
    if (locked || els.placementShell.classList.contains("hidden")) return;

    const number = Number(event.key);
    if (!Number.isInteger(number) || number < 1 || number > 4) return;

    const buttons = els.stageRoot.querySelectorAll(".answer-choice");
    buttons[number - 1]?.click();
  });

  els.restartTestBtn?.addEventListener("click", restartPlacementTest);

  function flagInvalidField(input) {
    if (!input) return;
    input.setAttribute("aria-invalid", "true");
    input.classList.remove("name-input-invalid");
    // Force a reflow so repeated invalid submissions replay the shake.
    void input.offsetWidth;
    input.classList.add("name-input-invalid");
    input.focus();
  }

  function clearFieldError(input) {
    input?.classList.remove("name-input-invalid");
    input?.removeAttribute("aria-invalid");
    els.formError.textContent = "";
  }

  [els.studentName, els.phoneNumber].forEach((input) => {
    input?.addEventListener("input", () => clearFieldError(input));

    input?.addEventListener("animationend", () => {
      input.classList.remove("name-input-invalid");
    });
  });

  els.phoneNumber?.addEventListener("countrychange", () => clearFieldError(els.phoneNumber));

  els.studentForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const name = els.studentName.value.trim().replace(/\s+/g, " ");
    const nameParts = name ? name.split(" ").filter(Boolean) : [];
    els.formError.textContent = "";

    if (nameParts.length < 2) {
      els.formError.textContent = "Please write your full name.";
      flagInvalidField(els.studentName);
      return;
    }

    const phoneNumber = normalisePhoneForSubmit();
    if (!phoneNumber) {
      els.formError.textContent = phoneValidationMessage();
      flagInvalidField(els.phoneNumber);
      return;
    }

    els.startBtn.disabled = true;
    const clientSessionId = makeClientSessionId();

    try {
      const result = await startRemoteSession(name, phoneNumber, clientSessionId);

      session = {
        clientSessionId,
        sessionId: result.sessionId,
        placementVersion: result.placementVersion || PLACEMENT_VERSION,
        studentName: name,
        phoneNumber,
        phase: "calibration",
        moduleId: result.moduleId || "calibration-01",
        provisionalLevel: "",
        status: "active",
        startedAt: new Date().toISOString(),
        lastActivityAt: Date.now()
      };

      currentModuleId = "calibration-01";
      currentQuestionIndex = 0;
      moduleAnswers = [];
      listeningPlays = {};
      lastActivityAt = Date.now();
      lastActivitySyncAt = lastActivityAt;
      saveLocalSession();
      scheduleInactivityExpiry();
      enterCalibration(name);
    } catch (error) {
      console.error(error);
      els.formError.textContent = "Couldn't start. Try again.";
      els.startBtn.disabled = false;
    }
  });

  try {
    const restartName = sessionStorage.getItem(RESTART_NAME_KEY);
    const restartPhone = sessionStorage.getItem(RESTART_PHONE_KEY);
    if (restartName) els.studentName.value = restartName;
    if (restartPhone) restorePhoneInput(restartPhone);
    sessionStorage.removeItem(RESTART_NAME_KEY);
    sessionStorage.removeItem(RESTART_PHONE_KEY);
  } catch {}

  const savedSession = loadLocalSession();
  if (savedSession) resumeSavedSession(savedSession);
})();
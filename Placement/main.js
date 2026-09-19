"use strict";

(() => {
  const PLACEMENT_VERSION = "2026-09-19.6";
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

  let speakingStream = null;
  let speakingRecorder = null;
  let speakingChunks = [];
  let speakingRecognition = null;
  let speakingTranscriptParts = [];
  let speakingConfidenceSamples = [];
  let speakingSegmentCount = 0;
  let speakingAudioContext = null;
  let speakingAnalyser = null;
  let speakingMeterTimer = null;
  let speakingTimer = null;
  let speakingStartedAt = 0;
  let speakingSpeechFrames = 0;
  let speakingTotalFrames = 0;
  let speakingNoiseFloor = 0.018;
  let speakingThreshold = 0.035;

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

    if (session.phase === "result" && session.finalLevel) {
      renderPlacementResult({ finalLevel: session.finalLevel });
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

  function speakingModule() {
    return moduleData(currentModuleId) || moduleData(session?.moduleId);
  }

  async function ensureSpeakingMic() {
    if (speakingStream?.active) return speakingStream;

    if (!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) {
      throw new Error("Microphone recording is not supported in this browser.");
    }

    speakingStream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true
      }
    });

    return speakingStream;
  }

  async function setupSpeakingAnalyser() {
    const stream = await ensureSpeakingMic();

    if (!speakingAudioContext) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (!AudioContextClass) return null;
      speakingAudioContext = new AudioContextClass();
      const source = speakingAudioContext.createMediaStreamSource(stream);
      speakingAnalyser = speakingAudioContext.createAnalyser();
      speakingAnalyser.fftSize = 1024;
      source.connect(speakingAnalyser);
    }

    if (speakingAudioContext.state === "suspended") {
      await speakingAudioContext.resume();
    }

    return speakingAnalyser;
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

      if (!(window.SpeechRecognition || window.webkitSpeechRecognition)) {
        renderSpeakingTechnicalError("Speaking isn't available on this device.");
        return;
      }

      const samples = [];

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
      speakingThreshold = Math.max(0.028, speakingNoiseFloor * 2.2);

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
    els.stageTitle.textContent = "Speak.";
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
          <p class="speaking-status">One answer.</p>
        </div>
      </div>
    `;

    els.stageRoot.querySelector("#startSpeakingBtn")?.addEventListener("click", startSpeakingRecording);
  }

  function startSpeechRecognition() {
    const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!Recognition || speakingRecorder?.state !== "recording") return;

    try {
      const recognition = new Recognition();
      speakingRecognition = recognition;
      recognition.lang = "en-US";
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.maxAlternatives = 1;

      recognition.onresult = (event) => {
        for (let i = event.resultIndex; i < event.results.length; i += 1) {
          const result = event.results[i];
          if (!result.isFinal || !result[0]) continue;

          const text = String(result[0].transcript || "").trim();
          if (text) {
            speakingTranscriptParts.push(text);
            speakingSegmentCount += 1;
          }

          const confidence = Number(result[0].confidence);
          if (Number.isFinite(confidence) && confidence > 0) {
            speakingConfidenceSamples.push(confidence);
          }
        }
      };

      recognition.onend = () => {
        if (speakingRecorder?.state === "recording") {
          window.setTimeout(startSpeechRecognition, 180);
        }
      };

      recognition.onerror = () => {};
      recognition.start();
    } catch {}
  }

  function stopSpeechRecognition() {
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

  async function startSpeakingRecording() {
    const data = speakingModule();

    try {
      const stream = await ensureSpeakingMic();
      await setupSpeakingAnalyser();

      speakingChunks = [];
      speakingTranscriptParts = [];
      speakingConfidenceSamples = [];
      speakingSegmentCount = 0;
      speakingSpeechFrames = 0;
      speakingTotalFrames = 0;
      speakingStartedAt = performance.now();

      const preferredTypes = [
        "audio/webm;codecs=opus",
        "audio/webm",
        "audio/mp4"
      ];
      const mimeType = preferredTypes.find((type) => MediaRecorder.isTypeSupported?.(type)) || "";
      speakingRecorder = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream);

      speakingRecorder.addEventListener("dataavailable", (event) => {
        if (event.data?.size) speakingChunks.push(event.data);
      });

      speakingRecorder.addEventListener("stop", finishSpeakingRecording, { once: true });
      speakingRecorder.start(250);
      startSpeechRecognition();
      startSpeakingMeter();

      renderSpeakingRecording(data);
    } catch (error) {
      console.error(error);
      renderSpeakingTechnicalError("Microphone unavailable.");
    }
  }

  function renderSpeakingRecording(data) {
    const maximumSeconds = Math.max(Number(data.targetSeconds) || 40, Number(data.minimumSeconds) || 20) + 15;

    els.stageRoot.innerHTML = `
      <div class="speaking-recording">
        <div id="recordingMeter" class="recording-meter" aria-hidden="true">
          <i></i><i></i><i></i><i></i><i></i><i></i><i></i>
        </div>
        <span class="recording-live"><i></i> Recording</span>
        <strong id="speakingTimer">00:00</strong>
        <p class="speaking-recording-prompt">${escapeHtml(data.prompt)}</p>
        <button id="stopSpeakingBtn" class="stop-record-btn" type="button" disabled>Finish answer</button>
      </div>
    `;

    const button = els.stageRoot.querySelector("#stopSpeakingBtn");
    const timer = els.stageRoot.querySelector("#speakingTimer");
    const minimumSeconds = Number(data.minimumSeconds) || 15;

    window.clearInterval(speakingTimer);
    speakingTimer = window.setInterval(() => {
      const elapsed = Math.max(0, (performance.now() - speakingStartedAt) / 1000);
      const seconds = Math.floor(elapsed);
      if (timer) timer.textContent = `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;
      if (button && elapsed >= minimumSeconds) button.disabled = false;
      if (elapsed >= maximumSeconds) stopSpeakingRecording();
    }, 200);

    button?.addEventListener("click", stopSpeakingRecording);
  }

  function stopSpeakingRecording() {
    if (!speakingRecorder || speakingRecorder.state !== "recording") return;
    window.clearInterval(speakingTimer);
    window.clearInterval(speakingMeterTimer);
    stopSpeechRecognition();
    speakingRecorder.stop();
  }

  async function finishSpeakingRecording() {
    const data = speakingModule();
    const durationSeconds = Math.max(0, (performance.now() - speakingStartedAt) / 1000);
    const speechRatio = speakingTotalFrames
      ? speakingSpeechFrames / speakingTotalFrames
      : 0;
    const speechSeconds = durationSeconds * speechRatio;
    const transcript = speakingTranscriptParts.join(" ").replace(/\s+/g, " ").trim();
    const recognitionConfidence = speakingConfidenceSamples.length
      ? speakingConfidenceSamples.reduce((sum, value) => sum + value, 0) / speakingConfidenceSamples.length
      : 0;
    const transcriptAvailable = Boolean((window.SpeechRecognition || window.webkitSpeechRecognition) && transcript);

    if (durationSeconds < 6 || speechRatio < 0.16 || !transcriptAvailable) {
      renderSpeakingTechnicalError("We couldn't process your answer.");
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
      const result = await apiPost("submitSpeaking", {
        sessionId: session.sessionId,
        clientSessionId: session.clientSessionId,
        placementVersion: PLACEMENT_VERSION,
        moduleId: currentModuleId,
        promptId: data.promptId,
        durationSeconds,
        speechSeconds,
        speechRatio,
        transcript,
        transcriptAvailable,
        recognitionConfidence,
        segmentCount: speakingSegmentCount,
        recordedBytes: speakingChunks.reduce((sum, chunk) => sum + Number(chunk.size || 0), 0)
      });

      if (result.speakingError) {
        renderSpeakingTechnicalError("We couldn't process your answer.");
        return;
      }

      session.phase = "result";
      session.finalLevel = result.finalLevel;
      session.status = "completed";
      session.confidence = result.confidence;
      saveLocalSession();

      cleanupSpeakingMedia();
      renderPlacementResult(result);
    } catch (error) {
      console.error(error);
      renderSpeakingSubmitRetry({
        durationSeconds,
        speechSeconds,
        speechRatio,
        transcript,
        transcriptAvailable,
        recognitionConfidence,
        segmentCount: speakingSegmentCount,
        recordedBytes: speakingChunks.reduce((sum, chunk) => sum + Number(chunk.size || 0), 0)
      });
    }
  }

  function renderSpeakingTechnicalError(message) {
    cleanupSpeakingRecorderOnly();

    els.stageRoot.innerHTML = `
      <div class="speaking-retry">
        <strong>${escapeHtml(message)}</strong>
        <div class="speaking-error-actions">
          <button id="retrySpeakingBtn" class="secondary-action" type="button">Try again</button>
          <button id="skipSpeakingBtn" class="secondary-action speaking-skip-action" type="button">I cannot speak now</button>
        </div>
      </div>
    `;

    els.stageRoot.querySelector("#retrySpeakingBtn")?.addEventListener("click", renderSpeakingPrompt);
    els.stageRoot.querySelector("#skipSpeakingBtn")?.addEventListener("click", skipSpeakingAfterError);
  }

  async function skipSpeakingAfterError() {
    const button = els.stageRoot.querySelector("#skipSpeakingBtn");
    if (button) button.disabled = true;

    try {
      const result = await apiPost("skipSpeaking", {
        sessionId: session.sessionId,
        clientSessionId: session.clientSessionId,
        placementVersion: PLACEMENT_VERSION,
        moduleId: currentModuleId
      });

      session.phase = "result";
      session.finalLevel = result.finalLevel || session.provisionalLevel;
      session.status = "completed";
      saveLocalSession();

      cleanupSpeakingMedia();
      renderPlacementResult({ finalLevel: session.finalLevel });
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
        const result = await apiPost("submitSpeaking", {
          sessionId: session.sessionId,
          clientSessionId: session.clientSessionId,
          placementVersion: PLACEMENT_VERSION,
          moduleId: currentModuleId,
          promptId: data.promptId,
          ...metrics
        });

        if (result.speakingError) {
          renderSpeakingTechnicalError("We couldn't process your answer.");
          return;
        }

        session.phase = "result";
        session.finalLevel = result.finalLevel;
        session.status = "completed";
        session.confidence = result.confidence;
        saveLocalSession();

        cleanupSpeakingMedia();
        renderPlacementResult(result);
      } catch (error) {
        console.error(error);
      }
    });
  }

  function cleanupSpeakingRecorderOnly() {
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

  function renderPlacementResult(result) {
    openShell();
    setShellStage(4);
    els.stageCard.classList.remove("question-mode", "reading-mode", "listening-mode", "speaking-mode");
    els.stageCard.classList.add("result-mode");
    els.stageIndex.textContent = "✓";
    els.stageEyebrow.textContent = "Placement complete";
    els.stageTitle.textContent = "Your level.";
    els.stageNote.textContent = "";
    els.introScan.classList.add("hidden");

    els.stageRoot.innerHTML = `
      <div class="placement-result">
        <span class="result-level">${escapeHtml(result.finalLevel || session.provisionalLevel || "—")}</span>
        <strong>PLACEMENT COMPLETE</strong>
        <p>Your placement is ready.</p>
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
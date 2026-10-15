"use strict";

(() => {
  const Cloud = window.SpellingCloud;
  if (!Cloud) return;

  const trayToggle = document.getElementById("session-tray-toggle");
  const tray = document.getElementById("session-tray");
  const codeInput = document.getElementById("session-code-input");
  const connectButton = document.getElementById("session-connect");
  const disconnectButton = document.getElementById("session-disconnect");
  const status = document.getElementById("session-status");
  const judgeLink = document.getElementById("judge-view-link");
  const adminLink = document.getElementById("admin-view-link");
  const controls = document.querySelector(".controls");
  const controlsToggle = document.getElementById("controls-toggle");

  let sessionCode = "", unsubscribeCloud = () => {};
  let sessionStartedAt = "";
  let lastStateFingerprint = "";
  let lastRemoteCommandSeq = 0;
  let presenterWriteBusy = false;
  let pendingPresenterSnapshot = null;
  let pendingPresenterFingerprint = "";
  let presenterWritePromise = Promise.resolve();
  let lastPresenterSavedAt = 0;
  let pendingPresenterUrgent = false, presenterNextWriteAt = 0, presenterWriteStartedAt = 0;
  let lastLocalChangeAt = 0, lastQueuedWordToken = "";
  let presenterRetryAt = 0, presenterRetryDelay = 0, presenterRetryTimer = null;
  let commandApplication = Promise.resolve(), applyingRemoteCommand = false;
  function enqueueCommand(command) {
    commandApplication = commandApplication.catch(() => {}).then(async () => {
      applyingRemoteCommand = true;
      try { await applyRemoteCommand(command); }
      finally { applyingRemoteCommand = false; }
    });
    return commandApplication;
  }
  function receiveCloudChange(change) {
    if (change.sessionCode === sessionCode && change.role === "remote" && change.state) enqueueCommand(change.state);
  }
  let pollBusy = false;
  let remotePollTimer = null;
  let remotePollLoopActive = false;

  function judgementMeta() {
    return {
      revision: typeof judgementRevision !== "undefined" ? Number(judgementRevision) || 0 : 0,
      source: typeof judgementSource !== "undefined" ? String(judgementSource || "presenter") : "presenter",
      updatedAt: typeof judgementUpdatedAt !== "undefined" ? Number(judgementUpdatedAt) || 0 : 0
    };
  }

  function compareJudgementMeta(incoming, local = judgementMeta()) {
    const incomingRevision = Number(incoming?.revision || 0);
    const localRevision = Number(local?.revision || 0);

    // Judgement revisions are the cross-device authority clock. Never compare
    // Date.now() values from different devices: their clocks can be skewed.
    if (incomingRevision !== localRevision) {
      return incomingRevision > localRevision ? 1 : -1;
    }

    // Same revision means neither side has proof that its input happened after
    // the other. Preserve the current local state instead of letting polling
    // or a heartbeat overwrite a human input.
    return 0;
  }

  function setStatus(message, type = "") {
    if (!status) return;
    status.textContent = message;
    status.className = `session-status ${type}`.trim();
  }

  function setTrayOpen(open) {
    tray?.classList.toggle("open", open);
    trayToggle?.setAttribute("aria-expanded", String(open));
    if (trayToggle) trayToggle.textContent = open ? "‹" : "›";
  }

  function updateViewLinks() {
    const suffix = sessionCode ? `?session=${encodeURIComponent(sessionCode)}` : "";
    if (judgeLink) judgeLink.href = `judge.html${suffix}`;
    if (adminLink) adminLink.href = `admin.html${suffix}`;
  }

  function usedWordsSnapshot() {
    const result = {};
    if (typeof usedWordsByPool === "undefined" || !(usedWordsByPool instanceof Map)) return result;
    usedWordsByPool.forEach((value, key) => {
      result[key] = Array.from(value instanceof Set ? value : []);
    });
    return result;
  }

  function presenterSnapshot() {
    const level = typeof currentLevel !== "undefined"
      ? currentLevel
      : (document.getElementById("pool-select")?.value || "4TH-5TH");
    const difficulty = typeof currentDifficulty !== "undefined" ? currentDifficulty : "easy";
    const word = typeof current !== "undefined" && current ? current : "";
    const sequence = typeof wordSequence !== "undefined" ? Number(wordSequence) || 0 : 0;
    const markList = typeof marks !== "undefined" && Array.isArray(marks) ? marks.slice() : [];
    const pointer = typeof ptr !== "undefined" ? Number(ptr) || 0 : 0;
    const hidden = typeof hiddenMode !== "undefined" ? Boolean(hiddenMode) : true;
    const poolCount = typeof pool !== "undefined" && Array.isArray(pool) ? pool.length : 0;

    return {
      startedAt: sessionStartedAt,
      level,
      difficulty,
      word,
      wordSequence: sequence,
      wordToken: word ? `${sessionStartedAt}:${sequence}:${word}` : "",
      marks: markList,
      pointer,
      hiddenMode: hidden,
      poolCount,
      usedWords: usedWordsSnapshot(),
      lastCommandSeq: lastRemoteCommandSeq,
      judgementRevision: judgementMeta().revision,
      judgementSource: judgementMeta().source,
      judgementUpdatedAt: judgementMeta().updatedAt
    };
  }

  function fingerprint(snapshot) {
    return JSON.stringify([
      snapshot.level,
      snapshot.difficulty,
      snapshot.wordToken,
      snapshot.marks,
      snapshot.pointer,
      snapshot.hiddenMode,
      snapshot.poolCount,
      snapshot.usedWords,
      snapshot.lastCommandSeq,
      snapshot.judgementRevision,
      snapshot.judgementSource,
      snapshot.judgementUpdatedAt
    ]);
  }

  function flushPresenterSnapshot() {
    window.clearTimeout(presenterRetryTimer);
    presenterRetryTimer = null;
    if (Date.now() < presenterRetryAt) {
      presenterRetryTimer = window.setTimeout(flushPresenterSnapshot, presenterRetryAt - Date.now());
      return presenterWritePromise;
    }
    if (!sessionCode || presenterWriteBusy || !pendingPresenterSnapshot) {
      return presenterWritePromise;
    }

    if (!pendingPresenterUrgent) {
      const wait = Math.max(presenterNextWriteAt - Date.now(),
        Date.now() - lastLocalChangeAt < 220 && Date.now() - presenterWriteStartedAt < 2500
          ? Math.min(220, 2500 - (Date.now() - presenterWriteStartedAt)) : 0);
      if (wait > 0) {
        presenterRetryTimer = window.setTimeout(flushPresenterSnapshot, wait);
        return presenterWritePromise;
      }
    }
    const snapshot = pendingPresenterSnapshot;
    const snapshotUrgent = pendingPresenterUrgent;
    const snapshotFingerprint = pendingPresenterFingerprint;
    const snapshotSessionCode = sessionCode;
    pendingPresenterSnapshot = null;
    pendingPresenterFingerprint = "";
    pendingPresenterUrgent = false;
    presenterWriteBusy = true;
    presenterWriteStartedAt = Date.now(); presenterNextWriteAt = Date.now() + 1500;

    presenterWritePromise = Cloud.writeState({
      sessionCode: snapshotSessionCode,
      role: "presenter",
      actorId: "main",
      state: snapshot
    })
      .then(() => {
        presenterRetryAt = 0; presenterRetryDelay = 0;
        lastPresenterSavedAt = Date.now();
        setStatus(`Session ${snapshotSessionCode} · synced`, "online");
      })
      .catch(error => {
        // Retry only when no newer Presenter state has already replaced it.
        if (!pendingPresenterSnapshot && sessionCode === snapshotSessionCode) {
          pendingPresenterSnapshot = snapshot;
          pendingPresenterFingerprint = snapshotFingerprint;
        }
        if (snapshotUrgent && sessionCode === snapshotSessionCode) pendingPresenterUrgent = true;
        presenterRetryDelay = Math.min(30000, Math.max(Cloud.retryDelay(), presenterRetryDelay * 2));
        presenterRetryAt = Date.now() + presenterRetryDelay;
        setStatus(`Sync retrying: ${error.message}`, "error");
      })
      .finally(() => {
        presenterWriteBusy = false;
        if (pendingPresenterSnapshot) {
          presenterRetryTimer = window.setTimeout(flushPresenterSnapshot, Math.max(80, presenterRetryAt - Date.now()));
        }
      });

    return presenterWritePromise;
  }

  function publishPresenter(force = false) {
    if (!sessionCode || (applyingRemoteCommand && !force)) return Promise.resolve();

    const snapshot = presenterSnapshot();
    const nextFingerprint = fingerprint(snapshot);
    if (!force && nextFingerprint === lastStateFingerprint) {
      return presenterWritePromise;
    }

    // Latest-state wins: local O/P/Backspace can happen much faster than a Wix
    // POST. Never build a queue of obsolete Presenter states.
    lastStateFingerprint = nextFingerprint;
    if (!force) lastLocalChangeAt = Date.now();
    pendingPresenterUrgent = pendingPresenterUrgent || force || snapshot.wordToken !== lastQueuedWordToken;
    lastQueuedWordToken = snapshot.wordToken;
    pendingPresenterSnapshot = snapshot;
    pendingPresenterFingerprint = nextFingerprint;

    if (!presenterWriteBusy) flushPresenterSnapshot();
    return presenterWritePromise;
  }

  function currentWordToken() {
    return presenterSnapshot().wordToken;
  }

  function runFeedback(kind) {
    if (!elWord) return;
    const className = kind === "correct" ? "remote-feedback-correct" : "remote-feedback-wrong";
    elWord.classList.remove("remote-feedback-correct", "remote-feedback-wrong");
    void elWord.offsetWidth;
    elWord.classList.add(className);
    window.setTimeout(() => elWord.classList.remove(className), 900);

    if (kind === "correct") {
      if (typeof launchSpellEffect === "function") launchSpellEffect();
      if (typeof playCorrectAudio === "function") playCorrectAudio();
    } else if (typeof playWrongAudio === "function") {
      playWrongAudio();
    }
  }

  function applyRemoteWordState(command) {
    if (
      typeof current === "undefined" ||
      !current ||
      typeof marks === "undefined" ||
      !Array.isArray(marks) ||
      typeof ptr === "undefined"
    ) {
      return;
    }

    const remote = command?.wordState;
    if (!remote || !Array.isArray(remote.letterMarks)) return;

    const incomingMeta = {
      revision: Number(remote.judgementRevision || 0),
      source: String(remote.judgementSource || "admin"),
      updatedAt: Number(remote.judgementUpdatedAt || 0)
    };

    // A late Wix command must never overwrite a newer O/P/Backspace input
    // that happened directly on Presenter.
    if (compareJudgementMeta(incomingMeta) <= 0) return;

    const letters = Array.from(String(current));
    if (remote.letterMarks.length !== letters.length) return;

    const wasComplete = typeof isAllMarked === "function" ? isAllMarked() : false;

    const nextMarks = letters.map((char, index) => {
      if (!/[A-Za-z]/.test(char)) return "skip";

      const value = remote.letterMarks[index];
      if (value === "correct") return "ok";
      if (value === "incorrect") return "err";
      if (value === "reveal") return "reveal";
      return "pending";
    });

    marks = nextMarks;
    ptr = Number.isFinite(Number(remote.pointer))
      ? Math.max(0, Math.min(letters.length, Number(remote.pointer)))
      : 0;

    if (typeof judgementRevision !== "undefined") judgementRevision = incomingMeta.revision;
    if (typeof judgementSource !== "undefined") judgementSource = incomingMeta.source;
    if (typeof judgementUpdatedAt !== "undefined") judgementUpdatedAt = incomingMeta.updatedAt;

    if (typeof finalizedFeedbackOutcome !== "undefined") {
      finalizedFeedbackOutcome = null;
    }
    if (typeof renderWord === "function") renderWord();

    const nowComplete = typeof isAllMarked === "function" ? isAllMarked() : false;
    if (!wasComplete && nowComplete) {
      const hasError = typeof hadAnyError === "function" ? hadAnyError() : marks.some(mark => mark === "err");
      if (hasError) {
        if (typeof playWrongAudio === "function") playWrongAudio();
      } else {
        if (typeof launchSpellEffect === "function") launchSpellEffect();
        if (typeof playCorrectAudio === "function") playCorrectAudio();
      }
    }
  }

  async function applyRemoteCommand(command) {
    if (!command || Number(command.commandSeq || 0) <= lastRemoteCommandSeq) return;
    const seq = Number(command.commandSeq || 0);
    const targetToken = String(command.wordToken || "");
    const type = String(command.commandType || "");

    if (type !== "difficulty" && targetToken && targetToken !== currentWordToken()) {
      lastRemoteCommandSeq = seq;
      await publishPresenter(true);
      return;
    }

    if (type === "new-word" && typeof nextWord === "function") {
      // A remotely-called word must always begin hidden, even if the
      // previous word was revealed for feedback.
      if (typeof hiddenMode !== "undefined") hiddenMode = true;
      nextWord();
    } else if (type === "difficulty" && ["easy", "medium", "hard"].includes(command.value) && typeof changeDifficulty === "function") {
      await changeDifficulty(command.value);
    } else if (type === "word-state") {
      // Admin sends the latest complete word judgement. Intermediate taps can
      // be skipped safely because this snapshot contains every mark + pointer.
      applyRemoteWordState(command);
    } else if (type === "letter-mark" && ["correct", "incorrect"].includes(command.value) && typeof mark === "function") {
      // Compatibility with older Admin clients.
      mark(command.value === "incorrect" ? "err" : "ok", false);
    } else if (type === "play-audio" && typeof playAudio === "function") {
      // Replay the current word through the Presenter's existing locked-1x audio path.
      await playAudio();
    } else if (type === "feedback" && ["correct", "incorrect"].includes(command.value)) {
      // Finalize the Presenter word before feedback: no pending letters and no
      // active pointer left behind when Admin reveals the word.
      if (typeof finalizeWordForFeedback === "function") {
        finalizeWordForFeedback(command.value);
      } else if (typeof hiddenMode !== "undefined" && hiddenMode && typeof toggleWordMode === "function") {
        toggleWordMode();
      }
      runFeedback(command.value);
    } else if (type === "visibility" && ["reveal", "hide"].includes(command.value) && typeof toggleWordMode === "function") {
      const shouldHide = command.value === "hide";
      if (typeof hiddenMode !== "undefined" && Boolean(hiddenMode) !== shouldHide) {
        toggleWordMode();
      }
    }

    lastRemoteCommandSeq = seq;
    await publishPresenter(true);
  }

  async function pollRemoteCommands() {
    if (!sessionCode || pollBusy) return;
    const pollSessionCode = sessionCode;
    pollBusy = true;

    try {
      const remote = typeof Cloud.fetchCommand === "function"
        ? await Cloud.fetchCommand(pollSessionCode)
        : Cloud.latestRoleState(await Cloud.fetchRows(pollSessionCode), "remote");

      // Ignore a response from a session that was disconnected/replaced while
      // its request was in flight.
      if (pollSessionCode !== sessionCode) return;

      if (remote && Number(remote.commandSeq || 0) > lastRemoteCommandSeq) {
        await enqueueCommand(remote);
      }
    } catch (error) {
      if (pollSessionCode === sessionCode) {
        setStatus(`Cloud unavailable: ${error.message}`, "error");
      }
    } finally {
      pollBusy = false;
    }
  }

  function stopRemotePollLoop() {
    remotePollLoopActive = false;
    window.clearTimeout(remotePollTimer);
    remotePollTimer = null;
  }

  function startRemotePollLoop() {
    stopRemotePollLoop();
    remotePollLoopActive = true;

    const tick = async () => {
      if (!remotePollLoopActive || !sessionCode) return;
      await pollRemoteCommands();

      // Keep this command reader responsive without competing with writes.
      // Confirmed same-device commands also arrive through the shared channel.
      if (remotePollLoopActive && sessionCode) {
        remotePollTimer = window.setTimeout(tick, Cloud.pollDelay(450));
      }
    };

    tick();
  }

  async function connect(code) {
    const normalized = Cloud.normalizeSessionCode(code);
    if (!normalized) {
      setStatus("Enter a numerical session code.", "error");
      codeInput?.focus();
      return;
    }

    unsubscribeCloud();
    sessionCode = normalized;
    unsubscribeCloud = Cloud.subscribe(normalized, receiveCloudChange);
    sessionStartedAt = new Date().toISOString();
    localStorage.setItem("brighton-spelling-presenter-session", normalized);
    if (codeInput) codeInput.value = normalized;
    updateViewLinks();
    setStatus(`Connecting session ${normalized}…`);

    try {
      const remote = await Cloud.fetchCommand(normalized);
      lastRemoteCommandSeq = Number(remote?.commandSeq || 0);
    } catch {
      lastRemoteCommandSeq = 0;
    }

    lastStateFingerprint = "";
    await publishPresenter(true);
    startRemotePollLoop();
  }

  function disconnect() {
    unsubscribeCloud();
    sessionCode = "";
    sessionStartedAt = "";
    lastStateFingerprint = "";
    lastRemoteCommandSeq = 0;
    stopRemotePollLoop();
    pendingPresenterSnapshot = null;
    pendingPresenterFingerprint = "";
    pendingPresenterUrgent = false; lastQueuedWordToken = "";
    localStorage.removeItem("brighton-spelling-presenter-session");
    updateViewLinks();
    setStatus("Cloud session disconnected.");
  }

  trayToggle?.addEventListener("click", () => setTrayOpen(!tray?.classList.contains("open")));

  codeInput?.addEventListener("input", () => {
    const normalized = Cloud.normalizeSessionCode(codeInput.value);
    if (codeInput.value !== normalized) codeInput.value = normalized;
  });

  codeInput?.addEventListener("keydown", event => {
    if (event.key === "Enter") {
      event.preventDefault();
      connect(codeInput.value);
    }
  });

  connectButton?.addEventListener("click", () => connect(codeInput?.value));
  disconnectButton?.addEventListener("click", disconnect);

  controlsToggle?.addEventListener("click", () => {
    const hidden = !controls?.classList.contains("controls-hidden");
    controls?.classList.toggle("controls-hidden", hidden);
    controlsToggle.textContent = hidden ? "⌃" : "⌄";
    controlsToggle.title = hidden ? "Show controls" : "Hide controls";
    controlsToggle.setAttribute("aria-label", controlsToggle.title);
  });

  // Queue local changes immediately; the writer combines rapid marks.
  // New words and command acknowledgements bypass that batching delay.
  window.requestSpellingPresenterSync = () => publishPresenter(false);

  window.setInterval(() => publishPresenter(false), 100);
  window.setInterval(() => {
    if (Date.now() - lastPresenterSavedAt >= 25000) publishPresenter(true);
  }, 10000);

  updateViewLinks();
  const saved = Cloud.normalizeSessionCode(localStorage.getItem("brighton-spelling-presenter-session"));
  if (saved && codeInput) {
    codeInput.value = saved;
    window.setTimeout(() => connect(saved), 150);
  }
})();
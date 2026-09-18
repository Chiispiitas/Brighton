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

  let sessionCode = "";
  let sessionStartedAt = "";
  let lastStateFingerprint = "";
  let lastRemoteCommandSeq = 0;
  let presenterWriteBusy = false;
  let pendingPresenterSnapshot = null;
  let pendingPresenterFingerprint = "";
  let presenterWritePromise = Promise.resolve();
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
    if (!sessionCode || presenterWriteBusy || !pendingPresenterSnapshot) {
      return presenterWritePromise;
    }

    const snapshot = pendingPresenterSnapshot;
    const snapshotFingerprint = pendingPresenterFingerprint;
    const snapshotSessionCode = sessionCode;
    pendingPresenterSnapshot = null;
    pendingPresenterFingerprint = "";
    presenterWriteBusy = true;

    presenterWritePromise = Cloud.writeState({
      sessionCode: snapshotSessionCode,
      role: "presenter",
      actorId: "main",
      state: snapshot
    })
      .then(() => {
        setStatus(`Session ${snapshotSessionCode} · synced`, "online");
      })
      .catch(error => {
        // Retry only when no newer Presenter state has already replaced it.
        if (!pendingPresenterSnapshot && sessionCode === snapshotSessionCode) {
          pendingPresenterSnapshot = snapshot;
          pendingPresenterFingerprint = snapshotFingerprint;
        }
        setStatus(`Sync problem: ${error.message}`, "error");
      })
      .finally(() => {
        presenterWriteBusy = false;
        if (pendingPresenterSnapshot) {
          window.setTimeout(flushPresenterSnapshot, 0);
        }
      });

    return presenterWritePromise;
  }

  function publishPresenter(force = false) {
    if (!sessionCode) return Promise.resolve();

    const snapshot = presenterSnapshot();
    const nextFingerprint = fingerprint(snapshot);
    if (!force && nextFingerprint === lastStateFingerprint) {
      return presenterWritePromise;
    }

    // Latest-state wins: local O/P/Backspace can happen much faster than a Wix
    // POST. Never build a queue of obsolete Presenter states.
    lastStateFingerprint = nextFingerprint;
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
        await applyRemoteCommand(remote);
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

      // The next lightweight command GET starts almost as soon as the previous
      // one finishes. This is faster than a fixed interval when network RTT is
      // longer than the interval itself.
      if (remotePollLoopActive && sessionCode) {
        remotePollTimer = window.setTimeout(tick, 12);
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

    sessionCode = normalized;
    sessionStartedAt = new Date().toISOString();
    localStorage.setItem("brighton-spelling-presenter-session", normalized);
    if (codeInput) codeInput.value = normalized;
    updateViewLinks();
    setStatus(`Connecting session ${normalized}…`);

    try {
      const rows = await Cloud.fetchRows(normalized);
      const remoteStates = Cloud.roleStates(rows, "remote");
      lastRemoteCommandSeq = remoteStates.reduce((max, row) => Math.max(max, Number(row.commandSeq || 0)), 0);
    } catch {
      lastRemoteCommandSeq = 0;
    }

    lastStateFingerprint = "";
    await publishPresenter(true);
    startRemotePollLoop();
  }

  function disconnect() {
    sessionCode = "";
    sessionStartedAt = "";
    lastStateFingerprint = "";
    lastRemoteCommandSeq = 0;
    stopRemotePollLoop();
    pendingPresenterSnapshot = null;
    pendingPresenterFingerprint = "";
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

  // Local O/P changes request an immediate publish so Admin mirrors Presenter
  // without waiting for the periodic state scan.
  window.requestSpellingPresenterSync = () => publishPresenter(false);

  window.setInterval(() => publishPresenter(false), 100);
  window.setInterval(() => publishPresenter(true), 2500);

  updateViewLinks();
  const saved = Cloud.normalizeSessionCode(localStorage.getItem("brighton-spelling-presenter-session"));
  if (saved && codeInput) {
    codeInput.value = saved;
    window.setTimeout(() => connect(saved), 150);
  }
})();
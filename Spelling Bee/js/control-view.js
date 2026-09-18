"use strict";

(() => {
  const Cloud = window.SpellingCloud;
  if (!Cloud) return;

  const role = document.body.dataset.role === "remote" ? "remote" : "judge";
  const canJudge = role === "judge" || role === "remote";
  const joinGate = document.getElementById("join-gate");
  const app = document.getElementById("control-app");
  const codeInput = document.getElementById("join-session-code");
  const joinButton = document.getElementById("join-session-button");
  const joinStatus = document.getElementById("join-status");
  const connectionPill = document.getElementById("connection-pill");
  const word = document.getElementById("control-word");
  const wordMeta = document.getElementById("word-meta");
  const difficultyPill = document.getElementById("difficulty-pill");
  const poolButton = document.getElementById("pool-launcher");
  const poolModal = document.getElementById("pool-modal");
  const poolClose = document.getElementById("pool-close");
  const poolColumns = document.getElementById("pool-columns");
  const ipaValue = document.getElementById("ipa-value");
  const definitionValue = document.getElementById("definition-value");
  const exampleValue = document.getElementById("example-value");
  const judgeNameInput = document.getElementById("judge-name");

  const deviceId = Cloud.getDeviceId(role === "judge"
    ? "brighton-spelling-judge-device"
    : "brighton-spelling-remote-device");
  const judgeActorId = role === "judge"
    ? deviceId
    : Cloud.getDeviceId("brighton-spelling-admin-judge-device");
  const normalizedJudgeActorId = String(judgeActorId).toLowerCase().replace(/[^a-z0-9_-]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 48);

  let sessionCode = "";
  let presenter = null;
  let pollTimer = null;
  let presenterSyncTimer = null;
  let presenterSyncLoopActive = false;
  let presenterSyncBusy = false;
  let judgeHeartbeatTimer = null;
  let voteSeq = 0;
  let commandSeq = 0;
  let busy = false;
  let judgePublishChain = Promise.resolve();
  let commandPublishChain = Promise.resolve();
  let pendingAdminWordState = null;
  let adminWordStateFlushTimer = null;
  let adminWordStateWriteBusy = false;
  let adminWordStateWritePromise = Promise.resolve();
  let adminJudgePublishTimer = null;
  let judgementRevision = 0;
  let judgementSource = "presenter";
  let judgementUpdatedAt = 0;
  let wordInfoKey = "";

  let judgeWordToken = "";
  let judgeMarks = [];
  let judgePointer = 0;
  let judgeVerdict = "pending";
  let judgeStartedAt = "";
  let judgeName = role === "judge"
    ? String(localStorage.getItem("brighton-spelling-judge-name") || "").trim()
    : "Admin";

  function setJoinStatus(message, error = false) {
    if (!joinStatus) return;
    joinStatus.textContent = message;
    joinStatus.classList.toggle("error", error);
  }

  function setConnection(message, type = "") {
    if (!connectionPill) return;
    connectionPill.textContent = message;
    connectionPill.className = `connection-pill ${type}`.trim();
  }

  function cleanJudgeName(value) {
    return String(value || "").replace(/\s+/g, " ").trim().slice(0, 50);
  }

  function cleanCodeInput() {
    if (!codeInput) return "";
    const cleaned = Cloud.normalizeSessionCode(codeInput.value);
    if (codeInput.value !== cleaned) codeInput.value = cleaned;
    return cleaned;
  }

  function setAppVisible(visible) {
    joinGate?.classList.toggle("hidden", visible);
    app?.classList.toggle("hidden", !visible);
  }

  function currentToken() {
    return String(presenter?.wordToken || "");
  }

  function presenterJudgementMeta(state = presenter) {
    return {
      revision: Number(state?.judgementRevision || 0),
      source: String(state?.judgementSource || "presenter"),
      updatedAt: Number(state?.judgementUpdatedAt || 0)
    };
  }

  function localJudgementMeta() {
    return {
      revision: Number(judgementRevision || 0),
      source: String(judgementSource || "presenter"),
      updatedAt: Number(judgementUpdatedAt || 0)
    };
  }

  function compareJudgementMeta(incoming, local = localJudgementMeta()) {
    const incomingRevision = Number(incoming?.revision || 0);
    const localRevision = Number(local?.revision || 0);

    // Revisions, not device wall-clock time, decide authority. Mobile and
    // desktop clocks can differ enough for an older Presenter snapshot to
    // otherwise overwrite newer Admin input.
    if (incomingRevision !== localRevision) {
      return incomingRevision > localRevision ? 1 : -1;
    }

    // Equal revision is an unresolved/concurrent state. Keep local progress.
    return 0;
  }

  function adoptJudgementMeta(meta) {
    judgementRevision = Number(meta?.revision || 0);
    judgementSource = String(meta?.source || "presenter");
    judgementUpdatedAt = Number(meta?.updatedAt || 0);
  }

  function recordAdminJudgementInput() {
    const observedRevision = Math.max(
      Number(judgementRevision || 0),
      Number(presenter?.judgementRevision || 0)
    );
    judgementRevision = observedRevision + 1;
    judgementSource = "admin";
    judgementUpdatedAt = Date.now();
  }

  function firstMarkableIndex(value, start = 0) {
    const letters = Array.from(String(value || ""));
    for (let index = Math.max(0, start); index < letters.length; index += 1) {
      if (/[A-Za-z]/.test(letters[index])) return index;
    }
    return letters.length;
  }

  function createJudgeMarks(value) {
    return Array.from(String(value || "")).map(char => /[A-Za-z]/.test(char) ? "pending" : "skip");
  }

  function previousReviewedIndex() {
    const letters = Array.from(String(presenter?.word || ""));
    let index = Math.min(judgePointer - 1, letters.length - 1);

    while (index >= 0) {
      if (
        /[A-Za-z]/.test(letters[index]) &&
        ["correct", "incorrect", "reveal"].includes(judgeMarks[index])
      ) {
        return index;
      }
      index -= 1;
    }

    return -1;
  }

  function canUndoJudgeMark() {
    return previousReviewedIndex() >= 0;
  }

  function recomputeJudgeVerdict() {
    const letters = Array.from(String(presenter?.word || ""));
    const markableMarks = letters
      .map((char, index) => /[A-Za-z]/.test(char) ? judgeMarks[index] : null)
      .filter(Boolean);

    if (markableMarks.some(mark => mark === "incorrect")) {
      judgeVerdict = "incorrect";
    } else if (
      markableMarks.length > 0 &&
      markableMarks.every(mark => mark === "correct")
    ) {
      judgeVerdict = "correct";
    } else {
      judgeVerdict = "pending";
    }
  }

  function measureWordContentWidth(element) {
    if (!element) return 0;

    const children = Array.from(element.children);
    if (children.length) {
      return children.reduce((total, child) => {
        const rect = child.getBoundingClientRect();
        return total + rect.width;
      }, 0);
    }

    const text = String(element.textContent || "");
    if (!text) return 0;

    const probe = document.createElement("span");
    const styles = getComputedStyle(element);
    probe.textContent = text;
    probe.style.position = "fixed";
    probe.style.left = "-99999px";
    probe.style.top = "-99999px";
    probe.style.visibility = "hidden";
    probe.style.whiteSpace = "nowrap";
    probe.style.fontFamily = styles.fontFamily;
    probe.style.fontWeight = styles.fontWeight;
    probe.style.fontStyle = styles.fontStyle;
    probe.style.fontSize = styles.fontSize;
    probe.style.letterSpacing = styles.letterSpacing;
    document.body.appendChild(probe);
    const width = probe.getBoundingClientRect().width;
    probe.remove();
    return width;
  }

  function fitWordToWidth(element, minFontPx = 26) {
    if (!element || !element.isConnected) return;

    // Always begin from the CSS-defined maximum size so a shorter new word
    // can grow back after a previous long word reduced the inline font size.
    element.style.removeProperty("font-size");

    const styles = getComputedStyle(element);
    const baseFontPx = parseFloat(styles.fontSize) || minFontPx;
    const padding =
      (parseFloat(styles.paddingLeft) || 0) +
      (parseFloat(styles.paddingRight) || 0);
    const available = Math.max(1, element.clientWidth - padding);

    let contentWidth = measureWordContentWidth(element);
    if (!contentWidth || contentWidth <= available) return;

    let fitted = Math.max(minFontPx, baseFontPx * (available / contentWidth) * 0.96);
    element.style.fontSize = `${fitted}px`;

    // Font metrics and letter spacing can make the first estimate a little
    // optimistic. Re-measure and make one final correction if necessary.
    contentWidth = measureWordContentWidth(element);
    if (contentWidth > available && fitted > minFontPx) {
      fitted = Math.max(minFontPx, fitted * (available / contentWidth) * 0.98);
      element.style.fontSize = `${fitted}px`;
    }
  }

  function fitAllVisibleWords() {
    if (word) fitWordToWidth(word, 20);
    document.querySelectorAll(".admin-judge-word").forEach(element => {
      fitWordToWidth(element, 18);
    });
  }

  function scheduleWordFit() {
    requestAnimationFrame(() => requestAnimationFrame(fitAllVisibleWords));
  }

  function resetJudgeWord() {
    judgeWordToken = currentToken();
    judgeMarks = createJudgeMarks(presenter?.word || "");
    judgePointer = firstMarkableIndex(presenter?.word || "", 0);
    judgeVerdict = "pending";
    judgeStartedAt = new Date().toISOString();
    if (role === "remote") adoptJudgementMeta(presenterJudgementMeta());
  }

  function hydrateJudgeState(state, { force = false } = {}) {
    if (!state || state.wordToken !== currentToken() || !Array.isArray(state.letterMarks)) {
      return false;
    }

    const expectedLength = Array.from(String(presenter?.word || "")).length;
    if (state.letterMarks.length !== expectedLength) {
      return false;
    }

    const incomingVoteSeq = Number(state.voteSeq || 0);

    // The local Judge UI is optimistic. Wix may briefly return the previous
    // CMS row while a newer mark is still being written. Never let an older
    // server snapshot repaint newer local progress.
    if (!force && state.wordToken === judgeWordToken && incomingVoteSeq < voteSeq) {
      return true;
    }

    judgeWordToken = state.wordToken;
    judgeMarks = state.letterMarks.slice();
    judgePointer = Number.isFinite(Number(state.pointer))
      ? Number(state.pointer)
      : firstMarkableIndex(presenter?.word || "", 0);
    judgeVerdict = ["correct", "incorrect", "pending"].includes(state.verdict) ? state.verdict : "pending";
    judgeStartedAt = state.startedAt || judgeStartedAt || new Date().toISOString();
    voteSeq = Math.max(voteSeq, incomingVoteSeq);
    return true;
  }

  function renderJudgeWord() {
    if (!word) return;
    const letters = Array.from(String(presenter?.word || ""));
    const frag = document.createDocumentFragment();

    letters.forEach((char, index) => {
      const span = document.createElement("span");
      span.className = "judge-letter";
      const mark = judgeMarks[index] || "pending";
      if (mark === "correct") span.classList.add("correct");
      if (mark === "incorrect") span.classList.add("incorrect");
      if (index === judgePointer) span.classList.add("active");
      span.textContent = char;
      frag.appendChild(span);
    });

    word.replaceChildren(frag);
    scheduleWordFit();
  }

  async function renderWordInfo() {
    if (!ipaValue || !definitionValue || !exampleValue) return;

    if (!presenter?.word) {
      wordInfoKey = "";
      ipaValue.textContent = "—";
      definitionValue.textContent = "—";
      exampleValue.textContent = "—";
      return;
    }

    const level = presenter.level || "4TH-5TH";
    const difficulty = presenter.difficulty || "easy";
    const currentWord = presenter.word || "";
    const key = `${level}|${difficulty}|${currentWord.toLowerCase()}`;

    if (key === wordInfoKey) return;
    wordInfoKey = key;

    ipaValue.textContent = "Loading…";
    definitionValue.textContent = "Loading…";
    exampleValue.textContent = "Loading…";

    try {
      const info = await Cloud.getWordInfo(level, difficulty, currentWord);
      if (wordInfoKey !== key) return;

      ipaValue.textContent = info?.ipa || "—";
      definitionValue.textContent = info?.definition || "No definition available.";
      exampleValue.textContent = info?.example || "No example sentence available.";
    } catch (error) {
      if (wordInfoKey !== key) return;
      ipaValue.textContent = "—";
      definitionValue.textContent = "Word information unavailable.";
      exampleValue.textContent = "Word information unavailable.";
    }
  }

  function renderPresenterState() {
    if (!presenter) {
      if (word) word.textContent = "—";
      if (wordMeta) wordMeta.textContent = "Waiting for presenter";
      return;
    }

    if (canJudge) renderJudgeWord();
    else if (word) {
      word.textContent = presenter.word || "—";
      scheduleWordFit();
    }

    if (wordMeta) {
      const level = presenter.level || "—";
      const difficulty = presenter.difficulty || "easy";
      const judgeSuffix = canJudge
        ? judgeVerdict === "correct"
          ? " · WORD COMPLETE"
          : judgeVerdict === "incorrect"
            ? " · MISTAKE MARKED"
            : ""
        : "";
      wordMeta.textContent = `${level} · ${difficulty.toUpperCase()} · ${presenter.poolCount ?? "—"} remaining${judgeSuffix}`;
    }

    if (difficultyPill) difficultyPill.textContent = String(presenter.difficulty || "easy").toUpperCase();

    if (role === "remote") {
      const visibilityButton = document.getElementById("word-visibility-button");
      if (visibilityButton) {
        const hidden = presenter.hiddenMode !== false;
        visibilityButton.textContent = hidden ? "Reveal word" : "Hide word";
        visibilityButton.dataset.nextVisibility = hidden ? "reveal" : "hide";
      }
    }

    document.querySelectorAll("[data-difficulty]").forEach(button => {
      button.classList.toggle("selected", button.dataset.difficulty === presenter.difficulty);
    });

    if (canJudge) {
      const finished = judgePointer >= Array.from(String(presenter.word || "")).length;
      document.querySelectorAll(".verdict-button[data-verdict]").forEach(button => {
        button.disabled = finished;
      });

      const undoButton = document.getElementById("undo-letter-button");
      if (undoButton) undoButton.disabled = !canUndoJudgeMark();
    }

    renderWordInfo();
  }

  function parseJudgeStates(rows) {
    return Cloud.roleStates(rows, "judge")
      .filter(state => state.wordToken && state.wordToken === currentToken())
      .filter(state => Cloud.isFresh(state, 8000));
  }

  function renderJudgeAggregate(rows) {
    if (role !== "remote") return;
    const host = document.getElementById("judge-result");
    const chips = document.getElementById("judge-vote-list");
    if (!host || !chips) return;

    const votes = parseJudgeStates(rows);
    const incorrect = votes.filter(vote => vote.verdict === "incorrect");
    const correct = votes.filter(vote => vote.verdict === "correct");
    const pending = votes.filter(vote => vote.verdict !== "correct" && vote.verdict !== "incorrect");

    host.classList.remove("correct", "review");
    if (!votes.length) {
      host.querySelector("strong").textContent = "Awaiting judges";
      host.querySelector("span").textContent = "No connected judge is reporting on this word yet.";
    } else if (incorrect.length) {
      host.classList.add("review");
      host.querySelector("strong").textContent = "Review required";
      host.querySelector("span").textContent = `${incorrect.length} judge${incorrect.length === 1 ? "" : "s"} marked at least one letter as incorrect. Discuss before sending presenter feedback.`;
    } else if (pending.length === 0 && correct.length === votes.length) {
      host.classList.add("correct");
      host.querySelector("strong").textContent = "Judges concluded correct";
      host.querySelector("span").textContent = `All ${correct.length} connected judge${correct.length === 1 ? "" : "s"} completed the word without marking a mistake.`;
    } else {
      host.querySelector("strong").textContent = "Judging in progress";
      host.querySelector("span").textContent = `${correct.length} complete · ${pending.length} still judging.`;
    }

    const presenterLetters = Array.from(String(presenter?.word || ""));
    const totalMarkable = presenterLetters.filter(char => /[A-Za-z]/.test(char)).length;

    chips.innerHTML = votes.map((vote, index) => {
      const displayName = cleanJudgeName(vote.judgeName) || `Judge ${index + 1}`;
      const marks = Array.isArray(vote.letterMarks) ? vote.letterMarks : [];
      const pointer = Number.isFinite(Number(vote.pointer)) ? Number(vote.pointer) : 0;
      const reviewed = marks.filter(mark => mark === "correct" || mark === "incorrect").length;
      const status = vote.verdict === "incorrect"
        ? "Mistake marked"
        : vote.verdict === "correct"
          ? "Complete"
          : pointer < presenterLetters.length
            ? `At letter ${Math.min(reviewed + 1, totalMarkable)} of ${totalMarkable}`
            : "Judging";

      const renderedWord = presenterLetters.map((char, letterIndex) => {
        const mark = marks[letterIndex] || "pending";
        const classes = ["admin-judge-letter"];
        if (mark === "correct") classes.push("correct");
        if (mark === "incorrect") classes.push("incorrect");
        if (letterIndex === pointer && vote.verdict === "pending") classes.push("active");
        return `<span class="${classes.join(" ")}">${escapeHtml(char)}</span>`;
      }).join("");

      return `
        <article class="admin-judge-card ${vote.verdict === "incorrect" ? "review" : vote.verdict === "correct" ? "complete" : ""}">
          <div class="admin-judge-card-head">
            <strong>${escapeHtml(displayName)}</strong>
            <span>${escapeHtml(status)} · ${reviewed}/${totalMarkable}</span>
          </div>
          <div class="admin-judge-word" aria-label="${escapeHtml(displayName)} judging progress">${renderedWord}</div>
        </article>
      `;
    }).join("");

    scheduleWordFit();
  }

  function syncAdminJudgeFromPresenter({ force = false } = {}) {
    if (role !== "remote" || !presenter?.wordToken) return false;

    const incomingMeta = presenterJudgementMeta();
    if (!force && compareJudgementMeta(incomingMeta) <= 0) return false;

    // Presenter contains a genuinely newer HUMAN input. Any unsent Admin
    // snapshot is now stale and must not be allowed to arrive later and win.
    if (!force) {
      pendingAdminWordState = null;
      window.clearTimeout(adminWordStateFlushTimer);
      adminWordStateFlushTimer = null;
    }

    const sourceMarks = Array.isArray(presenter.marks) ? presenter.marks : [];
    const letters = Array.from(String(presenter.word || ""));
    const mapped = letters.map((char, index) => {
      if (!/[A-Za-z]/.test(char)) return "skip";
      const mark = sourceMarks[index] || "pending";
      if (mark === "ok") return "correct";
      if (mark === "err") return "incorrect";
      if (mark === "reveal") return "reveal";
      return "pending";
    });

    const nextPointer = Number.isFinite(Number(presenter.pointer))
      ? Math.max(0, Math.min(letters.length, Number(presenter.pointer)))
      : firstMarkableIndex(presenter.word || "", 0);
    const markable = mapped.filter(mark => mark !== "skip");
    const nextVerdict = markable.some(mark => mark === "incorrect")
      ? "incorrect"
      : markable.length > 0 && markable.every(mark => mark === "correct")
        ? "correct"
        : "pending";

    const changed =
      judgeWordToken !== presenter.wordToken ||
      judgePointer !== nextPointer ||
      judgeVerdict !== nextVerdict ||
      JSON.stringify(judgeMarks) !== JSON.stringify(mapped);

    // Even when the letters happen to be visually identical, the newer
    // input-source metadata still matters. Remember who edited last so the
    // next real input is ordered from the correct authority.
    adoptJudgementMeta(incomingMeta);

    if (!changed) return false;

    judgeWordToken = presenter.wordToken;
    judgeMarks = mapped;
    judgePointer = nextPointer;
    judgeVerdict = nextVerdict;
    judgeStartedAt = judgeStartedAt || new Date().toISOString();
    return true;
  }

  function installPresenterSnapshot(nextPresenter, { render = false } = {}) {
    if (!nextPresenter) return false;

    const previousToken = String(presenter?.wordToken || "");
    const previousSequence = Number(presenter?.wordSequence || 0);
    const previousWord = String(presenter?.word || "");
    const nextToken = String(nextPresenter.wordToken || "");
    const nextSequence = Number(nextPresenter.wordSequence || 0);
    const nextWord = String(nextPresenter.word || "");

    const tokenChanged =
      previousToken !== nextToken ||
      previousSequence !== nextSequence ||
      previousWord !== nextWord;

    presenter = nextPresenter;

    if (role === "remote" && tokenChanged) {
      // A new word is a hard state boundary. Nothing queued for the previous
      // word is allowed to seed marks/pointer/verdict into the new word.
      pendingAdminWordState = null;
      window.clearTimeout(adminWordStateFlushTimer);
      adminWordStateFlushTimer = null;

      window.clearTimeout(adminJudgePublishTimer);
      adminJudgePublishTimer = null;

      // Start from a brand-new pending array sized for the NEW word, then
      // optionally adopt genuine Presenter progress belonging to this token.
      resetJudgeWord();
      syncAdminJudgeFromPresenter({ force: true });

      if (render) renderPresenterState();
    }

    return tokenChanged;
  }

  function publishJudgeState({ increment = false } = {}) {
    if (!canJudge || !sessionCode || !presenter?.wordToken || judgeWordToken !== presenter.wordToken) {
      return Promise.resolve();
    }

    if (increment) voteSeq += 1;

    // Capture exactly what the Judge saw when this write was queued. Sending
    // through one chain prevents fast ✓/× presses from reaching Wix out of order.
    const snapshotSessionCode = sessionCode;
    const snapshot = {
      startedAt: judgeStartedAt || new Date().toISOString(),
      level: presenter.level || "",
      difficulty: presenter.difficulty || "",
      word: presenter.word || "",
      wordToken: presenter.wordToken,
      wordSequence: Number(presenter.wordSequence || 0),
      voteSeq,
      pointer: judgePointer,
      letterMarks: judgeMarks.slice(),
      verdict: judgeVerdict,
      judgeName,
      judgementRevision,
      judgementSource,
      judgementUpdatedAt
    };

    judgePublishChain = judgePublishChain
      .catch(() => {})
      .then(() => Cloud.writeState({
        sessionCode: snapshotSessionCode,
        role: "judge",
        actorId: judgeActorId,
        state: snapshot
      }))
      .catch(error => {
        setConnection("Judge sync failed", "error");
      });

    return judgePublishChain;
  }

  async function refreshPresenterOnly() {
    if (!sessionCode || presenterSyncBusy) return;
    presenterSyncBusy = true;

    try {
      const nextPresenter = typeof Cloud.fetchPresenter === "function"
        ? await Cloud.fetchPresenter(sessionCode)
        : Cloud.presenterState(await Cloud.fetchRows(sessionCode));
      if (!nextPresenter) return;

      const tokenChanged = installPresenterSnapshot(nextPresenter);

      if (role === "remote") {
        const changed = tokenChanged
          ? Boolean(presenter.wordToken)
          : syncAdminJudgeFromPresenter();

        renderPresenterState();
        if (changed) publishJudgeState({ increment: true });
      } else {
        renderPresenterState();
      }

      setConnection(
        Cloud.isFresh(presenter, 9000) ? "Presenter online" : "Presenter stale",
        Cloud.isFresh(presenter, 9000) ? "online" : "stale"
      );
    } catch {
      // Full refresh handles connection errors. Keep this fast path quiet.
    } finally {
      presenterSyncBusy = false;
    }
  }

  function stopPresenterSyncLoop() {
    presenterSyncLoopActive = false;
    window.clearTimeout(presenterSyncTimer);
    presenterSyncTimer = null;
  }

  function startPresenterSyncLoop() {
    stopPresenterSyncLoop();
    presenterSyncLoopActive = true;

    const tick = async () => {
      if (!presenterSyncLoopActive || !sessionCode) return;
      await refreshPresenterOnly();

      // No fixed-interval dead time: as soon as one lightweight Presenter GET
      // finishes, start the next one almost immediately.
      if (presenterSyncLoopActive && sessionCode) {
        presenterSyncTimer = window.setTimeout(tick, 12);
      }
    };

    tick();
  }

  async function refresh() {
    if (!sessionCode || busy) return;
    busy = true;
    let needsJudgeInit = false;

    try {
      const rows = await Cloud.fetchRows(sessionCode);
      const nextPresenter = Cloud.presenterState(rows);
      if (!nextPresenter) {
        setConnection("Presenter not found", "error");
        return;
      }

      const tokenChanged = installPresenterSnapshot(nextPresenter);

      setConnection(
        Cloud.isFresh(presenter, 9000) ? "Presenter online" : "Presenter stale",
        Cloud.isFresh(presenter, 9000) ? "online" : "stale"
      );

      if (role === "judge") {
        const mine = Cloud.roleStates(rows, "judge").find(state => state.actorId === normalizedJudgeActorId);

        if (tokenChanged) {
          resetJudgeWord();
          needsJudgeInit = Boolean(presenter.wordToken);
        } else if (mine) {
          hydrateJudgeState(mine);
        } else if (judgeWordToken !== currentToken()) {
          resetJudgeWord();
          needsJudgeInit = Boolean(presenter.wordToken);
        }
      } else if (role === "remote") {
        if (tokenChanged) {
          needsJudgeInit = Boolean(presenter.wordToken);
        } else if (syncAdminJudgeFromPresenter()) {
          needsJudgeInit = true;
        }
      }

      if (role === "remote") {
        const remote = Cloud.latestRoleState(rows, "remote");
        commandSeq = Math.max(commandSeq, Number(remote?.commandSeq || 0));
      }

      renderPresenterState();
      renderJudgeAggregate(rows);
    } catch (error) {
      setConnection("Cloud unavailable", "error");
    } finally {
      busy = false;
    }

    if (needsJudgeInit) publishJudgeState({ increment: true });
  }

  async function joinSession() {
    const code = cleanCodeInput();

    if (role === "judge") {
      judgeName = cleanJudgeName(judgeNameInput?.value);
      if (!judgeName) {
        setJoinStatus("Enter your judge name.", true);
        judgeNameInput?.focus();
        return;
      }
      localStorage.setItem("brighton-spelling-judge-name", judgeName);
    }
    if (!code) {
      setJoinStatus("Enter the numerical session code.", true);
      codeInput?.focus();
      return;
    }

    setJoinStatus("Checking session…");
    joinButton.disabled = true;
    try {
      const rows = await Cloud.fetchRows(code);
      const found = Cloud.presenterState(rows);
      if (!found) throw new Error("No presenter is using that code.");

      sessionCode = code;
      presenter = found;

      if (role === "judge") {
        const mine = Cloud.roleStates(rows, "judge").find(state => state.actorId === normalizedJudgeActorId);
        if (!hydrateJudgeState(mine, { force: true })) resetJudgeWord();
      } else if (role === "remote") {
        judgeStartedAt = new Date().toISOString();
        adoptJudgementMeta(presenterJudgementMeta());
        syncAdminJudgeFromPresenter({ force: true });
      }

      if (role === "remote") {
        const remote = Cloud.latestRoleState(rows, "remote");
        commandSeq = Number(remote?.commandSeq || 0);
      }

      setAppVisible(true);
      renderPresenterState();
      renderJudgeAggregate(rows);
      setConnection(
        Cloud.isFresh(presenter, 9000) ? "Presenter online" : "Presenter stale",
        Cloud.isFresh(presenter, 9000) ? "online" : "stale"
      );

      window.clearInterval(pollTimer);
      stopPresenterSyncLoop();

      // Full refresh still handles judges/consensus. The Presenter state itself
      // uses a continuous lightweight loop for much lower latency.
      pollTimer = window.setInterval(refresh, 1100);
      startPresenterSyncLoop();

      if (canJudge) {
        await publishJudgeState({ increment: true });
        window.clearInterval(judgeHeartbeatTimer);
        judgeHeartbeatTimer = window.setInterval(() => publishJudgeState(), 3000);
      }
    } catch (error) {
      setJoinStatus(error.message || "Session not found.", true);
    } finally {
      joinButton.disabled = false;
    }
  }

  function scheduleAdminJudgePublish() {
    if (role !== "remote") return;
    window.clearTimeout(adminJudgePublishTimer);
    adminJudgePublishTimer = window.setTimeout(() => {
      adminJudgePublishTimer = null;
      publishJudgeState({ increment: true });
    }, 40);
  }

  function adminWordStateSnapshot() {
    return {
      startedAt: new Date().toISOString(),
      level: presenter?.level || "",
      difficulty: presenter?.difficulty || "",
      word: presenter?.word || "",
      wordToken: presenter?.wordToken || "",
      wordSequence: Number(presenter?.wordSequence || 0),
      commandType: "word-state",
      value: "",
      wordState: {
        pointer: judgePointer,
        verdict: judgeVerdict,
        letterMarks: judgeMarks.slice(),
        judgementRevision,
        judgementSource,
        judgementUpdatedAt
      }
    };
  }

  function flushPendingAdminWordState() {
    window.clearTimeout(adminWordStateFlushTimer);
    adminWordStateFlushTimer = null;

    if (role !== "remote" || !sessionCode) {
      return adminWordStateWritePromise;
    }

    // Critical latency rule: never queue another network write behind the one
    // already in flight. Keep only ONE newest pending full-word snapshot.
    if (adminWordStateWriteBusy || !pendingAdminWordState) {
      return adminWordStateWritePromise;
    }

    const snapshot = pendingAdminWordState;
    pendingAdminWordState = null;

    // Never send an old word snapshot after Presenter has already moved on.
    if (!presenter?.wordToken || snapshot.wordToken !== presenter.wordToken) {
      if (pendingAdminWordState) {
        adminWordStateFlushTimer = window.setTimeout(flushPendingAdminWordState, 0);
      }
      return adminWordStateWritePromise;
    }

    commandSeq += 1;
    const seq = commandSeq;
    const snapshotSessionCode = sessionCode;
    adminWordStateWriteBusy = true;

    adminWordStateWritePromise = Cloud.writeState({
      sessionCode: snapshotSessionCode,
      role: "remote",
      actorId: "main",
      state: {
        ...snapshot,
        commandSeq: seq
      }
    })
      .then(() => {
        setConnection("Judgement synced", "online");
      })
      .catch(() => {
        // Retry only if there is not already a newer local state waiting.
        if (!pendingAdminWordState && presenter?.wordToken === snapshot.wordToken) {
          pendingAdminWordState = adminWordStateSnapshot();
        }
        setConnection("Sync retrying", "error");
      })
      .finally(() => {
        adminWordStateWriteBusy = false;

        // If several taps happened during the request, they have already
        // collapsed into pendingAdminWordState. Send that ONE latest snapshot
        // immediately rather than replaying intermediate states.
        if (pendingAdminWordState) {
          adminWordStateFlushTimer = window.setTimeout(flushPendingAdminWordState, 0);
        }
      });

    return adminWordStateWritePromise;
  }

  async function drainAdminWordState() {
    // Used only before non-judgement commands where ordering matters.
    while (adminWordStateWriteBusy || pendingAdminWordState) {
      if (!adminWordStateWriteBusy && pendingAdminWordState) {
        flushPendingAdminWordState();
      }
      await adminWordStateWritePromise.catch(() => {});
      if (pendingAdminWordState) await Promise.resolve();
    }
  }

  function queueAdminWordState() {
    if (role !== "remote" || !sessionCode || !presenter?.wordToken) return;

    // Always replace the unsent snapshot with the newest complete word state.
    pendingAdminWordState = adminWordStateSnapshot();

    if (!adminWordStateWriteBusy && !adminWordStateFlushTimer) {
      adminWordStateFlushTimer = window.setTimeout(flushPendingAdminWordState, 0);
    }
  }

  async function submitJudgeMark(mark) {
    if (!canJudge || !sessionCode || !presenter?.wordToken || judgeWordToken !== presenter.wordToken) return;

    const letters = Array.from(String(presenter.word || ""));
    if (judgePointer >= letters.length) return;

    judgeMarks[judgePointer] = mark;
    if (mark === "incorrect") judgeVerdict = "incorrect";

    judgePointer = firstMarkableIndex(presenter.word || "", judgePointer + 1);
    if (judgePointer >= letters.length && judgeVerdict !== "incorrect") judgeVerdict = "correct";

    if (role === "remote") recordAdminJudgementInput();
    renderPresenterState();

    if (role === "remote") {
      // Admin is optimistic locally. Presenter receives the complete latest
      // word state, not one command per letter.
      queueAdminWordState();
      scheduleAdminJudgePublish();
      return;
    }

    await publishJudgeState({ increment: true });
  }

  async function undoJudgeMark() {
    if (!canJudge || !sessionCode || !presenter?.wordToken || judgeWordToken !== presenter.wordToken) return;

    const previousIndex = previousReviewedIndex();
    if (previousIndex < 0) return;

    judgeMarks[previousIndex] = "pending";
    judgePointer = previousIndex;
    recomputeJudgeVerdict();
    if (role === "remote") recordAdminJudgementInput();
    renderPresenterState();

    if (role === "remote") {
      // Same transport as Admin ✓/×: send the complete revised word state.
      queueAdminWordState();
      scheduleAdminJudgePublish();
      return;
    }

    await publishJudgeState({ increment: true });
  }

  async function waitForPresenterCommandAck(seq, targetWordToken, timeoutMs = 4000) {
    const deadline = Date.now() + timeoutMs;

    while (Date.now() < deadline) {
      await new Promise(resolve => window.setTimeout(resolve, 100));

      try {
        const latestPresenter = typeof Cloud.fetchPresenter === "function"
          ? await Cloud.fetchPresenter(sessionCode)
          : Cloud.presenterState(await Cloud.fetchRows(sessionCode));
        if (!latestPresenter) continue;

        const ack = Number(latestPresenter.lastCommandSeq || 0);
        const tokenChanged = installPresenterSnapshot(latestPresenter, { render: true });

        if (tokenChanged && role === "remote" && presenter?.wordToken) {
          // Publish a clean Admin judge row for the new word immediately.
          publishJudgeState({ increment: true });
        }

        if (ack >= seq) {
          return true;
        }

        // A new word means a stale word-targeted command should not block the queue.
        if (
          targetWordToken &&
          latestPresenter.wordToken &&
          latestPresenter.wordToken !== targetWordToken
        ) {
          return true;
        }
      } catch (error) {
        // Keep waiting until timeout; normal refresh will surface connectivity.
      }
    }

    return false;
  }

  function sendRemoteCommand(commandType, value = "") {
    if (role !== "remote" || !sessionCode || !presenter) return Promise.resolve(false);

    const snapshotSessionCode = sessionCode;
    const snapshotPresenter = {
      level: presenter.level || "",
      difficulty: presenter.difficulty || "",
      word: presenter.word || "",
      wordToken: presenter.wordToken || "",
      wordSequence: Number(presenter.wordSequence || 0)
    };

    commandPublishChain = commandPublishChain
      .catch(() => {})
      .then(async () => {
        // New Word / feedback / visibility must come after the latest judgement,
        // but rapid ✓/×/Backspace never wait on this slower control-command path.
        await drainAdminWordState();

        commandSeq += 1;
        const seq = commandSeq;

        await Cloud.writeState({
          sessionCode: snapshotSessionCode,
          role: "remote",
          actorId: "main",
          state: {
            startedAt: new Date().toISOString(),
            ...snapshotPresenter,
            commandSeq: seq,
            commandType,
            value
          }
        });

        const acknowledged = await waitForPresenterCommandAck(
          seq,
          commandType === "difficulty" ? "" : snapshotPresenter.wordToken
        );

        if (!acknowledged) {
          throw new Error("Presenter did not acknowledge command.");
        }

        setConnection("Command sent", "online");
        window.setTimeout(refreshPresenterOnly, 20);
        return true;
      })
      .catch(error => {
        setConnection("Command failed", "error");
        return false;
      });

    return commandPublishChain;
  }

  async function openPools() {
    if (!presenter) return;
    poolModal?.classList.remove("hidden");
    if (poolColumns) poolColumns.innerHTML = "<p class='placeholder'>Loading remaining words…</p>";

    try {
      const pools = await Cloud.loadRemainingPools(presenter.level || "4TH-5TH", presenter.usedWords || {});
      if (!poolColumns) return;
      poolColumns.innerHTML = ["easy", "medium", "hard"].map(difficulty => {
        const words = pools[difficulty] || [];
        const list = words.length
          ? `<ol class="pool-word-list">${words.map(item => `<li>${escapeHtml(item)}</li>`).join("")}</ol>`
          : "<p class='placeholder'>No remaining words.</p>";
        return `
          <section class="pool-column ${presenter.difficulty === difficulty ? "current" : ""}">
            <h3>${difficulty} <span class="pool-count">${words.length} remaining</span></h3>
            ${list}
          </section>`;
      }).join("");
    } catch (error) {
      if (poolColumns) poolColumns.innerHTML = `<p class="placeholder">${escapeHtml(error.message)}</p>`;
    }
  }

  function escapeHtml(value) {
    return String(value ?? "").replace(/[&<>"]/g, char => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;"
    }[char]));
  }

  if (judgeNameInput && judgeName) judgeNameInput.value = judgeName;

  judgeNameInput?.addEventListener("input", () => {
    judgeNameInput.value = String(judgeNameInput.value || "").slice(0, 50);
  });
  judgeNameInput?.addEventListener("keydown", event => {
    if (event.key === "Enter") {
      event.preventDefault();
      codeInput?.focus();
    }
  });

  codeInput?.addEventListener("input", cleanCodeInput);
  codeInput?.addEventListener("keydown", event => {
    if (event.key === "Enter") {
      event.preventDefault();
      joinSession();
    }
  });
  joinButton?.addEventListener("click", joinSession);

  function bindVerdictButton(button) {
    let suppressSyntheticClickUntil = 0;

    const activate = () => {
      if (button.disabled) return;
      if (button.dataset.action === "undo") {
        undoJudgeMark();
        return;
      }
      submitJudgeMark(button.dataset.verdict === "incorrect" ? "incorrect" : "correct");
    };

    const activateTouchLike = event => {
      if (event?.cancelable) event.preventDefault();
      suppressSyntheticClickUntil = performance.now() + 650;
      activate();
    };

    if (window.PointerEvent) {
      // Fire as soon as the finger/stylus goes down. There is deliberately no
      // inter-press cooldown, so fast spelling cadence is accepted.
      button.addEventListener("pointerdown", event => {
        if (event.pointerType === "touch" || event.pointerType === "pen") {
          activateTouchLike(event);
        }
      });
    } else {
      // Older iOS/WebKit fallback when Pointer Events are unavailable.
      button.addEventListener("touchstart", activateTouchLike, { passive: false });
    }

    // Mouse and keyboard activation still use click. A touch-generated click
    // is ignored without blocking the next real touch press.
    button.addEventListener("click", event => {
      if (performance.now() < suppressSyntheticClickUntil) {
        event.preventDefault();
        return;
      }
      activate();
    });
  }

  document.querySelectorAll(".verdict-button").forEach(bindVerdictButton);

  window.addEventListener("keydown", event => {
    if (!canJudge || ["INPUT", "TEXTAREA"].includes(document.activeElement?.tagName)) return;
    if (event.key === "o" || event.key === "O") {
      event.preventDefault();
      submitJudgeMark("correct");
    } else if (event.key === "p" || event.key === "P") {
      event.preventDefault();
      submitJudgeMark("incorrect");
    } else if (event.key === "Backspace") {
      event.preventDefault();
      undoJudgeMark();
    }
  });

  document.getElementById("new-word-button")?.addEventListener("click", () => sendRemoteCommand("new-word"));
  document.getElementById("replay-audio-button")?.addEventListener("click", () => sendRemoteCommand("play-audio"));
  document.getElementById("word-visibility-button")?.addEventListener("click", event => {
    const value = event.currentTarget.dataset.nextVisibility || (presenter?.hiddenMode === false ? "hide" : "reveal");
    sendRemoteCommand("visibility", value);
  });
  document.querySelectorAll("[data-difficulty]").forEach(button => {
    button.addEventListener("click", () => sendRemoteCommand("difficulty", button.dataset.difficulty));
  });
  document.getElementById("presenter-correct")?.addEventListener("click", () => sendRemoteCommand("feedback", "correct"));
  document.getElementById("presenter-incorrect")?.addEventListener("click", () => sendRemoteCommand("feedback", "incorrect"));

  poolButton?.addEventListener("click", openPools);
  poolClose?.addEventListener("click", () => poolModal?.classList.add("hidden"));
  poolModal?.addEventListener("click", event => {
    if (event.target === poolModal) poolModal.classList.add("hidden");
  });

  let resizeFitTimer = null;
  window.addEventListener("resize", () => {
    window.clearTimeout(resizeFitTimer);
    resizeFitTimer = window.setTimeout(scheduleWordFit, 80);
  });

  if (document.fonts?.ready) {
    document.fonts.ready.then(scheduleWordFit).catch(() => {});
  }

  const queryCode = Cloud.normalizeSessionCode(new URLSearchParams(location.search).get("session"));
  if (queryCode && codeInput) codeInput.value = queryCode;
})();
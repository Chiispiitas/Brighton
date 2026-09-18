"use strict";

(() => {
  const Cloud = window.SpellingCloud;
  if (!Cloud) return;

  const role = document.body.dataset.role === "remote" ? "remote" : "judge";
  const joinGate = document.getElementById("join-gate");
  const app = document.getElementById("control-app");
  const codeInput = document.getElementById("join-session-code");
  const joinButton = document.getElementById("join-session-button");
  const joinStatus = document.getElementById("join-status");
  const sessionPill = document.getElementById("session-pill");
  const connectionPill = document.getElementById("connection-pill");
  const word = document.getElementById("control-word");
  const wordMeta = document.getElementById("word-meta");
  const difficultyPill = document.getElementById("difficulty-pill");
  const poolButton = document.getElementById("pool-launcher");
  const poolModal = document.getElementById("pool-modal");
  const poolClose = document.getElementById("pool-close");
  const poolColumns = document.getElementById("pool-columns");

  const deviceId = Cloud.getDeviceId(role === "judge"
    ? "brighton-spelling-judge-device"
    : "brighton-spelling-remote-device");
  const normalizedDeviceId = String(deviceId).toLowerCase().replace(/[^a-z0-9_-]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 48);

  let sessionCode = "";
  let presenter = null;
  let pollTimer = null;
  let judgeHeartbeatTimer = null;
  let voteSeq = 0;
  let commandSeq = 0;
  let busy = false;

  let judgeWordToken = "";
  let judgeMarks = [];
  let judgePointer = 0;
  let judgeVerdict = "pending";
  let judgeStartedAt = "";

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

  function resetJudgeWord() {
    judgeWordToken = currentToken();
    judgeMarks = createJudgeMarks(presenter?.word || "");
    judgePointer = firstMarkableIndex(presenter?.word || "", 0);
    judgeVerdict = "pending";
    judgeStartedAt = new Date().toISOString();
  }

  function hydrateJudgeState(state) {
    if (!state || state.wordToken !== currentToken() || !Array.isArray(state.letterMarks)) {
      resetJudgeWord();
      return false;
    }

    const expectedLength = Array.from(String(presenter?.word || "")).length;
    if (state.letterMarks.length !== expectedLength) {
      resetJudgeWord();
      return false;
    }

    judgeWordToken = state.wordToken;
    judgeMarks = state.letterMarks.slice();
    judgePointer = Number.isFinite(Number(state.pointer))
      ? Number(state.pointer)
      : firstMarkableIndex(presenter?.word || "", 0);
    judgeVerdict = ["correct", "incorrect", "pending"].includes(state.verdict) ? state.verdict : "pending";
    judgeStartedAt = state.startedAt || judgeStartedAt || new Date().toISOString();
    voteSeq = Math.max(voteSeq, Number(state.voteSeq || 0));
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
  }

  function renderPresenterState() {
    if (!presenter) {
      if (word) word.textContent = "—";
      if (wordMeta) wordMeta.textContent = "Waiting for presenter";
      return;
    }

    if (role === "judge") renderJudgeWord();
    else if (word) word.textContent = presenter.word || "—";

    if (wordMeta) {
      const level = presenter.level || "—";
      const difficulty = presenter.difficulty || "easy";
      const judgeSuffix = role === "judge"
        ? judgeVerdict === "correct"
          ? " · WORD COMPLETE"
          : judgeVerdict === "incorrect"
            ? " · MISTAKE MARKED"
            : ""
        : "";
      wordMeta.textContent = `${level} · ${difficulty.toUpperCase()} · ${presenter.poolCount ?? "—"} remaining${judgeSuffix}`;
    }

    if (difficultyPill) difficultyPill.textContent = String(presenter.difficulty || "easy").toUpperCase();

    document.querySelectorAll("[data-difficulty]").forEach(button => {
      button.classList.toggle("selected", button.dataset.difficulty === presenter.difficulty);
    });

    if (role === "judge") {
      const finished = judgePointer >= Array.from(String(presenter.word || "")).length;
      document.querySelectorAll(".verdict-button").forEach(button => {
        button.disabled = finished;
      });
    }
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

    chips.innerHTML = votes.map((vote, index) => {
      const symbol = vote.verdict === "incorrect" ? "×" : vote.verdict === "correct" ? "✓" : "…";
      return `<span class="judge-vote-chip">Judge ${index + 1}: ${symbol}</span>`;
    }).join("");
  }

  async function publishJudgeState({ increment = false } = {}) {
    if (role !== "judge" || !sessionCode || !presenter?.wordToken || judgeWordToken !== presenter.wordToken) return;
    if (increment) voteSeq += 1;

    try {
      await Cloud.writeState({
        sessionCode,
        role: "judge",
        actorId: deviceId,
        state: {
          startedAt: judgeStartedAt || new Date().toISOString(),
          level: presenter.level || "",
          difficulty: presenter.difficulty || "",
          word: presenter.word || "",
          wordToken: presenter.wordToken,
          wordSequence: Number(presenter.wordSequence || 0),
          voteSeq,
          pointer: judgePointer,
          letterMarks: judgeMarks.slice(),
          verdict: judgeVerdict
        }
      });
    } catch (error) {
      setConnection("Judge sync failed", "error");
    }
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

      const tokenChanged = presenter?.wordToken !== nextPresenter.wordToken;
      presenter = nextPresenter;

      setConnection(
        Cloud.isFresh(presenter, 9000) ? "Presenter online" : "Presenter stale",
        Cloud.isFresh(presenter, 9000) ? "online" : "stale"
      );

      if (role === "judge") {
        const mine = Cloud.roleStates(rows, "judge").find(state => state.actorId === normalizedDeviceId);
        if (tokenChanged || !hydrateJudgeState(mine)) {
          resetJudgeWord();
          needsJudgeInit = Boolean(presenter.wordToken);
        }
      } else {
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
      if (sessionPill) sessionPill.textContent = `SESSION ${sessionCode}`;

      if (role === "judge") {
        const mine = Cloud.roleStates(rows, "judge").find(state => state.actorId === normalizedDeviceId);
        if (!hydrateJudgeState(mine)) resetJudgeWord();
      } else {
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
      pollTimer = window.setInterval(refresh, 900);

      if (role === "judge") {
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

  async function submitJudgeMark(mark) {
    if (role !== "judge" || !sessionCode || !presenter?.wordToken || judgeWordToken !== presenter.wordToken) return;

    const letters = Array.from(String(presenter.word || ""));
    if (judgePointer >= letters.length) return;

    judgeMarks[judgePointer] = mark;
    if (mark === "incorrect") judgeVerdict = "incorrect";

    judgePointer = firstMarkableIndex(presenter.word || "", judgePointer + 1);
    if (judgePointer >= letters.length && judgeVerdict !== "incorrect") judgeVerdict = "correct";

    renderPresenterState();
    await publishJudgeState({ increment: true });
  }

  async function sendRemoteCommand(commandType, value = "") {
    if (role !== "remote" || !sessionCode || !presenter) return;
    commandSeq += 1;

    try {
      await Cloud.writeState({
        sessionCode,
        role: "remote",
        actorId: "main",
        state: {
          startedAt: new Date().toISOString(),
          level: presenter.level || "",
          difficulty: presenter.difficulty || "",
          word: presenter.word || "",
          wordToken: presenter.wordToken || "",
          wordSequence: Number(presenter.wordSequence || 0),
          commandSeq,
          commandType,
          value
        }
      });
      setConnection("Command sent", "online");
      window.setTimeout(refresh, 260);
    } catch (error) {
      commandSeq -= 1;
      setConnection("Command failed", "error");
    }
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

  codeInput?.addEventListener("input", cleanCodeInput);
  codeInput?.addEventListener("keydown", event => {
    if (event.key === "Enter") {
      event.preventDefault();
      joinSession();
    }
  });
  joinButton?.addEventListener("click", joinSession);

  document.querySelectorAll(".verdict-button").forEach(button => {
    button.addEventListener("click", () => submitJudgeMark(button.dataset.verdict === "incorrect" ? "incorrect" : "correct"));
  });

  window.addEventListener("keydown", event => {
    if (role !== "judge" || ["INPUT", "TEXTAREA"].includes(document.activeElement?.tagName)) return;
    if (event.key === "o" || event.key === "O") {
      event.preventDefault();
      submitJudgeMark("correct");
    } else if (event.key === "p" || event.key === "P") {
      event.preventDefault();
      submitJudgeMark("incorrect");
    }
  });

  document.getElementById("new-word-button")?.addEventListener("click", () => sendRemoteCommand("new-word"));
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

  const queryCode = Cloud.normalizeSessionCode(new URLSearchParams(location.search).get("session"));
  if (queryCode && codeInput) codeInput.value = queryCode;
})();
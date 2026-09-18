"use strict";

(() => {
  const API_BASE = "https://chiispiitas.wixsite.com/brightonexams/_functions";
  const EXAM_ID = "brighton-spelling-bee-live";
  const EXAM_TITLE = "Brighton Spelling Bee Live";
  const ROLE_NAMESPACE = "spelling";

  function normalizeSessionCode(value) {
    return String(value || "").replace(/\D+/g, "").slice(0, 20);
  }

  function makeActorId(value) {
    return String(value || "main").toLowerCase().replace(/[^a-z0-9_-]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 48) || "main";
  }

  function getDeviceId(storageKey = "brighton-spelling-device") {
    let value = localStorage.getItem(storageKey);
    if (value) return value;
    value = window.crypto?.randomUUID
      ? window.crypto.randomUUID()
      : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
    localStorage.setItem(storageKey, value);
    return value;
  }

  function recordId(sessionCode, role, actorId = "main") {
    return `${ROLE_NAMESPACE}_${normalizeSessionCode(sessionCode)}_${makeActorId(role)}_${makeActorId(actorId)}`.slice(0, 120);
  }

  async function apiJson(url, options = {}) {
    const response = await fetch(url, options);
    const data = await response.json().catch(() => ({}));
    if (!response.ok || data.success === false || data.ok === false) {
      throw new Error(data.error || `Brighton Database error ${response.status}`);
    }
    return data;
  }

  async function fetchRows(sessionCode) {
    const code = normalizeSessionCode(sessionCode);
    if (!code) return [];
    const url = new URL(`${API_BASE}/getProgress`);
    url.searchParams.set("classId", code);
    const data = await apiJson(url.toString(), { cache: "no-store" });
    return Array.isArray(data.items)
      ? data.items.filter(row => String(row.examId || "") === EXAM_ID)
      : [];
  }

  function parseMaybeJson(value) {
    if (!value) return null;
    if (typeof value === "object") return value;
    try {
      return JSON.parse(String(value));
    } catch {
      return null;
    }
  }

  function stateFromRow(row) {
    if (!row) return null;

    const note = parseMaybeJson(row.notes);
    if (note?.__spellingBee === 1) return { ...note, _row: row };

    const directAnswers = parseMaybeJson(row.answers);
    const direct = directAnswers?.spellingBee;
    if (direct && typeof direct === "object") return { ...direct, _row: row };

    const answersJson = parseMaybeJson(row.answersJson);
    const nested = parseMaybeJson(answersJson?.spellingBee);
    if (nested && typeof nested === "object") return { ...nested, _row: row };

    return null;
  }

  function roleStates(rows, role) {
    return (Array.isArray(rows) ? rows : [])
      .map(stateFromRow)
      .filter(Boolean)
      .filter(state => String(state.role || state._row?.currentPart || "") === role)
      .sort((a, b) => new Date(b.updatedAt || b._row?.lastSeenAt || 0) - new Date(a.updatedAt || a._row?.lastSeenAt || 0));
  }

  function latestRoleState(rows, role) {
    return roleStates(rows, role)[0] || null;
  }

  function presenterState(rows) {
    return latestRoleState(rows, "presenter");
  }

  function isFresh(state, maxAgeMs = 10000) {
    const stamp = state?.updatedAt || state?._row?.lastSeenAt || state?._row?.updatedAt;
    const time = new Date(stamp || 0).getTime();
    return Number.isFinite(time) && Date.now() - time <= maxAgeMs;
  }

  async function writeState({ sessionCode, role, actorId = "main", state = {} }) {
    const code = normalizeSessionCode(sessionCode);
    if (!code) throw new Error("A numerical session code is required.");

    const now = new Date().toISOString();
    const payload = {
      __spellingBee: 1,
      version: 1,
      ...state,
      role,
      actorId: makeActorId(actorId),
      sessionCode: code,
      updatedAt: now
    };

    const body = {
      progressId: recordId(code, role, actorId),
      examId: EXAM_ID,
      examTitle: EXAM_TITLE,
      skill: "Spelling",
      level: String(payload.level || ""),
      studentName: role === "presenter"
        ? "PRESENTER"
        : role === "remote"
          ? "REMOTE CONTROL"
          : `JUDGE ${makeActorId(actorId).slice(0, 8).toUpperCase()}`,
      classId: code,
      status: "in_progress",
      startedAt: payload.startedAt || now,
      lastSeenAt: now,
      currentPart: role,
      currentQuestion: String(payload.word || ""),
      answeredCount: Number(payload.wordSequence || payload.voteSeq || payload.commandSeq || 0),
      totalQuestions: 0,
      progressPercent: 0,
      timeSpentSeconds: 0,
      answers: { spellingBee: payload },
      answerList: [],
      writingSamples: [],
      part2SelectedQuestion: "",
      part2Drafts: [],
      flagged: [],
      notes: JSON.stringify(payload),
      submittedAt: "",
      submissionId: ""
    };

    return apiJson(`${API_BASE}/updateProgress`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });
  }

  async function loadWordList(level, difficulty) {
    const safeLevel = String(level || "4TH-5TH").replace(/[^A-Za-z0-9+-]/g, "");
    const safeDifficulty = ["easy", "medium", "hard"].includes(difficulty) ? difficulty : "easy";
    const response = await fetch(`wordlists/${safeLevel}/${safeDifficulty}.txt`, { cache: "no-store" });
    if (!response.ok) throw new Error(`Could not load ${safeDifficulty} word pool.`);
    const seen = new Set();
    return (await response.text())
      .split(/\r?\n/)
      .map(word => word.trim())
      .filter(word => word && !seen.has(word) && seen.add(word));
  }

  async function loadRemainingPools(level, usedWords = {}) {
    const result = {};
    await Promise.all(["easy", "medium", "hard"].map(async difficulty => {
      const all = await loadWordList(level, difficulty);
      const key = `${level}|${difficulty}`;
      const used = new Set(Array.isArray(usedWords[key]) ? usedWords[key] : []);
      result[difficulty] = all.filter(word => !used.has(word));
    }));
    return result;
  }

  window.SpellingCloud = {
    API_BASE,
    EXAM_ID,
    normalizeSessionCode,
    getDeviceId,
    recordId,
    fetchRows,
    stateFromRow,
    roleStates,
    latestRoleState,
    presenterState,
    isFresh,
    writeState,
    loadWordList,
    loadRemainingPools
  };
})();
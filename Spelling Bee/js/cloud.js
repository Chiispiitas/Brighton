"use strict";

(() => {
  // Dedicated Spelling Bee backend. This does NOT use Brighton Exams progress/results CMS.
  const API_BASE = "https://chiispiitas.wixsite.com/cms-server/_functions";
  const ENDPOINTS = {
    session: `${API_BASE}/spellingBeeSession`,
    judge: `${API_BASE}/spellingBeeJudge`,
    command: `${API_BASE}/spellingBeeCommand`
  };

  function normalizeSessionCode(value) {
    return String(value || "").replace(/\D+/g, "").slice(0, 20);
  }

  function makeActorId(value) {
    return String(value || "main")
      .toLowerCase()
      .replace(/[^a-z0-9_-]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 48) || "main";
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

  async function apiJson(url, options = {}) {
    const response = await fetch(url, options);
    const data = await response.json().catch(() => ({}));

    if (!response.ok || data.success === false || data.ok === false) {
      throw new Error(data.error || `Spelling Bee backend error ${response.status}`);
    }

    return data;
  }

  function stateFromRow(row) {
    if (!row || typeof row !== "object") return null;
    if (row.__spellingBee === 1 && row.role) return row;
    if (row.role && row.sessionCode) return { __spellingBee: 1, ...row };
    return null;
  }

  function roleStates(rows, role) {
    return (Array.isArray(rows) ? rows : [])
      .map(stateFromRow)
      .filter(Boolean)
      .filter(state => String(state.role || "") === role)
      .sort((a, b) => new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0));
  }

  function latestRoleState(rows, role) {
    return roleStates(rows, role)[0] || null;
  }

  function presenterState(rows) {
    return latestRoleState(rows, "presenter");
  }

  function isFresh(state, maxAgeMs = 10000) {
    const time = new Date(state?.updatedAt || 0).getTime();
    return Number.isFinite(time) && Date.now() - time <= maxAgeMs;
  }

  async function fetchRows(sessionCode) {
    const code = normalizeSessionCode(sessionCode);
    if (!code) return [];

    const query = `sessionCode=${encodeURIComponent(code)}`;
    const requests = [
      apiJson(`${ENDPOINTS.session}?${query}`, { cache: "no-store" }),
      apiJson(`${ENDPOINTS.judge}?${query}`, { cache: "no-store" }),
      apiJson(`${ENDPOINTS.command}?${query}`, { cache: "no-store" })
    ];

    const [sessionData, judgeData, commandData] = await Promise.all(requests);
    const rows = [];

    if (sessionData.session) rows.push(sessionData.session);
    if (Array.isArray(judgeData.items)) rows.push(...judgeData.items);
    if (commandData.command) rows.push(commandData.command);

    return rows;
  }

  async function writeState({ sessionCode, role, actorId = "main", state = {} }) {
    const code = normalizeSessionCode(sessionCode);
    if (!code) throw new Error("A numerical session code is required.");

    const safeActor = makeActorId(actorId);
    const payloadState = {
      __spellingBee: 1,
      version: 2,
      ...state,
      role,
      actorId: safeActor,
      sessionCode: code
    };

    let endpoint = "";
    if (role === "presenter") endpoint = ENDPOINTS.session;
    else if (role === "judge") endpoint = ENDPOINTS.judge;
    else if (role === "remote") endpoint = ENDPOINTS.command;
    else throw new Error(`Unsupported Spelling Bee role: ${role}`);

    return apiJson(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sessionCode: code,
        actorId: safeActor,
        state: payloadState
      })
    });
  }

  async function loadWordList(level, difficulty) {
    const safeLevel = String(level || "4TH-5TH").replace(/[^A-Za-z0-9+-]/g, "");
    const safeDifficulty = ["easy", "medium", "hard"].includes(difficulty) ? difficulty : "easy";

    const response = await fetch(
      `wordlists/${safeLevel}/${safeDifficulty}.txt`,
      { cache: "no-store" }
    );

    if (!response.ok) {
      throw new Error(`Could not load ${safeDifficulty} word pool.`);
    }

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

  const wordDataCache = new Map();

  async function loadWordData(level, difficulty) {
    const safeLevel = String(level || "4TH-5TH").replace(/[^A-Za-z0-9+-]/g, "");
    const safeDifficulty = ["easy", "medium", "hard"].includes(difficulty) ? difficulty : "easy";
    const cacheKey = `${safeLevel}|${safeDifficulty}`;

    if (wordDataCache.has(cacheKey)) {
      return wordDataCache.get(cacheKey);
    }

    const request = fetch(
      `word-data/${safeLevel}/${safeDifficulty}.json`,
      { cache: "no-store" }
    ).then(async response => {
      if (response.status === 404) return {};
      if (!response.ok) {
        throw new Error(`Could not load word information for ${safeLevel} ${safeDifficulty}.`);
      }
      return response.json();
    });

    wordDataCache.set(cacheKey, request);

    try {
      return await request;
    } catch (error) {
      wordDataCache.delete(cacheKey);
      throw error;
    }
  }

  async function getWordInfo(level, difficulty, word) {
    const data = await loadWordData(level, difficulty);
    return data[String(word || "").trim().toLowerCase()] || null;
  }

  window.SpellingCloud = {
    API_BASE,
    ENDPOINTS,
    normalizeSessionCode,
    getDeviceId,
    stateFromRow,
    roleStates,
    latestRoleState,
    presenterState,
    isFresh,
    fetchRows,
    writeState,
    loadWordList,
    loadRemainingPools,
    loadWordData,
    getWordInfo
  };
})();
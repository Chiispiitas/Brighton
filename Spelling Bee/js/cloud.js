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

  const reads = new Map();
  let cooldownUntil = 0, failures = 0;
  const pause = ms => new Promise(resolve => window.setTimeout(resolve, ms));
  // Share confirmed changes between windows on this device. Wix remains the
  // authority; nothing is broadcast until the server has accepted the write.
  const channels = new Map(), listeners = new Map();
  function channelFor(code) {
    if (typeof BroadcastChannel !== "function") return null;
    if (!channels.has(code)) {
      const channel = new BroadcastChannel(`bee-confirmed-v1:${code}`);
      channel.addEventListener("message", event => {
        const change = event.data;
        if (change?.sessionCode !== code || !["presenter", "judge", "remote"].includes(change.role)) return;
        reads.clear();
        for (const listener of listeners.get(code) || []) listener(change);
      });
      channels.set(code, channel);
    }
    return channels.get(code);
  }
  function subscribe(sessionCode, listener) {
    const code = normalizeSessionCode(sessionCode);
    if (!code) return () => {};
    if (!listeners.has(code)) listeners.set(code, new Set());
    listeners.get(code).add(listener); channelFor(code);
    return () => listeners.get(code)?.delete(listener);
  }
  function retryDelay() { return Math.max(1200, cooldownUntil - Date.now(), Math.min(30000, 1000 * 2 ** Math.min(failures, 5))); }
  function pollDelay(base) { return Math.max(base + Math.random() * base * 0.15, cooldownUntil - Date.now()); }

  async function apiJson(url, options = {}) {
    const read = !options.method || options.method === "GET";
    const cached = reads.get(url);
    if (read && cached && (cached.pending || Date.now() - cached.at < 180)) return cached.promise;
    const request = (async () => {
      if (Date.now() < cooldownUntil) {
        if (read) throw new Error("Cloud is cooling down after a request limit.");
        await pause(cooldownUntil - Date.now());
      }
      const controller = new AbortController();
      const timeout = window.setTimeout(() => controller.abort(), 12000);
      try {
        const response = await fetch(url, { ...options, signal: controller.signal });
        const data = await response.json().catch(() => ({}));
        if (!response.ok || data.success === false || data.ok === false) {
          const error = new Error(data.error || data.message || `Spelling Bee backend error ${response.status}`);
          error.status = response.status;
          if (response.status === 429 || /quota|rate.?limit|request.?limit|too many|WDE0014/i.test(error.message)) {
            const header = response.headers.get("Retry-After");
            const after = Number(header) * 1000 || Date.parse(header) - Date.now() || 0;
            cooldownUntil = Date.now() + Math.max(after, Math.min(30000, 2000 * 2 ** Math.min(failures, 4)));
          }
          throw error;
        }
        failures = 0;
        return data;
      } catch (error) {
        failures += 1;
        throw error;
      } finally { window.clearTimeout(timeout); }
    })();
    if (!read) return request;
    const entry = { promise: request, pending: true, at: Date.now() };
    reads.set(url, entry);
    request.then(() => { entry.pending = false; entry.at = Date.now(); }, () => { if (reads.get(url) === entry) reads.delete(url); });
    return request;
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

  function isFresh(state, maxAgeMs = 45000) {
    const time = new Date(state?.updatedAt || 0).getTime();
    return Number.isFinite(time) && Date.now() - time <= maxAgeMs;
  }

  async function fetchPresenter(sessionCode) {
    const code = normalizeSessionCode(sessionCode);
    if (!code) return null;
    const query = `sessionCode=${encodeURIComponent(code)}`;
    const data = await apiJson(`${ENDPOINTS.session}?${query}`, { cache: "no-store" });
    return data.session ? stateFromRow(data.session) : null;
  }

  async function fetchCommand(sessionCode) {
    const code = normalizeSessionCode(sessionCode);
    if (!code) return null;
    const query = `sessionCode=${encodeURIComponent(code)}`;
    const data = await apiJson(`${ENDPOINTS.command}?${query}`, { cache: "no-store" });
    return data.command ? stateFromRow(data.command) : null;
  }

  async function fetchRows(sessionCode, { judges = true, command = true } = {}) {
    const code = normalizeSessionCode(sessionCode);
    if (!code) return [];

    const query = `sessionCode=${encodeURIComponent(code)}`;
    const requests = [
      apiJson(`${ENDPOINTS.session}?${query}`, { cache: "no-store" }),
      judges ? apiJson(`${ENDPOINTS.judge}?${query}`, { cache: "no-store" }) : Promise.resolve({}),
      command ? apiJson(`${ENDPOINTS.command}?${query}`, { cache: "no-store" }) : Promise.resolve({})
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

    const result = await apiJson(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sessionCode: code,
        actorId: safeActor,
        state: payloadState
      })
    });
    reads.clear();
    const stored = result.session || result.command || result.judge;
    if (!stored || stored.role !== role || normalizeSessionCode(stored.sessionCode) !== code) {
      throw new Error("The cloud did not confirm this save.");
    }
    channelFor(code)?.postMessage({ sessionCode: code, role, state: stored });
    return result;
  }

  async function fetchJudges(sessionCode) {
    const code = normalizeSessionCode(sessionCode);
    if (!code) return [];
    const data = await apiJson(`${ENDPOINTS.judge}?sessionCode=${encodeURIComponent(code)}`, { cache: "no-store" });
    return Array.isArray(data.items) ? data.items : [];
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
    subscribe,
    retryDelay,
    pollDelay,
    fetchJudges,
    API_BASE,
    ENDPOINTS,
    normalizeSessionCode,
    getDeviceId,
    stateFromRow,
    roleStates,
    latestRoleState,
    presenterState,
    isFresh,
    fetchPresenter,
    fetchCommand,
    fetchRows,
    writeState,
    loadWordList,
    loadRemainingPools,
    loadWordData,
    getWordInfo
  };
})();
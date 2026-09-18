/*
  BRIGHTON SPELLING BEE — DEDICATED WIX VELO BACKEND

  Add these functions to Backend > http-functions.js in the Wix project that will
  host the Spelling Bee API. They use three dedicated CMS collections and do not
  read or write ExamProgress, ExamResults, TestResults, or any Speaking collection.

  Required collection IDs:
    - SpellingBeeSessions
    - SpellingBeeJudges
    - SpellingBeeCommands

  Endpoints:
    GET/POST /_functions/spellingBeeSession
    GET/POST /_functions/spellingBeeJudge
    GET/POST /_functions/spellingBeeCommand
*/

import wixData from "wix-data";
import {
  ok,
  badRequest,
  serverError,
  response
} from "wix-http-functions";

const SESSIONS = "SpellingBeeSessions";
const JUDGES = "SpellingBeeJudges";
const COMMANDS = "SpellingBeeCommands";

const CORS_HEADERS = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*"
};

function spellingJsonOK(data) {
  return ok({
    headers: CORS_HEADERS,
    body: JSON.stringify({ success: true, ...data })
  });
}

function spellingBadRequest(message) {
  return badRequest({
    headers: CORS_HEADERS,
    body: JSON.stringify({ success: false, error: message })
  });
}

function spellingServerError(error) {
  return serverError({
    headers: CORS_HEADERS,
    body: JSON.stringify({
      success: false,
      error: error && error.message ? error.message : String(error)
    })
  });
}

function spellingOptions(methods) {
  return response({
    status: 204,
    headers: {
      ...CORS_HEADERS,
      "Access-Control-Allow-Methods": `${methods}, OPTIONS`,
      "Access-Control-Allow-Headers": "Content-Type"
    }
  });
}

function spellingText(value, max = 5000) {
  return String(value ?? "").trim().slice(0, max);
}

function spellingSessionCode(value) {
  return String(value ?? "").replace(/\D+/g, "").slice(0, 20);
}

function spellingActorId(value) {
  return String(value || "main")
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48) || "main";
}

function spellingNumber(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function spellingDate(value, fallback = null) {
  if (!value) return fallback;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? fallback : date;
}

function spellingParseJson(value, fallback) {
  if (value && typeof value === "object") return value;
  try {
    return JSON.parse(String(value || ""));
  } catch {
    return fallback;
  }
}

async function spellingReadBody(request) {
  try {
    return await request.body.json();
  } catch (jsonError) {
    try {
      const text = await request.body.text();
      return JSON.parse(text || "{}");
    } catch (textError) {
      return {};
    }
  }
}

async function spellingFindSession(sessionCode) {
  const result = await wixData
    .query(SESSIONS)
    .eq("sessionCode", sessionCode)
    .limit(1)
    .find({ suppressAuth: true });

  return result.items[0] || null;
}

async function spellingUpsert(collectionId, keyField, keyValue, nextItem) {
  const result = await wixData
    .query(collectionId)
    .eq(keyField, keyValue)
    .limit(1)
    .find({ suppressAuth: true });

  if (result.items.length) {
    return wixData.update(
      collectionId,
      { ...result.items[0], ...nextItem },
      { suppressAuth: true }
    );
  }

  return wixData.insert(collectionId, nextItem, { suppressAuth: true });
}

function spellingSessionState(item) {
  if (!item) return null;

  const state = spellingParseJson(item.presenterStateJson, {});
  return {
    __spellingBee: 1,
    version: 2,
    ...state,
    role: "presenter",
    actorId: "main",
    sessionCode: item.sessionCode,
    level: item.level || state.level || "",
    difficulty: item.difficulty || state.difficulty || "easy",
    word: item.currentWord || state.word || "",
    wordToken: item.wordToken || state.wordToken || "",
    wordSequence: spellingNumber(item.wordSequence, state.wordSequence || 0),
    poolCount: spellingNumber(item.poolCount, state.poolCount || 0),
    lastCommandSeq: spellingNumber(item.lastCommandSeq, state.lastCommandSeq || 0),
    usedWords: spellingParseJson(item.usedWordsJson, state.usedWords || {}),
    startedAt: item.startedAt || state.startedAt || null,
    updatedAt: item.presenterUpdatedAt || item._updatedDate || null
  };
}

function spellingJudgeState(item) {
  const state = spellingParseJson(item.judgeStateJson, {});
  return {
    __spellingBee: 1,
    version: 2,
    ...state,
    role: "judge",
    actorId: item.actorId || state.actorId || "",
    sessionCode: item.sessionCode,
    word: item.currentWord || state.word || "",
    wordToken: item.wordToken || state.wordToken || "",
    wordSequence: spellingNumber(item.wordSequence, state.wordSequence || 0),
    verdict: item.verdict || state.verdict || "pending",
    pointer: spellingNumber(item.pointer, state.pointer || 0),
    voteSeq: spellingNumber(item.voteSeq, state.voteSeq || 0),
    letterMarks: spellingParseJson(item.letterMarksJson, state.letterMarks || []),
    startedAt: item.startedAt || state.startedAt || null,
    updatedAt: item.judgeUpdatedAt || item._updatedDate || null
  };
}

function spellingCommandState(item) {
  if (!item) return null;

  const state = spellingParseJson(item.commandStateJson, {});
  return {
    __spellingBee: 1,
    version: 2,
    ...state,
    role: "remote",
    actorId: item.actorId || state.actorId || "main",
    sessionCode: item.sessionCode,
    word: item.currentWord || state.word || "",
    wordToken: item.wordToken || state.wordToken || "",
    wordSequence: spellingNumber(item.wordSequence, state.wordSequence || 0),
    commandSeq: spellingNumber(item.commandSeq, state.commandSeq || 0),
    commandType: item.commandType || state.commandType || "",
    value: item.commandValue ?? state.value ?? "",
    startedAt: item.startedAt || state.startedAt || null,
    updatedAt: item.commandUpdatedAt || item._updatedDate || null
  };
}

function spellingEnsureState(body, role) {
  const sessionCode = spellingSessionCode(body.sessionCode || body.state?.sessionCode);
  if (!sessionCode) {
    return { error: "A numerical sessionCode is required." };
  }

  const state = body.state && typeof body.state === "object" ? body.state : {};
  return {
    sessionCode,
    actorId: spellingActorId(body.actorId || state.actorId || (role === "presenter" ? "main" : "")),
    state: {
      __spellingBee: 1,
      version: 2,
      ...state,
      role,
      sessionCode
    }
  };
}

export function options_spellingBeeSession() {
  return spellingOptions("GET, POST");
}

export function options_spellingBeeJudge() {
  return spellingOptions("GET, POST");
}

export function options_spellingBeeCommand() {
  return spellingOptions("GET, POST");
}

export async function get_spellingBeeSession(request) {
  try {
    const sessionCode = spellingSessionCode(request.query.sessionCode);
    if (!sessionCode) return spellingBadRequest("sessionCode is required.");

    const item = await spellingFindSession(sessionCode);
    return spellingJsonOK({ session: spellingSessionState(item) });
  } catch (error) {
    console.error("get_spellingBeeSession failed:", error);
    return spellingServerError(error);
  }
}

export async function post_spellingBeeSession(request) {
  try {
    const body = await spellingReadBody(request);
    const parsed = spellingEnsureState(body, "presenter");
    if (parsed.error) return spellingBadRequest(parsed.error);

    const { sessionCode, state } = parsed;
    const now = new Date();

    const item = {
      title: `Spelling Bee Session ${sessionCode}`,
      sessionCode,
      status: "open",
      level: spellingText(state.level, 32),
      difficulty: ["easy", "medium", "hard"].includes(state.difficulty) ? state.difficulty : "easy",
      currentWord: spellingText(state.word, 256),
      wordToken: spellingText(state.wordToken, 500),
      wordSequence: spellingNumber(state.wordSequence, 0),
      poolCount: spellingNumber(state.poolCount, 0),
      lastCommandSeq: spellingNumber(state.lastCommandSeq, 0),
      usedWordsJson: JSON.stringify(state.usedWords || {}),
      presenterStateJson: JSON.stringify(state),
      presenterUpdatedAt: now,
      startedAt: spellingDate(state.startedAt, now)
    };

    const saved = await spellingUpsert(SESSIONS, "sessionCode", sessionCode, item);

    return spellingJsonOK({
      session: spellingSessionState(saved),
      collection: SESSIONS
    });
  } catch (error) {
    console.error("post_spellingBeeSession failed:", error);
    return spellingServerError(error);
  }
}

export async function get_spellingBeeJudge(request) {
  try {
    const sessionCode = spellingSessionCode(request.query.sessionCode);
    if (!sessionCode) return spellingBadRequest("sessionCode is required.");

    const result = await wixData
      .query(JUDGES)
      .eq("sessionCode", sessionCode)
      .descending("judgeUpdatedAt")
      .limit(100)
      .find({ suppressAuth: true });

    return spellingJsonOK({
      items: result.items.map(spellingJudgeState),
      collection: JUDGES
    });
  } catch (error) {
    console.error("get_spellingBeeJudge failed:", error);
    return spellingServerError(error);
  }
}

export async function post_spellingBeeJudge(request) {
  try {
    const body = await spellingReadBody(request);
    const parsed = spellingEnsureState(body, "judge");
    if (parsed.error) return spellingBadRequest(parsed.error);

    const { sessionCode, actorId, state } = parsed;
    const session = await spellingFindSession(sessionCode);
    if (!session) return spellingBadRequest("Presenter session not found.");

    const now = new Date();
    const recordKey = `${sessionCode}|${actorId}`;

    const item = {
      title: `Judge ${actorId} · ${sessionCode}`,
      recordKey,
      sessionCode,
      actorId,
      level: spellingText(state.level, 32),
      difficulty: spellingText(state.difficulty, 16),
      currentWord: spellingText(state.word, 256),
      wordToken: spellingText(state.wordToken, 500),
      wordSequence: spellingNumber(state.wordSequence, 0),
      verdict: ["correct", "incorrect", "pending"].includes(state.verdict) ? state.verdict : "pending",
      pointer: spellingNumber(state.pointer, 0),
      voteSeq: spellingNumber(state.voteSeq, 0),
      letterMarksJson: JSON.stringify(Array.isArray(state.letterMarks) ? state.letterMarks : []),
      judgeStateJson: JSON.stringify(state),
      judgeUpdatedAt: now,
      startedAt: spellingDate(state.startedAt, now)
    };

    const saved = await spellingUpsert(JUDGES, "recordKey", recordKey, item);

    return spellingJsonOK({
      judge: spellingJudgeState(saved),
      collection: JUDGES
    });
  } catch (error) {
    console.error("post_spellingBeeJudge failed:", error);
    return spellingServerError(error);
  }
}

export async function get_spellingBeeCommand(request) {
  try {
    const sessionCode = spellingSessionCode(request.query.sessionCode);
    if (!sessionCode) return spellingBadRequest("sessionCode is required.");

    const result = await wixData
      .query(COMMANDS)
      .eq("sessionCode", sessionCode)
      .limit(1)
      .find({ suppressAuth: true });

    return spellingJsonOK({
      command: spellingCommandState(result.items[0] || null),
      collection: COMMANDS
    });
  } catch (error) {
    console.error("get_spellingBeeCommand failed:", error);
    return spellingServerError(error);
  }
}

export async function post_spellingBeeCommand(request) {
  try {
    const body = await spellingReadBody(request);
    const parsed = spellingEnsureState(body, "remote");
    if (parsed.error) return spellingBadRequest(parsed.error);

    const { sessionCode, actorId, state } = parsed;
    const session = await spellingFindSession(sessionCode);
    if (!session) return spellingBadRequest("Presenter session not found.");

    const commandSeq = spellingNumber(state.commandSeq, 0);
    if (commandSeq <= 0) return spellingBadRequest("commandSeq must be greater than zero.");

    const existingResult = await wixData
      .query(COMMANDS)
      .eq("sessionCode", sessionCode)
      .limit(1)
      .find({ suppressAuth: true });

    const existing = existingResult.items[0] || null;
    if (existing && spellingNumber(existing.commandSeq, 0) >= commandSeq) {
      return spellingJsonOK({
        duplicate: true,
        command: spellingCommandState(existing),
        collection: COMMANDS
      });
    }

    const now = new Date();
    const item = {
      title: `Remote Command ${commandSeq} · ${sessionCode}`,
      sessionCode,
      actorId,
      currentWord: spellingText(state.word, 256),
      wordToken: spellingText(state.wordToken, 500),
      wordSequence: spellingNumber(state.wordSequence, 0),
      commandSeq,
      commandType: spellingText(state.commandType, 32),
      commandValue: spellingText(state.value, 64),
      commandStateJson: JSON.stringify(state),
      commandUpdatedAt: now,
      startedAt: spellingDate(state.startedAt, now)
    };

    let saved;
    if (existing) {
      saved = await wixData.update(
        COMMANDS,
        { ...existing, ...item },
        { suppressAuth: true }
      );
    } else {
      saved = await wixData.insert(COMMANDS, item, { suppressAuth: true });
    }

    return spellingJsonOK({
      command: spellingCommandState(saved),
      collection: COMMANDS
    });
  } catch (error) {
    console.error("post_spellingBeeCommand failed:", error);
    return spellingServerError(error);
  }
}

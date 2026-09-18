import wixData from "wix-data";
import {
  jsonOK,
  jsonBadRequest,
  jsonServerError,
  cleanText,
  cleanNumber,
  cleanDate,
  parseJson,
  readJsonBody,
  findOne,
  upsertOne
} from "./core.js";

const SESSIONS = "SpellingBeeSessions";
const JUDGES = "SpellingBeeJudges";
const COMMANDS = "SpellingBeeCommands";

function sessionCode(value) {
  return String(value ?? "").replace(/\D+/g, "").slice(0, 20);
}

function actorId(value) {
  return String(value || "main")
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48) || "main";
}

async function findSession(code) {
  return findOne(SESSIONS, "sessionCode", code);
}

function sessionState(item) {
  if (!item) return null;
  const state = parseJson(item.presenterStateJson, {});

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
    wordSequence: cleanNumber(item.wordSequence, state.wordSequence || 0),
    poolCount: cleanNumber(item.poolCount, state.poolCount || 0),
    lastCommandSeq: cleanNumber(item.lastCommandSeq, state.lastCommandSeq || 0),
    usedWords: parseJson(item.usedWordsJson, state.usedWords || {}),
    startedAt: item.startedAt || state.startedAt || null,
    updatedAt: item.presenterUpdatedAt || item._updatedDate || null
  };
}

function judgeState(item) {
  if (!item) return null;
  const state = parseJson(item.judgeStateJson, {});

  return {
    __spellingBee: 1,
    version: 2,
    ...state,
    role: "judge",
    actorId: item.actorId || state.actorId || "",
    sessionCode: item.sessionCode,
    word: item.currentWord || state.word || "",
    wordToken: item.wordToken || state.wordToken || "",
    wordSequence: cleanNumber(item.wordSequence, state.wordSequence || 0),
    verdict: item.verdict || state.verdict || "pending",
    pointer: cleanNumber(item.pointer, state.pointer || 0),
    voteSeq: cleanNumber(item.voteSeq, state.voteSeq || 0),
    letterMarks: parseJson(item.letterMarksJson, state.letterMarks || []),
    startedAt: item.startedAt || state.startedAt || null,
    updatedAt: item.judgeUpdatedAt || item._updatedDate || null
  };
}

function commandState(item) {
  if (!item) return null;
  const state = parseJson(item.commandStateJson, {});

  return {
    __spellingBee: 1,
    version: 2,
    ...state,
    role: "remote",
    actorId: item.actorId || state.actorId || "main",
    sessionCode: item.sessionCode,
    word: item.currentWord || state.word || "",
    wordToken: item.wordToken || state.wordToken || "",
    wordSequence: cleanNumber(item.wordSequence, state.wordSequence || 0),
    commandSeq: cleanNumber(item.commandSeq, state.commandSeq || 0),
    commandType: item.commandType || state.commandType || "",
    value: item.commandValue ?? state.value ?? "",
    startedAt: item.startedAt || state.startedAt || null,
    updatedAt: item.commandUpdatedAt || item._updatedDate || null
  };
}

function prepareState(body, role) {
  const code = sessionCode(body.sessionCode || body.state?.sessionCode);

  if (!code) {
    return { error: "A numerical sessionCode is required." };
  }

  const state =
    body.state && typeof body.state === "object"
      ? body.state
      : {};

  return {
    sessionCode: code,
    actorId: actorId(
      body.actorId ||
      state.actorId ||
      (role === "presenter" ? "main" : "")
    ),
    state: {
      __spellingBee: 1,
      version: 2,
      ...state,
      role,
      sessionCode: code
    }
  };
}

export async function getSession(request) {
  try {
    const code = sessionCode(request.query.sessionCode);
    if (!code) return jsonBadRequest("sessionCode is required.");

    const item = await findSession(code);
    return jsonOK({ session: sessionState(item) });
  } catch (error) {
    console.error("Spelling Bee getSession:", error);
    return jsonServerError(error);
  }
}

export async function saveSession(request) {
  try {
    const body = await readJsonBody(request);
    const parsed = prepareState(body, "presenter");
    if (parsed.error) return jsonBadRequest(parsed.error);

    const { sessionCode: code, state } = parsed;
    const now = new Date();

    const item = {
      title: `Spelling Bee Session ${code}`,
      sessionCode: code,
      status: "open",
      level: cleanText(state.level, 32),
      difficulty: ["easy", "medium", "hard"].includes(state.difficulty)
        ? state.difficulty
        : "easy",
      currentWord: cleanText(state.word, 256),
      wordToken: cleanText(state.wordToken, 500),
      wordSequence: cleanNumber(state.wordSequence, 0),
      poolCount: cleanNumber(state.poolCount, 0),
      lastCommandSeq: cleanNumber(state.lastCommandSeq, 0),
      usedWordsJson: JSON.stringify(state.usedWords || {}),
      presenterStateJson: JSON.stringify(state),
      presenterUpdatedAt: now,
      startedAt: cleanDate(state.startedAt, now)
    };

    const saved = await upsertOne(SESSIONS, "sessionCode", code, item);

    return jsonOK({
      session: sessionState(saved),
      collection: SESSIONS
    });
  } catch (error) {
    console.error("Spelling Bee saveSession:", error);
    return jsonServerError(error);
  }
}

export async function getJudges(request) {
  try {
    const code = sessionCode(request.query.sessionCode);
    if (!code) return jsonBadRequest("sessionCode is required.");

    const result = await wixData
      .query(JUDGES)
      .eq("sessionCode", code)
      .descending("judgeUpdatedAt")
      .limit(100)
      .find({ suppressAuth: true });

    return jsonOK({
      items: result.items.map(judgeState),
      collection: JUDGES
    });
  } catch (error) {
    console.error("Spelling Bee getJudges:", error);
    return jsonServerError(error);
  }
}

export async function saveJudge(request) {
  try {
    const body = await readJsonBody(request);
    const parsed = prepareState(body, "judge");
    if (parsed.error) return jsonBadRequest(parsed.error);

    const {
      sessionCode: code,
      actorId: judgeActorId,
      state
    } = parsed;

    const presenter = await findSession(code);
    if (!presenter) {
      return jsonBadRequest("Presenter session not found.");
    }

    const now = new Date();
    const recordKey = `${code}|${judgeActorId}`;

    const item = {
      title: `Judge ${judgeActorId} · ${code}`,
      recordKey,
      sessionCode: code,
      actorId: judgeActorId,
      level: cleanText(state.level, 32),
      difficulty: cleanText(state.difficulty, 16),
      currentWord: cleanText(state.word, 256),
      wordToken: cleanText(state.wordToken, 500),
      wordSequence: cleanNumber(state.wordSequence, 0),
      verdict: ["correct", "incorrect", "pending"].includes(state.verdict)
        ? state.verdict
        : "pending",
      pointer: cleanNumber(state.pointer, 0),
      voteSeq: cleanNumber(state.voteSeq, 0),
      letterMarksJson: JSON.stringify(
        Array.isArray(state.letterMarks)
          ? state.letterMarks
          : []
      ),
      judgeStateJson: JSON.stringify(state),
      judgeUpdatedAt: now,
      startedAt: cleanDate(state.startedAt, now)
    };

    const saved = await upsertOne(
      JUDGES,
      "recordKey",
      recordKey,
      item
    );

    return jsonOK({
      judge: judgeState(saved),
      collection: JUDGES
    });
  } catch (error) {
    console.error("Spelling Bee saveJudge:", error);
    return jsonServerError(error);
  }
}

export async function getCommand(request) {
  try {
    const code = sessionCode(request.query.sessionCode);
    if (!code) return jsonBadRequest("sessionCode is required.");

    const item = await findOne(
      COMMANDS,
      "sessionCode",
      code
    );

    return jsonOK({
      command: commandState(item),
      collection: COMMANDS
    });
  } catch (error) {
    console.error("Spelling Bee getCommand:", error);
    return jsonServerError(error);
  }
}

export async function saveCommand(request) {
  try {
    const body = await readJsonBody(request);
    const parsed = prepareState(body, "remote");
    if (parsed.error) return jsonBadRequest(parsed.error);

    const {
      sessionCode: code,
      actorId: remoteActorId,
      state
    } = parsed;

    const presenter = await findSession(code);
    if (!presenter) {
      return jsonBadRequest("Presenter session not found.");
    }

    const commandSeq = cleanNumber(state.commandSeq, 0);
    if (commandSeq <= 0) {
      return jsonBadRequest("commandSeq must be greater than zero.");
    }

    const existing = await findOne(
      COMMANDS,
      "sessionCode",
      code
    );

    if (
      existing &&
      cleanNumber(existing.commandSeq, 0) >= commandSeq
    ) {
      return jsonOK({
        duplicate: true,
        command: commandState(existing),
        collection: COMMANDS
      });
    }

    const now = new Date();

    const item = {
      title: `Remote Command ${commandSeq} · ${code}`,
      sessionCode: code,
      actorId: remoteActorId,
      currentWord: cleanText(state.word, 256),
      wordToken: cleanText(state.wordToken, 500),
      wordSequence: cleanNumber(state.wordSequence, 0),
      commandSeq,
      commandType: cleanText(state.commandType, 32),
      commandValue: cleanText(state.value, 64),
      commandStateJson: JSON.stringify(state),
      commandUpdatedAt: now,
      startedAt: cleanDate(state.startedAt, now)
    };

    const saved = await upsertOne(
      COMMANDS,
      "sessionCode",
      code,
      item
    );

    return jsonOK({
      command: commandState(saved),
      collection: COMMANDS
    });
  } catch (error) {
    console.error("Spelling Bee saveCommand:", error);
    return jsonServerError(error);
  }
}

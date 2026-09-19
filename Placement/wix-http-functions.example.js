// Brighton Placement
// Copy into the existing Wix backend/http-functions.js file.
// Keep shared imports only once if that file already imports them.

import wixData from "wix-data";
import {
  ok,
  badRequest,
  serverError,
  response
} from "wix-http-functions";

const PLACEMENT_SESSIONS = "PlacementSessions";
const PLACEMENT_RESPONSES = "PlacementResponses";
const PLACEMENT_ITEMS = "PlacementItems";
const PLACEMENT_VERSION = "2026-09-19.5";

const CORS_HEADERS = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*"
};

function placementJsonOK(data) {
  return ok({
    headers: CORS_HEADERS,
    body: JSON.stringify(data)
  });
}

function placementBadRequest(message) {
  return badRequest({
    headers: CORS_HEADERS,
    body: JSON.stringify({ success: false, error: message })
  });
}

function placementServerError(error) {
  return serverError({
    headers: CORS_HEADERS,
    body: JSON.stringify({
      success: false,
      error: error?.message || String(error)
    })
  });
}

function safeJson(value, fallback) {
  try {
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
}

function cleanAnswers(value) {
  if (!Array.isArray(value)) return [];
  const seen = new Set();

  return value
    .slice(0, 12)
    .map((answer) => ({
      itemId: String(answer?.itemId || "").trim(),
      optionId: String(answer?.optionId || "").trim(),
      responseTimeMs: Math.max(0, Math.min(120000, Number(answer?.responseTimeMs) || 0)),
      plays: Math.max(0, Math.min(3, Number(answer?.plays) || 0))
    }))
    .filter((answer) => {
      if (!answer.itemId || !answer.optionId || seen.has(answer.itemId)) return false;
      seen.add(answer.itemId);
      return true;
    });
}

function routeAfterCalibration(correct) {
  if (correct <= 1) return "lang-a1";
  if (correct === 2) return "lang-a2";
  if (correct === 3) return "lang-b1";
  return "lang-b2";
}

function estimateAfterLanguage(moduleId, correct) {
  if (moduleId === "lang-a1") {
    if (correct <= 1) return "PRE-A1";
    if (correct <= 3) return "A1";
    return "A2";
  }

  if (moduleId === "lang-a2") {
    if (correct <= 1) return "A1";
    if (correct <= 3) return "A2";
    return "B1";
  }

  if (moduleId === "lang-b1") {
    if (correct <= 1) return "A2";
    if (correct <= 3) return "B1";
    if (correct === 4) return "B1+";
    return "B2";
  }

  if (moduleId === "lang-b2") {
    if (correct <= 1) return "B1";
    if (correct === 2) return "B1+";
    if (correct <= 4) return "B2";
    return "C1";
  }

  return "A2";
}

const LEVELS = ["PRE-A1", "A1", "A2", "B1", "B1+", "B2", "C1"];

const SPEAKING_LEVEL_BY_MODULE = {
  "speaking-prea1": "PRE-A1",
  "speaking-a1": "A1",
  "speaking-a2": "A2",
  "speaking-b1": "B1",
  "speaking-b1plus": "B1+",
  "speaking-b2": "B2",
  "speaking-c1": "C1"
};

const SPEAKING_PROMPT_BY_MODULE = {
  "speaking-prea1": "sp-prea1-01",
  "speaking-a1": "sp-a1-01",
  "speaking-a2": "sp-a2-01",
  "speaking-b1": "sp-b1-01",
  "speaking-b1plus": "sp-b1plus-01",
  "speaking-b2": "sp-b2-01",
  "speaking-c1": "sp-c1-01"
};

const SPEAKING_PROFILES = {
  "PRE-A1": { minSeconds: 12, targetSeconds: 20, targetWords: 12, wpmLow: 25, wpmHigh: 100, uniqueTarget: .72, longWordTarget: .02, connectorTarget: 0, complexTarget: 0, segmentTarget: 1 },
  "A1":     { minSeconds: 15, targetSeconds: 25, targetWords: 20, wpmLow: 35, wpmHigh: 110, uniqueTarget: .68, longWordTarget: .03, connectorTarget: 1, complexTarget: 0, segmentTarget: 2 },
  "A2":     { minSeconds: 20, targetSeconds: 35, targetWords: 32, wpmLow: 45, wpmHigh: 125, uniqueTarget: .63, longWordTarget: .05, connectorTarget: 2, complexTarget: 1, segmentTarget: 2 },
  "B1":     { minSeconds: 25, targetSeconds: 40, targetWords: 45, wpmLow: 55, wpmHigh: 145, uniqueTarget: .60, longWordTarget: .07, connectorTarget: 3, complexTarget: 2, segmentTarget: 3 },
  "B1+":    { minSeconds: 30, targetSeconds: 45, targetWords: 55, wpmLow: 60, wpmHigh: 155, uniqueTarget: .58, longWordTarget: .08, connectorTarget: 4, complexTarget: 3, segmentTarget: 3 },
  "B2":     { minSeconds: 35, targetSeconds: 50, targetWords: 65, wpmLow: 65, wpmHigh: 165, uniqueTarget: .56, longWordTarget: .10, connectorTarget: 5, complexTarget: 4, segmentTarget: 4 },
  "C1":     { minSeconds: 40, targetSeconds: 55, targetWords: 75, wpmLow: 70, wpmHigh: 175, uniqueTarget: .54, longWordTarget: .12, connectorTarget: 6, complexTarget: 5, segmentTarget: 4 }
};

const CONNECTOR_WORDS = new Set([
  "and", "but", "because", "so", "although", "however", "therefore", "while",
  "whereas", "instead", "also", "first", "second", "finally", "unless", "despite",
  "though", "since", "then", "besides", "moreover", "furthermore", "otherwise"
]);

const COMPLEX_MARKERS = new Set([
  "although", "however", "therefore", "whereas", "unless", "despite", "though",
  "because", "while", "which", "who", "whose", "whether", "if", "since", "rather"
]);

function levelSlug(level) {
  return String(level || "A2").toLowerCase().replace("+", "plus").replace(/[^a-z0-9]+/g, "");
}

function readingModuleFor(level) {
  return `reading-${levelSlug(level)}`;
}

function listeningModuleFor(level) {
  return `listening-${levelSlug(level)}`;
}

function speakingModuleFor(level) {
  return `speaking-${levelSlug(level)}`;
}

function adjustAfterReading(level, correct) {
  const currentIndex = Math.max(0, LEVELS.indexOf(level));
  if (correct <= 1) return LEVELS[Math.max(0, currentIndex - 1)];
  if (correct === 4) return LEVELS[Math.min(LEVELS.length - 1, currentIndex + 1)];
  return LEVELS[currentIndex];
}

function adjustAfterListening(level, correct) {
  const currentIndex = Math.max(0, LEVELS.indexOf(level));
  if (correct === 0) return LEVELS[Math.max(0, currentIndex - 1)];
  if (correct === 3) return LEVELS[Math.min(LEVELS.length - 1, currentIndex + 1)];
  return LEVELS[currentIndex];
}

function expectedAnswerCount(moduleId) {
  if (/^listening-/.test(moduleId)) return 3;
  if (/^reading-/.test(moduleId)) return 4;
  return 5;
}

function clamp(value, min = 0, max = 1) {
  return Math.min(max, Math.max(min, Number(value) || 0));
}

function round1(value) {
  return Math.round((Number(value) || 0) * 10) / 10;
}

function tokeniseTranscript(transcript) {
  return String(transcript || "")
    .toLowerCase()
    .match(/[a-z]+(?:'[a-z]+)?/g) || [];
}

function countPhrase(text, phrase) {
  const source = String(text || "").toLowerCase();
  const needle = String(phrase || "").toLowerCase();
  if (!needle) return 0;
  return Math.max(0, source.split(needle).length - 1);
}

function paceScore(wpm, low, high) {
  if (!wpm) return 0;
  if (wpm < low) return clamp(wpm / low);
  if (wpm > high) return clamp(high / wpm);
  return 1;
}

function gradeSpeakingDeterministically(payload, level) {
  const profile = SPEAKING_PROFILES[level] || SPEAKING_PROFILES.A2;

  const transcript = String(payload.transcript || "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 5000);

  const tokens = tokeniseTranscript(transcript);
  const wordCount = tokens.length;
  const uniqueWords = new Set(tokens).size;
  const uniqueRatio = wordCount ? uniqueWords / wordCount : 0;
  const longWordRatio = wordCount ? tokens.filter((word) => word.length >= 7).length / wordCount : 0;
  const connectorCount = tokens.filter((word) => CONNECTOR_WORDS.has(word)).length;
  const complexCount = tokens.filter((word) => COMPLEX_MARKERS.has(word)).length;

  const fillerCount =
    tokens.filter((word) => ["um", "uh", "erm", "hmm"].includes(word)).length +
    countPhrase(transcript, "you know") +
    countPhrase(transcript, "i mean");

  const durationSeconds = clamp(payload.durationSeconds, 0, 180);
  const speechSeconds = clamp(payload.speechSeconds, 0, 180);
  const speechRatio = clamp(payload.speechRatio, 0, 1);
  const recognitionConfidence = clamp(payload.recognitionConfidence, 0, 1);
  const segmentCount = Math.max(0, Math.min(100, Number(payload.segmentCount) || 0));
  const recordedBytes = Math.max(0, Number(payload.recordedBytes) || 0);
  const transcriptAvailable = Boolean(payload.transcriptAvailable && transcript);

  const wpm = durationSeconds > 0 ? wordCount / (durationSeconds / 60) : 0;
  const durationScore = clamp(durationSeconds / profile.targetSeconds);
  const minimumDurationScore = clamp(durationSeconds / profile.minSeconds);
  const speechActivityScore = clamp((speechRatio - .16) / .62);
  const speedScore = paceScore(wpm, profile.wpmLow, profile.wpmHigh);
  const wordScore = clamp(wordCount / profile.targetWords);
  const lexicalScore = clamp(uniqueRatio / profile.uniqueTarget);
  const longWordScore = profile.longWordTarget ? clamp(longWordRatio / profile.longWordTarget) : 1;
  const connectorScore = profile.connectorTarget ? clamp(connectorCount / profile.connectorTarget) : 1;
  const complexScore = profile.complexTarget ? clamp(complexCount / profile.complexTarget) : 1;
  const segmentScore = clamp(segmentCount / profile.segmentTarget);
  const fillerRate = wordCount ? fillerCount / wordCount : 1;

  const fluency = clamp(
    10 * (.34 * durationScore + .36 * speechActivityScore + .30 * speedScore) -
    Math.min(2, fillerRate * 28),
    0,
    10
  );

  // Range proxy only: this does not detect grammatical errors.
  const grammar = clamp(
    10 * (.42 * wordScore + .38 * complexScore + .20 * segmentScore),
    0,
    10
  );

  const vocabulary = clamp(
    10 * (.40 * wordScore + .38 * lexicalScore + .22 * longWordScore),
    0,
    10
  );

  // No pronunciation AI is used. This is an intelligibility proxy.
  const recognitionSignal = recognitionConfidence > 0
    ? recognitionConfidence
    : (transcriptAvailable ? .72 : .20);

  const pronunciation = clamp(
    10 * (.48 * recognitionSignal + .30 * speechActivityScore + .22 * speedScore),
    0,
    10
  );

  // Coherence/task-completion proxy; no semantic AI grading is used.
  const communication = clamp(
    10 * (.46 * wordScore + .34 * connectorScore + .20 * segmentScore),
    0,
    10
  );

  const composite = round1(
    fluency * .25 +
    grammar * .20 +
    vocabulary * .20 +
    pronunciation * .15 +
    communication * .20
  );

  const reviewRequired =
    !transcriptAvailable ||
    wordCount < 5 ||
    durationSeconds < profile.minSeconds * .72 ||
    speechRatio < .25 ||
    recordedBytes < 4000;

  const currentIndex = Math.max(0, LEVELS.indexOf(level));
  let speakingLevel = level;

  if (!reviewRequired && composite >= 7.6 && wordCount >= profile.targetWords * .78) {
    speakingLevel = LEVELS[Math.min(LEVELS.length - 1, currentIndex + 1)];
  } else if (!reviewRequired && composite < 4.4) {
    speakingLevel = LEVELS[Math.max(0, currentIndex - 1)];
  }

  const finalLevel = reviewRequired ? level : speakingLevel;
  const shifted = finalLevel !== level;
  const borderline = !reviewRequired && (
    shifted ||
    (composite >= 4.4 && composite < 5.1) ||
    (composite >= 7.0 && composite < 7.6)
  );

  const status = reviewRequired
    ? "REVIEW RECOMMENDED"
    : borderline
      ? "BORDERLINE PLACEMENT"
      : "CONFIRMED PLACEMENT";

  const confidence = round1(clamp(
    reviewRequired
      ? .45
      : .60 + .16 * minimumDurationScore + .14 * speechActivityScore + .10 * (transcriptAvailable ? 1 : 0),
    .35,
    .92
  ));

  return {
    transcript,
    wordCount,
    uniqueWords,
    uniqueRatio: round1(uniqueRatio),
    longWordRatio: round1(longWordRatio),
    connectorCount,
    complexCount,
    fillerCount,
    durationSeconds: round1(durationSeconds),
    speechSeconds: round1(speechSeconds),
    speechRatio: round1(speechRatio),
    wpm: round1(wpm),
    recognitionConfidence: round1(recognitionConfidence),
    segmentCount,
    transcriptAvailable,
    fluency: round1(fluency),
    grammar: round1(grammar),
    vocabulary: round1(vocabulary),
    pronunciation: round1(pronunciation),
    communication: round1(communication),
    composite,
    speakingLevel,
    finalLevel,
    reviewRequired,
    status,
    confidence
  };
}

async function getPlacementSession(sessionId, clientSessionId) {
  const session = await wixData.get(PLACEMENT_SESSIONS, sessionId, { suppressAuth: true });

  if (!session || String(session.clientSessionId || "") !== clientSessionId) {
    return null;
  }

  return session;
}

async function getModuleKeys(moduleId, placementVersion) {
  const result = await wixData
    .query(PLACEMENT_ITEMS)
    .eq("moduleId", moduleId)
    .eq("placementVersion", placementVersion)
    .eq("isActive", true)
    .limit(50)
    .find({ suppressAuth: true });

  return result.items;
}

async function saveResponses({
  session,
  moduleId,
  answers,
  keyByItem
}) {
  const existing = await wixData
    .query(PLACEMENT_RESPONSES)
    .eq("sessionId", session._id)
    .eq("moduleId", moduleId)
    .limit(100)
    .find({ suppressAuth: true });

  const storedItems = new Set(existing.items.map((item) => String(item.itemId || "")));
  const now = new Date();

  const inserts = answers
    .filter((answer) => !storedItems.has(answer.itemId))
    .map((answer) => {
      const key = keyByItem.get(answer.itemId);
      const correct = Boolean(key && answer.optionId === String(key.correctOptionId || ""));

      return wixData.insert(
        PLACEMENT_RESPONSES,
        {
          responseKey: `${session._id}:${moduleId}:${answer.itemId}`,
          sessionId: session._id,
          clientSessionId: session.clientSessionId,
          placementVersion: session.placementVersion,
          moduleId,
          phase: session.phase || "language",
          itemId: answer.itemId,
          responseJson: JSON.stringify({
            optionId: answer.optionId,
            plays: answer.plays
          }),
          correct,
          score: correct ? Number(key?.weight) || 1 : 0,
          responseTimeMs: answer.responseTimeMs,
          answeredAt: now
        },
        { suppressAuth: true }
      );
    });

  await Promise.all(inserts);
}

export function options_startPlacement() {
  return response({
    status: 204,
    headers: {
      ...CORS_HEADERS,
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type"
    }
  });
}

export function options_placementStep() {
  return response({
    status: 204,
    headers: {
      ...CORS_HEADERS,
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type"
    }
  });
}

export async function post_startPlacement(request) {
  try {
    const payload = await request.body.json();

    const clientSessionId = String(payload.clientSessionId || "").trim();
    const studentName = String(payload.studentName || "").trim().replace(/\s+/g, " ");

    if (!clientSessionId || clientSessionId.length < 16) {
      return placementBadRequest("Invalid placement session.");
    }

    if (studentName.length < 2 || studentName.length > 90) {
      return placementBadRequest("Invalid student name.");
    }

    const existing = await wixData
      .query(PLACEMENT_SESSIONS)
      .eq("clientSessionId", clientSessionId)
      .limit(1)
      .find({ suppressAuth: true });

    if (existing.items.length) {
      const session = existing.items[0];
      return placementJsonOK({
        success: true,
        sessionId: session._id,
        placementVersion: session.placementVersion || PLACEMENT_VERSION,
        phase: session.phase || "calibration",
        moduleId: session.moduleId || "calibration-01",
        duplicate: true
      });
    }

    const now = new Date();
    const inserted = await wixData.insert(
      PLACEMENT_SESSIONS,
      {
        clientSessionId,
        studentName,
        placementVersion: PLACEMENT_VERSION,
        status: "active",
        phase: "calibration",
        moduleId: "calibration-01",
        routeJson: JSON.stringify(["calibration-01"]),
        progressJson: JSON.stringify({
          stage: 1,
          totalStages: 4,
          calibrationStarted: true
        }),
        startedAt: now,
        updatedAt: now,
        timeSpentSeconds: 0,
        provisionalLevel: "",
        finalLevel: "",
        confidence: 0,
        reviewRequired: false
      },
      { suppressAuth: true }
    );

    return placementJsonOK({
      success: true,
      sessionId: inserted._id,
      placementVersion: PLACEMENT_VERSION,
      phase: "calibration",
      moduleId: "calibration-01"
    });
  } catch (error) {
    console.error("startPlacement failed:", error);
    return placementServerError(error);
  }
}

export async function post_placementStep(request) {
  try {
    const payload = await request.body.json();

    const sessionId = String(payload.sessionId || "").trim();
    const clientSessionId = String(payload.clientSessionId || "").trim();
    const moduleId = String(payload.moduleId || "").trim();
    const answers = cleanAnswers(payload.answers);

    const expectedCount = expectedAnswerCount(moduleId);

    if (!sessionId || !clientSessionId || !moduleId || answers.length !== expectedCount) {
      return placementBadRequest("Incomplete placement module.");
    }

    if (/^listening-/.test(moduleId) && answers.some((answer) => answer.plays < 1)) {
      return placementBadRequest("Each listening question must be played before answering.");
    }

    const session = await getPlacementSession(sessionId, clientSessionId);
    if (!session || session.status !== "active") {
      return placementBadRequest("Placement session not found.");
    }

    if (session.placementVersion !== PLACEMENT_VERSION) {
      return placementBadRequest("Placement version changed. Start a new placement.");
    }

    if (String(session.moduleId || "") !== moduleId) {
      return placementBadRequest("This placement module is no longer active.");
    }

    const keys = await getModuleKeys(moduleId, session.placementVersion);
    const keyByItem = new Map(keys.map((item) => [String(item.itemId || ""), item]));

    if (keyByItem.size < expectedCount || answers.some((answer) => !keyByItem.has(answer.itemId))) {
      throw new Error(`Private answer key is incomplete for ${moduleId}.`);
    }

    const correct = answers.reduce((total, answer) => {
      const key = keyByItem.get(answer.itemId);
      return total + (answer.optionId === String(key.correctOptionId || "") ? 1 : 0);
    }, 0);

    await saveResponses({
      session,
      moduleId,
      answers,
      keyByItem
    });

    const elapsedSeconds = Math.round(
      answers.reduce((total, answer) => total + answer.responseTimeMs, 0) / 1000
    );

    const route = safeJson(session.routeJson, []);
    let nextPhase;
    let nextModuleId;
    let provisionalLevel = String(session.provisionalLevel || "");

    if (moduleId === "calibration-01") {
      nextPhase = "language";
      nextModuleId = routeAfterCalibration(correct);
      route.push(nextModuleId);
    } else if (/^lang-/.test(moduleId)) {
      nextPhase = "reading";
      provisionalLevel = estimateAfterLanguage(moduleId, correct);
      nextModuleId = readingModuleFor(provisionalLevel);
      route.push(nextModuleId);
    } else if (/^reading-/.test(moduleId)) {
      nextPhase = "listening";
      provisionalLevel = adjustAfterReading(provisionalLevel || "A2", correct);
      nextModuleId = listeningModuleFor(provisionalLevel);
      route.push(nextModuleId);
    } else if (/^listening-/.test(moduleId)) {
      nextPhase = "speaking";
      provisionalLevel = adjustAfterListening(provisionalLevel || "A2", correct);
      nextModuleId = speakingModuleFor(provisionalLevel);
      route.push(nextModuleId);
    } else {
      return placementBadRequest("Unsupported placement module.");
    }

    const updated = {
      ...session,
      phase: nextPhase,
      moduleId: nextModuleId,
      routeJson: JSON.stringify(route),
      progressJson: JSON.stringify({
        stage: nextPhase === "speaking" ? 4 : nextPhase === "listening" ? 3 : nextPhase === "reading" ? 2 : 1,
        totalStages: 4,
        lastCompletedModule: moduleId,
        lastModuleScore: correct,
        lastModuleTotal: expectedCount
      }),
      updatedAt: new Date(),
      timeSpentSeconds: Number(session.timeSpentSeconds || 0) + elapsedSeconds,
      provisionalLevel
    };

    await wixData.update(PLACEMENT_SESSIONS, updated, { suppressAuth: true });

    return placementJsonOK({
      success: true,
      completedModuleId: moduleId,
      correct,
      total: expectedCount,
      nextPhase,
      nextModuleId,
      provisionalLevel
    });
  } catch (error) {
    console.error("placementStep failed:", error);
    return placementServerError(error);
  }
}

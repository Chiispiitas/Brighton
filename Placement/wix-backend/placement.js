// Brighton Adaptive Placement — business logic module
// Contract: 2026-09-19.8
// Wix file: Backend/placement.js
//
// Keep HTTP routing in Backend/http-functions.js.
// Keep shared HTTP/CMS helpers in Backend/core.js.

import wixData from "wix-data";
import {
  jsonOK,
  jsonBadRequest,
  jsonServerError,
  readJsonBody
} from "./core.js";

const PLACEMENT_SESSIONS = "BrightonPlacementSessions";
const PLACEMENT_RESPONSES = "BrightonPlacementResponses";
const PLACEMENT_ITEMS = "BrightonPlacementItems";
const PLACEMENT_SPEAKING = "BrightonPlacementSpeaking";

const PLACEMENT_VERSION = "2026-09-19.8";
const ITEM_KEY_VERSION = "2026-09-19.7";

const LEVELS = ["PRE-A1", "A1", "A2", "B1", "B1+", "B2", "C1"];

const LEVEL_DESCRIPTIONS = {
  "PRE-A1": "Starter",
  "A1": "Beginner",
  "A2": "Elementary",
  "B1": "Intermediate",
  "B1+": "Intermediate Plus",
  "B2": "Upper Intermediate",
  "C1": "Advanced"
};

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

function safeJson(value, fallback) {
  try {
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
}

function clamp(value, min = 0, max = 1) {
  return Math.min(max, Math.max(min, Number(value) || 0));
}

function round1(value) {
  return Math.round((Number(value) || 0) * 10) / 10;
}

function isoDate(value) {
  try {
    return value instanceof Date ? value.toISOString() : new Date(value).toISOString();
  } catch {
    return new Date().toISOString();
  }
}

function validateVersion(payload) {
  return !payload?.placementVersion || payload.placementVersion === PLACEMENT_VERSION;
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

function levelSlug(level) {
  return String(level || "A2")
    .toLowerCase()
    .replace("+", "plus")
    .replace(/[^a-z0-9]+/g, "");
}

function levelFromModule(moduleId) {
  const slug = String(moduleId || "").replace(/^[^-]+-/, "");
  const map = {
    prea1: "PRE-A1",
    a1: "A1",
    a2: "A2",
    b1: "B1",
    b1plus: "B1+",
    b2: "B2",
    c1: "C1"
  };
  return map[slug] || "A2";
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
  const index = Math.max(0, LEVELS.indexOf(level));
  if (correct <= 1) return LEVELS[Math.max(0, index - 1)];
  if (correct === 4) return LEVELS[Math.min(LEVELS.length - 1, index + 1)];
  return LEVELS[index];
}

function adjustAfterListening(level, correct) {
  const index = Math.max(0, LEVELS.indexOf(level));
  if (correct === 0) return LEVELS[Math.max(0, index - 1)];
  if (correct === 3) return LEVELS[Math.min(LEVELS.length - 1, index + 1)];
  return LEVELS[index];
}

function expectedAnswerCount(moduleId) {
  if (/^listening-/.test(moduleId)) return 3;
  if (/^reading-/.test(moduleId)) return 4;
  return 5;
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

  const recognitionSignal = recognitionConfidence > 0
    ? recognitionConfidence
    : (transcriptAvailable ? .72 : .20);

  const pronunciation = clamp(
    10 * (.48 * recognitionSignal + .30 * speechActivityScore + .22 * speedScore),
    0,
    10
  );

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

  const inputError =
    !transcriptAvailable ||
    wordCount < 5 ||
    durationSeconds < profile.minSeconds * .72 ||
    speechRatio < .25 ||
    recordedBytes < 4000;

  const currentIndex = Math.max(0, LEVELS.indexOf(level));
  let speakingLevel = level;

  if (!inputError && composite >= 7.6 && wordCount >= profile.targetWords * .78) {
    speakingLevel = LEVELS[Math.min(LEVELS.length - 1, currentIndex + 1)];
  } else if (!inputError && composite < 4.4) {
    speakingLevel = LEVELS[Math.max(0, currentIndex - 1)];
  }

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
    finalLevel: inputError ? level : speakingLevel,
    inputError,
    confidence: round1(clamp(
      .60 +
      .16 * minimumDurationScore +
      .14 * speechActivityScore +
      .10 * (transcriptAvailable ? 1 : 0),
      .35,
      .92
    ))
  };
}

async function getPlacementSession(sessionId, clientSessionId) {
  const session = await wixData.get(PLACEMENT_SESSIONS, sessionId, { suppressAuth: true });

  if (!session || String(session.clientSessionId || "") !== clientSessionId) {
    return null;
  }

  return session;
}

async function getModuleKeys(moduleId) {
  const result = await wixData
    .query(PLACEMENT_ITEMS)
    .eq("moduleId", moduleId)
    .eq("placementVersion", ITEM_KEY_VERSION)
    .eq("isActive", true)
    .limit(50)
    .find({ suppressAuth: true });

  return result.items;
}

async function saveResponses({ session, moduleId, answers, keyByItem }) {
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

function correctCount(rows) {
  return rows.reduce((sum, row) => sum + (row.correct ? 1 : 0), 0);
}

function ratioSkill(label, rows, level) {
  const total = rows.length;
  const correct = correctCount(rows);

  return {
    label,
    level,
    description: LEVEL_DESCRIPTIONS[level] || "",
    score: total ? Math.round((correct / total) * 100) : null,
    displayScore: total ? `${correct}/${total}` : "—",
    correct,
    total,
    skipped: false
  };
}

async function buildResultSummary(session) {
  const responses = await wixData
    .query(PLACEMENT_RESPONSES)
    .eq("sessionId", session._id)
    .limit(100)
    .find({ suppressAuth: true });

  const rows = responses.items;
  const languageRows = rows.filter((row) => /^lang-/.test(String(row.moduleId || "")));
  const readingRows = rows.filter((row) => /^reading-/.test(String(row.moduleId || "")));
  const listeningRows = rows.filter((row) => /^listening-/.test(String(row.moduleId || "")));

  const languageModule = String(languageRows[0]?.moduleId || "");
  const readingModule = String(readingRows[0]?.moduleId || "");
  const listeningModule = String(listeningRows[0]?.moduleId || "");

  const languageLevel = languageRows.length
    ? estimateAfterLanguage(languageModule, correctCount(languageRows))
    : String(session.finalLevel || session.provisionalLevel || "A2");

  const readingLevel = readingRows.length
    ? adjustAfterReading(levelFromModule(readingModule), correctCount(readingRows))
    : languageLevel;

  const listeningLevel = listeningRows.length
    ? adjustAfterListening(levelFromModule(listeningModule), correctCount(listeningRows))
    : readingLevel;

  const speakingQuery = await wixData
    .query(PLACEMENT_SPEAKING)
    .eq("sessionId", session._id)
    .limit(1)
    .find({ suppressAuth: true });

  const speakingRecord = speakingQuery.items[0] || null;
  const speakingMetrics = safeJson(speakingRecord?.metricsJson, {});
  const speakingComposite = Number(speakingMetrics?.composite);

  const speakingSkill = speakingRecord
    ? {
        label: "Speaking",
        level: String(speakingRecord.speakingLevel || session.finalLevel || session.provisionalLevel || "A2"),
        description: LEVEL_DESCRIPTIONS[String(speakingRecord.speakingLevel || "")] || "",
        score: Number.isFinite(speakingComposite) ? Math.round(speakingComposite * 10) : null,
        displayScore: Number.isFinite(speakingComposite) ? `${speakingComposite.toFixed(1)}/10` : "—",
        skipped: false
      }
    : {
        label: "Speaking",
        level: null,
        description: "",
        score: null,
        displayScore: "—",
        skipped: true
      };

  const finalLevel = String(session.finalLevel || session.provisionalLevel || listeningLevel || "A2");
  const resultId = `BR-${String(session._id || "")
    .replace(/[^a-z0-9]/gi, "")
    .slice(-8)
    .toUpperCase()}`;

  return {
    studentName: String(session.studentName || ""),
    finalLevel,
    finalDescription: LEVEL_DESCRIPTIONS[finalLevel] || "",
    completedAt: isoDate(session.completedAt || session.updatedAt || new Date()),
    resultId,
    placementVersion: session.placementVersion || PLACEMENT_VERSION,
    skills: {
      language: ratioSkill("Language Use", languageRows, languageLevel),
      reading: ratioSkill("Reading", readingRows, readingLevel),
      listening: ratioSkill("Listening", listeningRows, listeningLevel),
      speaking: speakingSkill
    }
  };
}


export async function startPlacement(request) {
  try {
    const payload = await readJsonBody(request);

    if (!validateVersion(payload)) {
      return jsonBadRequest("Placement version changed. Refresh the page.");
    }

    const clientSessionId = String(payload.clientSessionId || "").trim();
    const studentName = String(payload.studentName || "").trim().replace(/\s+/g, " ");

    if (!clientSessionId || clientSessionId.length < 16) {
      return jsonBadRequest("Invalid placement session.");
    }

    if (studentName.length < 2 || studentName.length > 90) {
      return jsonBadRequest("Invalid student name.");
    }

    const existing = await wixData
      .query(PLACEMENT_SESSIONS)
      .eq("clientSessionId", clientSessionId)
      .limit(1)
      .find({ suppressAuth: true });

    if (existing.items.length) {
      const session = existing.items[0];
      return jsonOK({
        success: true,
        sessionId: session._id,
        placementVersion: session.placementVersion || PLACEMENT_VERSION,
        studentName: session.studentName || studentName,
        status: session.status || "active",
        phase: session.phase || "calibration",
        moduleId: session.moduleId || "calibration-01",
        provisionalLevel: session.provisionalLevel || "",
        finalLevel: session.finalLevel || "",
        completedAt: session.completedAt || null,
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
        completedAt: null,
        timeSpentSeconds: 0,
        provisionalLevel: "",
        finalLevel: "",
        confidence: 0
      },
      { suppressAuth: true }
    );

    return jsonOK({
      success: true,
      sessionId: inserted._id,
      placementVersion: PLACEMENT_VERSION,
      studentName,
      status: "active",
      phase: "calibration",
      moduleId: "calibration-01",
      provisionalLevel: "",
      finalLevel: ""
    });
  } catch (error) {
    console.error("startPlacement failed:", error);
    return jsonServerError(error);
  }
}

export async function resumePlacement(request) {
  try {
    const payload = await readJsonBody(request);

    if (!validateVersion(payload)) {
      return jsonBadRequest("Placement version changed. Refresh the page.");
    }

    const sessionId = String(payload.sessionId || "").trim();
    const clientSessionId = String(payload.clientSessionId || "").trim();
    const session = await getPlacementSession(sessionId, clientSessionId);

    if (!session) {
      return jsonBadRequest("Placement session not found.");
    }

    const result = session.status === "completed"
      ? await buildResultSummary(session)
      : null;

    return jsonOK({
      success: true,
      sessionId: session._id,
      placementVersion: session.placementVersion,
      studentName: session.studentName || "",
      status: session.status || "active",
      phase: session.phase || "calibration",
      moduleId: session.moduleId || "calibration-01",
      provisionalLevel: session.provisionalLevel || "",
      finalLevel: session.finalLevel || "",
      completedAt: session.completedAt || null,
      result
    });
  } catch (error) {
    console.error("resumePlacement failed:", error);
    return jsonServerError(error);
  }
}

export async function placementStep(request) {
  try {
    const payload = await readJsonBody(request);

    if (!validateVersion(payload)) {
      return jsonBadRequest("Placement version changed. Refresh the page.");
    }

    const sessionId = String(payload.sessionId || "").trim();
    const clientSessionId = String(payload.clientSessionId || "").trim();
    const moduleId = String(payload.moduleId || "").trim();
    const answers = cleanAnswers(payload.answers);
    const expectedCount = expectedAnswerCount(moduleId);

    if (!sessionId || !clientSessionId || !moduleId || answers.length !== expectedCount) {
      return jsonBadRequest("Incomplete placement module.");
    }

    if (/^listening-/.test(moduleId) && answers.some((answer) => answer.plays < 1)) {
      return jsonBadRequest("Each listening question must be played before answering.");
    }

    const session = await getPlacementSession(sessionId, clientSessionId);

    if (!session || session.status !== "active") {
      return jsonBadRequest("Placement session not found.");
    }

    if (session.placementVersion !== PLACEMENT_VERSION) {
      return jsonBadRequest("Placement version changed. Refresh the page.");
    }

    if (String(session.moduleId || "") !== moduleId) {
      const progress = safeJson(session.progressJson, {});

      if (String(progress.lastCompletedModule || "") === moduleId) {
        return jsonOK({
          success: true,
          completedModuleId: moduleId,
          nextPhase: session.phase,
          nextModuleId: session.moduleId,
          provisionalLevel: session.provisionalLevel || "",
          replayed: true
        });
      }

      return jsonBadRequest("This placement module is no longer active.");
    }

    const keys = await getModuleKeys(moduleId);
    const keyByItem = new Map(keys.map((item) => [String(item.itemId || ""), item]));

    if (keyByItem.size < expectedCount || answers.some((answer) => !keyByItem.has(answer.itemId))) {
      throw new Error(`Private answer key is incomplete for ${moduleId}.`);
    }

    const correct = answers.reduce((total, answer) => {
      const key = keyByItem.get(answer.itemId);
      return total + (answer.optionId === String(key.correctOptionId || "") ? 1 : 0);
    }, 0);

    await saveResponses({ session, moduleId, answers, keyByItem });

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
    } else if (/^lang-/.test(moduleId)) {
      nextPhase = "reading";
      provisionalLevel = estimateAfterLanguage(moduleId, correct);
      nextModuleId = readingModuleFor(provisionalLevel);
    } else if (/^reading-/.test(moduleId)) {
      nextPhase = "listening";
      provisionalLevel = adjustAfterReading(provisionalLevel || "A2", correct);
      nextModuleId = listeningModuleFor(provisionalLevel);
    } else if (/^listening-/.test(moduleId)) {
      nextPhase = "speaking";
      provisionalLevel = adjustAfterListening(provisionalLevel || "A2", correct);
      nextModuleId = speakingModuleFor(provisionalLevel);
    } else {
      return jsonBadRequest("Unsupported placement module.");
    }

    if (!route.includes(nextModuleId)) route.push(nextModuleId);

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

    return jsonOK({
      success: true,
      completedModuleId: moduleId,
      nextPhase,
      nextModuleId,
      provisionalLevel
    });
  } catch (error) {
    console.error("placementStep failed:", error);
    return jsonServerError(error);
  }
}

export async function submitSpeaking(request) {
  try {
    const payload = await readJsonBody(request);

    if (!validateVersion(payload)) {
      return jsonBadRequest("Placement version changed. Refresh the page.");
    }

    const sessionId = String(payload.sessionId || "").trim();
    const clientSessionId = String(payload.clientSessionId || "").trim();
    const moduleId = String(payload.moduleId || "").trim();
    const promptId = String(payload.promptId || "").trim();

    if (!sessionId || !clientSessionId || !moduleId || !promptId) {
      return jsonBadRequest("Incomplete speaking submission.");
    }

    const session = await getPlacementSession(sessionId, clientSessionId);

    if (!session || session.status !== "active") {
      return jsonBadRequest("Placement session not found.");
    }

    if (session.placementVersion !== PLACEMENT_VERSION) {
      return jsonBadRequest("Placement version changed. Refresh the page.");
    }

    if (String(session.moduleId || "") !== moduleId || !/^speaking-/.test(moduleId)) {
      return jsonBadRequest("This speaking module is no longer active.");
    }

    const level = SPEAKING_LEVEL_BY_MODULE[moduleId];
    const expectedPromptId = SPEAKING_PROMPT_BY_MODULE[moduleId];

    if (!level || promptId !== expectedPromptId) {
      return jsonBadRequest("Invalid speaking prompt.");
    }

    const grade = gradeSpeakingDeterministically(payload, level);

    if (grade.inputError) {
      return jsonOK({
        success: true,
        speakingError: true
      });
    }

    const now = new Date();
    const existing = await wixData
      .query(PLACEMENT_SPEAKING)
      .eq("sessionId", session._id)
      .limit(1)
      .find({ suppressAuth: true });

    const speakingRecord = {
      ...(existing.items[0] || {}),
      sessionId: session._id,
      clientSessionId: session.clientSessionId,
      placementVersion: session.placementVersion,
      promptId,
      promptLevel: level,
      audioUrl: "",
      transcript: grade.transcript,
      durationSeconds: grade.durationSeconds,
      speechSeconds: grade.speechSeconds,
      wordCount: grade.wordCount,
      wpm: grade.wpm,
      recognitionConfidence: grade.recognitionConfidence,
      segmentCount: grade.segmentCount,
      fluency: grade.fluency,
      grammar: grade.grammar,
      vocabulary: grade.vocabulary,
      pronunciation: grade.pronunciation,
      communication: grade.communication,
      speakingLevel: grade.speakingLevel,
      graderVersion: "deterministic-browser-v1",
      metricsJson: JSON.stringify({
        composite: grade.composite,
        speechRatio: grade.speechRatio,
        uniqueWords: grade.uniqueWords,
        uniqueRatio: grade.uniqueRatio,
        longWordRatio: grade.longWordRatio,
        connectorCount: grade.connectorCount,
        complexCount: grade.complexCount,
        fillerCount: grade.fillerCount,
        transcriptAvailable: grade.transcriptAvailable
      }),
      createdAt: existing.items[0]?.createdAt || now
    };

    if (existing.items.length) {
      await wixData.update(PLACEMENT_SPEAKING, speakingRecord, { suppressAuth: true });
    } else {
      await wixData.insert(PLACEMENT_SPEAKING, speakingRecord, { suppressAuth: true });
    }

    const updatedSession = {
      ...session,
      status: "completed",
      phase: "result",
      finalLevel: grade.finalLevel,
      confidence: grade.confidence,
      updatedAt: now,
      completedAt: now,
      progressJson: JSON.stringify({
        stage: 4,
        totalStages: 4,
        completed: true,
        speakingLevel: grade.speakingLevel,
        speakingComposite: grade.composite
      })
    };

    await wixData.update(PLACEMENT_SESSIONS, updatedSession, { suppressAuth: true });
    const result = await buildResultSummary(updatedSession);

    return jsonOK({
      success: true,
      finalLevel: grade.finalLevel,
      speakingLevel: grade.speakingLevel,
      confidence: grade.confidence,
      result,
      rubric: {
        fluency: grade.fluency,
        grammar: grade.grammar,
        vocabulary: grade.vocabulary,
        pronunciation: grade.pronunciation,
        communication: grade.communication,
        composite: grade.composite
      }
    });
  } catch (error) {
    console.error("submitSpeaking failed:", error);
    return jsonServerError(error);
  }
}

export async function skipSpeaking(request) {
  try {
    const payload = await readJsonBody(request);

    if (!validateVersion(payload)) {
      return jsonBadRequest("Placement version changed. Refresh the page.");
    }

    const sessionId = String(payload.sessionId || "").trim();
    const clientSessionId = String(payload.clientSessionId || "").trim();
    const moduleId = String(payload.moduleId || "").trim();

    if (!sessionId || !clientSessionId || !moduleId) {
      return jsonBadRequest("Incomplete speaking skip.");
    }

    const session = await getPlacementSession(sessionId, clientSessionId);

    if (!session || session.status !== "active") {
      return jsonBadRequest("Placement session not found.");
    }

    if (session.placementVersion !== PLACEMENT_VERSION) {
      return jsonBadRequest("Placement version changed. Refresh the page.");
    }

    if (String(session.moduleId || "") !== moduleId || !/^speaking-/.test(moduleId)) {
      return jsonBadRequest("This speaking module is no longer active.");
    }

    const finalLevel = String(session.provisionalLevel || SPEAKING_LEVEL_BY_MODULE[moduleId] || "A2");
    const now = new Date();

    const updatedSession = {
      ...session,
      status: "completed",
      phase: "result",
      finalLevel,
      updatedAt: now,
      completedAt: now,
      progressJson: JSON.stringify({
        stage: 4,
        totalStages: 4,
        completed: true,
        speakingSkipped: true
      })
    };

    await wixData.update(PLACEMENT_SESSIONS, updatedSession, { suppressAuth: true });
    const result = await buildResultSummary(updatedSession);

    return jsonOK({
      success: true,
      finalLevel,
      result
    });
  } catch (error) {
    console.error("skipSpeaking failed:", error);
    return jsonServerError(error);
  }
}

export async function placementResult(request) {
  try {
    const payload = await readJsonBody(request);

    if (!validateVersion(payload)) {
      return jsonBadRequest("Placement version changed. Refresh the page.");
    }

    const sessionId = String(payload.sessionId || "").trim();
    const clientSessionId = String(payload.clientSessionId || "").trim();
    const session = await getPlacementSession(sessionId, clientSessionId);

    if (!session || session.status !== "completed") {
      return jsonBadRequest("Completed placement not found.");
    }

    const result = await buildResultSummary(session);

    return jsonOK({
      success: true,
      result
    });
  } catch (error) {
    console.error("placementResult failed:", error);
    return jsonServerError(error);
  }
}

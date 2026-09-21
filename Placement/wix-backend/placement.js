// Brighton Adaptive Placement — business logic module
// Contract: 2026-09-20.1
// Wix file: Backend/placement.js
//
// Keep HTTP routing in Backend/http-functions.js.
// Uses the same shared Backend/core.js as Exams and Tests.

import wixData from "wix-data";
import {
  jsonOK,
  jsonBadRequest,
  jsonServerError,
  readJsonBody
} from "backend/core.js";
import {
  gradeSpeakingWithGemini,
  GEMINI_SPEAKING_MODEL,
  SPEAKING_RUBRIC_VERSION
} from "backend/gemini-speaking.js";

const PLACEMENT_SESSIONS = "BrightonPlacementSessions";
const PLACEMENT_RESPONSES = "BrightonPlacementResponses";
const PLACEMENT_ITEMS = "BrightonPlacementItems";
const PLACEMENT_SPEAKING = "BrightonPlacementSpeaking";

const PLACEMENT_VERSION = "2026-09-20.1";
const ITEM_KEY_VERSION = "2026-09-19.7";
const PLACEMENT_INACTIVITY_MS = 60 * 60 * 1000;

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

function safeJson(value, fallback) {
  try {
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
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

function placementActivityTime(session) {
  const value = session?.updatedAt || session?.startedAt;
  if (!value) return 0;

  const date = value instanceof Date ? value : new Date(value);
  const time = date.getTime();
  return Number.isFinite(time) ? time : 0;
}

function placementSessionIsStale(session, now = Date.now()) {
  return String(session?.status || "active") === "active" &&
    placementActivityTime(session) > 0 &&
    now - placementActivityTime(session) >= PLACEMENT_INACTIVITY_MS;
}

async function removePlacementRows(collectionId, sessionId) {
  try {
    const found = await wixData
      .query(collectionId)
      .eq("sessionId", sessionId)
      .limit(1000)
      .find({ suppressAuth: true });

    await Promise.all(found.items.map(async (item) => {
      try {
        await wixData.remove(collectionId, item._id, { suppressAuth: true });
      } catch {}
    }));
  } catch {}
}

async function deletePlacementSessionCascade(session) {
  const sessionId = String(session?._id || "");
  if (!sessionId) return false;

  await Promise.all([
    removePlacementRows(PLACEMENT_RESPONSES, sessionId),
    removePlacementRows(PLACEMENT_SPEAKING, sessionId)
  ]);

  try {
    await wixData.remove(PLACEMENT_SESSIONS, sessionId, { suppressAuth: true });
  } catch {}

  return true;
}

async function purgeStalePlacementSessions() {
  const cutoff = new Date(Date.now() - PLACEMENT_INACTIVITY_MS);

  try {
    const found = await wixData
      .query(PLACEMENT_SESSIONS)
      .eq("status", "active")
      .lt("updatedAt", cutoff)
      .limit(1000)
      .find({ suppressAuth: true });

    await Promise.all(found.items.map(deletePlacementSessionCascade));
    return found.items.length;
  } catch (error) {
    console.warn("Could not purge stale Placement sessions:", error);
    return 0;
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

async function getPlacementSession(sessionId, clientSessionId) {
  const session = await wixData.get(PLACEMENT_SESSIONS, sessionId, { suppressAuth: true });

  if (!session || String(session.clientSessionId || "") !== clientSessionId) {
    return null;
  }

  if (placementSessionIsStale(session)) {
    await deletePlacementSessionCascade(session);
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

export function pingPlacement() {
  return jsonOK({
    success: true,
    service: "brighton-placement",
    contract: PLACEMENT_VERSION,
    answerKeyVersion: ITEM_KEY_VERSION
  });
}

export async function startPlacement(request) {
  try {
    await purgeStalePlacementSessions();
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

export async function touchPlacementActivity(request) {
  try {
    const payload = await readJsonBody(request);

    if (!validateVersion(payload)) {
      return jsonBadRequest("Placement version changed. Refresh the page.");
    }

    const sessionId = String(payload.sessionId || "").trim();
    const clientSessionId = String(payload.clientSessionId || "").trim();
    const session = await getPlacementSession(sessionId, clientSessionId);

    if (!session) {
      return jsonOK({
        success: true,
        expired: true
      });
    }

    if (String(session.status || "") !== "active") {
      return jsonOK({
        success: true,
        expired: false
      });
    }

    session.updatedAt = new Date();
    await wixData.update(PLACEMENT_SESSIONS, session, { suppressAuth: true });

    return jsonOK({
      success: true,
      expired: false
    });
  } catch (error) {
    console.error("touchPlacementActivity failed:", error);
    return jsonServerError(error);
  }
}

export async function expirePlacementSession(request) {
  try {
    const payload = await readJsonBody(request);

    if (!validateVersion(payload)) {
      return jsonBadRequest("Placement version changed. Refresh the page.");
    }

    const sessionId = String(payload.sessionId || "").trim();
    const clientSessionId = String(payload.clientSessionId || "").trim();
    const session = await wixData.get(PLACEMENT_SESSIONS, sessionId, { suppressAuth: true });

    if (!session || String(session.clientSessionId || "") !== clientSessionId) {
      return jsonOK({
        success: true,
        deleted: false
      });
    }

    if (String(session.status || "") !== "active") {
      return jsonOK({
        success: true,
        deleted: false
      });
    }

    await deletePlacementSessionCascade(session);

    return jsonOK({
      success: true,
      deleted: true
    });
  } catch (error) {
    console.error("expirePlacementSession failed:", error);
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

    const grade = await gradeSpeakingWithGemini(payload, level, promptId);

    if (grade.inputError) {
      return jsonOK({
        success: true,
        speakingError: grade.retryReason !== "prompt-repeat",
        speakingRetryReason: grade.retryReason === "prompt-repeat" ? "prompt-repeat" : "",
        speakingErrorCode: String(grade.retryReason || "technical"),
        providerStatus: Number(grade.providerStatus) || 0,
        providerCode: String(grade.providerCode || "")
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
      graderVersion: grade.modelUsed || GEMINI_SPEAKING_MODEL,
      metricsJson: JSON.stringify({
        composite: grade.composite,
        rubricVersion: SPEAKING_RUBRIC_VERSION,
        model: grade.modelUsed || GEMINI_SPEAKING_MODEL,
        evidenceQuality: grade.assessment?.evidenceQuality || "",
        assessment: grade.assessment || null,
        usage: grade.usage || null
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


/* =========================================================
   TEACHER PLACEMENT RESULTS DASHBOARD
========================================================= */

function dashboardDate(value) {
  if (!value) return "";

  try {
    const date = value instanceof Date ? value : new Date(value);
    return Number.isFinite(date.getTime()) ? date.toISOString() : "";
  } catch {
    return "";
  }
}

function dashboardNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
}

function dashboardResultId(sessionId) {
  return `BR-${String(sessionId || "")
    .replace(/[^a-z0-9]/gi, "")
    .slice(-8)
    .toUpperCase()}`;
}

function dashboardSessionRow(session) {
  return {
    sessionId: String(session?._id || ""),
    studentName: String(session?.studentName || ""),
    status: String(session?.status || "active"),
    phase: String(session?.phase || ""),
    moduleId: String(session?.moduleId || ""),
    provisionalLevel: String(session?.provisionalLevel || ""),
    finalLevel: String(session?.finalLevel || ""),
    confidence: dashboardNumber(session?.confidence),
    startedAt: dashboardDate(session?.startedAt),
    updatedAt: dashboardDate(session?.updatedAt),
    completedAt: dashboardDate(session?.completedAt),
    timeSpentSeconds: dashboardNumber(session?.timeSpentSeconds),
    placementVersion: String(session?.placementVersion || ""),
    resultId: dashboardResultId(session?._id)
  };
}

function dashboardModules(responses) {
  const groups = new Map();

  for (const item of responses || []) {
    const moduleId = String(item?.moduleId || "unknown");

    if (!groups.has(moduleId)) {
      groups.set(moduleId, {
        moduleId,
        correct: 0,
        total: 0,
        responseTimeSeconds: 0
      });
    }

    const group = groups.get(moduleId);
    group.total += 1;

    const isCorrect =
      item?.correct === true ||
      String(item?.correct).toLowerCase() === "true";

    if (isCorrect) group.correct += 1;

    group.responseTimeSeconds +=
      Math.max(0, dashboardNumber(item?.responseTimeMs)) / 1000;
  }

  return [...groups.values()].map((group) => ({
    ...group,
    responseTimeSeconds: Math.round(group.responseTimeSeconds)
  }));
}

async function placementRequestParams(request) {
  const query = request?.query || {};
  if (Object.keys(query).length) return query;

  try {
    return await readJsonBody(request);
  } catch {
    return {};
  }
}

export async function getPlacementResults(request) {
  try {
    await purgeStalePlacementSessions();
    const query = await placementRequestParams(request);
    const studentFilter = String(query.student || "").trim().toLowerCase();
    const levelFilter = String(query.level || "").trim();
    const statusFilter = String(query.status || "").trim().toLowerCase();

    const found = await wixData
      .query(PLACEMENT_SESSIONS)
      .limit(1000)
      .find({ suppressAuth: true });

    let results = found.items.map(dashboardSessionRow);

    if (studentFilter) {
      results = results.filter((item) =>
        item.studentName.toLowerCase().includes(studentFilter)
      );
    }

    if (levelFilter) {
      results = results.filter((item) =>
        (item.finalLevel || item.provisionalLevel) === levelFilter
      );
    }

    if (statusFilter) {
      results = results.filter((item) =>
        item.status.toLowerCase() === statusFilter
      );
    }

    results.sort((a, b) => {
      const aTime = Date.parse(a.completedAt || a.updatedAt || a.startedAt || "") || 0;
      const bTime = Date.parse(b.completedAt || b.updatedAt || b.startedAt || "") || 0;
      return bTime - aTime;
    });

    return jsonOK({
      success: true,
      results,
      total: results.length
    });
  } catch (error) {
    console.error("getPlacementResults failed:", error);
    return jsonServerError(error);
  }
}

export async function getPlacementDashboardResult(request) {
  try {
    await purgeStalePlacementSessions();
    const params = await placementRequestParams(request);
    const sessionId = String(params?.sessionId || "").trim();

    if (!sessionId) {
      return jsonBadRequest("Placement session ID is required.");
    }

    const session = await wixData.get(
      PLACEMENT_SESSIONS,
      sessionId,
      { suppressAuth: true }
    );

    if (!session) {
      return jsonBadRequest("Placement session not found.");
    }

    const [responseQuery, speakingQuery] = await Promise.all([
      wixData
        .query(PLACEMENT_RESPONSES)
        .eq("sessionId", sessionId)
        .limit(1000)
        .find({ suppressAuth: true }),
      wixData
        .query(PLACEMENT_SPEAKING)
        .eq("sessionId", sessionId)
        .limit(1)
        .find({ suppressAuth: true })
    ]);

    const speakingRecord = speakingQuery.items[0] || null;
    const speakingMetrics = safeJson(speakingRecord?.metricsJson, {});

    const speaking = speakingRecord
      ? {
          promptId: String(speakingRecord.promptId || ""),
          promptLevel: String(speakingRecord.promptLevel || ""),
          audioUrl: String(speakingRecord.audioUrl || ""),
          transcript: String(speakingRecord.transcript || ""),
          durationSeconds: dashboardNumber(speakingRecord.durationSeconds),
          speechSeconds: dashboardNumber(speakingRecord.speechSeconds),
          wordCount: dashboardNumber(speakingRecord.wordCount),
          wpm: dashboardNumber(speakingRecord.wpm),
          recognitionConfidence: dashboardNumber(speakingRecord.recognitionConfidence),
          segmentCount: dashboardNumber(speakingRecord.segmentCount),
          fluency: dashboardNumber(speakingRecord.fluency),
          grammar: dashboardNumber(speakingRecord.grammar),
          vocabulary: dashboardNumber(speakingRecord.vocabulary),
          pronunciation: dashboardNumber(speakingRecord.pronunciation),
          communication: dashboardNumber(speakingRecord.communication),
          speakingLevel: String(speakingRecord.speakingLevel || ""),
          graderVersion: String(speakingRecord.graderVersion || ""),
          composite: Number.isFinite(Number(speakingMetrics?.composite))
            ? Number(speakingMetrics.composite)
            : null,
          rubricVersion: String(speakingMetrics?.rubricVersion || ""),
          evidenceQuality: String(speakingMetrics?.evidenceQuality || ""),
          assessment: speakingMetrics?.assessment || null
        }
      : null;

    const result = String(session.status || "") === "completed"
      ? await buildResultSummary(session)
      : null;

    return jsonOK({
      success: true,
      session: dashboardSessionRow(session),
      result,
      route: safeJson(session.routeJson, []),
      progress: safeJson(session.progressJson, {}),
      modules: dashboardModules(responseQuery.items),
      speaking
    });
  } catch (error) {
    console.error("getPlacementDashboardResult failed:", error);
    return jsonServerError(error);
  }
}

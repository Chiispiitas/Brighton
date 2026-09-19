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
const PLACEMENT_VERSION = "2026-09-19.3";

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
      responseTimeMs: Math.max(0, Math.min(120000, Number(answer?.responseTimeMs) || 0))
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

function levelSlug(level) {
  return String(level || "A2").toLowerCase().replace("+", "plus").replace(/[^a-z0-9]+/g, "");
}

function readingModuleFor(level) {
  return `reading-${levelSlug(level)}`;
}

function listeningModuleFor(level) {
  return `listening-${levelSlug(level)}`;
}

function adjustAfterReading(level, correct) {
  const currentIndex = Math.max(0, LEVELS.indexOf(level));
  if (correct <= 1) return LEVELS[Math.max(0, currentIndex - 1)];
  if (correct === 4) return LEVELS[Math.min(LEVELS.length - 1, currentIndex + 1)];
  return LEVELS[currentIndex];
}

function expectedAnswerCount(moduleId) {
  return /^reading-/.test(moduleId) ? 4 : 5;
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
          responseJson: JSON.stringify({ optionId: answer.optionId }),
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
    } else {
      return placementBadRequest("Unsupported placement module.");
    }

    const updated = {
      ...session,
      phase: nextPhase,
      moduleId: nextModuleId,
      routeJson: JSON.stringify(route),
      progressJson: JSON.stringify({
        stage: nextPhase === "listening" ? 3 : nextPhase === "reading" ? 2 : 1,
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

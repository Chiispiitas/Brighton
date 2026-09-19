// Brighton Placement
// Copy into the existing Wix backend/http-functions.js file.
// Keep these imports only once if that file already imports them.

import wixData from "wix-data";
import {
  ok,
  badRequest,
  serverError,
  response
} from "wix-http-functions";

const PLACEMENT_SESSIONS = "PlacementSessions";
const PLACEMENT_VERSION = "2026-09-19.1";

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

    // Idempotent start: a retry from the same browser does not create a second row.
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
        duplicate: true
      });
    }

    const now = new Date();
    const inserted = await wixData.insert(
      PLACEMENT_SESSIONS,
      {
        clientSessionId,
        studentName,

        // Server authority: never accept this from the browser.
        placementVersion: PLACEMENT_VERSION,

        status: "active",
        phase: "calibration",
        moduleId: "",
        routeJson: JSON.stringify([]),
        progressJson: JSON.stringify({
          stage: 1,
          totalStages: 4,
          calibrationStarted: false
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
      phase: "calibration"
    });
  } catch (error) {
    console.error("startPlacement failed:", error);
    return placementServerError(error);
  }
}

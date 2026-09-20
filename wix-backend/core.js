// Brighton Assessment Backend — shared Wix helpers
// Modular backend package generated from the previous Brighton Tests/Exams backend.

import { ok, badRequest, serverError, response } from "wix-http-functions";

export const CORS_HEADERS = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization"
};

export const DATA_OPTIONS = { suppressAuth: true };

// Must match Exams/answer-keys/version.json in the Brighton repository.
export const ANSWER_KEY_VERSION = "2026-09-18.1";

const COLLECTION_ALIASES = {
  exams: "Exams",
  examSubmissions: "ExamSubmissions",
  examProgress: "ExamProgress",
  testResults: "TestResults",
  placementSessions: "BrightonPlacementSessions",
  placementResponses: "BrightonPlacementResponses",
  placementItems: "BrightonPlacementItems",
  placementSpeaking: "BrightonPlacementSpeaking"
};

export function jsonOK(data = {}) {
  return ok({ headers: CORS_HEADERS, body: JSON.stringify(data) });
}

export function jsonBadRequest(message) {
  return badRequest({
    headers: CORS_HEADERS,
    body: JSON.stringify({ success: false, error: message })
  });
}

export function jsonServerError(error) {
  return serverError({
    headers: CORS_HEADERS,
    body: JSON.stringify({
      success: false,
      error: error?.message || String(error)
    })
  });
}

export function collectionError(collectionKey, error) {
  const collectionId = COLLECTION_ALIASES[collectionKey] || collectionKey;
  return (
    `Collection error for "${collectionId}". ` +
    `Check the Wix CMS Collection ID and publish/sync the collection. ` +
    `Original error: ${String(error?.message || error)}`
  );
}

export function jsonCollectionError(collectionKey, error) {
  return jsonServerError(collectionError(collectionKey, error));
}

// Wix HTTP Functions officially support get/post/put/delete/use.
// use_<route> below catches OPTIONS preflight requests for cross-origin clients.
export function corsOptions(methods = "GET, POST") {
  return response({
    status: 204,
    headers: {
      ...CORS_HEADERS,
      "Access-Control-Allow-Methods": `${methods}, OPTIONS`
    }
  });
}

export async function readJsonBody(request) {
  try {
    return await request.body.json();
  } catch {
    try {
      const text = await request.body.text();
      return JSON.parse(text || "{}");
    } catch {
      return {};
    }
  }
}

export function normalizeAnswerKeyVersion(
  value
) {

  const version =
    cleanText(
      value
    );


  if (!version) {
    return "";
  }


  return (
    /^[A-Za-z0-9._-]{1,80}$/
      .test(version)
  )
    ? version
    : "";

}

export function getStoredAnswerKeyVersion(
  item
) {

  if (
    !item ||
    typeof item !==
      "object"
  ) {

    return "";

  }


  return (
    normalizeAnswerKeyVersion(
      item.answerKeyVersion
    ) ||
    normalizeAnswerKeyVersion(
      item.testVersion
    )
  );

}

export function stampServerVersion(
  payload,
  version = ANSWER_KEY_VERSION
) {

  const release =
    normalizeAnswerKeyVersion(
      version
    ) ||
    ANSWER_KEY_VERSION;


  const clientReportedAnswerKeyVersion =
    normalizeAnswerKeyVersion(
      payload?.answerKeyVersion
    );


  const clientReportedTestVersion =
    normalizeAnswerKeyVersion(
      payload?.testVersion
    );


  return {

    ...(payload || {}),

    clientReportedAnswerKeyVersion,

    clientReportedTestVersion,

    answerKeyVersion:
      release,

    testVersion:
      release

  };

}

export function normalizeClassCode(
  value
) {

  const raw =
    String(
      value ||
      ""
    )
      .trim()
      .toUpperCase();


  const compact =
    raw.replace(
      /[^A-Z0-9]+/g,
      ""
    );


  const exact =
    compact.match(
      /^([A-Z])(\d+)$/
    );


  if (exact) {

    return (
      `${exact[1]}-${exact[2]}`
    );

  }


  const loose =
    raw.match(
      /([A-Z])\D*(\d+)/
    );


  if (loose) {

    return (
      `${loose[1]}-${loose[2]}`
    );

  }


  return raw;

}

export function answersObjectToList(
  answers
) {

  if (
    !answers ||
    typeof answers !==
      "object"
  ) {

    return [];

  }


  return Object
    .keys(answers)
    .sort(
      (a, b) =>
        Number(a) -
        Number(b)
    )
    .map(
      question => ({

        question:
          Number(
            question
          ),

        answer:
          cleanText(
            answers[
              question
            ]
          )
            .toUpperCase()

      })
    );

}

export function cleanText(
  value
) {

  return String(
    value ||
    ""
  ).trim();

}

export function finiteNumberOrNull(
  value
) {

  const number =
    Number(value);


  return Number.isFinite(
    number
  )
    ? number
    : null;

}

export function nonNegativeNumber(
  value
) {

  const number =
    Number(value);


  if (
    !Number.isFinite(
      number
    )
  ) {

    return 0;

  }


  return Math.max(
    0,
    number
  );

}

export function validDate(
  value
) {

  if (!value) {
    return null;
  }


  const date =
    new Date(value);


  return Number.isFinite(
    date.getTime()
  )
    ? date
    : null;

}

export function safeStringify(
  value
) {

  try {

    return JSON.stringify(
      value ?? null
    );

  } catch {

    return JSON.stringify({
      error:
        "Could not stringify value"
    });

  }

}

export function formatLocal(
  date
) {

  try {

    return date.toLocaleString(
      "en-GB",
      {
        timeZone:
          "America/Guayaquil"
      }
    );

  } catch {

    return date.toISOString();

  }

}

export function makeSubmissionId(
  payload
) {

  const stamp =
    Date.now();


  const random =
    Math.random()
      .toString(36)
      .slice(2, 8);


  const classId =
    normalizeClassCode(
      payload.classId ||
      "class"
    )
      .replace(
        /[^a-z0-9_-]+/gi,
        "-"
      );


  return (
    `${payload.examId}_` +
    `${classId}_` +
    `${stamp}_` +
    `${random}`
  );

}


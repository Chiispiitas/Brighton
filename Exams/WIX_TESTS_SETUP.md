# Brighton Tests · Wix CMS setup

The Tests system uses the same `API_BASE_URL` already configured in `Exams/config.js`, but it stores shorter unit-test submissions in a separate Wix CMS collection.

## Answer-key architecture

Tests now follow the same answer-key pattern as Exams.

There is **no `TEST_KEYS` object in Wix** and no hardcoded answer map in `http-functions.js`.

Each test has an answer-key JSON file in:

`Exams/answer-keys/[testId].json`

Example:

`Exams/answer-keys/brighton-a1-units-1-2.json`

The Tests Results Dashboard loads that JSON through `shared-grading.js` and grades the raw Wix submission locally, exactly like the Exams Results Dashboard.

When a new test is added, add its matching JSON answer-key file. No Wix backend answer-key changes are required.

## Wix collection

Create one CMS collection with collection ID:

`TestResults`

### Required fields

| Field name | Field ID | Type |
| --- | --- | --- |
| Client submission ID | `clientSubmissionId` | Text |
| Test ID | `testId` | Text |
| Test title | `testTitle` | Text |
| Level | `level` | Text |
| Unit range | `unitRange` | Text |
| Student name | `studentName` | Text |
| Class ID | `classId` | Text |
| Answers JSON | `answersJson` | Text |
| Answer list JSON | `answerListJson` | Text |
| Started at | `startedAt` | Date and Time |
| Submitted at | `submittedAt` | Date and Time |
| Time spent seconds | `timeSpentSeconds` | Number |
| Answered count | `answeredCount` | Number |
| Total questions | `totalQuestions` | Number |

Wix automatically supplies `_id`, `_createdDate`, and `_updatedDate`.

### Optional legacy fields

If you already imported the earlier CSV, these fields can remain in the collection:

- `score`
- `maxScore`
- `percentage`
- `page1Score`
- `page1MaxScore`
- `page2Score`
- `page2MaxScore`
- `pageScoresJson`

They are no longer required for grading and may remain empty. The dashboard derives scores from the JSON answer key.

## Permissions

Set the collection permissions as restrictively as possible. The public test page should not write directly to CMS. The Wix backend HTTP function receives the submission and inserts it using backend permissions.

## Required HTTP functions

Add these alongside the existing Exam HTTP functions:

- `post_submitTest` — stores the raw student submission in `TestResults`.
- `get_getTestResults` — returns raw submissions for a class and optional test ID.
- OPTIONS handlers when needed for CORS.

The backend does **not grade** the test.

## Example Wix backend implementation

```js
import wixData from "wix-data";
import {
  ok,
  badRequest,
  serverError,
  response
} from "wix-http-functions";

const TEST_RESULTS_COLLECTION = "TestResults";

const CORS_HEADERS = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*"
};

function jsonOK(data) {
  return ok({
    headers: CORS_HEADERS,
    body: JSON.stringify(data)
  });
}

function jsonBadRequest(message) {
  return badRequest({
    headers: CORS_HEADERS,
    body: JSON.stringify({ success: false, error: message })
  });
}

function jsonServerError(error) {
  return serverError({
    headers: CORS_HEADERS,
    body: JSON.stringify({
      success: false,
      error: error?.message || String(error)
    })
  });
}

export function options_submitTest() {
  return response({
    status: 204,
    headers: {
      ...CORS_HEADERS,
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type"
    }
  });
}

export function options_getTestResults() {
  return response({
    status: 204,
    headers: {
      ...CORS_HEADERS,
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type"
    }
  });
}

export async function post_submitTest(request) {
  try {
    const payload = await request.body.json();

    const clientSubmissionId = String(payload.clientSubmissionId || "").trim();
    const testId = String(payload.testId || "").trim();
    const studentName = String(payload.studentName || "").trim();
    const classId = String(payload.classId || "").trim().toUpperCase();

    if (!clientSubmissionId || !testId || !studentName || !classId) {
      return jsonBadRequest("Missing required submission fields.");
    }

    const duplicate = await wixData
      .query(TEST_RESULTS_COLLECTION)
      .eq("clientSubmissionId", clientSubmissionId)
      .limit(1)
      .find({ suppressAuth: true });

    if (duplicate.items.length) {
      return jsonOK({
        success: true,
        submissionId: duplicate.items[0]._id,
        duplicate: true
      });
    }

    const item = {
      clientSubmissionId,
      testId,
      testTitle: String(payload.testTitle || testId),
      level: String(payload.level || ""),
      unitRange: String(payload.unitRange || ""),
      studentName,
      classId,
      answersJson: JSON.stringify(payload.answers || {}),
      answerListJson: JSON.stringify(payload.answerList || []),
      timeSpentSeconds: Number(payload.timeSpentSeconds) || 0,
      answeredCount: Number(payload.answeredCount) || 0,
      totalQuestions: Number(payload.totalQuestions) || 0,
      submittedAt: payload.submittedAt ? new Date(payload.submittedAt) : new Date()
    };

    if (payload.startedAt) {
      item.startedAt = new Date(payload.startedAt);
    }

    const inserted = await wixData.insert(
      TEST_RESULTS_COLLECTION,
      item,
      { suppressAuth: true }
    );

    return jsonOK({
      success: true,
      submissionId: inserted._id
    });
  } catch (error) {
    console.error("submitTest failed:", error);
    return jsonServerError(error);
  }
}

export async function get_getTestResults(request) {
  try {
    const classId = String(request.query.classId || "").trim().toUpperCase();
    const testId = String(request.query.testId || "").trim();

    if (!classId) {
      return jsonBadRequest("classId is required.");
    }

    let query = wixData
      .query(TEST_RESULTS_COLLECTION)
      .eq("classId", classId);

    if (testId) {
      query = query.eq("testId", testId);
    }

    const results = await query
      .descending("submittedAt")
      .limit(250)
      .find({ suppressAuth: true });

    return jsonOK({
      success: true,
      items: results.items
    });
  } catch (error) {
    console.error("getTestResults failed:", error);
    return jsonServerError(error);
  }
}
```

## Grading flow

1. Student submits A/B/C answers.
2. Wix stores the raw answers only.
3. Tests Results Dashboard requests the submissions from Wix.
4. The dashboard loads `answer-keys/[testId].json`.
5. `shared-grading.js` calculates the total score, percentage, per-unit score and correct/incorrect status.
6. CSV export uses those locally calculated scores.

This keeps the Tests architecture aligned with the existing Exams grading system and means adding a new test does not require editing Wix grading code.

## Duplicate protection

`clientSubmissionId` is generated once on the student's device. `post_submitTest` checks for that ID before inserting, so retrying after a network failure does not create duplicate rows.

## CORS

During setup, `Access-Control-Allow-Origin: *` is convenient. For production, replace it with the exact origin hosting the Brighton static site when practical.

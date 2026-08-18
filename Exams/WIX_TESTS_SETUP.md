# Brighton Tests · Wix CMS setup

The Tests system uses the same `API_BASE_URL` already configured in `Exams/config.js`, but it uses separate endpoints and a separate collection so formal Exams data and shorter unit Tests do not mix.

## Recommended minimum setup

Create **one new CMS collection** with collection ID:

`TestResults`

The test definitions remain static in GitHub (`FALLBACK_TESTS` in `config.js` and each test's `test-data.js`). This means a second `Tests` collection is not required yet.

### TestResults fields

| Field name | Field ID | Type |
| --- | --- | --- |
| Client submission ID | `clientSubmissionId` | Text |
| Test ID | `testId` | Text |
| Test title | `testTitle` | Text |
| Level | `level` | Text |
| Unit range | `unitRange` | Text |
| Student name | `studentName` | Text |
| Class ID | `classId` | Text |
| Score | `score` | Number |
| Maximum score | `maxScore` | Number |
| Percentage | `percentage` | Number |
| Page 1 score | `page1Score` | Number |
| Page 1 maximum | `page1MaxScore` | Number |
| Page 2 score | `page2Score` | Number |
| Page 2 maximum | `page2MaxScore` | Number |
| Answers JSON | `answersJson` | Text |
| Answer list JSON | `answerListJson` | Text |
| Page scores JSON | `pageScoresJson` | Text |
| Started at | `startedAt` | Date and Time |
| Submitted at | `submittedAt` | Date and Time |
| Time spent seconds | `timeSpentSeconds` | Number |
| Answered count | `answeredCount` | Number |
| Total questions | `totalQuestions` | Number |

Wix automatically supplies `_id`, `_createdDate`, and `_updatedDate`.

## Permissions

Set the collection permissions as restrictively as possible (Admin only for read/write is preferred). The public browser should **not** write directly to the collection. The existing Wix backend HTTP functions should perform inserts and queries with backend permissions.

## Required HTTP functions

Add these to the existing Wix backend `http-functions.js` rather than replacing the existing Exam functions:

- `post_submitTest` — receives a student submission, grades it with a server-only answer key, inserts it into `TestResults`, and returns a submission ID.
- `get_getTestResults` — returns test submissions for a required `classId` and optional `testId`.
- CORS / OPTIONS handlers for the external Brighton static site when required.

The public repository deliberately does **not** contain the correct-answer map. Keep `TEST_KEYS` only in Wix backend code so students cannot inspect the browser JavaScript to obtain answers.

## Expected POST payload

```json
{
  "clientSubmissionId": "uuid",
  "testId": "brighton-a1-units-1-2",
  "testTitle": "A1 Units 1–2 Test",
  "level": "A1",
  "unitRange": "1-2",
  "studentName": "Student Name",
  "classId": "A-12",
  "answers": { "1": "C", "2": "B" },
  "answerList": [
    { "page": 1, "unit": 1, "question": 1, "answer": "C" }
  ],
  "startedAt": "ISO date",
  "submittedAt": "ISO date",
  "timeSpentSeconds": 600,
  "answeredCount": 40,
  "totalQuestions": 40
}
```

## Expected submit response

```json
{
  "success": true,
  "submissionId": "wix-item-id"
}
```

The student page intentionally does not require the score in the response. Scores are shown in the teacher-facing Tests Results Dashboard.

## Expected results response

`GET /getTestResults?classId=A-12&testId=brighton-a1-units-1-2`

```json
{
  "success": true,
  "items": [
    {
      "_id": "wix-item-id",
      "studentName": "Student Name",
      "classId": "A-12",
      "testId": "brighton-a1-units-1-2",
      "testTitle": "A1 Units 1–2 Test",
      "level": "A1",
      "unitRange": "1-2",
      "score": 36,
      "maxScore": 40,
      "percentage": 90,
      "page1Score": 18,
      "page1MaxScore": 20,
      "page2Score": 18,
      "page2MaxScore": 20,
      "answerListJson": "[...]",
      "pageScoresJson": "[...]",
      "submittedAt": "ISO date",
      "timeSpentSeconds": 600
    }
  ]
}
```

## CORS

The Tests pages are static and call the Wix HTTP functions from a browser, so the Wix responses must allow the published Brighton site's origin. During testing `*` is convenient, but for production use the exact Brighton/GitHub Pages origin where possible.

## Duplicate protection

`clientSubmissionId` is generated once on the student's device. In `post_submitTest`, query for this ID before inserting. If it already exists, return the existing item ID instead of inserting a second result. This makes the Retry Saving button safe after network interruptions.

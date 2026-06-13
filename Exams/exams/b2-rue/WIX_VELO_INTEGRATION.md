# Brighton B2 RUOE Exam Integration

This version submits directly from the static exam page to your Wix HTTP function endpoint using `fetch()`.

The endpoint is configured in `../../config.js`:

```js
API_BASE_URL: "https://YOUR-WIX-SITE/_functions"
```

When the student finishes, the exam posts the payload to:

```text
POST /_functions/submitExam
```

The payload includes:

- `examId`
- `examTitle`
- `studentName`
- `classId`
- `answers`
- `answerList`
- `flagged`
- `notes`
- `startedAt`
- `submittedAt`
- `timeSpentSeconds`

The exam also still sends a `postMessage()` event called `BRIGHTON_B2_RUE_SUBMIT` for compatibility, but Wix iframes are not required for the static-hosted setup.

The Wix backend grades the submission using the `answerKeyJson` field in the `Exams` CMS collection. If that field is missing, the included backend file has an embedded fallback answer key for `brighton-b2-rue-final`.

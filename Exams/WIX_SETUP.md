# Wix Velo Setup

## 1. Create CMS collection: Exams

Collection ID: `Exams`

Fields:

- `title` — Text
- `examId` — Text
- `level` — Text
- `skill` — Text
- `description` — Text
- `shareUrl` — Text or URL
- `iframeUrl` — Text or URL, optional
- `isActive` — Boolean
- `totalQuestions` — Number
- `maxScore` — Number
- `answerKeyJson` — Text, use a large text field if available
- `createdAt` — Date and Time

Add the row from:

`cms-seed/Exams_brighton-b2-rue-final.json`

Important: update `shareUrl` to your real static exam URL, for example:

`https://yourname.github.io/brighton-exams/exams/b2-rue/index.html`

## 2. Create CMS collection: ExamSubmissions

Collection ID: `ExamSubmissions`

Fields:

- `submissionId` — Text
- `examId` — Text
- `examTitle` — Text
- `studentName` — Text
- `classId` — Text
- `answersJson` — Text
- `answerListJson` — Text
- `flaggedJson` — Text
- `notes` — Text
- `score` — Number
- `maxScore` — Number
- `percentage` — Number
- `partScoresJson` — Text
- `gradingDetailsJson` — Text
- `startedAt` — Date and Time
- `submittedAt` — Date and Time
- `submittedAtLocal` — Text
- `timeSpentSeconds` — Number
- `rawPayloadJson` — Text
- `status` — Text
- `gradingError` — Text

## 3. Permissions

`Exams`:

- Public read is acceptable.
- Write should be Admin only.

`ExamSubmissions`:

- Create is handled through backend code.
- Read should be restricted as much as your Wix plan/workflow allows.
- Update/Delete should be Admin only.

## 4. Add backend HTTP functions

In Wix Velo, create or open:

`Backend > http-functions.js`

Paste the contents of:

`wix-backend/http-functions.js`

Publish the Wix site.

Test:

`https://YOUR-WIX-SITE/_functions/getExams`

It should return JSON.

## 5. Configure static website

In `config.js`, set:

```js
API_BASE_URL: "https://YOUR-WIX-SITE/_functions"
```

## 6. Test full flow

1. Open `teacher.html` from the static host.
2. Confirm the B2 RUOE exam appears.
3. Open the exam and submit a test attempt.
4. In Wix CMS, check that a row appears in `ExamSubmissions`.
5. Open `results.html`, enter the Class ID used in the test, and load results.

## 7. Answer key and grading notes

The answer key is stored in two places:

1. `answer-keys/brighton-b2-rue-final.json` for local dashboard fallback.
2. `Exams.answerKeyJson` in Wix CMS for backend grading.

The backend grading is case-insensitive, trims spaces, collapses repeated spaces, and expands common contractions for Part 4.

Part 4 accepts multiple variations and gives partial credit through two components per item.

# Brighton answer-key versioning

Brighton grading now supports immutable answer-key releases so a historical submission can be regraded with the same key that was active when it was stored.

## Current release

`2026-09-08.1`

The release manifest lives at:

`Exams/answer-keys/version.json`

The immutable snapshot for this release lives at:

`Exams/answer-keys/versions/2026-09-08.1/`

The top-level files in `Exams/answer-keys/` remain the editable **current** keys. A release snapshot must never be edited after it has been used for student submissions.

## How it works

1. `Exams/app-core.js` adds `answerKeyVersion` and `testVersion` to Brighton submission and live-progress payloads.
2. The Wix backend **must ignore those client values for authority** and store its own server-side release constant.
3. The results endpoints return the stored version with each row.
4. The shared client layer internally decorates the assessment ID with that server-returned version.
5. `Exams/shared-grading.js` resolves a versioned ID to `answer-keys/versions/[version]/[assessmentId].json`.
6. A row with no server-stored version stays usable, but the dashboards label its title `Legacy / unversioned` and grade it against the current key only as a compatibility fallback.

This means a legacy row is never presented as historically reproducible when the repository does not actually know which key release produced it.

## Wix migration required

GitHub cannot deploy the Wix backend. Before considering the migration complete, update the Wix collections and HTTP functions that back Tests, Exams, and live progress.

### Add fields

Add these Text fields to every persisted submission/progress collection that is returned by `getTestResults`, `getResults`, or `getProgress`:

- `answerKeyVersion`
- `testVersion`

For Tests, this means `TestResults`. For Exams and live progress, add the fields to the collections currently used by the corresponding Brighton HTTP functions.

### Stamp the version on the server

Use a server-side constant matching the repository release:

```js
const ANSWER_KEY_VERSION = "2026-09-08.1";
```

When inserting or updating a submission/progress row, store:

```js
answerKeyVersion: ANSWER_KEY_VERSION,
testVersion: ANSWER_KEY_VERSION,
```

Do **not** persist `payload.answerKeyVersion` as the authoritative value. The browser field is useful for diagnostics, but a student-controlled request must not be able to select its grading key.

### Return the fields

`getTestResults`, `getResults`, and `getProgress` must return `answerKeyVersion` (and preferably `testVersion`) with each item. Existing rows that do not contain the field should be returned unchanged; the frontend will identify them as legacy.

## Release procedure for future key changes

When any current answer key must change after submissions already exist:

1. Choose a new release ID, for example `2026-10-03.1`.
2. Apply the correction only to the top-level current JSON key(s).
3. Copy **all** top-level answer-key JSON files into `Exams/answer-keys/versions/[new-version]/`.
4. Update `currentVersion` and append the new version to `availableVersions` in `Exams/answer-keys/version.json`.
5. Update `ANSWER_KEY_VERSION` in `Exams/app-core.js` to the same value.
6. Update the Wix server-side `ANSWER_KEY_VERSION` to the same value and deploy it before reopening affected assessments.
7. Let GitHub Actions validate the release before merging.

Never modify or delete a previously released directory under `Exams/answer-keys/versions/`. CI rejects that on pull requests.

## Legacy rows

Rows created before this migration have no immutable version. They are intentionally marked `Legacy / unversioned`.

Do not assign a historical version to a legacy row unless there is independent evidence proving exactly which key release was active for that submission. Guessing a version would create false historical certainty.

# Brighton Placement — Wix setup

Final frontend/backend contract: `2026-09-19.7`

The browser renders visible questions. Wix remains authoritative for answer keys, objective scoring, adaptive routing, Speaking acceptance, final placement, resume state and the shareable result summary.

## Backend file

Use the complete backend from:

`Placement/wix-backend/http-functions.js`

The same code is mirrored in:

`Placement/wix-http-functions.example.js`

HTTP endpoints:

- `POST /_functions/startPlacement`
- `POST /_functions/resumePlacement`
- `POST /_functions/placementStep`
- `POST /_functions/submitSpeaking`
- `POST /_functions/skipSpeaking`
- `POST /_functions/placementResult`

`placementStep` is idempotent for the most recently completed module, so a network failure after Wix saves the route no longer breaks the Retry button.

The frontend also verifies saved sessions against Wix on reload instead of trusting Local Storage alone.

## PlacementSessions

Collection ID: `PlacementSessions`

| Field name | Field ID | Type |
| --- | --- | --- |
| Client session ID | `clientSessionId` | Text |
| Student name | `studentName` | Text |
| Placement version | `placementVersion` | Text |
| Status | `status` | Text |
| Phase | `phase` | Text |
| Module ID | `moduleId` | Text |
| Route JSON | `routeJson` | Text |
| Progress JSON | `progressJson` | Text |
| Started at | `startedAt` | Date and Time |
| Updated at | `updatedAt` | Date and Time |
| Completed at | `completedAt` | Date and Time |
| Time spent seconds | `timeSpentSeconds` | Number |
| Provisional level | `provisionalLevel` | Text |
| Final level | `finalLevel` | Text |
| Confidence | `confidence` | Number |

Runtime collection. Normally starts empty.

## PlacementResponses

Collection ID: `PlacementResponses`

| Field name | Field ID | Type |
| --- | --- | --- |
| Response key | `responseKey` | Text |
| Session ID | `sessionId` | Text |
| Client session ID | `clientSessionId` | Text |
| Placement version | `placementVersion` | Text |
| Module ID | `moduleId` | Text |
| Phase | `phase` | Text |
| Item ID | `itemId` | Text |
| Response JSON | `responseJson` | Text |
| Correct | `correct` | Boolean |
| Score | `score` | Number |
| Response time ms | `responseTimeMs` | Number |
| Answered at | `answeredAt` | Date and Time |

Runtime collection. Normally starts empty.

## PlacementItems — PRIVATE answer keys

Collection ID: `PlacementItems`

This collection must be backend-only/private.

| Field name | Field ID | Type |
| --- | --- | --- |
| Item ID | `itemId` | Text |
| Module ID | `moduleId` | Text |
| Placement version | `placementVersion` | Text |
| Correct option ID | `correctOptionId` | Text |
| Target level | `targetLevel` | Text |
| Weight | `weight` | Number |
| Active | `isActive` | Boolean |

Current answer-key version:

`2026-09-19.7`

The production backend uses a separate `ITEM_KEY_VERSION`, so future frontend-only changes do not require duplicating the answer-key rows.

The real populated `PlacementItems.csv` is intentionally **not committed to this public GitHub repository** because it contains the correct answers. Import the private CSV supplied separately into Wix.

Public schema/template files live under:

`Placement/wix-cms/`

## PlacementSpeaking

Collection ID: `PlacementSpeaking`

| Field name | Field ID | Type |
| --- | --- | --- |
| Session ID | `sessionId` | Text |
| Client session ID | `clientSessionId` | Text |
| Placement version | `placementVersion` | Text |
| Prompt ID | `promptId` | Text |
| Prompt level | `promptLevel` | Text |
| Audio URL | `audioUrl` | URL |
| Transcript | `transcript` | Text |
| Duration seconds | `durationSeconds` | Number |
| Speech seconds | `speechSeconds` | Number |
| Word count | `wordCount` | Number |
| Words per minute | `wpm` | Number |
| Recognition confidence | `recognitionConfidence` | Number |
| Segment count | `segmentCount` | Number |
| Fluency | `fluency` | Number |
| Grammar | `grammar` | Number |
| Vocabulary | `vocabulary` | Number |
| Pronunciation | `pronunciation` | Number |
| Communication | `communication` | Number |
| Speaking level | `speakingLevel` | Text |
| Grader version | `graderVersion` | Text |
| Metrics JSON | `metricsJson` | Text |
| Created at | `createdAt` | Date and Time |

Runtime collection. Normally starts empty.

V1 does not upload the raw microphone recording, so `audioUrl` remains blank.

## Final result screen

When a placement finishes, Wix rebuilds the result from stored responses and returns:

- student name;
- final level;
- result ID;
- completion date;
- Language Use result;
- Reading result;
- Listening result;
- Speaking result, or `Not scored` when Speaking was skipped after a detected technical error.

The public result screen can then be screenshotted, saved as PNG or shared through the browser's native Share sheet.

The screen is deliberately labelled **Placement result · not a CEFR certification**.

## Adaptive routing

- Calibration: 5 items → routes to A1, A2, B1 or B2 Language.
- Language: 5 items → produces provisional PRE-A1 through C1 band.
- Reading: 4 items → 0–1 down one band, 2–3 stable, 4 up one band.
- Listening: 3 independent clips → 0 down one band, 1–2 stable, 3 up one band.
- Speaking: deterministic browser/Wix grading may move one adjacent band.
- Speaking technical failure: `I cannot speak now` becomes available and finalizes the objective Language + Reading + Listening band.

## Permissions

Use restrictive CMS permissions for every Placement collection.

The public site must never read `PlacementItems` directly. Only Wix backend code should query it.

## CSV files

Public templates:

- `Placement/wix-cms/PlacementSessions.csv`
- `Placement/wix-cms/PlacementResponses.csv`
- `Placement/wix-cms/PlacementSpeaking.csv`
- `Placement/wix-cms/PlacementItems.PRIVATE.template.csv`

The populated private answer-key CSV is supplied separately and should be kept out of public source control.

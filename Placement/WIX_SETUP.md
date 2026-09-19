# Brighton Placement — Wix setup

This setup is for the adaptive placement app at `/Placement/`.

The browser renders questions, but **answer keys, scoring, routing, final placement and speaking grades remain server-authoritative**.

Current contract version: `2026-09-19.5`

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
| Review required | `reviewRequired` | Boolean |
| Placement status | `placementStatus` | Text |

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

## PlacementItems — private answer keys

Collection ID: `PlacementItems`

This collection must be **backend-only / private**. Do not make it readable from the public site.

The visible question text lives in `Placement/item-bank.js`. This collection stores only the grading metadata.

| Field name | Field ID | Type |
| --- | --- | --- |
| Item ID | `itemId` | Text |
| Module ID | `moduleId` | Text |
| Placement version | `placementVersion` | Text |
| Correct option ID | `correctOptionId` | Text |
| Target level | `targetLevel` | Text |
| Weight | `weight` | Number |
| Active | `isActive` | Boolean |

Every visible item in these modules needs one matching private row:

- `calibration-01`
- `lang-a1`
- `lang-a2`
- `lang-b1`
- `lang-b2`
- `reading-prea1`
- `reading-a1`
- `reading-a2`
- `reading-b1`
- `reading-b1plus`
- `reading-b2`
- `reading-c1`
- `listening-prea1`
- `listening-a1`
- `listening-a2`
- `listening-b1`
- `listening-b1plus`
- `listening-b2`
- `listening-c1`

Set `placementVersion` to `2026-09-19.4`, `weight` to `1`, and `isActive` to `true`.

Do **not** place `correctOptionId` values in the public GitHub repository.

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
| Needs review | `needsReview` | Boolean |
| Status | `status` | Text |
| Metrics JSON | `metricsJson` | Text |
| Created at | `createdAt` | Date and Time |

## HTTP functions

Copy `Placement/wix-http-functions.example.js` into the site's existing backend `http-functions.js`.

The current app uses:

- `POST /_functions/startPlacement`
- `POST /_functions/placementStep`
- `POST /_functions/submitSpeaking`

`placementStep` verifies the active session and module, loads the private answer keys from `PlacementItems`, stores item telemetry in `PlacementResponses`, and chooses the next module.

The first routing pass is intentionally simple and auditable:

- Calibration chooses one of four Language bands: A1, A2, B1 or B2.
- The selected Language module produces a provisional PRE-A1 through C1 estimate and routes the student into the matching Reading band.
- Reading contains one short level-matched text and four questions.
- A Reading result of 0–1/4 moves the provisional level down one band, 2–3/4 keeps it stable, and 4/4 moves it up one band.
- Reading then routes into the matching Listening band.
- Listening uses three independent MP3 clips, one question per clip.
- Each clip may be started a maximum of three times. The frontend saves that count locally and the response telemetry stores the number of plays used.
- The backend rejects Listening answers that report zero plays.
- A Listening result of 0/3 moves the provisional level down one band, 1–2/3 keeps it stable, and 3/3 moves it up one band.
- Listening then routes into a level-matched Speaking module such as `speaking-b1plus`.

Speaking is graded without a paid AI service. The browser records the answer and, where supported, uses the browser's built-in English speech-recognition capability to produce a transcript. Wix then calculates the rubric deterministically from the transcript plus measurable recording features.

The deterministic rubric uses:
- fluency: duration, speech activity, pace and filler rate;
- grammar: a **structural-range proxy** based on length, clause markers and speech segments; it does not detect grammatical errors;
- vocabulary: response length, lexical variety and longer-word usage;
- pronunciation: an **intelligibility proxy** based on recognition success, speech activity and plausible pace; it is not phoneme-level pronunciation scoring;
- communication: a task-completion/coherence proxy based on length, connectors and speech segments.

Speaking can move the objective estimate by at most one adjacent Brighton band. If transcription is unavailable, the recording is too short, or speech activity is too low, the objective estimate is preserved and the result becomes `REVIEW RECOMMENDED`.

The current version does **not upload the raw recording** to Wix. The audio is used in-browser for measurement and then discarded after submission. `audioUrl` remains blank.

## Permissions

Use restrictive CMS permissions for every Placement collection.

The public GitHub app should never write directly to CMS and must never be able to read `PlacementItems`.

## Versioning

When routing logic or the private item keys change materially, increment `PLACEMENT_VERSION` in both the frontend and Wix backend. Keep old sessions tied to the version under which they were taken.

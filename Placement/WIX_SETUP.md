# Brighton Placement — Wix setup

This setup is for the adaptive placement app at `/Placement/`.

The browser may create the session and report progress, but **placement scoring, answer keys, routing, final levels and speaking grades must remain server-authoritative**.

## 1. CMS collection: PlacementSessions

Collection ID: `PlacementSessions`

Set permissions as restrictively as possible. The public page must not write directly to CMS; only backend HTTP functions should write with backend permissions.

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

For the current first step, only the identity/session fields are populated. Keep the later fields now so the collection does not need to be restructured when adaptive routing is added.

## 2. CMS collection: PlacementResponses

Collection ID: `PlacementResponses`

This will store item-level telemetry when Calibration is wired.

| Field name | Field ID | Type |
| --- | --- | --- |
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

Do not trust `correct`, `score`, level or difficulty values sent by the browser. They should be calculated by the Wix backend from a private item bank.

## 3. CMS collection: PlacementSpeaking

Collection ID: `PlacementSpeaking`

Create this now for the final speaking phase.

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
| Fluency | `fluency` | Number |
| Grammar | `grammar` | Number |
| Vocabulary | `vocabulary` | Number |
| Pronunciation | `pronunciation` | Number |
| Communication | `communication` | Number |
| Speaking level | `speakingLevel` | Text |
| Grader version | `graderVersion` | Text |
| Needs review | `needsReview` | Boolean |
| Created at | `createdAt` | Date and Time |

The current frontend does not upload audio yet.

## 4. Wix HTTP functions

Copy the functions in `Placement/wix-http-functions.example.js` into the site's existing backend `http-functions.js`.

The current frontend calls:

- `POST /_functions/startPlacement`

The next Placement slice can add:

- `POST /_functions/placementStep`
- `POST /_functions/savePlacementProgress`
- speaking upload / grading endpoints

## 5. Versioning

The first frontend/backend contract uses:

`2026-09-19.1`

The Wix backend is authoritative for the stored `placementVersion`. Do not trust a version supplied by the browser.

When the routing logic or item bank changes materially, increment the placement version and keep old sessions tied to their original version.

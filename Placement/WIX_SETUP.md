# Brighton Placement — Wix setup

Frontend/backend contract: `2026-09-19.8`  
Private answer-key version: `2026-09-19.7`

## Brighton Exams Wix site

Target site:

- Site: **Brighton Exams**
- Site ID: `06a80236-67d7-4837-b4c8-2a62b29ee79b`
- URL: `https://chiispiitas.wixsite.com/brightonexams`

## CMS status — configured

The Placement system uses four new, isolated CMS collections:

- `BrightonPlacementSessions`
- `BrightonPlacementResponses`
- `BrightonPlacementItems`
- `BrightonPlacementSpeaking`

They were created with ADMIN-only read/insert/update/remove permissions.

`BrightonPlacementItems` has been seeded with **74/74** private answer-key rows for item-key version `2026-09-19.7`.

No existing Tests/Exams collection was renamed, patched, truncated, deleted, or reseeded.

## Backend isolation

Wix requires externally exposed Velo HTTP functions to be exported from the single reserved site file:

`Backend/http-functions.js`

So Placement does **not** replace that file.

All Placement implementation lives in the separate module:

`Backend/placement-api.js`

Source:

`Placement/wix-backend/placement-api.js`

The existing Tests/Exams `Backend/http-functions.js` should retain every current import and function. Add only the small namespaced adapter from:

`Placement/wix-backend/http-functions-placement-adapter.example.js`

This adds the following Placement-only endpoints:

- `POST /_functions/brightonPlacementStart`
- `POST /_functions/brightonPlacementResume`
- `POST /_functions/brightonPlacementStep`
- `POST /_functions/brightonPlacementSubmitSpeaking`
- `POST /_functions/brightonPlacementSkipSpeaking`
- `POST /_functions/brightonPlacementResult`

No existing Tests/Exams endpoint name is reused.

## BrightonPlacementSessions

Runtime collection. Starts empty.

| Field ID | Type |
| --- | --- |
| `clientSessionId` | Text |
| `studentName` | Text |
| `placementVersion` | Text |
| `status` | Text |
| `phase` | Text |
| `moduleId` | Text |
| `routeJson` | Text |
| `progressJson` | Text |
| `startedAt` | Date and Time |
| `updatedAt` | Date and Time |
| `completedAt` | Date and Time |
| `timeSpentSeconds` | Number |
| `provisionalLevel` | Text |
| `finalLevel` | Text |
| `confidence` | Number |

## BrightonPlacementResponses

Runtime collection. Starts empty.

| Field ID | Type |
| --- | --- |
| `responseKey` | Text |
| `sessionId` | Text |
| `clientSessionId` | Text |
| `placementVersion` | Text |
| `moduleId` | Text |
| `phase` | Text |
| `itemId` | Text |
| `responseJson` | Text |
| `correct` | Boolean |
| `score` | Number |
| `responseTimeMs` | Number |
| `answeredAt` | Date and Time |

## BrightonPlacementItems

Private answer-key collection.

| Field ID | Type |
| --- | --- |
| `itemId` | Text |
| `moduleId` | Text |
| `placementVersion` | Text |
| `correctOptionId` | Text |
| `targetLevel` | Text |
| `weight` | Number |
| `isActive` | Boolean |

The public GitHub repository must never contain the populated answer-key CSV.

The backend uses:

`ITEM_KEY_VERSION = "2026-09-19.7"`

This is deliberately independent from the frontend/backend contract version.

## BrightonPlacementSpeaking

Runtime collection. Starts empty.

| Field ID | Type |
| --- | --- |
| `sessionId` | Text |
| `clientSessionId` | Text |
| `placementVersion` | Text |
| `promptId` | Text |
| `promptLevel` | Text |
| `audioUrl` | URL |
| `transcript` | Text |
| `durationSeconds` | Number |
| `speechSeconds` | Number |
| `wordCount` | Number |
| `wpm` | Number |
| `recognitionConfidence` | Number |
| `segmentCount` | Number |
| `fluency` | Number |
| `grammar` | Number |
| `vocabulary` | Number |
| `pronunciation` | Number |
| `communication` | Number |
| `speakingLevel` | Text |
| `graderVersion` | Text |
| `metricsJson` | Text |
| `createdAt` | Date and Time |

V1 does not upload raw Speaking audio, so `audioUrl` remains blank.

## Current routing

- Calibration: 5 items.
- Language: 5 adaptive items.
- Reading: 4 adaptive items.
- Listening: 3 independent MP3 questions, maximum 3 plays each.
- Speaking: browser recording/transcription plus deterministic server grading.
- Speaking technical failure only: enables **I cannot speak now**, which preserves the objective level.
- Result: shareable certificate-style placement result.

## Public CMS templates

The public templates under `Placement/wix-cms/` contain schemas only.

The real private answer keys are stored only in Wix.

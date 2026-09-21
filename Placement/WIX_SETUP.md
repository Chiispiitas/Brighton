# Brighton Placement — manual Wix setup

Frontend/backend contract: `2026-09-20.1`  
Answer-key version: `2026-09-19.7`

The Wix-side setup is intentionally manual. The repository contains the files to paste/import, but it does not create, delete, seed, or change permissions on the live Brighton Exams Wix project.

## Backend layout

Use the same modular layout as the other Brighton/Wix systems:

```
Backend/
├── http-functions.js   ← the site's existing public router
├── core.js             ← shared Exams / Tests / Placement helpers
├── exams.js
├── tests.js
├── placement.js
└── gemini-speaking.js  ← Placement speaking examiner
```

Placement backend source is mirrored under `Placement/wix-backend/`. For the Gemini speaking release, copy/update:

- `Placement/wix-backend/gemini-speaking.js` → `Backend/gemini-speaking.js`
- `Placement/wix-backend/placement.js` → `Backend/placement.js`
- merge the Placement changes from `Placement/wix-backend/http-functions.js` into the site's existing `Backend/http-functions.js`; do **not** remove Tests/Exams routes.

### Gemini speaking secret

The Wix site must contain this exact Secrets Manager entry:

`BRIGHTON_PLACEMENT_GEMINI_API_KEY`

The secret is read only by backend code. Never place the Gemini key in GitHub, frontend JavaScript, CMS fields, logs, or HTTP responses.

Speaking recordings are sent to Gemini inline for assessment and are not written to `BrightonPlacementSpeaking`; `audioUrl` remains empty. The stored record contains the transcript, rubric scores and assessment evidence.

### Speaking transport limit

Wix Velo HTTP functions accept request bodies up to **512 KB**. The Placement frontend therefore records Speaking at a 24 kbps target bitrate and refuses Base64 audio above 400,000 characters before calling `brightonPlacementSubmitSpeaking`. Do not raise that frontend/backend guard unless the audio transport is redesigned; the previous multi-megabyte allowance caused the browser to show `Connection lost.` because Wix rejected the request before the handler ran.

Public Placement routes:

- `GET /_functions/brightonPlacementPing` — deployment smoke test

- `POST /_functions/brightonPlacementStart`
- `POST /_functions/brightonPlacementResume`
- `POST /_functions/brightonPlacementStep`
- `POST /_functions/brightonPlacementSubmitSpeaking`
- `POST /_functions/brightonPlacementSkipSpeaking`
- `POST /_functions/brightonPlacementResult`
- `GET /_functions/brightonPlacementResults` — teacher results list
- `GET /_functions/brightonPlacementDashboardResult?sessionId=...` — teacher result details

After adding/changing backend code, publish the Wix site before testing the production `/_functions/` URLs.

## CMS collections to create/import manually

- `BrightonPlacementSessions`
- `BrightonPlacementResponses`
- `BrightonPlacementItems`
- `BrightonPlacementSpeaking`

The runtime collections begin empty. `BrightonPlacementItems` must be populated with the 74-row answer-key CSV supplied separately.

The backend uses `suppressAuth: true` for its Wix Data operations, so the Placement frontend does not need direct CMS access. Choose the CMS permissions you want in Wix; this setup does not change them automatically.

### BrightonPlacementSessions

`clientSessionId` Text; `studentName` Text; `placementVersion` Text; `status` Text; `phase` Text; `moduleId` Text; `routeJson` Text; `progressJson` Text; `startedAt` Date and Time; `updatedAt` Date and Time; `completedAt` Date and Time; `timeSpentSeconds` Number; `provisionalLevel` Text; `finalLevel` Text; `confidence` Number.

### BrightonPlacementResponses

`responseKey` Text; `sessionId` Text; `clientSessionId` Text; `placementVersion` Text; `moduleId` Text; `phase` Text; `itemId` Text; `responseJson` Text; `correct` Boolean; `score` Number; `responseTimeMs` Number; `answeredAt` Date and Time.

### BrightonPlacementItems

`itemId` Text; `moduleId` Text; `placementVersion` Text; `correctOptionId` Text; `targetLevel` Text; `weight` Number; `isActive` Boolean.

### BrightonPlacementSpeaking

`sessionId` Text; `clientSessionId` Text; `placementVersion` Text; `promptId` Text; `promptLevel` Text; `audioUrl` URL; `transcript` Text; `durationSeconds` Number; `speechSeconds` Number; `wordCount` Number; `wpm` Number; `recognitionConfidence` Number; `segmentCount` Number; `fluency` Number; `grammar` Number; `vocabulary` Number; `pronunciation` Number; `communication` Number; `speakingLevel` Text; `graderVersion` Text; `metricsJson` Text; `createdAt` Date and Time.

## Important

The public repository keeps only the **schema template** for `BrightonPlacementItems`. Do not commit the populated answer-key CSV to a public repository.

## Current modular backend

The current Brighton backend uses one shared `Backend/core.js` for Exams, Tests and Placement. Do not add `placement-core.js`.

For Placement backend updates, use the files in `Placement/wix-backend/` and merge the current Placement routes from `Placement/wix-backend/http-functions.js` into the live modular `Backend/http-functions.js`.

## One-hour inactive-session cleanup

The current Placement frontend/backend expire **active** attempts after 60 minutes without student activity. Merge the latest Placement routes into `Backend/http-functions.js`, including:

- `POST /_functions/brightonPlacementActivity`
- `POST /_functions/brightonPlacementExpire`

The expiry deletes the active `BrightonPlacementSessions` row and its related `BrightonPlacementResponses` / `BrightonPlacementSpeaking` rows. Completed results are preserved.

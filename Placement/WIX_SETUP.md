# Brighton Placement — manual Wix setup

Frontend/backend contract: `2026-09-19.8`  
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
└── placement.js
```

Files supplied under `Placement/wix-backend/`:

- `placement.js`
- `http-functions-placement-routes.js` — merge this into the existing `Backend/http-functions.js`; do **not** replace existing Tests/Exams routes.

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

For Placement results, merge the latest `Placement/wix-backend/http-functions-placement-routes.js` into the current modular `Backend/http-functions.js`.

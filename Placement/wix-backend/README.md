# Brighton Placement Wix backend

These files now follow the **current modular Brighton assessment backend** supplied in `Brighton-Assessment-Wix-Modular-Backend-FIXED`.

The live/backend structure is:

```
Backend/
├── http-functions.js
├── core.js
├── exams.js
├── tests.js
└── placement.js
```

Placement uses the same shared `Backend/core.js` as Exams and Tests. There is no Placement-specific core module.

- `placement.js` — Placement business logic plus the teacher results-dashboard queries.
- `http-functions-placement-routes.js` — only the Placement imports/routes to merge into the current modular `Backend/http-functions.js`.

The student Placement endpoints remain:

- `POST /_functions/brightonPlacementStart`
- `POST /_functions/brightonPlacementResume`
- `POST /_functions/brightonPlacementStep`
- `POST /_functions/brightonPlacementSubmitSpeaking`
- `POST /_functions/brightonPlacementSkipSpeaking`
- `POST /_functions/brightonPlacementResult`

The teacher dashboard at `Placement/results.html` uses:

- `GET /_functions/brightonPlacementResults`
- `GET /_functions/brightonPlacementDashboardResult?sessionId=...`

The detailed result returns the stored speaking transcript and deterministic Speaking metrics. It also exposes `audioUrl` when a record has one; the current Placement frontend normally leaves `audioUrl` blank and does not upload raw recording audio.

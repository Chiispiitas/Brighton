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


## Inactivity cleanup

Active Placement attempts expire after **1 hour of inactivity**.

- The browser stores a `lastActivityAt` timestamp and clears its local Placement progress after one inactive hour.
- While an active student is interacting with the test, the browser sends a throttled activity touch to Wix so `updatedAt` reflects real activity.
- When the one-hour timer expires on an open device, the browser calls `POST /_functions/brightonPlacementExpire`, which deletes the active session plus its response/speaking rows.
- Stale active sessions are also cascade-deleted whenever Placement starts or the teacher Placement dashboard is loaded.
- Completed Placement results are never removed by this inactivity rule.

Additional routes:
- `POST /_functions/brightonPlacementActivity`
- `POST /_functions/brightonPlacementExpire`


## Legacy stale-session cleanup

The stale-session purge is intentionally tolerant of sessions created before the inactivity feature. It scans Placement sessions and evaluates inactivity in JavaScript using `updatedAt` with `startedAt` as fallback instead of depending on a database `lt(updatedAt)` filter. Active sessions older than one hour are cascade-deleted with their Placement response/speaking rows.

If a device still has a local copy of a session that has already been deleted from Wix, resume now detects the backend's `Placement session not found` response and clears that local progress instead of resurrecting it.


## Dashboard transport

The Placement results dashboard now uses **POST + text/plain JSON** for its two data routes:

- `POST /_functions/brightonPlacementResults`
- `POST /_functions/brightonPlacementDashboardResult`

GET versions remain available for compatibility. The POST transport matches the proven student Placement endpoints and avoids browser preflight/CORS edge cases on GitHub Pages.

The dashboard endpoints are read-only. They no longer run stale-session deletion inline; stale cleanup is handled by the Placement lifecycle/activity/expiry flow instead.

Use `options_...` exports in `Backend/http-functions.js` for CORS OPTIONS handling. Do not use `use_...` catch-all exports for these routes.

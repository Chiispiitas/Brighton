# Brighton Placement Wix backend

Contract: `2026-09-19.8`

The Placement backend is intentionally isolated from the existing Brighton Tests/Exams backend.

## Wix files

Create this new backend module in the **Brighton Exams** Wix project:

`Backend/placement-api.js`

Use the complete contents of:

`Placement/wix-backend/placement-api.js`

Wix exposes custom Velo HTTP functions only from the site's reserved:

`Backend/http-functions.js`

Therefore, **do not replace the existing file**. Keep every current Tests/Exams import and handler exactly as it is, then add only the Placement adapter contained in:

`Placement/wix-backend/http-functions-placement-adapter.example.js`

The adapter only imports `backend/placement-api` and adds namespaced Placement exports.

## Placement endpoints

- `POST /_functions/brightonPlacementStart`
- `POST /_functions/brightonPlacementResume`
- `POST /_functions/brightonPlacementStep`
- `POST /_functions/brightonPlacementSubmitSpeaking`
- `POST /_functions/brightonPlacementSkipSpeaking`
- `POST /_functions/brightonPlacementResult`

Each also has its matching `OPTIONS` export for CORS.

## Placement-only CMS

The module reads and writes only these collections:

- `BrightonPlacementSessions`
- `BrightonPlacementResponses`
- `BrightonPlacementItems`
- `BrightonPlacementSpeaking`

It does not query or mutate the Tests/Exams collections.

`PLACEMENT_VERSION` is `2026-09-19.8`.

`ITEM_KEY_VERSION` remains `2026-09-19.7`, matching the 74 private answer-key rows already seeded in Wix.

# Brighton Placement Wix backend

This folder mirrors the modular Wix backend structure used by the other Brighton systems.

- `placement-core.js` — Placement-only HTTP/CORS/request/CMS helpers; this avoids colliding with any existing Tests/Exams `core.js`.
- `placement.js` — all Placement routing, scoring, session, response and Speaking logic.
- `http-functions-placement-routes.js` — small route block to merge into the site's existing `Backend/http-functions.js`.

Do not replace the existing Brighton Exams `http-functions.js`. Keep its Tests/Exams routes and add the Placement imports/exports from the route block.

The frontend sends JSON as `text/plain;charset=UTF-8` to avoid unnecessary CORS preflight from GitHub Pages. `placement-core.readJsonBody()` accepts both JSON and text JSON bodies.

The live Wix site must be **published** after backend changes before production `/_functions/` routes exist.


## Deployment smoke test

After merging the routes and publishing Wix, open:

`https://chiispiitas.wixsite.com/brightonexams/_functions/brightonPlacementPing`

A correctly loaded backend returns JSON with `service: "brighton-placement"`. If this URL is 404, Wix has not registered the Placement route block or one of its imported backend modules failed to load.

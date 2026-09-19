# Brighton Placement Wix backend

This folder mirrors the modular Wix backend structure used by the other Brighton systems.

- `core.js` — reusable HTTP/CORS/request/CMS helpers.
- `placement.js` — all Placement routing, scoring, session, response and Speaking logic.
- `http-functions-placement-routes.js` — small route block to merge into the site's existing `Backend/http-functions.js`.

Do not replace the existing Brighton Exams `http-functions.js`. Keep its Tests/Exams routes and add the Placement imports/exports from the route block.

The frontend sends JSON as `text/plain;charset=UTF-8` to avoid unnecessary CORS preflight from GitHub Pages. `core.readJsonBody()` accepts both JSON and text JSON bodies.

The live Wix site must be **published** after backend changes before production `/_functions/` routes exist.

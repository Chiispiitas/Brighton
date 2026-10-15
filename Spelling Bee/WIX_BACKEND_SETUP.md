# Brighton Spelling Bee · Dedicated Wix backend and CMS

Spelling Bee uses its own backend contract and CMS collections.

Backend host:

`https://chiispiitas.wixsite.com/cms-server/_functions`

## Wix backend structure

Use this modular structure in Wix Velo:

```text
Backend/
├── http-functions.js
├── core.js
└── spelling-bee.js
```

Matching source files are mirrored in this repository at:

- `Spelling Bee/wix-backend/http-functions.js`
- `Spelling Bee/wix-backend/core.js`
- `Spelling Bee/wix-backend/spelling-bee.js`

`http-functions.js` is the public HTTP router. Shared HTTP/CMS helpers live in `core.js`, and Spelling Bee-specific CMS/business logic lives in `spelling-bee.js`.

## CMS collections

Required collection IDs:

- `SpellingBeeSessions`
- `SpellingBeeJudges`
- `SpellingBeeCommands`

Important schema requirements:

- `sessionCode` is **Text** in all three collections.
- `SpellingBeeJudges.letterMarksJson` is **Text**.

## CORS

The frontend is served from `https://exams.bebrighton.net`, while the backend is served by Wix.

The backend response helpers include `Access-Control-Allow-Origin`, and each public endpoint has a `use_<endpoint>` catch-all so Wix can answer browser OPTIONS preflight requests.

## HTTP routes

- `GET /_functions/spellingBeeSession?sessionCode=1234`
- `POST /_functions/spellingBeeSession`
- `GET /_functions/spellingBeeJudge?sessionCode=1234`
- `POST /_functions/spellingBeeJudge`
- `GET /_functions/spellingBeeCommand?sessionCode=1234`
- `POST /_functions/spellingBeeCommand`

The frontend in `Spelling Bee/js/cloud.js` already targets these routes on `cms-server`.

## Audience Screen View

The stage display uses the same published session endpoint with an independent
broadcast session record. Its `presenterStateJson` contains `screenBroadcast: true`
and a `broadcast` object holding the roster and public scene. The existing backend
already stores and returns these fields, so no additional collection, field,
route, or Wix code publish is required. See [SCREEN_VIEW.md](SCREEN_VIEW.md).

## Important deployment step

Production `/_functions/` routes use the site's **published backend code**. After changing `http-functions.js`, `core.js`, or `spelling-bee.js` in Wix, publish `cms-server` before testing the production URLs.

# Horizons companion

A responsive, English-only study companion for the Brighton Horizons books. The first release includes the complete A1 Unit 1 practice scope: lessons 1A–1D, all nine referenced vocabulary banks, 23 small word sets, 48 open path activities and 66 grammar question templates. It complements the printed book rather than reproducing its lesson pages.

## Open the app

Production: https://exams.bebrighton.net/Horizons/App/

- Fresh public A1 example: `DEMO-HZ-A1-001`.
- Additional-book example: `DEMO-HZ-A2-001`. A2 is a clearly labelled linking preview; A2 learning content is not included in this release.
- Public examples restore shared demonstration profiles. Use fictional details. Private printed codes will belong to individual learners.

There is no email or password. A book code creates or restores one saved profile. Adding another unused code while signed in links that book to the same profile. Any active linked code can restore that profile on another device. Twelve calendar months start on first redemption, and repeated visits never extend the original expiry.

## What learners can do

- Follow a recommended animated path, continue their next activity, or jump to any of the four lessons.
- Study all 135 canonical bank entries plus seven source question models; hear each of the 142 models in Jessica's voice.
- Combine word sets across lessons, with 8-word, 16-word or all-selected-word rounds; choose recognition, typed recall, matching or memory.
- Practise grammar through choices and sentence building, plus number codes, spelling, opposites, countries, short reading, fictional form completion and twelve actual Unit 1 book recordings.
- Receive specific corrections, revisit missed words, and retain server-graded progress across devices.
- Edit a private optional date of birth, display name and daily goal; create an avatar from generated body, clothing, hair and accessory layers and earn three wearable pins.
- Keep a gentle streak and XP without hearts, paid retries or locked lesson progression.

## Visual and media sources

The interface uses the supplied M PLUS Rounded 1c family. Native TTF files are retained alongside lightweight Latin WOFF2 subsets and their licence. The original Horizons wordmark remains separate.

Pico, Mina, Alex, Jo, the town, avatars, occupation pictures, navigation objects and app icon were made with the built-in ImageGen tool. Native PNG bytes and transparency are preserved. CSS viewports select the generated atlas parts; ordinary transforms animate the images. Pico uses sixteen parts, shoulder/elbow joints, separate eyes for blinking and an intact torso beneath his strap.

Exact prompts, native source paths and hashes: [art provenance](assets/art/provenance.json). Art coordinates: [manifest](assets/art/manifest.json). New pronunciation scripts, hashes and independent transcript checks: [audio records](assets/audio/generation-records.json). Existing book audio remains unchanged.

## Hosting and identity

The frontend is buildless native JavaScript, hosted in this repository through GitHub Pages. Serve this repository root over HTTP for local development, then visit `/Horizons/App/`.

The actual deployed Wix API uses six private CMS collections. It validates book entitlement, profile ownership, avatar rewards, attempts and grading on the server. Device sessions use an opaque token in a first-party cookie; the original code is not saved in browser storage. Because GitHub Pages is static, this cookie is JavaScript-readable, not HttpOnly. A restrictive content policy and escaped user text are included. See [backend documentation](backend/README.md) and the [API contract](backend/API-CONTRACT.json).

Sessions last 90 days. Expired or revoked books cannot start practice or save attempts, while learners can retain their profile and add another book. Production code issuance is a private administrative step, not a public app endpoint. Replace the current per-worker redemption throttle with a distributed limit before a large printed-code campaign.

## Validation and maintenance

- `npm test`: canonical bank coverage, all activity types, grading and learning boundaries.
- `cd backend` then `npm test`: entitlement, linked-code identity, input validation, ownership, concurrent redemption, server grading, idempotency, mastery and earned rewards.
- Browser exercises in `tests/` use isolated example profiles and the real hosted backend; public example 001 is reserved for users.
- [Content coverage](reports/content-coverage.json), [independent learning checks](reports/learning-browser.json), [backend checks](backend/reports/live-backend.json) and [avatar/reward checks](backend/reports/live-profile.json) record scope and limitations.

Keep the client content engine and backend copy synchronized with `backend/scripts/sync-content.mjs` before redeploying. New content must pass the [app audit](APP-AUDIT.md). Runtime credentials, build folders and dependencies stay ignored. No book lesson file was modified to create this app.

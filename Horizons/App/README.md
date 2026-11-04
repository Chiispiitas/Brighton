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

Pico, Mina, Alex, Jo, the town, avatars, occupation pictures, navigation objects and app icon were made with the built-in ImageGen tool. Native PNG bytes and transparency are preserved. CSS viewports select the generated atlas parts at a uniform scale. Pico and the three humans have articulated limbs, fixed head silhouettes and separate blinking eyes. Mina checks a map and points, Alex follows a rhythm and adjusts his headphones, and Jo offers a mug and handles a café cloth. Sixteen occupation vignettes have generated task-action frames. Learner avatars are animated upper-chest busts with head gestures, eye-only blinks and shoulder responses.

Exact prompts, native source paths and hashes: [art provenance](assets/art/provenance.json). Art coordinates: [manifest](assets/art/manifest.json). New pronunciation scripts, hashes and independent transcript checks: [audio records](assets/audio/generation-records.json). Existing book audio remains unchanged.

Refinement prompt sets: [human animation parts](assets/art/companion-motion-provenance.json), [occupation animation frames](assets/art/jobs-motion-provenance.json), [avatar blink artwork](assets/art/avatar-blink-v1.provenance.json). Earlier static sheets remain as source references. Raster viewports now contain artwork proportionally even when a UI box has a different shape. Paths use paired mirrored lanes and equal row spacing, retaining all 48 activities while reducing phone path length by about 38% against the first release.

Distinct whole-body postures are used across screens: Pico explores crouched, reads seated, strides and leaps; Mina steps, kneels, reads on a bench and skips; Alex listens standing, sits cross-legged, crouches beside a speaker and dances; Jo offers a mug, leans over a counter, reads seated and claps. Each generated posture has four action frames. Welcome companions retain their articulated standing rigs. Bust avatars have portrait, raised-hand greeting and hand-to-chin thinking postures, with real generated hand and forearm parts. Additional native artwork and exact prompts: [Pico postures](assets/art/pico-postures-v1.provenance.json), [human postures](assets/art/companion-postures-provenance.json), [avatar gestures](assets/art/avatar-gestures-v1.provenance.json).

## Hosting and identity

The frontend is buildless native JavaScript, hosted in this repository through GitHub Pages. Serve this repository root over HTTP for local development, then visit `/Horizons/App/`.

The actual deployed Wix API uses six private CMS collections. It validates book entitlement, profile ownership, avatar rewards, attempts and grading on the server. Device sessions use an opaque token in a first-party cookie; the original code is not saved in browser storage. Because GitHub Pages is static, this cookie is JavaScript-readable, not HttpOnly. A restrictive content policy and escaped user text are included. See [backend documentation](backend/README.md) and the [API contract](backend/API-CONTRACT.json).

Sessions last 90 days. Expired or revoked books cannot start practice or save attempts, while learners can retain their profile and add another book. Production code issuance is a private administrative step, not a public app endpoint. Replace the current per-worker redemption throttle with a distributed limit before a large printed-code campaign.

## Validation and maintenance

Latest graphics evidence: [site-wide screen audit](reports/graphics-browser.json), [compact paths and motion bounds](reports/graphics-layout.json), [animated bust variants](reports/avatar-bust.json). These cover the refined artwork and animation system; first-release reports remain as historical evidence.

The [verified graphics release](reports/graphics-release.json) links the full 284-view audit, actual hosted checks, native frame-advancement proof, final lesson-header verification and byte-for-byte readback of 198 published runtime files. The two Mina lesson headers intentionally use different body poses: stepping in 1A and reading seated in 1C.

- `npm test`: canonical bank coverage, all activity types, grading and learning boundaries.
- `cd backend` then `npm test`: entitlement, linked-code identity, input validation, ownership, concurrent redemption, server grading, idempotency, mastery and earned rewards.
- Browser exercises in `tests/` use isolated example profiles and the real hosted backend; public example 001 is reserved for users.
- [Content coverage](reports/content-coverage.json), [independent learning checks](reports/learning-browser.json), [backend checks](backend/reports/live-backend.json) and [avatar/reward checks](backend/reports/live-profile.json) record scope and limitations.
- Release evidence: [hosted release](reports/release.json). The deployed app passed 19 learning-flow checks and 10 sign-in/profile/book/device checks. All 184 runtime/media files matched committed bytes. The 35 responsive/refinement checks and 41 content/backend unit tests also passed. Browser automation used Microsoft Edge/Chromium; Safari and Firefox are not claimed as tested.

Keep the client content engine and backend copy synchronized with `backend/scripts/sync-content.mjs` before redeploying. New content must pass the [app audit](APP-AUDIT.md). Runtime credentials, build folders and dependencies stay ignored. No book lesson file was modified to create this app.

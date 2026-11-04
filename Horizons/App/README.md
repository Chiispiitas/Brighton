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

## Static visual edition

The interface keeps M PLUS Rounded1c and the original Horizons wordmark. This edition deliberately removes all animation: no floating, blinking, gestures, hover displacement or picture-sequence playback. Artwork changes immediately only when the learner selects an option or moves to another question/page.

Pico, Mina, Alex and Jo now use sixteen newly generated complete still illustrations. Seventeen occupation/school pictures are complete native drawings with supported props. The town, UI pictures, reward shapes and Pico app icon were also regenerated. Native ImageGen PNG bytes and alpha are retained; measured atlas crops are fitted at one uniform scale.

The avatar customizer follows the supplied rounded-square-face references. New static heads, whole chest clothing, hair and extras form a registered bust, with no jointed limbs or animation. Both bases, all six skin IDs, all saved hair/clothing/accessory IDs and earned-pin rules remain compatible with existing profiles.

Exact built-in ImageGen prompts, native paths and hashes: [cast](assets/art/cast-static-v1.provenance.json), [occupations](assets/art/jobs-static-v1.provenance.json), [avatar](assets/art/avatar-static-v1.provenance.json), [UI/town/icon](assets/art/ui-static-v1.provenance.json). Earlier motion assets and reports are retained as history and are not loaded by the static renderer. Pronunciation scripts, source hashes and independent transcript checks remain in the [audio records](assets/audio/generation-records.json). No book lesson or recording was changed.

## Hosting and identity

The frontend is buildless native JavaScript, hosted in this repository through GitHub Pages. Serve this repository root over HTTP for local development, then visit `/Horizons/App/`.

The actual deployed Wix API uses six private CMS collections. It validates book entitlement, profile ownership, avatar rewards, attempts and grading on the server. Device sessions use an opaque token in a first-party cookie; the original code is not saved in browser storage. Because GitHub Pages is static, this cookie is JavaScript-readable, not HttpOnly. A restrictive content policy and escaped user text are included. See [backend documentation](backend/README.md) and the [API contract](backend/API-CONTRACT.json).

Sessions last 90 days. Expired or revoked books cannot start practice or save attempts, while learners can retain their profile and add another book. Production code issuance is a private administrative step, not a public app endpoint. Replace the current per-worker redemption throttle with a distributed limit before a large printed-code campaign.

## Validation and maintenance

Current evidence: [static release](reports/static-release.json), [responsive/functional browser checks](reports/static-release-browser.json), [returning-browser cache upgrade](reports/static-cache-upgrade.json), [hosted browser checks](reports/static-release-browser-hosted.json), [hosted cache upgrade](reports/static-cache-upgrade-hosted.json), and [published asset parity](reports/publication-assets.json). Structural fit, unchanged pixels/zero running animation, and actual visual approval are reported separately. Browser coverage is Edge/Chromium; other engines are not claimed as tested.

The [app audit](APP-AUDIT.md) records the static design decision and supersedes previous motion requirements. Failed native examples are retained outside active runtime mappings. Existing [content coverage](reports/content-coverage.json), [learning checks](reports/learning-browser.json), [backend checks](backend/reports/live-backend.json) and [profile/reward checks](backend/reports/live-profile.json) describe the learning/access contracts.

- `npm test`: canonical banks, all activity types, grading and learning boundaries.
- `cd backend` then `npm test`: entitlement, linked-code identity, ownership, server grading, idempotency, mastery and rewards.
- Browser checks use reserved isolated example profiles. Public example001 remains for learners.
- Keep the client content engine and backend copy synchronized with `backend/scripts/sync-content.mjs` before content/backend redeployment. This visual edition changes neither.

Credentials, dependencies and unrelated book changes stay excluded. The abandoned selective-animation pass is preserved separately in Git stash d935ff2b4abb68181a6bca3a6d4661f81a2a43da; the last published baseline is bbd859f.

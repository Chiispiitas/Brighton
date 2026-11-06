# Horizons companion

Mastery: answer each item correctly once without a hint. An eight-question round with eight correct answers on a ten-item island gives 8/10 mastered; continue with the remaining two. All mastered items earn a gold island and crown. Existing saved progress is recalculated under this rule.

Session transfer: [complete handoff](docs/SESSION-HANDOFF.md) and [copyable new-chat prompt](docs/NEW-CHAT-PROMPT.txt).

Production rules: [complete website audit](APP-AUDIT.md), [image production guide](docs/IMAGE-PRODUCTION.md), and [seven mandatory visual reference sheets](docs/image-references/reference-pack.json). Before every ImageGen call, validate the saved brief with tools/check-image-brief.py and attach the returned image paths; the seven-input limit includes edit targets.

A responsive study companion for the Brighton Horizons books, with English controls and Spanish vocabulary cues. The current release covers A1 Unit 1: lessons 1A–1D, all nine referenced vocabulary banks, 23 small word sets, 21 compact path islands and 66 grammar question templates. It complements the printed book rather than reproducing its lesson pages. Earlier activity identifiers remain compatible with saved attempts.

## Open the app

Production: https://exams.bebrighton.net/Horizons/App/

- Fresh public A1 example: `DEMO-HZ-A1-001`.
- Additional-book example: `DEMO-HZ-A2-001`. A2 is a clearly labelled linking preview; A2 learning content is not included in this release.
- Public examples restore shared demonstration profiles. Use fictional details. Private printed codes will belong to individual learners.

There is no email or password. A book code creates or restores one saved profile. Adding another unused code while signed in links that book to the same profile. Any active linked code can restore that profile on another device. Twelve calendar months start on first redemption, and repeated visits never extend the original expiry.

## What learners can do

- Follow a compact static path or jump to any of the four lessons. Tap an island to see its topic, word/question count, duration and Start button.
- Study all 135 canonical bank entries plus seven source question models; hear each of the 142 models in Jessica's voice.
- Combine word sets across lessons, with 8-word, 16-word or all-selected-word rounds; choose typed recall, listening, Spanish matching or memory.
- Type grammar and reading answers. The reusable answer matcher accepts reviewed ordinary variants while preserving capitalization and explicit short/full-form tasks.
- Use two listening/reading games per lesson and twelve actual Unit 1 book recordings. Listening tasks hide answer cues and offer deterministic non-audio alternatives through I can't listen now.
- Receive specific corrections, revisit missed words, and retain server-graded progress across devices.
- Edit a private optional date of birth, display name and daily goal; create an avatar from generated body, clothing, hair and accessory layers and earn three wearable pins.
- All lessons are available. Progress and XP remain saved internally; the Progress page and its navigation are temporarily removed.

## Static visual edition

The interface keeps M PLUS Rounded1c and the original Horizons wordmark. Characters remain still, with no idle floating, blinking, gestures or picture-sequence playback. Changing an avatar option triggers one brief preview bounce and an ImageGen sparkle reveal; reduced-motion settings disable this feedback. Profile options use category tabs, and Learn uses compact floating unit/XP/streak indicators and non-modal island bubbles.

Pico, Mina, Alex and Jo now use sixteen newly generated complete still illustrations. Seventeen occupation/school pictures are complete native drawings with supported props. The town, UI pictures, reward shapes and Pico app icon were also regenerated. Native ImageGen PNG bytes and alpha are retained; measured atlas crops are fitted at one uniform scale.

The avatar customizer follows the supplied rounded-square-face references. New static heads, whole chest clothing, hair and extras form a registered bust, with no jointed limbs or animation. Both bases, all six skin IDs, all saved hair/clothing/accessory IDs and earned-pin rules remain compatible with existing profiles.

Exact built-in ImageGen prompts, native paths and hashes: [cast](assets/art/cast-static-v1.provenance.json), [occupations](assets/art/jobs-static-v1.provenance.json), [avatar](assets/art/avatar-static-v1.provenance.json), [UI/town/icon](assets/art/ui-static-v1.provenance.json). Earlier motion assets and reports are retained as history and are not loaded by the static renderer. Pronunciation scripts, source hashes and independent transcript checks remain in the [audio records](assets/audio/generation-records.json). No book lesson or recording was changed.

## Hosting and identity

The frontend is buildless native JavaScript, hosted in this repository through GitHub Pages. Serve this repository root over HTTP for local development, then visit `/Horizons/App/`.

The actual deployed Wix API uses six private CMS collections. It validates book entitlement, profile ownership, avatar rewards, attempts and grading on the server. Device sessions use an opaque token in a first-party cookie; the original code is not saved in browser storage. Because GitHub Pages is static, this cookie is JavaScript-readable, not HttpOnly. A restrictive content policy and escaped user text are included. See [backend documentation](backend/README.md) and the [API contract](backend/API-CONTRACT.json).

Sessions last 90 days. Expired or revoked books cannot start practice or save attempts, while learners can retain their profile and add another book. Production code issuance is a private administrative step, not a public app endpoint. Replace the current per-worker redemption throttle with a distributed limit before a large printed-code campaign.

## Validation and maintenance

Current evidence: [compact release](reports/compact-learning-release.json), [local browser checks](reports/compact-learning-browser.json), [hosted browser checks](reports/compact-learning-browser-hosted.json), [hosted returning-browser upgrade](reports/compact-learning-cache-upgrade-hosted.json), and [live backend checks](backend/reports/live-compact-learning.json). The [published asset parity](reports/publication-assets.json) records the verified runtime revision. Earlier [static release](reports/static-release.json) evidence covers the retained artwork. Structural fit, zero running animation, and actual visual approval are reported separately. Browser coverage is Edge/Chromium; other engines are not claimed as tested.

The [app audit](APP-AUDIT.md) records the static design decision and supersedes previous motion requirements. Failed native examples are retained outside active runtime mappings. Existing [content coverage](reports/content-coverage.json), [learning checks](reports/learning-browser.json), [backend checks](backend/reports/live-backend.json) and [profile/reward checks](backend/reports/live-profile.json) describe the learning/access contracts.

- `npm test`: canonical banks, all activity types, grading and learning boundaries.
- `cd backend` then `npm test`: entitlement, linked-code identity, ownership, server grading, idempotency, mastery and rewards.
- Browser checks use reserved isolated example profiles. Public example001 remains for learners.
- Keep every canonical `.mjs` module synchronized with `backend/scripts/sync-content.mjs` before content/backend redeployment. Audio alternative IDs and the original generation seed must travel with submitted attempts so the server grades the questions actually shown.

Credentials, dependencies and unrelated book changes stay excluded. Release reports identify their exact runtime revision and reversible baseline; older motion reports remain historical evidence.

The eyewear correction replaces the mixed accessory list with None, round glasses, rectangular glasses and sunglasses. New ImageGen art and exact prompts: [eyewear provenance](assets/art/avatar-eyewear.provenance.json). Lens positions follow each native face’s eye centers. Retired bag/scarf/backpack slots4–6 display as None; other profile fields are preserved. Slots1–3 are the current eyewear choices. The old static-release reports describe the preceding accessory set; current evidence is in [eyewear review](reports/eyewear-review.json).

# Horizons website session handoff

Latest animation revision: face-contained blink, native pupil glances and a springy closer map inspection after four eight-second idle loops. New generated raised-brow/squinted/no-smile expression. Cache pico-v26, queries pico3. See ANIMATION-AUDIT.md v3 section and check-production-record.json.

Latest exception: Unit 1 banner Pico may use the new ImageGen-generated-part reading rig. See docs/ANIMATION-AUDIT.md and docs/pico-banner-animation/production-record.json. Other cast/avatar art remains static. Current cache horizons-companion-pico-v24; entry queries pico1.

Pico runtime a1fbc38c44b2a5b39783be1c9b2eacc658af0df0 is published on both branches; Pages run 41975897079 succeeded. Local and hosted responsive/fallback/lifecycle checks and the v23→v24 cache upgrade passed. Publication parity covered 382 files. See reports/pico-banner-release.json for source-bound evidence and limits. Rejected initial generated parts and exact prompts are retained; the accepted reconstruction is very similar, not pixel-identical. Any later evidence-only commit preserves this runtime.

Latest continuation: compact island popovers, no lesson-jump shortcuts, server-derived island and lesson crowns, unseen/unmastered-first rounds capped at eight items. Cache horizons-companion-mastery-v23; entry queries mastery1. Backend deployment 32611cc2-cdaa-4c78-8968-b9dd7681530f, source b9bec307cd90a7a8d249b56c6a317d3bdb5d2dce. See content/island-mastery.mjs and backend/reports/live-island-mastery.json.

Latest correction: remove cast beside lesson headings; relocate islands onto a broader, gentler analytic S. Cache horizons-companion-curve-v22; entry queries curve2.

Latest continuation: smoother tangent-continuous lesson S trails, four native ImageGen inanimate lesson decorations, name Horizons, and a 1200×630 Open Graph/WhatsApp share card. Cache is horizons-companion-trail-v21; entry queries trail1. See docs/trail-art/ for prompts, inputs and provenance, and reports/trail-proof.json for UI verification.

Continuation on 4 November: the user subsequently requested interface animations based on a supplied video, while keeping characters still. This supersedes the former all-controls-static rule and whole-avatar bounce exception. See [UI-MOTION.md](UI-MOTION.md) and the updated motion section in APP-AUDIT.md. The existing app/layout and native artwork are preserved. Current cache is `horizons-companion-ui-motion-v20`; entry queries use `motion1`. The remainder below records the original transfer baseline and must be read in that historical context where superseded.

Prepared on 4 November 2026, America/Bogota. This is a self-contained continuation record for a new chat. The user requested this handoff because repeated {"detail":"Bad Request"} messages disrupted the conversation. No new product feature is pending: the latest request is to preserve the completed work and context.

## Start here

1. Read this file.
2. Read [APP-AUDIT.md](../APP-AUDIT.md), the current governing website specification.
3. Read [IMAGE-PRODUCTION.md](IMAGE-PRODUCTION.md), including actual reference attachment rules.
4. Read [reference-pack.json](image-references/reference-pack.json) and inspect the relevant PNG sheets before generating any image.
5. Inspect the current checkout, remote main and live route before changing anything. Do not restart the project or replay earlier redesigns.

The [new-chat prompt](NEW-CHAT-PROMPT.txt) is ready to paste into another session. The downloadable handoff bundle contains these documents, all seven reference PNGs, the preflight checker and relevant verification records. It is a context package, not a complete source checkout or credential export.

## Repository and environment

- Repository: https://github.com/Chiispiitas/Brighton
- Remote: https://github.com/Chiispiitas/Brighton.git
- Working checkout: C:/Users/David/Documents/Codex/2026-10-05/hav/work/Brighton
- Website directory: Horizons/App/
- Working branch: codex/horizons-companion-app
- Publication branch: main
- Live app: https://exams.bebrighton.net/Horizons/App/
- Original ChatGPT-project mirror: C:/Users/David/.codex/.chatgpt-projects/g-p-69fa74009dac81919f678d7a535ed51f
- Files beneath sources/ in that project mirror are read-only synced references. The real repository above is the editable source.

At handoff preparation, both remote branches contained c13649631ed3f3a2eafd6297713d8fa5a1d92022. This handoff will be committed afterward; inspect HEAD rather than resetting to this snapshot.

The only untracked paths observed were Horizons/App/tools/__pycache__/ and Horizons/Base/build/__pycache__/. They were not staged. Preserve unrelated work and do not delete/reset the tree to make it look clean.

Windows PowerShell is the local shell. Verified runtime paths:

    Node:
    C:/Users/David/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node.exe

    Python:
    C:/Users/David/.cache/codex-runtimes/codex-primary-runtime/dependencies/python/python.exe

    Playwright:
    C:/Users/David/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright

    Edge:
    C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe

Browser scripts use those local paths. The local server has used port 8898, serving the repository root; verify whether it still runs before starting another. To start a new server, serve the real repository root over HTTP, then open /Horizons/App/. Tool execution session IDs from this chat are not portable.

## What exists

The printed Horizons A1 book is a separate project. Its main lessons cover Units 1–8; its audit is Horizons/A1/book-audit.json. Do not confuse that with the companion app's coverage.

The app currently contains A1 Unit 1, lessons 1A–1D:
- 21 visible path islands, compared with the former 48.
- Core book topics plus two short listening/reading games per lesson.
- 142 vocabulary/source models and 23 selectable smaller sets.
- Full referenced vocabulary banks remain available in Practise.
- 61 canonical current/archived activity definitions preserve old saved IDs.
- A2 is an explicitly labelled book-linking preview, not an implemented A2 course.

Keep the book central. The app is a complementary study partner, not a copy of the lesson pages.

## User working preferences

The user wants completed implementation, meaningful visual inspection and actual live verification. They dislike repeated permission/clarification questions and partial acknowledgements. Proceed within the authorized scope, use reasonable implementation judgment and keep updates concise.

They want an expressive but minimal Horizons identity. They have repeatedly rejected generic slogans, pastel drift, excessive panels, repetitive lesson compositions, hostile faces, bulky character proportions, shadows and disconnected body parts. Preserve accepted features instead of starting another global redesign.

The user originally requested animation, but repeated rigging defects caused them to abandon it. The current rule is static characters. The only later approved exception is a short whole-avatar preview bounce and ImageGen sparkle reveal when a customization option changes. It must finish, never loop and honor reduced motion. Do not revive articulated rigs, idle blinking, floating, breathing or pose-sequence playback.

All new illustration production uses native ImageGen artwork. Do not hand-draw replacement characters with code or turn old animation frames into new stills. Mechanical composition, uniform placement, registered overlays and the supported hair-color recoloring are allowed. Read the full production guide before deciding how to edit an asset.

## Current interface decisions

### Navigation and path

- Desktop sidebar menu has Learn and Practise only.
- There is NO separate Profile menu button in the desktop sidebar.
- Bottom sidebar shortcut retains the learner name, My profile and the profile picture. This is the latest exception to earlier icon-removal instructions.
- Mobile navigation retains Profile.
- Header player-avatar pictures remain removed.
- Header shows the book switcher, server XP and streak.
- Once the Learn hero leaves view, a fixed Unit 1 banner and separate XP/streak bubble appear.
- Keep the existing compact symmetric snake path.
- Islands have no permanent text/count/duration labels.
- Activating an island opens a non-modal speech bubble near the click/anchor, with title, counts, duration and Start. No page dimming.
- Escape, outside activation and scrolling dismiss the bubble. Keep it inside the viewport and keyboard-operable.
- Promotional right sidebar, daily invitation/quote cards and the separate Progress page remain removed. Saved progress is not deleted.

### Learning behavior

- Interface instructions are English. A1 vocabulary teaching cues and matching are Spanish.
- Typed vocabulary, grammar and reading answers are the default; use choice recognition where appropriate for listening.
- Use the shared anchored answer matcher. Preserve strict capitalization and explicit full/short-form targets; do not accept impossible contracted positive short answers.
- Silent alphabet questions use Spanish letter names, not a displayed letter to copy.
- Audio prompts say Listen and choose or Listen and type. Hide answer-bearing text, translations, hints and pictures before grading.
- I can't listen now changes current and remaining audio questions to deterministic non-audio alternatives.
- Keep previously answered audio items unchanged. Save fallback IDs and exact generation seed so the backend reconstructs the same variants.
- The custom mix-listening activity is now allowed by the backend; this was a real earlier defect that has been fixed.
- Grading, XP, mastery and earned pins are server decisions. Retrying the same saved attempt must not award twice.

### Profile and avatar

- Options are tabs beside the preview on larger screens and below a compact preview on phones, with bounded internal scrolling.
- Preserve drafts and form text through tab/option changes.
- Tabs include skin, clothes, hair, eyewear, badge, hair color and background.
- The Avatar base selector is hidden; preserve the stored male/female base internally.
- There are 12 hairstyles plus No hair, 10 outfits, four supported eyewear choices including None, eight hair-color choices including Original and six background colors.
- Hair color and background save, reload and restore on another device.
- Color IDs are color-original/black/brown/auburn/blond/silver/navy/magenta and bg-cream/sky/mint/rose/lavender/navy.
- Hair recoloring preserves the native alpha silhouette through an SVG color filter. It does not redraw hair geometry.
- The portrait uses a round background. Clothes receive uniform enlargement and a circle clip so their lower edge meets that background. The head/hair are not sacrificed to fix the hem.
- Navy stripes, lavender sweatshirt and olive overshirt were lowered by 12 logical portrait units to keep necklines below the chin.
- The explorer jacket now has both complete notched lapels, using a native collar-only overlay over the unchanged original garment.
- All avatar/cast movement outside the one-shot option feedback remains disabled.
- Name/date of birth/daily goal remain editable; DOB is optional/private. There is no public social feature.

## Important source map

| Path under Horizons/App | Purpose |
| --- | --- |
| APP-AUDIT.md | Consolidated authoritative website process and acceptance gates |
| docs/IMAGE-PRODUCTION.md | Mandatory image brief, references, tool-input cap, generation/review/integration process |
| docs/image-references/ | Exactly seven reference PNGs, hashes and visual review record |
| docs/image-brief.example.json | Valid input brief example |
| tools/check-image-brief.py | Checks mandatory references, files, hashes, edit targets and maximum seven TOTAL images |
| tools/build-image-reference-pack.mjs | Rebuilds seven sheets through the current browser renderer; no API/profile writes |
| src/app.js | Routes, shell, learning UI, profile form, attempts and source content integration |
| src/studio-ui.js | Non-modal island bubble, floating status, profile tabs and one-shot feedback |
| src/art.js | Manifest loading, native raster fit, option metadata and avatar mounting |
| src/avatar-static.js | Registered static avatar layers, collar overlay, hair color and bust clipping |
| src/api-client.js | Cookie/session client and action requests |
| styles/app.css | Identity, responsive layouts, current interface overrides |
| content/unit1.mjs | Banks, lessons, activity archive and compact path definitions |
| content/engine.mjs | Deterministic tasks, audio fallbacks, retrieval and grading |
| content/answer-matching.mjs | Reusable normalization/anchored accepted-answer patterns |
| content/translations.mjs | Spanish vocabulary cues |
| assets/art/manifest.json | Cast/scene/UI/topic mappings and avatar option inventory |
| assets/art/avatar-static-v1.frames.json | Source crops, portrait positions, eyewear anchors and overlay registrations |
| service-worker.js | Current cache identity and entry/manifest loading |
| backend/src/server/application.mjs | Entitlements, profile ownership, attempt reconstruction and authoritative progression |

Current cache: horizons-companion-colors-v19. Entry queries use colors1; avatar/art metadata use colors=1. The latest sidebar-only correction did not change cache identity because JS/HTML are network-first. Always read current files before choosing the next cache revision.

## Dedicated Wix backend

- Site ID: 09fbb304-3799-4b3a-8ec6-4a7097167f00
- App/project ID: ed2f1865-9249-46cd-b82e-37e2e844a870
- Endpoint: https://headless-hphybypweny-chiispiitas-140b.wix-site-host.com/api/horizons
- Last verified backend deployment: 87b9875d-a8dd-4337-a952-bde6d3e9e977
- Source revision: 670211bb13c3563605f42dedbedd29cc00d97cda
- Evidence: backend/reports/deployment.json and backend/reports/live-compact-learning.json
- Most recent backend result: 32 local tests and 26 real CMS semantic checks passed.

Six private collections hold issued codes, claims, profiles, sessions, attempts and throttle data. One profile can own multiple book entitlements. Each starts twelve calendar months on first redemption; relinking/revisiting does not extend it. Reject cross-profile code linking. Sessions last 90 days and sign-out revokes only that device.

The frontend cookie is hz_companion_session, scoped to /Horizons/App/, Secure on HTTPS and SameSite=Lax. It is JavaScript-readable, not HttpOnly. The API receives its opaque token via X-Requested-With and stores a token hash. Do not log tokens or original private codes.

Hair color/background already fit the existing backend profile contract. No backend deployment was necessary for the latest visual/profile-control changes. Deploy the dedicated backend only when semantics require it. Read current Wix skills/docs for exact tooling; do not invent API endpoints or reuse stale upload URLs.

Credentials and environment files are deliberately excluded from this handoff. Use the existing configured connectors/protected configuration when needed; never copy old chat secrets into a new prompt.

## Seven-reference image production

The PNG sheets are:
R01 Brand; R02 Cast; R03 Avatar bases; R04 Hair; R05 Wardrobe; R06 Accessories/colors; R07 Vocabulary/scenes/UI.

Mandatory subset by brief kind is in IMAGE-PRODUCTION.md. R01 is always required. Every edit includes its exact native target. The cap is SEVEN IMAGE INPUTS TOTAL, not seven sheets plus a target.

Before each ImageGen call:
1. Save a brief with kind, intent, asset ID, prompt, reference IDs and targets.
2. Run tools/check-image-brief.py.
3. Attach the returned input_paths to the actual built-in ImageGen referenced_image_paths.
4. Label reference/target roles in the prompt.
5. Preserve native selected bytes, alpha, hashes and exact prompt/input records.
6. Inspect the result in the real composed website at actual sizes.

The checker is a repository preflight, not a hook that can intercept every ImageGen invocation. A path merely written in a prompt is not an attached image.

The pack was rendered from source commit b2b062e; subsequent commits only changed documentation. Its source hashes currently pass. Raw text-file hash differences caused by checkout line endings can mark a pack stale; rebuild and review rather than bypassing validation silently.

Read the local imagegen skill before generating. Use the built-in tool by default. Transparent-shirt generations previously introduced holes in solid cloth. Those outputs were rejected; a native collar-only overlay solved the lapel issue without replacing the body. Do not reuse rejected full-shirt renders as positive references.

## Verification and evidence

Freshly rechecked while preparing this handoff:
- tools/verify-publication.py passed: 349 committed runtime/native files match the hosted site, including 12 book recordings.
- Comparison commit: c13649631ed3f3a2eafd6297713d8fa5a1d92022.
- This verifies bytes, not a new full interaction matrix.
- Image-reference preflight previously passed six tests and all seven sheets were directly inspected.

Relevant reports:
- reports/avatar-colors-proof-hosted.json: four widths, saved hair/background colors, reload and second-device restore; isolated QA profile restored.
- reports/avatar-colors-cache-upgrade-hosted.json: real v18 to v19 cache lifecycle and exact committed bytes.
- reports/studio-ui-proof-hosted.json: floating status, non-modal bubbles, tabbed editing, corrected collars and settling feedback.
- reports/jacket-lapel-proof-hosted.json: exact native outfit3 overlay and composed bust checks.
- reports/compact-learning-browser-hosted.json and backend/reports/live-compact-learning.json: compact path, typed/Spanish practice and saved audio variants.
- docs/image-references/review.json: direct visual reference-sheet review.

Read each report's source revision and scope. In particular, avatar-colors-proof.mjs and its old report expect NO avatar in the sidebar shortcut. The later explicit instruction restored that bottom picture and removed the separate sidebar Profile menu button. Update that assertion before reusing the test. Do not remove the requested picture to make the old test pass.

Old static/animation reports and tests expecting 48 islands, modal dialogs, previous copy or old cache names are historical contracts. They are not current acceptance criteria. Browser coverage is Edge/Chromium; Safari/Firefox are not claimed tested.

Full interaction evidence predates the small b2b062e sidebar change. Its GitHub Pages run 41962079842 completed successfully, and fresh hosted source parity includes that change. A new UI task should verify the actual current sidebar behavior directly.

At preparation, the documentation-only Pages job for c136496 was still running; it does not alter runtime behavior. Later handoff commits may trigger another Pages job even with [skip ci]. Do not assume that tag prevents GitHub Pages dynamic deployments.

## Recent reversible history

- d237698: compact 21-island path, Spanish cues, typed defaults, audio alternatives.
- 395c86c: native explorer-jacket collar correction.
- 5c07bc2: floating Unit/XP/streak, non-modal island bubbles, tabbed studio and one-shot feedback.
- b79af1b: saved hair/background colors, round clothing crop and player-icon removal.
- b2b062e: latest navigation rule; restore bottom profile picture/name/My profile and remove separate desktop Profile menu item.
- 65f067c and c136496: full audit, image-production guide, seven reference sheets and checked preflight process.

Use git show/log for exact changes. Revert narrowly if needed; never reset learner records, regenerate all art or erase unrelated files to undo one visual correction.

## How to resume safely

From Horizons/App:
- Node --test tests/*.test.mjs for canonical content.
- Python tests/image-reference-preflight.test.py for the mandatory-reference preflight.
- Python tools/check-image-brief.py docs/image-brief.example.json to validate a generation brief.
- Relevant browser script in tools/ or tests/, after reviewing its version assumptions.
- Backend tests/build/sync only when its source/semantics change.

Frontend is buildless ES modules; do not scaffold another app or install a framework. Read backend/package.json for backend scripts. Keep source and backend content copies synchronized if generation/grading changes.

The current local checkout is authoritative for code, while main is the publication target. Check remote changes before pushing. Commit concrete reversible results, publish authorized changes through existing Pages/Wix flows and verify the user-visible route. Preserve supplied font/wordmark and the accepted path.

## Bad Request interruptions

The user repeatedly saw the raw string {"detail":"Bad Request"} while communicating. Its origin was not conclusively diagnosed. The real app profile-save, learning-save, reload and cross-device checks returned successful responses in the verified runs. That does not establish that every reported error was outside the app.

If it recurs, identify the exact failing operation: chat/tool invocation, ImageGen call, app network request or Wix endpoint. Preserve status and sanitized error details without tokens. Do not blindly repeat a large tool call, change a working backend or regenerate approved assets. Use smaller bounded calls and report actual progress.

A cleanup command for a generated __pycache__ folder was rejected by automatic command review earlier. Cleanup was unnecessary, so the task continued without deletion. Leave these untracked folders alone unless cleanup is actually required.

## Completion state and next action

All requested website changes through the sidebar adjustment are implemented and committed. The full audit, image guide and seven-reference pack are complete. This request adds the handoff and bundle; it is not authorization for another redesign.

In a new chat, read the attached documents, verify the checkout/live state, briefly confirm readiness and wait for the user's next change. Do not ask the user to repeat this history.

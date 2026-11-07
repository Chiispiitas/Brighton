# Horizons website session handoff

Achievement presentation update: remove the avatar-pin unlock toast. Newly crossed XP pin milestones are captured on the saved result and presented once on a dedicated achievement screen after streak and overtaking. Final flow is Results → streak → overtaking → achievement → Learn (or requested replay); absent stages skip. Multiple pins appear together. Native ImageGen pin sprites are reused with full-opacity spring/pop transforms and static reduced motion. No XP, unlock thresholds, art or backend records change. See completion-flow tests and actual saved-round browser proof.


Completion ordering update: sidebar/mobile navigation label is Rank (route remains leaderboard). Saved Results now appear BEFORE any daily streak or leaderboard overtaking celebration. Continue / Practice again queue streak first, then a real same-week overtaking event, then the selected destination. Missing events skip cleanly. Baseline and post-save authenticated standings measure actual position and XP gain; a failed leaderboard request never fails the lesson save. Replaced bot seats, weekly rollover and unchanged XP cannot fabricate an overtake. Existing avatars and material emblems are reused with transform-only movement. See tests/completion-flow.test.mjs and reports/completion-order.json; synthetic actual-app proof, no real learner QA. This supersedes the older streak-before-results instructions.


Weekly leaderboard: new navigation and authenticated getLeaderboard action, mixed-rank human-first20-place weekly groups, disclosed practice bots, server-derived XP and top-quarter +100 XP promotion. Personal Wood/Stone/Iron/Gold/Diamond/Obsidian/Masters progression. Read docs/leaderboard-v1/README.md for enrollment, UTC boundaries, ties, lazy immutable settlement, privacy, motion and planned-only friend profiles. Existing learning records remain untouched. Final backend deployment efa2748c-85b5-4bb1-9e05-c20c17ec22a6, source revision 9c13eeb08c6bd8724c74ae04d6b8f67b0eebbe01. 60 backend tests and actual four-viewport synthetic browser proof pass. Live checks use only health and unauthenticated rejection, no learner records.


Word bank header art (6 November 2026): Mina now uses the accepted larger Practice-header slot dimensions (180px desktop, 130px short desktop, 145px mobile) instead of the generic 70px-wide slot. Art/rig remain unchanged. Eight synthetic desktop/mobile viewport checks in reports/bank-art.json confirm clear controls and desktop height fit.


Listening choice exception (6 November 2026): selecting options in Listen and choose must be silent, including alphabet and numeric-key selection. Explicit Play audio remains available; non-listening choices, tile placement and correct typed-answer models retain generated playback. This supersedes the earlier universal choice-selection playback rule.


Recorded answer models (6 November 2026): selection and correct typed-answer playback must use generated recordings only. Device speech is explicitly rejected. src/answer-audio.js normalizes labels; assets/audio/answer-models-v1/lookup.json maps choices, ordering words and correct typed models to native Jessica recordings, reusing the existing vocabulary recordings where possible. Correct typed answers automatically play the canonical accepted answer, not arbitrary learner input. Missing recordings report unavailability instead of synthesizing speech on the device. Correct feedback sound is retained alongside model playback. 175 new native clips (0.68–10.19 seconds, 4.26 MiB) plus 143 existing vocabulary clips cover 318 normalized labels. 57 focused/backend tests pass; the synthetic browser proof asserts the exact expected file on correct typing, no model playback on wrong typing, repeated choice playback, tile playback, and throws on any device speech request. ASR review and any spelling/homophone differences are preserved in answer-models-v1/review.json; full human listening review is not claimed. All model text must be included in tools/plan-answer-audio.mjs coverage before release. Browser QA forbids speechSynthesis.speak and captures actual Audio.play calls.

Question audio update (6 November 2026): all 36 active long book-track questions now use unique original Jessica / ElevenLabs clips in assets/audio/platform-listening-v1, 0.91–9.95 seconds each. Scripts, hashes, ASR and duration evidence are in that folder. Transcripts appear only after grading, for either outcome. Existing answers, IDs and progression remain fixed. Book audio files remain historical assets but are no longer active question sources. Multiple-choice selections (including keyboard) and tile placements (tap/drag) speak immediately, using existing native vocabulary recordings when available and the dedicated generated answer models otherwise. After grading, hide the tile bank; a correct order is not repeated as text below the submitted green tiles. Browser evidence uses synthetic learners only. Focused audio and backend tests:56 passed. Broader historical tests still include stale typed-alphabet/bank-count expectations; do not restore those superseded behaviours.


Private admin console (6 November 2026): separate URL /Horizons/Admin/ and API /api/horizons-admin. The user authorized the supplied credentials; only a salted PBKDF2 verifier is stored in the private HzThrottle admin-config record. No administrator password or verifier is shipped publicly. Admin tokens are memory-only, expire after eight hours, and cannot act as learner sessions. The separate admin directory is outside the App service-worker scope.

Console supports paginated/searchable learners and keys, per-learner native avatar/progress/streak/XP/last lesson and activity, key creation/label/book-before-redemption/revocation, learner session revocation, exports, audit history, content field editing, validation/publication and version restoration. Existing key plaintext is irrecoverable; new full codes are shown once. English vocabulary terms remain fixed until matching recordings are authored; Spanish cues, aliases, explanations, grammar and reading/listening question fields can be edited. A2 remains a preview.

Content snapshots are immutable and publications use create-only next links to reject concurrent overwrites. The client applies reviewed patches to canonical stable identities; each round pins contentRevision, and the server reconstructs its questions from that historical snapshot. Legacy clients without revisions use base content, so in-progress rounds are not regraded against later edits. No progress migration, fake XP or learner-record QA. See backend/tests/admin-auth.test.mjs, admin-application.test.mjs, reports/admin-console.json, reports/admin-content-learning.json and backend/reports/live-admin.json.

Mobile character and typing correction (6 November 2026): the user explicitly rejects hiding the character when the keyboard opens. Short mobile typed questions now place the unchanged 160px cast beside the instruction/cue in all answer states. The input remains below this row within the keyboard-visible height; both character and answer remain visible. All exercise/document scrollbars are visually hidden, including correct/wrong feedback and long passages; native touch/wheel scrolling remains available for long content. This supersedes earlier keyboard rules that hid the character. tools/mobile-both-proof.mjs exercises the real app with a synthetic store at320/390/430px widths and keyboard-sized heights, an overlay visualViewport, correct/wrong feedback, desktop feedback, and long-content scrollability. See reports/mobile-both.json. Physical phone keyboard remains unverified. Cache mobile-both-v109; viewport query mobileboth1.

Latest arm-proportion correction (6 November 2026): both upper arms and both forearms were regenerated after the user rejected thin limbs; the next overwide registration was also rejected as off-model. Use the accepted waving/cheering poses at identical head size to measure exposed shaft thickness and gripping-palm diameter before registering these complete native parts. Keep concealed caps and planned bone lengths. The map pose hides too much of the arms to establish thickness. New palette medians must come from the current textures. Earlier thin, overwide, bulb and socket variants are rejected history, not acceptance references. Review the latest actual white-background poses and current source-bound reports under docs/streak-campfire-v2 and reports/streak-v2-*.

The frozen geometry measures approximately 30–31 px in the exposed arm shafts and 40 px in the gripping palms at current head scale. Measurements are in docs/streak-campfire-v2/measured-proportion-check.json; accepted-art comparison evidence is reports/streak-v2-reference-proportions.json. Use these actual material widths rather than the earlier 48/42 targets, which the user explicitly rejected.

Final palette containment uses `atop SourceGraphic` to retain the native alpha silhouette. This removes coloured dotted filter frames found in actual white UI captures; no native pixels or geometry are deleted. The current palette report verifies exact alpha preservation, all nine skin medians and unchanged garment core colours. Judge the actual white renderer as well as exported stills.

Current daily streak rebuild (6 November 2026): the user rejected the earlier combined-pose/mesh animation. The replacement uses complete independently generated torso, upper arms, forearms, paws, legs, seat, satchel, skewer and marshmallow, with the exact accepted permanent Pico head and separate facial layers. Concealed joint material is included in each native component. SVG shoulder/elbow/wrist chains keep both hands on the shaft through roasting and recoil; the marshmallow is a separate tip attachment. No old mesh, combined-body pose swaps or code-drawn anatomy remain active.

Final joint/palette correction: the regenerated torso has no peach side plates; complete smooth arm segments replace the rejected bulb-ended parts. Latest requested paint order: the whole viewer-right arm chain renders behind the torso, with its shoulder at [278,312], tucked under the vest to limit the outward bulge. The viewer-left arm stays in front. This explicitly supersedes the earlier both-arms-front workaround; the far paw remains visible outside the torso on the held shaft. The chain solves through the actual palm grip using forearm-plus-hand reach; the paw follows the forearm naturally and the skewer rotates independently at the grip. Forward resting grips and a downward elbow bend remove the high elbow and stray wrist/face tube. Native end-cap centres define pivots instead of guessed quarter points. The longer continuous navy hem hides the upper-thigh cleft at rest and recoil.

The accepted blank-head skin median [243,190,158] supplies permanent sRGB palette calibration for nine new skin-bearing parts. Original native PNG bytes remain unchanged. Torso colour correction selects only its existing peach neck pixels; measured navy/magenta core pixels stay exactly unchanged. Alpha is preserved apart from at most one raster rounding bit on the torso. Hidden SVG expressions use display:none, preventing child eye visibility from leaking through happy eyelids. Current verification includes actual eight-pose close-ups, wrist/palm alignment, palette/garment pixel checks and actual SVG startup/fallback stills. See reports/streak-v2-palette.json, streak-v2-extreme-stills.json and streak-v2-stills.json. Human acceptance is not inferred from an agent review.

Latest art steering also rejects the first v2 torso's peach side patches, bulb-ended joints and visible upper-leg cleft. New ImageGen garment and four smooth limb components replace them: no fixed shoulder ovals, no ball/knob-shaped ends, and a continuous longer navy hem covers the thigh join. Raw rejected/superseded artwork and exact generation/preflight records remain in docs/streak-campfire-v2; they are not acceptance references. The moving scene uses explicit complete parts and covered overlaps.

The 7.6-second sequence has anticipation, a large upward four-frame fire burst, recoil/hop and limb/head follow-through, a large streak zoom with outward graphic rays/confetti, and a weekday rail that fills only actual achieved days. Continue is hidden, disabled and guarded until the sequence completes. Reduced motion and required-art failure go directly to the settled state and usable Continue. This supersedes every older immediate-Continue assertion. Existing completion audio is aligned to the burst once. The server's first saved round/profile-local day, retry and seen-state rules are unchanged; no backend redeployment is needed.

Cache horizons-companion-daily-streak-v103; app/scene/style query streak3. Old v1 scene URLs are excluded from the active cache. Other accepted app screens, cast animations, learner progress, printed book and backend content remain unchanged. Continue to finish after implementation/push without waiting for Pages unless newly requested.


Shoulder and motion correction (6 November 2026): the user rejected the original low arm attachments. Two new native ImageGen upper-body repairs raise the peach shoulders to the shirt shoulder line; prior originals remain archived. Exact briefs, mandatory attached references, preflights and native return paths are in upper-roast-shoulders/upper-lift-shoulders records under docs/streak-campfire-v1. There are now 16 native outputs. The permanent head/features and fixed seat/lower body remain unchanged.

Runtime now separates the existing generated skin/skewer pixels from the fixed shirt texture and applies a small textured mesh deformation. No anatomy or facial marks are drawn in code. Both shoulder roots remain pinned; paws and the held skewer share interpolated grip/tip anchors. An eased 1.45-second lift and 1.55-second return move the current pose before switching at matched halfway positions. All transitions remain opaque. Fire grows from embers over 1.75 seconds; its four native frames share a continuous height/base anchor, sway and width variations, avoiding the former abrupt small-to-full size jump. The 5.6-second sequence still settles and respects reduced motion, hidden/offscreen pause and failure fallback.

Actual browser tests in reports/streak-motion.json include both switch boundaries (1974/1976ms and 4324/4326ms), with marshmallow centroid displacement under 3 logical pixels, six viewport sizes, masks, save/retry and lifecycle checks. Four helper tests and exact-byte/offline checks in reports/streak-cache.json pass. Ten normal-speed frames and desktop renders were inspected, including both transitions. Current cache is horizons-companion-daily-streak-v102; app/scene/style query streak2. No backend or lesson content changes. Pages deployment is not awaited.


Current daily streak feature (6 November 2026): the first saved Learn or Practice round of each profile-local day opens Pico's original fireplace/marshmallow celebration before normal Results. It shows the streak, a Monday–Sunday calendar and factual completion timing; Continue is immediately usable. The permanent accepted faceless Pico head and separate features are reused with separately generated scene components, authored keyposes and four flame frames. See docs/streak-campfire-v1/README.md and docs/ANIMATION-AUDIT.md for exact sources, rejected outputs, reconstruction and hybrid production steps. Existing cast animations on login and the accepted lesson/path/editor designs remain in place.

Daily eligibility and the unique winner are server controlled. Identical winning UUID retries recover the event; later rounds, older-day retries and login return no celebration. A local profile/day marker is written only when the scene is visible. There is no cross-device presentation acknowledgement or login replay queue. Fifty backend tests and isolated browser retry/visibility checks pass; the live reserved demo fixture passed save/retry but was already active today, so first-day claim creation remains verified in synthetic tests. Live deployment ef6074d1-a54e-438b-9259-e42843fd3138; cloud source a68ccd0390a70b2ee28711d691be5800bdb7670e; endpoint/site identity remain unchanged. Never use real learner records for QA.

Current frontend cache: horizons-companion-daily-streak-v101; app/scene/scene stylesheet queries streak1. Follow the user's standing instruction to finish after implementation/push without waiting for Pages, unless a new request specifically asks to wait. ImageGen failures in this production are identified by actual operation/request in docs/streak-campfire-v1, rather than attributed to the app or used to restart the project.

Final scene evidence: reports/streak-motion.json and reports/streak-cache.json cover actual synthetic saved-round flow, source-bound finite playback, all six viewport sizes, masks/opaque swaps, hidden/offscreen pause, reduced/failure stills and exact offline bytes. Root reviewed both reconstructed poses, ten sampled normal-speed frames and desktop/mobile captures. Preview video is outside the public app at C:/Users/David/Documents/Codex/2026-11-06/streak-motion/normal-speed-review.webm. Active scene art is under 0.75 MiB; raw natives remain preserved for provenance and are not precached. Physical phones and non-Chromium browsers remain unverified.

Latest Practice header art (6 November 2026): replace the tiny70px-wide seated Alex slot with a190x180px illustration slot in a190px desktop header, or150x130px on short desktop windows. Mobile uses120x145px without the old26-28% width cap. Title, Select all and topic controls remain clear; desktoplists androundcontrols stillfitwithinviewport. Exercisecharacter slots/animations/artwork remain unchanged. Eight actual animated desktop/mobile checks and prior-worker/offline-byte checks are recorded in reports/practice-art.json and practice-art-cache.json. Cache practice-art-v92; viewport query practiceart1.

Latest Alex animations (6 November 2026): all four accepted v3 poses now use separate parts and one permanent faceless head with separate facial sprites; drive remains a sit alias. One8-second idle then3-second pose-specific accent; correct/wrong exercise reactions follow Mina, with seated chair/console fixed. Initial narrow zigzag arms flagged by the user were rejected and regenerated against exact enlarged source-arm crops; sleeve thickness/bends/hand placement and behind-torso shoulder overlap govern acceptance. Raw22calls/eightrejections, exact prompts/actualattached mandatory references, registeredderivatives, boards and QA are in docs/alex-motion-v1/README.md, production-record.json and reference-manifest.json. Reports alex-head-fidelity.json, alex-motion.json and alex-motion-cache.json. Cache alex-motion-v91; app/art/Alex/style queries alex1; rig v=1. Existing fixed character sizes, Mina/Pico/avatar, Jo, grading, sounds, backend and book remain. No real learner records used; no deployment wait requested.

Latest Mina exercise reactions (6 November 2026): a checked correct answer triggers one1100ms happy jump/head tilt using the existing separate joy sprite. A wrong answer triggers one1300ms confused head bob using the existing separate focus sprite with one raised eyebrow and a neutral mouth. Both operate over the permanent faceless head; no new artwork, patches, fades or whole-head expression swaps. The regular idle/accent clock pauses and resumes its prior phase; feedback pauses when hidden/offscreen and cancels on navigation/reduced motion. A per-session answer nonce prevents replay on redraw/remount. Reduced motion retains the exact original still. Existing fixed character sizes, shoulder attachment, grading and answer flow remain. Actual synthetic correct/wrong exercises, desktop/mobile captures, phase continuity and no-remount-replay checks pass in reports/mina-motion.json. Cache mina-reactions-v90; app/art/Mina/style queries minareact1; rig v=2.

Latest Mina cadence (6 November 2026): every pose now plays one 8-second idle followed by its existing 3-second accent, repeating every11 seconds. This supersedes the former two-idle/19-second schedule. All accent motion/expression offsets move earlier by8 seconds; durations, geometry, shoulder attachment, opacity, pause/disposal and reduced-motion fallback remain. Full-cycle runtime and redraw-phase checks use the new timing. Cache mina-every-loop-v89; app/art/Mina/style queries minaevery1; rig v=2.

Latest multiple-choice keyboard shortcuts (6 November 2026): keys1-9 on the top row or numpad select the matching displayed option without submitting. Existing Enter-to-check remains. Repeated/modified key presses, typing fields/editable controls, open dialogs and already checked answers do not trigger selection. Browser checks cover top-row/numpad selection, typed digits, modified keys and locked feedback, alongside responsive exercise controls. Cache number-keys-v88; app entry numberkeys1. No content/grading changes.

Latest Mina shoulder repair (6 November 2026): the skip pose arm previously met the body with insufficient overlap and separated during its wave. Shifted the existing native arm registration left18 logical pixels and moved its rotation pivot to the shoulder (205,180). No new artwork or face changes. Native-alpha overlap passes every angle from -12 to +12 degrees (minimum235 opaque pixels); full runtime cycle, mobile placement, masks, fallback and original head fidelity pass. See reports/mina-shoulder.json and mina-motion.json. Cache mina-shoulder-v87; app/art/Mina/style queries shoulder1; rig v=2. Fixed exercise sizes remain.

Latest stable exercise character size (6 November 2026): cast slots now remain fixed at 110x160px desktop and 90x128px mobile, with a matching reserved scene height. Question length, activity type and answer feedback no longer shrink or expand characters. Existing inner scrolling handles long prompts; answer fields/options retain clear bounds. Animation gestures and breathing remain, with original still/reduced-motion fallback. Verified unchanged rendered character height across feedback at eight desktop/mobile viewports, listening, answer controls and long content. See reports/exercise-art.json. Cache fixed-cast-v86; viewport query castfixed1. This supersedes the earlier flexible 150-320px/112-180px scene rules. No artwork, grading or backend changes.

Latest Mina animation and identity correction (6 November 2026): all four current red-blazer poses (`step`, `read`, `map`, `skip`) use separate part rigs, two 8-second idle loops and a 3-second wave/reading/celebration accent. The user rejected the initial generated head/face as unlike Mina; it is archived as rejected. Corrected heads preserve original per-pose geometry, hair, earring, neck and neutral facial anchors, with one permanent generated-material faceless derivative and separate transparent expressions. No added nose, full-head expression swaps, skin patches or fades. Exact static fallback/reduced motion, hidden/offscreen pause, per-pose phase continuity across redraw and disposal remain. See docs/mina-motion-v1/README.md, production-record.json, reference-manifest.json and reports/mina-head-fidelity.json, mina-motion.json, mina-motion-cache.json. Cache mina-motion-v85; app/art/Mina/style queries mina1; rig v=1. Enlarged exercise art, unclipped answer widgets, grading, backend, printed book, Pico/avatar and other cast remain. Synthetic local QA only; no physical-device/human acceptance or deployment wait claimed.

Latest exercise artwork and clipping correction (6 November2026): full native quiz art now uses150-320px desktop scenes and112-180px mobile scenes instead of the miniature rule. Answer fields, choice lists and tile builders remain outside a separately scrolling prompt/art region, with clear space for focus outlines. Short desktop feedback uses side-by-side question/art and answers to retain complete sprites and fields; listening places audio controls beside the illustration. Mobile choice cues can share a row with art. All native assets, static cast poses, listening privacy, grading and saved IDs remain. Actual raster bounds and full field/option/tile/ring bounds were checked before/after feedback on desktop/mobile. See reports/exercise-art.json, reports/exercise-art-cache.json, reports/word-tiles.json and docs/SCREEN-FIT.md. Cache exercise-art-v84; app and viewport queries sprites1; prop query coffee2 remains.

Latest coffee flipbook (6 November 2026): replaced the single transformed splash with four separately generated native ImageGen frames: emergence, peak, breakup and falling droplets. Every call passed the authored preflight and attached R01/R02/R07 plus the original native splash and accepted cups (five actual inputs total). Four registered transparent PNGs swap discretely at opacity1, synchronized to the unchanged clink; no fading or splash transform animation. All raw outputs, exact prompts, input hashes, registration and quality review are recorded in docs/coffee-splash-v2/production-record.json. Reduced motion uses the original static cups; any missing frame falls back to that still. See reports/coffee-frames.json and coffee-frames-cache.json. Cache coffee-frames-v83; app/prop module queries coffee2; rig manifest v=3. Desktop screen-fit and removed banner Continue remain.

Latest desktop screen fit (6 November 2026): Learn, Practice, word bank, profile, quizzes, games, results and welcome now use height-aware desktop layouts. Shell navigation and primary controls remain in the viewport; topic/word lists, avatar options and long exercise content scroll inside their panels. The Unit banner Continue button is removed on every device; exercise feedback/exit-confirmation Continue controls remain. Learn scales the banner and trail to available height, caps the accepted trail height, and keeps all decorations, landmarks and side arrows visible. On short desktop windows island details open above their island when necessary, without inserting page space or scrolling the page. No new artwork, character motion, grading, backend or printed-book changes. See docs/SCREEN-FIT.md, reports/desktop-fit.json and reports/screen-fit.json. Cache screen-fit-v82; app/studio/viewport queries screenfit1; overworld stylesheet desktopfit1.

Latest path prop corrections (6 November 2026): the notebook cover uses a hidden backface so its person icon never appears inside, and the writing sprite is retired. The existing separate coffee splash now bursts to 2.25x scale, arcs and falls. The globe smear is removed. A fixed mailbox-slot wrapper clips the independently moving letter as it emerges and fully enters; the former moving-image mask was incorrect. All native sprites/IDs are preserved, with no new artwork, fades, character, backend or book changes. See docs/prop-motion-v1/CORRECTIONS-2026-11-06.md and reports/prop-motion-fixes.json. Cache prop-fixes-v81; app/motion/overworld queries props2; rig manifest v=2.

Latest avatar neckline/hair fit (6 November 2026): reuse the existing native neck pixels as a registered45px extension behind all ten garments; no new bitmap artwork or expression patches. Side-part hair moves down3 logical pixels to close the forehead gap on both bases/all six skins. Eye/face/glasses anchors, hair colors, outfits and saved IDs remain. Before/after and240 costume combinations plus24 hairstyle/base combinations reviewed in static/editor rigs. Native PNGs unchanged; reference sheets R03–R06 regenerated from the renderer. See docs/avatar-fit-v2/production-record.json and reports/avatar-fit-v2.json. Cache avatar-fit-v80; app query avatarfit2; art/static module queries fit2; metadata fit=2.

Latest Practice answer mode and retry queue (6 November 2026): the chosen Type answers action now presents vocabulary as typed recall, including expressions such as Nice to meet you; length does not change a vocabulary expression into a grammar-composition task. Vocabulary questions retain stable IDs and accepted aliases; the existing server accepts their submitted text. Listening keeps audio/choice presentation and its silent alternative; grammar ordering keeps neutral draggable tiles. Practice quiz errors append that question to the queue, indefinitely if needed, including a wrong final item. Finishing is guarded until every original question has a correct response. Learn assessment flow and games remain unchanged. Results accuracy counts all in-session checks including misses. Save consolidates the final answer per stable question ID into one existing server attempt: no duplicate question rejection, no extra XP/round bonuses, and no repeat history persisted as separate server answers. This means final server item records show successful retrieval, while individual failed checks are reflected in the current results accuracy rather than a new persisted attempt history. Existing save retries remain idempotent. Tests cover typed expressions, repeated errors, final-item errors, no premature save, correct final retrieval, honest local accuracy, single save/XP, listening presentation/retry, grammar tile retry/save, mixed grammar rounds, and mobile layout. No backend or printed-book changes. Cache practice-retry-v79; app/presentation module queries practiceretry1.

Latest selectable grammar (6 November 2026): all13 Practice topics now use checkboxes, including five grammar topics. Grammar can be selected alone or combined with vocabulary via the main Practice action; factory mode is grammar or mixed with explicit grammarSetIds/chunkIds, using the existing deployed grading contract. Select all/Clear all covers both topic types; summary counts grammar separately and All selected items includes grammar questions. Listening, Memory and Matching stay vocabulary-only, disabled without vocabulary; a short selection-specific note explains this. Word bank, Learn locks, question IDs, tile ordering and autofocus remain. tools/grammar-mix-proof.mjs verifies selection without launching, multiple grammar sets plus vocabulary in a graded/saved round through a synthetic server store, grammar-only/all-items launch, preserved selection, guarded vocabulary modes, all/clear and320/390/1440 layouts. Updated Practice/word-tile proofs and autofocus regression pass. No backend or book changes. Cache grammar-mix-v78; app query grammarmix1.

Latest typed-answer focus (6 November 2026): rendering an active quiz synchronously focuses its enabled typed-answer field with preventScroll. This covers initial launch, advancing, and typed fallback/re-render; checked and timed-preview inputs remain disabled and do not receive focus. Existing preview-expiry focus and feedback Continue focus remain. Cache answer-focus-v77; app query answerfocus1.

Latest lesson dividers (6 November 2026): a fine warm-gray vertical rule with fading ends separates the horizontal Learn lesson areas; it is decorative, takes no layout width and ignores pointer input. Practice adds a matching light rule between lesson rows (between each lesson on mobile). Existing collapsible word-bank separators remain. No new copy, art, path geometry or navigation changes. Cache lesson-dividers-v76; base and overworld stylesheet queries lessondividers1.

Latest Practice simplification: Practice now mirrors the 13 broad Learn topic titles across lessons 1A–1D (eight vocabulary choices plus five grammar launch buttons). It no longer renders the 23 smaller chunks or a separate grammar shelf. Vocabulary topic selection expands to the existing stable chunk IDs, retaining current mixed practice modes and round lengths; Select all covers all 142 practice words without duplicate subtopic controls. The word bank keeps every existing word tile, Spanish cue, search and word-detail/audio behavior; words are grouped by their authored lessonIds into four native collapsible details sections, collapsed initially. Shared words appear in each authored lesson. Search opens matching lesson groups, hides empty groups, and clearing it restores the learner's open/closed choices. Grammar and all practice remain independent of Learn locks. tools/practice-topics-proof.mjs verifies topic counts, full old/new word coverage, individual/select-all/clear behavior, grammar and vocabulary launch, every word's lesson membership, word details, search and collapse state, and widths 320/390/1440 with no page overflow using a synthetic store. No backend/book/native-art changes. Cache practice-topics-v75; app/base stylesheet queries practicetopics1. Finish after checks and push; no deployment wait requested.

Latest sentence-order correction: grammar templates were materialized as text questions despite the accepted draggable-tile UI. src/exercise-presentation.js now restores those token-bearing questions to the existing order renderer at quiz entry, with deterministic shuffled words, neutral tiles, mouse/touch drag, reordering, return-to-bank, tap/keyboard selection and clear. Stable question IDs and the deployed server text-answer contract are preserved: assembled words are submitted as one sentence string, with original grading/normalization and progress targets unchanged. Other typed grammar questions remain typed. Mobile order spacing keeps Check and Continue visible at 320/390/430px by 640px height; desktop also verified. tools/word-tiles-proof.mjs exercises both restored question shapes, real mouse and CDP touch gestures, reorder, bank return, keyboard, neutral palette and an 8/8 round saved through the actual server application with an isolated synthetic store. No learner records/backend deployment/book/native-art changes. Cache word-tiles-v74; app/base stylesheet and presentation module queries tiles1. Await Pages for this user request.

Latest mobile video review (WhatsApp Video 2026-11-05 at 9.35.35 PM (1).mp4): compact welcome art/layout fits entry controls on one mobile screen; Unit 1 banner shrinks to 92px with mobile Continue hidden; learn layout allocates the remaining dynamic viewport to the map, preserving the visible book/streak/XP bar and bottom navigation. Mobile map extends to both screen edges, with arrows below. Short multiple-choice questions use smaller scene/spacing and compact 44px-minimum choices, retaining Check and correct/wrong Continue within the viewport. Typed-answer layout and long reading tasks retain their existing natural scrolling. Browser-emulated verification covers 320/390/430px at 640px height, plus map at 760px; very short viewports may scroll to preserve usable controls (400px map-page floor). No learner records, backend, native images or book changes. See tools/mobile-video-proof.mjs and reports/mobile-video-corrections.json. Physical phone keyboard/browser-chrome verification remains a limit. Cache mobile-fit-v73; base/overworld stylesheet queries mobilefit1.

Latest mobile Profile fix: the bottom-navigation Profile button now renders the saved avatar through the same static bust renderer as the desktop shortcut, at 28px square, centered above its label. Previously navItems emitted no portrait for Profile. This does not add an avatar to the header or path. Cache mobile-avatar-v72; app module and base stylesheet queries mobileavatar1.

Latest island palette: available unfinished and completed regular islands again share the accepted reddish pink surface with white activity/check icons; landmark badges match. Locked islands stay pale, mastery stays gold, and the selection ring remains removed. Mobile arrows remain below the full-width map. Cache red-islands-v71; overworld query redislands1.

Latest mobile path correction: at widths up to 680px, the swipeable map spans the full available width and the left/right arrows occupy a separate bottom row. The arrows no longer reserve side gutters or obstruct islands. Desktop side arrows, hover/hold navigation, boundary hiding and native swipe/vertical wheel behavior are preserved. Cache mobile-arrows-v70; overworld stylesheet query mobilearrows1.

Latest island simplification: removed the visible selected-island ring. Available unfinished and completed islands now share the same blue-gray surface, border and dark icon color, including landmark badges. Unfinished listening uses headphones, reading uses a book, and regular/grammar/game islands use a star; completion replaces these with a check. Locked islands remain pale with padlocks; full mastery retains gold/crowns. Selection is still tracked internally for Continue and return positioning. This supersedes earlier ring and pink-completion instructions. No new artwork or backend changes. Cache path-states-v69; app and overworld queries pathstates2.

Latest path-state color correction: available unfinished islands now use a desaturated blue-gray surface, darker neutral star and subtle slate border. Locked islands retain a separate pale warm-gray surface and muted padlock. The open-state selector explicitly excludes .locked, fixing the earlier specificity overlap that made both backgrounds nearly identical. Completed pink checks, gold mastery crowns and the blue location ring remain. Cache path-states-v68; overworld stylesheet query pathstates1; app/motion queries remain props1.

Latest prop animation: eight lesson decorations now use separately ImageGen-generated moving parts, original static fallbacks, transform-only full-opacity cycles, staggered rests, reduced-motion stills and offscreen/hidden/disposal guards. Cups clink/splash; notebook opens and pencil writes; medical bag handle/clasp lifts; hat/spoon tip; map folds/compass turns; globe illustrated disc spins with contained smear; keys swing; mailbox handles a separate letter. Birds and butterflies are removed from the map, animation code and precache; archived native art remains. See docs/ANIMATION-AUDIT.md, docs/prop-motion-v1/production-record.json and reference-manifest.json. Twenty-one part calls plus two documented repairs, four/five actual image inputs each. New art is very similar, not pixel-identical, to the baseline; one fixed mailbox body reuses the original. Path geometry, controls, ring/locks, characters, backend and book files remain unchanged. Cache prop-motion-v67; app/overworld/motion queries props1.

Latest path update: unfinished island/star colors are neutral gray; gold is reserved for mastered islands. A static blue outline ring marks the selected or most recently completed island (aria-current=step), remains after finishing/reloading from server lastActivityId, and is revealed horizontally on return/resize without changing vertical wheel behavior. Every lesson starts independently; a saved completed round unlocks the next unfinished island in that lesson, without requiring mastery. Previously completed islands remain accessible, while uncompleted gaps gate later unfinished islands. Disabled padlocks and guarded path-details/start handlers enforce this learning-path flow; Practice mixes remain available separately and server entitlements/grading are unchanged. Continue follows the selected lesson. No avatar is restored. Greeting props are offset horizontally (notebook 24%, cups 44%) and slightly rotated; native images remain unchanged. See reports/path-progress.json, tests/path-progress.test.mjs and reports/path-progress-cache.json. Cache path-progress-v66; app/overworld queries pathprogress1, app.css loading1. No backend redeployment; do not wait for Pages.

Latest mastery policy: one unaided correct answer masters each prompted item, including accepted synonyms. Eight correct answers on a ten-word island immediately yield 8/10; the next round excludes mastered items and prioritizes unseen/incorrect items. Once every target is mastered the island becomes gold with a crown, and all island crowns earn the lesson crown. Mastery remains earned despite earlier/later mistakes; no 75% gate or three-answer requirement. Hints/matching do not count as retrieval and silent alternatives cannot master listening tasks. Existing graded history is re-summarized without rewriting records; stable recall question IDs recover previously accepted alias credit. Retry identity compares submitted work rather than policy-derived grading fields, preserving old-attempt idempotency and rejecting changed answers. Frontend/backend content are synchronized, including latest question formats, short-answer instructions and app-owned book recordings. Cache master-once-v65; entry masteronce1, app.css loading1. This replaces all older mastery requirements below. Server deployment e86e3970-ba28-4e74-a361-94a433321094 is live, source revision 71ef9c622fde170e897849e7b8d3e687b8806685. Validation: 67 checks, typecheck/build, browser 8/10 → 10/10, and real CMS reserved-QA 8/13 → 13/13 with idempotency and device restore. See backend/reports/mastery-once-deployment.json, backend/reports/live-one-correct.json and reports/one-correct-mastery.json.

Latest question clarity correction: use the wording Write a short answer with Yes. / Write a short answer with No. after the question, instead of parenthesized polarity cues. Multiple-choice versions say Choose a short answer with Yes. / No. This supersedes the earlier (Yes)/(No) format and removes the unseen Class 3 card implication. Both current short-answer items were reviewed; no accepted answers, grading rules, question IDs, grammar targets or deployed backend behavior changed. Use this pattern for future short-answer items. Cache short-answer-v64; entry shortanswer2, app.css loading1.

Latest publication change: all unpublished book authoring folders (A1, shared Base and its ZIP, future levels) are local-only and ignored. The book-build workflow is also untracked, preventing cloud builds without sources. Every local file was hash-checked before/after untracking and remains untouched. The companion retains its curriculum data and 12 unchanged recordings in assets/audio/book-unit1, with provenance hashes; runtime audio no longer depends on ../A1. course.bookUrl is null. Content tests compare the local book when present and otherwise the reviewed content/source-unit1.json snapshot, explicitly recording the evidence scope. Old book revisions remain in Git history; ignored local books need their own backup and must never be removed by git clean. Cache local-book-v62; entry localbook1, app.css loading1. No backend deployment or history rewrite. Normal no-wait deployment preference applies.

Latest exercise policy: full-sentence vocabulary questions and the reviewed sentence-like expressions Nice to meet you / See you later use multiple choice, including in mixed rounds and silent listening alternatives. Individual lexical items/chunks (apellido → last name, first name, phone number, Good morning/night) remain typed; grammar composition retains its form-focused tasks. Do not infer typing solely from word count. Canonical question IDs, correct answer text, bank coverage and server grading stay compatible; no backend/book changes. This supersedes older all-vocabulary-typed assertions. Cache sentence-choice-v61; entry sentences1, app.css loading1. User requested waiting for deployment this release only; normal no-wait preference remains.

Latest loading fix: restore the existing orange dot's boot-hop animation on both startup and result-save loading screens. The legacy global animation:none!important rule had suppressed it. A scoped no-preference media rule restores only this indicator: vertical bounce/stretch at full opacity; reduced motion remains static. No character animation changes. Cache loading-bounce-v60; app.css query loading1, entry stays answer1.

Latest exercise audio placement: Play audio now sits beside the suggested answer inside correct/incorrect feedback, below Correct!/Not quite. It plays the question's canonical target recording, independent of the user's typed answer (including accepted alternatives). It is absent before grading, and wraps beside long answers on small screens. Remove the former pronunciation slot below the input; the reserved feedback dock and listening alternative remain. Cache answer-audio-v59; entry/app.css queries answer1.

Latest path correction: remove the user avatar/You marker from the lesson path, including its positioning and island-selection motion. Profile/sidebar avatars and avatar editing remain. Islands, details, artwork and scrolling controls are unchanged. This supersedes older path-player requirements and assertions. Cache no-path-avatar-v58; app entry query path1 (app.css remains flow1). Finish after relevant checks and pushing; do not wait for GitHub Pages unless explicitly requested.

Latest lesson/results flow: fix short-screen overflow when feedback/Play audio appears; reserve an answer dock and pronunciation slot, adapt short-height spacing/illustrations, preserve natural scrolling for longer exercises. Saved Results fit shorter viewports and start at the top. During saveAttempt show the same Horizons boot wordmark/orange-dot loader, not a Results page with Saving text. A failed save shows retry controls without scores; a successful retry reuses the attempt ID and then reveals results and the appropriate cue. See reports/lesson-scroll.json and docs/UI-MOTION.md. Cache lesson-flow-v57; entry/app.css queries flow1.

Latest placement correction: keep the same sparse lesson-specific artwork, but place one topic object above and one below each lesson trail. Upper positions vary by lesson and sit between island/portrait columns. No additional decorations or artwork generation. Cache lesson-areas-v56; overworld stylesheet query areas2 (existing modules stay areas1).

Latest map cleanup: Unit1 now uses two distinct topic-object tiles and one wildlife accent per lesson (28→12 decorations); repetitive plants are retired from the route, preserved in the asset library. 1A cafe cups, 1B work bag, 1C globe, 1D postbox supplement their existing lesson props. Four native landmarks are slightly smaller;308px path, all21 islands, avatar/details, controls and sounds remain. Production/provenance: [lesson-area-tiles/production-record.json](lesson-area-tiles/production-record.json). Placement/control evidence: reports/lesson-area-proof.json. Cache lesson-areas-v55; queries areas1.

Latest milestone sounds: native ElevenLabs v3 assets in assets/audio/milestones-v1; saved rounds play completion, newly earned server-confirmed island crowns play mastery instead. Shared remembered mute includes all four cues. New files, exact briefs, provenance, async-save handling and QA: [SOUND-PRODUCTION.md](SOUND-PRODUCTION.md). Cache milestone-sounds-v54; queries milestones1.

Latest answer sounds: native ElevenLabs v3 correct/wrong cues are in assets/audio/feedback-v1. The exercise header mute persists locally and does not mute lesson recordings. See [SOUND-PRODUCTION.md](SOUND-PRODUCTION.md) for native provenance, exact prompts, runtime rules and verification. Cache answer-sounds-v53; queries sounds1.

Latest editor feedback: first look-around begins after500ms, easing to its first pose at1900ms; the existing20-second varied gaze pattern is retained. Each avatar option change (skin, clothes, hair, eyewear, badge, hair color or background) triggers an immediate140ms eye-only blink alongside customization feedback, including changes queued while art loads. Reduced motion remains neutral with no feedback animation. Face/glasses tracking, fixed background, immediate lesson entry and stable path scroll remain. Cache avatar-editor-v49; queries look2.


Latest avatar gaze frequency: three varied glances every20 seconds (nine per minute),50% more frequent than the previous30-second schedule. Only pauses/holds are shortened;1.4–1.9-second transitions, face/glasses synchronization, breathing, blinking, resting eyes, fixed background and immediate lesson entry remain. Cache avatar-gaze-v48; module queries look1.


Latest lesson-entry/path correction: no jump-in animation or entry delay; Start opens the selected activity immediately. Detail popovers reserve any required page space within the current learning path until the route changes; switching/dismissing details must not remove that space and clamp the page scroll upward. Minimal downward reveal remains when required to keep details below the island and clear of mobile navigation. Cache path-details-v47; module queries pathfix1.


Latest gaze refinement: glasses share the exact facial-layer translation. Look-around uses a30-second schedule with three unequal glances (right/up, left/up, slight right/down),1.4–1.9-second transitions and long neutral rests. Breathing and140ms blink retain their independent5200ms period. Original resting eyes, fixed background, full opacity, masks and reduced-motion handling remain. Cache avatar-face-v46; queries face5.


Latest avatar correction: generate a genuinely blank head FIRST, then separate expression/eye-white/pupil/blink sprites. Whole-head expression swaps and skin patches are prohibited for avatars as well as Pico. The portrait background stays completely still during breathing and customization/island feedback; only the internal avatar artwork moves. Subtle look-around combines masked pupil translation (±2.5 logical px) and face-layer translation (40% of that). Main editor/path only; sidebar/thumbnails static. 5200ms cycle,140ms eye-only blink, full-opacity transitions, reduced-motion still, hidden/offscreen pause and cleanup. All costume/hair/glasses anchors and saved IDs retained. Visible avatar-only breathing scales from(.994,.98) to1; the face moves with each glance, independently of the fixed background. Current assets/process: docs/avatar-face-v2/production-record.json; audit: docs/ANIMATION-AUDIT.md. Pupils enlarged17% (18 to21 logical px), retaining eye masks. Default white-eye bounds and inward pupil positions are measured from the accepted still for each base/skin; glances return to those measured positions. Cache avatar-face-v44; queries face4.

Latest avatar change: slightly rounder face silhouette via ImageGen-generated alpha mask on existing native head pixels. Facial features/colors, ears/neck, frames, eye anchors and all costume/hair/accessory/badge metadata stay registered; ten costumes, two bases and six skins reviewed across240 rendered combinations. Saved IDs unchanged. See docs/rounder-avatar/production-record.json and reports/round-avatar-proof.json. Cache round-v40; avatar metadata and manifest query round=1.

Latest correction: bird wings flap using ROTATION ONLY (-35 to55 degrees); no wing squash, stretch or skew and no whole-bird scaling. Saved player portrait changes island only on explicit island activation (mouse/touch click or equivalent keyboard activation), never on hover/focus/leave or auto-retargeting while scrolling. Scrolling the selected island out of view hides the portrait until it returns; it does not select another island. Initial placement is allowed. Hover arrows and other accepted controls remain.

Latest interaction/art update: mouse hovering an arrow scrolls until leave, as well as press/hold. Reached ends hide arrows; a real adjacent implemented unit turns its boundary into an explicit Go to Unit button (never auto-activate on hover). Unit registry currently contains only Unit 1. Avatar previews stay on fully visible islands; building names removed. Lesson-specific isolated native object tiles are reused. Bird now has separate ImageGen body/near/far wings, transform-only flaps with squash/stretch smear moments and local hover motion; butterfly also hovers locally. Reduced motion, hidden/offscreen pause and disposal apply to every wing loop. Older fixed-eight-animation / release-while-hover assertions are superseded.

Latest controls placement: left/right arrows flank the actual path at its left and right edges, vertically aligned with the trail center. Dedicated 44px columns keep them outside the swipe surface and island hit targets. This supersedes bottom-centered controls; faster scrolling and native vertical wheel/swipe remain. Cache tiles-v37, queries tiles3.

Latest visual correction: plain/colorless map surface (same paper as page), original orange/magenta/pink island styling and thin pale per-lesson connectors without the tan road outline. Hide the horizontal scrollbar; center left/right arrows BELOW the map. Faster held-arrow travel: 200→640px/s over600ms, short tap180px, keyboard activation360px. Keep native vertical wheel, swipe/drag, 308px trail, sparse tiles and portrait-above/details-below. Do not restore helper messages.

Latest modular runtime 13ab5f769cc47b39bf39cade28b3e724262fde56 is published on both branches; Pages run42066986191 succeeded. Trail308px, sparse reusable tiles, NO whole-environment panels; portrait ABOVE, details BELOW. Hosted 84-placement/navigation/Start checks pass, 421-file parity. See reports/minimal-overworld-release.json. Older world-panel and opposite-placement instructions below are superseded. Cache tiles-v35; entry queries tiles1.

Latest environment rule (5 November): do not generate or display whole environment panels, landscape chunks or precomposed neighborhoods for the overworld. Retire the large v32 scenery panels. Use a sparse reusable tile set: individual complete trees and small bush/flower/grass tiles, independently placed with open space. Single native building landmarks may remain individual sprites. Keep the path 30% shorter (440px to 308px). Latest placement correction: player portrait ABOVE the island/building, activity details BELOW. No added headings/taglines/instruction messages; native vertical wheel and hold/swipe controls remain.

Latest navigation correction runtime a15618cd79419fd98ff89e960f2edff156a76dec is published on both branches; Pages 42058505416 succeeded. Hosted proof reports/overworld-navigation.json passes. Normal vertical wheel, held arrows, native swipe/mouse drag, no extra map heading/tagline/instruction messages. Cache v34, queries overworld3. Older wheel-conversion instructions/reports below are superseded.

Latest user correction (5 November): keep normal vertical mouse-wheel page scrolling; never convert it to horizontal map movement. Horizontal navigation uses slowly accelerating press-and-hold arrows, native touch swipe/momentum, mouse drag and keyboard buttons. Remove the extra New Friends Town heading, adventure tagline and all wheel/swipe/hover helper messages. Do not add promotional headings, taglines or navigation instruction copy unless explicitly requested. Older wheel-conversion reports are historical and superseded. Cache overworld-v34; queries overworld3.

Overworld runtime 9a29911c85976856b30813fe3e27c9420046b65c is published on both branches; Pages run 42055395675 succeeded. Hosted world/cache/Pico checks pass, with exact parity for 414 runtime/native files. See reports/overworld-release.json. Later evidence-only commits preserve this runtime.

Current enhancement: Unit 1 New Friends Town overworld, normal mouse-wheel vertical-to-horizontal travel, hover/focus saved-avatar preview movement, four native building landmarks, four ImageGen neighborhoods and eight animated decorative birds/butterflies. Same compact shell, 21 activity IDs, profile/learning/backend and Pico. Cache overworld-v32, queries overworld1. See OVERWORLD.md and docs/overworld/production-record.json. Current R07 now includes selected overworld art; the exact earlier inputs used for generation are archived in docs/overworld/inputs.

Previous layout baseline (superseded only by the current overworld enhancement): restore the exact pre-fieldguide compact design, changing only the trail to a horizontally scrollable unit route. Same sidebar/mobile navigation, compact Pico hero, island states and minimal popovers. Four lessons sit side by side; saved user avatar marks current/selected activity. The book-led fieldguide experiment was superseded by the user's later request. Cache horizontal-v31, entry queries horizontal1. See HORIZONTAL-PATH.md and current APP-AUDIT.md.

Current animation rule: Pico has no fading/transparency transitions. Sprite visibility switches instantly at full opacity; movement uses transforms. One 8-second idle then 6-second inspection. Cache pico-v29, queries pico6. See the rewritten ANIMATION-AUDIT.md for the current from-scratch workflow, active sprite inventory and refreshed reference boards/14-second preview. Earlier trial details are in ANIMATION-AUDIT-HISTORY.md.

Current Pico rendering: v4 faceless ImageGen head with separate transparent expression sprites. V3 skin-patch compositing is retired. Motion unchanged. Cache pico-v27, queries pico4. See ANIMATION-AUDIT.md current v4 section and faceless-production-record.json.

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


### Jo animation release — 6 November 2026

All four accepted Jo v3 poses now animate with separate native ImageGen parts and a permanent faceless head/features, preserving her original head exterior/glasses/neutral anchors. One8-second idle plus3-second pose-specific accent; correct jump/joy, wrong head bob/raised brow and immediate saved-results accent follow Mina/Alex. Allopaque transforms/sprite swaps; originalstills for reduced motion/failure; pause/disposal/replay guards remain. `pour` is mug wiping, not a new pouring prop.

Twenty-four exact calls, nine rejected outputs, successful mandatory-reference preflights and original native bytes are preserved in docs/jo-motion-v1/production-record.json. Mechanical keying/registration, source feature selection and corrected reconstruction are disclosed in its README and reference-manifest. Runtime src/jo-motion.js, styles/jo-motion.css, assets/art/jo-motion-v1/rigs.json; queries jo1, worker horizons-companion-jo-motion-v97. reports/jo-motion.json, jo-motion-cache.json and jo-production.json pass, with actual synthetic exercise/results, allpose extremes, normal-speed review and lifecycle/fallback checks. Root plus two agents reviewed compositions; physical devices/Safari/Firefox/human acceptance are unverified. Audit and image guide updated; no grading, backend, printed book or real learner data changes. Publish through existing branch/main; do not await Pages per current preference.


### Alphabet is listening-only — 6 November 2026

Latest user instruction supersedes typed alphabet retrieval: alphabet letters always generate listening multiple-choice questions in Learn, recall/choice/mixed/listening Practice, regardless of typed-answer preference. Letter IDs/audio/answer terms remain stable. Alphabet is excluded from memory/matching. Alphabet-only selections show Listening, hide Type answers and disable non-listening games. Legacy name-spelling tile activity now uses the existing recorded name-spelling listening choices. No printed-book or word-bank changes.

Alphabet audio cannot become a silent typed substitute: I cannot listen now returns to Practice for a current alphabet task; when other audio is switched off, future alphabet tasks are excluded. Existing ordinary non-alphabet audio alternatives remain. Saved history is not rewritten. Frontend/server content copies synchronized. All42 regression/backend checks pass, production backend build passes, actual1440/390px listening screen has no typed field or answer cue and exits to Practice on cannot-listen (reports/alphabet-listening.json). Reserved synthetic QA live answer saves correctly (backend/reports/live-alphabet-listening.json). API deployment1699b9ac-49df-475e-801d-29467db1fec5, source76e0d12d0a36c59787fd2ef345b9a9a45f12b81a. Cachev98 alphabet-listening; app/viewport alphabet1. Pages build not awaited.


### Distinct occupation forms — 6 November 2026

User chose to split only different English terms. Actor/actress now have actor/actriz cues, explicit male/female job-title questions, separate pictures and new actress audio. Existing waiter/waitress pair/art verified; gender-neutral English jobs unchanged. Newactress stableID appended to Jobs2, Learn/Practice/word bank and mastery; oldIDs/progress retained and no historical answers rewritten. One built-in ImageGen edit used actualR01/R02/R07+actor target after successfulfour-input preflight; rawsource, prompt, frozenreferences, derivative and QA in docs/occupation-variants-v1/README.md and production-record.json.

43 content/backend checks, desktop/mobile actual-round/save, native MP3 transcript/decode and v98→v99 offline cache pass. Live reserved synthetic actress grading passes; no real learner QA. API d96e60ee-9751-4bde-8282-3fd377c64a94/source06527ddf44a9af0fca8d5a31082260144affaf11. Cacheoccupation-variants-v99/appoccupations1. Backend code synchronized, printed book and existing art/audio unchanged. Pages build not awaited.


### Animated login cast — 6 November 2026

The user authorized all four animated cast members on the login screen. Mina step, Alex listen and Jo offer already mounted their native rigs there. Login Pico now uses the existing accepted explore/map-reading rig rather than the unrigged greet still; his exact explore still is the reduced-motion/missing-part fallback. The shared Pico loader/CSS and disposal selectors cover both banner and login, without modifying the native art, motion tracks, cadence or accepted banner behavior. Mina/Alex/Jo retain8-second idle +3-second accent; Pico retains8-second idle +6-second map inspection. No new ImageGen calls, anatomy, fades, login copy, backend or learner data changes.

Actual unauthenticated login checks at1440x900,1024x600,390x740 and320x640 pass: allfour rigs mount, idle/accent frames fit, controls usable, full-opacity sprites, reduced original stills, hidden pause, disposal and missing Pico part fallback. No API requests occurred. reports/login-cast.json and login-cast-cache.json record evidence; v99→v100 cache upgrade verifies current login asset bytes and all four rigs ready offline. App/art/CSS/Pico query login1; worker login-cast-v100. Existing reference pack rebuilt for current loader/style fingerprints; original artwork is unchanged. Local Chromium checks do not establish physical-device/Safari/Firefox acceptance. Pages build not awaited unless requested.

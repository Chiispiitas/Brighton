# Horizons animation production audit

Latest desktop screen fit (6 November 2026): Learn, Practice, word bank, profile, quizzes, games, results and welcome now use height-aware desktop layouts. Shell navigation and primary controls remain in the viewport; topic/word lists, avatar options and long exercise content scroll inside their panels. The Unit banner Continue button is removed on every device; exercise feedback/exit-confirmation Continue controls remain. Learn scales the banner and trail to available height, caps the accepted trail height, and keeps all decorations, landmarks and side arrows visible. On short desktop windows island details open above their island when necessary, without inserting page space or scrolling the page. No new artwork, character motion, grading, backend or printed-book changes. See docs/SCREEN-FIT.md, reports/desktop-fit.json and reports/screen-fit.json. Cache screen-fit-v82; app/studio/viewport queries screenfit1; overworld stylesheet desktopfit1.

Latest path prop corrections (6 November 2026): the notebook cover uses a hidden backface so its person icon never appears inside, and the writing sprite is retired. The existing separate coffee splash now bursts to 2.25x scale, arcs and falls. The globe smear is removed. A fixed mailbox-slot wrapper clips the independently moving letter as it emerges and fully enters; the former moving-image mask was incorrect. All native sprites/IDs are preserved, with no new artwork, fades, character, backend or book changes. See docs/prop-motion-v1/CORRECTIONS-2026-11-06.md and reports/prop-motion-fixes.json. Cache prop-fixes-v81; app/motion/overworld queries props2; rig manifest v=2.

Latest avatar neckline/hair fit (6 November 2026): reuse the existing native neck pixels as a registered45px extension behind all ten garments; no new bitmap artwork or expression patches. Side-part hair moves down3 logical pixels to close the forehead gap on both bases/all six skins. Eye/face/glasses anchors, hair colors, outfits and saved IDs remain. Before/after and240 costume combinations plus24 hairstyle/base combinations reviewed in static/editor rigs. Native PNGs unchanged; reference sheets R03–R06 regenerated from the renderer. See docs/avatar-fit-v2/production-record.json and reports/avatar-fit-v2.json. Cache avatar-fit-v80; app query avatarfit2; art/static module queries fit2; metadata fit=2.

## Path prop animation release — 5 November 2026, corrected 6 November

The user authorized animation of the eight lesson props and removal of all path birds/butterflies. Character/avatar/Pico rigs are unchanged. Current renderer: `src/prop-motion.js`; registrations: `assets/art/prop-motion-v1/rigs.json`; exact sprite calls: [production record](prop-motion-v1/production-record.json); [reference manifest](prop-motion-v1/reference-manifest.json).

| Prop | Separate parts and motion |
| --- | --- |
| Cups | Separate red/yellow cups clink; the separate native coffee splash grows to 2.25x, rises, rotates outward and falls. |
| Address notebook | Blank interior/pages, front cover with hidden reverse and separate pencil. Pencil moves over the page and returns as the cover closes; no writing mark. |
| Medical bag | Body and handle/clasp group; small body rock and lift/click of the upper group. |
| Chef tools | Independent hat and spoon; hat tips and spoon swings. |
| Map | Three panels fold about their creases; independent compass turns. |
| Globe | Fixed stand and rotating illustrated Earth disc, without a smear. This is an illustrated disc turn, not simulated 3D geography. |
| Keys | Separate ring and key; local hinge/swing motion. |
| Mailbox | Existing fixed native mailbox plus a separately generated letter, briefly spouted and received through a slot mask. |

Production followed the existing audit: 21 distinct part briefs, each preflighted with actual R01/R02/R07 and accepted-target paths (four total inputs). Each moving component was generated in its own image/call. Two faulty outputs were rejected: a map panel retained a compass-shaped cutout; the Earth had a pale blotch. Their repair calls each attached the original prop plus exact faulty target and the three mandatory references (five total inputs). All 23 native outputs remain unchanged under `assets/art/prop-motion-v1/native/`; both rejections and their reasons remain in the production record. Frozen copies of the attached reference sheets are under `prop-motion-v1/inputs/`. No whole scenery or character anatomy was generated.

`tools/prepare-prop-motion.py` performs only alpha-bounds cropping (a median-filtered threshold finds bounds), uniform scaling and translation onto shared transparent canvases. It does not redraw or recolor parts. Part placement was checked against the source props and adjusted where the chef tools were initially undersized. [Reconstruction board](prop-motion-v1/review/reconstruction-board.png) and `reconstruction-check.json` record the visual comparison and supporting silhouette IoU (0.857–1.000). The result is very similar, not pixel-identical; geometry scores are not visual acceptance by themselves. The original stills remain the static fallback.

The production renderer decodes every required component before swapping in a rig. Each prop uses a shared clock, transform-only anticipation/action/overshoot/settling and a long neutral rest; different timings prevent synchronized motion. Special splash/letter sprites switch with `hidden`, always at opacity 1; their motion uses transforms. Writing and smear sprites remain archived, excluded from the runtime manifest/precache. No opacity keyframes, fades or crossfades. Notebook perspective scales with render size and its front illustration is hidden past90 degrees. The fixed slot wrapper masks the moving letter. The previous release mask moved with the letter and failed to establish true insertion; this correction verifies full occlusion before the letter is hidden. See [correction record](prop-motion-v1/CORRECTIONS-2026-11-06.md). Review frames: [rest](prop-motion-v1/review/rest.png), [extreme](prop-motion-v1/review/extreme.png), [settle](prop-motion-v1/review/settle.png). A normal-speed actual-renderer review is saved locally at `C:/Users/David/Documents/Codex/2026-11-05/prop-motion/normal-speed-review.webm` to avoid adding a video to the public site.

Reduced motion displays the exact accepted original stills. Offscreen and hidden-document clocks pause; navigation disposes observers/listeners/animations/frame callbacks, including late-decode guards. Missing sprite/manifest/module retains the original prop. No new sounds or decorative labels. Wildlife markup, wildlife animation code and its precache entries are removed; original wildlife art stays in the asset library for provenance. Existing vertical wheel, horizontal hold/hover arrows, native swipe/drag, location ring, lesson locks, crowns and 308px trail are retained.

Verification: `reports/prop-motion.json` covers all eight rigs, full opacity, missing-part fallback, reduced motion, hidden/offscreen pause and disposal. `reports/prop-motion-cache.json` covers actual previous-worker upgrade and exact offline runtime/part bytes. `reports/path-progress.json` retains path behavior checks. Review is by the root agent in Edge/Chromium; enlarged review grids use the same renderer. No independent/human review, physical-phone test or Safari/Firefox check is claimed. No real learner records or backend writes were used.

For a new prop animation: pin the actual accepted prop and its baseline; list only moving parts and fixed supports; create one brief and preflight per separate sprite; attach the exact returned images; preserve raw output and inputs; reject/repair holes or missing contours through ImageGen; register uniformly and reconstruct before motion; inspect rest and true extremes at both review and actual slot sizes; add one full-opacity clock with pause/fallback/disposal; test lifecycle/cache; update this audit and the prop reference manifest with exact files, prompts, hashes and known limits. Do not replace sprite generation with code-drawn substitute shapes.

Latest map cleanup: wildlife is reduced from8 to4 accents, one per lesson: birds in1A/1C and butterflies in1B/1D, locally hovering in the lower decoration lane. The two bird rigs retain rotation-only wing flaps; no new motion or anatomy was authored. All existing reduced-motion, visibility and disposal rules apply. Pico/avatar motion is unchanged. Older assertions requiring four bird rigs/eight wildlife elements are historical.

Latest milestone audio: saved lesson rounds and newly earned island crowns have distinct native ElevenLabs cues. Audio is independent of reduced motion, shares remembered sound-effects mute, and adds no character motion. See [SOUND-PRODUCTION.md](SOUND-PRODUCTION.md).

Latest exercise audio: finite answer feedback now has local ElevenLabs correct/wrong cues and a remembered mute button. No character or motion changes. Sound provenance and reproduction process: [SOUND-PRODUCTION.md](SOUND-PRODUCTION.md).

Latest exercise feedback: result-panel, badge, button, answer nudge and progress pulse are finite interface motion only; see [UI-MOTION.md](UI-MOTION.md). Cast and avatar animation contracts remain unchanged.


Latest editor feedback: first look-around begins after500ms, easing to its first pose at1900ms; the existing20-second varied gaze pattern is retained. Each avatar option change (skin, clothes, hair, eyewear, badge, hair color or background) triggers an immediate140ms eye-only blink alongside customization feedback, including changes queued while art loads. Reduced motion remains neutral with no feedback animation. Face/glasses tracking, fixed background, immediate lesson entry and stable path scroll remain. Cache avatar-editor-v49; queries look2.


Latest avatar gaze frequency: three varied glances every20 seconds (nine per minute),50% more frequent than the previous30-second schedule. Only pauses/holds are shortened;1.4–1.9-second transitions, face/glasses synchronization, breathing, blinking, resting eyes, fixed background and immediate lesson entry remain. Cache avatar-gaze-v48; module queries look1.


Latest lesson-entry/path correction: no jump-in animation or entry delay; Start opens the selected activity immediately. Detail popovers reserve any required page space within the current learning path until the route changes; switching/dismissing details must not remove that space and clamp the page scroll upward. Minimal downward reveal remains when required to keep details below the island and clear of mobile navigation. Cache path-details-v47; module queries pathfix1.


Updated 5 November 2026, America/Bogota. This is the current specification and production workflow. The user's latest instruction wins. Earlier claims and settings are preserved in [the preceding audit snapshot](animation-history/2026-11-05-before-v46-refresh.md) and [the original trial history](ANIMATION-AUDIT-HISTORY.md); they are not current instructions.

## Current source and publication status

Previous fully verified animation baseline (before the lesson-entry/path correction): `5f6218c28594d231d218060de7a930d5681c32dc` (gaze/eyewear runtime introduced in `24b8af50bcd2c24cbbb7e087979a0bebc94624e5`; the later commit refreshes its glasses preview). This historical baseline is retained for unchanged avatar-motion evidence. Cache: `horizons-companion-avatar-face-v46`; module queries: `face5`; app stylesheet query: `options1`.

The current gaze/glasses implementation is live. [Pages run 42105016286](https://github.com/Chiispiitas/Brighton/actions/runs/42105016286) succeeded; the earlier run 42103418808 was cancelled. Fresh hosted checks passed at four widths, including matching face/glasses motion, slower varied glances, original rest, breathing, fixed background, masks, fallback and lifecycle. Exact hosted-byte parity covers 448 committed website files and 12 unchanged book recordings. See [current source-bound status](../reports/avatar-animation-audit-v46.json). Documentation-only commits after this runtime do not alter its behavior.

## Scope and non-negotiable rules

| Target | Current authorized motion |
| --- | --- |
| Unit 1 banner Pico | Established faceless-head reading rig:8-second idle,6-second map inspection |
| Main avatar editor and selected path portrait | Breathing, separate blink, varied glances, customization/selection feedback; immediate lesson entry |
| Sidebar avatars and option thumbnails | Static |
| Decorative bird | Separate body/near/far wings, rotation-only flap and local hover |
| Butterfly | Established local hover/flutter |
| Other cast | Static unless specifically authorized |

Generate a genuinely blank head FIRST and expressions/eye whites/pupils/eyelids separately. Do not swap complete expression heads, conceal baked eyes with skin patches, or revive abandoned articulated art. Keep native ImageGen originals and stable saved IDs. Masks contain already-separated features; they are not a substitute for separation.

Visible character and avatar layers stay at opacity 1. No fades, crossfades or opacity transitions; eye states switch atomically. Native transparent backgrounds and antialiased PNG edges are valid. Existing interface-control motion remains governed by [UI-MOTION.md](UI-MOTION.md).

The portrait background is stationary during breathing and customization/island feedback. Only avatar artwork moves. Glasses follow the exact face translation; they do not stay behind when the face glances. Hair/costume/neck geometry and the accepted resting gaze remain registered. Keep the printed book, backend and real learner records outside visual QA.

## Current avatar references

| Reference | Purpose and limits |
| --- | --- |
| [Production record](avatar-face-v2/production-record.json) | Exact two ImageGen briefs, actual attached inputs, native output paths/hashes, alpha/palette preparation and asset inventory |
| [Archived pre-generation references](avatar-face-v2/inputs/reference-pack-at-generation.json) | Source context used for those calls; native targets remain preserved |
| [Current reference manifest](avatar-face-v2/reference-pack.json) | SHA256 inventory of current review artifacts; per-artifact source binding distinguishes older costume boards |
| [Reconstruction/layer board](avatar-face-v2/reconstruction.png) | Accepted still, actual blank head, neutral assembly, separate eyelids and a glancing glasses example |
| [Current neutral](avatar-face-v2/neutral.png), [blink](avatar-face-v2/blink.png) | Current synthetic editor captures |
| [Glasses motion preview](avatar-face-v2/normal-speed-preview.mp4) |644 actual-renderer poses at 30fps:20-second gaze schedule,14 feedback frames and 30 settling frames;21.47 seconds total |
| [Preview contacts](avatar-face-v2/preview-frames.png), [capture metadata](avatar-face-v2/preview-capture.json) | Controlled-clock visual review, not a real-time performance benchmark |
| [Costume board](avatar-face-v2/all-costumes.png), [hair/glasses board](avatar-face-v2/hair-glasses.png) | Current v46 hosted 240-composition closed-pose fit check; not a full gaze matrix |
| [Original reference contacts](avatar-motion/reference-contact-0.png) | Part of the 598-frame/native30fps analysis of the user's20261105-1757-26.9073882.mp4 clip; timing inspiration, not generated anatomy |

The preview capture recipe is [avatar-face-preview.mjs](../tools/avatar-face-preview.mjs), with [encoding/contact recipe](../tools/encode-avatar-face-preview.py). [avatar-face-reference.mjs](../tools/avatar-face-reference.mjs) captures the layered comparison. No new ImageGen call was needed for the later breathing, resting-eye registration, glasses or timing refinements.

### Native art and mechanical preparation

Both original built-in ImageGen calls attached the exact five returned preflight paths: R01, a verified full-resolution R03/R04 bundle, R05, R06 and the exact rounded-head edit target. All mandatory avatar references were present, within the seven-total-image cap. One call generated twelve blank heads, the other isolated facial features. Native results remain unchanged in [blank-native.png](../assets/art/avatar-face-v2/blank-native.png) and [features-native.png](../assets/art/avatar-face-v2/features-native.png).

[prepare-avatar-face-v2.py](../tools/prepare-avatar-face-v2.py) performs disclosed magenta-matte separation, crop/trim, palette registration and rounded-alpha intersection. The original below-chin neck seam is retained for costume fit. Native shapes are not redrawn in code. These are documented derivatives, not untouched-native claims. Reconstruction is very similar, not pixel identical.

| Active asset under assets/art/avatar-face-v2/ | Role |
| --- | --- |
| blank-heads.png | One faceless head/ears/neck per base/skin; unchanged through every expression |
| eye-left.png, eye-right.png | Separate white eyes and pupil alpha masks |
| pupil.png | Two instances;21 logical px, about 17% larger than the first18px separated rig |
| brow-left.png, brow-right.png, nose.png, mouth.png | Independent neutral features |
| lid-left.png, lid-right.png | Separate closed eyelids; replace eyes/pupils only |
| rest-anchors.frames.json | Accepted-still white-eye bounds and actual dark-pupil centroids for both bases and all six skins |

The accepted still has a slight inward resting gaze. Pupil centroids are measured from the native still rather than inferred from eyewear anchors. Glances return to those positions. Existing head, costume, hair, accessory and badge metadata and saved IDs remain unchanged. The original open head is used in static contexts and loading/failure fallback, and is hidden once the new facial rig is ready.

### Layering, masks and eyewear

The stationary portrait container contains a square stage, then an avatar-only feedback group, then an avatar-only breathing group. Blank head, wardrobe, hair, face and glasses inherit this breathing group together. A head-alpha mask contains the facial features; each white eye separately masks its pupil. Eyewear remains a sibling at its established foreground layer, outside the head mask so the temples are not clipped, but receives the same translation string as the face on every gaze update and reset. Hair follows breathing, not the small facial glance. Glasses also reset with neutral/reduced motion and disposal.

### Breathing, blinking and feedback

- Breathing:5200ms, ease-in-out, scale(.994,.98)→scale(1)→scale(.994,.98), pivot 50%/80%. This provides a visible rise/stretch without enlarging beyond the accepted crop or moving the background.
- Blink: eye-only opaque swap at 4200–4340ms of each5200ms breathing period;140ms closed. Brows/nose/mouth and blank head remain unchanged.
- Every avatar option change triggers an immediate140ms eye-only blink using the separate generated eyelids. Pending changes wait for sprite readiness; rapid changes restart the blink on the latest avatar. The feedback deadline uses the same paused animation clock, is cleared on reset/disposal, and is suppressed under reduced motion.
- Customization feedback:420ms, avatar artwork rises1% and shrinks to.98, then settles.
- Explicit island activation:460ms, artwork rises2% and shrinks to.96, then settles. Hover/focus/scroll never retarget the player.
- Lesson entry: immediate activity start. The former 440ms jump, ghost portrait and delayed-entry cancellation flow are retired.

### Slower, varied look-around

Gaze reads the same elapsed animation time as breathing/blinking, modulo 20000ms. Its period is independent of their 5200ms period. It is deterministic, not randomized. Each transition uses smoothstep easing; directions, amplitudes, hold lengths and rests differ. Pupils translate relative to the white eyes; the face and glasses move at 40% of that offset, up to 1 logical px horizontally. Masks remain in place throughout.

| Time in 20-second schedule | Action; pupil offset in logical px |
| --- | --- |
|0–0.5s | Neutral rest |
|0.5–1.9s /1.9–2.7s /2.7–4.4s | Ease to(2.5,−0.4), hold right/up, return |
|4.4–7.0s | Neutral rest |
|7.0–8.8s /8.8–9.6s /9.6–11.2s | Ease to(−1.9,−0.8), hold left/up, return |
|11.2–13.3s | Neutral rest |
|13.3–14.9s /14.9–15.6s /15.6–17.5s | Ease to(1.1,1.2), hold slight right/down, return |
|17.5–20.0s | Neutral rest; joins the next cycle's initial rest |

There are three glances per 20 seconds, roughly nine per minute, replacing two glances per 5.2 seconds. Transitions take1.4–1.9 seconds. The longer, varied gaze does not slow breathing or blinking. The21.47-second preview covers this gaze schedule and feedback, not the full combined phase repetition of the independent periods.

### Accessibility and lifecycle

Only main editor/path instances mount avatar motion. Reduced motion cancels transforms and resets face, eyewear, pupils and eyes to neutral. Offscreen/hidden states pause the clock and reset visible facial state; resume reads the preserved phase. Disposal removes listeners, observers, animations and frame callbacks. Missing facial sprites/registration retain the original native still. There are no character opacity tracks.

## Verification and limits

Current local [face proof](../reports/avatar-face-proof.json) covers 320/390/768/1440px, glasses/face transform agreement within numerical rounding, unequal glances, long neutral rests, original resting pupil positions, visible breathing, fixed background, one unchanging blank head, eye-only blink, masks, opacity 1 and missing-sprite fallback. [Motion/lifecycle proof](../reports/avatar-motion-proof.json) covers scope, static sidebar/thumbnails, click-only targeting, feedback, reduced motion, pause, immediate entry and cleanup. [Cache proof](../reports/avatar-cache-proof.json) installs v49 and removes a synthetic expired cache and checks new face assets; it is not a complete previous-worker update simulation.

Current [hosted face checks](../reports/avatar-face-proof-hosted.json), [hosted lifecycle checks](../reports/avatar-motion-proof-hosted.json), [hosted costume checks](../reports/avatar-motion-costumes-hosted.json) and [hosted cache check](../reports/avatar-cache-proof-hosted.json) passed for v46. The 240-composition matrix covers the closed pose, both bases, six skins and ten costumes, with hair/glasses; it is not a 240-case full-gaze timeline. The 448-file [publication parity report](../reports/publication-assets.json) is bound to runtime 5f6218c. The [current release record](../reports/avatar-face-release.json) separates this from [preserved v44 evidence](../reports/avatar-face-release-v44.json).

Review is by the root agent using actual-renderer captures. No physical-phone, Safari/Firefox, independent reviewer or human approval is claimed. Hidden-document checks use a controlled event fixture. No real learner data was used. Preserve these limits when summarizing the result.

## Pico and overworld motion

Pico retains the established faceless head and separate neutral/inspection features. One8-second idle is followed by a 6-second map check: head lowers, map/paws lift together, raised brow and squint replace the smile with a closed neutral mouth. Closed eyelids retain150% size. Body/feet stay fixed. Full-opacity swaps, masks, reduced-motion still, phase-preserving pause and disposal remain. This audit refresh does not alter Pico. Earlier [Pico hosted proof](../reports/pico-opaque-hosted.json) remains bound to its original runtime56551e9; Pico behavior was not rerun in this documentation refresh.

Bird body and two generated wings remain separate. Wings flap with rotation only from −35° to 55° and back over 620ms. No wing squash/stretch/skew or whole-bird scale. The assembled bird hovers locally; it does not travel along a line. Butterfly motion remains a local hover/flutter. Reduced motion, offscreen/hidden pause and cleanup apply. Original smear/squash wing trials are historical. See [bird production record](bird-hover/production-record.json) and [OVERWORLD.md](OVERWORLD.md).

Map selection stays click-only. Wheel scrolling remains vertical; hover/hold arrows, touch momentum, mouse drag and keyboard activation retain their accepted behavior. No extra promotional headings or wheel/swipe/hover helper messages. Buildings have no visible name labels. Decorations use isolated sparse tiles, not large generated environment panels.

## Pico references and active sprite map

For Pico, read [IMAGE-PRODUCTION.md](IMAGE-PRODUCTION.md), [APP-AUDIT.md](../APP-AUDIT.md), and the [general reference manifest](image-references/reference-pack.json). Each cast ImageGen call must actually attach [R01 brand](image-references/01-brand.png), [R02 cast](image-references/02-cast.png), [R07 style/objects](image-references/07-scenes-vocabulary-ui.png) and the exact current edit target. **Maximum seven image inputs total, including targets.** Run the preflight before every call and attach its returned paths. Mentioning filenames in a prompt does not attach them.

The [animation reference manifest](pico-banner-animation/animation-reference-pack.json) inventories active assets, hashes and current visual references. It supplements the general pack; it does not replace mandatory inputs or exempt additional images from the seven-input cap.

| Reference | Purpose/status |
| --- | --- |
| [Original native crop](../assets/art/pico-banner-motion-v1/baseline-native.png) | Appearance baseline/static fallback. Atlas cast-static-pico-v2.png; x764/y19/w248/h582. |
| [Current layer board](pico-banner-animation/review/current-layers.png) | Faceless head, body, map/paws and all facial components separately over checkerboard. |
| [Current composed states](pico-banner-animation/review/current-states.png) | Baseline, reconstructed neutral, before/during/after blink, lift, inspection and restored neutral; current hosted renderer. |
| [Current normal-speed cycle](pico-banner-animation/review/current-cycle.mp4) | Current 14-second cycle with opaque swaps. Older videos have historical timing or fades. |
| [Initial part provenance](pico-banner-animation/production-record.json) | Head/body/map/blink prompts, actual inputs, raw outputs, rejected attempts and registration. |
| [Inspection provenance](pico-banner-animation/check-production-record.json) | First expression rejected for holes/halo; second supplies feature shapes, not an active skin patch. |
| [Faceless/sprite provenance](pico-banner-animation/faceless-production-record.json) | Exact faceless edit inputs/prompt, raw output and separated feature sources. |
| [Reading reference clip](C:/Users/David/AppData/Local/Packages/Microsoft.ScreenSketch_8wekyb3d8bbwe/TempState/Recordings/20261105-0510-16.8044300.mp4) | User inspiration for gaze/head/book movement; not a source of Pico art. External local file, not bundled. |
| [Stretch/bounce reference clip](C:/Users/David/AppData/Local/Packages/Microsoft.ScreenSketch_8wekyb3d8bbwe/TempState/Recordings/20261105-1214-52.2572934.mp4) | User inspiration for anticipation, elasticity and settling. Do not copy its character. External local file, not bundled. |

### Active sprite map

All files below are in [assets/art/pico-banner-motion-v1/](../assets/art/pico-banner-motion-v1/). Active sprites/masks share the 248×582 rig canvas. Raw ImageGen outputs retain their original dimensions/bytes.

| Active file | Role/source |
| --- | --- |
| head-faceless-registered.png | Blank head/ears/neck from head-faceless-native-v1.png; uniformly registered; no facial features. |
| body-registered.png | Fixed shirt, satchel, legs/feet from body-v2.png. |
| map-registered.png | Map and both gripping paws as one rigid group from map-hands-v2.png. |
| face-nose.png | Shared native nose from head-v2 art. |
| face-neutral-brows-mouth.png | Normal brows and smiling mouth/tongue from head-v2 art. |
| face-neutral-eyes.png | Native open eye whites; pupils separated and their footprints filled with sampled white. |
| pupils-native.png | Separate moving native pupils. |
| eyes-mask.png | Mechanical selection of native eye shapes; contains pupils. |
| face-blink-eyelids.png | Closed eyelid strokes only, from blink-native-v1.png via blink-registered.png. |
| face-inspect-features.png | Raised brow, squint and closed mouth only, from check-face-native-v2.png; skin/exterior excluded. |

Layer order: head behind body/map; inside head, blank base then contained facial layers. The nose is shared. Neutral brows/mouth and open eyes/pupils are replaced by inspection features; eyelids replace open eyes during blinking. Faces inherit the head transform. Masks are containment guards, not substitutes for properly separated sprites.

Recipes: [initial registration](../tools/prepare-pico-banner-parts.py), then [faceless head/feature separation](../tools/prepare-pico-face-sprites.py). The old [prepare-pico-check.py](../tools/prepare-pico-check.py) is historical patch work. Runtime no longer displays head-look-base.png, blink-registered.png or check-face-registered.png as face layers.


## New animation from scratch

### 1. Establish the exact target and action

Read current decisions, source, native art and relevant motion clips. Record the authorized character/location, action, expressions, schedule, display sizes and static fallback. Extract an untouched baseline crop. Define invariants: silhouette, proportions, colors, clothing, face identity and held objects. Preserve unrelated work.

### 2. Plan layers before generating

Start with a faceless head and separate features. List only body, limbs, prop, hands, eye whites, pupils, brows, mouths, eyelids and special expressions needed for the action. Group parts that must stay attached: Pico's map and gripping paws stay together. Define canvas, anchors, pivots, overlap behind joints and layer order. Do not split every limb without a purpose.

### 3. Prepare references and preflight every image call

Inspect the mandatory references for the asset domain: R01/R02/R07 for cast; R01/R03/R04/R05/R06 for avatars. Include the exact current native target for an edit. A verified lossless full-sheet bundle may reduce physical input count without dropping mandatory references. If the general pack is stale, rebuild it with the reference-board tool and review affected sheets first. Save one brief per deliverable: component boundaries, invariants, framing, alpha requirements, prompt, reference IDs and targets. Run tools/check-image-brief.py from the app directory. Attach its exact returned input_paths to built-in ImageGen; explain input roles in the prompt. Count all images, never more than seven. Repair a rejected preflight before generating.

### 4. Generate parts and preserve provenance

Use built-in ImageGen for new anatomy/expression art. Generate separate deliverables; tighten native crops when geometry drifts. Request complete contours, solid interiors and transparent backgrounds. Explicitly remove eyes/brows/nose/mouth/tongue from the head. Expressions should contain features only on transparency, aligned to agreed anchors, with no peach skin panel. Save raw results unchanged in the repository. Record exact prompts, ordered input hashes, tool output paths, dimensions, alpha and acceptance/rejection reasons. Accepted native generated features can be mechanically separated/reused; do not redraw substitute anatomy in code.

### 5. Inspect and redo failed components

View native results and checkerboard composites. Reject wrong identity/proportions, missing contours, extra anatomy, holes in solid areas, halo/shading, opaque backings, unwanted exterior pixels or registration that cannot match the baseline. Redo the offending ImageGen part if the assembly cannot reconstruct the same or a very similar character. Do not hide failure behind another large skin patch. A successful tool response is not visual acceptance.

### 6. Prepare sprites and reconstruct the still pose

Keep native files untouched. Make versioned derivatives with a repeatable recipe: mechanical crop, alpha selection, masks, documented scaling/registration and translation. Avatar eye bounds and pupil centroids come from the accepted still; never confuse eyewear anchors with actual resting pupil centers. Disclose sampled-color fills used during separation; derivatives are not untouched native bytes. Put features above the blank head in one coordinate space. Preserve complete ears/hair and joint overlap. Inspect blank head, isolated expressions and every composed face. Compare the full neutral assembly with the baseline side by side, with overlays/differences when useful. Identity and connected anatomy must pass before motion. Silhouette scores support review; they are not sole acceptance criteria or claims of pixel identity.

### 7. Build purposeful motion with transforms

Set pivots/fixed supports and a separate stationary background, then idle movement, then special action. Use translation/rotation/resizing, modest squash/stretch, anticipation, overshoot and settling where they serve the action. Keep feet grounded unless the action moves them; keep neck/collar connections and object grips intact. Review true extreme poses for clipping, detachment, unwanted floating or distorted identity before increasing movement.

### 8. Switch expressions at full opacity on one clock

No fades/crossfades/opacity interpolation. Hide outgoing features and show incoming features atomically. Hide eye whites/pupils during blink and show separate eyelids. A transform-based blink squeeze is allowed but must not reveal old eyes underneath. Masks contain pupils/facial features. Share a timebase across head, prop, gaze, blink and action. Pico uses three transform animations with a linear 14-second clock; one frame callback reads it and updates hidden attributes. Future implementations may differ while preserving these visual rules.

### 9. Integrate fallback, accessibility and cleanup

Opt in only the authorized character/location. Fit the rig uniformly to the real slot. Decode every sprite/mask before replacing the accepted still. Keep a decoded still for missing module/assets and reduced motion. Pico uses its original native still; avatars reset the assembled face to open neutral eyes and zero gaze, or retain the original native head when new facial parts fail to load. Pause the clock and face updater offscreen/in hidden tabs. Cancel animations/frame callbacks, disconnect observers/listeners and reset eyewear with the facial group and prevent late decodes from remounting after navigation. Preserve stable IDs and other static-character guards. Define resume behavior; Pico preserves phase.

### 10. Review composed motion and test behavior

Inspect neutral, actual extrema, blink, special face, return and loop seam, enlarged and at real app size. Review normal-speed playback covering every action. Avatar gaze repeats in 30 seconds while breathing/blinking repeat in 5.2 seconds; the 21.47-second preview covers a gaze schedule plus feedback, not the entire combined phase repetition. Test the actual route at 320/390/768/1440px: edge clearance, joints, grips, grounded body, face alignment and unwanted pixels. Probe before/at/after each expression switch and inside former fade windows. Reject fractional opacity or incompatible features visible together. Verify pupil containment, frequency, reduced motion, pause/resume, repeated navigation/disposal and missing assets/modules using fresh contexts. Use synthetic state, never real learner records. Name actual reviewers/scope; never imply human or independent approval that did not occur.

### 11. Publish and refresh the audit/reference set

Commit intended work, check remote branches, use the existing publication flow and invalidate relevant entry/service-worker caches. Verify live route, exact hosted module/art bytes and relevant browser behavior. Adapt cache-lifecycle tests to the real previous/new versions; old reports do not prove a later upgrade. Record revision, publication run, hashes, reports, browsers and remaining gaps. Refresh current reference boards, manifest and complete-cycle preview; label older material historical. No book/backend deployment as a side effect of animation work.


## Carry-forward checklist

Carry this audit, source-bound status, native originals, exact briefs/preflights, archived inputs, current reference manifests/boards, preparation recipes, renderer/motion modules, preview capture/encoding recipes and revision-bound reports. Refresh hashes and label each artifact with its actual revision. Retire obsolete expression-head swaps, skin patches, fades, old frequencies and wing squash instead of presenting them as alternate current workflows. For a new character, reconstruct and inspect the still pose first; redo unsuitable generated parts before motion.

## Lesson-entry and scroll correction

The user’s20261105-2042-15.2403208.mp4 (5.70s,30fps) was inspected via23 contact frames at4fps. A1440×700 diagnostic reproduced scrollY oscillating156→176→156px when switching islands: closing details removed a temporary body spacer, clamping document scroll before the next reveal. The spacer now belongs to the current learning path and survives detail switching/dismissal. The same sequence stays156→176→176px. It leaves with the path on route/activity changes. A minimum downward reveal remains when needed; vertical wheel scrolling stays native.

The lesson-entry jump helper and its asynchronous wait are removed. Start dispatches the selected activity immediately; no cloned portrait or deferred-entry cancellation remains. Selection/customization bounce, breathing, gaze, blinking and glasses tracking remain unchanged. [Current local regression](../reports/path-scroll-entry.json) covers27 selections at1440×700,1440×900 and390×844, dismissal, retained space, immediate activity entry and cleanup. Earlier jump-before-lesson and stale-entry-cancellation assertions are retired. No backend/book or real-learner changes.

Current editor regression: [editor-feedback.json](../reports/editor-feedback.json) verifies a visible gaze offset within the first second and a blink/reopen for skin, clothes, hair, eyewear, badge, hair color and background changes, plus reduced-motion neutrality. No ImageGen/native sprite changes were required. Source updates are queued for publication; earlier hosted reports remain bound to their original revisions until refreshed.

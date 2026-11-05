# Horizons animation production audit

Updated 5 November 2026, America/Bogota. This is the current specification and production workflow. The user's latest instruction wins. Earlier claims and settings are preserved in [the preceding audit snapshot](animation-history/2026-11-05-before-v46-refresh.md) and [the original trial history](ANIMATION-AUDIT-HISTORY.md); they are not current instructions.

## Current source and publication status

Current reviewed source: `5f6218c28594d231d218060de7a930d5681c32dc` (gaze/eyewear runtime introduced in `24b8af50bcd2c24cbbb7e087979a0bebc94624e5`; the later commit refreshes its glasses preview). At this audit refresh, both remote branches contain that source. Cache: `horizons-companion-avatar-face-v46`; module queries: `face5`; app stylesheet query: `options1`.

The current gaze/glasses implementation is live. [Pages run 42105016286](https://github.com/Chiispiitas/Brighton/actions/runs/42105016286) succeeded; the earlier run 42103418808 was cancelled. Fresh hosted checks passed at four widths, including matching face/glasses motion, slower varied glances, original rest, breathing, fixed background, masks, fallback and lifecycle. Exact hosted-byte parity covers 448 committed website files and 12 unchanged book recordings. See [current source-bound status](../reports/avatar-animation-audit-v46.json). Documentation-only commits after this runtime do not alter its behavior.

## Scope and non-negotiable rules

| Target | Current authorized motion |
| --- | --- |
| Unit 1 banner Pico | Established faceless-head reading rig:8-second idle,6-second map inspection |
| Main avatar editor and selected path portrait | Breathing, separate blink, varied glances, customization/selection feedback and lesson-entry jump |
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
| [Glasses motion preview](avatar-face-v2/normal-speed-preview.mp4) |944 actual-renderer poses at 30fps:30-second gaze schedule,14 feedback frames and 30 settling frames;31.47 seconds total |
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
- Customization feedback:420ms, avatar artwork rises1% and shrinks to.98, then settles.
- Explicit island activation:460ms, artwork rises2% and shrinks to.96, then settles. Hover/focus/scroll never retarget the player.
- Lesson entry: established440ms full-opacity portrait jump. Escape, reselection, hidden tab or route change cancels stale entry. Reduced motion skips the jump.

### Slower, varied look-around

Gaze reads the same elapsed animation time as breathing/blinking, modulo 30000ms. Its period is independent of their 5200ms period. It is deterministic, not randomized. Each transition uses smoothstep easing; directions, amplitudes, hold lengths and rests differ. Pupils translate relative to the white eyes; the face and glasses move at 40% of that offset, up to 1 logical px horizontally. Masks remain in place throughout.

| Time in 30-second schedule | Action; pupil offset in logical px |
| --- | --- |
|0–4.0s | Neutral rest |
|4.0–5.4s /5.4–6.5s /6.5–8.2s | Ease to(2.5,−0.4), hold right/up, return |
|8.2–12.4s | Neutral rest |
|12.4–14.2s /14.2–15.3s /15.3–16.9s | Ease to(−1.9,−0.8), hold left/up, return |
|16.9–23.2s | Neutral rest |
|23.2–24.8s /24.8–25.7s /25.7–27.6s | Ease to(1.1,1.2), hold slight right/down, return |
|27.6–30.0s | Neutral rest; joins the next cycle's initial rest |

There are three glances per 30 seconds, roughly six per minute, replacing two glances per 5.2 seconds. Transitions take1.4–1.9 seconds. The longer, varied gaze does not slow breathing or blinking. The31.47-second preview covers this gaze schedule and feedback, not the full combined phase repetition of the independent periods.

### Accessibility and lifecycle

Only main editor/path instances mount avatar motion. Reduced motion cancels transforms and resets face, eyewear, pupils and eyes to neutral. Offscreen/hidden states pause the clock and reset visible facial state; resume reads the preserved phase. Disposal removes listeners, observers, animations and frame callbacks. Missing facial sprites/registration retain the original native still. There are no character opacity tracks.

## Verification and limits

Current local [face proof](../reports/avatar-face-proof.json) covers 320/390/768/1440px, glasses/face transform agreement within numerical rounding, unequal glances, long neutral rests, original resting pupil positions, visible breathing, fixed background, one unchanging blank head, eye-only blink, masks, opacity 1 and missing-sprite fallback. [Motion/lifecycle proof](../reports/avatar-motion-proof.json) covers scope, static sidebar/thumbnails, click-only targeting, feedback, reduced motion, pause, entry ordering, cancellation and cleanup. [Cache proof](../reports/avatar-cache-proof.json) installs v46, removes a synthetic expired v45 cache and checks new face assets; it is not a complete previous-worker update simulation.

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

Inspect neutral, actual extrema, blink, special face, return and loop seam, enlarged and at real app size. Review normal-speed playback covering every action. Avatar gaze repeats in 30 seconds while breathing/blinking repeat in 5.2 seconds; the 31.47-second preview covers a gaze schedule plus feedback, not the entire combined phase repetition. Test the actual route at 320/390/768/1440px: edge clearance, joints, grips, grounded body, face alignment and unwanted pixels. Probe before/at/after each expression switch and inside former fade windows. Reject fractional opacity or incompatible features visible together. Verify pupil containment, frequency, reduced motion, pause/resume, repeated navigation/disposal and missing assets/modules using fresh contexts. Use synthetic state, never real learner records. Name actual reviewers/scope; never imply human or independent approval that did not occur.

### 11. Publish and refresh the audit/reference set

Commit intended work, check remote branches, use the existing publication flow and invalidate relevant entry/service-worker caches. Verify live route, exact hosted module/art bytes and relevant browser behavior. Adapt cache-lifecycle tests to the real previous/new versions; old reports do not prove a later upgrade. Record revision, publication run, hashes, reports, browsers and remaining gaps. Refresh current reference boards, manifest and complete-cycle preview; label older material historical. No book/backend deployment as a side effect of animation work.


## Carry-forward checklist

Carry this audit, source-bound status, native originals, exact briefs/preflights, archived inputs, current reference manifests/boards, preparation recipes, renderer/motion modules, preview capture/encoding recipes and revision-bound reports. Refresh hashes and label each artifact with its actual revision. Retire obsolete expression-head swaps, skin patches, fades, old frequencies and wing squash instead of presenting them as alternate current workflows. For a new character, reconstruct and inspect the still pose first; redo unsuitable generated parts before motion.

# Horizons animation production audit

Latest avatar correction: generate a genuinely blank head FIRST, then separate expression/eye-white/pupil/blink sprites. Whole-head expression swaps and skin patches are prohibited for avatars as well as Pico. The portrait background stays completely still during breathing and customization/island feedback; only the internal avatar artwork moves. Subtle look-around combines masked pupil translation (±2.5 logical px) and face-layer translation (40% of that). Main editor/path only; sidebar/thumbnails static. 5200ms cycle,140ms eye-only blink, full-opacity transitions, reduced-motion still, hidden/offscreen pause and cleanup. All costume/hair/glasses anchors and saved IDs retained. Visible avatar-only breathing scales from(.994,.98) to1; the face moves with each glance, independently of the fixed background. Current assets/process: docs/avatar-face-v2/production-record.json; audit: docs/ANIMATION-AUDIT.md. Pupils enlarged17% (18 to21 logical px), retaining eye masks. Default white-eye bounds and inward pupil positions are measured from the accepted still for each base/skin; glances return to those measured positions. Cache avatar-face-v44; queries face4.

Latest correction: bird wings flap using ROTATION ONLY (-35 to55 degrees); no wing squash, stretch or skew and no whole-bird scaling. Saved player portrait changes island only on explicit island activation (mouse/touch click or equivalent keyboard activation), never on hover/focus/leave or auto-retargeting while scrolling. Scrolling the selected island out of view hides the portrait until it returns; it does not select another island. Initial placement is allowed. Hover arrows and other accepted controls remain.

Latest interaction/art update: mouse hovering an arrow scrolls until leave, as well as press/hold. Reached ends hide arrows; a real adjacent implemented unit turns its boundary into an explicit Go to Unit button (never auto-activate on hover). Unit registry currently contains only Unit 1. Avatar previews stay on fully visible islands; building names removed. Lesson-specific isolated native object tiles are reused. Bird now has separate ImageGen body/near/far wings, transform-only flaps with squash/stretch smear moments and local hover motion; butterfly also hovers locally. Reduced motion, hidden/offscreen pause and disposal apply to every wing loop. Older fixed-eight-animation / release-while-hover assertions are superseded.

Updated 5 November 2026, America/Bogota. This is the current production workflow and reference index. The [historical audit](ANIMATION-AUDIT-HISTORY.md) preserves earlier trials, rejected attempts and source-bound releases. Historical settings are not current requirements.

## Current decisions and scope

The user's latest instruction wins. This workflow explains how to create a newly requested animation; it does not authorize animating the rest of the cast. Pico in the Unit 1 Learn banner retains its established rig. The main avatar editor preview and path portrait now use the scoped minimal avatar system described above; sidebar portraits, thumbnails and other characters remain static. Preserve the accepted website, artwork IDs, printed book and backend.

Use a genuinely faceless head with separate transparent facial-feature sprites. Never conceal old expressions with peach skin patches. Separate the features needed by the action: nose, brows, mouths, eye whites, pupils, eyelids and special expressions. Shared features can remain constant layers. Masks contain features within the head and moving pupils within the eye whites.

No fades, crossfades, opacity animation or transparency transitions. Visible sprites stay at opacity 1; incompatible expressions switch instantly. Transparent PNG backgrounds and native antialiased edges are still valid. Translation, rotation, resizing, controlled squash/stretch, anticipation, overshoot and bounce are allowed when anatomy stays connected and identity recognizable.

Pico's current cycle is one 8-second idle followed by a 6-second map check: 14 seconds total. The inspection expression has a raised eyebrow, downward squint, closed neutral mouth and no smile. Body and feet remain fixed. Closed eyelids display at 150% size. Reduced motion uses the original native still; offscreen/hidden-tab states pause the cycle. These are Pico's settings, not universal durations or amplitudes for future characters.

Pico verified runtime: `56551e90b35c9219295ce26b74a0084cad82eef6`; cache `horizons-companion-pico-v29`, entry queries `pico6`. Later documentation-only commits preserve this runtime.

## Updated reference index

Read [IMAGE-PRODUCTION.md](IMAGE-PRODUCTION.md), [APP-AUDIT.md](../APP-AUDIT.md), and the [general reference manifest](image-references/reference-pack.json). Each cast ImageGen call must actually attach [R01 brand](image-references/01-brand.png), [R02 cast](image-references/02-cast.png), [R07 style/objects](image-references/07-scenes-vocabulary-ui.png) and the exact current edit target. **Maximum seven image inputs total, including targets.** Run the preflight before every call and attach its returned paths. Mentioning filenames in a prompt does not attach them.

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

## What changed and why

| Trial/change | Result carried forward |
| --- | --- |
| Generated head, body and map/paws | Rejected initial proportion mismatches and map glow; tighter native targets produced a very similar reconstruction. Raw outputs retained. |
| Reconstructed the neutral pose first | Established common coordinates, pivots and joint overlaps. No abandoned articulated rig reused. |
| Added synchronized reading movement/blink | Corrected effect-level easing to a linear common clock with easing inside motion segments, so stated sample times match actual extrema. |
| Doubled motion and enlarged blink to 150% | Kept wider movement. The enlarged skin patch exposed clipping/overlap problems. |
| Added gaze and map inspection | Pupil movement, anticipation, stretch, overshoot and settling; raised-brow/no-smile face. Limited map width expansion to prevent paw clipping. |
| Tried masks and expression skin patches | Containment improved, but seams and covering old features remained problematic. Retired that expression approach. |
| Generated faceless head and separated features | Established current architecture; removed backing/exterior pixels and restored the tongue after incomplete extraction. |
| Changed inspection frequency | Four idle loops became one: 8 seconds idle plus 6 seconds inspection. |
| Removed every fade | Atomic hidden/show changes read the shared clock. Boundary checks caught overlap in an intermediate visibility-keyframe approach; it was replaced. |
| Checked lifecycle/publication | Native still for loading/reduced motion/failure; phase-preserving pause, cleanup and source-bound hosted proof. Initial independent review covers that trial only. |

## New animation from scratch

### 1. Establish the exact target and action

Read current decisions, source, native art and relevant motion clips. Record the authorized character/location, action, expressions, schedule, display sizes and static fallback. Extract an untouched baseline crop. Define invariants: silhouette, proportions, colors, clothing, face identity and held objects. Preserve unrelated work.

### 2. Plan layers before generating

Start with a faceless head and separate features. List only body, limbs, prop, hands, eye whites, pupils, brows, mouths, eyelids and special expressions needed for the action. Group parts that must stay attached: Pico's map and gripping paws stay together. Define canvas, anchors, pivots, overlap behind joints and layer order. Do not split every limb without a purpose.

### 3. Prepare references and preflight every image call

Inspect R01/R02/R07 and the exact current native target. If the general pack is stale, rebuild it with the reference-board tool and review affected sheets first. Save one brief per deliverable: component boundaries, invariants, framing, alpha requirements, prompt, reference IDs and targets. Run tools/check-image-brief.py from the app directory. Attach its exact returned input_paths to built-in ImageGen; explain input roles in the prompt. Count all images, never more than seven. Repair a rejected preflight before generating.

### 4. Generate parts and preserve provenance

Use built-in ImageGen for new anatomy/expression art. Generate separate deliverables; tighten native crops when geometry drifts. Request complete contours, solid interiors and transparent backgrounds. Explicitly remove eyes/brows/nose/mouth/tongue from the head. Expressions should contain features only on transparency, aligned to agreed anchors, with no peach skin panel. Save raw results unchanged in the repository. Record exact prompts, ordered input hashes, tool output paths, dimensions, alpha and acceptance/rejection reasons. Accepted native generated features can be mechanically separated/reused; do not redraw substitute anatomy in code.

### 5. Inspect and redo failed components

View native results and checkerboard composites. Reject wrong identity/proportions, missing contours, extra anatomy, holes in solid areas, halo/shading, opaque backings, unwanted exterior pixels or registration that cannot match the baseline. Redo the offending ImageGen part if the assembly cannot reconstruct the same or a very similar character. Do not hide failure behind another large skin patch. A successful tool response is not visual acceptance.

### 6. Prepare sprites and reconstruct the still pose

Keep native files untouched. Make versioned derivatives with a repeatable recipe: mechanical crop, alpha selection, masks, uniform registration and translation. Disclose sampled-color fills used during separation; derivatives are not untouched native bytes. Put features above the blank head in one coordinate space. Preserve complete ears/hair and joint overlap. Inspect blank head, isolated expressions and every composed face. Compare the full neutral assembly with the baseline side by side, with overlays/differences when useful. Identity and connected anatomy must pass before motion. Silhouette scores support review; they are not sole acceptance criteria or claims of pixel identity.

### 7. Build purposeful motion with transforms

Set pivots/fixed supports, then idle movement, then special action. Use translation/rotation/resizing, modest squash/stretch, anticipation, overshoot and settling where they serve the action. Keep feet grounded unless the action moves them; keep neck/collar connections and object grips intact. Review true extreme poses for clipping, detachment, unwanted floating or distorted identity before increasing movement.

### 8. Switch expressions at full opacity on one clock

No fades/crossfades/opacity interpolation. Hide outgoing features and show incoming features atomically. Hide eye whites/pupils during blink and show separate eyelids. A transform-based blink squeeze is allowed but must not reveal old eyes underneath. Masks contain pupils/facial features. Share a timebase across head, prop, gaze, blink and action. Pico uses three transform animations with a linear 14-second clock; one frame callback reads it and updates hidden attributes. Future implementations may differ while preserving these visual rules.

### 9. Integrate fallback, accessibility and cleanup

Opt in only the authorized character/location. Fit the rig uniformly to the real slot. Decode every sprite/mask before replacing the accepted still. Keep the still for missing module/assets and reduced motion. Pause the clock and face updater offscreen/in hidden tabs. Cancel animations/frame callbacks, disconnect observers/listeners and prevent late decodes from remounting after navigation. Preserve stable IDs and other static-character guards. Define resume behavior; Pico preserves phase.

### 10. Review composed motion and test behavior

Inspect neutral, actual extrema, blink, special face, return and loop seam, enlarged and at real app size. Review normal-speed playback of a complete current cycle. Test the actual route at 320/390/768/1440px: edge clearance, joints, grips, grounded body, face alignment and unwanted pixels. Probe before/at/after each expression switch and inside former fade windows. Reject fractional opacity or incompatible features visible together. Verify pupil containment, frequency, reduced motion, pause/resume, repeated navigation/disposal and missing assets/modules using fresh contexts. Use synthetic state, never real learner records. Name actual reviewers/scope; never imply human or independent approval that did not occur.

### 11. Publish and refresh the audit/reference set

Commit intended work, check remote branches, use the existing publication flow and invalidate relevant entry/service-worker caches. Verify live route, exact hosted module/art bytes and relevant browser behavior. Adapt cache-lifecycle tests to the real previous/new versions; old reports do not prove a later upgrade. Record revision, publication run, hashes, reports, browsers and remaining gaps. Refresh current reference boards, manifest and complete-cycle preview; label older material historical. No book/backend deployment as a side effect of animation work.

## Current evidence and remaining limits

[Hosted opaque proof](../reports/pico-opaque-hosted.json), bound to runtime 56551e9: four widths, mutually exclusive eye/expression states, no opacity tracks, all head descendants at computed opacity 1, one idle then inspection, masks, fixed body, reduced-motion still, load fallback, offscreen pause/resume, controlled hidden-document event and disposal. [Local proof](../reports/pico-opaque.json) and [proof script](../tools/pico-banner-motion-proof.mjs) record the contract. Samples cover both sides of 2352/2496/6032/6176/9100/12500ms.

[Publication parity](../reports/publication-assets.json) verified 397 committed runtime/native files, including 12 unchanged book recordings. [Pages run 42036348344](https://github.com/Chiispiitas/Brighton/actions/runs/42036348344) succeeded. Refreshed visual captures use the hosted renderer without learner API calls; they are visual documentation, not a new cross-browser interaction matrix.

Limits: Edge/Chromium automation; controlled hidden-document event fixture. No physical-phone or Safari/Firefox verification claimed. Initial independent review does not approve later revisions/poses. Current visual review is by the root agent; clips support the user's style/pacing review. Reconstruction is very similar, not pixel-identical; the faceless silhouette diagnostic was 0.97680 against the prior head. Earlier cache-upgrade evidence verifies v23→v24 only; no v28→v29 lifecycle test is claimed here.

## Carry-forward package

Carry this audit, image-production guide, reference manifests/boards, native baseline, selected raw parts, briefs/provenance, preparation recipes, renderer, proof scripts and source-bound reports. Rejected parts, skin-patch expressions, four-idle timing, fades and abandoned articulated rigs remain historical; they must not become new production instructions. Adapt motion to the newly requested action while preserving these process/quality rules.

## Overworld motion extension

The latest request separately authorizes saved-avatar hover/focus travel and decorative bird/butterfly flight. They use full-opacity transforms, native generated cutouts, reduced-motion static states and offscreen/hidden-tab pause/disposal. No new articulated avatar anatomy or other cast animation is authorized. Pico's rig and timing are unchanged. See [OVERWORLD.md](OVERWORLD.md), [new art provenance](overworld/production-record.json), src/overworld-motion.js and the source-bound overworld reports. Exact old reference inputs are archived before R07 was refreshed with the new scenery.

## Original bird hover rig production (motion values superseded above)

Native exact bird target plus preflighted R01/R02/R07 (four total actual image inputs) produced three separate native parts: body/head/tail/beak/eye without wings, near wing and far wing. The opaque magenta-backed native atlas remains unchanged; derived parts use documented color-key alpha and cell crop, without redrawing anatomy. Near wing registers left7%, bottom23%, width51%, pivot88%/86%; far wing left30%, bottom49%, width37%, pivot78%/90%. Body is full width aligned at bottom of the original bird aspect ratio. Reconstruction is very similar, not pixel-identical.

620ms transform-only wing cycle has brief 0.38/0.18 vertical scales, 1.12/1.20 horizontal stretch and ±skew for opaque smear-like downstrokes, then recovery. The composed bird hovers locally (3px sideways with gentle bob), rather than travelling across the map. Butterfly motion is also local. Every wing/hover animation joins the same pause/reduced-motion/disposal collection. All transitions remain opaque. See bird-hover/production-record.json for exact prompts, saved paths, actual inputs and native SHA; bird-hover/reconstruction.png for enlarged composed review.

Rotation-only/click-only runtime ae37cb9e10917c3614cf7051efb50d5f256fcdb7 is published. Hosted checks confirm hover, focus and pointer leave do not move the selected portrait; island click does; scrolling retains selection and hides/reveals it when offscreen. All wing keyframes are rotate-only, and reduced motion cancels the loops. Exact hosted bytes verified for all six changed runtime files. See reports/click-avatar-release.json. No new native art, curriculum or backend changes.

## Avatar correction: faceless head and separate expressions

The previous avatar-motion-v41 implementation violated this audit. It generated/swapped complete open/closed heads and bounced the colored background. The whole-head exception written into the prior audit was not authorized. Those assets, reports and the old preview in `docs/avatar-motion/` are historical, rejected as a production architecture. They do not approve the current correction. Pico and bird rigs remain unchanged.

The [production record](avatar-face-v2/production-record.json) contains two distinct built-in ImageGen calls: one twelve-head **blank** atlas, then an isolated native feature atlas. Both attached the exact five returned preflight paths: R01, a lossless full-resolution R03/R04 bundle, R05, R06, and the exact rounded-head target. All mandatory references are present; there are five physical inputs, below the seven total cap. [Archived inputs](avatar-face-v2/inputs/reference-pack-at-generation.json) preserve the source-bound pre-generation reference context. Native results stay unchanged in `assets/art/avatar-face-v2/blank-native.png` and `features-native.png`.

[Current avatar reference manifest](avatar-face-v2/reference-pack.json) inventories review artifacts and hashes. [All-costume board](avatar-face-v2/all-costumes.png) and [hair/glasses board](avatar-face-v2/hair-glasses.png) retain the current240-case visual check. [Reconstruction and parts](avatar-face-v2/reconstruction.png) show the accepted still, the actual blank head, the neutral assembled face, eyelids and gaze. [Normal-speed preview](avatar-face-v2/normal-speed-preview.mp4) uses200 controlled-clock actual-renderer frames at30fps: one complete5200ms cycle, customization feedback and settling. This is visual playback, not a performance benchmark. It supersedes the whole-head preview. The existing reference video remains sampled at native30fps across all598 frames; its dense contact sheets in `docs/avatar-motion/` remain valid timing references, rather than acceptable sprite architecture.

### Active avatar layers and preparation

`tools/prepare-avatar-face-v2.py` is the repeatable mechanical recipe. It keys the native magenta, crops the isolated shapes, intersects the blank head with the existing rounded alpha and retains only the original below-chin neck seam for costume compatibility. It explicitly registers the generated feature palette to the accepted charcoal/orange colors; these are derivatives, not untouched-native bytes. No anatomy is drawn in code, no old eyes remain below the features, and no skin patches conceal old expressions. The separate generated white eyes are registered to the accepted still’s measured eye bounds; pupil rest positions use the actual original dark-pixel centroids, including its subtle inward gaze. Measurements are in `rest-anchors.frames.json`. The pupils remain21 logical px (17% larger than the first separated rig). Reconstruction is very similar, not pixel identical.

| Active file(s), under assets/art/avatar-face-v2 | Role |
| --- | --- |
| blank-heads.png | One unchanged faceless head/ears/neck for every skin/base; no expression changes on this layer |
| eye-left.png, eye-right.png | Separate native white eyes; their alpha also masks pupils |
| pupil.png | Separate native pupil, instantiated twice |
| brow-left.png, brow-right.png, nose.png, mouth.png | Constant neutral feature sprites above the blank head |
| lid-left.png, lid-right.png | Separate generated eyelids; replace only eye whites/pupils at4200–4340ms |

The original head/costume/hair/accessory/badge metadata and eye anchors remain unchanged. The original open native head appears only in static contexts or loading/failure fallback; it is hidden once every new sprite decodes. A head-alpha mask contains the moving face, and separate white-eye alpha masks contain each pupil. Glasses and hair keep their accepted registration. Masks supplement actual separation; they never cover a baked expression.

### Motion and fixed background

The colored portrait container is outside both internal feedback and idle groups and receives no transform animation. Avatar artwork alone breathes from scale(.994,.98) to1 over5200ms, anchored at50%/80%; it never expands beyond its accepted crop. Feedback shrinks the artwork slightly while rising1% in the editor or2% on island activation, then settles. This keeps complete hair inside its circle. Face translation is at most1 logical px horizontally; pupils glance at±2.5px inside their eye masks. The same clock drives gaze and140ms eye-only blinks. All visible layers remain opacity1, with atomic hidden/show eye switching. Reduced motion resets gaze/open eyes and cancels loops; offscreen/hidden pauses preserve phase. The existing440ms lesson-entry jump and stale-entry cancellation remain.

### From scratch for the next avatar animation

1. Record the exact approved still, location, action, timing and fallback; inspect the actual reference video at sufficient frame density.
2. Plan a blank head plus only the separate features/action parts required. Keep wardrobe, hair, eyewear, neck anchors and saved IDs stable.
3. Save a distinct brief for the blank head and each feature deliverable. Preflight each call with the mandatory domain sheets plus actual target; attach the exact returned paths, maximum seven total. A verified lossless bundle may reduce physical input count without dropping a mandatory sheet.
4. Generate the blank head and features separately in built-in ImageGen. Preserve exact native outputs, prompts, ordered hashes, paths, reference roles and rejection reasons. Reject baked expressions/backing skin or a reconstruction that cannot preserve identity.
5. Mechanically prepare and register transparent parts with a repeatable recipe. Disclose color/alpha derivatives. Compare the assembled neutral against the baseline before any motion. Never use a complete expression-head swap or code-painted replacement anatomy.
6. Keep background outside all avatar motion groups. Contain the face within the head and pupils within eye whites. Add restrained transforms on one clock; eye-only blinks swap at full opacity.
7. Review the blank head, isolated parts, neutral, blink, gaze extrema, bounce extrema and a complete normal-speed cycle at actual sizes. Check all costumes/skin bases and eyewear/hair, plus reduced motion, offscreen/hidden pause, late loads, failure fallback and disposal.
8. Publish with a new cache version, read back the actual live code/art, refresh current boards and audit, and clearly retire superseded trials. Never call a passing old report proof of a new architecture.

### Current verification

`reports/avatar-face-proof.json`:320/390/768/1440px synthetic app checks keep the exact same blank-head source through blink/gaze, verify eye-only switching, actual pupil and face transform changes, face/eye masks, opacity1, zero opacity tracks, fixed background geometry/transform through idle and feedback, and missing-sprite native-still fallback. `reports/avatar-motion-proof.json`: editor/path-only scope, static sidebar/thumbnails, click-only targeting, feedback, live reduced-motion changes, hidden/offscreen pause, entry jump before activity, Escape/reselection cancellation and route cleanup. `reports/avatar-motion-costumes.json`:240 compositions across both bases, all six skins and ten costumes, including hair and glasses, with unchanged metadata. These are Edge/Chromium synthetic fixtures and root-agent visual review; no physical-phone, Safari/Firefox or independent human approval is claimed.

The current cache check (`reports/avatar-cache-proof.json`) installs the real v44 worker, verifies the blank/eye/registration files are cached, and removes a synthetic expired v43 cache. It does not claim a complete old-worker update simulation. Current preview capture/encoding recipes are `tools/avatar-face-preview.mjs` and `tools/encode-avatar-face-preview.py`.

Avatar v43 runtime `441704d3dc63764aca436746768bcb4851f53929` is published on both branches. [Pages run42090254698](https://github.com/Chiispiitas/Brighton/actions/runs/42090254698) succeeded. Hosted face/gaze/background/fallback tests at four widths, lifecycle/cancellation checks,240 costume compositions and the worker-installation cache check passed. Exact published-byte parity covers448 committed website files, including12 unchanged book recordings. See [source-bound avatar release](../reports/avatar-face-release.json). Later evidence-only commits preserve this runtime.

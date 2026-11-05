# Horizons animation production audit

Latest correction: bird wings flap using ROTATION ONLY (-35 to55 degrees); no wing squash, stretch or skew and no whole-bird scaling. Saved player portrait changes island only on explicit island activation (mouse/touch click or equivalent keyboard activation), never on hover/focus/leave or auto-retargeting while scrolling. Scrolling the selected island out of view hides the portrait until it returns; it does not select another island. Initial placement is allowed. Hover arrows and other accepted controls remain.

Latest interaction/art update: mouse hovering an arrow scrolls until leave, as well as press/hold. Reached ends hide arrows; a real adjacent implemented unit turns its boundary into an explicit Go to Unit button (never auto-activate on hover). Unit registry currently contains only Unit 1. Avatar previews stay on fully visible islands; building names removed. Lesson-specific isolated native object tiles are reused. Bird now has separate ImageGen body/near/far wings, transform-only flaps with squash/stretch smear moments and local hover motion; butterfly also hovers locally. Reduced motion, hidden/offscreen pause and disposal apply to every wing loop. Older fixed-eight-animation / release-while-hover assertions are superseded.

Updated 5 November 2026, America/Bogota. This is the current production workflow and reference index. The [historical audit](ANIMATION-AUDIT-HISTORY.md) preserves earlier trials, rejected attempts and source-bound releases. Historical settings are not current requirements.

## Current decisions and scope

The user's latest instruction wins. This workflow explains how to create a newly requested animation; it does not authorize animating the rest of the cast. Only Pico in the Unit 1 Learn banner currently uses this rig. Other characters and avatars remain static. Preserve the accepted website, artwork IDs, printed book and backend.

Use a genuinely faceless head with separate transparent facial-feature sprites. Never conceal old expressions with peach skin patches. Separate the features needed by the action: nose, brows, mouths, eye whites, pupils, eyelids and special expressions. Shared features can remain constant layers. Masks contain features within the head and moving pupils within the eye whites.

No fades, crossfades, opacity animation or transparency transitions. Visible sprites stay at opacity 1; incompatible expressions switch instantly. Transparent PNG backgrounds and native antialiased edges are still valid. Translation, rotation, resizing, controlled squash/stretch, anticipation, overshoot and bounce are allowed when anatomy stays connected and identity recognizable.

Pico's current cycle is one 8-second idle followed by a 6-second map check: 14 seconds total. The inspection expression has a raised eyebrow, downward squint, closed neutral mouth and no smile. Body and feet remain fixed. Closed eyelids display at 150% size. Reduced motion uses the original native still; offscreen/hidden-tab states pause the cycle. These are Pico's settings, not universal durations or amplitudes for future characters.

Verified runtime: `56551e90b35c9219295ce26b74a0084cad82eef6`; cache `horizons-companion-pico-v29`, entry queries `pico6`. Later documentation-only commits preserve this runtime.

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

## Bird hover rig production

Native exact bird target plus preflighted R01/R02/R07 (four total actual image inputs) produced three separate native parts: body/head/tail/beak/eye without wings, near wing and far wing. The opaque magenta-backed native atlas remains unchanged; derived parts use documented color-key alpha and cell crop, without redrawing anatomy. Near wing registers left7%, bottom23%, width51%, pivot88%/86%; far wing left30%, bottom49%, width37%, pivot78%/90%. Body is full width aligned at bottom of the original bird aspect ratio. Reconstruction is very similar, not pixel-identical.

620ms transform-only wing cycle has brief 0.38/0.18 vertical scales, 1.12/1.20 horizontal stretch and ±skew for opaque smear-like downstrokes, then recovery. The composed bird hovers locally (3px sideways with gentle bob), rather than travelling across the map. Butterfly motion is also local. Every wing/hover animation joins the same pause/reduced-motion/disposal collection. All transitions remain opaque. See bird-hover/production-record.json for exact prompts, saved paths, actual inputs and native SHA; bird-hover/reconstruction.png for enlarged composed review.

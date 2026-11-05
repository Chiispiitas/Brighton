# Horizons character animation audit

Status: current architecture is the v4 faceless base with transparent expression sprites. Read the final v4 section for current evidence; earlier sections retain historical, source-bound trial results.

## Authority and scope

The latest explicit request reopens animation only for Pico in the Unit 1 banner. Earlier static-character rules remain in force everywhere else. This document is separate from APP-AUDIT.md and IMAGE-PRODUCTION.md and records the new trial, generated inputs and acceptance evidence. It does not revive any old rig or authorize automatic rollout to other cast members or avatar previews.

## Immutable baseline and references

- Current atlas: assets/art/cast-static-pico-v2.png, 1254×1254.
- Current explore crop: x764, y19, width248, height582.
- Mechanical, unmodified crop: assets/art/pico-banner-motion-v1/baseline-native.png.
- User screenshot: codex-clipboard-d3c3cf77-a5e7-4836-8fcd-0520f1dd2370.png (map-holding Pico).
- User video: 20261105-0510-16.8044300.mp4, 7.667 seconds. Reading character looks down/across the page, blinks and makes small connected head/book movements; it does not need a walking or limb-swing cycle.
- Mandatory actual image inputs per cast call: R01, R02, R07 and exact current target. Total cap remains seven, including targets. Briefs and exact prompts live in docs/pico-banner-animation/.

## Production sequence

1. Read the current render, view the baseline and required sheets, save a component brief and run the image-reference preflight.
2. Generate each distinct component with the built-in ImageGen tool and actual returned input paths. Preserve selected native bytes, alpha, dimensions and hashes; record rejected attempts and reasons.
3. Register complete generated components in a canonical coordinate space. Uniform scale/translation, layering, clipping/masking and pivots are allowed. Do not draw substitute anatomy in code or use old articulated parts.
4. Reconstruct the neutral pose before introducing motion. Reject or regenerate components if the assembly changes Pico's face, head/ear silhouette, clothing, feet, proportions, map design or gripping hands beyond a very similar match to the baseline.
5. Animate only after neutral reconstruction passes separate visual review. Keep feet grounded, shoulder/neck joints covered, hands registered to the map, ears complete, and all moving regions within their frame. Avoid whole-character floating, detached parts, stretching or a new shadow.
6. Verify on the actual banner at 320, 390, 768 and 1440px; inspect neutral and extreme frames at enlarged and actual sizes, reduced motion, rerender/disposal, offscreen/tab pause, and hosted source/cache parity if released.

## Motion and release gates

Start with small purposeful reading motion, head/ear response and a generated blink if reconstruction permits it. No other character is animated. Reduced motion must show the approved still. Motion must pause offscreen and in a hidden tab. Retain the original static fallback until all required components decode and validation succeeds. The accepted asset must be reviewed in the composed app, not merely as a sheet. Record an independent reviewer when available; never invent independent approval. A successful generation is not approval. If the reconstruction fails, redo the offending generated component before extending motion.

## Trial log

### Generated parts and rejections

Full exact prompts, ordered attached inputs/hashes, native paths, native alpha/dimensions/SHA-256, selection status and integration locations are in [production-record.json](pico-banner-animation/production-record.json). Every call used built-in ImageGen, four actual image inputs, and a successful preflight. No abandoned rig parts or code-drawn anatomy are used.

| Component | Selected native file under assets/art/pico-banner-motion-v1 | Result |
| --- | --- | --- |
| Head, face, both ears and neck | head-v2.png | Tight native head crop produced a very similar registered head; v1 rejected for proportion/registration mismatch. |
| Shirt, satchel, standing legs/feet | body-v2.png | Uniform registration plus upper crop removes the extra generated chin. v1 rejected for long/narrow proportions. Body/feet stay fixed. |
| Map and both gripping paws | map-hands-v2.png | Kept as one rigid group to preserve grip. v1 rejected for a large teal/peach glow. |
| Closed eyes on matching skin | blink-native-v1.png | ImageGen-generated eyelid arcs, mechanically clipped to the eye region; no eyelids drawn in code. |

The four active render files are head-registered.png, body-registered.png, map-registered.png and blink-registered.png. Native generated files are untouched. The reproducible recipe is tools/prepare-pico-banner-parts.py; registration.json records logical positions, uniform scales and pivots. Alpha-connected selection masks remove exterior speckles. A soft eye-region selection blends the generated blink patch. These are mechanical masks explicitly requested by the user, not new painted anatomy.

### Reconstruction and visual review

- Native diagnostic: silhouette IoU 0.93193 and alpha-area ratio 0.99836 at 248×582. These are diagnostics, not a claim of pixel identity or sole acceptance criteria.
- Root viewed the actual native target, registered assembly, 50% overlay and difference image in reconstruction-comparison.png.
- Independent reviewer: Codex subagent `/root/animation_review` passed the rest reconstruction as **very similar**. Recorded variation: slightly broader muzzle/head contour, small paw/map placement and map-graphic differences, and small satchel hem/upper-leg-gap differences.
- The same independent reviewer passed the actual-browser six-state extrema sheet and mobile banner: joined neck/collar, rigid paw grips, grounded feet, full ears, clean blink patch and matching rest/loop-end frames.
- Root inspected responsive banner images, enlarged extrema, and time-sampled frames from the real-time recorded clip. The normal-speed eight-second clip is delivered for review; no human subjective timing approval is claimed. A future motion revision requires fresh sampled/real-time evidence.

### Motion contract

The canonical assembly is 248×582. Head pivot is (120,267); map+hands pivot is (126,327). The body/feet do not move. Head rotates from 0 to +1.4°, back to 0, to −0.6°, then rest. Map rotates no more than −0.45°/+0.3°, with at most 0.8 logical pixels vertical motion. Two brief generated blinks occur per eight-second cycle. All tracks share an eight-second linear effect clock and explicit start time. Head/map ease within keyframe segments, so their declared offsets are also their true sampled wall-clock extrema. An initial effect-level easing implementation was corrected after independent review identified misleading sample labels. There is no torso stretch, idle whole-character bob, shadow, walk cycle or detached limb motion.

Only the explicit `.unit1-banner-pico[data-posture=explore]` marker in the Learn hero mounts this renderer. The original explore atlas remains the static fallback. Generic character and avatar animation guards remain. Reduced motion cancels tracks and displays the native still; hidden/offscreen states pause them. Disposal cancels tracks, disconnects observers/listeners and prevents late image-decoding mounts. Missing module or part assets retain the original still.

### Local verification

`tools/pico-banner-motion-proof.mjs`: 320/390/768/1440px banner fit, only the approved rig animates, body remains fixed, rest/extreme/blink/loop samples, reduced-motion still, real offscreen pause/resume, controlled hidden-document event, repeated route disposal and missing asset/module fallback. `tests/pico-banner-cache-upgrade.mjs`: actual v23 to v24 lifecycle and exact loaded/cached bytes. Reports live in reports/pico-banner-*.json. The generic interface proof distinguishes this new explicit exception from unauthorised character motion.

Browser scope is Edge/Chromium. The hidden-document event check is a controlled fixture, not a claim of testing every operating-system background state. No backend deployment or learner writes are involved.


### Exact alpha-mask recipe

Derived masks use alpha > 180 to seed the selection, MinFilter(3) then MaxFilter(3), flood fill the central connected component, MaxFilter(3), and min(original alpha, selection). The native generated alpha/RGB files remain untouched; derived edge alpha is intentionally masked and is not claimed identical to the native alpha. The body is clipped above logical y253. The generated blink uses a rounded-rectangle selection (85,154,139,189), radius3, GaussianBlur0.65, multiplied with the patch alpha. All three main components are uniformly scaled, never stretched.

### Review artifacts

[Neutral comparison](../assets/art/pico-banner-motion-v1/reconstruction-comparison.png), [true extrema](pico-banner-animation/review/motion-extrema-linear-clock.png), [mobile banner](pico-banner-animation/review/banner-390.png), [normal-speed preview](pico-banner-animation/review/pico-reading-v1.mp4), and [independent review](pico-banner-animation/review/independent-review.json) are preserved. The final proof asserts the computed +1.4°/−0.6° angles at their declared times. Missing-image and missing-module tests use fresh browser contexts so decoded caches cannot bypass the failure fixture.

### Hosted release evidence

Runtime a1fbc38c44b2a5b39783be1c9b2eacc658af0df0 is published at [Horizons](https://exams.bebrighton.net/Horizons/App/). [GitHub Pages run 41975897079](https://github.com/Chiispiitas/Brighton/actions/runs/41975897079) completed successfully. The hosted proof passed at 320, 390, 768 and 1440px, including the scoped animation, fixed body, reduced-motion still, missing-part/module fallback, offscreen pause/resume, controlled hidden-document event and route disposal. Root viewed the actual hosted mobile banner and +1.4° extreme; preserved copies are [hosted banner](pico-banner-animation/review/hosted-banner-390.png) and [hosted extreme](pico-banner-animation/review/hosted-frame-1920.png).

The real v23→v24 service-worker upgrade passed with exact committed module/part bytes in Cache Storage. Publication parity passed for all 382 committed runtime/native files, including 12 existing book recordings. Reports: [release](../reports/pico-banner-release.json), [hosted motion](../reports/pico-banner-motion-proof-hosted.json), [hosted cache upgrade](../reports/pico-banner-cache-upgrade-hosted.json), and [publication parity](../reports/publication-assets.json). These checks use synthetic intercepted app state and make no learner/backend writes. Browser and visual-review limitations above still apply. Later evidence-only commits do not alter this verified runtime.

## Requested amplitude revision

Movement doubled: head +2.8°/−1.2°; map −0.9°/+0.6°, vertical travel 1.6/0.8 logical pixels. Closed-eye sprite uniformly scaled 1.5 around (112,172), its eye-region center; the upper skin margin is clipped at logical y164 to preserve the original eyebrows. Native generated assets unchanged. Cache v25, entry queries pico2. Earlier approval/evidence above describes v1; this revision has fresh automated and sampled checks.

## Map inspection, pupil motion and face containment (v3)

The latest request adds a real head-alpha mask around the enlarged blink (scale 1.5, clipped above logical y162); the mask is on its parent, so it does not expand with the sprite. Native pupils are separated into a moving layer, clipped by their original eye whites. Small 1–2px glances scan the map. All six images and both masks must decode before replacing the native fallback.

Four complete 8-second idle loops precede a 6-second closer inspection: 38 seconds total, one shared clock. The map anticipates down 4px, lifts approximately 49px, then settles at 45px. Its width compresses to .96 while its height expands to 1.03, keeping both paws within the banner. The head anticipates up 3px, dips 9px/7 degrees, then settles at 7px/6 degrees. It briefly stretches/squashes by up to 2.5%, returning to the unchanged rest pose. Body and feet remain fixed. Offscreen/hidden pauses preserve the cycle counter; reduced motion shows the original still.

New expression: raised eyebrow, downward squint, closed neutral mouth, no smile. ImageGen attempt 1 was rejected for holes/halo. Attempt 2 supplies feature shapes; native sampled skin matching avoids a rectangular seam. [Production record](pico-banner-animation/check-production-record.json) preserves exact prompts, four actual attached inputs, hashes and selection reasons. [Recipe](../tools/prepare-pico-check.py) reproduces native pupil separation and expression registration. Earlier v1 independent approval does not extend to this larger motion; root reviewed its own current sampled frames.

Local proof covers four widths, exact idle extrema, expression absent at 32 seconds/present at 35, 38-second shared timelines, mask bindings, fallback, pause/resume and disposal. Sampled blink/inspection/rest frames are preserved in pico-banner-animation/review/check-v3-*.png. Edge/Chromium only; no real learner data or backend changes. Cache v26; entry queries pico3.

V3 published runtime ccc0c2e6150282aede06c180b8ecde0e0dc12d43. Pages run [42026925581](https://github.com/Chiispiitas/Brighton/actions/runs/42026925581) succeeded. Hosted four-width motion/mask/timing/fallback/disposal checks passed; root viewed the hosted inspection frame. See reports/pico-check-v3-hosted.json and the [normal-speed inspection preview](pico-banner-animation/review/pico-check-v3.mp4). Publication parity report is source-bound separately. No backend writes.

## Faceless base and transparent expressions (v4, current)

The user's latest correction replaces the v3 skin-patch approach. The head is now a genuinely faceless ImageGen base: no eyes, brows, nose, mouth or tongue are baked into it. Every facial feature is a separate transparent sprite. Shared nose, neutral brows/mouth, open eye whites and moving pupils, closed eyelids, and the raised-brow squint/closed mouth are layered over the blank base. Expression sprites contain feature shapes only; they carry no peach skin rectangles. All share the canonical head coordinate space and head transform.

The neutral face fades out as inspection features fade in. During blinking the open eye whites/pupils fade out as the separate closed eyelids appear at 150% size. This removes the need to conceal old expressions with opaque skin. A head-alpha mask remains as a containment guard, and pupils remain clipped to their native eye whites. Movement amplitude, 38-second/four-idle-loop schedule and pause/reduced-motion/static fallback remain unchanged. Cache v27, entry queries pico4.

The [production record](pico-banner-animation/faceless-production-record.json) contains exact ImageGen prompt, four actual attached preflight-approved references/target, raw output path/hash, active sprite hashes and the repeatable [separation recipe](../tools/prepare-pico-face-sprites.py). [Layer board](pico-banner-animation/review/faceless-v4-layers.png). Native originals and superseded v3 recipes remain historical; the runtime no longer uses head-look-base, blink-registered or check-face-registered.

QA checks the blank base, neutral reconstruction, blink and inspection, four screen widths, mutually exclusive eye/expression states, pupil mask, exact idle angles, 38-second shared timelines, loading fallback, route disposal and offscreen/reduced-motion behavior. Root visual review only for this version; prior independent approval applies to v1. Edge/Chromium only; synthetic state; no learner/backend writes.

V4 runtime e5999ddc50b913973713ece2d0447843f48c4628 is live. Hosted four-width proof passed (reports/pico-faceless-v4-hosted.json); root viewed hosted blink and inspection frames. All 397 committed runtime/native files matched the live site, including 12 unchanged book recordings. Pages run [42033619755](https://github.com/Chiispiitas/Brighton/actions/runs/42033619755): completed, success at this evidence capture. The faceless silhouette IoU is 0.97680 against the prior head, a diagnostic rather than a pixel-identity claim. [Normal-speed preview](pico-banner-animation/review/pico-faceless-v4.mp4). Later evidence-only commits preserve the checked runtime.

## Inspection frequency correction (current)

The latest request changes the schedule to one 8-second idle followed by the unchanged 6-second map inspection: 14 seconds total. Expression sprites, motion amplitudes and pause/reduced-motion behavior are unchanged. Cache v28, entry queries pico5.

## Opaque animation rule (current)

No fades or opacity interpolation in Pico animation. Expressions and eye states switch instantly through discrete sprite visibility at full opacity. A single frame callback reads the shared motion clock and switches hidden attributes atomically. Open eyes explicitly hide during both blink and inspection. The callback stops offscreen, in hidden tabs and under reduced motion, and is cancelled on disposal. Neutral and inspection features switch together. All motion uses transforms; native transparent backgrounds and antialiased sprite edges remain. Existing 8-second idle plus 6-second inspection schedule is unchanged. Cache v29, queries pico6. QA probes both sides of every swap and former fade windows to reject fractional opacity, opacity tracks and overlapping facial states.

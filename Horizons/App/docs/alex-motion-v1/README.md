# Alex animation production — accepted v3 poses

Alex is the next explicitly authorized cast member after Mina. Four distinct accepted poses come from `assets/art/cast-static-alex-v3.png`: `listen`, `fix`, `dance` and `sit`. The saved `drive` posture is an alias of `sit`; that ID remains valid. Earlier articulated Alex assets are historical and are not positive references.

## Native sources and reconstruction

[Production record](production-record.json) preserves every exact brief, successful preflight, actual attached input path/hash, native output path/hash and rejection reason. Built-in ImageGen was used, with a separate call for each component. Every call attached actual R01/R02/R07 and exact pose/head/arm targets, four or five images total; none exceeded seven. Generation-time reference bytes are frozen under `inputs/`. Raw outputs remain unchanged under `assets/art/alex-motion-v1/native/`.

There were 22 native calls: the 15 initial component briefs and seven repairs. Eight outputs were rejected: the first listening body omitted the stationary arm; the first dance body retained the wrong arm; pupil/eyelid calls returned full figures; the first three standing gestures changed arm proportions/angles; the first driving group had an oversized wheel and rounded arm cap. The user's annotated comparison explicitly rejected the narrow zigzag arms. Their replacements attach lossless enlarged crops of each exact original arm as well as its complete pose. They must match sleeve thickness, elbow bend, hand/wrench size, orientation and shoulder placement, rather than being narrowed to clear the badge.

The [preparation recipe](../../tools/prepare-alex-motion.py) discloses alpha selection, cropping, uniform registration and palette registration. It draws no anatomy or expression glyphs. Bodies and complete arm/held-object groups are independent native generations. Standing sleeve overlaps sit behind the torso; the seated wheel, both grips and front forearm stay together in front; the native rear-forearm component is selected from the same generated group and remains behind the torso, keeping the shirt and badge clear. The chair and console stay fixed. Native accepted headphone pixels replace drifted generated earcups on the stationary body; the exact selection and neck support overlap are recorded in the preparation metadata. This corrects a white crescent found during real head-tilt review without drawing substitute anatomy or adding facial patches.

The permanent faceless derivative retains the exact original exterior head geometry and hair, using a uniformly palette-registered generated skin field across the connected face/ears/neck. Original neutral brows, mouth and pupil shapes remain at their accepted anchors; generated white-eye material uses original eye contours. Where a brow meets the hairline, the generated blank head supplies the hidden smooth boundary. Exact source selections, masks, material transforms and limits are recorded in [head-fidelity.json](head-fidelity.json). This is a disclosed derivative, not a pixel-identical whole-head claim. No added nose, expression-head swaps or runtime skin patches.

Initial mechanical face rectangles and eye-edge artifacts were rejected during review. Neutral, blank, blink and accent views must remain clean under close inspection. [Reconstruction](reconstruction.png), [upper-body/arm comparison](upper-body-comparison.png) and [head comparison](head-fidelity.png) are the current review boards; numeric alpha/anchor tests do not establish visual likeness by themselves.

## Motion contract

Every pose runs one 8-second idle followed by a 3-second accent, repeating every 11 seconds. Idle uses small head/eye/face glances and sprite blinking. Standing bodies breathe subtly; the seated support does not. Listening adds a palm gesture and nod; the wrench pose tips the tool; dancing adds a small bounce/arm accent; driving adds a slight steering movement and head glance.

In exercises, correct answers trigger one 1100ms happy jump/joy expression for standing poses. The seated pose uses a happy head lift while keeping its support fixed. Wrong answers trigger one 1300ms confused head bob with a separate raised-brow expression. Feedback pauses the idle clock and then resumes its prior phase. Answer nonces prevent replay on redraw; no answer text is retained by the animation module.

All sprites remain at opacity 1. Blinks and expressions switch discretely; no fades or crossfades. Head alpha contains all facial layers, and eye alpha contains pupils. Existing fixed exercise slots remain 110×160px desktop and 90×128px mobile. The rig fits inside them with motion clearance, without resizing when feedback changes.

Original accepted stills remain the exact reduced-motion/failure fallback. Required parts decode before the animated rig replaces the still. Hidden/offscreen clocks pause, and disposal cancels animations, observers, listeners and pending frame callbacks, including late-decode guards.

## Verification and active references

[Head fidelity report](../../reports/alex-head-fidelity.json), [runtime report](../../reports/alex-motion.json), [cache report](../../reports/alex-motion-cache.json) and [active reference manifest](reference-manifest.json) bind the checks to current sources. QA uses synthetic in-memory sessions, not real learners or backend writes. The root and separate agents inspect actual compositions and normal-speed/extreme captures. Physical-device, Safari/Firefox and independent human acceptance remain unverified.

Large screenshots/videos remain local at `C:/Users/David/Documents/Codex/2026-11-06/alex-motion/`; they are not added to the public website. Module/style query: `alex1`; rig query: `v=1`; worker: `horizons-companion-alex-motion-v91`. Mina, Pico, avatar motion, grading, sounds, navigation, printed book and backend behavior remain unchanged.

For a new cast member: pin the current accepted atlas/poses; extract exact targets; plan one permanent faceless head and separate moving parts/expressions; preflight and attach each required reference and target; generate each component separately; preserve raw results and reject drift; reconstruct before motion; match joints and accepted proportions, using precise regional targets for repairs; add an explicit idle/accent and one-shot feedback clock; inspect rest, extrema and normal speed at actual UI sizes; verify masks, pause/disposal, exact static fallback, phase/replay and cache; update prompts, hashes, boards, reports and limitations in the audit.

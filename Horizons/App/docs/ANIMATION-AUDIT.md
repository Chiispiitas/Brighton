# Horizons animation production audit

Reference-proportion correction (6 November 2026): match accepted Pico exposed-arm greet/jump poses at identical cheek/head size before approving registration. The accepted cheek width is 141 source pixels versus 121 active pixels (scale 121/141); clean exposed shafts support 31 px upper arms and 30–31 px forearms, with actual gripping palm 40 px. The current targets are 31 / 30.5 / 40 px. Measure opaque cross-sections and actual palm material, not curved texture bounding boxes, map-hidden arms or adjectives such as chunky. A folded-arm 52.4 px sample is excluded because it merges adjacent skin. Both earlier thin 20–26 px and overwide 48/42 px registrations are user-rejected historical QA evidence. The latest complete native components are reused at corrected proportions; no new anatomy is drawn or truncated. Controlled whole-component independent-axis registration is disclosed, keeps cap-centre bone lengths about 61/52 px and preserves every concealed end. Final appearance requires actual white neutral/recoil/reach review against the exposed-arm reference; numeric widths do not establish user acceptance.


Latest user layering correction (6 November 2026): put the viewer-right arm behind the torso and shift its shoulder attachment slightly to the right; keep the measured arm/palm proportions. The viewer-left arm remains in front. The complete right upper/forearm/paw/held-object chain is behind the shirt; its shoulder root is tucked beneath the garment after the user flagged excess shoulder protrusion; the final reviewed coordinate is [278,312], six pixels right of the original [272,312], rather than the excessive [286,312] test. The paw lies beyond the garment at the unchanged grip [323,382], while the left chain remains foreground. Check actual neutral/recoil/reach poses for natural occlusion and full-shaft grips. This supersedes the earlier blanket both-upper-arms-front rule, which had corrected a different waist-emergence defect; do not revert both sides behind the garment. Solve each arm through the palm grip using the effective forearm-plus-paw length. Hand orientation follows the forearm so there is no wrist kink; the held skewer rotates independently at the native palm grip, and the second hand targets the same shaft. Register pivots inside the actual opaque cap regions rather than generic quarter-height guesses. The final forward rest grips and elbow bends are stored in the current manifest; old elbow/wrist planning points are explicitly labelled construction-only.


Permanent skin palette calibration: independently generated native pieces drifted from Pico's accepted head skin, especially the neck. The immutable accepted-head opaque-skin median is RGB 243/190/158. Nine torso/limb/paw/leg textures retain their original bytes and alpha; per-image SVG filters apply fixed sRGB offsets for every pose. The torso uses a mask derived from its own native green values so pure navy/magenta garment colors remain exactly unchanged. This is permanent color calibration, not a drawn skin cover, expression patch or anatomy replacement. The actual SVG filter pixel test in reports/streak-v2-palette.json checks all nine filtered medians against the accepted target, garment RGB identity and alpha preservation. Metadata alone is insufficient evidence. Complete-parts construction boards deliberately show source textures before runtime color calibration; judge final appearance in the actual SVG captures and normal-speed review. The final filter uses a Porter–Duff atop SourceGraphic guard so rotated filter surfaces cannot create colored rectangle fringes. The actual final pixel proof reports exact target medians for all nine parts, zero alpha differences, and zero RGB differences across 14,086 pure garment pixels; actual white rest/recoil/folded/return screenshots separately confirm the rotated edges are clean.


Latest user anatomy correction: joint overlap must not be illustrated as inflated shoulder/elbow balls. Generate smooth tapered limb segments whose rounded concealed ends continue the shaft width. Torso art must not contain peach side/socket plates that cover separate arms. Its continuous navy lower hem must physically cover the upper-thigh centre cleft in neutral and recoil poses; changing a texture without preserving the neck/hip registration is insufficient. The nine superseded v2 source parts remain unchanged in the archive, alongside the rejected proportion-registration evidence. Current repaired raw parts and the actual neutral renderer were reviewed again before a new freeze.


## Pico streak v2 rebuild — current user instruction, 6 November 2026

The user rejected v1, including both combined upper-body keyposes and the later whole-picture mesh. Its earlier agent approvals are historical and do not carry forward as user acceptance. New animations must be designed for the requested movement before art production: generate complete independent parts, including concealed joint/garment surfaces; use separate upper arms, forearms, paws, torso, skewer and marshmallow; connect them through an actual articulated hierarchy with stable shoulder, elbow, wrist and grip anchors. Do not substitute clipped visible fragments, combined torso/hand/prop poses, skin covers or whole-bitmap deformation.

The new rig has 26 native ImageGen outputs across 28 attempts, including two recorded no-output moderation failures and nine user-rejected/superseded earlier components, with actual mandatory references, successful preflights and unchanged source bytes. Complete rounded hidden caps, full legs, independent seat/satchel and four new explosive fire frames are exposed in docs/streak-campfire-v2/complete-parts-board.png. Construction extremes and the actual SVG renderer govern joint review. The permanent accepted faceless Pico head and separate facial layers remain exact inherited sources. Native edge-matte decontamination removes cyan fringes using existing opaque native interior colors; it does not draw anatomy. Full native textures remain under adjacent joints, with explicit overlap and source pivots.

The 7.6-second sequence uses anticipation, a strong upward fire burst, recoil/follow-through, a large overshooting streak reveal and a filling weekly progress rail. Continue is hidden and inert until the sequence finishes. Reduced motion or missing required art shows the settled state and Continue immediately. No opacity fades are authorized. Exact runtime SVG exports supply startup/reduced stills; construction pictures alone are not animation acceptance.

Current production and from-scratch steps: [docs/streak-campfire-v2/README.md](streak-campfire-v2/README.md), production-record.json, registration-spec.json and reference-manifest.json in that directory. Actual reports are reports/streak-v2-reference.json, streak-v2-flow.json, streak-v2-motion.json, streak-v2-stills.json and streak-v2-cache.json. Report scopes and remaining verification limits must be preserved; no real learner records are used for QA. Final shoulder278 source-bound motion/cache/flow/palette/stills/preview evidence passes; the actual visual review is reports/streak-v2-visual-review.json. The 26 native outputs remain unchanged, 17 are active and 9 superseded; see production-check.json for verified current hashes.


Historical v1 shoulder/motion repair — USER REJECTED and superseded (6 November 2026): the user rejected the original low arm attachments. Two new native ImageGen upper-body repairs raise the peach shoulders to the shirt shoulder line; prior originals remain archived. Exact briefs, mandatory attached references, preflights and native return paths are in upper-roast-shoulders/upper-lift-shoulders records under docs/streak-campfire-v1. There are now 16 native outputs. The permanent head/features and fixed seat/lower body remain unchanged.

Runtime now separates the existing generated skin/skewer pixels from the fixed shirt texture and applies a small textured mesh deformation. No anatomy or facial marks are drawn in code. Both shoulder roots remain pinned; paws and the held skewer share interpolated grip/tip anchors. An eased 1.45-second lift and 1.55-second return move the current pose before switching at matched halfway positions. All transitions remain opaque. Fire grows from embers over 1.75 seconds; its four native frames share a continuous height/base anchor, sway and width variations, avoiding the former abrupt small-to-full size jump. The 5.6-second sequence still settles and respects reduced motion, hidden/offscreen pause and failure fallback.

Actual browser tests in reports/streak-motion.json include both switch boundaries (1974/1976ms and 4324/4326ms), with marshmallow centroid displacement under 3 logical pixels, six viewport sizes, masks, save/retry and lifecycle checks. Four helper tests and exact-byte/offline checks in reports/streak-cache.json pass. Ten normal-speed frames and desktop renders were inspected, including both transitions. Current cache is horizons-companion-daily-streak-v102; app/scene/style query streak2. No backend or lesson content changes. Pages deployment is not awaited.


## Historical v1 Pico daily streak campfire — USER REJECTED, 6 November 2026

The first saved lesson completion of the day opens a finite streak celebration before results. A seated Pico roasts one marshmallow in a compact freestanding hearth, the fire catches, he raises the skewer with a delighted separate expression, and the scene settles. The streak count, weekday calendar and early/late timing note are ordinary accessible interface content beside the illustration, not generated text. Continue is immediately available. This is a dedicated celebration scene; the accepted Learn path and other character schedules stay intact.

Production uses a hybrid of two separately authored clothed upper-body/paws/skewer keyposes and local part motion. The exact already-approved permanent faceless Pico head and its separate neutral/eye/pupil/nose/blink source layers are copied unchanged, then registered together by one affine transform. New excited eyebrows/closed eyes/mouth are a separate native glyph plate; no complete expression head, skin patch or code-drawn face is used. The lower-body/stump source selection and foreground satchel remain fixed. The complete grips stay together in each clothed keypose. Four separately generated native fire frames swap at opacity 1 inside a fixed mask selected from the existing navy firebox, excluding the original crossed logs. The fixed lower body, seat, satchel and hearth do not breathe. The clothed upper-body keypose receives negligible local motion around the waist, while the head/face move independently. No fade, crossfade or transparent transition is allowed.

There are 14 unchanged native outputs and three rejected native glow/scatter outputs among them. Seventeen generation attempts include three benign cartoon-forelimb requests that failed ImageGen output moderation400 without producing an image; an additional six-input attempt failed tool validation before generation because the current tool allowed five paths. These are identified image-generation operations, not unexplained app/save/backend errors. Exact prompts, actual mandatory R01/R02/R07 and current target paths, successful preflights, raw return paths/hashes, all failure IDs/reasons and frozen reference bytes are in the [production record](streak-campfire-v1/production-record.json). The final natural clothed upper-body keyframes preserve the original navy shirt/magenta strap while avoiding detached shoulder groups. Clean opaque-magenta intermediates are mechanically keyed and uniformly registered; the derivatives are disclosed and do not claim untouched native pixels.

Root and the art-preparation agent approved the [two-state reconstruction](streak-campfire-v1/reconstruction.png): Pico's original identity/anchors, closed neck/shoulder joins, single marshmallow/grips, physical roast-to-fire alignment, raised pose, waist overlap, fixed support and native-log occlusion. The active PNG/manifest bytes were then frozen before runtime proof. The startup still is visible while sprites decode; reduced motion or any required-part failure shows the static settled roast/full-fire composition. The [actual-app motion proof](../reports/streak-motion.json) passes in headless Edge with a synthetic in-memory store: saved/failed/lost-response-retry/repeated-round flows, deferred seen-state, finite phases, full opacity, explicit masks, fit, reduced/failure stills, late decode, pause and disposal. Root separately inspected ten normal-speed review frames and desktop/mobile screen captures. The normal-speed video remains local at `C:/Users/David/Documents/Codex/2026-11-06/streak-motion/normal-speed-review.webm`. The [cache proof](../reports/streak-cache.json) passes exact bytes, old-v100 cache cleanup, offline reload and native rig readiness under `horizons-companion-daily-streak-v101`; this tests an already-saved celebration display and does not claim offline saving. This agent review does not imply human acceptance, physical-device or Safari/Firefox coverage.

Current references: [process and from-scratch steps](streak-campfire-v1/README.md), [active source manifest](streak-campfire-v1/reference-manifest.json), [registration specification](streak-campfire-v1/registration-spec.json), [source/derivative checks](streak-campfire-v1/production-check.json), `assets/art/streak-campfire-v1/rigs.json`, `src/streak-celebration.js` and `styles/streak-celebration.css`. The 21 active PNGs, including startup/fallback stills, total 725,777 bytes (708.8KiB), plus a 2,033-byte manifest. About 13.1MiB of raw natives are provenance sources and are not precached. To create another hybrid scene: pin identity and blank-head/feature sources; author coherent interaction keyposes separately; actually attach preflight references to each call; reject alpha/geometry defects; reconstruct all interaction states and true extremes before a part clock; freeze artwork; verify motion, reduced/failure stills, lifecycle/fit and exact cache; update this audit and current source hashes. A still image or numeric score alone is not animation acceptance.

## Jo production — 6 November 2026

Jo is authorized in all four accepted v3 poses (`offer`, `read`, `pour`, `clap`). A permanent faceless head and separate facial sprites reconstruct her accepted gray hair, navy glasses, orange nose and neutral anchors. One 8-second subtle idle leads into a 3-second pose accent: offer the mug, inspect the book, polish the mug with its cream cloth (`pour` retains its stable ID), or pulse clasped hands with a small celebration hop. Both hands and held objects stay grouped. Correct answers trigger a finite 1100ms happy jump/joy expression; wrong answers trigger a 1300ms confused head bob/raised eyebrow. Reactions pause and resume the shared clock and do not replay on answer redraw. Saved results start at the accent immediately. Full-opacity sprite switches, masks, reduced-motion/failure original stills, offscreen/hidden pause and disposal follow Mina/Alex. Exercise sizes remain 240/200/160px according to viewport.

There are 24 native ImageGen calls and nine rejected outputs, all preserved with exact prompts, successful preflights, actual attached R01/R02/R07 and current target paths (maximum five inputs used), native output paths/hashes and rejection reasons. Opaque magenta-backed repairs replace glowing transparent body/eye/pupil outputs; whole-figure expression failures and a hand-bearing body repair remain rejected. Original accepted head exterior and neutral feature anchors are retained; generated permanent faceless material, separate glyphs and registered native bodies/forearm-prop groups are disclosed mechanical derivatives. No complete expression-head swaps, runtime skin patches, code-drawn anatomy or fades.

Reconstruction review rejected shrunken bodies from incomplete background keying, neck seams, shoulder-cap protrusions, face holes and discarded glasses antialias pixels. Keying now isolates the true native silhouette before uniform placement; body height is registered against actual original shoulder/foot bounds. Permanent blank-face alpha fills former eye/mouth openings, and exact native glasses/nose remain above every expression. Numeric checks support the direct still/animation review; they do not establish pixel identity or human acceptance.

Production: [process and reconstruction](jo-motion-v1/README.md), [all calls and rejections](jo-motion-v1/production-record.json), [active reference manifest](jo-motion-v1/reference-manifest.json), [neutral reconstruction](jo-motion-v1/reconstruction.png), [blank/neutral head comparison](jo-motion-v1/head-fidelity.png). Runtime: `src/jo-motion.js`, `styles/jo-motion.css`, `assets/art/jo-motion-v1/rigs.json`. New members must repeat the existing from-scratch workflow below: pin the exact accepted poses, plan parts, preflight and actually attach references per call, generate a truly blank head first and separate features/moving groups, reject and redo failed outputs, reconstruct before animation, then review every extreme and verify lifecycle/fallback/cache in the actual app.


Validation: [runtime/browser report](../reports/jo-motion.json), [exact offline cache upgrade](../reports/jo-motion-cache.json) and [native call/reference verification](../reports/jo-production.json) pass. QA ran actual synthetic Jo lesson answers and saved results, all four full-cycle clocks and reaction extremes, masks/full opacity, 240/200/160px slots, phase/replay, hidden/offscreen pause, reduced-motion cancellation, disposal, late decode and missing-part fallback. Codex root, jo_qa and jo_runtime independently inspected still/extreme compositions; no human acceptance is implied. A Jo-only reduced-motion event-delivery race found during testing now applies the exact still from the frame callback if the preference changes before its event arrives. Forty-seven current cache assets verify offline from v96 to v97. Normal-speed 11-second preview is kept outside the repository at `C:/Users/David/Documents/Codex/2026-11-06/jo-motion/normal-speed-review.webm`. Physical devices, Safari/Firefox and live Pages propagation are unverified; Pages is not awaited.

Jo glasses correction before publication: the user spotted eyes showing through the rims. Material-unmixing had left some strong navy frame pixels partly transparent. The exact original navy core is now alpha255; whites, pupils, blink strokes and only the eye portions of focus/joy have no pixels beneath the native rim. Original open-topped U-shaped contours and accepted white-eye extent remain, with no invented top bar. The glasses/nose stay above all features and follow the same gaze transform. [Glasses states](jo-motion-v1/glasses-states-review.png) and [all-pose containment report](../reports/jo-glasses-containment.json) record neutral, glance, blink, focus and joy. Final runtime/cache evidence is rerun against these corrected bytes.

## Alex production — 6 November 2026

Alex is authorized in all four accepted v3 poses (`listen`, `fix`, `dance`, `sit`), with `drive` retained as the existing seated alias. One 8-second idle leads into a 3-second pose-specific accent. Correct exercise answers trigger a happy jump/joy face for standing poses; incorrect answers trigger a confused head bob/raised eyebrow. Seated feedback keeps the chair/console fixed and uses a happy head lift. All reactions are finite, suspend/resume the idle phase and do not replay on answer redraw. Existing fixed cast slots, exact reduced-motion/failure stills, full-opacity sprite switches, head/pupil masks, hidden/offscreen pause and disposal remain.

Production uses separately generated bodies/gestures, one permanent faceless-head derivative and separate facial sprites. Original head exterior geometry/neutral anchors are retained. The user explicitly flagged narrowed zigzag arms in the initial reconstruction; those native gestures are rejected. Repair calls attach the exact enlarged original arm crops, preserving sleeve thickness, original bends and hand/wrench placement. Standing sleeves overlap behind the torso so the badge remains clear; driving wheel/grips/front forearm stay grouped in front, with the selected native rear forearm fixed behind the torso. Accepted native headphones replace drifted generated cup geometry; registered neck overlap closes the head-tilt join. A separate driving repair removes the oversized wheel and rounded arm cap. Do not compensate for bad native geometry by shrinking limbs. Reconstruct and visually compare before motion.

There are 22 native calls: 15 initial parts plus seven repairs. Eight rejected outputs remain with reasons/hashes; unchanged raw files, every exact prompt, successful four/five-input preflight, actual attached paths and frozen references are in [Alex production](alex-motion-v1/README.md), [production record](alex-motion-v1/production-record.json) and [active manifest](alex-motion-v1/reference-manifest.json). Mechanical alpha/material/registration derivatives are disclosed, not untouched-native claims. No whole-head expression swaps, skin patches, fades or code-drawn replacement anatomy. Reports: `alex-head-fidelity.json`, `alex-motion.json`, `alex-motion-cache.json`. Local synthetic QA does not establish physical-device/Safari/Firefox or human acceptance. Cache `alex-motion-v91`; app/art/Alex/style query `alex1`; rig `v=1`. Mina/Pico/avatar motion, Jo, grading, sounds, backend and printed book remain unchanged.

Latest Mina exercise reactions (6 November 2026): a checked correct answer triggers one1100ms happy jump/head tilt using the existing separate joy sprite. A wrong answer triggers one1300ms confused head bob using the existing separate focus sprite with one raised eyebrow and a neutral mouth. Both operate over the permanent faceless head; no new artwork, patches, fades or whole-head expression swaps. The regular idle/accent clock pauses and resumes its prior phase; feedback pauses when hidden/offscreen and cancels on navigation/reduced motion. A per-session answer nonce prevents replay on redraw/remount. Reduced motion retains the exact original still. Existing fixed character sizes, shoulder attachment, grading and answer flow remain. Actual synthetic correct/wrong exercises, desktop/mobile captures, phase continuity and no-remount-replay checks pass in reports/mina-motion.json. Cache mina-reactions-v90; app/art/Mina/style queries minareact1; rig v=2.

Latest Mina cadence (6 November 2026): every pose now plays one 8-second idle followed by its existing 3-second accent, repeating every11 seconds. This supersedes the former two-idle/19-second schedule. All accent motion/expression offsets move earlier by8 seconds; durations, geometry, shoulder attachment, opacity, pause/disposal and reduced-motion fallback remain. Full-cycle runtime and redraw-phase checks use the new timing. Cache mina-every-loop-v89; app/art/Mina/style queries minaevery1; rig v=2.

Latest Mina shoulder repair (6 November 2026): the skip pose arm previously met the body with insufficient overlap and separated during its wave. Shifted the existing native arm registration left18 logical pixels and moved its rotation pivot to the shoulder (205,180). No new artwork or face changes. Native-alpha overlap passes every angle from -12 to +12 degrees (minimum235 opaque pixels); full runtime cycle, mobile placement, masks, fallback and original head fidelity pass. See reports/mina-shoulder.json and mina-motion.json. Cache mina-shoulder-v87; app/art/Mina/style queries shoulder1; rig v=2. Fixed exercise sizes remain.

Latest stable exercise character size (6 November 2026): cast slots now remain fixed at 110x160px desktop and 90x128px mobile, with a matching reserved scene height. Question length, activity type and answer feedback no longer shrink or expand characters. Existing inner scrolling handles long prompts; answer fields/options retain clear bounds. Animation gestures and breathing remain, with original still/reduced-motion fallback. Verified unchanged rendered character height across feedback at eight desktop/mobile viewports, listening, answer controls and long content. See reports/exercise-art.json. Cache fixed-cast-v86; viewport query castfixed1. This supersedes the earlier flexible 150-320px/112-180px scene rules. No artwork, grading or backend changes.

## Mina release and identity correction — 6 November 2026

Mina is now explicitly authorized to animate in all four current poses (`step`, `read`, `map`, `skip`). Two 8-second subtle idle loops lead into a 3-second accent: greeting wave, closer book/map inspection, or celebration hop. This is decorative motion with no lesson-entry delay. Separate bodies, gestures/held objects, one permanent faceless head and transparent facial sprites use a shared full-opacity clock. Blinks and expressions switch discretely; pupils remain inside eye masks. Reduced motion and missing-part fallback use the exact original stills. Clocks pause when hidden/offscreen, survive answer redraws by pose, and are disposed on navigation.

The user rejected the first generated head/face because it changed Mina's identity. That version is archived as rejected, never an accepted reference. The corrected derivative preserves each original pose's head geometry, hair, earring, neck and neutral facial anchors; generated material supplies the permanent blank face. No added nose glyph, complete expression-head swaps or per-expression skin patches. Generated components are reconstructed against the original before motion, and both neutral and accent expressions require close visual review: numeric mask checks alone cannot accept identity or a malformed hairline. Exact prompts, actual attached preflight paths, raw outputs, mechanical preparation, rejected output and review evidence are in [mina-motion-v1/README.md](mina-motion-v1/README.md), [production-record.json](mina-motion-v1/production-record.json) and [reference-manifest.json](mina-motion-v1/reference-manifest.json).

Runtime: `src/mina-motion.js`, `styles/mina-motion.css`, `assets/art/mina-motion-v1/rigs.json`. Verification: `reports/mina-head-fidelity.json`, `reports/mina-motion.json`, `reports/mina-motion-cache.json`. Synthetic local Edge/Chromium checks do not establish physical-device or independent human acceptance. Cache `horizons-companion-mina-motion-v85`; app/art/Mina/style queries `mina1`. The accepted enlarged exercise artwork and unobstructed answer fields/options remain. Other cast, avatar/Pico motion, grading, backend and printed book are unchanged. The older static-Mina and path-wildlife notes below are historical.

Latest exercise artwork and clipping correction (6 November2026): full native quiz art now uses150-320px desktop scenes and112-180px mobile scenes instead of the miniature rule. Answer fields, choice lists and tile builders remain outside a separately scrolling prompt/art region, with clear space for focus outlines. Short desktop feedback uses side-by-side question/art and answers to retain complete sprites and fields; listening places audio controls beside the illustration. Mobile choice cues can share a row with art. All native assets, static cast poses, listening privacy, grading and saved IDs remain. Actual raster bounds and full field/option/tile/ring bounds were checked before/after feedback on desktop/mobile. See reports/exercise-art.json, reports/exercise-art-cache.json, reports/word-tiles.json and docs/SCREEN-FIT.md. Cache exercise-art-v84; app and viewport queries sprites1; prop query coffee2 remains.

Latest coffee flipbook (6 November 2026): replaced the single transformed splash with four separately generated native ImageGen frames: emergence, peak, breakup and falling droplets. Every call passed the authored preflight and attached R01/R02/R07 plus the original native splash and accepted cups (five actual inputs total). Four registered transparent PNGs swap discretely at opacity1, synchronized to the unchanged clink; no fading or splash transform animation. All raw outputs, exact prompts, input hashes, registration and quality review are recorded in docs/coffee-splash-v2/production-record.json. Reduced motion uses the original static cups; any missing frame falls back to that still. See reports/coffee-frames.json and coffee-frames-cache.json. Cache coffee-frames-v83; app/prop module queries coffee2; rig manifest v=3. Desktop screen-fit and removed banner Continue remain.

Latest desktop screen fit (6 November 2026): Learn, Practice, word bank, profile, quizzes, games, results and welcome now use height-aware desktop layouts. Shell navigation and primary controls remain in the viewport; topic/word lists, avatar options and long exercise content scroll inside their panels. The Unit banner Continue button is removed on every device; exercise feedback/exit-confirmation Continue controls remain. Learn scales the banner and trail to available height, caps the accepted trail height, and keeps all decorations, landmarks and side arrows visible. On short desktop windows island details open above their island when necessary, without inserting page space or scrolling the page. No new artwork, character motion, grading, backend or printed-book changes. See docs/SCREEN-FIT.md, reports/desktop-fit.json and reports/screen-fit.json. Cache screen-fit-v82; app/studio/viewport queries screenfit1; overworld stylesheet desktopfit1.

Latest path prop corrections (6 November 2026): the notebook cover uses a hidden backface so its person icon never appears inside, and the writing sprite is retired. The existing separate coffee splash now bursts to 2.25x scale, arcs and falls. The globe smear is removed. A fixed mailbox-slot wrapper clips the independently moving letter as it emerges and fully enters; the former moving-image mask was incorrect. All native sprites/IDs are preserved, with no new artwork, fades, character, backend or book changes. See docs/prop-motion-v1/CORRECTIONS-2026-11-06.md and reports/prop-motion-fixes.json. Cache prop-fixes-v81; app/motion/overworld queries props2; rig manifest v=2.

Latest avatar neckline/hair fit (6 November 2026): reuse the existing native neck pixels as a registered45px extension behind all ten garments; no new bitmap artwork or expression patches. Side-part hair moves down3 logical pixels to close the forehead gap on both bases/all six skins. Eye/face/glasses anchors, hair colors, outfits and saved IDs remain. Before/after and240 costume combinations plus24 hairstyle/base combinations reviewed in static/editor rigs. Native PNGs unchanged; reference sheets R03–R06 regenerated from the renderer. See docs/avatar-fit-v2/production-record.json and reports/avatar-fit-v2.json. Cache avatar-fit-v80; app query avatarfit2; art/static module queries fit2; metadata fit=2.

## Path prop animation release — 5 November 2026, corrected 6 November

The user authorized animation of the eight lesson props and removal of all path birds/butterflies. Character/avatar/Pico rigs are unchanged. Current renderer: `src/prop-motion.js`; registrations: `assets/art/prop-motion-v1/rigs.json`; exact sprite calls: [production record](prop-motion-v1/production-record.json); [reference manifest](prop-motion-v1/reference-manifest.json).

| Prop | Separate parts and motion |
| --- | --- |
| Cups | Separate red/yellow cups clink; four separate native splash frames play emergence, peak, breakup and falling droplets. Discrete swaps at opacity1, without interpolating or scaling a single splash. |
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
| Main avatar editor | Breathing, separate blink, varied face/pupil/glasses glances and customization feedback; no path avatar or lesson-entry delay |
| Login cast | Pico explore/map-reading, Mina step, Alex listen and Jo offer use their existing native rigs, idle/accent and reduced-motion stills |
| Sidebar avatars and option thumbnails | Static |
| Mina: step, read, map, skip | One 8-second idle then a 3-second pose-specific accent; separate blank head/features and one-shot exercise reactions |
| Alex: listen, fix, dance, sit/drive | One 8-second idle then a 3-second pose-specific accent; separate features and one-shot exercise reactions; seated supports fixed |
| Jo: offer, read, pour, clap | One 8-second idle then a 3-second pose-specific accent; separate blank head/features, one-shot correct/wrong reactions and immediate results accent |
| Path decorations | Eight authorized prop rigs; no birds or butterflies |
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


### Readable fixed exercise cast — 2026-11-06

Supersedes the 160px desktop / 128px mobile cast footprint from commit 309dd398. That fixed-size correction overrode the previous enlargement. Cast height is now 240px desktop, 200px on desktop viewports at most 650px tall, and 160px mobile. Widths are 168/140/112px. Sizes depend only on viewport, never question length or answer status. Character scenes stay displayed after wrong mobile choice answers. Existing long-content inner scrolling preserves the artwork without shrinking it, while fields/options/focus outlines and footer actions remain fully within the viewport. Native art and rigs unchanged.

Verified native rendered bounds and stable before/after feedback size at 1024x600, 1280x640, 1366x768, 1920x1080, 800x540, 320x640, 390x740 and 760x640; typed, listening, multiple-choice feedback, topic images and long reading. Report: reports/readable-cast.json. Worker v94 upgrades the previous v93 cache; exact current HTML and viewport CSS checked offline (reports/readable-cast-cache.json). No real learner records used. Pages build not awaited.


### Word tile scroll and answer flips — 2026-11-06

Tile drag, tap, return, reorder and Start again now replace only the sentence builder. The prompt scroll panel and character DOM remain mounted, preserving scroll position and avoiding idle-animation restarts. The full wrapped sentence height and reset-button space are reserved from the beginning, preventing tile moves from squeezing the prompt. Same-question order feedback preserves the prompt scroll offset where the available scroll range permits.

After checking, every answer and bank tile flips once and settles on soft green (#e4f2e8) or soft red (#f9e5df). Full opacity, no fade; neutral colors before checking. Reduced motion applies the result colors without the flip. Existing grading, token IDs, retries and server text submission contract remain intact. No artwork generation or backend release needed.

Verification: real mouse and CDP touch drags, return-to-bank, tap, reset, exact nonzero prompt-scroll and builder geometry preservation; correct/incorrect colors, every tile animated, reduced-motion behavior and uncropped controls at 1440x900, 1024x600, 390x740 and 320x640 (reports/tile-scroll.json). Existing complete word-tile browser round also passes keyboard use, reordering, retry and synthetic server-save checks. Cache upgrade v94 to v95 verifies the exact HTML, viewport CSS, app and motion module offline (reports/tile-feedback-cache.json). QA uses synthetic data only. Pages build not awaited.


### Immediate results accent — 2026-11-06

Mina and Alex begin at the 8000ms accent boundary when mounted inside the saved results screen, rather than waiting through eight seconds of idle or resuming a previously remembered pose phase. The existing three-second accent finishes, then the normal eight-second idle / three-second accent cycle continues. Each new results mount restarts the accent. Other placements keep their existing phase behavior; reduced motion keeps the accepted still. This changes timing only, using the existing generated parts and approved motions; Pico and Jo results still use their existing static artwork.

Actual app completion/browser proof: Mina reading round (2 answers) and Alex alphabet round (8 answers), synthetic server saves, immediate accent at about 8017ms, return to idle, repeated results mount and reduced-motion fallback all pass (reports/result-accent.json). Screenshots: external outputs 2026-11-06/result-accent/mina-entry.png and alex-entry.png. Worker v95 to v96 checks exact HTML/app/art loader/Mina/Alex modules offline (reports/result-accent-cache.json). No backend changes or learner data used. Pages build not awaited.


### Animated login cast — 6 November 2026

The user authorized all four animated cast members on the login screen. Mina step, Alex listen and Jo offer already mounted their native rigs there. Login Pico now uses the existing accepted explore/map-reading rig rather than the unrigged greet still; his exact explore still is the reduced-motion/missing-part fallback. The shared Pico loader/CSS and disposal selectors cover both banner and login, without modifying the native art, motion tracks, cadence or accepted banner behavior. Mina/Alex/Jo retain8-second idle +3-second accent; Pico retains8-second idle +6-second map inspection. No new ImageGen calls, anatomy, fades, login copy, backend or learner data changes.

Actual unauthenticated login checks at1440x900,1024x600,390x740 and320x640 pass: allfour rigs mount, idle/accent frames fit, controls usable, full-opacity sprites, reduced original stills, hidden pause, disposal and missing Pico part fallback. No API requests occurred. reports/login-cast.json and login-cast-cache.json record evidence; v99→v100 cache upgrade verifies current login asset bytes and all four rigs ready offline. App/art/CSS/Pico query login1; worker login-cast-v100. Existing reference pack rebuilt for current loader/style fingerprints; original artwork is unchanged. Local Chromium checks do not establish physical-device/Safari/Firefox acceptance. Pages build not awaited unless requested.

Streak waiting idle (6 November 2026): the 7.6s celebration now settles into continuous subtle Pico bob/lean, skewer follow-through, periodic blinking and animated fire until Continue disposes the scene. Counter/week reveal and dedicated sound remain once-only. Hidden/offscreen pause and reduced-motion static fallback remain. Browser check confirms transforms continue changing after7600ms, Continue stays available, impact fires once and disposal succeeds. This supersedes the finite frozen ending; cache streak-idle-v108, app/scene query streakidle1.

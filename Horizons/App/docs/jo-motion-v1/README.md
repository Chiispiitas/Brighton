# Jo animation production — accepted v3 poses

Jo's current four accepted poses are `offer`, `read`, `pour`, and `clap` from `assets/art/cast-static-jo-v3.png`. Exact untouched frame crops are frozen under `assets/art/jo-motion-v1/baseline/`. The `pour` name is preserved as a stable ID: the actual art shows Jo wiping a teal mug with a cream cloth, and the accent reflects that action. No teapot or pouring stream is invented.

## Sources and generated parts

Built-in ImageGen generates one component per call, beginning with the permanent faceless head and then separate facial glyphs, four stationary bodies and four forearm/prop groups. Each call has a saved brief, successful preflight, exact actual attached input paths and tool output record; R01/R02/R07 are attached alongside current native targets, within seven total inputs. The exact mandatory reference bytes and manifest are frozen in `inputs/`.

Several initial outputs failed visual acceptance: three bodies had strong exterior glows, two expression briefs returned whole figures, the open-eye/pupil sources had halos, the first joy-glyph cleanup retained a glow, and the clap-body repair incorrectly restored hands. Their raw PNGs and exact call records remain unchanged and are excluded from active mappings. There are24 calls total and nine rejected outputs. Separate cleanup calls target those exact failures. The original clap-body is accepted; its faulty repair is archived. Body/white-eye/pupil repairs use a deliberately opaque #ff00ff background followed by disclosed mechanical color-key extraction, rather than thresholding away a glowing alpha edge. Expressions use isolated transparent glyph plates. See `production-record.json` for the final calls/statuses/hashes.

## Reconstruction and identity

`tools/prepare-jo-motion.py` performs mechanical component selection, uniform cropping/scaling/registration, permanent generated-material selection and alpha containment. It does not draw replacement anatomy. Each pose retains its exact accepted gray-hair/head exterior geometry, head tilt and neutral facial anchors. The permanent face field uses opaque generated blank-head material with one uniform palette translation toward accepted skin. Original native neutral brows/mouth/pupils plus source-derived navy glasses/orange nose retain Jo's identity; these disclosed source selections match the corrected Mina/Alex workflow and are not described as untouched new ImageGen sprites. Generated white-eye material fills eye apertures, eyelid glyphs replace open eyes during blinks, and separate focus/joy plates replace the neutral feature group. Glasses antialias coverage is mechanically unmixed from the original native skin/frame mixture; eye whites retain measured native edge coverage. The shared `nose` part contains these original-geometry glasses and nose above the expression plates, so the glasses follow facial gaze in every state.

Body, both forearms/hands and held prop reconstruct each original pose before motion. The body remains behind the foreground forearm group; complete hand-object grips move rigidly together. Reference output boards are `reconstruction.png` and `head-fidelity.png`. Alpha/material tests support review but cannot establish visual identity by themselves. Inspect full-size and actual UI-size compositions, rest, extrema and normal-speed motion, especially both wrists, hair perimeter, glasses and apron seams.

## Motion and lifecycle

Runtime `src/jo-motion.js` / `styles/jo-motion.css` uses an 8-second subtle idle then a 3-second pose-specific accent. Correct-answer feedback uses a finite happy jump/joy expression, wrong answers a finite confused head bob/raised eyebrow. Reactions suspend and resume the idle phase, pause hidden/offscreen, and do not replay on answer redraw. Results mount directly at the accent boundary. Full-opacity transforms and discrete sprite switches only; no fades. Reduced motion and missing-component fallback preserve the exact accepted original still. Cleanup removes observers, listeners, animations and late callbacks. Other cast, exercise sizes, grading, sounds, backend and printed book are preserved.

## Verification and limits

Reports and QA artifacts are linked from the main animation audit once complete. Runtime/browser QA uses synthetic in-memory data; no real learner records. Large preview videos remain outside the public repository. Physical device, Safari/Firefox and independent human acceptance are not implied by local Chromium results. Module/style query is `jo1`, rig version1; cache is `horizons-companion-jo-motion-v97`.


## Glasses opacity correction

The user noticed eyes showing through the glasses. The prior skin/frame antialias unmix had left some strong navy frame pixels partly transparent. All strong native navy frame pixels are now alpha255, with exact source core color and the accepted outer antialias edge. Eye whites, pupils, closed lids and only the eye portions of the focus/joy plates are contained within the original visible eye apertures minus the native frame footprint. Brows and mouths remain unaffected. The accepted Jo artwork has open-topped U-shaped rims with some white eye extent above them; this original design is preserved, without drawing a new top rim or filling the lenses. `reports/jo-glasses-containment.json` verifies no eye-layer pixels under the navy frame and fully opaque cores in all four poses.

# Path prop animation corrections - 6 November 2026

This revision implements the user's four animation corrections. It reuses the separately ImageGen-generated sprites recorded in [production-record.json](production-record.json); no new image generation or pixel painting was performed. Original native outputs, registered PNG derivatives and saved identifiers remain untouched. The writing and globe-smear derivatives are retained for provenance but are absent from the current runtime manifest and precache.

## Actual faults and corrections

- **Notebook:** the front cover's person icon was visible on the back of the rotated image. `backface-visibility: hidden` now hides the printed side past90 degrees, exposing the existing blank pages beneath. The pencil still moves independently, but `notebook-writing.png` is no longer mounted. No ink or scribble appears.
- **Cups:** the splash had a short reveal window and an undersized transform. Its existing separate native sprite now grows from0.2x to2.25x, rises18% of the canvas, rotates, travels outward and falls28% before an atomic hide. The cups retain their clink. Peak/fall poses differ visibly at full opacity; no fade was added.
- **Globe:** the Earth disc retains its rotation and fixed stand; `globe-smear.png` is excluded completely from the active rig.
- **Mailbox:** the old clip was attached to the moving letter, so its boundary traveled with it. The letter now moves inside an independent stationary wrapper with a slot lip at31.5% canvas height and sides18.5%/68%. It emerges, pauses above the slot, then descends completely beneath the lip. At the inserted pose it is still mounted and within its reveal interval, yet the rendered mailbox matches the resting mailbox exactly because the letter is fully clipped.

## Active references and reproducibility

- Renderer: [prop-motion.js](../../src/prop-motion.js), query `props2`.
- Registrations: [rigs.json](../../assets/art/prop-motion-v1/rigs.json), query `v=2`;20 active parts across eight props.
- Mask/backface rules: [overworld.css](../../styles/overworld.css), query `props2`.
- Historical exact input images, individual prompts, generation outputs and rejected repairs: [production record](production-record.json) and [reference manifest](reference-manifest.json). These historical hashes remain unchanged.
- Preparation script now excludes the two retired effects from emitted manifests, preserving the same registrations if it is rerun.
- [Pose review board](review/corrections-2026-11-06.png): rest, emergence, peak, fall/insertion and fully inserted poses using the actual production renderer.
- Full-size frames, mobile captures and normal-speed recording remain local at `C:/Users/David/Documents/Codex/2026-11-06/prop-motion-fixes/`.

## Verification and limits

[Browser proof](../../reports/prop-motion-fixes.json) covers the actual app using an isolated synthetic session: eight decoded rigs; no writing/smear nodes; reversed notebook cover hidden; enlarged splash and distinct poses; stationary slot wrapper; letter visibly emerges and becomes fully occluded before hiding; all image opacities remain1 with no opacity keyframes; missing-part fallback; reduced-motion original stills; offscreen/document-hidden pause; disposal;390px mobile layout and pose captures. Notebook open/cover-hidden captures were visually compared; minor outer-page edge antialiasing changes when compositing toggles, so these are not claimed pixel-identical. Mailbox rest/inserted captures are byte-identical in the tested renderer.

[Cache proof](../../reports/prop-motion-fixes-cache.json) installs the priorv80 worker, upgrades to `horizons-companion-prop-fixes-v81`, verifies old-cache removal and fetches exact current source, CSS, manifest and all active sprite bytes offline. It uses the unauthenticated entry screen.

The earlier release checks did not establish correct backface appearance or true letter insertion. They are historical evidence, superseded here for those points. No physical-phone, Safari/Firefox or independent human review is claimed. Existing native art, avatars/Pico, path geometry and controls, grading, backend and printed book remain unchanged.

For future animations, follow the from-scratch process in [ANIMATION-AUDIT.md](../ANIMATION-AUDIT.md): generate every moving part separately with actual preflighted mandatory references, reconstruct the accepted still before motion, preserve raw outputs and registration provenance, then inspect normal speed and true extrema. Mask boundaries belong to stationary receiving objects; test hidden surfaces and actual occlusion, rather than only the existence of a clip rule. Reuse existing separated parts for timing/registration/mask corrections that require no new artwork.

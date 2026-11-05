# Unit 1 overworld: New Friends Town

Latest user correction (5 November): keep normal vertical mouse-wheel page scrolling; never convert it to horizontal map movement. Horizontal navigation uses slowly accelerating press-and-hold arrows, native touch swipe/momentum, mouse drag and keyboard buttons. Remove the extra New Friends Town heading, adventure tagline and all wheel/swipe/hover helper messages. Do not add promotional headings, taglines or navigation instruction copy unless explicitly requested. Older wheel-conversion reports are historical and superseded. Cache overworld-v34; queries overworld3.

The user requested a video-game overworld on the existing horizontal path: normal mouse-wheel travel, thematic scenery, hover movement for the saved avatar, building landmarks and animated birds/butterflies. The compact Horizons shell, learning content and Pico banner remain.

## Theme and artwork

Unit 1's introductions become a friendly town: 1A Welcome Park/café, 1B Makers Market/jobs, 1C Travel Garden/harbor, and 1D Friends Town Hall/forms and personal details. Each lesson keeps its original title/activity IDs. The final activity in each lesson is a clickable building: café, bakery/market, travel pavilion and towered town hall. Completion/check and gold mastery/crown states remain visible on landmarks.

Native artwork is in [overworld-unit1-v1](../assets/art/overworld-unit1-v1/). [Production record](overworld/production-record.json) preserves every exact prompt, ordered actual reference inputs/hashes, native tool output paths, dimensions, alpha, selected/rejected status and derived sprite records. Every call used built-in ImageGen with R01/R02/R07 actually attached; the two ground-repair edits also attached the exact target. Counts were three or four inputs, below the seven-total cap. No fallback API/CLI was used.

The initial Travel Garden and its transparent repair were rejected for an erased/blotchy center. A fully opaque third generation repaired the walkable ground; that native output is active. The rejected originals stay outside active mappings. Other scenery and building/wildlife art retain their native generated pixels; selected atlas sprites use mechanical alpha selection/crops via [prepare-overworld-sprites.py](../tools/prepare-overworld-sprites.py). No buildings, animals or anatomy were painted in CSS/SVG/canvas. CSS provides layout and UI surfaces; SVG supplies the functional route connector.

Only Unit 1 is implemented. Future units should receive a theme tied to their actual book content, new preflighted art and independent composed-page checks. This task does not create the printed book's other units or change the canonical curriculum.

## Original v32 interaction record (superseded by the correction above)

- Wheel down moves the map right; wheel up moves it left. Conversion is scoped to the map and normalizes pixel/line/page wheel units. Horizontal/diagonal trackpad gestures, Shift+wheel and Ctrl/Meta browser zoom stay native. At either horizontal endpoint, an unconsumed wheel event returns to ordinary page scrolling. The wheel listener is non-passive only where cancellation is needed.
- Hover/focus previews an activity by moving the learner's saved native avatar bubble. It does not open an activity, change mastery/XP, or save progress. Leaving the map restores the selected marker; clicking/tapping retains the existing compact details/Start flow. The marker stays below the ground anchor, clear of normal and building hit areas, and glides at full opacity. Its portrait, full hair, clothes and colors come from the saved avatar.
- All 21 activities remain chronological and available. The ground anchor remains `.stop-orb`, even when a building rises above it. The enlarged landmark button covers the building and stays keyboard accessible.
- Eight decorative birds/butterflies use native cutouts and closed transform-only flight/wing-squeeze loops. They do not intercept pointers and are hidden from assistive technology. Scenery stays still. Fauna pauses offscreen/in hidden tabs and becomes static under reduced motion; traveller gliding also stops under reduced motion. No new fades or opacity animation.
- `mountOverworld()` owns wheel/hover/focus listeners, wildlife animations, media/visibility listeners and its observer. The renderer disposes it before rebuilding or leaving the route, preventing duplicate handlers and detached animation loops. Pico's existing animation remains independently scoped and unchanged.

## Integration and checks

`src/overworld-motion.js` handles map input/ambient lifecycle; `src/app.js` retains the original shell/questions/profile and supplies scenery/landmark markup and avatar positions. `styles/overworld.css` layers over the accepted base/horizontal styles. The native art source files and the printed book/backend were not modified. New art lives under a new versioned folder; existing avatar/activity IDs remain stable.

Cache `horizons-companion-overworld-v32`; entry queries `overworld1`. The core includes the new module/style, four active scenery images, four landmarks and bird/butterfly cutouts. The general reference pack includes the new stylesheet in its source checks.

[Overworld proof](../reports/overworld-proof.json): four widths (320/390/768/1440), 21 IDs, four final buildings, four decoded scenes/eight fauna, connector/ground alignment, touch targets, no body overflow, wheel directions/units/modifiers/boundary release, hover/focus preview without progress or activity changes, marker restoration/clearance, keyboard details, fauna full opacity/visible motion, pause/reduced-motion/disposal, saved-avatar fixture reload, typed Spanish and listening skip. A pending WAAPI pause is allowed to settle before testing that its clock stays frozen; no real clock drift is accepted.

[Cache upgrade](../reports/overworld-cache-upgrade.json) exercises actual previous horizontal v31 to overworld v32 installation/activation/controller change and exact new module/style/art bytes. [Pico regression](../reports/overworld-pico-proof.json) verifies the retained opaque expression rig, one-idle timing, fallback and cleanup.

Reviewer: Codex subagent `/root/overworld_qa` independently inspected desktop/mobile worlds and repaired Garden V3 in the composed app; root inspected native outputs and composed captures. Tests use Edge/Chromium with intercepted fictional API state and simulated profile writes in memory. No real learner records, backend writes, physical-phone or Safari/Firefox validation are claimed. Hosted reports/revision and release evidence are recorded after publication. [Composed review captures](overworld/review/review.json) preserve the final desktop/mobile inspection; the complete generation prompts and saved native asset paths are in the production record linked above.

## Published release

Runtime 9a29911c85976856b30813fe3e27c9420046b65c is live. [Pages run 42055395675](https://github.com/Chiispiitas/Brighton/actions/runs/42055395675) succeeded. Hosted overworld, cache-upgrade and Pico proofs all passed; all 414 committed runtime/native files match the live route, including 12 existing book recordings. Root inspected the hosted 390px page. See [release summary](../reports/overworld-release.json), [hosted overworld proof](../reports/overworld-proof-hosted.json), [hosted cache upgrade](../reports/overworld-cache-upgrade-hosted.json) and [hosted Pico proof](../reports/overworld-pico-proof-hosted.json). Later evidence-only commits preserve this runtime.

## Corrected navigation verification

`tools/overworld-navigation-proof.mjs` verifies native vertical page wheel without sideways movement, accelerating held arrows and release, mouse drag without opening activities, native mobile touch swipe, and absence of removed messages. Earlier v32 wheel-conversion assertions are historical. No new artwork or learning/backend changes.

Navigation correction published: runtime a15618cd79419fd98ff89e960f2edff156a76dec, [Pages run 42058505416](https://github.com/Chiispiitas/Brighton/actions/runs/42058505416) succeeded. Hosted native vertical wheel, accelerating hold/release, mouse drag, blur cancellation, touch swipe, pinch-zoom preservation and removed-copy checks passed. All seven changed runtime files match hosted bytes. [Navigation proof](../reports/overworld-navigation.json). Existing v32 wheel-conversion reports are historical. No printed-book/backend/native-art changes.

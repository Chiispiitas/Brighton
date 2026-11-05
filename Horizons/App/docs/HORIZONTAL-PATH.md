# Horizontal unit path — current layout

The user superseded the fieldguide redesign and requested the exact earlier compact design, changing only the trail to a horizontal path inspired by their world-map clip. They then requested that the path character be the learner's avatar. The fieldguide design and its reports are historical, not current presentation requirements.

## Result

- Restored the pre-fieldguide shell: desktop Learn/Practice sidebar with bottom avatar/name/My profile shortcut, mobile Learn/Practice/Profile navigation, book switcher, XP/streak indicators, compact magenta Unit 1/Pico banner, prior Practice and profile layouts.
- One horizontally scrollable unit route contains all four lessons side by side. The same 21 island buttons, IDs, completion/checks, gold mastery/crowns and small non-modal activity popovers remain. No permanent island labels or lesson-jump shortcuts were introduced.
- Gentle horizontal S bends use a shared analytic curve for island positions and SVG connectors. Flat tangent endpoints and short extensions join adjacent lessons. Existing native inanimate lesson decorations occupy clear space below the bends.
- Manual swipe/scroll, focused-region arrow-key scrolling and left/right pan buttons reach the full route. Only the trail scrolls horizontally; the page body fits the viewport.
- The learner's saved native avatar is a static traveller marker above the current/selected activity. It reuses saved hair, outfit, accessories and colors, with the full hair preserved. Activation updates its selection/position without new anatomy, a walking rig, fades or a backend write. The marker stays outside the complete island button touch area.
- The original Unit 1 Pico banner animation is unchanged: separate faceless head and opaque expression sprites, one 8-second idle then 6-second inspection, reduced-motion/static fallback, pause/resume and disposal.

## Source and compatibility

The prior compact runtime was taken from `0058c04fd7209a3a959427aecf56cf038c1b71c1`. Shell, welcome, Practice, profile, question generation/grading, access handling and native artwork were retained. Layout changes are confined to horizontal trail markup/geometry, pan behavior, selected-activity marker and the scoped `styles/horizontal-path.css` layer. Canonical content, backend and printed book are unchanged. No credentials or real learner data were used.

Cache: `horizons-companion-horizontal-v31`; entry queries: `horizontal1`. The service-worker core contains the new horizontal stylesheet. The unused fieldguide stylesheet was retired. The general image reference pack was rebuilt against the restored base style plus the horizontal layer; no ImageGen call or native art replacement was needed.

## Verification

[Horizontal layout proof](../reports/horizontal-path-proof.json): synthetic intercepted state, 320/390/768/1440px, baseline navigation and compact hero, all 21 IDs, no persistent labels, no body overflow, scrollable route, increasing left-to-right island positions, connector endpoints at island centers, all lessons reachable, keyboard scrolling/popovers, mastery/completion, Practice/profile workflows, simulated save/reload, traveller appearance and marker clearance, typed Spanish cues, listening skip, reduced-motion Pico and static other characters. No real backend traffic or learner saves.

[Cache upgrade](../reports/horizontal-cache-upgrade.json): real fieldguide v30 committed runtime installed/cached, then upgraded to horizontal v31 via worker installation/activation/controller change; old cache removed, exact new CSS/module/native-art bytes verified.

[Pico proof](../reports/horizontal-pico-proof.json): unchanged rig behavior and fit, full-opacity expression boundaries, native reduced-motion/load fallback, pause/resume and route cleanup. The offscreen test adds temporary document height to make a real IntersectionObserver departure possible on the now-short horizontal page; it is a test fixture, not production spacing.

Independent visual review: Codex subagent `/root/layout_review` viewed desktop/mobile route and traveller, confirming restored identity, smooth path/fit, full hair and no marker/touch-target overlap. Root viewed desktop and 390px start/end captures. Scope: Edge/Chromium with synthetic state; physical phone/Safari/Firefox are not claimed. Reports bind local or hosted evidence to their source state. Release evidence is appended after publication.

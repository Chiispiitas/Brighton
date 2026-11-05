# Horizons layout revision — 5 November 2026

The user authorized site-changing layout decisions to give Horizons a more distinct identity, then clarified: “Not SO quiet. accept some similarity with Duolingo.” The resulting direction is a colorful companion workbook: recognizably playful, organized around book lessons rather than a winding game path.

## Current design

- Horizontal sticky Horizons masthead, Learn/Practice, book selector and text name/My profile on desktop and mobile. No left rail or bottom shortcut bar; no header player photo.
- An opening spread pairs the Unit title/Continue action with the existing animated Pico on amber. Its next-activity label makes the continuation target visible.
- Completion, mastery, XP and streaks live together in a colorful progress panel. No floating counters.
- Four chapter panels carry real book page references, lesson title/subtitle and existing native still-life illustrations. Activity names and types are visible in compact chronological rows. No winding connector, circular stepping stones or lesson-jump shortcuts.
- Magenta controls, amber/teal/green/pink chapter colors, rounded cards, finite interface feedback, green completion checks and gold mastery stamps preserve a lively learning-game feel.
- Practice has a word-set work area and round builder; profile places the saved round bust preview and tabbed customization beside account/book details, stacking on phones.

## Compatibility and scope

The same 21 canonical activity IDs, question engine, typed Spanish-cued vocabulary, listening fallback, completion/mastery data, lesson crowns, profile fields, avatar IDs/colors and book access remain. The Continue button launches the suggested activity directly; activity rows retain the compact non-modal details/Start flow.

Pico retains the existing faceless head/separate expressions, full-opacity sprite swaps, pupil glances, 8-second idle plus 6-second map check, reduced-motion fallback and pause/disposal behavior. Native PNGs were reused without regeneration or repainting. No printed-book, canonical content, backend, credentials or real learner data changed.

The latest layout authorization supersedes the previous sidebar placement, sidebar avatar shortcut, smooth S path, hidden activity labels and floating Unit/XP/streak requirements. It does not change the learning/data contracts. Old browser reports asserting those presentation details are historical; do not restore them to satisfy stale tests.

## Implementation

- `src/app.js`: new shell, opening spread, named chapter activity rows; removed SVG path layout calculation. Real book pages/subtitles come from existing lesson metadata.
- `src/studio-ui.js`: progress metrics go into the summary; no floating path overlay. Compact popovers and avatar tabs retained.
- `styles/fieldguide.css`: responsive layout/presentation layer after the existing component stylesheet. Existing learning components and native art remain reusable.
- Cache `horizons-companion-fieldguide-v30`; entry queries `fieldguide1`. The service-worker core includes the new CSS.
- `APP-AUDIT.md` and `SESSION-HANDOFF.md` record the new decisions. General image references were rebuilt with the new stylesheet included in source hashing; no new ImageGen calls.

## Verification

[Layout proof](../reports/fieldguide-layout-proof.json): synthetic intercepted state, 320/390/768/1440px, no horizontal overflow, at least 44px checked controls, all 21 named activities, correct page references, mastered/completed states, keyboard details, Practice selection, word-bank search/details, profile tabs/draft/simulated save/reload, book selector, typed Spanish cues, listening skip, reduced Pico and static other cast. No real backend traffic or learner saves. The profile save is an in-memory fixture only.

[Pico proof](../reports/fieldguide-pico-proof.json): scoped animation, fit, full-opacity swaps, expression boundaries, masks, fixed body, one-loop timing, fallback, pause/resume and disposal in the new layout.

[Cache upgrade](../reports/fieldguide-cache-upgrade.json): actual previous v29 runtime installed/cached, then updated to v30 through service-worker activation/controller change, removal of the previous cache and exact new CSS/module/native-art bytes. Uses the previous committed source, not a fabricated cache name.

Independent visual reviewer: Codex subagent `/root/layout_review` inspected the final colorful desktop Learn page, 320px Learn page and 390px profile, and passed the lively, distinct structure and fit. Root viewed desktop/profile captures and the user video reference. Browser scope: Edge/Chromium automation; physical-phone, Firefox and Safari checks are not claimed. The local/hosted reports identify their source scope; publication evidence is appended after release.

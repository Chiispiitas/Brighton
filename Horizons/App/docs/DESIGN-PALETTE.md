# Horizons interface palette and preferences

Two authored themes use the same layout, type and native artwork. Light is the existing accepted paper/ink/magenta palette. Dark is an app theme; do not invert raster artwork, tint characters, modify sprite alpha or replace saved avatar colors. Explicit device-independent Light remains the default; System is opt-in. Theme and motion/sound preferences are browser-local. The daily target is saved to the learner profile through the existing API.

| Role | Light | Dark |
|---|---|---|
| Canvas | #fffefa | #17232f |
| Surface | #f5f1eb | #223342 |
| Raised surface | #ffffff | #2b4050 |
| Primary text | #173e5c | #e6eff5 |
| Secondary text | #657680 | #b2c2ce |
| Link/accent | #ad195a | #ef8bb7 |
| Primary action | #ad195a / white | #ad195a / white |
| Focus/amber | #f3b137 | #f5bd5c |
| Border | #e7dfd6 | #465c6d |
| Success text/surface | #337c65 / #e5f3eb | #9bddba / #244739 |
| Incorrect text/surface | #a54c3c / #fff0e8 | #ffc0af / #50352f |

Rank materials keep their own readable foregrounds. Navy/purple higher ranks use pale cream; Wood/Stone/Gold/Diamond use dark ink. Avatar backgrounds and native icon/sprite colors stay unchanged. Full opacity character animation rules and faceless expression sprites remain mandatory.

Motion: src/preferences.js combines the explicit Animations switch with prefers-reduced-motion. Turning animations on never overrides OS reduced motion. Existing runtime rigs, gaze, prop, completion and interface controllers consume this shared preference. CSS motion is stopped under data-animations=off. The loading indicator remains an essential progress cue; it is not character idle motion. Backgrounds remain static. No new art or ImageGen assets are required.

Implementation: early preferences-boot.js prevents a saved-theme light flash. preferences.css defines the settings layout; theme-dark.css supplies scoped palette counterparts for existing light CSS and specific feedback/editor/readability corrections. New UI should use semantic variables instead of adding hard-coded colors. app.css only-light defaults continue to protect the light theme; explicit dark selector plus early color-scheme metadata select the authored dark scheme.

Verification: tools/preferences-theme-proof.mjs, tools/more-menu-proof.mjs and tools/friend-challenges-proof.mjs (HZ_DARK=1). Synthetic data only. Screenshots reviewed for Preferences, Learn, Practice, Rank, Profile, editor, wrong/correct options and challenge results; settings sizes1440/1024/390/320. reports/preferences-theme.json records tested settings and persistence behavior.

Mastery correction: gold is a semantic achievement color in dark mode too. Mastered island faces/hover/crowns and landmark badges keep gold with brown foregrounds. The nonmodal path bubble pointer uses the exact same surface color as the bubble; pseudo-elements use direct selectors because :is() cannot contain them. Synthetic browser CSS checks cover rest/hover gold and actual computed bubble/pointer equality.

Lesson-number badges in dark mode use light amber/rose/mint/blue fills with dark brown/plum/teal/navy lettering. All four rendered badge combinations are checked at4.5:1 minimum text contrast in dark-mastery-colors-proof.mjs. Obsolete page-level v query tags are removed with replaceState at startup; other parameters and hashes are retained. Internal asset cache versions remain in resource URLs.

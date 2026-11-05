# Interface motion

Requested 4 November 2026 (America/Bogota), using the supplied 37-second Duolingo recording `20261105-0334-38.7016913.mp4` as a motion reference. The reference informs timing and interaction, not a redesign or a copy of its styling. No character animation is authorized.

## Behavior

- Buttons compress on press and settle on release. Fine-pointer hover has a small lift; touch has press feedback without a lingering hover lift.
- Path islands respond through their orb. The compact snake and its chronological layout remain intact.
- Non-modal island bubbles pop in around their pointer; Escape, outside activation and scrolling still dismiss them.
- Avatar tabs have a sliding magenta selection highlight, including wrapped rows and keyboard navigation. The character preview and skin thumbnails stay still. The former whole-preview bounce is removed; only the existing native sparkle plays after an option change.
- Text/control sections arrive with a 10px rise and fade. No entrance is applied to a character, avatar or a container holding one. Ordinary selections and search rerenders do not replay page entrances.
- Lesson badges and vocabulary check marks have finite selection/entrance feedback. Memory cards and matching/choice selections settle after a short response.
- Exercise progress carries its previous width across rerenders. Sentence tiles travel between their source and answer slots, including removal and reflow.
- Floating Unit/XP/streak indicators and status toasts enter softly. No new perpetual animations, shadows or decorative effects are introduced.

Most feedback lasts 160–360ms. The existing sparkle lasts 600ms. Reduced motion removes animated transitions and press transforms; enabling it cancels active JavaScript feedback immediately. Controls remain functional and focus outlines remain visible.

## Source and verification

`src/ui-motion.js` captures prior UI state, marks safe controls and owns finite Web Animations. `src/studio-ui.js` handles bubble/tab feedback. `styles/app.css` enables scoped transitions while preserving the static-art guards and disabling historical loops.

Entry queries are `motion1`; service-worker cache is `horizons-companion-ui-motion-v20`. Artwork queries remain unchanged. Content, IDs, grading, profile contracts and the backend are unchanged.

Run `tools/ui-motion-proof.mjs` for 320/390/768/1440px UI checks. It intercepts API requests and provides a fictional session; it sends no real profile or attempt updates. It checks press feedback, popovers/dismissal, keyboard tabs, section entry, draft retention, character exclusion, progress, memory, token movement and reduced motion (including a live preference change). Token movement has a small isolated DOM fixture using the production hooks. Screenshots require direct visual review; the script does not claim visual approval by itself.

Run `tests/ui-motion-cache-upgrade.mjs` for a real committed v19 installation, then v20 update/activation, old-cache removal and exact loaded/cached bytes. Set `HZ_CACHE_SOURCE_REF` to the runtime commit for hosted checks. There are no API calls.

Reports: `reports/ui-motion-proof.json`, `reports/ui-motion-proof-hosted.json`, `reports/ui-motion-cache-upgrade.json`, `reports/ui-motion-cache-upgrade-hosted.json`. Reports name their source and limitations. Browser coverage is Edge/Chromium only.

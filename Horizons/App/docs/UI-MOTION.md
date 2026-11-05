# Interface motion

Latest loading fix: restore the existing orange dot's boot-hop animation on both startup and result-save loading screens. The legacy global animation:none!important rule had suppressed it. A scoped no-preference media rule restores only this indicator: vertical bounce/stretch at full opacity; reduced motion remains static. No character animation changes. Cache loading-bounce-v60; app.css query loading1, entry stays answer1.

Latest exercise audio placement: Play audio now sits beside the suggested answer inside correct/incorrect feedback, below Correct!/Not quite. It plays the question's canonical target recording, independent of the user's typed answer (including accepted alternatives). It is absent before grading, and wraps beside long answers on small screens. Remove the former pronunciation slot below the input; the reserved feedback dock and listening alternative remain. Cache answer-audio-v59; entry/app.css queries answer1.

## Current lesson and result flow — 5 November 2026

The 20261105-2236-31.1423238.mp4 recording shows a scrollbar appearing after answer feedback/word playback is added; the accompanying results image shows actions below the fold. Synthetic reproduction at1170×628 measured66px of checked-answer overflow and100px of result overflow. The revised layout fits both states at the tested desktop/mobile sizes down to320×576, with a stable answer position and no unnecessary document scroll. See reports/lesson-scroll.json; the baseline measurement is reports/lesson-scroll-baseline.json.

A transparent reserved answer dock leaves room for the existing green/coral feedback panel without enlarging that panel. A44px pronunciation slot prevents Play audio from changing the question height after checking. Listening alternatives also retain their space after grading. The lesson-only stable scrollbar gutter prevents horizontal shifts when a genuinely longer question requires scrolling. Short-height spacing and the character/illustration container adapt without stretching native artwork. Long passages, longer explanations and genuinely small viewports retain normal document scrolling; overflow is not hidden. Feedback docks to the viewport on long checked questions. New questions, the loading screen and saved results reset to the top; checking an answer does not.

Completion uses the existing boot-screen wordmark and orange loading dot while the attempt is being saved. The app marks this state aria-busy=true, with an accessible Loading results label and no visible Saving text or premature scores/actions. Results render only after success. The saved note is omitted. Failure shows an alert/retry screen, and retry retains the original attempt ID and loading behavior. Existing completion/mastery sound routing, mute and late-response route protection remain. The whole result-page arrival transform is disabled to avoid moving a viewport-height box (and its static character); finite text/control feedback remains.

The result illustration scales to available height (100–265px), with responsive spacing and naturally wrapping actions. The same native character and scores remain. No cast expressions, image assets, map geometry, curriculum or backend behavior changed.


Milestone audio now accompanies saved lesson rounds and newly earned island crowns, with one cue per result and crown priority. Existing motion and character rules are unchanged. See [SOUND-PRODUCTION.md](SOUND-PRODUCTION.md) for generation and playback details.

Answer sounds supplement the existing finite feedback motion. Native ElevenLabs cues, independent mute and playback rules are recorded in [SOUND-PRODUCTION.md](SOUND-PRODUCTION.md); reduced motion remains an independent preference.

## Current exercise feedback — 5 November 2026

The latest exercise feedback uses a prominent green or coral result panel, a check/cross badge, explicit **Correct!**/**Not quite** text, and a matching Continue button. Wrong results label the correct answer and show an existing explanation when supplied. Correct-answer arrays are displayed as words separated by spaces. Results remain until the user continues; grading, mastery, rewards and listening privacy are unchanged. The panel stays visible on long exercises, and keyboard focus moves to Continue without forcing a page scroll.

| Element | Current finite motion |
| --- | --- |
| Result panel |14px rise,260ms |
| Correct badge | Scale.55→1.15→1 with small rotation,420ms |
| Incorrect badge | Scale.8→1.05→1,420ms |
| Continue |3px press/rise/settle,340ms |
| Wrong typed answer, choice or sentence container | Brief horizontal nudge−5/+4/−2/0px,300ms |
| Correct progress track | Vertical pulse1→1.3→1,380ms; earned progress is not changed |

The feedback controls animate; cast artwork does not. Word tiles keep their neutral stone color. Reduced motion shows the same clear result instantly and cancels UI effects. No sounds, auto-advance, generated art or new character motion were added.

The user's `20261105-2107-06.8411436.mp4` supplied the result-strip/check/cross/button inspiration. It was inspected through contact frames; its character, language content and branding are not reused. [Desktop correct preview](exercise-feedback/1440-correct.png) and [mobile wrong preview](exercise-feedback/390-wrong.png) are synthetic actual-renderer captures.

[exercise-feedback-proof.mjs](../tools/exercise-feedback-proof.mjs) exercises actual grading/rendering with injected fictional question state. [Local report](../reports/exercise-feedback.json): correct/wrong typed answers at320/390/768/1440px, choice/order results, neutral tiles, visible feedback on long mobile content, focus, finite motion, static cast, reduced motion and no listening-answer reveal before grading. No real learner records. Edge/Chromium only; no physical-device or screen-reader approval claimed.

A tile interaction regression was also fixed: pointer capture now begins only after a drag crosses its threshold, leaving ordinary tile clicks functional. Native drag paths and click/keyboard alternatives remain.

Current cache: `horizons-companion-answer-feedback-v52`; queries:`feedback1`. The original v20 source/release notes below are historical. Avatar/Pico/bird rules are maintained separately in [ANIMATION-AUDIT.md](ANIMATION-AUDIT.md).



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

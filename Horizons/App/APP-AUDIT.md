# Horizons app audit

This audit governs the companion app. The book's existing audit remains authoritative for printed lessons and is not changed by this release.

## Learning

- Read the actual lesson and every referenced vocabulary bank before building a unit. Include the complete bank in study and retrieval practice; do not mistake the lesson's introductory sample for the full bank.
- Keep the printed book central. Write short, purposeful digital practice and fresh game contexts rather than copying whole lesson pages.
- Split banks into useful small sets. Allow learners to mix sets across lessons, remove duplicates by learning identity and include every selected word in an all-word round.
- Main lesson paths contain only the book's core topics, followed by two short listening/reading games per lesson. Group alphabet, numbers and other full banks into topic islands rather than one island per small set. Keep smaller selectable sets in Practise.
- Use Spanish translations as the vocabulary teaching and matching cues throughout A1. Keep navigation and task instructions in English. Retain the complete reviewed word bank; do not substitute English definitions that beginning learners cannot yet read.
- Typed answers are the default for vocabulary recall, grammar and reading responses. Listening recognition may use choices. Match typed answers with a shared, anchored pattern built from trusted accepted answers, never a learner-supplied regular expression. Accept harmless ordinary casing, spacing, punctuation and reviewed contractions; preserve capitalization tasks and explicit short/full-form requirements. Reject incomplete or grammatically incorrect forms.
- Where choices are used, keep one unambiguous correct choice, vary its position and exclude valid synonyms from false distractors.
- Listening prompts say Listen and choose or Listen and type. Never print the spoken target, its translation, an answer-bearing illustration, a hint or an accessible label that reveals it before grading. Keep only necessary context such as the numbered item in a multi-item recording.
- Every listening round offers I can't listen now. Replace the current and remaining listening items with deterministic non-audio questions. Retain their question IDs and submit the chosen alternatives so the server reconstructs exactly what was answered; do not retroactively change earlier answered audio items.
- Feedback identifies the correct answer without extra encouragement. Word viewing, hints and simple recognition must not manufacture recall mastery. Track missed words for another attempt.
- Grading, XP, mastered words and earned avatar parts are server decisions. Validate the submitted activity and reconstruct its questions from the reviewed content engine.
- Reuse approved source recordings when appropriate. New word audio uses Jessica, includes no `[clearly]` tag, decodes correctly and receives an independent transcript check.

## Static visual design

- Use plain functional copy: Learn, Practise, My profile, Word bank, Start and Results. Remove slogans, inspirational quotes, sugary headings and explanations that repeat obvious controls. Retain concise instructions, access information and necessary errors.
- The Learn page has no right-hand promotional/daily-practice sidebar or word-count panel. The Progress page and its navigation are temporarily removed; preserve stored progress and completion history internally.
- Path islands show icons without permanent names, counts, durations or step labels. One tap or keyboard activation opens a non-modal speech bubble near the activated island/cursor with the topic name, count, duration and Start. Keep it inside the viewport; Escape, outside clicks and scrolling dismiss it. Preserve keyboard access.
- Show authoritative XP and streak in the top bar. Once the Learn hero scrolls out of view, show a compact fixed Unit 1 banner and a separate XP/streak bubble; preserve the existing path geometry.
- Profile customization uses category tabs beside the avatar on larger screens and a compact preview above a bounded scrolling options panel on phones. Keep draft choices and form inputs when switching categories. Check clothing necklines against the chin on both bases.
- Hair color and portrait background are saved avatar choices. Recolor the native hair alpha silhouette without changing its shape; preserve an Original option. Frame the bust against its round background with a curved clothing crop, without cutting off hair. Player-avatar pictures appear in the profile editor, relevant option previews and the bottom sidebar shortcut beside the name and My profile. Omit a separate Profile item from the desktop sidebar menu; retain mobile Profile navigation. Page headers have no player-avatar picture.
- A short user-triggered avatar-preview bounce and ImageGen sparkle reveal is permitted when changing an option. It must finish promptly, never loop and honor reduced motion. This is the only exception to the still-art rules below.
- The current edition is entirely still. This supersedes earlier articulated, blink, gesture, float and pose-sequence requirements. No autonomous animation, CSS keyframes, picture transitions, hover movement, blinking, breathing, bobbing, parallax or animation runtime may be active. Choosing an avatar option or answering a question may replace the still image immediately.
- Preserve the Horizons wordmark, supplied M PLUS Rounded1c and lively magenta, orange, navy, teal and warm-white identity. Keep the open minimal interface and symmetrical serpentine lesson path.
- Use newly generated complete ImageGen stills for the recurring cast, occupations, avatar layers and scene illustrations. Keep native PNGs, genuine alpha, prompts and provenance. Do not substitute hand-drawn character vectors or turn old animation frames into the replacement art.
- Illustrations use simple solid-color geometric shapes. No outlines, borders, cast/ground/drop shadows, modeled shading, gradients, glossy highlights, lighting, texture or3D effects. Inspect them on the real page background at normal and enlarged size. A structural size check does not establish stylistic quality.
- Pico, Mina, Alex and Jo retain their identities and welcoming faces. Pico has two separate gentle eyebrows. Use a small set of purposeful complete poses suited to reading, welcoming, exploring and success, without showing animation between them.
- Every complete native character must already have coherent neck, shoulders, arms, hands, hips, knees and feet before integration. Check visible silhouettes and supported book/map/cup/tool grips. No disconnected parts, doubled limbs, hidden forearms with loose hands, or unsupported sitting poses.
- Avatar design follows the supplied rounded-square-face customizer screenshots: simple expressive eyes, small nose/mouth, clear ears and a warm friendly expression. Use an upper-chest bust everywhere, with no lower-edge hand fragments. Whole static clothing/hair/accessory layers share a registered canvas; there are no jointed avatar arms.
- Preserve both avatar bases, all six skin IDs, saved hair/clothing IDs and earned-pin contract. Every choice remains available to both bases. Verify all option families and source-bound combinations, including save, reload and another device.
- Fit raster crops at one uniform scale within their allocated boxes. Preserve native alpha and anti-aliased edges. Do not stretch a head, clip hair/headwear, cut off feet or crop held props. Keep atlas gutters out of the visible render.
- Keep still art truly still at entry, after hover/focus, after waiting and during navigation. Check unchanged pixels and transforms as well as zero running CSS/WAAPI animation objects. Do not use status labels or old motion tests as evidence.
- Check desktop and small phones, actual avatar selections, every activity and dialog, typography and touch targets. Release evidence names the screens and combinations actually inspected; it must separate structural measurements from visual approval.

## Access and privacy

- No learner email/password requirement. One profile can own multiple books; each valid linked code is an entry point to that same profile.
- First redemption starts twelve calendar months. Repeated redemption does not extend access. Handle leap days, month ends, simultaneous first redemption, expiry and revocation.
- Adding a code owned by another profile must never merge profiles or expose its contents. Signing out one device must not revoke another.
- Keep codes and opaque session tokens out of logs, screenshots, reports and repository data. All CMS collections remain private. Public demo codes must clearly request fictional personal details.
- Date of birth is optional and private. There is no public profile or social network in this release.
- Do not describe a preview book as a finished course, local storage as cloud progress, browser speech as a recorded voice, or a JavaScript cookie as HttpOnly.

## Release gate

- Visual anatomy and flatness require independent review of actual browser-rendered stills. Missing, uncertain or failed visual approval blocks release. Preserve defect examples and repeat the affected checks after repair.
- Canonical content and backend tests pass. No content, source audio or access/persistence contract changes belong to a purely visual redraw.
- Check every route, all Unit1 activities and dialogs at phone/tablet/desktop widths. Verify no stretching, clipping, overlap or missing artwork.
- Verify zero running animations and no autonomous image/transform changes across a timed observation, including pointer hover and focus. The static avatar customizer must still update and save normally.
- Real browser sign-in, profile save, practice, source audio, answer correction, progress save and another-device restoration pass using isolated codes. Keep public demo001 pristine.
- Publish to the existing GitHub Pages path and verify the actual hosted interface, native artwork, fonts, audio and API. Test a real returning-browser service-worker upgrade with exact current source/asset readback.
- Keep a reversible baseline, source-bound visual reports and explicit browser coverage limits. Exclude credentials, dependencies and unrelated book changes. Previous motion reports are historical evidence, not current static-edition approval.

## Bust accessories

- Curate accessories for the actual portrait crop. The current selection is None, round glasses, rectangular glasses and sunglasses. Bags, scarves, hats and oversized headphones are retired.
- Fit eyewear to the measured eye centers for each native base/skin; use one uniform scale and genuinely transparent clear lenses. Check all hairstyles, both bases, clothing and small navigation portraits.
- Retired saved accessory IDs render as None and select None in the editor; do not silently reinterpret a retired bag as a new face accessory. Other saved profile fields remain intact. The remaining supported IDs1–3 now name the three reviewed eyewear choices.

- Learning paths use one compact island per row, evenly spaced along mirrored left/center/right curves. Keep the SVG connector through orb centers and preserve activity and keyboard order. Place lesson identity at the start of each short path and details inside the island dialog.

- Hide the Avatar base selector. Preserve the saved base internally when displaying/editing profiles; skin, clothes, hair, eyewear and earned pins remain selectable. Do not overwrite an existing base merely because its selector is hidden.

- The avatar wardrobe has twelve hair styles plus No hair, and ten outfits. Append new stable IDs; preserve saved selections and make every style available to both bases. Register each new ImageGen layer against the face and neckline, then inspect complete busts across skins and eyewear at full and navigation sizes. Keep ponytails, braids and curls inside the portrait without hiding the eyes or detaching collars from the neck.

- In practice activities, honor the assigned cast member and choose a pose that suits reading, travel or welcoming. Give topic illustrations the full picture space instead of automatically adding Pico beside them. Keep the same contextual illustration during answer feedback; results and games also use their activity’s cast member. Never default every lesson question or success screen to Pico.

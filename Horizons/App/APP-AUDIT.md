# Horizons app audit

This audit governs the companion app. The book's existing audit remains authoritative for printed lessons and is not changed by this release.

## Learning

- Read the actual lesson and every referenced vocabulary bank before building a unit. Include the complete bank in study and retrieval practice; do not mistake the lesson's introductory sample for the full bank.
- Keep the printed book central. Write short, purposeful digital practice and fresh game contexts rather than copying whole lesson pages.
- Split banks into useful small sets. Allow learners to mix sets across lessons, remove duplicates by learning identity and include every selected word in an all-word round.
- Keep one unambiguous correct choice, vary its position and exclude valid synonyms from false distractors. Capital-letter exercises must check capitals; ordinary recall can accept harmless casing and spacing.
- Offer feedback that explains the specific answer. Word viewing, hints and simple recognition must not manufacture recall mastery. Track missed words for another attempt.
- Grading, XP, mastered words and earned avatar parts are server decisions. Validate the submitted activity and reconstruct its questions from the reviewed content engine.
- Reuse approved source recordings when appropriate. New word audio uses Jessica, includes no `[clearly]` tag, decodes correctly and receives an independent transcript check.

## Design and motion

- Preserve the Horizons wordmark and lively magenta, orange, navy and warm white identity. Use supplied M PLUS Rounded 1c consistently for the app interface.
- Keep screens open and borderless, with generous spacing, readable controls and a calm hierarchy. Illustrations should support a task, companion or reward.
- Generate characters, avatar layers, illustrated objects and scenes through ImageGen. Retain native outputs, alpha, prompts and provenance; do not draw replacement character vectors in code.
- Use recurring Pico, Mina, Alex and Jo with varied task-specific poses. Do not give every screen the same pose or repeat one decorative treatment everywhere.
- For articulated characters, overlap complete joints. The torso must remain intact behind accessories. Blinking changes only eye overlays, never the head silhouette. Add anticipation, follow-through and soft landings, not rigid whole-body rocking alone.
- Motion must respond to interaction and feel inviting. Respect reduced-motion preferences, stop media when leaving activities and release animation observers when screens change.
- Check actual desktop and small mobile screenshots, avatar combinations, path labels, illustration crops and touch targets. A passing size check alone is not visual approval.
- Fit every raster crop at one uniform scale inside its assigned box. Fixed icon, dialog, thumbnail or illustration dimensions must never stretch native pixels. Audit the visible inner image, not just its outer box.
- All named companions and learner avatars need visible face/head/limb or shoulder motion, through articulated parts or coherent generated action frames. Each companion has its own gesture vocabulary and timing; a whole-image float is insufficient. Occupation vignettes use generated task-action frames. Respect reduced motion throughout.
- Recurring companions also require genuinely different whole-body postures across contexts: sitting, crouching, stepping, leaning and celebrating. Moving limbs on the same standing stance alone does not meet this requirement. Bust avatars likewise need distinct portrait, greeting and thinking poses using generated hands/arms.
- Prove frame animation visibly advances. Sample the actual rendered atlas coordinates at several points and require distinct source frames; an active animation object is insufficient. Use per-keyframe step easing with a linear overall timeline for sprite sequences. Inspect native action-frame continuity and distinct posture silhouettes, not only pose labels.
- Learner avatars are upper-chest busts everywhere, including navigation and skin-tone previews. Keep saved customization IDs stable. This requested lower-chest crop is deliberate; hair, faces, glasses and headwear must remain intact.
- Check the complete motion envelope, including hands and held props, during idle, greeting and celebration. Keep a stable scale and ground line; do not zoom a character differently for each pose. Width-only rig scaling is forbidden when the container can be short.
- Keep paths compact with mirrored paired lanes, equal row spacing and clear progression order. Preserve every activity and touch target. Do not add tall repeated decorative interstitials between learning stops.

## Access and privacy

- No learner email/password requirement. One profile can own multiple books; each valid linked code is an entry point to that same profile.
- First redemption starts twelve calendar months. Repeated redemption does not extend access. Handle leap days, month ends, simultaneous first redemption, expiry and revocation.
- Adding a code owned by another profile must never merge profiles or expose its contents. Signing out one device must not revoke another.
- Keep codes and opaque session tokens out of logs, screenshots, reports and repository data. All CMS collections remain private. Public demo codes must clearly request fictional personal details.
- Date of birth is optional and private. There is no public profile or social network in this release.
- Do not describe a preview book as a finished course, local storage as cloud progress, browser speech as a recorded voice, or a JavaScript cookie as HttpOnly.

## Release gate

- Canonical content tests and backend tests pass.
- Real browser sign-in, profile save, mixed practice, games, source audio, correction, progress save and another-device restoration pass on isolated codes.
- Check expired access, code conflicts, duplicate delivery and unauthorized attempts. Preserve actual evidence and state the tested browser scope.
- Publish the frontend and the matching backend engine; then verify the actual GitHub Pages URL and its fonts, images, audio and API calls.
- Keep public demo 001 pristine during QA. Preserve a reversible Git branch and exclude credentials, environment files, dependencies and unrelated book changes.

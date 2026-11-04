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
- Sprites use flat color-block illustration. No painted or CSS cast/ground/drop shadows, modeled shading, gradients, bevels, glossy highlights or ambient occlusion on characters, clothes, body parts, props, selector thumbnails or illustrated rewards. A deliberately different flat material or design panel is allowed; it must not imitate light falling across a surface. Inspect native images composited on the actual light page background: hidden RGB in alpha-zero pixels is not visible artwork. Keep antialiased edges and native alpha; do not repaint generated pixels in code.
- A finish correction preserves approved avatar proportions, face shapes, hairstyles, clothing and bust framing. Flatten the existing native designs rather than inventing replacement round-head avatars. Keep customization IDs stable, and inspect the fully clothed busts before approving a new rendering finish.
- Use recurring Pico, Mina, Alex and Jo with varied task-specific poses. Do not give every screen the same pose or repeat one decorative treatment everywhere.
- Named companions and avatars require continuous articulated body-part motion. A moving whole picture or complete-character atlas sequence is not an acceptable substitute. Build from native ImageGen parts with measured shoulder, elbow, wrist, hip, knee and ankle registration. Keep a face together on its head; a blink may change only its registered eyelids. Never guess separate eye/mouth positions.
- In every active pose, check that pupils sit inside their eye shapes, eyelids follow the same eye line, mouths stay on the face, and glasses/hair fit the head. Check continuous neck-to-collar, shoulder-to-upper-arm, elbow-to-forearm and wrist-to-hand connections. Hands must have a plausible grip on props. No doubled limbs, floating hands, exposed cut seams or reversed body parts.
- Keep the torso intact behind accessories and verify the layer order during the entire motion, including loop boundaries and gesture extrema. Add anticipation, follow-through and soft landings only after the connected body is visually sound.
- Prefer a relaxed resting pose with an occasional intentional gesture over a permanently raised hand or synchronized sine-wave motion. Give a gesture preparation, a clear action, a short pause and a soft return. Offset head, wrists, ears and held-object reactions subtly; keep feet grounded through the supporting phase. Each recurring companion has its own gesture timing.
- Motion must respond to interaction and feel inviting. Respect reduced-motion preferences, stop media when leaving activities and release animation observers when screens change.
- Check actual desktop and small mobile screenshots, avatar combinations, path labels, illustration crops and touch targets. A passing size check alone is not visual approval.
- Fit every raster crop at one uniform scale inside its assigned box. Fixed icon, dialog, thumbnail or illustration dimensions must never stretch native pixels. Audit the visible inner image, not just its outer box.
- Every named companion pose must show purposeful arm/hand or leg movement relative to the torso, with its own gesture vocabulary and timing. Ear/head motion alone does not qualify as reading, greeting or working. Occupation action frames are acceptable only where the hands/arms perform a visible task; face-only changes must be replaced by actual limb motion.
- Clothes are part of the rig. The selected upper sleeve follows the upper arm, the forearm sleeve follows the elbow, and its cuff meets the wrist. Remove resting arms/sleeves from the torso core. No bare waving arm over static long sleeves, duplicate arms, circular mechanical cap marks or garments detached from a joint.
- Held objects follow the hands. Use a registered grip/kinematic target for books, maps, mugs and steering wheels, and keep support during greetings. Feet remain planted or deliberately step; shared shin/shoe crops must not leave an extra heel/stub.
- Recurring companions also require genuinely different whole-body postures across contexts: sitting, crouching, stepping, leaning and celebrating. Moving limbs on the same standing stance alone does not meet this requirement. Bust avatars likewise need distinct portrait, greeting and thinking poses using generated hands/arms.
- Prove articulated motion through continuously changing relative joint transforms with stationary native crop coordinates. For genuine occupation action frames, compare each visible task movement with its reviewed source frame; an active animation object or face blink is insufficient.
- Inspect at least 36 painted samples per recurring gesture and 24 per secondary pose, including extrema and the loop boundary, using one physical timeline shared by every joint. Inspect avatar sleeves across all six outfits/skin tones and explicit closed-eye phases. A finite sample is evidence of the tested scope, never a promise of absolute perfection.
- Test actual callback entry, interruption, automatic return and resumption in a running browser. Blend from the current painted joint pose without limb, clothing or prop jumps. Transition keyframes need explicit start/end offsets; return after a complete gesture or through a smooth bridge rather than cancelling at an arbitrary moment.
- Keep rotation angles on a continuous branch before interpolation. Adjacent IK samples around -180/180 degrees must not produce a full spin or detach a flat FK joint between keyframes. Verify actual off-keyframe motion, not only sampled targets.
- Constrain the entire swept avatar hand/sleeve silhouette within the portrait. A safe held-wave endpoint does not prove a safe lift or return. Check every skin/outfit combination densely, including early entry, interrupted returns, torso rotation and the actual painted edge pixels.
- Learner avatars are upper-chest busts everywhere, including navigation and skin-tone previews. Keep saved customization IDs stable. This requested lower-chest crop is deliberate; hair, faces, glasses and headwear must remain intact.
- Check the complete motion envelope, including hands and held props, during idle, greeting and celebration. Keep a stable scale and ground line; do not zoom a character differently for each pose. Width-only rig scaling is forbidden when the container can be short.
- Automated bounds, native aspect ratios, animation-object counts and advancing atlas coordinates do **not** prove correct anatomy. Record those as structural checks only. A separate visual anatomy review must inspect enlarged actual browser frames and document the verdict for each active character pose/frame and the avatar skin/posture matrix, with all hair/accessory options represented.
- Capture the actual rendered page at several points in each loop, including blinking, greeting and transitions, at desktop and phone sizes. A file called "blink" is insufficient: its painted image must show closed eyes in the same registered face. Inspect the eyes, face, neck, shoulders, elbows, wrists, hands, hips, knees and feet rather than approving a tiny thumbnail. Keep failed examples and the corrected comparison outside the shipped art.
- Keep paths compact with mirrored paired lanes, equal row spacing and clear progression order. Preserve every activity and touch target. Do not add tall repeated decorative interstitials between learning stops.

## Access and privacy

- No learner email/password requirement. One profile can own multiple books; each valid linked code is an entry point to that same profile.
- First redemption starts twelve calendar months. Repeated redemption does not extend access. Handle leap days, month ends, simultaneous first redemption, expiry and revocation.
- Adding a code owned by another profile must never merge profiles or expose its contents. Signing out one device must not revoke another.
- Keep codes and opaque session tokens out of logs, screenshots, reports and repository data. All CMS collections remain private. Public demo codes must clearly request fictional personal details.
- Date of birth is optional and private. There is no public profile or social network in this release.
- Do not describe a preview book as a finished course, local storage as cloud progress, browser speech as a recorded voice, or a JavaScript cookie as HttpOnly.

## Release gate

- Anatomy is an explicit release gate. Do not label a character or the whole site visually approved while its anatomy verdict is missing, uncertain or failed. The report must separate automated structural results from reviewed visual anatomy, and name the frames, avatar combinations and screens actually inspected.
- Canonical content tests and backend tests pass.
- Real browser sign-in, profile save, mixed practice, games, source audio, correction, progress save and another-device restoration pass on isolated codes.
- Check expired access, code conflicts, duplicate delivery and unauthorized attempts. Preserve actual evidence and state the tested browser scope.
- Publish the frontend and the matching backend engine; then verify the actual GitHub Pages URL and its fonts, images, audio and API calls.
- Keep public demo 001 pristine during QA. Preserve a reversible Git branch and exclude credentials, environment files, dependencies and unrelated book changes.

# Horizons website process audit

Latest lesson dividers (6 November 2026): a fine warm-gray vertical rule with fading ends separates the horizontal Learn lesson areas; it is decorative, takes no layout width and ignores pointer input. Practice adds a matching light rule between lesson rows (between each lesson on mobile). Existing collapsible word-bank separators remain. No new copy, art, path geometry or navigation changes. Cache lesson-dividers-v76; base and overworld stylesheet queries lessondividers1.

Latest Practice simplification: Practice now mirrors the 13 broad Learn topic titles across lessons 1A–1D (eight vocabulary choices plus five grammar launch buttons). It no longer renders the 23 smaller chunks or a separate grammar shelf. Vocabulary topic selection expands to the existing stable chunk IDs, retaining current mixed practice modes and round lengths; Select all covers all 142 practice words without duplicate subtopic controls. The word bank keeps every existing word tile, Spanish cue, search and word-detail/audio behavior; words are grouped by their authored lessonIds into four native collapsible details sections, collapsed initially. Shared words appear in each authored lesson. Search opens matching lesson groups, hides empty groups, and clearing it restores the learner's open/closed choices. Grammar and all practice remain independent of Learn locks. tools/practice-topics-proof.mjs verifies topic counts, full old/new word coverage, individual/select-all/clear behavior, grammar and vocabulary launch, every word's lesson membership, word details, search and collapse state, and widths 320/390/1440 with no page overflow using a synthetic store. No backend/book/native-art changes. Cache practice-topics-v75; app/base stylesheet queries practicetopics1. Finish after checks and push; no deployment wait requested.

Latest sentence-order correction: grammar templates were materialized as text questions despite the accepted draggable-tile UI. src/exercise-presentation.js now restores those token-bearing questions to the existing order renderer at quiz entry, with deterministic shuffled words, neutral tiles, mouse/touch drag, reordering, return-to-bank, tap/keyboard selection and clear. Stable question IDs and the deployed server text-answer contract are preserved: assembled words are submitted as one sentence string, with original grading/normalization and progress targets unchanged. Other typed grammar questions remain typed. Mobile order spacing keeps Check and Continue visible at 320/390/430px by 640px height; desktop also verified. tools/word-tiles-proof.mjs exercises both restored question shapes, real mouse and CDP touch gestures, reorder, bank return, keyboard, neutral palette and an 8/8 round saved through the actual server application with an isolated synthetic store. No learner records/backend deployment/book/native-art changes. Cache word-tiles-v74; app/base stylesheet and presentation module queries tiles1. Await Pages for this user request.

Latest mobile video review (WhatsApp Video 2026-11-05 at 9.35.35 PM (1).mp4): compact welcome art/layout fits entry controls on one mobile screen; Unit 1 banner shrinks to 92px with mobile Continue hidden; learn layout allocates the remaining dynamic viewport to the map, preserving the visible book/streak/XP bar and bottom navigation. Mobile map extends to both screen edges, with arrows below. Short multiple-choice questions use smaller scene/spacing and compact 44px-minimum choices, retaining Check and correct/wrong Continue within the viewport. Typed-answer layout and long reading tasks retain their existing natural scrolling. Browser-emulated verification covers 320/390/430px at 640px height, plus map at 760px; very short viewports may scroll to preserve usable controls (400px map-page floor). No learner records, backend, native images or book changes. See tools/mobile-video-proof.mjs and reports/mobile-video-corrections.json. Physical phone keyboard/browser-chrome verification remains a limit. Cache mobile-fit-v73; base/overworld stylesheet queries mobilefit1.

Latest mobile Profile fix: the bottom-navigation Profile button now renders the saved avatar through the same static bust renderer as the desktop shortcut, at 28px square, centered above its label. Previously navItems emitted no portrait for Profile. This does not add an avatar to the header or path. Cache mobile-avatar-v72; app module and base stylesheet queries mobileavatar1.

Latest island palette: available unfinished and completed regular islands again share the accepted reddish pink surface with white activity/check icons; landmark badges match. Locked islands stay pale, mastery stays gold, and the selection ring remains removed. Mobile arrows remain below the full-width map. Cache red-islands-v71; overworld query redislands1.

Latest mobile path correction: at widths up to 680px, the swipeable map spans the full available width and the left/right arrows occupy a separate bottom row. The arrows no longer reserve side gutters or obstruct islands. Desktop side arrows, hover/hold navigation, boundary hiding and native swipe/vertical wheel behavior are preserved. Cache mobile-arrows-v70; overworld stylesheet query mobilearrows1.

Latest island simplification: removed the visible selected-island ring. Available unfinished and completed islands now share the same blue-gray surface, border and dark icon color, including landmark badges. Unfinished listening uses headphones, reading uses a book, and regular/grammar/game islands use a star; completion replaces these with a check. Locked islands remain pale with padlocks; full mastery retains gold/crowns. Selection is still tracked internally for Continue and return positioning. This supersedes earlier ring and pink-completion instructions. No new artwork or backend changes. Cache path-states-v69; app and overworld queries pathstates2.

Latest path-state color correction: available unfinished islands now use a desaturated blue-gray surface, darker neutral star and subtle slate border. Locked islands retain a separate pale warm-gray surface and muted padlock. The open-state selector explicitly excludes .locked, fixing the earlier specificity overlap that made both backgrounds nearly identical. Completed pink checks, gold mastery crowns and the blue location ring remain. Cache path-states-v68; overworld stylesheet query pathstates1; app/motion queries remain props1.

Latest prop animation: eight lesson decorations now use separately ImageGen-generated moving parts, original static fallbacks, transform-only full-opacity cycles, staggered rests, reduced-motion stills and offscreen/hidden/disposal guards. Cups clink/splash; notebook opens and pencil writes; medical bag handle/clasp lifts; hat/spoon tip; map folds/compass turns; globe illustrated disc spins with contained smear; keys swing; mailbox handles a separate letter. Birds and butterflies are removed from the map, animation code and precache; archived native art remains. See docs/ANIMATION-AUDIT.md, docs/prop-motion-v1/production-record.json and reference-manifest.json. Twenty-one part calls plus two documented repairs, four/five actual image inputs each. New art is very similar, not pixel-identical, to the baseline; one fixed mailbox body reuses the original. Path geometry, controls, ring/locks, characters, backend and book files remain unchanged. Cache prop-motion-v67; app/overworld/motion queries props1.

Latest path update: unfinished island/star colors are neutral gray; gold is reserved for mastered islands. A static blue outline ring marks the selected or most recently completed island (aria-current=step), remains after finishing/reloading from server lastActivityId, and is revealed horizontally on return/resize without changing vertical wheel behavior. Every lesson starts independently; a saved completed round unlocks the next unfinished island in that lesson, without requiring mastery. Previously completed islands remain accessible, while uncompleted gaps gate later unfinished islands. Disabled padlocks and guarded path-details/start handlers enforce this learning-path flow; Practice mixes remain available separately and server entitlements/grading are unchanged. Continue follows the selected lesson. No avatar is restored. Greeting props are offset horizontally (notebook 24%, cups 44%) and slightly rotated; native images remain unchanged. See reports/path-progress.json, tests/path-progress.test.mjs and reports/path-progress-cache.json. Cache path-progress-v66; app/overworld queries pathprogress1, app.css loading1. No backend redeployment; do not wait for Pages.

Latest mastery policy: one unaided correct answer masters each prompted item, including accepted synonyms. Eight correct answers on a ten-word island immediately yield 8/10; the next round excludes mastered items and prioritizes unseen/incorrect items. Once every target is mastered the island becomes gold with a crown, and all island crowns earn the lesson crown. Mastery remains earned despite earlier/later mistakes; no 75% gate or three-answer requirement. Hints/matching do not count as retrieval and silent alternatives cannot master listening tasks. Existing graded history is re-summarized without rewriting records; stable recall question IDs recover previously accepted alias credit. Retry identity compares submitted work rather than policy-derived grading fields, preserving old-attempt idempotency and rejecting changed answers. Frontend/backend content are synchronized, including latest question formats, short-answer instructions and app-owned book recordings. Cache master-once-v65; entry masteronce1, app.css loading1. This replaces all older mastery requirements below. Server deployment e86e3970-ba28-4e74-a361-94a433321094 is live, source revision 71ef9c622fde170e897849e7b8d3e687b8806685. Validation: 67 checks, typecheck/build, browser 8/10 → 10/10, and real CMS reserved-QA 8/13 → 13/13 with idempotency and device restore. See backend/reports/mastery-once-deployment.json, backend/reports/live-one-correct.json and reports/one-correct-mastery.json.

Latest question clarity correction: use the wording Write a short answer with Yes. / Write a short answer with No. after the question, instead of parenthesized polarity cues. Multiple-choice versions say Choose a short answer with Yes. / No. This supersedes the earlier (Yes)/(No) format and removes the unseen Class 3 card implication. Both current short-answer items were reviewed; no accepted answers, grading rules, question IDs, grammar targets or deployed backend behavior changed. Use this pattern for future short-answer items. Cache short-answer-v64; entry shortanswer2, app.css loading1.

Latest publication change: all unpublished book authoring folders (A1, shared Base and its ZIP, future levels) are local-only and ignored. The book-build workflow is also untracked, preventing cloud builds without sources. Every local file was hash-checked before/after untracking and remains untouched. The companion retains its curriculum data and 12 unchanged recordings in assets/audio/book-unit1, with provenance hashes; runtime audio no longer depends on ../A1. course.bookUrl is null. Content tests compare the local book when present and otherwise the reviewed content/source-unit1.json snapshot, explicitly recording the evidence scope. Old book revisions remain in Git history; ignored local books need their own backup and must never be removed by git clean. Cache local-book-v62; entry localbook1, app.css loading1. No backend deployment or history rewrite. Normal no-wait deployment preference applies.

Latest exercise policy: full-sentence vocabulary questions and the reviewed sentence-like expressions Nice to meet you / See you later use multiple choice, including in mixed rounds and silent listening alternatives. Individual lexical items/chunks (apellido → last name, first name, phone number, Good morning/night) remain typed; grammar composition retains its form-focused tasks. Do not infer typing solely from word count. Canonical question IDs, correct answer text, bank coverage and server grading stay compatible; no backend/book changes. This supersedes older all-vocabulary-typed assertions. Cache sentence-choice-v61; entry sentences1, app.css loading1. User requested waiting for deployment this release only; normal no-wait preference remains.

Latest loading fix: restore the existing orange dot's boot-hop animation on both startup and result-save loading screens. The legacy global animation:none!important rule had suppressed it. A scoped no-preference media rule restores only this indicator: vertical bounce/stretch at full opacity; reduced motion remains static. No character animation changes. Cache loading-bounce-v60; app.css query loading1, entry stays answer1.

Latest exercise audio placement: Play audio now sits beside the suggested answer inside correct/incorrect feedback, below Correct!/Not quite. It plays the question's canonical target recording, independent of the user's typed answer (including accepted alternatives). It is absent before grading, and wraps beside long answers on small screens. Remove the former pronunciation slot below the input; the reserved feedback dock and listening alternative remain. Cache answer-audio-v59; entry/app.css queries answer1.

Latest path correction: remove the user avatar/You marker from the lesson path, including its positioning and island-selection motion. Profile/sidebar avatars and avatar editing remain. Islands, details, artwork and scrolling controls are unchanged. This supersedes older path-player requirements and assertions. Cache no-path-avatar-v58; app entry query path1 (app.css remains flow1). Finish after relevant checks and pushing; do not wait for GitHub Pages unless explicitly requested.

Latest lesson/results scroll correction: short-screen spacing and artwork sizes adapt to viewport height, with a reserved answer dock and pronunciation-control slot so grading does not introduce avoidable page overflow or width shifts. Long questions remain naturally scrollable with feedback controls available. Completion now uses the existing Horizons boot wordmark/dot loader while saveAttempt is pending; no Saving/Saved result note, scores or result actions appear before confirmation. Failed saves show a retry screen using the same attempt; results and completion sound appear only after success, starting at the top. Cache lesson-flow-v57; entry/app stylesheet queries flow1, other accepted assets unchanged.

Latest placement correction: keep the same sparse lesson-specific artwork, but place one topic object above and one below each lesson trail. Upper positions vary by lesson and sit between island/portrait columns. No additional decorations or artwork generation. Cache lesson-areas-v56; overworld stylesheet query areas2 (existing modules stay areas1).

Latest map cleanup: remove repeated plant dressing from the active path. Each lesson now has two unique topic objects and one local wildlife accent: 1A address book/cafe cups, 1B chef tools/work bag, 1C map/globe, 1D keys/postbox. Decorative elements fall from28 to12 across Unit1; the four landmarks remain, with artwork reduced from120x124 to108x112 CSS pixels. Trail/island geometry and308px height remain. Plain paper, click-only player selection, portrait-above/details-below, vertical wheel, hover arrows and native swipe/drag remain. New isolated ImageGen tiles and exact inputs/prompts: [production record](docs/lesson-area-tiles/production-record.json). See [OVERWORLD.md](docs/OVERWORLD.md). Cache lesson-areas-v55; queries areas1.

Latest milestone sounds: native ElevenLabs lesson-complete and island-mastery cues. Successful saved rounds play completion; newly server-confirmed crowns play mastery instead, once. Failed saves, existing crowns and rerenders do not replay a mastery reward. Shared remembered mute, navigation/hidden-page cancellation, retry handling and pre-save audio unlock are verified with synthetic sessions. See [SOUND-PRODUCTION.md](docs/SOUND-PRODUCTION.md). Cache milestone-sounds-v54; queries milestones1.

Latest answer sounds: native ElevenLabs v3 correct/wrong cues, local playback once per graded quiz answer, remembered header mute independent of lesson recordings. Empty/duplicate submissions and rerenders stay silent; Continue, route changes and hidden pages stop the cue. No character animation changes. Production prompts, files, hashes and QA limits: [docs/SOUND-PRODUCTION.md](docs/SOUND-PRODUCTION.md). Cache answer-sounds-v53; queries sounds1.

Exercise feedback: prominent green/coral result panel with check/cross, explicit Correct!/Not quite text and labeled correct answer. Existing explanations are shown for wrong answers. Finite success badge/progress pop or brief wrong-answer nudge, plus responsive Continue button; reduced motion uses immediate static states. Neutral draggable tiles, accepted grading/mastery, listening privacy and static cast stay intact. Cache answer-feedback-v52; queries feedback1.


Word-order questions: neutral stone tiles, pointer dragging into the answer, reordering within it and dragging back to the bank. Mouse/pen/touch supported; click/keyboard button activation remains. Checked answers lock tile changes. Cache word-tiles-v51; queries order1.


Latest avatar picker: every hairstyle option uses a black silhouette preview. Hair color is immediately after Hair in tab/keyboard order. Thumbnail recoloring is scoped to the picker; selected/saved hair colors remain on the actual avatar. Cache avatar-picker-v50; stylesheet/module queries hair1.


Latest editor feedback: first look-around begins after500ms, easing to its first pose at1900ms; the existing20-second varied gaze pattern is retained. Each avatar option change (skin, clothes, hair, eyewear, badge, hair color or background) triggers an immediate140ms eye-only blink alongside customization feedback, including changes queued while art loads. Reduced motion remains neutral with no feedback animation. Face/glasses tracking, fixed background, immediate lesson entry and stable path scroll remain. Cache avatar-editor-v49; queries look2.


Latest avatar gaze frequency: three varied glances every20 seconds (nine per minute),50% more frequent than the previous30-second schedule. Only pauses/holds are shortened;1.4–1.9-second transitions, face/glasses synchronization, breathing, blinking, resting eyes, fixed background and immediate lesson entry remain. Cache avatar-gaze-v48; module queries look1.


Latest lesson-entry/path correction: no jump-in animation or entry delay; Start opens the selected activity immediately. Detail popovers reserve any required page space within the current learning path until the route changes; switching/dismissing details must not remove that space and clamp the page scroll upward. Minimal downward reveal remains when required to keep details below the island and clear of mobile navigation. Cache path-details-v47; module queries pathfix1.


Latest gaze refinement: glasses share the exact facial-layer translation. Look-around uses a30-second schedule with three unequal glances (right/up, left/up, slight right/down),1.4–1.9-second transitions and long neutral rests. Breathing and140ms blink retain their independent5200ms period. Original resting eyes, fixed background, full opacity, masks and reduced-motion handling remain. Cache avatar-face-v46; queries face5.


Latest avatar options correction: no nested scrollbar in customization tabs. Each panel expands to fit all choices at desktop/mobile widths; the page retains normal vertical scrolling. Cache avatar-options-v45; app.css query options1.

Latest avatar correction: generate a genuinely blank head FIRST, then separate expression/eye-white/pupil/blink sprites. Whole-head expression swaps and skin patches are prohibited for avatars as well as Pico. The portrait background stays completely still during breathing and customization/island feedback; only the internal avatar artwork moves. Subtle look-around combines masked pupil translation (±2.5 logical px) and face-layer translation (40% of that). Main editor/path only; sidebar/thumbnails static. 5200ms cycle,140ms eye-only blink, full-opacity transitions, reduced-motion still, hidden/offscreen pause and cleanup. All costume/hair/glasses anchors and saved IDs retained. Visible avatar-only breathing scales from(.994,.98) to1; the face moves with each glance, independently of the fixed background. Current assets/process: docs/avatar-face-v2/production-record.json; audit: docs/ANIMATION-AUDIT.md. Pupils enlarged17% (18 to21 logical px), retaining eye masks. Default white-eye bounds and inward pupil positions are measured from the accepted still for each base/skin; glances return to those measured positions. Cache avatar-face-v44; queries face4.

Latest avatar change: slightly rounder face silhouette via ImageGen-generated alpha mask on existing native head pixels. Facial features/colors, ears/neck, frames, eye anchors and all costume/hair/accessory/badge metadata stay registered; ten costumes, two bases and six skins reviewed across240 rendered combinations. Saved IDs unchanged. See docs/rounder-avatar/production-record.json and reports/round-avatar-proof.json. Cache round-v40; avatar metadata and manifest query round=1.

Latest correction: bird wings flap using ROTATION ONLY (-35 to55 degrees); no wing squash, stretch or skew and no whole-bird scaling. Saved player portrait changes island only on explicit island activation (mouse/touch click or equivalent keyboard activation), never on hover/focus/leave or auto-retargeting while scrolling. Scrolling the selected island out of view hides the portrait until it returns; it does not select another island. Initial placement is allowed. Hover arrows and other accepted controls remain.

Latest interaction/art update: mouse hovering an arrow scrolls until leave, as well as press/hold. Reached ends hide arrows; a real adjacent implemented unit turns its boundary into an explicit Go to Unit button (never auto-activate on hover). Unit registry currently contains only Unit 1. Avatar previews stay on fully visible islands; building names removed. Lesson-specific isolated native object tiles are reused. Bird now has separate ImageGen body/near/far wings, transform-only flaps with squash/stretch smear moments and local hover motion; butterfly also hovers locally. Reduced motion, hidden/offscreen pause and disposal apply to every wing loop. Older fixed-eight-animation / release-while-hover assertions are superseded.

Latest controls placement: left/right arrows flank the actual path at its left and right edges, vertically aligned with the trail center. Dedicated 44px columns keep them outside the swipe surface and island hit targets. This supersedes bottom-centered controls; faster scrolling and native vertical wheel/swipe remain. Cache tiles-v37, queries tiles3.

Latest visual correction: plain/colorless map surface (same paper as page), original orange/magenta/pink island styling and thin pale per-lesson connectors without the tan road outline. Hide the horizontal scrollbar; center left/right arrows BELOW the map. Faster held-arrow travel: 200→640px/s over600ms, short tap180px, keyboard activation360px. Keep native vertical wheel, swipe/drag, 308px trail, sparse tiles and portrait-above/details-below. Do not restore helper messages.

Latest environment rule (5 November): do not generate or display whole environment panels, landscape chunks or precomposed neighborhoods for the overworld. Retire the large v32 scenery panels. Use a sparse reusable tile set: individual complete trees and small bush/flower/grass tiles, independently placed with open space. Single native building landmarks may remain individual sprites. Keep the path 30% shorter (440px to 308px). Latest placement correction: player portrait ABOVE the island/building, activity details BELOW. No added headings/taglines/instruction messages; native vertical wheel and hold/swipe controls remain.

Latest user correction (5 November): keep normal vertical mouse-wheel page scrolling; never convert it to horizontal map movement. Horizontal navigation uses slowly accelerating press-and-hold arrows, native touch swipe/momentum, mouse drag and keyboard buttons. Remove the extra New Friends Town heading, adventure tagline and all wheel/swipe/hover helper messages. Do not add promotional headings, taglines or navigation instruction copy unless explicitly requested. Older wheel-conversion reports are historical and superseded. Cache overworld-v34; queries overworld3.

Version 1 · Governing process · 4 November 2026

This is the working specification for the Horizons companion website. Read it before changing content, artwork, interface behavior, access, persistence or deployment. It consolidates the current decisions; archived animation experiments and older screenshots are historical evidence, not instructions.

The companion supports the printed book. It provides short retrieval practice, vocabulary study and games rather than replacing the book. Current learning content is A1 Unit 1; A2 is a book-linking preview. Rules for later units are requirements for future work, not a claim that those units are implemented.

## 1 Authority and scope

1. The user's latest explicit instruction takes precedence.
2. This audit defines the current website behavior.
3. The [image production guide](docs/IMAGE-PRODUCTION.md) governs every generated image and edit. Its mandatory reference selection and seven-image input limit are release requirements.
4. The current source, canonical content and reviewed native artwork establish exact implementation details.
5. Reports establish what was actually tested at their named revision. A report from an earlier revision cannot prove a later change.

Keep the printed book's audit separate. Do not change book pages, recordings, backend collections or unrelated school websites as a side effect of an interface/art correction. Preserve synced project references as read-only. Ordinary fixes within the user's request do not need another permission question.

## 2 Product and learning rules

### Audience and access model

The app is for Brighton book users of all ages. Interface instructions are English; A1 vocabulary cues and matching use Spanish translations. There are no email/password learner accounts or public social profiles. One saved learner profile can own several books.

A valid book code creates or restores its profile. Linking an unused code while signed in adds a book to that profile. Any active linked code can restore it on another device. Access lasts twelve calendar months from first redemption, with immutable original expiry; repeat redemption never renews it. A code belonging to another profile cannot merge profiles or expose data.

Keep all entitled lessons available. Recommend a next activity without locking the rest. Use friendly goals, stored XP, streaks and earned avatar pins; no hearts, paid retries or punishment for practice.

### Content preparation

Read each actual book lesson and all vocabulary banks it references. Distinguish introductory lesson samples from the full bank. Maintain an inventory mapping lesson, topic, bank entries, grammar targets, recordings, path nodes and practice questions.

The main path contains core book topics and two short listening/reading games per lesson. For 1A, the topics are Greetings, Alphabet, Numbers and Verb to be. Do not create one island per arbitrary chunk of alphabet or numbers. Keep small selectable sets in Practice and let learners combine them. An all-selected-word round includes every selected learning identity once.

Use fresh, plausible contexts rather than repeatedly recycling the same character profile, reception scene or picture. Tasks need an understandable goal and a genuine language decision. Avoid stereotypes, arithmetic disguised as English practice and copying a displayed answer. For silent alphabet practice, use Spanish letter names such as hache rather than showing the letter to copy.

### Questions and grading

- Prefer typed vocabulary, grammar and reading responses. Keep choices when recognition is the actual listening goal.
- Use Spanish vocabulary translations rather than English definitions beyond beginning learners' reading ability. Matching pairs are English–Spanish.
- A choice task has one unambiguous answer. Exclude synonyms/equivalents from false distractors; deduplicate both sides of matching.
- Use the shared answer matcher. Compile anchored patterns from trusted accepted answers; escape literals and never execute learner-supplied regex.
- Accept harmless ordinary spacing, case, punctuation and reviewed contractions. Preserve the actual target in capital-letter exercises, full-form/short-form tasks, numbers, spelling and phone numbers. Reject extra words and grammatically impossible answers.
- Do not accept a contracted positive short answer such as Yes, she's. when Yes, she is. is required.
- A synonym can earn correctness without pretending the intended bank spelling was recalled.
- Hints, word viewing and recognition do not manufacture retrieval mastery.
- Feedback identifies the correct answer. Keep copy plain: Correct, Correct answer, Check, Continue, Results.

The backend reconstructs the reviewed activity from stable IDs, selection and the exact seed. It grades submitted text itself. Ignore client claims about correctness, XP, word IDs and mastery. Reject unknown/repeated question IDs and invalid audio alternatives. Preserve attempt IDs for idempotent retries; identical retries award no extra XP and altered retries are conflicts.

### Listening and pronunciation

Say Listen and choose or Listen and type. Before grading, hide the spoken target, translation, revealing illustration, hint and answer-bearing accessible label. Keep only necessary context such as Name 3 in a multi-item recording.

Offer I can't listen now. Replace the current and remaining audio items with deterministic non-audio tasks; retain original question IDs and submit the selected fallback IDs. Previously answered audio questions must keep their original variants. Replay must generate a new consistent round and preserve the learner's no-audio choice.

Reuse approved book recordings where suitable. Recorded word audio uses Jessica and the reviewed voice pool. Never use the [clearly] tag: it has produced throat-clearing audio. New audio needs decoding and an independent transcript check. Never describe browser speech as an approved recording.

## 3 Website design and interaction

### Identity and copy

Keep the Horizons wordmark typography and M PLUS Rounded1c. Retain lively magenta, orange, navy, teal and warm paper with open spacing. Avoid a different visual series, excessive boxes, decorative borders, heavy shadows and repeated accent formulas.

Use functional labels: Learn, Practice, My profile, Word bank, Start and Results. Remove slogans, inspirational quotes, sugary greetings and explanations that repeat obvious controls. Retain necessary task instructions, expiry information, errors and clear example-code disclosure.

The Learn page has no promotional right sidebar, daily-invitation card or word-count panel. The separate Progress page remains removed; stored history, XP and streaks remain intact.

### Navigation and horizontal path

- Desktop sidebar menu: Learn and Practice. No separate Profile menu item.
- Bottom sidebar shortcut: avatar picture, learner name and My profile. It opens the profile.
- Mobile navigation retains Profile access.
- Page headers contain the book switcher and authoritative XP/streak amounts, without a player-avatar picture.
- Preserve the previous compact design. The latest layout request replaces only the vertical trail with one horizontally scrollable unit route, using gentle sideways S bends and continuous joins through the same island centers. Four lessons sit side by side in the same order. Keep all activity IDs, orb states, headers, native inanimate decorations, sidebar, compact hero and popovers.
- Unit 1 uses a sparse modular overworld: independently placed tree/bush/flower/grass tiles on a flat surface; no generated whole-neighborhood panels. Trail height308px (30% shorter). Final activities retain individual native building sprites and the same IDs/completion/mastery states.
- The saved native avatar bubble travels ABOVE each island/building on hover/focus; compact activity details open BELOW it. Both clear the complete hit target. Click/tap selects details; preview movement never starts or saves an activity. Reuse saved hair/clothes/colors, with no articulated walking anatomy.
- Mouse wheel stays native and vertical. Use held arrows, swipe or mouse drag for horizontal map travel. No extra map heading, tagline or wheel/swipe/hover instruction messages.
- Support manual swipe/scroll, keyboard access and optional left/right panning controls. Do not turn the buttons into lesson-jump shortcuts or hijack ordinary vertical scrolling. No body-wide horizontal overflow.
- Islands have no permanent title/count/duration/step labels. Tap or keyboard activation opens a small non-modal speech bubble at the island/cursor.
- The bubble contains the name, count, duration and Start. Keep it below the island and clear of the portrait; create room by scrolling the page first when needed, place its pointer sensibly, and dismiss with Escape, outside activation or scrolling. It must not dim or block the rest of the page.
- When the Learn hero scrolls out of view, show a compact fixed Unit banner and a separate XP/streak bubble. For future units, derive the number from content rather than copying Unit 1.
- Floating indicators must not cover the current task, navigation or popover.

### Profile and avatar studio

Use category tabs beside the preview on larger screens. On phones, keep a compact preview above a bounded scrolling options panel so choosing an item does not require repeatedly scrolling back to the avatar. Preserve drafts and other form inputs through category changes and redraws.

Support skin tone, clothes, hair, eyewear, earned badge, hair color and portrait background. Keep the internal male/female base compatibility while hiding the Avatar base selector. Do not overwrite a saved base simply because its control is hidden.

Current inventory: twelve hairstyles plus No hair, ten outfits, None/round glasses/rectangular glasses/sunglasses, eight hair-color choices including Original, and six background choices. New items append stable IDs. Retired accessory IDs render as None; never silently turn an old bag into new glasses.

All choices work on both bases and six skins. Eyewear uses measured eye centers, uniform scaling and transparent clear lenses. Clothing necklines meet the neck below the chin; inspect navy stripes, lavender and olive in particular. The explorer jacket has two complete notched lapels.

The portrait is an upper-chest bust. Its clothing meets the round background with a curved lower crop, not a floating rectangular hem or empty crescent. Hair, ponytails and props remain complete. Hair recoloring uses the native alpha silhouette; keep Original and do not alter face shape. Background/hair choices persist after save, reload and another-device sign-in.

Date of birth is optional and private. A future social feature is a separate project, not permission to expose profile data now.

### Motion and accessibility

Unit 1 banner Pico keeps the approved faceless reading rig and no-fade rules in [ANIMATION-AUDIT.md](docs/ANIMATION-AUDIT.md). The latest overworld request additionally permits the saved-avatar bubble to glide on hover/focus and decorative bird/butterfly flight/wing-squeeze loops. These use transforms at full opacity, pause offscreen/hidden and become static with reduced motion. Other cast and avatar anatomy remain static; no articulated walking rig is introduced. See [OVERWORLD.md](docs/OVERWORLD.md).

The 4 November video-reference request authorizes finite interface motion: button presses, badge/selection feedback, sliding tab highlights, section text entrances, path-bubble pop-ins, progress fills and answer-tile movement. Preserve the accepted layout and flat visual identity. Do not animate characters or containers holding them; the earlier whole-avatar preview bounce is now removed. The existing native ImageGen sparkle may reveal briefly after an avatar option changes. All feedback must settle, never loop, and respect reduced motion, including cancelling active feedback if that preference changes. See [UI-MOTION.md](docs/UI-MOTION.md).

Use real buttons and inputs, visible keyboard focus, descriptive accessible names, keyboard-operable tabs and useful light-dismiss behavior. A literal double-click is never required. Aim for at least 44px touch controls; never let a compact design make targets hard to use. Check content at 320, 390, 768 and 1440px, and with zoom/long labels.

## 4 Artwork governance

Use [IMAGE-PRODUCTION.md](docs/IMAGE-PRODUCTION.md) and the seven indexed PNG references. New illustrations, cast poses, avatar pieces and decorations use ImageGen, not hand-coded character vectors or recycled animation frames. Existing native ImageGen pixels may be uniformly cropped, placed or recolored for the supported UI controls.

Flatness means simple solid-color shapes: no outlines, decorative borders, cast/drop shadows, gradients, gloss, glow, texture or modeled lighting. A supplied reference with a residual defect does not authorize copying that defect.

Pico is the adventurous hare with two gentle eyebrows and a satchel. Mina, Alex and Jo retain their approved faces, hair, clothing identities and proportions. Keep hands connected and grips supported. Do not make faces hostile or bodies disproportionately thick. Do not default every lesson/result to Pico; use the assigned cast or task-related illustration.

Native PNGs, alpha, exact prompts, source paths, hashes and registrations belong in the repository. Keep discarded generations outside active mappings. Never overwrite the source atlas to repair one garment if a narrow versioned replacement/overlay can preserve the other assets.

## 5 Access, data and security

The frontend is the existing GitHub Pages app under /Horizons/App/. The backend is the dedicated Wix API and six private CMS collections documented in backend/README.md. Do not repurpose unrelated school services.

The device cookie stores an opaque session token, not the original book code. It is first-party Secure/SameSite=Lax and JavaScript-readable because the frontend is static; do not call it HttpOnly. The API stores a token hash and validates ownership and entitlement. Signing out revokes that device session, not all devices.

Keep original codes, session tokens, environment files and build credentials out of logs, screenshots, reports, source archives and frontend bundles. Use fictional details with public examples. Keep public example 001 pristine. Allocate isolated QA fixtures and restore any profile edits after testing.

Check expiry, revocation, code ownership, concurrent first redemption, month ends and leap days. Existing profile data survives expiry; active entitlements remain separate. Escape user text, bound inputs and validate fields server-side. Keep all collections private. Before a broad printed-code campaign, replace the documented per-worker redemption limiter with a distributed limit.

Current server rules award five XP per correct answer plus ten per completed round; mastery requires three successful retrievals and 75% recall accuracy. Badge thresholds and streaks derive from server events, not frontend totals. Change these only through a deliberate learning/backend revision.

## 6 Work process

### Before editing

1. Inspect the current branch, working tree, applicable instructions, live route and relevant reports. Preserve unrelated work.
2. State the requested behavior and acceptance criteria. Separate content, design, artwork, persistence and deployment scope.
3. Read the relevant lesson/banks or current component before proposing replacements.
4. Record the current commit as a reversible baseline. Do not reset or delete unrelated changes.
5. For images, complete the brief and reference check before invoking ImageGen.

### Implementation

Keep one canonical set of content modules; synchronize every reviewed module into the backend when generation or grading changes. Preserve existing lesson, word, activity, avatar and attempt IDs. Archive hidden activities for saved-progress compatibility rather than deleting their meaning.

A visual correction should change the smallest appropriate source/registration. Avoid unrelated question, recording or entitlement edits. Use new filenames for replacement art. Change renderer and thumbnail mappings together. Keep drafts through rerenders and clean up obsolete artwork mounts.

Implement errors and retry paths. Do not silently replace a failed activity with a different quiz. Give direct useful errors without slogans. Diagnose repeated Bad Request responses by locating the actual failing action/status; do not assume a chat error proves an app failure, or that a local pass proves the reported error cannot occur.

### Test selection

Run checks that exercise the change. Do not rerun unrelated suites merely to inflate counts.

| Change | Required evidence |
| --- | --- |
| Content/grading | Canonical content tests, backend tests, synced modules and a real saved round including wrong/correct answers |
| Audio alternatives | Original-only, all-unavailable and mid-round switch; preserve earlier answers; save/retry/replay |
| Profile/options | Draft changes, save, reload and second-device restore; restore QA profile afterward |
| Artwork/crop | Native readback, actual composed render, uniform scale, alpha/edges and full/small sizes |
| Avatar garment/hair | Both bases, six skins and relevant hair/eyewear combinations; neckline, silhouette and circular bust |
| Navigation/interaction | Real click/tap and keyboard use, dismissal, viewport fit, route access and source-bound screenshots |
| Motion feedback | Triggered once, settles to still, no idle loops and reduced-motion behavior |
| Publishing/cache | Successful Pages deployment, exact hosted bytes, real previous-worker upgrade and public-route checks |

Useful current focused tools live under tools/ and tests/: avatar-colors-proof.mjs, studio-ui-proof.mjs, jacket-lapel-proof.mjs and the matching cache-upgrade scripts. Some scripts encode an older UI contract. Read their assumptions and update them deliberately when the user's latest instruction supersedes that contract; do not mistake a stale assertion for an app defect.

### Release and rollback

1. Review the diff for scope, secrets, unwanted assets and unrelated edits.
2. Complete meaningful local checks and visual review. Record PASS/FAIL and limits honestly.
3. If backend semantics changed, sync/test/build/package and deploy the dedicated Wix backend with existing data intact; verify real grading before frontend release.
4. Commit reversible source changes and push the authorized repository branches. Use the existing main/Pages publication flow.
5. Wait for deployment success. Verify the actual hosted route, files, native artwork, fonts, audio and API behavior.
6. Change cache identity/entry queries when needed. Install the actual prior worker, update/activate the new one, confirm old-cache removal and compare loaded/cached bytes with the committed release.
7. Save source-bound release evidence and commit evidence separately. An evidence-only commit does not change the verified runtime.
8. If a released regression occurs, identify its introducing commit and revert the narrow source change. Restore compatible metadata/cache references together; never erase learner records as a UI rollback.

Reports must name runtime commit, backend revision if relevant, URLs, viewport/browser scope, checks actually performed, failures, visual verdict and remaining limits. Structural dimensions alone do not establish anatomy or design quality. Do not claim Safari/Firefox coverage from Edge/Chromium tests.

## 7 Completion gate

A task is complete when requested behavior works in the user-visible route, meaningful checks pass, visual changes have been inspected, persistence is verified where relevant, authorized publication succeeds and the audit/reference records reflect the final state.

Do not call an incomplete course complete, an archived experiment current, a local result deployed, or a generated picture visually approved merely because the tool returned it. Keep the final handoff concise: what changed, where to use it, what was verified and any material remaining limitation.

Website name: Horizons. Browser title, welcome heading, installed-app name and social metadata use Horizons. The share card is a 1200×630 native-art composition using the supplied wordmark.

Lesson headings have no cast characters. Islands use narrower lateral travel and longer vertical spacing on an analytically sampled sine trail, with continuous tangents through the complete bend. Keep 21 activity IDs and the existing object decorations.

Island details use a compact 240px bubble: title, mastered-item count, question count and Start/Continue/Practice again. Remove the lesson-jump shortcuts; navigation through Unit 1 is manual scrolling. Completion keeps its check mark. Server-derived mastery gives a gold island with crown; all mastered islands crown their lesson. Later rounds draw from the complete canonical pool, prioritising unseen and unmastered items, at most eight questions per round. Vocabulary retains three unaided recalls and 75% accuracy; grammar/read/listen skills require three unaided correct answers and 75% accuracy per question. Silent alternatives cannot master audio. Crowns reflect current saved performance, and may change if accuracy later falls below the threshold.

Interface spelling is Practice. Start screen omits the repeated Horizons heading, the vocabulary/grammar/games sentence and the 12-month access footnote. Keep the brand wordmark and book-code form. Access rules are unchanged.

The latest character-animation exception is ONLY the Unit 1 banner Pico generated-part reading rig. Follow docs/ANIMATION-AUDIT.md and docs/pico-banner-animation/production-record.json. All other characters and avatars remain static. The original native still is the reduced-motion/load-failure fallback. Do not revive old articulated rigs.

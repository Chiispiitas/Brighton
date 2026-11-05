# Horizons website process audit

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

The main path contains core book topics and two short listening/reading games per lesson. For 1A, the topics are Greetings, Alphabet, Numbers and Verb to be. Do not create one island per arbitrary chunk of alphabet or numbers. Keep small selectable sets in Practise and let learners combine them. An all-selected-word round includes every selected learning identity once.

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

Use functional labels: Learn, Practise, My profile, Word bank, Start and Results. Remove slogans, inspirational quotes, sugary greetings and explanations that repeat obvious controls. Retain necessary task instructions, expiry information, errors and clear example-code disclosure.

The Learn page has no promotional right sidebar, daily-invitation card or word-count panel. The separate Progress page remains removed; stored history, XP and streaks remain intact.

### Navigation and path

- Desktop sidebar menu: Learn and Practise. No separate Profile menu item.
- Bottom sidebar shortcut: avatar picture, learner name and My profile. It opens the profile.
- Mobile navigation retains Profile access.
- Page headers contain the book switcher and authoritative XP/streak amounts, without a player-avatar picture.
- Preserve the compact, symmetric snake path, one island per row and a connector through orb centers. Keep keyboard and reading order chronological.
- Islands have no permanent title/count/duration/step labels. Tap or keyboard activation opens a small non-modal speech bubble at the island/cursor.
- The bubble contains the name, count, duration and Start. Keep it within the viewport, place its pointer sensibly, and dismiss with Escape, outside activation or scrolling. It must not dim or block the rest of the page.
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

Characters are static: no idle floating, blinking, limb rigs, breathing, pose sequences, parallax or hover displacement. Use complete purposeful still poses and varied cast members appropriate to the task.

One exception is allowed: changing an avatar option may trigger a brief whole-preview bounce and an ImageGen sparkle reveal. It must finish, never loop, and be disabled for reduced motion. After the feedback ends, there must be no running animation or changing pixels.

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

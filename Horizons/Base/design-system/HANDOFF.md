# Horizons — Base Design System Handoff

**Status: OPERATIONAL ENTRY POINT**

Use this file to resume Horizons book production. It points to the authoritative shared sources; it is not another rulebook.

## Authority order

Read these sources in order:

1. `CANONICAL-STYLE.md` — shared visual/structural rules.
2. `GUIDED-DISCOVERY.md` — shared pedagogy, with level-specific language-load rules where stated.
3. `component-contracts.md` — reusable HTML/CSS semantics.
4. `asset-policy.md` — image/audio sourcing and production.

Before exporting any lesson, check every newly taught vocabulary set and grammar point has its nearby `Go to:` reference. The canonical style and component contract specify the exact wording and placement. Lesson 3C uses a vocabulary reference in place of the redundant ADJECTIVES focus box.

Shared implementation is intentionally small:

- `tokens.css` — colors, type, spacing and print legibility floors;
- `components.css` — reusable cross-book/cross-lesson CSS.

There is no refinements or override CSS layer.

## Current A1 production precedent

For the current A1 book, compare new work with the approved Unit 1 masters in `../../A1/Lessons/`:

- `1A.html`
- `1B.html`
- `1C.html`
- `1D.html`

Lesson masters use the definitive lesson code as their filenames. Their adjacent `lesson-*-local.css` files contain book/lesson-specific composition, crop tuning and corrections. They are precedents, not templates to copy mechanically.

**Spacing authority: Lesson 1A.** The author specifically selected its spacing
as the A1 reference. Leave 1A intact when calibrating other spreads. Follow the
A1 spacing reference in `CANONICAL-STYLE.md`, inspect the combined exercise
padding and gaps at print scale, and check photograph-to-text clearance.
The 2026-10-06 spacing revision brings 1B-2D toward 1A's opening-page rhythm,
including continuation pages, without reducing type or response spaces.
The preceding creative preview is preserved at
`horizons-before-spacing-review-2026-10-06` for an independent rollback.

For **early A1 learner-facing language**, 1A, 1B and the first page of 1C are especially important references for the deliberately narrow, Spanish-transparent register.

Recent Unit 1 refinements establish additional production precedents:

- simulated real-world UI should visually read as the intended artifact, not as a generic card;
- text/profile bodies should normally end with their content rather than carrying large artificial `min-height` floors;
- short semantic labels may use content-sized columns or no-wrap treatment when an awkward line break would damage readability;
- when the author removes answer choices or response spaces, do not replace them with a different affordance unless explicitly requested;
- forms may use generated physical-artifact imagery or restrained HTML/CSS according to their intended character; preserve clean writing space and all task fields.

## Current A1 / Unit 2 workflow

For each new lesson:

1. lock the syllabus focus and identify what language is genuinely new;
2. audit what learners have already met in preceding A1 pages;
3. design the Guided Discovery sequence before styling;
4. choose a real/content-led visual world for the lesson;
5. build on Base components and keep one-off composition in the lesson-local CSS;
6. link that local stylesheet from the lesson HTML itself;
7. add only the book-specific assets the task needs;
8. use the definitive filename (`2A.html`, `2B.html`, etc.); the Student's Book compiler discovers it automatically;
9. compare the finished spread with neighboring approved lessons for language load, physical readability and visual weight.

## A1 visual calibration from the Unit 2 review

The author-made Unit 1 spreads remain the reference for visual finish. Unit 2's
2026-10-06 revision demonstrates how to apply that standard without making every
lesson use the same template:

- Give the lesson's real scene or reading/listening feature a clear visual lead.
  Keep crimson for shared lesson navigation and pale pink for canonical grammar
  focus. Editorial features may use their own coordinated palette.
- Make contextual people and task-bearing objects prominent. Crop only when the
  learner's evidence survives; preserve complete person/object distance scenes.
- Keep app chrome subordinate to its readable information and the people using it.
  Check all screen content for clipping, including the lowest fields and controls.
- Use Unit 1's purposeful variety of portrait circles, environmental photographs,
  paper conversations and functional artifacts. Avoid an uninterrupted sequence
  of small rectangular picture panels.
- Whitespace is useful. Add a new image when it models a task or establishes a
  needed scene, rather than filling a gap. Compare the finished two-page spread
  with Unit 1 at the same physical scale before publishing.

## Whole-book editorial redesign preview

The 2026-10-06 author request authorizes a reversible visual overhaul of all
current A1 lessons, 1A through 2D, informed by the supplied Personal Best series.
The preview is isolated on `codex/horizons-editorial-redesign`. The checkpoint
`horizons-before-editorial-redesign-2026-10-06` preserves the preceding book.
Do not treat a preview branch as permission to replace `main`.

This revision keeps the complete teaching content and audio resources while
recomposing every spread. The author's color correction authorizes independent
feature palettes and rejects newly added repetitive background boxes. The
latest author correction restores the original dialogue panels, photographic
backgrounds and feature bands from the pre-overhaul checkpoint; do not remove
them under the earlier open-paper guidance. Preserve current content and spacing.
The closer study of all six supplied Personal Best levels gives work profiles
circular portraits and individual serif name accents. Travel combines a large
headline, map and photographs; the hotel uses an arched scene; transport
retains its original title band and interview caption backgrounds. The Rivera
article and Lost and Found object pairs now use their original full photographs.
**2A activity 1** keeps the generated photographic bag cutout, and **1B activity
3** uses the five author-requested transparent, borderless object clues. Existing
transparent paper artifacts retain their approved surfaces. The opening
conversation uses the full hallway photograph. All four 1A greeting photos
have matching circular crops and centered, aligned captions. Grammar focus keeps
its canonical title tab and shell; functional artifacts retain needed structure.
Feature colors and geometry stay lesson-local. The previous preview is preserved
at `horizons-editorial-preview-v1-2026-10-06` as an additional rollback point.

The complete spacing-approved preview before the closer reference study is
preserved at `horizons-before-personal-best-study-2026-10-07`. Image edits use
versioned sibling filenames; original images remain available. No Personal Best
learner text, photographic assets or branding are used in the book.

### Latest approved creativity reference

The author explicitly approved the two latest A1 feature revisions on
2026-10-07 as the creative direction for future work. Start with
**Author-approved creativity reference** in `CANONICAL-STYLE.md`: it records the
small content-led motifs, travel details, restaurant lettering/photo prints,
paint textures and generated reception/Lost and Found artifacts as practical
examples. Use that standard for new features while preserving spacing, context
and the shared book identity. Asset production and generated working-document
semantics are aligned in `asset-policy.md` and `component-contracts.md`.

Compare the whole book at print scale. Check source-text and exercise parity,
response affordances, image loading, phone-screen clipping, grammar emphasis,
option typography and every rendered PDF spread before publication. The GitHub
book publisher runs on `main` only; a manually rendered preview branch cannot
publish its compiled artifacts to `main`. PDF photo downsampling uses 300 dpi
and JPEG quality 94 to retain detail in printed crops.

## A1 paired-unit review

`A1/Lessons/2R.html` is the original Units 1 & 2 Review, printed pages 21-22.
Its adjacent `review-1-2-local.css` keeps all review composition scoped locally.
The existing compiler discovers this definitive master automatically after 2D
and before a future 3A; no lesson manifest or shell override is required.
The answer key and teacher notes are in
`A1/Answer keys/Units 1 and 2 Review.md` (paths relative to `Horizons/`).
Personal Best's review balance and Cambridge Movers task principles inform
the original activities; their text, photography and branding are not reused.
The 2026-10-07 author correction replaces the first worksheet-like review's
activities and layout in full. The 2026-10-08 identity correction restores
Horizons' shared lesson header, paper, continuation tab and single vertical
exercise lane. Columns occur inside individual exercises. The original
photo-exhibition feature, a colored
vocabulary sorting table, two visitors' exhibition conversation, new studio
photographs for demonstratives and an eight-lesson challenge task are retained.
The final section is **BEYOND HORIZONS**, with the author's subsequently
requested compact colored circles, no Speaking label and no photo-pass form.
Its 1D challenge asks three personal-information questions instead of completing
a pass. Keep the circles inside this exercise, without a full-height background panel.
The fresh theme is **The Color Project at Studio 8**, with new fictional
people Luz, Ben and Ari. It replaces the proposed Toronto/student-profile and
hotel/reception content in response to the author's explicit anti-recycling
correction. Follow the updated paired-review identity rules in
`CANONICAL-STYLE.md`; every lesson and review keeps its own single exercise lane.
The review consolidates existing Units 1-2 language and uses two original
photographic assets recorded in `A1/Images/Review/ASSETS.md`. It has no new audio
dependency. The pre-rebuild main state is preserved
at `horizons-before-review-rebuild-2026-10-07` for rollback. The preceding
Personal Best-like review is independently preserved at
`horizons-before-review-identity-2026-10-08`.
The version before BEYOND HORIZONS is preserved at
`horizons-before-beyond-review-2026-10-08`.

## Rich color correction

The 2026-10-08 color correction restores rich feature color across the current
A1 book. Use the shared saturated feature tokens rather than a default pastel
palette. The review uses strong table headers, the teal-and-gold
Color Project masthead and saturated BEYOND HORIZONS circles. Unit features
use richer local accents; Rivera Restaurant has a green title band. Keep the
approved page identity, lesson text, images, type size, spacing and white writing
areas. Subordinate pale grammar bodies remain useful for reading.
The preceding color treatment is preserved at
`horizons-before-color-restoration-2026-10-08`.

## Current Lesson 3A

`A1/Lessons/3A.html` and `lesson-3a-local.css` introduce daily routines and
affirmative present simple on printed pages 23-24, after the paired-unit review.
The original A1 adaptation of Messi's September 2023 OLGA interview is dated
explicitly and uses a licensed real photograph. The eight routine pictures
are an original photographic contact sheet, with full backgrounds and live
letter labels. See `A1/Images/3A/ASSETS.md` for sources and licensing.
Discovery precedes the shared grammar clarification, then controlled practice,
listening, personal writing and partner reporting. Questions with do/does,
negatives and frequency adverbs remain for the later syllabus lessons.
Tracks 3.1-3.3 use Jessica for narration, with Adeline/Nina and Jarnathan/Omar
in the fictional listening. Exact scripts/casting/checks and the answer key
are in the A1 folders. The pre-3A book is preserved at
`horizons-before-lesson-3a-2026-10-08`.

## A1 Lesson 3B draft

`3B.html` / `lesson-3b-local.css` add printed pages 25–26. The days strip introduces vocabulary with the shared NEW WORDS cue. HORIZONS ON AIR — Three people. Three weeks. uses original fictional guests in Valencia, Osaka and Abu Dhabi, with the UAE federal schedule verified separately. Listening for gist/details leads to printed discovery evidence, negatives/do-does clarification, controlled practice, a personal survey and a lunch-planning outcome. The author's 2026-10-10 revision replaces the repeated masthead/portrait-strip/table composition with an open radio title, staggered real stock photographs and serif adapted speech with embedded response gaps. The grammar shell stays canonical but its examples use a three-column progression. See the current asset manifest for Pexels photographers, license URLs, camera dates and the fictional-role distinction; the generated contact sheet is no longer used. Jessica narrates 3.4 and hosts 3.5; Amy/Lucía, Mark Natural/Ken and Juniper/Maryam use the approved voice pool. The listening gaps and target forms retain the existing audio. See the 3B answer key, image provenance and production record. The pre-3B book is preserved at `horizons-before-lesson-3b-2026-10-10`, and the first 3B layout at `horizons-before-3b-editorial-revision-2026-10-10`.

The later author corrections supersede that first editorial treatment: 3B now
uses 2B's established crimson Horizons on Air masthead and white waveform,
with a petrol area holding three photographic guest transcripts. Its activity
4 uses complete sentence choices instead of abstract grammatical labels. The
current canonical style and lesson masters are authoritative.

## A1 Lesson 3C draft (2026-10-12)

`3C.html` / `lesson-3c-local.css` add printed pages 27-28: **Where do you go?**
The syllabus's Google Maps review context becomes an asymmetric real-photo
collection beside an original practice-review feed. The photos retain their
environmental backgrounds; photographer/source/license records are in
`A1/Images/3C/`. The fictional names, ratings and price labels are teaching
data, not public Google reviews or claims about the photographed businesses.
Adjectives are introduced in context with NEW WORDS, then recycled from 2D's
adjective location. A short conversation and complete-sentence choices guide
discovery of where, when, who ... with and what time. The shared grammar shell
precedes controlled practice, an actual A/B information gap and a personal
review. No frequency adverbs or after/before sequencing is introduced.
The Extra Practice footer remains in the established lane. Tracks 3.6/3.7
use Jessica for announcements/vocabulary, Adeline/Mia and Mark Casual/Ravi.
See the answer key and `3C-production.json`. Rollback checkpoint:
`horizons-before-lesson-3c-2026-10-12`.

## A1 Lesson 3D completed (2026-10-13)

### Unit 3 layout-variety preview (2026-10-13)

The author's four Personal Best Unit 3 examples motivate a reversible recomposition of 3A–3D, preserving every lesson's learner wording, grammar, exercise order, answer space and recordings. The subsequent correction restores purposeful source backgrounds and text panels. 3A uses a navy/gold title band, familiar sans-serif body on a pale article surface and a right-hand full-background Messi photograph. 3B keeps Horizons on Air and alternates larger guest photographs with full name strips and transcript panels; its generated cutout sits within the lunch-planning dialogue backing. 3C uses a blue feature header, a shared photo surface and three white review panels with colored name bands. 3D uses rich green/orange challenge and tracker panels and the clear white post box with a green heading; the experimental paper overlay is retained as an unused asset. Shared grammar shells, NEW WORDS, Go to references and Extra Practice remain intact. Use stock and imagegen according to task needs, preserving context and clear writing space. Check all eight pages together. Original checkpoint: `horizons-before-unit3-layout-2026-10-13`; first preview: `horizons-unit3-first-layout-preview-2026-10-13`; preview branch: `codex/horizons-unit3-layout`.

`3D.html` occupies printed pages 29–30, with the syllabus title My week in order. It leads from a compact six-photo routine task into Zoe's fictional #MyWeek challenge and a seven-day record. Frequency adverbs precede main verbs and follow be; before/after are discovered from a visible morning sequence and modeled with noun phrases and familiar finite clauses. Controlled practice leads to a personal weekly plan and a four-line post. Students choose three of the six routines for their personal plan. It includes NEW WORDS cues, all three relevant Go to references, and Extra Practice. Photography is real and licensed; the corrected walking photograph is front-facing and action-led. No social-media account or actual publication is required. Jessica announces both tracks (3.8/3.9); Juniper voices Zoe's post. Answer key, source manifest and production records are included. The previous 24 book pages remain intact. Rollback checkpoints: `horizons-before-lesson-3d-2026-10-12` and `main-before-horizons-3d-2026-10-12`.

## Remaining A1 readings recorded (2026-10-10)

The previously unrecorded 1D hotel conversation is track 1.12, with Jessica announcing the track, Juniper as Lisa and Adeline as Emma. The 2C Rivera family reading is track 2.6, read by Jessica. Their scripts, completed MP3s and production records are in the A1 audio folders. The telephone number is spoken digit by digit and the email address uses "dot" and "at". All existing numbered listening tracks are now present; the Units 1 & 2 Review has no listening task requiring a recording. Production records retain the transcript normalization used for proper names. Neither script contains the forbidden clarity tag.

## CSS loading boundary

`Base/shell/a4-shell.css` imports only shared Base components. It must never import a level- or lesson-specific stylesheet.

Each lesson HTML links its own adjacent local stylesheet. This prevents the shared shell from becoming a hidden override registry and lets future books use the same Base cleanly.

## Local Student's Book boundary

The A1 `Student's Book.html` is a **generated standalone file**. It must display correctly when opened directly through `file://` without embedding lesson files in iframes, fetching sibling local files, using cross-frame DOM access or requiring a local server.

`../build/build-students-book.mjs` scans `../../A1/Lessons/` for definitive lesson masters, sorts them naturally, resolves/inlines required CSS, and writes the assembled HTML book. The repository workflow `.github/workflows/build-horizons-a1-student-book.yml` runs automatically when lesson/shared production sources change.

Do not reintroduce a manual lesson manifest. A correctly named lesson master is sufficient for discovery.

The local browser does **not** build the PDF. The workflow generates `../../A1/Student's Book.pdf` from the compiled HTML using the shared A4 print contract, optimizes it, verifies A4 size and exact `.hz-page` parity, and commits it beside the HTML. The floating download button in the HTML is only a local link to that validated sibling PDF.

Do not reintroduce client-side PDF generation with canvas, SVG `foreignObject`, `html2canvas`, `jsPDF`, iframe cloning or browser Print/Save as PDF. Those approaches conflict with reliable `file://` operation and are outside the Student's Book boundary.

### PDF typography/render parity

The production PDF must preserve the typography and layout of the approved HTML as closely as possible. A CSS stack containing `system-ui` is environment-sensitive, so rendering on a different operating system can change font families, weight interpolation, metrics, wrapping and spacing even when the CSS is identical.

For the current A1 pipeline, render the PDF in a Windows Chrome environment compatible with the author's normal Windows browser environment. The renderer must wait for `document.fonts.ready`, image decoding and layout stabilization before capture. Keep true A4 output at 100% scale with print backgrounds and CSS page size honored.

If a future book moves to an explicitly bundled cross-platform font family, the runner may change only after HTML/PDF parity is revalidated. Do not compensate for font-environment drift by locally changing lesson font sizes or weights.

## Repository boundary

- series-wide design rules/components → `Horizons/Base/design-system/`;
- shared page shell → `Horizons/Base/shell/`;
- shared book compiler → `Horizons/Base/build/`;
- book-specific lessons, assets, audio, tests, keys and other resources → that book's folder, such as `Horizons/A1/`;
- lesson-specific CSS → beside its lesson in the book's `Lessons/` folder.

Do not create `production/`, `staging/` or override directories.

## Hard production checks

Across Horizons books:

- numbered exercises stay in one vertical lane;
- shared chrome is not patched differently per lesson;
- important learner text is not shrunk merely to force page fit;
- visual worlds follow lesson content rather than a generic school theme;
- no decorative ghost text or generic card/pill system;
- real-world UI is recognizable and functional rather than generically decorative;
- artificial content-height floors do not trap dead space;
- removed scaffolding is not silently replaced by new answer mechanics;
- reusable rules stay in Base and one-off decisions stay book-local.

For A1 specifically, also enforce the cumulative early-A1 language rule in `GUIDED-DISCOVERY.md`.

Before calling a spread complete, verify source fidelity, exercise order, level-appropriate language load, Guided Discovery evidence, readable type, content economy, functional artifacts, repeated-media crop/centering, natural content height, short-label wrapping, shared chrome, whitespace, content-led imagery and parity with surrounding lessons.

## Current A1 audit

Use [BOOK-AUDIT.md](../../A1/BOOK-AUDIT.md) for current coverage, outstanding checks and the reusable spread checklist. [book-audit.json](../../A1/book-audit.json) binds the evidence to the audited source/media/PDF fingerprints. Check freshness from the repository root with `python Horizons/Base/build/check-book-audit.py Horizons/A1`.

The existing preview extends through 4D: 34 A4 pages, 17 masters and 121 numbered activity blocks. 4B is a reading-led vegan-food taste test with two verified tracks and a substantial continuation-page photograph; its current seven activities and source/answer boundaries are documented in the 4B key. 4C uses a photographic beginner recipe to teach four cooking verbs and quantity language, with six activities, two verified tracks, an exact-count scene and a tall transparent cook cutout on the continuation page; the key clarifies recipe quantities, countability and the meaning of enough. The corrected 4A readability direction is adopted across the existing explanation panels, using standard lesson typography and selective crimson emphasis inside the established shells. See the canonical style, component contracts and [teacher notes](../../A1/Answer%20keys/Concept-readability-notes.md).

Back-of-book pagination and final release review remain pending. Unit 1 and Review continuation-page imagery still need explicit review against the newer preference; do not extend the Units 2-3/4A-4D pass to unaudited pages. Historical per-change audit reports and branch narratives have been consolidated into the current audit; Git retains their evidence.

**Saved-PDF production caution:** Reopen the exported file and inspect lesson-code numerals as well as learner text. Image rewriting/aggressive resource deduplication previously removed continuation-tab digits despite a correct in-memory render. Optimize print-media resolution inside the browser, retain source assets, and verify saved pages against their direct exports. An in-memory check alone is insufficient.

## Unit 3 creative revision — 24 October 2026

The author approved the English File-inspired audit additions and requested their application to Unit 3. Use the canonical Creative concept and task variety section, and the unit editorial record in BOOK-AUDIT.md. Unit 3 retains its source contexts and nine recordings while its tasks now lead to anonymous author recognition (3A), speaker recognition and episode scheduling (3B), evidence-based place recommendations (3C), and a photographed sequence plus a seven-day personal writing follow-up (3D). 3D removes one repetitive controlled activity, leaving 30 Unit 3 activities / 116 book activities at that historical snapshot; the latest book count above supersedes it. Keep the purposeful source backgrounds and canonical grammar shells; illustration is not a replacement for real photography. The new specific three-frame fictional scene uses built-in imagegen and the manifest stores its prompt/hash. All eight saved pages and revised keys were checked; every page outside Unit 3 is pixel/text identical to the pre-revision book. Exact rollback copies and a guarded restore helper are at `../unit3-creative-20261024` relative to the repository directory. The main PDF, through-4C output, Unit 3 preview and four standalone lesson exports are refreshed. Final release blockers remain in the audit.

## Units 2 and 4 creative revision — 24 October 2026

The same approved creativity criteria now cover all eight Unit 2 pages and the six existing Unit 4 pages through 4C. That revision stopped at 4C; the subsequent 4D addition is recorded below. Seven keys are current. Unit 2 develops missing-item retrieval, a next-bus decision, family relationship clues and exact lost-item claims. Unit 4 uses deliberate picnic contradictions, contrasting food reactions and a class preference poll, then exact photographic recipe amounts with a private ingredient plan. Preserve the full 2A bag photo, Rivera source surfaces, 2B radio branding, 2D clipboard/paint daubs and all existing grammar HTML. Two new built-in imagegen scenes have exact prompts/hashes in Images/Units2-4-creative-assets.json. All fourteen saved pages, standalone geometry and revised keys were checked; the eighteen pages outside these units, every MP3/script and all prior image binaries are unchanged. Exact rollback copies and the guarded restore helper are in ../units2-4-creative-20261024 relative to the repository directory. The current book, unit PDFs and seven individual lesson PDFs are refreshed. BOOK-AUDIT.md / book-audit.json remain the current evidence entry points.


## Lesson 4D addition - 24 October 2026

Food for everyone! is a writing-led lesson built around the usability of a food-sharing post. Seven activities teach three word chunks, because/so and punctuation, then lead to an independently written offer and peer reply. Two generated realistic photographs, including a substantial second-page bread handover, support the situation. Two new tracks (4.7/4.8) use Jessica narration and the existing Nora/Adeline assignment. Final recordings decode and match normalized transcripts; no separate subjective listening review. All 32 prior saved pages are pixel/text identical, and prior lesson masters/images/34 MP3s are unchanged. Updated standalone lesson, eight-page Unit 4 and full book through 4D previews are in the task outputs. Audit/key/source boundaries are current. Exact before-copies, saved-PDF/geometry evidence, generation prompts and guarded rollback are in ../lesson4d relative to the repository. Back-of-book pagination and final whole-book release remain pending.


## Unit 4 visual-variety revision - 24 October 2026

The author rejected the similarity across lessons. All eight Unit 4 pages now use distinct editorial structures: alternating breakfast travel entries (4A), a burger-led taste-test cover and three opinion columns (4B), a four-frame recipe sheet with first-page rule plus a tall native-alpha cook (4C), and a note/phone source followed by side-by-side composition (4D). Keep all canonical navigation, body typography, word banks, answer choices and focus shells. The style guide's Unit-level visual variety section is now the explicit cross-book precedent; do not repeat these four solutions as later templates. All 28 activities, twelve recorded paragraphs, nineteen focus bodies book-wide, thirty-six MP3s and prior image binaries are preserved. All eight saved pages were inspected; the twenty-six pages outside Unit 4 are pixel/text identical to the current-before book. Six PDF exports, four keys/manifests and the current audit are refreshed. Before-copies and guarded rollback are at ../unit4-variety-20261024 relative to the repository. Current evidence supersedes earlier Unit 4 presentation checks; audio production boundaries and final-release blockers remain as recorded.


## HTML audio controls - 24 October 2026

The full-book and standalone HTML views now enhance 39 printed audio badges with small play/pause controls. Shared viewer JS/CSS live in Base/viewer; A4 imports the CSS, lesson heads load the deferred script, and the book builder uses a single relative script/audio-base reference. This supports GitHub Pages repository subpaths and local files. One audio element prevents competing tracks; repeated labels share state, with keyboard control and error/retry feedback. The two 1B 1.8 badges map to separate files via data-audio-file. All 35 referenced recordings resolve. Runtime checks passed over local HTTP at a /Brighton/ prefix and a direct local lesson; live GitHub Pages publication was not performed. All 34 print pages retain their text, imagery bounds and styles within 0.02px comparison tolerance; hidden-control sample screenshots match. The existing PDF, all recordings and all visual content are unchanged. See the component contract and current audit. Exact before-copies and guarded restore are in ../html-audio-20261024 relative to the repository.

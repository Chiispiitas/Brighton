# Horizons A1 — Book audit

Updated 25 October 2026. **Preview verified through 4D; final book release pending.**

This is the current audit entry point. [book-audit.json](book-audit.json) holds scoped evidence and historical checks; [CANONICAL-STYLE.md](../Base/design-system/CANONICAL-STYLE.md) governs design. A current snapshot is not final release approval.

## Current coverage

| Item | Current state |
| --- | --- |
| Content | 1A–3D, Units 1 & 2 Review, 4A–4D: 17 masters |
| Saved book | 34 A4 pages; printed pages 5–38 |
| Activity blocks | 121; existing subexercise numbering retained |
| Audio | 36 MP3 files; 34 previous recordings preserved, two new 4D tracks verified |
| Navigation cues | 21 NEW WORDS badges, 16 Extra Practice footers, 38 Go to references |
| Concept explanations | 14 revised panels across 11 lessons; 19 total focus panels including retained 4A and new 4B–4D |
| Unresolved destinations | 38 `page ---` references; intentional until back-of-book pagination |

Counts are inventory, not proof that every cue is correctly placed. Review placement beside the newly introduced content.

## Verified evidence and its limits

- **Book-wide functional typography, 25 October:** all 19 grammar/skills panels use 9.5pt for explanations, model phrases, concept headings and corrections, with 8pt header strips. All main instructions use 8.9pt, marked ordinary tasks and vocabulary labels 9.5pt, word banks 9pt and Extra Practice prompts 8pt. The same computed sizes pass in all 17 standalone masters and the 34-page book. All page text is preserved; only role classes were added to lesson markup. 787 functional text nodes changed size, while the other 1,603 measured nodes retain their sizes, including integrated reading features and scene dialogues. No activities, writing lines or media were removed. Nonessential gaps in 1D, 2C and Review were adjusted to retain page clearance. All 34 HTML pages fit, and no task/concept text is clipped by an ancestor. Reopened 34-page A4 PDF text and visual review are recorded in `work/type-consistency-20261024`; the live HTML viewer passes the same shared-size checks, and GitHub’s successful rebuild has been reopened and checked: all 19 PDF panels contain the same 9.5pt type (9.49pt after browser export rounding), with all 34 pages’ text preserved. These typography changes supersede earlier font-size/layout measurements where affected, without superseding content/audio evidence.

- **HTML-only audio controls, 24 October:** 39 badges now play/pause the correct 35 referenced files in the full-book and standalone views, including both distinct 1B 1.8 recordings. Playback, pause, keyboard input, track switching, repeated-badge synchronization, completion and missing-file retry passed. No autoplay/preload; the single player is created on demand. Relative paths resolve under a local HTTP `/Brighton/` prefix and direct local-file playback was checked. This was initially a local-only check; the complete book and working playback were subsequently published and verified on GitHub Pages on 24 October. The new typography revision receives its own deployment check.
- **Print preservation for the controls:** all 34 pages retain their printed text, image/element geometry and computed styles within 0.02px comparison tolerance. Hiding/removing controls on sample pages 5 and 37 produces identical screenshot pixels. All HTML pages still fit on screen. The existing saved PDF, all 36 MP3s, images, scripts, keys and wordlists are byte-for-byte unchanged. Viewer changes do not supersede Unit 4's saved-PDF design evidence below. Exact before-copies and guarded restore are in `work/html-audio-20261024`.

- **Current Unit 4 revision:** all eight pages, printed 31–38, have distinct content-led compositions. 4A uses alternating breakfast travel entries; 4B has a photo-led cover and three opinion columns; 4C uses a recipe strip, with its rule after discovery on page one and a tall cook on page two; 4D uses a note/phone comparison and an open composing surface. The canonical style now explicitly requires reviewing neighboring spreads together. Functional backgrounds, standard typography, crimson navigation and concept shells are retained.
- **Saved PDF:** the reopened book has 34 A4 pages. All eight revised pages match their direct export; the other 26 pages are pixel/text identical to the exact pre-revision book. The four standalone lessons match the assembled text geometry and saved exports. Every revised saved page was visually inspected, including lesson-code numerals, photo crops, source-note clearance, writing lines, references and footers.
- **Fit and readability:** all 34 HTML pages fit and every image/CSS background loads. All 19 focus-body HTML fragments are unchanged. The five scoped panels use ordinary 9.5pt body typography, canonical padding and 14.22px bottom clearance against 13.23px padding. Native word-bank colours and italic normal-weight options are preserved. No text collides with continuation tabs. Only four inherited Lesson/code font-line rectangles intersect; saved glyphs remain visibly separate.
- **Tasks and sources:** all 28 Unit 4 activities and controlled answers remain. Twelve recorded-source paragraphs and recipe-caption meaning match the earlier book. Four keys and manifests now describe the current composition. The picture/text evidence remains intact: both breakfast sources, three taste opinions, two deliberate picnic errors, exact 1 / 5 / 2 tomatoes and Nora's original post. The generated cook is an anonymous planning prompt, not an interview subject or exact quantity model. A/C remain language lessons, B reading/listening and D writing.
- **Continuation imagery and writing:** every Unit 4 second page retains substantial task-related imagery. The picnic and reaction scenes are larger; 4C has both the count family and an 88mm-tall native-alpha cook; 4D keeps the full bread-sharing scene beside eight open writing lines. Face/hand/action crops, the four recipe actions and alpha on white were inspected. The recipe Extra Practice remains “Write a recipe for a dish you like.”
- **Media preservation:** all 36 MP3s, every script/production record and every prior image binary retain their pre-revision hashes. No new subjective listening review is claimed. One new built-in imagegen cutout supplies the specific cook pose; its prompt, native alpha, hash and fictional boundaries are recorded in the current 4C manifest and `Images/Unit4-visual-variety-assets.json`. The replaced stock image remains available in the repo.
- **Other units:** Unit 2 and the approved Unit 3 retain their earlier scoped audit evidence and are unchanged in this revision. Unit 1 and Review have not received the newer continuation-imagery audit; they must not inherit a pass from Unit 4. The current revision does not claim a book-wide release review.
- **Reversibility:** exact current-before source/output copies, source hashes and saved-PDF/geometry evidence are in `work/unit4-variety-20261024` outside the repository. Its guarded restore helper refuses to overwrite subsequent work. Earlier revisions remain recoverable from their own backups, subject to the same guards.

Older 4B/4C/4D presentation checks and the prior Units 2/4 revision are historical where Unit 4's composition changed; audio/source-production evidence retains its original scope. The JSON names the superseding check explicitly.

## Remaining work

- [ ] Build and paginate the back-of-book material, replace all `page ---` destinations, and verify each link/reference.
- [ ] Explicitly audit Unit 1 and Review continuation-page imagery against the newer preference. Units 2–3 and 4A–4D have scoped evidence; earlier pages must not inherit that pass automatically. Count substantial CSS-background photos as imagery; tiny badges do not count.
- [ ] Run a final whole-book source/key/audio/layout review after content and pagination are complete, then inspect the reopened final PDF before release.

## Reusable acceptance checks

Use these for every new or changed spread; they are a checklist, not additional completed passes.

- **Learning:** follow the syllabus and cumulative A1 load; A/C teach language, B develops reading/listening, D writing/speaking. Discovery evidence must precede the rule. Controlled answers must be supported by the page and agree with the key. Pair work needs unknown information; final writing needs room for independent expression.
- **Composition:** keep Horizons identity while varying editorial structure with content. Use 1A spacing as the reference. Preserve purposeful source backgrounds. Give each lesson's second page one or two substantial task-related images; remove repetition when space is needed. Use stock photos for suitable real scenes and image generation for exact poses, counts, renders or cutouts.
- **Readability:** verify the canonical font-size role table across the assembled and standalone pages; integrated source features may retain purposeful typography. Use 9.5pt model phrases/rules, selective crimson target emphasis and the canonical pink grammar shell. Keep inner padding, response space, readable labels and continuation-tab clearance. Circle choices use normal-weight lowercase italics except required grammatical capitals. No redundant gray location captions.
- **Navigation:** NEW WORDS at new vocabulary input, nearby Vocabulary/Grammar references for newly introduced sets/points, and the expected Extra Practice footer. Confirm actual placement, not just totals.
- **Media:** preserve answer-bearing details and correct crops; verify source/license metadata, native transparency and clean writing space. Narration uses Jessica and the approved voice pool. Never use the `[clearly]` tag. Check scripts, track references, decoding, transcripts and recording hashes when affected.
- **Print:** check HTML fit and loaded media, then reopen the saved A4 PDF. Inspect full pages and close crops, including lesson-code numerals. Compare unchanged pages and changed-page direct exports. Do not use saved-PDF image/font rewriting or aggressive resource deduplication: this previously removed continuation-tab digits. Optimize print media before browser export while retaining original assets.

## Creative concept and task variety

Apply the [canonical creativity checks](../Base/design-system/CANONICAL-STYLE.md#creative-concept-and-task-variety) alongside the acceptance checks above. A technical pass alone cannot approve an interchangeable or uninteresting lesson. Judge these across a unit, without requiring a gimmick in every exercise.

- [ ] **Hook:** What question, prediction, problem or decision makes the main feature worth exploring?
- [ ] **Visual evidence:** What must learners inspect in the pictures to answer selected tasks? Explicitly document any intentional picture/text contradiction.
- [ ] **Human interest:** Would a small surprise, different priorities or recognisable inconvenience improve this situation? Humour is optional.
- [ ] **Continuity:** In any sequence, do identities and props stay consistent while the action changes?
- [ ] **Vocabulary use:** Does selected vocabulary lead beyond naming/matching into retrieval, inference, search or choice?
- [ ] **Specificity:** Which credible details give the asset or setting its identity? Are real-person and real-business claims supported?
- [ ] **Artifact character:** Does each document have a purpose and recognizable visual character of its own?
- [ ] **Graphic meaning:** Do colour, motifs and lettering communicate something while preserving functional book styles?
- [ ] **Task variety:** Are the main learner actions varied across neighbouring lessons?
- [ ] **Personal payoff:** What is decided, discovered or created through the exchange? Is unknown information genuinely unavailable beforehand?
- [ ] **Transfer:** Does the final task or Extra Practice create/test something useful with taught language?
- [ ] **Memory test:** Can the lesson be described by its idea rather than its colour or box style?

### Current Unit 4 editorial record — visual-variety revision

| Lesson | Distinct source/composition | Learner payoff |
| --- | --- | --- |
| 4A | Two alternating travel entries with full-background breakfast photos; larger picnic evidence | Identify foods, infer countability, correct two picnic claims and plan breakfast |
| 4B | Large burger cover beside introduction; three parallel opinions; larger reaction photo with speech bubbles | Compare tastes and refer to food/people with object pronouns; find a shared class preference |
| 4C | Four chronological recipe frames on a recipe sheet; first-page discovery/rule; open planning with a tall cook | Read instructions, judge exact recipe amounts and plan ingredients from private information |
| 4D | Yellow note versus purple phone; photograph/planning beside an eight-line post | Write a useful offer with because/so and punctuation, then receive a real peer reply |

These are four different relationships between content, imagery and response, not four colour variants of one template. The printed teaching language and all eight Unit 4 recordings are preserved. The cook is the only new image asset in this revision.

### Retained Unit 2 editorial record

| Lesson | Hook / main action | Visual role | Payoff |
| --- | --- | --- | --- |
| 2A | Five real items become four; identify the missing one | Full bag scene prompts known items; near/far pictures retain spatial evidence | Retrieve and reveal with this/these |
| 2B | At 6:40, which listed bus is next? | Earlier app screen supplies departure evidence | Record 7:30 / bus 8 and check a selected departure |
| 2C | Infer item owners from family relationships | Rivera family/tree plus pictured personal objects | Write possessive labels; share a private family photo |
| 2D | Match colour/size claims to exact item numbers | Preserved paired inventory and generated clipboard | Complete a claim record and identify real-item owners |

### Unit 3 editorial record — 24 October revision

| Lesson | Hook / main action | Visual role | Payoff |
| --- | --- | --- | --- |
| 3A | Predict a footballer's home time; recognise an anonymous routine | Real sourced portrait and action photographs; larger guest photographs for contrasting schedules | Guess the text's author, then report their routine using he/she |
| 3B | Recognise radio speakers; find a day none of the three guests works | Preserved workplace scenes and large conversational cutout | Choose Sunday from recorded schedules; agree a personal day/time for coffee |
| 3C | Match reviews, then recommend places for specific budgets/preferences | Place photographs plus explicit price strips provide selection evidence | Recommend a place to a classmate; write/read local reviews to choose a visit |
| 3D | Order three photographic moments and interpret a weekly record | New generated sequence preserves one fictional woman and breakfast details across changing actions | Write an independent post, select a routine to try, then revisit the post after seven days |

All eight revised saved pages were reviewed; the linked JSON holds scoped verification and preservation evidence. Exact pre-revision copies and a guarded rollback helper are saved in `work/unit3-creative-20261024` outside the repository.

This is a scoped editorial revision, not a claim that every lesson includes humour or a visual puzzle. 3A/3C remain language lessons, 3B adds substantive listening recognition and inference, and 3D culminates in personal writing. Existing source stories and nine recordings are retained; the exercise mechanisms, outcomes and selected visual integrations change. Earlier Unit 3 content/layout evidence is historical where those tasks have changed.

## Keep the audit current

Run from the repository root:

```text
python Horizons/Base/build/check-book-audit.py Horizons/A1
```

This read-only check compares fingerprints of lesson sources, media, scripts, keys, wordlists, shared rendering files, authoritative style/pedagogy rules and the saved PDF. A match means the evidence snapshot is fresh; it does **not** mean pending work has passed. A mismatch requires rechecking the affected material and its saved PDF before recording new fingerprints. Do not refresh hashes simply to clear a failure.

Keep this page and `book-audit.json` as the single current audit. Update affected checks in place with date, scope, method and limitations. Keep detailed voice/asset metadata in their production manifests. The four superseded reports are recoverable at Git commit `2f404b547b7da07be81a0622a78591d3299c402a`; their names are listed in the JSON evidence section. Their dated export counts and “pilot pending” statements are historical. The corrected 4A approach has been adopted across the existing explanations.

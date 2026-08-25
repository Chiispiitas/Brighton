# Horizons A1 — Design System Handoff

**Status: CURRENT / CANONICAL HANDOFF**

This file is the quickest way to resume Horizons A1 design work in a new ChatGPT conversation without relying on prior chat history.

## 1. Read this first

For any new Student's Book design work, use this order:

1. `HANDOFF.md` — current working rules and latest refinements
2. `CANONICAL-STYLE.md` — approved visual philosophy and lesson architecture
3. `GUIDED-DISCOVERY.md` — primary teaching methodology and real-situation task model
4. `STYLE-REFINEMENTS.md` — controlled repetition and micro-variety rules
5. `components.css` — core exercise and media mechanics
6. `editorial-layouts.css` — approved large-scale editorial compositions
7. `canonical-refinements.css` — latest canonical CSS refinements
8. `../examples/stage-3-shape-showcase.html` — primary visual benchmark
9. `../examples/stage-2-showcase.html` — supporting photo/overlay benchmark
10. `../examples/lesson-1a-canonical-prototype.html` — first source-faithful legacy lesson adapted into the canonical style

If any older experiment conflicts with these files, the files above take precedence.

## 2. Current desired style

The approved style is the Stage 3 Horizons direction: a contemporary, art-directed print coursebook using strong editorial composition rather than generic web UI.

Core traits:

- A4, print-first HTML/CSS master
- warm off-white paper
- mostly neutral black/gray typography
- one dominant unit color per normal lesson/page
- large, deliberate raster-photo areas
- strong crop decisions
- substantial white space
- oversized typography when compositionally useful
- simple large exercise numerals
- large CSS shapes used structurally, not as filler
- controlled overlap between photography, text and shapes
- magazine/poster/article treatments when pedagogically justified
- full-page or near-full-page readings where suitable
- straight edges and thin editorial rules by default
- rounded/shadowed surfaces mainly for simulated real-world UI
- almost no decorative gradients
- no generic card around every activity
- no pill around every label
- no decorative vector illustration
- SVG only for functional icons

The visual goal is **creative but controlled**. Pages should feel intentionally art-directed, not randomly varied.

## 3. Permanent exercise-flow rule

**All numbered exercises run in one vertical sequence and remain in the source numerical order.**

Never place sibling numbered exercises side by side.

Two- and three-column layouts are allowed only **inside one exercise body**, for example:

- questions
- options
- vocabulary
- image matching
- profiles
- tables
- reading columns
- photo/text compositions
- quizzes
- collages
- timelines
- forms

A single exercise can be highly creative internally. The next numbered exercise still starts underneath it.

## 4. Source-fidelity rule for adapting existing pages

When redesigning an existing frozen Student's Book lesson into the new format:

**Do not rewrite the educational content.**

Preserve exactly, unless the author explicitly asks for edits:

- lesson title
- lesson focus/objectives
- exercise numbers
- unusual numbering gaps
- exercise instructions
- questions
- answer options
- dialogue wording
- reading wording
- grammar examples
- vocabulary items
- capitalization shown in the source
- printed audio/track references
- form labels
- cross-references
- Extra Practice wording

Do not silently correct, modernize, renumber, simplify, expand or improve the source content during a visual adaptation.

The design may change substantially; the source educational content may not.

The current Lesson 1A prototype deliberately preserves the source jump from Exercise 7 to Exercise 9 because that is what the original page contains.

## 5. Frozen-source boundary

The existing source remains in `Horizons A1/` and is frozen unless the author explicitly requests a change.

In particular, do not overwrite or modify:

- `Horizons A1/Student's Book.pdf`
- `Horizons A1/Student's Book.docx`
- `Horizons A1/Syllabus.txt`
- existing pre-designed Student's Book pages

New prototypes and production adaptations belong in `Horizons/`.

The supplied syllabus remains immutable unless explicitly changed by the author.

## 6. Lesson length and architecture

- two A4 pages per lesson
- Lesson A → Lesson B → Lesson C → Lesson D → Unit Review
- Lesson A — Grammar and/or Vocabulary
- Lesson B — Reading/Listening with some Vocabulary
- Lesson C — Grammar and/or Vocabulary
- Lesson D — Speaking or Writing with a strong real-world outcome
- Vocabulary Practice and Grammar Reference/Practice remain back-of-book activity sections
- American English
- CEFR A1 while preserving the supplied syllabus

## 6A. Guided Discovery — primary methodology

**Guided Discovery is the central teaching method of Horizons and should shape every new lesson.**

Students should normally encounter target language in meaningful context before receiving an explicit rule. The lesson then asks direct, A1-friendly questions that guide students to examine form, meaning, word order or use.

Canonical learning direction:

**context → noticing → guided analysis → clarification → controlled practice → communicative use → transfer to a real situation**

Important consequences:

- contexts must contain usable evidence, not merely decorate the page;
- explicit discovery questions are expected, not optional;
- grammar/vocabulary explanations should usually confirm or organize what students have already analyzed;
- short exercises should form a connected learning sequence;
- pairwork can support both discovery and communication;
- students should ultimately use the language to accomplish something meaningful.

Do not turn Guided Discovery into unsupported guessing. Students need enough examples and guidance to infer the intended pattern.

### Lesson D real-situation rule

Lesson D should normally culminate in a believable **real-world situation, simulation or role-play**, not generic classroom production.

Students should have a role, a reason to communicate, information to exchange, a realistic artifact/interface to use, and a concrete outcome.

For Lesson 1D, **LET'S FILL A FORM!**, the intended model is not simply filling a worksheet. Students can create or choose a simple business/service such as a gym, hotel, language school or club. One student represents the business; another is the customer/guest/member. They ask for personal information and complete a realistic form with the information obtained from the classmate. The form is the product of the interaction.

See `GUIDED-DISCOVERY.md` for the full methodology, authoring test and additional examples.

## 7. Controlled repetition — important latest rule

When several items belong to the same exercise or visual family, they should normally share one silhouette and structural treatment.

**Consistency comes first; variety should happen inside the family.**

Good ways to create variety:

- color
- crop
- opacity
- scale
- type weight
- typographic contrast
- content hierarchy

Avoid changing shape, border logic, alignment and color all at once for repeated items.

Examples now considered canonical:

- a set of four greeting photos can all use circular crops
- a set of number markers can all use circles but use different vibrant colors
- three information exchanges in one exercise should use the same panel geometry
- alphabet pairs can use color intensity differences rather than different containers

This prevents excessive or distracting shape variety.

## 8. Lesson tab — canonical hierarchy

Everything inside `.hz-lesson-tab` must be centered.

Required hierarchy:

1. `.hz-lesson-tab__id` — largest and most visually dominant element
2. `.hz-lesson-tab__label` — small supporting label

The lesson ID (for example `1A`) must be the first thing the eye notices inside the tab.

This is implemented globally in `canonical-refinements.css` and loaded automatically by `../shell/a4-shell.css`.

## 9. Image-family rule

Do not create artificial variety by assigning a different silhouette to every image in the same exercise.

If four images serve the same function, first assume they should share the same crop family or frame geometry.

Change the geometry only when there is a content reason, such as:

- one image is a hero image and the others are details
- portrait versus environmental crop serves different pedagogy
- one image intentionally overlaps a reading or caption
- a simulated real-world interface requires its own shape

Otherwise, prefer a shared silhouette.

## 10. Image placeholders

During prototype work, final photography may remain as placeholders.

Placeholders should still encode the intended design decision:

- subject/type of image
- portrait / landscape / wide / detail crop
- whether text will overlay it
- whether it is part of a collage
- whether negative space is needed

The placeholder geometry should match the intended final photograph so replacing it later does not require redesigning the page.

Do not use generic decorative vector people or scenes as substitutes.

## 11. Alphabet treatment — approved micro-variety

For alphabet displays such as `Aa Bb Cc ...`:

- uppercase letter = full-strength unit color
- lowercase letter = a slightly faded/lighter version of the same hue
- both remain part of the same typographic pair
- no need to put every pair in a different shape

This is an example of the kind of subtle, meaningful variety the book should use.

## 12. Number treatment — approved repeated family

For a sequence such as 0–10:

- every digit marker uses the same circular silhouette
- circles may use different vibrant background colors
- digits remain white
- number words stay readable beneath the circles

Do not vary circles into squares, blobs, polygons or mixed geometries just to create novelty.

This is another canonical example of controlled repetition.

## 13. Creative direction

Creativity should come mainly from:

1. page-level composition
2. photography and crop
3. scale
4. typography
5. controlled overlap
6. large structural shapes
7. selective color
8. whitespace

Not from accumulating micro-components.

Approved large-scale vocabulary includes:

- feature sheets
- article mastheads
- full-page text fields
- multi-column readings inside one exercise
- overlapping hero photography
- lower-third photo bands
- collages
- pull quotes crossing photo edges
- question clouds
- quiz/questionnaire posters
- process/timeline strips
- folded-corner notes
- floor-plan/spatial compositions
- oversized background numerals or words

Use one or two strong structural ideas per feature rather than many unrelated shapes.

## 14. Cards, pills, shadows and gradients

Default answer: do not use them.

Use cards or rounded/shadowed containers mainly when the content genuinely represents a real-world interface, form, chat, review, app or similar UI.

A photographic gradient/scrim is allowed only when needed for text readability over an image.

Do not use decorative gradients as general page furniture.

## 15. Photography

Photography should carry substantial visual weight in final production.

Use:

- free licensed raster photography
- generated raster imagery when exact pedagogical composition is required
- local project assets rather than hotlinking

Prefer one strong hero image over several weak decorative images unless comparison/matching/sequence requires multiple images.

All external assets must comply with `asset-policy.md` and eventually be recorded with provenance/licensing.

## 16. Lesson 1A prototype — current practical benchmark

File:

`../examples/lesson-1a-canonical-prototype.html`

This is the first attempt to adapt a real frozen lesson into the approved Stage 3 style without changing its educational content.

Important design lessons from that prototype that now generalize to the whole book:

- source content can be preserved while composition changes substantially
- repeated greeting images should use a consistent circle family
- personal-information question/answer blocks in the same exercise must share one style
- alphabet pairs benefit from full-color uppercase + faded lowercase
- number sequences benefit from repeated circles with varied vibrant color
- the lesson tab must center its contents and make the lesson ID dominant

The prototype is a design benchmark, not authorization to modify the frozen source pages.

## 17. Primary reference priority

When unsure how a new page should look or how a lesson should work, use this order:

1. `HANDOFF.md`
2. `CANONICAL-STYLE.md`
3. `GUIDED-DISCOVERY.md`
4. `STYLE-REFINEMENTS.md`
5. `../examples/lesson-1a-canonical-prototype.html` for source-faithful lesson adaptation behavior
6. `../examples/stage-3-shape-showcase.html` for large-scale art direction
7. `../examples/stage-2-showcase.html` for photography/overlay treatments
8. `components.css`, `editorial-layouts.css`, `canonical-refinements.css`
9. locked syllabus and frozen source content
10. external references only for broad inspiration

When a visual idea conflicts with the Guided Discovery learning sequence, **the pedagogy wins**.

## 18. Do not revive discarded directions

Do not silently restore:

- the later Stage 4 publication-hardening visual direction that was explicitly rejected
- the internal legacy-structure reproduction layer that was reverted
- the old multicolor/rainbow dashboard-like system
- generic card-heavy or pill-heavy UI styling

The current canonical Stage 3 direction plus the latest refinements is the approved book style until the author explicitly changes it.

## 19. Current key files

```text
Horizons/design-system/
├── HANDOFF.md
├── CANONICAL-STYLE.md
├── GUIDED-DISCOVERY.md
├── STYLE-REFINEMENTS.md
├── README.md
├── tokens.css
├── components.css
├── editorial-layouts.css
├── canonical-refinements.css
├── component-contracts.md
└── asset-policy.md

Horizons/examples/
├── lesson-1a-canonical-prototype.html
├── stage-3-shape-showcase.html
├── stage-2-showcase.html
└── README.md

Horizons/shell/
├── a4-shell.css
├── print.css
├── page-template.html
└── README.md
```

## 20. Resume rule for a new chat

Before making a new lesson or redesigning an existing source lesson, read this handoff, the canonical style file and `GUIDED-DISCOVERY.md` first.

If adapting a frozen page, inspect the actual source page and reproduce its educational content exactly before applying the current visual system.

If authoring missing lesson content, build the learning sequence around contextualized language, explicit Guided Discovery questions, short practice, pairwork and meaningful real-world transfer.

**Design boldly; teach through discovery; edit source content only when explicitly authorized.**

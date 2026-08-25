# Horizons design system

This directory defines the visual language for the HTML/CSS master of **Horizons A1**.

## Canonical status

**The current Stage 3 design system is the approved canonical style for the Student's Book.**

Future design work should extend and refine this system rather than replace its visual philosophy without explicit author approval.

The normative design contract is documented in:

`CANONICAL-STYLE.md`

Primary visual reference:

`../examples/stage-3-shape-showcase.html`

Supporting media/overlay reference:

`../examples/stage-2-showcase.html`

## Design principle

Horizons should look **art-directed for print**, not assembled from generic UI components.

The system is not a transcription of the legacy Word/PDF book and is not a copy of any external coursebook reference. References may inform broad editorial ideas such as hierarchy, pacing, skill labels, photography, full-page reading features and activity density; Horizons must interpret those ideas independently.

## Editorial direction

- warm off-white A4 paper
- mostly neutral black/gray typography
- **one dominant unit color per unit/page**
- typography and photography provide most of the hierarchy
- straight edges, thin rules and open white space are the default
- noticeable rounding is reserved mainly for simulated real-world interfaces
- almost no decorative gradients
- no rainbow accent system on normal lesson pages
- no card around every activity
- no pill around every label
- large raster photography is preferred over decorative surfaces
- exercise numbers are simple large colored numerals
- grammar/pronunciation use restrained flat focus areas
- page compositions may be bespoke when the lesson content benefits from it
- full-page and near-full-page text features are encouraged when a reading deserves visual prominence
- large CSS shapes may structure a feature: circles, cut corners, color fields, folds, bands and speech bubbles
- system-native typography
- semantic HTML5
- CSS Grid/Flexbox for composition
- no vector illustrations; SVG remains limited to functional icons

## Shape-led editorial system

`editorial-layouts.css` extends the basic component library with large-scale composition primitives. These are intentionally closer to magazine/coursebook art direction than to dashboard UI.

Available patterns include:

- `.hz-feature-sheet` — large interview/profile reading with geometric background shapes, substantial text and image/pull-quote areas
- `.hz-article-panel` — strong full-width masthead, overlapping hero image and multi-column article text
- `.hz-week-stack` / `.hz-week-panel` — vertically labeled story/week sections with text and image crops
- `.hz-question-cloud` / `.hz-question-bubble` — interview or brainstorming prompts in controlled speech-bubble geometry
- `.hz-quiz-panel` — poster-like questionnaire with angled side field and anchored photograph
- `.hz-poster-stage` — large color-led feature with oversized typography and photo anchoring
- `.hz-process-strip` — horizontal steps/process/timeline treatment
- `.hz-shape-note` — folded-corner editorial note
- `.hz-text-columns--2/--3` — long-reading text columns

These patterns are loaded automatically by the A4 shell and are part of the approved book language.

## Shape rules

1. Shapes must support hierarchy, reading flow, grouping or task meaning.
2. Prefer one or two large structural shapes over many small decorative elements.
3. Do not use shapes merely to fill empty space.
4. Text can become a visual object through scale, placement and contrast.
5. A full-page reading may use one strong background field, one or two images and a multi-column text structure.
6. CSS geometry is permitted; vector illustration remains prohibited.
7. Photo crops and real raster imagery should still carry much of the visual character.

## Non-negotiable exercise layout

**Numbered exercises never form page columns.**

All numbered exercises run vertically in one `.hz-exercises` / `.hz-exercise-flow` lane and remain in numerical order.

Two- and three-column layouts are allowed only **inside an exercise body** for questions, choices, images, tables, reviews, profiles, vocabulary or other activity content.

A single exercise may therefore contain a full-page article, a poster, a question cloud or a complex internal composition; the next numbered exercise must still start below it.

## Human-art-direction rules

To avoid templated or AI-like sameness:

1. Do not wrap content in a card unless the content genuinely needs a container.
2. Do not use a decorative label when typography alone communicates the hierarchy.
3. Do not force every lesson to use the same composition; keep the exercise mechanics consistent while varying editorial arrangement.
4. Prefer one strong photograph over several decorative boxes.
5. Preserve deliberate white space rather than filling every available gap.
6. Use unit color as an editorial signal, not as continuous decoration.
7. Keep shadows for simulated interfaces only; ordinary book content should be flat.
8. Bespoke CSS is acceptable for distinctive lesson features and should not automatically become a global component.
9. Use large text, structural shapes and photography to create page identity instead of accumulating micro-components.
10. Do not replace this Stage 3 philosophy with a new system unless the author explicitly requests a redesign.

## Unit colors

`tokens.css` provides eight suggested unit identities through `.hz-unit-1` to `.hz-unit-8`. A normal page should inherit one of these and avoid mixing several unit colors.

## Files

- `CANONICAL-STYLE.md` — normative visual direction for all future Student's Book work
- `tokens.css` — neutral palette, unit colors, typography, spacing and geometry
- `components.css` — lesson identity, one-column exercise lane, internal question grids, focus areas, audio, UI recreations, tables, writing mechanics and photography overlays
- `editorial-layouts.css` — full-page text features, large shape compositions, quiz/poster layouts, question clouds and process strips
- `asset-policy.md` — visual asset rules
- `component-contracts.md` — semantic HTML/component expectations

## Locked project rules

- A4
- HTML/CSS is the definitive master
- two pages per lesson
- American English
- syllabus is immutable unless explicitly changed by the author
- pre-existing Student's Book pages are immutable unless explicitly changed by the author
- free image assets only
- raster photography/generated raster imagery for scenes
- no vector illustrations
- Stage 3 is the canonical visual baseline until explicitly superseded by the author

The shell and examples live in `../shell/` and `../examples/`.

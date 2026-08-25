# Horizons design system

This directory defines the visual and publication language for the HTML/CSS master of **Horizons A1**.

## Design principle

Horizons should look **art-directed for print**, not assembled from generic UI components.

The system is not a transcription of the legacy Word/PDF book and is not a copy of any external coursebook reference. References may inform broad editorial ideas such as hierarchy, pacing, skill labels, photography and activity density; Horizons must interpret those ideas independently.

## Editorial direction

- warm off-white A4 paper;
- mostly neutral black/gray typography;
- **one dominant unit color per unit/page**;
- typography and photography provide most of the hierarchy;
- straight edges, thin rules and open white space are the default;
- noticeable rounding is reserved mainly for simulated real-world interfaces;
- almost no decorative gradients;
- no rainbow accent system on normal lesson pages;
- no card around every activity;
- no pill around every label;
- large raster photography is preferred over decorative surfaces;
- exercise numbers are simple large colored numerals;
- grammar and pronunciation are deliberately differentiated;
- page compositions may be bespoke when the lesson content benefits from it;
- system-native typography;
- semantic HTML5;
- CSS Grid/Flexbox for composition;
- no vector illustrations; SVG remains limited to functional icons.

## Non-negotiable exercise layout

**Numbered exercises never form page columns.**

All numbered exercises run vertically in one `.hz-exercises` / `.hz-exercise-flow` lane and remain in numerical order.

Two- and three-column layouts are allowed only **inside an exercise body** for questions, choices, images, tables, reviews, profiles, vocabulary or other activity content.

## Two-page spread rule

A normal lesson is two A4 pages, but it should be **art-directed as one spread**.

Page 1 and Page 2 should respond to each other through contrast in image scale, reading density, language focus, white space and page-ending behavior. Avoid two visually identical pages.

Use `spreads.css` and the spread archetypes documented in `layout-archetypes.md`.

## Human-art-direction rules

1. Do not wrap content in a card unless the content genuinely needs a container.
2. Do not use a decorative label when typography alone communicates the hierarchy.
3. Do not force every lesson to use the same composition; keep exercise mechanics consistent while varying editorial arrangement.
4. Prefer one strong photograph over several decorative boxes.
5. Preserve deliberate white space rather than filling every available gap.
6. Use unit color as an editorial signal, not as continuous decoration.
7. Keep shadows for simulated interfaces only; ordinary book content should be flat.
8. Bespoke CSS is acceptable for distinctive lesson features and should not automatically become a global component.
9. Break the grid only with media/editorial matter; never distort answer mechanics or exercise numbers.
10. Full-bleed/frame-breaking media should be occasional and intentional.

## Typography system

`typography.css` adds publication-oriented hierarchy:

- display headlines and decks;
- reading measures;
- 2/3-column long-form reading;
- drop caps;
- pull quotes;
- statistics;
- highlighted vocabulary;
- caption hierarchy.

Long-form text should be readable at physical A4 size, not merely visually impressive on screen.

## Unit identities

`tokens.css` provides eight unit colors through `.hz-unit-1` to `.hz-unit-8`.

`unit-identities.css` adds optional, restrained unit-specific behaviors for feature areas:

- Unit 1: identity/registration marks;
- Unit 2: object/tag geometry;
- Unit 3: timeline/time marks;
- Unit 4: food/ingredient marks;
- Unit 5: editorial seam/crop behavior;
- Unit 6: plan/blueprint grid;
- Unit 7: archival rules;
- Unit 8: travel-route line.

These motifs are optional and must not become repetitive page decoration.

## Lesson archetypes and density

`archetypes.css` / `layout-archetypes.md` define:

- standard language;
- photo-led vocabulary;
- reading feature;
- interview/profile;
- quiz/questionnaire;
- real-world interface;
- process/timeline;
- collage/editorial.

Density presets:

- `.hz-density-light`
- `.hz-density-medium`
- `.hz-density-dense`

## Grammar and pronunciation

Use distinct variants:

- `.hz-focus-box--grammar`
- `.hz-focus-box--pronunciation`

Pronunciation may use stress marking and sound treatments while Grammar remains more structural/table-driven.

## Functional icons

Functional SVG icons live in:

`../assets/icons/horizons-icons.svg`

They cover audio, reading, writing, speaking, pair/group work, video/watch, vocabulary, pronunciation, maps, phone, QR, star and arrow signals.

They are interface symbols, not illustrations.

## Unit Review

`review.css` gives Unit Reviews their own denser identity:

- A–D lesson consolidation map;
- review sections;
- score/readiness areas;
- final challenge treatment.

Unit Review pages should feel more systematic than normal lessons.

## Back matter

`backmatter.css` provides denser systems for:

- Vocabulary Practice;
- Grammar Reference;
- photo vocabulary grids;
- grammar formulas/tables;
- cross-references.

Back matter should feel related to Horizons while prioritizing reference efficiency over feature-page creativity.

## Photography

See `image-direction.md` and `asset-policy.md`.

Development placeholders must state crop intent. Production photography should target 300 ppi effective resolution where practical and must have provenance/license information recorded.

## Accessibility and digital reuse

`accessibility.css` provides visually-hidden text, keyboard-focus behavior and print/digital control hooks. Production HTML should use meaningful semantic elements and alt text so the master remains reusable for future digital exercises.

## QA

`qa.css` provides optional development overlays.

The `../qa/` directory contains:

- `page-audit.js` — browser-side checks for overflow, exercise flow, IDs, alt text, placeholders and QR size;
- `validate-content.mjs` — dependency-free structured-content validation;
- `print-qa-checklist.md` — human publication review;
- `README.md` — QA usage.

## Implementation contracts

- `component-contracts.md` — component-level HTML patterns;
- `publication-contracts.md` — spread, density, bleed, icon, asset, content and QA rules.

## Files

- `tokens.css` — neutral palette, unit colors, typography tokens, spacing and geometry
- `components.css` — core lesson identity, one-column exercise lane, internal question grids, focus areas, audio, UI recreations, tables and writing mechanics
- `typography.css` — editorial reading/type hierarchy
- `accessibility.css` — semantic/digital reuse helpers
- `editorial-layouts.css` — large reading, poster, quiz, process and shape-led compositions
- `spreads.css` — two-page spread behavior, frame breaking and controlled bleed utilities
- `archetypes.css` — density, archetype hooks, focus variants and page endings
- `unit-identities.css` — optional unit-specific feature motifs
- `icons.css` — functional SVG icon sizing/labels
- `review.css` — Unit Review layouts
- `backmatter.css` — Vocabulary Practice and Grammar Reference layouts
- `qa.css` — development-only layout diagnostics
- `asset-policy.md` — asset/audio/QR rules
- `image-direction.md` — photography/crop art direction
- `layout-archetypes.md` — lesson/spread archetype guidance
- `component-contracts.md` — semantic HTML/component expectations
- `publication-contracts.md` — production-level contracts

## Locked project rules

- A4;
- HTML/CSS is the definitive master;
- two pages per lesson;
- American English;
- syllabus is immutable unless explicitly changed by the author;
- pre-existing Student's Book pages are immutable unless explicitly changed by the author;
- free image assets only;
- raster photography/generated raster imagery for scenes;
- no vector illustrations.

The shell and examples live in `../shell/` and `../examples/`.

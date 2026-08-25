# Horizons design system

This directory defines the visual language for the HTML/CSS master of **Horizons A1**.

## Design principle

Horizons should look **art-directed for print**, not assembled from generic UI components.

The system is not a transcription of the legacy Word/PDF book and is not a copy of any external coursebook reference. References may inform broad editorial ideas such as hierarchy, pacing, skill labels, photography and activity density; Horizons must interpret those ideas independently.

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
- system-native typography
- semantic HTML5
- CSS Grid/Flexbox for composition
- no vector illustrations; SVG remains limited to functional icons

## Non-negotiable exercise layout

**Numbered exercises never form page columns.**

All numbered exercises run vertically in one `.hz-exercises` / `.hz-exercise-flow` lane and remain in numerical order.

Two- and three-column layouts are allowed only **inside an exercise body** for questions, choices, images, tables, reviews, profiles, vocabulary or other activity content.

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

## Unit colors

`tokens.css` provides eight suggested unit identities through `.hz-unit-1` to `.hz-unit-8`. A normal page should inherit one of these and avoid mixing several unit colors.

## Files

- `tokens.css` — neutral palette, unit colors, typography, spacing and geometry
- `components.css` — lesson identity, one-column exercise lane, internal question grids, focus areas, audio, UI recreations, tables and writing mechanics
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

The shell and examples live in `../shell/` and `../examples/`.

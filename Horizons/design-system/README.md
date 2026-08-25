# Horizons design system

This directory defines the new visual language for the HTML/CSS master of **Horizons A1**.

## Design principle

The production system is **not a visual transcription of the legacy Word/PDF book** and is not a copy of any external coursebook reference. Reference material may inform broad editorial ideas such as hierarchy, pacing, skill labels and media variety; Horizons must express those ideas with its own visual identity.

## Current visual direction

- warm off-white A4 paper
- indigo primary accent
- aqua secondary accent
- coral, sun, plum and sky supporting accents
- a multicolor "horizon" rail as recurring page furniture
- asymmetric rounded cards instead of textbook tabs
- offset lesson stamps with a small secondary shadow block
- a subtle vertical exercise spine
- compact dark skill/mode bars
- editorial feature panels for photo + text combinations
- system-native sans-serif typography
- semantic HTML5 structures
- CSS Grid and Flexbox
- no vector illustrations; SVG is reserved for functional icons only

## Non-negotiable exercise layout

**Exercises themselves never form columns.**

All numbered exercises run vertically in one `.hz-exercises` / `.hz-exercise-flow` lane and remain in numerical order.

Two- and three-column layouts are allowed only **inside an exercise body** for questions, choices, image matching, tables, reviews, profiles, vocabulary or other activity content.

This rule is encoded in `component-contracts.md` and demonstrated in `../examples/stage-2-showcase.html`.

## Files

- `tokens.css` — palette, typography, spacing, geometry, effects and component dimensions
- `components.css` — lesson identity, exercise lane, internal question grids, focus cards, skill bars, media panels, audio labels, UI cards, tables and writing mechanics
- `asset-policy.md` — visual asset rules
- `component-contracts.md` — reusable semantic HTML/component expectations

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

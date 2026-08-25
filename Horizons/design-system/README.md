# Horizons design system

This directory defines the new visual language for the HTML/CSS master of **Horizons A1**.

## Design principle

The new production system is **not a visual transcription of the legacy Word/PDF book**. Existing pages remain untouched and may be used only as content/structure references when required. New pages use an independent, native HTML5/CSS design language.

## Visual direction

- warm off-white A4 paper
- cobalt primary accent
- coral activity accent
- mint, lavender, sky, and butter supporting surfaces
- rounded cards and pills rather than cut tabs or decorative vector shapes
- circular exercise numbering
- quiet borders and subtle print-safe shadows
- system-native sans-serif typography
- semantic HTML5 structures
- CSS Grid and Flexbox for composition
- no vector illustrations; SVG is reserved for functional icons only

## Files

- `tokens.css` — palette, typography, spacing, radii, effects, and component dimensions
- `components.css` — lesson headers, exercise blocks, focus cards, audio labels, UI cards, tables, writing mechanics, and utility surfaces
- `asset-policy.md` — visual asset rules
- `component-contracts.md` — reusable component expectations

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

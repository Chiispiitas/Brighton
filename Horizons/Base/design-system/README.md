# Horizons Base design system

This directory contains only **reusable series-wide rules and components** shared across Horizons books.

Start with `HANDOFF.md`.

## Source map

- `CANONICAL-STYLE.md` — shared visual and structural source of truth.
- `GUIDED-DISCOVERY.md` — shared pedagogy plus explicitly scoped level-specific language rules.
- `component-contracts.md` — semantic HTML/CSS contracts.
- `asset-policy.md` — image/audio production policy.
- `tokens.css` — shared tokens and print legibility floors.
- `components.css` — reusable cross-book/cross-lesson CSS.

No other file in this directory outranks or silently refines these sources.

## Boundary

- series-wide reusable behavior → `Horizons/Base/design-system/`;
- shared page shell → `Horizons/Base/shell/`;
- lesson-specific composition, corrections, asset mappings and crop tuning → the book's `Lessons/` folder;
- book-specific raster assets → the book's `Images/` folder;
- prompts/temporary art direction → outside the repository unless explicitly requested.

The current book is A1, with lessons in `../../A1/Lessons/` and images in `../../A1/Images/`.

Do not create `production/`, `staging/`, compatibility-override or lesson-override directories.

Before adding a reusable rule/component, search the existing Base first. If the need is unique to one lesson or level, keep it local to that book.

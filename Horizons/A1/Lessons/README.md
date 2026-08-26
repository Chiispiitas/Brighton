# Horizons A1 lesson masters

This folder contains the current A1 lesson masters and their lesson-scoped CSS.

## Current production references

Use these Unit 1 lessons as practical precedents for new A1 work:

- `lesson-1a-canonical-prototype.html`
- `lesson-1b-canonical-prototype.html`
- `lesson-1c-canonical-prototype.html`
- `lesson-1d-canonical-prototype.html`

Each adjacent `lesson-*-local.css` file contains composition, asset mappings, crop tuning or corrections specific to that lesson.

These pages demonstrate the system; they are **not templates that Unit 2 must copy mechanically**. New lessons preserve shared Horizons chrome while letting the lesson's actual content determine its internal composition and visual world.

## Shared Base

Every lesson loads the shared shell from `../../Base/shell/` and its own adjacent local stylesheet.

Reusable visual behavior lives in `../../Base/design-system/components.css`. Shared pedagogy and the A1 language-load rules live in `../../Base/design-system/GUIDED-DISCOVERY.md`.

For the complete authority order, start with `../../Base/design-system/HANDOFF.md`.

## A1 assets

Book-specific raster assets live in `../Images/`. Local lesson CSS maps and crops those assets.

For newly authored early-A1 learner-facing language, compare directly with what students have already seen. In Unit 1, **1A, 1B and the first page of 1C** are especially important references for the intentionally narrow, Spanish-transparent register.

## Styling boundary

Lesson-local CSS may handle:

- unique composition;
- final image mapping;
- crop/background position;
- page-specific spacing needed to avoid a collision;
- explicit author corrections unique to the lesson.

Do not use lesson-local CSS to redefine shared lesson tabs, exercise numbering, `NEW WORDS`, continuation-marker geometry, footer treatment or other shared chrome.

Existing frozen source content changes only when the author explicitly requests it.

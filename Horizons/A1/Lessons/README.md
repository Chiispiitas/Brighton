# Horizons lesson masters

This folder contains the current approved lesson masters and their lesson-scoped CSS.

## Current production references

Use these Unit 1 lessons as the practical precedent for new work:

- `lesson-1a-canonical-prototype.html`
- `lesson-1b-canonical-prototype.html`
- `lesson-1c-canonical-prototype.html`
- `lesson-1d-canonical-prototype.html`

Each adjacent `lesson-*-local.css` file contains composition, asset mappings, crop tuning or corrections that are specific to that lesson.

These pages demonstrate the system; they are **not templates that Unit 2 must copy mechanically**. New lessons should preserve shared Horizons chrome while letting the lesson's actual content determine its internal composition and visual world.

## Language precedent

For newly authored early-A1 learner-facing language, compare directly with what students have already seen.

In Unit 1, **1A, 1B and the first page of 1C** are especially important references for the intentionally narrow, Spanish-transparent register. Later authored material must not silently assume vocabulary or collocations simply because they are broadly considered A1.

## Styling boundary

Reusable cross-lesson behavior belongs in `../design-system/components.css`.

Lesson-local CSS may handle:

- a unique composition;
- final image mapping;
- crop/background position;
- page-specific spacing needed to avoid a collision;
- an explicit author correction that is unique to that lesson.

Do not use lesson-local CSS to redefine shared lesson tabs, exercise numbering, `NEW WORDS`, continuation marker geometry, footer treatment or other shared chrome.

## Source protection

Existing frozen source content changes only when the author explicitly requests it. Newly authored material must follow `../design-system/GUIDED-DISCOVERY.md` and the cumulative language audit.

For the complete authority order, start with `../design-system/HANDOFF.md`.

# Horizons A1 design system

This directory contains only **reusable cross-lesson rules and components**.

Start with `HANDOFF.md`.

## Source map

- `CANONICAL-STYLE.md` — visual and structural source of truth.
- `GUIDED-DISCOVERY.md` — pedagogy and learner-language source of truth.
- `component-contracts.md` — semantic HTML/CSS contracts.
- `asset-policy.md` — image/audio production policy.
- `tokens.css` — shared tokens and physical text floors.
- `components.css` — all reusable cross-lesson CSS.

No other file in this directory outranks or “refines” these sources.

## Boundary

- reusable cross-lesson behavior → `design-system/`;
- lesson-specific composition, corrections, asset mappings and crop tuning → matching lesson in `../examples/`;
- final raster assets → `../Images/`;
- prompts/temporary art direction → outside the repository unless explicitly requested.

Do not create `production/`, `staging/`, compatibility-override or lesson-override directories.

Before adding a reusable rule/component, search the existing system first. If the need is unique to one lesson, keep it local.

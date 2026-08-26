# Horizons A1 design system

This directory contains only **reusable, cross-lesson rules** for the Horizons A1 HTML/CSS master.

Start with `HANDOFF.md`. It defines authority order and the minimum resume checklist without restating every rule.

## Source-of-truth map

- `CANONICAL-STYLE.md` — visual language, lesson architecture, permanent layout principles and theme-neutral art direction.
- `GUIDED-DISCOVERY.md` — pedagogy and lesson-authoring method.
- `STYLE-REFINEMENTS.md` — specific production refinements and QA rules; newer specific refinements supersede older illustrative examples.
- `component-contracts.md` — semantic HTML/component contracts.
- `tokens.css` — palette, type scale, spacing, geometry and A1 legibility floors.
- `components.css` — reusable exercise/media components.
- `editorial-layouts.css` — reusable large editorial compositions.
- `canonical-refinements.css` — stable shared-chrome refinements.
- `guardrails.css` — reusable legibility and alignment safety rules.
- `asset-policy.md` — image sourcing, generation, prompt construction and asset rules.

## What does not belong here

Do not put lesson-specific selectors, one-off fixes, asset filenames, crop positions, image prompts or content corrections in `design-system/`.

Lesson-specific styling belongs directly in the corresponding lesson HTML under `../examples/`, scoped to that lesson. Final raster assets belong in `../Images/` and should be referenced directly by the lesson that uses them.

Image-generation prompts and temporary art-direction notes are **not repository files by default**. Keep them in the working conversation unless the author explicitly asks for them to be saved.

Do not create a separate `production/`, `staging/` or override folder for lesson-specific work. This keeps each lesson’s appearance inspectable from the lesson itself and prevents a second hidden styling layer from becoming authoritative.

## Core invariants

The detailed wording lives in the source-of-truth files above. At minimum, every production page must preserve these invariants:

- numbered exercises stay in one vertical sequence;
- Guided Discovery drives the learning sequence;
- existing frozen source content changes only with explicit author approval;
- student-facing language stays above the A1 print-legibility floors;
- content redundancy is removed before typography is compressed;
- repeated visual families use consistent geometry, adequate physical scale and verified centering;
- one dominant unit color, strong photography, typography and whitespace define the visual identity;
- **the visual world follows the lesson content rather than a default educational/school theme**;
- real-world artifacts are functional rather than decorative;
- shared chrome is changed globally, not patched differently in one lesson.

Horizons may move visually between hospitality, travel, retail, fitness, transport, culture, home life, documentary, workplace, lifestyle and other subject-appropriate worlds. The design system provides continuity without forcing unrelated lessons into the same imagery or mood.

## Architecture rule

Before adding a new rule or file, ask whether it is:

1. **Reusable across lessons** → `design-system/`.
2. **Specific to one lesson** → the corresponding lesson HTML in `examples/`.
3. **A final raster asset** → `Images/`.
4. **A prompt or temporary art-direction note** → keep it outside the repository unless explicitly requested.
5. **Already expressed elsewhere** → do not duplicate it; link to the existing source of truth.

If two files appear to govern the same behavior differently, resolve the contradiction instead of adding another override layer.

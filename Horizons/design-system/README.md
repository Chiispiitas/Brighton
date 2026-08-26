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

Those belong in `../production/` and must remain explicitly scoped. Current examples include Unit 1 compatibility overrides, lesson image mappings and lesson-specific prompt sheets.

This separation prevents a local lesson fix from silently changing unrelated lessons and keeps the canonical system small enough to audit.

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

Before adding a new rule, ask whether it is:

1. **Reusable across lessons** → design system.
2. **Specific to a unit/lesson/asset** → `../production/`.
3. **Already expressed elsewhere** → do not duplicate it; link to the existing source of truth.

If two files appear to govern the same behavior differently, resolve the contradiction instead of adding a third override.

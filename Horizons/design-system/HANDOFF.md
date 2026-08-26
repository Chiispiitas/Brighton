# Horizons A1 — Design System Handoff

**Status: OPERATIONAL ENTRY POINT**

Use this file to resume work. Do not treat it as another rulebook.

## Authority order

Read these sources in order:

1. `CANONICAL-STYLE.md` — visual/structural rules.
2. `GUIDED-DISCOVERY.md` — pedagogy and learner-language progression.
3. `component-contracts.md` — reusable HTML/CSS semantics.
4. `asset-policy.md` — image/audio sourcing and production.

Implementation is intentionally small:

- `tokens.css` — colors, type, spacing and physical A1 floors;
- `components.css` — all reusable cross-lesson CSS.

There is no refinements/override CSS layer.

## Current production precedent

For actual page behavior, compare new work with the approved Unit 1 lesson masters in `../examples/`:

- `lesson-1a-canonical-prototype.html`
- `lesson-1b-canonical-prototype.html`
- `lesson-1c-canonical-prototype.html`
- `lesson-1d-canonical-prototype.html`

Their adjacent `lesson-*-local.css` files contain lesson-specific composition, crop tuning and corrections. They are precedents, not templates to copy mechanically.

For **early learner-facing language**, 1A, 1B and the first page of 1C are especially important references for the deliberately narrow, Spanish-transparent register.

## Unit 2 workflow

For each new lesson:

1. lock the syllabus focus and identify what language is genuinely new;
2. audit what students have already met in Unit 1 and earlier Unit 2 pages;
3. design the Guided Discovery sequence before styling;
4. choose a real/content-led visual world for the lesson;
5. build on shared components and keep one-off composition in lesson-local CSS;
6. add only the assets the task needs;
7. compare the finished spread with neighboring approved lessons for language load, physical readability and visual weight.

## Hard boundaries

- A4, two pages per lesson.
- Numbered exercises stay in one vertical lane.
- Frozen source changes only with explicit authorization.
- Early-A1 instructions do not become a hidden vocabulary syllabus.
- One dominant unit color on normal lesson pages.
- No generic school visual theme.
- No decorative ghost text.
- No generic card/pill system.
- Shared chrome is not patched per lesson; local content moves around it.
- Important learner text is never shrunk below the floors in `tokens.css` to force a page to fit.
- Reusable rules belong in `design-system/`; lesson-specific rules stay beside the lesson in `examples/`.
- Do not create `production/`, `staging/` or override directories.

## Final spread check

Before calling a spread complete, verify: source fidelity, exercise order, cumulative language load, Guided Discovery evidence, readable type, content economy, functional artifacts, repeated-media crop/centering, shared chrome, whitespace, content-led imagery and parity with the surrounding lessons.

If a problem can be solved by simplifying language/content, recomposing, cropping or using an existing component, do that before adding another rule.

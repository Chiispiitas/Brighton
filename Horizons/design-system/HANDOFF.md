# Horizons A1 — Design System Handoff

**Status: CURRENT / OPERATIONAL ENTRY POINT**

This file is intentionally short. It tells a new work session what to read and which rules are authoritative without duplicating the full design system.

## Authority order

Read and apply these in order:

1. `CANONICAL-STYLE.md` — normative visual language, content-led visual worlds, lesson architecture and permanent layout rules.
2. `GUIDED-DISCOVERY.md` — normative pedagogy and lesson-authoring method.
3. `STYLE-REFINEMENTS.md` — newer, more specific production refinements and QA rules. When a specific refinement conflicts with an older illustrative example, the refinement wins.
4. `component-contracts.md` — semantic HTML/component usage.
5. `asset-policy.md` — image sourcing, generation and prompt construction.
6. `tokens.css`, `components.css`, `editorial-layouts.css`, `canonical-refinements.css`, `guardrails.css` — reusable implementation.
7. Individual lesson HTML files in `../examples/` — lesson-specific composition and scoped CSS.

Do not create a separate `production/`, `staging/` or override folder. Lesson-specific styling belongs with the lesson HTML itself. Final raster assets belong in `../Images/`. Image prompts and temporary art-direction notes stay outside the repository unless the author explicitly asks to save them.

## Non-negotiable production rules

- A4, print-first HTML/CSS master.
- Two pages per lesson.
- Numbered exercises remain one vertical sequence. Columns are allowed only inside one exercise.
- Existing frozen source content is preserved unless the author explicitly requests a content change.
- `Horizons A1/` remains frozen; active book work belongs in `Horizons/`.
- Guided Discovery: context → noticing → guided analysis → clarification → controlled practice → communicative use → real-world transfer.
- Lesson D culminates in a believable productive situation with a role, purpose, information exchange and concrete outcome.
- Normal pages use one dominant unit color; avoid decorative multicolor systems unless a task genuinely requires category distinction.
- Photography, crop, typography, scale and whitespace create visual energy. Generic cards, pills, decorative gradients and ghosted background words do not.
- **Horizons has no default educational/school visual theme.** Image art direction follows the actual world of the lesson; book consistency comes from the design system rather than repeated subject matter.
- Do not add classroom, notebook, pencil, blackboard or other school-coded imagery merely because the asset will appear in a coursebook.
- Repeated items in one visual family share geometry and alignment.
- Student-facing text never gets shrunk below the A1 legibility floors in `tokens.css` merely to make a page fit.
- Remove redundant content before reducing type or squeezing spacing.

## Repeated-image family rule

This is a permanent QA rule after the Lesson 1B production issue.

When an exercise contains a repeated family of equal-status images:

- judge the family against the **usable page width**, not only the narrower exercise-content column after the exercise number;
- center the family optically and mathematically;
- avoid fixed left/right nudges that depend on one image size;
- make images large enough that the required action/object remains immediately recognizable at physical A4 print size;
- for a dominant multi-item family that should span the exercise lane, use the reusable `.hz-media-family--full-lane` geometry from `guardrails.css` rather than inventing a lesson-specific offset;
- after changing image size or column count, re-check centering and crop as a family.

A repeated media grid that appears shifted, undersized or visually weaker than neighboring lesson imagery is a layout defect.

Shared crop geometry does not require every image in a family to use the same location or thematic atmosphere. If the family represents different businesses, places or contexts, let those differences remain visible.

## Current repository structure

```text
Horizons/
  README.md
  Images/
  design-system/
    CANONICAL-STYLE.md
    GUIDED-DISCOVERY.md
    STYLE-REFINEMENTS.md
    HANDOFF.md
    README.md
    tokens.css
    components.css
    editorial-layouts.css
    canonical-refinements.css
    guardrails.css
    component-contracts.md
    asset-policy.md
  examples/
    lesson-*.html
    stage-*.html
  shell/
```

`design-system/` contains reusable rules. `examples/` contains the lesson-specific HTML/CSS masters. `Images/` contains final raster assets. There is no separate lesson-override folder.

## Resume checklist

Before approving a spread, verify: source fidelity, exercise order, Guided Discovery flow, readable physical type, content economy, repeated-family alignment, consistent shared chrome, sufficient whitespace, functional real-world artifacts, **credible content-led imagery**, and visual parity with neighboring lessons.

If a layout problem can be solved by recomposition, cropping, removing redundancy or using an existing reusable helper, do that before adding another exception rule.

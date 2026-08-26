# Horizons

HTML5/CSS production workspace for the **Horizons A1 Student's Book**.

The frozen source remains in `Horizons A1/`. Active book production happens here in `Horizons/`.

## Start here

Read `design-system/HANDOFF.md` first.

The current authority chain is intentionally small:

1. `design-system/CANONICAL-STYLE.md` — visual/structural rules;
2. `design-system/GUIDED-DISCOVERY.md` — pedagogy and learner-language progression;
3. `design-system/component-contracts.md` — reusable HTML/CSS semantics;
4. `design-system/asset-policy.md` — production assets.

Implementation uses only:

- `design-system/tokens.css`;
- `design-system/components.css`.

There is no separate refinements/guardrails/editorial-layout override layer.

## Current production references

The approved Unit 1 lesson masters in `examples/` are the practical visual/language precedents:

- `lesson-1a-canonical-prototype.html`
- `lesson-1b-canonical-prototype.html`
- `lesson-1c-canonical-prototype.html`
- `lesson-1d-canonical-prototype.html`

Their adjacent `lesson-*-local.css` files contain lesson-specific composition and crop/asset rules. New lessons should extend the same system without copying one spread mechanically.

For the deliberately simple early-A1 learner register, especially compare new authored language with 1A, 1B and the first page of 1C.

## Locked production boundaries

- A4 HTML/CSS master.
- Two pages per lesson.
- Lesson sequence: A → B → C → D → Unit Review.
- Numbered sibling exercises stay in one vertical lane.
- Existing frozen content and syllabus change only with explicit authorization.
- Early learner-facing language follows the cumulative language actually taught by Horizons, not a generic CEFR vocabulary assumption.
- Normal lesson pages use one dominant unit color.
- Visual worlds follow the lesson content; there is no default school/classroom theme.
- Raster photography/generated raster imagery is preferred; decorative vector illustration is prohibited.
- Shared reusable behavior belongs in `design-system/`; lesson-specific composition belongs beside the lesson in `examples/`.
- Final raster assets belong in `Images/`.
- Image prompts/temporary art direction stay outside the repository unless explicitly requested.
- Do not create `production/`, `staging/` or override directories.

## Workspace

```text
Horizons/
├── README.md
├── Images/
├── design-system/
│   ├── HANDOFF.md
│   ├── CANONICAL-STYLE.md
│   ├── GUIDED-DISCOVERY.md
│   ├── component-contracts.md
│   ├── asset-policy.md
│   ├── tokens.css
│   └── components.css
├── examples/
│   ├── README.md
│   ├── lesson-1a-canonical-prototype.html
│   ├── lesson-1a-local.css
│   ├── lesson-1b-canonical-prototype.html
│   ├── lesson-1b-local.css
│   ├── lesson-1c-canonical-prototype.html
│   ├── lesson-1c-local.css
│   ├── lesson-1d-canonical-prototype.html
│   └── lesson-1d-local.css
└── shell/
    ├── a4-shell.css
    ├── print.css
    ├── page-template.html
    └── README.md
```

## Legacy source

Do not modify without explicit authorization:

- `Horizons A1/Student's Book.docx`
- `Horizons A1/Student's Book.pdf`
- `Horizons A1/Syllabus.txt`

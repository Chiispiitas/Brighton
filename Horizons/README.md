# Horizons

HTML5/CSS production workspace for the **Horizons A1 Student's Book**.

This folder is intentionally separate from the existing `Horizons A1/` directory. The legacy files remain source/reference material and must not be modified unless explicitly authorized.

## Current status

- Stage 1: native design system established
- Stage 2: fixed A4 shell and print CSS established
- Dynamic showcase: `examples/stage-2-showcase.html`

## Current design direction

The new `Horizons/` workspace does **not** mirror the visual design of the legacy Student's Book and does not reproduce external reference coursebooks. It uses an original native HTML/CSS system:

- warm off-white A4 paper
- indigo + aqua core identity
- coral, sun, plum and sky support accents
- multicolor horizon rail as recurring page furniture
- asymmetric rounded cards
- offset lesson stamps
- subtle vertical exercise spine
- compact skill/mode bars
- editorial photo/text feature panels
- system-native sans-serif typography
- semantic HTML5
- CSS Grid and Flexbox
- no decorative vector illustration

Reference screenshots may inspire only broad editorial ideas such as hierarchy, activity rhythm, skill labeling, information density and varied media scale. Their specific colors, shapes, page chrome, tab systems, typography and compositions must not be copied.

## Non-negotiable exercise layout

**All numbered exercises must appear in one vertical column and remain in numerical order.**

Exercises may not be placed side by side.

Inside an individual exercise, questions or activity content may use two or three columns. This includes question sets, answer options, vocabulary, images, reviews, tables, profiles and photo/text layouts.

Use the `.hz-exercises` lane and the internal `.hz-question-grid-*`, `.hz-content-grid-*` and `.hz-inset-grid-*` utilities.

## Locked production rules

- Page format: **A4**
- Definitive master: **HTML + CSS**
- Lesson length: **2 pages per lesson**
- Unit sequence: **Lesson A → Lesson B → Lesson C → Lesson D → Unit Review**
- Vocabulary Practice and Grammar Reference remain back-of-book sections
- Language standard: **American English**
- Audience: mixed Brighton students
- CEFR: keep material closely aligned to A1 while preserving the supplied syllabus exactly
- The supplied syllabus is **immutable** unless the author explicitly changes it
- Existing Student's Book pages are **immutable** unless the author explicitly changes them
- No recurring fictional cast
- Real celebrities may be used only when very widely known and pedagogically useful
- Visuals: photography or raster/generated raster imagery
- No vector illustrations; SVG is permitted for functional icons only
- External assets must be free for the intended use and recorded in an asset ledger
- Audio target: American English with ElevenLabs production planned
- Printed audio references support QR access

## Workspace

```text
Horizons/
├── README.md
├── design-system/
│   ├── tokens.css
│   ├── components.css
│   ├── component-contracts.md
│   └── asset-policy.md
├── shell/
│   ├── a4-shell.css
│   ├── print.css
│   ├── page-template.html
│   └── README.md
└── examples/
    ├── stage-2-showcase.html
    └── README.md
```

## Legacy source

The frozen source remains in:

- `Horizons A1/Student's Book.docx`
- `Horizons A1/Student's Book.pdf`
- `Horizons A1/Syllabus.txt`

Nothing in those files is changed by this workspace.

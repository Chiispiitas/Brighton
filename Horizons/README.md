# Horizons

HTML5/CSS production workspace for the **Horizons A1 Student's Book**.

This folder is intentionally separate from the existing `Horizons A1/` directory. The legacy files remain source/reference material and must not be modified unless explicitly authorized.

## Current status

- Stage 1: native design system established
- Stage 2: fixed A4 shell and print CSS established
- Example A4 pages: available in `examples/stage-2-showcase.html`

## Design direction

The new `Horizons/` workspace does **not** mirror the visual design of the legacy Student's Book. It uses an independent native HTML/CSS system:

- warm off-white page surface
- cobalt primary accent
- coral activity accent
- mint/lavender/sky/butter support colors
- system-native sans-serif typography
- rounded cards, pills, and quiet borders
- circular exercise numbers
- semantic HTML5
- CSS Grid and Flexbox
- no decorative vector illustration

The legacy book may still inform content structure where appropriate, but it is not the visual template for newly produced pages.

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

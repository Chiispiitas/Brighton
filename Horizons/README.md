# Horizons

HTML5/CSS production workspace for the **Horizons A1 Student's Book**.

This folder is intentionally separate from the existing `Horizons A1/` directory. The legacy files remain source/reference material and must not be modified unless explicitly authorized.

## Current status

- Stage 1: editorial design system established
- Stage 2: fixed A4 shell and print CSS established
- Stage 2 media showcase: `examples/stage-2-showcase.html`
- Stage 3 shape-led editorial showcase: `examples/stage-3-shape-showcase.html`

## Current design direction

The new `Horizons/` workspace does **not** mirror the legacy Student's Book and does not reproduce external reference coursebooks.

The visual goal is a professionally art-directed print coursebook rather than a collection of generic web cards:

- warm off-white A4 paper
- mostly neutral black/gray typography
- one dominant color per unit
- straight edges and thin editorial rules
- large raster photography and deliberate cropping
- white space used intentionally
- simple large exercise numerals
- flat grammar/pronunciation focus areas
- rounded/shadowed surfaces reserved mainly for simulated apps or real-world interfaces
- almost no decorative gradients
- very limited pills/badges
- system-native typography
- semantic HTML5
- CSS Grid/Flexbox
- bespoke page CSS is allowed when a lesson needs a distinctive composition
- full-page and near-full-page readings are allowed when pedagogically justified
- large CSS geometric fields, circles, clipped corners, folds, bands and speech bubbles can structure a page
- text itself may become a major visual element through scale and placement
- no decorative vector illustration

Reference screenshots may inspire only broad editorial principles such as hierarchy, activity rhythm, information density, photography scale, skill signaling and the use of large feature texts. Their specific colors, shapes, page chrome, typography and compositions must not be copied.

## Non-negotiable exercise layout

**All numbered exercises appear in one vertical sequence and remain in numerical order.**

Exercises may not be placed side by side.

Inside an individual exercise, questions or activity content may use two or three columns. This includes question sets, answer options, vocabulary, images, reviews, tables, profiles, photo/text layouts, full-page article features, quiz panels and shape-led compositions.

Use the `.hz-exercises` lane and the internal `.hz-question-grid-*`, `.hz-content-grid-*` and `.hz-inset-grid-*` utilities.

## Anti-template rules

- Do not put a card around content by default.
- Do not use a pill merely to label ordinary content.
- Do not fill empty space simply because it exists.
- Do not use several accent colors on the same normal lesson page.
- Do not force every lesson into the same visual composition.
- Do use consistent typography, numbering and learning mechanics across the book.
- Do allow strong photography, oversized text, structural CSS shapes and bespoke editorial layouts to create variety.
- Prefer one or two large structural shapes over many small decorative elements.

## Shape-led layout library

`design-system/editorial-layouts.css` is loaded automatically by the A4 shell and provides large-scale patterns for:

- full-page interview/profile features
- article mastheads with overlapping hero photography
- multi-column readings
- week/story modules
- question clouds
- questionnaire/quiz posters
- poster-style travel/social features
- process/timeline strips
- folded-corner notes

The Stage 3 showcase demonstrates these patterns using existing locked syllabus lesson titles and contexts.

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
│   ├── editorial-layouts.css
│   ├── component-contracts.md
│   └── asset-policy.md
├── shell/
│   ├── a4-shell.css
│   ├── print.css
│   ├── page-template.html
│   └── README.md
└── examples/
    ├── stage-2-showcase.html
    ├── stage-3-shape-showcase.html
    └── README.md
```

## Legacy source

The frozen source remains in:

- `Horizons A1/Student's Book.docx`
- `Horizons A1/Student's Book.pdf`
- `Horizons A1/Syllabus.txt`

Nothing in those files is changed by this workspace.

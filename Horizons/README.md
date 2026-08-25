# Horizons

HTML/CSS production workspace for the **Horizons A1 Student's Book**.

## Project status

**Stage 1 — Design system extraction: complete.**

This folder is intentionally separate from the existing `Horizons A1/` directory. The files in `Horizons A1/` are source/reference material and must not be modified by this project unless explicitly authorized.

## Locked production rules

- Page format: **A4**.
- Definitive master: **HTML + CSS**.
- Lesson length: **2 pages per lesson**.
- Unit sequence: **Lesson A → Lesson B → Lesson C → Lesson D → Unit Review**.
- Vocabulary Practice and Grammar Reference remain back-of-book sections.
- Language standard: **American English**.
- Audience: mixed Brighton students.
- CEFR: keep material closely aligned to A1 while preserving the supplied syllabus exactly.
- The supplied syllabus is **immutable**: do not move, replace, rename, reorder, or silently add syllabus objectives.
- Existing Student's Book pages are **immutable**: do not rewrite, redesign, correct, regenerate, or replace them without explicit authorization.
- No recurring fictional cast.
- Real celebrities may be used only when very widely known and pedagogically useful.
- Visuals: photography or raster/generated raster imagery. **No vector illustrations.**
- SVG is permitted only for functional icons and geometric interface elements.
- External assets must be free for the intended use and recorded in an asset ledger.
- Audio target: American English; ElevenLabs production is planned.
- Printed audio references should support QR access.

## Stage 1 files

- `design-system/README.md` — extracted visual language and component catalog.
- `design-system/tokens.css` — palette, typography, spacing, borders, and foundational design tokens.
- `design-system/components.css` — reusable Horizons visual components derived from the existing book.
- `design-system/asset-policy.md` — visual/audio asset rules and provenance requirements.
- `design-system/component-contracts.md` — semantic HTML patterns to use when Stage 2 begins.

## Source of truth

Stage 1 was extracted from the existing Student's Book visual conventions, including the magenta/navy identity, lesson banners, triangular exercise markers, NEW WORDS treatment, grammar/pronunciation focus boxes, audio labels, practice strips, photo-led tasks, and exercise hierarchy.

The legacy source remains in:

- `Horizons A1/Student's Book.docx`
- `Horizons A1/Student's Book.pdf`
- `Horizons A1/Syllabus.txt`

Nothing in those files is changed by this workspace.

## Next stage

**Stage 2** will build the fixed A4 HTML page shell and print CSS using this design system. It should not begin by redesigning existing pages; it should establish the reusable production framework for new pages only.

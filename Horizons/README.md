# Horizons

Production workspace for the **Horizons** coursebook series.

The workspace is divided into:

- `Base/` — shared design, layout and production infrastructure used across books;
- `A1/` — the current A1 book and all A1-specific production materials.

The legacy source in `Horizons A1/` remains frozen unless explicitly authorized.

## Start here

For shared design and production rules, read:

`Base/design-system/HANDOFF.md`

For current A1 lesson production, work in:

`A1/Lessons/`

Open `A1/Student's Book.html` directly in a browser to view the assembled book. It is a **compiled standalone HTML book**: lesson pages and required CSS are already embedded, so viewing it through `file://` does not use lesson iframes, sibling-file fetches, or cross-frame DOM access.

Its download button does **not** use browser Print/Save as PDF. It builds a PDF with `html2canvas` + `jsPDF`, renders each `.hz-page` independently at high resolution, and inserts each render as one exact A4 PDF page. This page-by-page boundary must be preserved as the book grows; do not replace it with one long screenshot or automatic page slicing.

## Structure

```text
Horizons/
├── README.md
├── Base/
│   ├── build/
│   │   └── build-students-book.mjs
│   ├── design-system/
│   │   ├── HANDOFF.md
│   │   ├── CANONICAL-STYLE.md
│   │   ├── GUIDED-DISCOVERY.md
│   │   ├── component-contracts.md
│   │   ├── asset-policy.md
│   │   ├── tokens.css
│   │   └── components.css
│   └── shell/
│       ├── a4-shell.css
│       ├── print.css
│       ├── page-template.html
│       └── README.md
└── A1/
    ├── Audios/
    ├── Audio scripts/
    ├── Answer keys/
    ├── Images/
    ├── Blooket/
    ├── Progress test/
    ├── Wordlists/
    ├── Lessons/
    ├── Student's Book.html
    └── Syllabus.txt
```

## Student's Book build

`Base/build/build-students-book.mjs` scans `A1/Lessons/` for definitive lesson masters named like `1A.html`, `2C.html` or `10B.html`, sorts them naturally, resolves their shared/local CSS, rewrites local asset paths for the assembled book, and writes `A1/Student's Book.html`.

The GitHub Actions workflow `.github/workflows/build-horizons-a1-student-book.yml` runs this automatically when lesson or shared production sources change and commits the generated book back to `main` when needed.

No lesson manifest is required. Adding a correctly named lesson master is enough for the compiler to discover it.

## Boundary

`Base/` contains only reusable series-wide infrastructure. It must not contain lesson-specific assets, crop positions, answer keys, tests, audio files or other material belonging to one book.

Each level/book owns its own production resources. For A1:

- lesson HTML and lesson-local CSS → `A1/Lessons/`;
- assembled local book + PDF export → `A1/Student's Book.html`;
- raster assets → `A1/Images/`;
- final audio → `A1/Audios/`;
- audio scripts → `A1/Audio scripts/`;
- unit answer-key text files → `A1/Answer keys/`;
- Blooket resources → `A1/Blooket/`;
- progress tests → `A1/Progress test/`;
- wordlists → `A1/Wordlists/`;
- syllabus → `A1/Syllabus.txt`.

Do not create `production/`, `staging/` or hidden override directories. Shared behavior belongs in `Base/`; book-specific behavior stays inside the book folder.

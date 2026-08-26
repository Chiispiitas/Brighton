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

Open `A1/Student's Book.html` directly in a browser to view the assembled book. The visible book is assembled from the lesson manifest and works through `file://` without a local server.

Its download button does **not** use browser Print/Save as PDF. It builds a PDF with `html2canvas` + `jsPDF`, renders each `.hz-page` independently at high resolution, and inserts each render as one exact A4 PDF page. This page-by-page boundary must be preserved as the book grows; do not replace it with one long screenshot or automatic page slicing.

## Structure

```text
Horizons/
├── README.md
├── Base/
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

## Boundary

`Base/` contains only reusable series-wide infrastructure. It must not contain lesson-specific assets, crop positions, answer keys, tests, audio files or other material belonging to one book.

Each level/book owns its own production resources. For A1:

- lesson HTML and lesson-local CSS → `A1/Lessons/`;
- lesson assembly order → `A1/Lessons/manifest.js`;
- assembled local book + PDF export → `A1/Student's Book.html`;
- raster assets → `A1/Images/`;
- final audio → `A1/Audios/`;
- audio scripts → `A1/Audio scripts/`;
- unit answer-key text files → `A1/Answer keys/`;
- Blooket resources → `A1/Blooket/`;
- progress tests → `A1/Progress test/`;
- wordlists → `A1/Wordlists/`;
- syllabus → `A1/Syllabus.txt`.

When a new A1 lesson master is created, add it to `A1/Lessons/manifest.js` in book order so both the local viewer and the PDF exporter include it.

Do not create `production/`, `staging/` or hidden override directories. Shared behavior belongs in `Base/`; book-specific behavior stays inside the book folder.

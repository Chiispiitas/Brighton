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
    └── Syllabus.txt
```

## Boundary

`Base/` contains only reusable series-wide infrastructure. It must not contain lesson-specific assets, crop positions, answer keys, tests, audio files or other material belonging to one book.

Each level/book owns its own production resources. For A1:

- lesson HTML and lesson-local CSS → `A1/Lessons/`;
- raster assets → `A1/Images/`;
- final audio → `A1/Audios/`;
- audio scripts → `A1/Audio scripts/`;
- unit answer-key text files → `A1/Answer keys/`;
- Blooket resources → `A1/Blooket/`;
- progress tests → `A1/Progress test/`;
- wordlists → `A1/Wordlists/`;
- syllabus → `A1/Syllabus.txt`.

Do not create `production/`, `staging/` or hidden override directories. Shared behavior belongs in `Base/`; book-specific behavior stays inside the book folder.

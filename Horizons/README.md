# Horizons

HTML5/CSS production workspace for the **Horizons A1 Student's Book**.

This folder is intentionally separate from the existing `Horizons A1/` directory. The legacy files remain source/reference material and must not be modified unless explicitly authorized.

## Current status

- Stage 1: editorial design system established
- Stage 2: fixed A4 shell and print CSS established
- Stage 3: shape-led editorial layouts established
- Stage 4: publication system established — spreads, typography, archetypes, back matter, QA, icons and structured content

Showcases:

- `examples/stage-2-showcase.html` — photography/overlay compositions
- `examples/stage-3-shape-showcase.html` — shape-led/full-page editorial compositions
- `examples/stage-4-publication-showcase.html` — spread-level publication system + back matter

## Design direction

The new `Horizons/` workspace does **not** mirror the legacy Student's Book and does not reproduce external reference coursebooks.

The visual goal is a professionally art-directed print coursebook:

- warm off-white A4 paper;
- mostly neutral black/gray typography;
- one dominant color per unit;
- typography and photography as the main hierarchy;
- large raster photography and deliberate cropping;
- controlled overlays, full-page text features and structural shapes;
- straight edges and thin editorial rules by default;
- white space used intentionally;
- simple large exercise numerals;
- Grammar and Pronunciation visually differentiated;
- rounded/shadowed surfaces reserved mainly for simulated apps or real-world interfaces;
- almost no decorative gradients;
- very limited pills/badges;
- system-native typography;
- semantic HTML5;
- CSS Grid/Flexbox;
- bespoke page CSS allowed when a lesson needs a distinctive composition;
- no decorative vector illustration.

Reference screenshots may inspire only broad editorial principles such as hierarchy, activity rhythm, information density, photography scale and skill signaling. Their specific colors, shapes, page chrome, typography and compositions must not be copied.

## Non-negotiable exercise layout

**All numbered exercises appear in one vertical sequence and remain in numerical order.**

Exercises may not be placed side by side.

Inside an individual exercise, questions or activity content may use two or three columns. This includes question sets, answer options, vocabulary, images, reviews, tables, profiles and photo/text layouts.

## Two-page lesson rule

Lessons are authored as **two-page spreads**, not two unrelated pages.

Use `.hz-spread` and give Page 1 / Page 2 complementary roles such as:

- photo-led → practice-led
- reading-feature → grammar/communication
- real-world interface → language/practice
- quiz → speaking/writing

The master starter in `shell/page-template.html` now contains both A4 pages.

## Layout archetypes

Horizons supports controlled variety through:

- standard language spreads;
- photo-led vocabulary;
- reading features;
- interviews/profiles;
- quizzes/questionnaires;
- real-world interfaces;
- processes/timelines;
- collages/editorial features.

See `design-system/layout-archetypes.md`.

## Density

Pages explicitly choose a density:

- `.hz-density-light`
- `.hz-density-medium`
- `.hz-density-dense`

This prevents every lesson from having the same visual rhythm.

## Photography and assets

Rules live in:

- `design-system/asset-policy.md`
- `design-system/image-direction.md`
- `assets/asset-ledger.csv`

Production assets are local, free for intended use, documented, and targeted at appropriate print resolution.

## Audio

Audio target remains American English with ElevenLabs production planned.

Manifest template:

`audio/audio-manifest.csv`

Each recording receives a stable internal ID and printed track number. QR access remains optional but supported.

## Functional icons

The shared SVG sprite is:

`assets/icons/horizons-icons.svg`

It contains functional symbols only; vector illustration remains prohibited.

## Structured content

`content/` contains a schema and demonstration record for storing stable lesson/exercise metadata separately from presentation.

This is intended to support the future:

- Workbook
- Teacher's Book
- Answer Key
- Audio scripts
- Audio pack
- Digital exercises
- Tests
- Vocabulary lists

HTML/CSS remains the definitive Student's Book master.

## QA

`qa/` contains:

- browser-side layout audit;
- print QA checklist;
- debug workflow documentation.

The audit checks fixed-page overflow, duplicate IDs, exercise sequence/lane violations, alt text, unresolved placeholders and basic QR sizing.

## Anti-template rules

- Do not put a card around content by default.
- Do not use a pill merely to label ordinary content.
- Do not fill empty space simply because it exists.
- Do not use several accent colors on the same normal lesson page.
- Do not force every lesson into the same visual composition.
- Do use consistent typography, numbering and learning mechanics across the book.
- Do allow strong photography, structural shapes and bespoke editorial layouts to create variety.
- Do not overlap/rotate answer mechanics or exercise numbers.

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
├── shell/
├── examples/
├── assets/
│   ├── asset-ledger.csv
│   └── icons/
├── audio/
│   └── audio-manifest.csv
├── content/
│   ├── content-schema.json
│   ├── example-lesson.json
│   └── README.md
└── qa/
    ├── page-audit.js
    ├── print-qa-checklist.md
    └── README.md
```

## Legacy source

The frozen source remains in:

- `Horizons A1/Student's Book.docx`
- `Horizons A1/Student's Book.pdf`
- `Horizons A1/Syllabus.txt`

Nothing in those files is changed by this workspace.

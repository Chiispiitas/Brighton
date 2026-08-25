# Horizons A1 — Canonical Book Style

**Status: APPROVED / CANONICAL**

This document establishes the current **Stage 3 Horizons design** as the desired visual language for the Horizons A1 Student's Book.

The canonical baseline is the repository state represented by the Stage 3 system currently on `main`, especially:

- `examples/stage-3-shape-showcase.html` — **primary visual reference**
- `examples/stage-2-showcase.html` — compatible supporting reference for photography, overlays, crops and media-led exercises
- `design-system/components.css` — core lesson/exercise mechanics
- `design-system/editorial-layouts.css` — approved shape-led and full-page editorial compositions
- `shell/a4-shell.css` — approved A4 page framework

These files define the direction to continue from. They are not temporary experiments.

## 1. Desired character

Horizons should feel like a **professionally art-directed contemporary print coursebook** rather than a web dashboard, worksheet template, AI-generated UI, or direct imitation of another publisher.

The desired balance is:

- editorial rather than interface-heavy;
- creative rather than templated;
- structured rather than chaotic;
- photographic rather than illustration-led;
- dynamic rather than rigid;
- print-first rather than screen-first;
- recognizably consistent while allowing substantial page-to-page variation.

## 2. Core visual language

The following are canonical characteristics of the book:

- warm off-white A4 page;
- mostly neutral black/gray typography;
- one dominant unit color per page/unit;
- large, deliberate raster photography;
- strong image crops and media composition;
- substantial white space;
- large typography used as part of composition;
- simple large exercise numerals;
- straight edges and thin editorial rules as the default;
- large CSS geometric forms when they help structure content;
- circles, clipped corners, folds, bands, angled fields and controlled speech-bubble geometry;
- photo/text overlap where readability and composition justify it;
- lower-third photo bands and image overlays where useful;
- poster-like and magazine-like feature treatments for suitable lessons;
- full-page or near-full-page readings when the content warrants them;
- bespoke compositions rather than forcing every page into one repeated template;
- rounded/shadowed UI primarily reserved for simulated real-world interfaces;
- almost no decorative gradients;
- very limited pills and generic cards;
- no decorative vector illustrations.

## 3. Primary composition principle

**Creativity should come from page composition, typography, photography, scale, crop, overlap and structural shapes — not from accumulating small decorative components.**

A page may be visually bold, but every major shape or overlap should support at least one of:

- hierarchy;
- reading flow;
- grouping;
- task meaning;
- image emphasis;
- lesson identity.

Do not add decoration simply because empty space exists.

## 4. Exercise-flow rule — permanent

**All numbered exercises remain in one vertical sequence and numerical order.**

Sibling numbered exercises must never be laid out side by side.

Two- and three-column layouts are allowed only **inside one exercise** for:

- questions;
- options;
- vocabulary;
- images;
- tables;
- profiles;
- reviews;
- matching tasks;
- reading columns;
- quiz content;
- collages;
- timelines;
- other internal activity material.

A single exercise may contain a highly creative full-page composition. The next numbered exercise still begins below it.

## 5. Approved Stage 3 layout vocabulary

The following design patterns are explicitly part of the desired style:

### Photography-led compositions

- full-photo lead areas;
- title or short text over photographs;
- functional dark scrims for legibility;
- lower-third information bands;
- photo indexes/labels;
- detail-photo insets;
- photo strips;
- dominant-photo collages;
- offset captions;
- pull quotes crossing image edges;
- controlled image/text overlap.

### Shape-led compositions

- large interview/profile feature sheets;
- article mastheads with overlapping hero photography;
- full-page editorial reading fields;
- multi-column article text;
- vertically labeled story/week sections;
- question clouds;
- questionnaire/quiz posters;
- poster-style travel/social features;
- process/timeline strips;
- folded-corner notes;
- floor-plan or spatial compositions;
- oversized background numerals or text used compositionally.

## 6. Typography

Typography should carry hierarchy before containers do.

Prefer:

- strong lesson titles;
- clear activity instructions;
- controlled changes in size/weight;
- large display words or numbers when compositionally useful;
- readable body text at physical A4 size;
- restrained captions and labels.

Avoid solving every hierarchy problem with a colored badge, pill, card or border.

## 7. Photography

Photography is a major part of the desired Horizons identity.

Use real or generated raster imagery where appropriate. Final pages should rely increasingly on real production imagery rather than gray placeholders.

Preferred behavior:

- one strong hero image can dominate a feature;
- use several small images only when the pedagogy benefits from comparison, matching, sequence or vocabulary recognition;
- crop intentionally;
- leave useful negative space when text overlays are planned;
- use subject direction/gaze to support page flow where possible;
- avoid decorative stock photography that adds no task value.

External assets must remain free for the intended use and comply with `asset-policy.md`.

## 8. Unit color

Each unit may have its own dominant color identity, but a normal lesson page should not become a multicolor component palette.

The unit color may appear in:

- exercise numerals;
- key rules;
- selected titles;
- one major structural field;
- focus areas;
- carefully chosen shape accents.

Neutral typography and photography should still dominate the page.

## 9. Human-art-direction rules

To preserve the approved style:

1. Do not wrap ordinary content in cards by default.
2. Do not use pills as generic labels.
3. Do not make every block equally prominent.
4. Do not force every lesson into the same composition.
5. Do not fill every gap.
6. Do not use several accent colors simply to create variety.
7. Do not add decorative gradients as generic page furniture.
8. Do not add generic abstract blobs merely to make a page look creative.
9. Do not use shadows on ordinary textbook content.
10. Do not turn the coursebook into a dashboard-like UI.
11. Do allow bespoke page CSS when the content genuinely benefits from it.
12. Do use large-scale composition and controlled irregularity.
13. Do let real photography carry visual weight.
14. Do retain consistent exercise mechanics even when page composition changes.

## 10. Relationship to reference screenshots and other books

External coursebook references may inform broad editorial ideas such as:

- hierarchy;
- density;
- activity rhythm;
- media scale;
- full-page reading treatment;
- skill signaling;
- use of shapes and whitespace.

Do not reproduce their exact:

- palettes;
- tabs;
- page chrome;
- typography;
- icon systems;
- illustrations;
- compositions;
- decorative motifs.

Horizons should remain an independent design.

## 11. Relationship to the legacy Student's Book

The legacy files in `Horizons A1/` remain frozen source/reference material.

The canonical Stage 3 style does **not** authorize modifying or replacing existing Student's Book pages. New production work belongs in `Horizons/` unless the author explicitly requests changes to frozen source pages.

The supplied syllabus also remains immutable unless explicitly changed by the author.

## 12. What future improvements may change

Future work may improve:

- image quality;
- real asset selection;
- crop quality;
- spacing;
- typography refinements;
- print robustness;
- accessibility;
- audio/QR implementation;
- component reliability;
- page-specific creative compositions.

Future work should **not** silently replace the canonical visual philosophy with a new design system.

A major redesign should happen only after explicit author approval.

## 13. Canonical reference priority

When there is ambiguity about how a new page should look, use this priority:

1. `CANONICAL-STYLE.md`
2. `examples/stage-3-shape-showcase.html`
3. `examples/stage-2-showcase.html`
4. current `components.css` and `editorial-layouts.css`
5. documented project constraints and syllabus
6. external references only as broad inspiration

This Stage 3 direction is the **desired book style until explicitly superseded by the author**.

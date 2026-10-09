# Horizons — Component Contracts

This file defines reusable semantic HTML/CSS usage shared across Horizons books. Visual rules belong in `CANONICAL-STYLE.md`; pedagogy and level-specific language rules belong in `GUIDED-DISCOVERY.md`.

Reusable CSS lives in `components.css`; tokens live in `tokens.css`.

### Editorial color roles

Use the shared `--hz-feature-blue`, `--hz-feature-teal`, `--hz-feature-green`,
`--hz-feature-orange`, `--hz-feature-violet` and `--hz-feature-gold` tokens for
rich feature accents and task-bearing bands. White text works on the five dark
fills; gold requires `--hz-ink` or another verified dark foreground. Preserve
the shared page/title/navigation geometry when changing color. Writing surfaces
stay white or near-white, and answer options retain their italic, normal-weight
contract. Pale language-focus bodies are subordinate surfaces, not the default
feature palette. Do not color the correct answer differently from distractors.

## 1. Page

```html
<article class="hz-page hz-content hz-unit-2" data-page="13">
  <main class="hz-page__content">
    <div class="hz-page-stack">...</div>
  </main>
  <footer class="hz-page__footer">
    <span class="hz-page-code">Horizons · Unit 2</span>
    <span class="hz-page-number">13</span>
  </footer>
</article>
```

Use one `.hz-unit-*` identity on a normal page.

## 2. Lesson header

```html
<header class="hz-lesson-header">
  <div class="hz-lesson-tab" aria-label="Lesson 2A">
    <span class="hz-lesson-tab__label">Lesson</span>
    <span class="hz-lesson-tab__id">2A</span>
  </div>
  <div class="hz-lesson-heading">
    <h1 class="hz-lesson-title">LESSON TITLE</h1>
    <div class="hz-objectives">
      <span class="hz-objectives__item">Objective</span>
    </div>
  </div>
</header>
```

Titles/objectives come from the authorized syllabus/source for the book.

## 3. Numbered exercise lane

```html
<div class="hz-exercises">
  <section class="hz-exercise">
    <div class="hz-exercise-number">1</div>
    <div class="hz-exercise__content">
      <p class="hz-exercise__instruction">Read and listen.</p>
      <div class="hz-exercise__body">...</div>
    </div>
  </section>
</div>
```

Sibling numbered exercises always remain in this one vertical lane. Do not place them in a page-level grid.

Normal exercises and `Go to:` references do not receive decorative separator lines.

The exercise body should contain only the response mechanics the task actually needs. Do not add generic answer lines, boxes or check controls to a question-only task.

Spacing is produced by the exercise's top/bottom padding, the instruction-to-body
margin, and the parent flow gap together. Do not tighten only one of these
without checking the resulting visible separation. For the current A1 book,
calibrate lesson-local styles against the author-approved 1A master and the
physical values in `CANONICAL-STYLE.md`. Keep shared Base defaults stable.

## 4. Internal grids

Two/three-column grids are allowed **inside one exercise**:

```html
<div class="hz-exercise__body hz-question-grid hz-question-grid--2">
  <div class="hz-question">...</div>
  <div class="hz-question">...</div>
</div>
```

Use existing `.hz-question-grid-*` / `.hz-content-grid-*` helpers before inventing a local equivalent.

When a short semantic label should remain intact, prefer a content-sized column or a local no-wrap rule for that label instead of widening every sibling or reducing type size.

## 5. Repeated media family

```html
<div class="hz-exercise__body hz-media-family hz-media-family--full-lane">
  <figure>...</figure>
  <figure>...</figure>
  <figure>...</figure>
</div>
```

Use `--full-lane` when a dominant equal-status family should center across the usable exercise lane rather than being visually shifted by the exercise-number column.

The family chooses its columns/gaps locally. Equal-status items share geometry/basic scale; crop position may differ per image.

A feature can be portrait-led and keep its original photographic setting.
For the current A1 book, only 2A activity 1 uses a newly extracted photograph;
other photos retain their approved original backgrounds.
Keep names and matching markers as live task text. Display type and photo
framing stay lesson-local, with canonical spacing and learner hierarchy retained.
Inspect circle/arch crops for complete faces and check extracted silhouettes
on the actual page background.

Do not force text/copy areas inside repeated items to a large equal `min-height` unless equal height is functionally necessary. Natural content height is the default.

## 6. Photography

Standard shell frame:

```html
<figure class="hz-media-frame hz-media-frame--landscape">
  <img src="..." alt="...">
</figure>
```

Prototype placeholders use `.hz-photo-placeholder` and must occupy the intended final crop/scale.

Distinctive collages, overlays, article treatments and other editorial compositions are **lesson-local by default**. Promote one into `components.css` only after it proves genuinely reusable across multiple production lessons/books.

## 7. Continuation page

Use the generic shared continuation marker:

```html
<article class="hz-page hz-content hz-unit-2 hz-continuation-page">
  <main class="hz-page__content">
    <div class="hz-continuation">2A</div>
    <div class="hz-page-stack">...</div>
  </main>
</article>
```

`components.css` provides the marker and a default safe top offset. If the first content block needs more clearance, increase only that lesson's content offset in local CSS. Do not move/reinvent the shared marker.

## 8. Language-focus area

```html
<section class="hz-focus-box hz-no-break">
  <header class="hz-focus-box__header">GRAMMAR: ...</header>
  <div class="hz-focus-box__body">...</div>
</section>
```

Use it when explicit clarification is pedagogically useful, not as a default wrapper.

**Every `.hz-focus-box__header` must use exactly one of four canonical category labels: `GRAMMAR`, `VOCABULARY`, `PRONUNCIATION`, or `SKILLS`.** The category comes first, followed by a colon and an optional specific focus, for example `GRAMMAR: A / AN / THE` or `PRONUNCIATION: THE ALPHABET`.

Do not invent alternate category labels such as `LANGUAGE FROM ...`, `LANGUAGE`, `USEFUL LANGUAGE`, `NOTICE`, `FOCUS`, or show/lesson-specific headings. A recurring feature such as `HORIZONS ON AIR` may organize the surrounding lesson, but it does not replace the canonical focus-box category label.

The `aria-label` should use the same semantic category as the visible header.

**The shared focus-box shell is visually canonical.** Lesson-local CSS may adjust only the box's outer placement/width when composition requires it. Do not locally override its background, top/bottom borders, shell padding, or header typography.

The shared header is a compact dark-crimson tab with white text, aligned to the
shell's top-left edge. Its label remains readable at print size. The body uses
the pale-pink focus surface, with dark-crimson bold. Legacy lesson compositions
must use this shared shell rather than maintain visually similar local copies.

Inside `.hz-focus-box__body`, use ordinary learner text plus existing shared grids/helpers whenever possible. Do **not** invent one-off separator rules, mini-label systems, pills, colored strips, card surfaces, or special typography solely for one grammar/vocabulary point. If a new internal treatment is genuinely reusable, define it in `Horizons/Base/design-system/` first; otherwise simplify the body to the established focus-box visual language.

Bold (`<b>` or `<strong>`) inside the focus-box body inherits the shared unit-dark accent treatment. It must not render as plain black. For multiple-choice or circle-the-answer content, wrap the options in `<em class="hz-answer-option">` and use normal lowercase wording, retaining only grammatically necessary capitals. The shared class prevents options from inheriting a bold instruction weight. Descriptive gray scene/location captions are omitted from printed lesson imagery; alt text retains the image description.

## 9. Functional labels

```html
<span class="hz-new-words">NEW WORDS</span>
<div class="hz-go-to">Vocabulary Practice · page ---</div>
```

`NEW WORDS` is plain text with the shared small sparkle generated by CSS. Do not manually add the sparkle or turn the cue into a badge/pill/card.

**`NEW WORDS` is only a signal. It never introduces, defines or lists vocabulary.** Never place a word bank, glossary string or sequence such as `word · word · word` after the cue.

The unfamiliar words must already occur naturally **inside the exercise itself**. Mark those exact words in bold unit color where they occur, for example:

```html
<span class="hz-new-words">NEW WORDS</span>
<p>It is six <strong class="hz-text-unit">twenty</strong>.</p>
```

Use the existing `.hz-text-unit` utility together with semantic bold (`<strong>`) for this treatment. The cue tells the learner to notice unfamiliar vocabulary; the exercise/context still does the teaching.

If the unfamiliar item exists only in audio and is not printed in the exercise, do **not** invent a printed vocabulary list just to accompany `NEW WORDS`. Either let the listening context carry it or place the cue only where the new item is actually visible in learner-facing text.

### Standalone word banks

Standalone word banks use `.hz-word-bank`: neutral `--hz-wash` background and
crimson left rule. Follow 1C's dark-crimson vocabulary text; lesson-local CSS
may tune spacing and wrapping, but must not replace those established colors
with an unrelated feature palette.

## 10. Real-world UI

Rounded/shadowed surfaces are appropriate for genuine forms, chats, tickets, apps and similar interfaces:

```html
<article class="hz-ui-card" aria-label="Sample interface">...</article>
```

The artifact must be used by the learner rather than included only for appearance.

`hz-ui-card` is only a semantic/shared starting point. A recognizable interface should usually receive lesson-local styling that reproduces the intended artifact's visual grammar: for example message direction, header hierarchy, field rhythm, input treatment, surface color and control placement. Do not settle for a generic rounded rectangle when recognizability matters to the task.

For paper forms, select HTML/CSS or generated raster artwork according to the
author-approved creativity reference in `CANONICAL-STYLE.md`. Use generated
artwork for a believable physical artifact when its material and personality
are part of the intended composition; use HTML/CSS for text-driven interfaces.
Keep all authorized fields and writing areas, readable labels and credible
physical scale. Do not default every form to a generic CSS rectangle.

A generated working document uses a stable image slot inside the existing
exercise flow, with a descriptive image alternative identifying its purpose
and fields. Record the field names and writing-area count on the artifact
element, as in the approved `l1d-reception-form`, so the raster replacement can
be checked against the original response mechanics. Its native-alpha exterior
and fully white writing surface must survive asset mapping, PDF generation and
print optimization. Captions and ordinary lesson language remain live text;
do not rasterize an entire exercise because one artifact uses generated art.

## 11. Text roles / physical floors

`components.css` provides:

- `.hz-student-text`
- `.hz-dialogue-text`
- `.hz-task-text`
- `.hz-interface-text`
- `.hz-micro-text`

Use the role that matches the content. Never label ordinary learner content as interface/micro simply to bypass a physical type floor.

Pairwork and dialogue models are normally plain exercise content. Use `.hz-dialogue-text` inside the existing exercise/grid structure. Do not add lesson-local colored side strips, badges, tinted cards, or other decorative markers merely to distinguish model exchanges. Such treatment is allowed only when an established shared component requires it or when the task reproduces an authentic real-world artifact.

## 12. Book-local stylesheet

A lesson links the shared Base shell plus its adjacent local stylesheet. For the current A1 book:

```html
<link rel="stylesheet" href="../../Base/shell/a4-shell.css">
<link rel="stylesheet" href="./lesson-2a-local.css">
<link rel="stylesheet" href="../../Base/shell/print.css" media="print">
```

Do not add book- or lesson-specific imports to `Base/shell/a4-shell.css`.

## 13. Architecture boundary

Reusable series-wide components belong in `Horizons/Base/design-system/`. Lesson-specific composition, corrections, asset filenames and crop tuning belong in that book's `Lessons/` folder; current A1 work lives in `../../A1/Lessons/`.

Before creating a new shared component, search the existing Base for an equivalent. Prefer one canonical component over near-duplicates.

## 14. Editorial feature backgrounds

Use a semantic article or section with a lesson-local feature class. Its title,
photographs, color accents and internal columns form the composition. There is
no default shared reading-panel background or border. The author has restored
the original A1 dialogue panels, photo backgrounds and feature bands from the
pre-overhaul checkpoint. Keep those lesson-local treatments and their text
insets; do not remove them under the previous open-paper default.

Feature palettes may vary independently from crimson navigation. A partial photo
mat or an occasional full article background must serve a specific composition.
Preserve open numbered exercise flow, reading legibility and writing space.

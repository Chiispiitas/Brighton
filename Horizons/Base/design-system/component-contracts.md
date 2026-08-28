# Horizons — Component Contracts

This file defines reusable semantic HTML/CSS usage shared across Horizons books. Visual rules belong in `CANONICAL-STYLE.md`; pedagogy and level-specific language rules belong in `GUIDED-DISCOVERY.md`.

Reusable CSS lives in `components.css`; tokens live in `tokens.css`.

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

## 10. Real-world UI

Rounded/shadowed surfaces are appropriate for genuine forms, chats, tickets, apps and similar interfaces:

```html
<article class="hz-ui-card" aria-label="Sample interface">...</article>
```

The artifact must be used by the learner rather than included only for appearance.

`hz-ui-card` is only a semantic/shared starting point. A recognizable interface should usually receive lesson-local styling that reproduces the intended artifact's visual grammar: for example message direction, header hierarchy, field rhythm, input treatment, surface color and control placement. Do not settle for a generic rounded rectangle when recognizability matters to the task.

For paper forms, prefer CSS-built structure before adding decorative imagery. Keep fields writable, labels readable and the artifact visually credible at print size.

## 11. Text roles / physical floors

`components.css` provides:

- `.hz-student-text`
- `.hz-dialogue-text`
- `.hz-task-text`
- `.hz-interface-text`
- `.hz-micro-text`

Use the role that matches the content. Never label ordinary learner content as interface/micro simply to bypass a physical type floor.

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

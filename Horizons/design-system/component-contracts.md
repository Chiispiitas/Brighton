# Horizons A1 — Component Contracts

This file defines semantic HTML/CSS usage. Visual philosophy belongs in `CANONICAL-STYLE.md`; production QA belongs in `STYLE-REFINEMENTS.md`.

## 1. Page

```html
<article class="hz-page hz-content hz-unit-1" data-page="1">
  <main class="hz-page__content">
    <div class="hz-page-stack">...</div>
  </main>
  <footer class="hz-page__footer">
    <span class="hz-page-code">Horizons A1 · Unit 1</span>
    <span class="hz-page-number">1</span>
  </footer>
</article>
```

Use one `.hz-unit-*` identity on a normal page.

## 2. Lesson header

```html
<header class="hz-lesson-header">
  <div class="hz-lesson-tab" aria-label="Lesson 1A">
    <span class="hz-lesson-tab__label">Lesson</span>
    <span class="hz-lesson-tab__id">1A</span>
  </div>
  <div class="hz-lesson-heading">
    <h1 class="hz-lesson-title">Hi, I’m Bri!</h1>
    <div class="hz-objectives">
      <span class="hz-objectives__item">The verb to be</span>
      <span class="hz-objectives__item">Alphabet</span>
    </div>
  </div>
</header>
```

Titles/objectives come from the locked syllabus or authorized source.

## 3. Numbered exercise lane

```html
<div class="hz-exercises">
  <section class="hz-exercise" id="HZN-A1-U01-LA-E01">
    <div class="hz-exercise-number">1</div>
    <div class="hz-exercise__content">
      <p class="hz-exercise__instruction">Read and listen.</p>
      <div class="hz-exercise__body">...</div>
    </div>
  </section>
</div>
```

Every numbered exercise stays in this single vertical lane. Never use a page-level grid to place sibling exercises side by side.

## 4. Internal grids

Use `.hz-question-grid--2/--3` or `.hz-content-grid--2/--3` **inside one exercise only**.

```html
<div class="hz-exercise__body hz-question-grid hz-question-grid--2">
  <div class="hz-question">...</div>
  <div class="hz-question">...</div>
</div>
```

## 5. Repeated media families

For equal-status photographs or visual clues, treat the set as one composition.

```html
<div class="hz-exercise__body hz-media-family hz-media-family--full-lane">
  <figure>...</figure>
  <figure>...</figure>
  <figure>...</figure>
  <figure>...</figure>
</div>
```

Use `hz-media-family--full-lane` when the dominant family should be centered across the usable exercise/page lane rather than appearing shifted by the exercise-number column.

Do not recreate this with arbitrary negative margins in every lesson. The reusable geometry lives in `guardrails.css`.

The family itself still chooses its grid columns/gaps. Equal-status items should share size/crop treatment, and action vocabulary images must remain large enough to read at physical print size.

## 6. Photography

Standard frame:

```html
<figure class="hz-media-frame hz-media-frame--landscape">
  <img src="..." alt="...">
</figure>
```

For prototypes, `.hz-photo-placeholder` must occupy the intended final crop rather than a generic temporary box.

For stronger editorial compositions use existing reusable patterns in `components.css` / `editorial-layouts.css` such as media stages, offsets, bands, collages and photo strips instead of inventing another near-duplicate component.

## 7. Reading/editorial feature

```html
<article class="hz-feature-panel">
  <figure class="hz-feature-panel__media">...</figure>
  <div class="hz-feature-panel__copy">
    <h2 class="hz-feature-panel__title">...</h2>
    <p class="hz-reading-copy">...</p>
  </div>
</article>
```

The split belongs inside one exercise if the feature is numbered.

## 8. Language-focus areas

```html
<section class="hz-focus-box hz-no-break">
  <header class="hz-focus-box__header">Grammar · Verb to be</header>
  <div class="hz-focus-box__body">...</div>
</section>
```

Use restrained focus treatment for grammar/pronunciation when explicit clarification is pedagogically useful.

## 9. Functional labels

```html
<span class="hz-new-words">New words</span>
<div class="hz-go-to">Grammar Reference · page ---</div>
```

Do not convert ordinary labels into decorative pills/cards.

## 10. Real-world UI

Rounded/shadowed UI is appropriate when the content genuinely represents a form, chat, ticket, review, app or similar interface.

```html
<article class="hz-ui-card" aria-label="Sample interface">...</article>
```

The artifact must be used by the learner, not included only for visual authenticity.

## 11. Text roles

When local composition could otherwise compress text, use the semantic roles provided by `guardrails.css`:

- `.hz-student-text`
- `.hz-dialogue-text`
- `.hz-task-text`
- `.hz-interface-text`
- `.hz-micro-text`

Do not label ordinary learning content as interface/micro merely to bypass the A1 legibility floor.

## 12. Architecture boundary

Reusable cross-lesson components belong in `design-system/`.

Lesson-specific corrections, asset filenames and crop tuning belong in `../production/`.

Before creating a new component or override, search the existing system for an equivalent. Prefer extension of one canonical component over a near-duplicate.

## 13. Content protection

Visual redesign does not authorize silent educational edits. Preserve frozen content unless the author explicitly requests a change.

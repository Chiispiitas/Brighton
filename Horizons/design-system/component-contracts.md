# Horizons component contracts

These patterns define how new Horizons pages call the native HTML5/CSS design system. They are structural contracts, not finished lesson content.

## Non-negotiable exercise-flow rule

**All exercises on a page must live in one vertical column and appear in numerical order.**

Do not place Exercise 1 beside Exercise 2, or Exercise 4 in one page column while Exercise 5 starts in another. The exercise lane is always linear and vertical.

Two- or three-column layouts are allowed **inside an exercise body only**, for example:

- question sets;
- answer choices;
- vocabulary items;
- image matching;
- short profile cards;
- a photo beside a reading;
- a table beside an audio/QR panel.

Use:

- `.hz-question-grid--2`
- `.hz-question-grid--3`
- `.hz-content-grid--2`
- `.hz-content-grid--3`
- `.hz-inset-grid--2`
- `.hz-inset-grid--3`

Never use those containers to place sibling `.hz-exercise` elements side by side.

## Page

```html
<article class="hz-page hz-content" data-page="31">
  <main class="hz-page__content">
    <div class="hz-page-stack">
      <!-- page header / mode bar -->
      <div class="hz-exercises" aria-label="Lesson exercises">
        <!-- Exercise 1 -->
        <!-- Exercise 2 -->
        <!-- Exercise 3 -->
      </div>
    </div>
  </main>
  <footer class="hz-page__footer">
    <span class="hz-page-code">Horizons A1 · 3A</span>
    <span class="hz-page-number">31</span>
  </footer>
</article>
```

There are no mirrored left/right page classes.

## Lesson header

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
      <span class="hz-objectives__item">Numbers</span>
    </div>
  </div>

  <div class="hz-lesson-signal" aria-hidden="true">
    <span class="hz-lesson-signal__label">Language</span>
    <span class="hz-lesson-signal__rail"><span></span><span></span><span></span></span>
  </div>
</header>
```

Titles and objectives must come from the locked syllabus or frozen pre-existing page.

## Exercise lane

```html
<div class="hz-exercises">
  <section class="hz-exercise" id="HZN-A1-U01-LA-E01">
    <div class="hz-exercise-number" aria-hidden="true">1</div>
    <div class="hz-exercise__content">
      <p class="hz-exercise__instruction">Read and listen.</p>
      <div class="hz-exercise__body">...</div>
    </div>
  </section>

  <section class="hz-exercise" id="HZN-A1-U01-LA-E02">...</section>
</div>
```

Every production exercise receives a permanent semantic ID. Audio track IDs remain text, not artwork.

## Two-column questions inside one exercise

```html
<section class="hz-exercise" id="HZN-A1-U01-LA-E04">
  <div class="hz-exercise-number" aria-hidden="true">4</div>
  <div class="hz-exercise__content">
    <p class="hz-exercise__instruction">Complete the questions.</p>
    <div class="hz-exercise__body hz-question-grid hz-question-grid--2">
      <div class="hz-question"><strong class="hz-question__number">1</strong><span>...</span></div>
      <div class="hz-question"><strong class="hz-question__number">2</strong><span>...</span></div>
      <div class="hz-question"><strong class="hz-question__number">3</strong><span>...</span></div>
      <div class="hz-question"><strong class="hz-question__number">4</strong><span>...</span></div>
    </div>
  </div>
</section>
```

This is the preferred way to save space without breaking the single exercise lane.

## Feature panel inside one exercise

A reading may feel visually rich without becoming a separate page column:

```html
<div class="hz-exercise__body">
  <article class="hz-feature-panel">
    <figure class="hz-feature-panel__media">...</figure>
    <div class="hz-feature-panel__copy">
      <h2 class="hz-feature-panel__title">A day in the life</h2>
      <p>...</p>
    </div>
  </article>
</div>
```

The media/text split belongs to Exercise 1; Exercise 2 still starts below it.

## Skill / mode bar

```html
<div class="hz-mode-bar" aria-label="Reading focus">
  <span class="hz-mode-bar__icon">R</span>
  <span class="hz-mode-bar__title">Reading</span>
  <span class="hz-mode-bar__descriptor">Finding simple information</span>
</div>
```

Skill labels are part of the Horizons identity, but their geometry and palette are original to this system.

## New Words

```html
<span class="hz-new-words">
  <span class="hz-new-words__icon">+</span>
  New words
</span>
```

## Grammar or pronunciation focus

```html
<section class="hz-focus-box hz-no-break">
  <header class="hz-focus-box__header">Grammar · Verb to be</header>
  <div class="hz-focus-box__body">
    <!-- explanation and examples -->
  </div>
</section>
```

Use the same component for pronunciation or other explicit language-focus areas.

## Cross-reference

```html
<div class="hz-go-to">Grammar Reference · Verb to be · page ---</div>
```

Page numbers may remain placeholders until pagination is final.

## Extra practice

```html
<aside class="hz-extra-practice hz-no-break">
  <span class="hz-extra-practice__label">Extra practice</span>
  <span class="hz-extra-practice__prompt">Ask a classmate about their job.</span>
</aside>
```

## Raster image

```html
<figure>
  <div class="hz-media-frame hz-media-frame--landscape">
    <img src="../assets/images/example.webp" alt="...">
  </div>
  <figcaption class="hz-caption">...</figcaption>
</figure>
```

Production images must follow `asset-policy.md`.

## Native UI recreation

```html
<article class="hz-ui-card hz-no-break" aria-label="Sample interface">
  <header class="hz-ui-card__header">Reviews</header>
  <div class="hz-ui-card__body">...</div>
</article>
```

Prefer original HTML/CSS recreations over copied proprietary screenshots when the educational task does not require an actual screenshot.

## Visual inspiration boundary

Reference coursebooks may inform general editorial principles such as:

- visible lesson identity;
- strong information hierarchy;
- skill/focus labels;
- varied media scale;
- compact but readable exercise rhythm;
- occasional full-width feature blocks;
- distinct grammar, pronunciation, speaking, and review surfaces.

Do **not** reproduce a reference book’s exact palette, tab shape, page chrome, exercise iconography, header geometry, typography, or page composition. Horizons uses its own indigo/aqua/coral/sun palette, asymmetric rounded geometry, horizon rails, offset lesson stamp, vertical exercise spine, and semantic HTML5 composition.

## Content protection

The visual redesign does not authorize content changes. The syllabus and all pre-existing Student's Book pages remain frozen unless the author explicitly requests a change.

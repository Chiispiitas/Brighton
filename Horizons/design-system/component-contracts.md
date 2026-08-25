# Horizons component contracts

These patterns define how new Horizons pages should call the native HTML5/CSS design system. They are structural contracts, not finished lesson content.

## Page

```html
<article class="hz-page hz-content" data-page="31">
  <main class="hz-page__content">
    <div class="hz-page-stack">
      <!-- semantic page content -->
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
</header>
```

Titles and objectives must come from the locked syllabus or frozen pre-existing page.

## Exercise

```html
<section class="hz-exercise" id="HZN-A1-U01-LA-E06">
  <div class="hz-exercise-number" aria-hidden="true">6</div>
  <div>
    <p class="hz-exercise__instruction">
      <span class="hz-audio-badge">▶ 1.4</span>
      Listen and repeat.
    </p>
    <div class="hz-exercise__body">
      <!-- activity content -->
    </div>
  </div>
</section>
```

Every production exercise receives a permanent semantic ID. Audio track IDs remain text, not artwork.

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

## Reading/profile card

```html
<article class="hz-reading-card hz-no-break">
  <img class="hz-reading-card__image" src="..." alt="...">
  <h3 class="hz-reading-card__name">Profile title</h3>
  <div class="hz-reading-card__body">
    <p>...</p>
  </div>
</article>
```

Cards are editorial surfaces, not a recurring-character system.

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

## Answer mechanics

```html
<span class="hz-answer-line" aria-label="Answer space"></span>
```

```html
<span class="hz-choice-box" aria-hidden="true"></span>
```

For digital exercises, visual print mechanics should be replaced or paired with real form controls.

## Native UI recreation

```html
<article class="hz-ui-card hz-no-break" aria-label="Sample interface">
  <header class="hz-ui-card__header">Reviews</header>
  <div class="hz-ui-card__body">
    <!-- original semantic HTML/CSS recreation -->
  </div>
</article>
```

Prefer original HTML/CSS recreations over copied proprietary screenshots when the educational task does not require an actual screenshot.

## Layout

Use CSS Grid and Flexbox through the shell primitives:

- `.hz-grid` + `.hz-col-*`
- `.hz-two-column`
- `.hz-two-column--wide-left`
- `.hz-two-column--wide-right`
- `.hz-three-column`

Do not use manual absolute positioning for normal lesson content.

## Content protection

The native visual redesign does not authorize content changes. The syllabus and all pre-existing Student's Book pages remain frozen unless the author explicitly requests a change.

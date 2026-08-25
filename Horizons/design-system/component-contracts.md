# Horizons component contracts

These patterns define how new Horizons pages call the editorial HTML5/CSS system. They are structural contracts, not finished lesson content.

## Non-negotiable exercise-flow rule

**All numbered exercises on a page live in one vertical sequence and appear in numerical order.**

Do not place Exercise 1 beside Exercise 2, or Exercise 4 in one page column while Exercise 5 starts in another.

Two- or three-column layouts are allowed **inside an exercise body only**, for example:

- question sets;
- answer choices;
- vocabulary items;
- image matching;
- profiles;
- a photograph beside a reading;
- a table beside an audio/QR area.

Use `.hz-question-grid--2/--3` and `.hz-content-grid--2/--3` inside an exercise. Never use them to place sibling `.hz-exercise` elements side by side.

## Editorial rule

Do not assume that content needs a card, pill, gradient, shadow or decorative container.

The default page language is typography + photography + white space + thin rules. Containers are reserved for content that genuinely benefits from them, especially grammar/pronunciation focus areas and simulated real-world interfaces.

Bespoke CSS for a distinctive lesson feature is acceptable and should not automatically be promoted into a global component.

## Page

```html
<article class="hz-page hz-content hz-unit-1" data-page="1">
  <main class="hz-page__content">
    <div class="hz-page-stack">
      <!-- header / unnumbered editorial matter -->
      <div class="hz-exercises" aria-label="Lesson exercises">
        <!-- Exercise 1 -->
        <!-- Exercise 2 -->
        <!-- Exercise 3 -->
      </div>
    </div>
  </main>
  <footer class="hz-page__footer">
    <span class="hz-page-code">Horizons A1 · Unit 1 · 1A</span>
    <span class="hz-page-number">1</span>
  </footer>
</article>
```

Use one `.hz-unit-*` identity on a normal page. Avoid mixing unit colors.

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

## Internal question columns

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

This saves space without breaking the vertical exercise sequence.

## Editorial photo + text feature

```html
<div class="hz-exercise__body">
  <article class="hz-feature-panel">
    <figure class="hz-feature-panel__media">...</figure>
    <div class="hz-feature-panel__copy">
      <h2 class="hz-feature-panel__title">A day in the life</h2>
      <p class="hz-reading-copy">...</p>
    </div>
  </article>
</div>
```

The split belongs to one exercise; the next numbered exercise still starts below it.

## Skill line

```html
<div class="hz-mode-bar" aria-label="Reading focus">
  <span class="hz-mode-bar__title">Reading</span>
  <span class="hz-mode-bar__descriptor">Finding simple information</span>
</div>
```

Use only when the skill label is pedagogically useful.

## New Words

```html
<span class="hz-new-words">New words</span>
```

Do not turn ordinary labels into decorative badges by default.

## Grammar or pronunciation focus

```html
<section class="hz-focus-box hz-no-break">
  <header class="hz-focus-box__header">Grammar · Verb to be</header>
  <div class="hz-focus-box__body">
    <!-- explanation and examples -->
  </div>
</section>
```

Use the same restrained component for pronunciation or another explicit language-focus area.

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

## Real-world UI recreation

Rounded cards and shadows are appropriate when reproducing the *idea* of an app, review, ticket, form or similar interface:

```html
<article class="hz-ui-card hz-no-break" aria-label="Sample interface">
  <header class="hz-ui-card__header">Reviews</header>
  <div class="hz-ui-card__body">...</div>
</article>
```

Prefer original semantic HTML/CSS recreations over copied proprietary interface artwork when the educational task does not require an actual screenshot.

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

## Content protection

The visual redesign does not authorize content changes. The syllabus and all pre-existing Student's Book pages remain frozen unless explicitly changed by the author.

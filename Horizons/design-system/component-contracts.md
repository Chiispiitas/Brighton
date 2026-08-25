# Horizons Component Contracts

These semantic patterns define how Stage 2+ HTML should call the Stage 1 design system. They are examples of structure, not finished pages.

## Lesson header

```html
<header class="hz-lesson-header">
  <div class="hz-lesson-tab" aria-label="Lesson 1A">
    <span class="hz-lesson-tab__label">Lesson</span>
    <span class="hz-lesson-tab__id">1A</span>
  </div>

  <h1 class="hz-lesson-title">New Friends</h1>
  <div class="hz-objectives">
    <span class="hz-objectives__item">Verb “to be”</span>
    <span class="hz-objectives__item">Alphabet</span>
    <span class="hz-objectives__item">Numbers (0–10)</span>
  </div>
</header>
```

The actual title/objectives must come from the locked syllabus or frozen pre-existing page. Do not use the example to rewrite existing content.

## Exercise

```html
<section class="hz-exercise" id="HZN-A1-U01-LA-E06">
  <div class="hz-exercise-number">6</div>
  <p class="hz-exercise__instruction">
    <span class="hz-audio-badge">
      <span aria-hidden="true">♪</span>
      <span>1.4</span>
    </span>
    Listen and repeat.
  </p>
  <div class="hz-exercise__body">
    <!-- activity content -->
  </div>
</section>
```

Rules:

- every production exercise receives a permanent semantic ID;
- visual exercise number and semantic ID are separate concerns;
- audio track IDs must remain explicit text rather than being baked into an image.

## NEW WORDS label

```html
<div class="hz-new-words">
  <span class="hz-new-words__icon" aria-hidden="true">✦</span>
  <span>New Words</span>
</div>
```

A functional SVG icon may replace the text glyph later.

## Grammar focus box

```html
<aside class="hz-focus-box hz-no-break">
  <div class="hz-focus-box__header">
    <span class="hz-focus-box__label">GRAMMAR:</span>&nbsp; VERB TO BE
  </div>
  <div class="hz-focus-box__body">
    <!-- grammar explanation and examples -->
  </div>
</aside>
```

## Pronunciation focus box

Use the same structural component as Grammar so the visual grammar remains consistent:

```html
<aside class="hz-focus-box hz-no-break">
  <div class="hz-focus-box__header">
    <span class="hz-focus-box__label">PRONUNCIATION:</span>&nbsp; THE ALPHABET
  </div>
  <div class="hz-focus-box__body">
    <!-- pronunciation content -->
  </div>
</aside>
```

## Cross-reference

```html
<p class="hz-go-to">Go to: Vocabulary - Occupations, page ---</p>
```

Page numbers may remain placeholders during composition and be resolved after pagination.

## Extra Practice

```html
<div class="hz-extra-practice hz-no-break">
  <span class="hz-extra-practice__label">Extra Practice</span>
  <span class="hz-extra-practice__prompt">
    Speak about your occupation. What do you do? Where do you work?
  </span>
</div>
```

## Circular vocabulary photo

```html
<figure>
  <img
    class="hz-photo-circle"
    src="../assets/images/example.webp"
    alt="A doctor"
  >
  <figcaption class="hz-photo-label">A doctor</figcaption>
</figure>
```

Production photos must follow `asset-policy.md`.

## Reading/profile card

```html
<article class="hz-reading-card hz-no-break">
  <img class="hz-reading-card__image" src="..." alt="...">
  <h3 class="hz-reading-card__name">Sarah</h3>
  <div class="hz-reading-card__body">
    <p>Hi! I’m Sarah.</p>
    <p>I’m a doctor, and work in a hospital.</p>
  </div>
</article>
```

Cards are a layout component, not a recurring-character system.

## Answer line

```html
<span class="hz-answer-line" aria-label="Answer space"></span>
```

For accessible digital exercises, this visual element should later be paired with or replaced by an actual form control in the digital version.

## Choice box

```html
<span class="hz-choice-box" aria-hidden="true"></span>
```

Printed choice boxes remain visual. Digital exercises should use real radio/checkbox controls.

## UI recreation

```html
<section class="hz-ui-card hz-no-break" aria-label="Sample chat">
  <div class="hz-ui-card__header">Class 4 Chat</div>
  <div class="hz-ui-card__body">
    <!-- original pedagogical recreation -->
  </div>
</section>
```

Do not embed copied proprietary interface artwork when a simple original HTML/CSS recreation can serve the task.

## Stage 2 contract

When the A4 page shell is built, it should consume these components rather than redefining them page-by-page. New components may be added when the existing Student's Book demonstrates a repeated pattern not yet represented here.

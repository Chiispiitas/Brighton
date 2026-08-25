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

## Photography and overlay rule

Dynamic pages should come primarily from **photography, crop decisions, overlays and controlled overlap**.

Allowed editorial treatments include:

- title or lead text over a photograph;
- a dark photo scrim solely to preserve text readability;
- a small annotation crossing a photo edge;
- a text block overlapping the lower-right or lower-left corner of a photo;
- a lower-third information band over an image;
- a dominant image with one or two independent inset crops;
- a pull quote partially overlapping a photograph;
- numbered/lettered image strips for matching activities.

Do **not** use decorative gradients as page furniture. A gradient is acceptable only as a functional photographic scrim.

Do **not** create fake visual complexity by stacking many cards. Prefer one strong image composition with a clear hierarchy.

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

## Full-photo text overlay

Use for a strong lesson lead when the image can support legible overlaid copy.

```html
<figure class="hz-media-stage">
  <div class="hz-media-stage__photo">
    <img src="..." alt="...">
    <div class="hz-photo-scrim"></div>
    <div class="hz-photo-overlay">
      <span class="hz-photo-overlay__kicker">A day in the life</span>
      <h2 class="hz-photo-overlay__title">Morning starts early.</h2>
      <p class="hz-photo-overlay__text">...</p>
    </div>
    <div class="hz-photo-flag">6:30 a.m.</div>
  </div>
</figure>
```

Use `.hz-photo-scrim` only for image readability, not as general decoration.

## Offset overlapping caption block

```html
<div class="hz-media-stage hz-media-stage--offset">
  <div class="hz-media-stage__photo">
    <img src="..." alt="...">
  </div>
  <aside class="hz-media-stage__offset-copy">
    <h3>Busy or quiet?</h3>
    <p>...</p>
  </aside>
</div>
```

The copy overlaps the image boundary and creates visual movement without introducing another card system.

## Lower-third image band

```html
<div class="hz-media-stage hz-media-stage--band">
  <div class="hz-media-stage__photo">
    <img src="..." alt="...">
  </div>
  <div class="hz-photo-band">
    <span class="hz-photo-band__label">Weather brief</span>
    <span class="hz-photo-band__text">...</span>
  </div>
</div>
```

Use this when the overlaid text is short. Do not place long reading passages inside the band.

## Photo collage with inset crops

```html
<div class="hz-media-collage">
  <img class="hz-media-collage__main" src="..." alt="...">
  <div class="hz-media-collage__inset hz-media-collage__inset--top"><img src="..." alt="..."></div>
  <div class="hz-media-collage__inset hz-media-collage__inset--bottom"><img src="..." alt="..."></div>
  <blockquote class="hz-photo-quote">...<cite>...</cite></blockquote>
</div>
```

Inset crops should show meaningful details from the topic: an object, texture, food item, sign, accessory, map detail or secondary scene.

## Photo strip

```html
<div class="hz-photo-strip" style="--hz-photo-count:3">
  <div class="hz-photo-strip__item"><img src="..." alt="..."><span class="hz-photo-strip__label">A</span></div>
  <div class="hz-photo-strip__item"><img src="..." alt="..."><span class="hz-photo-strip__label">B</span></div>
  <div class="hz-photo-strip__item"><img src="..." alt="..."><span class="hz-photo-strip__label">C</span></div>
</div>
```

Use 2–4 items. This is an internal activity layout, not an exercise-column layout.

## Development placeholder

Until final photography is sourced, use `.hz-photo-placeholder` inside the same production composition so layout QA happens against the **real intended crop**, not against a generic box.

```html
<div class="hz-photo-placeholder">
  <span class="hz-photo-placeholder__meta">Wide travel photograph · 16:7 crop</span>
</div>
```

When replacing it with an image, preserve the parent composition and crop dimensions.

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

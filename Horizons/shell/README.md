# Horizons A4 shell

The shell turns semantic Horizons HTML into fixed A4 Student's Book pages.

## Page rule

Each `<article class="hz-page">` is exactly **210 × 297 mm** and becomes one printed/PDF page.

The shell provides the page frame, margins, footer, review furniture, media-frame helpers and QA overlay. Reusable lesson components come from `../design-system/components.css`, which imports `tokens.css`.

Lesson-specific CSS is loaded from adjacent files in `../examples/`.

## Exercise flow

All sibling numbered exercises stay in one vertical lane and numerical order:

```html
<div class="hz-exercises">
  <section class="hz-exercise">...</section>
  <section class="hz-exercise">...</section>
</div>
```

Two/three-column layouts are allowed only inside one exercise body.

## Continuation pages

New lesson continuation pages should use:

```html
<article class="hz-page hz-content hz-unit-2 hz-continuation-page">
  <main class="hz-page__content">
    <div class="hz-continuation">2A</div>
    ...
  </main>
</article>
```

The shared component provides a default safe top offset. If a lesson's first composition needs extra clearance, adjust the content offset in that lesson's local CSS rather than moving the shared marker.

## Files

- `a4-shell.css` — fixed page frame and page-level helpers;
- `print.css` — browser-to-PDF rules;
- `page-template.html` — semantic starter.

## Print settings

- Paper: A4
- Orientation: Portrait
- Scale: 100%
- Margins: None
- Background graphics: On
- Browser headers/footers: Off

Add `hz-debug` to `<body>` during QA to reveal the fixed content frame. The debug overlay does not print.

Visual and pedagogical rules are not duplicated here; follow `../design-system/HANDOFF.md`.

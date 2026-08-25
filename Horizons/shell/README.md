# Horizons A4 shell

The shell turns semantic HTML5 into fixed A4 Student's Book pages.

## Core rule

Each `<article class="hz-page">` is exactly **210 × 297 mm** and becomes one printed/PDF page.

The shell intentionally uses a **single consistent content frame on every page**. It does not mirror the geometry or decorative layout of the legacy book and does not use left/right page classes.

## Files

- `a4-shell.css` — A4 page frame, grid/flex layout primitives, media frames, review furniture, QR slots, and QA overlay
- `print.css` — browser-to-PDF rules
- `page-template.html` — minimal semantic HTML5 page starter

## HTML structure

Prefer native elements such as:

```html
<article class="hz-page hz-content">
  <main class="hz-page__content">
    <header>...</header>
    <section>...</section>
    <figure>...</figure>
    <aside>...</aside>
  </main>
  <footer class="hz-page__footer">...</footer>
</article>
```

Use CSS Grid and Flexbox for composition rather than manually positioned floating objects.

## Print settings

- Paper: A4
- Orientation: Portrait
- Scale: 100%
- Margins: None
- Background graphics: On
- Browser headers/footers: Off

Add `hz-debug` to `<body>` during QA to reveal the fixed content frame. The debug overlay never prints.

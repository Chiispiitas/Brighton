# Horizons A4 shell

The shell turns semantic HTML5 into fixed A4 Student's Book pages.

## Core page rule

Each `<article class="hz-page">` is exactly **210 × 297 mm** and becomes one printed/PDF page.

The shell uses a single consistent content frame on every page. It does not mirror legacy page geometry and does not use left/right page classes.

## Hard exercise-flow rule

All numbered exercises on a page must appear in **one vertical lane** and stay in numerical order.

Use:

```html
<div class="hz-exercises">
  <section class="hz-exercise">Exercise 1...</section>
  <section class="hz-exercise">Exercise 2...</section>
  <section class="hz-exercise">Exercise 3...</section>
</div>
```

Do not put sibling exercises in two page columns.

Two- and three-column layouts are allowed only **inside an exercise body**, for example with:

- `.hz-question-grid--2`
- `.hz-question-grid--3`
- `.hz-content-grid--2`
- `.hz-content-grid--3`
- `.hz-inset-grid--2`
- `.hz-inset-grid--3`

This keeps the learning sequence obvious while still allowing dense, varied page design.

## Visual identity

The current shell uses an original Horizons visual system:

- indigo, aqua, coral, sun and plum accents;
- a thin multicolor "horizon" rail near the top of every page;
- asymmetric rounded surfaces rather than textbook tabs;
- offset lesson stamps;
- a subtle vertical exercise spine;
- compact skill/mode bars;
- editorial feature panels;
- system-native typography;
- CSS Grid/Flexbox rather than manually positioned artwork.

Reference coursebooks may inspire hierarchy, rhythm, density and variety, but their exact palette, tabs, page chrome, exercise icons, typography and compositions must not be reproduced.

## Files

- `a4-shell.css` — A4 page frame, internal layout primitives, media frames, review furniture, QR slots and QA overlay
- `print.css` — browser-to-PDF rules
- `page-template.html` — semantic HTML5 starter with the required exercise lane

## Print settings

- Paper: A4
- Orientation: Portrait
- Scale: 100%
- Margins: None
- Background graphics: On
- Browser headers/footers: Off

Add `hz-debug` to `<body>` during QA to reveal the fixed content frame. The debug overlay never prints.

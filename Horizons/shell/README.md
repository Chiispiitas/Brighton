# Horizons A4 shell

The shell turns semantic HTML5 into fixed A4 Student's Book pages and two-page lesson spreads.

## Core page rule

Each `<article class="hz-page">` is exactly **210 × 297 mm** and becomes one printed/PDF page.

The shell uses a single consistent content frame on every page. It does not mirror legacy page geometry and does not use left/right page classes.

## Two-page lesson rule

A normal lesson should use:

```html
<div class="hz-spread">
  <article class="hz-page hz-page--opener">...</article>
  <article class="hz-page hz-page--continuation">...</article>
</div>
```

The two pages should be designed together, with purposeful contrast in density, image scale and activity type.

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

Two- and three-column layouts are allowed only **inside an exercise body**.

## Imported publication layers

`a4-shell.css` imports:

- core components/tokens;
- publication typography;
- shape-led editorial layouts;
- two-page spread behavior;
- archetypes/density/focus variants;
- optional unit motifs;
- functional icon styles;
- Vocabulary Practice / Grammar Reference back matter;
- development QA utilities.

## Current visual identity

The system is deliberately print-editorial rather than dashboard-like:

- warm off-white paper;
- mostly neutral typography;
- one dominant color per unit;
- straight edges and thin rules as the default;
- large raster photography;
- controlled full-bleed/frame-breaking media;
- structural shapes on feature pages;
- simple large exercise numerals;
- flat language-focus areas;
- shadows/rounding mainly for simulated interfaces;
- semantic HTML5 and CSS Grid/Flexbox.

Reference coursebooks may inspire hierarchy, rhythm, density and variety, but their exact palette, tabs, page chrome, exercise icons, typography and compositions must not be reproduced.

## Master template

`page-template.html` now contains a complete two-page lesson spread with:

- opener page;
- continuation page;
- density/archetype hooks;
- vertical exercise lanes;
- structured page-ending patterns.

## Print settings

- Paper: A4
- Orientation: Portrait
- Scale: 100%
- Margins: None
- Background graphics: On
- Browser headers/footers: Off

## QA

Visual QA classes and the browser audit are documented in `../qa/`.

The publication PDF must not include development overlays or browser headers/footers.

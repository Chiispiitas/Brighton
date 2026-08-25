# Horizons — Stage 2 A4 Master Shell

This folder contains the fixed-page print shell used by all Student's Book HTML.

## Files

- `a4-shell.css` — exact A4 canvas, mirrored margins, page furniture, grids, media slots and QA utilities.
- `print.css` — browser-to-PDF print rules.
- `page-template.html` — blank one-page master.

## Page contract

Every printed page is one `.hz-page` element measuring exactly `210mm × 297mm`.

Use:

```html
<section class="hz-page hz-page--right hz-content">
  <main class="hz-page__content">...</main>
  <footer class="hz-page__footer">
    <span class="hz-page-number">31</span>
    <span class="hz-page-code">3A</span>
  </footer>
</section>
```

For the facing page, use `hz-page--left` so the inner/binding margin is mirrored automatically.

## Master measurements

- Page: A4 portrait (`210 × 297 mm`)
- Top safe margin: `12 mm`
- Bottom safe margin: `14 mm` plus footer reservation
- Inner/binding margin: `16 mm`
- Outer margin: `13 mm`
- Footer height: `8 mm`
- Editorial grid: 12 columns

These values are centralized as CSS custom properties so later print QA can tune the shell without rewriting lesson markup.

## Preview vs print

On screen, pages appear on a neutral gray workspace with spacing and a subtle shadow.

At print/PDF time:

- page margins are forced to zero;
- each `.hz-page` becomes exactly one printed A4 page;
- CSS backgrounds/colors are preserved;
- browser shadows disappear;
- page breaks occur only between `.hz-page` elements;
- internal exercise/card elements avoid breaking.

Recommended browser print settings:

- Paper: A4
- Orientation: Portrait
- Scale: 100%
- Margins: None
- Background graphics: On
- Headers and footers: Off

## Debug mode

Temporarily add `hz-debug` to `<body>`:

```html
<body class="hz-book hz-debug">
```

The screen preview will show the safe area. Debug markings are forcibly suppressed during print.

## Asset rule

`hz-media-placeholder` is for development only. Final Student's Book pages must replace placeholders with free licensed or approved generated raster images. SVG is reserved for functional icons and shapes; vector illustrations are prohibited.

## Locked source rule

This shell is a new production layer under `Horizons/`. It does not modify the syllabus or any pre-existing pages/files in `Horizons A1/`.

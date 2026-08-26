# Horizons Base A4 shell

The shell turns semantic Horizons HTML into fixed A4 Student's Book pages and is shared across books.

## Page rule

Each `<article class="hz-page">` is exactly **210 × 297 mm** and becomes one printed/PDF page.

The shell provides the page frame, margins, footer, review furniture, media-frame helpers and QA overlay. Reusable components come from `../design-system/components.css`, which imports `tokens.css`.

## CSS loading

`a4-shell.css` imports **only shared Base components**.

It must never import A1, A2 or other book/lesson-specific CSS. Each lesson HTML links its own adjacent local stylesheet after the Base shell.

For a current A1 lesson in `Horizons/A1/Lessons/`:

```html
<link rel="stylesheet" href="../../Base/shell/a4-shell.css">
<link rel="stylesheet" href="./lesson-2a-local.css">
<link rel="stylesheet" href="../../Base/shell/print.css" media="print">
```

## Exercise flow

All sibling numbered exercises stay in one vertical lane and numerical order. Two/three-column layouts are allowed only inside one exercise body.

## Continuation pages

Use the shared continuation marker:

```html
<article class="hz-page hz-content hz-unit-2 hz-continuation-page">
  <main class="hz-page__content">
    <div class="hz-continuation">2A</div>
    ...
  </main>
</article>
```

The shared component provides a default safe top offset. If a lesson's first composition needs extra clearance, adjust only that lesson's content offset rather than moving the shared marker.

## Files

- `a4-shell.css` — fixed page frame and page-level helpers;
- `print.css` — browser-to-PDF rules;
- `page-template.html` — generic semantic starter.

## Print settings

- Paper: A4
- Orientation: Portrait
- Scale: 100%
- Margins: None
- Background graphics: On
- Browser headers/footers: Off

Add `hz-debug` to `<body>` during QA to reveal the fixed content frame. The debug overlay does not print.

Visual and pedagogical rules are not duplicated here; follow `../design-system/HANDOFF.md`.

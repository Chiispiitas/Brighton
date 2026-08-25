# Horizons QA

Horizons includes visual debug CSS, a browser layout audit and a dependency-free structured-content validator.

## Visual debug classes

Add one or more classes to `<body class="hz-book ...">` during development:

- `hz-debug-grid` — 4 mm composition grid
- `hz-debug-baseline` — baseline rhythm overlay
- `hz-debug-safe` — fixed content safe-area outline
- `hz-debug-trim` — trim/registration hint

Element-level QA markers:

- `hz-qa-overflow`
- `hz-qa-lowres`
- `hz-qa-missing-asset`

All QA furniture is suppressed by print CSS.

## Browser layout audit

Load:

```html
<script src="../qa/page-audit.js"></script>
```

The script reports to the browser console and exposes the result as:

```js
window.HorizonsAudit
```

Checks include:

- fixed page-frame overflow;
- duplicate HTML IDs;
- increasing exercise number order;
- missing `.hz-exercises` / `.hz-exercise-flow` lanes;
- suspicious exercise nesting in grids;
- missing `alt` attributes;
- unresolved development image placeholders;
- production exercise ID format;
- approximate QR size.

The script is development-only and should not be required by production pages.

## Structured content validation

Run from the `Horizons/` directory:

```bash
node qa/validate-content.mjs content/example-lesson.json
```

The validator checks:

- course/level/unit/lesson metadata;
- exactly two pages per normal lesson;
- stable exercise ID format;
- duplicate exercise IDs;
- increasing exercise number sequence across the lesson;
- required instructions;
- broken audio references;
- broken asset references;
- audio printed-track/script presence;
- basic asset metadata warnings.

It intentionally has no npm dependency.

## Publication checklist

See `print-qa-checklist.md` for the human editorial/print review that must accompany automated checks.

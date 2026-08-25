# Horizons QA

Horizons includes both visual debug CSS and a lightweight browser audit script.

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

## Browser audit

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

## Publication checklist

See `print-qa-checklist.md` for the human editorial/print review that must accompany automated checks.

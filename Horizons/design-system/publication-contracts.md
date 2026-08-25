# Horizons publication contracts

These contracts supplement `component-contracts.md` and apply to production Student's Book lessons.

## 1. Author the spread, not just the page

A normal lesson is one `.hz-spread` containing two `.hz-page` elements.

- Page 1: `.hz-page--opener`
- Page 2: `.hz-page--continuation`

The pages do not mirror each other, but they should visibly belong together.

## 2. Choose archetype and density deliberately

Every production page should have a conscious density. Lessons should also have a declared spread archetype in structured content or production notes.

Do not default every page to medium density merely because it is convenient.

## 3. Preserve the exercise lane

Numbered exercises remain one vertical sequence on each page. All complexity belongs inside an exercise body.

No spread/page feature is allowed to override this rule.

## 4. Use type before containers

Before adding a box/card, attempt hierarchy with:

- display size;
- weight;
- spacing;
- rules;
- reading measure;
- column structure;
- photography/crop.

A container is justified when it communicates a real content category, such as Grammar, Pronunciation, a quiz field, a simulated app, or a self-contained reading feature.

## 5. Differentiate Grammar and Pronunciation

Grammar:

```html
<section class="hz-focus-box hz-focus-box--grammar">...</section>
```

Pronunciation:

```html
<section class="hz-focus-box hz-focus-box--pronunciation">...</section>
```

Do not reuse the exact same treatment for both.

## 6. Functional icon use

Reference the shared sprite:

```html
<svg class="hz-icon" aria-hidden="true">
  <use href="../assets/icons/horizons-icons.svg#icon-audio"></use>
</svg>
```

Icons must remain functional and secondary. Do not build decorative scenes out of SVG.

## 7. Full bleed / frame breaking

Use only on media/editorial elements:

- `.hz-bleed-left`
- `.hz-bleed-right`
- `.hz-bleed-x`
- `.hz-break-frame-left`
- `.hz-break-frame-right`
- `.hz-break-frame-both`

Never apply these utilities to answer lines, exercise numerals, grammar tables or QR quiet zones.

## 8. Controlled overlap

Allowed on photography, quotes, captions and large structural shapes.

Never overlap:

- exercise numerals;
- student answer spaces;
- QR codes;
- table cells students must complete;
- essential instructions.

## 9. Page endings

Avoid accidental empty bottoms. If a page genuinely needs a closing interaction, use an intentional pattern:

- communication;
- reflection / “I can…”;
- digital extension / QR;
- reference.

Do not force a page-ending module simply to fill space.

## 10. Back matter

Vocabulary Practice and Grammar Reference use `backmatter.css` and may be denser than lesson pages.

They retain unit color and typography but prioritize reference efficiency.

## 11. Assets

Every production external image must have a row in `../assets/asset-ledger.csv`.

Every produced/approved audio track must have a row in `../audio/audio-manifest.csv`.

## 12. Structured content

Production lesson metadata should eventually conform to `../content/content-schema.json` so exercise IDs, assets, audio and answer-key data can be reused across companion products.

## 13. QA before approval

Run browser audit + human checklist. A spread is not publication-ready merely because it fits inside A4.

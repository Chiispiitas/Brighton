# Horizons A1 — Canonical Style Refinements

These refinements extend the approved Stage 3 direction. They do not replace `CANONICAL-STYLE.md`.

## Controlled repetition

When several items belong to the same exercise or visual family, they should normally share the same silhouette and structural treatment.

Use variety through:

- color;
- image crop;
- opacity;
- scale;
- type weight;
- typographic contrast;
- content hierarchy.

Avoid giving every item a different geometric shape simply to create novelty. Repetition is useful when it improves scanning and makes the exercise feel intentional.

Examples:

- four greeting photographs in one matching/recognition exercise may all use circular crops;
- a sequence of numbers may all use circles while varying their vibrant background colors;
- cards or information exchanges in the same group should keep the same geometry even if their tones differ;
- alphabet pairs may use stronger uppercase color and a faded lowercase version of the same hue instead of changing each letter pair into a different container.

## Structural uniformity across lessons

Horizons should be visually varied at the **activity and page-composition level**, but the recurring book chrome must remain stable from lesson to lesson.

The following elements should use one shared treatment unless the design system itself is intentionally revised:

- lesson tab geometry and hierarchy;
- lesson-header spacing and rule treatment;
- exercise-number lane;
- normal exercise-instruction scale;
- audio/track badge geometry;
- `Go to:` cross-reference alignment;
- continuation marker size, shape, typography and position;
- continuation-page top rhythm;
- Extra Practice alignment;
- page footer and page-number treatment.

Do not solve a local collision by changing one instance of shared chrome. For example, if a continuation marker overlaps an activity, **move or recompose the activity** rather than shrinking, stretching or relocating only that lesson's continuation marker.

Content density may still vary slightly between pages when necessary to preserve source material, avoid clipping or support the pedagogy. Likewise, Lesson A, B, C and D should retain distinct compositions appropriate to their different pedagogical roles. Uniformity means stable navigation and structural mechanics, not identical page templates.

The current Unit 1 prototypes are normalized through `canonical-refinements.css`, which acts as the final guard against accidental drift in shared layout mechanics.

## No translucent background words

Do **not** use oversized translucent words, letters, punctuation marks or instructional phrases as decorative background elements behind lesson content.

This includes treatments such as faded words like `WORK`, `WORLD`, `PAIRWORK`, `CHECK-IN`, `YOUR BUSINESS`, `FORM`, `ADJECTIVES`, or similar pseudo-element text used only to fill space or add visual texture.

Functional typography is still encouraged when the text has an actual reading or navigation purpose, for example:

- lesson titles;
- exercise instructions;
- section headings;
- continuation markers such as `1B`, `1C`, `1D`;
- labels inside real-world forms, chats, tickets or interfaces;
- meaningful photo captions;
- real task prompts.

For visual energy, prefer photography, crop, whitespace, structural geometry, thin rules, scale, overlap and functional typography instead of ghosted background text.

This is a permanent rule for all current and future Horizons lessons.

## Lesson tab hierarchy

Everything inside `.hz-lesson-tab` must be visually centered.

The hierarchy is:

1. `.hz-lesson-tab__id` — dominant element and largest type inside the tab;
2. `.hz-lesson-tab__label` — small supporting label.

The lesson ID should be the first thing the eye reads inside the tab.

## Meaningful micro-variety

Small variation is encouraged when it communicates something.

Good examples:

- uppercase letters use the full unit color while lowercase letters use a lighter/faded version;
- repeated number circles use different vibrant colors but retain exactly the same circular shape;
- photograph crops vary because the source image or pedagogy needs a different crop;
- one key item may use scale contrast to establish hierarchy.

Avoid variation that changes shape, border logic, alignment and color all at once. A visual family should usually vary along one or two dimensions, not every available dimension.

## Consistency before novelty

Before adding a new shape, ask:

- Is this item part of a repeated set?
- Would the exercise scan faster if the set shared one shape?
- Can the desired variety be achieved with color, crop, opacity, typography or scale instead?

If yes, prefer the repeated structure.

These rules should be applied alongside the existing permanent rule that sibling numbered exercises remain in one vertical sequence.

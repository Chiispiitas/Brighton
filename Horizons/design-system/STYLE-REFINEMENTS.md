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

## A1 legibility floor — permanent

**Never solve page-fit, clipping or density problems by making student-facing language uncomfortably small.**

Horizons is an A1 coursebook that students must be able to inspect, compare, underline, analyze and reuse. This is especially important for Guided Discovery: the language evidence students are expected to notice must remain physically easy to read at printed A4 size.

The design tokens in `tokens.css` define the minimum physical type sizes for each role:

- normal student-facing text: `--hz-fs-student-min` = **7.75pt minimum**;
- dialogue / model language: `--hz-fs-dialogue-min` = **8pt minimum**;
- task-support language: `--hz-fs-task-min` = **8pt minimum**;
- authentic interface/form text: `--hz-fs-interface-min` = **7pt minimum**;
- genuinely secondary microtext only: `--hz-fs-micro-min` = **6.5pt minimum**.

These are **floors, not preferred targets**. Normal body text should usually be larger. A value below 7.75pt is not acceptable for ordinary dialogue, questions, explanations, examples, discovery prompts, practice items, pairwork language, model sentences or peer-check instructions.

The 6.5–7pt range is reserved for genuinely secondary interface metadata, tiny functional labels, captions or similar material that students are not expected to read as the main learning content.

### Density-resolution order

When a page does not fit, use this order before reducing typography:

1. remove unnecessary decorative space;
2. reduce oversized image height or change the crop;
3. reduce redundant margins, gaps or padding;
4. simplify non-pedagogical geometry;
5. recompose columns **inside the same exercise**;
6. shorten purely decorative/interface furniture that is not source content;
7. redistribute the activity across the two-page lesson while preserving exercise order;
8. only then consider a very small type adjustment, and never below the role-specific floor.

Do not compress one lesson into visibly smaller typography than neighboring lessons simply to keep an existing composition intact. **The composition must adapt to the content, not the content to an undersized composition.**

Before accepting a lesson page, compare its body, dialogue, form, discovery and pairwork text against at least one neighboring canonical lesson at the same physical zoom/print size. If the new lesson visibly reads smaller, treat that as a layout defect.

## Content economy and density discipline — permanent

**Do not make a lesson crowded by repeating information, over-scaffolding obvious questions, or preserving redundant artifacts just because they were already designed.**

Every visible block on the two-page spread should earn its space pedagogically. A context, form, model, option set, hint, caption or support element should remain only when it gives the learner information that is necessary for the next step, reduces cognitive load, or supports the real-world outcome.

Permanent rules:

- do not show the same information twice in different formats unless students must explicitly compare the two formats;
- do not repeat a completed form beside a dialogue when the dialogue already provides all of the evidence needed for the discovery task, unless reading the completed form itself is an explicit learning objective;
- do not add answer choices to a Guided Discovery question when the learner can reasonably answer from the visible evidence without them;
- do not add `Yes / No`, `a / b`, word banks, labels or hints by default; add them only when they are needed to make the A1 task achievable;
- do not keep a redundant model, interface, caption or decorative support element if removing it gives the important language more room to breathe;
- one strong model is preferable to two partially redundant models;
- a real-world artifact should be functional, not duplicated as decorative proof of the context;
- if a page feels crowded, first audit **content redundancy** before changing typography, spacing or image scale.

Guided Discovery still requires enough evidence and support. The goal is **minimal sufficient scaffolding**, not minimal teaching. Remove support only when the remaining context still allows an A1 learner to reach the intended discovery reliably.

### Two-page density audit

Before a lesson is accepted, inspect both pages together and ask:

1. Is any information presented twice without a comparison purpose?
2. Is any option set giving away an answer that students could discover from the context?
3. Is any model or artifact present only because it looks authentic rather than because students use it?
4. Are normal student-facing text sizes comparable to neighboring lessons?
5. Does each exercise have enough white space to be scanned quickly?
6. Is the most important context or final task visually dominant rather than surrounded by secondary clutter?
7. Could one block be removed entirely without weakening the learning sequence? If yes, remove it.

A lesson that is technically complete but visibly denser, smaller, or more cluttered than neighboring lessons is **not production-ready**.

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
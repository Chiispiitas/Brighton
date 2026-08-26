# Horizons A1 — Canonical Style Refinements

These are **specific production refinements** to `CANONICAL-STYLE.md`. They intentionally avoid repeating the whole design philosophy. When a specific rule here conflicts with an older illustrative example elsewhere, this file wins.

## 1. Controlled repetition

Items that belong to one visual family should normally share silhouette, border logic, alignment and basic scale.

Create variety through crop, content, emphasis, opacity or limited typographic contrast rather than changing every structural property at once.

## 2. Repeated-media alignment and scale

A repeated image family must be evaluated as one composition, not as isolated thumbnails.

Permanent rules:

- center the family against the usable page composition, not accidentally against a narrowed sub-column;
- equal-status images should use a common size and crop family;
- do not compensate for a shifted grid with arbitrary per-image nudges;
- if the exercise number lane makes a dominant media family look offset, use the reusable full-lane geometry in `guardrails.css` (`.hz-media-family--full-lane`) or an equivalent structural solution;
- action-based vocabulary imagery must remain large enough that the action is obvious at physical A4 print size;
- after changing image diameter, aspect ratio, column count or gap, re-check the whole family for centering, crop and visual weight.

As a practical benchmark, small action photographs generally need more physical area than simple object clues. Do not reduce them to decorative thumbnail size merely to preserve an existing grid.

## 3. Structural uniformity

Shared book chrome stays consistent across lessons: lesson tabs, lesson headers, exercise-number lane, instruction hierarchy, audio treatment, continuation markers, cross-references, Extra Practice and footer/page-number treatment.

Fix local collisions by recomposing local content. Do not distort shared chrome in only one lesson.

## 4. A1 legibility floor

Never solve density, clipping or page-fit problems by making important student-facing language uncomfortably small.

The minimum physical sizes are defined once in `tokens.css`:

- normal student-facing text: `--hz-fs-student-min`;
- dialogue/model language: `--hz-fs-dialogue-min`;
- task-support language: `--hz-fs-task-min`;
- authentic interface text: `--hz-fs-interface-min`;
- genuinely secondary microtext: `--hz-fs-micro-min`.

These are floors, not preferred targets.

When a page is too dense, resolve it in this order: remove redundancy → remove decorative space → reframe oversized imagery → tighten nonessential gaps/padding → simplify geometry → recompose inside the exercise → redistribute across the two-page lesson. Typography is not the first compression tool.

## 5. Content economy

Use **minimal sufficient scaffolding**.

Do not repeat the same information in a dialogue, form, table, caption or interface unless comparison between those forms is part of the task. Do not add `a / b`, `Yes / No`, word banks or hints automatically when the visible evidence already makes the A1 discovery achievable.

Real-world artifacts must be functional. One strong model is preferable to two redundant models.

## 6. No decorative ghost text

Do not use oversized translucent words, letters, punctuation or instructional phrases as background decoration.

Use photography, whitespace, crop, structural geometry, rules and functional typography instead.

## 7. Unit-color discipline

Normal lesson pages use one dominant unit color with neutral typography and photography. A repeated family should not become multicolored merely for novelty. Additional colors require a pedagogical reason such as meaningful categorization.

This newer rule supersedes older examples that treated multicolor variation itself as a default source of micro-variety.

## 8. Bold has pedagogical meaning

Bold in learner-facing language is **functional emphasis, not decoration**. It should tell the student exactly what to notice.

Use bold surgically:

- in grammar examples, bold the exact form, ending, auxiliary, article, pronoun or other language feature being contrasted or discovered;
- when the learning point is a contraction, emphasize the contracted `be` element itself, for example `I**’m**`, `She**’s**`, `You**’re**`, rather than making the whole example sentence bold;
- in vocabulary or reading text, bold a word or short phrase only when that emphasis has a clear learning purpose;
- keep surrounding example language at normal weight so the target form has real contrast;
- do not scatter bold across a paragraph simply to make it look lively, and do not use bold as a substitute for unnecessary boxes, pills or extra color.

Structural typography is separate: titles, exercise numbers, section labels and other book chrome may use heavy weights for hierarchy. The rule above applies to **language the learner is expected to inspect, compare, understand or reuse**.

A useful check is: **if a student looks only at the bold language, is the intended learning focus obvious?** If not, the emphasis is probably too broad or arbitrary.

## 9. Production QA checklist

Before approving a two-page lesson, check:

1. Are numbered exercises in one vertical sequence?
2. Is any information duplicated without a learning purpose?
3. Are Guided Discovery prompts supported but not over-scaffolded?
4. Is important text physically comparable in size to neighboring lessons?
5. Do repeated image families share geometry, adequate scale and correct centering?
6. Does any image family appear shifted because of the exercise-number lane?
7. Does the page retain enough whitespace to scan quickly?
8. Are artifacts used by the learner rather than included only for authenticity?
9. Does bold isolate the actual learning target rather than decorate whole sentences or paragraphs?
10. Is shared chrome unchanged unless the global system itself was intentionally revised?
11. Could an exception rule be replaced by an existing reusable component or guardrail?

A spread that is technically complete but visibly smaller, more crowded, misaligned or less coherent than neighboring lessons is not production-ready.

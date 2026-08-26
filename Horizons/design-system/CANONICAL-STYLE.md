# Horizons A1 — Canonical Book Style

**Status: APPROVED / CANONICAL**

This is the normative visual and structural specification for the Horizons A1 Student’s Book. Pedagogy is defined in `GUIDED-DISCOVERY.md`; specific production refinements and QA rules are in `STYLE-REFINEMENTS.md`.

If an older illustrative example conflicts with a newer specific refinement, the newer refinement wins.

## 1. Desired character

Horizons should feel like a professionally art-directed contemporary **print coursebook**, not a web dashboard, worksheet template or imitation of another publisher.

The balance is:

- editorial rather than interface-heavy;
- creative rather than templated;
- structured rather than chaotic;
- photographic rather than illustration-led;
- dynamic rather than rigid;
- print-first rather than screen-first;
- visually varied while mechanically consistent.

## 2. Core visual language

Canonical traits:

- A4 print-first pages;
- warm off-white paper;
- neutral black/gray typography;
- one dominant unit color per normal lesson/page;
- substantial whitespace;
- large, deliberate raster photography;
- intentional crops and controlled image/text overlap;
- strong typographic hierarchy;
- simple large exercise numerals;
- straight edges and thin editorial rules by default;
- large CSS geometry used structurally;
- magazine/article/poster treatments when the content benefits;
- rounded/shadowed UI mainly for simulated real-world interfaces;
- almost no decorative gradients;
- very limited generic cards and pills;
- no decorative vector illustration;
- SVG only for functional icons.

Creativity should come from **composition, photography, crop, scale, typography, whitespace and structural geometry**, not from accumulating small decorative components.

## 3. Exercise-flow rule

**All numbered exercises remain in one vertical sequence.**

Sibling numbered exercises are never placed side by side.

Columns and grids are allowed only **inside one exercise** for questions, options, vocabulary, images, profiles, tables, readings, forms, collages, matching, reviews, timelines and similar internal material.

## 4. Two-page lesson architecture

Every lesson occupies two A4 pages.

- Lesson A — Grammar and/or Vocabulary.
- Lesson B — Reading/Listening with supporting Vocabulary.
- Lesson C — Grammar and/or Vocabulary.
- Lesson D — Speaking or Writing culminating in a believable real-world outcome.
- Unit Review follows the four lessons.
- Grammar Reference/Practice and Vocabulary Practice remain back-of-book activity sections.

The four lesson letters have different pedagogical jobs and should not be forced into one identical page template.

For the full learning sequence and Lesson D transaction model, follow `GUIDED-DISCOVERY.md` rather than duplicating methodology here.

## 5. Source fidelity and frozen boundary

When adapting an existing Student’s Book page, preserve the educational source exactly unless the author explicitly requests a content change.

This includes lesson title/focus, numbering, instructions, questions, options, dialogue/reading wording, grammar examples, vocabulary, capitalization, audio references, form labels, cross-references and Extra Practice wording.

The frozen source remains in `Horizons A1/`. Normal production work belongs in `Horizons/`.

An explicit author correction overrides source fidelity for that requested item; do not keep stale documentation claiming the older source behavior after such a correction.

## 6. Typography and legibility

Typography should establish hierarchy before containers do.

Prefer strong lesson titles, clear instructions, readable body language, restrained labels and meaningful size/weight contrast.

Do not solve page density by shrinking important learning content. Role-specific minimum physical sizes live in `tokens.css`; enforcement and QA guidance live in `guardrails.css` and `STYLE-REFINEMENTS.md`.

## 7. Unit color

A normal lesson uses one dominant unit color with neutral type and photography.

The unit color may appear in exercise numerals, structural rules, selected titles, language emphasis and one or two major fields.

Repeated families should not become multicolored merely for novelty. Additional colors require a pedagogical reason, such as meaningful categorization.

## 8. Photography

Photography carries substantial visual weight in final production.

Use real or generated raster photography when appropriate. Prefer one strong image over several weak decorative images unless comparison, matching, sequence or vocabulary recognition requires a set.

Crops should be intentional. Subject direction, negative space and environmental context should support the page flow and task.

For occupation/action vocabulary, show people **doing the job**, not simply posing, when action makes the meaning clearer.

Placeholders are allowed during prototyping but must preserve intended final crop, scale and composition.

## 9. Repeated media families

Repeated equal-status images form one visual system.

They should share geometry, basic size and alignment. Judge the family as a whole against the usable page composition.

Do not allow the exercise-number lane to make a dominant image family appear shifted. Use the reusable full-lane media geometry from `guardrails.css` when appropriate.

Images must remain physically large enough that the required action/object is recognizable at A4 print size. Detailed production rules and QA checks live in `STYLE-REFINEMENTS.md`.

## 10. Real-world interfaces

Forms, chats, tickets, schedules, maps, reviews, menus and app-like elements may use more authentic UI geometry, including controlled rounding or shadow, because the interface itself is part of the task.

They must be functional: students should read, interpret, complete, respond to or use them.

Do not add an interface merely because it looks contemporary.

## 11. Containers, shapes and effects

Default page language is typography + photography + whitespace + thin rules.

Use a container when it clarifies grammar/pronunciation, organizes a real-world interface, or supports a deliberate editorial composition.

Avoid:

- wrapping ordinary content in cards by default;
- generic pills as labels;
- decorative gradients;
- random mixed silhouettes inside one repeated family;
- decoration added only to fill empty space;
- oversized translucent background words, letters or punctuation.

Large CSS shapes are allowed when they support hierarchy, grouping, reading flow, task meaning or image emphasis.

## 12. Shared chrome

The following are stable across lessons unless the global system itself is intentionally revised:

- lesson tab geometry and hierarchy;
- lesson-header rhythm;
- exercise-number lane;
- instruction hierarchy;
- audio treatment;
- cross-reference alignment;
- continuation marker treatment;
- continuation-page top rhythm;
- Extra Practice alignment;
- footer and page-number treatment.

Local collisions are solved by recomposing local content, not by changing one instance of shared chrome.

## 13. Pairwork and productive outcomes

Pairwork is a core learning mechanism, not decoration. It should normally involve retrieval, comparison, information exchange, checking, decision-making, rehearsal or role-play.

Lesson D should culminate in a situation where the learner has a role, reason to communicate, information to exchange and a concrete product/outcome.

Follow `GUIDED-DISCOVERY.md` for the canonical details.

## 14. Production architecture

Reusable cross-lesson rules belong in `design-system/`.

Unit/lesson-specific fixes, crop tuning and asset mappings belong in `../production/`.

Do not promote a local correction into the design system merely because it was needed once. Do not duplicate an existing rule in a new file; link to the source of truth instead.

## 15. Approval test

A spread is not production-ready if it is noticeably more crowded, smaller, misaligned, less readable or less coherent than neighboring lessons.

Before approval, verify source fidelity, exercise order, Guided Discovery flow, legibility, content economy, repeated-family alignment, shared chrome, whitespace, functional artifacts and image crop/scale.

When a visual idea conflicts with the learning sequence, **the pedagogy wins**.

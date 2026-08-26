# Horizons A1 — Canonical Book Style

**Status: APPROVED / CANONICAL**

This is the normative visual and structural specification for the Horizons A1 Student’s Book. Pedagogy is defined in `GUIDED-DISCOVERY.md`; specific production refinements and QA rules are in `STYLE-REFINEMENTS.md`.

If an older illustrative example conflicts with a newer specific refinement, the newer refinement wins.

## 1. Desired character

Horizons should feel like a professionally art-directed contemporary **print publication with coursebook usability**, not a web dashboard, worksheet template or imitation of another publisher.

The balance is:

- editorial rather than interface-heavy;
- creative rather than templated;
- structured rather than chaotic;
- photographic rather than illustration-led;
- dynamic rather than rigid;
- print-first rather than screen-first;
- visually varied while mechanically consistent;
- **content-led rather than school-coded**.

The book’s identity comes from its typography, composition, photography, whitespace, color discipline and shared chrome. It does **not** depend on every spread looking educational, academic or classroom-themed.

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
- magazine, article, poster, catalog, documentary, travel, lifestyle or other editorial treatments when the content benefits;
- rounded/shadowed UI mainly for simulated real-world interfaces;
- almost no decorative gradients;
- very limited generic cards and pills;
- no decorative vector illustration;
- SVG only for functional icons.

Creativity should come from **composition, photography, crop, scale, typography, whitespace, structural geometry and the visual world of the lesson**, not from accumulating small decorative components.

## 3. Theme and visual world

Horizons has **no mandatory educational visual theme**.

The visual world should follow the situation, topic, people and setting of the lesson. A spread may feel like hospitality, travel, street life, fitness, retail, food, transport, home life, work, culture, sports, technology, nature, entertainment, documentary photography, a magazine feature, a service counter, a social setting or another appropriate world.

Permanent rules:

- do not add classroom, notebook, pencil, blackboard, school-building or study-desk imagery merely to make a page look like a language book;
- do not append phrases such as `educational style`, `school theme`, `classroom aesthetic` or equivalent to image prompts as a default;
- a school or classroom setting is valid when the lesson itself genuinely takes place there;
- image art direction should describe the **actual scene and mood**, not the fact that the image will appear in a coursebook;
- neighboring lessons may have noticeably different visual atmospheres while still belonging to Horizons;
- consistency across the book is carried by the design system, not by forcing every image into the same subject matter or mood.

When choosing between a generic education-coded image and an image that makes the lesson’s real-world context feel believable, prefer the believable context.

## 4. Exercise-flow rule

**All numbered exercises remain in one vertical sequence.**

Sibling numbered exercises are never placed side by side.

Columns and grids are allowed only **inside one exercise** for questions, options, vocabulary, images, profiles, tables, readings, forms, collages, matching, reviews, timelines and similar internal material.

## 5. Two-page lesson architecture

Every lesson occupies two A4 pages.

- Lesson A — Grammar and/or Vocabulary.
- Lesson B — Reading/Listening with supporting Vocabulary.
- Lesson C — Grammar and/or Vocabulary.
- Lesson D — Speaking or Writing culminating in a believable real-world outcome.
- Unit Review follows the four lessons.
- Grammar Reference/Practice and Vocabulary Practice remain back-of-book activity sections.

The four lesson letters have different pedagogical jobs and should not be forced into one identical page template or one identical visual theme.

For the full learning sequence and Lesson D transaction model, follow `GUIDED-DISCOVERY.md` rather than duplicating methodology here.

## 6. Source fidelity and frozen boundary

When adapting an existing Student’s Book page, preserve the educational source exactly unless the author explicitly requests a content change.

This includes lesson title/focus, numbering, instructions, questions, options, dialogue/reading wording, grammar examples, vocabulary, capitalization, audio references, form labels, cross-references and Extra Practice wording.

The frozen source remains in `Horizons A1/`. Active book work belongs in `Horizons/`.

An explicit author correction overrides source fidelity for that requested item; do not keep stale documentation claiming the older source behavior after such a correction.

## 7. Typography and legibility

Typography should establish hierarchy before containers do.

Prefer strong lesson titles, clear instructions, readable body language, restrained labels and meaningful size/weight contrast.

Do not solve page density by shrinking important learning content. Role-specific minimum physical sizes live in `tokens.css`; enforcement and QA guidance live in `guardrails.css` and `STYLE-REFINEMENTS.md`.

## 8. Unit color

A normal lesson uses one dominant unit color with neutral type and photography.

The unit color may appear in exercise numerals, structural rules, selected titles, language emphasis and one or two major fields.

Repeated families should not become multicolored merely for novelty. Additional colors require a pedagogical reason, such as meaningful categorization.

The unit color is a unifying book device, not a requirement that the underlying photography share one literal scene palette.

## 9. Photography

Photography carries substantial visual weight in final production.

Use real or generated raster photography when appropriate. Prefer one strong image over several weak decorative images unless comparison, matching, sequence or vocabulary recognition requires a set.

Art-direct photographs as believable images from the world represented: documentary, editorial, lifestyle, commercial, environmental portraiture, travel, hospitality, food, workplace, sport, culture or another appropriate photographic language. Do not make photographs look scholastic simply because they are used for learning.

Crops should be intentional. Subject direction, negative space and environmental context should support the page flow and task.

For occupation/action vocabulary, show people **doing the job**, not simply posing, when action makes the meaning clearer.

For real-world situations, prioritize environmental evidence that makes the setting instantly legible: the hotel desk should feel like a hotel desk, the gym should feel like a gym, the bus stop should feel like public transport, and so on.

Placeholders are allowed during prototyping but must preserve intended final crop, scale, composition and scene logic.

## 10. Repeated media families

Repeated equal-status images form one visual system.

They should share geometry, basic size and alignment. Judge the family as a whole against the usable page composition.

Shared geometry does **not** require identical subject matter, location, lighting or mood. A repeated family can contain distinct visual worlds when the choices themselves represent different contexts.

Do not allow the exercise-number lane to make a dominant image family appear shifted. Use the reusable full-lane media geometry from `guardrails.css` when appropriate.

Images must remain physically large enough that the required action/object is recognizable at A4 print size. Detailed production rules and QA checks live in `STYLE-REFINEMENTS.md`.

## 11. Real-world interfaces

Forms, chats, tickets, schedules, maps, reviews, menus and app-like elements may use more authentic UI geometry, including controlled rounding or shadow, because the interface itself is part of the task.

They must be functional: students should read, interpret, complete, respond to or use them.

Do not add an interface merely because it looks contemporary.

## 12. Containers, shapes and effects

Default page language is typography + photography + whitespace + thin rules.

Use a container when it clarifies grammar/pronunciation, organizes a real-world interface, or supports a deliberate editorial composition.

Avoid:

- wrapping ordinary content in cards by default;
- generic pills as labels;
- decorative gradients;
- random mixed silhouettes inside one repeated family;
- decoration added only to fill empty space;
- oversized translucent background words, letters or punctuation;
- generic school/study motifs added only to signal `education`.

Large CSS shapes are allowed when they support hierarchy, grouping, reading flow, task meaning or image emphasis.

## 13. Shared chrome

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

Shared chrome is what allows a hotel-themed spread, a transport-themed spread and a lifestyle-themed spread to look like the same book without making their imagery artificially similar.

## 14. Pairwork and productive outcomes

Pairwork is a core learning mechanism, not decoration. It should normally involve retrieval, comparison, information exchange, checking, decision-making, rehearsal or role-play.

Lesson D should culminate in a situation where the learner has a role, reason to communicate, information to exchange and a concrete product/outcome.

The visual setting should make that situation feel credible without turning the page into a literal depiction of `students learning English` unless that is the situation itself.

Follow `GUIDED-DISCOVERY.md` for the canonical details.

## 15. Repository architecture

Reusable cross-lesson rules belong in `design-system/`.

Lesson-specific composition and CSS belong directly in the corresponding lesson HTML under `examples/`, scoped to that lesson. Final raster assets belong in `Images/` and are referenced directly from the lesson that uses them.

Image prompts, generation notes and temporary art direction remain outside the repository unless the author explicitly asks for them to be saved.

Do **not** create a separate `production/`, `staging/`, compatibility-overrides or lesson-overrides folder. A lesson should not require a second hidden stylesheet layer to reveal its intended appearance.

Do not promote a local correction into the design system merely because it was needed once. Do not duplicate an existing rule in a new file; link to the source of truth instead.

## 16. Approval test

A spread is not production-ready if it is noticeably more crowded, smaller, misaligned, less readable or less coherent than neighboring lessons.

Before approval, verify source fidelity, exercise order, Guided Discovery flow, legibility, content economy, repeated-family alignment, shared chrome, whitespace, functional artifacts, image crop/scale and **visual-world fidelity**.

Ask: could the photography plausibly belong to the real setting or editorial world being represented, or does it look like generic stock imagery selected because this is a school book?

When a visual idea conflicts with the learning sequence, **the pedagogy wins**. When pedagogy does not require a specific visual theme, **the content world leads the art direction**.

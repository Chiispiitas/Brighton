# Horizons — Canonical Book Style

**Status: CANONICAL / VISUAL AND STRUCTURAL SOURCE OF TRUTH**

This file governs the shared visual and structural system of the Horizons coursebook series. Pedagogy and level-specific learner-language progression are governed by `GUIDED-DISCOVERY.md`. Semantic implementation is governed by `component-contracts.md`; assets are governed by `asset-policy.md`.

There is no secondary refinements document. If a permanent series-wide rule changes, update this file and the reusable CSS/component contract together.

## 1. Book character

Horizons is a professionally art-directed **print publication with coursebook usability**.

It is:

- A4 and print-first;
- editorial rather than dashboard-like;
- photographic rather than illustration-led;
- structured but visually varied;
- content-led rather than school-coded;
- mechanically consistent without forcing every lesson into one template.

The series identity comes from typography, composition, photography, whitespace, disciplined unit color and shared chrome.

## 2. Lesson architecture

A standard Horizons lesson occupies two A4 pages.

- Lesson A — Grammar and/or Vocabulary.
- Lesson B — Reading/Listening with supporting Vocabulary.
- Lesson C — Grammar and/or Vocabulary.
- Lesson D — Speaking or Writing with a believable real-world outcome.
- Unit Review follows Lessons A–D.
- Grammar Reference/Practice and Vocabulary Practice are back-of-book activity sections.

The lesson letters have different pedagogical jobs and must not be forced into identical page compositions.

## 3. Exercise flow

**All sibling numbered exercises remain in one vertical sequence and numerical order.**

Columns/grids may appear **inside one exercise** for questions, options, vocabulary, readings, images, forms, tables, matching and similar internal content.

Normal numbered exercises are separated by numbering, whitespace and composition, not decorative horizontal dividers. `Go to:` cross-references also sit in open whitespace.

Do not invent response mechanics that the authorized task does not ask for. If an exercise is meant to contain only questions, show only the questions: no answer lines, boxes, check circles or other response affordances unless explicitly required by the source or task design.

## 4. Visual language

Default page language:

- warm off-white paper;
- neutral black/gray typography;
- one dominant unit color;
- substantial whitespace;
- deliberate raster photography;
- strong typographic hierarchy;
- large simple exercise numerals;
- straight edges and thin editorial rules;
- controlled CSS geometry when it supports structure;
- rounded/shadowed surfaces mainly when reproducing a real interface;
- almost no decorative gradients;
- no generic card/pill system;
- no decorative vector illustration;
- SVG only for functional icons.

Do not use oversized translucent words, letters, numerals or punctuation as background decoration. Do not add visual material merely to fill empty space.

## 5. Content-led visual worlds

Horizons has **no default school/classroom visual theme**.

The lesson's actual world determines setting, props, people and photographic mood. A lesson may inhabit hospitality, travel, transport, home life, fitness, retail, food, work, culture, technology, sport, street life or another appropriate environment.

Do not add notebooks, pencils, blackboards, school desks, classrooms or similar school-coded props unless they naturally belong to the scene. Do not describe generated images as `educational style`, `classroom aesthetic` or equivalent by default.

Neighboring lessons may look atmospherically different. Series unity comes from the shared system, not repeated subject matter.

## 6. Photography and media

Photography carries major visual weight. Prefer one strong image to several weak decorative images unless the task genuinely requires a family or sequence.

Crops must be intentional and preserve the action/object needed by the learner. Real-world settings need enough environmental evidence to read immediately as the intended place.

For occupation/action vocabulary, show the action when it improves recognition.

When the learner must interpret a **person/object relationship, physical distance, quantity or pointing context**, prefer a real or generated raster scene over a CSS-built silhouette/object diagram. CSS geometry may organize or frame media, but it should not approximate people and concrete objects when believable photography can carry the same pedagogical evidence more clearly.

For image-dependent exercises that will receive generated production art, structure the lesson around stable raster-image slots whose geometry survives placeholder replacement. Do not make the exercise depend on temporary CSS-drawn substitute characters or objects.

### Repeated media families

Equal-status images form one visual family:

- use common geometry and basic scale;
- center the family against the usable composition;
- avoid arbitrary per-image nudges;
- keep each item physically large enough to read at print size;
- different choices/places may retain different environments and moods.

Use the shared full-lane media helper when the exercise-number lane would otherwise make a dominant family look shifted.

### Content-height discipline

Do not impose large `min-height` values on text/profile bodies merely to make sibling items look equal. Artificial vertical floors create dead space and make short content feel unfinished.

Prefer natural content height for profile copy, messages, captions and similar text blocks. Equal-height treatment is justified only when the geometry itself is functional or when visual alignment materially improves comprehension. If one item is shorter, let the whitespace belong to the page rather than trapping it inside a card/profile body.

## 7. Typography and emphasis

Typography establishes hierarchy before containers do.

Important learner-facing language must remain above the physical floors defined in `tokens.css`. Current A1 production uses those floors as minimums; a future level may define stricter level-specific requirements without weakening shared print readability.

Do not solve density by shrinking important text. Resolve density in this order: remove redundancy → remove decorative space → reframe imagery → tighten nonessential spacing → simplify geometry → recompose the exercise → redistribute content across the lesson.

Short semantic labels that must read as one lexical item may use `white-space: nowrap` or content-sized grid columns when there is sufficient room. Do not allow a short two-word nationality, name, unit label or similar item to split awkwardly when the surrounding layout can absorb the width instead.

### Bold

Bold in learner-facing language has pedagogical meaning. Emphasize the exact form, word or feature the learner should notice; do not scatter bold merely for visual energy. Structural headings and chrome may use heavy weights normally.

## 8. Unit color

A normal lesson uses one dominant unit color with neutral typography and photography.

Use the unit color for exercise numerals, structural rules, selected titles, language emphasis and limited major fields. Additional colors require a pedagogical or authentic-interface reason.

Repeated families do not become multicolored merely for novelty.

For the **current Horizons A1 book**, crimson pink is the established book identity and remains consistent across units unless the author explicitly changes it. Do **not** infer a new Unit 2, Unit 3, etc. production color merely from the optional palette in `tokens.css`.

## 9. Containers, geometry and interfaces

Use a container when it clarifies language, organizes a functional artifact or enables a deliberate editorial composition.

Avoid wrapping ordinary content in generic cards, chips or pills. Large shapes are valid only when they support hierarchy, grouping, reading flow, task meaning or image emphasis.

Forms, chats, schedules, tickets, maps, reviews and app-like elements may use authentic UI geometry because the interface itself is part of the task. The learner must actually read, interpret, complete or use the artifact.

When simulating a recognizable interface, reproduce its **visual grammar**, not a vague generic card: hierarchy, spacing, message alignment, surface colors, controls, field rhythm, header treatment and interaction cues should make the artifact immediately legible as that kind of interface. Do not copy branding or add UI complexity that the learner does not need.

For forms and other paper artifacts, prefer CSS structure first: rules, bands, fields, subtle tints, spacing and restrained geometry. Add a photographic/background asset only when it contributes real contextual meaning that CSS cannot provide. Decorative treatments must never reduce writing space or field legibility.

## 10. Shared chrome

The following are reusable series-wide components and should remain visually stable unless the Base system itself is intentionally revised:

- lesson tab/header;
- exercise-number lane and instruction hierarchy;
- audio treatment;
- `NEW WORDS` cue;
- cross-reference treatment;
- continuation marker;
- Extra Practice treatment;
- footer/page number.

Continuation pages use the shared marker and a default safe top offset. A lesson may increase its content offset when the first composition would collide with the marker; move the local content, not the shared marker.

Local content collisions are solved in lesson-scoped CSS, not by redefining shared chrome.

## 11. Source fidelity

When adapting an existing book page, preserve the authorized source exactly unless the author explicitly requests a content change. This includes titles, focus, numbering, instructions, questions, options, dialogue/reading wording, examples, vocabulary, capitalization, audio references, form labels, cross-references and Extra Practice.

An explicit author correction becomes the new authority for that item. Remove stale documentation that still describes the superseded behavior.

Do not silently replace removed content with a new affordance. If the author removes answer choices, labels, titles or response spaces, the absence itself is authoritative unless a replacement is explicitly requested.

## 12. Repository boundary

- series-wide reusable design rules/components → `Horizons/Base/design-system/`;
- shared page shell → `Horizons/Base/shell/`;
- book-specific lesson HTML/local CSS → `<book>/Lessons/`, currently `Horizons/A1/Lessons/`;
- book-specific raster assets → `<book>/Images/`, currently `Horizons/A1/Images/`;
- book-specific audio, scripts, keys, tests, wordlists and similar resources → that book's folder;
- image prompts and temporary art-direction notes → outside the repository unless explicitly requested.

Do not create `production/`, `staging/`, compatibility-override or lesson-override directories.

Do not promote a one-off lesson fix into Base. Before adding a reusable component, check whether an existing component already solves the need.

## 13. Production approval

A spread is not production-ready if it is noticeably more crowded, smaller, misaligned, less readable or less coherent than neighboring approved lessons.

Before approval verify:

1. source fidelity or explicit authorization for changes;
2. numbered exercise order and single vertical lane;
3. pedagogy and level-appropriate language load against `GUIDED-DISCOVERY.md`;
4. readable physical type;
5. no redundant evidence, invented response mechanics or decoration;
6. repeated-media scale, crop and centering;
7. natural content height without trapped dead space;
8. shared chrome remains intact;
9. sufficient whitespace;
10. real-world artifacts are functional and visually recognizable as their intended artifact type;
11. short lexical labels do not wrap awkwardly when the layout can preserve them intact;
12. imagery belongs convincingly to the lesson's actual world.

When visual novelty conflicts with the learning sequence, **pedagogy wins**. When pedagogy does not require a theme, **the content world leads the art direction**.

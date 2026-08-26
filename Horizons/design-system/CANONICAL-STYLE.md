# Horizons A1 — Canonical Book Style

**Status: CANONICAL / VISUAL AND STRUCTURAL SOURCE OF TRUTH**

This file governs the visual and structural system of the Horizons A1 Student's Book. Pedagogy and learner-facing language progression are governed by `GUIDED-DISCOVERY.md`. Semantic implementation is governed by `component-contracts.md`; assets are governed by `asset-policy.md`.

There is no secondary “refinements” document. If a permanent cross-lesson rule changes, update this file and the reusable CSS/component contract together.

## 1. Book character

Horizons is a professionally art-directed **print publication with coursebook usability**.

It is:

- A4 and print-first;
- editorial rather than dashboard-like;
- photographic rather than illustration-led;
- structured but visually varied;
- content-led rather than school-coded;
- mechanically consistent without forcing every lesson into one template.

The book's identity comes from typography, composition, photography, whitespace, one-unit-color discipline and shared chrome.

## 2. Fixed lesson architecture

Every lesson occupies two A4 pages.

- Lesson A — Grammar and/or Vocabulary.
- Lesson B — Reading/Listening with supporting Vocabulary.
- Lesson C — Grammar and/or Vocabulary.
- Lesson D — Speaking or Writing with a believable real-world outcome.
- Unit Review follows Lessons A–D.
- Grammar Reference/Practice and Vocabulary Practice are back-of-book activity sections.

The four lesson letters have different pedagogical jobs and must not be forced into identical page compositions.

## 3. Exercise flow

**All sibling numbered exercises remain in one vertical sequence and numerical order.**

Columns/grids may appear **inside one exercise** for questions, options, vocabulary, readings, images, forms, tables, matching and similar internal content.

Normal numbered exercises are separated by numbering, whitespace and composition, not decorative horizontal dividers. `Go to:` cross-references also sit in open whitespace.

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

Neighboring lessons may look atmospherically different. Book unity comes from the shared system, not repeated subject matter.

## 6. Photography and media

Photography carries major visual weight. Prefer one strong image to several weak decorative images unless the task genuinely requires a family or sequence.

Crops must be intentional and must preserve the action/object needed by the learner. Real-world settings need enough environmental evidence to read immediately as the intended place.

For occupation/action vocabulary, show the action when it improves recognition.

### Repeated media families

Equal-status images form one visual family:

- use common geometry and basic scale;
- center the family against the usable composition;
- avoid arbitrary per-image nudges;
- keep each item physically large enough to read at A4 print size;
- different choices/places may retain different environments and moods.

Use the shared full-lane media helper when the exercise-number lane would otherwise make a dominant family look shifted.

## 7. Typography and emphasis

Typography establishes hierarchy before containers do.

Important learner-facing language must remain above the physical A1 floors defined in `tokens.css`. Do not solve density by shrinking important text.

When a page is too dense, resolve it in this order: remove redundancy → remove decorative space → reframe imagery → tighten nonessential spacing → simplify geometry → recompose the exercise → redistribute content across the two-page lesson.

### Bold

Bold in learner-facing language has pedagogical meaning. Emphasize the exact form, word or feature the learner should notice; do not scatter bold merely for visual energy. Structural headings and chrome may use heavy weights normally.

## 8. Unit color

A normal lesson uses one dominant unit color with neutral typography and photography.

Use the unit color for exercise numerals, structural rules, selected titles, language emphasis and limited major fields. Additional colors require a pedagogical or authentic-interface reason.

Repeated families do not become multicolored merely for novelty.

## 9. Containers, geometry and interfaces

Use a container when it clarifies language, organizes a functional artifact or enables a deliberate editorial composition.

Avoid wrapping ordinary content in generic cards, chips or pills. Large shapes are valid only when they support hierarchy, grouping, reading flow, task meaning or image emphasis.

Forms, chats, schedules, tickets, maps, reviews and app-like elements may use authentic UI geometry because the interface itself is part of the task. The learner must actually read, interpret, complete or use the artifact.

## 10. Shared chrome

The following are reusable cross-lesson components and should remain visually stable unless the system itself is intentionally revised:

- lesson tab/header;
- exercise-number lane and instruction hierarchy;
- audio treatment;
- `NEW WORDS` cue;
- cross-reference treatment;
- continuation marker;
- Extra Practice treatment;
- footer/page number.

Continuation pages use the shared continuation marker and a default safe top offset. A lesson may increase that content offset when its first composition would collide with the marker; move the content, not the marker.

Local content collisions are solved in lesson-scoped CSS, not by redefining shared chrome.

## 11. Source fidelity

When adapting an existing Student's Book page, preserve the source exactly unless the author explicitly requests a content change. This includes titles, focus, numbering, instructions, questions, options, dialogue/reading wording, examples, vocabulary, capitalization, audio references, form labels, cross-references and Extra Practice.

An explicit author correction becomes the new authority for that item. Remove stale documentation that still describes the superseded behavior.

The frozen source remains in `Horizons A1/`; active production belongs in `Horizons/`.

## 12. Repository boundary

- reusable cross-lesson rules/components → `design-system/`;
- lesson-specific composition, corrections, asset mappings and crop tuning → the matching lesson under `examples/`;
- final raster assets → `Images/`;
- image prompts and temporary art-direction notes → outside the repository unless explicitly requested.

Do not create `production/`, `staging/`, compatibility-override or lesson-override directories.

Do not promote a one-off lesson fix into the design system. Before adding a reusable component, check whether an existing component already solves the need.

## 13. Production approval

A spread is not production-ready if it is noticeably more crowded, smaller, misaligned, less readable or less coherent than neighboring approved lessons.

Before approval verify:

1. source fidelity or explicit authorization for changes;
2. numbered exercise order and single vertical lane;
3. pedagogy/language load against `GUIDED-DISCOVERY.md`;
4. readable physical type;
5. no redundant evidence or decoration;
6. repeated-media scale, crop and centering;
7. shared chrome remains intact;
8. sufficient whitespace;
9. real-world artifacts are functional;
10. imagery belongs convincingly to the lesson's actual world.

When visual novelty conflicts with the learning sequence, **pedagogy wins**. When pedagogy does not require a theme, **the content world leads the art direction**.

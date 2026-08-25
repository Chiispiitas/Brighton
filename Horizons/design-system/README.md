# Horizons design system

This directory defines the approved visual language and pedagogical method for the HTML/CSS master of **Horizons A1**.

## Start here in a new chat

Read:

1. `HANDOFF.md`
2. `CANONICAL-STYLE.md`
3. `GUIDED-DISCOVERY.md`
4. `STYLE-REFINEMENTS.md`

`HANDOFF.md` is the current resume document. It consolidates the latest design decisions, source-fidelity rules, discarded directions, reference priority, and the lessons learned from the Lesson 1A prototype.

`GUIDED-DISCOVERY.md` defines the book's **primary teaching methodology**: contextualized language input, explicit noticing/analysis questions, clarification after discovery, short controlled practice, pairwork, and transfer into meaningful real-world use.

## Canonical status

**The current Stage 3 design system plus the latest canonical refinements is the approved style for the Student's Book. Guided Discovery is the canonical pedagogical method that the design must support.**

Future design work should extend and refine this system rather than silently replace its visual philosophy or teaching methodology.

Primary practical references:

- `../examples/lesson-1a-canonical-prototype.html` — source-faithful adaptation of an existing lesson into the new style
- `../examples/stage-3-shape-showcase.html` — primary large-scale visual benchmark
- `../examples/stage-2-showcase.html` — supporting photography/overlay benchmark

## Core methodology: Guided Discovery

Horizons should normally **give students the language in context before giving them the rule**.

The expected learning direction is:

**context → noticing → guided analysis → clarification → controlled practice → communicative use → transfer to a real situation**

This means:

- dialogues, readings, listenings, forms, chats, maps, reviews and other real-world texts should contain evidence students can analyze;
- lessons should include explicit A1-friendly questions about how the language is used, formed or organized;
- grammar/vocabulary summaries should usually confirm or organize what students have already examined;
- short exercises should form a connected discovery sequence rather than a set of unrelated worksheet items;
- pairwork should support both analysis and communication;
- the final use of the language should have a purpose beyond simply producing the target form.

Lesson D has an especially strong real-world focus. Its Speaking/Writing outcome should normally be a believable situation, simulation or role-play with roles, information exchange and a concrete outcome.

For example, **Lesson 1D: LET'S FILL A FORM!** should ultimately function as a real registration/check-in/membership scenario. Students may create or choose a simple business such as a gym, hotel, language school or club, interview classmates as customers/guests/members, and complete a realistic form with the information obtained through the role-play. The form is the product of the interaction, not merely a worksheet.

See `GUIDED-DISCOVERY.md` for the full methodology and authoring test.

## Core design direction

Horizons should look **art-directed for print**, not assembled from generic web UI.

The approved language includes:

- warm off-white A4 paper
- mostly neutral black/gray typography
- one dominant unit color per normal page
- substantial white space
- large raster photography and intentional cropping
- oversized typography when useful
- simple large exercise numerals
- straight edges and thin editorial rules by default
- large CSS shapes used structurally
- controlled image/text overlap
- full-page and near-full-page editorial readings
- article, poster, collage, quiz, process and spatial compositions when appropriate
- rounded/shadowed UI mainly for simulated real-world interfaces
- almost no decorative gradients
- very limited generic cards and pills
- no decorative vector illustration; SVG only for functional icons

## Controlled repetition

Repeated items inside one exercise should usually share one silhouette and one structural treatment.

Create variety through:

- color
- crop
- opacity
- scale
- typography
- hierarchy

Do not give every item a different shape simply to make the page look creative.

Canonical examples:

- greeting images in the same set use circles
- number markers use identical circles with different vibrant backgrounds and white digits
- repeated information exchanges share one panel geometry
- alphabet pairs use stronger uppercase color and faded lowercase color

See `STYLE-REFINEMENTS.md` and `canonical-refinements.css`.

## Lesson tab hierarchy

Everything inside `.hz-lesson-tab` is centered.

`.hz-lesson-tab__id` is the dominant and largest element. `.hz-lesson-tab__label` is secondary.

This behavior is implemented globally in `canonical-refinements.css`.

## Non-negotiable exercise layout

**All numbered exercises run vertically in one sequence and stay in source numerical order.**

Sibling numbered exercises must never be placed side by side.

Two- and three-column layouts are allowed only inside a single exercise body for questions, choices, vocabulary, images, profiles, tables, reading columns, forms, collages, quizzes, timelines and similar internal content.

## Source-fidelity rule

When adapting an existing frozen Student's Book page into the new visual style, do not rewrite the educational content unless explicitly asked.

Preserve source:

- wording
- questions
- instructions
- options
- numbering, including unusual gaps
- track references
- dialogues/readings
- grammar examples
- vocabulary
- form labels
- cross-references
- Extra Practice prompts

Visual redesign is allowed; silent content editing is not.

## Frozen-source boundary

The existing source in `Horizons A1/` remains immutable unless explicitly authorized.

Do not overwrite the legacy Student's Book PDF/DOCX, syllabus, or pre-existing pages as part of normal new-format work.

New prototypes and production work belong in `Horizons/`.

## Shape-led editorial system

`editorial-layouts.css` provides approved large-scale patterns including:

- `.hz-feature-sheet`
- `.hz-article-panel`
- `.hz-week-stack` / `.hz-week-panel`
- `.hz-question-cloud` / `.hz-question-bubble`
- `.hz-quiz-panel`
- `.hz-poster-stage`
- `.hz-process-strip`
- `.hz-shape-note`
- `.hz-text-columns--2/--3`

Shapes must support hierarchy, grouping, reading flow, task meaning or image emphasis. Prefer one or two strong structural shapes over many unrelated small shapes.

## Photography and placeholders

Photography should carry substantial visual weight in final production.

During prototype work, placeholders are acceptable, but their geometry should represent the intended final crop and composition. A placeholder should communicate whether the final asset is portrait, landscape, wide, detail, hero, overlay-safe, or part of a collage.

Use free licensed raster photography or generated raster imagery where needed. Follow `asset-policy.md`.

## Human-art-direction rules

1. Do not wrap ordinary content in a card by default.
2. Do not use a pill just to label content.
3. Do not fill empty space simply because it exists.
4. Do not mix several accent colors on a normal page without a pedagogical reason.
5. Do not force every lesson into the same composition.
6. Do not create novelty by changing every repeated item's shape.
7. Do use photography, typography, scale, overlap and structural shapes for variety.
8. Do preserve consistent exercise mechanics.
9. Do allow bespoke page CSS when the content benefits from it.
10. Do not revive discarded Stage 4, legacy-compatibility, rainbow/dashboard or card-heavy directions without explicit approval.
11. Do make the context, discovery questions, pairwork and final real-world outcome visually easy to follow.
12. When pedagogy and visual novelty conflict, Guided Discovery takes priority.

## Files

- `HANDOFF.md` — current resume document for future chats
- `CANONICAL-STYLE.md` — normative visual philosophy and lesson architecture
- `GUIDED-DISCOVERY.md` — canonical teaching methodology and real-situation task model
- `STYLE-REFINEMENTS.md` — controlled repetition and micro-variety rules
- `tokens.css` — palette, unit colors, typography, spacing and geometry
- `components.css` — core lesson/exercise mechanics, media and focus areas
- `editorial-layouts.css` — large-scale article/shape compositions
- `canonical-refinements.css` — latest canonical behavior refinements
- `component-contracts.md` — semantic HTML/component expectations
- `asset-policy.md` — visual asset rules

## Locked production rules

- A4
- HTML/CSS definitive master
- two pages per lesson
- Lesson A → B → C → D → Unit Review
- Lesson A and C: Grammar and/or Vocabulary
- Lesson B: Reading/Listening with some Vocabulary
- Lesson D: Speaking or Writing, normally culminating in a real-world situation or role-play
- Guided Discovery is the primary teaching methodology
- language normally appears in context before explicit rule explanation
- explicit discovery/analysis questions are part of lesson design
- pairwork is a core learning mechanism
- Vocabulary Practice and Grammar Reference/Practice at the back and activity-led
- American English
- syllabus immutable unless explicitly changed
- pre-existing Student's Book pages immutable unless explicitly changed
- free image assets only
- raster photography/generated raster imagery for scenes
- no vector illustrations
- current Stage 3 direction + refinements is canonical until explicitly superseded

The shell and examples live in `../shell/` and `../examples/`.

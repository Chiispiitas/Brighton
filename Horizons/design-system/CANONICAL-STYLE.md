# Horizons A1 — Canonical Book Style

**Status: APPROVED / CANONICAL**

This document establishes the current **Stage 3 Horizons design plus the latest refinements** as the desired visual language for the Horizons A1 Student's Book.

For a new chat or a cold start, read `HANDOFF.md` first. It is the current resume document and summarizes the latest working rules. Read `GUIDED-DISCOVERY.md` for the full pedagogical method that this design system must support.

The canonical baseline is represented especially by:

- `design-system/GUIDED-DISCOVERY.md` — primary teaching methodology and real-situation task model
- `examples/lesson-1a-canonical-prototype.html` — first source-faithful existing lesson adapted into the canonical style
- `examples/stage-3-shape-showcase.html` — primary large-scale visual reference
- `examples/stage-2-showcase.html` — compatible supporting reference for photography, overlays, crops and media-led exercises
- `design-system/components.css` — core lesson/exercise mechanics
- `design-system/editorial-layouts.css` — approved shape-led and full-page editorial compositions
- `design-system/canonical-refinements.css` — latest canonical behavior refinements
- `shell/a4-shell.css` — approved A4 page framework

These files define the direction to continue from. They are not temporary experiments.

## 1. Desired character

Horizons should feel like a **professionally art-directed contemporary print coursebook** rather than a web dashboard, worksheet template, AI-generated UI, or direct imitation of another publisher.

The desired balance is:

- editorial rather than interface-heavy;
- creative rather than templated;
- structured rather than chaotic;
- photographic rather than illustration-led;
- dynamic rather than rigid;
- print-first rather than screen-first;
- recognizably consistent while allowing substantial page-to-page variation.

## 2. Core visual language

The following are canonical characteristics of the book:

- warm off-white A4 page;
- mostly neutral black/gray typography;
- one dominant unit color per page/unit;
- large, deliberate raster photography;
- strong image crops and media composition;
- substantial white space;
- large typography used as part of composition;
- simple large exercise numerals;
- straight edges and thin editorial rules as the default;
- large CSS geometric forms when they help structure content;
- circles, clipped corners, folds, bands, angled fields and controlled speech-bubble geometry;
- photo/text overlap where readability and composition justify it;
- lower-third photo bands and image overlays where useful;
- poster-like and magazine-like feature treatments for suitable lessons;
- full-page or near-full-page readings when the content warrants them;
- bespoke compositions rather than forcing every page into one repeated template;
- rounded/shadowed UI primarily reserved for simulated real-world interfaces;
- almost no decorative gradients;
- very limited pills and generic cards;
- no decorative vector illustrations.

## 3. Primary composition principle

**Creativity should come from page composition, typography, photography, scale, crop, overlap and structural shapes — not from accumulating small decorative components.**

A page may be visually bold, but every major shape or overlap should support at least one of:

- hierarchy;
- reading flow;
- grouping;
- task meaning;
- image emphasis;
- lesson identity.

Do not add decoration simply because empty space exists.

## 4. Exercise-flow rule — permanent

**All numbered exercises remain in one vertical sequence and numerical order.**

Sibling numbered exercises must never be laid out side by side.

Two- and three-column layouts are allowed only **inside one exercise** for:

- questions;
- options;
- vocabulary;
- images;
- tables;
- profiles;
- reviews;
- matching tasks;
- reading columns;
- quiz content;
- collages;
- timelines;
- other internal activity material.

A single exercise may contain a highly creative full-page composition. The next numbered exercise still begins below it.

## 5. Canonical lesson architecture and pedagogical rhythm

Horizons lessons are **two-page teaching sequences**, not collections of unrelated activities. The exact composition can vary, but the pedagogical role of each lesson letter is stable.

### Primary methodology — Guided Discovery

**Guided Discovery is the central methodology of Horizons.**

Students should normally encounter target language **in meaningful context before they are given an explicit rule**. The language can appear in a dialogue, reading, listening, form, message, review, map, schedule, real-world interface or another situation in which its meaning and use are visible.

The lesson should then ask explicit, A1-friendly questions that guide students to analyze the examples. Students should be asked to notice form, meaning, use, word order, differences, repeated patterns or the communicative purpose of the language.

Canonical learning direction:

**context → noticing → guided analysis → clarification → controlled practice → communicative use → transfer to a real situation**

This has several non-negotiable consequences:

- contextual input must contain evidence students can inspect rather than merely decorate the page;
- Guided Discovery requires explicit noticing/analysis questions; it is not enough to hope students notice a rule;
- concise grammar/vocabulary summaries normally confirm or organize what students have already examined;
- short exercises should form a connected learning sequence rather than unrelated worksheet items;
- pairwork can be used both to compare discoveries and to communicate;
- students should ultimately use the language for a purpose, not simply reproduce a target form.

Do not turn Guided Discovery into unsupported guessing. A1 students need enough clear examples and carefully sequenced questions to reach the intended understanding.

See `GUIDED-DISCOVERY.md` for the complete methodology and lesson-authoring test.

### Lesson A — Grammar and/or Vocabulary

Lesson A primarily introduces and practices a core grammar point, a core vocabulary set, or both.

Typical ingredients may include:

- short contextualized input such as a dialogue, mini-text, image set or listening;
- explicit Guided Discovery questions about the contextualized target language;
- a concise grammar or vocabulary clarification after or during analysis;
- short noticing, matching, completion or controlled-practice activities;
- pronunciation work when it directly supports the target language;
- a short communicative or pairwork task that reuses the target language;
- a cross-reference to Grammar Reference/Practice or Vocabulary Practice when additional consolidation is needed.

Lesson A should not become a long grammar lecture. The main spread introduces the language through context, guides students to understand it, and gives them enough practice to begin using it.

### Lesson B — Reading/Listening with Vocabulary

Lesson B is primarily a **receptive-skills lesson** led by Reading or Listening, with a smaller vocabulary component that helps students understand and discuss the text or audio.

Typical ingredients may include:

- pre-reading or pre-listening vocabulary support;
- a meaningful text, interview, profile, dialogue, message, article or listening situation;
- short comprehension, matching, sequencing, identifying or information-transfer tasks;
- Guided Discovery of useful words or phrases from the input where appropriate;
- vocabulary noticed or recycled from the input;
- a short follow-up task in which students compare, discuss, match information or personalize the content with a partner.

The reading/listening should carry the lesson. Vocabulary supports the receptive task rather than replacing it.

### Lesson C — Grammar and/or Vocabulary

Lesson C returns to a **language-system focus**, normally a second grammar point, a second vocabulary set, or a combination of both.

Its role is similar to Lesson A but should not mechanically reproduce the same page composition. It can use a different context, media treatment or interaction pattern while retaining the same Guided Discovery cycle and short-exercise rhythm.

Typical ingredients may include:

- contextualized language input;
- explicit noticing and analysis questions;
- concise clarification after discovery;
- short controlled exercises;
- visual or lexical classification when useful;
- pronunciation when relevant;
- pairwork or another simple communicative application;
- a cross-reference to the relevant Grammar Reference/Practice or Vocabulary Practice entry.

### Lesson D — Speaking or Writing through real situations

Lesson D is primarily a **productive-skills lesson**. Its main outcome is either Speaking or Writing.

The lesson should prepare students for that productive outcome rather than asking them to produce language without support.

**Lesson D should normally culminate in a believable real-world situation, simulation or role-play rather than a purely classroom-style production exercise.**

Students should normally have:

- a role;
- a reason to communicate;
- information to obtain, give or negotiate;
- a realistic text, object, form or interface to use;
- a concrete outcome.

A typical sequence may include:

- a short model, example, prompt, form, conversation, message, post or other real-world text/interface;
- Guided Discovery questions that make students analyze the language or conventions used in that model;
- useful language, functional phrases, planning support or organization cues;
- one or more short preparation activities;
- pair rehearsal, information exchange, peer checking or collaborative planning;
- the final real-world Speaking or Writing task.

For Speaking lessons, pairwork is especially central. For Writing lessons, pairwork can support information collection, planning, role-play, checking or comparison before the final written product.

The final written or spoken product should be the result of the situation, not an isolated worksheet response.

For example, **Lesson 1D: LET'S FILL A FORM!** should not simply ask students to fill a form with invented answers. Students can create or choose a simple business/service such as a gym, hotel, language school or club. One student represents the business; another is the customer, guest, member or new student. They role-play the interaction, ask for personal information and complete a realistic registration/check-in/membership form using the information obtained from the classmate. The form is the product of the communicative transaction.

### Short-exercise rhythm inside the two-page lesson

The established Horizons lesson style favors **several short, purposeful exercises** over a small number of very long worksheet-style tasks.

Short exercises may:

- introduce contextualized language;
- guide noticing;
- ask an explicit discovery question;
- check comprehension;
- isolate one small form or meaning point;
- practice one manageable step;
- compare an observation with a partner;
- move students from recognition toward production;
- prepare the next exercise.

Short does not mean disconnected. Exercises should form a clear learning sequence and reuse the same lesson language and context where useful.

A lesson does **not** need to contain every possible practice item for its grammar or vocabulary target. Deeper consolidation belongs in the linked back-of-book practice sections.

### Grammar Reference / Practice

Grammar Reference is not a passive explanation page. It is a **reference-plus-practice section** linked to the main lessons.

A grammar entry should normally combine:

1. contextualized or familiar examples;
2. a brief guided reminder or noticing question when useful;
3. a concise beginner-friendly explanation;
4. examples and/or a clear table or form summary;
5. controlled activities such as choosing, completing, ordering or matching;
6. transformation or application activities when appropriate;
7. a link back to the lesson where the language was introduced.

The purpose is to give students more concentrated grammar practice than can comfortably fit inside the two-page lesson.

### Vocabulary Practice

Vocabulary Practice is not a glossary or decorative word list. It is an **activity-led consolidation section** linked to the main lessons.

A vocabulary entry should normally move through some combination of:

1. recognition or recall;
2. picture/word matching;
3. categorization or classification;
4. contextual completion or association;
5. short written use;
6. pairwork, guessing, comparison or personalization where useful;
7. reuse in a simple context or situation where practical.

The purpose is to deepen and recycle the vocabulary introduced in the lesson without overloading the main two-page spread.

### Pairwork and learner interaction

**Pairwork is a core feature of Horizons and should be treated as part of the learning design, not as optional decoration.**

Across the book, pairwork should appear frequently and should normally make students use, retrieve, compare or negotiate the target language.

Pairwork can occur during Guided Discovery as well as during production. Students may compare what they noticed, agree on a pattern, check classifications, test a question or explain why a form is correct before using the language communicatively.

Appropriate A1 pairwork includes:

- ask-and-answer exchanges;
- interviewing a classmate;
- information gap tasks;
- compare-and-check tasks;
- guessing occupations, objects, people or places;
- mime-and-guess activities;
- role-play;
- completing a form or table from a partner's information;
- rehearsing a speaking outcome;
- planning or checking a writing outcome;
- personalized questions based on the lesson language.

Pairwork should be simple enough for A1 students to understand quickly, but it should still have a genuine communicative or cognitive purpose. Avoid pairwork that merely tells two students to read the same answers aloud with no information exchange, comparison, decision or reason to communicate.

### Real-world artifacts must be functional

Forms, chats, maps, schedules, reviews, menus, tickets, registration screens and similar real-world-looking elements should not exist only because they look contemporary.

Students should normally have to **read, interpret, complete, respond to or use** the artifact during the task.

Examples:

- a hotel form is completed after a check-in exchange;
- a map is used to give or follow directions;
- a review is analyzed before students write or discuss their own opinion;
- a timetable is used to ask about times;
- a lost-and-found record is used to identify and claim an object;
- a menu supports an ordering interaction.

The visual authenticity and the pedagogical function should reinforce each other.

### Design implication

The page design must support this pedagogy. Visual creativity should make the lesson sequence easier to follow, not obscure it.

A two-page spread should therefore make it visually clear:

- where contextual input begins;
- which language evidence students should inspect;
- where the explicit Guided Discovery question appears;
- where the discovery is clarified or confirmed;
- where controlled practice happens;
- where receptive comprehension happens in Lesson B;
- where students compare or interact with a partner;
- where a productive real-world outcome is being prepared in Lesson D;
- when additional Grammar Reference/Practice or Vocabulary Practice is available.

The four lesson letters have different pedagogical jobs, so they should **not** be forced into one identical page template. The design system remains consistent, but the composition should reflect the lesson type.

When a visual idea conflicts with the Guided Discovery sequence, **the pedagogy wins**.

## 6. Approved Stage 3 layout vocabulary

The following design patterns are explicitly part of the desired style:

### Photography-led compositions

- full-photo lead areas;
- title or short text over photographs;
- functional dark scrims for legibility;
- lower-third information bands;
- photo indexes/labels;
- detail-photo insets;
- photo strips;
- dominant-photo collages;
- offset captions;
- pull quotes crossing image edges;
- controlled image/text overlap.

### Shape-led compositions

- large interview/profile feature sheets;
- article mastheads with overlapping hero photography;
- full-page editorial reading fields;
- multi-column article text;
- vertically labeled story/week sections;
- question clouds;
- questionnaire/quiz posters;
- poster-style travel/social features;
- process/timeline strips;
- folded-corner notes;
- floor-plan or spatial compositions;
- oversized background numerals or text used compositionally.

## 7. Typography

Typography should carry hierarchy before containers do.

Prefer:

- strong lesson titles;
- clear activity instructions;
- controlled changes in size/weight;
- large display words or numbers when compositionally useful;
- readable body text at physical A4 size;
- restrained captions and labels.

Avoid solving every hierarchy problem with a colored badge, pill, card or border.

## 8. Photography

Photography is a major part of the desired Horizons identity.

Use real or generated raster imagery where appropriate. Final pages should rely increasingly on real production imagery rather than gray placeholders.

Preferred behavior:

- one strong hero image can dominate a feature;
- use several small images only when the pedagogy benefits from comparison, matching, sequence or vocabulary recognition;
- crop intentionally;
- leave useful negative space when text overlays are planned;
- use subject direction/gaze to support page flow where possible;
- avoid decorative stock photography that adds no task value.

During prototype work, placeholders are allowed, but they should preserve the intended final crop, scale and composition.

External assets must remain free for the intended use and comply with `asset-policy.md`.

## 9. Unit color

Each unit may have its own dominant color identity, but a normal lesson page should not become a multicolor component palette.

The unit color may appear in:

- exercise numerals;
- key rules;
- selected titles;
- one major structural field;
- focus areas;
- carefully chosen shape accents.

Neutral typography and photography should still dominate the page.

A repeated micro-system may use several vibrant colors when the exercise itself benefits from category or sequence distinction, provided the silhouette and layout remain consistent. The 0–10 number circles in Lesson 1A are the canonical example.

## 10. Human-art-direction rules

To preserve the approved style:

1. Do not wrap ordinary content in cards by default.
2. Do not use pills as generic labels.
3. Do not make every block equally prominent.
4. Do not force every lesson into the same composition.
5. Do not fill every gap.
6. Do not use several accent colors simply to create random variety.
7. Do not add decorative gradients as generic page furniture.
8. Do not add generic abstract blobs merely to make a page look creative.
9. Do not use shadows on ordinary textbook content.
10. Do not turn the coursebook into a dashboard-like UI.
11. Do allow bespoke page CSS when the content genuinely benefits from it.
12. Do use large-scale composition and controlled irregularity.
13. Do let real photography carry visual weight.
14. Do retain consistent exercise mechanics even when page composition changes.
15. Do prefer controlled repetition over excessive shape variety inside repeated sets.
16. Do let the pedagogical role of Lesson A, B, C or D influence page composition and activity rhythm.
17. Do make pairwork and communicative moments visually easy to find and understand.
18. Do make the context, discovery question, clarification and final use visually legible as a learning sequence.
19. Do make Lesson D real-world artifacts functional parts of the task rather than decorative props.
20. Do prioritize Guided Discovery over visual novelty when the two conflict.

## 11. Relationship to reference screenshots and other books

External coursebook references may inform broad editorial ideas such as:

- hierarchy;
- density;
- activity rhythm;
- media scale;
- full-page reading treatment;
- skill signaling;
- use of shapes and whitespace.

Do not reproduce their exact:

- palettes;
- tabs;
- page chrome;
- typography;
- icon systems;
- illustrations;
- compositions;
- decorative motifs.

Horizons should remain an independent design.

## 12. Relationship to the legacy Student's Book

The legacy files in `Horizons A1/` remain frozen source/reference material.

The canonical Stage 3 style does **not** authorize modifying or replacing existing Student's Book pages. New production work belongs in `Horizons/` unless the author explicitly requests changes to frozen source pages.

The supplied syllabus also remains immutable unless explicitly changed by the author.

When visually adapting a frozen lesson, preserve the source educational content exactly unless the author explicitly asks for content changes. Do not silently rewrite instructions, questions, options, dialogue, grammar examples, numbering, track references or other source text.

When a legacy lesson is incomplete and the author asks for it to be completed, new content should follow the Guided Discovery methodology in `GUIDED-DISCOVERY.md` while staying inside the locked syllabus focus.

## 13. What future improvements may change

Future work may improve:

- image quality;
- real asset selection;
- crop quality;
- spacing;
- typography refinements;
- print robustness;
- accessibility;
- audio/QR implementation;
- component reliability;
- page-specific creative compositions.

Future work should **not** silently replace the canonical visual philosophy or Guided Discovery methodology with a new design system or unrelated teaching approach.

A major redesign or methodological replacement should happen only after explicit author approval.

## 14. Controlled repetition — canonical refinement

When several items belong to the same exercise or visual family, they should normally share the same silhouette and structural treatment.

Use variety through:

- color;
- crop;
- opacity;
- scale;
- typography;
- hierarchy.

Avoid changing shape, border logic, alignment and color all at once simply to create novelty.

Canonical examples:

- four greeting images in one exercise use circular crops;
- repeated personal-information exchanges use one shared panel geometry;
- alphabet pairs use full-strength uppercase color with a faded lowercase version of the same hue;
- number markers use identical circles, different vibrant backgrounds and white digits.

See `STYLE-REFINEMENTS.md` and `canonical-refinements.css`.

## 15. Lesson-tab hierarchy — canonical refinement

Everything inside `.hz-lesson-tab` must be centered.

The visual hierarchy is:

1. `.hz-lesson-tab__id` — dominant and largest element;
2. `.hz-lesson-tab__label` — small supporting label.

The lesson ID should be the first thing the eye notices inside the tab.

This behavior is implemented globally in `canonical-refinements.css`.

## 16. Lesson 1A prototype as a practical benchmark

`examples/lesson-1a-canonical-prototype.html` is the first practical source-faithful adaptation of an existing Student's Book lesson into the approved style.

Its content is not a replacement for the frozen source. It is a design benchmark showing how to preserve existing exercise content while changing the page composition.

The refinements learned from this prototype now apply beyond Lesson 1A:

- repeated image sets should not use gratuitously different silhouettes;
- repeated information panels should remain visually related;
- meaningful typographic variation is preferred over arbitrary shape variation;
- exercise source numbering must remain intact even when unusual;
- image placeholders should encode the intended final crop and role.

## 17. Canonical reference priority

When there is ambiguity about how a new page should look or how a lesson should work, use this priority:

1. `HANDOFF.md`
2. `CANONICAL-STYLE.md`
3. `GUIDED-DISCOVERY.md`
4. `STYLE-REFINEMENTS.md`
5. `examples/lesson-1a-canonical-prototype.html` for source-faithful adaptation behavior
6. `examples/stage-3-shape-showcase.html` for large-scale art direction
7. `examples/stage-2-showcase.html` for photography/overlay treatments
8. current `components.css`, `editorial-layouts.css` and `canonical-refinements.css`
9. documented project constraints, locked syllabus and frozen source content
10. external references only as broad inspiration

This Stage 3 direction plus the latest refinements and Guided Discovery methodology is the **desired book system until explicitly superseded by the author**.

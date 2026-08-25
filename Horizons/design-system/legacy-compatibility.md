# Stage 3 — internal legacy structure compatibility

This stage verifies that the HTML/CSS system can reproduce **representative structural patterns from the frozen Horizons A1 Student's Book** without replacing, editing, or redesigning those original pages.

The compatibility layer is deliberately separate from the current Stage 3 production design.

## Source basis

The reproduction lab uses the visual-language extraction recorded during the original design-system audit of the Student's Book. That extraction identified the following recurring source structures:

- magenta + dark navy core identity;
- thin gold/orange accent line;
- large dark navy angled lesson tab;
- `LESSON` label plus large lesson identifier;
- lightweight uppercase lesson title;
- compact syllabus/objective line;
- magenta wedge/triangle exercise numbers;
- compact magenta audio badges with printed track IDs;
- uppercase magenta `NEW WORDS` signal;
- Grammar / Pronunciation focus boxes with magenta headers, strong rules, notched geometry, and diagonal stripe decoration;
- magenta chevron cross-references such as `Go to: Vocabulary ...` / `Go to: Grammar ...`;
- compact magenta `EXTRA PRACTICE` strip;
- circular photo crops with magenta outlines for image-led vocabulary;
- pale editorial reading/profile panels with target-language highlighting;
- simplified forms, tables, chat/app/review/ticket-style interfaces;
- Vocabulary Practice and Grammar Reference as back-of-book structures.

The historical Stage 1 source extraction also recorded the legacy palette used by this internal compatibility layer:

- magenta `#B5216B`;
- navy `#323E4F`;
- dark gray `#404040`;
- green `#339966`;
- light green `#78D2A5`;
- orange `#DB820B`;
- blue `#157BC1`;
- cream `#FBEDE1`.

## Files

### `legacy-compat.css`

A fully namespaced compatibility stylesheet. It is **not imported by the production A4 shell**.

All compatibility classes use the `hz-legacy-` prefix or the `.hz-legacy-page` scope. This prevents the legacy visual language from leaking into the current independent Stage 3 design.

### `../examples/stage-3-legacy-structure-lab.html`

A four-page A4 internal test suite:

1. **Lesson opener structure**
   - angled lesson tab;
   - lesson title + objectives;
   - single-column exercise lane;
   - circular image-led vocabulary;
   - `NEW WORDS`;
   - audio badge;
   - profile/form structure;
   - vocabulary cross-reference.

2. **Language-focus structure**
   - Grammar focus box;
   - Pronunciation focus box;
   - Grammar Reference cross-reference;
   - internal 2-column question layout;
   - writing lines;
   - Extra Practice strip.

3. **Reading / real-world structure**
   - pale reading/profile panel;
   - photo + text split inside one exercise;
   - selective magenta highlighting;
   - true/false answer mechanics;
   - listening table;
   - simplified UI card;
   - partner-response line.

4. **Back-of-book structure**
   - Vocabulary Practice heading;
   - image-led vocabulary set;
   - compact vocabulary grid;
   - Grammar Reference heading/table;
   - compact grammar check.

## Exercise-flow rule

The compatibility lab follows the current non-negotiable rule:

**Numbered exercises remain in one vertical sequence.**

Questions, images, forms, tables, and options may use two or three columns **inside one exercise only**.

This preserves the established learning sequence while proving that the source visual language can be expressed through semantic HTML/CSS.

## What this stage does not do

It does not:

- modify anything in `Horizons A1/`;
- replace a frozen Student's Book page;
- copy a complete source page pixel-for-pixel;
- make the legacy palette the current production palette;
- reverse the independent Stage 3 design direction;
- add new syllabus content;
- claim that sample exercise copy reproduces the original exercise wording.

The sample text in the lab is explicitly structural demonstration text. Lesson titles/objective labels used from the syllabus are retained only to make the components realistic.

## Production decision

The current Stage 3 production design remains the active design language. The legacy compatibility layer exists as an internal capability test and a reference library: if a future page needs a structural behavior already proven in the old book, the HTML system can reproduce that behavior without having to edit the frozen source.

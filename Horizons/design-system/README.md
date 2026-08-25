# Horizons Design System — Stage 1

This document captures the visual language already established by the existing *Horizons* Student's Book and converts it into a reusable HTML/CSS system. It is an extraction and normalization step, not a redesign of existing pages.

## 1. Core visual identity

The existing book consistently uses a strong **magenta + dark navy** identity on a white page, with secondary greens, blues, orange/gold, and pale fills for vocabulary and information areas.

Primary extracted colors:

- Horizons magenta: `#B5216B`
- Horizons navy: `#323E4F`
- Body dark gray: `#404040`
- Vocabulary green: `#339966`
- Light green: `#78D2A5`
- Orange/gold: `#DB820B`
- Accent blue: `#157BC1`
- Pale cream: `#FBEDE1`
- White: `#FFFFFF`

The system should prefer these established colors before introducing additional colors. New colors may be added only when a lesson context genuinely requires them and they should not compete with the magenta/navy identity.

## 2. Typography roles

Fonts detected in the existing source include:

- Montserrat ExtraLight
- Montserrat Black
- Anton
- Bebas Neue
- Century Gothic
- Poppins
- Times New Roman

The HTML system treats these as **roles**, not as bundled font files.

Recommended role mapping:

- Lesson/unit display titles: Montserrat ExtraLight / similar geometric sans fallback.
- Large lesson identifiers and emphatic display numerals: Anton / similar condensed heavy sans fallback.
- Short condensed labels: Bebas Neue / similar condensed sans fallback.
- UI labels and compact supporting text: Century Gothic or Poppins / sans fallback.
- Exercise instructions and reading body copy: readable serif stack modeled on the existing printed body text.

Do not place font files in this repository as part of this stage. The production environment can resolve licensed/installed fonts later.

## 3. Page-level motifs already established

The following motifs are part of the Horizons identity and should be reusable components:

### Lesson header

- Magenta band along the top edge.
- Thin gold/orange accent line.
- Large dark navy angled lesson tab.
- `LESSON` label plus large lesson number/letter.
- Large lightweight lesson title.
- Compact syllabus/objective line beneath the title.

### Exercise numbering

- Exercise number shown in a small magenta wedge/triangle to the left of the instruction.
- Subparts may use decimal identifiers such as `4.1`, `4.2`.
- Number marker and instruction should read as one visual row.

### Audio reference

- Small magenta audio badge placed beside listening instructions.
- Printed track numbers use compact IDs such as `1.4`, `1.8`, etc.
- Stage 2+ should allow a QR code to be paired with the audio badge without changing the exercise hierarchy.

### NEW WORDS

- Small magenta icon/badge plus uppercase `NEW WORDS` label.
- Magenta text treatment.
- Used as a vocabulary signal rather than as a full-width content box.

### Grammar / Pronunciation focus box

- White content area bounded by a strong magenta rule.
- Magenta header bar.
- Angled/notched lower-right or upper-right geometry.
- Decorative diagonal pink/magenta stripes at the right end of the header.
- Header may include a functional icon.
- Grammar title follows the pattern `GRAMMAR: ...`.
- Pronunciation title follows the pattern `PRONUNCIATION: ...`.

### Go-to cross-reference

- Magenta directional chevrons followed by bold magenta text.
- Pattern: `Go to: Vocabulary - ..., page ---` or equivalent Grammar reference.

### Extra Practice

- Compact magenta label strip near the bottom of the lesson.
- Small practice icon at the left.
- White uppercase label text.
- Activity prompt continues beside the label in small body type.

### Image-led vocabulary

- Photography is frequently shown in circular crops with magenta outlines.
- Labels appear directly below the photos.
- The layout favors clean white space rather than decorative illustration.

### Reading/profile cards

- Editorial photo blocks paired with pale colored text panels.
- Names may appear in large serif or strong display type.
- Important target words can be highlighted in magenta.
- Simple geometric blocks may be used as accents.

### Real-world UI recreations

- Chat panels, forms, tables, review cards, tickets, app-like panels, etc. may be recreated in HTML/CSS.
- These are pedagogical layouts, not vector illustrations.
- They should remain visually simpler than the real product so the language remains the focus.

## 4. Composition principles

The existing pages establish several composition rules:

1. **White space is part of the design.** Avoid filling every available area.
2. **Magenta signals instruction and structure.** Use it for exercise markers, focus headings, cross-references, labels, and emphasis.
3. **Navy anchors the page.** Use it for large lesson identifiers, major headings, and selected structural blocks.
4. **Photography provides authenticity.** Do not substitute generic vector people or cartoon scenes.
5. **Information is modular.** Activities should be visibly separated without relying on heavy enclosing borders everywhere.
6. **Color is functional.** Secondary colors can separate answer fields, categories, vocabulary items, or data groups.
7. **Exercise instructions remain visually subordinate to lesson titles but stronger than answer content.**
8. **Target language may be highlighted in magenta or another existing accent color, but highlighting should remain selective.**

## 5. Reusable component catalog

The Stage 1 CSS defines the following component families:

- `.hz-lesson-header`
- `.hz-lesson-tab`
- `.hz-lesson-title`
- `.hz-objectives`
- `.hz-exercise`
- `.hz-exercise-number`
- `.hz-audio-badge`
- `.hz-new-words`
- `.hz-focus-box`
- `.hz-focus-box__header`
- `.hz-go-to`
- `.hz-extra-practice`
- `.hz-photo-circle`
- `.hz-reading-card`
- `.hz-highlight`
- `.hz-answer-line`
- `.hz-choice-box`
- `.hz-form-card`
- `.hz-ui-card`
- `.hz-data-table`

These classes are intentionally content-neutral. Stage 2 will place them inside the fixed A4 page shell.

## 6. What Stage 1 does not do

Stage 1 does **not**:

- recreate an existing Student's Book page;
- modify the supplied syllabus;
- establish final page margins or pagination logic;
- create production QR codes;
- select final image assets;
- generate ElevenLabs audio;
- produce Workbook/Teacher's Book content;
- introduce a new pedagogical sequence.

Those belong to later production stages.

## 7. Design-change rule

New pages may improve consistency, spacing, hierarchy, and asset quality, but they must remain recognizably Horizons. Existing pages remain frozen. If a future design decision would visually contradict an established convention, document that decision before implementing it.

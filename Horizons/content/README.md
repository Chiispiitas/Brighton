# Horizons structured content

HTML/CSS remains the definitive master for publication. This directory provides a parallel structured-content layer so later companion products can reuse stable activity metadata without scraping finished pages.

## Purpose

The structured layer can support future generation of:

- Workbook links and references;
- Teacher's Book notes;
- Answer Key;
- Audio Scripts;
- Audio Pack manifests;
- Digital exercises;
- Tests;
- Vocabulary lists.

It does **not** authorize automatic changes to the syllabus or frozen Student's Book pages.

## Files

- `syllabus-lock.json` — immutable structured copy of the author-supplied Horizons A1 syllabus used for production validation.
- `content-schema.json` — schema for lesson/spread metadata, exercises, assets and audio.
- `example-lesson.json` — demonstration structure using the locked Unit 3A syllabus title/focus/context; it is not final lesson content.

## Syllabus lock

`qa/validate-content.mjs` compares every validated lesson record against `syllabus-lock.json`.

The following must match the locked entry exactly:

- lesson title;
- focus/objective array;
- specified real-world context.

A mismatch is an error, not an automatic correction.

The lock file does not replace `Horizons A1/Syllabus.txt`; it is a production-verification copy inside the new workspace. The legacy/source syllabus remains untouched.

## Stable IDs

Production activity IDs follow:

`HZN-A1-U##-L#-E##`

Example:

`HZN-A1-U03-LA-E04`

Page numbers may change during pagination. Semantic activity IDs should not.

## Workflow

1. Select the lesson from `syllabus-lock.json`.
2. Author/approve lesson content without changing its locked title/focus/context.
3. Assign stable exercise IDs.
4. Record assets/audio against those IDs.
5. Validate the structured lesson record.
6. Compose the final HTML spread using the design system.
7. Run browser/print QA.
8. Store answer-key/audio-script metadata alongside the content record.
9. Reuse the stable IDs when companion materials are created.

The JSON layer is optional during early composition, but production lessons should eventually have a matching validated record before the ecosystem expands beyond the Student's Book.

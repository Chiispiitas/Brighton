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

- `content-schema.json` — schema for lesson/spread metadata, exercises, assets and audio.
- `example-lesson.json` — demonstration structure using the locked Unit 3A syllabus title/objectives; it is not final lesson content.

## Stable IDs

Production activity IDs follow:

`HZN-A1-U##-L#-E##`

Example:

`HZN-A1-U03-LA-E04`

Page numbers may change during pagination. Semantic activity IDs should not.

## Workflow

1. Author/approve lesson content against the locked syllabus.
2. Assign stable exercise IDs.
3. Record assets/audio against those IDs.
4. Compose the final HTML spread using the design system.
5. Store answer-key/audio-script metadata alongside the content record.
6. Reuse the stable IDs when companion materials are created.

The JSON layer is optional during early composition, but production lessons should eventually have a matching record before the ecosystem expands beyond the Student's Book.

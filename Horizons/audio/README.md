# Horizons audio production

Audio is designed alongside the Student's Book, not added after layout is finished.

## Default production rules

- ElevenLabs production is planned.
- American English voices by default.
- Natural A1-accessible pace; avoid exaggeratedly slow delivery.
- Use multiple voices when dialogue requires distinct speakers.
- Keep printed track number and permanent internal audio ID separate.

## Stable IDs

Recommended internal ID:

`HZN_A1_U03_LA_E04_AUD_01`

Printed track example:

`3.2`

The internal ID remains stable even if pagination or printed track sequencing later changes.

## Manifest

Record every audio item in `audio-manifest.csv`.

Keep:

- audio ID;
- printed track;
- unit/lesson/exercise ID;
- script file;
- speakers;
- ElevenLabs voice IDs;
- accent;
- speaking rate/settings;
- generation date;
- final filename;
- hosted URL;
- QR status.

## Workflow

1. Draft listening script while designing the activity.
2. Check language against A1 level and locked lesson focus.
3. Approve script and distractors/answers together.
4. Generate audio.
5. Normalize/QA the final file.
6. Record final metadata in the manifest.
7. Generate/test printed QR if used.
8. Retain the script for Audio Scripts / Teacher's Book reuse.

QR access supplements the printed track number; it does not replace it.

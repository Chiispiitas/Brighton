# ElevenLabs-ready audio

These files are prepared for **ElevenLabs Voiceover Studio → Import Script**.

Each CSV uses the supported two-column format:

```csv
speaker,line
```

## Workflow

1. Open ElevenLabs Voiceover Studio.
2. Create a project.
3. Open the project settings/cog and choose **Import Script**.
4. Upload the CSV for the required book track.
5. Assign one voice to each imported speaker track.
6. Generate and export the audio.

Start and end times are intentionally omitted so ElevenLabs can use dynamic duration and place the clips automatically.

## Horizons convention

- One CSV = one printed audio track or one separately recorded section when the book currently reuses a track number.
- The CSV contains **spoken text only**. Do not put lesson titles, track titles, production notes, answer keys or recording instructions in these files.
- Speaker names must stay identical across all turns in the same recording so ElevenLabs groups them correctly.
- `NARRATOR` is used for single-voice drills and lists.
- Named speakers are used whenever a dialogue needs separate voices.
- The lesson-level `.txt` files one folder above remain the readable master scripts.
- If a recording needs music or sound effects, add them in Studio as separate media/SFX tracks. They are not represented as fake speakers in the CSV.

## Regular Studio

Regular ElevenLabs Studio can also import TXT/DOCX/HTML and can optionally auto-assign voices. For Horizons dialogue tracks, these CSVs are the preferred no-code workflow because speaker separation is explicit rather than inferred.

## Future automation

Every new Horizons audio track should receive both:

1. its text inside the lesson-level master `.txt` script; and
2. an import-ready CSV in this folder.

If a fixed ElevenLabs cast is chosen later, keep the same speaker labels and maintain a voice map so recurring voices can be assigned consistently.

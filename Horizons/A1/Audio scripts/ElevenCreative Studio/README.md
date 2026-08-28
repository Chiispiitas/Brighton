ELEVENCREATIVE STUDIO — HORIZONS A1 AUDIO WORKFLOW

Import only the `.txt` track files in this folder.

The track files contain only text that should be spoken plus supported `<break time="..." />` pause tags. They intentionally contain no speaker names, track titles, production notes, or other visible metadata because ElevenCreative Studio may narrate visible text.

For multi-speaker tracks, open `VOICE MAP.md` separately after import and assign voices by paragraph number. Do not import `VOICE MAP.md`.

Recommended model
Use Multilingual v2 when exact break-tag pauses matter. Eleven v3 does not support SSML break tags in the same way.

Pause policy
- Normal punctuation carries most of the rhythm.
- 0.3–0.5 s: short conversational turn or thinking space.
- 0.7–1.0 s: separation between listening items.
- 1.2–1.5 s: new interview or scene.
- Break tags are used selectively rather than after every sentence.

Studio also lets you adjust timing directly between paragraphs and individual sentences on the timeline. If a final pause needs exact adjustment after generation, use the timeline rather than adding excessive break tags.

Multi-speaker workflow
1. Import the desired `.txt` track into ElevenCreative Studio.
2. Keep each imported paragraph as its own narration paragraph.
3. Open `VOICE MAP.md` outside Studio.
4. Assign voices to the mapped paragraphs.
5. Use Multilingual v2 for the supplied break tags.
6. Generate and review.
7. Adjust any final inter-paragraph timing on the timeline if needed.
8. Export as WAV or MP3.

HORIZONS ON AIR
Music, ambience, and sound effects are not written inside narration files. Add them as separate Studio timeline tracks so no production instruction can ever be spoken accidentally.

Master scripts
The lesson-level `.txt` files one folder up remain the human-readable source. This folder contains import-ready speech-only versions.

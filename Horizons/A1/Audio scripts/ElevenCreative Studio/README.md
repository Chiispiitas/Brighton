ELEVENCREATIVE STUDIO — HORIZONS A1 AUDIO WORKFLOW

Import only the `.txt` track files in this folder.

The track files contain only text that should be spoken plus model-specific control markup. They intentionally contain no speaker names, track titles, production notes, or other visible metadata because ElevenCreative Studio may narrate visible text.

For multi-speaker tracks, open `VOICE MAP.md` separately after import and assign voices by paragraph number. Do not import `VOICE MAP.md`.

HYBRID MODEL STANDARD

Use Eleven v3 for authentic, contextual and conversational listening where natural delivery, reactions and human rhythm matter more than exact pause duration.

Use Multilingual v2 for controlled listening where exact timing matters: spelling, phone numbers, vocabulary lists, pronunciation models, discrete listening items and other tasks that need dependable learner-processing gaps.

CURRENT MODEL MAP

Eleven v3
- 1A — Track 1.1
- 1B — Track 1.8 — Exercise 4.1
- 1B — Track 1.9
- 2A — Track 2.1
- 2B — Track 2.3 — HORIZONS ON AIR

Multilingual v2
- 1A — Track 1.2
- 1A — Track 1.3
- 1A — Track 1.4
- 1A — Track 1.5
- 1A — Track 1.6
- 1A — Track 1.7
- 1B — Track 1.8 — Exercise 1
- 1C — Track 1.10
- 2A — Track 2.2

Tracks 1.3 and 1.7 remain on Multilingual v2 even though they contain dialogue because learners must process spelling and phone numbers accurately.

V3 PAUSE AND DELIVERY POLICY

Eleven v3 does not support SSML `<break>` tags. In the current ElevenCreative Studio workflow, `[pause]` has been verified to work correctly.

For v3 tracks:
- use `[pause]` as the only bracketed control tag inside import-ready scripts;
- do not use `[curious]`, `[short pause]`, `[long pause]`, or other unverified bracketed directions because Studio may read them aloud;
- let punctuation, wording, sentence structure and paragraph changes carry most of the performance naturally;
- create different delivery through the chosen voice, wording, punctuation and regeneration rather than narratable emotion labels;
- use Studio's timeline when a pause needs to be distinctly shorter, longer or precisely timed;
- do not insert `[pause]` mechanically after every turn.

V2 PAUSE POLICY

Multilingual v2 track files may use exact `<break time="..." />` tags:
- 0.3–0.5 s: short conversational or processing space;
- 0.7–1.0 s: separation between listening items;
- 1.2–1.5 s: larger transition when exact timing is genuinely useful.

Do not overuse break tags. Normal punctuation should still carry most of the rhythm.

STUDIO TIMELINE

Studio lets you adjust timing directly between paragraphs and individual sentences on the timeline. When exact overall timing matters, use the timeline after generation rather than forcing the script to carry every pause.

MULTI-SPEAKER WORKFLOW
1. Import the desired `.txt` track into ElevenCreative Studio.
2. Keep each imported paragraph as its own narration paragraph.
3. Open `VOICE MAP.md` outside Studio.
4. Assign voices to the mapped paragraphs.
5. Select the model listed in the Current Model Map above.
6. Generate and review.
7. Regenerate any paragraph whose delivery sounds unnatural.
8. Adjust final inter-paragraph timing on the timeline if needed.
9. Export as WAV or MP3.

HORIZONS ON AIR

HORIZONS ON AIR uses Eleven v3 by default. It should sound like real produced audio, not a sequence of textbook prompts and answers. Music, ambience, and sound effects are not written inside narration files; add them as separate Studio timeline tracks so no production instruction can ever be spoken accidentally.

MASTER SCRIPTS

The lesson-level `.txt` files one folder up remain the human-readable source. This folder contains import-ready speech-only versions.

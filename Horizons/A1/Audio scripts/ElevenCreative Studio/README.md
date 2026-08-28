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

V3 AUDIO-TAG STANDARD

Eleven v3 does not support SSML `<break>` tags. It uses inline bracketed audio tags, punctuation and text structure instead. ElevenLabs describes audio tags as natural-language auditory instructions rather than a closed enum, and its current prompting guide explicitly encourages strategic use of emotion, delivery, reaction and pacing tags.

Current Horizons palette
- emotion/delivery: `[happy]`, `[excited]`, `[curious]`, `[thoughtful]`, `[surprised]`, `[whispers]` when genuinely appropriate;
- human reactions: `[laughs]`, `[chuckles]`, `[sighs]`, `[clears throat]`, `[inhales deeply]`, `[exhales]` when the moment naturally calls for them;
- pacing: `[pause]`, `[short pause]`, `[long pause]`.

`[curious]` is explicitly documented by ElevenLabs and has also been verified to work in the current Horizons Studio workflow. Tag effectiveness can still vary by voice and context.

Tagging rules
- Tags must describe something auditory: emotion, vocal delivery, breathing/reaction or pacing.
- Place a delivery tag immediately before the words it should affect; place a reaction where that reaction would naturally occur.
- Do not tag every sentence. Use tags where they create a believable shift in performance.
- Combine tags when a moment genuinely benefits from layered direction, for example `[surprised] ... [curious] ...` within one turn.
- Keep visual actions and production instructions out of narration text. Do not use non-auditory directions such as `[standing]`, `[grinning]` or `[pacing]`.
- Music, ambience and environmental SFX belong on separate Studio timeline tracks rather than inside the narration text.
- If Studio reads a tag aloud, regenerate first. If it persists, test a nearby tag or another voice; v3 behavior is voice- and context-dependent.

V3 STABILITY

For v3, use Natural as the default Stability setting. ElevenLabs recommends Natural or Creative when you want strong responsiveness to audio tags; Robust is more consistent but less responsive to directional prompting.

For HORIZONS ON AIR, Creative can be tested when the chosen voices remain intelligible and stable. If Creative becomes too variable, return to Natural rather than stripping the tags from the script.

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
6. For v3, start with Natural Stability; test Creative for especially expressive material such as HORIZONS ON AIR.
7. Generate and review.
8. Regenerate any paragraph whose delivery or audio tags behave unnaturally.
9. Adjust final inter-paragraph timing on the timeline if needed.
10. Export as WAV or MP3.

HORIZONS ON AIR

HORIZONS ON AIR uses Eleven v3 by default. It should sound like real produced audio, not a sequence of textbook prompts and answers. Use expressive tags, natural reactions and varied pacing to support a believable host/interview format while keeping answer-bearing information clear. Music, ambience and sound effects remain separate Studio timeline tracks so no production instruction can be spoken accidentally.

MASTER SCRIPTS

The lesson-level `.txt` files one folder up remain the human-readable source. This folder contains import-ready speech-only versions.

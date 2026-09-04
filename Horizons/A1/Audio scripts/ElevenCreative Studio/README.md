ELEVENCREATIVE STUDIO — HORIZONS A1 AUDIO WORKFLOW

Import only the `.txt` track files in this folder.

The track files contain only text that should be spoken plus Eleven v3 control markup. They intentionally contain no speaker names, track titles, production notes, or other visible metadata because ElevenCreative Studio may narrate visible text.

For multi-speaker tracks, open `VOICE MAP.md` separately after import and assign voices by paragraph number. Do not import `VOICE MAP.md`.

ELEVEN V3 STANDARD

Use Eleven v3 for every current Horizons A1 track.

All tracks other than Lesson 2B were reworked for v3 so controlled listening, spelling, numbers, vocabulary, pronunciation models and contextual dialogue now use v3 audio tags instead of SSML break tags. Lesson 2B — Track 2.3 was already authored for v3 and is intentionally left unchanged.

Eleven v3 does not support SSML `<break>` tags. Use bracketed audio tags, punctuation and text structure instead.

CURRENT MODEL MAP

Eleven v3
- 1A — Track 1.1
- 1A — Track 1.2
- 1A — Track 1.3
- 1A — Track 1.4
- 1A — Track 1.5
- 1A — Track 1.6
- 1A — Track 1.7
- 1B — Track 1.8 — Exercise 1
- 1B — Track 1.8 — Exercise 4.1
- 1B — Track 1.9
- 1C — Track 1.10
- 2A — Track 2.1
- 2A — Track 2.2
- 2B — Track 2.3 — HORIZONS ON AIR

V3 AUDIO-TAG STANDARD

ElevenLabs treats audio tags as natural-language auditory instructions rather than a closed enum. Use them strategically to guide delivery without turning the script into a wall of directions.

Current Horizons palette
- emotion/delivery: `[happy]`, `[excited]`, `[curious]`, `[thoughtful]`, `[surprised]`, `[softly]`, `[slowly]`, `[clearly]`, `[whispers]` when genuinely appropriate;
- human reactions: `[laughs]`, `[chuckles]`, `[sighs]`, `[clears throat]` only when the moment naturally calls for them;
- pacing: `[short pause]`, `[pause]`, `[long pause]`.

Tagging rules
- Tags must describe something auditory: emotion, vocal delivery, breathing/reaction or pacing.
- Place a delivery tag immediately before the words it should affect; place a reaction where that reaction would naturally occur.
- Do not tag every sentence. Use tags where they create a believable or pedagogically useful shift in performance.
- Do not invent dialogue or alter answer-bearing information just to create a more expressive performance.
- Keep visual actions and production instructions out of narration text. Do not use non-auditory directions such as `[standing]`, `[grinning]` or `[pacing]`.
- Music, ambience and environmental SFX belong on separate Studio timeline tracks rather than inside narration text.
- If Studio reads a tag aloud, regenerate first. If it persists, test a nearby natural-language tag or another voice; v3 behavior is voice- and context-dependent.

A1 CONTROLLED-LISTENING POLICY

For beginner material, clarity takes priority over theatricality.

- Use `[slowly]` for spelling, phone numbers, alphabet work and other sequences where learners must identify individual units.
- Use `[clearly]` for answer-bearing vocabulary and short model sentences.
- Use `[short pause]` between tightly related elements, such as a question and its model answer or a word and its spelling.
- Use `[pause]` for ordinary learner-processing space.
- Use `[long pause]` between separate listening items, profiles or larger sections.
- Do not rely on v3 pause tags for frame-accurate timing. If a task needs a longer or more exact gap, adjust timing in Studio after generation rather than reintroducing SSML.
- Keep spelling hyphenated and phone-number groups visually separated so v3 has additional pronunciation and pacing cues.

V3 STABILITY

Use Natural as the default Stability setting. Natural gives v3 enough freedom to respond to delivery and pacing tags while remaining suitable for A1 listening.

For especially expressive material such as HORIZONS ON AIR, Creative can be tested when the chosen voices remain intelligible and stable. If Creative becomes too variable, return to Natural rather than stripping useful tags from the script.

STUDIO TIMELINE

Studio lets you adjust timing directly between paragraphs and individual sentences on the timeline. Use the timeline after generation for exact learner-processing gaps, overall duration and final rhythm.

MULTI-SPEAKER WORKFLOW
1. Import the desired `.txt` track into ElevenCreative Studio.
2. Keep each imported paragraph as its own narration paragraph.
3. Open `VOICE MAP.md` outside Studio.
4. Assign voices to the mapped paragraphs.
5. Select Eleven v3.
6. Start with Natural Stability; test Creative only when extra expressiveness is useful and intelligibility remains high.
7. Generate and review.
8. Regenerate any paragraph whose delivery or audio tags behave unnaturally.
9. Adjust final inter-paragraph timing on the timeline if needed.
10. Export as WAV or MP3.

HORIZONS ON AIR

HORIZONS ON AIR uses Eleven v3. It should sound like real produced audio, not a sequence of textbook prompts and answers. Use expressive tags, natural reactions and varied pacing to support a believable host/interview format while keeping answer-bearing information clear. Music, ambience and sound effects remain separate Studio timeline tracks so no production instruction can be spoken accidentally.

Lesson 2B — Track 2.3 is intentionally preserved as-is in this v3 migration.

MASTER SCRIPTS

The lesson-level `.txt` files one folder up remain the human-readable source. This folder contains import-ready speech-only versions.

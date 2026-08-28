ELEVENCREATIVE STUDIO — HORIZONS A1 AUDIO WORKFLOW

Use these files with ElevenCreative Studio, not the retired Voiceover Studio.

Recommended workflow
1. In ElevenCreative Studio, choose Generate audio > Narrate the article, or start a blank audio project.
2. Upload or paste one track .txt file.
3. Use Multilingual v2 when you want the break tags in these scripts to be followed reliably.
4. For multi-speaker tracks, enable Auto-assign voices (Alpha) or assign voices to the character paragraphs manually.
5. Character labels are on their own lines to make character detection and manual assignment obvious. Before generating, verify Studio has not included a character label as spoken narration; if it has, delete that label line.
6. Generate and review the track. Regenerate any paragraph that sounds unnatural.
7. Export the finished track as WAV or MP3.

Pause policy
- Normal punctuation and paragraph changes carry most conversational rhythm.
- <break time="0.35s" /> to <break time="0.5s" /> = short conversational thinking/turn pause.
- <break time="0.8s" /> to <break time="1.1s" /> = learner response/list-item pause.
- <break time="1.2s" /> to <break time="1.5s" /> = new interview/scene transition.
- Do not add breaks mechanically after every sentence. They are used only where the listening task benefits from them.

Why Multilingual v2
ElevenCreative Studio supports multiple models, including v3. Studio break tags are reliable with Multilingual v2. Newer models can reduce or ignore break tags in favor of natural flow, so v3 is not the default for these pedagogically timed recordings.

SFX and music
ElevenCreative Studio handles music and sound effects on separate timeline tracks. Narration files therefore contain only speech. For HORIZONS ON AIR, add the show sting and light ambience on Studio's music/SFX tracks after importing the narration.

Master scripts
The lesson-level files one folder up remain the human-readable source. This folder contains the Studio-ready per-track versions with natural pause markup.

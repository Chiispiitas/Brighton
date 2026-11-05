# Horizons answer sound production

Updated 5 November 2026, America/Bogota. User requested correct/wrong sounds generated with ElevenLabs, matching the app's design and personality.

## Native sources

Generated in the signed-in ElevenLabs Sound Effects browser workspace. Model **v3**, duration **0.7 seconds**, prompt influence **30%**, looping **off**, automatic prompt improvement **off**. Public Explore sharing was disabled. Each request produced four variations; variation **#1** from each request is used. No credentials, student information or source recordings were uploaded. Runtime playback uses local MP3s and never calls ElevenLabs.

| Cue | Unmodified native download | Runtime file | SHA-256 |
| --- | --- | --- | --- |
| Correct | `One_correct-answer_U_#1-1793913984106.mp3` | `assets/audio/feedback-v1/correct.mp3` | `993cd9258129338ef708f07277f62298597025d0c3daa57b5a399c838a8c7d9b` |
| Wrong | `One_wrong-answer_UI__#1-1793914153130.mp3` | `assets/audio/feedback-v1/wrong.mp3` | `7aabb61c1f1974bc27c12df194497fd17d0faeb96e85ea2fc108776d898db44e` |

Original files remain in the user's Downloads folder. Runtime copies preserve their exact bytes, 17,901 bytes each. Generation proof screenshot: `C:/Users/David/Documents/Codex/2026-11-05/elevenlabs-horizons-sounds.png`.

Correct prompt, verbatim:

> One correct-answer UI cue for Horizons, a warm playful adult language-learning adventure. Two soft rounded wooden marimba/plucked-bell notes rising to a tiny sparkling major-third resolution. Friendly, tactile, gently bouncy, polished. 0.7 seconds, immediate attack, short natural decay, dry close sound, gentle volume. No voice, words, music bed, drums, ambience, harsh highs, long reverb or loop.

Wrong prompt, verbatim:

> One wrong-answer UI cue for Horizons, a warm playful adult language-learning adventure. Two soft rounded wooden marimba notes gently stepping downward, a friendly try-again response. Tactile, gently bouncy, polished, matching a soft plucked-bell success chime. 0.7 seconds, immediate attack, short natural decay, dry close sound, gentle volume. No voice, words, harsh buzzer, alarm, boing, music bed, drums, ambience, long reverb or loop.

The briefs define a shared warm, tactile palette: success is upward and rewarding; a mistake is a gentle invitation to retry. No harsh buzzer or spoken content was requested. These are generation intentions, not an automated listening verdict; previews preserve the exact native audio for human review.

## Integration and verification

`src/feedback-sound.js` plays one cue from the answer-check gesture after actual grading. Empty submissions, selecting/typing, rerenders and duplicate checks are silent. Previous cue and lesson playback stop before the new cue. Continue, route changes and hiding the page stop it. Playback failures cannot prevent visual feedback or Continue. The exercise header's sound button persists its preference locally, preserves an in-progress answer, and controls answer cues independently of lesson recordings and reduced motion. Correct volume is 0.45 and wrong volume 0.38, a small runtime balance adjustment without altering source files. No sound is auto-played on page load or triggered by avatar movement.

Both files decode to approximately **0.6865 seconds**, 44.1kHz; neither contains clipped decoded samples. Mono-analysis peak/RMS are correct −2.06/−17.64dBFS, wrong −2.91/−16.21dBFS before runtime volume. Hardware speaker/headphone loudness and physical iOS playback have not been checked in this session.

`tools/feedback-sound-proof.mjs` exercises real grading/rendering with synthetic typed, choice and word-order questions. It checks cue routing/counts, mute persistence and draft preservation, stop on Continue, denied playback, hidden-page silence, independent reduced motion, listening-answer privacy, real browser audio decoding and header fit at 320/390/768/1440px. See `reports/feedback-sounds.json`. Browser play is spied for deterministic event counts; a subsequent pass plays both real HTML audio cues to completion from Check clicks. Decoding is also separately performed on the real files. The regular exercise feedback proof passed across four widths, and all 25 content/learning tests and six reference preflight tests passed. `tools/feedback-sound-cache-proof.mjs` installs the actual committed v52 worker, updates to v53, verifies old-cache removal and compares exact controller/MP3 hashes through offline cache-backed fetch and decoding; see `reports/feedback-sound-cache.json`.

Cache **answer-sounds-v53**, query **sounds1**, precaches both cues and the sound controller. Replacements must use a new asset directory and cache version. Preserve these native sources and provenance when refining the palette. Generate new sounds in ElevenLabs; do not silently substitute oscillators or unrelated library clips.

## Resolved operation issue

The browser download-event listener timed out even though both MP3 menu actions successfully wrote their files to Downloads. Arrival, exact bytes and decoding were checked directly; generation was not repeated. A first overlength prompt was rejected by ElevenLabs before the valid success brief was submitted. This is distinct from the earlier unattributed `Bad Request` reports.

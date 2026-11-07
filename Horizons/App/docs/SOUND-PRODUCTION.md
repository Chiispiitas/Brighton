# Horizons answer sound production

Streak audio resume correction: every completion-stage Continue gesture now calls prepareCompletionSound, including entry to the streak. Previously the results-first transition only resumed audio for overtaking/achievement, leaving fire silent when the context suspended on Results. The synthetic saved-round proof explicitly suspends the real AudioContext on Results, enters streak, verifies a new resume call and exactly one start of the decoded native fire-streak MP3 hash. Asset, impact timing and gain are unchanged. Physical-device verification remains outstanding.


Overtaking counter cue: assets/audio/progression-v1/overtake.mp3 is a dedicated native ElevenLabs one-shot with a quick rising plink counter and bright landing, triggered once on entry to the post-results overtaking screen. It uses the shared sound controller at gain0.65, with mute, interruption and hidden-page guards. It never plays merely from a changed weekly position without a valid overtaking event. Exact prompt, native hash and decoded measurements are in progression-v1/generation-records.json.


## Achievement and material-rank cues

Eight native ElevenLabs eleven_text_to_sound_v3 one-shots in assets/audio/progression-v1: achievement, Wood, Stone, Iron, Gold, Diamond, Obsidian, Masters. Exact prompts, request IDs, native hashes, decoded durations, peak/RMS and clipped-sample counts are in generation-records.json. Original files remain unmodified; runtime gains balance perceived levels. Two Masters takes failed decoded-peak checks and were regenerated; the first rejected native is preserved outside the repository. All current cues have zero clipped decoded samples.

Achievement plays on entry to its post-results stage once. Rank entry/promotion chooses the matching material cue, once per player/week/rank within the current app session; refreshing unchanged standings remains silent. Web Audio is unlocked from the user gesture before asynchronous work. Existing sound preference, interruption and hidden-page silence apply; reduced motion does not mute sound. New cues are precached. No browser synthesis, runtime generation or credentials ship.

Browser evidence: reports/progression-sounds.json checks real MP3 decoding and exact source hashes for all eight cues, mute, interruption, hidden-page silence and invalid-cue handling. Completion-order and leaderboard synthetic app proofs pass with the new controller. Full human listening review and physical phone speaker tests are not claimed.


Latest Results flow: the branded boot loader stays visible until save confirmation, and completion/mastery cues play with the revealed saved Results page. A failed save remains silent and exposes retry; the original attempt is reused. The milestone regression proof now waits for the saved result state and tests browser-route navigation during loading. Cue files, levels, preferences and mastery comparison remain unchanged.

## Current lesson and mastery cues — 5 November 2026

Two additional native cues were generated through the authenticated ElevenLabs API, model `eleven_text_to_sound_v3`, prompt influence 0.3, looping off, MP3 44.1kHz/128kbps. The existing protected credential was loaded only for the generation requests; no credential was copied into this repository. The accepted correct/wrong files remain unchanged.

| Cue | Native file | Requested / decoded duration | SHA-256 |
| --- | --- | --- | --- |
| Lesson complete | `assets/audio/milestones-v1/lesson-complete.mp3` | 1.4s / 1.36s | `3fe328b108de40266ca432780459705909f2cfa54ff52c2db9035c8c91aa6231` |
| Island mastered | `assets/audio/milestones-v1/island-mastered.mp3` | 1.9s / 1.88s | `32efcba28136dc824c621ec61cf2bdf1207925229790fb635046a36d7b9390b6` |

The lesson brief extends the warm wooden marimba/plucked-bell palette into three ascending notes and a small major-chord sparkle. The mastery brief uses a five-note rising arpeggio and a slightly longer rounded resolution. Both are restrained, tactile and gently bouncy, without speech, drums or a harsh fanfare. Exact authored prompts, native-byte hashes, generation settings and decoded measurements are preserved in [the production manifest](../assets/audio/milestones-v1/production.json) and the adjacent `.prompt.txt` files. No native audio was edited or replaced by synthesis. Neither file has clipped decoded samples; runtime gain is 0.45, comparable to the accepted answer-success cue. Tone descriptions describe the authored generation briefs; physical speaker/headphone listening remains a human review step.

A completed, successfully saved lesson/activity round plays the completion cue, including repeat practice. Newly earned island mastery is determined by comparing the server-returned `progress.islands` with the snapshot taken before that attempt. A new crown replaces the completion cue for that result; the two never stack. An already mastered island uses the normal completion cue on later practice. This adds sound feedback to the existing completion/mastery rules and does not alter scoring, progress, required retrievals or the backend. Full lesson completion receives the same completion cue; it is not an extra stacked event.

Playback is triggered after a successful save, once per result. Failed saves are silent; a successful retry can play the pending reward once. Rendering, restoring the path, reopening details and loading an existing crown never trigger a reward. A delayed save that finishes after navigation cannot play on the new route. The existing locally remembered mute now has the accessible label **Mute sound effects**/**Enable sound effects** and covers answer and milestone cues independently of lesson recordings and reduced motion. Navigation, starting another round, a new answer cue and hiding the page stop reward playback.

To allow a confirmed reward after an asynchronous save, `prepareCompletionSound()` resumes a Web Audio context from the Results/retry button gesture and starts decoding the two local files. `playCompletionSound()` plays the chosen decoded native file after the save succeeds. A cancellation generation prevents an in-flight decode from playing after navigation/muting. Sound failures leave the saved Results screen usable. Real Edge browser playback is checked; physical iOS/audio hardware is not verified in this session.

Verification: `tools/milestone-sound-proof.mjs` uses synthetic sessions and intercepted save responses to exercise real grading, Results, retry, server-progress comparison and native Web Audio playback. It covers lesson completion, new crown priority, simultaneous milestones, already crowned practice, failed save/retry, duplicate renders, mute, reduced motion, hidden pages, navigation, delayed saves and playback failures. Both files play to `ended`. The 25 content/learning tests and the existing answer-sound regression proof pass. The v53→v54 worker upgrade proof verifies all four MP3s and the controller offline against exact file hashes; see `reports/milestone-sound-cache.json`. See `reports/milestone-sounds.json` for milestone event checks. Cache **milestone-sounds-v54**, queries **milestones1**, precaches all four sound files and the controller.

Resolved generation error: the direct `/v1/sound-generation` requests initially returned HTTP 400, with code `text_too_long` and maximum 450 characters. The exact error was identified, briefs shortened to 447/448 characters, and the local session generator now checks this limit before submitting. Both valid requests succeeded. This establishes the origin of these specific 400 responses; it does not establish the origin of older unrelated Bad Request messages.

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

## Dedicated streak cue — 6 November 2026

Native ElevenLabs v3 fire-streak.mp3 combines a warm fire whoof/crackle with an ascending marimba/plucked-bell major-chord reward. Triggered once at the 1.6s fire impact, with the authored flourish 0.8s later for the counter reveal. Replaces the reused completion/mastery cue only on the daily streak screen. Uses existing unlocked Web Audio, remembered mute, cancellation and hidden-page guards. Native bytes and exact prompt/settings/hash are in assets/audio/streak-v1/production.json. Physical speaker listening remains a review limit. Cache v105; sound/app queries streaksound1.

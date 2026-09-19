# Brighton Placement — Speaking grading without a paid AI API

Version: `2026-09-19.8`

The Speaking stage does **not** call a paid AI grading service.

## Browser flow

1. The student checks the microphone.
2. The app verifies that microphone recording and browser speech recognition are available.
3. The app displays one prompt matched to the provisional placement band.
4. The student records one answer.
5. The browser measures duration and speech activity with Web Audio.
6. Browser-native `SpeechRecognition` / `webkitSpeechRecognition` produces the transcript when available.
7. Wix calculates the rubric with fixed deterministic rules.
8. A valid Speaking result may keep the current level or move it by **one adjacent band only**.

## Mobile/browser compatibility

Speaking now treats browser speech recognition as an enhancement rather than a hard requirement. This is important on Android devices, Samsung Internet and other mobile browsers where microphone recording may work while `SpeechRecognition` is unavailable, ends early, or never returns a final transcript.

The browser now:
- retries microphone capture with plain `audio: true` when optional audio constraints fail;
- accepts additional MediaRecorder formats (WebM/Opus, Ogg/Opus, MP4/AAC);
- preserves interim recognition text when a mobile recognizer ends without a final result;
- automatically restarts recognition while the recording is still running;
- allows a valid recording to finish even when browser transcription fails.

When the recording itself is valid but no usable transcript is available, Wix uses **compatibility mode**: the Speaking attempt is recorded as completed, the student's objective Language/Reading/Listening band is kept unchanged, and no fake grammar/vocabulary/pronunciation score is generated. The result shows Speaking as **Recorded** rather than failing the entire Placement.

## Error-only skip

There is **no permanent Skip Speaking button**.

The button **I cannot speak now** appears only after a Speaking error has been detected, including cases such as:

- microphone permission or microphone access failure;
- browser speech recognition unavailable;
- no usable transcript;
- recording too short to process;
- too little detectable speech;
- server-side validation concludes that the Speaking evidence is unusable.

The error screen offers:

- **Try again**
- **I cannot speak now**

A normal Speaking screen does not show the skip option.

Choosing **I cannot speak now** calls `POST /_functions/brightonPlacementSkipSpeaking`. Wix then finalizes the current objective level from Language + Reading + Listening.

No placement-status labels are used, and no teacher-review flag is created when Speaking is skipped.

## Adaptive prompts

- PRE-A1: short personal introduction.
- A1: normal weekday.
- A2: describe a place and explain why.
- B1: narrate a challenge and lesson learned.
- B1+: compare online and in-person learning.
- B2: discuss two views about technology and communication.
- C1: discuss trade-offs around convenience in technology design.

Target recording length rises from about 20 seconds at PRE-A1 to about 55 seconds at C1.

## What is measured

### Fluency

Uses:
- total response duration;
- proportion of frames containing speech;
- recognised words per minute;
- filler frequency.

### Grammar

This is a structural-range proxy rather than grammatical error correction.

It uses:
- response length;
- clause/complexity markers;
- number of final recognised speech segments.

### Vocabulary

Uses:
- response length;
- unique-word ratio;
- proportion of longer lexical items.

### Pronunciation / intelligibility

This is an intelligibility proxy, not phoneme-level pronunciation scoring.

Uses:
- transcript success;
- browser recognition confidence when supplied;
- speech activity;
- plausible speaking pace.

### Communication

Uses:
- task-length completion;
- connector usage;
- recognised speech segments.

## Scoring calibration

Browser-native speech recognition can slightly under-credit fluent answers because recognition confidence, segmentation and activity detection vary by browser and microphone. The deterministic grader therefore applies a **+1.0 point calibration buffer** to each Speaking rubric dimension and to the final weighted composite, capped at 10.0.

This keeps the grader deterministic while making strong answers less sensitive to browser-recognition noise.

## Placement rule

For a processable recording:

- strong Speaking evidence can move the result up one adjacent band;
- weak Speaking evidence can move it down one adjacent band;
- otherwise the objective band stays unchanged;
- Speaking never jumps two or more bands.

If the recording cannot be processed, no Speaking grade is stored. The user must either try again or use **I cannot speak now**.

## Result screen

The result screen only shows the final level and a simple placement-complete message.

There are no placement-status labels.

## Audio storage

V1 does not upload the raw microphone recording.

The MediaRecorder blob exists only during the browser session and is discarded after submission or skip.


## Result presentation

The completed placement now renders a certificate-style Brighton result screen with:

- student name;
- final placement band;
- PRE-A1 through C1 scale;
- Language Use, Reading, Listening and Speaking summaries;
- result ID and completion date;
- PNG export and native Share support.

This is deliberately described as a placement result rather than a CEFR certificate.


## v4 mobile compatibility

The browser and backend now treat a valid MediaRecorder payload as the primary proof that a Speaking answer was captured. Web Audio speech-activity ratios are no longer allowed to reject an otherwise valid recording because some Android and Samsung devices report unreliable analyser levels.

A recording is accepted for compatibility when it has a plausible duration and non-empty encoded audio bytes. If browser speech recognition cannot provide a usable transcript, the result stays in compatibility mode and the objective placement band is preserved rather than inventing a Speaking score.

The frontend also has a legacy-backend safety path: if an older published Wix grader returns `speakingError: true` for a recording that already passed the client MediaRecorder checks, the attempt is finalized through the existing Speaking-skip endpoint so the student is not trapped on the error screen. This fallback does not fabricate a transcript or Speaking score.


## v5 mobile recognition-first

Mobile browsers now use a different capture strategy from desktop. On Android, Samsung Internet, iPhone and iPad, the answer uses browser SpeechRecognition as the primary capture path **without MediaRecorder running at the same time**. This avoids the common mobile failure where microphone permission and the mic check work but simultaneous MediaRecorder + Web Speech causes recognition to return no transcript.

Mobile recognition uses short recognition sessions that restart while the answer is active instead of continuous recognition. The pre-existing getUserMedia stream from the microphone check is released before recognition begins so there is only one active microphone consumer.

For compatibility with the older published Wix grader, the client derives its legacy capture checks from the active recognition session: duration, recognized words and an equivalent 16 kHz PCM byte estimate. This value is only a legacy capture sanity signal; no raw audio is claimed to be uploaded or stored.

The frontend no longer auto-skips Speaking when the grader rejects a submission. A failed Speaking submission stays in Speaking and offers Retry / I cannot speak now, so a browser failure cannot silently complete the test without a Speaking result.

The v5 backend additionally accepts transcript-only mobile recognition as valid evidence. If a browser truly cannot provide a transcript but Web Audio produced usable speech activity, compatibility scoring is conservative: it can keep or lower the routed level, but it cannot promote a student without language-content evidence.

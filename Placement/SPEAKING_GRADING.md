# Brighton Placement — Speaking grading without a paid AI API

Version: `2026-09-19.6`

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

Choosing **I cannot speak now** calls `POST /_functions/skipSpeaking`. Wix then finalizes the current objective level from Language + Reading + Listening.

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

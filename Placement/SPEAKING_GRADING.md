# Brighton Placement — Speaking grading without a paid AI API

Version: `2026-09-19.5`

The Speaking stage intentionally does **not** call OpenAI, Google Cloud Speech, Azure Speech, ElevenLabs speech analysis, or another paid AI grading endpoint.

## Browser flow

1. The student checks the microphone.
2. The app displays one prompt matched to the provisional placement band.
3. The student records one answer.
4. The browser measures duration and speech activity with Web Audio.
5. Where supported, the browser's built-in `SpeechRecognition` / `webkitSpeechRecognition` capability produces an English transcript.
6. The frontend sends only the transcript and numeric recording features to Wix.
7. Wix calculates the rubric with fixed deterministic rules.
8. The final placement may stay in the same band or move by **one adjacent band only**.

No API key or paid AI service is required.

## Adaptive prompts

- PRE-A1: short personal introduction.
- A1: normal weekday.
- A2: describe a place and explain why.
- B1: narrate a challenge and lesson learned.
- B1+: compare online and in-person learning.
- B2: discuss two views about technology and communication.
- C1: discuss trade-offs around convenience in technology design.

Target recording length rises from about 20 seconds at PRE-A1 to about 55 seconds at C1.

## What is actually measured

### Fluency

Uses:
- total response duration;
- proportion of frames containing speech;
- recognised words per minute;
- filler frequency.

### Grammar

This is explicitly a **range proxy**, not grammar correction.

It uses:
- response length;
- clause/complexity markers such as `although`, `because`, `whereas`, `unless`, `which`;
- number of final recognised speech segments.

It cannot reliably identify subject-verb agreement, tense errors, article errors, word order mistakes, etc.

### Vocabulary

Uses:
- response length;
- unique-word ratio;
- proportion of longer lexical items.

It does not judge whether a word choice is contextually perfect.

### Pronunciation / intelligibility

This is explicitly an **intelligibility proxy**.

Uses:
- whether browser recognition can obtain a transcript;
- recognition confidence when the browser supplies it;
- speech activity;
- plausible speaking pace.

It is not phoneme-level pronunciation grading and should not be presented as such.

### Communication

Uses:
- task-length completion;
- connector usage;
- recognised speech segments.

There is no semantic LLM checking whether every idea directly addresses the prompt.

## Review rules

The result becomes `REVIEW RECOMMENDED` when any major input signal is unreliable, including:

- browser speech recognition unavailable;
- no usable transcript;
- fewer than 5 recognised words;
- substantially under-length response;
- very low speech activity;
- implausibly tiny recording payload.

When review is required, Speaking **does not lower or raise the objective placement**. The Language + Reading + Listening estimate remains the result until a teacher reviews it.

## Placement rule

For a reliable recording:

- strong deterministic Speaking evidence can move the result up one adjacent band;
- weak deterministic Speaking evidence can move the result down one adjacent band;
- otherwise the objective band stays unchanged;
- Speaking can never jump two or more bands.

Possible statuses:

- `CONFIRMED PLACEMENT`
- `BORDERLINE PLACEMENT`
- `REVIEW RECOMMENDED`

## Audio storage

V1 does not upload the raw microphone recording.

The MediaRecorder blob exists only during the browser session and is used to confirm that a real recording was produced. After submission it is discarded.

This avoids needing a paid speech-analysis API and keeps V1 simpler. A later teacher-review version can add raw-audio storage independently from the grading system.

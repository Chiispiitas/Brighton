# Brighton Placement — Gemini audio speaking grading

Version: `2026-09-20.1`  
Rubric: `brighton-speaking-rubric-1.0`  
Model: `gemini-3.8-flash`

## Overview

Speaking is assessed from the candidate's **actual microphone audio**. Browser speech recognition is no longer used as the grader.

The browser records a short audio response with `MediaRecorder`, sends it to the Brighton Wix backend, and the backend sends the anonymous audio inline to Gemini. Gemini returns a structured rubric assessment. Wix validates the response, calculates the weighted composite itself, applies the one-adjacent-band placement rule, stores the assessment, and discards the raw recording.

The Gemini API key is stored only in Wix Secrets Manager as:

`BRIGHTON_PLACEMENT_GEMINI_API_KEY`

No API key is present in the GitHub frontend.

## Privacy and storage

The Gemini request contains only:

- the speaking prompt;
- the routed Brighton level;
- the recording duration;
- the audio recording.

The request does **not** include the student's name, email, Wix session ID, school name, or other account data.

Brighton does not persist the raw audio. `BrightonPlacementSpeaking.audioUrl` remains empty. The CMS record stores the transcript, scores, rubric evidence, model/rubric version and limited API usage metadata.

The request uses `store: false` in the Gemini Interactions API.

## Capture flow

1. The student checks the microphone.
2. Brighton records the answer with `MediaRecorder`.
3. Web Audio may measure speech activity for diagnostics only. It does not determine the rubric grade.
4. The student cannot finish before the prompt's minimum duration.
5. The recording is encoded in memory and sent to the Wix backend.
6. Wix retrieves the Gemini key from Secrets Manager.
7. Gemini listens to the audio and returns rubric JSON.
8. Wix calculates the composite and final routing adjustment.
9. Raw audio is discarded.

Browser `SpeechRecognition` is no longer required for assessment. This removes the former Chrome/Samsung/Opera recognition-confidence dependency.

## What Gemini assesses

### Fluency — 20%

Evidence includes:

- continuity and ability to sustain speech;
- natural pausing;
- hesitation and searching;
- reformulation and self-repair;
- natural speaking rate.

Speed alone never earns a high Fluency score.

### Grammar — 25%

Evidence includes both **range and accuracy**:

- tense and aspect;
- agreement;
- articles and prepositions;
- morphology and word order;
- clause structure and subordination;
- control of complex syntax;
- frequency, systematicity and communicative impact of errors.

Connector counts and sentence length are not used as substitutes for grammar.

### Vocabulary — 20%

Evidence includes:

- lexical range;
- precision;
- appropriacy;
- collocation;
- repetition;
- paraphrasing;
- lexical control.

Word length is not used as a vocabulary proxy.

### Pronunciation — 15%

Gemini judges the audio itself:

- overall intelligibility;
- sound clarity where audible;
- word stress;
- sentence stress;
- rhythm;
- connected speech;
- prosodic control.

A non-native accent is not penalized simply for being non-native. Only features that reduce clarity, natural phrasing or listener comprehension lower the score.

### Communication — 20%

Evidence includes:

- actual task fulfilment;
- relevance;
- organization and coherence;
- development of ideas;
- reasons and explanations;
- examples and comparisons where required;
- conclusion where required by the prompt.

Speaking at length without answering the task does not earn a high Communication score.

## Absolute scoring anchors

The routed prompt does not determine the speaking score. Gemini applies one absolute scale:

| Score | Brighton speaking band | Broad interpretation |
|---|---|---|
| 0.0–1.9 | PRE-A1 | Little or no assessable independent language |
| 2.0–3.4 | A1 | Very limited basic language |
| 3.5–4.9 | A2 | Simple connected language with limited range/control |
| 5.0–6.4 | B1 | Sustained familiar communication with clear limitations |
| 6.5–7.4 | B1+ | Stronger than secure B1 but not consistently B2 |
| 7.5–8.7 | B2 | Clear, developed and reasonably flexible speech with good control |
| 8.8–10.0 | C1 | Fluent, flexible, precise, well-developed speech with consistently strong control |

A candidate answering the C1 prompt therefore does **not** receive C1 merely because the prompt is C1.

## Examiner consistency controls

The request uses a fixed, versioned examiner handbook and a strict JSON schema.

The examiner must:

1. listen to the full recording;
2. transcribe conservatively without silently correcting the candidate;
3. determine whether enough independent evidence exists;
4. detect prompt reading/repetition;
5. match evidence to the descriptors;
6. score the five dimensions independently;
7. re-check that the scores agree with the evidence;
8. return only the required structured result.

A fixed generation seed is supplied and Gemini uses medium thinking. The rubric version and model version are stored with each result so later calibration changes remain traceable.

## Composite

Gemini does **not** choose the final composite. Wix calculates it deterministically:

```text
Fluency        20%
Grammar        25%
Vocabulary     20%
Pronunciation  15%
Communication  20%
```

The backend then maps the composite to the absolute Brighton speaking band shown above.

## Placement rule

Speaking remains a refinement stage rather than an override of the objective test.

If the absolute speaking band differs from the Language + Reading + Listening routed level, the final placement may move **one adjacent Brighton band only**.

Examples:

- objective B1 + speaking B2 → final B1+
- objective B1 + speaking A2 → final A2
- objective C1 + speaking B1 → final B2
- objective A2 + speaking C1 → final B1

The raw independent Speaking level is still stored for teachers to inspect.

## Prompt repetition and insufficient evidence

Gemini returns `promptRepeat=true` when the candidate mainly reads/repeats the question with too little original content.

Prompt repetition is not graded as weak English. The attempt is rejected and the student is asked to answer again.

The attempt is also rejected when evidence is insufficient, for example:

- mostly silence or noise;
- essentially no English;
- too little meaningful independent speech;
- unusable audio.

For technical/insufficient-evidence errors, the existing **Try again** / **I cannot speak now** path remains available.

## Result storage

`BrightonPlacementSpeaking` continues to store the existing headline fields:

- transcript;
- duration and word count;
- Fluency;
- Grammar;
- Vocabulary;
- Pronunciation;
- Communication;
- independent Speaking level;
- grader version.

`metricsJson` stores:

- composite;
- rubric version;
- Gemini model;
- evidence quality;
- detailed dimension evidence;
- identified grammar errors;
- communication sub-scores;
- limited token-usage metadata.

No CMS schema change is required for this release.

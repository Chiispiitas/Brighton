# Brighton Placement — Gemini audio speaking grading

Version: `2026-09-20.1`  
Rubric: `brighton-speaking-rubric-1.1`  
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
5. Each speaking level has an explicit hard maximum. Ten seconds before that limit, the UI warns that the answer will be submitted automatically.
6. If the hard limit is reached, the frontend sends `autoStoppedByTimeLimit=true` so the examiner does not unfairly penalize an abrupt ending caused by the platform.
7. The recording is encoded in memory and sent to the Wix backend.
8. Wix retrieves the Gemini key from Secrets Manager.
9. Gemini listens to the audio and returns rubric JSON.
10. Wix converts the examiner's CEFR band decisions into deterministic numeric scores, calculates the composite and applies the routing adjustment.
11. Raw audio is discarded.

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

## Band-first scoring and consistency controls

Rubric 1.1 no longer asks Gemini to invent free-form numeric scores for the five main dimensions.

For each dimension, Gemini must first choose a best-fit band:

- PRE-A1
- A1
- A2
- B1
- B1+
- B2
- C1
- ABOVE-C1

It then chooses `low`, `mid` or `high` within that band. Wix maps that decision to a deterministic score:

| Examiner band | Low | Mid | High |
|---|---:|---:|---:|
| PRE-A1 | 0.6 | 1.2 | 1.8 |
| A1 | 2.2 | 2.8 | 3.3 |
| A2 | 3.7 | 4.3 | 4.8 |
| B1 | 5.2 | 5.8 | 6.3 |
| B1+ | 6.7 | 7.1 | 7.4 |
| B2 | 7.7 | 8.2 | 8.7 |
| C1 | 8.9 | 9.3 | 9.6 |
| ABOVE-C1 | 9.7 | 9.9 | 10.0 |

`ABOVE-C1` is an internal ceiling marker for clearly C2-like evidence. Brighton still reports the public placement ceiling as **C1**.

This prevents contradictions such as the examiner describing C1 grammar or fluency but then returning a B2-range number.

The rubric also states explicitly that:

- C1 does **not** mean perfect English;
- one or two isolated minor slips do not automatically demote otherwise C1 grammatical control to B2;
- advanced vocabulary cannot rescue weak grammar;
- speed alone cannot produce a high Fluency band;
- a non-native accent is not penalized simply for being non-native;
- `ABOVE-C1` is reserved for exceptional evidence, not merely a strong C1 performance.

## Automatic-cutoff fairness

The candidate context sent to Gemini includes the hard recording limit and whether the platform itself stopped the recording.

When `autoStoppedByTimeLimit=true`, the examiner must **not** lower Communication merely because:

- the final sentence is cut off;
- the candidate does not get to deliver a final conclusion;
- the recording ends abruptly at the system limit.

The examiner still judges whether the substantive task requirements were addressed before cutoff.

## Speaking time windows

| Route | Target | Minimum | Hard maximum |
|---|---:|---:|---:|
| PRE-A1 | 20 s | 12 s | 35 s |
| A1 | 25 s | 15 s | 40 s |
| A2 | 35 s | 20 s | 50 s |
| B1 | 40 s | 25 s | 65 s |
| B1+ | 45 s | 30 s | 75 s |
| B2 | 50 s | 35 s | 85 s |
| C1 | 55 s | 40 s | 90 s |

A visible countdown warning appears during the final 10 seconds.

## Composite

Gemini does **not** choose the final composite. Wix calculates it deterministically:

```text
Fluency        20%
Grammar        25%
Vocabulary     20%
Pronunciation  15%
Communication  20%
```

The backend then maps the composite to Brighton's public speaking bands. Scores below 8.8 remain below C1; C1 and internal ABOVE-C1 evidence both ultimately report at the public ceiling of C1.

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

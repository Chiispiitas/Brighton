# Brighton Young Learners Placement

Live page: https://exams.bebrighton.net/Placement/YoungLearners/

Contract and private answer-key release: `2026-10-12.yle1`.

The test shares the existing Placement stylesheet, logo, background, phone input, four-stage navigation, microphone transport, resume behaviour and downloadable result card. `young.css` adds picture sizing, the Young Learners subtitle and adult-consent layout. All original adult routes remain available.

## Assessment

For ages approximately 6–12. Five warm-up questions route to a five-question Language module, followed by four Reading questions, three Listening questions and one picture-based Speaking task. There are 41 objective items across the three routes. Questions and artwork are original; the Cambridge Young Learners diagnostic was used as a reference for familiar vocabulary and picture-supported tasks.

The reporting range is Pre-A1, A1 and A2, labelled with the corresponding Starters, Movers and Flyers learning stages. Results are Brighton diagnostic estimates, not Cambridge exam results or CEFR certification. Routing thresholds are school rules and should be checked against teacher placements before relying on them for class allocation.

Speaking uses actual audio and the existing Gemini 3.8 Flash pipeline, with a separate Young Learners examiner and rubric `brighton-young-speaking-rubric-1.0`. The examiner accepts short meaningful answers, picture labels and age-appropriate pauses. Fluency, grammar, vocabulary, pronunciation and communication are assessed separately; Wix computes the weighted composite and limits the final adjustment to one adjacent band. Speaking can be skipped explicitly and remains unscored in that case. The result scores use the existing Brighton CEFR score scale.

## Wix deployment

Installed in the Brighton Exams site `06a80236-67d7-4837-b4c8-2a62b29ee79b`:

- `Backend/young-placement.js`
- `Backend/young-gemini-speaking.js`
- The additive routes in `wix-backend/http-routes.js`, merged into the existing `Backend/http-functions.js`.

Five isolated CMS collections are ADMIN-only: `BrightonYoungPlacementSessions`, `BrightonYoungPlacementResponses`, `BrightonYoungPlacementItems`, `BrightonYoungPlacementSpeaking`, and `BrightonYoungPlacementSpeakingChunks`. Forty-one answer keys were seeded privately in Wix. Populated keys are deliberately absent from this public repository. Sessions also record adult consent and its date. Teachers can inspect completed results, transcripts and rubric evidence in these private Wix CMS collections; no public child-results listing endpoint is exposed.

The existing `BRIGHTON_PLACEMENT_GEMINI_API_KEY` secret is reused only in the Wix backend. Names and phone numbers are not included in Gemini requests. Inline audio is not persisted; larger recordings use temporary chunks that are removed after successful grading or skipping, or when an inactive attempt is purged. Active attempts expire after one hour without activity; completed results remain.

## Assets and verification

`assets/park.png` was generated with the built-in ImageGen tool. The exact prompt is in `assets/imagegen-prompt.txt`. The scene was checked visually for the three children, object colours, three apples and two ducks used by the questions. Nine original listening scripts were synthesized with Microsoft Zira and encoded as 48 kbps MP3; their scripts are in `audio/scripts.json`.

Verified private answer mappings, all routing boundaries, prompt parity, duration windows, original adult endpoint compatibility, live Pre-A1/A1/A2 routing, resume, consent/version/session-ownership rejection, explicit speaking skip and live chunked audio grading with a synthetic QA recording. Live microphone capture still depends on the learner's device permission and browser audio support. QA records were removed after testing.

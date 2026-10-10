# VOICE MAP — DO NOT IMPORT THIS FILE

The `.txt` files in this folder contain only text that should be spoken plus Eleven v3 audio tags. Speaker names are intentionally kept out of those files because visible labels can be narrated by ElevenCreative Studio. See `README.md` for the v3 tag and pacing standard.

Paragraph numbers below are 1-based and follow the paragraph order after importing the current `.txt` files, **including the leading spoken `Track N.N.` paragraph**. That first paragraph always uses the default narrator. If paragraphs are split or combined in Studio, match assignments to the speaker's text rather than applying stale paragraph numbers.

## Approved A1 voices

Use **Jessica - Playful, Bright, Warm** (`cgSgspJ2msm6clMCkdW9`) as the default narrator for **all A1 tracks**: spoken track labels, instructions, vocabulary, pronunciation models and other narration. The HOST/Lucy role in HORIZONS ON AIR also uses Jessica. Generic interviewer narration may use this same voice while dialogue participants retain distinct voices.

### Preferred dialogue pool — Brighton A1 exam

The author selected **Brighton English School A1 exam** as the preferred voice pool for new A1 dialogue roles. The following voices were verified in the exam's ElevenCreative Studio speech paragraphs on **2026-10-05** and matched to the connected ElevenLabs voice library.

| ElevenLabs voice | Voice ID |
| --- | --- |
| Juniper - Grounded and Professional | `aMSt68OGf4xUZAnLpTU8` |
| Adeline - Feminine and Conversational | `5l5f8iK3YPeGga21rQIX` |
| Amy - Natural and Sweet | `OZxMHsGaBmV5pjMIDIn0` |
| Arabella - Mysterious and Emotive | `Z3R5wn05IrDiVCyEkUrK` |
| Jarnathan - Confident and Versatile | `c6SfcYrb2t09NHXiT80T` |
| Mark - Natural Conversations | `UgBBYS2sOqTuMpoF3BR0` |
| Mark - Casual, Relaxed and Light | `1SM7GgM6IMuvQlz2BwM3` |
| Bradford - Expressive and Articulate | `NNl6r8mD7vthiJatiJt1` |

The two Mark entries are **different voices**, not alternative names for one voice. Bradford is the exam's narrator and may be used for a dialogue character in Horizons; **Jessica remains the Horizons A1 narrator**. Bradford has a British English accent; the other exam-pool voices have American English accents. Choose an appropriate voice for each role and record its exact ID before generation. Keep the same voice for that character across returning appearances and repeated performances.

Source: [Brighton English School A1 exam](https://elevenlabs.io/app/studio/MFVMJE8ClXokURnpes9t), Studio project `MFVMJE8ClXokURnpes9t`.

### Established HORIZONS ON AIR cast

Preserve the author-selected **HORIZONS ON AIR — EPISODE: BUS OR CAR?**, Track 2.3, cast for its established roles. These assignments were verified in its ElevenCreative Studio project on **2026-10-05** and matched to the connected ElevenLabs voice library.

| Role | ElevenLabs voice | Voice ID |
| --- | --- | --- |
| Default narrator / HOST (Lucy) | Jessica - Playful, Bright, Warm | `cgSgspJ2msm6clMCkdW9` |
| JULIA | Claudia - Calm Latin | `t9v2PYmkh4GaweGzpWNw` |
| DIEGO | Luis Vega - Engaging, Neutral and Clear | `E3MrNtjUaYrNQEr9YqXs` |
| ANA | Fernanda Sanmiguel - Neutral and Serious | `1aJyZpkt0vxhGPBnPyrs` |

Prefer the exam pool for dialogue roles. For the author's full A1 audio regeneration on 2026-10-06, the current production cast below assigns the earlier named characters from that approved pool, keeps returning characters consistent and retains the established BUS OR CAR? cast. The paragraph maps below identify their speech turns.

## Current production cast — full A1 regeneration

| Roles | Voice | Voice ID |
| --- | --- | --- |
| Narrator; HOST/Lucy | Jessica | `cgSgspJ2msm6clMCkdW9` |
| Interviewer; Sarah; receptionist | Juniper | `aMSt68OGf4xUZAnLpTU8` |
| Mary; Ariana; Allison | Amy | `OZxMHsGaBmV5pjMIDIn0` |
| Lindsay; Lisa; Nora | Adeline | `5l5f8iK3YPeGga21rQIX` |
| Tom; Bryan; Eli | Jarnathan | `c6SfcYrb2t09NHXiT80T` |
| Speaker A in 1.3; Marco; Mike; Leo | Mark - Natural Conversations | `UgBBYS2sOqTuMpoF3BR0` |
| Stephen; John | Mark - Casual, Relaxed and Light | `1SM7GgM6IMuvQlz2BwM3` |
| Julia | Claudia | `t9v2PYmkh4GaweGzpWNw` |
| Diego | Luis Vega | `E3MrNtjUaYrNQEr9YqXs` |
| Ana | Fernanda Sanmiguel | `1aJyZpkt0vxhGPBnPyrs` |

Track 1.8 has two exercise recordings with the same printed track number.
The vocabulary is `Track 1.8.mp3`; the profiles are
`Track 1.8 - Exercise 4.1.mp3`. Track 1.11 is an existing duplicate of the
country models, retained under its old number for file compatibility; the
current lesson uses Track 1.10. Generation records are in
`../A1-production.json`.

Use `eleven_v3` for current A1 generation and follow the clarity/pacing guidance in `README.md`. Voice IDs are authoritative; display names may change. Do not silently substitute the narrator or established character voices.

Source Studio project: `73VSiMr366uhy5XOEUZ5`; chapter: `X7TiPgEd9ZDacTlciube`. The [source episode](https://elevenlabs.io/app/studio/73VSiMr366uhy5XOEUZ5?chapterId=X7TiPgEd9ZDacTlciube) identifies Lucy/Jessica, Julia/Claudia, Diego/Luis Vega and Ana/Fernanda in the speech paragraphs.

## 1A — Track 1.1
- NARRATOR (Jessica): 1
- TOM: 2, 4, 6, 8
- MARY: 3, 5, 7

## 1A — Track 1.2
- NARRATOR (Jessica): 1, 2

## 1A — Track 1.3
- NARRATOR (Jessica): 1
- SPEAKER A: 2, 4, 6, 8, 10, 12
- SPEAKER B / ARIANA: 3, 5, 7, 9, 11, 13

## 1A — Track 1.4
- NARRATOR (Jessica): 1, 2

## 1A — Track 1.5
- NARRATOR (Jessica): 1
- INTERVIEWER: 2, 4, 6, 8, 10, 12, 14, 16
- STEPHEN: 3, 5
- ALLISON: 7, 9
- BRYAN: 11, 13
- LINDSAY: 15, 17

## 1A — Track 1.6
- NARRATOR (Jessica): 1, 2

## 1A — Track 1.7
- NARRATOR (Jessica): 1
- INTERVIEWER: 2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24, 26, 28, 30
- ALLISON: 3, 5, 7, 9, 11
- BRYAN: 13, 15, 17, 19, 21
- LINDSAY: 23, 25, 27, 29, 31

## 1B — Track 1.8 — Exercise 1
- NARRATOR (Jessica): 1, 2

## 1B — Track 1.8 — Exercise 4.1
- NARRATOR (Jessica): 1
- TOM: 2
- SARAH: 3
- MARCO: 4

## 1B — Track 1.9
- NARRATOR (Jessica): 1
- INTERVIEWER: 2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24, 26, 28, 30
- ALLISON: 3, 5, 7
- MIKE: 9, 11, 13
- JOHN: 15, 17, 19
- LISA: 21, 23, 25
- BRYAN: 27, 29, 31

## 1C — Track 1.10
- NARRATOR (Jessica): 1, 2

## 1C — Track 1.11 — Legacy duplicate
- NARRATOR (Jessica): 1, 2

## 2A — Track 2.1
- NARRATOR (Jessica): 1
- NORA: 2, 4, 6, 8, 10
- ELI: 3, 5, 7, 9, 11

## 2A — Track 2.2
- NARRATOR (Jessica): 1, 2

## 2B — Track 2.3
- NARRATOR (Jessica): 1
- HOST: 2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24, 26, 28, 30, 32, 34, 36, 38, 40, 42, 44, 46, 48, 50
- JULIA: 3, 5, 7, 9, 11, 13, 15
- DIEGO: 17, 19, 21, 23, 25, 27, 29, 31
- ANA: 33, 35, 37, 39, 41, 43, 45, 47, 49

## 2D — Track 2.4
- NARRATOR (Jessica): 1, 2

## 2D — Track 2.5
- NARRATOR (Jessica): 1
- RECEPTIONIST (Juniper - Grounded and Professional, `aMSt68OGf4xUZAnLpTU8`): 2, 4, 6, 8, 10, 12
- LEO (Mark - Natural Conversations, `UgBBYS2sOqTuMpoF3BR0`): 3, 5, 7, 9, 11, 13

These new 2D dialogue roles use the preferred Brighton A1 exam pool. Retain
their recorded IDs if either role returns. Track labels and color models
remain Jessica. Generation records live in `../2D-production.json`.

## 3B — Track 3.4
- NARRATOR (Jessica, `cgSgspJ2msm6clMCkdW9`): 1, 2.

## 3B — Track 3.5 — Three people. Three weeks.
- NARRATOR / HOST (Lucy; Jessica, `cgSgspJ2msm6clMCkdW9`): 1, 2, 4, 6, 8, 10, 12, 14, 16, 18, 20.
- LUCÍA (Amy, `OZxMHsGaBmV5pjMIDIn0`): 3, 5, 7, 13.
- KEN (Mark - Natural Conversations, `UgBBYS2sOqTuMpoF3BR0`): 9, 11.
- MARYAM (Juniper, `aMSt68OGf4xUZAnLpTU8`): 15, 17, 19.

All three guests are new fictional roles. Retain these exact voices if they return. Jessica remains the track announcer and radio host. Production records: `../3B-production.json`.

## 3A - Tracks 3.1 and 3.2
- NARRATOR (Jessica, `cgSgspJ2msm6clMCkdW9`): 1, 2 in each track.

Track 3.2 is third-person narration of an A1 adaptation of Messi's 2023 routine,
not a celebrity voice imitation or a fabricated first-person interview.

## 3A - Track 3.3
- NARRATOR (Jessica, `cgSgspJ2msm6clMCkdW9`): 1, 2, 4.
- NINA (Adeline, `5l5f8iK3YPeGga21rQIX`): 3.
- OMAR (Jarnathan, `c6SfcYrb2t09NHXiT80T`): 5.

Nina and Omar are original fictional characters. Keep these approved exam-pool
voice IDs if they return. All three tracks use Eleven v3, Natural Stability
(0.5). Generation and transcription checks are in `../3A-production.json`.

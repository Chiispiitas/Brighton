// Brighton Placement — Gemini audio speaking examiner
// Keep the API key in Wix Secrets Manager only. This module never returns it.

import wixSecretsBackend from "wix-secrets-backend";
import { fetch } from "wix-fetch";

export const SPEAKING_RUBRIC_VERSION = "brighton-speaking-rubric-1.1";
export const GEMINI_SPEAKING_MODEL = "gemini-3.8-flash";

const GEMINI_SECRET_NAME = "BRIGHTON_PLACEMENT_GEMINI_API_KEY";
const GEMINI_ENDPOINT = "https://generativelanguage.googleapis.com/v1beta/interactions";

const LEVELS = ["PRE-A1", "A1", "A2", "B1", "B1+", "B2", "C1"];

const PROMPTS = {
  "sp-prea1-01": "Tell us about yourself. Say where you live and one thing you like doing.",
  "sp-a1-01": "Describe a normal weekday for you. What do you do in the morning, afternoon and evening?",
  "sp-a2-01": "Talk about a place you enjoy visiting. Describe it, say what you do there and explain why you like it.",
  "sp-b1-01": "Talk about a challenge you faced. Explain what happened, what you did and what you learned from it.",
  "sp-b1plus-01": "Do students learn better online or in person? Give your opinion, compare both options and support your answer with an example.",
  "sp-b2-01": "Some people think technology has improved communication, while others think it has made communication less meaningful. Discuss both views and give your own position.",
  "sp-c1-01": "Should convenience always be the main goal when technology is designed? Discuss possible trade-offs, use examples and reach a clear conclusion."
};

const PROFILES = {
  "PRE-A1": { minSeconds: 12, targetSeconds: 20 },
  "A1": { minSeconds: 15, targetSeconds: 25 },
  "A2": { minSeconds: 20, targetSeconds: 35 },
  "B1": { minSeconds: 25, targetSeconds: 40 },
  "B1+": { minSeconds: 30, targetSeconds: 45 },
  "B2": { minSeconds: 35, targetSeconds: 50 },
  "C1": { minSeconds: 40, targetSeconds: 55 }
};

const SCORE_WEIGHTS = {
  fluency: 0.20,
  grammar: 0.25,
  vocabulary: 0.20,
  pronunciation: 0.15,
  communication: 0.20
};

const ASSESSMENT_BANDS = ["PRE-A1", "A1", "A2", "B1", "B1+", "B2", "C1", "ABOVE-C1"];
const BAND_POSITIONS = ["low", "mid", "high"];
const BAND_SCORES = {
  "PRE-A1": { low: 0.6, mid: 1.2, high: 1.8 },
  "A1": { low: 2.2, mid: 2.8, high: 3.3 },
  "A2": { low: 3.7, mid: 4.3, high: 4.8 },
  "B1": { low: 5.2, mid: 5.8, high: 6.3 },
  "B1+": { low: 6.7, mid: 7.1, high: 7.4 },
  "B2": { low: 7.7, mid: 8.2, high: 8.7 },
  "C1": { low: 8.9, mid: 9.3, high: 9.6 },
  "ABOVE-C1": { low: 9.7, mid: 9.9, high: 10.0 }
};

const RESPONSE_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    evidenceQuality: {
      type: "string",
      enum: ["sufficient", "borderline", "insufficient"]
    },
    transcript: { type: "string" },
    promptRepeat: { type: "boolean" },
    fluency: {
      type: "object",
      additionalProperties: false,
      properties: {
        band: {
          type: "string",
          enum: ASSESSMENT_BANDS
        },
        position: {
          type: "string",
          enum: BAND_POSITIONS
        },
        evidence: {
          type: "array",
          items: { type: "string" },
          minItems: 1,
          maxItems: 3
        }
      },
      required: ["band", "position", "evidence"]
    },
    grammar: {
      type: "object",
      additionalProperties: false,
      properties: {
        band: {
          type: "string",
          enum: ASSESSMENT_BANDS
        },
        position: {
          type: "string",
          enum: BAND_POSITIONS
        },
        evidence: {
          type: "array",
          items: { type: "string" },
          minItems: 1,
          maxItems: 3
        },
        errors: {
          type: "array",
          maxItems: 6,
          items: {
            type: "object",
            additionalProperties: false,
            properties: {
              heard: { type: "string" },
              issue: { type: "string" },
              severity: {
                type: "string",
                enum: ["minor", "noticeable", "major"]
              }
            },
            required: ["heard", "issue", "severity"]
          }
        }
      },
      required: ["band", "position", "evidence", "errors"]
    },
    vocabulary: {
      type: "object",
      additionalProperties: false,
      properties: {
        band: {
          type: "string",
          enum: ASSESSMENT_BANDS
        },
        position: {
          type: "string",
          enum: BAND_POSITIONS
        },
        evidence: {
          type: "array",
          items: { type: "string" },
          minItems: 1,
          maxItems: 3
        }
      },
      required: ["band", "position", "evidence"]
    },
    pronunciation: {
      type: "object",
      additionalProperties: false,
      properties: {
        band: {
          type: "string",
          enum: ASSESSMENT_BANDS
        },
        position: {
          type: "string",
          enum: BAND_POSITIONS
        },
        intelligibility: {
          type: "string",
          enum: ["high", "adequate", "limited", "very-limited"]
        },
        evidence: {
          type: "array",
          items: { type: "string" },
          minItems: 1,
          maxItems: 3
        }
      },
      required: ["band", "position", "intelligibility", "evidence"]
    },
    communication: {
      type: "object",
      additionalProperties: false,
      properties: {
        band: {
          type: "string",
          enum: ASSESSMENT_BANDS
        },
        position: {
          type: "string",
          enum: BAND_POSITIONS
        },
        taskAchievement: { type: "number", minimum: 0, maximum: 10 },
        coherence: { type: "number", minimum: 0, maximum: 10 },
        development: { type: "number", minimum: 0, maximum: 10 },
        evidence: {
          type: "array",
          items: { type: "string" },
          minItems: 1,
          maxItems: 3
        }
      },
      required: ["band", "position", "taskAchievement", "coherence", "development", "evidence"]
    },
    overallEvidence: {
      type: "array",
      items: { type: "string" },
      minItems: 1,
      maxItems: 3
    }
  },
  required: [
    "evidenceQuality",
    "transcript",
    "promptRepeat",
    "fluency",
    "grammar",
    "vocabulary",
    "pronunciation",
    "communication",
    "overallEvidence"
  ]
};

const EXAMINER_INSTRUCTIONS = `
You are the Brighton English Placement speaking examiner. Assess ONE unscripted English response from its AUDIO.

Your job is measurement, not encouragement. Use the same standard for every candidate. The routed prompt level is context only; NEVER assume the candidate has that level merely because they received that prompt.

CORE SCORING RULE
For EACH dimension, choose the CEFR-aligned BAND FIRST, then choose position low/mid/high inside that band. Do not invent a free numeric score. Brighton converts your band + position into a deterministic number after you respond.

ASSESSMENT PROCESS
1. Listen to the full recording before scoring.
2. Produce a conservative verbatim transcript. Do not silently repair grammar or vocabulary. When a word is genuinely unclear, use [unclear] rather than inventing a word.
3. Decide whether there is enough independent English to assess.
4. Check whether the candidate mainly reads/repeats the prompt instead of answering it.
5. For each dimension, identify the BEST-FIT band from the descriptors.
6. Then select low/mid/high according to how securely the performance fits that band.
7. Re-check that your chosen band agrees with the evidence you cite.
8. Return only the required JSON.

BAND MEANINGS
PRE-A1: little or no assessable independent language.
A1: very limited basic language; short familiar utterances; heavy dependence on memorized/simple forms.
A2: simple connected language on familiar matters; limited range and control.
B1: sustained familiar communication with workable control, but clear limitations in range, accuracy, precision, or development.
B1+: stronger than secure B1 but not consistently B2; broader control with noticeable limitations.
B2: clear, sustained, developed and reasonably flexible speech with good control; errors/hesitation do not normally obstruct communication.
C1: fluent, flexible, precise, well-developed speech with consistently strong control; occasional slips are possible.
ABOVE-C1: exceptional C2-like evidence: effortless flexibility, very high precision, nuanced control and virtually no meaningful weakness for the dimension. Brighton still reports the public placement ceiling as C1.

BAND-POSITION DISCIPLINE
- low: just securely inside the band; evidence also shows some features of the band below.
- mid: clearly representative of the band.
- high: strong performance near the top of the band; some features of the band above may appear.
Do not use ABOVE-C1 merely because the candidate sounds educated, speaks quickly, or uses sophisticated vocabulary.
If the qualitative evidence matches C1, return C1. Do NOT demote to B2 simply because there is one isolated minor slip.
A C1 performance may contain occasional non-systematic errors, self-repairs or momentary lexical imprecision.

FLUENCY
Judge continuity, pausing, hesitation, searching, reformulation, natural pace and ability to sustain speech.
- C1: sustained and spontaneous; pauses mainly for formulation of ideas rather than basic language; repair is controlled.
- B2: generally smooth and sustained; some hesitation/searching, especially with complex ideas, but flow remains effective.
- B1/B1+: can sustain connected speech but has noticeable pauses, reformulation or uneven pace.
- A2: frequent pauses and short runs; delivery relies on simple chunks.
- A1/PRE-A1: isolated or very short utterances with extensive pausing.
- ABOVE-C1: highly effortless, flexible delivery with precise pacing and near-seamless reformulation even while expressing nuanced ideas.
Do not reward speed by itself. Do not penalize a natural accent.

GRAMMAR
Judge BOTH RANGE and ACCURACY: tense/aspect, agreement, articles, prepositions, word order, morphology, clause structure, subordination and control of complex syntax.
- C1: wide structural range with consistently high control; errors are occasional slips rather than systematic weaknesses.
- B2: good range of simple and complex forms with generally good control; some errors remain, especially in demanding structures.
- B1/B1+: good control of common structures; attempts some complexity, but recurrent errors or restricted range are noticeable.
- A2: mainly simple structures with regular errors; meaning is usually recoverable.
- A1/PRE-A1: very limited structures; frequent errors and fragments.
- ABOVE-C1: extensive and flexible structural repertoire with consistently precise control; any errors are rare slips.
Never treat connector words or sentence length as proof of grammatical control. Penalize malformed complexity rather than rewarding it.
IMPORTANT: one or two isolated MINOR agreement/article/preposition slips must not by themselves push otherwise C1 grammatical control down to B2.

VOCABULARY
Judge range, precision, appropriacy, collocation, repetition, paraphrasing and lexical control.
- C1: broad, precise and flexible repertoire; effective paraphrase; collocations are largely natural; little obvious searching.
- B2: good range for concrete and abstract topics; generally precise; can paraphrase around gaps; occasional awkward word choice/collocation.
- B1/B1+: enough range to explain familiar and some abstract ideas, but repetition, imprecision or circumlocution is noticeable.
- A2: adequate basic vocabulary for everyday topics; limited precision and frequent repetition.
- A1/PRE-A1: very small repertoire of isolated/basic words and memorized phrases.
- ABOVE-C1: exceptionally broad, idiomatic, nuanced and precise lexical control with highly natural collocation.
Do not use word length as evidence of vocabulary level. Advanced words only count when they are appropriate and correctly controlled.

PRONUNCIATION
Judge the AUDIO, not the transcript. Consider overall intelligibility, sound clarity where audible, word stress, sentence stress, rhythm, connected speech and prosodic control.
- C1: effortlessly intelligible with strong prosodic control; accent may be present but rarely requires listener effort.
- B2: consistently intelligible; occasional sound/stress/prosody issues do not materially interfere.
- B1/B1+: generally intelligible but some recurring pronunciation/prosody features require listener adjustment.
- A2: usually understandable in short stretches, with frequent pronunciation/stress issues.
- A1/PRE-A1: intelligibility is often limited.
- ABOVE-C1: highly controlled, expressive prosody and connected speech with virtually no listener effort.
Do NOT penalize a non-native accent merely for being non-native. Penalize only features that reduce clarity, natural phrasing or listener comprehension.

COMMUNICATION
Judge whether the candidate ACTUALLY answers this prompt: relevance, task fulfilment, organization, coherence, development, explanations, reasons, examples, comparisons and conclusion when requested.
- C1: fully addresses the substantive demands; ideas are nuanced, well organized and substantially developed; relationships between ideas are clear.
- B2: addresses the task clearly and develops relevant points with reasons/examples; organization is effective.
- B1/B1+: communicates a clear main message with some development; parts may be underdeveloped, repetitive or loosely connected.
- A2: communicates simple relevant information with limited development.
- A1/PRE-A1: only fragments of the task are addressed.
- ABOVE-C1: develops and qualifies ideas with exceptional control, precision and rhetorical flexibility.
Do not give high Communication merely for speaking at length.

AUTOMATIC CUTOFF FAIRNESS
The candidate context tells you whether the platform automatically stopped the recording at its hard time limit.
If autoStoppedByTimeLimit=true:
- do NOT penalize the candidate merely because the final sentence is cut off;
- do NOT penalize a missing final conclusion solely because the platform ended the recording;
- judge task achievement from the substantive content completed BEFORE cutoff;
- you may still lower Communication if major task requirements were genuinely not addressed before cutoff for reasons other than the abrupt ending.

PROMPT REPETITION
Set promptRepeat=true when the answer consists mainly of reading/repeating/paraphrasing the prompt with too little original meaningful content to assess. Quoting a small part of the prompt while genuinely answering it is fine.

EVIDENCE QUALITY
- sufficient: recording is clear enough and contains enough independent speech for all five dimensions.
- borderline: enough speech to estimate the five dimensions, but audio quality, brevity, or uncertainty materially limits confidence.
- insufficient: mostly silence/noise, essentially no English, too little meaningful speech, or otherwise not enough evidence to score responsibly.

SCORING DISCIPLINE
Keep dimensions independent: sophisticated vocabulary must not rescue weak grammar; excellent pronunciation must not rescue poor task fulfilment.
Choose the band from evidence, not from the routed level.
C1 does NOT mean perfect English.
ABOVE-C1 is reserved for clearly exceptional evidence, not simply a strong C1 performance.
`;

function clamp10(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) return 0;
  return Math.min(10, Math.max(0, number));
}

function round1(value) {
  return Math.round(clamp10(value) * 10) / 10;
}

function normalizeAssessmentBand(value) {
  return ASSESSMENT_BANDS.includes(value) ? value : "PRE-A1";
}

function normalizeBandPosition(value) {
  return BAND_POSITIONS.includes(value) ? value : "low";
}

function scoreFromBand(band, position) {
  const safeBand = normalizeAssessmentBand(band);
  const safePosition = normalizeBandPosition(position);
  return BAND_SCORES[safeBand][safePosition];
}

function safeArray(value, max = 3) {
  return Array.isArray(value)
    ? value.map((item) => String(item || "").trim()).filter(Boolean).slice(0, max)
    : [];
}

function tokenise(text) {
  return String(text || "").toLowerCase().match(/[a-z]+(?:'[a-z]+)?/g) || [];
}

function normalizeAudioMime(value) {
  const mime = String(value || "").toLowerCase().split(";")[0].trim();
  if (mime === "audio/mp4") return "audio/m4a";

  const supported = new Set([
    "audio/wav",
    "audio/mp3",
    "audio/aiff",
    "audio/aac",
    "audio/ogg",
    "audio/flac",
    "audio/mpeg",
    "audio/m4a",
    "audio/l16",
    "audio/opus",
    "audio/alaw",
    "audio/mulaw",
    "audio/webm"
  ]);

  return supported.has(mime) ? mime : "";
}

function levelFromComposite(composite) {
  if (composite < 2.0) return "PRE-A1";
  if (composite < 3.5) return "A1";
  if (composite < 5.0) return "A2";
  if (composite < 6.5) return "B1";
  if (composite < 7.5) return "B1+";
  if (composite < 8.8) return "B2";
  return "C1";
}

function adjacentFinalLevel(objectiveLevel, speakingLevel) {
  const objectiveIndex = Math.max(0, LEVELS.indexOf(objectiveLevel));
  const speakingIndex = Math.max(0, LEVELS.indexOf(speakingLevel));

  if (speakingIndex > objectiveIndex) {
    return LEVELS[Math.min(LEVELS.length - 1, objectiveIndex + 1)];
  }

  if (speakingIndex < objectiveIndex) {
    return LEVELS[Math.max(0, objectiveIndex - 1)];
  }

  return LEVELS[objectiveIndex];
}

function extractInteractionText(interaction) {
  const steps = Array.isArray(interaction?.steps) ? interaction.steps : [];

  for (let i = steps.length - 1; i >= 0; i -= 1) {
    const step = steps[i];
    if (step?.type !== "model_output" || !Array.isArray(step.content)) continue;

    const text = step.content
      .filter((item) => item?.type === "text" && typeof item.text === "string")
      .map((item) => item.text)
      .join("")
      .trim();

    if (text) return text;
  }

  return "";
}

function sanitizeAssessment(raw) {
  const grammarErrors = Array.isArray(raw?.grammar?.errors)
    ? raw.grammar.errors.slice(0, 6).map((error) => ({
        heard: String(error?.heard || "").trim().slice(0, 240),
        issue: String(error?.issue || "").trim().slice(0, 320),
        severity: ["minor", "noticeable", "major"].includes(error?.severity)
          ? error.severity
          : "noticeable"
      }))
    : [];

  return {
    evidenceQuality: ["sufficient", "borderline", "insufficient"].includes(raw?.evidenceQuality)
      ? raw.evidenceQuality
      : "insufficient",
    transcript: String(raw?.transcript || "").replace(/\s+/g, " ").trim().slice(0, 6000),
    promptRepeat: Boolean(raw?.promptRepeat),
    fluency: {
      band: normalizeAssessmentBand(raw?.fluency?.band),
      position: normalizeBandPosition(raw?.fluency?.position),
      score: scoreFromBand(raw?.fluency?.band, raw?.fluency?.position),
      evidence: safeArray(raw?.fluency?.evidence)
    },
    grammar: {
      band: normalizeAssessmentBand(raw?.grammar?.band),
      position: normalizeBandPosition(raw?.grammar?.position),
      score: scoreFromBand(raw?.grammar?.band, raw?.grammar?.position),
      evidence: safeArray(raw?.grammar?.evidence),
      errors: grammarErrors
    },
    vocabulary: {
      band: normalizeAssessmentBand(raw?.vocabulary?.band),
      position: normalizeBandPosition(raw?.vocabulary?.position),
      score: scoreFromBand(raw?.vocabulary?.band, raw?.vocabulary?.position),
      evidence: safeArray(raw?.vocabulary?.evidence)
    },
    pronunciation: {
      band: normalizeAssessmentBand(raw?.pronunciation?.band),
      position: normalizeBandPosition(raw?.pronunciation?.position),
      score: scoreFromBand(raw?.pronunciation?.band, raw?.pronunciation?.position),
      intelligibility: ["high", "adequate", "limited", "very-limited"].includes(raw?.pronunciation?.intelligibility)
        ? raw.pronunciation.intelligibility
        : "limited",
      evidence: safeArray(raw?.pronunciation?.evidence)
    },
    communication: {
      band: normalizeAssessmentBand(raw?.communication?.band),
      position: normalizeBandPosition(raw?.communication?.position),
      score: scoreFromBand(raw?.communication?.band, raw?.communication?.position),
      taskAchievement: round1(raw?.communication?.taskAchievement),
      coherence: round1(raw?.communication?.coherence),
      development: round1(raw?.communication?.development),
      evidence: safeArray(raw?.communication?.evidence)
    },
    overallEvidence: safeArray(raw?.overallEvidence)
  };
}

async function getGeminiApiKey() {
  // Use the Velo-native backend module here instead of @wix/* SDK imports.
  // This keeps Classic Editor HTTP functions deployable even when the SDK
  // packages are unavailable to the site's backend build environment.
  const apiKey = String(
    await wixSecretsBackend.getSecret(GEMINI_SECRET_NAME) || ""
  ).trim();

  if (!apiKey) {
    throw new Error("Gemini API key is unavailable.");
  }

  return apiKey;
}

export async function gradeSpeakingWithGemini(payload, objectiveLevel, promptId) {
  const profile = PROFILES[objectiveLevel] || PROFILES.A2;
  const prompt = PROMPTS[promptId];
  const durationSeconds = Math.max(0, Math.min(180, Number(payload?.durationSeconds) || 0));
  const audioBase64 = String(payload?.audioBase64 || "").trim();
  const audioMimeType = normalizeAudioMime(payload?.audioMimeType || payload?.recorderMimeType);

  const preflightError =
    !prompt ||
    !audioMimeType ||
    audioBase64.length < 1600 ||
    audioBase64.length > 15000000 ||
    durationSeconds < Math.max(5, profile.minSeconds * 0.72);

  if (preflightError) {
    return {
      inputError: true,
      retryReason: "technical",
      transcript: "",
      durationSeconds,
      speechSeconds: 0,
      wordCount: 0,
      wpm: 0,
      recognitionConfidence: 0,
      segmentCount: 0,
      fluency: 0,
      grammar: 0,
      vocabulary: 0,
      pronunciation: 0,
      communication: 0,
      composite: 0,
      speakingLevel: objectiveLevel,
      finalLevel: objectiveLevel,
      confidence: 0.35,
      assessment: null,
      usage: null
    };
  }

  const apiKey = await getGeminiApiKey();

  const maximumSeconds = Math.max(0, Math.min(180, Number(payload?.maximumSeconds) || 0));
  const autoStoppedByTimeLimit = Boolean(payload?.autoStoppedByTimeLimit);

  const candidateContext =
    "Assigned Brighton route: " + objectiveLevel + "\n" +
    "Prompt: " + prompt + "\n" +
    "Recorded duration: " + durationSeconds.toFixed(1) + " seconds.\n" +
    "Platform hard time limit: " + (maximumSeconds ? maximumSeconds.toFixed(1) + " seconds" : "not supplied") + ".\n" +
    "autoStoppedByTimeLimit: " + (autoStoppedByTimeLimit ? "true" : "false") + "\n" +
    "Assess the candidate from the attached audio. Return only the required JSON.";

  const response = await fetch(GEMINI_ENDPOINT, {
    method: "post",
    headers: {
      "Content-Type": "application/json",
      "x-goog-api-key": apiKey
    },
    body: JSON.stringify({
      model: GEMINI_SPEAKING_MODEL,
      system_instruction: EXAMINER_INSTRUCTIONS,
      input: [
        { type: "text", text: candidateContext },
        { type: "audio", data: audioBase64, mime_type: audioMimeType }
      ],
      response_format: {
        type: "text",
        mime_type: "application/json",
        schema: RESPONSE_SCHEMA
      },
      generation_config: {
        thinking_level: "medium",
        seed: 20260920
      },
      store: false
    })
  });

  const rawText = await response.text();

  if (!response.ok) {
    console.error("Gemini speaking request failed:", response.status, rawText.slice(0, 500));
    throw new Error("Gemini speaking assessment failed.");
  }

  let interaction;
  try {
    interaction = JSON.parse(rawText);
  } catch {
    throw new Error("Gemini returned an unreadable response.");
  }

  if (interaction?.status !== "completed") {
    console.error("Gemini speaking interaction incomplete:", interaction?.status || "unknown");
    throw new Error("Gemini speaking assessment did not complete.");
  }

  const outputText = extractInteractionText(interaction);
  if (!outputText) {
    throw new Error("Gemini returned no speaking assessment.");
  }

  let rawAssessment;
  try {
    rawAssessment = JSON.parse(outputText);
  } catch {
    throw new Error("Gemini returned invalid speaking JSON.");
  }

  const assessment = sanitizeAssessment(rawAssessment);
  const tokens = tokenise(assessment.transcript);
  const wordCount = tokens.length;
  const wpm = durationSeconds > 0 ? wordCount / (durationSeconds / 60) : 0;

  const composite = round1(
    assessment.fluency.score * SCORE_WEIGHTS.fluency +
    assessment.grammar.score * SCORE_WEIGHTS.grammar +
    assessment.vocabulary.score * SCORE_WEIGHTS.vocabulary +
    assessment.pronunciation.score * SCORE_WEIGHTS.pronunciation +
    assessment.communication.score * SCORE_WEIGHTS.communication
  );

  const rawSpeakingLevel = levelFromComposite(composite);
  const finalLevel = adjacentFinalLevel(objectiveLevel, rawSpeakingLevel);
  const promptRepeat = assessment.promptRepeat;
  const insufficient =
    assessment.evidenceQuality === "insufficient" ||
    wordCount < 5;

  if (promptRepeat || insufficient) {
    return {
      inputError: true,
      retryReason: promptRepeat ? "prompt-repeat" : "insufficient-evidence",
      transcript: assessment.transcript,
      durationSeconds: Math.round(durationSeconds * 10) / 10,
      speechSeconds: 0,
      wordCount,
      wpm: Math.round(wpm * 10) / 10,
      recognitionConfidence: 0,
      segmentCount: 0,
      fluency: assessment.fluency.score,
      grammar: assessment.grammar.score,
      vocabulary: assessment.vocabulary.score,
      pronunciation: assessment.pronunciation.score,
      communication: assessment.communication.score,
      composite,
      speakingLevel: rawSpeakingLevel,
      finalLevel: objectiveLevel,
      confidence: 0.45,
      assessment,
      usage: interaction?.usage || null
    };
  }

  const durationCoverage = Math.min(1, durationSeconds / profile.targetSeconds);
  const evidenceBase = assessment.evidenceQuality === "sufficient" ? 0.80 : 0.65;
  const confidence = Math.min(0.94, evidenceBase + durationCoverage * 0.12);

  return {
    inputError: false,
    retryReason: "",
    transcript: assessment.transcript,
    durationSeconds: Math.round(durationSeconds * 10) / 10,
    speechSeconds: Math.round(Math.max(0, Number(payload?.speechSeconds) || 0) * 10) / 10,
    wordCount,
    wpm: Math.round(wpm * 10) / 10,
    recognitionConfidence: 0,
    segmentCount: 0,
    fluency: assessment.fluency.score,
    grammar: assessment.grammar.score,
    vocabulary: assessment.vocabulary.score,
    pronunciation: assessment.pronunciation.score,
    communication: assessment.communication.score,
    composite,
    speakingLevel: rawSpeakingLevel,
    finalLevel,
    confidence: Math.round(confidence * 100) / 100,
    assessment,
    usage: interaction?.usage || null
  };
}

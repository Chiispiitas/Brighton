// Brighton Exams backend module
// Preserves the existing Exams + live-progress behavior while keeping the public router small.

import wixData from "wix-data";
import {
  DATA_OPTIONS,
  ANSWER_KEY_VERSION,
  jsonOK,
  jsonBadRequest,
  jsonServerError,
  jsonCollectionError,
  normalizeAnswerKeyVersion,
  getStoredAnswerKeyVersion,
  stampServerVersion,
  normalizeClassCode,
  cleanText,
  finiteNumberOrNull,
  validDate,
  safeStringify,
  formatLocal,
  makeSubmissionId
} from "backend/core.js";

const COLLECTIONS = {
  exams: "Exams",
  examSubmissions: "ExamSubmissions",
  examProgress: "ExamProgress"
};

const ACTIVE_PROGRESS_HOURS = 3;
const SUBMITTED_PROGRESS_MINUTES = 15;

const EXAM_ID_ALIASES = Object.freeze({
  "brighton-a2-reading-and-writing-final": "brighton-a2-rw-final"
});

function canonicalExamId(value) {
  const examId = cleanText(value);
  return EXAM_ID_ALIASES[examId] || examId;
}

// Snapshot of the live published getExams response captured while this package was built.
const FALLBACK_EXAMS = [
  {
    "examId": "brighton-a2-listening-final",
    "title": "A2 Listening Exam",
    "level": "A2",
    "skill": "Listening",
    "description": "KET-based Listening final exam. Cambridge Official.",
    "shareUrl": "https://exams.bebrighton.net/Exams/exams/a2-listening/index.html",
    "iframeUrl": "https://exams.bebrighton.net/Exams/exams/a2-listening/index.html",
    "isActive": true,
    "totalQuestions": 25,
    "maxScore": 25
  },
  {
    "examId": "brighton-a2-rw-final",
    "title": "Brighton A2 Reading and Writing Final Exam",
    "level": "A2",
    "skill": "Reading and Writing",
    "description": "Seven-part A2 Key-style Reading and Writing final exam.",
    "shareUrl": "https://exams.bebrighton.net/Exams/exams/a2-rw/index.html",
    "iframeUrl": "https://exams.bebrighton.net/Exams/exams/a2-rw/index.html",
    "isActive": true,
    "totalQuestions": 32,
    "maxScore": 60
  },
  {
    "examId": "brighton-b1plus-writing-final",
    "title": "B1+ Writing Final Exam",
    "level": "B1+",
    "skill": "Writing",
    "description": "PET-based Writing final exam",
    "shareUrl": "https://exams.bebrighton.net/Exams/exams/b1plus-writing/index.html",
    "iframeUrl": "https://exams.bebrighton.net/Exams/exams/b1plus-writing/index.html",
    "isActive": true,
    "totalQuestions": 4,
    "maxScore": 60
  },
  {
    "examId": "brighton-b1plus-listening-final",
    "title": "B1+ Listening Final Exam",
    "level": "B1+",
    "skill": "Listening",
    "description": "PET-based Listening final exam. Uses Collins Preliminary, Test 4",
    "shareUrl": "https://exams.bebrighton.net/Exams/exams/b1plus-listening/index.html",
    "iframeUrl": "https://exams.bebrighton.net/Exams/exams/b1plus-listening/index.html",
    "isActive": true,
    "totalQuestions": 25,
    "maxScore": 25
  },
  {
    "examId": "brighton-b1plus-reading-final",
    "title": "B1+ Reading Exam",
    "level": "B1+",
    "skill": "Reading",
    "description": "PET-based Reading final exam.",
    "shareUrl": "https://exams.bebrighton.net/Exams/exams/b1plus-reading/index.html",
    "iframeUrl": "https://exams.bebrighton.net/Exams/exams/b1plus-reading/index.html",
    "isActive": true,
    "totalQuestions": 32,
    "maxScore": 32
  },
  {
    "examId": "brighton-b2-writing-final",
    "title": "B2 Writing Exam",
    "level": "B2",
    "skill": "Writing",
    "description": "FCE-based Writing final exam.",
    "shareUrl": "https://exams.bebrighton.net/Exams/exams/b2-writing/",
    "iframeUrl": "https://exams.bebrighton.net/Exams/exams/b2-writing/",
    "isActive": true,
    "totalQuestions": 2,
    "maxScore": 40
  },
  {
    "examId": "brighton-b2-listening-final",
    "title": "B2 Listening Exam",
    "level": "B2",
    "skill": "Listening",
    "description": "FCE-based Listening final exam. Uses Cambridge First Practice Tests 2, Test 3",
    "shareUrl": "https://exams.bebrighton.net/Exams/exams/b2-listening/",
    "iframeUrl": "https://exams.bebrighton.net/Exams/exams/b2-listening/",
    "isActive": true,
    "totalQuestions": 30,
    "maxScore": 30
  },
  {
    "examId": "brighton-b2-rue-final",
    "title": "B2 Reading Exam",
    "level": "B2",
    "skill": "Reading and Use of English",
    "description": "FCE-based Reading and Use of English final exam.",
    "shareUrl": "https://exams.bebrighton.net/Exams/exams/b2-rue/",
    "iframeUrl": "https://exams.bebrighton.net/Exams/exams/b2-rue/",
    "isActive": true,
    "totalQuestions": 52,
    "maxScore": 70
  }
];

const FALLBACK_ANSWER_KEYS = {
  "brighton-a2-rw-final": {
    "examId": "brighton-a2-rw-final",
    "examTitle": "Brighton A2 Reading and Writing Final Exam",
    "maxScore": 60,
    "totalQuestions": 32,
    "normalization": {
      "caseInsensitive": true,
      "trimWhitespace": true,
      "collapseInternalWhitespace": true
    },
    "parts": {
      "1": {
        "label": "Part 1",
        "questions": [
          1,
          2,
          3,
          4,
          5,
          6
        ],
        "maxScore": 6
      },
      "2": {
        "label": "Part 2",
        "questions": [
          7,
          8,
          9,
          10,
          11,
          12,
          13
        ],
        "maxScore": 7
      },
      "3": {
        "label": "Part 3",
        "questions": [
          14,
          15,
          16,
          17,
          18
        ],
        "maxScore": 5
      },
      "4": {
        "label": "Part 4",
        "questions": [
          19,
          20,
          21,
          22,
          23,
          24
        ],
        "maxScore": 6
      },
      "5": {
        "label": "Part 5",
        "questions": [
          25,
          26,
          27,
          28,
          29,
          30
        ],
        "maxScore": 6
      },
      "6": {
        "label": "Part 6",
        "questions": [
          31
        ],
        "maxScore": 15
      },
      "7": {
        "label": "Part 7",
        "questions": [
          32
        ],
        "maxScore": 15
      }
    },
    "answers": {
      "1": {
        "part": 1,
        "points": 1,
        "answers": [
          "B"
        ]
      },
      "2": {
        "part": 1,
        "points": 1,
        "answers": [
          "A"
        ]
      },
      "3": {
        "part": 1,
        "points": 1,
        "answers": [
          "A"
        ]
      },
      "4": {
        "part": 1,
        "points": 1,
        "answers": [
          "A"
        ]
      },
      "5": {
        "part": 1,
        "points": 1,
        "answers": [
          "B"
        ]
      },
      "6": {
        "part": 1,
        "points": 1,
        "answers": [
          "B"
        ]
      },
      "7": {
        "part": 2,
        "points": 1,
        "answers": [
          "A"
        ]
      },
      "8": {
        "part": 2,
        "points": 1,
        "answers": [
          "B"
        ]
      },
      "9": {
        "part": 2,
        "points": 1,
        "answers": [
          "A"
        ]
      },
      "10": {
        "part": 2,
        "points": 1,
        "answers": [
          "C"
        ]
      },
      "11": {
        "part": 2,
        "points": 1,
        "answers": [
          "B"
        ]
      },
      "12": {
        "part": 2,
        "points": 1,
        "answers": [
          "C"
        ]
      },
      "13": {
        "part": 2,
        "points": 1,
        "answers": [
          "A"
        ]
      },
      "14": {
        "part": 3,
        "points": 1,
        "answers": [
          "C"
        ]
      },
      "15": {
        "part": 3,
        "points": 1,
        "answers": [
          "A"
        ]
      },
      "16": {
        "part": 3,
        "points": 1,
        "answers": [
          "B"
        ]
      },
      "17": {
        "part": 3,
        "points": 1,
        "answers": [
          "B"
        ]
      },
      "18": {
        "part": 3,
        "points": 1,
        "answers": [
          "A"
        ]
      },
      "19": {
        "part": 4,
        "points": 1,
        "answers": [
          "A"
        ]
      },
      "20": {
        "part": 4,
        "points": 1,
        "answers": [
          "B"
        ]
      },
      "21": {
        "part": 4,
        "points": 1,
        "answers": [
          "A"
        ]
      },
      "22": {
        "part": 4,
        "points": 1,
        "answers": [
          "C"
        ]
      },
      "23": {
        "part": 4,
        "points": 1,
        "answers": [
          "B"
        ]
      },
      "24": {
        "part": 4,
        "points": 1,
        "answers": [
          "A"
        ]
      },
      "25": {
        "part": 5,
        "points": 1,
        "answers": [
          "between"
        ]
      },
      "26": {
        "part": 5,
        "points": 1,
        "answers": [
          "is"
        ]
      },
      "27": {
        "part": 5,
        "points": 1,
        "answers": [
          "to"
        ]
      },
      "28": {
        "part": 5,
        "points": 1,
        "answers": [
          "which",
          "that"
        ]
      },
      "29": {
        "part": 5,
        "points": 1,
        "answers": [
          "their",
          "the"
        ]
      },
      "30": {
        "part": 5,
        "points": 1,
        "answers": [
          "your"
        ]
      },
      "31": {
        "part": 6,
        "points": 15,
        "mode": "components",
        "minWords": 25,
        "components": [
          {
            "points": 5,
            "any": [
              "arrive",
              "get there",
              "come",
              "will be there",
              "on saturday",
              "on sunday",
              "next weekend"
            ]
          },
          {
            "points": 5,
            "any": [
              "weather",
              "rain",
              "rainy",
              "sunny",
              "hot",
              "cold",
              "warm"
            ]
          },
          {
            "points": 5,
            "any": [
              "go to",
              "visit",
              "watch",
              "play",
              "eat",
              "restaurant",
              "park",
              "museum",
              "cinema",
              "together"
            ]
          }
        ],
        "answers": []
      },
      "32": {
        "part": 7,
        "points": 15,
        "mode": "components",
        "minWords": 35,
        "components": [
          {
            "points": 5,
            "any": [
              "rain",
              "rainy",
              "bus stop",
              "bus was late",
              "waiting",
              "umbrella"
            ]
          },
          {
            "points": 5,
            "any": [
              "classmate",
              "friend",
              "met",
              "shared",
              "umbrella",
              "together"
            ]
          },
          {
            "points": 5,
            "any": [
              "school",
              "arrived",
              "arrive",
              "laughed",
              "laugh",
              "morning",
              "lesson",
              "class"
            ]
          }
        ],
        "answers": []
      }
    }
  },
  "brighton-b2-rue-final": {
    examId: "brighton-b2-rue-final",
    examTitle:
      "Brighton B2 Reading and Use of English Final Exam",

    maxScore: 70,
    totalQuestions: 52,

    normalization: {
      caseInsensitive: true,
      trimWhitespace: true,
      collapseInternalWhitespace: true,
      expandCommonContractionsForPart4: true
    },

    parts: {
      "1": {
        label: "Part 1",
        questions: [1,2,3,4,5,6,7,8],
        maxScore: 8
      },

      "2": {
        label: "Part 2",
        questions: [9,10,11,12,13,14,15,16],
        maxScore: 8
      },

      "3": {
        label: "Part 3",
        questions: [17,18,19,20,21,22,23,24],
        maxScore: 8
      },

      "4": {
        label: "Part 4",
        questions: [25,26,27,28,29,30],
        maxScore: 12
      },

      "5": {
        label: "Part 5",
        questions: [31,32,33,34,35,36],
        maxScore: 12
      },

      "6": {
        label: "Part 6",
        questions: [37,38,39,40,41,42],
        maxScore: 12
      },

      "7": {
        label: "Part 7",
        questions: [43,44,45,46,47,48,49,50,51,52],
        maxScore: 10
      }
    },

    answers: {
      "1":  { part: 1, points: 1, answers: ["A"] },
      "2":  { part: 1, points: 1, answers: ["A"] },
      "3":  { part: 1, points: 1, answers: ["A"] },
      "4":  { part: 1, points: 1, answers: ["A"] },
      "5":  { part: 1, points: 1, answers: ["A"] },
      "6":  { part: 1, points: 1, answers: ["A"] },
      "7":  { part: 1, points: 1, answers: ["A"] },
      "8":  { part: 1, points: 1, answers: ["A"] },

      "9":  { part: 2, points: 1, answers: ["how"] },
      "10": { part: 2, points: 1, answers: ["where"] },
      "11": { part: 2, points: 1, answers: ["without"] },
      "12": { part: 2, points: 1, answers: ["but"] },
      "13": { part: 2, points: 1, answers: ["than"] },
      "14": { part: 2, points: 1, answers: ["which"] },
      "15": { part: 2, points: 1, answers: ["now", "already"] },
      "16": { part: 2, points: 1, answers: ["with", "by"] },

      "17": { part: 3, points: 1, answers: ["reliable"] },
      "18": { part: 3, points: 1, answers: ["exposure"] },
      "19": { part: 3, points: 1, answers: ["gradual"] },
      "20": { part: 3, points: 1, answers: ["curiosity"] },
      "21": {
        part: 3,
        points: 1,
        answers: ["memorising", "memorizing"]
      },
      "22": { part: 3, points: 1, answers: ["harmless"] },
      "23": {
        part: 3,
        points: 1,
        answers: ["responsibility"]
      },
      "24": {
        part: 3,
        points: 1,
        answers: ["purposefully"]
      },

      "25": {
        part: 4,
        points: 2,
        mode: "components",
        minWords: 2,
        maxWords: 5,
        answers: ["nervous as"],
        components: [
          {
            points: 1,
            any: ["nervous"]
          },
          {
            points: 1,
            any: ["as"]
          }
        ]
      },

      "26": {
        part: 4,
        points: 2,
        mode: "components",
        minWords: 2,
        maxWords: 5,
        answers: ["had been reading"],
        components: [
          {
            points: 1,
            any: ["had been"]
          },
          {
            points: 1,
            any: ["reading"]
          }
        ]
      },

      "27": {
        part: 4,
        points: 2,
        mode: "components",
        minWords: 2,
        maxWords: 5,
        answers: [
          "are not supposed to enter",
          "aren't supposed to enter",
          "are not supposed to go into",
          "aren't supposed to go into",
          "are not supposed to be in",
          "aren't supposed to be in"
        ],
        components: [
          {
            points: 1,
            any: [
              "are not supposed",
              "aren't supposed"
            ]
          },
          {
            points: 1,
            any: [
              "to enter",
              "to go into",
              "to be in"
            ]
          }
        ]
      },

      "28": {
        part: 4,
        points: 2,
        mode: "components",
        minWords: 2,
        maxWords: 5,
        answers: [
          "will have learned",
          "will have learnt"
        ],
        components: [
          {
            points: 1,
            any: ["will have"]
          },
          {
            points: 1,
            any: ["learned", "learnt"]
          }
        ]
      },

      "29": {
        part: 4,
        points: 2,
        mode: "components",
        minWords: 2,
        maxWords: 5,
        answers: [
          "get used to getting",
          "get used to receiving",
          "get used to accepting",
          "become used to getting",
          "become used to receiving",
          "become used to accepting"
        ],
        components: [
          {
            points: 1,
            any: [
              "get used to",
              "become used to"
            ]
          },
          {
            points: 1,
            any: [
              "getting",
              "receiving",
              "accepting"
            ]
          }
        ]
      },

      "30": {
        part: 4,
        points: 2,
        mode: "components",
        minWords: 2,
        maxWords: 5,
        answers: [
          "despite being",
          "despite it being",
          "despite its being",
          "despite the fact it was",
          "despite the fact that it was"
        ],
        components: [
          {
            points: 1,
            any: ["despite"]
          },
          {
            points: 1,
            any: ["being", "it was"]
          }
        ]
      },

      "31": { part: 5, points: 2, answers: ["B"] },
      "32": { part: 5, points: 2, answers: ["A"] },
      "33": { part: 5, points: 2, answers: ["C"] },
      "34": { part: 5, points: 2, answers: ["C"] },
      "35": { part: 5, points: 2, answers: ["B"] },
      "36": { part: 5, points: 2, answers: ["C"] },

      "37": { part: 6, points: 2, answers: ["G"] },
      "38": { part: 6, points: 2, answers: ["B"] },
      "39": { part: 6, points: 2, answers: ["A"] },
      "40": { part: 6, points: 2, answers: ["F"] },
      "41": { part: 6, points: 2, answers: ["E"] },
      "42": { part: 6, points: 2, answers: ["C"] },

      "43": { part: 7, points: 1, answers: ["A"] },
      "44": { part: 7, points: 1, answers: ["C"] },
      "45": { part: 7, points: 1, answers: ["B"] },
      "46": { part: 7, points: 1, answers: ["D"] },
      "47": { part: 7, points: 1, answers: ["A"] },
      "48": { part: 7, points: 1, answers: ["B"] },
      "49": { part: 7, points: 1, answers: ["C"] },
      "50": { part: 7, points: 1, answers: ["D"] },
      "51": { part: 7, points: 1, answers: ["C"] },
      "52": { part: 7, points: 1, answers: ["A"] }
    }
  }
};

/** @type {Array<[RegExp, string]>} */
const COMMON_CONTRACTIONS = [

  [/\baren't\b/gi, "are not"],
  [/\bisn't\b/gi, "is not"],
  [/\bwasn't\b/gi, "was not"],
  [/\bweren't\b/gi, "were not"],

  [/\bdon't\b/gi, "do not"],
  [/\bdoesn't\b/gi, "does not"],
  [/\bdidn't\b/gi, "did not"],

  [/\bcan't\b/gi, "cannot"],
  [/\bcouldn't\b/gi, "could not"],
  [/\bwon't\b/gi, "will not"],
  [/\bwouldn't\b/gi, "would not"],

  [/\bshouldn't\b/gi, "should not"],
  [/\bmustn't\b/gi, "must not"],

  [/\bhasn't\b/gi, "has not"],
  [/\bhaven't\b/gi, "have not"],
  [/\bhadn't\b/gi, "had not"],

  [/\bit's\b/gi, "it is"],
  [/\bi'm\b/gi, "i am"],
  [/\bthey're\b/gi, "they are"],
  [/\bwe're\b/gi, "we are"],
  [/\byou're\b/gi, "you are"]

];

async function loadAnswerKey(
  examId,
  answerKeyVersion = ""
) {

  const canonicalId =
    canonicalExamId(
      examId
    );

  const requestedVersion =
    normalizeAnswerKeyVersion(
      answerKeyVersion
    );


  /*
    Wix stores only the CURRENT exam key.

    If a future historical submission belongs to an
    older release, do not silently regrade it with the
    current Wix key. The Brighton results frontend can
    resolve the immutable GitHub snapshot instead.
  */
  if (
    requestedVersion &&
    requestedVersion !==
      ANSWER_KEY_VERSION
  ) {

    throw new Error(
      `Submission belongs to historical answer-key release ` +
      `"${requestedVersion}". Wix is currently using ` +
      `"${ANSWER_KEY_VERSION}" and will not regrade the ` +
      `historical submission with the current key.`
    );

  }


  try {

    const result =
      await wixData
        .query(
          COLLECTIONS.exams
        )
        .eq(
          "examId",
          canonicalId
        )
        .limit(1)
        .find(DATA_OPTIONS);


    const exam =
      result.items[0];


    if (
      exam?.answerKeyJson
    ) {

      return JSON.parse(
        exam.answerKeyJson
      );

    }

  } catch {
    /*
      Continue to fallback below.
    */
  }


  if (
    FALLBACK_ANSWER_KEYS[
      canonicalId
    ]
  ) {

    return (
      FALLBACK_ANSWER_KEYS[
        canonicalId
      ]
    );

  }


  throw new Error(
    `No answer key found for examId: ${canonicalId}`
  );

}

function normalizeAnswer(
  value,
  options = {}
) {
  let text = String(value ?? "")
    .normalize("NFKC")
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    .trim();

  if (options.expandContractions) {
    for (const [pattern, replacement] of COMMON_CONTRACTIONS) {
      text = text.replace(pattern, replacement);
    }
  }

  return text
    .replace(/[.!?;,:[\]{}()]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toUpperCase();
}

function countAnswerWords(
  value
) {

  const normalized =
    normalizeAnswer(
      value,
      {
        expandContractions:
          true
      }
    );


  return normalized
    ? normalized
        .split(/\s+/)
        .filter(Boolean)
        .length
    : 0;

}

function flattenAnswers(
  payload
) {

  if (
    Array.isArray(
      payload?.answerList
    )
  ) {

    return (
      payload.answerList
    );

  }


  const answers =
    payload?.answers ||
    {};


  const flat = [];


  Object
    .entries(answers)
    .forEach(
      ([
        partId,
        partAnswers
      ]) => {

        const part =
          Number(
            String(
              partId
            )
              .replace(
                /\D+/g,
                ""
              )
          ) ||
          null;


        Object
          .entries(
            partAnswers ||
            {}
          )
          .forEach(
            ([
              question,
              answer
            ]) => {

              flat.push({

                part,

                partId,

                question:
                  Number(
                    question
                  ),

                answer

              });

            }
          );

      }
    );


  return flat.sort(
    (a, b) =>
      Number(a.question) -
      Number(b.question)
  );

}

function gradeSubmission(
  payload,
  answerKey
) {

  const answerList =
    flattenAnswers(
      payload
    );


  const byQuestion =
    new Map(
      answerList.map(
        item => [
          String(
            item.question
          ),
          item.answer
        ]
      )
    );


  const details = [];
  const partScores = {};


  Object
    .entries(
      answerKey.parts ||
      {}
    )
    .forEach(
      ([
        partNumber,
        part
      ]) => {

        partScores[
          `part${partNumber}`
        ] = {

          label:
            part.label ||
            `Part ${partNumber}`,

          score: 0,

          maxScore:
            Number(
              part.maxScore ||
              0
            ),

          correct: 0,

          total:
            (
              part.questions ||
              []
            ).length

        };

      }
    );


  let score = 0;


  const maxScore =
    Number(
      answerKey.maxScore ||
      0
    );


  Object
    .entries(
      answerKey.answers ||
      {}
    )
    .forEach(
      ([
        question,
        rule
      ]) => {

        const raw =
          byQuestion.get(
            String(
              question
            )
          ) ??
          "";


        const earned =
          gradeOne(
            raw,
            rule
          );


        const partNumber =
          String(
            rule.part ||
            ""
          );


        const partKey =
          `part${partNumber}`;


        score += earned;


        if (
          !partScores[
            partKey
          ]
        ) {

          partScores[
            partKey
          ] = {

            label:
              `Part ${partNumber}`,

            score: 0,
            maxScore: 0,
            correct: 0,
            total: 0

          };

        }


        partScores[
          partKey
        ].score +=
          earned;


        if (
          earned >=
          Number(
            rule.points ||
            1
          )
        ) {

          partScores[
            partKey
          ].correct +=
            1;

        }


        details.push({

          question:
            Number(
              question
            ),

          part:
            Number(
              rule.part ||
              0
            ),

          answer:
            raw,

          normalizedAnswer:
            normalizeAnswer(
              raw,
              {
                expandContractions:
                  rule.mode ===
                  "components"
              }
            ),

          earned,

          max:
            Number(
              rule.points ||
              1
            ),

          correct:
            earned >=
            Number(
              rule.points ||
              1
            )

        });

      }
    );


  return {

    score,

    maxScore,

    percentage:
      maxScore
        ? Math.round(
            (
              score /
              maxScore
            ) *
            100
          )
        : 0,

    partScores,

    details

  };

}

function gradeOne(
  raw,
  rule
) {

  const max =
    Number(
      rule.points ||
      1
    );


  const normalized =
    normalizeAnswer(
      raw,
      {
        expandContractions:
          rule.mode ===
          "components"
      }
    );


  if (!normalized) {
    return 0;
  }


  if (
    rule.mode ===
    "components"
  ) {

    const words =
      countAnswerWords(
        raw
      );


    if (
      (
        rule.minWords &&
        words <
          rule.minWords
      ) ||
      (
        rule.maxWords &&
        words >
          rule.maxWords
      )
    ) {

      return 0;

    }


    const accepted =
      (
        rule.answers ||
        []
      )
        .map(
          answer =>
            normalizeAnswer(
              answer,
              {
                expandContractions:
                  true
              }
            )
        );


    if (
      accepted.includes(
        normalized
      )
    ) {

      return max;

    }


    let earned = 0;


    for (
      const component
      of (
        rule.components ||
        []
      )
    ) {

      const hit =
        (
          component.any ||
          []
        )
          .some(
            variant =>
              containsPhrase(
                normalized,
                normalizeAnswer(
                  variant,
                  {
                    expandContractions:
                      true
                  }
                )
              )
          );


      if (hit) {

        earned +=
          Number(
            component.points ||
            1
          );

      }

    }


    return Math.max(
      0,
      Math.min(
        max,
        earned
      )
    );

  }


  const accepted =
    (
      rule.answers ||
      []
    )
      .map(
        answer =>
          normalizeAnswer(
            answer
          )
      );


  return accepted.includes(
    normalized
  )
    ? max
    : 0;

}

function containsPhrase(
  normalizedText,
  normalizedPhrase
) {

  if (
    !normalizedText ||
    !normalizedPhrase
  ) {

    return false;

  }


  return (
    ` ${normalizedText} `
      .includes(
        ` ${normalizedPhrase} `
      )
  );

}

function validateExamPayload(
  payload
) {

  if (
    !payload ||
    typeof payload !==
      "object"
  ) {

    return "Missing payload.";

  }


  if (
    !cleanText(
      payload.examId
    )
  ) {

    return "Missing examId.";

  }


  if (
    !cleanText(
      payload.studentName
    )
  ) {

    return "Missing studentName.";

  }


  if (
    !normalizeClassCode(
      payload.classId
    )
  ) {

    return "Missing classId.";

  }


  if (
    !payload.answers &&
    !Array.isArray(
      payload.answerList
    )
  ) {

    return "Missing answers.";

  }


  return "";

}

function validateProgress(
  payload
) {

  if (
    !payload ||
    typeof payload !==
      "object"
  ) {

    return "Missing payload.";

  }


  if (
    !cleanText(
      payload.progressId
    )
  ) {

    return "Missing progressId.";

  }


  if (
    !cleanText(
      payload.examId
    )
  ) {

    return "Missing examId.";

  }


  if (
    !cleanText(
      payload.studentName
    )
  ) {

    return "Missing studentName.";

  }


  if (
    !normalizeClassCode(
      payload.classId
    )
  ) {

    return "Missing classId.";

  }


  return "";

}

function publicExamFields(
  exam
) {

  return {

    examId:
      exam.examId,

    title:
      exam.title,

    level:
      exam.level,

    skill:
      exam.skill,

    description:
      exam.description,

    shareUrl:
      exam.shareUrl,

    iframeUrl:
      exam.iframeUrl,

    isActive:
      exam.isActive,

    totalQuestions:
      exam.totalQuestions,

    maxScore:
      exam.maxScore

  };

}

function publicSubmissionFields(
  item
) {

  return {

    submissionId:
      item.submissionId,

    examId:
      item.examId,

    examTitle:
      item.examTitle,

    studentName:
      item.studentName,

    classId:
      item.classId,

    answerKeyVersion:
      item.answerKeyVersion,

    testVersion:
      item.testVersion,

    answersJson:
      item.answersJson,

    answerListJson:
      item.answerListJson,

    flaggedJson:
      item.flaggedJson,

    notes:
      item.notes,

    score:
      item.score,

    maxScore:
      item.maxScore,

    percentage:
      item.percentage,

    partScoresJson:
      item.partScoresJson,

    gradingDetailsJson:
      item.gradingDetailsJson,

    startedAt:
      item.startedAt,

    submittedAt:
      item.submittedAt,

    submittedAtLocal:
      item.submittedAtLocal,

    timeSpentSeconds:
      item.timeSpentSeconds,

    rawPayloadJson:
      item.rawPayloadJson,

    status:
      item.status,

    gradingError:
      item.gradingError

  };

}

function publicProgressFields(
  item
) {

  return {

    progressId:
      item.progressId,

    examId:
      item.examId,

    examTitle:
      item.examTitle,

    level:
      item.level,

    skill:
      item.skill,

    studentName:
      item.studentName,

    classId:
      item.classId,

    answerKeyVersion:
      item.answerKeyVersion,

    testVersion:
      item.testVersion,

    status:
      item.status,

    startedAt:
      item.startedAt,

    lastSeenAt:
      item.lastSeenAt,

    submittedAt:
      item.submittedAt,

    submissionId:
      item.submissionId,

    currentPart:
      item.currentPart,

    currentQuestion:
      item.currentQuestion,

    answeredCount:
      item.answeredCount,

    totalQuestions:
      item.totalQuestions,

    progressPercent:
      item.progressPercent,

    timeSpentSeconds:
      item.timeSpentSeconds,

    rawProgressJson:
      item.rawProgressJson

  };

}

async function clearSubmittedProgressRows(
  classId,
  examId = ""
) {

  let query =
    wixData
      .query(
        COLLECTIONS.examProgress
      )
      .eq(
        "classId",
        classId
      );


  if (examId) {

    query =
      query.eq(
        "examId",
        examId
      );

  }


  const result =
    await query
      .limit(1000)
      .find(DATA_OPTIONS);


  const submitted =
    result.items.filter(
      shouldClearProgressItem
    );


  for (
    const item
    of submitted
  ) {

    if (item._id) {

      await wixData.remove(
        COLLECTIONS.examProgress,
        item._id,
        DATA_OPTIONS
      );

    }

  }


  return submitted.length;

}

function shouldClearProgressItem(
  item
) {

  const status =
    cleanText(
      item.status
    )
      .toLowerCase();


  return (
    status === "submitted" ||
    Boolean(
      cleanText(
        item.submissionId
      )
    ) ||
    Boolean(
      validDate(
        item.submittedAt
      )
    )
  );

}

function isVisibleProgressItem(
  item
) {

  const status =
    cleanText(
      item.status
    )
      .toLowerCase();


  const last =
    validDate(
      item.lastSeenAt ||
      item.submittedAt ||
      item._updatedDate ||
      item._createdDate
    );


  if (!last) {
    return false;
  }


  const ageMs =
    Date.now() -
    last.getTime();


  const submittedMs =
    SUBMITTED_PROGRESS_MINUTES *
    60 *
    1000;


  const activeMs =
    ACTIVE_PROGRESS_HOURS *
    60 *
    60 *
    1000;


  if (
    status === "submitted"
  ) {

    return (
      ageMs <=
      submittedMs
    );

  }


  return (
    ageMs <=
    activeMs
  );

}

export async function getExams() {

  try {

    const result =
      await wixData
        .query(COLLECTIONS.exams)
        .eq("isActive", true)
        .limit(100)
        .find(DATA_OPTIONS);


    const exams =
      result.items.map(
        publicExamFields
      );


    return jsonOK({
      success: true,
      exams
    });


  } catch (error) {

    /*
      Preserve your existing fallback concept.
    */

    if (FALLBACK_EXAMS.length) {

      return jsonOK({
        success: true,
        exams: FALLBACK_EXAMS,
        fallback: true
      });

    }


    return jsonServerError(error);

  }

}

export async function submitExam(
  request
) {

  let payload;


  try {

    payload =
      await request.body.json();

  } catch {

    return jsonBadRequest(
      "Invalid JSON body."
    );

  }


  /*
    The browser may report a version, but Wix is
    authoritative. Store the browser value only as
    diagnostic metadata inside rawPayloadJson.
  */
  payload =
    stampServerVersion(
      payload
    );


  payload.classId =
    normalizeClassCode(
      payload.classId
    );

  payload.examId =
    canonicalExamId(
      payload.examId
    );


  const validationError =
    validateExamPayload(
      payload
    );


  if (validationError) {

    return jsonBadRequest(
      validationError
    );

  }


  let grading;
  let status =
    "submitted";

  let gradingError =
    "";


  try {

    const answerKey =
      await loadAnswerKey(
        payload.examId,
        payload.answerKeyVersion
      );


    grading =
      gradeSubmission(
        payload,
        answerKey
      );


  } catch (error) {

    status =
      "submitted_ungraded";

    gradingError =
      String(
        error.message ||
        error
      );


    grading = {
      score: null,
      maxScore: null,
      percentage: null,
      partScores: {},
      details: []
    };

  }


  const submittedAt =
    validDate(
      payload.submittedAt
    ) ||
    new Date();


  const item = {

    submissionId:
      makeSubmissionId(
        payload
      ),

    examId:
      cleanText(
        payload.examId
      ),

    examTitle:
      cleanText(
        payload.examTitle ||
        payload.examId
      ),

    studentName:
      cleanText(
        payload.studentName
      ),

    classId:
      normalizeClassCode(
        payload.classId
      ),

    answerKeyVersion:
      ANSWER_KEY_VERSION,

    testVersion:
      ANSWER_KEY_VERSION,

    answersJson:
      safeStringify(
        payload.answers || {}
      ),

    answerListJson:
      safeStringify(
        payload.answerList ||
        flattenAnswers(payload)
      ),

    flaggedJson:
      safeStringify(
        payload.flagged || []
      ),

    notes:
      String(
        payload.notes || ""
      ),

    score:
      grading.score,

    maxScore:
      grading.maxScore,

    percentage:
      grading.percentage,

    partScoresJson:
      safeStringify(
        grading.partScores || {}
      ),

    gradingDetailsJson:
      safeStringify(
        grading.details || []
      ),

    startedAt:
      validDate(
        payload.startedAt
      ),

    submittedAt,

    submittedAtLocal:
      formatLocal(
        submittedAt
      ),

    timeSpentSeconds:
      finiteNumberOrNull(
        payload.timeSpentSeconds
      ),

    rawPayloadJson:
      safeStringify(
        payload
      ),

    status,

    gradingError

  };


  try {

    const saved =
      await wixData.insert(
        COLLECTIONS.examSubmissions,
        item,
        DATA_OPTIONS
      );


    return jsonOK({

      success: true,

      submissionId:
        saved.submissionId,

      score:
        item.score,

      maxScore:
        item.maxScore,

      percentage:
        item.percentage,

      partScores:
        grading.partScores,

      status,

      answerKeyVersion:
        ANSWER_KEY_VERSION,

      testVersion:
        ANSWER_KEY_VERSION

    });


  } catch (error) {

    return jsonServerError(
      `Could not save submission: ${
        error.message ||
        error
      }`
    );

  }

}

export async function getResults(
  request
) {

  const classId =
    normalizeClassCode(
      request.query?.classId
    );


  const examId =
    canonicalExamId(
      request.query?.examId
    );


  if (!classId) {

    return jsonBadRequest(
      "classId is required."
    );

  }


  try {

    let query =
      wixData
        .query(
          COLLECTIONS.examSubmissions
        )
        .eq(
          "classId",
          classId
        );


    if (examId) {

      query =
        query.eq(
          "examId",
          examId
        );

    }


    const result =
      await query
        .descending(
          "submittedAt"
        )
        .limit(1000)
        .find(DATA_OPTIONS);


    const items = [];


    for (
      const original
      of result.items
    ) {

      let item = {
        ...original
      };


      const needsGrading =
        item.score === null ||
        item.score === undefined ||
        item.status ===
          "submitted_ungraded";


      if (
        needsGrading &&
        item.rawPayloadJson
      ) {

        try {

          const payload =
            JSON.parse(
              item.rawPayloadJson
            );


          /*
            Only top-level Wix CMS fields are
            authoritative for historical grading.
            Do not recover authority from
            rawPayloadJson.
          */
          const storedVersion =
            getStoredAnswerKeyVersion(
              item
            );


          const answerKey =
            await loadAnswerKey(
              item.examId ||
              payload.examId,
              storedVersion
            );


          const grading =
            gradeSubmission(
              payload,
              answerKey
            );


          item = {

            ...item,

            score:
              grading.score,

            maxScore:
              grading.maxScore,

            percentage:
              grading.percentage,

            partScoresJson:
              safeStringify(
                grading.partScores
              ),

            gradingDetailsJson:
              safeStringify(
                grading.details
              ),

            status:
              "graded_on_read",

            gradingError:
              ""

          };


          await wixData.update(
            COLLECTIONS.examSubmissions,
            item,
            DATA_OPTIONS
          );


        } catch (error) {

          item.gradingError =
            String(
              error.message ||
              error
            );

        }

      }


      items.push(
        publicSubmissionFields(
          item
        )
      );

    }


    const percentages =
      items
        .map(
          item =>
            Number(
              item.percentage
            )
        )
        .filter(
          Number.isFinite
        );


    const summary = {

      total:
        items.length,

      average:
        percentages.length
          ? Math.round(
              percentages.reduce(
                (sum, number) =>
                  sum + number,
                0
              ) /
              percentages.length
            )
          : null,

      highest:
        percentages.length
          ? Math.max(
              ...percentages
            )
          : null,

      lowest:
        percentages.length
          ? Math.min(
              ...percentages
            )
          : null

    };


    return jsonOK({
      success: true,
      items,
      summary
    });


  } catch (error) {

    return jsonServerError(
      error
    );

  }

}

export async function updateProgress(
  request
) {

  let payload;


  try {

    payload =
      await request.body.json();

  } catch {

    return jsonBadRequest(
      "Invalid JSON body."
    );

  }


  payload.classId =
    normalizeClassCode(
      payload.classId
    );

  payload.examId =
    canonicalExamId(
      payload.examId
    );


  const validationError =
    validateProgress(
      payload
    );


  if (validationError) {

    return jsonBadRequest(
      validationError
    );

  }


  const progressId =
    cleanText(
      payload.progressId
    );


  let existing;


  try {

    existing =
      await wixData
        .query(
          COLLECTIONS.examProgress
        )
        .eq(
          "progressId",
          progressId
        )
        .limit(1)
        .find(DATA_OPTIONS);

  } catch (error) {

    return jsonCollectionError(
      "examProgress",
      error
    );

  }


  const existingItem =
    existing.items[0] ||
    null;


  /*
    Preserve a version already assigned by Wix.
    If this is a new progress row, or a pre-migration
    active row that receives another heartbeat now,
    stamp the current server release.
  */
  const progressVersion =
    getStoredAnswerKeyVersion(
      existingItem
    ) ||
    ANSWER_KEY_VERSION;


  payload =
    stampServerVersion(
      payload,
      progressVersion
    );


  const now =
    validDate(
      payload.lastSeenAt
    ) ||
    new Date();


  const item = {

    title:
      progressId,

    progressId,

    examId:
      cleanText(
        payload.examId
      ),

    examTitle:
      cleanText(
        payload.examTitle ||
        payload.examId
      ),

    level:
      cleanText(
        payload.level
      ),

    skill:
      cleanText(
        payload.skill
      ),

    studentName:
      cleanText(
        payload.studentName
      ),

    classId:
      normalizeClassCode(
        payload.classId
      ),

    answerKeyVersion:
      progressVersion,

    testVersion:
      progressVersion,

    status:
      cleanText(
        payload.status ||
        "in_progress"
      ),

    startedAt:
      validDate(
        payload.startedAt
      ),

    lastSeenAt:
      now,

    submittedAt:
      validDate(
        payload.submittedAt
      ),

    submissionId:
      cleanText(
        payload.submissionId
      ),

    currentPart:
      cleanText(
        payload.currentPart
      ),

    currentQuestion:
      cleanText(
        payload.currentQuestion
      ),

    answeredCount:
      finiteNumberOrNull(
        payload.answeredCount
      ),

    totalQuestions:
      finiteNumberOrNull(
        payload.totalQuestions
      ),

    progressPercent:
      finiteNumberOrNull(
        payload.progressPercent
      ),

    timeSpentSeconds:
      finiteNumberOrNull(
        payload.timeSpentSeconds
      ),

    rawProgressJson:
      safeStringify(
        payload
      )

  };


  try {

    if (existingItem) {

      const saved =
        await wixData.update(
          COLLECTIONS.examProgress,
          {
            ...existingItem,
            ...item
          },
          DATA_OPTIONS
        );


      return jsonOK({

        success: true,

        progressId:
          saved.progressId,

        status:
          saved.status,

        lastSeenAt:
          saved.lastSeenAt,

        answerKeyVersion:
          progressVersion,

        testVersion:
          progressVersion

      });

    }


    const saved =
      await wixData.insert(
        COLLECTIONS.examProgress,
        item,
        DATA_OPTIONS
      );


    return jsonOK({

      success: true,

      progressId:
        saved.progressId,

      status:
        saved.status,

      lastSeenAt:
        saved.lastSeenAt,

      answerKeyVersion:
        progressVersion,

      testVersion:
        progressVersion

    });


  } catch (error) {

    return jsonCollectionError(
      "examProgress",
      error
    );

  }

}

export async function getProgress(
  request
) {

  const classId =
    normalizeClassCode(
      request.query?.classId
    );


  const examId =
    canonicalExamId(
      request.query?.examId
    );


  if (!classId) {

    return jsonBadRequest(
      "classId is required."
    );

  }


  try {

    await clearSubmittedProgressRows(
      classId,
      examId
    );


    let query =
      wixData
        .query(
          COLLECTIONS.examProgress
        )
        .eq(
          "classId",
          classId
        );


    if (examId) {

      query =
        query.eq(
          "examId",
          examId
        );

    }


    const result =
      await query
        .descending(
          "lastSeenAt"
        )
        .limit(1000)
        .find(DATA_OPTIONS);


    const items =
      result.items
        .filter(
          isVisibleProgressItem
        )
        .map(
          publicProgressFields
        );


    return jsonOK({
      success: true,
      items
    });


  } catch (error) {

    return jsonCollectionError(
      "examProgress",
      error
    );

  }

}


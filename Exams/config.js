"use strict";
/* ==============================================
     Brighton English School
     Made by: David Santana
============================================== */

window.BRIGHTON_SITE_CONFIG = {
  API_BASE_URL: "https://chiispiitas.wixsite.com/brightonexams/_functions",

  SCHOOL_NAME: "Brighton English School",

  LIVE_PROGRESS_INTERVAL_MS: 30000,
  LIVE_PROGRESS_TOUCH_DELAY_MS: 8000,
  DASHBOARD_PROGRESS_REFRESH_MS: 20000,
  PROGRESS_STALE_SECONDS: 90,

  FALLBACK_TESTS: [
    {
      testId: "brighton-a1-units-1-2",
      title: "A1 Units 1–2 Test",
      level: "A1",
      unitRange: "1-2",
      isActive: true,
      totalQuestions: 40,
      maxScore: 40,
      relativeUrl: "tests/a1-units-1-2/index.html"
    },
    {
      testId: "brighton-a1-units-1-4",
      title: "A1 Units 1–4 Test",
      level: "A1",
      unitRange: "1-4",
      isActive: true,
      totalQuestions: 80,
      maxScore: 80,
      relativeUrl: "tests/a1-units-1-4/index.html"
    },
    {
      testId: "brighton-a1-units-5-6",
      title: "A1 Units 5–6 Test",
      level: "A1",
      unitRange: "5-6",
      isActive: true,
      totalQuestions: 40,
      maxScore: 40,
      relativeUrl: "tests/a1-units-5-6/index.html"
    },
    {
      testId: "brighton-a1-units-5-7",
      title: "A1 Units 5–7 Test",
      level: "A1",
      unitRange: "5-7",
      isActive: true,
      totalQuestions: 80,
      maxScore: 80,
      relativeUrl: "tests/a1-units-5-7/index.html"
    },
    {
      testId: "brighton-a1-units-9-10",
      title: "A1 Units 9–10 Test",
      level: "A1",
      unitRange: "9-10",
      isActive: true,
      totalQuestions: 40,
      maxScore: 40,
      relativeUrl: "tests/a1-units-9-10/index.html"
    },
    {
      testId: "brighton-a2-units-1-2",
      title: "A2 Units 1–2 Test",
      level: "A2",
      unitRange: "1-2",
      isActive: true,
      totalQuestions: 40,
      maxScore: 40,
      relativeUrl: "tests/a2-units-1-2/index.html"
    },
    {
      testId: "brighton-a2-units-1-4",
      title: "A2 Units 1–4 Test",
      level: "A2",
      unitRange: "1-4",
      isActive: true,
      totalQuestions: 80,
      maxScore: 80,
      relativeUrl: "tests/a2-units-1-4/index.html"
    },
    {
      testId: "brighton-a2-units-5-6",
      title: "A2 Units 5–6 Test",
      level: "A2",
      unitRange: "5-6",
      isActive: true,
      totalQuestions: 40,
      maxScore: 40,
      relativeUrl: "tests/a2-units-5-6/index.html"
    },
    {
      testId: "brighton-a2-units-9-10",
      title: "A2 Units 9–10 Test",
      level: "A2",
      unitRange: "9-10",
      isActive: true,
      totalQuestions: 40,
      maxScore: 40,
      relativeUrl: "tests/a2-units-9-10/index.html"
    }
  ],

  FALLBACK_EXAMS: [
    {
      examId: "brighton-b2-rue-final",
      title: "B2 Reading and Use of English Final Exam",
      level: "B2",
      skill: "Reading and Use of English",
      description: "Seven-part B2 First-style Reading and Use of English final exam.",
      isActive: true,
      totalQuestions: 52,
      maxScore: 70,
      relativeUrl: "exams/b2-rue/index.html"
    },
    {
      examId: "brighton-a2-rw-final",
      title: "Brighton A2 Reading and Writing Final Exam",
      level: "A2",
      skill: "Reading and Writing",
      description: "Seven-part A2 Key-style Reading and Writing final exam.",
      isActive: true,
      totalQuestions: 32,
      maxScore: 60,
      relativeUrl: "exams/a2-rw/index.html"
    },
    {
      examId: "brighton-a2-listening-final",
      title: "Brighton A2 Listening Final Exam",
      level: "A2",
      skill: "Listening",
      description: "Five-part A2 Key-style Listening final exam using one audio file.",
      isActive: true,
      totalQuestions: 25,
      maxScore: 25,
      relativeUrl: "exams/a2-listening/index.html"
    },
    {
      examId: "brighton-b2-listening-final",
      title: "B2 Listening Final Exam",
      level: "B2",
      skill: "Listening",
      description: "Four-part B2 First-style Listening final exam using one audio file.",
      isActive: true,
      totalQuestions: 30,
      maxScore: 30,
      relativeUrl: "exams/b2-listening/index.html"
    },
    {
      examId: "brighton-b1plus-listening-final",
      title: "Brighton B1+ Listening Final Exam",
      level: "B1+",
      skill: "Listening",
      description: "Four-part B1 Preliminary-style Listening final exam.",
      isActive: true,
      totalQuestions: 25,
      maxScore: 25,
      relativeUrl: "exams/b1plus-listening/index.html"
    },
    {
      examId: "brighton-b1plus-writing-final",
      title: "Brighton B1+ Writing Final Exam",
      level: "B1+",
      skill: "Writing",
      description: "Three-part Brighton Intermediate writing exam with picture descriptions, an email and a story.",
      isActive: true,
      totalQuestions: 4,
      maxScore: 30,
      relativeUrl: "exams/b1plus-writing/index.html"
    }
  ]
};

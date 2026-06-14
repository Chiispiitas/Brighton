"use strict";
/* ==============================================
     Brighton English School
     Made by: David Santana
============================================== */

window.BRIGHTON_SITE_CONFIG = {
  
  
  
  API_BASE_URL: "https://chiispiitas.wixsite.com/brightonexams/_functions",

  SCHOOL_NAME: "Brighton English School",

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
      examId: "brighton-b2-listening-final",
      title: "B2 Listening Final Exam",
      level: "B2",
      skill: "Listening",
      description: "Four-part B2 First-style Listening final exam using one audio file.",
      isActive: true,
      totalQuestions: 30,
      maxScore: 30,
      relativeUrl: "exams/b2-listening/index.html"
    }
  ]
};

window.BRIGHTON_SITE_CONFIG = {
  // Replace this with your published Wix site domain after you add http-functions.js.
  // Example: "https://www.brightonenglishschool.com/_functions"
  // Example Wix free domain: "https://username.wixsite.com/site-name/_functions"
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
    }
  ]
};

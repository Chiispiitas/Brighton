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
    { testId: "brighton-a1-units-1-2", title: "A1 Units 1–2 Test", level: "A1", unitRange: "1-2", isActive: true, totalQuestions: 40, maxScore: 40, relativeUrl: "tests/a1-units-1-2/index.html" },
    { testId: "brighton-a1-units-1-4", title: "A1 Units 1–4 Test", level: "A1", unitRange: "1-4", isActive: true, totalQuestions: 80, maxScore: 80, relativeUrl: "tests/a1-units-1-4/index.html" },
    { testId: "brighton-a1-units-5-6", title: "A1 Units 5–6 Test", level: "A1", unitRange: "5-6", isActive: true, totalQuestions: 40, maxScore: 40, relativeUrl: "tests/a1-units-5-6/index.html" },
    { testId: "brighton-a1-units-5-7", title: "A1 Units 5–7 Test", level: "A1", unitRange: "5-7", isActive: true, totalQuestions: 80, maxScore: 80, relativeUrl: "tests/a1-units-5-7/index.html" },
    { testId: "brighton-a1-units-9-10", title: "A1 Units 9–10 Test", level: "A1", unitRange: "9-10", isActive: true, totalQuestions: 40, maxScore: 40, relativeUrl: "tests/a1-units-9-10/index.html" },

    { testId: "brighton-a2-units-1-2", title: "A2 Units 1–2 Test", level: "A2", unitRange: "1-2", isActive: true, totalQuestions: 40, maxScore: 40, relativeUrl: "tests/a2-units-1-2/index.html" },
    { testId: "brighton-a2-units-1-4", title: "A2 Units 1–4 Test", level: "A2", unitRange: "1-4", isActive: true, totalQuestions: 80, maxScore: 80, relativeUrl: "tests/a2-units-1-4/index.html" },
    { testId: "brighton-a2-units-5-6", title: "A2 Units 5–6 Test", level: "A2", unitRange: "5-6", isActive: true, totalQuestions: 40, maxScore: 40, relativeUrl: "tests/a2-units-5-6/index.html" },
    { testId: "brighton-a2-units-5-8", title: "A2 Units 5–8 Test", level: "A2", unitRange: "5-8", isActive: true, totalQuestions: 80, maxScore: 80, relativeUrl: "tests/a2-units-5-8/index.html" },
    { testId: "brighton-a2-units-9-10", title: "A2 Units 9–10 Test", level: "A2", unitRange: "9-10", isActive: true, totalQuestions: 40, maxScore: 40, relativeUrl: "tests/a2-units-9-10/index.html" },
    { testId: "brighton-a2-units-9-12", title: "A2 Units 9–12 Test", level: "A2", unitRange: "9-12", isActive: true, totalQuestions: 80, maxScore: 80, relativeUrl: "tests/a2-units-9-12/index.html" },

    { testId: "brighton-b1-units-1-2", title: "B1 Units 1–2 Test", level: "B1", unitRange: "1-2", isActive: true, totalQuestions: 40, maxScore: 40, relativeUrl: "tests/b1-units-1-2/index.html" },
    { testId: "brighton-b1-units-1-4", title: "B1 Units 1–4 Test", level: "B1", unitRange: "1-4", isActive: true, totalQuestions: 80, maxScore: 80, relativeUrl: "tests/b1-units-1-4/index.html" },
    { testId: "brighton-b1-units-5-6", title: "B1 Units 5–6 Test", level: "B1", unitRange: "5-6", isActive: true, totalQuestions: 40, maxScore: 40, relativeUrl: "tests/b1-units-5-6/index.html" },
    { testId: "brighton-b1-units-5-8", title: "B1 Units 5–8 Test", level: "B1", unitRange: "5-8", isActive: true, totalQuestions: 80, maxScore: 80, relativeUrl: "tests/b1-units-5-8/index.html" },
    { testId: "brighton-b1-units-9-10", title: "B1 Units 9–10 Test", level: "B1", unitRange: "9-10", isActive: true, totalQuestions: 40, maxScore: 40, relativeUrl: "tests/b1-units-9-10/index.html" },
    { testId: "brighton-b1-units-9-12", title: "B1 Units 9–12 Test", level: "B1", unitRange: "9-12", isActive: true, totalQuestions: 80, maxScore: 80, relativeUrl: "tests/b1-units-9-12/index.html" },

    { testId: "brighton-b1plus-units-5-6", title: "B1+ Units 5–6 Test", level: "B1+", unitRange: "5-6", isActive: true, totalQuestions: 40, maxScore: 40, relativeUrl: "tests/b1plus-units-5-6/index.html" }
  ],

  FALLBACK_EXAMS: [
    { examId: "brighton-b2-rue-final", title: "B2 Reading and Use of English Final Exam", level: "B2", skill: "Reading and Use of English", description: "Seven-part B2 First-style Reading and Use of English final exam.", isActive: true, totalQuestions: 52, maxScore: 70, relativeUrl: "exams/b2-rue/index.html" },
    { examId: "brighton-a2-rw-final", title: "Brighton A2 Reading and Writing Final Exam", level: "A2", skill: "Reading and Writing", description: "Seven-part A2 Key-style Reading and Writing final exam.", isActive: true, totalQuestions: 32, maxScore: 60, relativeUrl: "exams/a2-rw/index.html" },
    { examId: "brighton-a2-listening-final", title: "Brighton A2 Listening Final Exam", level: "A2", skill: "Listening", description: "Five-part A2 Key-style Listening final exam using one audio file.", isActive: true, totalQuestions: 25, maxScore: 25, relativeUrl: "exams/a2-listening/index.html" },
    { examId: "brighton-b2-listening-final", title: "B2 Listening Final Exam", level: "B2", skill: "Listening", description: "Four-part B2 First-style Listening final exam using one audio file.", isActive: true, totalQuestions: 30, maxScore: 30, relativeUrl: "exams/b2-listening/index.html" },
    { examId: "brighton-b1plus-listening-final", title: "Brighton B1+ Listening Final Exam", level: "B1+", skill: "Listening", description: "Four-part B1 Preliminary-style Listening final exam.", isActive: true, totalQuestions: 25, maxScore: 25, relativeUrl: "exams/b1plus-listening/index.html" },
    { examId: "brighton-b1plus-writing-final", title: "Brighton B1+ Writing Final Exam", level: "B1+", skill: "Writing", description: "Three-part Brighton Intermediate writing exam with picture descriptions, an email and a story.", isActive: true, totalQuestions: 4, maxScore: 30, relativeUrl: "exams/b1plus-writing/index.html" }
  ]
};

/* ----------------------------------------------
   Student test review safety controls
   ---------------------------------------------- */
(() => {
  if (!/\/Exams\/tests\/[^/]+\/?(?:index\.html)?$/i.test(window.location.pathname)) return;
  const RETRY_SESSION_KEY = "brighton-test-retry-pending";

  function getTestData() { return window.BRIGHTON_TEST_DATA || null; }

  function removeTeacherLinks(root = document) {
    root.querySelectorAll?.('a[href="../../tests.html"], a[href="../../index.html"]').forEach((link) => {
      if (link.closest(".student-results, .finish-screen")) link.remove();
    });
  }

  function isSubmissionSaved(root) {
    if (root.querySelector?.(".result-save-status.saved")) return true;
    const badge = document.querySelector("#submitStatusBadge");
    return badge?.textContent?.trim().toLowerCase() === "saved";
  }

  function startFreshRetry() {
    const data = getTestData();
    if (!data?.testId) return;
    const name = document.querySelector("#headerStudent")?.textContent?.trim() || document.querySelector("#studentName")?.value?.trim() || "";
    const classId = document.querySelector("#headerClass")?.textContent?.trim() || document.querySelector("#classId")?.value?.trim() || "";
    try {
      sessionStorage.setItem(RETRY_SESSION_KEY, JSON.stringify({ testId: data.testId, path: window.location.pathname, name, classId }));
      localStorage.removeItem(`brighton-test-state-${data.testId}-v1`);
    } catch (error) { console.warn("Could not prepare test retry", error); }
    window.location.reload();
  }

  function installRetryButton(root) {
    const data = getTestData();
    if (!data?.testId || !isSubmissionSaved(root)) return;
    const actions = root.querySelector?.(".results-actions, .finish-actions");
    if (!actions || actions.querySelector("#retryTestBtn")) return;
    const button = document.createElement("button");
    button.id = "retryTestBtn";
    button.type = "button";
    button.className = "primary-btn";
    button.textContent = "Retry test";
    button.addEventListener("click", startFreshRetry);
    actions.appendChild(button);
  }

  function applyStudentReviewControls() {
    document.querySelectorAll(".student-results, .finish-screen").forEach((root) => {
      removeTeacherLinks(root);
      installRetryButton(root);
    });
  }

  function resumeFreshRetry() {
    let pending = null;
    try { pending = JSON.parse(sessionStorage.getItem(RETRY_SESSION_KEY) || "null"); } catch (error) { pending = null; }
    const data = getTestData();
    if (!pending || !data?.testId || pending.testId !== data.testId || pending.path !== window.location.pathname) return;
    try { sessionStorage.removeItem(RETRY_SESSION_KEY); } catch (error) {}
    const nameInput = document.querySelector("#studentName");
    const classInput = document.querySelector("#classId");
    const form = document.querySelector("#studentForm");
    if (!nameInput || !classInput || !form) return;
    nameInput.value = pending.name || "";
    classInput.value = pending.classId || "";
    if (nameInput.value.trim() && classInput.value.trim()) {
      if (typeof form.requestSubmit === "function") form.requestSubmit();
      else form.querySelector('button[type="submit"]')?.click();
    }
  }

  const observer = new MutationObserver(applyStudentReviewControls);
  const observeTarget = document.querySelector("#mainContent") || document.body;
  observer.observe(observeTarget, { childList: true, subtree: true });
  window.setTimeout(() => { applyStudentReviewControls(); resumeFreshRetry(); }, 0);
})();

/* ----------------------------------------------
   Canonical True / False / Not enough information order
   A = True, B = False, C = Not enough information.

   Some legacy tests stored these three semantic choices in a shuffled
   A/B/C order. We keep the underlying data-answer-value untouched so
   their existing grading keys remain compatible, but present them to
   students in the canonical visual order. Each rendered question is
   canonicalized only once to avoid a MutationObserver render loop.
   ---------------------------------------------- */
(() => {
  if (!/\/Exams\/tests\/[^/]+\/?(?:index\.html)?$/i.test(window.location.pathname)) return;

  const CANONICAL = [
    { key: "true", letter: "A", text: "True" },
    { key: "false", letter: "B", text: "False" },
    { key: "not enough information", letter: "C", text: "Not enough information" }
  ];
  const normalize = (value) => String(value || "").trim().toLowerCase().replace(/\s+/g, " ");

  function choiceText(button) {
    const spans = button.querySelectorAll("span");
    return normalize(spans.length > 1 ? spans[spans.length - 1].textContent : button.textContent);
  }

  function canonicalizeQuestion(card) {
    if (card.dataset.tfnCanonicalized === "true") return;

    const grid = card.querySelector(".choice-grid");
    if (!grid) return;

    const buttons = Array.from(grid.querySelectorAll(".choice-button"));
    if (buttons.length !== 3) return;

    const byText = new Map(buttons.map((button) => [choiceText(button), button]));
    if (!CANONICAL.every((item) => byText.has(item.key))) return;

    CANONICAL.forEach((item, index) => {
      const button = byText.get(item.key);
      const letter = button.querySelector(".choice-letter");
      if (letter && letter.textContent !== item.letter) letter.textContent = item.letter;
      if (grid.children[index] !== button) grid.appendChild(button);
    });

    card.dataset.tfnCanonicalized = "true";
  }

  function canonicalizeReviewAnswer(answerBox) {
    if (answerBox.dataset.tfnCanonicalized === "true") return;

    const strong = answerBox.querySelector("strong");
    if (!strong) return;

    const text = strong.textContent.trim();
    if (!text || /^no answer$/i.test(text)) return;

    const separator = text.indexOf("·");
    if (separator < 0) return;

    const semantic = normalize(text.slice(separator + 1));
    const item = CANONICAL.find((candidate) => candidate.key === semantic);
    if (!item) return;

    const canonicalText = `${item.letter} · ${item.text}`;
    if (strong.textContent !== canonicalText) strong.textContent = canonicalText;
    answerBox.dataset.tfnCanonicalized = "true";
  }

  function applyCanonicalReadingOrder() {
    document.querySelectorAll(".question-card").forEach(canonicalizeQuestion);
    document.querySelectorAll(".review-answer").forEach(canonicalizeReviewAnswer);
  }

  const target = document.querySelector("#mainContent") || document.body;
  const observer = new MutationObserver(applyCanonicalReadingOrder);
  observer.observe(target, { childList: true, subtree: true });
  window.setTimeout(applyCanonicalReadingOrder, 0);
})();
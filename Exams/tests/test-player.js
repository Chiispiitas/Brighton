"use strict";
/* ==============================================
     Brighton English School - Test Player
     Made by: David Santana
============================================== */

(() => {
  const data = window.BRIGHTON_TEST_DATA;
  if (!data || !Array.isArray(data.pages)) {
    document.body.innerHTML = "<p style='padding:24px;font-family:sans-serif'>Test data could not be loaded.</p>";
    return;
  }

  const App = window.BrightonApp || {};
  const config = window.BRIGHTON_SITE_CONFIG || {};
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));
  const escapeHtml = App.escapeHtml || ((value) => String(value ?? "").replace(/[&<>\"]/g, (char) => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[char])));
  const normalizeClassCode = App.normalizeClassCode || ((value) => String(value || "").trim().toUpperCase());
  const STORAGE_KEY = `brighton-test-state-${data.testId}-v1`;

  const dom = {
    startScreen: $("#startScreen"),
    testShell: $("#testShell"),
    studentForm: $("#studentForm"),
    studentName: $("#studentName"),
    classId: $("#classId"),
    continueSavedBtn: $("#continueSavedBtn"),
    headerStudent: $("#headerStudent"),
    headerClass: $("#headerClass"),
    answeredCount: $("#answeredCount"),
    totalCount: $("#totalCount"),
    progressBar: $("#progressBar"),
    mainContent: $("#mainContent"),
    pageTabs: $("#pageTabs"),
    previousPageBtn: $("#previousPageBtn"),
    nextPageBtn: $("#nextPageBtn"),
    resetBtn: $("#resetBtn"),
    bottomNav: $(".test-bottom-nav")
  };

  let state = loadState() || createDefaultState();
  let saveTimer = null;

  boot();

  function boot() {
    hydrateStaticText();

    if (state.student.name) {
      dom.studentName.value = state.student.name;
      dom.classId.value = state.student.classId;
      dom.continueSavedBtn.classList.remove("hidden");
      dom.continueSavedBtn.textContent = state.submitted ? "Retry saved submission" : "Continue saved test";
    }

    dom.studentForm.addEventListener("submit", (event) => {
      event.preventDefault();
      startTest(dom.studentName.value.trim(), dom.classId.value.trim());
    });

    dom.continueSavedBtn.addEventListener("click", () => {
      if (!state.student.name) return;
      if (state.submitted) showFinishScreen({ retry: true });
      else showTest();
    });

    dom.previousPageBtn.addEventListener("click", () => goToPage(state.pageIndex - 1));
    dom.nextPageBtn.addEventListener("click", () => {
      if (state.pageIndex >= data.pages.length - 1) requestSubmit();
      else goToPage(state.pageIndex + 1);
    });
    dom.resetBtn.addEventListener("click", resetTest);

    dom.mainContent.addEventListener("click", (event) => {
      const choice = event.target.closest("[data-answer-question]");
      if (!choice) return;
      setAnswer(Number(choice.dataset.answerQuestion), choice.dataset.answerValue);
    });
  }

  function hydrateStaticText() {
    $("#startEyebrow").textContent = `${data.level} · Units ${displayUnits(data.unitRange)}`;
    $("#startTitle").textContent = data.title;
    $("#startSubtitle").textContent = data.subtitle || "Multiple Choice";
    $("#startDescription").textContent = "";
    $("#metaPages").textContent = `${data.pages.length} pages`;
    $("#metaQuestions").textContent = `${data.totalQuestions} questions`;
    $("#metaType").textContent = "Multiple choice";
    dom.totalCount.textContent = String(data.totalQuestions || allQuestions().length);
  }

  function createDefaultState() {
    const answers = {};
    allQuestions().forEach((question) => { answers[question.q] = ""; });
    return {
      version: 1,
      clientSubmissionId: createClientSubmissionId(),
      student: { name: "", classId: "", startedAt: "" },
      pageIndex: 0,
      answers,
      submitted: false,
      submittedAt: ""
    };
  }

  function createClientSubmissionId() {
    if (window.crypto?.randomUUID) return window.crypto.randomUUID();
    return `${data.testId}-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  }

  function loadState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      const saved = JSON.parse(raw);
      const base = createDefaultState();
      return {
        ...base,
        ...saved,
        student: { ...base.student, ...(saved.student || {}) },
        answers: { ...base.answers, ...(saved.answers || {}) }
      };
    } catch (error) {
      console.warn("Could not load saved test state", error);
      return null;
    }
  }

  function saveState() {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(() => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    }, 30);
  }

  function startTest(name, classId) {
    const normalized = normalizeClassCode(classId);
    if (!name || !normalized) return;
    state.student.name = name;
    state.student.classId = normalized;
    if (!state.student.startedAt) state.student.startedAt = new Date().toISOString();
    dom.classId.value = normalized;
    saveState();
    showTest();
  }

  function showTest() {
    dom.startScreen.classList.add("hidden");
    dom.testShell.classList.remove("hidden");
    dom.testShell.classList.remove("results-mode");
    dom.bottomNav?.classList.remove("hidden");
    dom.headerStudent.textContent = state.student.name;
    dom.headerClass.textContent = state.student.classId;
    render();
  }

  function render() {
    renderPage();
    renderTabs();
    renderProgress();
    renderNavigation();
    saveState();
  }

  function renderPage() {
    const page = data.pages[state.pageIndex];
    if (!page) return;
    dom.mainContent.innerHTML = `
      <section class="page-card">
        <header class="page-head">
          <div>
            <p class="eyebrow">${escapeHtml(page.sourceLabel || `Page ${state.pageIndex + 1}`)}</p>
            <h2>${escapeHtml(page.title || page.label || `Page ${state.pageIndex + 1}`)}</h2>
          </div>
          <div class="page-badge">Page ${state.pageIndex + 1} of ${data.pages.length}</div>
        </header>
        <div class="instructions"><strong>Instructions:</strong> ${escapeHtml(page.instructions || "Choose the correct answer: a, b, or c.")}</div>
        ${page.passage ? renderPassage(page.passage) : ""}
        <div class="question-list">
          ${page.questions.map(renderQuestion).join("")}
        </div>
      </section>
    `;
  }

  function renderPassage(passage) {
    if (!passage || typeof passage !== "object") return "";
    const paragraphs = Array.isArray(passage.paragraphs) ? passage.paragraphs : [];
    if (!passage.title && !passage.byline && !paragraphs.length) return "";

    return `
      <article class="reading-passage">
        <div class="reading-passage-head">
          ${passage.kicker ? `<p class="eyebrow">${escapeHtml(passage.kicker)}</p>` : ""}
          ${passage.title ? `<h3>${escapeHtml(passage.title)}</h3>` : ""}
          ${passage.byline ? `<p class="reading-byline">${escapeHtml(passage.byline)}</p>` : ""}
        </div>
        <div class="reading-passage-body">
          ${paragraphs.map((paragraph) => `<p>${escapeHtml(paragraph)}</p>`).join("")}
        </div>
      </article>
    `;
  }

  function renderQuestion(question) {
    const selected = state.answers[question.q] || "";
    return `
      <article class="question-card ${selected ? "answered" : ""}" id="question-${question.q}">
        <div class="question-number">${question.q}</div>
        <div class="question-prompt">
          <p>${escapeHtml(question.text)}</p>
          ${question.visual ? renderVisual(question.visual) : ""}
        </div>
        <div class="choice-grid" role="group" aria-label="Question ${question.q}">
          ${question.options.map((option, index) => {
            const letter = String.fromCharCode(65 + index);
            return `
              <button class="choice-button ${selected === letter ? "selected" : ""}" type="button"
                data-answer-question="${question.q}" data-answer-value="${letter}" aria-pressed="${selected === letter}">
                <span class="choice-letter">${letter}</span>
                <span>${escapeHtml(option)}</span>
              </button>
            `;
          }).join("")}
        </div>
      </article>
    `;
  }

  function renderVisual(type) {
    if (type === "tablet") {
      return `<div class="question-visual" aria-label="Picture of a tablet">
        <svg viewBox="0 0 120 72" role="img" aria-hidden="true">
          <rect x="15" y="8" width="90" height="56" rx="7" fill="#32373f"/>
          <rect x="21" y="14" width="78" height="43" rx="3" fill="#dfe9ec"/>
          <rect x="27" y="20" width="31" height="18" rx="2" fill="#91b9bd"/>
          <rect x="62" y="20" width="31" height="5" rx="2" fill="#aeb7bd"/>
          <rect x="62" y="29" width="25" height="4" rx="2" fill="#c6cdd1"/>
          <circle cx="60" cy="60" r="2.3" fill="#d9dde0"/>
        </svg>
      </div>`;
    }
    if (type === "umbrella") {
      return `<div class="question-visual" aria-label="Picture of an umbrella">
        <svg viewBox="0 0 120 72" role="img" aria-hidden="true">
          <path d="M18 40 Q31 16 58 16 Q87 16 102 40 L18 40Z" fill="#4e555d"/>
          <path d="M18 40 Q29 29 39 40 Q49 29 59 40 Q70 29 80 40 Q91 29 102 40" fill="#3d444b"/>
          <path d="M59 17 V54 Q59 64 50 64 Q45 64 43 59" fill="none" stroke="#3d444b" stroke-width="4" stroke-linecap="round"/>
        </svg>
      </div>`;
    }
    return "";
  }

  function renderTabs() {
    dom.pageTabs.innerHTML = data.pages.map((page, index) => {
      const complete = page.questions.every((question) => Boolean(state.answers[question.q]));
      return `<button class="page-tab ${index === state.pageIndex ? "active" : ""} ${complete ? "complete" : ""}" type="button" data-page-index="${index}">${escapeHtml(page.shortLabel || page.label || `Page ${index + 1}`)}</button>`;
    }).join("");
    $$('[data-page-index]', dom.pageTabs).forEach((button) => button.addEventListener("click", () => goToPage(Number(button.dataset.pageIndex))));
  }

  function renderProgress() {
    const answered = answeredQuestions();
    const total = data.totalQuestions || allQuestions().length;
    dom.answeredCount.textContent = String(answered);
    dom.totalCount.textContent = String(total);
    dom.progressBar.style.width = `${total ? Math.round((answered / total) * 100) : 0}%`;
  }

  function renderNavigation() {
    dom.previousPageBtn.disabled = state.pageIndex === 0;
    const last = state.pageIndex === data.pages.length - 1;
    dom.nextPageBtn.textContent = last ? "Submit test" : "Next page →";
    dom.nextPageBtn.classList.toggle("submit", last);
  }

  function setAnswer(questionNumber, value) {
    state.answers[questionNumber] = value;
    const card = $(`#question-${questionNumber}`);
    if (card) {
      card.classList.add("answered");
      $$('[data-answer-question]', card).forEach((button) => {
        const selected = button.dataset.answerValue === value;
        button.classList.toggle("selected", selected);
        button.setAttribute("aria-pressed", selected ? "true" : "false");
      });
    }
    renderTabs();
    renderProgress();
    saveState();
  }

  function goToPage(index) {
    if (index < 0 || index >= data.pages.length) return;
    state.pageIndex = index;
    render();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function requestSubmit() {
    const missing = (data.totalQuestions || allQuestions().length) - answeredQuestions();
    const message = missing > 0
      ? `You still have ${missing} unanswered question${missing === 1 ? "" : "s"}. Submit the test anyway?`
      : "Submit your test now? You will not be able to change your answers after submitting.";
    if (!window.confirm(message)) return;
    state.submitted = true;
    state.submittedAt = new Date().toISOString();
    saveState();
    showFinishScreen();
  }

  function showFinishScreen(options = {}) {
    dom.startScreen.classList.add("hidden");
    dom.testShell.classList.remove("hidden");
    dom.testShell.classList.remove("results-mode");
    dom.bottomNav?.classList.remove("hidden");
    dom.pageTabs.innerHTML = "";
    dom.previousPageBtn.disabled = true;
    dom.nextPageBtn.disabled = true;

    dom.mainContent.innerHTML = `
      <section class="finish-screen">
        <div class="finish-card">
          <p class="eyebrow">${escapeHtml(data.level)} · Units ${escapeHtml(displayUnits(data.unitRange))}</p>
          <h2>${options.retry ? "Retrying submission" : "Test finished"}</h2>
          <p id="submitStatusText" class="start-copy">Please wait while Brighton records your answers.</p>
          <div class="submission-status-line"><strong id="submitStatusBadge">Saving</strong><span>Wix CMS</span></div>
          <div id="submissionResult"></div>
        </div>
      </section>
    `;
    submitPayload(buildPayload());
  }

  function buildPayload() {
    const answerList = data.pages.flatMap((page, pageIndex) => page.questions.map((question) => ({
      page: pageIndex + 1,
      unit: page.unit,
      question: question.q,
      answer: state.answers[question.q] || ""
    })));
    return {
      clientSubmissionId: state.clientSubmissionId,
      testId: data.testId,
      testTitle: data.title,
      level: data.level,
      unitRange: data.unitRange,
      studentName: state.student.name,
      classId: state.student.classId,
      answers: state.answers,
      answerList,
      startedAt: state.student.startedAt,
      submittedAt: state.submittedAt || new Date().toISOString(),
      timeSpentSeconds: calculateTimeSpentSeconds(),
      answeredCount: answeredQuestions(),
      totalQuestions: data.totalQuestions || allQuestions().length,
      pageProgress: data.pages.map((page, pageIndex) => ({
        page: pageIndex + 1,
        unit: page.unit,
        answered: page.questions.filter((question) => Boolean(state.answers[question.q])).length,
        total: page.questions.length
      }))
    };
  }

  async function submitPayload(payload) {
    try {
      window.parent?.postMessage({ type: "BRIGHTON_TEST_SUBMIT", payload }, "*");
    } catch (error) {
      console.warn("Could not notify parent window", error);
    }

    const statusText = $("#submitStatusText");
    const statusBadge = $("#submitStatusBadge");
    const resultBox = $("#submissionResult");
    const apiBase = String(config.API_BASE_URL || "").replace(/\/$/, "");

    if (!apiBase || apiBase.includes("YOUR-WIX")) {
      statusBadge.textContent = "Local";
      statusText.textContent = "The test is complete, but the Wix endpoint is not configured.";
      resultBox.innerHTML = `<p class="submit-error">Tell your teacher before closing this page.</p>`;
      await renderStudentResults(payload, { saved: false, saveMessage: "This result was not saved to Wix." });
      return;
    }

    try {
      const response = await fetch(`${apiBase}/submitTest`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok || result.success === false) throw new Error(result.error || `HTTP ${response.status}`);

      statusBadge.textContent = "Saved";
      statusText.textContent = "Your answers have been recorded successfully.";
      resultBox.innerHTML = `<p>Submission ID: <strong>${escapeHtml(result.submissionId || payload.clientSubmissionId)}</strong></p>`;
      localStorage.removeItem(STORAGE_KEY);
      await renderStudentResults(payload, {
        saved: true,
        submissionId: result.submissionId || payload.clientSubmissionId
      });
    } catch (error) {
      console.error("Test submission failed", error);
      statusBadge.textContent = "Not saved";
      statusText.textContent = "Your test is complete, but it could not be saved to Wix. Your submission is still saved on this device.";
      resultBox.innerHTML = `
        <p class="submit-error">Save error: ${escapeHtml(error.message || String(error))}</p>
        <div class="finish-actions"><button id="retrySubmissionBtn" class="primary-btn" type="button">Retry saving</button></div>
      `;
      $("#retrySubmissionBtn")?.addEventListener("click", () => submitPayload(payload));
      await renderStudentResults(payload, {
        saved: false,
        saveMessage: "Your score is shown below, but the submission has not been saved to Wix yet.",
        keepRetry: true
      });
    }
  }

  async function renderStudentResults(payload, options = {}) {
    try {
      const answerKey = await loadStudentAnswerKey();
      const grading = gradeStudentSubmission(payload.answers || {}, answerKey);

      dom.testShell.classList.add("results-mode");
      dom.bottomNav?.classList.add("hidden");
      dom.headerProgress?.classList?.add?.("hidden");

      const saveNotice = options.saved
        ? `<span class="result-save-status saved">✓ Saved to Wix</span>`
        : `<span class="result-save-status warning">⚠ ${escapeHtml(options.saveMessage || "Not saved to Wix")}</span>`;

      const retryHtml = options.keepRetry
        ? `<button id="retryResultSubmissionBtn" class="primary-btn" type="button">Retry saving</button>`
        : "";

      dom.mainContent.innerHTML = `
        <section class="student-results">
          <header class="results-hero">
            <div>
              <p class="eyebrow">${escapeHtml(data.level)} · Units ${escapeHtml(displayUnits(data.unitRange))}</p>
              <h2>Test results</h2>
              <p class="results-student-name">${escapeHtml(state.student.name || payload.studentName || "Student")}</p>
            </div>
            ${saveNotice}
          </header>

          <div class="score-summary">
            <div class="score-main">
              <span>Final score</span>
              <strong>${grading.score}<small> / ${grading.maxScore}</small></strong>
            </div>
            <div class="score-stat">
              <span>Percentage</span>
              <strong>${grading.percentage}%</strong>
            </div>
            <div class="score-stat">
              <span>Correct</span>
              <strong>${grading.correctCount}<small> / ${grading.totalQuestions}</small></strong>
            </div>
          </div>

          <div class="review-legend" aria-label="Answer review legend">
            <span><i class="legend-dot correct"></i> Correct</span>
            <span><i class="legend-dot incorrect"></i> Incorrect</span>
            <span><i class="legend-dot unanswered"></i> Unanswered</span>
          </div>

          <div class="answer-review">
            ${grading.pages.map(renderReviewPage).join("")}
          </div>

          <div class="results-actions">
            ${retryHtml}
            <a class="primary-btn" href="../../tests.html">Back to Tests</a>
            <a class="secondary-btn" href="../../index.html">Assessment Home</a>
          </div>
        </section>
      `;

      $("#retryResultSubmissionBtn")?.addEventListener("click", () => showFinishScreen({ retry: true }));
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (error) {
      console.error("Could not load student answer review", error);
      const resultBox = $("#submissionResult");
      if (resultBox) {
        resultBox.insertAdjacentHTML("beforeend", `
          <p class="submit-error">Your submission was completed, but the score review could not be loaded.</p>
          <div class="finish-actions">
            <a class="primary-btn" href="../../tests.html">Back to Tests</a>
            <a class="secondary-btn" href="../../index.html">Assessment Home</a>
          </div>
        `);
      }
    }
  }

  async function loadStudentAnswerKey() {
    const url = new URL(`../../answer-keys/${encodeURIComponent(data.testId)}.json`, window.location.href);
    const response = await fetch(url.toString(), { headers: { Accept: "application/json" }, cache: "no-store" });
    if (!response.ok) throw new Error(`Could not load answer key for ${data.testId}`);
    return response.json();
  }

  function gradeStudentSubmission(answers, answerKey) {
    const rules = answerKey?.answers || {};
    let score = 0;
    let correctCount = 0;
    const pages = data.pages.map((page, pageIndex) => {
      let pageScore = 0;
      let pageMaxScore = 0;
      let pageCorrect = 0;

      const questions = page.questions.map((question) => {
        const rule = rules[String(question.q)] || {};
        const points = Number(rule.points || 1);
        const accepted = (Array.isArray(rule.answers) ? rule.answers : []).map((answer) => String(answer || "").trim().toUpperCase());
        const selected = String(answers[question.q] || "").trim().toUpperCase();
        const isCorrect = Boolean(selected) && accepted.includes(selected);
        const earned = isCorrect ? points : 0;
        const correctLetter = accepted.find((answer) => /^[A-Z]$/.test(answer)) || accepted[0] || "";

        score += earned;
        pageScore += earned;
        pageMaxScore += points;
        if (isCorrect) {
          correctCount += 1;
          pageCorrect += 1;
        }

        return {
          pageIndex,
          question,
          selected,
          correctLetter,
          isCorrect,
          earned,
          points
        };
      });

      return {
        label: page.label || page.shortLabel || `Page ${pageIndex + 1}`,
        pageNumber: pageIndex + 1,
        score: pageScore,
        maxScore: pageMaxScore,
        correct: pageCorrect,
        total: questions.length,
        questions
      };
    });

    const calculatedMax = pages.reduce((sum, page) => sum + page.maxScore, 0);
    const maxScore = Number(answerKey?.maxScore || calculatedMax || data.maxScore || data.totalQuestions || 0);
    const totalQuestions = allQuestions().length;

    return {
      score,
      maxScore,
      percentage: maxScore ? Math.round((score / maxScore) * 100) : 0,
      correctCount,
      totalQuestions,
      pages
    };
  }

  function renderReviewPage(page) {
    return `
      <section class="review-page">
        <header class="review-page-head">
          <div>
            <span>Page ${page.pageNumber}</span>
            <h3>${escapeHtml(page.label)}</h3>
          </div>
          <strong>${page.score}/${page.maxScore}</strong>
        </header>
        <div class="review-question-list">
          ${page.questions.map(renderReviewQuestion).join("")}
        </div>
      </section>
    `;
  }

  function renderReviewQuestion(item) {
    const { question, selected, correctLetter, isCorrect } = item;
    const status = !selected ? "unanswered" : (isCorrect ? "correct" : "incorrect");
    const statusText = !selected ? "Unanswered" : (isCorrect ? "Correct" : "Incorrect");
    const selectedText = answerOptionText(question, selected);
    const correctText = answerOptionText(question, correctLetter);

    return `
      <article class="review-question ${status}">
        <div class="review-question-top">
          <span class="review-number">${question.q}</span>
          <p>${escapeHtml(question.text)}</p>
          <span class="review-status ${status}">${statusText}</span>
        </div>
        <div class="review-answer-lines">
          <div class="review-answer student-answer">
            <span>Your answer</span>
            <strong>${selected ? `${escapeHtml(selected)} · ${escapeHtml(selectedText)}` : "No answer"}</strong>
          </div>
          ${isCorrect ? "" : `
            <div class="review-answer correct-answer">
              <span>Correct answer</span>
              <strong>${escapeHtml(correctLetter)} · ${escapeHtml(correctText)}</strong>
            </div>
          `}
        </div>
      </article>
    `;
  }

  function answerOptionText(question, letter) {
    const index = String(letter || "").toUpperCase().charCodeAt(0) - 65;
    if (!Number.isInteger(index) || index < 0 || index >= question.options.length) return "";
    return String(question.options[index] ?? "");
  }

  function resetTest() {
    if (!window.confirm("Reset this test? All answers saved on this device will be deleted.")) return;
    localStorage.removeItem(STORAGE_KEY);
    state = createDefaultState();
    window.location.reload();
  }

  function calculateTimeSpentSeconds() {
    const start = new Date(state.student.startedAt).getTime();
    const end = new Date(state.submittedAt || Date.now()).getTime();
    if (!Number.isFinite(start) || !Number.isFinite(end)) return null;
    return Math.max(0, Math.round((end - start) / 1000));
  }

  function answeredQuestions() {
    return allQuestions().filter((question) => Boolean(state.answers[question.q])).length;
  }

  function allQuestions() {
    return data.pages.flatMap((page) => page.questions);
  }

  function displayUnits(value) {
    return String(value || "").replace("-", "–");
  }
})();

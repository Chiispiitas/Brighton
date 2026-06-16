"use strict";
/* ==============================================
     Brighton English School
     Made by: David Santana
============================================== */

(() => {
  const STORAGE_KEY = "brighton-b2-rue-exam-state-v1";
  const examParts = window.examParts || [];
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));

  const dom = {
    startScreen: $("#startScreen"),
    examShell: $("#examShell"),
    studentForm: $("#studentForm"),
    continueSavedBtn: $("#continueSavedBtn"),
    studentName: $("#studentName"),
    classId: $("#classId"),
    headerStudent: $("#headerStudent"),
    headerClass: $("#headerClass"),
    mainContent: $("#mainContent"),
    bottomNav: $("#bottomNav"),
    backBtn: $("#backBtn"),
    nextBtn: $("#nextBtn"),
    flagBtn: $("#flagBtn"),
    notesBtn: $("#notesBtn"),
    menuBtn: $("#menuBtn"),
    sideMenu: $("#sideMenu"),
    closeMenuBtn: $("#closeMenuBtn"),
    closeMenuOptionBtn: $("#closeMenuOptionBtn"),
    overviewBtn: $("#overviewBtn"),
    submitMenuBtn: $("#submitMenuBtn"),
    resetBtn: $("#resetBtn"),
    modalRoot: $("#modalRoot"),
    toast: $("#toast")
  };

  let state = loadState() || createDefaultState();
  let saveTimer = null;
  let liveProgress = null;

  const helpers = {
    escape,
    escapeAttr,
    getAnswer,
    setAnswer,
    getCurrentQuestionNumber,
    goToQuestion,
    partHeader,
    instruction,
    countWords,
    attachDivider,
    saveOnly: saveState,
    render: renderApp
  };

  boot();

  /* ---------------------------------------------- 
  BOOT 
  ---------------------------------------------- */
  function boot() {
    if (state.student.name) {
      state.student.classId = normalizeClassCode(state.student.classId);
      dom.continueSavedBtn.classList.remove("hidden");
      dom.studentName.value = state.student.name;
      dom.classId.value = state.student.classId;
    }

    dom.studentForm.addEventListener("submit", event => {
      event.preventDefault();
      startExam(dom.studentName.value.trim(), dom.classId.value.trim());
    });

    dom.continueSavedBtn.addEventListener("click", () => {
      if (state.student.name) showExam();
    });

    dom.backBtn.addEventListener("click", goPrevious);
    dom.nextBtn.addEventListener("click", () => {
      if (isFinalQuestion()) showFinishScreen();
      else goNext();
    });

    dom.flagBtn.addEventListener("click", toggleFlag);
    dom.notesBtn.addEventListener("click", openNotes);
    dom.menuBtn.addEventListener("click", openMenu);
    dom.closeMenuBtn.addEventListener("click", closeMenu);
    dom.closeMenuOptionBtn.addEventListener("click", closeMenu);
    dom.overviewBtn.addEventListener("click", () => { closeMenu(); openOverview(); });
    if (dom.submitMenuBtn) dom.submitMenuBtn.addEventListener("click", requestSubmitFromMenu);
    dom.resetBtn.addEventListener("click", resetTest);

    dom.mainContent.addEventListener("scroll", debounce(() => {
      const key = `${state.current.partId}`;
      state.scroll[key] = dom.mainContent.scrollTop;
      saveState();
    }, 200));

    document.addEventListener("keydown", event => {
      if (dom.examShell.classList.contains("hidden")) return;
      const tag = document.activeElement?.tagName?.toLowerCase();
      const isTyping = tag === "input" || tag === "textarea";
      if (event.key === "Escape") {
        closeModal();
        closeMenu();
        $$(".choice-popover").forEach(el => el.remove());
        return;
      }
      if (!isTyping && event.key === "ArrowLeft") {
        event.preventDefault();
        goPrevious();
      }
      if (!isTyping && event.key === "ArrowRight") {
        event.preventDefault();
        if (isFinalQuestion()) showFinishScreen();
        else goNext();
      }
    });

    if (state.student.name) {
      showExam();
    }
  }

  /* ---------------------------------------------- 
  START EXAM 
  ---------------------------------------------- */
  function startExam(name, classId) {
    const normalizedClassId = normalizeClassCode(classId);
    if (!name || !normalizedClassId) return;
    state.student.name = name;
    state.student.classId = normalizedClassId;
    dom.classId.value = normalizedClassId;
    if (!state.student.startedAt) state.student.startedAt = new Date().toISOString();
    saveState();
    showExam();
  }

  /* ---------------------------------------------- 
  SHOW EXAM 
  ---------------------------------------------- */
  function showExam() {
    dom.startScreen.classList.add("hidden");
    dom.examShell.classList.remove("hidden");
    renderApp();
    startLiveProgress();
  }

  /* ---------------------------------------------- 
  CREATE DEFAULT STATE 
  ---------------------------------------------- */
  function createDefaultState() {
    const answers = {};
    examParts.forEach(part => {
      answers[part.id] = {};
      part.items.forEach(item => { answers[part.id][item.q] = ""; });
    });
    return {
      version: 1,
      student: { name: "", classId: "", startedAt: "" },
      current: { partId: examParts[0]?.id || "part1", itemIndex: 0 },
      answers,
      flagged: {},
      notes: "",
      selectedGap: null,
      selectedOption: null,
      layout: { part5Left: 54, part6Left: 58 },
      scroll: {},
      submitted: false,
      submittedAt: ""
    };
  }

  /* ---------------------------------------------- 
  LOAD STATE 
  ---------------------------------------------- */
  function loadState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      const fresh = createDefaultState();
      return mergeState(fresh, parsed);
    } catch (error) {
      console.warn("Could not load saved exam state", error);
      return null;
    }
  }

  /* ---------------------------------------------- 
  MERGE STATE 
  ---------------------------------------------- */
  function mergeState(base, saved) {
    const merged = { ...base, ...saved };
    merged.student = { ...base.student, ...(saved.student || {}) };
    merged.current = { ...base.current, ...(saved.current || {}) };
    merged.answers = base.answers;
    Object.keys(saved.answers || {}).forEach(partId => {
      merged.answers[partId] = { ...(base.answers[partId] || {}), ...(saved.answers[partId] || {}) };
    });
    merged.flagged = { ...base.flagged, ...(saved.flagged || {}) };
    merged.layout = { ...base.layout, ...(saved.layout || {}) };
    merged.scroll = { ...base.scroll, ...(saved.scroll || {}) };
    return merged;
  }

  /* ---------------------------------------------- 
  SAVE STATE 
  ---------------------------------------------- */
  function saveState() {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(() => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    }, 30);
  }

  /* ---------------------------------------------- 
  RENDER APP 
  ---------------------------------------------- */
  function renderApp(options = {}) {
    const part = getCurrentPart();
    ensureValidCurrent();
    updateHeader();
    renderMain(part, options);
    renderBottomNav();
    renderStepControls();
    saveState();
  }

  /* ---------------------------------------------- 
  RENDER MAIN 
  ---------------------------------------------- */
  function renderMain(part, options = {}) {
    const renderer = window.PartRenderers?.[part.id];
    if (!renderer) {
      dom.mainContent.innerHTML = `<section class="exam-panel"><p>Renderer missing for ${escape(part.id)}</p></section>`;
      return;
    }
    dom.mainContent.innerHTML = `${renderer.render(part, state, helpers)}${renderEndSubmitCard()}`;
    renderer.afterRender?.(part, state, helpers);
    bindEndSubmitCard();
    if (options.restoreScroll) {
      requestAnimationFrame(() => { dom.mainContent.scrollTop = state.scroll[part.id] || 0; });
    }
  }

  /* ---------------------------------------------- 
  UPDATE HEADER 
  ---------------------------------------------- */
  function updateHeader() {
    dom.headerStudent.textContent = state.student.name || "Student Name";
    dom.headerClass.textContent = state.student.classId || "Class ID";
    const q = getCurrentQuestionNumber();
    const flagged = Boolean(state.flagged[q]);
    dom.flagBtn.classList.toggle("flagged", flagged);
    dom.flagBtn.textContent = flagged ? "★" : "☆";
    dom.flagBtn.setAttribute("aria-pressed", flagged ? "true" : "false");
  }

  /* ---------------------------------------------- 
  RENDER BOTTOM NAV 
  ---------------------------------------------- */
  function renderBottomNav() {
    const currentQ = getCurrentQuestionNumber();
    dom.bottomNav.innerHTML = examParts.map(part => {
      const progress = getProgress(part);
      const active = part.id === state.current.partId;
      const bubbles = active ? `
        <div class="question-bubbles" aria-label="Questions in ${part.label}">
          ${part.items.map((item, index) => {
            const classes = ["q-pill"];
            if (item.q === currentQ) classes.push("active");
            if (isAnswered(part, item.q)) classes.push("answered");
            if (state.flagged[item.q]) classes.push("flagged");
            return `<button class="${classes.join(" ")}" data-jump-q="${item.q}" title="Question ${item.q}">${item.q}</button>`;
          }).join("")}
        </div>` : "";
      return `
        <section class="part-nav-card ${active ? "active" : ""}" data-part-id="${part.id}">
          <div class="part-nav-top">
            <button class="part-nav-title" data-part-id="${part.id}">${part.label}</button>
            <span class="part-nav-progress">${progress.answered} of ${progress.total}</span>
          </div>
          ${bubbles}
        </section>
      `;
    }).join("");

    $$('[data-jump-q]', dom.bottomNav).forEach(button => {
      button.addEventListener("click", () => goToQuestion(Number(button.dataset.jumpQ)));
    });
    $$('.part-nav-card', dom.bottomNav).forEach(card => {
      card.addEventListener("click", event => {
        if (event.target.closest("[data-jump-q]")) return;
        const part = getPart(card.dataset.partId);
        if (part?.items?.[0]) goToQuestion(part.items[0].q);
      });
    });
  }

  /* ---------------------------------------------- 
  RENDER STEP CONTROLS 
  ---------------------------------------------- */
  function renderStepControls() {
    dom.backBtn.disabled = isFirstQuestion();
    if (isFinalQuestion()) {
      dom.nextBtn.textContent = "✓";
      dom.nextBtn.classList.add("finish");
      dom.nextBtn.setAttribute("aria-label", "Finish exam");
    } else {
      dom.nextBtn.textContent = "→";
      dom.nextBtn.classList.remove("finish");
      dom.nextBtn.setAttribute("aria-label", "Next question");
    }
  }

  /* ---------------------------------------------- 
  GET CURRENT PART 
  ---------------------------------------------- */
  function getCurrentPart() {
    return getPart(state.current.partId) || examParts[0];
  }

  /* ---------------------------------------------- 
  GET PART 
  ---------------------------------------------- */
  function getPart(partId) {
    return examParts.find(part => part.id === partId);
  }

  /* ---------------------------------------------- 
  ENSURE VALID CURRENT 
  ---------------------------------------------- */
  function ensureValidCurrent() {
    const part = getCurrentPart();
    if (!part) return;
    if (state.current.itemIndex < 0) state.current.itemIndex = 0;
    if (state.current.itemIndex >= part.items.length) state.current.itemIndex = part.items.length - 1;
  }

  /* ---------------------------------------------- 
  GET CURRENT QUESTION NUMBER 
  ---------------------------------------------- */
  function getCurrentQuestionNumber() {
    const part = getCurrentPart();
    return part.items[state.current.itemIndex]?.q;
  }

  /* ---------------------------------------------- 
  GET QUESTION LOCATION 
  ---------------------------------------------- */
  function getQuestionLocation(q) {
    for (const part of examParts) {
      const itemIndex = part.items.findIndex(item => item.q === q);
      if (itemIndex !== -1) return { partId: part.id, itemIndex };
    }
    return null;
  }

  /* ---------------------------------------------- 
  GO TO QUESTION 
  ---------------------------------------------- */
  function goToQuestion(q, options = {}) {
    const location = getQuestionLocation(q);
    if (!location) return;
    state.current = location;
    if (liveProgress && typeof liveProgress.touch === "function") liveProgress.touch();
    if (options.render === false) {
      updateHeader();
      renderBottomNav();
      renderStepControls();
      saveState();
      return;
    }
    renderApp({ restoreScroll: false });
  }

  /* ---------------------------------------------- 
  GET LINEAR INDEX 
  ---------------------------------------------- */
  function getLinearIndex() {
    const currentQ = getCurrentQuestionNumber();
    return allItems().findIndex(item => item.q === currentQ);
  }

  /* ---------------------------------------------- 
  ALL ITEMS 
  ---------------------------------------------- */
  function allItems() {
    return examParts.flatMap(part => part.items.map(item => ({ ...item, partId: part.id })));
  }

  /* ---------------------------------------------- 
  GO PREVIOUS 
  ---------------------------------------------- */
  function goPrevious() {
    const items = allItems();
    const index = getLinearIndex();
    if (index > 0) goToQuestion(items[index - 1].q);
  }

  /* ---------------------------------------------- 
  GO NEXT 
  ---------------------------------------------- */
  function goNext() {
    const items = allItems();
    const index = getLinearIndex();
    if (index < items.length - 1) goToQuestion(items[index + 1].q);
  }

  /* ---------------------------------------------- 
  IS FIRST QUESTION 
  ---------------------------------------------- */
  function isFirstQuestion() {
    return getLinearIndex() === 0;
  }

  /* ---------------------------------------------- 
  IS FINAL QUESTION 
  ---------------------------------------------- */
  function isFinalQuestion() {
    return getLinearIndex() === allItems().length - 1;
  }

  /* ---------------------------------------------- 
  GET ANSWER 
  ---------------------------------------------- */
  function getAnswer(partId, q) {
    return state.answers?.[partId]?.[q] || "";
  }

  /* ---------------------------------------------- 
  SET ANSWER 
  ---------------------------------------------- */
  function setAnswer(partId, q, value, options = {}) {
    if (!state.answers[partId]) state.answers[partId] = {};
    state.answers[partId][q] = value;
    saveState();
    if (liveProgress && typeof liveProgress.touch === "function") liveProgress.touch();
    if (options.render === false) {
      updateHeader();
      renderBottomNav();
      return;
    }
    renderApp({ restoreScroll: true });
  }

  /* ---------------------------------------------- 
  IS ANSWERED 
  ---------------------------------------------- */
  function isAnswered(part, q) {
    const value = getAnswer(part.id, q);
    return value !== null && value !== undefined && String(value).trim() !== "";
  }

  /* ---------------------------------------------- 
  GET PROGRESS 
  ---------------------------------------------- */
  function getProgress(part) {
    const total = part.items.length;
    const answered = part.items.filter(item => isAnswered(part, item.q)).length;
    return { answered, total };
  }

  /* ---------------------------------------------- 
  TOGGLE FLAG 
  ---------------------------------------------- */
  function toggleFlag() {
    const q = getCurrentQuestionNumber();
    if (!q) return;
    if (state.flagged[q]) delete state.flagged[q];
    else state.flagged[q] = true;
    renderApp({ restoreScroll: true });
  }

  /* ---------------------------------------------- 
  OPEN NOTES 
  ---------------------------------------------- */
  function openNotes() {
    openModal(`
      <div class="modal-card" role="dialog" aria-modal="true" aria-labelledby="notesTitle">
        <div class="modal-head">
          <h3 id="notesTitle">Private notes</h3>
          <button class="icon-btn" data-close-modal aria-label="Close notes">×</button>
        </div>
        <p class="muted-text">Notes are saved locally on this device and are included in the final export placeholder.</p>
        <textarea id="notesArea" class="notes-area" placeholder="Type your private notes here..."></textarea>
      </div>
    `);
    const area = $("#notesArea");
    area.value = state.notes || "";
    area.addEventListener("input", () => {
      state.notes = area.value;
      saveState();
    });
    setTimeout(() => area.focus(), 50);
  }

  /* ---------------------------------------------- 
  OPEN OVERVIEW 
  ---------------------------------------------- */
  function openOverview() {
    const currentQ = getCurrentQuestionNumber();
    const content = examParts.map(part => `
      <section class="overview-part">
        <h4>${escape(part.label)} <span class="muted-text">${getProgress(part).answered} of ${getProgress(part).total}</span></h4>
        ${part.items.map(item => {
          const answered = isAnswered(part, item.q);
          const flagged = Boolean(state.flagged[item.q]);
          return `
            <button class="overview-item ${answered ? "answered" : ""} ${currentQ === item.q ? "current" : ""}" data-overview-q="${item.q}">
              <strong>Question ${item.q}</strong>
              <span>${answered ? "Answered" : "Unanswered"}${flagged ? " · ★" : ""}</span>
            </button>
          `;
        }).join("")}
      </section>
    `).join("");

    openModal(`
      <div class="modal-card" role="dialog" aria-modal="true" aria-labelledby="overviewTitle">
        <div class="modal-head">
          <h3 id="overviewTitle">Question overview</h3>
          <button class="icon-btn" data-close-modal aria-label="Close overview">×</button>
        </div>
        <div class="overview-grid">${content}</div>
      </div>
    `);
    $$('[data-overview-q]', dom.modalRoot).forEach(button => {
      button.addEventListener("click", () => {
        closeModal();
        goToQuestion(Number(button.dataset.overviewQ));
      });
    });
  }

  /* ---------------------------------------------- 
  OPEN MODAL 
  ---------------------------------------------- */
  function openModal(html) {
    dom.modalRoot.innerHTML = html;
    dom.modalRoot.classList.remove("hidden");
    dom.modalRoot.setAttribute("aria-hidden", "false");
    $$('[data-close-modal]', dom.modalRoot).forEach(btn => btn.addEventListener("click", closeModal));
    dom.modalRoot.addEventListener("click", event => {
      if (event.target === dom.modalRoot) closeModal();
    }, { once: true });
  }

  /* ---------------------------------------------- 
  CLOSE MODAL 
  ---------------------------------------------- */
  function closeModal() {
    dom.modalRoot.classList.add("hidden");
    dom.modalRoot.setAttribute("aria-hidden", "true");
    dom.modalRoot.innerHTML = "";
  }

  /* ---------------------------------------------- 
  OPEN MENU 
  ---------------------------------------------- */
  function openMenu() {
    dom.sideMenu.classList.add("open");
    dom.sideMenu.setAttribute("aria-hidden", "false");
  }

  /* ---------------------------------------------- 
  CLOSE MENU 
  ---------------------------------------------- */
  function closeMenu() {
    dom.sideMenu.classList.remove("open");
    dom.sideMenu.setAttribute("aria-hidden", "true");
  }

  /* ---------------------------------------------- 
  REQUEST SUBMIT FROM MENU 
  ---------------------------------------------- */
  function requestSubmitFromMenu() {
    closeMenu();
    confirmSubmitExam();
  }

  /* ---------------------------------------------- 
  CONFIRM SUBMIT EXAM 
  ---------------------------------------------- */
  function confirmSubmitExam() {
    const confirmed = window.confirm("Submit your exam now? You will not be able to change your answers after submitting.");
    if (!confirmed) return;
    showFinishScreen();
  }

  /* ---------------------------------------------- 
  RENDER END SUBMIT CARD 
  ---------------------------------------------- */
  function renderEndSubmitCard() {
    if (!isFinalQuestion() || state.submitted) return "";
    return `
      <section class="end-submit-card" aria-label="Submit exam">
        <p class="eyebrow">End of exam</p>
        <h3>Ready to submit?</h3>
        <p>Review your answers first. When you are ready, send your exam to Brighton Database.</p>
        <button class="primary-btn end-submit-btn" type="button" data-submit-exam>Submit exam</button>
      </section>
    `;
  }

  /* ---------------------------------------------- 
  BIND END SUBMIT CARD 
  ---------------------------------------------- */
  function bindEndSubmitCard() {
    const button = $("[data-submit-exam]", dom.mainContent);
    if (!button) return;
    button.addEventListener("click", confirmSubmitExam);
  }

  /* ---------------------------------------------- 
  RESET TEST 
  ---------------------------------------------- */
  function resetTest() {
    const confirmed = window.confirm("Reset this test? This will clear all answers, flags and notes saved on this device.");
    if (!confirmed) return;
    localStorage.removeItem(STORAGE_KEY);
    state = createDefaultState();
    window.location.reload();
  }

  /* ---------------------------------------------- 
  SHOW FINISH SCREEN 
  ---------------------------------------------- */
  function showFinishScreen() {
    state.submitted = true;
    state.submittedAt = new Date().toISOString();
    saveState();

    const payload = buildExportPayload();
    dom.mainContent.innerHTML = `
      <section class="finish-screen">
        <div class="finish-card finish-confirmation-card">
          <p class="eyebrow">Exam finished</p>
          <h2>Submitting your answers</h2>
          <p id="submitStatusText" class="start-copy" style="margin-left:auto;margin-right:auto;">Please wait while the platform records your exam in Wix.</p>
          <div class="submission-status-line"><strong id="submitStatusBadge">Saving</strong><span>Wix CMS</span></div>
          <div id="submissionResult" class="submission-result"></div>
        </div>
      </section>
    `;

    dom.nextBtn.disabled = true;
    dom.backBtn.disabled = true;
    dom.bottomNav.innerHTML = "";

    submitPayload(payload);
  }


  /* ---------------------------------------------- 
  START LIVE PROGRESS 
  ---------------------------------------------- */
  function startLiveProgress() {
    if (!window.BrightonLiveProgress || state.submitted) return;
    if (liveProgress && typeof liveProgress.stop === "function") liveProgress.stop();
    liveProgress = window.BrightonLiveProgress.create({
      examId: "brighton-b2-rue-final",
      examTitle: "Brighton B2 Reading and Use of English Final Exam",
      skill: "Reading and Use of English",
      level: "B2",
      getProgress: buildLiveProgressSnapshot
    });
    liveProgress.start();
  }

  /* ---------------------------------------------- 
  BUILD LIVE PROGRESS SNAPSHOT 
  ---------------------------------------------- */
  function buildLiveProgressSnapshot() {
    const totals = examParts.reduce((summary, part) => {
      const progress = getProgress(part);
      summary.answered += Number(progress.answered ?? progress.done) || 0;
      summary.total += Number(progress.total) || 0;
      return summary;
    }, { answered: 0, total: 0 });
    return {
      studentName: state.student.name,
      classId: state.student.classId,
      startedAt: state.student.startedAt,
      currentPart: state.current.partId,
      currentQuestion: getCurrentQuestionNumber(),
      answeredCount: totals.answered,
      totalQuestions: totals.total,
      progressPercent: totals.total ? Math.round((totals.answered / totals.total) * 100) : 0,
      timeSpentSeconds: calculateLiveTimeSpentSeconds(),
      answers: state.answers,
      answerList: buildAnswerList(),
      flagged: Object.keys(state.flagged).map(Number).sort((a, b) => a - b),
      notes: state.notes || ""
    };
  }

  /* ---------------------------------------------- 
  CALCULATE LIVE TIME SPENT SECONDS 
  ---------------------------------------------- */
  function calculateLiveTimeSpentSeconds() {
    if (!state.student.startedAt) return 0;
    const started = new Date(state.student.startedAt).getTime();
    if (!Number.isFinite(started)) return 0;
    return Math.max(0, Math.round((Date.now() - started) / 1000));
  }

  /* ---------------------------------------------- 
  BUILD EXPORT PAYLOAD 
  ---------------------------------------------- */
  function buildExportPayload() {
    const answerList = buildAnswerList();
    return {
      examId: "brighton-b2-rue-final",
      examTitle: "Brighton B2 Reading and Use of English Final Exam",
      studentName: state.student.name,
      classId: state.student.classId,
      answers: state.answers,
      answerList,
      flagged: Object.keys(state.flagged).map(Number).sort((a, b) => a - b),
      notes: state.notes || "",
      startedAt: state.student.startedAt || "",
      submittedAt: state.submittedAt,
      timeSpentSeconds: calculateTimeSpentSeconds(),
      progress: examParts.map(part => ({ partId: part.id, label: part.label, ...getProgress(part) }))
    };
  }

  /* ---------------------------------------------- 
  BUILD ANSWER LIST 
  ---------------------------------------------- */
  function buildAnswerList() {
    return examParts.flatMap(part => {
      const partNumber = Number(String(part.id).replace("part", ""));
      return part.items.map(item => ({
        part: partNumber,
        partId: part.id,
        question: item.q,
        answer: getAnswer(part.id, item.q) || ""
      }));
    });
  }

  /* ---------------------------------------------- 
  CALCULATE TIME SPENT SECONDS 
  ---------------------------------------------- */
  function calculateTimeSpentSeconds() {
    if (!state.student.startedAt || !state.submittedAt) return null;
    const started = new Date(state.student.startedAt).getTime();
    const submitted = new Date(state.submittedAt).getTime();
    if (!Number.isFinite(started) || !Number.isFinite(submitted)) return null;
    return Math.max(0, Math.round((submitted - started) / 1000));
  }

  /* ---------------------------------------------- 
  SUBMIT PAYLOAD 
  ---------------------------------------------- */
  async function submitPayload(payload) {
    const message = { type: "BRIGHTON_B2_RUE_SUBMIT", payload };

    try {
      window.parent?.postMessage(message, "*");
    } catch (error) {
      console.warn("Could not post submission to parent window.", error);
    }

    const statusText = $("#submitStatusText");
    const statusBadge = $("#submitStatusBadge");
    const resultBox = $("#submissionResult");
    const config = window.BRIGHTON_SITE_CONFIG || {};
    const apiBase = (config.API_BASE_URL || "").replace(/\/$/, "");

    if (!apiBase || apiBase.includes("YOUR-WIX")) {
      statusBadge.textContent = "Local";
      statusText.textContent = "The exam is complete. Configure API_BASE_URL in config.js to save directly to Wix CMS.";
      resultBox.innerHTML = `<p class="muted-text">No Wix endpoint is configured yet. Tell your teacher before closing this page.</p>`;
      return;
    }

    try {
      const response = await fetch(`${apiBase}/submitExam`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok || data.success === false) {
        throw new Error(data.error || `HTTP ${response.status}`);
      }

      if (liveProgress && typeof liveProgress.markSubmitted === "function") await liveProgress.markSubmitted({ submissionId: data.submissionId || "", submittedAt: payload.submittedAt || new Date().toISOString() });
      statusBadge.textContent = "Saved";
      statusText.textContent = "Your answers have been recorded successfully.";
      resultBox.innerHTML = `
        <div class="submission-success">
          <h3>Answers recorded</h3>
          <p class="muted-text">Submission ID: ${escape(data.submissionId || "")}</p>
        </div>
      `;
      localStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      console.error("Submission failed", error);
      statusBadge.textContent = "Not saved";
      statusText.textContent = "The exam is complete, but it could not be saved to Wix. Tell your teacher before closing this page.";
      resultBox.innerHTML = `<p class="submit-error">Save error: ${escape(error.message || String(error))}</p>`;
    }
  }

  /* ---------------------------------------------- 
  PART HEADER 
  ---------------------------------------------- */
  function partHeader(part) {
    return `
      <div class="part-title-row">
        <div>
          <div class="part-kicker">${escape(part.label)}</div>
          <h2>${escape(part.title)}</h2>
        </div>
        <span class="question-range">${escape(part.range)}</span>
      </div>
    `;
  }

  /* ---------------------------------------------- 
  INSTRUCTION 
  ---------------------------------------------- */
  function instruction(text) {
    return `<div class="instruction-card"><strong>Instructions</strong><br>${escape(text)}</div>`;
  }

  /* ---------------------------------------------- 
  ATTACH DIVIDER 
  ---------------------------------------------- */
  function attachDivider(partId, gridSelector, stateKey) {
    const grid = $(gridSelector);
    const divider = $(`[data-divider="${partId}"]`);
    if (!grid || !divider) return;
    let active = false;

    const move = clientX => {
      if (!active) return;
      const rect = grid.getBoundingClientRect();
      const percent = ((clientX - rect.left) / rect.width) * 100;
      const clamped = Math.max(34, Math.min(70, percent));
      state.layout[stateKey] = Number(clamped.toFixed(1));
      grid.style.setProperty("--left", `${state.layout[stateKey]}%`);
      saveState();
    };

    divider.addEventListener("mousedown", event => {
      active = true;
      document.body.style.userSelect = "none";
      event.preventDefault();
    });
    window.addEventListener("mousemove", event => move(event.clientX));
    window.addEventListener("mouseup", () => {
      active = false;
      document.body.style.userSelect = "";
    });

    divider.addEventListener("touchstart", event => {
      active = true;
      event.preventDefault();
    }, { passive: false });
    window.addEventListener("touchmove", event => {
      if (event.touches[0]) move(event.touches[0].clientX);
    }, { passive: true });
    window.addEventListener("touchend", () => { active = false; });

    divider.addEventListener("keydown", event => {
      if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
      event.preventDefault();
      const delta = event.key === "ArrowRight" ? 2 : -2;
      state.layout[stateKey] = Math.max(34, Math.min(70, (state.layout[stateKey] || 54) + delta));
      grid.style.setProperty("--left", `${state.layout[stateKey]}%`);
      saveState();
    });
  }

  /* ---------------------------------------------- 
  SHOW TOAST 
  ---------------------------------------------- */
  function showToast(message) {
    dom.toast.textContent = message;
    dom.toast.classList.add("show");
    setTimeout(() => dom.toast.classList.remove("show"), 1600);
  }



  /* ---------------------------------------------- 
  NORMALIZE CLASS CODE 
  ---------------------------------------------- */
  function normalizeClassCode(value) {
    const raw = String(value || "").trim().toUpperCase();
    const compact = raw.replace(/[^A-Z0-9]+/g, "");
    const exact = compact.match(/^([A-Z])(\d+)$/);
    if (exact) return `${exact[1]}-${exact[2]}`;
    const loose = raw.match(/([A-Z])\D*(\d+)/);
    if (loose) return `${loose[1]}-${loose[2]}`;
    return raw;
  }

  /* ---------------------------------------------- 
  COUNT WORDS 
  ---------------------------------------------- */
  function countWords(text) {
    return String(text || "").trim().split(/\s+/).filter(Boolean).length;
  }

  /* ---------------------------------------------- 
  ESCAPE 
  ---------------------------------------------- */
  function escape(value) {
    return String(value ?? "").replace(/[&<>"]/g, char => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;"
    }[char]));
  }

  /* ---------------------------------------------- 
  ESCAPE ATTR 
  ---------------------------------------------- */
  function escapeAttr(value) {
    return escape(value).replace(/'/g, "&#39;");
  }

  /* ---------------------------------------------- 
  DEBOUNCE 
  ---------------------------------------------- */
  function debounce(fn, delay) {
    let timer;
    return (...args) => {
      clearTimeout(timer);
      timer = setTimeout(() => fn(...args), delay);
    };
  }
})();

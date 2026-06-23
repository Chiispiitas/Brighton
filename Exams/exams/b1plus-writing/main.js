
"use strict";
/* ==============================================
     Brighton English School
     Made by: David Santana
============================================== */

(() => {
  const exam = window.writingExam;
  const examParts = exam?.parts || [];
  const STORAGE_KEY = `${exam?.examId || "brighton-b1plus-writing-final"}:state:v1`;

  const App = window.BrightonApp || {};
  const $ = App.$ || ((selector, root = document) => root.querySelector(selector));
  const $$ = App.$$ || ((selector, root = document) => Array.from(root.querySelectorAll(selector)));

  const dom = {
    startScreen: $("#startScreen"),
    examShell: $("#examShell"),
    studentForm: $("#studentForm"),
    studentName: $("#studentName"),
    classId: $("#classId"),
    continueSavedBtn: $("#continueSavedBtn"),
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

  let state = createDefaultState();
  let saveTimer = null;
  let liveProgress = null;

  boot();

  /* ---------------------------------------------- 
  BOOT 
  ---------------------------------------------- */
  function boot() {
    const saved = loadState();
    if (saved && !saved.submitted) {
      state = saved;
      state.student.classId = normalizeClassCode(state.student.classId);
      dom.continueSavedBtn.classList.remove("hidden");
      dom.studentName.value = state.student.name || "";
      dom.classId.value = state.student.classId || "";
    }

    dom.studentForm.addEventListener("submit", event => {
      event.preventDefault();
      startExam(false);
    });
    dom.continueSavedBtn.addEventListener("click", () => startExam(true));
    dom.backBtn.addEventListener("click", goBack);
    dom.nextBtn.addEventListener("click", goNext);
    dom.flagBtn.addEventListener("click", toggleFlag);
    dom.notesBtn.addEventListener("click", openNotes);
    dom.menuBtn.addEventListener("click", openMenu);
    dom.closeMenuBtn.addEventListener("click", closeMenu);
    dom.closeMenuOptionBtn.addEventListener("click", closeMenu);
    dom.overviewBtn.addEventListener("click", openOverview);
    if (dom.submitMenuBtn) dom.submitMenuBtn.addEventListener("click", requestSubmitFromMenu);
    dom.resetBtn.addEventListener("click", resetTest);
    dom.sideMenu.addEventListener("click", event => { if (event.target === dom.sideMenu) closeMenu(); });
  }

  /* ---------------------------------------------- 
  START EXAM 
  ---------------------------------------------- */
  function startExam(continueSaved) {
    if (!continueSaved) {
      state = createDefaultState();
      state.student.name = dom.studentName.value.trim();
      state.student.classId = normalizeClassCode(dom.classId.value);
      dom.classId.value = state.student.classId;
      state.student.startedAt = new Date().toISOString();
    } else {
      state.student.name = dom.studentName.value.trim() || state.student.name;
      state.student.classId = normalizeClassCode(dom.classId.value || state.student.classId);
      dom.classId.value = state.student.classId;
      state.student.startedAt = state.student.startedAt || new Date().toISOString();
    }

    if (!state.student.name || !state.student.classId) {
      showToast("Enter your name and class ID");
      return;
    }

    dom.startScreen.classList.add("hidden");
    dom.examShell.classList.remove("hidden");
    renderApp();
    startLiveProgress();
    dom.mainContent.focus();
  }

  /* ---------------------------------------------- 
  CREATE DEFAULT STATE 
  ---------------------------------------------- */
  function createDefaultState() {
    const answers = {};
    examParts.forEach(part => {
      answers[part.id] = {};
      part.items.forEach(item => { answers[part.id][item.q] = getInitialAnswer(item); });
    });
    const firstPart = examParts[0] || { id: "part1", items: [{ q: 1 }] };
    const firstQuestion = firstPart.items?.[0]?.q || 1;
    return {
      version: 1,
      student: { name: "", classId: "", startedAt: "" },
      current: { partId: firstPart.id, question: firstQuestion },
      answers,
      flagged: {},
      notes: "",
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
      console.warn("Could not load saved writing state", error);
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
    return merged;
  }

  /* ---------------------------------------------- 
  SAVE STATE 
  ---------------------------------------------- */
  function saveState() {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(saveStateNow, 40);
  }

  /* ---------------------------------------------- 
  SAVE STATE NOW 
  ---------------------------------------------- */
  function saveStateNow() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }

  /* ---------------------------------------------- 
  RENDER APP 
  ---------------------------------------------- */
  function renderApp(options = {}) {
    ensureValidCurrent();
    updateHeader();
    renderMain();
    renderBottomNav();
    renderStepControls();
    saveState();
    if (options.scrollTop) dom.mainContent.scrollTo({ top: 0, behavior: "smooth" });
  }

  /* ---------------------------------------------- 
  ENSURE VALID CURRENT 
  ---------------------------------------------- */
  function ensureValidCurrent() {
    const part = getCurrentPart();
    if (!part) {
      const first = examParts[0];
      state.current = { partId: first?.id || "part1", question: first?.items?.[0]?.q || 1 };
      return;
    }
    const hasQuestion = part.items.some(item => Number(item.q) === Number(state.current.question));
    if (!hasQuestion) state.current.question = part.items[0]?.q || 1;
  }

  /* ---------------------------------------------- 
  UPDATE HEADER 
  ---------------------------------------------- */
  function updateHeader() {
    dom.headerStudent.textContent = state.student.name || "Student Name";
    dom.headerClass.textContent = state.student.classId || "Class ID";
    const q = getCurrentQuestionNumber();
    dom.flagBtn.classList.toggle("flagged", Boolean(state.flagged[q]));
  }

  /* ---------------------------------------------- 
  RENDER MAIN 
  ---------------------------------------------- */
  function renderMain() {
    const part = getCurrentPart();
    const item = getCurrentItem();
    if (!part || !item) {
      dom.mainContent.innerHTML = `<section class="exam-panel"><p>No writing data found.</p></section>`;
      return;
    }

    const panelHeader = `
      <section class="exam-panel">
        <div class="part-title-row">
          <div>
            <p class="part-kicker">${escapeHtml(part.label)}</p>
            <h2>${escapeHtml(part.title)}</h2>
          </div>
          <span class="question-range">${escapeHtml(part.range)}</span>
        </div>
        <div class="instruction-card"><strong>Instructions:</strong> ${escapeHtml(part.instruction)}</div>
    `;

    dom.mainContent.innerHTML = `${panelHeader}${renderWritingWorkspace(part, item)}${renderEndSubmitCard()}</section>`;
    bindEditor(part.id, item.q);
    bindEndSubmitCard();
  }

  /* ---------------------------------------------- 
  RENDER WRITING WORKSPACE 
  ---------------------------------------------- */
  function renderWritingWorkspace(part, item) {
    return `
      <div class="split-grid" style="--left: 44%;">
        <div class="split-column">
          ${renderPrompt(part, item)}
        </div>
        <div class="split-divider" aria-hidden="true"></div>
        <div class="split-column">
          ${renderEditor(part.id, item)}
        </div>
      </div>
    `;
  }

  /* ---------------------------------------------- 
  RENDER PROMPT 
  ---------------------------------------------- */
  function renderPrompt(part, item) {
    if (!item) return `<div class="prompt-card"><p>No task selected.</p></div>`;
    const image = item.imageSrc ? `
      <div class="picture-wrap">
        <img class="picture-img" src="${escapeAttr(item.imageSrc)}" alt="${escapeAttr(item.imageAlt || item.title)}" />
      </div>
    ` : "";
    const email = item.message ? `
      <div class="border-shadow email-card">
        <div class="email-meta">
          <strong>From</strong><span>${escapeHtml(item.emailFrom || "Tania")}</span>
          <strong>Subject</strong><span>${escapeHtml(item.emailSubject || "Your party")}</span>
        </div>
        <p class="email-body">${escapeHtml(item.message)}</p>
      </div>
    ` : "";
    const storyStarter = item.storyStarter ? `
      <div class="story-starter">${escapeHtml(item.storyStarter)}</div>
    ` : "";
    const details = buildCriteriaList(part, item);

    return `
      <article class="prompt-card">
        <h3>${escapeHtml(item.title)}</h3>
        <p>${escapeHtml(item.promptIntro || "")}</p>
        ${image}
        ${email}
        ${storyStarter}
        <div class="border-shadow">
          <p>${escapeHtml(item.task || "")}</p>
          ${details}
        </div>
        <p><strong>${escapeHtml(item.finalInstruction || item.task || "Write your answer.")}</strong></p>
      </article>
    `;
  }

  /* ---------------------------------------------- 
  BUILD CRITERIA LIST 
  ---------------------------------------------- */
  function buildCriteriaList(part, item) {
    if (part.type === "picture-description") {
      return `
        <ul class="criteria-list">
          <li>Write more than two sentences.</li>
          <li>Describe people, places, actions and details.</li>
          <li>Use present continuous where useful.</li>
        </ul>
      `;
    }
    if (part.type === "email") {
      return `
        <ul class="criteria-list">
          <li>Thank Tania for coming to your party.</li>
          <li>Answer her questions about the present, the time and food.</li>
          <li>Use a friendly informal style.</li>
        </ul>
      `;
    }
    if (part.type === "story") {
      return `
        <ul class="criteria-list">
          <li>Begin with the sentence given.</li>
          <li>Make the events clear.</li>
          <li>Use past tenses and linking words.</li>
        </ul>
      `;
    }
    return "";
  }

  /* ---------------------------------------------- 
  RENDER EDITOR 
  ---------------------------------------------- */
  function renderEditor(partId, item) {
    const answer = getEditorAnswer(partId, item);
    const wc = countWords(answer);
    return `
      <article class="editor-card">
        <div class="editor-head">
          <div>
            <h3><span class="q-badge">${item.q}</span> Your answer</h3>
            <p>${escapeHtml(item.wordRange || exam.wordRange)}. Your writing is saved automatically.</p>
          </div>
          <span class="task-type-pill">${escapeHtml(item.taskType)}</span>
        </div>
        <textarea class="writing-textarea" data-part-id="${escapeAttr(partId)}" data-question="${item.q}" data-story-starter="${escapeAttr(item.storyStarter || "")}" spellcheck="false" placeholder="Write your ${escapeAttr(item.taskType.toLowerCase())} here...">${escapeHtml(answer)}</textarea>
        <div class="editor-foot">
          <span>Question ${item.q}</span>
          <span class="word-count ${wordCountClass(wc, item)}" data-word-count>Words: ${wc}</span>
        </div>
      </article>
    `;
  }

  /* ---------------------------------------------- 
  BIND EDITOR 
  ---------------------------------------------- */
  function bindEditor(partId, question) {
    const textarea = $(".writing-textarea", dom.mainContent);
    if (!textarea) return;
    const item = findItem(partId, question);
    syncStoryStarter(textarea, item);
    textarea.addEventListener("input", () => {
      syncStoryStarter(textarea, item);
      setAnswer(partId, question, textarea.value);
      const wc = countWords(textarea.value);
      const counter = $("[data-word-count]", dom.mainContent);
      if (counter) {
        counter.textContent = `Words: ${wc}`;
        counter.className = `word-count ${wordCountClass(wc, item)}`;
      }
      renderBottomNav();
    });
    setTimeout(() => textarea.focus(), 40);
  }

  /* ---------------------------------------------- 
  RENDER BOTTOM NAV 
  ---------------------------------------------- */
  function renderBottomNav() {
    dom.bottomNav.innerHTML = examParts.map(part => {
      const progress = getProgress(part);
      const isActive = part.id === state.current.partId;
      return `
        <div class="part-nav-card ${isActive ? "active" : ""}" data-part-card="${escapeAttr(part.id)}">
          <div class="part-nav-top">
            <span class="part-nav-title">${escapeHtml(part.label)}</span>
            <span class="part-nav-progress">${progress.done} of ${progress.total}</span>
          </div>
          <div class="question-bubbles">
            ${part.items.map(item => renderQuestionPill(part, item)).join("")}
          </div>
        </div>
      `;
    }).join("");

    $$('[data-part-card]', dom.bottomNav).forEach(card => {
      card.addEventListener("click", event => {
        if (event.target.closest("[data-question-pill]")) return;
        const partId = card.dataset.partCard;
        const part = examParts.find(p => p.id === partId);
        const firstOpen = part.items.find(item => !hasMeaningfulAnswer(partId, item)) || part.items[0];
        state.current = { partId, question: firstOpen.q };
        renderApp({ scrollTop: true });
      });
    });

    $$('[data-question-pill]', dom.bottomNav).forEach(button => {
      button.addEventListener("click", event => {
        event.stopPropagation();
        state.current = { partId: button.dataset.partId, question: Number(button.dataset.questionPill) };
        renderApp({ scrollTop: true });
      });
    });
  }

  /* ---------------------------------------------- 
  RENDER QUESTION PILL 
  ---------------------------------------------- */
  function renderQuestionPill(part, item) {
    const active = part.id === state.current.partId && Number(item.q) === Number(getCurrentQuestionNumber());
    const answered = hasMeaningfulAnswer(part.id, item);
    const flagged = Boolean(state.flagged[item.q]);
    return `<button class="q-pill ${active ? "active" : ""} ${answered ? "answered" : ""} ${flagged ? "flagged" : ""}" data-part-id="${escapeAttr(part.id)}" data-question-pill="${item.q}" type="button" aria-label="Question ${item.q}">${item.q}</button>`;
  }

  /* ---------------------------------------------- 
  RENDER STEP CONTROLS 
  ---------------------------------------------- */
  function renderStepControls() {
    const order = getQuestionOrder();
    const currentIndex = order.findIndex(item => item.partId === state.current.partId && Number(item.question) === Number(getCurrentQuestionNumber()));
    dom.backBtn.disabled = currentIndex <= 0;
    const isLast = currentIndex === order.length - 1;
    dom.nextBtn.textContent = isLast ? "✓" : "→";
    dom.nextBtn.classList.toggle("finish", isLast);
    dom.nextBtn.setAttribute("aria-label", isLast ? "Finish exam" : "Next task");
  }

  /* ---------------------------------------------- 
  GO BACK 
  ---------------------------------------------- */
  function goBack() {
    const order = getQuestionOrder();
    const index = order.findIndex(item => item.partId === state.current.partId && Number(item.question) === Number(getCurrentQuestionNumber()));
    if (index > 0) {
      const previous = order[index - 1];
      state.current = previous;
      renderApp({ scrollTop: true });
    }
  }

  /* ---------------------------------------------- 
  GO NEXT 
  ---------------------------------------------- */
  function goNext() {
    const order = getQuestionOrder();
    const index = order.findIndex(item => item.partId === state.current.partId && Number(item.question) === Number(getCurrentQuestionNumber()));
    if (index < order.length - 1) {
      state.current = order[index + 1];
      renderApp({ scrollTop: true });
      return;
    }
    finishExam();
  }

  /* ---------------------------------------------- 
  GET QUESTION ORDER 
  ---------------------------------------------- */
  function getQuestionOrder() {
    return examParts.flatMap(part => part.items.map(item => ({ partId: part.id, question: item.q })));
  }

  /* ---------------------------------------------- 
  GET CURRENT PART 
  ---------------------------------------------- */
  function getCurrentPart() {
    return examParts.find(part => part.id === state.current.partId) || examParts[0];
  }

  /* ---------------------------------------------- 
  GET CURRENT ITEM 
  ---------------------------------------------- */
  function getCurrentItem() {
    const part = getCurrentPart();
    return part?.items?.find(item => Number(item.q) === Number(getCurrentQuestionNumber())) || part?.items?.[0];
  }

  /* ---------------------------------------------- 
  GET CURRENT QUESTION NUMBER 
  ---------------------------------------------- */
  function getCurrentQuestionNumber() {
    return Number(state.current.question || 1);
  }

  /* ---------------------------------------------- 
  FIND ITEM 
  ---------------------------------------------- */
  function findItem(partId, question) {
    const part = examParts.find(item => item.id === partId);
    return part?.items?.find(item => Number(item.q) === Number(question));
  }

  /* ---------------------------------------------- 
  IS LAST PART 
  ---------------------------------------------- */
  function isLastPart() {
    const order = getQuestionOrder();
    const last = order[order.length - 1];
    return Boolean(last && state.current.partId === last.partId && Number(state.current.question) === Number(last.question));
  }

  /* ---------------------------------------------- 
  GET ANSWER 
  ---------------------------------------------- */
  function getAnswer(partId, question) {
    return state.answers?.[partId]?.[question] || "";
  }

  /* ---------------------------------------------- 
  SET ANSWER 
  ---------------------------------------------- */
  function setAnswer(partId, question, value) {
    if (!state.answers[partId]) state.answers[partId] = {};
    state.answers[partId][question] = value;
    saveState();
    if (liveProgress) liveProgress.touch();
  }

  /* ---------------------------------------------- 
  GET INITIAL ANSWER 
  ---------------------------------------------- */
  function getInitialAnswer(item) {
    return item?.storyStarter ? `${item.storyStarter}\n\n` : "";
  }

  /* ---------------------------------------------- 
  GET EDITOR ANSWER 
  ---------------------------------------------- */
  function getEditorAnswer(partId, item) {
    const current = getAnswer(partId, item.q);
    const fixed = enforceStoryStarter(current, item?.storyStarter);
    if (fixed !== current) {
      if (!state.answers[partId]) state.answers[partId] = {};
      state.answers[partId][item.q] = fixed;
    }
    return fixed;
  }

  /* ---------------------------------------------- 
  ENFORCE STORY STARTER 
  ---------------------------------------------- */
  function enforceStoryStarter(value, starter) {
    const cleanStarter = String(starter || "").trim();
    const text = String(value || "");
    if (!cleanStarter) return text;
    if (!text.trim()) return `${cleanStarter}\n\n`;
    if (text.startsWith(cleanStarter)) {
      const rest = text.slice(cleanStarter.length);
      if (!rest || rest.startsWith("\n")) return text;
      return `${cleanStarter}\n\n${rest.trimStart()}`;
    }
    const rest = text.replace(cleanStarter, "").trimStart();
    return rest ? `${cleanStarter}\n\n${rest}` : `${cleanStarter}\n\n`;
  }

  /* ---------------------------------------------- 
  SYNC STORY STARTER 
  ---------------------------------------------- */
  function syncStoryStarter(textarea, item) {
    if (!item?.storyStarter) return;
    const before = textarea.value;
    const fixed = enforceStoryStarter(before, item.storyStarter);
    if (fixed === before) return;
    const oldCursor = textarea.selectionStart || before.length;
    textarea.value = fixed;
    const minCursor = item.storyStarter.length + 2;
    const newCursor = Math.max(minCursor, Math.min(fixed.length, oldCursor + (fixed.length - before.length)));
    try { textarea.setSelectionRange(newCursor, newCursor); } catch (error) { /* Ignore cursor errors on unsupported inputs. */ }
  }

  /* ---------------------------------------------- 
  HAS MEANINGFUL ANSWER 
  ---------------------------------------------- */
  function hasMeaningfulAnswer(partId, item) {
    if (!item) return false;
    const answer = getAnswer(partId, item.q);
    if (!item.storyStarter) return countWords(answer) > 0;
    const body = String(answer || "").replace(String(item.storyStarter || "").trim(), "").trim();
    return countWords(body) > 0;
  }

  /* ---------------------------------------------- 
  GET PROGRESS 
  ---------------------------------------------- */
  function getProgress(part) {
    const total = part.items.length;
    const done = part.items.filter(item => hasMeaningfulAnswer(part.id, item)).length;
    return { done, answered: done, total };
  }

  /* ---------------------------------------------- 
  TOGGLE FLAG 
  ---------------------------------------------- */
  function toggleFlag() {
    const q = getCurrentQuestionNumber();
    if (state.flagged[q]) delete state.flagged[q];
    else state.flagged[q] = true;
    updateHeader();
    renderBottomNav();
    saveState();
  }

  /* ---------------------------------------------- 
  OPEN NOTES 
  ---------------------------------------------- */
  function openNotes() {
    dom.modalRoot.classList.remove("hidden");
    dom.modalRoot.setAttribute("aria-hidden", "false");
    dom.modalRoot.innerHTML = `
      <div class="modal-card">
        <div class="modal-head">
          <h2>Notes</h2>
          <button class="icon-btn" data-close-modal aria-label="Close">×</button>
        </div>
        <p class="muted-text">These notes are submitted to the teacher with your writing.</p>
        <textarea class="notes-area" placeholder="Write optional notes here...">${escapeHtml(state.notes || "")}</textarea>
        <button class="primary-btn" data-save-notes>Save notes</button>
      </div>
    `;
    $("[data-close-modal]", dom.modalRoot).addEventListener("click", closeModal);
    $("[data-save-notes]", dom.modalRoot).addEventListener("click", () => {
      state.notes = $(".notes-area", dom.modalRoot).value;
      saveStateNow();
      closeModal();
      showToast("Notes saved");
    });
  }

  /* ---------------------------------------------- 
  OPEN OVERVIEW 
  ---------------------------------------------- */
  function openOverview() {
    closeMenu();
    dom.modalRoot.classList.remove("hidden");
    dom.modalRoot.setAttribute("aria-hidden", "false");
    const rows = getQuestionOrder().map(item => {
      const answer = getAnswer(item.partId, item.question);
      const words = countWords(answer);
      const currentItem = findItem(item.partId, item.question);
      return `
        <div class="choice-card ${item.partId === state.current.partId && Number(item.question) === Number(getCurrentQuestionNumber()) ? "active" : ""}">
          <div class="choice-top"><h4><span class="q-badge">${item.question}</span> ${escapeHtml(currentItem?.taskType || "Writing")}</h4></div>
          <p>${words} words ${state.flagged[item.question] ? " · flagged" : ""}</p>
        </div>
      `;
    }).join("");
    dom.modalRoot.innerHTML = `
      <div class="modal-card">
        <div class="modal-head">
          <h2>Writing overview</h2>
          <button class="icon-btn" data-close-modal aria-label="Close">×</button>
        </div>
        <div class="choice-list">${rows}</div>
      </div>
    `;
    $("[data-close-modal]", dom.modalRoot).addEventListener("click", closeModal);
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
    confirmSubmitWriting();
  }

  /* ---------------------------------------------- 
  CONFIRM SUBMIT WRITING 
  ---------------------------------------------- */
  function confirmSubmitWriting() {
    const confirmed = window.confirm("Submit your writing now? You will not be able to change your answers after submitting.");
    if (!confirmed) return;
    finishExam();
  }

  /* ---------------------------------------------- 
  RENDER END SUBMIT CARD 
  ---------------------------------------------- */
  function renderEndSubmitCard() {
    if (state.submitted || !isLastPart()) return "";
    if (!App.renderEndSubmitCard) return "";
    return App.renderEndSubmitCard({
      label: "Submit writing",
      body: "You can submit from here at any time. Check all four answers first, then send your writing to Brighton Database.",
      buttonText: "Submit writing",
      dataAttr: "data-submit-writing"
    });
  }

  /* ---------------------------------------------- 
  BIND END SUBMIT CARD 
  ---------------------------------------------- */
  function bindEndSubmitCard() {
    if (App.bindEndSubmitCard) return App.bindEndSubmitCard(dom.mainContent, confirmSubmitWriting, "[data-submit-writing]");
    const button = $("[data-submit-writing]", dom.mainContent);
    if (!button) return;
    button.addEventListener("click", confirmSubmitWriting);
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
  RESET TEST 
  ---------------------------------------------- */
  function resetTest() {
    const confirmed = window.confirm("Reset this writing test? This will clear all answers, flags and notes saved on this device.");
    if (!confirmed) return;
    localStorage.removeItem(STORAGE_KEY);
    location.reload();
  }

  /* ---------------------------------------------- 
  FINISH EXAM 
  ---------------------------------------------- */
  function finishExam() {
    const missing = getQuestionOrder().filter(item => !hasMeaningfulAnswer(item.partId, findItem(item.partId, item.question)));
    if (missing.length) {
      const list = missing.map(item => `Question ${item.question}`).join(", ");
      const ok = window.confirm(`${list} appears to be empty. Submit anyway?`);
      if (!ok) return;
    }
    state.submitted = true;
    state.submittedAt = new Date().toISOString();
    saveStateNow();

    const payload = buildExportPayload();
    dom.mainContent.innerHTML = `
      <section class="finish-screen">
        <div class="finish-card">
          <p class="eyebrow">Exam finished</p>
          <h2>Submitting your writing</h2>
          <p id="submitStatusText" class="start-copy" style="margin-left:auto;margin-right:auto;">Please wait while the platform records your writing in Brighton Database.</p>
          <div class="submission-status-line"><strong id="submitStatusBadge">Saving</strong><span>Brighton Database</span></div>
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
    if (liveProgress) liveProgress.stop();
    liveProgress = window.BrightonLiveProgress.create({
      examId: exam.examId,
      examTitle: exam.title,
      skill: exam.skill,
      level: exam.level,
      touchDelayMs: 3500,
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
      answerList: buildWritingAnswerList(),
      writingSamples: buildWritingSamples(),
      flagged: Object.keys(state.flagged || {}).map(Number).sort((a, b) => a - b),
      notes: state.notes || ""
    };
  }

  /* ---------------------------------------------- 
  BUILD WRITING ANSWER LIST 
  ---------------------------------------------- */
  function buildWritingAnswerList() {
    return buildWritingSamples().map(sample => ({
      part: sample.part,
      partId: sample.partId,
      question: sample.question,
      answer: sample.answer
    }));
  }

  /* ---------------------------------------------- 
  BUILD WRITING SAMPLES 
  ---------------------------------------------- */
  function buildWritingSamples(includeEmpty = true) {
    const samples = [];
    examParts.forEach(part => {
      part.items.forEach(item => samples.push(buildWritingSample(part.id, item)));
    });
    return includeEmpty ? samples : samples.filter(sample => String(sample.answer || "").trim());
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
    const writingSamples = buildWritingSamples(true);
    return {
      examId: exam.examId,
      examTitle: exam.title,
      level: exam.level,
      skill: exam.skill,
      maxScore: exam.maxScore,
      studentName: state.student.name,
      classId: state.student.classId,
      answers: state.answers,
      answerList: writingSamples.map(sample => ({ part: sample.part, partId: sample.partId, question: sample.question, answer: sample.answer })),
      writingSamples,
      flagged: Object.keys(state.flagged).map(Number).sort((a, b) => a - b),
      notes: state.notes || "",
      startedAt: state.student.startedAt || "",
      submittedAt: state.submittedAt,
      timeSpentSeconds: calculateTimeSpentSeconds(),
      progress: examParts.map(part => ({ partId: part.id, label: part.label, ...getProgress(part) }))
    };
  }

  /* ---------------------------------------------- 
  BUILD WRITING SAMPLE 
  ---------------------------------------------- */
  function buildWritingSample(partId, item) {
    const partNumber = Number(String(partId).replace("part", ""));
    const answer = getAnswer(partId, item.q) || "";
    return {
      part: partNumber,
      partId,
      question: item.q,
      label: `Part ${partNumber}`,
      taskType: item.taskType,
      title: item.title,
      sourceTopic: item.sourceTopic,
      prompt: buildPromptText(item),
      answer,
      wordCount: countWords(answer)
    };
  }

  /* ---------------------------------------------- 
  BUILD PROMPT TEXT 
  ---------------------------------------------- */
  function buildPromptText(item) {
    const pieces = [item.promptIntro, item.question, item.task, item.message, item.storyStarter, item.finalInstruction].filter(Boolean);
    return pieces.join("\n\n");
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
    const message = { type: "BRIGHTON_B1PLUS_WRITING_SUBMIT", payload };
    try { window.parent?.postMessage(message, "*"); } catch (error) { console.warn("Could not post submission to parent window.", error); }

    const statusText = $("#submitStatusText");
    const statusBadge = $("#submitStatusBadge");
    const resultBox = $("#submissionResult");
    const config = window.BRIGHTON_SITE_CONFIG || {};
    const apiBase = (config.API_BASE_URL || "").replace(/\/$/, "");

    if (!apiBase || apiBase.includes("YOUR-WIX")) {
      statusBadge.textContent = "Local";
      statusText.textContent = "The exam is complete. Configure API_BASE_URL in config.js to save directly to Brighton Database.";
      resultBox.innerHTML = `<p class="muted-text">No Brighton Database endpoint is configured yet. Tell your teacher before closing this page.</p>`;
      return;
    }

    try {
      const response = await fetch(`${apiBase}/submitExam`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || data.success === false) throw new Error(data.error || `HTTP ${response.status}`);
      if (liveProgress) await liveProgress.markSubmitted({ submissionId: data.submissionId || "", submittedAt: payload.submittedAt || new Date().toISOString() });
      statusBadge.textContent = "Saved";
      statusText.textContent = "Your writing has been recorded successfully.";
      resultBox.innerHTML = `
        <div class="submission-success">
          <h3>Writing recorded</h3>
          <p class="muted-text">Submission ID: ${escapeHtml(data.submissionId || "")}</p>
        </div>
      `;
      localStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      console.error("Submission failed", error);
      statusBadge.textContent = "Not saved";
      statusText.textContent = "The exam is complete, but it could not be saved to Brighton Database. Tell your teacher before closing this page.";
      resultBox.innerHTML = `<p class="submit-error">Save error: ${escapeHtml(error.message || String(error))}</p>`;
    }
  }

  /* ---------------------------------------------- 
  NORMALIZE CLASS CODE 
  ---------------------------------------------- */
  function normalizeClassCode(value) {
    return App.normalizeClassCode ? App.normalizeClassCode(value) : String(value || "").trim().toUpperCase();
  }

  /* ---------------------------------------------- 
  COUNT WORDS 
  ---------------------------------------------- */
  function countWords(text) {
    return App.countWords ? App.countWords(text) : String(text || "").trim().split(/\s+/).filter(Boolean).length;
  }

  /* ---------------------------------------------- 
  WORD COUNT CLASS 
  ---------------------------------------------- */
  function wordCountClass(count, item = getCurrentItem()) {
    if (!count) return "";
    const min = Number(item?.minWords || 0);
    const max = Number(item?.maxWords || 0);
    if (min && count < min) return "too-short";
    if (max && count > max) return "too-long";
    return min || max ? "ok" : "";
  }

  /* ---------------------------------------------- 
  SHOW TOAST 
  ---------------------------------------------- */
  function showToast(message) {
    dom.toast.textContent = message;
    dom.toast.classList.add("show");
    clearTimeout(showToast.timer);
    showToast.timer = setTimeout(() => dom.toast.classList.remove("show"), 1800);
  }

  /* ---------------------------------------------- 
  ESCAPE HTML 
  ---------------------------------------------- */
  function escapeHtml(value) {
    return App.escapeHtml ? App.escapeHtml(value) : String(value ?? "");
  }

  /* ---------------------------------------------- 
  ESCAPE ATTR 
  ---------------------------------------------- */
  function escapeAttr(value) {
    return App.escapeAttr ? App.escapeAttr(value) : escapeHtml(value).replace(/'/g, "&#39;");
  }
})();

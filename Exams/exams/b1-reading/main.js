"use strict";
/* ==============================================
     Brighton English School
     Made by: David Santana
============================================== */

(() => {
  const STORAGE_KEY = "brighton-b1-reading-exam-state-v1";
  const EXAM_ID = "brighton-b1-reading-final";
  const EXAM_TITLE = "Brighton B1 Reading Final Exam";
  const LEVEL = "B1";
  const SKILL = "Reading";
  const MAX_SCORE = 32;
  const examParts = window.examParts || [];
  const App = window.BrightonApp || {};
  const $ = App.$ || ((selector, root = document) => root.querySelector(selector));
  const $$ = App.$$ || ((selector, root = document) => Array.from(root.querySelectorAll(selector)));

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

  const renderers = {
    part1: renderPartOne,
    part2: renderPartTwo,
    part3: renderPartThree,
    part4: renderPartFour,
    part5: renderPartFive,
    part6: renderPartSix
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
    dom.submitMenuBtn.addEventListener("click", requestSubmitFromMenu);
    dom.resetBtn.addEventListener("click", resetTest);
    dom.sideMenu.addEventListener("click", event => { if (event.target === dom.sideMenu) closeMenu(); });
    document.addEventListener("keydown", handleKeyboard);

    if (state.student.name) showExam();
  }

  /* ----------------------------------------------
  HANDLE KEYBOARD
  ---------------------------------------------- */
  function handleKeyboard(event) {
    if (dom.examShell.classList.contains("hidden")) return;
    const tag = document.activeElement?.tagName?.toLowerCase();
    const isTyping = tag === "input" || tag === "textarea" || tag === "select";
    if (event.key === "Escape") {
      closeModal();
      closeMenu();
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
  }

  /* ----------------------------------------------
  START EXAM
  ---------------------------------------------- */
  function startExam(name, classId) {
    const normalizedClassId = normalizeClassCode(classId);
    if (!name || !normalizedClassId) {
      showToast("Enter your name and class ID");
      return;
    }
    state.student.name = name;
    state.student.classId = normalizedClassId;
    dom.classId.value = normalizedClassId;
    if (!state.student.startedAt) state.student.startedAt = new Date().toISOString();
    saveStateNow();
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
      (part.items || []).forEach(item => { answers[part.id][item.q] = ""; });
    });
    return {
      version: 1,
      student: { name: "", classId: "", startedAt: "" },
      current: { partId: examParts[0]?.id || "part1", itemIndex: 0 },
      answers,
      flagged: {},
      notes: "",
      layout: { part3Left: 58, part4Left: 58 },
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
      return mergeState(createDefaultState(), JSON.parse(raw));
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
    return merged;
  }

  /* ----------------------------------------------
  SAVE STATE
  ---------------------------------------------- */
  function saveState() {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(saveStateNow, 30);
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
    renderMain(getCurrentPart(), options);
    renderBottomNav();
    renderStepControls();
    saveState();
  }

  /* ----------------------------------------------
  RENDER MAIN
  ---------------------------------------------- */
  function renderMain(part, options = {}) {
    const renderer = renderers[part?.id];
    if (!renderer) {
      dom.mainContent.innerHTML = `<section class="exam-panel"><p>Renderer missing.</p></section>`;
      return;
    }
    dom.mainContent.innerHTML = `${renderer(part)}${renderEndSubmitCard()}`;
    bindMainEvents(part);
    bindEndSubmitCard();
    if (options.scrollTop !== false) dom.mainContent.scrollTop = 0;
  }

  /* ----------------------------------------------
  RENDER PART ONE
  ---------------------------------------------- */
  function renderPartOne(part) {
    const item = getCurrentItem();
    return `
      <section class="exam-panel part-one">
        ${partHeader(part)}
        ${instruction(part.instruction)}
        <div class="short-text-layout">
          <article class="visual-card short-text-card">
            <p class="eyebrow">${escapeHtml(item.context)}</p>
            <img class="short-text-image" src="${escapeAttr(item.image)}" alt="${escapeAttr(item.title)}" />
            <div class="short-text-body">
              <h3>${escapeHtml(item.title)}</h3>
              <p>${escapeHtml(item.text)}</p>
            </div>
          </article>
          <aside class="question-card active fixed-question-card">
            <h4><span class="q-badge">${item.q}</span> ${escapeHtml(item.stem)}</h4>
            ${renderChoiceRows(part.id, item)}
          </aside>
        </div>
      </section>
    `;
  }

  /* ----------------------------------------------
  RENDER PART TWO
  ---------------------------------------------- */
  function renderPartTwo(part) {
    return `
      <section class="exam-panel part-two">
        ${partHeader(part)}
        ${instruction(part.instruction)}
        <div class="matching-layout">
          <section class="people-list">
            ${part.items.map(item => `
              <article class="person-card ${getCurrentQuestionNumber() === item.q ? "active" : ""}" data-question-card="${item.q}">
                <img src="${escapeAttr(item.image)}" alt="${escapeAttr(item.name)}" />
                <div>
                  <h3><span class="q-badge">${item.q}</span> ${escapeHtml(item.name)}</h3>
                  <p>${escapeHtml(item.text)}</p>
                  <label class="match-select-label" for="match-${item.q}">Answer</label>
                  <select id="match-${item.q}" class="match-select" data-select-answer data-part-id="${part.id}" data-q="${item.q}">
                    <option value="">Choose</option>
                    ${part.options.map(option => `<option value="${option.letter}" ${getAnswer(part.id, item.q) === option.letter ? "selected" : ""}>${option.letter}</option>`).join("")}
                  </select>
                </div>
              </article>
            `).join("")}
          </section>
          <aside class="texts-list options-panel">
            <h3>${escapeHtml(part.optionsTitle)}</h3>
            ${part.options.map(option => `
              <article class="option-text ${isOptionUsed(part.id, option.letter) ? "used" : ""}">
                <h4>${escapeHtml(option.letter)} ${escapeHtml(option.title)}</h4>
                <p>${escapeHtml(option.text)}</p>
              </article>
            `).join("")}
          </aside>
        </div>
      </section>
    `;
  }

  /* ----------------------------------------------
  RENDER PART THREE
  ---------------------------------------------- */
  function renderPartThree(part) {
    return `
      <section class="exam-panel part-three">
        ${partHeader(part)}
        ${instruction(part.instruction)}
        <div class="split-grid reading-split" style="--left: ${state.layout.part3Left || 58}%">
          <article class="split-column">
            <div class="reading-text">
              <img class="article-image" src="${escapeAttr(part.image)}" alt="${escapeAttr(part.articleTitle)}" />
              <h3>${escapeHtml(part.articleTitle)}</h3>
              ${part.text.map(paragraph => `<p>${escapeHtml(paragraph)}</p>`).join("")}
            </div>
          </article>
          <div class="split-divider" aria-hidden="true"></div>
          <aside class="split-column">
            <div class="question-stack">
              ${part.items.map(item => `
                <article class="question-card ${getCurrentQuestionNumber() === item.q ? "active" : ""}" data-question-card="${item.q}">
                  <h4><span class="q-badge">${item.q}</span> ${escapeHtml(item.stem)}</h4>
                  ${renderChoiceRows(part.id, item)}
                </article>
              `).join("")}
            </div>
          </aside>
        </div>
      </section>
    `;
  }

  /* ----------------------------------------------
  RENDER PART FOUR
  ---------------------------------------------- */
  function renderPartFour(part) {
    return `
      <section class="exam-panel part-four">
        ${partHeader(part)}
        ${instruction(part.instruction)}
        <div class="split-grid reading-split gap-split" style="--left: ${state.layout.part4Left || 58}%">
          <article class="split-column">
            <div class="reading-text gapped-text">
              <img class="article-image" src="${escapeAttr(part.image)}" alt="${escapeAttr(part.articleTitle)}" />
              <h3>${escapeHtml(part.articleTitle)}</h3>
              ${renderInlineText(part, "sentence")}
            </div>
          </article>
          <div class="split-divider" aria-hidden="true"></div>
          <aside class="split-column">
            <div class="side-list sentence-bank">
              <h3>Sentences</h3>
              ${part.sentences.map(sentence => `
                <article class="sentence-option ${isOptionUsed(part.id, sentence.letter) ? "used" : ""}">
                  <h4>${escapeHtml(sentence.letter)}</h4>
                  <p>${escapeHtml(sentence.text)}</p>
                </article>
              `).join("")}
            </div>
          </aside>
        </div>
      </section>
    `;
  }

  /* ----------------------------------------------
  RENDER PART FIVE
  ---------------------------------------------- */
  function renderPartFive(part) {
    return `
      <section class="exam-panel part-five">
        ${partHeader(part)}
        ${instruction(part.instruction)}
        <div class="cloze-layout">
          <article class="reading-text cloze-text">
            <h3>${escapeHtml(part.articleTitle)}</h3>
            ${renderInlineText(part, "choice")}
          </article>
          <aside class="question-stack cloze-options-stack">
            ${part.items.map(item => `
              <article class="question-card ${getCurrentQuestionNumber() === item.q ? "active" : ""}" data-question-card="${item.q}">
                <h4><span class="q-badge">${item.q}</span> Choose the correct word.</h4>
                ${renderChoiceRows(part.id, item)}
              </article>
            `).join("")}
          </aside>
        </div>
      </section>
    `;
  }

  /* ----------------------------------------------
  RENDER PART SIX
  ---------------------------------------------- */
  function renderPartSix(part) {
    return `
      <section class="exam-panel part-six">
        ${partHeader(part)}
        ${instruction(part.instruction)}
        <div class="open-cloze-layout">
          <article class="reading-text cloze-text open-cloze-text">
            <h3>${escapeHtml(part.articleTitle)}</h3>
            ${renderInlineText(part, "open")}
          </article>
        </div>
      </section>
    `;
  }

  /* ----------------------------------------------
  PART HEADER
  ---------------------------------------------- */
  function partHeader(part) {
    return `
      <div class="part-title-row">
        <div>
          <p class="part-kicker">${escapeHtml(part.label)}</p>
          <h2>${escapeHtml(part.title)}</h2>
        </div>
        <span class="question-range">${escapeHtml(part.range)}</span>
      </div>
    `;
  }

  /* ----------------------------------------------
  INSTRUCTION
  ---------------------------------------------- */
  function instruction(text) {
    return `<div class="instruction-card"><strong>Instructions:</strong> ${escapeHtml(text)}</div>`;
  }

  /* ----------------------------------------------
  RENDER CHOICE ROWS
  ---------------------------------------------- */
  function renderChoiceRows(partId, item) {
    return `<div class="choice-rows">
      ${Object.entries(item.options || {}).map(([letter, text]) => {
        const checked = getAnswer(partId, item.q) === letter;
        return `
          <label class="choice-row ${checked ? "selected" : ""}">
            <input type="radio" name="q-${item.q}" value="${escapeAttr(letter)}" data-choice-answer data-part-id="${escapeAttr(partId)}" data-q="${item.q}" ${checked ? "checked" : ""} />
            <span class="choice-letter">${escapeHtml(letter)}</span>
            <span>${escapeHtml(text)}</span>
          </label>
        `;
      }).join("")}
    </div>`;
  }

  /* ----------------------------------------------
  RENDER INLINE TEXT
  ---------------------------------------------- */
  function renderInlineText(part, mode) {
    return `<p>${part.text.map(piece => {
      if (piece.type === "text") return escapeHtml(piece.value);
      if (mode === "open") {
        return `<input class="inline-input open-gap-input" data-open-answer data-part-id="${escapeAttr(part.id)}" data-q="${piece.q}" value="${escapeAttr(getAnswer(part.id, piece.q))}" maxlength="24" aria-label="Question ${piece.q}" />`;
      }
      if (mode === "sentence") {
        return renderInlineSelect(part, piece.q, part.sentences || [], "sentence");
      }
      const item = (part.items || []).find(entry => Number(entry.q) === Number(piece.q));
      const options = Object.entries(item?.options || {}).map(([letter, text]) => ({ letter, text }));
      return renderInlineSelect(part, piece.q, options, "choice");
    }).join("")}</p>`;
  }

  /* ----------------------------------------------
  RENDER INLINE SELECT
  ---------------------------------------------- */
  function renderInlineSelect(part, question, options, mode) {
    const answer = getAnswer(part.id, question);
    return `
      <select class="inline-input gap-select" data-select-answer data-part-id="${escapeAttr(part.id)}" data-q="${question}" aria-label="Question ${question}">
        <option value="">${question}</option>
        ${options.map(option => {
          const letter = option.letter;
          const label = mode === "sentence" ? letter : `${letter} ${option.text}`;
          return `<option value="${escapeAttr(letter)}" ${answer === letter ? "selected" : ""}>${escapeHtml(label)}</option>`;
        }).join("")}
      </select>
    `;
  }

  /* ----------------------------------------------
  BIND MAIN EVENTS
  ---------------------------------------------- */
  function bindMainEvents(part) {
    $$('[data-choice-answer]', dom.mainContent).forEach(input => {
      input.addEventListener("change", () => {
        setAnswer(input.dataset.partId, input.dataset.q, input.value);
        renderApp({ scrollTop: false });
      });
    });

    $$('[data-select-answer]', dom.mainContent).forEach(select => {
      select.addEventListener("change", () => {
        setAnswer(select.dataset.partId, select.dataset.q, select.value);
        renderApp({ scrollTop: false });
      });
    });

    $$('[data-open-answer]', dom.mainContent).forEach(input => {
      input.addEventListener("input", () => {
        setAnswer(input.dataset.partId, input.dataset.q, input.value.trim());
        renderBottomNav();
        renderStepControls();
      });
      input.addEventListener("focus", () => {
        goToQuestion(Number(input.dataset.q), { render: false });
      });
    });

    $$('[data-question-card]', dom.mainContent).forEach(card => {
      card.addEventListener("click", event => {
        if (event.target.closest("input, select, button, label")) return;
        goToQuestion(Number(card.dataset.questionCard));
      });
    });

    restoreCurrentFocus(part);
  }

  /* ----------------------------------------------
  RESTORE CURRENT FOCUS
  ---------------------------------------------- */
  function restoreCurrentFocus(part) {
    const q = getCurrentQuestionNumber();
    const current = dom.mainContent.querySelector(`[data-question-card="${q}"]`);
    if (current) current.classList.add("active");
    if (part.id === "part6") {
      const input = dom.mainContent.querySelector(`[data-open-answer][data-q="${q}"]`);
      if (input) setTimeout(() => input.focus(), 20);
    }
  }

  /* ----------------------------------------------
  RENDER BOTTOM NAV
  ---------------------------------------------- */
  function renderBottomNav() {
    dom.bottomNav.innerHTML = examParts.map(part => {
      const progress = getProgress(part);
      const active = part.id === state.current.partId;
      return `
        <div class="part-nav-card ${active ? "active" : ""}" data-part-card="${escapeAttr(part.id)}">
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
        const part = examParts.find(item => item.id === card.dataset.partCard);
        if (!part) return;
        state.current = { partId: part.id, itemIndex: 0 };
        renderApp();
      });
    });

    $$('[data-question-pill]', dom.bottomNav).forEach(button => {
      button.addEventListener("click", event => {
        event.stopPropagation();
        goToQuestion(Number(button.dataset.questionPill));
      });
    });
  }

  /* ----------------------------------------------
  RENDER QUESTION PILL
  ---------------------------------------------- */
  function renderQuestionPill(part, item) {
    const active = part.id === state.current.partId && Number(item.q) === Number(getCurrentQuestionNumber());
    const answered = String(getAnswer(part.id, item.q) || "").trim().length > 0;
    const flagged = Boolean(state.flagged[item.q]);
    return `<button class="q-pill ${active ? "active" : ""} ${answered ? "answered" : ""} ${flagged ? "flagged" : ""}" data-question-pill="${item.q}" type="button" aria-label="Question ${item.q}">${item.q}</button>`;
  }

  /* ----------------------------------------------
  RENDER STEP CONTROLS
  ---------------------------------------------- */
  function renderStepControls() {
    const order = getQuestionOrder();
    const index = order.findIndex(entry => entry.partId === state.current.partId && entry.itemIndex === state.current.itemIndex);
    dom.backBtn.disabled = index <= 0;
    dom.nextBtn.textContent = index === order.length - 1 ? "✓" : "→";
    dom.nextBtn.classList.toggle("finish", index === order.length - 1);
  }

  /* ----------------------------------------------
  GET QUESTION ORDER
  ---------------------------------------------- */
  function getQuestionOrder() {
    return examParts.flatMap(part => part.items.map((item, itemIndex) => ({ partId: part.id, itemIndex, question: item.q })));
  }

  /* ----------------------------------------------
  GO TO QUESTION
  ---------------------------------------------- */
  function goToQuestion(question, options = {}) {
    const order = getQuestionOrder();
    const target = order.find(entry => Number(entry.question) === Number(question));
    if (!target) return;
    state.current = { partId: target.partId, itemIndex: target.itemIndex };
    if (options.render === false) {
      updateHeader();
      renderBottomNav();
      renderStepControls();
      saveState();
      return;
    }
    renderApp();
  }

  /* ----------------------------------------------
  GO PREVIOUS
  ---------------------------------------------- */
  function goPrevious() {
    const order = getQuestionOrder();
    const index = order.findIndex(entry => entry.partId === state.current.partId && entry.itemIndex === state.current.itemIndex);
    if (index <= 0) return;
    const previous = order[index - 1];
    state.current = { partId: previous.partId, itemIndex: previous.itemIndex };
    renderApp();
  }

  /* ----------------------------------------------
  GO NEXT
  ---------------------------------------------- */
  function goNext() {
    const order = getQuestionOrder();
    const index = order.findIndex(entry => entry.partId === state.current.partId && entry.itemIndex === state.current.itemIndex);
    if (index < 0 || index >= order.length - 1) return;
    const next = order[index + 1];
    state.current = { partId: next.partId, itemIndex: next.itemIndex };
    renderApp();
  }

  /* ----------------------------------------------
  IS FINAL QUESTION
  ---------------------------------------------- */
  function isFinalQuestion() {
    const order = getQuestionOrder();
    const current = order[order.length - 1];
    return Boolean(current && current.partId === state.current.partId && current.itemIndex === state.current.itemIndex);
  }

  /* ----------------------------------------------
  ENSURE VALID CURRENT
  ---------------------------------------------- */
  function ensureValidCurrent() {
    const part = getCurrentPart();
    if (!part) {
      state.current = { partId: examParts[0]?.id || "part1", itemIndex: 0 };
      return;
    }
    const max = Math.max(0, part.items.length - 1);
    state.current.itemIndex = Math.max(0, Math.min(max, Number(state.current.itemIndex) || 0));
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
    return part?.items?.[state.current.itemIndex] || part?.items?.[0] || {};
  }

  /* ----------------------------------------------
  GET CURRENT QUESTION NUMBER
  ---------------------------------------------- */
  function getCurrentQuestionNumber() {
    return Number(getCurrentItem()?.q || 1);
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
    state.answers[partId][question] = String(value || "");
    const part = examParts.find(item => item.id === partId);
    const index = part?.items?.findIndex(item => Number(item.q) === Number(question));
    if (part && index >= 0) state.current = { partId, itemIndex: index };
    saveState();
    if (liveProgress) liveProgress.touch();
  }

  /* ----------------------------------------------
  IS OPTION USED
  ---------------------------------------------- */
  function isOptionUsed(partId, letter) {
    return Object.values(state.answers?.[partId] || {}).includes(letter);
  }

  /* ----------------------------------------------
  GET PROGRESS
  ---------------------------------------------- */
  function getProgress(part) {
    const total = part.items.length;
    const done = part.items.filter(item => String(getAnswer(part.id, item.q) || "").trim()).length;
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
        <p class="muted-text">These notes are submitted to the teacher with your exam.</p>
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
    dom.modalRoot.classList.remove("hidden");
    dom.modalRoot.setAttribute("aria-hidden", "false");
    const rows = getQuestionOrder().map(entry => {
      const part = examParts.find(item => item.id === entry.partId);
      const item = part?.items?.[entry.itemIndex];
      const answered = String(getAnswer(entry.partId, entry.question) || "").trim();
      const current = entry.partId === state.current.partId && entry.itemIndex === state.current.itemIndex;
      return `
        <button class="choice-card ${current ? "active" : ""}" data-overview-question="${entry.question}" type="button">
          <div class="choice-top"><h4><span class="q-badge">${entry.question}</span> ${escapeHtml(part?.label || "Part")}</h4></div>
          <p>${answered ? "Answered" : "Not answered"}${state.flagged[entry.question] ? " · flagged" : ""}</p>
        </button>
      `;
    }).join("");
    dom.modalRoot.innerHTML = `
      <div class="modal-card">
        <div class="modal-head">
          <h2>Question overview</h2>
          <button class="icon-btn" data-close-modal aria-label="Close">×</button>
        </div>
        <div class="choice-list">${rows}</div>
      </div>
    `;
    $("[data-close-modal]", dom.modalRoot).addEventListener("click", closeModal);
    $$('[data-overview-question]', dom.modalRoot).forEach(button => {
      button.addEventListener("click", () => {
        const q = Number(button.dataset.overviewQuestion);
        closeModal();
        goToQuestion(q);
      });
    });
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
  CLOSE MODAL
  ---------------------------------------------- */
  function closeModal() {
    dom.modalRoot.classList.add("hidden");
    dom.modalRoot.setAttribute("aria-hidden", "true");
    dom.modalRoot.innerHTML = "";
  }

  /* ----------------------------------------------
  REQUEST SUBMIT FROM MENU
  ---------------------------------------------- */
  function requestSubmitFromMenu() {
    closeMenu();
    showFinishScreen();
  }

  /* ----------------------------------------------
  RENDER END SUBMIT CARD
  ---------------------------------------------- */
  function renderEndSubmitCard() {
    if (state.submitted || !isFinalQuestion()) return "";
    if (App.renderEndSubmitCard) {
      return App.renderEndSubmitCard({
        label: "Submit reading exam",
        body: "Check your answers first, then send your exam to Brighton Database.",
        buttonText: "Submit exam",
        dataAttr: "data-submit-reading"
      });
    }
    return `<section class="end-submit-card"><h3>Ready to submit?</h3><button class="primary-btn" data-submit-reading type="button">Submit exam</button></section>`;
  }

  /* ----------------------------------------------
  BIND END SUBMIT CARD
  ---------------------------------------------- */
  function bindEndSubmitCard() {
    if (App.bindEndSubmitCard) return App.bindEndSubmitCard(dom.mainContent, confirmSubmit, "[data-submit-reading]");
    const button = $("[data-submit-reading]", dom.mainContent);
    if (button) button.addEventListener("click", confirmSubmit);
  }

  /* ----------------------------------------------
  SHOW FINISH SCREEN
  ---------------------------------------------- */
  function showFinishScreen() {
    confirmSubmit();
  }

  /* ----------------------------------------------
  CONFIRM SUBMIT
  ---------------------------------------------- */
  function confirmSubmit() {
    const missing = getQuestionOrder().filter(entry => !String(getAnswer(entry.partId, entry.question) || "").trim());
    const message = missing.length
      ? `${missing.length} question(s) appear to be empty. Submit anyway?`
      : "Submit your exam now? You will not be able to change your answers after submitting.";
    if (!window.confirm(message)) return;
    finishExam();
  }

  /* ----------------------------------------------
  FINISH EXAM
  ---------------------------------------------- */
  function finishExam() {
    state.submitted = true;
    state.submittedAt = new Date().toISOString();
    saveStateNow();
    const payload = buildExportPayload();
    dom.mainContent.innerHTML = `
      <section class="finish-screen">
        <div class="finish-card">
          <p class="eyebrow">Exam finished</p>
          <h2>Submitting your answers</h2>
          <p id="submitStatusText" class="start-copy" style="margin-left:auto;margin-right:auto;">Please wait while the platform records your exam in Brighton Database.</p>
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
      examId: EXAM_ID,
      examTitle: EXAM_TITLE,
      skill: SKILL,
      level: LEVEL,
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
      answerList: buildAnswerList(),
      flagged: Object.keys(state.flagged || {}).map(Number).sort((a, b) => a - b),
      notes: state.notes || ""
    };
  }

  /* ----------------------------------------------
  BUILD EXPORT PAYLOAD
  ---------------------------------------------- */
  function buildExportPayload() {
    return {
      examId: EXAM_ID,
      examTitle: EXAM_TITLE,
      level: LEVEL,
      skill: SKILL,
      maxScore: MAX_SCORE,
      studentName: state.student.name,
      classId: state.student.classId,
      answers: state.answers,
      answerList: buildAnswerList(),
      flagged: Object.keys(state.flagged || {}).map(Number).sort((a, b) => a - b),
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
    return getQuestionOrder().map(entry => ({
      part: Number(String(entry.partId).replace(/\D+/g, "")) || 0,
      partId: entry.partId,
      question: entry.question,
      answer: getAnswer(entry.partId, entry.question)
    }));
  }

  /* ----------------------------------------------
  SUBMIT PAYLOAD
  ---------------------------------------------- */
  async function submitPayload(payload) {
    const message = { type: "BRIGHTON_B1_READING_SUBMIT", payload };
    try { window.parent?.postMessage(message, "*"); } catch (error) { console.warn("Could not post submission to parent window.", error); }

    const statusText = $("#submitStatusText");
    const statusBadge = $("#submitStatusBadge");
    const resultBox = $("#submissionResult");
    const config = window.BRIGHTON_SITE_CONFIG || {};
    const apiBase = String(config.API_BASE_URL || "").replace(/\/$/, "");

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
      statusText.textContent = "Your exam has been recorded successfully.";
      resultBox.innerHTML = `
        <div class="submission-success">
          <h3>Exam recorded</h3>
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
  RESET TEST
  ---------------------------------------------- */
  function resetTest() {
    const confirmed = window.confirm("Reset this reading test? This will clear all answers, flags and notes saved on this device.");
    if (!confirmed) return;
    localStorage.removeItem(STORAGE_KEY);
    location.reload();
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
  NORMALIZE CLASS CODE
  ---------------------------------------------- */
  function normalizeClassCode(value) {
    return App.normalizeClassCode ? App.normalizeClassCode(value) : String(value || "").trim().toUpperCase();
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
    if (App.escapeHtml) return App.escapeHtml(value);
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  /* ----------------------------------------------
  ESCAPE ATTR
  ---------------------------------------------- */
  function escapeAttr(value) {
    return App.escapeAttr ? App.escapeAttr(value) : escapeHtml(value);
  }
})();

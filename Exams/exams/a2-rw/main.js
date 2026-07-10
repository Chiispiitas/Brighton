"use strict";
/* ==============================================
     Brighton English School
     Made by: David Santana
============================================== */

(() => {
  const STORAGE_KEY = "brighton-a2-rw-exam-state-v1";
  const EXAM_ID = "brighton-a2-rw-final";
  const EXAM_TITLE = "Brighton A2 Reading and Writing Final Exam";
  const SKILL = "Reading and Writing";
  const LEVEL = "A2";

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

    dom.mainContent.addEventListener("scroll", debounce(() => {
      state.scroll[state.current.partId] = dom.mainContent.scrollTop;
      saveState();
    }, 200));

    document.addEventListener("keydown", event => {
      if (dom.examShell.classList.contains("hidden")) return;
      const tag = document.activeElement?.tagName?.toLowerCase();
      const isTyping = tag === "input" || tag === "textarea";
      if (event.key === "Escape") {
        closeModal();
        closeMenu();
        closeChoicePopover();
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

    document.addEventListener("click", event => {
      if (!event.target.closest(".choice-popover, [data-choice-gap]")) closeChoicePopover();
    });

    if (state.student.name) showExam();
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
      selectedOption: null,
      layout: { part2Left: 46, part3Left: 56 },
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
      return mergeState(createDefaultState(), JSON.parse(raw));
    } catch (error) {
      console.warn("Could not load saved A2 exam state", error);
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
    ensureValidCurrent();
    const part = getCurrentPart();
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
    const renderer = renderers[part.id];
    if (!renderer) {
      dom.mainContent.innerHTML = `<section class="exam-panel"><p>Renderer missing for ${escape(part.id)}</p></section>`;
      return;
    }
    dom.mainContent.innerHTML = `${renderer(part)}${renderEndSubmitCard()}`;
    bindMainEvents(part);
    bindEndSubmitCard();
    if (options.restoreScroll) {
      requestAnimationFrame(() => { dom.mainContent.scrollTop = state.scroll[part.id] || 0; });
    } else {
      dom.mainContent.scrollTop = 0;
    }
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
        <div class="a2-sign-layout">
          <article class="visual-card sign-card">
            <p class="eyebrow">${escape(item.context)}</p>
            <div class="image-placeholder sign-placeholder">
              <div>
                <strong>${escape(item.visualTitle)}</strong>
                <span>${escape(item.visualText)}</span>
              </div>
            </div>
          </article>
          <aside class="question-card active fixed-question-card">
            <h4><span class="q-badge">${item.q}</span> ${escape(item.stem)}</h4>
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
        <div class="split-grid reading-split a2-match-split" style="--left: ${state.layout.part2Left || 46}%" data-resizable="part2">
          <article class="split-column">
            <div class="reading-text">
              <h3>${escape(part.articleTitle)}</h3>
              ${part.options.map(option => `
                <section class="person-text">
                  <h3>${escape(option.letter)} ${escape(option.name)}</h3>
                  <p>${escape(option.text)}</p>
                </section>
              `).join("")}
            </div>
          </article>
          <div class="split-divider" data-divider="part2" role="separator" aria-orientation="vertical" tabindex="0"></div>
          <aside class="split-column">
            <div class="question-stack">
              ${part.items.map(item => `
                <article class="question-card ${getCurrentQuestionNumber() === item.q ? "active" : ""}" data-question-card="${item.q}">
                  <h4><span class="q-badge">${item.q}</span> ${escape(item.stem)}</h4>
                  ${renderLetterChoiceRows(part.id, item, part.options)}
                </article>
              `).join("")}
            </div>
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
        <div class="split-grid reading-split" style="--left: ${state.layout.part3Left || 56}%" data-resizable="part3">
          <article class="split-column">
            <div class="reading-text">
              <div class="image-placeholder">Image placeholder: student in a new city / college street</div>
              <h3>${escape(part.articleTitle)}</h3>
              ${part.text.map(paragraph => `<p>${escape(paragraph)}</p>`).join("")}
            </div>
          </article>
          <div class="split-divider" data-divider="part3" role="separator" aria-orientation="vertical" tabindex="0"></div>
          <aside class="split-column">
            <div class="question-stack">
              ${part.items.map(item => `
                <article class="question-card ${getCurrentQuestionNumber() === item.q ? "active" : ""}" data-question-card="${item.q}">
                  <h4><span class="q-badge">${item.q}</span> ${escape(item.stem)}</h4>
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
        <article class="article-card cloze-text">
          <h3>${escape(part.articleTitle)}</h3>
          <p>${renderInlineText(part, "choice-gap")}</p>
        </article>
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
        <article class="article-card open-cloze-text">
          <h3>${escape(part.articleTitle)}</h3>
          <p>${renderInlineText(part, "open-gap")}</p>
        </article>
      </section>
    `;
  }

  /* ----------------------------------------------
  RENDER WRITING TASK
  ---------------------------------------------- */
  function renderWritingPart(part) {
    const item = part.items[0];
    const answer = getAnswer(part.id, item.q);
    const words = countWords(answer);
    return `
      <section class="exam-panel writing-panel">
        ${partHeader(part)}
        ${instruction(part.instruction)}
        <div class="writing-layout">
          <article class="article-card writing-prompt-card">
            <p class="eyebrow">Question ${item.q}</p>
            <h3>${escape(item.promptTitle)}</h3>
            ${item.prompt ? `<p>${escape(item.prompt)}</p>` : ""}
            ${item.pictures ? renderPictureStory(item.pictures) : ""}
            <ul class="checklist">
              ${item.checklist.map(point => `<li>${escape(point)}</li>`).join("")}
            </ul>
          </article>
          <aside class="article-card writing-answer-card">
            <div class="writing-meta-row">
              <strong>Your answer</strong>
              <span class="word-counter ${words >= item.minWords ? "word-ok" : "word-warning"}">${words} / ${item.minWords}+ words</span>
            </div>
            <textarea class="writing-area" data-writing-input data-part-id="${part.id}" data-q="${item.q}" placeholder="Write your answer here...">${escape(answer)}</textarea>
            <p class="muted-text">The text is saved automatically while you type.</p>
          </aside>
        </div>
      </section>
    `;
  }

  function renderPictureStory(pictures) {
    return `
      <div class="picture-story-row" aria-label="Picture story prompts">
        ${pictures.map(picture => `
          <div class="picture-card image-placeholder">
            <strong>${escape(picture.title)}</strong>
            <span>${escape(picture.text)}</span>
          </div>
        `).join("")}
      </div>
    `;
  }

  const renderers = {
    part1: renderPartOne,
    part2: renderPartTwo,
    part3: renderPartThree,
    part4: renderPartFour,
    part5: renderPartFive,
    part6: renderWritingPart,
    part7: renderWritingPart
  };

  /* ----------------------------------------------
  BIND MAIN EVENTS
  ---------------------------------------------- */
  function bindMainEvents(part) {
    $$('[data-choice-answer]', dom.mainContent).forEach(input => {
      input.addEventListener("change", () => setAnswer(input.dataset.partId, Number(input.dataset.q), input.value));
    });

    $$('[data-open-input]', dom.mainContent).forEach(input => {
      input.addEventListener("focus", () => goToQuestion(Number(input.dataset.q), { render: false }));
      input.addEventListener("input", () => setAnswer(input.dataset.partId, Number(input.dataset.q), input.value, { render: false }));
    });

    $$('[data-writing-input]', dom.mainContent).forEach(textarea => {
      textarea.addEventListener("focus", () => goToQuestion(Number(textarea.dataset.q), { render: false }));
      textarea.addEventListener("input", () => {
        setAnswer(textarea.dataset.partId, Number(textarea.dataset.q), textarea.value, { render: false });
        updateWritingCounter(textarea);
      });
    });

    $$('[data-question-card]', dom.mainContent).forEach(card => {
      card.addEventListener("click", event => {
        if (event.target.closest("input, label, button, textarea")) return;
        goToQuestion(Number(card.dataset.questionCard), { render: false });
        $$('.question-card', dom.mainContent).forEach(el => el.classList.toggle("active", Number(el.dataset.questionCard) === Number(card.dataset.questionCard)));
      });
    });

    $$('[data-choice-gap]', dom.mainContent).forEach(button => {
      button.addEventListener("click", event => {
        event.stopPropagation();
        const q = Number(button.dataset.q);
        goToQuestion(q, { render: false });
        openChoicePopover(button, q, part);
      });
    });

    if (part.id === "part2") attachDivider("part2", ".split-grid[data-resizable='part2']", "part2Left");
    if (part.id === "part3") attachDivider("part3", ".split-grid[data-resizable='part3']", "part3Left");
  }

  /* ----------------------------------------------
  RENDER CHOICE ROWS
  ---------------------------------------------- */
  function renderChoiceRows(partId, item) {
    return Object.entries(item.options || {}).map(([letter, text]) => {
      const checked = getAnswer(partId, item.q) === letter;
      return `
        <label class="radio-row ${checked ? "selected" : ""}" data-answer-row data-q="${item.q}">
          <input type="radio" name="q-${item.q}" value="${escapeAttr(letter)}" ${checked ? "checked" : ""} data-choice-answer data-part-id="${partId}" data-q="${item.q}" />
          <span><strong>${escape(letter)}</strong> ${escape(text)}</span>
        </label>
      `;
    }).join("");
  }

  function renderLetterChoiceRows(partId, item, options) {
    return options.map(option => {
      const checked = getAnswer(partId, item.q) === option.letter;
      return `
        <label class="radio-row ${checked ? "selected" : ""}" data-answer-row data-q="${item.q}">
          <input type="radio" name="q-${item.q}" value="${escapeAttr(option.letter)}" ${checked ? "checked" : ""} data-choice-answer data-part-id="${partId}" data-q="${item.q}" />
          <span><strong>${escape(option.letter)}</strong> ${escape(option.name)}</span>
        </label>
      `;
    }).join("");
  }

  /* ----------------------------------------------
  RENDER INLINE TEXT
  ---------------------------------------------- */
  function renderInlineText(part, mode) {
    return (part.text || []).map(piece => {
      if (piece.type !== "gap") return escape(piece.value).replace(/\n/g, "<br>");
      const answer = getAnswer(part.id, piece.q);
      if (mode === "open-gap") {
        return `<input class="inline-input open-input ${getCurrentQuestionNumber() === piece.q ? "active" : ""}" value="${escapeAttr(answer)}" data-open-input data-part-id="${part.id}" data-q="${piece.q}" maxlength="30" aria-label="Question ${piece.q}" />`;
      }
      const item = part.items.find(question => question.q === piece.q);
      const display = answer ? item?.options?.[answer] : "";
      return `<button class="cloze-gap choice-gap ${answer ? "answered" : ""} ${getCurrentQuestionNumber() === piece.q ? "active" : ""}" type="button" data-choice-gap data-part-id="${part.id}" data-q="${piece.q}" aria-label="Question ${piece.q}, ${answer ? "answered" : "unanswered"}"><span class="gap-number">${piece.q}</span>${display ? `<span class="gap-answer">${escape(display)}</span>` : ""}</button>`;
    }).join("");
  }

  /* ----------------------------------------------
  CHOICE POPOVER
  ---------------------------------------------- */
  function openChoicePopover(anchor, q, part) {
    closeChoicePopover();
    const item = part.items.find(question => question.q === q);
    if (!item) return;
    const rect = anchor.getBoundingClientRect();
    const popover = document.createElement("div");
    popover.className = "choice-popover";
    popover.style.left = `${Math.min(window.innerWidth - 452, Math.max(12, rect.left))}px`;
    popover.style.top = `${Math.max(12, rect.top - 18)}px`;
    popover.innerHTML = `
      <div class="popover-title">Question ${q}</div>
      <div class="popover-options">
        ${Object.entries(item.options || {}).map(([letter, text]) => `
          <button type="button" class="option-btn ${getAnswer(part.id, q) === letter ? "selected" : ""}" data-popover-choice="${escapeAttr(letter)}">
            <strong>${escape(letter)}</strong> ${escape(text)}
          </button>
        `).join("")}
      </div>
      <button type="button" class="clear-choice" data-popover-clear>Clear answer</button>
    `;
    document.body.appendChild(popover);
    $$('[data-popover-choice]', popover).forEach(button => {
      button.addEventListener("click", () => {
        setAnswer(part.id, q, button.dataset.popoverChoice);
        closeChoicePopover();
      });
    });
    $('[data-popover-clear]', popover).addEventListener("click", () => {
      setAnswer(part.id, q, "");
      closeChoicePopover();
    });
  }

  function closeChoicePopover() {
    $$(".choice-popover").forEach(el => el.remove());
  }

  /* ----------------------------------------------
  UPDATE WRITING COUNTER
  ---------------------------------------------- */
  function updateWritingCounter(textarea) {
    const part = getPart(textarea.dataset.partId);
    const item = part?.items?.find(question => question.q === Number(textarea.dataset.q));
    const counter = $(".word-counter", dom.mainContent);
    if (!item || !counter) return;
    const words = countWords(textarea.value);
    counter.textContent = `${words} / ${item.minWords}+ words`;
    counter.classList.toggle("word-ok", words >= item.minWords);
    counter.classList.toggle("word-warning", words < item.minWords);
  }

  /* ----------------------------------------------
  DIVIDER
  ---------------------------------------------- */
  function attachDivider(key, gridSelector, layoutKey) {
    const grid = $(gridSelector);
    const divider = $(`[data-divider="${key}"]`);
    if (!grid || !divider) return;

    const update = clientX => {
      const rect = grid.getBoundingClientRect();
      const percent = ((clientX - rect.left) / rect.width) * 100;
      const clamped = Math.max(34, Math.min(70, percent));
      state.layout[layoutKey] = Number(clamped.toFixed(1));
      grid.style.setProperty("--left", `${state.layout[layoutKey]}%`);
      saveState();
    };

    divider.addEventListener("pointerdown", event => {
      event.preventDefault();
      divider.setPointerCapture?.(event.pointerId);
      const move = moveEvent => update(moveEvent.clientX);
      const stop = () => {
        window.removeEventListener("pointermove", move);
        window.removeEventListener("pointerup", stop);
      };
      window.addEventListener("pointermove", move);
      window.addEventListener("pointerup", stop);
    });

    divider.addEventListener("keydown", event => {
      if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
      event.preventDefault();
      const delta = event.key === "ArrowRight" ? 2 : -2;
      state.layout[layoutKey] = Math.max(34, Math.min(70, (state.layout[layoutKey] || 56) + delta));
      grid.style.setProperty("--left", `${state.layout[layoutKey]}%`);
      saveState();
    });
  }

  /* ----------------------------------------------
  NAVIGATION AND STATE HELPERS
  ---------------------------------------------- */
  function getCurrentPart() {
    return getPart(state.current.partId) || examParts[0];
  }

  function getPart(partId) {
    return examParts.find(part => part.id === partId);
  }

  function getCurrentItem() {
    const part = getCurrentPart();
    return part.items[state.current.itemIndex] || part.items[0];
  }

  function ensureValidCurrent() {
    const part = getCurrentPart();
    if (!part) return;
    state.current.itemIndex = Math.max(0, Math.min(part.items.length - 1, state.current.itemIndex));
  }

  function getCurrentQuestionNumber() {
    return getCurrentItem()?.q;
  }

  function getQuestionLocation(q) {
    for (const part of examParts) {
      const itemIndex = part.items.findIndex(item => item.q === q);
      if (itemIndex !== -1) return { partId: part.id, itemIndex };
    }
    return null;
  }

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

  function allItems() {
    return examParts.flatMap(part => part.items.map(item => ({ ...item, partId: part.id })));
  }

  function getLinearIndex() {
    const currentQ = getCurrentQuestionNumber();
    return allItems().findIndex(item => item.q === currentQ);
  }

  function goPrevious() {
    const items = allItems();
    const index = getLinearIndex();
    if (index > 0) goToQuestion(items[index - 1].q);
  }

  function goNext() {
    const items = allItems();
    const index = getLinearIndex();
    if (index < items.length - 1) goToQuestion(items[index + 1].q);
  }

  function isFirstQuestion() {
    return getLinearIndex() === 0;
  }

  function isFinalQuestion() {
    return getLinearIndex() === allItems().length - 1;
  }

  function isLastPart() {
    const lastPart = examParts[examParts.length - 1];
    return Boolean(lastPart && state.current.partId === lastPart.id);
  }

  function getAnswer(partId, q) {
    return state.answers?.[partId]?.[q] || "";
  }

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

  function isAnswered(part, q) {
    const value = getAnswer(part.id, q);
    return value !== null && value !== undefined && String(value).trim() !== "";
  }

  function getProgress(part) {
    const total = part.items.length;
    const answered = part.items.filter(item => isAnswered(part, item.q)).length;
    return { answered, total };
  }

  /* ----------------------------------------------
  HEADER AND BOTTOM NAV
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

  function renderBottomNav() {
    const currentQ = getCurrentQuestionNumber();
    dom.bottomNav.innerHTML = examParts.map(part => {
      const progress = getProgress(part);
      const active = part.id === state.current.partId;
      const bubbles = active ? `
        <div class="question-bubbles" aria-label="Questions in ${part.label}">
          ${part.items.map(item => {
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
            <button class="part-nav-title" data-part-id="${part.id}">${escape(part.label)}</button>
            <span class="part-nav-progress">${progress.answered} of ${progress.total}</span>
          </div>
          ${bubbles}
        </section>
      `;
    }).join("");

    $$('[data-jump-q]', dom.bottomNav).forEach(button => {
      button.addEventListener("click", event => {
        event.stopPropagation();
        goToQuestion(Number(button.dataset.jumpQ));
      });
    });
    $$('.part-nav-card', dom.bottomNav).forEach(card => {
      card.addEventListener("click", event => {
        if (event.target.closest("[data-jump-q]")) return;
        const part = getPart(card.dataset.partId);
        if (part?.items?.[0]) goToQuestion(part.items[0].q);
      });
    });
  }

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
      dom.nextBtn.disabled = false;
    }
  }

  function toggleFlag() {
    const q = getCurrentQuestionNumber();
    if (!q) return;
    if (state.flagged[q]) delete state.flagged[q];
    else state.flagged[q] = true;
    renderApp({ restoreScroll: true });
  }

  /* ----------------------------------------------
  MENU, MODALS AND OVERVIEW
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

  function openModal(html) {
    dom.modalRoot.innerHTML = html;
    dom.modalRoot.classList.remove("hidden");
    dom.modalRoot.setAttribute("aria-hidden", "false");
    $$('[data-close-modal]', dom.modalRoot).forEach(btn => btn.addEventListener("click", closeModal));
    dom.modalRoot.addEventListener("click", event => {
      if (event.target === dom.modalRoot) closeModal();
    }, { once: true });
  }

  function closeModal() {
    dom.modalRoot.classList.add("hidden");
    dom.modalRoot.setAttribute("aria-hidden", "true");
    dom.modalRoot.innerHTML = "";
  }

  function openMenu() {
    dom.sideMenu.classList.add("open");
    dom.sideMenu.setAttribute("aria-hidden", "false");
  }

  function closeMenu() {
    dom.sideMenu.classList.remove("open");
    dom.sideMenu.setAttribute("aria-hidden", "true");
  }

  function requestSubmitFromMenu() {
    closeMenu();
    confirmSubmitExam();
  }

  function confirmSubmitExam() {
    const confirmed = window.confirm("Submit your exam now? You will not be able to change your answers after submitting.");
    if (!confirmed) return;
    showFinishScreen();
  }

  function renderEndSubmitCard() {
    if (state.submitted || !isLastPart()) return "";
    return App.renderEndSubmitCard ? App.renderEndSubmitCard() : "";
  }

  function bindEndSubmitCard() {
    if (App.bindEndSubmitCard) return App.bindEndSubmitCard(dom.mainContent, confirmSubmitExam);
    const button = $("[data-submit-exam]", dom.mainContent);
    if (button) button.addEventListener("click", confirmSubmitExam);
  }

  function resetTest() {
    const confirmed = window.confirm("Reset this test? This will clear all answers, flags and notes saved on this device.");
    if (!confirmed) return;
    localStorage.removeItem(STORAGE_KEY);
    state = createDefaultState();
    window.location.reload();
  }

  /* ----------------------------------------------
  SUBMISSION
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

  function startLiveProgress() {
    if (!window.BrightonLiveProgress || state.submitted) return;
    if (liveProgress && typeof liveProgress.stop === "function") liveProgress.stop();
    liveProgress = window.BrightonLiveProgress.create({
      examId: EXAM_ID,
      examTitle: EXAM_TITLE,
      skill: SKILL,
      level: LEVEL,
      getProgress: buildLiveProgressSnapshot
    });
    liveProgress.start();
  }

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

  function calculateLiveTimeSpentSeconds() {
    if (!state.student.startedAt) return 0;
    const started = new Date(state.student.startedAt).getTime();
    if (!Number.isFinite(started)) return 0;
    return Math.max(0, Math.round((Date.now() - started) / 1000));
  }

  function buildExportPayload() {
    return {
      examId: EXAM_ID,
      examTitle: EXAM_TITLE,
      studentName: state.student.name,
      classId: state.student.classId,
      answers: state.answers,
      answerList: buildAnswerList(),
      flagged: Object.keys(state.flagged).map(Number).sort((a, b) => a - b),
      notes: state.notes || "",
      startedAt: state.student.startedAt || "",
      submittedAt: state.submittedAt,
      timeSpentSeconds: calculateTimeSpentSeconds(),
      progress: examParts.map(part => ({ partId: part.id, label: part.label, ...getProgress(part) }))
    };
  }

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

  function calculateTimeSpentSeconds() {
    if (!state.student.startedAt || !state.submittedAt) return null;
    const started = new Date(state.student.startedAt).getTime();
    const submitted = new Date(state.submittedAt).getTime();
    if (!Number.isFinite(started) || !Number.isFinite(submitted)) return null;
    return Math.max(0, Math.round((submitted - started) / 1000));
  }

  async function submitPayload(payload) {
    const message = { type: "BRIGHTON_A2_RW_SUBMIT", payload };
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
      if (!response.ok || data.success === false) throw new Error(data.error || `HTTP ${response.status}`);

      if (liveProgress && typeof liveProgress.markSubmitted === "function") {
        await liveProgress.markSubmitted({ submissionId: data.submissionId || "", submittedAt: payload.submittedAt || new Date().toISOString() });
      }
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
  SMALL HELPERS
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

  function instruction(text) {
    return `<div class="instruction-card"><strong>Instructions</strong><br>${escape(text)}</div>`;
  }

  function normalizeClassCode(value) {
    return App.normalizeClassCode ? App.normalizeClassCode(value) : String(value || "").trim().toUpperCase();
  }

  function countWords(text) {
    return App.countWords ? App.countWords(text) : String(text || "").trim().split(/\s+/).filter(Boolean).length;
  }

  function escape(value) {
    return App.escapeHtml ? App.escapeHtml(value) : String(value ?? "");
  }

  function escapeAttr(value) {
    return App.escapeAttr ? App.escapeAttr(value) : escape(value).replace(/'/g, "&#39;");
  }

  function debounce(fn, delay) {
    return App.debounce ? App.debounce(fn, delay) : (...args) => window.setTimeout(() => fn(...args), delay);
  }
})();

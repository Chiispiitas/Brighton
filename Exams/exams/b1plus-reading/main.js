"use strict";
/* ==============================================
     Brighton English School
     Made by: David Santana
============================================== */

(() => {
  const STORAGE_KEY = "brighton-b1plus-reading-exam-state-v1";
  const EXAM_ID = "brighton-b1plus-reading-final";
  const EXAM_TITLE = "Brighton B1+ Reading Final Exam";
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

  const helpers = {
    escape,
    escapeAttr,
    getAnswer,
    setAnswer,
    getCurrentQuestionNumber,
    goToQuestion,
    partHeader,
    instruction,
    renderChoiceRows,
    renderInlineText,
    renderEndSubmitCard,
    bindEndSubmitCard,
    attachDivider
  };

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

    document.addEventListener("keydown", handleKeyboard);

    if (state.student.name) showExam();
  }

  /* ---------------------------------------------- 
  HANDLE KEYBOARD 
  ---------------------------------------------- */
  function handleKeyboard(event) {
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
      selectedSentence: "",
      layout: { part3Left: 58, part4Left: 58 },
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
      return mergeState(createDefaultState(), parsed);
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
    const renderer = renderers[part.id];
    if (!renderer) {
      dom.mainContent.innerHTML = `<section class="exam-panel"><p>Renderer missing for ${escape(part.id)}</p></section>`;
      return;
    }
    dom.mainContent.innerHTML = `${renderer(part)}${renderEndSubmitCard()}`;
    bindMainEvents(part);
    bindEndSubmitCard();
    if (options.restoreScroll) {
      restoreScrollForPart(part.id);
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
        <div class="short-text-layout">
          <article class="visual-card short-text-card">
            <p class="eyebrow">${escape(item.context)}</p>
            <img class="short-text-image" src="${escapeAttr(item.image)}" alt="${escapeAttr(item.title)}" />
            <div class="short-text-body">
              <h3>${escape(item.title)}</h3>
              <p>${escape(item.text)}</p>
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
        <div class="matching-layout">
          <section class="people-list">
            ${part.items.map(item => `
              <article class="person-card ${getCurrentQuestionNumber() === item.q ? "active" : ""}" data-question-card="${item.q}">
                <img src="${escapeAttr(item.image)}" alt="${escapeAttr(item.name)}" />
                <div>
                  <h3><span class="q-badge">${item.q}</span> ${escape(item.name)}</h3>
                  <p>${escape(item.text)}</p>
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
            <h3>${escape(part.optionsTitle)}</h3>
            ${part.options.map(option => `
              <article class="option-text ${isOptionUsed(part.id, option.letter) ? "used" : ""}">
                <h4>${escape(option.letter)} ${escape(option.title)}</h4>
                <p>${escape(option.text)}</p>
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
        <div class="split-grid reading-split" style="--left: ${state.layout.part3Left || 58}%" data-resizable="part3">
          <article class="split-column">
            <div class="reading-text">
              <img class="article-image" src="${escapeAttr(part.image)}" alt="${escapeAttr(part.articleTitle)}" />
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
        <div class="split-grid reading-split gap-split" style="--left: ${state.layout.part4Left || 58}%" data-resizable="part4">
          <article class="split-column">
            <div class="reading-text gapped-text">
              <img class="article-image" src="${escapeAttr(part.image)}" alt="${escapeAttr(part.articleTitle)}" />
              <h3>${escape(part.articleTitle)}</h3>
              ${renderInlineText(part, "gap-drop")}
            </div>
          </article>
          <div class="split-divider" data-divider="part4" role="separator" aria-orientation="vertical" tabindex="0"></div>
          <aside class="split-column">
            <div class="side-list sentence-bank">
              <h3>Sentence options</h3>
              <p class="muted-text">Drag a sentence into a gap. Or click a sentence, then click a gap.</p>
              ${part.sentences.filter(sentence => !isOptionUsed(part.id, sentence.letter)).map(sentence => `
                <div class="sentence-card ${state.selectedSentence === sentence.letter ? "selected" : ""}" draggable="true" data-sentence="${sentence.letter}" tabindex="0" role="button">
                  <strong>${escape(sentence.letter)}</strong> ${escape(sentence.text)}
                </div>
              `).join("") || `<p class="muted-text">All sentence cards are currently placed.</p>`}
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
        <article class="article-card cloze-text">
          <h3>${escape(part.articleTitle)}</h3>
          <p>${renderInlineText(part, "choice-gap")}</p>
        </article>
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
        <article class="article-card open-cloze-text">
          <h3>${escape(part.articleTitle)}</h3>
          <p>${renderInlineText(part, "open-gap")}</p>
        </article>
      </section>
    `;
  }

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

  /* ---------------------------------------------- 
  RENDER INLINE TEXT 
  ---------------------------------------------- */
  function renderInlineText(part, mode) {
    return (part.text || []).map(piece => {
      if (piece.type !== "gap") {
        if (mode === "gap-drop") return `<p>${escape(piece.value)}</p>`;
        return escape(piece.value);
      }
      const answer = getAnswer(part.id, piece.q);
      if (mode === "open-gap") {
        return `<input class="inline-input open-input ${getCurrentQuestionNumber() === piece.q ? "active" : ""}" value="${escapeAttr(answer)}" data-open-input data-part-id="${part.id}" data-q="${piece.q}" maxlength="30" aria-label="Question ${piece.q}" />`;
      }
      if (mode === "gap-drop") {
        const sentence = part.sentences?.find(option => option.letter === answer);
        return `
          <div class="drop-zone ${answer ? "filled" : ""} ${getCurrentQuestionNumber() === piece.q ? "active" : ""}" data-gap-drop data-part-id="${part.id}" data-q="${piece.q}" tabindex="0" aria-label="Gap ${piece.q}">
            ${sentence ? `<div><strong>${piece.q}. ${escape(sentence.letter)}</strong> ${escape(sentence.text)}<br><small>Click to remove this sentence, or drag another one here.</small></div>` : `<strong>${piece.q}</strong>`}
          </div>
        `;
      }
      const item = part.items.find(question => question.q === piece.q);
      const display = answer ? item?.options?.[answer] : "";
      return `<button class="cloze-gap choice-gap ${answer ? "answered" : ""} ${getCurrentQuestionNumber() === piece.q ? "active" : ""}" type="button" data-choice-gap data-part-id="${part.id}" data-q="${piece.q}" aria-label="Question ${piece.q}, ${answer ? "answered" : "unanswered"}"><span class="gap-number">${piece.q}</span>${display ? `<span class="gap-answer">${escape(display)}</span>` : ""}</button>`;
    }).join("");
  }

  /* ---------------------------------------------- 
  BIND MAIN EVENTS 
  ---------------------------------------------- */
  function bindMainEvents(part) {
    $$('[data-choice-answer]', dom.mainContent).forEach(input => {
      input.addEventListener("change", () => setAnswer(input.dataset.partId, Number(input.dataset.q), input.value));
    });
    $$('[data-select-answer]', dom.mainContent).forEach(select => {
      select.addEventListener("change", () => setAnswer(select.dataset.partId, Number(select.dataset.q), select.value));
    });
    $$('[data-open-input]', dom.mainContent).forEach(input => {
      input.addEventListener("focus", () => goToQuestion(Number(input.dataset.q), { render: false }));
      input.addEventListener("input", () => setAnswer(input.dataset.partId, Number(input.dataset.q), input.value, { render: false }));
    });
    $$('[data-question-card]', dom.mainContent).forEach(card => {
      card.addEventListener("click", event => {
        if (event.target.closest("input, select, label")) return;
        goToQuestion(Number(card.dataset.questionCard), { render: false });
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
    let draggedSentence = null;
    $$('[data-sentence]', dom.mainContent).forEach(button => {
      button.addEventListener("dragstart", event => {
        draggedSentence = button.dataset.sentence;
        event.dataTransfer.setData("text/plain", draggedSentence);
        event.dataTransfer.effectAllowed = "move";
      });
      button.addEventListener("click", () => {
        rememberPart4ColumnScroll();
        state.selectedSentence = state.selectedSentence === button.dataset.sentence ? "" : button.dataset.sentence;
        saveState();
        renderApp({ restoreScroll: true });
      });
      button.addEventListener("keydown", event => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          button.click();
        }
      });
    });
    $$('[data-gap-drop]', dom.mainContent).forEach(button => {
      button.addEventListener("dragover", event => {
        event.preventDefault();
        button.classList.add("drag-over");
      });
      button.addEventListener("dragleave", () => button.classList.remove("drag-over"));
      button.addEventListener("drop", event => {
        event.preventDefault();
        button.classList.remove("drag-over");
        const sentence = event.dataTransfer.getData("text/plain") || draggedSentence;
        placeSentenceInGap(part, Number(button.dataset.q), sentence);
      });
      button.addEventListener("click", () => handleGapDropClick(part, Number(button.dataset.q)));
      button.addEventListener("keydown", event => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          handleGapDropClick(part, Number(button.dataset.q));
        }
      });
    });

    if (part.id === "part3") {
      attachDivider("part3", ".split-grid[data-resizable='part3']", "part3Left");
      bindPart3ColumnScroll();
    }
    if (part.id === "part4") {
      attachDivider("part4", ".split-grid[data-resizable='part4']", "part4Left");
      bindPart4ColumnScroll();
    }
  }

  /* ---------------------------------------------- 
  ATTACH DIVIDER 
  ---------------------------------------------- */
  function attachDivider(key, gridSelector, layoutKey) {
    const grid = $(gridSelector);
    const divider = $(`[data-divider="${key}"]`);
    if (!grid || !divider) return;

    const update = clientX => {
      const rect = grid.getBoundingClientRect();
      const percent = ((clientX - rect.left) / rect.width) * 100;
      const clamped = Math.max(40, Math.min(68, percent));
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
      const current = Number(state.layout[layoutKey] || 58);
      const next = event.key === "ArrowLeft" ? current - 2 : current + 2;
      state.layout[layoutKey] = Math.max(40, Math.min(68, next));
      grid.style.setProperty("--left", `${state.layout[layoutKey]}%`);
      saveState();
    });
  }

  /* ---------------------------------------------- 
  OPEN CHOICE POPOVER 
  ---------------------------------------------- */
  function openChoicePopover(anchor, q, part) {
    closeChoicePopover();
    const item = part.items.find(question => question.q === q);
    if (!item) return;
    const selected = getAnswer(part.id, q);
    const panel = document.createElement("div");
    panel.className = "choice-popover";
    panel.setAttribute("role", "dialog");
    panel.innerHTML = `
      <div class="popover-title">Question ${q}</div>
      <div class="popover-options">
        ${Object.entries(item.options).map(([letter, text]) => `
          <button class="option-btn ${selected === letter ? "selected" : ""}" data-choice="${escapeAttr(letter)}">
            ${escape(text)}
          </button>
        `).join("")}
      </div>
      <button class="clear-choice" data-clear="true">Clear answer</button>
    `;
    document.body.appendChild(panel);
    const rect = anchor.getBoundingClientRect();
    const panelRect = panel.getBoundingClientRect();
    const top = Math.max(10, rect.top - panelRect.height - 14);
    const left = Math.min(window.innerWidth - panelRect.width - 12, Math.max(12, rect.left));
    panel.style.top = `${top}px`;
    panel.style.left = `${left}px`;

    panel.addEventListener("click", event => {
      event.stopPropagation();
      const choiceBtn = event.target.closest("[data-choice]");
      const clearBtn = event.target.closest("[data-clear]");
      if (choiceBtn) {
        setAnswer(part.id, q, choiceBtn.dataset.choice);
        closeChoicePopover();
      }
      if (clearBtn) {
        setAnswer(part.id, q, "");
        closeChoicePopover();
      }
    });

    setTimeout(() => document.addEventListener("click", closeChoicePopover, { once: true }), 0);
  }

  /* ---------------------------------------------- 
  CLOSE CHOICE POPOVER 
  ---------------------------------------------- */
  function closeChoicePopover() {
    $$(".choice-popover").forEach(el => el.remove());
  }

  /* ---------------------------------------------- 
  HANDLE GAP DROP CLICK 
  ---------------------------------------------- */
  function handleGapDropClick(part, q) {
    goToQuestion(q, { render: false });
    const current = getAnswer(part.id, q);
    if (current && !state.selectedSentence) {
      placeSentenceInGap(part, q, "");
      return;
    }
    if (!state.selectedSentence) {
      showToast("Choose or drag a sentence first");
      return;
    }
    placeSentenceInGap(part, q, state.selectedSentence);
  }

  /* ---------------------------------------------- 
  PLACE SENTENCE IN GAP 
  ---------------------------------------------- */
  function placeSentenceInGap(part, q, sentenceLetter) {
    rememberPart4ColumnScroll();
    goToQuestion(q, { render: false });
    Object.keys(state.answers[part.id] || {}).forEach(key => {
      if (state.answers[part.id][key] === sentenceLetter) state.answers[part.id][key] = "";
    });
    state.answers[part.id][q] = sentenceLetter || "";
    state.selectedSentence = "";
    saveState();
    if (liveProgress && typeof liveProgress.touch === "function") liveProgress.touch();
    renderApp({ restoreScroll: true });
  }

  /* ---------------------------------------------- 
  REMEMBER CURRENT SCROLL 
  ---------------------------------------------- */
  function rememberCurrentScroll() {
    rememberScrollForPart(state.current.partId);
  }

  /* ---------------------------------------------- 
  REMEMBER SCROLL FOR PART 
  ---------------------------------------------- */
  function rememberScrollForPart(partId) {
    if (!partId || !dom.mainContent) return;
    state.scroll[partId] = dom.mainContent.scrollTop || 0;
    if (partId === "part3") rememberPart3ColumnScroll();
    if (partId === "part4") rememberPart4ColumnScroll();
  }

  /* ---------------------------------------------- 
  RESTORE SCROLL FOR PART 
  ---------------------------------------------- */
  function restoreScrollForPart(partId) {
    requestAnimationFrame(() => {
      dom.mainContent.scrollTop = state.scroll[partId] || 0;
      if (partId === "part3") restorePart3ColumnScroll();
      if (partId === "part4") restorePart4ColumnScroll();
    });
  }

  /* ---------------------------------------------- 
  REMEMBER PART 3 COLUMN SCROLL 
  ---------------------------------------------- */
  function rememberPart3ColumnScroll() {
    const columns = $$(".part-three .split-column", dom.mainContent);
    if (columns[0]) state.scroll.part3LeftColumn = columns[0].scrollTop;
    if (columns[1]) state.scroll.part3RightColumn = columns[1].scrollTop;
  }

  /* ---------------------------------------------- 
  RESTORE PART 3 COLUMN SCROLL 
  ---------------------------------------------- */
  function restorePart3ColumnScroll() {
    const columns = $$(".part-three .split-column", dom.mainContent);
    if (columns[0] && Number.isFinite(state.scroll.part3LeftColumn)) columns[0].scrollTop = state.scroll.part3LeftColumn;
    if (columns[1] && Number.isFinite(state.scroll.part3RightColumn)) columns[1].scrollTop = state.scroll.part3RightColumn;
  }

  /* ---------------------------------------------- 
  BIND PART 3 COLUMN SCROLL 
  ---------------------------------------------- */
  function bindPart3ColumnScroll() {
    const columns = $$(".part-three .split-column", dom.mainContent);
    columns.forEach((column, index) => {
      column.addEventListener("scroll", debounce(() => {
        if (index === 0) state.scroll.part3LeftColumn = column.scrollTop;
        if (index === 1) state.scroll.part3RightColumn = column.scrollTop;
        saveState();
      }, 120));
    });
  }

  /* ---------------------------------------------- 
  REMEMBER PART 4 COLUMN SCROLL 
  ---------------------------------------------- */
  function rememberPart4ColumnScroll() {
    const columns = $$(".part-four .split-column", dom.mainContent);
    if (columns[0]) state.scroll.part4LeftColumn = columns[0].scrollTop;
    if (columns[1]) state.scroll.part4RightColumn = columns[1].scrollTop;
  }

  /* ---------------------------------------------- 
  RESTORE PART 4 COLUMN SCROLL 
  ---------------------------------------------- */
  function restorePart4ColumnScroll() {
    requestAnimationFrame(() => {
      const columns = $$(".part-four .split-column", dom.mainContent);
      if (columns[0] && Number.isFinite(state.scroll.part4LeftColumn)) columns[0].scrollTop = state.scroll.part4LeftColumn;
      if (columns[1] && Number.isFinite(state.scroll.part4RightColumn)) columns[1].scrollTop = state.scroll.part4RightColumn;
    });
  }

  /* ---------------------------------------------- 
  BIND PART 4 COLUMN SCROLL 
  ---------------------------------------------- */
  function bindPart4ColumnScroll() {
    const columns = $$(".part-four .split-column", dom.mainContent);
    columns.forEach((column, index) => {
      column.addEventListener("scroll", debounce(() => {
        if (index === 0) state.scroll.part4LeftColumn = column.scrollTop;
        if (index === 1) state.scroll.part4RightColumn = column.scrollTop;
        saveState();
      }, 120));
    });
  }

  /* ---------------------------------------------- 
  IS OPTION USED 
  ---------------------------------------------- */
  function isOptionUsed(partId, letter) {
    return Object.values(state.answers[partId] || {}).includes(letter);
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
            <button class="part-nav-title" data-part-id="${part.id}">${part.label}</button>
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
  GET CURRENT ITEM 
  ---------------------------------------------- */
  function getCurrentItem() {
    const part = getCurrentPart();
    return part.items[state.current.itemIndex] || part.items[0];
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
    const previousPartId = state.current.partId;
    rememberCurrentScroll();
    state.current = location;
    if (liveProgress && typeof liveProgress.touch === "function") liveProgress.touch();
    if (options.render === false) {
      updateHeader();
      renderBottomNav();
      renderStepControls();
      saveState();
      return;
    }
    const shouldRestoreScroll = Object.prototype.hasOwnProperty.call(options, "restoreScroll")
      ? Boolean(options.restoreScroll)
      : previousPartId === location.partId;
    renderApp({ restoreScroll: shouldRestoreScroll });
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
  IS LAST PART 
  ---------------------------------------------- */
  function isLastPart() {
    const lastPart = examParts[examParts.length - 1];
    return Boolean(lastPart && state.current.partId === lastPart.id);
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
    rememberScrollForPart(partId);
    if (!state.answers[partId]) state.answers[partId] = {};
    state.answers[partId][q] = String(value || "");
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
        <p class="muted-text">Notes are saved locally on this device and are included in the final exam record.</p>
        <textarea id="notesArea" class="notes-area" placeholder="Type your private notes here..."></textarea>
      </div>
    `);
    const area = $("#notesArea");
    area.value = state.notes || "";
    area.addEventListener("input", () => {
      state.notes = area.value;
      saveState();
      if (liveProgress && typeof liveProgress.touch === "function") liveProgress.touch();
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
    if (state.submitted || !isLastPart()) return "";
    return App.renderEndSubmitCard ? App.renderEndSubmitCard({ title: "Ready to submit?", body: "You are in the final Reading part. Review your answers first, then send your exam to Brighton Database." }) : "";
  }

  /* ---------------------------------------------- 
  BIND END SUBMIT CARD 
  ---------------------------------------------- */
  function bindEndSubmitCard() {
    if (App.bindEndSubmitCard) return App.bindEndSubmitCard(dom.mainContent, confirmSubmitExam);
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
    if (state.submitted) return;
    state.submitted = true;
    state.submittedAt = new Date().toISOString();
    saveState();

    const payload = buildExportPayload();
    dom.mainContent.innerHTML = `
      <section class="finish-screen">
        <div class="finish-card finish-confirmation-card">
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
    if (liveProgress && typeof liveProgress.stop === "function") liveProgress.stop();
    liveProgress = window.BrightonLiveProgress.create({
      examId: EXAM_ID,
      examTitle: EXAM_TITLE,
      skill: "Reading",
      level: "B1+",
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
      examId: EXAM_ID,
      examTitle: EXAM_TITLE,
      studentName: state.student.name,
      classId: state.student.classId,
      level: "B1+",
      skill: "Reading",
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
    const message = { type: "BRIGHTON_B1PLUS_READING_SUBMIT", payload };

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
      statusText.textContent = "The exam is complete. Configure API_BASE_URL in config.js to save directly to Brighton Database.";
      resultBox.innerHTML = `<p class="muted-text">No database endpoint is configured yet. Tell your teacher before closing this page.</p>`;
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
      statusText.textContent = "The exam is complete, but it could not be saved to Brighton Database. Tell your teacher before closing this page.";
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
    return App.normalizeClassCode ? App.normalizeClassCode(value) : String(value || "").trim().toUpperCase();
  }

  /* ---------------------------------------------- 
  ESCAPE 
  ---------------------------------------------- */
  function escape(value) {
    return App.escapeHtml ? App.escapeHtml(value) : String(value ?? "").replace(/[&<>"]/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[char]));
  }

  /* ---------------------------------------------- 
  ESCAPE ATTR 
  ---------------------------------------------- */
  function escapeAttr(value) {
    return App.escapeAttr ? App.escapeAttr(value) : escape(value).replace(/'/g, "&#39;");
  }

  /* ---------------------------------------------- 
  DEBOUNCE 
  ---------------------------------------------- */
  function debounce(fn, delay) {
    return App.debounce ? App.debounce(fn, delay) : (...args) => window.setTimeout(() => fn(...args), delay);
  }
})();

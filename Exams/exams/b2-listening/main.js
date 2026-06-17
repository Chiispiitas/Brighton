"use strict";
/* ==============================================
     Brighton English School
     Made by: David Santana
============================================== */

(() => {
  const exam = window.listeningExam;
  const examParts = exam.parts || [];
  const STORAGE_KEY = "brighton-b2-listening-exam-state-v1";
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
    audioBadge: $("#audioBadge"),
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
    audioGate: $("#audioGate"),
    playAudioBtn: $("#playAudioBtn"),
    audioGateError: $("#audioGateError"),
    examAudio: $("#examAudio"),
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
      if (state.student.name) showExam({ needsAudioGate: !state.audio.startedThisSession });
    });

    dom.playAudioBtn.addEventListener("click", playAudioAndEnter);
    dom.examAudio.addEventListener("play", () => updateAudioBadge("Audio is playing"));
    dom.examAudio.addEventListener("ended", () => updateAudioBadge("Audio finished"));
    dom.examAudio.addEventListener("error", () => updateAudioBadge("Audio file not found"));

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
      state.scroll[state.current.partId] = dom.mainContent.scrollTop;
      saveState();
    }, 200));

    document.addEventListener("keydown", event => {
      if (dom.examShell.classList.contains("hidden")) return;
      const tag = document.activeElement?.tagName?.toLowerCase();
      const isTyping = tag === "input" || tag === "textarea" || tag === "select";
      if (event.key === "Escape") {
        closeModal();
        closeMenu();
        state.selectedOption = null;
        updateMatchingSelection();
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

    if (state.student.name) showExam({ needsAudioGate: !state.audio.startedThisSession });
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
    saveStateNow();
    showExam({ needsAudioGate: true });
  }

  /* ---------------------------------------------- 
  SHOW EXAM 
  ---------------------------------------------- */
  function showExam({ needsAudioGate = false } = {}) {
    dom.startScreen.classList.add("hidden");
    dom.examShell.classList.remove("hidden");
    renderApp({ restoreScroll: true });
    startLiveProgress();
    if (needsAudioGate) openAudioGate();
  }

  /* ---------------------------------------------- 
  OPEN AUDIO GATE 
  ---------------------------------------------- */
  function openAudioGate() {
    dom.audioGate.classList.remove("hidden");
    dom.audioGate.setAttribute("aria-hidden", "false");
    dom.audioGateError.classList.add("hidden");
    setTimeout(() => dom.playAudioBtn.focus(), 50);
  }

  /* ---------------------------------------------- 
  PLAY AUDIO AND ENTER 
  ---------------------------------------------- */
  async function playAudioAndEnter() {
    dom.audioGateError.classList.add("hidden");
    try {
      await dom.examAudio.play();
      state.audio.started = true;
      state.audio.startedThisSession = true;
      state.audio.startedAt = state.audio.startedAt || new Date().toISOString();
      saveStateNow();
      dom.audioGate.classList.add("hidden");
      dom.audioGate.setAttribute("aria-hidden", "true");
      updateAudioBadge("Audio is playing");
    } catch (error) {
      dom.audioGateError.textContent = "The audio could not start. Check that exams/b2-listening/audio.mp3 exists, then try again.";
      dom.audioGateError.classList.remove("hidden");
      updateAudioBadge("Audio error");
      console.error(error);
    }
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
      audio: { started: false, startedThisSession: false, startedAt: "" },
      current: { partId: examParts[0]?.id || "part1", itemIndex: 0 },
      answers,
      flagged: {},
      notes: "",
      selectedOption: null,
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
      console.warn("Could not load saved listening state", error);
      return null;
    }
  }

  /* ---------------------------------------------- 
  MERGE STATE 
  ---------------------------------------------- */
  function mergeState(base, saved) {
    const merged = { ...base, ...saved };
    merged.student = { ...base.student, ...(saved.student || {}) };
    merged.audio = { ...base.audio, ...(saved.audio || {}), startedThisSession: false };
    merged.current = { ...base.current, ...(saved.current || {}) };
    merged.answers = base.answers;
    Object.keys(saved.answers || {}).forEach(partId => {
      merged.answers[partId] = { ...(base.answers[partId] || {}), ...(saved.answers[partId] || {}) };
    });
    merged.flagged = { ...base.flagged, ...(saved.flagged || {}) };
    merged.scroll = { ...base.scroll, ...(saved.scroll || {}) };
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
    renderMain(options);
    renderBottomNav();
    renderStepControls();
    saveState();
  }

  /* ---------------------------------------------- 
  RENDER MAIN 
  ---------------------------------------------- */
  function renderMain(options = {}) {
    const part = getCurrentPart();
    if (!part) {
      dom.mainContent.innerHTML = `<section class="exam-panel"><p>No exam data found.</p></section>`;
      return;
    }
    let content = "";
    if (part.type === "multiple") content = renderMultiplePart(part);
    if (part.type === "gap") content = renderGapPart(part);
    if (part.type === "matching") content = renderMatchingPart(part);
    dom.mainContent.innerHTML = `${content}${renderEndSubmitCard()}`;
    attachMainHandlers(part);
    bindEndSubmitCard();
    if (options.restoreScroll) {
      requestAnimationFrame(() => { dom.mainContent.scrollTop = state.scroll[part.id] || 0; });
    } else {
      requestAnimationFrame(scrollActiveCardIntoView);
    }
  }

  /* ---------------------------------------------- 
  RENDER MULTIPLE PART 
  ---------------------------------------------- */
  function renderMultiplePart(part) {
    const activeQ = getCurrentQuestionNumber();
    const cards = part.items.map(item => {
      const selected = getAnswer(part.id, item.q);
      const options = Object.entries(item.options).map(([letter, text]) => `
        <label class="radio-row ${selected === letter ? "selected" : ""}">
          <input type="radio" name="q${item.q}" value="${letter}" ${selected === letter ? "checked" : ""} />
          <span><strong>${letter}</strong> ${escapeHtml(text)}</span>
        </label>
      `).join("");
      return `
        <article class="question-card ${activeQ === item.q ? "active" : ""}" data-card-q="${item.q}">
          <h4><span class="q-badge">${item.q}</span> ${item.context ? `<span class="question-context">${escapeHtml(item.context)}</span>` : ""}</h4>
          <p class="question-stem"><strong>${escapeHtml(item.stem)}</strong></p>
          <div class="radio-group" data-q="${item.q}">${options}</div>
        </article>
      `;
    }).join("");

    return `
      <section class="exam-panel part-multiple ${part.id}">
        ${partHeader(part)}
        ${instruction(part.instruction)}
        <div class="question-stack listening-question-stack">${cards}</div>
      </section>
    `;
  }

  /* ---------------------------------------------- 
  RENDER GAP PART 
  ---------------------------------------------- */
  function renderGapPart(part) {
    const activeQ = getCurrentQuestionNumber();
    const lines = part.items.map(item => {
      const value = getAnswer(part.id, item.q);
      const afterText = String(item.after || "");
      const afterClass = /^\s*[.,;:!?]+\s*$/.test(afterText)
        ? "gap-after punctuation-only"
        : /^\s*[.,;:!?]/.test(afterText)
          ? "gap-after starts-punctuation"
          : "gap-after";
      return `
        <p class="listening-gap-line ${activeQ === item.q ? "active" : ""}" data-gap-line-q="${item.q}">
          <span class="gap-before">${escapeHtml(item.before)}</span>
          <span class="gap-input-wrap">
            <input class="inline-input listening-input ${activeQ === item.q ? "active" : ""}" data-q="${item.q}" aria-label="Question ${item.q}" placeholder="${item.q}" value="${escapeAttr(value)}" autocomplete="off" spellcheck="false" />
            <span class="${afterClass}">${escapeHtml(item.after)}</span>
          </span>
        </p>
      `;
    }).join("");

    return `
      <section class="exam-panel part-gap part2">
        ${partHeader(part)}
        ${instruction(part.instruction)}
        <article class="article-card listening-gap-card">
          <h3>${escapeHtml(part.heading)}</h3>
          ${lines}
        </article>
      </section>
    `;
  }

  /* ---------------------------------------------- 
  RENDER MATCHING PART 
  ---------------------------------------------- */
  function renderMatchingPart(part) {
    const activeQ = getCurrentQuestionNumber();
    const used = new Set(part.items.map(item => getAnswer(part.id, item.q)).filter(Boolean));
    const rows = part.items.map(item => {
      const selected = getAnswer(part.id, item.q);
      const chosen = part.options.find(option => option.id === selected);
      return `
        <tr>
          <td>${escapeHtml(item.speaker)}</td>
          <td>
            <button class="matching-gap ${activeQ === item.q ? "active" : ""} ${selected ? "filled" : ""}" data-gap-q="${item.q}" type="button">
              <span class="gap-number">${item.q}</span>
              <span class="gap-choice">${chosen ? `<strong>${escapeHtml(chosen.id)}</strong> ${escapeHtml(chosen.text)}` : "Choose answer"}</span>
            </button>
          </td>
        </tr>
      `;
    }).join("");

    const options = part.options.map(option => {
      const disabled = used.has(option.id);
      return `
        <button class="sentence-card matching-option ${state.selectedOption === option.id ? "selected" : ""} ${disabled ? "used" : ""}" data-option-id="${option.id}" draggable="${disabled ? "false" : "true"}" type="button">
          <strong>${escapeHtml(option.id)}</strong> ${escapeHtml(option.text)}
        </button>
      `;
    }).join("");

    return `
      <section class="exam-panel part-matching part3">
        ${partHeader(part)}
        ${instruction(part.instruction)}
        <div class="matching-layout">
          <article class="white-card matching-table-card">
            <table class="matching-table">
              <tbody>${rows}</tbody>
            </table>
            <p class="muted-text">Click an option, then click a speaker box. Click a filled speaker box to clear it.</p>
          </article>
          <aside class="side-list matching-options">
            <h3>Answer options</h3>
            ${options}
          </aside>
        </div>
      </section>
    `;
  }

  /* ---------------------------------------------- 
  ATTACH MAIN HANDLERS 
  ---------------------------------------------- */
  function attachMainHandlers(part) {
    if (part.type === "multiple") {
      $$(".radio-group").forEach(group => {
        group.addEventListener("change", event => {
          const q = Number(group.dataset.q);
          setCurrentQuestion(q, { render: false });
          setAnswer(part.id, q, event.target.value, { render: false });
          updateRadioVisual(group, event.target.value);
        });
      });
      $$(".question-card[data-card-q]").forEach(card => {
        card.addEventListener("click", event => {
          if (!event.target.matches("input")) setCurrentQuestion(Number(card.dataset.cardQ), { render: false });
        });
      });
    }

    if (part.type === "gap") {
      $$(".listening-input").forEach(input => {
        input.addEventListener("focus", () => setCurrentQuestion(Number(input.dataset.q), { render: false }));
        input.addEventListener("input", () => setAnswer(part.id, Number(input.dataset.q), input.value, { render: false }));
      });
      $$(".listening-gap-line[data-gap-line-q]").forEach(line => {
        line.addEventListener("click", event => {
          if (event.target.matches("input")) return;
          const q = Number(line.dataset.gapLineQ);
          setCurrentQuestion(q, { render: false });
          $(`.listening-input[data-q="${q}"]`)?.focus();
        });
      });
    }

    if (part.type === "matching") attachMatchingHandlers(part);
  }

  /* ---------------------------------------------- 
  ATTACH MATCHING HANDLERS 
  ---------------------------------------------- */
  function attachMatchingHandlers(part) {
    let draggedId = null;
    $$(".matching-option[data-option-id]").forEach(button => {
      button.addEventListener("click", () => {
        if (button.classList.contains("used")) return;
        state.selectedOption = state.selectedOption === button.dataset.optionId ? null : button.dataset.optionId;
        saveState();
        updateMatchingSelection();
      });
      button.addEventListener("dragstart", event => {
        if (button.classList.contains("used")) return event.preventDefault();
        draggedId = button.dataset.optionId;
        event.dataTransfer.setData("text/plain", draggedId);
        event.dataTransfer.effectAllowed = "move";
      });
    });

    $$(".matching-gap[data-gap-q]").forEach(gap => {
      gap.addEventListener("dragover", event => {
        event.preventDefault();
        gap.classList.add("drag-over");
      });
      gap.addEventListener("dragleave", () => gap.classList.remove("drag-over"));
      gap.addEventListener("drop", event => {
        event.preventDefault();
        gap.classList.remove("drag-over");
        placeMatchingOption(part, Number(gap.dataset.gapQ), event.dataTransfer.getData("text/plain") || draggedId);
      });
      gap.addEventListener("click", () => {
        const q = Number(gap.dataset.gapQ);
        setCurrentQuestion(q, { render: false });
        const current = getAnswer(part.id, q);
        if (current && !state.selectedOption) {
          setAnswer(part.id, q, "");
          return;
        }
        if (state.selectedOption) placeMatchingOption(part, q, state.selectedOption);
      });
    });
  }

  /* ---------------------------------------------- 
  PLACE MATCHING OPTION 
  ---------------------------------------------- */
  function placeMatchingOption(part, q, optionId) {
    if (!optionId) return;
    part.items.forEach(item => {
      if (item.q !== q && getAnswer(part.id, item.q) === optionId) {
        setAnswer(part.id, item.q, "", { render: false });
      }
    });
    state.selectedOption = null;
    setCurrentQuestion(q, { render: false });
    setAnswer(part.id, q, optionId);
  }

  /* ---------------------------------------------- 
  UPDATE RADIO VISUAL 
  ---------------------------------------------- */
  function updateRadioVisual(group, selected) {
    $$(".radio-row", group).forEach(row => {
      row.classList.toggle("selected", row.querySelector("input")?.value === selected);
    });
    updateActiveHighlights();
    renderBottomNav();
  }

  /* ---------------------------------------------- 
  UPDATE MATCHING SELECTION 
  ---------------------------------------------- */
  function updateMatchingSelection() {
    $$(".matching-option").forEach(button => button.classList.toggle("selected", button.dataset.optionId === state.selectedOption));
  }

  /* ---------------------------------------------- 
  UPDATE ACTIVE HIGHLIGHTS 
  ---------------------------------------------- */
  function updateActiveHighlights() {
    const q = getCurrentQuestionNumber();
    $$(".question-card[data-card-q]").forEach(card => card.classList.toggle("active", Number(card.dataset.cardQ) === q));
    $$(".listening-gap-line[data-gap-line-q]").forEach(line => line.classList.toggle("active", Number(line.dataset.gapLineQ) === q));
    $$(".listening-input[data-q]").forEach(input => input.classList.toggle("active", Number(input.dataset.q) === q));
    $$(".matching-gap[data-gap-q]").forEach(gap => gap.classList.toggle("active", Number(gap.dataset.gapQ) === q));
    updateHeader();
  }

  /* ---------------------------------------------- 
  PART HEADER 
  ---------------------------------------------- */
  function partHeader(part) {
    return `
      <div class="part-title-row">
        <div>
          <div class="part-kicker">${escapeHtml(part.label)}</div>
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
    return `<div class="instruction-card"><strong>Instructions</strong><br>${escapeHtml(text)}</div>`;
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
  UPDATE AUDIO BADGE 
  ---------------------------------------------- */
  function updateAudioBadge(text) {
    dom.audioBadge.textContent = text;
    dom.audioBadge.classList.toggle("playing", text === "Audio is playing");
    dom.audioBadge.classList.toggle("ended", text === "Audio finished");
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
      card.addEventListener("click", () => {
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
    return part?.items?.[state.current.itemIndex]?.q;
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
  SET CURRENT QUESTION 
  ---------------------------------------------- */
  function setCurrentQuestion(q, options = {}) {
    const location = getQuestionLocation(q);
    if (!location) return;
    state.current = location;
    saveState();
    if (liveProgress && typeof liveProgress.touch === "function") liveProgress.touch();
    if (options.render === false) {
      updateActiveHighlights();
      renderBottomNav();
      renderStepControls();
      if (location.partId === "part1") requestAnimationFrame(scrollActiveCardIntoView);
      return;
    }
    renderApp({ restoreScroll: false });
  }

  /* ---------------------------------------------- 
  GO TO QUESTION 
  ---------------------------------------------- */
  function goToQuestion(q) {
    const previousPart = state.current.partId;
    const location = getQuestionLocation(q);
    if (!location) return;
    state.current = location;
    if (liveProgress && typeof liveProgress.touch === "function") liveProgress.touch();
    renderApp({ restoreScroll: previousPart === location.partId && location.partId !== "part1" });
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
        <p class="muted-text">Notes are saved locally on this device.</p>
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
        <h4>${escapeHtml(part.label)} <span class="muted-text">${getProgress(part).answered} of ${getProgress(part).total}</span></h4>
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
    return `
      <section class="end-submit-card" aria-label="Submit exam">
        <p class="eyebrow">Submit exam</p>
        <h3>Ready to submit?</h3>
        <p>You can submit from here at any time. Review your answers first, then send your exam to Brighton Database.</p>
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
    const confirmed = window.confirm("Reset this listening test? This will clear all answers, flags and notes saved on this device.");
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
    saveStateNow();

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
      examId: "brighton-b2-listening-final",
      examTitle: "Brighton B2 Listening Final Exam",
      skill: "Listening",
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
      examId: exam.examId,
      examTitle: exam.title,
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
    const message = { type: "BRIGHTON_B2_LISTENING_SUBMIT", payload };
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
          <p class="muted-text">Submission ID: ${escapeHtml(data.submissionId || "")}</p>
        </div>
      `;
      localStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      console.error("Submission failed", error);
      statusBadge.textContent = "Not saved";
      statusText.textContent = "The exam is complete, but it could not be saved to Wix. Tell your teacher before closing this page.";
      resultBox.innerHTML = `<p class="submit-error">Save error: ${escapeHtml(error.message || String(error))}</p>`;
    }
  }

  /* ---------------------------------------------- 
  SCROLL ACTIVE CARD INTO VIEW 
  ---------------------------------------------- */
  function scrollActiveCardIntoView() {
    const active = dom.mainContent.querySelector(".question-card.active, .listening-gap-line.active, .matching-gap.active");
    if (!active) return;
    active.scrollIntoView({ behavior: "smooth", block: "center" });
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
  ESCAPE HTML 
  ---------------------------------------------- */
  function escapeHtml(value) {
    return String(value ?? "").replace(/[&<>'"]/g, char => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;"
    }[char]));
  }

  /* ---------------------------------------------- 
  ESCAPE ATTR 
  ---------------------------------------------- */
  function escapeAttr(value) {
    return escapeHtml(value).replace(/`/g, "&#96;");
  }

  /* ---------------------------------------------- 
  DEBOUNCE 
  ---------------------------------------------- */
  function debounce(fn, wait) {
    let timer;
    return (...args) => {
      clearTimeout(timer);
      timer = setTimeout(() => fn(...args), wait);
    };
  }
})();

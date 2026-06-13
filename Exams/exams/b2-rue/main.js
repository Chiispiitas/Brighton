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
    resetBtn: $("#resetBtn"),
    modalRoot: $("#modalRoot"),
    toast: $("#toast")
  };

  let state = loadState() || createDefaultState();
  let saveTimer = null;

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

  function boot() {
    if (state.student.name) {
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

  function startExam(name, classId) {
    if (!name || !classId) return;
    state.student.name = name;
    state.student.classId = classId;
    if (!state.student.startedAt) state.student.startedAt = new Date().toISOString();
    saveState();
    showExam();
  }

  function showExam() {
    dom.startScreen.classList.add("hidden");
    dom.examShell.classList.remove("hidden");
    renderApp();
  }

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

  function saveState() {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(() => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    }, 30);
  }

  function renderApp(options = {}) {
    const part = getCurrentPart();
    ensureValidCurrent();
    updateHeader();
    renderMain(part, options);
    renderBottomNav();
    renderStepControls();
    saveState();
  }

  function renderMain(part, options = {}) {
    const renderer = window.PartRenderers?.[part.id];
    if (!renderer) {
      dom.mainContent.innerHTML = `<section class="exam-panel"><p>Renderer missing for ${escape(part.id)}</p></section>`;
      return;
    }
    dom.mainContent.innerHTML = renderer.render(part, state, helpers);
    renderer.afterRender?.(part, state, helpers);
    if (options.restoreScroll) {
      requestAnimationFrame(() => { dom.mainContent.scrollTop = state.scroll[part.id] || 0; });
    }
  }

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
    $$('.part-nav-title', dom.bottomNav).forEach(button => {
      button.addEventListener("click", () => {
        const part = getPart(button.dataset.partId);
        goToQuestion(part.items[0].q);
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
    }
  }

  function getCurrentPart() {
    return getPart(state.current.partId) || examParts[0];
  }

  function getPart(partId) {
    return examParts.find(part => part.id === partId);
  }

  function ensureValidCurrent() {
    const part = getCurrentPart();
    if (!part) return;
    if (state.current.itemIndex < 0) state.current.itemIndex = 0;
    if (state.current.itemIndex >= part.items.length) state.current.itemIndex = part.items.length - 1;
  }

  function getCurrentQuestionNumber() {
    const part = getCurrentPart();
    return part.items[state.current.itemIndex]?.q;
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
    if (options.render === false) {
      updateHeader();
      renderBottomNav();
      renderStepControls();
      saveState();
      return;
    }
    renderApp({ restoreScroll: false });
  }

  function getLinearIndex() {
    const currentQ = getCurrentQuestionNumber();
    return allItems().findIndex(item => item.q === currentQ);
  }

  function allItems() {
    return examParts.flatMap(part => part.items.map(item => ({ ...item, partId: part.id })));
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

  function getAnswer(partId, q) {
    return state.answers?.[partId]?.[q] || "";
  }

  function setAnswer(partId, q, value, options = {}) {
    if (!state.answers[partId]) state.answers[partId] = {};
    state.answers[partId][q] = value;
    saveState();
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

  function toggleFlag() {
    const q = getCurrentQuestionNumber();
    if (!q) return;
    if (state.flagged[q]) delete state.flagged[q];
    else state.flagged[q] = true;
    renderApp({ restoreScroll: true });
  }

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

  function resetTest() {
    const confirmed = window.confirm("Reset this test? This will clear all answers, flags and notes saved on this device.");
    if (!confirmed) return;
    localStorage.removeItem(STORAGE_KEY);
    state = createDefaultState();
    window.location.reload();
  }

  function showFinishScreen() {
    state.submitted = true;
    state.submittedAt = new Date().toISOString();
    saveState();

    const payload = buildExportPayload();
    const total = allItems().length;
    const answered = examParts.reduce((sum, part) => sum + getProgress(part).answered, 0);
    const flagged = Object.keys(state.flagged).length;

    dom.mainContent.innerHTML = `
      <section class="finish-screen">
        <div class="finish-card">
          <p class="eyebrow">Exam finished</p>
          <h2>Submitting your answers</h2>
          <p id="submitStatusText" class="start-copy" style="margin-left:auto;margin-right:auto;">Please wait while the platform saves your exam.</p>
          <div class="summary-row">
            <div class="summary-box"><strong>${answered}</strong><span>answered of ${total}</span></div>
            <div class="summary-box"><strong>${flagged}</strong><span>flagged</span></div>
            <div class="summary-box"><strong id="submitStatusBadge">Saving</strong><span>Wix CMS</span></div>
          </div>
          <div id="submissionResult" class="submission-result"></div>
          <details class="export-details">
            <summary>Technical export payload</summary>
            <pre id="exportJson" class="export-box">${escape(JSON.stringify({ type: "BRIGHTON_B2_RUE_SUBMIT", payload }, null, 2))}</pre>
          </details>
          <button id="copyExportBtn" class="copy-btn">Copy export JSON</button>
        </div>
      </section>
    `;

    dom.nextBtn.disabled = true;
    dom.backBtn.disabled = false;
    dom.bottomNav.innerHTML = "";

    $("#copyExportBtn")?.addEventListener("click", async () => {
      await navigator.clipboard?.writeText(JSON.stringify({ type: "BRIGHTON_B2_RUE_SUBMIT", payload }, null, 2));
      showToast("Export JSON copied");
    });

    submitPayload(payload);
  }

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
      resultBox.innerHTML = `<p class="muted-text">No Wix endpoint is configured yet. The payload was still generated and sent to the parent window with postMessage.</p>`;
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

      statusBadge.textContent = "Saved";
      statusText.textContent = "Your exam was saved successfully.";
      const scoreText = typeof data.score === "number" && typeof data.maxScore === "number"
        ? `<strong>${data.score}/${data.maxScore}</strong> (${data.percentage}%)`
        : "Saved for review";
      resultBox.innerHTML = `
        <div class="submission-success">
          <h3>Submission saved</h3>
          <p>Result: ${scoreText}</p>
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

  function showToast(message) {
    dom.toast.textContent = message;
    dom.toast.classList.add("show");
    setTimeout(() => dom.toast.classList.remove("show"), 1600);
  }

  function countWords(text) {
    return String(text || "").trim().split(/\s+/).filter(Boolean).length;
  }

  function escape(value) {
    return String(value ?? "").replace(/[&<>"]/g, char => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;"
    }[char]));
  }

  function escapeAttr(value) {
    return escape(value).replace(/'/g, "&#39;");
  }

  function debounce(fn, delay) {
    let timer;
    return (...args) => {
      clearTimeout(timer);
      timer = setTimeout(() => fn(...args), delay);
    };
  }
})();

(() => {
  const exam = window.writingExam;
  const examParts = exam?.parts || [];
  const STORAGE_KEY = `${exam?.examId || "brighton-b2-writing-final"}:state:v1`;

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));

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
    resetBtn: $("#resetBtn"),
    modalRoot: $("#modalRoot"),
    toast: $("#toast")
  };

  let state = createDefaultState();
  let saveTimer = null;

  boot();

  function boot() {
    const saved = loadState();
    if (saved && !saved.submitted) {
      state = saved;
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
    dom.resetBtn.addEventListener("click", resetTest);
    dom.sideMenu.addEventListener("click", event => { if (event.target === dom.sideMenu) closeMenu(); });
  }

  function startExam(continueSaved) {
    if (!continueSaved) {
      state = createDefaultState();
      state.student.name = dom.studentName.value.trim();
      state.student.classId = dom.classId.value.trim();
      state.student.startedAt = new Date().toISOString();
    } else {
      state.student.name = dom.studentName.value.trim() || state.student.name;
      state.student.classId = dom.classId.value.trim() || state.student.classId;
      state.student.startedAt = state.student.startedAt || new Date().toISOString();
    }

    if (!state.student.name || !state.student.classId) {
      showToast("Enter your name and class ID");
      return;
    }

    dom.startScreen.classList.add("hidden");
    dom.examShell.classList.remove("hidden");
    renderApp();
    dom.mainContent.focus();
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
      current: { partId: "part1", question: 1 },
      selectedPart2Question: 2,
      answers,
      flagged: {},
      notes: "",
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
      console.warn("Could not load saved writing state", error);
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
    return merged;
  }

  function saveState() {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(saveStateNow, 40);
  }

  function saveStateNow() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }

  function renderApp(options = {}) {
    ensureValidCurrent();
    updateHeader();
    renderMain();
    renderBottomNav();
    renderStepControls();
    saveState();
    if (options.scrollTop) dom.mainContent.scrollTo({ top: 0, behavior: "smooth" });
  }

  function ensureValidCurrent() {
    const part = getCurrentPart();
    if (!part) state.current = { partId: "part1", question: 1 };
    if (state.current.partId === "part1") state.current.question = 1;
    if (state.current.partId === "part2" && ![2, 3, 4].includes(Number(state.current.question))) {
      state.current.question = state.selectedPart2Question || 2;
    }
  }

  function updateHeader() {
    dom.headerStudent.textContent = state.student.name || "Student Name";
    dom.headerClass.textContent = state.student.classId || "Class ID";
    const q = getCurrentQuestionNumber();
    dom.flagBtn.classList.toggle("flagged", Boolean(state.flagged[q]));
  }

  function renderMain() {
    const part = getCurrentPart();
    if (!part) {
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

    if (part.id === "part1") {
      const item = part.items[0];
      dom.mainContent.innerHTML = `${panelHeader}${renderWritingWorkspace(part, item)}</section>`;
      bindEditor(part.id, item.q);
      return;
    }

    dom.mainContent.innerHTML = `${panelHeader}${renderPart2Workspace(part)}</section>`;
    bindPart2();
  }

  function renderWritingWorkspace(part, item) {
    return `
      <div class="split-grid" style="--left: 44%;">
        <div class="split-column">
          ${renderPrompt(item, part.id === "part1")}
        </div>
        <div class="split-divider" aria-hidden="true"></div>
        <div class="split-column">
          ${renderEditor(part.id, item)}
        </div>
      </div>
    `;
  }

  function renderPart2Workspace(part) {
    const selected = getPart2Item();
    return `
      <div class="warning-note">Choose only one Part 2 task. Drafts are saved, but only the selected task will be shown as the Part 2 answer for marking.</div>
      <div class="split-grid" style="--left: 39%;">
        <div class="split-column">
          <div class="choice-list">
            ${part.items.map(item => renderChoiceCard(item)).join("")}
          </div>
        </div>
        <div class="split-divider" aria-hidden="true"></div>
        <div class="split-column">
          ${renderPrompt(selected, false)}
          ${renderEditor(part.id, selected)}
        </div>
      </div>
    `;
  }

  function renderPrompt(item, isPart1) {
    if (!item) return `<div class="prompt-card"><p>No task selected.</p></div>`;
    const notes = isPart1 ? `
      <p><strong>Notes</strong></p>
      <ol class="notes-list">
        ${item.notes.map(note => `<li>${escapeHtml(note)}</li>`).join("")}
      </ol>
    ` : "";
    const announcement = item.announcementTitle ? `<p><strong>${escapeHtml(item.announcementTitle)}</strong></p>` : "";
    const message = item.message ? `<div class="border-shadow"><p>${escapeHtml(item.message)}</p></div>` : "";
    const closing = item.closingLine ? `<p>${escapeHtml(item.closingLine)}</p>` : "";
    const question = item.question ? `<p><strong>${escapeHtml(item.question)}</strong></p>` : "";
    const task = item.task ? `<p>${escapeHtml(item.task)}</p>` : "";
    const finalInstruction = item.finalInstruction ? `<p><strong>${escapeHtml(item.finalInstruction)}</strong></p>` : "";

    return `
      <article class="prompt-card">
        <h3>${escapeHtml(item.title)}</h3>
        <p>${escapeHtml(item.promptIntro || "")}</p>
        <div class="border-shadow">
          ${announcement}
          ${question}
          ${task}
          ${message}
          ${notes}
          ${closing}
        </div>
        ${isPart1 ? `<p><strong>${escapeHtml(item.task)}</strong></p>` : finalInstruction}
        <p class="muted-text"><strong>Target reader:</strong> ${escapeHtml(item.targetReader || "—")}</p>
      </article>
    `;
  }

  function renderEditor(partId, item) {
    const answer = getAnswer(partId, item.q);
    const wc = countWords(answer);
    return `
      <article class="editor-card">
        <div class="editor-head">
          <div>
            <h3><span class="q-badge">${item.q}</span> Your answer</h3>
            <p>${escapeHtml(exam.wordRange)}. Your writing is saved automatically.</p>
          </div>
          <span class="task-type-pill">${escapeHtml(item.taskType)}</span>
        </div>
        <textarea class="writing-textarea" data-part-id="${escapeAttr(partId)}" data-question="${item.q}" spellcheck="false" placeholder="Write your ${escapeAttr(item.taskType.toLowerCase())} here...">${escapeHtml(answer)}</textarea>
        <div class="editor-foot">
          <span>Question ${item.q}</span>
          <span class="word-count ${wordCountClass(wc)}" data-word-count>Words: ${wc}</span>
        </div>
      </article>
    `;
  }

  function renderChoiceCard(item) {
    const active = Number(state.selectedPart2Question) === Number(item.q);
    const words = countWords(getAnswer("part2", item.q));
    return `
      <button class="choice-card ${active ? "active" : ""}" data-choice-question="${item.q}" type="button">
        <div class="choice-top">
          <h4><span class="q-badge">${item.q}</span> ${escapeHtml(item.taskType)}</h4>
          <span class="selected-tag">✓ Selected</span>
        </div>
        <p>${escapeHtml(item.title)}</p>
        <p><strong>${words}</strong> words saved</p>
      </button>
    `;
  }

  function bindEditor(partId, question) {
    const textarea = $(".writing-textarea", dom.mainContent);
    if (!textarea) return;
    textarea.addEventListener("input", () => {
      setAnswer(partId, question, textarea.value);
      const wc = countWords(textarea.value);
      const counter = $("[data-word-count]", dom.mainContent);
      if (counter) {
        counter.textContent = `Words: ${wc}`;
        counter.className = `word-count ${wordCountClass(wc)}`;
      }
      renderBottomNav();
    });
    setTimeout(() => textarea.focus(), 40);
  }

  function bindPart2() {
    $$("[data-choice-question]", dom.mainContent).forEach(button => {
      button.addEventListener("click", () => {
        state.selectedPart2Question = Number(button.dataset.choiceQuestion);
        state.current = { partId: "part2", question: state.selectedPart2Question };
        renderApp({ scrollTop: true });
      });
    });
    const selected = getPart2Item();
    bindEditor("part2", selected.q);
  }

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

    $$("[data-part-card]", dom.bottomNav).forEach(card => {
      card.addEventListener("click", event => {
        if (event.target.closest("[data-question-pill]")) return;
        const partId = card.dataset.partCard;
        const part = examParts.find(p => p.id === partId);
        if (partId === "part2") {
          state.current = { partId, question: state.selectedPart2Question || 2 };
        } else {
          state.current = { partId, question: part.items[0].q };
        }
        renderApp({ scrollTop: true });
      });
    });

    $$("[data-question-pill]", dom.bottomNav).forEach(button => {
      button.addEventListener("click", event => {
        event.stopPropagation();
        const partId = button.dataset.partId;
        const question = Number(button.dataset.questionPill);
        if (partId === "part2") state.selectedPart2Question = question;
        state.current = { partId, question };
        renderApp({ scrollTop: true });
      });
    });
  }

  function renderQuestionPill(part, item) {
    const active = part.id === state.current.partId && Number(item.q) === Number(getCurrentQuestionNumber());
    const answered = countWords(getAnswer(part.id, item.q)) > 0;
    const flagged = Boolean(state.flagged[item.q]);
    return `<button class="q-pill ${active ? "active" : ""} ${answered ? "answered" : ""} ${flagged ? "flagged" : ""}" data-part-id="${escapeAttr(part.id)}" data-question-pill="${item.q}" type="button" aria-label="Question ${item.q}">${item.q}</button>`;
  }

  function renderStepControls() {
    const order = getQuestionOrder();
    const currentIndex = order.findIndex(item => item.partId === state.current.partId && Number(item.question) === Number(getCurrentQuestionNumber()));
    dom.backBtn.disabled = currentIndex <= 0;
    const isLast = currentIndex === order.length - 1;
    dom.nextBtn.textContent = isLast ? "✓" : "→";
    dom.nextBtn.classList.toggle("finish", isLast);
    dom.nextBtn.setAttribute("aria-label", isLast ? "Finish exam" : "Next task");
  }

  function goBack() {
    const order = getQuestionOrder();
    const index = order.findIndex(item => item.partId === state.current.partId && Number(item.question) === Number(getCurrentQuestionNumber()));
    if (index > 0) {
      const previous = order[index - 1];
      state.current = previous;
      if (previous.partId === "part2") state.selectedPart2Question = previous.question;
      renderApp({ scrollTop: true });
    }
  }

  function goNext() {
    const order = getQuestionOrder();
    const index = order.findIndex(item => item.partId === state.current.partId && Number(item.question) === Number(getCurrentQuestionNumber()));
    if (index < order.length - 1) {
      const next = order[index + 1];
      state.current = next;
      if (next.partId === "part2") state.selectedPart2Question = next.question;
      renderApp({ scrollTop: true });
      return;
    }
    finishExam();
  }

  function getQuestionOrder() {
    return [
      { partId: "part1", question: 1 },
      { partId: "part2", question: 2 },
      { partId: "part2", question: 3 },
      { partId: "part2", question: 4 }
    ];
  }

  function getCurrentPart() {
    return examParts.find(part => part.id === state.current.partId) || examParts[0];
  }

  function getPart2Item() {
    const part = examParts.find(p => p.id === "part2");
    return part.items.find(item => Number(item.q) === Number(state.selectedPart2Question)) || part.items[0];
  }

  function resolveSelectedPart2FromDrafts() {
    const part = examParts.find(p => p.id === "part2");
    if (!part) return;
    const selected = Number(state.selectedPart2Question || 2);
    const selectedWords = countWords(getAnswer("part2", selected));
    if (selectedWords > 0) return;

    const current = Number(state.current?.partId === "part2" ? state.current.question : selected);
    if (countWords(getAnswer("part2", current)) > 0) {
      state.selectedPart2Question = current;
      return;
    }

    const firstAnswered = part.items.find(item => countWords(getAnswer("part2", item.q)) > 0);
    if (firstAnswered) state.selectedPart2Question = Number(firstAnswered.q);
  }

  function getCurrentQuestionNumber() {
    if (state.current.partId === "part2") return Number(state.current.question || state.selectedPart2Question || 2);
    return 1;
  }

  function getAnswer(partId, question) {
    return state.answers?.[partId]?.[question] || "";
  }

  function setAnswer(partId, question, value) {
    if (!state.answers[partId]) state.answers[partId] = {};
    state.answers[partId][question] = value;
    saveState();
  }

  function getProgress(part) {
    if (part.id === "part1") return { done: countWords(getAnswer("part1", 1)) > 0 ? 1 : 0, total: 1 };
    const selected = state.selectedPart2Question;
    return { done: selected && countWords(getAnswer("part2", selected)) > 0 ? 1 : 0, total: 1 };
  }

  function toggleFlag() {
    const q = getCurrentQuestionNumber();
    if (state.flagged[q]) delete state.flagged[q];
    else state.flagged[q] = true;
    updateHeader();
    renderBottomNav();
    saveState();
  }

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

  function openOverview() {
    closeMenu();
    dom.modalRoot.classList.remove("hidden");
    dom.modalRoot.setAttribute("aria-hidden", "false");
    const rows = getQuestionOrder().map(item => {
      const answer = getAnswer(item.partId, item.question);
      const words = countWords(answer);
      const chosen = item.partId === "part2" && Number(state.selectedPart2Question) === Number(item.question);
      return `
        <div class="choice-card ${chosen || (item.partId === "part1") ? "active" : ""}">
          <div class="choice-top"><h4><span class="q-badge">${item.question}</span> ${item.partId === "part1" ? "Essay" : `Part 2 option${chosen ? " · selected" : ""}`}</h4></div>
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

  function openMenu() {
    dom.sideMenu.classList.add("open");
    dom.sideMenu.setAttribute("aria-hidden", "false");
  }

  function closeMenu() {
    dom.sideMenu.classList.remove("open");
    dom.sideMenu.setAttribute("aria-hidden", "true");
  }

  function closeModal() {
    dom.modalRoot.classList.add("hidden");
    dom.modalRoot.setAttribute("aria-hidden", "true");
    dom.modalRoot.innerHTML = "";
  }

  function resetTest() {
    const confirmed = window.confirm("Reset this writing test? This will clear all answers, flags and notes saved on this device.");
    if (!confirmed) return;
    localStorage.removeItem(STORAGE_KEY);
    location.reload();
  }

  function finishExam() {
    resolveSelectedPart2FromDrafts();
    const p1Words = countWords(getAnswer("part1", 1));
    const part2Item = getPart2Item();
    const p2Words = countWords(getAnswer("part2", part2Item.q));
    const missing = [];
    if (p1Words === 0) missing.push("Part 1 essay");
    if (p2Words === 0) missing.push(`Part 2 selected task (Question ${part2Item.q})`);
    if (missing.length) {
      const ok = window.confirm(`${missing.join(" and ")} appears to be empty. Submit anyway?`);
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
          <p id="submitStatusText" class="start-copy" style="margin-left:auto;margin-right:auto;">Please wait while the platform records your writing in Wix.</p>
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

  function buildExportPayload() {
    resolveSelectedPart2FromDrafts();
    const selectedPart2 = getPart2Item();
    const writingSamples = [
      buildWritingSample("part1", examParts[0].items[0]),
      buildWritingSample("part2", selectedPart2)
    ];
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
      part2SelectedQuestion: selectedPart2.q,
      part2Drafts: examParts[1].items.map(item => buildWritingSample("part2", item)),
      flagged: Object.keys(state.flagged).map(Number).sort((a, b) => a - b),
      notes: state.notes || "",
      startedAt: state.student.startedAt || "",
      submittedAt: state.submittedAt,
      timeSpentSeconds: calculateTimeSpentSeconds(),
      progress: examParts.map(part => ({ partId: part.id, label: part.label, ...getProgress(part) }))
    };
  }

  function buildWritingSample(partId, item) {
    const partNumber = Number(String(partId).replace("part", ""));
    const answer = getAnswer(partId, item.q) || "";
    return {
      part: partNumber,
      partId,
      question: item.q,
      label: partId === "part1" ? "Part 1" : "Part 2",
      taskType: item.taskType,
      title: item.title,
      targetReader: item.targetReader,
      sourceTopic: item.sourceTopic,
      prompt: buildPromptText(item, partId === "part1"),
      answer,
      wordCount: countWords(answer)
    };
  }

  function buildPromptText(item, isPart1) {
    const pieces = [item.promptIntro, item.question, item.task, item.message, item.announcementTitle, item.closingLine, item.finalInstruction].filter(Boolean);
    if (isPart1 && Array.isArray(item.notes)) pieces.push(`Notes: ${item.notes.join("; ")}`);
    return pieces.join("\n\n");
  }

  function calculateTimeSpentSeconds() {
    if (!state.student.startedAt || !state.submittedAt) return null;
    const started = new Date(state.student.startedAt).getTime();
    const submitted = new Date(state.submittedAt).getTime();
    if (!Number.isFinite(started) || !Number.isFinite(submitted)) return null;
    return Math.max(0, Math.round((submitted - started) / 1000));
  }

  async function submitPayload(payload) {
    const message = { type: "BRIGHTON_B2_WRITING_SUBMIT", payload };
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

  function countWords(text) {
    return String(text || "").trim().split(/\s+/).filter(Boolean).length;
  }

  function wordCountClass(count) {
    if (!count) return "";
    if (count < 140) return "too-short";
    if (count > 190) return "too-long";
    return "ok";
  }

  function showToast(message) {
    dom.toast.textContent = message;
    dom.toast.classList.add("show");
    clearTimeout(showToast.timer);
    showToast.timer = setTimeout(() => dom.toast.classList.remove("show"), 1800);
  }

  function escapeHtml(value) {
    return String(value ?? "").replace(/[&<>'"]/g, char => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;"
    }[char]));
  }

  function escapeAttr(value) {
    return escapeHtml(value).replace(/`/g, "&#96;");
  }
})();

"use strict";
/* ==============================================
     Brighton English School
     Made by: David Santana
============================================== */

(() => {
  const App = window.BrightonApp || {};
  const config = window.BRIGHTON_SITE_CONFIG || {};
  const apiBase = String(config.API_BASE_URL || "").replace(/\/$/, "");
  const classIdInput = document.querySelector("#classIdInput");
  const examSelect = document.querySelector("#examSelect");
  const studentInput = document.querySelector("#studentInput");
  const loadBtn = document.querySelector("#loadBtn");
  const clearBtn = document.querySelector("#clearBtn");
  const exportBtn = document.querySelector("#exportBtn");
  const shareLinkBtn = document.querySelector("#shareLinkBtn");
  const resultsBody = document.querySelector("#resultsBody");
  const progressBody = document.querySelector("#progressBody");
  const progressStatus = document.querySelector("#progressStatus");
  const progressUpdatedAt = document.querySelector("#progressUpdatedAt");
  const status = document.querySelector("#resultsStatus");
  const toast = document.querySelector("#toast");
  const modal = document.querySelector("#detailsModal");
  const detailsContent = document.querySelector("#detailsContent");
  const closeModalBtn = document.querySelector("#closeModalBtn");

  let rows = [];
  let progressRows = [];
  let progressTimer = null;
  let activeProgressPreviewId = "";
  let queryState = readQueryState();
  let studentFilterTimer = null;
  const answerKeyCache = new Map();
  const progressRefreshMs = Number(config.DASHBOARD_PROGRESS_REFRESH_MS) || 20000;
  const progressStaleSeconds = Number(config.PROGRESS_STALE_SECONDS) || 90;
  const progressActiveWindowMs = Number(config.PROGRESS_ACTIVE_WINDOW_MS) || 3 * 60 * 60 * 1000;
  const progressSubmittedWindowMs = Number(config.PROGRESS_SUBMITTED_WINDOW_MS) || 15 * 60 * 1000;

  const WRITING_TASK_META = {
    1: { part: 1, partId: "part1", question: 1, label: "Part 1", taskType: "Essay", title: "Essay: environment and everyday action", targetReader: "Your English teacher", prompt: "In your English class you have been talking about the environment.\n\nSome people say that schools and companies should do much more to reduce waste and pollution. Do you agree?\n\nNotes: transport; daily habits; your own idea\n\nWrite an essay using all the notes and giving reasons for your point of view." },
    2: { part: 2, partId: "part2", question: 2, label: "Part 2", taskType: "Article", title: "Article: design that improves everyday life", targetReader: "Readers of a college English-language magazine", prompt: "You see this announcement in your college English-language magazine.\n\nArticles wanted: Better design, better lives\n\nWrite an article about a product, building or public place that you think is well designed. Explain what makes the design useful and say how it could be improved even more.\n\nThe best articles will be published in next month’s magazine.\n\nWrite your article." },
    3: { part: 2, partId: "part2", question: 3, label: "Part 2", taskType: "Email", title: "Email: advice about learning and work", targetReader: "An English-speaking friend", prompt: "Your English-speaking friend Sam has written to you for advice.\n\nI’m thinking of taking an online course while doing a part-time job. I’m worried I won’t have enough time, but I also don’t want to miss a good opportunity. What do you think I should do?\n\nWrite an email to Sam giving your opinion. Suggest how Sam could organise the week and explain what problems to avoid." },
    4: { part: 2, partId: "part2", question: 4, label: "Part 2", taskType: "Review", title: "Review: a story that made you think", targetReader: "Readers of an English-language student website", prompt: "You see this announcement on an English-language website for students.\n\nReviews wanted\n\nHave you read a book, watched a film or seen a series which made you think about facts, fake news or real life? Write a review describing it and explaining why it made an impression on you. Say whether you would recommend it to other students.\n\nThe best reviews will be posted on the website.\n\nWrite your review." }
  };

  classIdInput.addEventListener("blur", () => { normalizeClassInput(); syncUrlFromControls({ replace: true, keepOpen: true }); });
  examSelect.addEventListener("change", () => syncUrlFromControls({ replace: true, keepOpen: true }));
  studentInput?.addEventListener("input", scheduleStudentFilterUpdate);
  loadBtn.addEventListener("click", () => loadResults({ updateUrl: true, view: "submissions" }));
  clearBtn.addEventListener("click", clearFilters);
  exportBtn.addEventListener("click", exportCsv);
  shareLinkBtn?.addEventListener("click", copyShareLink);
  closeModalBtn.addEventListener("click", closeModal);
  modal.addEventListener("click", event => { if (event.target === modal) closeModal(); });
  window.addEventListener("popstate", handlePopState);

  init();

  /* ---------------------------------------------- 
  INIT 
  ---------------------------------------------- */
  async function init() {
    queryState = readQueryState();
    applyQueryStateToControls(queryState);
    await loadExams();
    applyQueryStateToControls(queryState);
    if (queryState.classId && queryState.autoLoad) await loadResults({ updateUrl: false, fromQuery: true });
    else scrollToRequestedScreen(queryState.view);
  }

  /* ---------------------------------------------- 
  LOAD EXAMS 
  ---------------------------------------------- */
  async function loadExams() {
    try {
      if (!apiBase || apiBase.includes("YOUR-WIX")) throw new Error("Brighton Database not configured");
      const res = await fetch(`${apiBase}/getExams`);
      const data = await res.json();
      if (!res.ok || data.success === false) throw new Error(data.error || `HTTP ${res.status}`);
      fillExamSelect(data.exams || []);
    } catch {
      fillExamSelect([]);
      status.textContent = "Failed to connect to Brighton Database. Check internet connection.";
    }
  }

  /* ---------------------------------------------- 
  FILL EXAM SELECT 
  ---------------------------------------------- */
  function fillExamSelect(exams) {
    const current = queryState.examId || examSelect.dataset.prefill || "";
    examSelect.innerHTML = `<option value="">All exams</option>` + exams.map(exam => `
      <option value="${escapeAttr(exam.examId)}">${escapeHtml(exam.title || exam.examId)}</option>
    `).join("");
    if (current) examSelect.value = current;
  }

  /* ---------------------------------------------- 
  LOAD RESULTS 
  ---------------------------------------------- */
  async function loadResults(options = {}) {
    const classId = normalizeClassInput();
    const examId = examSelect.value.trim();
    if (options.updateUrl !== false) syncUrlFromControls({ replace: false, view: options.view || "submissions" });
    if (!classId) {
      showToast("Enter a class ID first");
      classIdInput.focus();
      return;
    }
    if (!apiBase || apiBase.includes("YOUR-WIX")) {
      status.textContent = "Failed to connect to Brighton Database. Check internet connection.";
      rows = [];
      progressRows = [];
      stopProgressTimer();
      renderProgressRows();
      renderRows();
      updateSummary();
      return;
    }

    status.textContent = "Loading results...";
    resultsBody.innerHTML = `<tr><td colspan="8">Loading...</td></tr>`;

    try {
      const url = new URL(`${apiBase}/getResults`);
      url.searchParams.set("classId", classId);
      if (examId) url.searchParams.set("examId", examId);
      const res = await fetch(url.toString());
      const data = await res.json();
      if (!res.ok || data.success === false) throw new Error(data.error || `HTTP ${res.status}`);
      rows = await applyLocalGrading(data.items || []);
      await loadProgress();
      startProgressTimer();
      const locallyGraded = rows.filter(row => row._gradedLocally).length;
      const visibleCount = getFilteredRows().length;
      status.textContent = `${rows.length} submission(s) loaded for ${classId}.${getStudentFilter() ? ` Showing ${visibleCount} matching student row(s).` : ""}${locallyGraded ? ` ${locallyGraded} row(s) graded locally from the answer key.` : ""}`;
      renderRows();
      updateSummary(data.summary);
      scrollToRequestedScreen(queryState.view);
      openRequestedModal();
    } catch (error) {
      status.textContent = `Could not load results: ${error.message}`;
      rows = [];
      progressRows = [];
      stopProgressTimer();
      renderProgressRows();
      renderRows();
      updateSummary();
    }
  }

  /* ---------------------------------------------- 
  APPLY LOCAL GRADING 
  ---------------------------------------------- */
  async function applyLocalGrading(items) {
    if (!window.BrightonGrading) return items;
    const updated = [];
    for (const row of items) {
      const copy = { ...row };
      if (isWritingSubmission(copy)) {
        updated.push(copy);
        continue;
      }
      const shouldGrade = copy.score === undefined || copy.score === null || copy.maxScore === undefined || copy.maxScore === null || copy.status === "submitted_ungraded";
      if (!shouldGrade) {
        updated.push(copy);
        continue;
      }
      try {
        const examId = copy.examId || "brighton-b2-rue-final";
        const key = await getAnswerKey(examId);
        const payload = payloadFromRow(copy);
        const graded = window.BrightonGrading.gradeSubmission(payload, key);
        copy.score = graded.score;
        copy.maxScore = graded.maxScore;
        copy.percentage = graded.percentage;
        copy.partScores = graded.partScores;
        copy.partScoresJson = JSON.stringify(graded.partScores);
        copy.gradingDetails = graded.details;
        copy.gradingDetailsJson = JSON.stringify(graded.details);
        copy._gradedLocally = true;
        if (!copy.status || copy.status === "submitted_ungraded") copy.status = "graded_locally";
      } catch (error) {
        copy._localGradingError = error.message || String(error);
      }
      updated.push(copy);
    }
    return updated;
  }

  /* ---------------------------------------------- 
  GET ANSWER KEY 
  ---------------------------------------------- */
  async function getAnswerKey(examId) {
    if (answerKeyCache.has(examId)) return answerKeyCache.get(examId);
    const key = await window.BrightonGrading.loadAnswerKey(examId);
    answerKeyCache.set(examId, key);
    return key;
  }

  /* ---------------------------------------------- 
  PAYLOAD FROM ROW 
  ---------------------------------------------- */
  function payloadFromRow(row) {
    const raw = firstJsonFrom(row, ["rawPayloadJson", "rawProgressJson", "rawPayload", "payloadJson", "payload"], {});
    const payload = raw?.payload || raw || {};
    const answers = firstJsonFrom(row, ["answersJson", "answers", "studentAnswersJson", "studentAnswers", "responsesJson", "responses"], payload.answers || {});
    const answerList = firstJsonFrom(row, ["answerListJson", "answerList"], payload.answerList || []);
    const writingSamples = firstJsonFrom(row, ["writingSamplesJson", "writingSamples"], payload.writingSamples || []);
    const part2Drafts = firstJsonFrom(row, ["part2DraftsJson", "part2Drafts"], payload.part2Drafts || []);
    return {
      ...payload,
      examId: payload.examId || row.examId,
      examTitle: payload.examTitle || row.examTitle,
      level: payload.level || row.level,
      skill: payload.skill || row.skill,
      studentName: payload.studentName || row.studentName,
      classId: payload.classId || row.classId,
      submittedAt: payload.submittedAt || row.submittedAt,
      answers,
      answerList,
      writingSamples,
      part2Drafts,
      part2SelectedQuestion: resolvePart2SelectedQuestion(payload.part2SelectedQuestion || row.part2SelectedQuestion || row.part2Selected, answers)
    };
  }


  /* ---------------------------------------------- 
  LOAD PROGRESS 
  ---------------------------------------------- */
  async function loadProgress() {
    const classId = normalizeClassInput();
    const examId = examSelect.value.trim();
    if (!classId || !apiBase || apiBase.includes("YOUR-WIX")) {
      progressRows = [];
      renderProgressRows();
      return;
    }

    try {
      const url = new URL(`${apiBase}/getProgress`);
      url.searchParams.set("classId", classId);
      if (examId) url.searchParams.set("examId", examId);
      const res = await fetch(url.toString());
      const data = await res.json().catch(() => ({}));
      if (!res.ok || data.success === false) throw new Error(data.error || `HTTP ${res.status}`);
      progressRows = filterVisibleProgressRows(data.items || []);
      renderProgressRows();
      refreshOpenProgressDetails();
      const visibleProgressCount = getFilteredProgressRows().length;
      if (progressStatus) progressStatus.textContent = `${visibleProgressCount}${getStudentFilter() ? `/${progressRows.length}` : ""} student(s) monitored. Auto-refresh every ${Math.round(progressRefreshMs / 1000)} seconds.`;
      if (progressUpdatedAt) progressUpdatedAt.textContent = `Updated ${new Date().toLocaleTimeString()}`;
    } catch (error) {
      if (progressStatus) progressStatus.textContent = `Could not load live progress: ${error.message}`;
    }
  }

  /* ---------------------------------------------- 
  START PROGRESS TIMER 
  ---------------------------------------------- */
  function startProgressTimer() {
    stopProgressTimer();
    progressTimer = window.setInterval(loadProgress, progressRefreshMs);
  }

  /* ---------------------------------------------- 
  STOP PROGRESS TIMER 
  ---------------------------------------------- */
  function stopProgressTimer() {
    if (progressTimer) window.clearInterval(progressTimer);
    progressTimer = null;
  }

  /* ---------------------------------------------- 
  FILTER VISIBLE PROGRESS ROWS 
  ---------------------------------------------- */
  function filterVisibleProgressRows(items) {
    const now = Date.now();
    return (items || [])
      .filter(item => {
        const last = new Date(item.lastSeenAt || item.submittedAt || 0).getTime();
        if (!Number.isFinite(last)) return false;
        const age = now - last;
        const statusText = String(item.status || "").toLowerCase();
        if (statusText === "submitted") return age <= progressSubmittedWindowMs;
        return age <= progressActiveWindowMs;
      })
      .sort((a, b) => new Date(b.lastSeenAt || b.submittedAt || 0) - new Date(a.lastSeenAt || a.submittedAt || 0));
  }

  /* ---------------------------------------------- 
  PROGRESS KEY 
  ---------------------------------------------- */
  function progressKey(item) {
    return `${item.examId || ""}|${item.classId || ""}|${item.studentName || ""}`.toLowerCase();
  }

  /* ---------------------------------------------- 
  RENDER PROGRESS ROWS 
  ---------------------------------------------- */
  function renderProgressRows() {
    if (!progressBody) return;
    const visibleRows = getFilteredProgressRows();
    if (!visibleRows.length) {
      const message = progressRows.length && getStudentFilter() ? "No live progress matches this student filter." : "No live progress found for this class yet.";
      progressBody.innerHTML = `<tr><td colspan="8">${escapeHtml(message)}</td></tr>`;
      return;
    }

    progressBody.innerHTML = visibleRows.map((row, index) => {
      const liveStatus = progressStatusText(row);
      const percent = clamp(Number(row.progressPercent) || 0, 0, 100);
      const answered = row.answeredCount !== undefined && row.totalQuestions ? `${row.answeredCount}/${row.totalQuestions}` : `${percent}%`;
      return `
        <tr>
          <td><strong>${escapeHtml(row.studentName || "—")}</strong><br><span class="muted tiny-text">${escapeHtml(row.classId || "")}</span></td>
          <td>${escapeHtml(row.examTitle || row.examId || "—")}</td>
          <td><span class="live-status ${liveStatus.className}">${liveStatus.label}</span></td>
          <td>
            <div class="live-progress-line"><span style="width:${percent}%"></span></div>
            <span class="tiny-text">${escapeHtml(answered)}</span>
          </td>
          <td>${formatCurrent(row)}</td>
          <td>${escapeHtml(formatDate(row.lastSeenAt || row.submittedAt))}</td>
          <td>${formatSeconds(row.timeSpentSeconds)}</td>
          <td><button class="secondary-btn" data-progress-details="${index}" type="button">Preview</button></td>
        </tr>
      `;
    }).join("");

    document.querySelectorAll("[data-progress-details]").forEach(button => {
      button.addEventListener("click", () => openProgressDetails(getFilteredProgressRows()[Number(button.dataset.progressDetails)]));
    });
  }

  /* ---------------------------------------------- 
  REFRESH OPEN PROGRESS DETAILS 
  ---------------------------------------------- */
  function refreshOpenProgressDetails() {
    if (!activeProgressPreviewId || modal.classList.contains("hidden")) return;
    const latest = progressRows.find(row => (row.progressId || progressKey(row)) === activeProgressPreviewId);
    if (!latest) return;
    openProgressDetails(latest, { refreshing: true });
  }

  /* ---------------------------------------------- 
  PROGRESS STATUS TEXT 
  ---------------------------------------------- */
  function progressStatusText(row) {
    if (String(row.status || "").toLowerCase() === "submitted") return { label: "Submitted", className: "submitted" };
    if (isProgressStale(row)) return { label: "Connection lost", className: "lost" };
    return { label: "In progress", className: "active" };
  }

  /* ---------------------------------------------- 
  IS PROGRESS STALE 
  ---------------------------------------------- */
  function isProgressStale(row) {
    const last = new Date(row.lastSeenAt || 0).getTime();
    if (!Number.isFinite(last)) return true;
    return (Date.now() - last) > progressStaleSeconds * 1000;
  }

  /* ---------------------------------------------- 
  FORMAT CURRENT 
  ---------------------------------------------- */
  function formatCurrent(row) {
    const part = row.currentPart ? String(row.currentPart).replace("part", "Part ") : "—";
    const question = row.currentQuestion ? `Q${row.currentQuestion}` : "";
    return `${escapeHtml(part)} ${escapeHtml(question)}`.trim();
  }

  /* ---------------------------------------------- 
  FORMAT SECONDS 
  ---------------------------------------------- */
  function formatSeconds(value) {
    const total = Number(value);
    if (!Number.isFinite(total) || total < 0) return "—";
    const minutes = Math.floor(total / 60);
    const seconds = Math.round(total % 60);
    return `${minutes}:${String(seconds).padStart(2, "0")}`;
  }

  /* ---------------------------------------------- 
  CLAMP 
  ---------------------------------------------- */
  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  /* ---------------------------------------------- 
  RENDER ROWS 
  ---------------------------------------------- */
  function renderRows() {
    const visibleRows = getFilteredRows();
    if (!visibleRows.length) {
      const message = rows.length && getStudentFilter() ? "No submissions match this student filter." : "No submissions found.";
      resultsBody.innerHTML = `<tr><td colspan="8">${escapeHtml(message)}</td></tr>`;
      return;
    }

    resultsBody.innerHTML = visibleRows.map((row, index) => {
      const partScores = safeJson(row.partScoresJson, row.partScores || {});
      const writing = isWritingSubmission(row);
      const scoreCell = writing
        ? `<span class="score-pill manual-score-pill">Manual review</span>`
        : `<span class="score-pill">${row.score ?? "—"}/${row.maxScore ?? "—"}</span>`;
      const percentCell = writing ? "—" : (typeof row.percentage === "number" ? `${row.percentage}%` : "—");
      const partsCell = writing ? formatWritingMini(row) : formatParts(partScores);
      return `
        <tr class="${isHighlightedRow(row) ? "url-row-highlight" : ""}">
          <td><strong>${escapeHtml(row.studentName || "—")}</strong></td>
          <td>${escapeHtml(row.classId || "—")}</td>
          <td>${escapeHtml(row.examTitle || row.examId || "—")}</td>
          <td>${escapeHtml(row.submittedAtLocal || formatDate(row.submittedAt))}</td>
          <td>${scoreCell}</td>
          <td>${percentCell}</td>
          <td><div class="parts-mini">${partsCell}</div></td>
          <td><button class="secondary-btn" data-details="${index}">Details</button></td>
        </tr>
      `;
    }).join("");

    document.querySelectorAll("[data-details]").forEach(button => {
      button.addEventListener("click", () => openDetails(getFilteredRows()[Number(button.dataset.details)]));
    });
  }

  /* ---------------------------------------------- 
  UPDATE SUMMARY 
  ---------------------------------------------- */
  function updateSummary(serverSummary) {
    const visibleRows = getFilteredRows();
    const useServerSummary = !getStudentFilter() && serverSummary;
    const total = useServerSummary ? serverSummary.total : visibleRows.length;
    const percentages = visibleRows.map(r => Number(r.percentage)).filter(Number.isFinite);
    const average = useServerSummary ? serverSummary.average : (percentages.length ? Math.round(percentages.reduce((a,b)=>a+b,0) / percentages.length) : null);
    const highest = useServerSummary ? serverSummary.highest : (percentages.length ? Math.max(...percentages) : null);
    const lowest = useServerSummary ? serverSummary.lowest : (percentages.length ? Math.min(...percentages) : null);
    document.querySelector("#summaryTotal").textContent = total;
    document.querySelector("#summaryAverage").textContent = average === null ? "—" : `${average}%`;
    document.querySelector("#summaryHighest").textContent = highest === null ? "—" : `${highest}%`;
    document.querySelector("#summaryLowest").textContent = lowest === null ? "—" : `${lowest}%`;
  }

  /* ---------------------------------------------- 
  OPEN PROGRESS DETAILS 
  ---------------------------------------------- */
  async function openProgressDetails(row, options = {}) {
    if (!row) return;
    if (!options.refreshing && !options.fromQuery) syncUrlFromControls({ replace: false, view: "live", open: "progress", row });
    activeProgressPreviewId = row.progressId || progressKey(row);
    const liveRow = progressRowToSubmissionRow(row);
    const payload = payloadFromRow(liveRow);
    const status = progressStatusText(row);
    modal.classList.remove("hidden");
    modal.setAttribute("aria-hidden", "false");
    if (!options.refreshing) detailsContent.innerHTML = `<div class="detail-loading">Loading live answers...</div>`;

    const heading = modal.querySelector(".modal-head h2");
    if (heading) heading.textContent = "Live answer preview";

    if (isWritingSubmission(liveRow)) {
      const samples = extractWritingSamples(liveRow, payload);
      detailsContent.innerHTML = `
        <div class="detail-grid detail-grid-wide">
          <div class="detail-box"><span>Student</span><strong>${escapeHtml(row.studentName || payload.studentName || "—")}</strong></div>
          <div class="detail-box"><span>Class</span><strong>${escapeHtml(row.classId || payload.classId || "—")}</strong></div>
          <div class="detail-box"><span>Exam</span><strong>${escapeHtml(row.examTitle || payload.examTitle || row.examId || "—")}</strong></div>
          <div class="detail-box"><span>Status</span><strong>${escapeHtml(status.label)}</strong></div>
          <div class="detail-box"><span>Progress</span><strong>${escapeHtml(row.answeredCount ?? "—")}/${escapeHtml(row.totalQuestions ?? "—")}</strong></div>
          <div class="detail-box"><span>Last update</span><strong>${escapeHtml(formatDate(row.lastSeenAt || row.submittedAt))}</strong></div>
        </div>

        <section class="detail-section">
          <h3>Live writing samples</h3>
          ${samples.length ? samples.map(renderLiveWritingSample).join("") : `<p class="muted">No writing answers have been saved in live progress yet. Keep this window open and it will update automatically.</p>`}
        </section>
      `;
      return;
    }

    let review;
    try {
      review = await buildAnswerReview(liveRow);
    } catch (error) {
      review = { rows: [], error: error.message || String(error) };
    }

    detailsContent.innerHTML = `
      <div class="detail-grid detail-grid-wide">
        <div class="detail-box"><span>Student</span><strong>${escapeHtml(row.studentName || payload.studentName || "—")}</strong></div>
        <div class="detail-box"><span>Class</span><strong>${escapeHtml(row.classId || payload.classId || "—")}</strong></div>
        <div class="detail-box"><span>Exam</span><strong>${escapeHtml(row.examTitle || payload.examTitle || row.examId || "—")}</strong></div>
        <div class="detail-box"><span>Status</span><strong>${escapeHtml(status.label)}</strong></div>
        <div class="detail-box"><span>Progress</span><strong>${escapeHtml(row.answeredCount ?? "—")}/${escapeHtml(row.totalQuestions ?? "—")}</strong></div>
        <div class="detail-box"><span>Last update</span><strong>${escapeHtml(formatDate(row.lastSeenAt || row.submittedAt))}</strong></div>
      </div>

      <section class="detail-section">
        <h3>Live answers vs answer key</h3>
        ${review?.error ? `<p class="detail-warning">${escapeHtml(review.error)}</p>` : ""}
        ${renderAnswerReview(review.rows || [])}
      </section>
    `;
  }

  /* ---------------------------------------------- 
  PROGRESS ROW TO SUBMISSION ROW 
  ---------------------------------------------- */
  function progressRowToSubmissionRow(row) {
    const raw = parseJsonDeep(row?.rawProgressJson, {});
    return {
      ...row,
      rawPayloadJson: row.rawProgressJson || JSON.stringify(raw || {}),
      answersJson: row.answersJson || JSON.stringify(raw.answers || {}),
      answerListJson: row.answerListJson || JSON.stringify(raw.answerList || []),
      writingSamplesJson: row.writingSamplesJson || JSON.stringify(raw.writingSamples || []),
      flaggedJson: JSON.stringify(raw.flagged || []),
      notes: raw.notes || "",
      submittedAt: row.lastSeenAt || row.submittedAt,
      submittedAtLocal: formatDate(row.lastSeenAt || row.submittedAt),
      status: row.status || "in_progress"
    };
  }

  /* ---------------------------------------------- 
  RENDER LIVE WRITING SAMPLE 
  ---------------------------------------------- */
  function renderLiveWritingSample(sample) {
    const answer = sample.answer || "";
    const wordCount = Number(sample.wordCount ?? countWords(answer));
    return `
      <article class="writing-sample-card">
        <div class="writing-sample-head">
          <div>
            <p class="eyebrow">${escapeHtml(sample.label || `Part ${sample.part || "—"}`)} · Question ${escapeHtml(sample.question ?? "—")}</p>
            <h4>${escapeHtml(sample.taskType || "Writing")} — ${escapeHtml(sample.title || "Writing task")}</h4>
            <p class="muted">${escapeHtml(sample.targetReader ? `Target reader: ${sample.targetReader}` : "")}</p>
          </div>
          <span class="word-count-pill">${wordCount} words</span>
        </div>
        ${sample.prompt ? `<details class="writing-prompt-details"><summary>View task prompt</summary><p>${escapeHtml(sample.prompt).replace(/\n/g, "<br>")}</p></details>` : ""}
        <div class="writing-answer-box">${escapeHtml(answer || "No answer saved yet.").replace(/\n/g, "<br>")}</div>
      </article>
    `;
  }

  /* ---------------------------------------------- 
  OPEN DETAILS 
  ---------------------------------------------- */
  async function openDetails(row, options = {}) {
    if (!row) return;
    if (!options.fromQuery) syncUrlFromControls({ replace: false, view: "submissions", open: "details", row });
    const heading = modal.querySelector(".modal-head h2");
    if (heading) heading.textContent = "Submission details";
    modal.classList.remove("hidden");
    modal.setAttribute("aria-hidden", "false");
    detailsContent.innerHTML = `<div class="detail-loading">Loading submission details...</div>`;

    if (isWritingSubmission(row)) {
      openWritingDetails(row);
      return;
    }

    const flags = safeJson(row.flaggedJson, row.flagged || []);
    let parts = safeJson(row.partScoresJson, row.partScores || {});
    let review;

    try {
      review = await buildAnswerReview(row);
      if (review.partScores && Object.keys(review.partScores).length) parts = review.partScores;
    } catch (error) {
      review = { rows: [], error: error.message || String(error) };
    }

    detailsContent.innerHTML = `
      <div class="detail-grid detail-grid-wide">
        <div class="detail-box"><span>Student</span><strong>${escapeHtml(row.studentName || "—")}</strong></div>
        <div class="detail-box"><span>Class</span><strong>${escapeHtml(row.classId || "—")}</strong></div>
        <div class="detail-box"><span>Exam</span><strong>${escapeHtml(row.examTitle || row.examId || "—")}</strong></div>
        <div class="detail-box"><span>Submitted</span><strong>${escapeHtml(row.submittedAtLocal || formatDate(row.submittedAt))}</strong></div>
        <div class="detail-box"><span>Score</span><strong>${row.score ?? review?.score ?? "—"}/${row.maxScore ?? review?.maxScore ?? "—"}</strong></div>
        <div class="detail-box"><span>Percentage</span><strong>${typeof row.percentage === "number" ? `${row.percentage}%` : typeof review?.percentage === "number" ? `${review.percentage}%` : "—"}</strong></div>
      </div>

      <section class="detail-section">
        <h3>Part scores</h3>
        ${renderPartScoreCards(parts)}
      </section>

      <section class="detail-section detail-two-column">
        <div>
          <h3>Flagged questions</h3>
          <p>${Array.isArray(flags) && flags.length ? flags.map(escapeHtml).join(", ") : "None"}</p>
        </div>
        <div>
          <h3>Notes</h3>
          <p>${escapeHtml(row.notes || "No notes.")}</p>
        </div>
      </section>

      <section class="detail-section">
        <h3>Answers vs answer key</h3>
        ${review?.error ? `<p class="detail-warning">${escapeHtml(review.error)}</p>` : ""}
        ${renderAnswerReview(review.rows || [])}
      </section>
    `;
  }


  /* ---------------------------------------------- 
  OPEN WRITING DETAILS 
  ---------------------------------------------- */
  function openWritingDetails(row) {
    const payload = payloadFromRow(row);
    const flags = safeJson(row.flaggedJson, row.flagged || payload.flagged || []);
    const samples = extractWritingSamples(row, payload);
    const submittedAt = row.submittedAtLocal || formatDate(row.submittedAt || payload.submittedAt);

    detailsContent.innerHTML = `
      <div class="detail-grid detail-grid-wide">
        <div class="detail-box"><span>Student</span><strong>${escapeHtml(row.studentName || payload.studentName || "—")}</strong></div>
        <div class="detail-box"><span>Class</span><strong>${escapeHtml(row.classId || payload.classId || "—")}</strong></div>
        <div class="detail-box"><span>Exam</span><strong>${escapeHtml(row.examTitle || payload.examTitle || row.examId || "—")}</strong></div>
        <div class="detail-box"><span>Submitted</span><strong>${escapeHtml(submittedAt)}</strong></div>
        <div class="detail-box"><span>Status</span><strong>Manual writing review</strong></div>
        <div class="detail-box"><span>Selected Part 2</span><strong>${escapeHtml(selectedPart2Label(payload, samples))}</strong></div>
      </div>

      <section class="detail-section writing-review-actions">
        <div>
          <h3>B2 Writing marking</h3>
          <p class="muted">Score each writing sample from 0–5 in the four Cambridge-style subscales. Totals are calculated here only and are not stored.</p>
        </div>
        <button class="secondary-btn" data-toggle-rubric type="button">Open B2 writing rubric</button>
      </section>

      <section class="detail-section writing-rubric-panel hidden" data-writing-rubric>
        ${renderWritingRubric()}
      </section>

      <section class="detail-section writing-total-panel">
        <article class="writing-total-card"><span>Total score</span><strong data-writing-total>0/40</strong></article>
        <article class="writing-total-card"><span>Percentage</span><strong data-writing-percent>0%</strong></article>
        <article class="writing-total-card"><span>Samples scored</span><strong data-writing-samples-scored>0/${samples.length}</strong></article>
      </section>

      <section class="detail-section">
        <h3>Writing samples</h3>
        ${samples.length ? samples.map(renderWritingSample).join("") : `<p class="muted">No writing samples were found in this submission.</p>`}
      </section>

      <section class="detail-section detail-two-column">
        <div>
          <h3>Flagged writing tasks</h3>
          <p>${Array.isArray(flags) && flags.length ? flags.map(escapeHtml).join(", ") : "None"}</p>
        </div>
        <div>
          <h3>Student notes</h3>
          <p>${escapeHtml(row.notes || payload.notes || "No notes.")}</p>
        </div>
      </section>
    `;

    detailsContent.querySelector("[data-toggle-rubric]")?.addEventListener("click", () => {
      const rubric = detailsContent.querySelector("[data-writing-rubric]");
      rubric?.classList.toggle("hidden");
    });
    detailsContent.querySelectorAll("[data-writing-score]").forEach(input => {
      input.addEventListener("input", updateWritingTotals);
    });
    updateWritingTotals();
  }

  /* ---------------------------------------------- 
  EXTRACT WRITING SAMPLES 
  ---------------------------------------------- */
  function extractWritingSamples(row, payload) {
    const list = [];
    const seen = new Set();

    addWritingSamples(list, seen, parseJsonDeep(payload?.writingSamples, firstJsonFrom(row, ["writingSamplesJson", "writingSamples"], [])));

    const answers = parseJsonDeep(payload?.answers, firstJsonFrom(row, ["answersJson", "answers", "studentAnswersJson", "studentAnswers", "responsesJson", "responses"], {}));
    const part1 = getAnswerFromNested(answers, "part1", 1);
    if (String(part1 || "").trim()) addWritingSample(list, seen, { question: 1, answer: part1 });

    [2, 3, 4].forEach(question => {
      const answer = getAnswerFromNested(answers, "part2", question);
      if (String(answer || "").trim()) addWritingSample(list, seen, { part: 2, partId: "part2", question, answer });
    });

    addWritingSamples(list, seen, parseJsonDeep(payload?.part2Drafts, firstJsonFrom(row, ["part2DraftsJson", "part2Drafts"], [])));
    addWritingSamples(list, seen, parseJsonDeep(payload?.answerList, firstJsonFrom(row, ["answerListJson", "answerList"], [])));

    return list.sort((a, b) => Number(a.part || 0) - Number(b.part || 0) || Number(a.question || 0) - Number(b.question || 0));
  }

  /* ---------------------------------------------- 
  ADD WRITING SAMPLES 
  ---------------------------------------------- */
  function addWritingSamples(list, seen, samples) {
    if (!Array.isArray(samples)) return;
    samples.forEach(sample => addWritingSample(list, seen, sample));
  }

  /* ---------------------------------------------- 
  ADD WRITING SAMPLE 
  ---------------------------------------------- */
  function addWritingSample(list, seen, sample) {
    const answer = sample?.answer ?? sample?.value ?? "";
    if (!String(answer || "").trim()) return;
    const enriched = enrichWritingSample({ ...sample, answer });
    const key = `${enriched.partId || ""}-${enriched.question || ""}`;
    const existingIndex = list.findIndex(item => `${item.partId || ""}-${item.question || ""}` === key);
    if (existingIndex >= 0) {
      if (String(answer).length > String(list[existingIndex].answer || "").length) list[existingIndex] = enriched;
      return;
    }
    seen.add(key);
    list.push(enriched);
  }

  /* ---------------------------------------------- 
  ENRICH WRITING SAMPLE 
  ---------------------------------------------- */
  function enrichWritingSample(sample) {
    const question = Number(sample?.question || sample?.q || 0);
    const meta = WRITING_TASK_META[question] || {};
    const answer = sample?.answer || "";
    return {
      ...meta,
      ...sample,
      part: sample?.part ?? meta.part ?? (question === 1 ? 1 : 2),
      partId: sample?.partId || meta.partId || (question === 1 ? "part1" : "part2"),
      question: question || sample?.question || sample?.q,
      label: sample?.label || meta.label || (question === 1 ? "Part 1" : "Part 2"),
      taskType: sample?.taskType || meta.taskType || "Writing",
      title: sample?.title || meta.title || `Question ${question || "—"}`,
      targetReader: sample?.targetReader || meta.targetReader || "",
      prompt: sample?.prompt || meta.prompt || "",
      answer,
      wordCount: Number(sample?.wordCount) || countWords(answer)
    };
  }

  /* ---------------------------------------------- 
  GET ANSWER FROM NESTED 
  ---------------------------------------------- */
  function getAnswerFromNested(answers, partId, question) {
    const parsed = parseJsonDeep(answers, {});
    return parsed?.[partId]?.[question] ?? parsed?.[partId]?.[String(question)] ?? parsed?.[question] ?? parsed?.[String(question)] ?? "";
  }

  /* ---------------------------------------------- 
  INFER PART2 QUESTION FROM ANSWERS 
  ---------------------------------------------- */
  function inferPart2QuestionFromAnswers(answers) {
    const parsed = parseJsonDeep(answers, {});
    const part2 = parsed?.part2 || {};
    return [2, 3, 4].find(question => String(part2?.[question] ?? part2?.[String(question)] ?? "").trim()) || null;
  }

  /* ---------------------------------------------- 
  RESOLVE PART2 SELECTED QUESTION 
  ---------------------------------------------- */
  function resolvePart2SelectedQuestion(selected, answers) {
    const parsed = parseJsonDeep(answers, {});
    const selectedNumber = Number(selected);
    if ([2, 3, 4].includes(selectedNumber)) {
      const selectedAnswer = parsed?.part2?.[selectedNumber] ?? parsed?.part2?.[String(selectedNumber)] ?? "";
      if (String(selectedAnswer || "").trim()) return selectedNumber;
    }
    return inferPart2QuestionFromAnswers(parsed) || selectedNumber || null;
  }

  /* ---------------------------------------------- 
  SELECTED PART2 LABEL 
  ---------------------------------------------- */
  function selectedPart2Label(payload, samples) {
    const question = Number(payload?.part2SelectedQuestion || samples.find(sample => Number(sample.part) === 2)?.question || 0);
    if (!question) return "—";
    const meta = WRITING_TASK_META[question] || {};
    return `Question ${question}${meta.taskType ? ` · ${meta.taskType}` : ""}`;
  }

  /* ---------------------------------------------- 
  RENDER WRITING SAMPLE 
  ---------------------------------------------- */
  function renderWritingSample(sample, index) {
    const answer = sample.answer || "";
    const wordCount = Number(sample.wordCount ?? countWords(answer));
    return `
      <article class="writing-sample-card" data-writing-sample="${index}">
        <div class="writing-sample-head">
          <div>
            <p class="eyebrow">${escapeHtml(sample.label || `Part ${sample.part || index + 1}`)} · Question ${escapeHtml(sample.question ?? "—")}</p>
            <h4>${escapeHtml(sample.taskType || "Writing")} — ${escapeHtml(sample.title || "Writing task")}</h4>
            <p class="muted">${escapeHtml(sample.targetReader ? `Target reader: ${sample.targetReader}` : "")}</p>
          </div>
          <span class="word-count-pill">${wordCount} words</span>
        </div>
        ${sample.prompt ? `<details class="writing-prompt-details"><summary>View task prompt</summary><p>${escapeHtml(sample.prompt).replace(/\n/g, "<br>")}</p></details>` : ""}
        <div class="writing-answer-box">${escapeHtml(answer || "No answer submitted.").replace(/\n/g, "<br>")}</div>
        <div class="writing-score-box">
          <div class="subscale-grid">
            ${["Content", "Communicative Achievement", "Organisation", "Language"].map(name => `
              <label>
                <span>${escapeHtml(name)}</span>
                <input data-writing-score data-sample-index="${index}" data-subscale="${escapeAttr(name)}" type="number" min="0" max="5" step="1" inputmode="numeric" placeholder="0–5" />
              </label>
            `).join("")}
          </div>
          <div class="sample-score-line">Sample score: <strong data-sample-total="${index}">0/20</strong></div>
        </div>
      </article>
    `;
  }

  /* ---------------------------------------------- 
  RENDER WRITING RUBRIC 
  ---------------------------------------------- */
  function renderWritingRubric() {
    const cards = [
      ["Content", "Does the answer complete the task? Is everything relevant? Is the target reader fully informed?"],
      ["Communicative Achievement", "Does the writing use the correct style, tone and format for the task? Does it hold the reader’s attention?"],
      ["Organisation", "Is the text well organised and coherent? Are paragraphs, linking words and cohesive devices used effectively?"],
      ["Language", "Is there a good range of vocabulary and grammar? Are errors controlled so communication is clear?"]
    ];
    return `
      <h3>Short B2 Writing rubric</h3>
      <p class="muted">Each subscale is scored from 0 to 5. Each writing sample is worth 20 marks: 5 Content + 5 Communicative Achievement + 5 Organisation + 5 Language.</p>
      <div class="rubric-card-grid">
        ${cards.map(([title, body]) => `<article class="rubric-card"><h4>${escapeHtml(title)}</h4><p>${escapeHtml(body)}</p></article>`).join("")}
      </div>
      <div class="rubric-band-box">
        <strong>Band guide:</strong> 5 = strong B2 performance, 3 = acceptable but with omissions or limited range, 1 = minimally successful, 0 = not relevant or below task requirements. Bands 2 and 4 sit between the neighbouring bands.
      </div>
    `;
  }

  /* ---------------------------------------------- 
  UPDATE WRITING TOTALS 
  ---------------------------------------------- */
  function updateWritingTotals() {
    if (!detailsContent) return;
    const sampleIndexes = Array.from(new Set(Array.from(detailsContent.querySelectorAll("[data-writing-score]")).map(input => input.dataset.sampleIndex)));
    let total = 0;
    let scoredSamples = 0;
    sampleIndexes.forEach(index => {
      const inputs = Array.from(detailsContent.querySelectorAll(`[data-writing-score][data-sample-index="${index}"]`));
      let sampleTotal = 0;
      let complete = true;
      inputs.forEach(input => {
        const value = input.value === "" ? NaN : Math.max(0, Math.min(5, Number(input.value)));
        if (!Number.isFinite(value)) complete = false;
        else sampleTotal += value;
      });
      const target = detailsContent.querySelector(`[data-sample-total="${index}"]`);
      if (target) target.textContent = `${sampleTotal}/20`;
      total += sampleTotal;
      if (complete && inputs.length === 4) scoredSamples += 1;
    });
    const max = sampleIndexes.length * 20;
    const percent = max ? Math.round((total / max) * 100) : 0;
    const totalEl = detailsContent.querySelector("[data-writing-total]");
    const percentEl = detailsContent.querySelector("[data-writing-percent]");
    const samplesEl = detailsContent.querySelector("[data-writing-samples-scored]");
    if (totalEl) totalEl.textContent = `${total}/${max}`;
    if (percentEl) percentEl.textContent = `${percent}%`;
    if (samplesEl) samplesEl.textContent = `${scoredSamples}/${sampleIndexes.length}`;
  }

  /* ---------------------------------------------- 
  FORMAT WRITING MINI 
  ---------------------------------------------- */
  function formatWritingMini(row) {
    const payload = payloadFromRow(row);
    const samples = extractWritingSamples(row, payload);
    if (!samples.length) return "Writing · manual review";
    return samples.map(sample => `Q${sample.question}: ${sample.wordCount ?? countWords(sample.answer)} words`).join(" · ");
  }

  /* ---------------------------------------------- 
  COUNT WORDS 
  ---------------------------------------------- */
  function countWords(text) {
    return String(text || "").trim().split(/\s+/).filter(Boolean).length;
  }

  /* ---------------------------------------------- 
  IS WRITING SUBMISSION 
  ---------------------------------------------- */
  function isWritingSubmission(row) {
    const id = String(row?.examId || "").toLowerCase();
    const title = String(row?.examTitle || "").toLowerCase();
    const skill = String(row?.skill || "").toLowerCase();
    if (id.includes("writing") || title.includes("writing") || skill === "writing") return true;

    const payload = payloadFromRow(row);
    const payloadSkill = String(payload.skill || "").toLowerCase();
    if (payloadSkill === "writing") return true;

    const samples = parseJsonDeep(payload.writingSamples, []);
    return Array.isArray(samples) && samples.some(sample => String(sample?.answer || "").trim());
  }

  /* ---------------------------------------------- 
  BUILD ANSWER REVIEW 
  ---------------------------------------------- */
  async function buildAnswerReview(row) {
    const payload = payloadFromRow(row);
    const flatAnswers = window.BrightonGrading?.flattenAnswers
      ? window.BrightonGrading.flattenAnswers(payload)
      : flattenAnswersFallback(payload);
    const answersByQuestion = new Map(flatAnswers.map(item => [String(item.question), item.answer]));
    const examId = row.examId || payload.examId || "brighton-b2-rue-final";

    let answerKey = null;
    let graded = null;
    let gradingError = "";

    if (window.BrightonGrading) {
      try {
        answerKey = await getAnswerKey(examId);
        graded = window.BrightonGrading.gradeSubmission(payload, answerKey);
      } catch (error) {
        gradingError = `Could not load answer key for this exam. Showing submitted answers only. ${error.message || error}`;
      }
    } else {
      gradingError = "Grading tools are not available on this page. Showing submitted answers only.";
    }

    const detailsByQuestion = new Map((graded?.details || safeJson(row.gradingDetailsJson, row.gradingDetails || []) || []).map(item => [String(item.question), item]));
    const questionNumbers = getReviewQuestionNumbers(answerKey, flatAnswers);
    const reviewRows = questionNumbers.map(question => {
      const keyRule = answerKey?.answers?.[String(question)];
      const detail = detailsByQuestion.get(String(question));
      const studentAnswer = answersByQuestion.get(String(question)) ?? detail?.answer ?? "";
      return {
        question,
        part: Number(keyRule?.part ?? detail?.part ?? findAnswerPart(flatAnswers, question) ?? 0),
        studentAnswer,
        expected: expectedAnswerText(keyRule),
        earned: detail?.earned,
        max: detail?.max ?? keyRule?.points,
        status: answerStatus(detail)
      };
    });

    return {
      rows: reviewRows,
      partScores: graded?.partScores,
      score: graded?.score,
      maxScore: graded?.maxScore,
      percentage: graded?.percentage,
      error: gradingError
    };
  }

  /* ---------------------------------------------- 
  RENDER PART SCORE CARDS 
  ---------------------------------------------- */
  function renderPartScoreCards(parts) {
    const entries = Object.entries(parts || {}).sort(([a], [b]) => partSortValue(a) - partSortValue(b));
    if (!entries.length) return `<p class="muted">No part score data available.</p>`;
    return `<div class="part-score-grid">${entries.map(([key, value]) => {
      const label = value?.label || key.replace(/part/i, "Part ");
      const score = value?.score ?? "—";
      const max = value?.maxScore ?? "—";
      const correctText = Number.isFinite(Number(value?.correct)) && Number.isFinite(Number(value?.total))
        ? `${value.correct}/${value.total} correct`
        : "";
      return `
        <article class="part-score-card">
          <span>${escapeHtml(label)}</span>
          <strong>${escapeHtml(score)}/${escapeHtml(max)}</strong>
          ${correctText ? `<small>${escapeHtml(correctText)}</small>` : ""}
        </article>
      `;
    }).join("")}</div>`;
  }

  /* ---------------------------------------------- 
  RENDER ANSWER REVIEW 
  ---------------------------------------------- */
  function renderAnswerReview(reviewRows) {
    if (!reviewRows.length) return `<p class="muted">No submitted answers were found.</p>`;
    return `
      <div class="answer-review-wrap">
        <table class="answer-review-table">
          <thead>
            <tr>
              <th>Question</th>
              <th>Part</th>
              <th>Student answer</th>
              <th>Expected answer</th>
              <th>Score</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            ${reviewRows.map(item => `
              <tr class="${escapeAttr(item.status.className)}">
                <td><strong>${item.question}</strong></td>
                <td>${item.part ? `Part ${item.part}` : "—"}</td>
                <td>${escapeHtml(answerToText(item.studentAnswer) || "—")}</td>
                <td>${escapeHtml(item.expected || "—")}</td>
                <td>${item.earned ?? "—"}/${item.max ?? "—"}</td>
                <td><span class="answer-status ${escapeAttr(item.status.className)}">${escapeHtml(item.status.label)}</span></td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      </div>
    `;
  }

  /* ---------------------------------------------- 
  GET REVIEW QUESTION NUMBERS 
  ---------------------------------------------- */
  function getReviewQuestionNumbers(answerKey, flatAnswers) {
    const fromKey = Object.keys(answerKey?.answers || {}).map(Number).filter(Number.isFinite);
    const fromAnswers = flatAnswers.map(item => Number(item.question)).filter(Number.isFinite);
    return Array.from(new Set([...fromKey, ...fromAnswers])).sort((a, b) => a - b);
  }

  /* ---------------------------------------------- 
  EXPECTED ANSWER TEXT 
  ---------------------------------------------- */
  function expectedAnswerText(rule) {
    if (!rule) return "—";
    if (Array.isArray(rule.answers) && rule.answers.length) return rule.answers.map(answerToText).join(" / ");
    if (Array.isArray(rule.components) && rule.components.length) {
      return rule.components.map((component, index) => {
        const variants = (component.any || []).map(answerToText).filter(Boolean).slice(0, 5).join(" / ");
        return `Component ${index + 1}: ${variants || "—"}`;
      }).join(" | ");
    }
    return "—";
  }

  /* ---------------------------------------------- 
  ANSWER STATUS 
  ---------------------------------------------- */
  function answerStatus(detail) {
    if (!detail) return { label: "Not graded", className: "status-unknown" };
    const earned = Number(detail.earned || 0);
    const max = Number(detail.max || 0);
    if (earned >= max && max > 0) return { label: "Correct", className: "status-correct" };
    if (earned > 0) return { label: "Partial", className: "status-partial" };
    return { label: "Incorrect", className: "status-incorrect" };
  }

  /* ---------------------------------------------- 
  FIND ANSWER PART 
  ---------------------------------------------- */
  function findAnswerPart(flatAnswers, question) {
    return flatAnswers.find(item => Number(item.question) === Number(question))?.part;
  }

  /* ---------------------------------------------- 
  FLATTEN ANSWERS FALLBACK 
  ---------------------------------------------- */
  function flattenAnswersFallback(payload) {
    if (Array.isArray(payload?.answerList)) return payload.answerList;
    const answers = payload?.answers || {};
    const flat = [];
    Object.entries(answers).forEach(([partId, partAnswers]) => {
      const part = Number(String(partId).replace(/\D+/g, "")) || null;
      Object.entries(partAnswers || {}).forEach(([q, answer]) => {
        flat.push({ part, partId, question: Number(q), answer });
      });
    });
    return flat.sort((a, b) => Number(a.question) - Number(b.question));
  }

  /* ---------------------------------------------- 
  ANSWER TO TEXT 
  ---------------------------------------------- */
  function answerToText(value) {
    if (value === undefined || value === null) return "";
    if (Array.isArray(value)) return value.map(answerToText).join(", ");
    if (typeof value === "object") return JSON.stringify(value);
    return String(value);
  }

  /* ---------------------------------------------- 
  PART SORT VALUE 
  ---------------------------------------------- */
  function partSortValue(key) {
    const number = Number(String(key).match(/\d+/)?.[0] || 0);
    return Number.isFinite(number) ? number : 0;
  }

  /* ---------------------------------------------- 
  CLOSE MODAL 
  ---------------------------------------------- */
  function closeModal() {
    hideModalWithoutUrl();
    syncUrlFromControls({ replace: true, clearOpen: true, keepOpen: false });
  }

  /* ---------------------------------------------- 
  HIDE MODAL WITHOUT URL 
  ---------------------------------------------- */
  function hideModalWithoutUrl() {
    activeProgressPreviewId = "";
    modal.classList.add("hidden");
    modal.setAttribute("aria-hidden", "true");
  }

  /* ---------------------------------------------- 
  CLEAR FILTERS 
  ---------------------------------------------- */
  function clearFilters() {
    classIdInput.value = "";
    examSelect.value = "";
    if (studentInput) studentInput.value = "";
    rows = [];
    progressRows = [];
    hideModalWithoutUrl();
    stopProgressTimer();
    renderProgressRows();
    renderRows();
    updateSummary();
    status.textContent = "Enter a class ID and load results.";
    if (progressStatus) progressStatus.textContent = "Load a class to supervise exams in progress.";
    if (progressUpdatedAt) progressUpdatedAt.textContent = "Not updated yet";
    history.pushState({}, "", location.pathname);
    queryState = readQueryState();
  }

  /* ---------------------------------------------- 
  EXPORT CSV 
  ---------------------------------------------- */
  function exportCsv() {
    const visibleRows = getFilteredRows();
    if (!visibleRows.length) return showToast("No rows to export");
    const headers = ["studentName", "classId", "examTitle", "submittedAt", "score", "maxScore", "percentage", "partScoresJson"];
    const csv = [headers.join(",")].concat(visibleRows.map(row => headers.map(h => csvCell(row[h])).join(","))).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `brighton-results-${normalizeClassCode(classIdInput.value) || "class"}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  /* ---------------------------------------------- 
  FORMAT PARTS 
  ---------------------------------------------- */
  function formatParts(parts) {
    if (!parts || typeof parts !== "object") return "—";
    return Object.entries(parts).map(([key, value]) => {
      if (value && typeof value === "object") return `${key}: ${value.score ?? "—"}/${value.maxScore ?? "—"}`;
      return `${key}: ${value}`;
    }).join(" · ");
  }

  /* ---------------------------------------------- 
  FIRST JSON FROM 
  ---------------------------------------------- */
  function firstJsonFrom(source, fieldNames, fallback) {
    for (const field of fieldNames) {
      if (source && Object.prototype.hasOwnProperty.call(source, field) && source[field] !== undefined && source[field] !== null && source[field] !== "") {
        return parseJsonDeep(source[field], fallback);
      }
    }
    return parseJsonDeep(fallback, fallback);
  }

  /* ---------------------------------------------- 
  SAFE JSON 
  ---------------------------------------------- */
  function safeJson(value, fallback) {
    return parseJsonDeep(value, fallback);
  }

  /* ---------------------------------------------- 
  PARSE JSON DEEP 
  ---------------------------------------------- */
  function parseJsonDeep(value, fallback) {
    if (value === undefined || value === null || value === "") return fallback;
    if (typeof value !== "string") return value;
    let current = value;
    for (let i = 0; i < 3; i += 1) {
      if (typeof current !== "string") return current;
      const trimmed = current.trim();
      if (!trimmed) return fallback;
      try {
        current = JSON.parse(trimmed);
      } catch {
        return i === 0 ? fallback : current;
      }
    }
    return current;
  }



  /* ---------------------------------------------- 
  READ QUERY STATE 
  ---------------------------------------------- */
  function readQueryState() {
    const params = new URLSearchParams(location.search);
    const pick = (...names) => names.map(name => params.get(name)).find(value => value !== null && value !== "") || "";
    return {
      classId: normalizeClassCode(pick("classId", "class", "c")),
      examId: pick("examId", "exam", "e").trim(),
      student: pick("student", "studentName", "s").trim(),
      openStudent: pick("openStudent", "focusStudent").trim(),
      submittedAt: pick("submittedAt", "submitted").trim(),
      progressId: pick("progressId").trim(),
      open: normalizeOpenMode(pick("open", "modal", "details")),
      view: normalizeViewMode(pick("view", "screen", "tab")),
      autoLoad: pick("auto") !== "0"
    };
  }

  /* ---------------------------------------------- 
  APPLY QUERY STATE TO CONTROLS 
  ---------------------------------------------- */
  function applyQueryStateToControls(state) {
    if (state.classId) classIdInput.value = state.classId;
    if (studentInput) studentInput.value = state.student || "";
    if (state.examId) {
      examSelect.dataset.prefill = state.examId;
      examSelect.value = state.examId;
    }
  }

  /* ---------------------------------------------- 
  SYNC URL FROM CONTROLS 
  ---------------------------------------------- */
  function syncUrlFromControls(options = {}) {
    const params = new URLSearchParams(location.search);
    ["classId", "class", "c", "examId", "exam", "e", "student", "studentName", "s", "view", "screen", "tab", "open", "modal", "details", "openStudent", "focusStudent", "submittedAt", "submitted", "progressId", "auto"].forEach(key => params.delete(key));

    const classId = normalizeClassCode(classIdInput.value);
    const examId = examSelect.value.trim();
    const student = getStudentFilterRaw();
    const view = normalizeViewMode(options.view || queryState.view || "");

    if (classId) params.set("classId", classId);
    if (examId) params.set("examId", examId);
    if (student) params.set("student", student);
    if (view) params.set("view", view);

    if (options.open && options.row) {
      params.set("open", options.open);
      params.set("openStudent", options.row.studentName || "");
      if (options.open === "progress" && options.row.progressId) params.set("progressId", options.row.progressId);
      if (options.open === "details" && options.row.submittedAt) params.set("submittedAt", options.row.submittedAt);
    } else if (!options.clearOpen && options.keepOpen && queryState.open) {
      params.set("open", queryState.open);
      if (queryState.openStudent) params.set("openStudent", queryState.openStudent);
      if (queryState.submittedAt) params.set("submittedAt", queryState.submittedAt);
      if (queryState.progressId) params.set("progressId", queryState.progressId);
    }

    const next = `${location.pathname}${params.toString() ? `?${params.toString()}` : ""}`;
    const method = options.replace === false ? "pushState" : "replaceState";
    history[method]({}, "", next);
    queryState = readQueryState();
  }

  /* ---------------------------------------------- 
  HANDLE POP STATE 
  ---------------------------------------------- */
  async function handlePopState() {
    queryState = readQueryState();
    applyQueryStateToControls(queryState);
    if (!queryState.open) hideModalWithoutUrl();
    if (queryState.classId) await loadResults({ updateUrl: false, fromQuery: true });
    else clearFiltersWithoutUrl();
  }

  /* ---------------------------------------------- 
  SCHEDULE STUDENT FILTER UPDATE 
  ---------------------------------------------- */
  function scheduleStudentFilterUpdate() {
    clearTimeout(studentFilterTimer);
    studentFilterTimer = setTimeout(() => {
      renderRows();
      renderProgressRows();
      updateSummary();
      syncUrlFromControls({ replace: true, keepOpen: true });
    }, 120);
  }

  /* ---------------------------------------------- 
  GET FILTERED ROWS 
  ---------------------------------------------- */
  function getFilteredRows() {
    const filter = getStudentFilter();
    return rows.filter(row => matchesStudentFilter(row, filter));
  }

  /* ---------------------------------------------- 
  GET FILTERED PROGRESS ROWS 
  ---------------------------------------------- */
  function getFilteredProgressRows() {
    const filter = getStudentFilter();
    return progressRows.filter(row => matchesStudentFilter(row, filter));
  }

  /* ---------------------------------------------- 
  GET STUDENT FILTER 
  ---------------------------------------------- */
  function getStudentFilter() {
    return getStudentFilterRaw().toLowerCase();
  }

  /* ---------------------------------------------- 
  GET STUDENT FILTER RAW 
  ---------------------------------------------- */
  function getStudentFilterRaw() {
    return String(studentInput?.value || "").trim();
  }

  /* ---------------------------------------------- 
  MATCHES STUDENT FILTER 
  ---------------------------------------------- */
  function matchesStudentFilter(row, filter) {
    if (!filter) return true;
    return String(row?.studentName || "").toLowerCase().includes(filter);
  }

  /* ---------------------------------------------- 
  OPEN REQUESTED MODAL 
  ---------------------------------------------- */
  function openRequestedModal() {
    queryState = readQueryState();
    if (!queryState.open) return;
    if (queryState.open === "progress") {
      const live = findProgressRowFromQuery(queryState);
      if (live) openProgressDetails(live, { fromQuery: true });
      return;
    }
    const submission = findSubmissionRowFromQuery(queryState);
    if (submission) openDetails(submission, { fromQuery: true });
  }

  /* ---------------------------------------------- 
  FIND SUBMISSION ROW FROM QUERY 
  ---------------------------------------------- */
  function findSubmissionRowFromQuery(state) {
    const targetStudent = String(state.openStudent || state.student || "").toLowerCase();
    const targetSubmitted = String(state.submittedAt || "");
    const candidates = getFilteredRows().length ? getFilteredRows() : rows;
    return candidates.find(row => {
      const studentOk = !targetStudent || String(row.studentName || "").toLowerCase() === targetStudent || String(row.studentName || "").toLowerCase().includes(targetStudent);
      const submittedOk = !targetSubmitted || String(row.submittedAt || "") === targetSubmitted || String(row.submittedAtLocal || "") === targetSubmitted;
      return studentOk && submittedOk;
    }) || null;
  }

  /* ---------------------------------------------- 
  FIND PROGRESS ROW FROM QUERY 
  ---------------------------------------------- */
  function findProgressRowFromQuery(state) {
    const targetStudent = String(state.openStudent || state.student || "").toLowerCase();
    const targetProgressId = String(state.progressId || "");
    const candidates = getFilteredProgressRows().length ? getFilteredProgressRows() : progressRows;
    return candidates.find(row => {
      const progressOk = !targetProgressId || String(row.progressId || "") === targetProgressId;
      const studentOk = !targetStudent || String(row.studentName || "").toLowerCase() === targetStudent || String(row.studentName || "").toLowerCase().includes(targetStudent);
      return progressOk && studentOk;
    }) || null;
  }

  /* ---------------------------------------------- 
  SCROLL TO REQUESTED SCREEN 
  ---------------------------------------------- */
  function scrollToRequestedScreen(view) {
    const target = view === "live" ? document.querySelector(".progress-card") : view === "submissions" ? document.querySelector(".results-card:not(.progress-card)") : null;
    if (!target) return;
    document.querySelectorAll(".url-target-highlight").forEach(el => el.classList.remove("url-target-highlight"));
    target.classList.add("url-target-highlight");
    setTimeout(() => target.classList.remove("url-target-highlight"), 1800);
    window.setTimeout(() => target.scrollIntoView({ behavior: "smooth", block: "start" }), 80);
  }

  /* ---------------------------------------------- 
  IS HIGHLIGHTED ROW 
  ---------------------------------------------- */
  function isHighlightedRow(row) {
    const target = String(queryState.openStudent || queryState.student || "").toLowerCase();
    if (!target) return false;
    return String(row?.studentName || "").toLowerCase().includes(target);
  }

  /* ---------------------------------------------- 
  COPY SHARE LINK 
  ---------------------------------------------- */
  async function copyShareLink() {
    syncUrlFromControls({ replace: true, keepOpen: true });
    try {
      await navigator.clipboard.writeText(location.href);
      showToast("Link copied");
    } catch {
      showToast("Copy this URL from the address bar");
    }
  }

  /* ---------------------------------------------- 
  NORMALIZE VIEW MODE 
  ---------------------------------------------- */
  function normalizeViewMode(value) {
    const view = String(value || "").trim().toLowerCase();
    if (["live", "progress", "monitor", "monitoring"].includes(view)) return "live";
    if (["submissions", "results", "submitted", "details"].includes(view)) return "submissions";
    return "";
  }

  /* ---------------------------------------------- 
  NORMALIZE OPEN MODE 
  ---------------------------------------------- */
  function normalizeOpenMode(value) {
    const open = String(value || "").trim().toLowerCase();
    if (["progress", "live", "preview"].includes(open)) return "progress";
    if (["details", "submission", "student"].includes(open)) return "details";
    return "";
  }

  /* ---------------------------------------------- 
  CLEAR FILTERS WITHOUT URL 
  ---------------------------------------------- */
  function clearFiltersWithoutUrl() {
    classIdInput.value = "";
    examSelect.value = "";
    if (studentInput) studentInput.value = "";
    rows = [];
    progressRows = [];
    hideModalWithoutUrl();
    stopProgressTimer();
    renderProgressRows();
    renderRows();
    updateSummary();
    status.textContent = "Enter a class ID and load results.";
    if (progressStatus) progressStatus.textContent = "Load a class to supervise exams in progress.";
    if (progressUpdatedAt) progressUpdatedAt.textContent = "Not updated yet";
  }


  /* ---------------------------------------------- 
  NORMALIZE CLASS INPUT 
  ---------------------------------------------- */
  function normalizeClassInput() {
    const normalized = normalizeClassCode(classIdInput.value);
    if (normalized) classIdInput.value = normalized;
    return normalized;
  }

  /* ---------------------------------------------- 
  NORMALIZE CLASS CODE 
  ---------------------------------------------- */
  function normalizeClassCode(value) {
    return App.normalizeClassCode ? App.normalizeClassCode(value) : String(value || "").trim().toUpperCase();
  }

  /* ---------------------------------------------- 
  FORMAT DATE 
  ---------------------------------------------- */
  function formatDate(value) {
    return App.formatDate ? App.formatDate(value) : String(value || "—");
  }

  /* ---------------------------------------------- 
  CSV CELL 
  ---------------------------------------------- */
  function csvCell(value) {
    return App.csvCell ? App.csvCell(value) : `"${String(value ?? "").replace(/"/g, '""')}"`;
  }

  /* ---------------------------------------------- 
  SHOW TOAST 
  ---------------------------------------------- */
  function showToast(message) {
    toast.textContent = message;
    toast.classList.add("show");
    clearTimeout(showToast.timer);
    showToast.timer = setTimeout(() => toast.classList.remove("show"), 1800);
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

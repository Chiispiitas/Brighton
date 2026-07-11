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

  const WRITING_TASK_META_BY_EXAM = {
    b2: {
      1: { part: 1, partId: "part1", question: 1, label: "Part 1", taskType: "Essay", title: "Essay: environment and everyday action", targetReader: "Your English teacher", prompt: "In your English class you have been talking about the environment.\n\nSome people say that schools and companies should do much more to reduce waste and pollution. Do you agree?\n\nNotes: transport; daily habits; your own idea\n\nWrite an essay using all the notes and giving reasons for your point of view." },
      2: { part: 2, partId: "part2", question: 2, label: "Part 2", taskType: "Article", title: "Article: design that improves everyday life", targetReader: "Readers of a college English-language magazine", prompt: "You see this announcement in your college English-language magazine.\n\nArticles wanted: Better design, better lives\n\nWrite an article about a product, building or public place that you think is well designed. Explain what makes the design useful and say how it could be improved even more.\n\nThe best articles will be published in next month’s magazine.\n\nWrite your article." },
      3: { part: 2, partId: "part2", question: 3, label: "Part 2", taskType: "Email", title: "Email: advice about learning and work", targetReader: "An English-speaking friend", prompt: "Your English-speaking friend Sam has written to you for advice.\n\nI’m thinking of taking an online course while doing a part-time job. I’m worried I won’t have enough time, but I also don’t want to miss a good opportunity. What do you think I should do?\n\nWrite an email to Sam giving your opinion. Suggest how Sam could organise the week and explain what problems to avoid." },
      4: { part: 2, partId: "part2", question: 4, label: "Part 2", taskType: "Review", title: "Review: a story that made you think", targetReader: "Readers of an English-language student website", prompt: "You see this announcement on an English-language website for students.\n\nReviews wanted\n\nHave you read a book, watched a film or seen a series which made you think about facts, fake news or real life? Write a review describing it and explaining why it made an impression on you. Say whether you would recommend it to other students.\n\nThe best reviews will be posted on the website.\n\nWrite your review." }
    },
    b1plus: {
      1: { part: 1, partId: "part1", question: 1, label: "Part 1", taskType: "Picture description", title: "Picture description 1", targetReader: "", prompt: "Look at picture 1 and describe what you can see. Write more than two sentences. Include as many details as you can." },
      2: { part: 1, partId: "part1", question: 2, label: "Part 1", taskType: "Picture description", title: "Picture description 2", targetReader: "", prompt: "Look at picture 2 and describe what you can see. Write more than two sentences. Include as many details as you can." },
      3: { part: 2, partId: "part2", question: 3, label: "Part 2", taskType: "Email", title: "Email: replying to Tania", targetReader: "An English-speaking friend", prompt: "Read this email from your English-speaking friend Tania.\n\nHi,\n\nI’m so pleased you’ve invited me to your birthday party.\n\nI’m really looking forward to seeing you.\n\nOf course I want to buy you a present. I don’t know what you’d prefer – something to wear perhaps, or would you like the money to buy something yourself?\n\nWhat time would you like me to arrive?\n\nAnd would you like me to bring some food?\n\nSee you soon!\n\nTania\n\nWrite your email replying to Tania." },
      4: { part: 3, partId: "part3", question: 4, label: "Part 3", taskType: "Story", title: "Story: surprise at the door", targetReader: "Your English teacher", prompt: "Your English teacher has asked you to write a story.\n\nYour story must begin with this sentence:\n\nWhen I opened the door, I couldn’t believe my eyes.\n\nWrite your story." }
    },
    a2rw: {
      31: { part: 6, partId: "part6", question: 31, label: "Part 6", taskType: "Email", title: "Email: visiting a friend's city", targetReader: "An English-speaking friend", prompt: "You are going to visit your friend's city next weekend. Write an email to your friend. In your email, say when you will arrive, ask about the weather, and suggest one activity to do together." },
      32: { part: 7, partId: "part7", question: 32, label: "Part 7", taskType: "Story", title: "Story: rainy morning", targetReader: "Your English teacher", prompt: "Look at the three pictures. Write the story shown in the pictures: a student waits for a late bus in the rain, meets a classmate and shares an umbrella, then arrives at school and laughs about the rainy morning." }
    }
  };

  const WRITING_RUBRIC_PROFILES = {
    b2: {
      id: "b2",
      levelLabel: "B2",
      title: "Short B2 Writing rubric",
      actionTitle: "B2 Writing marking",
      actionText: "Score each writing sample from 0–5 in the four Cambridge-style subscales. Totals are calculated here only and are not stored.",
      buttonText: "Open B2 writing rubric",
      choiceBased: true,
      defaultSubscales: ["Content", "Communicative Achievement", "Organisation", "Language"],
      cards: [
        ["Content", "Does the answer complete the task? Is everything relevant? Is the target reader fully informed?"],
        ["Communicative Achievement", "Does the writing use the correct style, tone and format for the task? Does it hold the reader’s attention?"],
        ["Organisation", "Is the text well organised and coherent? Are paragraphs, linking words and cohesive devices used effectively?"],
        ["Language", "Is there a good range of vocabulary and grammar? Are errors controlled so communication is clear?"]
      ],
      note: "Each subscale is scored from 0 to 5. Each writing sample is worth 20 marks.",
      bandGuide: "5 = strong B2 performance, 3 = acceptable but with omissions or limited range, 1 = minimally successful, 0 = not relevant or below task requirements."
    },
    b1plus: {
      id: "b1plus",
      levelLabel: "B1+",
      title: "Short B1+ Writing rubric",
      actionTitle: "B1+ Writing marking",
      actionText: "Score each writing sample from 0–5 in its required subscales. Picture descriptions use only Content and Organization. Email and story tasks use the four Cambridge-style writing subscales.",
      buttonText: "Open B1+ writing rubric",
      choiceBased: false,
      defaultSubscales: ["Content", "Communicative Achievement", "Organization", "Language"],
      pictureSubscales: ["Content", "Organization"],
      cards: [
        ["Picture description · Content", "The answer describes the picture clearly, includes relevant people, places, actions and objects, and gives more than two meaningful sentences."],
        ["Picture description · Organization", "The description is easy to follow, with clear sentence order, logical details and simple linking where useful."],
        ["Email/Story · Content", "The answer completes the task, answers the required points, and gives enough relevant detail for a B1+ reader."],
        ["Email/Story · Communicative Achievement", "The writing uses a suitable format and tone: friendly and informal for the email, and clear narrative style for the story."],
        ["Email/Story · Organization", "Ideas are connected clearly with paragraphs, sequencing and linking words such as because, so, then, after that, however or finally."],
        ["Email/Story · Language", "The writing uses appropriate B1+ vocabulary and a range of simple and some complex grammar. Errors may appear but meaning should remain clear."]
      ],
      note: "Picture descriptions: Content + Organization only. Email and story: Content + Communicative Achievement + Organization + Language.",
      bandGuide: "5 = strong B1+ performance with clear, developed ideas; 3 = generally successful but with some omissions or limited range; 1 = minimally successful; 0 = not attempted, not relevant or impossible to understand."
    },
    a2rw: {
      id: "a2rw",
      levelLabel: "A2",
      title: "Short A2 Writing rubric",
      actionTitle: "A2 Writing marking",
      actionText: "Score Parts 6 and 7 after checking the Reading answer table. Each A2 writing task uses Content, Organization and Language.",
      buttonText: "Open A2 writing rubric",
      choiceBased: false,
      defaultSubscales: ["Content", "Organization", "Language"],
      cards: [
        ["Content", "The answer completes the required points and gives enough relevant detail for an A2 reader."],
        ["Organization", "The text is easy to follow, with simple sentence order and basic linking such as and, but, because, then or after that."],
        ["Language", "The writing uses appropriate A2 vocabulary and grammar. Errors may appear, but the meaning should be clear."],
        ["Task length", "Part 6 should be at least 25 words. Part 7 should be at least 35 words."]
      ],
      note: "A2 Reading and Writing is mixed: Reading Parts 1–5 are checked against the answer key first. Writing Parts 6–7 are reviewed at the end.",
      bandGuide: "5 = strong A2 performance, 3 = generally successful but with some omissions, 1 = minimally successful, 0 = not attempted, not relevant or impossible to understand. Bands 2 and 4 sit between neighbouring bands."
    }
  };

  bindEvents();
  init();

  function bindEvents() {
    classIdInput?.addEventListener("blur", () => { normalizeClassInput(); syncUrlFromControls({ replace: true, keepOpen: true }); });
    examSelect?.addEventListener("change", () => syncUrlFromControls({ replace: true, keepOpen: true }));
    studentInput?.addEventListener("input", scheduleStudentFilterUpdate);
    loadBtn?.addEventListener("click", () => loadResults({ updateUrl: true, view: "submissions" }));
    clearBtn?.addEventListener("click", clearFilters);
    exportBtn?.addEventListener("click", exportCsv);
    shareLinkBtn?.addEventListener("click", copyShareLink);
    closeModalBtn?.addEventListener("click", closeModal);
    modal?.addEventListener("click", event => { if (event.target === modal) closeModal(); });
    window.addEventListener("popstate", handlePopState);
  }

  async function init() {
    queryState = readQueryState();
    applyQueryStateToControls(queryState);
    await loadExams();
    applyQueryStateToControls(queryState);
    if (queryState.classId && queryState.autoLoad) await loadResults({ updateUrl: false, fromQuery: true });
    else scrollToRequestedScreen(queryState.view);
  }

  async function loadExams() {
    try {
      if (!apiBase || apiBase.includes("YOUR-WIX")) throw new Error("Brighton Database not configured");
      const res = await fetch(`${apiBase}/getExams`);
      const data = await res.json();
      if (!res.ok || data.success === false) throw new Error(data.error || `HTTP ${res.status}`);
      fillExamSelect(data.exams || []);
    } catch {
      fillExamSelect(config.FALLBACK_EXAMS || []);
      if (status) status.textContent = "Failed to connect to Brighton Database. Check internet connection.";
    }
  }

  function fillExamSelect(exams) {
    if (!examSelect) return;
    const current = queryState.examId || examSelect.dataset.prefill || examSelect.value || "";
    examSelect.innerHTML = `<option value="">All exams</option>` + (exams || []).map(exam => `
      <option value="${escapeAttr(exam.examId)}">${escapeHtml(exam.title || exam.examId)}</option>
    `).join("");
    if (current) examSelect.value = current;
  }

  async function loadResults(options = {}) {
    const classId = normalizeClassInput();
    const examId = examSelect?.value.trim() || "";
    if (options.updateUrl !== false) syncUrlFromControls({ replace: false, view: options.view || "submissions" });
    if (!classId) {
      showToast("Enter a class ID first");
      classIdInput?.focus();
      return;
    }
    if (!apiBase || apiBase.includes("YOUR-WIX")) {
      if (status) status.textContent = "Failed to connect to Brighton Database. Check internet connection.";
      rows = [];
      progressRows = [];
      stopProgressTimer();
      renderProgressRows();
      renderRows();
      updateSummary();
      return;
    }

    if (status) status.textContent = "Loading results...";
    if (resultsBody) resultsBody.innerHTML = `<tr><td colspan="8">Loading...</td></tr>`;

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
      if (status) status.textContent = `${rows.length} submission(s) loaded for ${classId}.${getStudentFilter() ? ` Showing ${visibleCount} matching student row(s).` : ""}${locallyGraded ? ` ${locallyGraded} row(s) graded locally from the answer key.` : ""}`;
      renderRows();
      updateSummary(data.summary);
      scrollToRequestedScreen(queryState.view);
      openRequestedModal();
    } catch (error) {
      if (status) status.textContent = `Could not load results: ${error.message}`;
      rows = [];
      progressRows = [];
      stopProgressTimer();
      renderProgressRows();
      renderRows();
      updateSummary();
    }
  }

  async function applyLocalGrading(items) {
    if (!window.BrightonGrading) return items;
    const updated = [];
    for (const row of items) {
      const copy = { ...row };
      if (isWritingSubmission(copy)) {
        updated.push(copy);
        continue;
      }
      const shouldGrade = copy.score === undefined || copy.score === null || copy.maxScore === undefined || copy.maxScore === null || copy.status === "submitted_ungraded" || isMixedReadingWritingSubmission(copy);
      if (!shouldGrade) {
        updated.push(copy);
        continue;
      }
      try {
        const examId = copy.examId || payloadFromRow(copy).examId || "brighton-b2-rue-final";
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

  async function getAnswerKey(examId) {
    if (answerKeyCache.has(examId)) return answerKeyCache.get(examId);
    const key = await window.BrightonGrading.loadAnswerKey(examId);
    answerKeyCache.set(examId, key);
    return key;
  }

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
      examType: payload.examType || row.examType,
      rubricProfile: payload.rubricProfile || row.rubricProfile,
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

  async function loadProgress() {
    const classId = normalizeClassInput();
    const examId = examSelect?.value.trim() || "";
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

  function startProgressTimer() {
    stopProgressTimer();
    progressTimer = window.setInterval(loadProgress, progressRefreshMs);
  }

  function stopProgressTimer() {
    if (progressTimer) window.clearInterval(progressTimer);
    progressTimer = null;
  }

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

  function progressKey(item) {
    return `${item.examId || ""}|${item.classId || ""}|${item.studentName || ""}`.toLowerCase();
  }

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

  function refreshOpenProgressDetails() {
    if (!activeProgressPreviewId || modal?.classList.contains("hidden")) return;
    const latest = progressRows.find(row => (row.progressId || progressKey(row)) === activeProgressPreviewId);
    if (!latest) return;
    openProgressDetails(latest, { refreshing: true });
  }

  function progressStatusText(row) {
    if (String(row.status || "").toLowerCase() === "submitted") return { label: "Submitted", className: "submitted" };
    if (isProgressStale(row)) return { label: "Connection lost", className: "lost" };
    return { label: "In progress", className: "active" };
  }

  function isProgressStale(row) {
    const last = new Date(row.lastSeenAt || 0).getTime();
    if (!Number.isFinite(last)) return true;
    return (Date.now() - last) > progressStaleSeconds * 1000;
  }

  function formatCurrent(row) {
    const part = row.currentPart ? String(row.currentPart).replace("part", "Part ") : "—";
    const question = row.currentQuestion ? `Q${row.currentQuestion}` : "";
    return `${escapeHtml(part)} ${escapeHtml(question)}`.trim();
  }

  function renderRows() {
    if (!resultsBody) return;
    const visibleRows = getFilteredRows();
    if (!visibleRows.length) {
      const message = rows.length && getStudentFilter() ? "No submissions match this student filter." : "No submissions found.";
      resultsBody.innerHTML = `<tr><td colspan="8">${escapeHtml(message)}</td></tr>`;
      return;
    }

    resultsBody.innerHTML = visibleRows.map((row, index) => {
      const partScores = safeJson(row.partScoresJson, row.partScores || {});
      const writing = isWritingSubmission(row);
      const mixed = isMixedReadingWritingSubmission(row);
      const scoreCell = writing
        ? `<span class="score-pill manual-score-pill">Manual review</span>`
        : `<span class="score-pill">${row.score ?? "—"}/${row.maxScore ?? "—"}</span>`;
      const percentCell = writing ? "—" : (typeof row.percentage === "number" ? `${row.percentage}%` : "—");
      const partsCell = writing ? formatWritingMini(row) : mixed ? formatMixedMini(row, partScores) : formatParts(partScores);
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

  function updateSummary(serverSummary) {
    const visibleRows = getFilteredRows();
    const useServerSummary = !getStudentFilter() && serverSummary;
    const total = useServerSummary ? serverSummary.total : visibleRows.length;
    const percentages = visibleRows.map(r => Number(r.percentage)).filter(Number.isFinite);
    const average = useServerSummary ? serverSummary.average : (percentages.length ? Math.round(percentages.reduce((a, b) => a + b, 0) / percentages.length) : null);
    const highest = useServerSummary ? serverSummary.highest : (percentages.length ? Math.max(...percentages) : null);
    const lowest = useServerSummary ? serverSummary.lowest : (percentages.length ? Math.min(...percentages) : null);
    setText("#summaryTotal", total ?? 0);
    setText("#summaryAverage", average === null || average === undefined ? "—" : `${average}%`);
    setText("#summaryHighest", highest === null || highest === undefined ? "—" : `${highest}%`);
    setText("#summaryLowest", lowest === null || lowest === undefined ? "—" : `${lowest}%`);
  }

  async function openProgressDetails(row, options = {}) {
    if (!row) return;
    if (!options.refreshing && !options.fromQuery) syncUrlFromControls({ replace: false, view: "live", open: "progress", row });
    activeProgressPreviewId = row.progressId || progressKey(row);
    const liveRow = progressRowToSubmissionRow(row);
    const payload = payloadFromRow(liveRow);
    const rowStatus = progressStatusText(row);
    openModal("Live answer preview", options.refreshing ? "" : "Loading live answers...");

    if (isMixedReadingWritingSubmission(liveRow)) {
      await openMixedReadingWritingProgressDetails(row, liveRow, payload, rowStatus);
      return;
    }

    if (isWritingSubmission(liveRow)) {
      const samples = extractWritingSamples(liveRow, payload);
      detailsContent.innerHTML = liveHeader(row, payload, rowStatus, true) + `
        <section class="detail-section">
          <h3>Live writing samples</h3>
          ${samples.length ? samples.map(renderLiveWritingSample).join("") : `<p class="muted">No writing answers have been saved in live progress yet. Keep this window open and it will update automatically.</p>`}
        </section>`;
      return;
    }

    let review;
    try {
      review = await buildAnswerReview(liveRow);
    } catch (error) {
      review = { rows: [], error: error.message || String(error) };
    }
    detailsContent.innerHTML = liveHeader(row, payload, rowStatus, true) + renderReadingReviewSection("Live answers vs answer key", review.rows || [], review.error);
  }

  async function openMixedReadingWritingProgressDetails(row, liveRow, payload, rowStatus) {
    let review;
    try {
      review = await buildAnswerReview(liveRow);
    } catch (error) {
      review = { rows: [], error: error.message || String(error) };
    }
    const rubricProfile = getWritingRubricProfile(liveRow, payload);
    const samples = extractWritingSamples(liveRow, payload, rubricProfile).filter(isA2WritingSample);
    detailsContent.innerHTML = liveHeader(row, payload, rowStatus, true)
      + renderReadingReviewSection("Live Reading answers · Parts 1–5", getMixedReadingRows(review.rows || []), review.error)
      + `<section class="detail-section">
          <h3>Live Writing answers · Parts 6–7</h3>
          ${samples.length ? samples.map(renderLiveWritingSample).join("") : `<p class="muted">No writing answers have been saved in live progress yet. Keep this window open and it will update automatically.</p>`}
        </section>`;
  }

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

  async function openDetails(row, options = {}) {
    if (!row) return;
    if (!options.fromQuery) syncUrlFromControls({ replace: false, view: "submissions", open: "details", row });
    openModal("Submission details", "Loading submission details...");

    if (isMixedReadingWritingSubmission(row)) {
      await openMixedReadingWritingDetails(row);
      return;
    }

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

    detailsContent.innerHTML = submissionHeader(row, payloadFromRow(row), review)
      + renderPartScoresSection(parts)
      + renderFlagsNotesSection(flags, row.notes || payloadFromRow(row).notes)
      + renderReadingReviewSection("Answers vs answer key", review.rows || [], review.error);
  }

  async function openMixedReadingWritingDetails(row) {
    const payload = payloadFromRow(row);
    const flags = safeJson(row.flaggedJson, row.flagged || payload.flagged || []);
    const rubricProfile = getWritingRubricProfile(row, payload);
    const samples = extractWritingSamples(row, payload, rubricProfile).filter(isA2WritingSample);
    const submittedAt = row.submittedAtLocal || formatDate(row.submittedAt || payload.submittedAt);
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
        <div class="detail-box"><span>Student</span><strong>${escapeHtml(row.studentName || payload.studentName || "—")}</strong></div>
        <div class="detail-box"><span>Class</span><strong>${escapeHtml(row.classId || payload.classId || "—")}</strong></div>
        <div class="detail-box"><span>Exam</span><strong>${escapeHtml(row.examTitle || payload.examTitle || row.examId || "—")}</strong></div>
        <div class="detail-box"><span>Submitted</span><strong>${escapeHtml(submittedAt)}</strong></div>
        <div class="detail-box"><span>Score</span><strong>${row.score ?? review?.score ?? "—"}/${row.maxScore ?? review?.maxScore ?? "—"}</strong></div>
        <div class="detail-box"><span>Percentage</span><strong>${typeof row.percentage === "number" ? `${row.percentage}%` : typeof review?.percentage === "number" ? `${review.percentage}%` : "—"}</strong></div>
      </div>`
      + renderPartScoresSection(parts)
      + renderFlagsNotesSection(flags, row.notes || payload.notes)
      + renderReadingReviewSection("Reading answers vs answer key · Parts 1–5", getMixedReadingRows(review.rows || []), review.error)
      + renderMixedWritingReviewSection(samples, rubricProfile);

    bindWritingScoringControls();
  }

  function openWritingDetails(row) {
    const payload = payloadFromRow(row);
    const flags = safeJson(row.flaggedJson, row.flagged || payload.flagged || []);
    const rubricProfile = getWritingRubricProfile(row, payload);
    const samples = extractWritingSamples(row, payload, rubricProfile);
    const submittedAt = row.submittedAtLocal || formatDate(row.submittedAt || payload.submittedAt);

    detailsContent.innerHTML = `
      <div class="detail-grid detail-grid-wide">
        <div class="detail-box"><span>Student</span><strong>${escapeHtml(row.studentName || payload.studentName || "—")}</strong></div>
        <div class="detail-box"><span>Class</span><strong>${escapeHtml(row.classId || payload.classId || "—")}</strong></div>
        <div class="detail-box"><span>Exam</span><strong>${escapeHtml(row.examTitle || payload.examTitle || row.examId || "—")}</strong></div>
        <div class="detail-box"><span>Submitted</span><strong>${escapeHtml(submittedAt)}</strong></div>
        <div class="detail-box"><span>Status</span><strong>Manual writing review</strong></div>
        <div class="detail-box"><span>${escapeHtml(rubricProfile.choiceBased ? "Selected Part 2" : "Writing tasks")}</span><strong>${escapeHtml(rubricProfile.choiceBased ? selectedPart2Label(payload, samples, rubricProfile) : `${samples.length} task(s) submitted`)}</strong></div>
      </div>`
      + renderWritingReviewActions(rubricProfile)
      + renderWritingTotals(samples, rubricProfile)
      + `<section class="detail-section"><h3>Writing samples</h3>${samples.length ? samples.map((sample, index) => renderWritingSample(sample, index, rubricProfile)).join("") : `<p class="muted">No writing samples were found in this submission.</p>`}</section>`
      + renderFlagsNotesSection(flags, row.notes || payload.notes, "Flagged writing tasks", "Student notes");

    bindWritingScoringControls();
  }

  function liveHeader(row, payload, rowStatus) {
    return `
      <div class="detail-grid detail-grid-wide">
        <div class="detail-box"><span>Student</span><strong>${escapeHtml(row.studentName || payload.studentName || "—")}</strong></div>
        <div class="detail-box"><span>Class</span><strong>${escapeHtml(row.classId || payload.classId || "—")}</strong></div>
        <div class="detail-box"><span>Exam</span><strong>${escapeHtml(row.examTitle || payload.examTitle || row.examId || "—")}</strong></div>
        <div class="detail-box"><span>Status</span><strong>${escapeHtml(rowStatus.label)}</strong></div>
        <div class="detail-box"><span>Progress</span><strong>${escapeHtml(row.answeredCount ?? "—")}/${escapeHtml(row.totalQuestions ?? "—")}</strong></div>
        <div class="detail-box"><span>Last update</span><strong>${escapeHtml(formatDate(row.lastSeenAt || row.submittedAt))}</strong></div>
      </div>`;
  }

  function submissionHeader(row, payload, review) {
    return `
      <div class="detail-grid detail-grid-wide">
        <div class="detail-box"><span>Student</span><strong>${escapeHtml(row.studentName || payload.studentName || "—")}</strong></div>
        <div class="detail-box"><span>Class</span><strong>${escapeHtml(row.classId || payload.classId || "—")}</strong></div>
        <div class="detail-box"><span>Exam</span><strong>${escapeHtml(row.examTitle || payload.examTitle || row.examId || "—")}</strong></div>
        <div class="detail-box"><span>Submitted</span><strong>${escapeHtml(row.submittedAtLocal || formatDate(row.submittedAt || payload.submittedAt))}</strong></div>
        <div class="detail-box"><span>Score</span><strong>${row.score ?? review?.score ?? "—"}/${row.maxScore ?? review?.maxScore ?? "—"}</strong></div>
        <div class="detail-box"><span>Percentage</span><strong>${typeof row.percentage === "number" ? `${row.percentage}%` : typeof review?.percentage === "number" ? `${review.percentage}%` : "—"}</strong></div>
      </div>`;
  }

  function renderPartScoresSection(parts) {
    return `<section class="detail-section"><h3>Part scores</h3>${renderPartScoreCards(parts)}</section>`;
  }

  function renderFlagsNotesSection(flags, notes, flagTitle = "Flagged questions", notesTitle = "Notes") {
    return `
      <section class="detail-section detail-two-column">
        <div><h3>${escapeHtml(flagTitle)}</h3><p>${Array.isArray(flags) && flags.length ? flags.map(escapeHtml).join(", ") : "None"}</p></div>
        <div><h3>${escapeHtml(notesTitle)}</h3><p>${escapeHtml(notes || "No notes.")}</p></div>
      </section>`;
  }

  function renderReadingReviewSection(title, rows, error) {
    return `
      <section class="detail-section">
        <h3>${escapeHtml(title)}</h3>
        ${error ? `<p class="detail-warning">${escapeHtml(error)}</p>` : ""}
        ${renderAnswerReview(rows || [])}
      </section>`;
  }

  function renderMixedWritingReviewSection(samples, rubricProfile) {
    return renderWritingReviewActions(rubricProfile)
      + renderWritingTotals(samples, rubricProfile)
      + `<section class="detail-section"><h3>Writing samples · Parts 6–7</h3>${samples.length ? samples.map((sample, index) => renderWritingSample(sample, index, rubricProfile)).join("") : `<p class="muted">No writing samples were found in this submission.</p>`}</section>`;
  }

  function renderWritingReviewActions(rubricProfile) {
    return `
      <section class="detail-section writing-review-actions">
        <div><h3>${escapeHtml(rubricProfile.actionTitle)}</h3><p class="muted">${escapeHtml(rubricProfile.actionText)}</p></div>
        <button class="secondary-btn" data-toggle-rubric type="button">${escapeHtml(rubricProfile.buttonText)}</button>
      </section>
      <section class="detail-section writing-rubric-panel hidden" data-writing-rubric>${renderWritingRubric(rubricProfile)}</section>`;
  }

  function renderWritingTotals(samples, rubricProfile) {
    return `
      <section class="detail-section writing-total-panel">
        <article class="writing-total-card"><span>Writing score</span><strong data-writing-total>0/${getWritingMaxScore(samples, rubricProfile)}</strong></article>
        <article class="writing-total-card"><span>Writing percentage</span><strong data-writing-percent>0%</strong></article>
        <article class="writing-total-card"><span>Samples scored</span><strong data-writing-samples-scored>0/${samples.length}</strong></article>
      </section>`;
  }

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
      </article>`;
  }

  function extractWritingSamples(row, payload, rubricProfile = getWritingRubricProfile(row, payload)) {
    const list = [];
    const seen = new Set();
    addWritingSamples(list, seen, parseJsonDeep(payload?.writingSamples, firstJsonFrom(row, ["writingSamplesJson", "writingSamples"], [])), rubricProfile);
    const answers = parseJsonDeep(payload?.answers, firstJsonFrom(row, ["answersJson", "answers", "studentAnswersJson", "studentAnswers", "responsesJson", "responses"], {}));
    const metaByQuestion = getWritingTaskMetaMap(rubricProfile);
    Object.values(metaByQuestion).forEach(meta => {
      const answer = getAnswerFromNested(answers, meta.partId, meta.question);
      if (String(answer || "").trim()) addWritingSample(list, seen, { part: meta.part, partId: meta.partId, question: meta.question, answer }, rubricProfile);
    });
    addWritingSamples(list, seen, parseJsonDeep(payload?.part2Drafts, firstJsonFrom(row, ["part2DraftsJson", "part2Drafts"], [])), rubricProfile);
    addWritingSamples(list, seen, parseJsonDeep(payload?.answerList, firstJsonFrom(row, ["answerListJson", "answerList"], [])), rubricProfile);
    return list.sort((a, b) => Number(a.part || 0) - Number(b.part || 0) || Number(a.question || 0) - Number(b.question || 0));
  }

  function addWritingSamples(list, seen, samples, rubricProfile) {
    if (!Array.isArray(samples)) return;
    samples.forEach(sample => addWritingSample(list, seen, sample, rubricProfile));
  }

  function addWritingSample(list, seen, sample, rubricProfile) {
    const answer = sample?.answer ?? sample?.value ?? "";
    if (!String(answer || "").trim()) return;
    const enriched = enrichWritingSample({ ...sample, answer }, rubricProfile);
    const key = `${enriched.partId || ""}-${enriched.question || ""}`;
    const existingIndex = list.findIndex(item => `${item.partId || ""}-${item.question || ""}` === key);
    if (existingIndex >= 0) {
      if (String(answer).length > String(list[existingIndex].answer || "").length) list[existingIndex] = enriched;
      return;
    }
    seen.add(key);
    list.push(enriched);
  }

  function enrichWritingSample(sample, rubricProfile = WRITING_RUBRIC_PROFILES.b2) {
    const question = Number(sample?.question || sample?.q || 0);
    const meta = getWritingTaskMetaMap(rubricProfile)[question] || {};
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

  function getAnswerFromNested(answers, partId, question) {
    const parsed = parseJsonDeep(answers, {});
    return parsed?.[partId]?.[question] ?? parsed?.[partId]?.[String(question)] ?? parsed?.[question] ?? parsed?.[String(question)] ?? "";
  }

  function inferPart2QuestionFromAnswers(answers) {
    const parsed = parseJsonDeep(answers, {});
    const part2 = parsed?.part2 || {};
    return [2, 3, 4].find(question => String(part2?.[question] ?? part2?.[String(question)] ?? "").trim()) || null;
  }

  function resolvePart2SelectedQuestion(selected, answers) {
    const parsed = parseJsonDeep(answers, {});
    const selectedNumber = Number(selected);
    if ([2, 3, 4].includes(selectedNumber)) {
      const selectedAnswer = parsed?.part2?.[selectedNumber] ?? parsed?.part2?.[String(selectedNumber)] ?? "";
      if (String(selectedAnswer || "").trim()) return selectedNumber;
    }
    return inferPart2QuestionFromAnswers(parsed) || selectedNumber || null;
  }

  function selectedPart2Label(payload, samples, rubricProfile = WRITING_RUBRIC_PROFILES.b2) {
    const question = Number(payload?.part2SelectedQuestion || samples.find(sample => Number(sample.part) === 2)?.question || 0);
    if (!question) return "—";
    const meta = getWritingTaskMetaMap(rubricProfile)[question] || {};
    return `Question ${question}${meta.taskType ? ` · ${meta.taskType}` : ""}`;
  }

  function getWritingRubricProfile(row = {}, payload = {}) {
    const raw = [payload.rubricProfile, row.rubricProfile, payload.examType, row.examType, payload.examId, row.examId, payload.examTitle, row.examTitle, payload.level, row.level, payload.skill, row.skill]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
    if (raw.includes("a2rw") || raw.includes("a2-rw") || raw.includes("a2 rw") || raw.includes("reading-writing") || raw.includes("reading and writing")) return WRITING_RUBRIC_PROFILES.a2rw;
    if (raw.includes("b1plus") || raw.includes("b1+")) return WRITING_RUBRIC_PROFILES.b1plus;
    return WRITING_RUBRIC_PROFILES.b2;
  }

  function getWritingTaskMetaMap(rubricProfile = WRITING_RUBRIC_PROFILES.b2) {
    return WRITING_TASK_META_BY_EXAM[rubricProfile.id] || WRITING_TASK_META_BY_EXAM.b2;
  }

  function getWritingSubscales(sample, rubricProfile = WRITING_RUBRIC_PROFILES.b2) {
    if (rubricProfile.id === "b1plus" && String(sample?.taskType || "").toLowerCase().includes("picture")) return rubricProfile.pictureSubscales || ["Content", "Organization"];
    return rubricProfile.defaultSubscales || WRITING_RUBRIC_PROFILES.b2.defaultSubscales;
  }

  function getWritingMaxScore(samples, rubricProfile = WRITING_RUBRIC_PROFILES.b2) {
    return (samples || []).reduce((sum, sample) => sum + getWritingSubscales(sample, rubricProfile).length * 5, 0);
  }

  function renderWritingSample(sample, index, rubricProfile = WRITING_RUBRIC_PROFILES.b2) {
    const answer = sample.answer || "";
    const wordCount = Number(sample.wordCount ?? countWords(answer));
    const subscales = getWritingSubscales(sample, rubricProfile);
    const sampleMax = subscales.length * 5;
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
            ${subscales.map(name => `
              <label>
                <span>${escapeHtml(name)}</span>
                <input data-writing-score data-sample-index="${index}" data-subscale="${escapeAttr(name)}" type="number" min="0" max="5" step="1" inputmode="numeric" placeholder="0–5" />
              </label>`).join("")}
          </div>
          <div class="sample-score-line">Sample score: <strong data-sample-total="${index}" data-sample-max="${sampleMax}">0/${sampleMax}</strong></div>
        </div>
      </article>`;
  }

  function renderWritingRubric(rubricProfile = WRITING_RUBRIC_PROFILES.b2) {
    const cards = rubricProfile.cards || WRITING_RUBRIC_PROFILES.b2.cards;
    return `
      <h3>${escapeHtml(rubricProfile.title)}</h3>
      <p class="muted">${escapeHtml(rubricProfile.note)}</p>
      <div class="rubric-card-grid">
        ${cards.map(([title, body]) => `<article class="rubric-card"><h4>${escapeHtml(title)}</h4><p>${escapeHtml(body)}</p></article>`).join("")}
      </div>
      <div class="rubric-band-box"><strong>Band guide:</strong> ${escapeHtml(rubricProfile.bandGuide)}</div>`;
  }

  function bindWritingScoringControls() {
    detailsContent.querySelector("[data-toggle-rubric]")?.addEventListener("click", () => {
      detailsContent.querySelector("[data-writing-rubric]")?.classList.toggle("hidden");
    });
    detailsContent.querySelectorAll("[data-writing-score]").forEach(input => input.addEventListener("input", updateWritingTotals));
    updateWritingTotals();
  }

  function updateWritingTotals() {
    if (!detailsContent) return;
    const sampleIndexes = Array.from(new Set(Array.from(detailsContent.querySelectorAll("[data-writing-score]")).map(input => input.dataset.sampleIndex)));
    let total = 0;
    let max = 0;
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
      const sampleMax = inputs.length * 5;
      const target = detailsContent.querySelector(`[data-sample-total="${index}"]`);
      if (target) {
        target.dataset.sampleMax = String(sampleMax);
        target.textContent = `${sampleTotal}/${sampleMax}`;
      }
      total += sampleTotal;
      max += sampleMax;
      if (complete && inputs.length > 0) scoredSamples += 1;
    });
    const percent = max ? Math.round((total / max) * 100) : 0;
    const totalEl = detailsContent.querySelector("[data-writing-total]");
    const percentEl = detailsContent.querySelector("[data-writing-percent]");
    const samplesEl = detailsContent.querySelector("[data-writing-samples-scored]");
    if (totalEl) totalEl.textContent = `${total}/${max}`;
    if (percentEl) percentEl.textContent = `${percent}%`;
    if (samplesEl) samplesEl.textContent = `${scoredSamples}/${sampleIndexes.length}`;
  }

  function formatWritingMini(row) {
    const payload = payloadFromRow(row);
    const samples = extractWritingSamples(row, payload);
    if (!samples.length) return "Writing · manual review";
    return samples.map(sample => `Q${sample.question}: ${sample.wordCount ?? countWords(sample.answer)} words`).join(" · ");
  }

  function formatMixedMini(row, partScores) {
    const payload = payloadFromRow(row);
    const samples = extractWritingSamples(row, payload, getWritingRubricProfile(row, payload)).filter(isA2WritingSample);
    const reading = formatParts(partScores);
    const writing = samples.length ? samples.map(sample => `Q${sample.question}: ${sample.wordCount ?? countWords(sample.answer)} words`).join(" · ") : "Writing pending";
    return `${reading || "Reading"} · ${writing}`;
  }

  function isA2WritingSample(sample) {
    return Number(sample.question) >= 31 || Number(sample.part) >= 6;
  }

  function isMixedReadingWritingSubmission(row) {
    const payload = payloadFromRow(row || {});
    const raw = [row?.examId, row?.examTitle, row?.skill, row?.examType, row?.rubricProfile, payload.examId, payload.examTitle, payload.skill, payload.examType, payload.rubricProfile]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
    return raw.includes("a2-rw") || raw.includes("a2 rw") || raw.includes("a2rw") || raw.includes("reading-writing") || raw.includes("reading and writing");
  }

  function isWritingSubmission(row) {
    if (isMixedReadingWritingSubmission(row)) return false;
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

  async function buildAnswerReview(row) {
    const payload = payloadFromRow(row);
    const flatAnswers = window.BrightonGrading?.flattenAnswers ? window.BrightonGrading.flattenAnswers(payload) : flattenAnswersFallback(payload);
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

  function getMixedReadingRows(reviewRows) {
    return (reviewRows || []).filter(item => Number(item.part) <= 5 && Number(item.question) <= 30);
  }

  function renderPartScoreCards(parts) {
    const entries = Object.entries(parts || {}).sort(([a], [b]) => partSortValue(a) - partSortValue(b));
    if (!entries.length) return `<p class="muted">No part score data available.</p>`;
    return `<div class="part-score-grid">${entries.map(([key, value]) => {
      const label = value?.label || key.replace(/part/i, "Part ");
      const score = value?.score ?? "—";
      const max = value?.maxScore ?? "—";
      const correctText = Number.isFinite(Number(value?.correct)) && Number.isFinite(Number(value?.total)) ? `${value.correct}/${value.total} correct` : "";
      return `<article class="part-score-card"><span>${escapeHtml(label)}</span><strong>${escapeHtml(score)}/${escapeHtml(max)}</strong>${correctText ? `<small>${escapeHtml(correctText)}</small>` : ""}</article>`;
    }).join("")}</div>`;
  }

  function renderAnswerReview(reviewRows) {
    if (!reviewRows.length) return `<p class="muted">No submitted answers were found.</p>`;
    return `
      <div class="answer-review-wrap">
        <table class="answer-review-table">
          <thead><tr><th>Question</th><th>Part</th><th>Student answer</th><th>Expected answer</th><th>Score</th><th>Status</th></tr></thead>
          <tbody>
            ${reviewRows.map(item => `
              <tr class="${escapeAttr(item.status.className)}">
                <td><strong>${item.question}</strong></td>
                <td>${item.part ? `Part ${item.part}` : "—"}</td>
                <td>${escapeHtml(answerToText(item.studentAnswer) || "—")}</td>
                <td>${escapeHtml(item.expected || "—")}</td>
                <td>${item.earned ?? "—"}/${item.max ?? "—"}</td>
                <td><span class="answer-status ${escapeAttr(item.status.className)}">${escapeHtml(item.status.label)}</span></td>
              </tr>`).join("")}
          </tbody>
        </table>
      </div>`;
  }

  function getReviewQuestionNumbers(answerKey, flatAnswers) {
    const fromKey = Object.keys(answerKey?.answers || {}).map(Number).filter(Number.isFinite);
    const fromAnswers = flatAnswers.map(item => Number(item.question)).filter(Number.isFinite);
    return Array.from(new Set([...fromKey, ...fromAnswers])).sort((a, b) => a - b);
  }

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

  function answerStatus(detail) {
    if (!detail) return { label: "Not graded", className: "status-unknown" };
    const earned = Number(detail.earned || 0);
    const max = Number(detail.max || 0);
    if (earned >= max && max > 0) return { label: "Correct", className: "status-correct" };
    if (earned > 0) return { label: "Partial", className: "status-partial" };
    return { label: "Incorrect", className: "status-incorrect" };
  }

  function findAnswerPart(flatAnswers, question) {
    return flatAnswers.find(item => Number(item.question) === Number(question))?.part;
  }

  function flattenAnswersFallback(payload) {
    if (Array.isArray(payload?.answerList)) return payload.answerList;
    const answers = payload?.answers || {};
    const flat = [];
    Object.entries(answers).forEach(([partId, partAnswers]) => {
      const part = Number(String(partId).replace(/\D+/g, "")) || null;
      Object.entries(partAnswers || {}).forEach(([q, answer]) => flat.push({ part, partId, question: Number(q), answer }));
    });
    return flat.sort((a, b) => Number(a.question) - Number(b.question));
  }

  function answerToText(value) {
    if (value === undefined || value === null) return "";
    if (Array.isArray(value)) return value.map(answerToText).join(", ");
    if (typeof value === "object") return JSON.stringify(value);
    return String(value);
  }

  function partSortValue(key) {
    const number = Number(String(key).match(/\d+/)?.[0] || 0);
    return Number.isFinite(number) ? number : 0;
  }

  function formatParts(parts) {
    if (!parts || typeof parts !== "object" || !Object.keys(parts).length) return "—";
    return Object.entries(parts).sort(([a], [b]) => partSortValue(a) - partSortValue(b)).map(([key, value]) => {
      const label = value?.label || key.replace(/part/i, "Part ");
      const score = value?.score ?? "—";
      const max = value?.maxScore ?? "—";
      return `<span>${escapeHtml(label)} ${escapeHtml(score)}/${escapeHtml(max)}</span>`;
    }).join("");
  }

  function formatSeconds(value) {
    const total = Number(value);
    if (!Number.isFinite(total) || total < 0) return "—";
    const minutes = Math.floor(total / 60);
    const seconds = Math.round(total % 60);
    return `${minutes}:${String(seconds).padStart(2, "0")}`;
  }

  function countWords(text) {
    return String(text || "").trim().split(/\s+/).filter(Boolean).length;
  }

  function getFilteredRows() {
    const filter = getStudentFilter();
    if (!filter) return rows;
    return rows.filter(row => String(row.studentName || "").toLowerCase().includes(filter));
  }

  function getFilteredProgressRows() {
    const filter = getStudentFilter();
    if (!filter) return progressRows;
    return progressRows.filter(row => String(row.studentName || "").toLowerCase().includes(filter));
  }

  function getStudentFilter() {
    return String(studentInput?.value || "").trim().toLowerCase();
  }

  function scheduleStudentFilterUpdate() {
    window.clearTimeout(studentFilterTimer);
    studentFilterTimer = window.setTimeout(() => {
      syncUrlFromControls({ replace: true, keepOpen: true });
      renderRows();
      renderProgressRows();
      updateSummary();
    }, 180);
  }

  function normalizeClassInput() {
    if (!classIdInput) return "";
    classIdInput.value = normalizeClassCode(classIdInput.value);
    return classIdInput.value;
  }

  function normalizeClassCode(value) {
    return App.normalizeClassCode ? App.normalizeClassCode(value) : String(value || "").trim().toUpperCase();
  }

  function clearFilters() {
    if (classIdInput) classIdInput.value = "";
    if (examSelect) examSelect.value = "";
    if (studentInput) studentInput.value = "";
    rows = [];
    progressRows = [];
    hideModalWithoutUrl();
    stopProgressTimer();
    renderProgressRows();
    renderRows();
    updateSummary();
    if (status) status.textContent = "Enter a class ID and load results.";
    if (progressStatus) progressStatus.textContent = "Load a class to supervise exams in progress.";
    if (progressUpdatedAt) progressUpdatedAt.textContent = "Not updated yet";
    history.pushState({}, "", location.pathname);
    queryState = readQueryState();
  }

  function exportCsv() {
    const visibleRows = getFilteredRows();
    if (!visibleRows.length) return showToast("No rows to export");
    const headers = ["studentName", "classId", "examTitle", "submittedAt", "score", "maxScore", "percentage", "partScoresJson"];
    const csv = [headers.join(",")].concat(visibleRows.map(row => headers.map(h => csvCell(row[h])).join(","))).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `brighton-results-${normalizeClassCode(classIdInput?.value) || "class"}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function csvCell(value) {
    return App.csvCell ? App.csvCell(value) : `"${String(value ?? "").replace(/"/g, '""')}"`;
  }

  function copyShareLink() {
    syncUrlFromControls({ replace: true, keepOpen: true });
    navigator.clipboard?.writeText(location.href).then(() => showToast("Link copied"), () => showToast("Could not copy link"));
  }

  function readQueryState() {
    const params = new URLSearchParams(location.search);
    return {
      classId: params.get("classId") || "",
      examId: params.get("examId") || "",
      student: params.get("student") || "",
      view: params.get("view") || "",
      open: params.get("open") || "",
      rowKey: params.get("row") || "",
      autoLoad: params.get("load") === "1" || Boolean(params.get("classId"))
    };
  }

  function applyQueryStateToControls(state) {
    if (classIdInput && state.classId) classIdInput.value = state.classId;
    if (examSelect && state.examId) examSelect.value = state.examId;
    if (studentInput && state.student) studentInput.value = state.student;
  }

  function syncUrlFromControls(options = {}) {
    const params = new URLSearchParams();
    const classId = normalizeClassCode(classIdInput?.value || "");
    const examId = examSelect?.value || "";
    const student = studentInput?.value.trim() || "";
    if (classId) params.set("classId", classId);
    if (examId) params.set("examId", examId);
    if (student) params.set("student", student);
    if (classId) params.set("load", "1");
    if (options.view) params.set("view", options.view);
    else if (queryState.view && options.keepOpen) params.set("view", queryState.view);
    if (options.open && options.row && !options.clearOpen) {
      params.set("open", options.open);
      params.set("row", rowKey(options.row));
    } else if (queryState.open && options.keepOpen) {
      params.set("open", queryState.open);
      if (queryState.rowKey) params.set("row", queryState.rowKey);
    }
    const url = `${location.pathname}${params.toString() ? `?${params.toString()}` : ""}`;
    if (options.replace) history.replaceState({}, "", url);
    else history.pushState({}, "", url);
    queryState = readQueryState();
  }

  function handlePopState() {
    queryState = readQueryState();
    applyQueryStateToControls(queryState);
    if (queryState.classId && queryState.autoLoad) loadResults({ updateUrl: false, fromQuery: true });
  }

  function rowKey(row) {
    return makeSlug(`${row.examId || ""}_${row.classId || ""}_${row.studentName || ""}_${row.submittedAt || row.lastSeenAt || ""}`, 120);
  }

  function isHighlightedRow(row) {
    return queryState.rowKey && rowKey(row) === queryState.rowKey;
  }

  function openRequestedModal() {
    if (!queryState.open || !queryState.rowKey) return;
    if (queryState.open === "progress") {
      const row = getFilteredProgressRows().find(item => rowKey(item) === queryState.rowKey || progressKey(item) === queryState.rowKey);
      if (row) openProgressDetails(row, { fromQuery: true });
      return;
    }
    const row = getFilteredRows().find(item => rowKey(item) === queryState.rowKey);
    if (row) openDetails(row, { fromQuery: true });
  }

  function scrollToRequestedScreen(view) {
    if (view === "live") document.querySelector(".progress-card")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function closeModal() {
    hideModalWithoutUrl();
    syncUrlFromControls({ replace: true, clearOpen: true, keepOpen: false });
  }

  function hideModalWithoutUrl() {
    activeProgressPreviewId = "";
    modal?.classList.add("hidden");
    modal?.setAttribute("aria-hidden", "true");
  }

  function openModal(title, loadingText = "") {
    const heading = modal?.querySelector(".modal-head h2");
    if (heading) heading.textContent = title;
    modal?.classList.remove("hidden");
    modal?.setAttribute("aria-hidden", "false");
    if (loadingText && detailsContent) detailsContent.innerHTML = `<div class="detail-loading">${escapeHtml(loadingText)}</div>`;
  }

  function showToast(message) {
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add("show");
    window.setTimeout(() => toast.classList.remove("show"), 2200);
  }

  function setText(selector, value) {
    const el = document.querySelector(selector);
    if (el) el.textContent = value;
  }

  function safeJson(value, fallback) {
    return parseJsonDeep(value, fallback);
  }

  function firstJsonFrom(row, keys, fallback) {
    for (const key of keys) {
      if (row && row[key] !== undefined && row[key] !== null && row[key] !== "") return parseJsonDeep(row[key], row[key]);
    }
    return fallback;
  }

  function parseJsonDeep(value, fallback) {
    if (value === undefined || value === null || value === "") return fallback;
    if (typeof value !== "string") return value;
    try {
      return JSON.parse(value);
    } catch {
      return fallback;
    }
  }

  function escapeHtml(value) {
    return App.escapeHtml ? App.escapeHtml(value) : String(value ?? "").replace(/[&<>"']/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[char]));
  }

  function escapeAttr(value) {
    return App.escapeAttr ? App.escapeAttr(value) : escapeHtml(value);
  }

  function formatDate(value) {
    return App.formatDate ? App.formatDate(value) : (value ? new Date(value).toLocaleString() : "—");
  }

  function makeSlug(value, max = 120) {
    return App.makeSlug ? App.makeSlug(value, max) : String(value || "").toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "").slice(0, max);
  }

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }
})();

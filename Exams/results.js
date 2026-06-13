(() => {
  const config = window.BRIGHTON_SITE_CONFIG || {};
  const apiBase = String(config.API_BASE_URL || "").replace(/\/$/, "");
  const classIdInput = document.querySelector("#classIdInput");
  const examSelect = document.querySelector("#examSelect");
  const loadBtn = document.querySelector("#loadBtn");
  const clearBtn = document.querySelector("#clearBtn");
  const exportBtn = document.querySelector("#exportBtn");
  const resultsBody = document.querySelector("#resultsBody");
  const status = document.querySelector("#resultsStatus");
  const toast = document.querySelector("#toast");
  const modal = document.querySelector("#detailsModal");
  const detailsContent = document.querySelector("#detailsContent");
  const closeModalBtn = document.querySelector("#closeModalBtn");

  let rows = [];
  const answerKeyCache = new Map();

  loadBtn.addEventListener("click", loadResults);
  clearBtn.addEventListener("click", clearFilters);
  exportBtn.addEventListener("click", exportCsv);
  closeModalBtn.addEventListener("click", closeModal);
  modal.addEventListener("click", event => { if (event.target === modal) closeModal(); });

  init();

  async function init() {
    const params = new URLSearchParams(location.search);
    if (params.get("examId")) examSelect.dataset.prefill = params.get("examId");
    await loadExams();
  }

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

  function fillExamSelect(exams) {
    const current = examSelect.dataset.prefill || "";
    examSelect.innerHTML = `<option value="">All exams</option>` + exams.map(exam => `
      <option value="${escapeAttr(exam.examId)}">${escapeHtml(exam.title || exam.examId)}</option>
    `).join("");
    if (current) examSelect.value = current;
  }

  async function loadResults() {
    const classId = classIdInput.value.trim();
    const examId = examSelect.value.trim();
    if (!classId) {
      showToast("Enter a class ID first");
      classIdInput.focus();
      return;
    }
    if (!apiBase || apiBase.includes("YOUR-WIX")) {
      status.textContent = "Failed to connect to Brighton Database. Check internet connection.";
      rows = [];
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
      const locallyGraded = rows.filter(row => row._gradedLocally).length;
      status.textContent = `${rows.length} submission(s) loaded for ${classId}.${locallyGraded ? ` ${locallyGraded} row(s) graded locally from the answer key.` : ""}`;
      renderRows();
      updateSummary(data.summary);
    } catch (error) {
      status.textContent = `Could not load results: ${error.message}`;
      rows = [];
      renderRows();
      updateSummary();
    }
  }

  async function applyLocalGrading(items) {
    if (!window.BrightonGrading) return items;
    const updated = [];
    for (const row of items) {
      const copy = { ...row };
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

  async function getAnswerKey(examId) {
    if (answerKeyCache.has(examId)) return answerKeyCache.get(examId);
    const key = await window.BrightonGrading.loadAnswerKey(examId);
    answerKeyCache.set(examId, key);
    return key;
  }

  function payloadFromRow(row) {
    const raw = safeJson(row.rawPayloadJson, row.rawPayload || {});
    const payload = raw?.payload || raw || {};
    if (Array.isArray(payload.answerList) || payload.answers) return payload;
    return {
      examId: row.examId,
      answerList: safeJson(row.answerListJson, row.answerList || []),
      answers: safeJson(row.answersJson, row.answers || {})
    };
  }

  function renderRows() {
    if (!rows.length) {
      resultsBody.innerHTML = `<tr><td colspan="8">No submissions found.</td></tr>`;
      return;
    }

    resultsBody.innerHTML = rows.map((row, index) => {
      const partScores = safeJson(row.partScoresJson, row.partScores || {});
      return `
        <tr>
          <td><strong>${escapeHtml(row.studentName || "—")}</strong></td>
          <td>${escapeHtml(row.classId || "—")}</td>
          <td>${escapeHtml(row.examTitle || row.examId || "—")}</td>
          <td>${escapeHtml(row.submittedAtLocal || formatDate(row.submittedAt))}</td>
          <td><span class="score-pill">${row.score ?? "—"}/${row.maxScore ?? "—"}</span></td>
          <td>${typeof row.percentage === "number" ? `${row.percentage}%` : "—"}</td>
          <td><div class="parts-mini">${formatParts(partScores)}</div></td>
          <td><button class="secondary-btn" data-details="${index}">Details</button></td>
        </tr>
      `;
    }).join("");

    document.querySelectorAll("[data-details]").forEach(button => {
      button.addEventListener("click", () => openDetails(rows[Number(button.dataset.details)]));
    });
  }

  function updateSummary(serverSummary) {
    const total = serverSummary?.total ?? rows.length;
    const percentages = rows.map(r => Number(r.percentage)).filter(Number.isFinite);
    const average = serverSummary?.average ?? (percentages.length ? Math.round(percentages.reduce((a,b)=>a+b,0) / percentages.length) : null);
    const highest = serverSummary?.highest ?? (percentages.length ? Math.max(...percentages) : null);
    const lowest = serverSummary?.lowest ?? (percentages.length ? Math.min(...percentages) : null);
    document.querySelector("#summaryTotal").textContent = total;
    document.querySelector("#summaryAverage").textContent = average === null ? "—" : `${average}%`;
    document.querySelector("#summaryHighest").textContent = highest === null ? "—" : `${highest}%`;
    document.querySelector("#summaryLowest").textContent = lowest === null ? "—" : `${lowest}%`;
  }

  async function openDetails(row) {
    modal.classList.remove("hidden");
    modal.setAttribute("aria-hidden", "false");
    detailsContent.innerHTML = `<div class="detail-loading">Loading submission details...</div>`;

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
      Object.entries(partAnswers || {}).forEach(([q, answer]) => {
        flat.push({ part, partId, question: Number(q), answer });
      });
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

  function closeModal() {
    modal.classList.add("hidden");
    modal.setAttribute("aria-hidden", "true");
  }

  function clearFilters() {
    classIdInput.value = "";
    examSelect.value = "";
    rows = [];
    renderRows();
    updateSummary();
    status.textContent = "Enter a class ID and load results.";
  }

  function exportCsv() {
    if (!rows.length) return showToast("No rows to export");
    const headers = ["studentName", "classId", "examTitle", "submittedAt", "score", "maxScore", "percentage", "partScoresJson"];
    const csv = [headers.join(",")].concat(rows.map(row => headers.map(h => csvCell(row[h])).join(","))).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `brighton-results-${classIdInput.value.trim() || "class"}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function formatParts(parts) {
    if (!parts || typeof parts !== "object") return "—";
    return Object.entries(parts).map(([key, value]) => {
      if (value && typeof value === "object") return `${key}: ${value.score ?? "—"}/${value.maxScore ?? "—"}`;
      return `${key}: ${value}`;
    }).join(" · ");
  }

  function safeJson(value, fallback) {
    if (typeof value !== "string") return value ?? fallback;
    try { return JSON.parse(value); } catch { return fallback; }
  }

  function formatDate(value) {
    if (!value) return "—";
    const date = new Date(value);
    return Number.isFinite(date.getTime()) ? date.toLocaleString() : String(value);
  }

  function csvCell(value) {
    const text = String(value ?? "");
    return `"${text.replace(/"/g, '""')}"`;
  }

  function showToast(message) {
    toast.textContent = message;
    toast.classList.add("show");
    clearTimeout(showToast.timer);
    showToast.timer = setTimeout(() => toast.classList.remove("show"), 1800);
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

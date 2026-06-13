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
      if (!apiBase || apiBase.includes("YOUR-WIX")) throw new Error("Wix API not configured");
      const res = await fetch(`${apiBase}/getExams`);
      const data = await res.json();
      if (!res.ok || data.success === false) throw new Error(data.error || `HTTP ${res.status}`);
      fillExamSelect(data.exams || []);
    } catch {
      fillExamSelect(config.FALLBACK_EXAMS || []);
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
      status.textContent = "Configure API_BASE_URL in config.js to load real Wix CMS results.";
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

  function openDetails(row) {
    const answers = safeJson(row.answerListJson, row.answerList || []);
    const flags = safeJson(row.flaggedJson, row.flagged || []);
    const parts = safeJson(row.partScoresJson, row.partScores || {});
    detailsContent.innerHTML = `
      <div class="detail-grid">
        <div class="detail-box"><span>Student</span><strong>${escapeHtml(row.studentName || "—")}</strong></div>
        <div class="detail-box"><span>Class</span><strong>${escapeHtml(row.classId || "—")}</strong></div>
        <div class="detail-box"><span>Score</span><strong>${row.score ?? "—"}/${row.maxScore ?? "—"}</strong></div>
        <div class="detail-box"><span>Percentage</span><strong>${typeof row.percentage === "number" ? `${row.percentage}%` : "—"}</strong></div>
      </div>
      <h3>Part scores</h3>
      <pre>${escapeHtml(JSON.stringify(parts, null, 2))}</pre>
      <h3>Flagged questions</h3>
      <p>${Array.isArray(flags) && flags.length ? flags.join(", ") : "None"}</p>
      <h3>Notes</h3>
      <p>${escapeHtml(row.notes || "No notes.")}</p>
      <h3>Answers</h3>
      <pre>${escapeHtml(JSON.stringify(answers, null, 2))}</pre>
      <h3>Grading details</h3>
      <pre>${escapeHtml(JSON.stringify(safeJson(row.gradingDetailsJson, row.gradingDetails || []), null, 2))}</pre>
    `;
    modal.classList.remove("hidden");
    modal.setAttribute("aria-hidden", "false");
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

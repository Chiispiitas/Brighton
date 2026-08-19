"use strict";
/* ==============================================
     Brighton English School - Tests Dashboard
     Made by: David Santana
============================================== */

(() => {
  const App = window.BrightonApp || {};
  const Grading = window.BrightonGrading || {};
  const config = window.BRIGHTON_SITE_CONFIG || {};
  const apiBase = String(config.API_BASE_URL || "").replace(/\/$/, "");
  const tests = Array.isArray(config.FALLBACK_TESTS) ? config.FALLBACK_TESTS : [];

  const classIdInput = document.querySelector("#classIdInput");
  const testSelect = document.querySelector("#testSelect");
  const studentInput = document.querySelector("#studentInput");
  const loadBtn = document.querySelector("#loadBtn");
  const clearBtn = document.querySelector("#clearBtn");
  const exportBtn = document.querySelector("#exportBtn");
  const resultsBody = document.querySelector("#resultsBody");
  const status = document.querySelector("#resultsStatus");
  const connectionStatus = document.querySelector("#connectionStatus");
  const modal = document.querySelector("#detailsModal");
  const detailsContent = document.querySelector("#detailsContent");
  const closeModalBtn = document.querySelector("#closeModalBtn");
  const toast = document.querySelector("#toast");

  const answerKeyCache = new Map();
  let rows = [];

  init();

  function init() {
    fillTestSelect();
    applyQueryParams();
    loadBtn.addEventListener("click", loadResults);
    clearBtn.addEventListener("click", clearFilters);
    exportBtn.addEventListener("click", exportCsv);
    studentInput.addEventListener("input", renderRows);
    classIdInput.addEventListener("blur", normalizeClassInput);
    closeModalBtn.addEventListener("click", closeModal);
    modal.addEventListener("click", (event) => { if (event.target === modal) closeModal(); });
    if (classIdInput.value.trim()) loadResults();
  }

  function fillTestSelect() {
    testSelect.innerHTML = `<option value="">All tests</option>` + tests.map((test) =>
      `<option value="${escapeAttr(test.testId)}">${escapeHtml(test.title || test.testId)}</option>`
    ).join("");
  }

  function applyQueryParams() {
    const params = new URLSearchParams(window.location.search);
    classIdInput.value = params.get("classId") || "";
    testSelect.value = params.get("testId") || "";
    studentInput.value = params.get("student") || "";
  }

  function syncQueryParams() {
    const params = new URLSearchParams();
    if (classIdInput.value.trim()) params.set("classId", classIdInput.value.trim());
    if (testSelect.value) params.set("testId", testSelect.value);
    if (studentInput.value.trim()) params.set("student", studentInput.value.trim());
    const next = `${window.location.pathname}${params.toString() ? `?${params}` : ""}`;
    history.replaceState(null, "", next);
  }

  function normalizeClassInput() {
    const normalized = App.normalizeClassCode ? App.normalizeClassCode(classIdInput.value) : classIdInput.value.trim().toUpperCase();
    classIdInput.value = normalized;
    return normalized;
  }

  async function loadResults() {
    const classId = normalizeClassInput();
    const testId = testSelect.value.trim();
    syncQueryParams();

    if (!classId) {
      showToast("Enter a class ID first");
      classIdInput.focus();
      return;
    }

    if (!apiBase || apiBase.includes("YOUR-WIX")) {
      setConnectionError("Wix endpoint is not configured in config.js.");
      return;
    }

    status.textContent = "Loading test results...";
    resultsBody.innerHTML = `<tr><td colspan="9">Loading...</td></tr>`;
    connectionStatus.textContent = "Connecting...";

    try {
      const url = new URL(`${apiBase}/getTestResults`);
      url.searchParams.set("classId", classId);
      if (testId) url.searchParams.set("testId", testId);

      const response = await fetch(url.toString(), { headers: { "Accept": "application/json" } });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || data.success === false) throw new Error(data.error || `HTTP ${response.status}`);

      const rawRows = Array.isArray(data.items) ? data.items : [];
      rows = await applyLocalGrading(rawRows);

      const gradedCount = rows.filter((row) => row._gradedLocally).length;
      const missingKeyCount = rows.filter((row) => row._gradingError).length;
      connectionStatus.textContent = "Connected";
      status.textContent = `${rows.length} test submission${rows.length === 1 ? "" : "s"} loaded for ${classId}. ${gradedCount} graded from answer key${gradedCount === 1 ? "" : "s"}.${missingKeyCount ? ` ${missingKeyCount} could not be graded because its answer key was unavailable.` : ""}`;

      renderRows();
      updateSummary();
    } catch (error) {
      rows = [];
      setConnectionError(error.message || String(error));
    }
  }

  async function applyLocalGrading(items) {
    return Promise.all((items || []).map(async (row) => {
      const testId = String(row.testId || "").trim();
      if (!testId) return { ...row, _gradingError: "Missing test ID" };
      if (typeof Grading.loadAnswerKey !== "function" || typeof Grading.gradeSubmission !== "function") {
        return { ...row, _gradingError: "Shared grading module unavailable" };
      }

      try {
        const answerKey = await loadAnswerKey(testId);
        const answerList = getSubmittedAnswerList(row);
        const graded = Grading.gradeSubmission({ answerList }, answerKey);
        const pageScores = Object.entries(graded.partScores || {}).map(([partId, part], index) => ({
          page: index + 1,
          partId,
          label: part.label || `Page ${index + 1}`,
          score: Number(part.score || 0),
          maxScore: Number(part.maxScore || 0),
          correct: Number(part.correct || 0),
          total: Number(part.total || 0)
        }));
        const gradedDetails = (graded.details || []).map((item) => ({
          page: Number(item.part || 0),
          unit: Number(item.part || 0),
          question: Number(item.question),
          answer: item.answer || "",
          earned: Number(item.earned || 0),
          max: Number(item.max || 0),
          correct: item.correct === true
        }));

        return {
          ...row,
          score: graded.score,
          maxScore: graded.maxScore,
          percentage: graded.percentage,
          _pageScores: pageScores,
          _gradedDetails: gradedDetails,
          _gradedLocally: true,
          _gradingError: ""
        };
      } catch (error) {
        console.warn(`Could not grade test ${testId}`, error);
        return { ...row, _gradingError: error.message || String(error) };
      }
    }));
  }

  async function loadAnswerKey(testId) {
    if (answerKeyCache.has(testId)) return answerKeyCache.get(testId);
    const key = await Grading.loadAnswerKey(testId);
    answerKeyCache.set(testId, key);
    return key;
  }

  function getSubmittedAnswerList(row) {
    const storedList = safeJson(row.answerListJson, null) || row.answerList;
    if (Array.isArray(storedList)) return storedList;

    const storedAnswers = safeJson(row.answersJson, null) || row.answers;
    if (storedAnswers && typeof storedAnswers === "object" && !Array.isArray(storedAnswers)) {
      return Object.keys(storedAnswers)
        .sort((a, b) => Number(a) - Number(b))
        .map((question) => ({ question: Number(question), answer: storedAnswers[question] || "" }));
    }

    return [];
  }

  function setConnectionError(message) {
    connectionStatus.textContent = "Connection failed";
    status.textContent = `Could not load Tests results. ${message}`;
    resultsBody.innerHTML = `<tr><td colspan="9">No results available.</td></tr>`;
    updateSummary();
  }

  function getVisibleRows() {
    const filter = studentInput.value.trim().toLowerCase();
    if (!filter) return rows;
    return rows.filter((row) => String(row.studentName || "").toLowerCase().includes(filter));
  }

  function renderRows() {
    syncQueryParams();
    const visible = getVisibleRows();

    if (!visible.length) {
      resultsBody.innerHTML = `<tr><td colspan="9">No matching test submissions.</td></tr>`;
      updateSummary();
      return;
    }

    resultsBody.innerHTML = visible.map((row) => {
      const score = numberOrNull(row.score);
      const maxScore = numberOrNull(row.maxScore);
      const percentage = numberOrNull(row.percentage);
      const pages = renderPageScores(row);
      const scoreHtml = row._gradingError
        ? `<span class="muted">Answer key unavailable</span>`
        : `<span class="score-pill">${score === null ? "—" : `${score}/${maxScore ?? "—"}`}</span>`;

      return `
        <tr>
          <td><strong>${escapeHtml(row.studentName || "—")}</strong></td>
          <td>${escapeHtml(row.classId || "—")}</td>
          <td>${escapeHtml(row.testTitle || row.testId || "—")}</td>
          <td>${escapeHtml(formatDate(row.submittedAt || row._createdDate))}</td>
          <td>${scoreHtml}</td>
          <td>${percentage === null || row._gradingError ? "—" : `${Math.round(percentage)}%`}</td>
          <td>${pages}</td>
          <td>${formatDuration(row.timeSpentSeconds)}</td>
          <td><button class="secondary-btn small" type="button" data-row-index="${rows.indexOf(row)}">Details</button></td>
        </tr>
      `;
    }).join("");

    document.querySelectorAll("[data-row-index]").forEach((button) => {
      button.addEventListener("click", () => openDetails(rows[Number(button.dataset.rowIndex)]));
    });
    updateSummary();
  }

  function renderPageScores(row) {
    const pageScores = row._pageScores || safeJson(row.pageScoresJson, null) || row.pageScores || [];
    if (Array.isArray(pageScores) && pageScores.length) {
      return `<div class="test-score-pages">${pageScores.map((page) => `<span>${escapeHtml(page.label || `Page ${page.page}`)}: ${Number(page.score || 0)}/${Number(page.maxScore || page.total || 0)}</span>`).join("")}</div>`;
    }
    if (row._gradingError) return "—";
    return "—";
  }

  function updateSummary() {
    const visible = getVisibleRows();
    const percentages = visible
      .filter((row) => !row._gradingError)
      .map((row) => numberOrNull(row.percentage))
      .filter((value) => value !== null);

    document.querySelector("#summaryTotal").textContent = String(visible.length);
    document.querySelector("#summaryAverage").textContent = percentages.length ? `${Math.round(percentages.reduce((a, b) => a + b, 0) / percentages.length)}%` : "—";
    document.querySelector("#summaryHighest").textContent = percentages.length ? `${Math.round(Math.max(...percentages))}%` : "—";
    document.querySelector("#summaryLowest").textContent = percentages.length ? `${Math.round(Math.min(...percentages))}%` : "—";
  }

  function openDetails(row) {
    if (!row) return;

    const answerItems = row._gradedDetails || getSubmittedAnswerList(row);
    const gradingWarning = row._gradingError
      ? `<p class="detail-warning">This submission could not be graded locally: ${escapeHtml(row._gradingError)}</p>`
      : "";

    detailsContent.innerHTML = `
      ${gradingWarning}
      <div class="detail-grid detail-grid-wide">
        <div class="detail-box"><span>Student</span><strong>${escapeHtml(row.studentName || "—")}</strong></div>
        <div class="detail-box"><span>Class</span><strong>${escapeHtml(row.classId || "—")}</strong></div>
        <div class="detail-box"><span>Test</span><strong>${escapeHtml(row.testTitle || row.testId || "—")}</strong></div>
        <div class="detail-box"><span>Level</span><strong>${escapeHtml(row.level || "—")}</strong></div>
        <div class="detail-box"><span>Units</span><strong>${escapeHtml(String(row.unitRange || "—").replace("-", "–"))}</strong></div>
        <div class="detail-box"><span>Score</span><strong>${escapeHtml(scoreText(row))}</strong></div>
      </div>
      <section class="detail-section">
        <h3>Page scores</h3>
        ${renderPageScores(row)}
      </section>
      <section class="detail-section">
        <h3>Answers</h3>
        <div class="test-detail-answer-grid">
          ${answerItems.length ? answerItems.map((item) => `
            <div class="test-detail-answer">
              <strong>Q${escapeHtml(item.question)}</strong>
              <span>Answer: ${escapeHtml(item.answer || "—")}${item.correct === true ? " · Correct" : item.correct === false ? " · Incorrect" : ""}</span>
            </div>
          `).join("") : "<p>No answer details were returned.</p>"}
        </div>
      </section>
      <section class="detail-section">
        <h3>Submission</h3>
        <p class="muted">Submitted ${escapeHtml(formatDate(row.submittedAt || row._createdDate))} · ${escapeHtml(formatDuration(row.timeSpentSeconds))} · ID ${escapeHtml(row.clientSubmissionId || row._id || "—")}</p>
      </section>
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
    testSelect.value = "";
    studentInput.value = "";
    rows = [];
    status.textContent = "Enter a class ID and load results.";
    connectionStatus.textContent = "Brighton Database";
    resultsBody.innerHTML = `<tr><td colspan="9">No test results loaded yet.</td></tr>`;
    syncQueryParams();
    updateSummary();
  }

  function exportCsv() {
    const visible = getVisibleRows();
    if (!visible.length) {
      showToast("No results to export");
      return;
    }

    const headers = ["Student", "Class ID", "Test", "Level", "Units", "Submitted", "Score", "Max Score", "Percentage", "Time Seconds"];
    const lines = [headers, ...visible.map((row) => [
      row.studentName || "",
      row.classId || "",
      row.testTitle || row.testId || "",
      row.level || "",
      row.unitRange || "",
      row.submittedAt || row._createdDate || "",
      row._gradingError ? "" : row.score ?? "",
      row._gradingError ? "" : row.maxScore ?? "",
      row._gradingError ? "" : row.percentage ?? "",
      row.timeSpentSeconds ?? ""
    ])].map((cells) => cells.map(csvCell).join(","));

    const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `brighton-test-results-${classIdInput.value || "class"}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  function scoreText(row) {
    if (row._gradingError) return "Answer key unavailable";
    const score = numberOrNull(row.score);
    const maxScore = numberOrNull(row.maxScore);
    const percentage = numberOrNull(row.percentage);
    if (score === null) return "—";
    return `${score}/${maxScore ?? "—"}${percentage === null ? "" : ` · ${Math.round(percentage)}%`}`;
  }

  function safeJson(value, fallback = null) {
    return App.safeJson ? App.safeJson(value, fallback) : (() => {
      if (value === null || value === undefined || value === "") return fallback;
      if (typeof value !== "string") return value;
      try { return JSON.parse(value); } catch { return fallback; }
    })();
  }

  function formatDate(value) {
    return App.formatDate ? App.formatDate(value) : (value ? new Date(value).toLocaleString() : "—");
  }

  function formatDuration(seconds) {
    const value = Number(seconds);
    if (!Number.isFinite(value) || value < 0) return "—";
    const minutes = Math.floor(value / 60);
    const secs = Math.round(value % 60);
    return minutes ? `${minutes}m ${secs}s` : `${secs}s`;
  }

  function numberOrNull(value) {
    if (value === null || value === undefined || value === "") return null;
    const number = Number(value);
    return Number.isFinite(number) ? number : null;
  }

  function csvCell(value) {
    return App.csvCell ? App.csvCell(value) : `"${String(value ?? "").replace(/"/g, '""')}"`;
  }

  function escapeHtml(value) {
    return App.escapeHtml ? App.escapeHtml(value) : String(value ?? "");
  }

  function escapeAttr(value) {
    return App.escapeAttr ? App.escapeAttr(value) : escapeHtml(value).replace(/'/g, "&#39;");
  }

  function showToast(message) {
    toast.textContent = message;
    toast.classList.add("show");
    clearTimeout(showToast.timer);
    showToast.timer = setTimeout(() => toast.classList.remove("show"), 1700);
  }
})();
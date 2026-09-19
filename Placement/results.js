"use strict";

(() => {
  const config = window.BRIGHTON_SITE_CONFIG || {};
  const apiBase = String(config.API_BASE_URL || "").replace(/\/$/, "");

  const studentInput = document.querySelector("#studentInput");
  const levelSelect = document.querySelector("#levelSelect");
  const statusSelect = document.querySelector("#statusSelect");
  const loadBtn = document.querySelector("#loadBtn");
  const clearBtn = document.querySelector("#clearBtn");
  const exportBtn = document.querySelector("#exportBtn");
  const resultsBody = document.querySelector("#resultsBody");
  const resultsStatus = document.querySelector("#resultsStatus");
  const summaryTotal = document.querySelector("#summaryTotal");
  const summaryCompleted = document.querySelector("#summaryCompleted");
  const summaryConfidence = document.querySelector("#summaryConfidence");
  const summaryLevel = document.querySelector("#summaryLevel");
  const modal = document.querySelector("#detailsModal");
  const detailsTitle = document.querySelector("#detailsTitle");
  const detailsContent = document.querySelector("#detailsContent");
  const closeModalBtn = document.querySelector("#closeModalBtn");
  const toast = document.querySelector("#toast");

  let rows = [];

  const PROMPTS = {
    "sp-prea1-01": "Tell us about yourself. Say where you live and one thing you like doing.",
    "sp-a1-01": "Describe a normal weekday for you. What do you do in the morning, afternoon and evening?",
    "sp-a2-01": "Talk about a place you enjoy visiting. Describe it, say what you do there and explain why you like it.",
    "sp-b1-01": "Talk about a challenge you faced. Explain what happened, what you did and what you learned from it.",
    "sp-b1plus-01": "Do students learn better online or in person? Give your opinion, compare both options and support your answer with an example.",
    "sp-b2-01": "Some people think technology has improved communication, while others think it has made communication less meaningful. Discuss both views and give your own position.",
    "sp-c1-01": "Should convenience always be the main goal when technology is designed? Discuss possible trade-offs, use examples and reach a clear conclusion."
  };

  loadBtn?.addEventListener("click", loadResults);
  clearBtn?.addEventListener("click", clearFilters);
  exportBtn?.addEventListener("click", exportCsv);
  closeModalBtn?.addEventListener("click", closeModal);
  modal?.addEventListener("click", (event) => {
    if (event.target === modal) closeModal();
  });
  resultsBody?.addEventListener("click", (event) => {
    const button = event.target.closest("[data-session-id]");
    if (button) openDetails(button.dataset.sessionId);
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !modal?.classList.contains("hidden")) closeModal();
  });

  loadResults();

  async function apiGet(path, params = {}) {
    if (!apiBase) throw new Error("Brighton Database is not configured.");
    const url = new URL(`${apiBase}/${path}`);
    Object.entries(params).forEach(([key, value]) => {
      if (value !== "" && value != null) url.searchParams.set(key, String(value));
    });

    const response = await fetch(url);
    const payload = await response.json().catch(() => ({}));
    if (!response.ok || !payload?.success) {
      throw new Error(payload?.error || `Request failed (${response.status}).`);
    }
    return payload;
  }

  async function loadResults() {
    loadBtn.disabled = true;
    resultsStatus.textContent = "Loading placement results…";
    resultsBody.innerHTML = '<tr><td colspan="8">Loading…</td></tr>';

    try {
      const payload = await apiGet("brightonPlacementResults", {
        student: studentInput.value.trim(),
        level: levelSelect.value,
        status: statusSelect.value
      });
      rows = Array.isArray(payload.results) ? payload.results : [];
      renderRows();
      renderSummary();
      resultsStatus.textContent = rows.length
        ? `${rows.length} placement attempt${rows.length === 1 ? "" : "s"} loaded.`
        : "No placement attempts matched these filters.";
    } catch (error) {
      console.error(error);
      rows = [];
      renderSummary();
      resultsBody.innerHTML = '<tr><td colspan="8">Could not load placement results.</td></tr>';
      resultsStatus.textContent = error.message || "Could not load placement results.";
    } finally {
      loadBtn.disabled = false;
    }
  }

  function renderRows() {
    if (!rows.length) {
      resultsBody.innerHTML = '<tr><td colspan="8">No placement attempts found.</td></tr>';
      return;
    }

    resultsBody.innerHTML = rows.map((row) => {
      const status = row.status === "completed" ? "completed" : "active";
      const level = row.finalLevel || row.provisionalLevel || "—";
      return `
        <tr>
          <td><strong>${escapeHtml(row.studentName || "—")}</strong></td>
          <td><span class="placement-status ${status}">${status === "completed" ? "Completed" : "In progress"}</span></td>
          <td><span class="placement-level-pill">${escapeHtml(level)}</span></td>
          <td>${escapeHtml(formatDate(row.startedAt))}</td>
          <td>${escapeHtml(formatDate(row.completedAt))}</td>
          <td>${escapeHtml(formatDuration(row.timeSpentSeconds))}</td>
          <td>${escapeHtml(formatConfidence(row.confidence))}</td>
          <td><button class="secondary-btn" type="button" data-session-id="${escapeAttr(row.sessionId)}">View</button></td>
        </tr>
      `;
    }).join("");
  }

  function renderSummary() {
    summaryTotal.textContent = String(rows.length);
    const completed = rows.filter((row) => row.status === "completed");
    summaryCompleted.textContent = String(completed.length);

    const confidences = completed
      .map((row) => Number(row.confidence))
      .filter((value) => Number.isFinite(value) && value > 0);
    summaryConfidence.textContent = confidences.length
      ? `${Math.round((confidences.reduce((a, b) => a + b, 0) / confidences.length) * 100)}%`
      : "—";

    const counts = new Map();
    completed.forEach((row) => {
      const level = row.finalLevel || "";
      if (level) counts.set(level, (counts.get(level) || 0) + 1);
    });
    const mostCommon = [...counts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] || "—";
    summaryLevel.textContent = mostCommon;
  }

  async function openDetails(sessionId) {
    modal.classList.remove("hidden");
    modal.setAttribute("aria-hidden", "false");
    detailsTitle.textContent = "Loading…";
    detailsContent.innerHTML = '<div class="detail-loading">Loading placement details…</div>';

    try {
      const payload = await apiGet("brightonPlacementDashboardResult", { sessionId });
      renderDetails(payload);
    } catch (error) {
      console.error(error);
      detailsTitle.textContent = "Placement attempt";
      detailsContent.innerHTML = `<div class="detail-warning">${escapeHtml(error.message || "Could not load placement details.")}</div>`;
    }
  }

  function renderDetails(payload) {
    const session = payload.session || {};
    const result = payload.result || {};
    const speaking = payload.speaking || null;
    const skills = result.skills || {};
    const overallLevel = result.finalLevel || session.finalLevel || session.provisionalLevel || "—";
    const status = session.status === "completed" ? "Completed" : "In progress";

    detailsTitle.textContent = session.studentName || result.studentName || "Placement result";

    detailsContent.innerHTML = `
      <section class="placement-detail-hero">
        <div>
          <p class="eyebrow">${escapeHtml(status)}</p>
          <h3>${escapeHtml(session.studentName || result.studentName || "Student")}</h3>
          <p class="muted">Result ID: ${escapeHtml(result.resultId || session.resultId || "—")}</p>
        </div>
        <div class="placement-stamp">
          <strong>${escapeHtml(overallLevel)}</strong>
          <small>${escapeHtml(result.finalDescription || "")}</small>
        </div>
      </section>

      <section class="detail-grid placement-meta-grid">
        ${detailBox("Started", formatDate(session.startedAt))}
        ${detailBox("Completed", formatDate(session.completedAt))}
        ${detailBox("Time", formatDuration(session.timeSpentSeconds))}
        ${detailBox("Confidence", formatConfidence(session.confidence))}
      </section>

      <section class="detail-section">
        <h3>Skills</h3>
        <div class="placement-skill-grid">
          ${skillCard(skills.language, "Language Use")}
          ${skillCard(skills.reading, "Reading")}
          ${skillCard(skills.listening, "Listening")}
          ${skillCard(skills.speaking, "Speaking")}
        </div>
      </section>

      <section class="detail-section">
        <h3>Adaptive route</h3>
        <div class="route-chips">
          ${(payload.route || []).length
            ? payload.route.map((item) => `<span class="route-chip">${escapeHtml(item)}</span>`).join("")
            : '<span class="muted">No route data.</span>'}
        </div>
      </section>

      <section class="detail-section">
        <h3>Module performance</h3>
        <div class="module-grid">
          ${(payload.modules || []).length
            ? payload.modules.map((item) => `
              <div class="module-card">
                <strong>${escapeHtml(item.moduleId)}</strong>
                <span>${item.correct} / ${item.total} correct</span>
                <small>${escapeHtml(formatDuration(item.responseTimeSeconds))}</small>
              </div>
            `).join("")
            : '<span class="muted">No response data.</span>'}
        </div>
      </section>

      <section class="detail-section">
        <h3>Speaking sample</h3>
        ${renderSpeakingSample(speaking, session)}
      </section>
    `;

    document.querySelector("#copySpeakingSampleBtn")?.addEventListener("click", () => copySpeakingSample(speaking, session));
  }

  function renderSpeakingSample(speaking, session) {
    if (!speaking) {
      return '<div class="empty-speaking">No speaking sample was saved for this attempt.</div>';
    }

    const prompt = PROMPTS[speaking.promptId] || speaking.promptId || "Speaking prompt";
    const transcript = speaking.transcript || "";
    const audio = speaking.audioUrl
      ? `<audio class="speaking-audio" controls preload="metadata" src="${escapeAttr(speaking.audioUrl)}"></audio>`
      : '<p class="muted">No audio recording was stored for this attempt. The speech transcript is shown below.</p>';

    return `
      <article class="speaking-sample-card">
        <div class="speaking-sample-head">
          <div>
            <p class="eyebrow">${escapeHtml(speaking.promptLevel || "Speaking")}</p>
            <h3>Student speaking sample</h3>
          </div>
          <button id="copySpeakingSampleBtn" class="secondary-btn" type="button">Copy sample</button>
        </div>

        <div class="speaking-prompt-box">
          <strong>Prompt</strong>
          <p>${escapeHtml(prompt)}</p>
        </div>

        ${audio}

        <blockquote class="speaking-transcript">${escapeHtml(transcript || "No transcript available.")}</blockquote>

        <div class="speaking-metrics">
          ${metric("Level", speaking.speakingLevel || "—")}
          ${metric("Composite", speaking.composite == null ? "—" : Number(speaking.composite).toFixed(1))}
          ${metric("Duration", formatDuration(speaking.durationSeconds))}
          ${metric("Words", speaking.wordCount ?? "—")}
          ${metric("WPM", speaking.wpm ?? "—")}
          ${metric("Fluency", score10(speaking.fluency))}
          ${metric("Grammar", score10(speaking.grammar))}
          ${metric("Vocabulary", score10(speaking.vocabulary))}
          ${metric("Pronunciation", score10(speaking.pronunciation))}
          ${metric("Communication", score10(speaking.communication))}
        </div>
      </article>
    `;
  }

  async function copySpeakingSample(speaking, session) {
    if (!speaking) return;
    const prompt = PROMPTS[speaking.promptId] || speaking.promptId || "";
    const text = [
      `Student: ${session.studentName || ""}`,
      `Speaking level: ${speaking.speakingLevel || "—"}`,
      "",
      "Prompt:",
      prompt,
      "",
      "Speaking sample:",
      speaking.transcript || "No transcript available."
    ].join("\n");

    try {
      await navigator.clipboard.writeText(text);
      showToast("Speaking sample copied.");
    } catch {
      showToast("Could not copy speaking sample.");
    }
  }

  function clearFilters() {
    studentInput.value = "";
    levelSelect.value = "";
    statusSelect.value = "";
    loadResults();
  }

  function exportCsv() {
    if (!rows.length) {
      showToast("No results to export.");
      return;
    }

    const headers = ["Student", "Status", "Final level", "Provisional level", "Started", "Completed", "Time seconds", "Confidence", "Session ID"];
    const data = rows.map((row) => [
      row.studentName,
      row.status,
      row.finalLevel,
      row.provisionalLevel,
      row.startedAt,
      row.completedAt,
      row.timeSpentSeconds,
      row.confidence,
      row.sessionId
    ]);
    const csv = [headers, ...data].map((line) => line.map(csvCell).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "brighton-placement-results.csv";
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }

  function closeModal() {
    modal.classList.add("hidden");
    modal.setAttribute("aria-hidden", "true");
  }

  function skillCard(skill, label) {
    const item = skill || {};
    const level = item.skipped ? "Not scored" : (item.level || "—");
    return `
      <div class="placement-skill-card">
        <span>${escapeHtml(item.label || label)}</span>
        <strong>${escapeHtml(item.displayScore || "—")}</strong>
        <small>${escapeHtml(level)}</small>
      </div>
    `;
  }

  function detailBox(label, value) {
    return `<div class="detail-box"><span>${escapeHtml(label)}</span><strong>${escapeHtml(value || "—")}</strong></div>`;
  }

  function metric(label, value) {
    return `<div class="speaking-metric"><span>${escapeHtml(label)}</span><strong>${escapeHtml(value)}</strong></div>`;
  }

  function score10(value) {
    const number = Number(value);
    return Number.isFinite(number) ? number.toFixed(1) : "—";
  }

  function formatDate(value) {
    if (!value) return "—";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return String(value);
    return date.toLocaleString("en-GB", {
      day: "2-digit", month: "short", year: "numeric",
      hour: "2-digit", minute: "2-digit"
    });
  }

  function formatDuration(value) {
    const seconds = Math.max(0, Math.round(Number(value) || 0));
    if (!seconds) return "—";
    const minutes = Math.floor(seconds / 60);
    const remaining = seconds % 60;
    return minutes ? `${minutes}m ${remaining}s` : `${remaining}s`;
  }

  function formatConfidence(value) {
    const number = Number(value);
    return Number.isFinite(number) && number > 0 ? `${Math.round(number * 100)}%` : "—";
  }

  function csvCell(value) {
    return `"${String(value ?? "").replace(/"/g, '""')}"`;
  }

  function showToast(message) {
    toast.textContent = message;
    toast.classList.add("show");
    window.clearTimeout(showToast.timer);
    showToast.timer = window.setTimeout(() => toast.classList.remove("show"), 1800);
  }

  function escapeHtml(value) {
    return String(value ?? "").replace(/[&<>"']/g, (char) => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
    })[char]);
  }

  function escapeAttr(value) {
    return escapeHtml(value);
  }
})();

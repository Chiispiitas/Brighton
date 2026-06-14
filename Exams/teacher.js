"use strict";
/* ==============================================
     Brighton English School
     Made by: David Santana
============================================== */

(() => {
  const config = window.BRIGHTON_SITE_CONFIG || {};
  const apiBase = String(config.API_BASE_URL || "").replace(/\/$/, "");
  const examGrid = document.querySelector("#examGrid");
  const apiStatus = document.querySelector("#apiStatus");
  const refreshBtn = document.querySelector("#refreshBtn");
  const toast = document.querySelector("#toast");

  refreshBtn.addEventListener("click", loadExams);
  loadExams();

  /* ---------------------------------------------- 
  LOAD EXAMS 
  ---------------------------------------------- */
  async function loadExams() {
    examGrid.innerHTML = renderLoadingCards();
    try {
      if (!apiBase || apiBase.includes("YOUR-WIX")) throw new Error("Brighton Database not configured");
      const res = await fetch(`${apiBase}/getExams`, { headers: { "Accept": "application/json" } });
      const data = await res.json();
      if (!res.ok || data.success === false) throw new Error(data.error || `HTTP ${res.status}`);
      const exams = data.exams || [];
      apiStatus.textContent = `Connected to Brighton Database · ${exams.length} exam(s) loaded`;
      renderExams(exams);
    } catch (error) {
      apiStatus.textContent = "Failed to connect to Brighton Database. Check internet connection.";
      renderConnectionError(error);
    }
  }



  /* ---------------------------------------------- 
  RENDER CONNECTION ERROR 
  ---------------------------------------------- */
  function renderConnectionError(error) {
    const detail = error?.message ? ` <span class="muted-small">${escapeHtml(error.message)}</span>` : "";
    examGrid.innerHTML = `
      <article class="exam-card status-card danger-card">
        <span class="tag danger-tag">Connection failed</span>
        <h2>Could not load exams</h2>
        <p class="muted">Failed to connect to Brighton Database. Check internet connection.${detail}</p>
      </article>
    `;
  }

  /* ---------------------------------------------- 
  RENDER EXAMS 
  ---------------------------------------------- */
  function renderExams(exams) {
    if (!exams.length) {
      examGrid.innerHTML = `<article class="exam-card"><h2>No exams found</h2><p class="muted">No exams were returned from Brighton Database.</p></article>`;
      return;
    }

    examGrid.innerHTML = exams.map(exam => {
      const shareUrl = exam.shareUrl || exam.iframeUrl || "#";
      const resultsUrl = `results.html?examId=${encodeURIComponent(exam.examId || "")}`;
      return `
        <article class="exam-card">
          <div>
            <div class="exam-meta">
              <span class="tag">${escapeHtml(exam.level || "Exam")}</span>
              <span class="tag">${escapeHtml(exam.skill || "Digital")}</span>
              <span class="tag status-tag">${exam.isActive === false ? "Inactive" : "Active"}</span>
            </div>
            <h2 style="margin-top:10px">${escapeHtml(exam.title || "Untitled exam")}</h2>
            <p class="muted">${escapeHtml(exam.description || "No description added.")}</p>
          </div>
          <div class="exam-meta">
            <span class="tag">${Number(exam.totalQuestions || 0)} questions</span>
            <span class="tag">${Number(exam.maxScore || 0)} points</span>
            <span class="tag">ID: ${escapeHtml(exam.examId || "—")}</span>
          </div>
          <div class="card-actions">
            <a class="primary-btn" href="${escapeAttr(shareUrl)}" target="_blank" rel="noopener">Open exam</a>
            <button class="secondary-btn" data-copy="${escapeAttr(shareUrl)}">Copy student link</button>
            <a class="secondary-btn" href="${escapeAttr(resultsUrl)}">Results</a>
          </div>
        </article>
      `;
    }).join("");

    document.querySelectorAll("[data-copy]").forEach(button => {
      button.addEventListener("click", async () => {
        const url = button.getAttribute("data-copy");
        try {
          await navigator.clipboard.writeText(url);
          showToast("Exam link copied");
        } catch {
          window.prompt("Copy this exam link:", url);
        }
      });
    });
  }

  /* ---------------------------------------------- 
  RENDER LOADING CARDS 
  ---------------------------------------------- */
  function renderLoadingCards() {
    return Array.from({ length: 2 }, () => `
      <article class="exam-card">
        <span class="tag">Loading</span>
        <h2>Loading exam...</h2>
        <p class="muted">Checking Brighton Database.</p>
      </article>
    `).join("");
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
})();

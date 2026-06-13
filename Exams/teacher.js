(() => {
  const config = window.BRIGHTON_SITE_CONFIG || {};
  const apiBase = String(config.API_BASE_URL || "").replace(/\/$/, "");
  const examGrid = document.querySelector("#examGrid");
  const apiStatus = document.querySelector("#apiStatus");
  const refreshBtn = document.querySelector("#refreshBtn");
  const toast = document.querySelector("#toast");

  refreshBtn.addEventListener("click", loadExams);
  loadExams();

  async function loadExams() {
    examGrid.innerHTML = renderLoadingCards();
    try {
      if (!apiBase || apiBase.includes("YOUR-WIX")) throw new Error("Wix API not configured");
      const res = await fetch(`${apiBase}/getExams`, { headers: { "Accept": "application/json" } });
      const data = await res.json();
      if (!res.ok || data.success === false) throw new Error(data.error || `HTTP ${res.status}`);
      apiStatus.textContent = `Connected to Wix API · ${data.exams.length} exam(s) loaded`;
      renderExams(data.exams || []);
    } catch (error) {
      apiStatus.textContent = `Using local fallback exam list · ${error.message}`;
      const fallback = (config.FALLBACK_EXAMS || []).map(exam => ({
        ...exam,
        shareUrl: buildLocalUrl(exam.relativeUrl || exam.shareUrl || "")
      }));
      renderExams(fallback);
    }
  }

  function buildLocalUrl(relativeUrl) {
    const base = new URL(window.location.href);
    return new URL(relativeUrl, base).toString();
  }

  function renderExams(exams) {
    if (!exams.length) {
      examGrid.innerHTML = `<article class="exam-card"><h2>No exams found</h2><p class="muted">Add exams to the Wix Exams CMS collection or configure FALLBACK_EXAMS in config.js.</p></article>`;
      return;
    }

    examGrid.innerHTML = exams.map(exam => {
      const shareUrl = exam.shareUrl || exam.iframeUrl || buildLocalUrl(exam.relativeUrl || "");
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

  function renderLoadingCards() {
    return Array.from({ length: 2 }, () => `
      <article class="exam-card">
        <span class="tag">Loading</span>
        <h2>Loading exam...</h2>
        <p class="muted">Checking the Wix CMS connection.</p>
      </article>
    `).join("");
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

"use strict";
/* ==============================================
     Brighton English School
     Made by: David Santana
============================================== */

(() => {
  const App = window.BrightonApp || {};
  const config = window.BRIGHTON_SITE_CONFIG || {};
  const apiBase = String(config.API_BASE_URL || "").replace(/\/$/, "");

  const levelScreen = document.querySelector("#examLevelScreen");
  const selectedLevelSection = document.querySelector("#selectedExamLevel");
  const levelButtons = Array.from(document.querySelectorAll(".exam-level-button"));
  const backToLevelsBtn = document.querySelector("#backToExamLevels");
  const selectedLevelLabel = document.querySelector("#selectedExamLevelLabel");
  const selectedLevelTitle = document.querySelector("#selectedExamLevelTitle");
  const catalogStatus = document.querySelector("#catalogStatus");
  const examGrid = document.querySelector("#examGrid");
  const apiStatus = document.querySelector("#apiStatus");
  const refreshBtn = document.querySelector("#refreshBtn");
  const toast = document.querySelector("#toast");

  let allExams = [];
  let selectedLevel = "";
  let usingFallback = false;

  levelButtons.forEach((button) => {
    button.addEventListener("click", () => selectLevel(button.dataset.level || ""));
  });
  backToLevelsBtn?.addEventListener("click", showLevelSelection);
  refreshBtn?.addEventListener("click", () => loadExams({ preserveLevel: true }));

  loadExams();

  /* ----------------------------------------------
  LOAD EXAMS
  ---------------------------------------------- */
  async function loadExams(options = {}) {
    const preserveLevel = options.preserveLevel === true;
    usingFallback = false;

    if (catalogStatus) catalogStatus.textContent = "Loading exam catalog...";
    if (selectedLevel && examGrid) examGrid.innerHTML = renderLoadingCards();

    try {
      if (!apiBase || apiBase.includes("YOUR-WIX")) throw new Error("Brighton Database not configured");

      const res = await fetch(`${apiBase}/getExams`, {
        headers: { "Accept": "application/json" }
      });
      const data = await res.json();
      if (!res.ok || data.success === false) throw new Error(data.error || `HTTP ${res.status}`);

      allExams = Array.isArray(data.exams) ? data.exams : [];
      updateLevelCounts();
      if (catalogStatus) catalogStatus.textContent = `${allExams.length} exam${allExams.length === 1 ? "" : "s"} available from Brighton Database.`;

      if (selectedLevel && preserveLevel) renderSelectedLevel();
      else openLevelFromUrlIfPresent();
    } catch (error) {
      const fallback = Array.isArray(config.FALLBACK_EXAMS) ? config.FALLBACK_EXAMS : [];
      allExams = fallback;
      usingFallback = true;
      updateLevelCounts();

      if (catalogStatus) {
        catalogStatus.textContent = fallback.length
          ? "Brighton Database is unavailable. Showing the local exam catalog."
          : "Could not load the exam catalog.";
      }

      if (selectedLevel && preserveLevel) renderSelectedLevel(error);
      else openLevelFromUrlIfPresent();
    }
  }

  /* ----------------------------------------------
  LEVEL SELECTION
  ---------------------------------------------- */
  function selectLevel(level) {
    const normalized = normalizeLevel(level);
    if (!normalized) return;

    selectedLevel = normalized;
    levelScreen.hidden = true;
    selectedLevelSection.hidden = false;
    selectedLevelLabel.textContent = `${normalized} level`;
    selectedLevelTitle.textContent = `${normalized} Exams`;
    syncLevelUrl(normalized);
    renderSelectedLevel();

    requestAnimationFrame(() => {
      backToLevelsBtn?.focus({ preventScroll: true });
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  }

  function showLevelSelection() {
    selectedLevel = "";
    selectedLevelSection.hidden = true;
    levelScreen.hidden = false;
    examGrid.innerHTML = "";
    syncLevelUrl("");
    requestAnimationFrame(() => window.scrollTo({ top: 0, behavior: "smooth" }));
  }

  function openLevelFromUrlIfPresent() {
    const params = new URLSearchParams(window.location.search);
    const requested = normalizeLevel(params.get("level") || "");
    if (requested && levelButtons.some((button) => normalizeLevel(button.dataset.level) === requested)) {
      selectLevel(requested);
    }
  }

  function syncLevelUrl(level) {
    try {
      const url = new URL(window.location.href);
      if (level) url.searchParams.set("level", level);
      else url.searchParams.delete("level");
      window.history.replaceState({}, "", url);
    } catch {
      // URL state is optional.
    }
  }

  function updateLevelCounts() {
    levelButtons.forEach((button) => {
      const level = normalizeLevel(button.dataset.level || "");
      const count = getExamsForLevel(level).length;
      const countNode = button.querySelector(`[data-level-count="${cssEscape(level)}"]`) || button.querySelector("small");
      if (countNode) countNode.textContent = `${count} exam${count === 1 ? "" : "s"}`;
      button.classList.toggle("empty", count === 0);
      button.classList.toggle("has-exams", count > 0);
      button.setAttribute("aria-label", `${level} exams, ${count} available`);
    });
  }

  /* ----------------------------------------------
  RENDER SELECTED LEVEL
  ---------------------------------------------- */
  function renderSelectedLevel(error) {
    if (!selectedLevel) return;

    const exams = getExamsForLevel(selectedLevel);
    const sourceText = usingFallback ? "Local exam catalog" : "Brighton Database";

    if (apiStatus) {
      if (error && !exams.length) {
        apiStatus.textContent = `Could not connect to Brighton Database. No local ${selectedLevel} exams are configured.`;
      } else {
        apiStatus.textContent = `${sourceText} · ${exams.length} ${selectedLevel} exam${exams.length === 1 ? "" : "s"}`;
      }
    }

    renderExams(exams);
  }

  function getExamsForLevel(level) {
    const normalized = normalizeLevel(level);
    return allExams.filter((exam) => normalizeLevel(exam.level) === normalized);
  }

  /* ----------------------------------------------
  RENDER EXAMS
  ---------------------------------------------- */
  function renderExams(exams) {
    if (!examGrid) return;

    if (!exams.length) {
      examGrid.innerHTML = `
        <article class="exam-card exam-empty-card">
          <span class="tag status-tag">Coming soon</span>
          <h2>No ${escapeHtml(selectedLevel)} exams yet</h2>
          <p class="muted">This level is ready in the Exam platform, but no formal exam has been added to the catalog yet.</p>
        </article>
      `;
      return;
    }

    examGrid.innerHTML = exams.map((exam) => {
      const shareUrl = resolveExamUrl(exam);
      const resultsUrl = `results.html?examId=${encodeURIComponent(exam.examId || "")}`;
      const active = exam.isActive !== false;

      return `
        <article class="exam-card ${active ? "" : "exam-card-inactive"}">
          <div>
            <div class="exam-meta">
              <span class="tag">${escapeHtml(exam.level || "Exam")}</span>
              <span class="tag">${escapeHtml(exam.skill || "Digital")}</span>
              <span class="tag status-tag">${active ? "Active" : "Inactive"}</span>
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
            <button class="secondary-btn" type="button" data-copy="${escapeAttr(shareUrl)}">Copy student link</button>
            <a class="secondary-btn" href="${escapeAttr(resultsUrl)}">Results</a>
          </div>
        </article>
      `;
    }).join("");

    document.querySelectorAll("[data-copy]").forEach((button) => {
      button.addEventListener("click", async () => {
        const url = button.getAttribute("data-copy") || "";
        if (!url || url === "#") {
          showToast("Student link is not configured");
          return;
        }

        try {
          await navigator.clipboard.writeText(url);
          showToast("Exam link copied");
        } catch {
          if (!copyWithFallback(url)) window.prompt("Copy this exam link:", url);
          else showToast("Exam link copied");
        }
      });
    });
  }

  function resolveExamUrl(exam) {
    const target = String(exam.shareUrl || exam.iframeUrl || exam.relativeUrl || "").trim();
    if (!target) return "#";
    try {
      return new URL(target, window.location.href).href;
    } catch {
      return target;
    }
  }

  function copyWithFallback(text) {
    try {
      const input = document.createElement("textarea");
      input.value = text;
      input.setAttribute("readonly", "");
      input.style.position = "fixed";
      input.style.opacity = "0";
      document.body.appendChild(input);
      input.select();
      const success = document.execCommand("copy");
      input.remove();
      return success;
    } catch {
      return false;
    }
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
  UTILITIES
  ---------------------------------------------- */
  function normalizeLevel(value) {
    return String(value || "").trim().toUpperCase().replace(/\s+/g, "");
  }

  function cssEscape(value) {
    if (window.CSS?.escape) return window.CSS.escape(value);
    return String(value || "").replace(/([+.#:[\],>~*'"\\])/g, "\\$1");
  }

  function showToast(message) {
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add("show");
    clearTimeout(showToast.timer);
    showToast.timer = setTimeout(() => toast.classList.remove("show"), 1800);
  }

  function escapeHtml(value) {
    return App.escapeHtml ? App.escapeHtml(value) : String(value ?? "");
  }

  function escapeAttr(value) {
    return App.escapeAttr ? App.escapeAttr(value) : escapeHtml(value).replace(/'/g, "&#39;");
  }
})();

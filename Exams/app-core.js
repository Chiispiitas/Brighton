"use strict";
/* ==============================================
     Brighton App Core
     Made by: David Santana
============================================== */

(() => {
  const BrightonApp = {
    $,
    $$,
    clamp,
    countWords,
    debounce,
    escapeHtml,
    escapeAttr,
    formatDate,
    csvCell,
    safeJson,
    normalizeClassCode,
    makeSlug,
    getApiBase,
    buildApiUrl,
    renderEndSubmitCard,
    bindEndSubmitCard
  };

  /* ---------------------------------------------- 
  SELECT ONE 
  ---------------------------------------------- */
  function $(selector, root = document) {
    return root.querySelector(selector);
  }

  /* ---------------------------------------------- 
  SELECT ALL 
  ---------------------------------------------- */
  function $$(selector, root = document) {
    return Array.from(root.querySelectorAll(selector));
  }

  /* ---------------------------------------------- 
  CLAMP 
  ---------------------------------------------- */
  function clamp(value, min, max) {
    return Math.min(Math.max(Number(value) || 0, min), max);
  }

  /* ---------------------------------------------- 
  COUNT WORDS 
  ---------------------------------------------- */
  function countWords(text) {
    return String(text || "").trim().split(/\s+/).filter(Boolean).length;
  }

  /* ---------------------------------------------- 
  DEBOUNCE 
  ---------------------------------------------- */
  function debounce(fn, delay) {
    let timer;
    return (...args) => {
      window.clearTimeout(timer);
      timer = window.setTimeout(() => fn(...args), delay);
    };
  }

  /* ---------------------------------------------- 
  ESCAPE HTML 
  ---------------------------------------------- */
  function escapeHtml(value) {
    return String(value ?? "").replace(/[&<>"]/g, char => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;"
    }[char]));
  }

  /* ---------------------------------------------- 
  ESCAPE ATTR 
  ---------------------------------------------- */
  function escapeAttr(value) {
    return escapeHtml(value).replace(/'/g, "&#39;");
  }

  /* ---------------------------------------------- 
  FORMAT DATE 
  ---------------------------------------------- */
  function formatDate(value) {
    if (!value) return "—";
    const date = new Date(value);
    return Number.isFinite(date.getTime()) ? date.toLocaleString() : String(value);
  }

  /* ---------------------------------------------- 
  CSV CELL 
  ---------------------------------------------- */
  function csvCell(value) {
    const text = String(value ?? "");
    return `"${text.replace(/"/g, '""')}"`;
  }

  /* ---------------------------------------------- 
  SAFE JSON 
  ---------------------------------------------- */
  function safeJson(value, fallback = null) {
    if (value === undefined || value === null || value === "") return fallback;
    if (typeof value !== "string") return value;
    try {
      return JSON.parse(value);
    } catch {
      return fallback;
    }
  }

  /* ---------------------------------------------- 
  NORMALIZE CLASS CODE 
  ---------------------------------------------- */
  function normalizeClassCode(value) {
    const raw = String(value || "").trim().toUpperCase();
    const compact = raw.replace(/[^A-Z0-9]+/g, "");
    const exact = compact.match(/^([A-Z])(\d+)$/);
    if (exact) return `${exact[1]}-${exact[2]}`;
    const loose = raw.match(/([A-Z])\D*(\d+)/);
    if (loose) return `${loose[1]}-${loose[2]}`;
    return raw;
  }

  /* ---------------------------------------------- 
  MAKE SLUG 
  ---------------------------------------------- */
  function makeSlug(value, limit = 120) {
    return String(value || "")
      .toLowerCase()
      .normalize("NFKD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_+|_+$/g, "")
      .slice(0, limit);
  }

  /* ---------------------------------------------- 
  GET API BASE 
  ---------------------------------------------- */
  function getApiBase() {
    const config = window.BRIGHTON_SITE_CONFIG || {};
    return String(config.API_BASE_URL || "").replace(/\/$/, "");
  }

  /* ---------------------------------------------- 
  BUILD API URL 
  ---------------------------------------------- */
  function buildApiUrl(path, params = {}) {
    const base = getApiBase();
    const url = new URL(`${base}/${String(path || "").replace(/^\/+/, "")}`);
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") url.searchParams.set(key, value);
    });
    return url.toString();
  }

  /* ---------------------------------------------- 
  RENDER END SUBMIT CARD 
  ---------------------------------------------- */
  function renderEndSubmitCard(options = {}) {
    const label = options.label || "Submit exam";
    const title = options.title || "Ready to submit?";
    const body = options.body || "You can submit from here at any time. Review your answers first, then send your exam to Brighton Database.";
    const buttonText = options.buttonText || label;
    const dataAttr = options.dataAttr || "data-submit-exam";
    return `
      <section class="end-submit-card" aria-label="${escapeAttr(label)}">
        <p class="eyebrow">${escapeHtml(label)}</p>
        <h3>${escapeHtml(title)}</h3>
        <p>${escapeHtml(body)}</p>
        <button class="primary-btn end-submit-btn" type="button" ${dataAttr}>${escapeHtml(buttonText)}</button>
      </section>
    `;
  }

  /* ---------------------------------------------- 
  BIND END SUBMIT CARD 
  ---------------------------------------------- */
  function bindEndSubmitCard(root, callback, selector = "[data-submit-exam]") {
    const button = $(selector, root || document);
    if (!button || typeof callback !== "function") return;
    button.addEventListener("click", callback);
  }

  window.BrightonApp = BrightonApp;
})();

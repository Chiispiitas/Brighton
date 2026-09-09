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
    return String(value ?? "").replace(/[&<>\"]/g, char => ({
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

/* ----------------------------------------------
   Immutable answer-key release bridge
   ---------------------------------------------- */
(() => {
  const ANSWER_KEY_VERSION = "2026-09-08.1";
  const VERSION_SEPARATOR = "@@";
  const VERSIONED_POST_ENDPOINT = /\/(?:submitExam|submitTest|updateProgress)(?:\?|$)/i;
  const VERSIONED_RESULT_ENDPOINT = /\/(?:getResults|getTestResults|getProgress)(?:\?|$)/i;
  const LEGACY_MARKER = "Legacy / unversioned";

  window.BRIGHTON_ANSWER_KEY_VERSION = ANSWER_KEY_VERSION;
  window.BrightonApp = window.BrightonApp || {};
  window.BrightonApp.answerKeyVersion = ANSWER_KEY_VERSION;
  window.BrightonApp.decorateVersionedAssessmentId = decorateVersionedAssessmentId;

  if (window.__BRIGHTON_ANSWER_KEY_VERSION_FETCH_BRIDGE__) return;
  window.__BRIGHTON_ANSWER_KEY_VERSION_FETCH_BRIDGE__ = true;

  const nativeFetch = window.fetch.bind(window);

  window.fetch = async function brightonVersionedFetch(input, init) {
    const url = requestUrl(input);
    const method = requestMethod(input, init);
    let nextInit = init;

    if (method === "POST" && VERSIONED_POST_ENDPOINT.test(url)) {
      nextInit = stampSubmissionBody(init);
    }

    const response = await nativeFetch(input, nextInit);
    if (method !== "GET" || !VERSIONED_RESULT_ENDPOINT.test(url) || !response.ok) return response;

    try {
      const data = await response.clone().json();
      if (!data || !Array.isArray(data.items)) return response;
      const endpoint = endpointName(url);
      const items = data.items.map((item) => decorateResultItem(item, endpoint));
      return rebuildJsonResponse(response, { ...data, items });
    } catch (error) {
      console.warn("Could not apply Brighton answer-key version metadata", error);
      return response;
    }
  };

  function stampSubmissionBody(init) {
    if (!init || typeof init.body !== "string") return init;
    try {
      const payload = JSON.parse(init.body);
      if (!payload || typeof payload !== "object" || Array.isArray(payload)) return init;
      return {
        ...init,
        body: JSON.stringify({
          ...payload,
          answerKeyVersion: ANSWER_KEY_VERSION,
          testVersion: ANSWER_KEY_VERSION
        })
      };
    } catch {
      return init;
    }
  }

  function decorateResultItem(item, endpoint) {
    if (!item || typeof item !== "object") return item;
    const copy = { ...item };
    const version = normalizeVersion(copy.answerKeyVersion || copy.testVersion);
    const isTestRow = endpoint === "getTestResults";
    const idField = isTestRow ? "testId" : "examId";
    const titleField = isTestRow ? "testTitle" : "examTitle";
    const baseId = String(copy[idField] || "").trim();

    if (version && baseId) {
      copy[idField] = decorateVersionedAssessmentId(baseId, version);
      copy._answerKeyVersionStatus = "versioned";
      copy._answerKeyVersion = version;
      return copy;
    }

    copy._answerKeyVersionStatus = "legacy";
    copy._answerKeyVersion = "";
    if (baseId || copy[titleField]) {
      copy[titleField] = appendLegacyMarker(copy[titleField] || baseId);
    }
    return copy;
  }

  function decorateVersionedAssessmentId(value, version) {
    const id = String(value || "").trim();
    const safeVersion = normalizeVersion(version);
    if (!id || !safeVersion || id.includes(VERSION_SEPARATOR)) return id;
    return `${id}${VERSION_SEPARATOR}${safeVersion}`;
  }

  function normalizeVersion(value) {
    const version = String(value || "").trim();
    return /^[A-Za-z0-9._-]{1,80}$/.test(version) ? version : "";
  }

  function appendLegacyMarker(value) {
    const text = String(value || "").trim();
    if (!text) return LEGACY_MARKER;
    return text.includes(LEGACY_MARKER) ? text : `${text} · ${LEGACY_MARKER}`;
  }

  function requestUrl(input) {
    if (typeof input === "string") return input;
    if (input instanceof URL) return input.toString();
    return String(input?.url || "");
  }

  function requestMethod(input, init) {
    return String(init?.method || input?.method || "GET").toUpperCase();
  }

  function endpointName(url) {
    try {
      return new URL(url, window.location.href).pathname.split("/").filter(Boolean).pop() || "";
    } catch {
      return String(url || "").split("?")[0].split("/").filter(Boolean).pop() || "";
    }
  }

  function rebuildJsonResponse(response, data) {
    const headers = new Headers(response.headers);
    headers.delete("content-length");
    headers.set("content-type", "application/json; charset=utf-8");
    return new Response(JSON.stringify(data), {
      status: response.status,
      statusText: response.statusText,
      headers
    });
  }
})();

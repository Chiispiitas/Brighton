"use strict";
/* ==============================================
     Brighton Live Progress
     Made by: David Santana
============================================== */

(() => {
  const config = window.BRIGHTON_SITE_CONFIG || {};
  const apiBase = String(config.API_BASE_URL || "").replace(/\/$/, "");
  const intervalMs = Number(config.LIVE_PROGRESS_INTERVAL_MS) || 30000;
  const touchDelayMs = Number(config.LIVE_PROGRESS_TOUCH_DELAY_MS) || 8000;

  /* ---------------------------------------------- 
  CREATE 
  ---------------------------------------------- */
  function create(options) {
    let timer = null;
    let touchTimer = null;
    let running = false;
    let lastStatus = "waiting";
    const badge = createBadge();

    /* ---------------------------------------------- 
    START 
    ---------------------------------------------- */
    function start() {
      if (running) return;
      running = true;
      updateBadge("syncing", "Connecting to Brighton Database...");
      send("in_progress");
      timer = window.setInterval(() => send("in_progress"), intervalMs);
    }

    /* ---------------------------------------------- 
    TOUCH 
    ---------------------------------------------- */
    function touch() {
      if (!running || lastStatus === "submitted") return;
      window.clearTimeout(touchTimer);
      touchTimer = window.setTimeout(() => send("in_progress"), touchDelayMs);
    }

    /* ---------------------------------------------- 
    MARK SUBMITTED 
    ---------------------------------------------- */
    async function markSubmitted(extra = {}) {
      lastStatus = "submitted";
      window.clearTimeout(touchTimer);
      window.clearInterval(timer);
      await send("submitted", extra);
      stop();
    }

    /* ---------------------------------------------- 
    STOP 
    ---------------------------------------------- */
    function stop() {
      running = false;
      window.clearTimeout(touchTimer);
      window.clearInterval(timer);
    }

    /* ---------------------------------------------- 
    SEND 
    ---------------------------------------------- */
    async function send(status, extra = {}) {
      lastStatus = status;
      if (!apiBase || apiBase.includes("YOUR-WIX")) return;
      if (!navigator.onLine) {
        updateBadge("offline", "Connection lost. Your answers are saved on this device.");
        return;
      }

      try {
        const snapshot = typeof options.getProgress === "function" ? options.getProgress() : {};
        const payload = buildPayload(options, snapshot, status, extra);
        const response = await fetch(`${apiBase}/updateProgress`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });
        const data = await response.json().catch(() => ({}));
        if (!response.ok || data.success === false) throw new Error(data.error || `HTTP ${response.status}`);
        updateBadge(status === "submitted" ? "submitted" : "online", status === "submitted" ? "Submitted to Brighton Database" : "Connected to Brighton Database");
      } catch (error) {
        updateBadge("offline", "Connection lost. Your answers are saved on this device.");
      }
    }

    window.addEventListener("online", () => { if (running) send(lastStatus === "submitted" ? "submitted" : "in_progress"); });
    window.addEventListener("offline", () => updateBadge("offline", "Connection lost. Your answers are saved on this device."));
    document.addEventListener("visibilitychange", () => { if (!document.hidden && running) send(lastStatus === "submitted" ? "submitted" : "in_progress"); });

    return { start, touch, markSubmitted, stop };
  }

  /* ---------------------------------------------- 
  BUILD PAYLOAD 
  ---------------------------------------------- */
  function buildPayload(options, snapshot, status, extra) {
    const studentName = String(snapshot.studentName || options.studentName || "").trim();
    const classId = String(snapshot.classId || options.classId || "").trim();
    const startedAt = snapshot.startedAt || options.startedAt || new Date().toISOString();
    const progressId = snapshot.progressId || makeProgressId(options.examId, classId, studentName, startedAt);
    return {
      progressId,
      examId: options.examId,
      examTitle: options.examTitle || options.examId,
      skill: options.skill || "",
      level: options.level || "",
      studentName,
      classId,
      status,
      startedAt,
      lastSeenAt: new Date().toISOString(),
      currentPart: snapshot.currentPart || "",
      currentQuestion: snapshot.currentQuestion || "",
      answeredCount: Number(snapshot.answeredCount) || 0,
      totalQuestions: Number(snapshot.totalQuestions) || 0,
      progressPercent: Number(snapshot.progressPercent) || 0,
      timeSpentSeconds: Number(snapshot.timeSpentSeconds) || 0,
      submittedAt: extra.submittedAt || "",
      submissionId: extra.submissionId || ""
    };
  }

  /* ---------------------------------------------- 
  MAKE PROGRESS ID 
  ---------------------------------------------- */
  function makeProgressId(examId, classId, studentName, startedAt) {
    const base = `${examId}_${classId}_${studentName}_${startedAt}`.toLowerCase();
    return base.normalize("NFKD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "").slice(0, 120);
  }

  /* ---------------------------------------------- 
  CREATE BADGE 
  ---------------------------------------------- */
  function createBadge() {
    let badge = document.querySelector("#connectionStatus");
    if (badge) return badge;
    badge = document.createElement("div");
    badge.id = "connectionStatus";
    badge.className = "connection-status waiting";
    badge.textContent = "Waiting";
    const right = document.querySelector(".top-header .header-right");
    if (right) right.prepend(badge);
    else document.body.appendChild(badge);
    injectStyle();
    return badge;
  }

  /* ---------------------------------------------- 
  UPDATE BADGE 
  ---------------------------------------------- */
  function updateBadge(type, message) {
    const badge = document.querySelector("#connectionStatus");
    if (!badge) return;
    badge.className = `connection-status ${type}`;
    badge.textContent = message;
    badge.title = message;
    badge.setAttribute("aria-label", message);
  }

  /* ---------------------------------------------- 
  INJECT STYLE 
  ---------------------------------------------- */
  function injectStyle() {
    if (document.querySelector("#brightonLiveProgressStyle")) return;
    const style = document.createElement("style");
    style.id = "brightonLiveProgressStyle";
    style.textContent = `
      .connection-status {
        min-height: 30px;
        display: inline-flex;
        align-items: center;
        gap: 7px;
        border-radius: 999px;
        padding: 6px 10px;
        font-size: 11px;
        font-weight: 900;
        white-space: nowrap;
        background: #fff4df;
        color: #7a4a00;
      }
      .connection-status::before {
        content: "";
        width: 8px;
        height: 8px;
        border-radius: 999px;
        background: currentColor;
        flex: 0 0 auto;
      }
      .connection-status.online,
      .connection-status.submitted { background: #def9f7; color: #075f5f; }
      .connection-status.offline { background: #ffe6e6; color: #b32626; }
      .connection-status.syncing { background: #eef2ff; color: #3347a0; }
      @media (max-width: 720px) {
        .connection-status {
          width: 18px;
          min-width: 18px;
          height: 18px;
          min-height: 18px;
          padding: 0;
          border-radius: 999px;
          font-size: 0;
          line-height: 0;
          overflow: visible;
          justify-content: center;
          background: transparent;
          color: #8a6a00;
        }
        .connection-status::before {
          width: 12px;
          height: 12px;
          box-shadow: 0 0 0 3px rgba(255, 190, 50, 0.18), 0 0 10px rgba(255, 190, 50, 0.45);
        }
        .connection-status.online,
        .connection-status.submitted { background: transparent; color: #00a86b; }
        .connection-status.online::before,
        .connection-status.submitted::before { box-shadow: 0 0 0 3px rgba(0, 168, 107, 0.18), 0 0 12px rgba(0, 168, 107, 0.75); }
        .connection-status.syncing { background: transparent; color: #3a56d4; }
        .connection-status.syncing::before { box-shadow: 0 0 0 3px rgba(58, 86, 212, 0.16), 0 0 10px rgba(58, 86, 212, 0.5); }
        .connection-status.offline { background: transparent; color: #d92d20; }
        .connection-status.offline::before {
          content: "!";
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 16px;
          height: 16px;
          color: #fff;
          background: #d92d20;
          font-size: 11px;
          line-height: 1;
          font-weight: 900;
          box-shadow: 0 0 0 3px rgba(217, 45, 32, 0.16), 0 0 10px rgba(217, 45, 32, 0.55);
        }
      }
    `;
    document.head.appendChild(style);
  }

  window.BrightonLiveProgress = { create };
})();

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
      }
      .connection-status.online,
      .connection-status.submitted { background: #def9f7; color: #075f5f; }
      .connection-status.offline { background: #ffe6e6; color: #b32626; }
      .connection-status.syncing { background: #eef2ff; color: #3347a0; }
      @media (max-width: 720px) {
        .connection-status { max-width: 118px; overflow: hidden; text-overflow: ellipsis; justify-content: center; }
      }
    `;
    document.head.appendChild(style);
  }

  window.BrightonLiveProgress = { create };
})();

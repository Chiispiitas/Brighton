"use strict";

(() => {
  const PLACEMENT_VERSION = "2026-09-19.1";
  const STORAGE_KEY = "brighton-placement-session-v1";

  const startScreen = document.querySelector("#startScreen");
  const transitionScreen = document.querySelector("#transitionScreen");
  const placementShell = document.querySelector("#placementShell");
  const studentForm = document.querySelector("#studentForm");
  const studentName = document.querySelector("#studentName");
  const startBtn = document.querySelector("#startBtn");
  const formError = document.querySelector("#formError");
  const candidateName = document.querySelector("#candidateName");

  const apiBase = String(window.BRIGHTON_SITE_CONFIG?.API_BASE_URL || "").replace(/\/$/, "");

  function makeClientSessionId() {
    if (window.crypto?.randomUUID) return window.crypto.randomUUID();
    return `placement-${Date.now()}-${Math.random().toString(36).slice(2)}-${Math.random().toString(36).slice(2)}`;
  }

  function saveLocalSession(session) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
    } catch (error) {
      console.warn("Could not cache placement session.", error);
    }
  }

  async function startRemoteSession(name, clientSessionId) {
    if (!apiBase) throw new Error("Placement service is unavailable.");

    const response = await fetch(`${apiBase}/startPlacement`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        clientSessionId,
        studentName: name,
        placementVersion: PLACEMENT_VERSION
      })
    });

    const payload = await response.json().catch(() => ({}));
    if (!response.ok || !payload?.success) {
      throw new Error(payload?.error || "Could not start placement.");
    }

    return payload;
  }

  function enterCalibration(name) {
    candidateName.textContent = name;

    startScreen.classList.add("hidden");
    transitionScreen.classList.remove("hidden");

    window.setTimeout(() => {
      transitionScreen.classList.add("hidden");
      placementShell.classList.remove("hidden");
    }, 1050);
  }

  studentForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const name = studentName.value.trim().replace(/\s+/g, " ");
    formError.textContent = "";

    if (name.length < 2) {
      studentName.focus();
      formError.textContent = "Enter your full name.";
      return;
    }

    startBtn.disabled = true;

    const clientSessionId = makeClientSessionId();

    try {
      const result = await startRemoteSession(name, clientSessionId);
      saveLocalSession({
        clientSessionId,
        sessionId: result.sessionId,
        placementVersion: result.placementVersion || PLACEMENT_VERSION,
        studentName: name,
        phase: "calibration",
        startedAt: new Date().toISOString()
      });
      enterCalibration(name);
    } catch (error) {
      console.error(error);
      formError.textContent = "Couldn't start. Try again.";
      startBtn.disabled = false;
    }
  });
})();
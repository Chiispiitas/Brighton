/* Progressive enhancement for book and standalone lesson views. No autoplay. */
(() => {
  "use strict";
  const script = document.currentScript;
  const audioBase = new URL(script?.dataset.audioBase || "./Audios/", document.baseURI);
  const icons = {
    play: '<path d="M5 3.5 12 8l-7 4.5Z"/>',
    pause: '<path d="M4.5 3.5h2.5v9H4.5zm4.5 0h2.5v9H9z"/>',
    error: '<path d="M7 3h2v6H7zm0 8h2v2H7z"/>'
  };
  const records = [];
  let audio, status, currentUrl = "", pending = false, failed = false, request = 0;

  function announce(message) {
    if (!status) {
      status = document.createElement("span");
      status.className = "hz-audio-status hz-no-print";
      status.setAttribute("role", "status");
      status.setAttribute("aria-live", "polite");
      document.body.append(status);
    }
    status.textContent = message;
  }

  function render() {
    for (const { button, url, track } of records) {
      const active = url === currentUrl;
      const playing = active && (pending || (audio && !audio.paused && !audio.ended));
      const error = active && failed;
      const label = `${error ? "Retry" : playing ? "Pause" : "Play"} track ${track}`;
      button.setAttribute("aria-label", label);
      button.setAttribute("aria-pressed", String(Boolean(playing)));
      button.setAttribute("aria-busy", String(active && pending));
      button.title = error ? `Audio unavailable. Click to retry track ${track}.` : label;
      button.dataset.state = error ? "error" : playing ? "playing" : "paused";
      button.firstElementChild.innerHTML = icons[error ? "error" : playing ? "pause" : "play"];
    }
  }

  function player() {
    if (audio) return audio;
    audio = document.createElement("audio");
    audio.preload = "none";
    audio.hidden = true;
    audio.className = "hz-no-print";
    document.body.append(audio);
    audio.addEventListener("play", render);
    audio.addEventListener("pause", render);
    audio.addEventListener("ended", () => { pending = false; render(); });
    return audio;
  }

  async function toggle(record) {
    const media = player();
    const ticket = ++request;
    if (currentUrl === record.url && (pending || !media.paused)) {
      pending = false;
      media.pause();
      render();
      return;
    }
    media.pause();
    if (currentUrl !== record.url || failed) media.src = record.url;
    currentUrl = record.url;
    failed = false;
    pending = true;
    render();
    try {
      await media.play();
      if (ticket !== request) return;
      pending = false;
      render();
    } catch {
      if (ticket !== request) return;
      pending = false;
      failed = true;
      render();
      announce(`Track ${record.track} could not be played. Check your connection and try again.`);
    }
  }

  function initialize() {
    for (const badge of document.querySelectorAll('.hz-audio-badge, [data-audio-track], [class*="-track"]')) {
      if (badge.matches("button")) continue;
      if (badge.querySelector(".hz-audio-toggle")) continue;
      const match = badge.textContent.match(/^\s*(?:♪\s*)?(\d+\.\d+)\s*$/);
      const track = badge.dataset.audioTrack || match?.[1];
      if (!track || !/^\d+\.\d+$/.test(track)) continue;
      const filename = badge.dataset.audioFile || `Track ${track}.mp3`;
      const url = new URL(filename, audioBase).href;
      const button = document.createElement("button");
      button.type = "button";
      button.className = "hz-audio-toggle hz-no-print";
      button.dataset.audioTrack = track;
      button.dataset.audioUrl = url;
      button.innerHTML = '<svg viewBox="0 0 16 16" aria-hidden="true" focusable="false"></svg>';
      const record = { button, url, track };
      records.push(record);
      button.addEventListener("click", () => { void toggle(record); });
      // No extra whitespace/text nodes: hiding this button restores the exact print badge.
      badge.append(button);
    }
    render();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", initialize, { once: true });
  else initialize();
})();

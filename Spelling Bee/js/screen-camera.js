"use strict";
(() => {
  const Cloud = window.SpellingCloud, Model = window.BeeScreen;
  const INTERVAL = 120000;
  const validImage = value => typeof value === "string" && value.length <= 60000 && /^data:image\/jpeg;base64,[A-Za-z0-9+/=]+$/.test(value);
  const validPacket = value => value?.screenCameraPreview === true && typeof value.active === "boolean" && Number.isFinite(Number(value.capturedAt)) && (!value.active || validImage(value.image));
  class Stage {
    constructor({ preview = false } = {}) {
      this.preview = preview; this.mode = "stage"; this.stream = null; this.code = ""; this.previewCode = "";
      this.generation = 0; this.pending = null; this.busy = false; this.lastCaptureAt = 0;
      this.stage = document.getElementById("broadcast"); this.video = document.getElementById("camera-feed");
      this.still = document.getElementById("camera-still"); this.panel = document.getElementById("camera-setup");
      this.toggle = document.getElementById("camera-toggle"); this.status = document.getElementById("camera-status");
      this.device = document.getElementById("camera-device"); this.mirror = document.getElementById("camera-mirror");
      this.startButton = document.getElementById("camera-start"); this.stopButton = document.getElementById("camera-stop");
      if (preview) {
        this.panel.remove(); this.toggle.remove(); this.video.remove();
        window.addEventListener("message", event => {
          if (event.source !== parent || event.origin !== location.origin || event.data?.type !== "bee-camera-still") return;
          const packet = event.data.packet;
          if (!validPacket(packet)) return;
          if (packet.active) { this.still.src = packet.image; this.still.classList.remove("hidden"); }
          else { this.still.removeAttribute("src"); this.still.classList.add("hidden"); }
          this.still.classList.toggle("mirrored", Boolean(packet.mirrored));
        });
        return;
      }
      this.toggle.addEventListener("click", () => this.open());
      document.getElementById("camera-close").addEventListener("click", () => this.panel.classList.add("hidden"));
      this.startButton.addEventListener("click", () => this.start());
      this.stopButton.addEventListener("click", () => this.stop("Camera stopped."));
      this.mirror.addEventListener("change", () => this.video.classList.toggle("mirrored", this.mirror.checked));
      document.addEventListener("keydown", event => {
        if (event.key.toLowerCase() === "c" && !/INPUT|TEXTAREA|SELECT/.test(event.target.tagName) && this.mode === "stream") this.open();
      });
      window.addEventListener("pagehide", () => this.stop());
    }
    async setSession(code) {
      if (code === this.code) return;
      this.code = code; this.previewCode = "";
      const key = await Model.cameraPreviewCode(code);
      if (this.code !== code) return;
      this.previewCode = key;
      if (this.stream) { this.lastCaptureAt = 0; this.capture(); }
    }
    setMode(mode) {
      if (mode === this.mode) return;
      this.mode = mode;
      if (this.preview) return;
      this.toggle.classList.toggle("hidden", mode !== "stream");
      if (mode === "stream") { if (!this.stream) this.open(); }
      else { this.stop(); this.panel.classList.add("hidden"); }
    }
    async open() {
      this.panel.classList.remove("hidden");
      if (!navigator.mediaDevices?.getUserMedia) { this.status.textContent = "Camera access is unavailable in this browser. Open Screen View in a browser that supports cameras."; return; }
      try {
        const selected = this.device.value;
        const cameras = (await navigator.mediaDevices.enumerateDevices()).filter(device => device.kind === "videoinput");
        this.device.replaceChildren(new Option("Default camera", ""));
        cameras.forEach((device, index) => this.device.add(new Option(device.label || `Camera ${index + 1}`, device.deviceId)));
        if (cameras.some(device => device.deviceId === selected)) this.device.value = selected;
      } catch { this.status.textContent = "Choose Start camera to allow camera access."; }
    }
    async start() {
      if (this.preview || this.mode !== "stream" || this.startButton.disabled) return;
      this.stop(); const generation = ++this.generation;
      this.startButton.disabled = true; this.status.textContent = "Waiting for camera permission…";
      try {
        const video = { width: { ideal: 1920 }, height: { ideal: 1080 }, frameRate: { ideal: 30, max: 30 } };
        if (this.device.value) video.deviceId = { exact: this.device.value };
        const stream = await navigator.mediaDevices.getUserMedia({ audio: false, video });
        if (generation !== this.generation || this.mode !== "stream") { stream.getTracks().forEach(track => track.stop()); return; }
        this.stream = stream; this.video.srcObject = stream; this.video.muted = true;
        this.video.classList.toggle("mirrored", this.mirror.checked);
        await this.video.play();
        if (generation !== this.generation) return;
        this.video.classList.remove("hidden"); this.stage.classList.add("camera-active"); this.stopButton.disabled = false;
        this.status.textContent = "Camera live. Admin receives one low-quality still about every two minutes. Camera audio is off.";
        stream.getVideoTracks().forEach(track => track.addEventListener("ended", () => this.stop("Camera disconnected. Choose a camera and start it again."), { once: true }));
        this.lastCaptureAt = 0; this.capture();
        this.captureTimer = window.setInterval(() => this.capture(), INTERVAL);
        this.panel.classList.add("hidden");
      } catch (error) {
        if (generation !== this.generation) return;
        this.stop(); this.panel.classList.remove("hidden");
        this.status.textContent = error.name === "NotAllowedError" ? "Camera permission was not granted. Allow camera access in the browser, then try again."
          : error.name === "NotFoundError" || error.name === "OverconstrainedError" ? "That camera is unavailable. Choose another camera and try again."
          : "The camera could not start. Check that it is connected and available, then try again.";
      } finally { if (generation === this.generation || !this.stream) this.startButton.disabled = false; }
    }
    stop(message = "Camera stopped.") {
      if (this.preview) return;
      this.generation++; window.clearInterval(this.captureTimer);
      const hadStream = Boolean(this.stream); const stream = this.stream; this.stream = null;
      stream?.getTracks().forEach(track => track.stop()); this.video.srcObject = null; this.video.classList.add("hidden");
      this.stage.classList.remove("camera-active"); this.stopButton.disabled = true; this.startButton.disabled = false;
      this.status.textContent = message;
      if (hadStream) this.send({ screenCameraPreview: true, active: false, image: "", capturedAt: Date.now(), mirrored: false });
    }
    capture() {
      if (!this.stream || !this.previewCode || this.video.readyState < 2 || Date.now() - this.lastCaptureAt < INTERVAL) return;
      const canvas = document.createElement("canvas"); canvas.width = 320; canvas.height = 180;
      const scale = Math.max(320 / this.video.videoWidth, 180 / this.video.videoHeight);
      canvas.getContext("2d").drawImage(this.video, (320 - this.video.videoWidth * scale) / 2, (180 - this.video.videoHeight * scale) / 2, this.video.videoWidth * scale, this.video.videoHeight * scale);
      const image = canvas.toDataURL("image/jpeg", .35);
      if (!validImage(image)) return;
      this.lastCaptureAt = Date.now();
      this.send({ screenCameraPreview: true, active: true, image, capturedAt: this.lastCaptureAt, mirrored: this.mirror.checked });
    }
    send(packet) {
      if (!this.previewCode) return;
      this.pending = { code: this.previewCode, packet }; this.flush();
    }
    async flush() {
      if (this.busy || !this.pending) return;
      window.clearTimeout(this.retryTimer);
      const next = this.pending; this.pending = null; this.busy = true;
      try { await Cloud.writeState({ sessionCode: next.code, role: "presenter", state: next.packet }); }
      catch { if (!this.pending) this.pending = next; this.failed = true; }
      finally {
        this.busy = false;
        if (this.pending) { const delay = this.failed ? Math.max(INTERVAL, Cloud.retryDelay()) : 0; this.failed = false; this.retryTimer = window.setTimeout(() => this.flush(), delay); }
      }
    }
  }
  class Preview {
    constructor(frame, note) {
      this.frame = frame; this.note = note; this.code = ""; this.key = ""; this.mode = "stage"; this.unsubscribe = () => {};
      this.packet = null; this.run = 0;
      frame.addEventListener("load", () => this.draw());
      window.setInterval(() => { this.caption(); }, 15000);
    }
    async setSession(code) {
      if (this.code === code) return;
      this.code = code; this.key = ""; this.packet = null; this.draw(); this.disconnect();
      const key = await Model.cameraPreviewCode(code);
      if (this.code !== code) return;
      this.key = key; this.connect();
    }
    setMode(mode) {
      if (this.mode === mode) return;
      this.mode = mode; this.note.hidden = mode !== "stream";
      this.disconnect(); this.connect(); this.draw();
    }
    disconnect() { this.run++; this.unsubscribe(); window.clearTimeout(this.timer); }
    connect() {
      if (this.mode !== "stream" || !this.key) return;
      const run = this.run, key = this.key;
      this.unsubscribe = Cloud.subscribe(key, change => { if (run === this.run) this.accept(change.state); });
      const poll = async () => {
        try { if (!document.hidden) { const packet = await Cloud.fetchPresenter(key); if (run === this.run) this.accept(packet); } } catch { /* Keep the last dated still during network loss. */ }
        if (run === this.run) this.timer = window.setTimeout(poll, Math.max(INTERVAL, Cloud.pollDelay(INTERVAL)));
      };
      poll();
    }
    accept(packet) {
      if (!validPacket(packet) || Number(packet.capturedAt) < Number(this.packet?.capturedAt || 0)) return;
      this.packet = packet; this.expired = false; this.draw();
    }
    draw() {
      const expired = !this.packet || Date.now() - Number(this.packet.capturedAt) > INTERVAL * 3;
      const packet = expired ? { screenCameraPreview: true, active: false, image: "", capturedAt: 0 } : this.packet;
      this.frame.contentWindow?.postMessage({ type: "bee-camera-still", packet }, location.origin);
      this.caption();
    }
    caption() {
      if (this.mode !== "stream") return;
      if (this.packet?.active && Date.now() - this.packet.capturedAt > INTERVAL * 3) {
        if (!this.expired) this.frame.contentWindow?.postMessage({ type: "bee-camera-still", packet: { screenCameraPreview: true, active: false, image: "", capturedAt: 0 } }, location.origin);
        this.expired = true; this.note.textContent = "Camera still expired · waiting for a new image."; return;
      }
      if (this.packet?.active) {
        const minutes = Math.max(0, Math.floor((Date.now() - this.packet.capturedAt) / 60000));
        this.note.textContent = `Camera still · ${minutes ? `${minutes} min ago` : "just captured"} · updates about every 2 minutes`;
      } else this.note.textContent = "Camera preview waiting · start the camera in Screen View. Stills update about every 2 minutes.";
    }
  }
  window.BeeCamera = { Stage, Preview, INTERVAL, validPacket };
})();

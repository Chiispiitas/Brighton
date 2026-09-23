"use strict";

(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));

  const palette = {
    red: "#d24a43",
    blue: "#3f70b7",
    green: "#4f8a52",
    brown: "#8a5d3b",
    purple: "#76559e",
    yellow: "#e7bb35",
    orange: "#dc7c36",
    pink: "#d9809c"
  };

  const defaults = {
    "part1-hotspots": {
      background: "../assets/part1_scene_matching_main---b632be08-ab3e-4b43-a183-b5a3d68ef8c4.png",
      exportBackground: "assets/part1_scene_matching_main---b632be08-ab3e-4b43-a183-b5a3d68ef8c4.png"
    },
    "part5-color": {
      background: "../assets/part5_colour_write_main---ef4753e4-8fd1-4c04-8251-50c8b6ada09e.png",
      exportBackground: "assets/part5_colour_write_main---ef4753e4-8fd1-4c04-8251-50c8b6ada09e.png"
    }
  };

  const el = {
    mode: $("#modeSelect"), stage: $("#stage"), layer: $("#itemsLayer"), bg: $("#backgroundImage"),
    bgInput: $("#backgroundInput"), bgName: $("#backgroundName"), loadDefaultBg: $("#loadDefaultBgBtn"),
    part1Tools: $("#part1Tools"), part5Tools: $("#part5Tools"), seed: $("#seedHotspotsBtn"),
    addHotspot: $("#addHotspotBtn"), cutoutInput: $("#cutoutInput"), addText: $("#addTextBtn"),
    inspector: $("#inspector"), emptyInspector: $("#emptyInspector"),
    propId: $("#propId"), propLabel: $("#propLabel"), propAnswer: $("#propAnswer"), propRole: $("#propRole"),
    propX: $("#propX"), propY: $("#propY"), propW: $("#propW"), propH: $("#propH"), propAsset: $("#propAsset"),
    assetRow: $("#assetRow"), colorRow: $("#colorRow"), previewPalette: $("#previewPalette"),
    duplicate: $("#duplicateBtn"), del: $("#deleteBtn"), output: $("#output"), importBox: $("#importBox"),
    importBtn: $("#importBtn"), copyStatus: $("#copyStatus"), modeBadge: $("#modeBadge"),
    copyCompact: $("#copyCompactBtn"), copyCompact2: $("#copyCompactBtn2"), copyPretty: $("#copyPrettyBtn")
  };

  let mode = "part1-hotspots";
  let items = [];
  let selectedId = null;
  let backgroundExport = defaults[mode].exportBackground;
  let backgroundObjectUrl = "";
  const assetUrls = new Map();
  const sourceImages = new Map();

  boot();

  function boot() {
    buildPalette();
    wire();
    setMode(mode, true);
  }

  function wire() {
    el.mode.addEventListener("change", () => setMode(el.mode.value));
    el.loadDefaultBg.addEventListener("click", loadDefaultBackground);
    el.bgInput.addEventListener("change", event => {
      const file = event.target.files?.[0];
      if (file) setLocalBackground(file);
      event.target.value = "";
    });
    el.bgName.addEventListener("input", () => { backgroundExport = el.bgName.value.trim(); updateOutput(); });

    el.seed.addEventListener("click", seedHotspots);
    el.addHotspot.addEventListener("click", () => addItem(newHotspot(nextHotspotLetter())));
    el.cutoutInput.addEventListener("change", importCutouts);
    el.addText.addEventListener("click", () => addItem({
      id: uniqueId("q24-text"), kind: "text", q: 24, label: "Q24 text field", role: "answer",
      x: 42, y: 34, w: 18, h: 7, asset: "", previewColor: ""
    }));

    [el.propId, el.propLabel, el.propAnswer, el.propRole, el.propX, el.propY, el.propW, el.propH, el.propAsset]
      .forEach(input => input.addEventListener("input", applyInspector));
    el.propRole.addEventListener("change", applyInspector);

    el.duplicate.addEventListener("click", duplicateSelected);
    el.del.addEventListener("click", deleteSelected);

    el.importBtn.addEventListener("click", importLayout);
    el.copyCompact.addEventListener("click", () => copyText(JSON.stringify(exportObject())));
    el.copyCompact2.addEventListener("click", () => copyText(JSON.stringify(exportObject())));
    el.copyPretty.addEventListener("click", () => copyText(JSON.stringify(exportObject(), null, 2)));

    el.stage.addEventListener("pointerdown", event => {
      if (event.target === el.stage || event.target === el.layer) select(null);
    });

    window.addEventListener("resize", render);
  }

  function setMode(next, first = false) {
    if (!first && items.length && !confirm("Switch modes and clear the current layout?")) {
      el.mode.value = mode;
      return;
    }
    mode = next;
    items = [];
    selectedId = null;
    backgroundExport = defaults[mode].exportBackground;
    el.part1Tools.classList.toggle("hidden", mode !== "part1-hotspots");
    el.part5Tools.classList.toggle("hidden", mode !== "part5-color");
    el.modeBadge.textContent = mode === "part1-hotspots" ? "Part 1 hotspots" : "Part 5 cutouts + text";
    loadDefaultBackground();
    render();
  }

  function loadDefaultBackground() {
    revokeBackground();
    el.bg.src = defaults[mode].background;
    backgroundExport = defaults[mode].exportBackground;
    el.bgName.value = backgroundExport;
    updateOutput();
  }

  function setLocalBackground(file) {
    revokeBackground();
    backgroundObjectUrl = URL.createObjectURL(file);
    el.bg.src = backgroundObjectUrl;
    backgroundExport = file.name;
    el.bgName.value = file.name;
    updateOutput();
  }

  function revokeBackground() {
    if (backgroundObjectUrl) URL.revokeObjectURL(backgroundObjectUrl);
    backgroundObjectUrl = "";
  }

  function seedHotspots() {
    items = [];
    const letters = "ABCDEFGH".split("");
    letters.forEach((letter, index) => {
      const col = index % 4;
      const row = Math.floor(index / 4);
      items.push({
        id: letter, kind: "hotspot", answer: letter, label: letter,
        role: letter === "H" ? "example" : "answer",
        x: 8 + col * 22, y: 8 + row * 14, w: 7, h: 9, asset: "", previewColor: ""
      });
    });
    select("A");
    render();
  }

  function newHotspot(letter) {
    return {
      id: uniqueId(letter || "hotspot"), kind: "hotspot", answer: letter || "", label: letter || "?", role: "answer",
      x: 43, y: 43, w: 7, h: 9, asset: "", previewColor: ""
    };
  }

  function nextHotspotLetter() {
    const used = new Set(items.filter(x => x.kind === "hotspot").map(x => x.answer));
    return "ABCDEFGH".split("").find(x => !used.has(x)) || "";
  }

  async function importCutouts(event) {
    const files = Array.from(event.target.files || []);
    for (const file of files) {
      const url = URL.createObjectURL(file);
      assetUrls.set(file.name, url);
      const image = await loadImage(url);
      sourceImages.set(file.name, image);
      const idBase = file.name.replace(/\.[^.]+$/, "").replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "").toLowerCase();
      const item = {
        id: uniqueId(idBase || "cutout"), kind: "cutout", q: guessQuestion(file.name),
        label: file.name.replace(/\.[^.]+$/, ""), role: "answer",
        x: 38, y: 38, w: 15, h: 15, asset: file.name, previewColor: "red"
      };
      items.push(item);
      selectedId = item.id;
    }
    event.target.value = "";
    render();
  }

  function guessQuestion(name) {
    const m = name.match(/(?:q|question)[-_ ]?(21|22|23|25)/i) || name.match(/\b(21|22|23|25)\b/);
    return m ? Number(m[1]) : 21;
  }

  function uniqueId(base) {
    let id = base || "item";
    let n = 2;
    while (items.some(item => item.id === id)) id = `${base}-${n++}`;
    return id;
  }

  function addItem(item) {
    items.push(item);
    selectedId = item.id;
    render();
  }

  function selected() {
    return items.find(item => item.id === selectedId) || null;
  }

  function select(id) {
    selectedId = id;
    render();
  }

  function render() {
    el.layer.innerHTML = "";
    for (const item of items) {
      const node = document.createElement("div");
      node.className = `editor-item ${item.kind === "text" ? "text-field" : item.kind} ${item.role === "example" ? "example" : ""} ${item.id === selectedId ? "selected" : ""}`;
      node.dataset.id = item.id;
      setRect(node, item);

      if (item.kind === "hotspot") {
        node.textContent = item.label || item.answer || item.id;
      } else if (item.kind === "text") {
        node.textContent = item.label || "Text field";
      } else if (item.kind === "cutout") {
        const canvas = document.createElement("canvas");
        node.appendChild(canvas);
        renderCutout(canvas, item);
      }

      const handle = document.createElement("span");
      handle.className = "resize-handle";
      node.appendChild(handle);
      wireItemPointer(node, handle, item);
      node.addEventListener("click", event => {
        event.stopPropagation();
        selectedId = item.id;
        renderInspector();
        $$(".editor-item", el.layer).forEach(n => n.classList.toggle("selected", n.dataset.id === selectedId));
      });
      el.layer.appendChild(node);
    }

    renderInspector();
    updateOutput();
  }

  function setRect(node, item) {
    node.style.left = item.x + "%";
    node.style.top = item.y + "%";
    node.style.width = item.w + "%";
    node.style.height = item.h + "%";
  }

  function wireItemPointer(node, handle, item) {
    node.addEventListener("pointerdown", event => {
      event.preventDefault();
      event.stopPropagation();
      selectedId = item.id;
      const resizing = event.target === handle;
      node.setPointerCapture(event.pointerId);
      const rect = el.stage.getBoundingClientRect();
      const start = { cx: event.clientX, cy: event.clientY, x: item.x, y: item.y, w: item.w, h: item.h };

      const move = ev => {
        const dx = (ev.clientX - start.cx) / rect.width * 100;
        const dy = (ev.clientY - start.cy) / rect.height * 100;
        if (resizing) {
          item.w = clamp(start.w + dx, 1.5, 100 - item.x);
          item.h = clamp(start.h + dy, 1.5, 100 - item.y);
        } else {
          item.x = clamp(start.x + dx, 0, 100 - item.w);
          item.y = clamp(start.y + dy, 0, 100 - item.h);
        }
        roundItem(item);
        setRect(node, item);
        renderInspector(false);
        updateOutput();
      };
      const up = () => {
        node.removeEventListener("pointermove", move);
        node.removeEventListener("pointerup", up);
        node.removeEventListener("pointercancel", up);
        render();
      };
      node.addEventListener("pointermove", move);
      node.addEventListener("pointerup", up);
      node.addEventListener("pointercancel", up);
      renderInspector();
    });
  }

  function roundItem(item) {
    ["x","y","w","h"].forEach(key => item[key] = Math.round(item[key] * 100) / 100);
  }

  function renderInspector(overwrite = true) {
    const item = selected();
    el.emptyInspector.classList.toggle("hidden", !!item);
    el.inspector.classList.toggle("hidden", !item);
    if (!item || !overwrite) {
      if (item && !overwrite) {
        el.propX.value = item.x; el.propY.value = item.y; el.propW.value = item.w; el.propH.value = item.h;
      }
      return;
    }
    el.propId.value = item.id || "";
    el.propLabel.value = item.label || "";
    el.propAnswer.value = item.kind === "hotspot" ? (item.answer || "") : (item.q ?? "");
    el.propRole.value = item.role || "answer";
    el.propX.value = item.x; el.propY.value = item.y; el.propW.value = item.w; el.propH.value = item.h;
    el.propAsset.value = item.asset || "";
    el.assetRow.classList.toggle("hidden", item.kind !== "cutout");
    el.colorRow.classList.toggle("hidden", item.kind !== "cutout");
    $$(".swatch", el.previewPalette).forEach(sw => sw.classList.toggle("active", sw.dataset.color === item.previewColor));
  }

  function applyInspector() {
    const item = selected();
    if (!item) return;
    const oldId = item.id;
    item.id = el.propId.value.trim() || oldId;
    item.label = el.propLabel.value;
    if (item.kind === "hotspot") item.answer = el.propAnswer.value.trim();
    else item.q = Number(el.propAnswer.value) || 0;
    item.role = el.propRole.value;
    item.x = clamp(Number(el.propX.value) || 0, 0, 99);
    item.y = clamp(Number(el.propY.value) || 0, 0, 99);
    item.w = clamp(Number(el.propW.value) || 1.5, 1.5, 100 - item.x);
    item.h = clamp(Number(el.propH.value) || 1.5, 1.5, 100 - item.y);
    if (item.kind === "cutout") item.asset = el.propAsset.value.trim();
    roundItem(item);
    selectedId = item.id;
    render();
  }

  function duplicateSelected() {
    const item = selected();
    if (!item) return;
    const copy = { ...item, id: uniqueId(item.id + "-copy"), x: clamp(item.x + 2, 0, 100 - item.w), y: clamp(item.y + 2, 0, 100 - item.h) };
    items.push(copy);
    selectedId = copy.id;
    render();
  }

  function deleteSelected() {
    if (!selectedId) return;
    items = items.filter(item => item.id !== selectedId);
    selectedId = null;
    render();
  }

  function buildPalette() {
    for (const [name, hex] of Object.entries(palette)) {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "swatch";
      b.dataset.color = name;
      b.title = name;
      b.style.background = hex;
      b.addEventListener("click", () => {
        const item = selected();
        if (!item || item.kind !== "cutout") return;
        item.previewColor = name;
        render();
      });
      el.previewPalette.appendChild(b);
    }
  }

  async function renderCutout(canvas, item) {
    const src = assetUrls.get(item.asset);
    const image = sourceImages.get(item.asset) || (src ? await loadImage(src) : null);
    if (!image) {
      canvas.width = 400; canvas.height = 300;
      const ctx = canvas.getContext("2d");
      ctx.fillStyle = "#f2f4f7"; ctx.fillRect(0,0,400,300);
      ctx.fillStyle = "#667085"; ctx.font = "22px sans-serif"; ctx.textAlign = "center";
      ctx.fillText(item.asset || "Re-import cutout", 200, 150);
      return;
    }
    tintImageToCanvas(canvas, image, palette[item.previewColor] || null);
  }

  function tintImageToCanvas(canvas, image, hex) {
    canvas.width = image.naturalWidth || image.width;
    canvas.height = image.naturalHeight || image.height;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    ctx.clearRect(0,0,canvas.width,canvas.height);
    ctx.drawImage(image,0,0);
    if (!hex) return;
    const rgb = hexToRgb(hex);
    const img = ctx.getImageData(0,0,canvas.width,canvas.height);
    const d = img.data;
    for (let i=0;i<d.length;i+=4) {
      if (d[i+3] < 5) continue;
      const lum = 0.299*d[i] + 0.587*d[i+1] + 0.114*d[i+2];
      if (lum < 92) continue;
      const shade = 0.58 + 0.42 * (lum / 255);
      d[i] = Math.round(rgb.r * shade);
      d[i+1] = Math.round(rgb.g * shade);
      d[i+2] = Math.round(rgb.b * shade);
    }
    ctx.putImageData(img,0,0);
  }

  function loadImage(src) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = src;
    });
  }

  function hexToRgb(hex) {
    const n = parseInt(hex.replace("#",""),16);
    return { r:(n>>16)&255, g:(n>>8)&255, b:n&255 };
  }

  function exportObject() {
    return {
      schema: "brighton-a1-listening-layout",
      version: 1,
      mode,
      canvas: { width: 1600, height: 1200, aspect: "4:3", background: backgroundExport },
      palette: mode === "part5-color" ? palette : undefined,
      elements: items.map(item => {
        const base = {
          id: item.id, kind: item.kind, x: item.x, y: item.y, w: item.w, h: item.h,
          label: item.label || "", role: item.role || "answer"
        };
        if (item.kind === "hotspot") base.answer = item.answer || "";
        if (item.kind === "cutout") { base.q = Number(item.q) || 0; base.asset = item.asset || ""; }
        if (item.kind === "text") { base.q = Number(item.q) || 24; base.placeholder = "Type one word"; }
        return base;
      })
    };
  }

  function updateOutput() {
    el.output.value = JSON.stringify(exportObject(), null, 2);
  }

  function importLayout() {
    try {
      const parsed = JSON.parse(el.importBox.value.trim());
      if (parsed.schema !== "brighton-a1-listening-layout") throw new Error("Not an A1 Listening layout string.");
      mode = parsed.mode;
      el.mode.value = mode;
      items = (parsed.elements || []).map(item => ({ ...item, previewColor: item.previewColor || "red" }));
      selectedId = items[0]?.id || null;
      backgroundExport = parsed.canvas?.background || defaults[mode]?.exportBackground || "";
      el.bgName.value = backgroundExport;
      el.part1Tools.classList.toggle("hidden", mode !== "part1-hotspots");
      el.part5Tools.classList.toggle("hidden", mode !== "part5-color");
      el.modeBadge.textContent = mode === "part1-hotspots" ? "Part 1 hotspots" : "Part 5 cutouts + text";
      const localDefault = Object.values(defaults).find(d => d.exportBackground === backgroundExport);
      el.bg.src = localDefault?.background || backgroundExport;
      render();
      status("Layout loaded.");
    } catch (error) {
      status(error.message, true);
    }
  }

  async function copyText(value) {
    try {
      await navigator.clipboard.writeText(value);
      status("Copied. Paste this string back into ChatGPT.");
    } catch {
      el.output.value = value;
      el.output.select();
      document.execCommand("copy");
      status("Copied.");
    }
  }

  function status(message, error = false) {
    el.copyStatus.textContent = message;
    el.copyStatus.style.color = error ? "#b42318" : "#00a9a5";
    clearTimeout(status.timer);
    status.timer = setTimeout(() => el.copyStatus.textContent = "", 3500);
  }

  function clamp(value, min, max) { return Math.min(max, Math.max(min, value)); }
})();

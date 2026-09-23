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

  const part1People = [
    { name: "Leo", answer: "C" },
    { name: "Ana", answer: "D" },
    { name: "Diego", answer: "E" },
    { name: "Sofia", answer: "F" },
    { name: "Carlos", answer: "G" }
  ];

  const defaults = {
    "part1-cutouts": {
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
    part1Tools: $("#part1Tools"), part5Tools: $("#part5Tools"), seedPart1: $("#seedPart1Btn"),
    part1CutoutInput: $("#part1CutoutInput"), cutoutInput: $("#cutoutInput"), addText: $("#addTextBtn"),
    inspector: $("#inspector"), emptyInspector: $("#emptyInspector"),
    propId: $("#propId"), propLabel: $("#propLabel"), propAnswer: $("#propAnswer"), propRole: $("#propRole"),
    propX: $("#propX"), propY: $("#propY"), propW: $("#propW"), propH: $("#propH"), propAsset: $("#propAsset"),
    assetRow: $("#assetRow"), variantRow: $("#variantRow"), variantSummary: $("#variantSummary"),
    colorRow: $("#colorRow"), previewPalette: $("#previewPalette"),
    duplicate: $("#duplicateBtn"), del: $("#deleteBtn"), output: $("#output"), importBox: $("#importBox"),
    importBtn: $("#importBtn"), copyStatus: $("#copyStatus"), modeBadge: $("#modeBadge"),
    copyCompact: $("#copyCompactBtn"), copyCompact2: $("#copyCompactBtn2"), copyPretty: $("#copyPrettyBtn")
  };

  let mode = "part1-cutouts";
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

    el.seedPart1.addEventListener("click", seedPart1Slots);
    el.part1CutoutInput.addEventListener("change", importPart1Cutouts);
    el.cutoutInput.addEventListener("change", importPart5Cutouts);
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
    el.part1Tools.classList.toggle("hidden", mode !== "part1-cutouts");
    el.part5Tools.classList.toggle("hidden", mode !== "part5-color");
    el.modeBadge.textContent = mode === "part1-cutouts" ? "Part 1 person cutouts" : "Part 5 cutouts + text";
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

  function seedPart1Slots() {
    items = part1People.map((person, index) => ({
      id: person.name.toLowerCase(),
      kind: "person-cutout",
      answer: person.answer,
      label: person.name,
      role: "answer",
      x: 8 + (index % 3) * 27,
      y: 10 + Math.floor(index / 3) * 34,
      w: 16,
      h: 28,
      asset: "",
      previewColor: ""
    }));
    selectedId = items[0]?.id || null;
    render();
  }

  async function importPart1Cutouts(event) {
    const files = Array.from(event.target.files || []);
    if (!items.some(item => item.kind === "person-cutout")) seedPart1Slots();

    let imported = 0;
    for (const file of files) {
      if (imported >= 5) break;
      const person = identifyPart1Person(file.name) || nextUnassignedPart1Person();
      if (!person) break;

      const url = URL.createObjectURL(file);
      assetUrls.set(file.name, url);
      const image = await loadImage(url);
      sourceImages.set(file.name, image);

      let item = items.find(entry => entry.kind === "person-cutout" && entry.answer === person.answer);
      if (!item) {
        item = {
          id: uniqueId(person.name.toLowerCase()), kind: "person-cutout", answer: person.answer,
          label: person.name, role: "answer", x: 38, y: 38, w: 16, h: 28, asset: "", previewColor: ""
        };
        items.push(item);
      }
      item.label = person.name;
      item.answer = person.answer;
      item.asset = file.name;
      item.previewColor = "";
      selectedId = item.id;
      imported++;
    }

    if (files.length > imported) status("Only five scored Part 1 people are supported; extra files were ignored.", true);
    event.target.value = "";
    render();
  }

  function identifyPart1Person(fileName) {
    const normalized = String(fileName).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    return part1People.find(person => normalized.includes(person.name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, ""))) || null;
  }

  function nextUnassignedPart1Person() {
    const assigned = new Set(items.filter(item => item.kind === "person-cutout" && item.asset).map(item => item.answer));
    return part1People.find(person => !assigned.has(person.answer)) || null;
  }

  async function importPart5Cutouts(event) {
    const files = Array.from(event.target.files || []);
    let imported = 0;
    let ignored = 0;

    for (const file of files) {
      const meta = identifyPart5Variant(file.name);
      if (!meta) {
        ignored++;
        continue;
      }

      const url = URL.createObjectURL(file);
      assetUrls.set(file.name, url);
      const image = await loadImage(url);
      sourceImages.set(file.name, image);

      let item = meta.role === "example"
        ? items.find(entry => entry.kind === "cutout" && entry.role === "example")
        : items.find(entry => entry.kind === "cutout" && Number(entry.q) === meta.q && entry.role !== "example");

      if (!item) {
        item = {
          id: meta.role === "example" ? "example-hat" : `q${meta.q}-${meta.object}`,
          kind: "cutout",
          q: meta.q,
          label: meta.label,
          role: meta.role,
          x: 38,
          y: 38,
          w: 15,
          h: 15,
          asset: "",
          variants: {},
          color: meta.role === "example" ? "yellow" : "",
          previewColor: meta.color === "base" ? "" : meta.color
        };
        items.push(item);
      }

      item.variants = { ...(item.variants || {}) };
      if (meta.color === "base") {
        item.asset = file.name;
      } else {
        item.variants[meta.color] = file.name;
        if (!item.previewColor) item.previewColor = meta.color;
      }
      item.label = meta.label;
      selectedId = item.id;
      imported++;
    }

    if (ignored) status(`${ignored} file(s) ignored because the question/object/colour could not be detected.`, true);
    else if (imported) status(`${imported} colour-variation file(s) imported.`);
    event.target.value = "";
    render();
  }

  function identifyPart5Variant(fileName) {
    const normalized = String(fileName)
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/\.[^.]+$/, "");

    const colorNames = ["red","blue","green","brown","purple","yellow","orange","pink","base"];
    const color = colorNames.find(name => new RegExp(`(?:^|[_\\- .])${name}(?:$|[_\\- .])`).test(normalized));
    if (!color) return null;

    if (normalized.includes("example") && normalized.includes("hat")) {
      return { q: 0, object: "hat", label: "Example hat", role: "example", color };
    }

    const rules = [
      { q: 21, object: "jacket", label: "Woman's jacket", words: ["q21","question21","jacket"] },
      { q: 22, object: "backpack", label: "Backpack next to the bench", words: ["q22","question22","backpack"] },
      { q: 23, object: "bicycle", label: "Bicycle next to the tree", words: ["q23","question23","bicycle","bike"] },
      { q: 25, object: "umbrella", label: "Umbrella near the bus stop", words: ["q25","question25","umbrella"] }
    ];
    const rule = rules.find(entry => entry.words.some(word => normalized.includes(word)));
    return rule ? { ...rule, role: "answer", color } : null;
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

      if (item.kind === "text") {
        node.textContent = item.label || "Text field";
      } else if (item.kind === "cutout" || item.kind === "person-cutout") {
        const canvas = document.createElement("canvas");
        node.appendChild(canvas);
        renderCutout(canvas, item);
        if (item.kind === "person-cutout") {
          const tag = document.createElement("span");
          tag.className = "person-cutout-tag";
          tag.textContent = item.label || item.answer || "";
          node.appendChild(tag);
        }
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
    el.propAnswer.value = item.kind === "person-cutout" ? (item.answer || "") : (item.q ?? "");
    el.propRole.value = item.role || "answer";
    el.propX.value = item.x; el.propY.value = item.y; el.propW.value = item.w; el.propH.value = item.h;
    el.propAsset.value = item.asset || "";
    el.assetRow.classList.toggle("hidden", item.kind !== "cutout" && item.kind !== "person-cutout");
    const part5Cutout = item.kind === "cutout" && mode === "part5-color";
    el.variantRow.classList.toggle("hidden", !part5Cutout);
    el.colorRow.classList.toggle("hidden", !part5Cutout);
    if (part5Cutout) {
      const variants = item.variants || {};
      const parts = [];
      if (item.asset) parts.push(`base: ${item.asset}`);
      Object.keys(palette).forEach(name => {
        if (variants[name]) parts.push(`${name}: ${variants[name]}`);
      });
      el.variantSummary.textContent = parts.length ? parts.join(" · ") : "No variants imported yet.";
      $(".swatch", el.previewPalette).forEach(sw => {
        const available = Boolean(variants[sw.dataset.color]);
        sw.disabled = !available;
        sw.classList.toggle("unavailable", !available);
        sw.classList.toggle("active", sw.dataset.color === item.previewColor);
      });
    } else {
      el.variantSummary.textContent = "";
      $(".swatch", el.previewPalette).forEach(sw => {
        sw.disabled = false;
        sw.classList.remove("unavailable", "active");
      });
    }
  }

  function applyInspector() {
    const item = selected();
    if (!item) return;
    const oldId = item.id;
    item.id = el.propId.value.trim() || oldId;
    item.label = el.propLabel.value;
    if (item.kind === "person-cutout") item.answer = el.propAnswer.value.trim();
    else item.q = Number(el.propAnswer.value) || 0;
    item.role = el.propRole.value;
    item.x = clamp(Number(el.propX.value) || 0, 0, 99);
    item.y = clamp(Number(el.propY.value) || 0, 0, 99);
    item.w = clamp(Number(el.propW.value) || 1.5, 1.5, 100 - item.x);
    item.h = clamp(Number(el.propH.value) || 1.5, 1.5, 100 - item.y);
    if (item.kind === "cutout" || item.kind === "person-cutout") item.asset = el.propAsset.value.trim();
    roundItem(item);
    selectedId = item.id;
    render();
  }

  function duplicateSelected() {
    const item = selected();
    if (!item) return;
    const copy = {
      ...item,
      variants: item.variants ? { ...item.variants } : undefined,
      id: uniqueId(item.id + "-copy"),
      x: clamp(item.x + 2, 0, 100 - item.w),
      y: clamp(item.y + 2, 0, 100 - item.h)
    };
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
        if (!item || item.kind !== "cutout" || !item.variants?.[name]) return;
        item.previewColor = name;
        render();
      });
      el.previewPalette.appendChild(b);
    }
  }

  async function renderCutout(canvas, item) {
    const variantAsset = item.kind === "cutout" && item.previewColor
      ? item.variants?.[item.previewColor]
      : "";
    const asset = variantAsset || item.asset || Object.values(item.variants || {})[0] || "";
    const src = assetUrls.get(asset);
    const image = sourceImages.get(asset) || (src ? await loadImage(src) : null);

    canvas.width = image?.naturalWidth || image?.width || 400;
    canvas.height = image?.naturalHeight || image?.height || 300;
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0,0,canvas.width,canvas.height);

    if (image) {
      ctx.drawImage(image,0,0);
      return;
    }

    ctx.fillStyle = "#f2f4f7";
    ctx.fillRect(0,0,canvas.width,canvas.height);
    ctx.fillStyle = "#667085";
    ctx.font = "20px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(asset || "Import cutout variant", canvas.width / 2, canvas.height / 2);
  }

  function loadImage(src) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = src;
    });
  }

  function exportObject() {
    return {
      schema: "brighton-a1-listening-layout",
      version: 2,
      mode,
      canvas: { width: 1600, height: 1200, aspect: "4:3", background: backgroundExport },
      palette: mode === "part5-color" ? palette : undefined,
      elements: items.map(item => {
        const base = {
          id: item.id, kind: item.kind, x: item.x, y: item.y, w: item.w, h: item.h,
          label: item.label || "", role: item.role || "answer"
        };
        if (item.kind === "person-cutout") { base.answer = item.answer || ""; base.asset = item.asset || ""; }
        if (item.kind === "cutout") {
          base.q = Number(item.q) || 0;
          base.asset = item.asset || "";
          base.variants = { ...(item.variants || {}) };
          if (item.role === "example") base.color = item.color || "yellow";
        }
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
      mode = parsed.mode === "part1-hotspots" ? "part1-cutouts" : parsed.mode;
      el.mode.value = mode;
      items = (parsed.elements || []).map(item => ({
        ...item,
        variants: item.variants ? { ...item.variants } : {},
        previewColor: item.previewColor || Object.keys(item.variants || {})[0] || ""
      }));
      selectedId = items[0]?.id || null;
      backgroundExport = parsed.canvas?.background || defaults[mode]?.exportBackground || "";
      el.bgName.value = backgroundExport;
      el.part1Tools.classList.toggle("hidden", mode !== "part1-cutouts");
      el.part5Tools.classList.toggle("hidden", mode !== "part5-color");
      el.modeBadge.textContent = mode === "part1-cutouts" ? "Part 1 person cutouts" : "Part 5 cutouts + text";
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

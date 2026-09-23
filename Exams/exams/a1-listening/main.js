"use strict";
/* ==============================================
     Brighton English School
     Made by: David Santana
============================================== */

(() => {
  const exam = window.listeningExam;
  const examParts = exam.parts || [];
  const visualLayouts = window.A1ListeningVisualLayouts || {};
  const STORAGE_KEY = "brighton-a1-listening-exam-state-v1";
  const App = window.BrightonApp || {};
  const $ = App.$ || ((selector, root = document) => root.querySelector(selector));
  const $$ = App.$$ || ((selector, root = document) => Array.from(root.querySelectorAll(selector)));

  const dom = {
    startScreen: $("#startScreen"),
    examShell: $("#examShell"),
    studentForm: $("#studentForm"),
    continueSavedBtn: $("#continueSavedBtn"),
    studentName: $("#studentName"),
    classId: $("#classId"),
    headerStudent: $("#headerStudent"),
    headerClass: $("#headerClass"),
    audioBadge: $("#audioBadge"),
    mainContent: $("#mainContent"),
    bottomNav: $("#bottomNav"),
    backBtn: $("#backBtn"),
    nextBtn: $("#nextBtn"),
    flagBtn: $("#flagBtn"),
    notesBtn: $("#notesBtn"),
    menuBtn: $("#menuBtn"),
    sideMenu: $("#sideMenu"),
    closeMenuBtn: $("#closeMenuBtn"),
    closeMenuOptionBtn: $("#closeMenuOptionBtn"),
    overviewBtn: $("#overviewBtn"),
    submitMenuBtn: $("#submitMenuBtn"),
    resetBtn: $("#resetBtn"),
    audioGate: $("#audioGate"),
    playAudioBtn: $("#playAudioBtn"),
    audioGateError: $("#audioGateError"),
    examAudio: $("#examAudio"),
    modalRoot: $("#modalRoot"),
    toast: $("#toast")
  };

  let state = loadState() || createDefaultState();
  let saveTimer = null;
  let liveProgress = null;
  let openColorPaletteQ = null;

  boot();

  /* ----------------------------------------------
   BOOT
  ---------------------------------------------- */
  function boot() {
    if (state.student.name) {
      state.student.classId = normalizeClassCode(state.student.classId);
      dom.continueSavedBtn.classList.remove("hidden");
      dom.studentName.value = state.student.name;
      dom.classId.value = state.student.classId;
    }

    dom.studentForm.addEventListener("submit", event => {
      event.preventDefault();
      startExam(dom.studentName.value.trim(), dom.classId.value.trim());
    });

    dom.continueSavedBtn.addEventListener("click", () => {
      if (state.student.name) showExam({ needsAudioGate: !state.audio.startedThisSession });
    });

    dom.playAudioBtn.addEventListener("click", playAudioAndEnter);
    dom.examAudio.addEventListener("play", () => updateAudioBadge("Audio is playing"));
    dom.examAudio.addEventListener("ended", () => updateAudioBadge("Audio finished"));
    dom.examAudio.addEventListener("error", () => updateAudioBadge("Audio file not found"));

    dom.backBtn.addEventListener("click", goPrevious);
    dom.nextBtn.addEventListener("click", () => {
      if (isFinalQuestion()) showFinishScreen();
      else goNext();
    });

    dom.flagBtn.addEventListener("click", toggleFlag);
    dom.notesBtn.addEventListener("click", openNotes);
    dom.menuBtn.addEventListener("click", openMenu);
    dom.closeMenuBtn.addEventListener("click", closeMenu);
    dom.closeMenuOptionBtn.addEventListener("click", closeMenu);
    dom.overviewBtn.addEventListener("click", () => { closeMenu(); openOverview(); });
    if (dom.submitMenuBtn) dom.submitMenuBtn.addEventListener("click", requestSubmitFromMenu);
    dom.resetBtn.addEventListener("click", resetTest);

    dom.mainContent.addEventListener("scroll", debounce(() => {
      state.scroll[state.current.partId] = dom.mainContent.scrollTop;
      saveState();
    }, 200));

    document.addEventListener("keydown", event => {
      if (dom.examShell.classList.contains("hidden")) return;
      const tag = document.activeElement?.tagName?.toLowerCase();
      const isTyping = tag === "input" || tag === "textarea" || tag === "select";
      if (event.key === "Escape") {
        closeModal();
        closeMenu();
        return;
      }
      if (!isTyping && event.key === "ArrowLeft") {
        event.preventDefault();
        goPrevious();
      }
      if (!isTyping && event.key === "ArrowRight") {
        event.preventDefault();
        if (isFinalQuestion()) showFinishScreen();
        else goNext();
      }
    });

    if (state.student.name) showExam({ needsAudioGate: !state.audio.startedThisSession });
  }

  /* ----------------------------------------------
   START EXAM
  ---------------------------------------------- */
  function startExam(name, classId) {
    const normalizedClassId = normalizeClassCode(classId);
    if (!name || !normalizedClassId) return;
    state.student.name = name;
    state.student.classId = normalizedClassId;
    dom.classId.value = normalizedClassId;
    if (!state.student.startedAt) state.student.startedAt = new Date().toISOString();
    saveStateNow();
    showExam({ needsAudioGate: true });
  }

  /* ----------------------------------------------
   SHOW EXAM
  ---------------------------------------------- */
  function showExam({ needsAudioGate = false } = {}) {
    dom.startScreen.classList.add("hidden");
    dom.examShell.classList.remove("hidden");
    renderApp({ restoreScroll: true });
    startLiveProgress();
    if (needsAudioGate) openAudioGate();
  }

  /* ----------------------------------------------
   AUDIO GATE
  ---------------------------------------------- */
  function openAudioGate() {
    dom.audioGate.classList.remove("hidden");
    dom.audioGate.setAttribute("aria-hidden", "false");
    dom.audioGateError.classList.add("hidden");
    setTimeout(() => dom.playAudioBtn.focus(), 50);
  }

  async function playAudioAndEnter() {
    dom.audioGateError.classList.add("hidden");
    try {
      await dom.examAudio.play();
      state.audio.started = true;
      state.audio.startedThisSession = true;
      state.audio.startedAt = state.audio.startedAt || new Date().toISOString();
      saveStateNow();
      dom.audioGate.classList.add("hidden");
      dom.audioGate.setAttribute("aria-hidden", "true");
      updateAudioBadge("Audio is playing");
    } catch (error) {
      dom.audioGateError.textContent = "The audio could not start. Check that exams/a1-listening/audio.mp3 exists, then try again.";
      dom.audioGateError.classList.remove("hidden");
      updateAudioBadge("Audio error");
      console.error(error);
    }
  }

  /* ----------------------------------------------
   STATE
  ---------------------------------------------- */
  function createDefaultState() {
    const answers = {};
    examParts.forEach(part => {
      answers[part.id] = {};
      part.items.forEach(item => { answers[part.id][item.q] = ""; });
    });
    return {
      version: 1,
      student: { name: "", classId: "", startedAt: "" },
      audio: { started: false, startedThisSession: false, startedAt: "" },
      current: { partId: examParts[0]?.id || "part1", itemIndex: 0 },
      answers,
      flagged: {},
      notes: "",
      scroll: {},
      submitted: false,
      submittedAt: ""
    };
  }

  function loadState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      const fresh = createDefaultState();
      return mergeState(fresh, parsed);
    } catch (error) {
      console.warn("Could not load saved listening state", error);
      return null;
    }
  }

  function mergeState(base, saved) {
    const merged = { ...base, ...saved };
    merged.student = { ...base.student, ...(saved.student || {}) };
    merged.audio = { ...base.audio, ...(saved.audio || {}), startedThisSession: false };
    merged.current = { ...base.current, ...(saved.current || {}) };
    merged.answers = base.answers;
    Object.keys(saved.answers || {}).forEach(partId => {
      merged.answers[partId] = { ...(base.answers[partId] || {}), ...(saved.answers[partId] || {}) };
    });
    merged.flagged = { ...base.flagged, ...(saved.flagged || {}) };
    merged.scroll = { ...base.scroll, ...(saved.scroll || {}) };
    return merged;
  }

  function saveState() {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(saveStateNow, 40);
  }

  function saveStateNow() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }

  /* ----------------------------------------------
   RENDER
  ---------------------------------------------- */
  function renderApp(options = {}) {
    ensureValidCurrent();
    updateHeader();
    renderMain(options);
    renderBottomNav();
    renderStepControls();
    saveState();
  }

  function renderMain(options = {}) {
    const part = getCurrentPart();
    if (!part) {
      dom.mainContent.innerHTML = `<section class="exam-panel"><p>No exam data found.</p></section>`;
      return;
    }
    let content = "";
    if (part.type === "visualMultiple") content = renderVisualPart(part);
    if (part.type === "multiple") content = renderMultiplePart(part);
    if (part.type === "gap") content = renderGapPart(part);
    if (part.type === "matching") content = renderMatchingPart(part);
    if (part.type === "pictureAction") content = renderPictureActionPart(part);
    dom.mainContent.innerHTML = `${content}${renderEndSubmitCard()}`;
    attachMainHandlers(part);
    hydrateInteractiveCutouts(part);
    bindEndSubmitCard();
    if (options.restoreScroll) {
      requestAnimationFrame(() => { dom.mainContent.scrollTop = state.scroll[part.id] || 0; });
    } else {
      requestAnimationFrame(scrollActiveCardIntoView);
    }
  }

  function renderVisualPart(part) {
    const activeQ = getCurrentQuestionNumber();
    const item = part.items.find(entry => entry.q === activeQ) || part.items[0];
    const selected = getAnswer(part.id, item.q);
    const options = Object.entries(item.options).map(([letter, option]) => {
      const picture = option.image
        ? `<img class="visual-option-image" src="${escapeAttr(option.image)}" alt="${escapeAttr(option.alt || option.label || `Picture ${letter}`)}" loading="eager" />`
        : `<div class="visual-placeholder">${escapeHtml(option.placeholder || `Picture ${letter}`)}</div>`;

      return `
        <label class="visual-option-card ${selected === letter ? "selected" : ""}">
          <input type="radio" name="q${item.q}" value="${letter}" ${selected === letter ? "checked" : ""} />
          <div class="visual-picture-frame">${picture}</div>
          <div class="visual-option-letter-row"><span class="visual-option-letter">${letter}</span></div>
        </label>
      `;
    }).join("");

    return `
      <section class="exam-panel part-visual part1">
        ${partHeader(part)}
        ${instruction(part.instruction)}
        <article class="question-card visual-question-card active" data-card-q="${item.q}">
          <h3><span class="q-badge">${item.q}</span> ${escapeHtml(item.stem)}</h3>
          <div class="visual-options-grid radio-group" data-q="${item.q}">${options}</div>
        </article>
      </section>
    `;
  }

  function renderMultiplePart(part) {
    const activeQ = getCurrentQuestionNumber();
    const cards = part.items.map(item => {
      const selected = getAnswer(part.id, item.q);
      const options = Object.entries(item.options).map(([letter, text]) => `
        <label class="radio-row ${selected === letter ? "selected" : ""}">
          <input type="radio" name="q${item.q}" value="${letter}" ${selected === letter ? "checked" : ""} />
          <span><strong>${letter}</strong> ${escapeHtml(text)}</span>
        </label>
      `).join("");
      return `
        <article class="question-card ${activeQ === item.q ? "active" : ""}" data-card-q="${item.q}">
          <h4><span class="q-badge">${item.q}</span> ${item.context ? `<span class="question-context">${escapeHtml(item.context)}</span>` : ""}</h4>
          <p class="question-stem"><strong>${escapeHtml(item.stem)}</strong></p>
          <div class="radio-group" data-q="${item.q}">${options}</div>
        </article>
      `;
    }).join("");

    return `
      <section class="exam-panel part-multiple ${part.id}">
        ${partHeader(part)}
        ${instruction(part.instruction)}
        ${part.lead ? `<p class="listening-lead outside-lead">${escapeHtml(part.lead)}</p>` : ""}
        <div class="question-stack listening-question-stack">${cards}</div>
      </section>
    `;
  }

  function renderGapPart(part) {
    const activeQ = getCurrentQuestionNumber();
    const part2Image = visualLayouts.part2Image || part.image || "";
    const picture = part2Image
      ? `<img class="part2-support-image" src="${escapeAttr(resolveLayoutAsset(part2Image))}" alt="${escapeAttr(part.imageDescription || "Weekend trip listening picture")}" />`
      : "";
    const lines = part.items.map(item => {
      const value = getAnswer(part.id, item.q);
      return `
        <p class="listening-gap-line ${activeQ === item.q ? "active" : ""}" data-gap-line-q="${item.q}">
          <span>${escapeHtml(item.before)}</span>
          <input class="inline-input listening-input ${activeQ === item.q ? "active" : ""}" data-q="${item.q}" aria-label="Question ${item.q}" placeholder="${item.q}" value="${escapeAttr(value)}" autocomplete="off" spellcheck="false" />
          <span>${escapeHtml(item.after)}</span>
        </p>
      `;
    }).join("");

    return `
      <section class="exam-panel part-gap part2">
        ${partHeader(part)}
        ${instruction(part.instruction)}
        <article class="article-card listening-gap-card sunshine-card">
          ${part.lead ? `<p class="listening-lead">${escapeHtml(part.lead)}</p>` : ""}
          ${picture}
          <h3>${escapeHtml(part.heading)}</h3>
          ${part.subheading ? `<p class="job-subheading">${escapeHtml(part.subheading)}</p>` : ""}
          ${lines}
        </article>
      </section>
    `;
  }

  function renderMatchingPart(part) {
    const layout = part.id === "part1" ? visualLayouts.part1 : null;
    if (layout?.mode === "part1-cutouts") return renderPart1CutoutLayout(part, layout);
    const activeQ = getCurrentQuestionNumber();
    const optionItems = Object.entries(part.options || {}).map(([letter, text]) => {
      const imagePath = part.optionImages?.[letter];
      const optionImage = imagePath
        ? `<img class="matching-option-image" src="${escapeAttr(imagePath)}" alt="${escapeAttr(text)}" loading="eager" />`
        : "";
      return `
        <li class="${imagePath ? "matching-option-with-image" : ""}">
          ${optionImage}
          <div class="matching-option-caption"><strong>${letter}</strong><span>${escapeHtml(text)}</span></div>
        </li>
      `;
    }).join("");

    const rows = part.items.map(item => {
      const selected = getAnswer(part.id, item.q);
      const selectOptions = [`<option value="">Choose</option>`].concat(Object.entries(part.options || {}).map(([letter, text]) => `
        <option value="${letter}" ${selected === letter ? "selected" : ""}>${letter} - ${escapeHtml(text)}</option>
      `)).join("");
      return `
        <label class="matching-row ${activeQ === item.q ? "active" : ""}" data-card-q="${item.q}">
          <span class="matching-person"><span class="q-badge">${item.q}</span> ${escapeHtml(item.person)}</span>
          <select class="matching-select" data-q="${item.q}" aria-label="Question ${item.q}, ${escapeAttr(item.person)}">
            ${selectOptions}
          </select>
        </label>
      `;
    }).join("");

    const visual = part.image
      ? `<div class="matching-scene"><img class="exam-scene-image" src="${escapeAttr(part.image)}" alt="${escapeAttr(part.imageDescription || part.title || "Listening picture")}" /></div>`
      : part.imageDescription
        ? `<div class="matching-scene visual-placeholder scene-placeholder">${escapeHtml(part.imageDescription)}</div>`
        : "";

    return `
      <section class="exam-panel part-matching ${part.id}">
        ${partHeader(part)}
        ${instruction(part.instruction)}
        <article class="article-card matching-card">
          ${part.lead ? `<p class="listening-lead">${escapeHtml(part.lead)}</p>` : ""}
          ${visual}
          <h3>${escapeHtml(part.taskQuestion || "Choose the correct option.")}</h3>
          <div class="matching-layout">
            <div class="matching-people-panel">
              ${part.example ? `<div class="matching-example"><span class="example-pill">Example</span><strong>${escapeHtml(part.example.person || "")}</strong><span>${escapeHtml(part.example.answer || "")} - ${escapeHtml(part.example.text || "")}</span></div>` : ""}
              <div class="matching-rows">${rows}</div>
            </div>
            <aside class="matching-options-panel" aria-label="${escapeAttr(part.optionsTitle || "Options")}">
              <h4>${escapeHtml(part.optionsTitle || "Options")}</h4>
              <ol class="matching-options-list">${optionItems}</ol>
            </aside>
          </div>
        </article>
      </section>
    `;
  }

  function renderPictureActionPart(part) {
    const layout = part.id === "part5" ? visualLayouts.part5 : null;
    if (layout?.mode === "part5-color") return renderPart5ColorLayout(part, layout);
    const activeQ = getCurrentQuestionNumber();
    const visual = part.image
      ? `<img class="exam-scene-image" src="${escapeAttr(part.image)}" alt="${escapeAttr(part.imageDescription || "Listening picture")}" />`
      : `<div class="visual-placeholder scene-placeholder">${escapeHtml(part.imageDescription || "Picture placeholder")}</div>`;

    const rows = part.items.map(item => {
      const value = getAnswer(part.id, item.q);
      const control = item.action === "write"
        ? `<input class="inline-input picture-write-input ${activeQ === item.q ? "active" : ""}" data-q="${item.q}" value="${escapeAttr(value)}" placeholder="${escapeAttr(item.placeholder || "Write one word")}" autocomplete="off" spellcheck="false" />`
        : `<select class="matching-select picture-action-select" data-q="${item.q}" aria-label="Question ${item.q}, ${escapeAttr(item.target)}">
            <option value="">Choose a colour</option>
            ${(item.options || []).map(option => `<option value="${escapeAttr(option)}" ${value === option ? "selected" : ""}>${escapeHtml(option)}</option>`).join("")}
          </select>`;
      return `
        <label class="picture-action-row ${activeQ === item.q ? "active" : ""}" data-card-q="${item.q}">
          <span class="matching-person"><span class="q-badge">${item.q}</span> ${escapeHtml(item.target)}</span>
          ${control}
        </label>
      `;
    }).join("");

    return `
      <section class="exam-panel part-picture-action part5">
        ${partHeader(part)}
        ${instruction(part.instruction)}
        <article class="article-card picture-action-card">
          ${visual}
          ${part.example ? `<div class="matching-example"><span class="example-pill">Example</span><strong>${escapeHtml(part.example.target || "")}</strong><span>${escapeHtml(part.example.answer || "")}</span></div>` : ""}
          <div class="matching-rows">${rows}</div>
        </article>
      </section>
    `;
  }

  function resolveLayoutAsset(asset) {
    const value = String(asset || "").trim();
    if (!value) return "";
    if (/^(?:https?:|data:|blob:|\/)/i.test(value) || value.includes("/")) return value;
    return `assets/${value}`;
  }

  function layoutRectStyle(item) {
    return `left:${Number(item.x) || 0}%;top:${Number(item.y) || 0}%;width:${Number(item.w) || 1}%;height:${Number(item.h) || 1}%;`;
  }

  function renderPart1CutoutLayout(part, layout) {
    const activeQ = getCurrentQuestionNumber();
    const activeItem = part.items.find(item => item.q === activeQ) || part.items[0];
    const selected = getAnswer(part.id, activeQ);
    const background = resolveLayoutAsset(layout.canvas?.background || part.image);
    const cutouts = (layout.elements || [])
      .filter(item => item.kind === "person-cutout" && item.asset && item.answer)
      .map(item => {
        const answer = String(item.answer || "");
        return `
          <button
            type="button"
            class="part1-person-cutout ${selected === answer ? "selected" : ""}"
            style="${layoutRectStyle(item)}"
            data-person-answer="${escapeAttr(answer)}"
            aria-pressed="${selected === answer ? "true" : "false"}"
            aria-label="Selectable person"
          >
            <img src="${escapeAttr(resolveLayoutAsset(item.asset))}" alt="" draggable="false" />
          </button>
        `;
      }).join("");

    return `
      <section class="exam-panel part1 part1-cutout-mode">
        ${partHeader(part)}
        ${instruction("Listen and click the correct person in the picture.")}
        <article class="article-card hotspot-focus-card">
          <div class="visual-question-focus">
            <span class="q-badge">${activeQ}</span>
            <div><small>Who is this?</small><strong>${escapeHtml(activeItem?.person || "")}</strong></div>
          </div>
          <div class="interactive-picture-stage" style="aspect-ratio:${escapeAttr(layout.canvas?.aspect || "4 / 3")}">
            <img src="${escapeAttr(background)}" alt="${escapeAttr(part.imageDescription || "City-square listening picture")}" />
            ${cutouts}
          </div>
          <p class="interaction-help">Click directly on one of the five selectable people. Other people in the scene are distractors and are not clickable.</p>
        </article>
      </section>
    `;
  }

  function renderPart5ColorLayout(part, layout) {
    const activeQ = getCurrentQuestionNumber();
    const background = resolveLayoutAsset(layout.canvas?.background || part.image);
    const palette = layout.palette || {
      red:"#d24a43", blue:"#3f70b7", green:"#4f8a52", brown:"#8a5d3b",
      purple:"#76559e", yellow:"#e7bb35", orange:"#dc7c36", pink:"#d9809c"
    };
    const elements = layout.elements || [];

    const overlays = elements.map(item => {
      if (item.kind === "cutout") {
        const q = Number(item.q) || 0;
        const example = item.role === "example";
        const answer = example ? (item.color || "yellow") : getAnswer(part.id, q);
        return `
          <button
            type="button"
            class="part5-cutout-button ${answer ? "answered" : ""} ${example ? "example" : ""}"
            style="${layoutRectStyle(item)}"
            data-cutout-q="${q}"
            data-cutout-src="${escapeAttr(resolveLayoutAsset(item.asset))}"
            data-cutout-color="${escapeAttr(answer || "")}"
            ${example ? "disabled" : ""}
            aria-label="${escapeAttr(example ? `Example: ${item.label || "colour item"}` : `Question ${q}: ${item.label || "choose a colour"}`)}"
          ><canvas class="part5-cutout-canvas"></canvas><span class="cutout-q-badge">${example ? "Example" : q}</span></button>
        `;
      }
      if (item.kind === "text") {
        const q = Number(item.q) || 24;
        const value = getAnswer(part.id, q);
        return `
          <input
            class="part5-overlay-input"
            style="${layoutRectStyle(item)}"
            data-q="${q}"
            value="${escapeAttr(value)}"
            placeholder="${escapeAttr(item.placeholder || "Type one word")}"
            autocomplete="off"
            spellcheck="false"
            aria-label="Question ${q}, type one word"
          />
        `;
      }
      return "";
    }).join("");

    const activeCutout = elements.find(item => item.kind === "cutout" && Number(item.q) === Number(openColorPaletteQ));
    const paletteUi = activeCutout ? `
      <div class="canvas-color-palette" role="dialog" aria-label="Choose a colour">
        <strong>Q${Number(activeCutout.q)} · ${escapeHtml(activeCutout.label || "Choose a colour")}</strong>
        <div class="canvas-color-swatches">
          ${Object.entries(palette).map(([name, hex]) => `
            <button type="button" class="canvas-color-swatch" data-color-q="${Number(activeCutout.q)}" data-color-name="${escapeAttr(name)}" style="--swatch:${escapeAttr(hex)}" aria-label="${escapeAttr(name)}" title="${escapeAttr(name)}"></button>
          `).join("")}
        </div>
      </div>
    ` : "";

    return `
      <section class="exam-panel part5 part5-canvas-mode">
        ${partHeader(part)}
        ${instruction("Listen, then click each object to choose its colour. Type the word directly in the blank sign for Question 24.")}
        <article class="article-card hotspot-focus-card">
          <div class="visual-question-focus">
            <span class="q-badge">${activeQ}</span>
            <div><small>Current task</small><strong>${escapeHtml(part.items.find(item => item.q === activeQ)?.target || "")}</strong></div>
          </div>
          <div class="interactive-picture-stage part5-interactive-stage" style="aspect-ratio:${escapeAttr(layout.canvas?.aspect || "4 / 3")}">
            <img src="${escapeAttr(background)}" alt="${escapeAttr(part.imageDescription || "Colour and write listening picture")}" />
            ${overlays}
            ${paletteUi}
          </div>
          <p class="interaction-help">Click a cutout to open the colour palette. Your chosen colour is applied directly to the object.</p>
        </article>
      </section>
    `;
  }

  function hydrateInteractiveCutouts(part) {
    if (part.id !== "part5" || visualLayouts.part5?.mode !== "part5-color") return;
    $(".part5-cutout-button").forEach(button => {
      const canvas = $(".part5-cutout-canvas", button);
      if (!canvas) return;
      paintCutoutCanvas(canvas, button.dataset.cutoutSrc, button.dataset.cutoutColor || "");
    });
  }

  function paintCutoutCanvas(canvas, src, colorName) {
    if (!src) return;
    const image = new Image();
    image.onload = () => {
      canvas.width = image.naturalWidth || image.width;
      canvas.height = image.naturalHeight || image.height;
      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(image, 0, 0);
      const hex = getPaletteHex(colorName);
      if (!hex) return;
      try {
        const rgb = hexToRgb(hex);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;
        for (let i = 0; i < data.length; i += 4) {
          if (data[i + 3] < 5) continue;
          const lum = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
          if (lum < 92) continue;
          const shade = 0.58 + 0.42 * (lum / 255);
          data[i] = Math.round(rgb.r * shade);
          data[i + 1] = Math.round(rgb.g * shade);
          data[i + 2] = Math.round(rgb.b * shade);
        }
        ctx.putImageData(imageData, 0, 0);
      } catch (error) {
        console.warn("Could not recolour cutout", error);
      }
    };
    image.src = src;
  }

  function getPaletteHex(name) {
    const palette = visualLayouts.part5?.palette || {};
    return palette[name] || ({
      red:"#d24a43", blue:"#3f70b7", green:"#4f8a52", brown:"#8a5d3b",
      purple:"#76559e", yellow:"#e7bb35", orange:"#dc7c36", pink:"#d9809c"
    })[name] || "";
  }

  function hexToRgb(hex) {
    const value = parseInt(String(hex).replace("#", ""), 16);
    return { r:(value >> 16) & 255, g:(value >> 8) & 255, b:value & 255 };
  }

  function attachMainHandlers(part) {
    if (part.id === "part1" && visualLayouts.part1?.mode === "part1-cutouts") {
      $(".part1-person-cutout").forEach(button => {
        button.addEventListener("click", () => {
          const q = getCurrentQuestionNumber();
          const answer = button.dataset.personAnswer || "";
          setAnswer(part.id, q, answer, { render: false });
          $(".part1-person-cutout").forEach(node => {
            const selected = node === button;
            node.classList.toggle("selected", selected);
            node.setAttribute("aria-pressed", selected ? "true" : "false");
          });
          renderBottomNav();
          renderStepControls();
        });
      });
    }

    if (part.id === "part5" && visualLayouts.part5?.mode === "part5-color") {
      $(".part5-cutout-button:not(.example)").forEach(button => {
        button.addEventListener("click", () => {
          const q = Number(button.dataset.cutoutQ);
          if (!q) return;
          setCurrentQuestion(q, { render: false });
          openColorPaletteQ = openColorPaletteQ === q ? null : q;
          renderMain({ restoreScroll: true });
          renderBottomNav();
          renderStepControls();
        });
      });
      $(".canvas-color-swatch").forEach(button => {
        button.addEventListener("click", () => {
          const q = Number(button.dataset.colorQ);
          setCurrentQuestion(q, { render: false });
          setAnswer(part.id, q, button.dataset.colorName || "", { render: false });
          openColorPaletteQ = null;
          renderApp({ restoreScroll: true });
        });
      });
      $(".part5-overlay-input").forEach(input => {
        input.addEventListener("focus", () => {
          openColorPaletteQ = null;
          setCurrentQuestion(Number(input.dataset.q), { render: false });
          renderBottomNav();
          renderStepControls();
        });
        input.addEventListener("input", () => {
          setAnswer(part.id, Number(input.dataset.q), input.value, { render: false });
          renderBottomNav();
        });
      });
    }

    if (part.type === "visualMultiple" || part.type === "multiple") {
      $$(".radio-group").forEach(group => {
        group.addEventListener("change", event => {
          const q = Number(group.dataset.q);
          setCurrentQuestion(q, { render: false });
          setAnswer(part.id, q, event.target.value, { render: false });
          updateChoiceVisuals(group, event.target.value);
        });
      });
      $$(".question-card[data-card-q]").forEach(card => {
        card.addEventListener("click", event => {
          if (!event.target.matches("input")) setCurrentQuestion(Number(card.dataset.cardQ), { render: false });
        });
      });
    }

    if (part.type === "gap") {
      $$(".listening-input").forEach(input => {
        input.addEventListener("focus", () => setCurrentQuestion(Number(input.dataset.q), { render: false }));
        input.addEventListener("input", () => setAnswer(part.id, Number(input.dataset.q), input.value, { render: false }));
      });
      $$(".listening-gap-line[data-gap-line-q]").forEach(line => {
        line.addEventListener("click", event => {
          if (event.target.matches("input")) return;
          const q = Number(line.dataset.gapLineQ);
          setCurrentQuestion(q, { render: false });
          $(`.listening-input[data-q="${q}"]`)?.focus();
        });
      });
    }

    if (part.type === "matching") {
      $$(".matching-select").forEach(select => {
        select.addEventListener("focus", () => setCurrentQuestion(Number(select.dataset.q), { render: false }));
        select.addEventListener("change", () => {
          const q = Number(select.dataset.q);
          setCurrentQuestion(q, { render: false });
          setAnswer(part.id, q, select.value, { render: false });
          updateActiveHighlights();
        });
      });
      $$(".matching-row[data-card-q]").forEach(row => {
        row.addEventListener("click", event => {
          if (event.target.matches("select")) return;
          const q = Number(row.dataset.cardQ);
          setCurrentQuestion(q, { render: false });
          $(`.matching-select[data-q="${q}"]`)?.focus();
        });
      });
    }
    if (part.type === "pictureAction") {
      $$(".picture-action-select").forEach(select => {
        select.addEventListener("focus", () => setCurrentQuestion(Number(select.dataset.q), { render: false }));
        select.addEventListener("change", () => {
          const q = Number(select.dataset.q);
          setCurrentQuestion(q, { render: false });
          setAnswer(part.id, q, select.value, { render: false });
          updateActiveHighlights();
        });
      });
      $$(".picture-write-input").forEach(input => {
        input.addEventListener("focus", () => setCurrentQuestion(Number(input.dataset.q), { render: false }));
        input.addEventListener("input", () => setAnswer(part.id, Number(input.dataset.q), input.value, { render: false }));
      });
      $$(".picture-action-row[data-card-q]").forEach(row => {
        row.addEventListener("click", event => {
          if (event.target.matches("select, input")) return;
          const q = Number(row.dataset.cardQ);
          setCurrentQuestion(q, { render: false });
          row.querySelector("select, input")?.focus();
        });
      });
    }

  }

  function updateChoiceVisuals(group, selected) {
    $$(".radio-row", group).forEach(row => {
      row.classList.toggle("selected", row.querySelector("input")?.value === selected);
    });
    $$(".visual-option-card", group).forEach(row => {
      row.classList.toggle("selected", row.querySelector("input")?.value === selected);
    });
    updateActiveHighlights();
    renderBottomNav();
    renderStepControls();
  }

  function updateActiveHighlights() {
    const q = getCurrentQuestionNumber();
    $$(".question-card[data-card-q]").forEach(card => card.classList.toggle("active", Number(card.dataset.cardQ) === q));
    $$(".listening-gap-line[data-gap-line-q]").forEach(line => line.classList.toggle("active", Number(line.dataset.gapLineQ) === q));
    $$(".listening-input[data-q]").forEach(input => input.classList.toggle("active", Number(input.dataset.q) === q));
    $(".matching-row[data-card-q]").forEach(row => row.classList.toggle("active", Number(row.dataset.cardQ) === q));
    $(".picture-action-row[data-card-q]").forEach(row => row.classList.toggle("active", Number(row.dataset.cardQ) === q));
    $(".picture-write-input[data-q]").forEach(input => input.classList.toggle("active", Number(input.dataset.q) === q));
    updateHeader();
  }

  function partHeader(part) {
    return `
      <div class="part-title-row">
        <div>
          <div class="part-kicker">${escapeHtml(part.label)}</div>
          <h2>${escapeHtml(part.title)}</h2>
        </div>
        <span class="question-range">${escapeHtml(part.range)}</span>
      </div>
    `;
  }

  function instruction(text) {
    return `<div class="instruction-card"><strong>Instructions</strong><br>${escapeHtml(text)}</div>`;
  }

  function updateHeader() {
    dom.headerStudent.textContent = state.student.name || "Student Name";
    dom.headerClass.textContent = state.student.classId || "Class ID";
    const q = getCurrentQuestionNumber();
    const flagged = Boolean(state.flagged[q]);
    dom.flagBtn.classList.toggle("flagged", flagged);
    dom.flagBtn.textContent = flagged ? "★" : "☆";
    dom.flagBtn.setAttribute("aria-pressed", flagged ? "true" : "false");
  }

  function updateAudioBadge(text) {
    dom.audioBadge.textContent = text;
    dom.audioBadge.classList.toggle("playing", text === "Audio is playing");
    dom.audioBadge.classList.toggle("ended", text === "Audio finished");
  }

  function renderBottomNav() {
    const currentQ = getCurrentQuestionNumber();
    dom.bottomNav.innerHTML = examParts.map(part => {
      const progress = getProgress(part);
      const active = part.id === state.current.partId;
      const bubbles = active ? `
        <div class="question-bubbles" aria-label="Questions in ${part.label}">
          ${part.items.map(item => {
            const classes = ["q-pill"];
            if (item.q === currentQ) classes.push("active");
            if (isAnswered(part, item.q)) classes.push("answered");
            if (state.flagged[item.q]) classes.push("flagged");
            return `<button class="${classes.join(" ")}" data-jump-q="${item.q}" title="Question ${item.q}">${item.q}</button>`;
          }).join("")}
        </div>` : "";
      return `
        <section class="part-nav-card ${active ? "active" : ""}" data-part-id="${part.id}">
          <div class="part-nav-top">
            <button class="part-nav-title" data-part-id="${part.id}">${part.label}</button>
            <span class="part-nav-progress">${progress.answered} of ${progress.total}</span>
          </div>
          ${bubbles}
        </section>
      `;
    }).join("");

    $$('[data-jump-q]', dom.bottomNav).forEach(button => {
      button.addEventListener("click", event => {
        event.stopPropagation();
        goToQuestion(Number(button.dataset.jumpQ));
      });
    });
    $$('.part-nav-card', dom.bottomNav).forEach(card => {
      card.addEventListener("click", () => {
        const part = getPart(card.dataset.partId);
        if (part?.items?.[0]) goToQuestion(part.items[0].q);
      });
    });
  }

  function renderStepControls() {
    dom.backBtn.disabled = isFirstQuestion();
    if (isFinalQuestion()) {
      dom.nextBtn.textContent = "✓";
      dom.nextBtn.classList.add("finish");
      dom.nextBtn.setAttribute("aria-label", "Finish exam");
    } else {
      dom.nextBtn.textContent = "→";
      dom.nextBtn.classList.remove("finish");
      dom.nextBtn.setAttribute("aria-label", "Next question");
    }
  }

  /* ----------------------------------------------
   NAVIGATION
  ---------------------------------------------- */
  function getCurrentPart() { return getPart(state.current.partId) || examParts[0]; }
  function getPart(partId) { return examParts.find(part => part.id === partId); }
  function ensureValidCurrent() {
    const part = getCurrentPart();
    if (!part) return;
    if (state.current.itemIndex < 0) state.current.itemIndex = 0;
    if (state.current.itemIndex >= part.items.length) state.current.itemIndex = part.items.length - 1;
  }
  function getCurrentQuestionNumber() {
    const part = getCurrentPart();
    return part?.items?.[state.current.itemIndex]?.q;
  }
  function getQuestionLocation(q) {
    for (const part of examParts) {
      const itemIndex = part.items.findIndex(item => item.q === q);
      if (itemIndex !== -1) return { partId: part.id, itemIndex };
    }
    return null;
  }
  function setCurrentQuestion(q, options = {}) {
    const location = getQuestionLocation(q);
    if (!location) return;
    state.current = location;
    saveState();
    if (liveProgress && typeof liveProgress.touch === "function") liveProgress.touch();
    if (options.render === false) {
      updateActiveHighlights();
      renderBottomNav();
      renderStepControls();
      return;
    }
    renderApp({ restoreScroll: true });
  }
  function goToQuestion(q) {
    const previousPart = state.current.partId;
    const location = getQuestionLocation(q);
    if (!location) return;
    state.current = location;
    if (liveProgress && typeof liveProgress.touch === "function") liveProgress.touch();
    renderApp({ restoreScroll: previousPart === location.partId });
  }
  function getLinearIndex() {
    const currentQ = getCurrentQuestionNumber();
    return allItems().findIndex(item => item.q === currentQ);
  }
  function allItems() { return examParts.flatMap(part => part.items.map(item => ({ ...item, partId: part.id }))); }
  function goPrevious() {
    const items = allItems();
    const index = getLinearIndex();
    if (index > 0) goToQuestion(items[index - 1].q);
  }
  function goNext() {
    const items = allItems();
    const index = getLinearIndex();
    if (index < items.length - 1) goToQuestion(items[index + 1].q);
  }
  function isFirstQuestion() { return getLinearIndex() === 0; }
  function isFinalQuestion() { return getLinearIndex() === allItems().length - 1; }
  function isLastPart() {
    const lastPart = examParts[examParts.length - 1];
    return Boolean(lastPart && state.current.partId === lastPart.id);
  }

  /* ----------------------------------------------
   ANSWERS
  ---------------------------------------------- */
  function getAnswer(partId, q) { return state.answers?.[partId]?.[q] || ""; }
  function setAnswer(partId, q, value, options = {}) {
    if (!state.answers[partId]) state.answers[partId] = {};
    state.answers[partId][q] = value;
    saveState();
    if (liveProgress && typeof liveProgress.touch === "function") liveProgress.touch();
    if (options.render === false) {
      updateHeader();
      renderBottomNav();
      return;
    }
    renderApp({ restoreScroll: true });
  }
  function isAnswered(part, q) {
    const value = getAnswer(part.id, q);
    return value !== null && value !== undefined && String(value).trim() !== "";
  }
  function getProgress(part) {
    const total = part.items.length;
    const answered = part.items.filter(item => isAnswered(part, item.q)).length;
    return { answered, total };
  }

  /* ----------------------------------------------
   FLAG NOTES MENU
  ---------------------------------------------- */
  function toggleFlag() {
    const q = getCurrentQuestionNumber();
    if (!q) return;
    if (state.flagged[q]) delete state.flagged[q];
    else state.flagged[q] = true;
    renderApp({ restoreScroll: true });
  }
  function openNotes() {
    openModal(`
      <div class="modal-card" role="dialog" aria-modal="true" aria-labelledby="notesTitle">
        <div class="modal-head">
          <h3 id="notesTitle">Private notes</h3>
          <button class="icon-btn" data-close-modal aria-label="Close notes">×</button>
        </div>
        <p class="muted-text">Notes are saved locally on this device.</p>
        <textarea id="notesArea" class="notes-area" placeholder="Type your private notes here..."></textarea>
      </div>
    `);
    const area = $("#notesArea");
    area.value = state.notes || "";
    area.addEventListener("input", () => {
      state.notes = area.value;
      saveState();
    });
    setTimeout(() => area.focus(), 50);
  }
  function openOverview() {
    const currentQ = getCurrentQuestionNumber();
    const content = examParts.map(part => `
      <section class="overview-part">
        <h4>${escapeHtml(part.label)} <span class="muted-text">${getProgress(part).answered} of ${getProgress(part).total}</span></h4>
        ${part.items.map(item => {
          const answered = isAnswered(part, item.q);
          const flagged = Boolean(state.flagged[item.q]);
          return `
            <button class="overview-item ${answered ? "answered" : ""} ${currentQ === item.q ? "current" : ""}" data-overview-q="${item.q}">
              <strong>Question ${item.q}</strong>
              <span>${answered ? "Answered" : "Unanswered"}${flagged ? " · ★" : ""}</span>
            </button>
          `;
        }).join("")}
      </section>
    `).join("");
    openModal(`
      <div class="modal-card" role="dialog" aria-modal="true" aria-labelledby="overviewTitle">
        <div class="modal-head">
          <h3 id="overviewTitle">Question overview</h3>
          <button class="icon-btn" data-close-modal aria-label="Close overview">×</button>
        </div>
        <div class="overview-grid">${content}</div>
      </div>
    `);
    $$('[data-overview-q]', dom.modalRoot).forEach(button => {
      button.addEventListener("click", () => {
        closeModal();
        goToQuestion(Number(button.dataset.overviewQ));
      });
    });
  }
  function openModal(html) {
    dom.modalRoot.innerHTML = html;
    dom.modalRoot.classList.remove("hidden");
    dom.modalRoot.setAttribute("aria-hidden", "false");
    $$('[data-close-modal]', dom.modalRoot).forEach(btn => btn.addEventListener("click", closeModal));
    dom.modalRoot.addEventListener("click", event => {
      if (event.target === dom.modalRoot) closeModal();
    }, { once: true });
  }
  function closeModal() {
    dom.modalRoot.classList.add("hidden");
    dom.modalRoot.setAttribute("aria-hidden", "true");
    dom.modalRoot.innerHTML = "";
  }
  function openMenu() {
    dom.sideMenu.classList.add("open");
    dom.sideMenu.setAttribute("aria-hidden", "false");
  }
  function closeMenu() {
    dom.sideMenu.classList.remove("open");
    dom.sideMenu.setAttribute("aria-hidden", "true");
  }
  function requestSubmitFromMenu() {
    closeMenu();
    confirmSubmitExam();
  }
  function confirmSubmitExam() {
    const confirmed = window.confirm("Submit your exam now? You will not be able to change your answers after submitting.");
    if (!confirmed) return;
    showFinishScreen();
  }
  function renderEndSubmitCard() {
    if (state.submitted || !isLastPart()) return "";
    return App.renderEndSubmitCard ? App.renderEndSubmitCard() : "";
  }
  function bindEndSubmitCard() {
    if (App.bindEndSubmitCard) return App.bindEndSubmitCard(dom.mainContent, confirmSubmitExam);
    const button = $("[data-submit-exam]", dom.mainContent);
    if (!button) return;
    button.addEventListener("click", confirmSubmitExam);
  }
  function resetTest() {
    const confirmed = window.confirm("Reset this listening test? This will clear all answers, flags and notes saved on this device.");
    if (!confirmed) return;
    localStorage.removeItem(STORAGE_KEY);
    state = createDefaultState();
    window.location.reload();
  }

  /* ----------------------------------------------
   SUBMIT
  ---------------------------------------------- */
  function showFinishScreen() {
    state.submitted = true;
    state.submittedAt = new Date().toISOString();
    saveStateNow();
    const payload = buildExportPayload();
    dom.mainContent.innerHTML = `
      <section class="finish-screen">
        <div class="finish-card finish-confirmation-card">
          <p class="eyebrow">Exam finished</p>
          <h2>Submitting your answers</h2>
          <p id="submitStatusText" class="start-copy" style="margin-left:auto;margin-right:auto;">Please wait while the platform records your exam in Wix.</p>
          <div class="submission-status-line"><strong id="submitStatusBadge">Saving</strong><span>Wix CMS</span></div>
          <div id="submissionResult" class="submission-result"></div>
        </div>
      </section>
    `;
    dom.nextBtn.disabled = true;
    dom.backBtn.disabled = true;
    dom.bottomNav.innerHTML = "";
    submitPayload(payload);
  }
  function startLiveProgress() {
    if (!window.BrightonLiveProgress || state.submitted) return;
    if (liveProgress && typeof liveProgress.stop === "function") liveProgress.stop();
    liveProgress = window.BrightonLiveProgress.create({
      examId: exam.examId,
      examTitle: exam.title,
      skill: exam.skill,
      level: exam.level,
      getProgress: buildLiveProgressSnapshot
    });
    liveProgress.start();
  }
  function buildLiveProgressSnapshot() {
    const totals = examParts.reduce((summary, part) => {
      const progress = getProgress(part);
      summary.answered += Number(progress.answered ?? progress.done) || 0;
      summary.total += Number(progress.total) || 0;
      return summary;
    }, { answered: 0, total: 0 });
    return {
      studentName: state.student.name,
      classId: state.student.classId,
      startedAt: state.student.startedAt,
      currentPart: state.current.partId,
      currentQuestion: getCurrentQuestionNumber(),
      answeredCount: totals.answered,
      totalQuestions: totals.total,
      progressPercent: totals.total ? Math.round((totals.answered / totals.total) * 100) : 0,
      timeSpentSeconds: calculateLiveTimeSpentSeconds(),
      answers: state.answers,
      answerList: buildAnswerList(),
      flagged: Object.keys(state.flagged).map(Number).sort((a, b) => a - b),
      notes: state.notes || ""
    };
  }
  function calculateLiveTimeSpentSeconds() {
    if (!state.student.startedAt) return 0;
    const started = new Date(state.student.startedAt).getTime();
    if (!Number.isFinite(started)) return 0;
    return Math.max(0, Math.round((Date.now() - started) / 1000));
  }
  function buildExportPayload() {
    const answerList = buildAnswerList();
    return {
      examId: exam.examId,
      examTitle: exam.title,
      studentName: state.student.name,
      classId: state.student.classId,
      answers: state.answers,
      answerList,
      flagged: Object.keys(state.flagged).map(Number).sort((a, b) => a - b),
      notes: state.notes || "",
      startedAt: state.student.startedAt || "",
      submittedAt: state.submittedAt,
      timeSpentSeconds: calculateTimeSpentSeconds(),
      progress: examParts.map(part => ({ partId: part.id, label: part.label, ...getProgress(part) }))
    };
  }
  function buildAnswerList() {
    return examParts.flatMap(part => {
      const partNumber = Number(String(part.id).replace("part", ""));
      return part.items.map(item => ({
        part: partNumber,
        partId: part.id,
        question: item.q,
        answer: getAnswer(part.id, item.q) || ""
      }));
    });
  }
  function calculateTimeSpentSeconds() {
    if (!state.student.startedAt || !state.submittedAt) return null;
    const started = new Date(state.student.startedAt).getTime();
    const submitted = new Date(state.submittedAt).getTime();
    if (!Number.isFinite(started) || !Number.isFinite(submitted)) return null;
    return Math.max(0, Math.round((submitted - started) / 1000));
  }
  async function submitPayload(payload) {
    const message = { type: "BRIGHTON_A1_LISTENING_SUBMIT", payload };
    try {
      window.parent?.postMessage(message, "*");
    } catch (error) {
      console.warn("Could not post submission to parent window.", error);
    }
    const statusText = $("#submitStatusText");
    const statusBadge = $("#submitStatusBadge");
    const resultBox = $("#submissionResult");
    const config = window.BRIGHTON_SITE_CONFIG || {};
    const apiBase = (config.API_BASE_URL || "").replace(/\/$/, "");
    if (!apiBase || apiBase.includes("YOUR-WIX")) {
      statusBadge.textContent = "Local";
      statusText.textContent = "The exam is complete. Configure API_BASE_URL in config.js to save directly to Wix CMS.";
      resultBox.innerHTML = `<p class="muted-text">No Wix endpoint is configured yet. Tell your teacher before closing this page.</p>`;
      return;
    }
    try {
      const response = await fetch(`${apiBase}/submitExam`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || data.success === false) throw new Error(data.error || `HTTP ${response.status}`);
      if (liveProgress && typeof liveProgress.markSubmitted === "function") {
        await liveProgress.markSubmitted({ submissionId: data.submissionId || "", submittedAt: payload.submittedAt || new Date().toISOString() });
      }
      statusBadge.textContent = "Saved";
      statusText.textContent = "Your answers have been recorded successfully.";
      resultBox.innerHTML = `
        <div class="submission-success">
          <h3>Answers recorded</h3>
          <p class="muted-text">Submission ID: ${escapeHtml(data.submissionId || "")}</p>
        </div>
      `;
      localStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      console.error("Submission failed", error);
      statusBadge.textContent = "Not saved";
      statusText.textContent = "The exam is complete, but it could not be saved to Wix. Tell your teacher before closing this page.";
      resultBox.innerHTML = `
        <p class="submit-error">Save error: ${escapeHtml(error.message || String(error))}</p>
        <button class="primary-btn" type="button" data-retry-submission style="margin-top:16px;">Retry submission</button>
      `;
      const retryButton = resultBox.querySelector("[data-retry-submission]");
      retryButton?.addEventListener("click", () => {
        retryButton.disabled = true;
        statusBadge.textContent = "Saving";
        statusText.textContent = "Retrying submission...";
        resultBox.innerHTML = `<p class="muted-text">Trying again...</p>`;
        submitPayload(payload);
      });
    }
  }

  /* ----------------------------------------------
   UTILITIES
  ---------------------------------------------- */
  function scrollActiveCardIntoView() {
    const active = dom.mainContent.querySelector(".question-card.active, .listening-gap-line.active, .matching-row.active, .picture-action-row.active");
    if (!active) return;
    active.scrollIntoView({ behavior: "smooth", block: "center" });
  }
  function normalizeClassCode(value) {
    return App.normalizeClassCode ? App.normalizeClassCode(value) : String(value || "").trim().toUpperCase();
  }
  function escapeHtml(value) {
    return App.escapeHtml ? App.escapeHtml(value) : String(value ?? "");
  }
  function escapeAttr(value) {
    return App.escapeAttr ? App.escapeAttr(value) : escapeHtml(value).replace(/'/g, "&#39;");
  }
  function debounce(fn, wait) {
    return App.debounce ? App.debounce(fn, wait) : (...args) => window.setTimeout(() => fn(...args), wait);
  }
})();

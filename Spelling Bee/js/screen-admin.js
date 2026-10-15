"use strict";
(() => {
  if (document.body.dataset.role !== "remote") return;
  const M = window.BeeScreen, Cloud = window.SpellingCloud;
  const panel = document.createElement("section");
  panel.className = "screen-director"; panel.id = "screen-director";
  panel.setAttribute("aria-label", "Audience screen controls");
  panel.innerHTML = `
    <header class="director-header"><div><h2>Screen View · Show control</h2><span class="director-live" id="director-live">Connecting screen…</span></div><div class="director-actions"><a class="director-button" id="open-screen" target="_blank" rel="noopener">Open audience screen ↗</a><button type="button" class="standby-button" id="screen-standby">Return to standby</button></div></header>
    <p class="director-help">Prepare a scene, check the preview, then take it live. Contestant and scene changes stay in preview until you publish them.</p>
    <div class="director-top"><div><div class="preview-label">PREVIEW · OFF AIR</div><iframe class="director-preview" id="screen-preview" src="screen.html?preview=1" title="Audience scene preview"></iframe><div class="director-preview-note"><span id="preview-label">Standby</span><span>School logo only · 16:9</span></div><div class="director-take-row"><button class="take-live" type="button" id="screen-take">Take scene live</button><button type="button" id="next-speller">Prepare next contestant</button></div></div><div><h3>Scenes</h3><div class="scene-buttons" id="screen-scenes"></div></div></div>
    <div class="director-fields">
      <label>Current contestant<select id="screen-current"></select></label>
      <label>Round / stage name<input id="screen-round" maxlength="60" value="Round 1"></label>
      <label>Motion<select id="screen-motion"><option value="full">Soft transitions</option><option value="quiet">Quiet / reduced motion</option></select></label>
      <label>Result<select id="screen-result"><option value="pending">Word reveal only</option><option value="correct">Correct</option><option value="incorrect">Incorrect</option></select></label>
      <label>Board page<input type="number" id="screen-page" min="1" max="25" value="1"></label>
      <label class="check-label"><input type="checkbox" id="screen-auto" checked>Rotate board / finalists pages</label>
      <label class="wide check-label"><input type="checkbox" id="screen-reveal">Reveal the current word on the Result scene (explicit permission to show its spelling)</label>
      <label class="wide">Definition for the audience<textarea id="screen-definition" maxlength="500"></textarea></label>
      <label class="wide">Example sentence for the audience<textarea id="screen-example" maxlength="500"></textarea></label>
      <div class="wide director-actions"><button type="button" id="screen-load-word">Load current word information</button><span class="director-help" id="screen-word-status">Target words are masked before reaching the screen.</span></div>
      <label class="wide">Break message (optional)<input id="screen-message" maxlength="220"></label>
      <label class="wide">Closing message (optional)<input id="screen-closing" maxlength="220"></label>
    </div>
    <div class="director-timer"><label>Timer seconds<input type="number" id="screen-duration" min="1" max="3600" value="60"></label><label class="check-label"><input type="checkbox" id="screen-timer-visible" checked>Show timer</label><button type="button" id="screen-timer-start">Start / resume live timer</button><button type="button" id="screen-timer-pause">Pause live timer</button><button type="button" id="screen-timer-reset">Reset live timer</button><span class="director-help" id="live-timer">60s · paused</span></div>
    <p class="director-status" id="director-status" role="status" aria-live="polite"></p>
    <section class="director-roster"><h3>Contestants <span class="director-count" id="roster-count"></span></h3><p class="director-help">Paste one contestant per line: <strong>Name | Grade / class | Number</strong>. Tabs copied from a spreadsheet also work. Edit the list below; mark finalists and assign unique podium places here.</p><label>Contestant list<textarea id="roster-paste" placeholder="Isabella Martinez | Grade 5 | 1&#10;Santiago Lopez | Grade 6 | 2"></textarea></label><div class="director-actions"><button type="button" id="roster-add">Add pasted contestants</button><button type="button" id="roster-save">Publish contestant list</button></div><div class="roster-scroll"><table class="roster-table"><thead><tr><th>Number</th><th>Name</th><th>Grade / class</th><th>Status</th><th>Podium</th><th>Remove</th></tr></thead><tbody id="roster-rows"></tbody></table></div></section>
    <p class="director-help">Screen code: <span id="broadcast-code" class="screen-code">—</span>. Use one show operator at a time. A stopped timer never declares a result. Judge votes never trigger an audience result.</p>`;
  document.querySelector(".control-shell").append(panel);
  const $ = id => document.getElementById(id);
  let sourceCode = "", broadcastCode = "", live = M.initial(), draft = M.initial();
  let busy = false, ready = false, sourceWord = "", sourceToken = "", generation = 0;
  const frame = $("screen-preview");
  function status(message, error = false) { $("director-status").textContent = message; $("director-status").classList.toggle("error", error); }
  const storageKey = () => `bee-screen-draft:${sourceCode}`;
  function storeDraft() { try { localStorage.setItem(storageKey(), JSON.stringify(draft)); } catch { /* Cloud remains authoritative for the on-air scene. */ } }
  function readFields() {
    const roster = draft.contestants;
    draft = M.normalize({ ...draft, currentId: $("screen-current").value, round: $("screen-round").value,
      motion: $("screen-motion").value, result: $("screen-result").value, boardPage: Number($("screen-page").value) - 1,
      autoBoard: $("screen-auto").checked, definition: M.maskWord($("screen-definition").value, sourceWord),
      example: M.maskWord($("screen-example").value, sourceWord), message: $("screen-message").value,
      closing: $("screen-closing").value, revealWord: $("screen-reveal").checked ? sourceWord : "",
      timer: { ...draft.timer, duration: Number($("screen-duration").value), visible: $("screen-timer-visible").checked } });
    // Keep the editable row objects alive across preview updates. Publication
    // normalizes a separate snapshot, so table handlers always edit this draft.
    draft.contestants = roster;
    storeDraft(); return draft;
  }
  function preview() {
    readFields();
    frame.contentWindow?.postMessage({ type: "bee-screen-preview", state: { ...draft, timer: { ...draft.timer, remaining: draft.timer.duration, running: false } } }, location.origin);
    $("preview-label").textContent = M.scenes.find(([key]) => key === draft.scene)?.[1] || "Standby";
    for (const button of $("screen-scenes").children) { button.classList.toggle("selected", button.dataset.scene === draft.scene); button.classList.toggle("on-air", button.dataset.scene === live.scene); button.setAttribute("aria-pressed", String(button.dataset.scene === draft.scene)); }
  }
  function fillFields() {
    const fields = { "screen-round": draft.round, "screen-motion": draft.motion, "screen-result": draft.result,
      "screen-page": draft.boardPage + 1, "screen-definition": draft.definition, "screen-example": draft.example,
      "screen-message": draft.message, "screen-closing": draft.closing, "screen-duration": draft.timer.duration };
    for (const [id, value] of Object.entries(fields)) $(id).value = value;
    $("screen-auto").checked = draft.autoBoard; $("screen-timer-visible").checked = draft.timer.visible;
    $("screen-reveal").checked = false;
    renderRoster(); preview();
  }
  function renderRoster() {
    const select = $("screen-current"); select.replaceChildren(new Option("Select contestant", ""));
    for (const row of draft.contestants) select.add(new Option(`#${row.number} · ${row.name}`, row.id));
    select.value = draft.currentId;
    $("roster-count").textContent = `${draft.contestants.length} / 200`;
    const tbody = $("roster-rows"); tbody.replaceChildren();
    for (const row of draft.contestants) {
      const tr = document.createElement("tr");
      for (const key of ["number", "name", "group", "status", "place"]) {
        const td = document.createElement("td");
        const input = document.createElement(["status", "place"].includes(key) ? "select" : "input");
        input.setAttribute("aria-label", `${key} for ${row.name}`);
        if (key === "status") [["active", "In contention"], ["finalist", "Finalist"], ["eliminated", "Completed"]].forEach(([value, label]) => input.add(new Option(label, value)));
        if (key === "place") [[0, "Unassigned"], [1, "1st"], [2, "2nd"], [3, "3rd"]].forEach(([value, label]) => input.add(new Option(label, value)));
        input.value = row[key]; input.className = `roster-${key}`;
        if (key === "name") input.maxLength = 80; if (key === "group") input.maxLength = 40; if (key === "number") input.maxLength = 8;
        input.addEventListener("change", () => {
          row[key] = key === "place" ? Number(input.value) : input.value.trim();
          if (key === "place" && row.place) for (const other of draft.contestants) if (other.id !== row.id && other.place === row.place) other.place = 0;
          renderRoster(); preview();
        });
        td.append(input); tr.append(td);
      }
      const td = document.createElement("td"), remove = document.createElement("button");
      remove.type = "button"; remove.textContent = "×"; remove.setAttribute("aria-label", `Remove ${row.name}`);
      remove.addEventListener("click", () => { draft.contestants = draft.contestants.filter(item => item.id !== row.id); if (draft.currentId === row.id) { draft.currentId = ""; $("screen-reveal").checked = false; } renderRoster(); preview(); });
      td.append(remove); tr.append(td); tbody.append(tr);
    }
  }
  async function refreshSource() {
    const found = await Cloud.fetchPresenter(sourceCode);
    if (!found || found.screenBroadcast) throw new Error("Presenter session is unavailable.");
    if (sourceToken !== found.wordToken) {
      sourceWord = String(found.word || ""); sourceToken = String(found.wordToken || "");
      $("screen-reveal").checked = false;
      // A new word invalidates draft information; it must be loaded or entered again.
      $("screen-definition").value = ""; $("screen-example").value = "";
      draft.definition = ""; draft.example = ""; draft.revealWord = "";
      draft.result = "pending"; $("screen-result").value = "pending";
      $("screen-word-status").textContent = "New word detected. Load its information before taking a word scene live.";
    }
    return found;
  }
  function setBusy(value) {
    busy = value;
    for (const id of ["screen-take", "screen-standby", "roster-save", "screen-timer-start", "screen-timer-pause", "screen-timer-reset"]) $(id).disabled = value || !ready;
  }
  async function publish(next, message, fromTake = false) {
    if (!ready || (busy && !fromTake)) return;
    setBusy(true); status("Sending to audience screen…");
    try {
      const latest = await Cloud.fetchPresenter(broadcastCode);
      if (latest && !latest.screenBroadcast) throw new Error("This screen code is already in use by a presenter. No changes were saved.");
      if (latest?.broadcast && Number(latest.broadcast.revision) !== live.revision) {
        live = M.normalize(latest.broadcast);
        throw new Error("Another operator changed the screen. The live cue was refreshed; review your preview and try again.");
      }
      const outgoing = M.normalize({ ...next, revision: live.revision + 1 });
      const saved = await Cloud.writeState({ sessionCode: broadcastCode, role: "presenter", state: { screenBroadcast: true, broadcast: outgoing } });
      if (!saved.session?.screenBroadcast) throw new Error("The backend did not acknowledge the broadcast.");
      live = M.normalize(saved.session.broadcast);
      $("director-live").textContent = `ON AIR · ${M.scenes.find(([key]) => key === live.scene)?.[1]}`;
      preview(); status(message);
    } catch (error) { status(`Not published: ${error.message}`, true); }
    finally { setBusy(false); }
  }
  async function take() {
    if (busy || !ready) return;
    setBusy(true);
    status("Preparing scene and checking the current word…");
    try {
      const before = sourceToken;
      await refreshSource();
      if (before !== sourceToken && ["definition", "example", "result"].includes(draft.scene)) { preview(); throw new Error("The presenter changed words. Reload the word information and review the preview."); }
      readFields();
      if (["spelling", "definition", "example", "pending", "result"].includes(draft.scene) && !draft.currentId) throw new Error("Select the contestant first.");
      if (["definition", "example"].includes(draft.scene) && !draft[draft.scene]) throw new Error("Load or enter the word information first.");
      if (draft.contestants.some(row => !row.name.trim())) throw new Error("Every contestant needs a name.");
      const next = { ...draft, cueId: crypto.randomUUID(), timer: { ...live.timer, visible: draft.timer.visible, duration: draft.timer.duration } };
      if (["pending", "result"].includes(next.scene)) next.timer = { ...next.timer, remaining: M.remaining(live.timer), running: false };
      if (next.currentId !== live.currentId) next.timer = { ...next.timer, remaining: draft.timer.duration, running: false };
      await publish(next, "Scene is live. Timer and results remain under your control.", true);
    } catch (error) { status(error.message, true); }
    finally { setBusy(false); }
  }
  async function initialize(code) {
    const run = ++generation; sourceCode = code; ready = false; setBusy(false);
    try {
      broadcastCode = await M.broadcastCode(sourceCode);
      const found = await Cloud.fetchPresenter(broadcastCode);
      if (run !== generation) return;
      if (found && !found.screenBroadcast) throw new Error("Reserved screen code is in use. Contact the site administrator.");
      live = found?.broadcast ? M.normalize(found.broadcast) : M.initial();
      let cached; try { cached = JSON.parse(localStorage.getItem(storageKey()) || "null"); } catch { /* Ignore invalid drafts. */ }
      draft = M.normalize(cached || live);
      await refreshSource();
      if (run !== generation) return;
      ready = true;
      if (!found) {
        const saved = await Cloud.writeState({ sessionCode: broadcastCode, role: "presenter", state: { screenBroadcast: true, broadcast: live } });
        if (!saved.session?.screenBroadcast) throw new Error("Wix did not acknowledge the screen session.");
      }
      $("open-screen").href = `screen.html?session=${broadcastCode}`;
      $("broadcast-code").textContent = broadcastCode;
      $("director-live").textContent = `ON AIR · ${M.scenes.find(([key]) => key === live.scene)?.[1]}`;
      fillFields(); setBusy(false); status("Screen connected. Open the audience screen on the stage display.");
    } catch (error) { ready = false; setBusy(false); status(error.message + " Rejoin the presenter session to retry.", true); }
  }
  for (const [key, label] of M.scenes) {
    const button = document.createElement("button"); button.type = "button"; button.textContent = label; button.dataset.scene = key;
    button.addEventListener("click", () => { draft.scene = key; if (key !== "result") { $("screen-reveal").checked = false; $("screen-result").value = "pending"; } preview(); });
    $("screen-scenes").append(button);
  }
  frame.addEventListener("load", preview);
  panel.querySelectorAll(".director-fields input,.director-fields select,.director-fields textarea,#screen-duration,#screen-timer-visible").forEach(input => input.addEventListener("input", preview));
  $("screen-current").addEventListener("change", () => { $("screen-reveal").checked = false; draft.result = "pending"; $("screen-result").value = "pending"; preview(); });
  $("screen-take").addEventListener("click", take);
  $("screen-standby").addEventListener("click", () => publish({ ...live, scene: "standby", revealWord: "", cueId: crypto.randomUUID(), timer: { ...live.timer, remaining: M.remaining(live.timer), running: false } }, "Standby is live."));
  $("roster-add").addEventListener("click", () => { try { readFields(); const added = M.parseRoster($("roster-paste").value, draft.contestants); if (!added.length) throw new Error("Paste at least one contestant."); draft.contestants.push(...added); $("roster-paste").value = ""; renderRoster(); preview(); status(`Added ${added.length} contestants to preview. Publish the list when ready.`); } catch (error) { status(error.message, true); } });
  $("roster-save").addEventListener("click", () => { readFields(); if (draft.contestants.some(row => !row.name)) return status("Every contestant needs a name.", true); const currentId = draft.contestants.some(row => row.id === live.currentId) ? live.currentId : ""; publish({ ...live, contestants: draft.contestants, currentId, revealWord: currentId ? live.revealWord : "" }, "Contestant list published."); });
  $("next-speller").addEventListener("click", () => { readFields(); const rows = draft.contestants.filter(row => row.status !== "eliminated"); const index = rows.findIndex(row => row.id === draft.currentId); if (index >= rows.length - 1) return status("No more contestants in the list."); draft.currentId = rows[index + 1]?.id || ""; draft.scene = "spelling"; draft.result = "pending"; fillFields(); status("Next contestant prepared. Review and take live."); });
  $("screen-load-word").addEventListener("click", async () => {
    try {
      const found = await refreshSource(); const token = sourceToken;
      if (!sourceWord) throw new Error("Call a word in the presenter first.");
      const info = await Cloud.getWordInfo(found.level, found.difficulty, sourceWord);
      const latest = await Cloud.fetchPresenter(sourceCode);
      if (latest?.wordToken !== token) { await refreshSource(); throw new Error("The word changed while loading. Try again."); }
      if (!info) throw new Error("No information is available for this word. Enter a definition and example manually.");
      $("screen-definition").value = M.maskWord(info.definition, sourceWord); $("screen-example").value = M.maskWord(info.example, sourceWord);
      $("screen-word-status").textContent = "Current word information loaded. Target spelling is masked."; preview();
    } catch (error) { status(error.message, true); }
  });
  for (const action of ["start", "pause", "reset"]) $("screen-timer-" + action).addEventListener("click", () => {
    readFields(); const left = M.remaining(live.timer);
    const seconds = action === "reset" || (action === "start" && left === 0) ? draft.timer.duration : left;
    const timer = { duration: draft.timer.duration, remaining: seconds, endsAt: action === "start" ? Date.now() + seconds * 1000 : 0, running: action === "start", visible: draft.timer.visible };
    publish({ ...live, timer }, `Live timer ${action === "start" ? "running" : action === "pause" ? "paused" : "reset"}.`);
  });
  setInterval(() => { $("live-timer").textContent = `${M.remaining(live.timer)}s · ${live.timer.running && M.remaining(live.timer) ? "running" : "paused"}`; }, 250);
  window.addEventListener("spelling-session-joined", event => initialize(event.detail.sessionCode));
  setBusy(false);
})();

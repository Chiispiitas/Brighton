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
    <div class="director-top"><div><div class="preview-label">PREVIEW · OFF AIR</div><iframe class="director-preview" id="screen-preview" src="screen.html?preview=1" title="Audience scene preview"></iframe><div class="director-preview-note"><span id="preview-label">Standby</span><span>School & English Area · 16:9</span></div><div class="director-take-row"><button class="take-live" type="button" id="screen-take">Take scene live</button><button type="button" id="next-speller">Prepare next contestant</button></div></div><div><h3>Scenes</h3><div class="scene-buttons" id="screen-scenes"></div></div></div>
    <div class="director-fields">
      <label>Current contestant<select id="screen-current"></select></label>
      <label>Round / stage name<input id="screen-round" maxlength="60" value="Round 1"></label>
      <label>Motion<select id="screen-motion"><option value="full">Soft transitions</option><option value="quiet">Quiet / reduced motion</option></select></label>
      <label>Result<select id="screen-result"><option value="pending">Word reveal only</option><option value="correct">Correct</option><option value="incorrect">Incorrect</option></select></label>
      <label>Board page<input type="number" id="screen-page" min="1" max="25" value="1"></label>
      <label class="check-label"><input type="checkbox" id="screen-auto" checked>Rotate board / finalists pages</label>
      <label class="wide check-label"><input type="checkbox" id="screen-show-lives">Show remaining lives on Now Spelling and the competition board</label>
      <p class="wide director-help">Taking Result / word reveal live reveals the current word. Pending results show the word alone; confirmed feedback adds Correct or Incorrect.</p>
      <label class="wide">Definition for the audience<textarea id="screen-definition" maxlength="500"></textarea></label>
      <label class="wide">Example sentence for the audience<textarea id="screen-example" maxlength="500"></textarea></label>
      <div class="wide director-help" id="screen-word-status" role="status">Current word information loads automatically. Target spellings stay masked in definitions and examples.</div>
      <label class="wide">Break message (optional)<input id="screen-message" maxlength="220"></label>
      <label class="wide">Closing message (optional)<input id="screen-closing" maxlength="220"></label>
    </div>
    <div class="director-timer"><label>Break countdown seconds<input type="number" id="screen-duration" min="1" max="3600" value="60"></label><label class="check-label"><input type="checkbox" id="screen-timer-visible" checked>Show break countdown</label><button type="button" id="screen-timer-start">Start / resume countdown</button><button type="button" id="screen-timer-pause">Pause countdown</button><button type="button" id="screen-timer-reset">Reset countdown</button><span class="director-help" id="live-timer">60s · paused</span></div>
    <p class="director-status" id="director-status" role="status" aria-live="polite"></p>
    <section class="director-roster"><h3>Contestants <span class="director-count" id="roster-count"></span></h3><p class="director-help">Paste one contestant per line: <strong>Name | Grade / class | Number</strong>. Tabs copied from a spreadsheet also work. Numbers are identifiers and never appear on the competition board. Set lives per contestant below; leave blank to hide that contestant’s lives. Results never change lives automatically.</p><label>Contestant list<textarea id="roster-paste" placeholder="Isabella Martinez | Grade 5 | 1&#10;Santiago Lopez | Grade 6 | 2"></textarea></label><div class="director-actions"><button type="button" id="roster-add">Add pasted contestants</button><button type="button" id="roster-save">Publish contestant list</button><label>Lives for all<input type="number" id="lives-for-all" min="0" max="99" step="1" value="3"></label><button type="button" id="lives-set-all">Set lives for all in preview</button></div><div class="roster-scroll"><table class="roster-table"><thead><tr><th>Number</th><th>Name</th><th>Grade / class</th><th>Lives</th><th>Status</th><th>Podium</th><th>Remove</th></tr></thead><tbody id="roster-rows"></tbody></table></div><div class="director-actions roster-footer"><button type="button" id="roster-add-manual">Add contestant</button></div></section>
    <p class="director-help">Session code: <span id="broadcast-code" class="screen-code">—</span>. Use one show operator at a time. A stopped timer never declares a result. Judge votes never trigger an audience result.</p>`;
  document.querySelector(".control-shell").append(panel);
  const $ = id => document.getElementById(id);
  let sourceCode = "", broadcastCode = "", live = M.initial(), draft = M.initial();
  let busy = false, ready = false, sourceWord = "", sourceToken = "", generation = 0;
  let wordInfoKey = "", wordInfoPromise = null, retryInfoAt = 0, confirmedResult = null, pendingFeedback = null, liveResultToken = "";
  const frame = $("screen-preview");
  function status(message, error = false) { $("director-status").textContent = message; $("director-status").classList.toggle("error", error); }
  const storageKey = () => `bee-screen-draft:${sourceCode}`;
  function storeDraft() { try { localStorage.setItem(storageKey(), JSON.stringify(draft)); } catch { /* Cloud remains authoritative for the on-air scene. */ } }
  function readFields() {
    const roster = draft.contestants;
    draft = M.normalize({ ...draft, currentId: $("screen-current").value, round: $("screen-round").value,
      motion: $("screen-motion").value, result: $("screen-result").value, boardPage: Number($("screen-page").value) - 1,
      autoBoard: $("screen-auto").checked, showLives: $("screen-show-lives").checked,
      definition: M.maskWord($("screen-definition").value, sourceWord),
      example: M.maskWord($("screen-example").value, sourceWord), message: $("screen-message").value,
      closing: $("screen-closing").value, revealWord: draft.scene === "result" ? sourceWord : "",
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
    $("screen-show-lives").checked = draft.showLives;
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
      for (const key of ["number", "name", "group", "lives", "status", "place"]) {
        const td = document.createElement("td");
        const input = document.createElement(["status", "place"].includes(key) ? "select" : "input");
        input.setAttribute("aria-label", `${key} for ${row.name}`);
        if (key === "status") [["active", "In contention"], ["finalist", "Finalist"], ["eliminated", "Completed"]].forEach(([value, label]) => input.add(new Option(label, value)));
        if (key === "place") [[0, "Unassigned"], [1, "1st"], [2, "2nd"], [3, "3rd"]].forEach(([value, label]) => input.add(new Option(label, value)));
        input.value = row[key] ?? ""; input.className = `roster-${key}`;
        if (key === "lives") { input.type = "number"; input.min = "0"; input.max = "99"; input.step = "1"; input.placeholder = "Hidden"; }
        if (key === "name") input.maxLength = 80; if (key === "group") input.maxLength = 40; if (key === "number") input.maxLength = 8;
        input.addEventListener("change", () => {
          row[key] = key === "lives" ? (input.value === "" ? null : Math.floor(Math.min(99, Math.max(0, Number(input.value))))) : key === "place" ? Number(input.value) : input.value.trim();
          if (key === "place" && row.place) for (const other of draft.contestants) if (other.id !== row.id && other.place === row.place) other.place = 0;
          renderRoster(); preview();
        });
        td.append(input); tr.append(td);
      }
      const td = document.createElement("td"), remove = document.createElement("button");
      remove.type = "button"; remove.textContent = "×"; remove.setAttribute("aria-label", `Remove ${row.name}`);
      remove.addEventListener("click", () => { draft.contestants = draft.contestants.filter(item => item.id !== row.id); if (draft.currentId === row.id) draft.currentId = ""; renderRoster(); preview(); });
      td.append(remove); tr.append(td); tbody.append(tr);
    }
  }
  async function acceptSource(found) {
    if (!found || found.screenBroadcast) throw new Error("The word session is unavailable.");
    const key = JSON.stringify([found.wordToken, found.word, found.level, found.difficulty]);
    const changed = key !== wordInfoKey;
    if (changed) {
      wordInfoKey = key; wordInfoPromise = null; retryInfoAt = 0; confirmedResult = null; pendingFeedback = null; liveResultToken = "";
      sourceWord = String(found.word || ""); sourceToken = String(found.wordToken || "");
      // Clear stale information before starting the new word's asynchronous load.
      $("screen-definition").value = ""; $("screen-example").value = "";
      draft.definition = ""; draft.example = ""; draft.revealWord = "";
      draft.result = "pending"; $("screen-result").value = "pending";
      if (ready) preview();
    }
    if (!sourceWord) { $("screen-word-status").textContent = "Waiting for a word from Admin or Study."; return found; }
    if (!wordInfoPromise && Date.now() >= retryInfoAt) {
      const run = generation, word = sourceWord;
      $("screen-word-status").textContent = "Loading current word information automatically…";
      wordInfoPromise = Cloud.getWordInfo(found.level, found.difficulty, word).then(info => {
        if (run !== generation || key !== wordInfoKey) return;
        draft.definition = M.maskWord($("screen-definition").value || info?.definition || "", word);
        draft.example = M.maskWord($("screen-example").value || info?.example || "", word);
        $("screen-definition").value = draft.definition; $("screen-example").value = draft.example;
        $("screen-word-status").textContent = info ? "Current word information loaded automatically. Target spelling is masked." : "No saved information for this word. Enter a definition or example manually.";
        if (ready) preview();
      }).catch(() => {
        if (run !== generation || key !== wordInfoKey) return;
        wordInfoPromise = null; retryInfoAt = Date.now() + 5000;
        $("screen-word-status").textContent = "Word information unavailable. Retrying automatically; you can also enter it manually.";
      });
    }
    await wordInfoPromise;
    return found;
  }
  async function refreshSource() {
    const found = await (window.getSpellingWordSnapshot ? window.getSpellingWordSnapshot(sourceCode) : Cloud.fetchPresenter(sourceCode));
    return acceptSource(found);
  }
  function setBusy(value) {
    busy = value;
    for (const id of ["screen-take", "screen-standby", "roster-save", "screen-timer-start", "screen-timer-pause", "screen-timer-reset"]) $(id).disabled = value || !ready;
    if (!value && pendingFeedback) setTimeout(flushFeedback, 0);
  }
  async function publish(next, message, fromTake = false, button = null) {
    if (!ready || (busy && !fromTake)) return;
    const resultToken = sourceToken;
    setBusy(true); status("Sending to audience screen…");
    window.BeeButtons?.set(button, "saving", "Publishing…", Boolean(button));
    try {
      const latest = await Cloud.fetchPresenter(broadcastCode);
      if (latest && !latest.screenBroadcast) throw new Error("This screen code is already in use by a word session. No changes were saved.");
      if (latest?.broadcast && Number(latest.broadcast.revision) !== live.revision) {
        live = M.normalize(latest.broadcast);
        throw new Error("Another operator changed the screen. The live cue was refreshed; review your preview and try again.");
      }
      const outgoing = M.normalize({ ...next, revision: live.revision + 1 });
      const saved = await Cloud.writeState({ sessionCode: broadcastCode, role: "presenter", state: { screenBroadcast: true, broadcast: outgoing } });
      if (!saved.session?.screenBroadcast) throw new Error("The backend did not acknowledge the broadcast.");
      live = M.normalize(saved.session.broadcast);
      if (fromTake || live.scene !== "result") liveResultToken = live.scene === "result" && live.revealWord === sourceWord && resultToken === sourceToken ? resultToken : "";
      $("director-live").textContent = `ON AIR · ${M.scenes.find(([key]) => key === live.scene)?.[1]}`;
      preview(); status(message);
      window.BeeButtons?.set(button, "saved", "Published", Boolean(button));
    } catch (error) {
      status(`Not published: ${error.message}`, true);
      window.BeeButtons?.set(button, "error", "Not published · try again", Boolean(button));
    }
    finally { setBusy(false); }
  }
  async function take() {
    if (busy || !ready) return;
    setBusy(true);
    status("Preparing scene and checking the current word…");
    window.BeeButtons?.set($("screen-take"), "saving", "Preparing scene…");
    try {
      const before = sourceToken;
      await refreshSource();
      if (before !== sourceToken && ["definition", "example", "result"].includes(draft.scene)) { preview(); throw new Error("The session changed words. Review the automatically loaded information and take the scene again."); }
      readFields();
      if (["spelling", "definition", "example", "pending"].includes(draft.scene) && !draft.currentId) throw new Error("Select the contestant first.");
      if (draft.scene === "result" && !sourceWord) throw new Error("Call a word in Admin or Study before revealing it.");
      if (["definition", "example"].includes(draft.scene) && !draft[draft.scene]) throw new Error("No information is available yet. Enter the word information manually or wait for the automatic load.");
      if (draft.contestants.some(row => !row.name.trim())) throw new Error("Every contestant needs a name.");
      const next = { ...draft, cueId: crypto.randomUUID(), timer: { ...live.timer, visible: draft.timer.visible, duration: draft.timer.duration } };
      if (["pending", "result"].includes(next.scene)) next.timer = { ...next.timer, remaining: M.remaining(live.timer), running: false };
      if (next.currentId !== live.currentId) next.timer = { ...next.timer, remaining: draft.timer.duration, running: false };
      await publish(next, "Scene is live. Results and lives remain under your control.", true, $("screen-take"));
    } catch (error) { status(error.message, true); window.BeeButtons?.set($("screen-take"), "error", error.message); }
    finally { setBusy(false); }
  }
  async function initialize(code) {
    const run = ++generation; sourceCode = code; ready = false;
    wordInfoKey = ""; wordInfoPromise = null; confirmedResult = null; pendingFeedback = null; liveResultToken = ""; setBusy(false);
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
      $("open-screen").href = `screen.html?session=${sourceCode}`;
      $("broadcast-code").textContent = sourceCode;
      $("director-live").textContent = `ON AIR · ${M.scenes.find(([key]) => key === live.scene)?.[1]}`;
      fillFields(); setBusy(false); status("Screen connected. Open the audience screen on the stage display.");
    } catch (error) { ready = false; setBusy(false); status(error.message + " Reconnect to the word session to retry.", true); }
  }
  for (const [key, label] of M.scenes) {
    const button = document.createElement("button"); button.type = "button"; button.textContent = label; button.dataset.scene = key;
    button.addEventListener("click", () => { draft.scene = key; $("screen-result").value = key === "result" && confirmedResult?.wordToken === sourceToken ? confirmedResult.verdict : "pending"; preview(); });
    $("screen-scenes").append(button);
  }
  frame.addEventListener("load", preview);
  panel.querySelectorAll(".director-fields input,.director-fields select,.director-fields textarea,#screen-duration,#screen-timer-visible").forEach(input => input.addEventListener("input", preview));
  $("screen-current").addEventListener("change", () => { draft.result = "pending"; $("screen-result").value = "pending"; confirmedResult = null; preview(); });
  $("screen-take").addEventListener("click", take);
  $("screen-standby").addEventListener("click", () => publish({ ...live, scene: "standby", revealWord: "", cueId: crypto.randomUUID(), timer: { ...live.timer, remaining: M.remaining(live.timer), running: false } }, "Standby is live.", false, $("screen-standby")));
  $("roster-add").addEventListener("click", () => { try { readFields(); const added = M.parseRoster($("roster-paste").value, draft.contestants); if (!added.length) throw new Error("Paste at least one contestant."); draft.contestants.push(...added); $("roster-paste").value = ""; renderRoster(); preview(); status(`Added ${added.length} contestants to preview. Publish the list when ready.`); } catch (error) { status(error.message, true); } });
  $("roster-add-manual").addEventListener("click", () => {
    readFields();
    if (draft.contestants.length >= 200) return status("Use no more than 200 contestants.", true);
    const numbers = new Set(draft.contestants.map(row => row.number));
    let number = 1; while (numbers.has(String(number))) number += 1;
    draft.contestants.push({ id: `speller-${crypto.randomUUID()}`, name: "", group: "", number: String(number), status: "active", place: 0, lives: null });
    renderRoster(); preview();
    const input = $("roster-rows").lastElementChild.querySelector(".roster-name");
    input.focus(); input.scrollIntoView({ block: "nearest" });
    status("Enter the contestant’s name and details, then publish the list when ready.");
  });
  $("roster-save").addEventListener("click", () => { readFields(); if (draft.contestants.some(row => !row.name)) return status("Every contestant needs a name.", true); const currentId = draft.contestants.some(row => row.id === live.currentId) ? live.currentId : ""; publish({ ...live, contestants: draft.contestants, showLives: draft.showLives, currentId, revealWord: currentId ? live.revealWord : "" }, "Contestant list published.", false, $("roster-save")); });
  $("lives-set-all").addEventListener("click", () => {
    const value = $("lives-for-all").value;
    const amount = Number(value);
    if (value === "" || !Number.isInteger(amount) || amount < 0 || amount > 99) return status("Enter a whole number of lives from 0 to 99.", true);
    readFields(); draft.contestants.forEach(row => { row.lives = amount; });
    renderRoster(); preview(); status("Lives updated in preview. Publish the contestant list when ready.");
  });
  $("next-speller").addEventListener("click", () => { readFields(); const rows = draft.contestants.filter(row => row.status !== "eliminated" && row.name.trim()); if (!rows.length) return status("No contestants available to prepare."); const index = rows.findIndex(row => row.id === draft.currentId); draft.currentId = rows[(index + 1) % rows.length].id; draft.scene = "spelling"; draft.result = "pending"; fillFields(); status("Next contestant prepared. Review and take live."); });
  window.addEventListener("spelling-presenter-updated", event => {
    if (ready && event.detail.sessionCode === sourceCode) acceptSource(event.detail.presenter).catch(() => {});
  });
  function flushFeedback() {
    if (busy || !ready || !pendingFeedback) return;
    const feedback = pendingFeedback; pendingFeedback = null;
    if (feedback.wordToken !== sourceToken || liveResultToken !== sourceToken || live.scene !== "result" || live.revealWord !== feedback.word) return;
    publish({ ...live, result: feedback.verdict }, "Confirmed result is live.");
  }
  window.addEventListener("spelling-feedback-confirmed", event => {
    const feedback = event.detail;
    if (!ready || feedback.sessionCode !== sourceCode || feedback.wordToken !== sourceToken || feedback.word !== sourceWord || !["correct", "incorrect"].includes(feedback.verdict)) return;
    confirmedResult = feedback; $("screen-result").value = feedback.verdict; preview();
    pendingFeedback = feedback; flushFeedback();
  });
  for (const action of ["start", "pause", "reset"]) $("screen-timer-" + action).addEventListener("click", () => {
    readFields(); const left = M.remaining(live.timer);
    const seconds = action === "reset" || (action === "start" && left === 0) ? draft.timer.duration : left;
    const timer = { duration: draft.timer.duration, remaining: seconds, endsAt: action === "start" ? Date.now() + seconds * 1000 : 0, running: action === "start", visible: draft.timer.visible };
    publish({ ...live, timer }, `Live timer ${action === "start" ? "running" : action === "pause" ? "paused" : "reset"}.`, false, $("screen-timer-" + action));
  });
  setInterval(() => { $("live-timer").textContent = `${M.remaining(live.timer)}s · ${live.timer.running && M.remaining(live.timer) ? "running" : "paused"}`; }, 250);
  window.addEventListener("spelling-session-joined", event => initialize(event.detail.sessionCode));
  setBusy(false);
})();

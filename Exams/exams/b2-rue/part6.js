"use strict";
/* ==============================================
     Brighton English School
     Made by: David Santana
============================================== */

window.PartRenderers = window.PartRenderers || {};

window.PartRenderers.part6 = {
  render(part, state, helpers) {
    const activeQ = helpers.getCurrentQuestionNumber();
    const used = new Set(part.items.map(item => helpers.getAnswer(part.id, item.q)).filter(Boolean));
    const article = part.paragraphs.map(block => {
      if (block.text) return `<p>${helpers.escape(block.text)}</p>`;
      const optionId = helpers.getAnswer(part.id, block.gap);
      const option = part.options.find(opt => opt.id === optionId);
      return `
        <div class="drop-zone ${option ? "filled" : ""} ${activeQ === block.gap ? "active" : ""}" data-gap-q="${block.gap}" tabindex="0" aria-label="Gap ${block.gap}">
          ${option ? `<div><strong>${block.gap}. ${helpers.escape(option.id)}</strong> ${helpers.escape(option.text)}<br><small>Click to remove this sentence.</small></div>` : `<strong>${block.gap}</strong>`}
        </div>
      `;
    }).join("");

    const options = part.options.filter(opt => !used.has(opt.id)).map(opt => `
      <div class="sentence-card ${state.selectedOption === opt.id ? "selected" : ""}" draggable="true" data-option-id="${opt.id}" tabindex="0">
        <strong>${helpers.escape(opt.id)}</strong> ${helpers.escape(opt.text)}
      </div>
    `).join("");

    return `
      <section class="exam-panel part-six">
        ${helpers.partHeader(part)}
        ${helpers.instruction(part.instruction)}
        <div class="split-grid" style="--left: ${state.layout.part6Left || 58}%" data-resizable="part6">
          <article class="split-column">
            <div class="reading-text">
              <h3>${helpers.escape(part.articleTitle)}</h3>
                  ${article}
            </div>
          </article>
          <div class="split-divider" data-divider="part6" role="separator" aria-orientation="vertical" tabindex="0"></div>
          <aside class="split-column">
            <div class="side-list">
              <h3>Sentence options</h3>
              <p class="muted-text">Drag a sentence into a gap. Or click a sentence, then click a gap.</p>
              ${options || `<p class="muted-text">All sentence cards are currently placed.</p>`}
            </div>
          </aside>
        </div>
      </section>
    `;
  },

  afterRender(part, state, helpers) {
    let draggedId = null;
    const columns = document.querySelectorAll(".part-six .split-column");
    if (columns[0] && Number.isFinite(state.scroll.part6LeftColumn)) columns[0].scrollTop = state.scroll.part6LeftColumn;
    if (columns[1] && Number.isFinite(state.scroll.part6RightColumn)) columns[1].scrollTop = state.scroll.part6RightColumn;
    columns.forEach((column, index) => {
      column.addEventListener("scroll", () => {
        if (index === 0) state.scroll.part6LeftColumn = column.scrollTop;
        if (index === 1) state.scroll.part6RightColumn = column.scrollTop;
        helpers.saveOnly();
      });
    });


    document.querySelectorAll(".sentence-card[data-option-id]").forEach(card => {
      card.addEventListener("dragstart", event => {
        draggedId = card.dataset.optionId;
        event.dataTransfer.setData("text/plain", draggedId);
        event.dataTransfer.effectAllowed = "move";
      });
      card.addEventListener("click", () => {
        state.selectedOption = state.selectedOption === card.dataset.optionId ? null : card.dataset.optionId;
        helpers.saveOnly();
        helpers.render();
      });
      card.addEventListener("keydown", event => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          card.click();
        }
      });
    });

    document.querySelectorAll(".drop-zone[data-gap-q]").forEach(zone => {
      zone.addEventListener("dragover", event => {
        event.preventDefault();
        zone.classList.add("drag-over");
      });
      zone.addEventListener("dragleave", () => zone.classList.remove("drag-over"));
      zone.addEventListener("drop", event => {
        event.preventDefault();
        zone.classList.remove("drag-over");
        const optionId = event.dataTransfer.getData("text/plain") || draggedId;
        placeOption(Number(zone.dataset.gapQ), optionId);
      });
      zone.addEventListener("click", () => {
        const q = Number(zone.dataset.gapQ);
        helpers.goToQuestion(q, { render: false });
        const current = helpers.getAnswer(part.id, q);
        if (current && !state.selectedOption) {
          helpers.setAnswer(part.id, q, "");
          return;
        }
        if (state.selectedOption) placeOption(q, state.selectedOption);
      });
      zone.addEventListener("keydown", event => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          zone.click();
        }
      });
    });

    helpers.attachDivider("part6", ".split-grid[data-resizable='part6']", "part6Left");

    /* ---------------------------------------------- 
    PLACE OPTION 
    ---------------------------------------------- */
    function placeOption(q, optionId) {
      if (!optionId) return;
      part.items.forEach(item => {
        if (item.q !== q && helpers.getAnswer(part.id, item.q) === optionId) {
          helpers.setAnswer(part.id, item.q, "", { render: false });
        }
      });
      const columns = document.querySelectorAll(".part-six .split-column");
      if (columns[0]) state.scroll.part6LeftColumn = columns[0].scrollTop;
      if (columns[1]) state.scroll.part6RightColumn = columns[1].scrollTop;
      state.selectedOption = null;
      helpers.setAnswer(part.id, q, optionId);
    }
  }
};

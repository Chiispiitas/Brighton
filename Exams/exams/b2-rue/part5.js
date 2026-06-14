"use strict";
/* ==============================================
     Brighton English School
     Made by: David Santana
============================================== */

window.PartRenderers = window.PartRenderers || {};

window.PartRenderers.part5 = {
  render(part, state, helpers) {
    const activeQ = helpers.getCurrentQuestionNumber();
    const text = part.text.map(p => `<p>${helpers.escape(p)}</p>`).join("");
    const questions = part.items.map(item => {
      const selected = helpers.getAnswer(part.id, item.q);
      const options = Object.entries(item.options).map(([letter, text]) => `
        <label class="radio-row ${selected === letter ? "selected" : ""}">
          <input type="radio" name="q${item.q}" value="${letter}" ${selected === letter ? "checked" : ""} />
          <span><strong>${letter}</strong> ${helpers.escape(text)}</span>
        </label>
      `).join("");
      return `
        <article class="question-card ${activeQ === item.q ? "active" : ""}" data-card-q="${item.q}">
          <h4><span class="q-badge">${item.q}</span> ${helpers.escape(item.stem)}</h4>
          <div class="radio-group" data-q="${item.q}">${options}</div>
        </article>
      `;
    }).join("");

    return `
      <section class="exam-panel part-five">
        ${helpers.partHeader(part)}
        ${helpers.instruction(part.instruction)}
        <div class="split-grid" style="--left: ${state.layout.part5Left || 54}%" data-resizable="part5">
          <article class="split-column">
            <div class="reading-text">
              <h3>${helpers.escape(part.articleTitle)}</h3>
                  ${text}
            </div>
          </article>
          <div class="split-divider" data-divider="part5" role="separator" aria-orientation="vertical" tabindex="0"></div>
          <aside class="split-column">
            <div class="question-stack">${questions}</div>
          </aside>
        </div>
      </section>
    `;
  },

  afterRender(part, state, helpers) {
    document.querySelectorAll(".radio-group").forEach(group => {
      group.addEventListener("change", event => {
        const q = Number(group.dataset.q);
        helpers.goToQuestion(q, { render: false });
        helpers.setAnswer(part.id, q, event.target.value, { render: false });
      });
    });
    document.querySelectorAll(".question-card[data-card-q]").forEach(card => {
      card.addEventListener("click", event => {
        if (!event.target.matches("input")) helpers.goToQuestion(Number(card.dataset.cardQ), { render: false });
      });
    });
    helpers.attachDivider("part5", ".split-grid[data-resizable='part5']", "part5Left");
  }
};

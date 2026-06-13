window.PartRenderers = window.PartRenderers || {};

window.PartRenderers.part4 = {
  render(part, state, helpers) {
    const activeQ = helpers.getCurrentQuestionNumber();
    const cards = part.items.map(item => {
      const value = helpers.getAnswer(part.id, item.q) || "";
      const count = helpers.countWords(value);
      let warning = "";
      if (value.trim()) {
        warning = count < 2 || count > 5
          ? `<div class="word-warning">${count} word${count === 1 ? "" : "s"}. Use between two and five words.</div>`
          : `<div class="word-ok">${count} words. Word count is within the required range.</div>`;
      }
      const widthCh = Math.min(42, Math.max(16, value.length + 3));
      return `
        <article class="transform-card ${activeQ === item.q ? "active" : ""}" data-card-q="${item.q}">
          <div class="transform-head">
            <span class="q-badge">${item.q}</span>
          </div>
          <p class="transform-first">${helpers.escape(item.first)}</p>
          <div class="keyword-under"><strong>${helpers.escape(item.keyword)}</strong></div>
          <p class="transform-second">
            ${helpers.escape(item.secondBefore)}
            <input class="transform-input auto-width-input" data-q="${item.q}" value="${helpers.escapeAttr(value)}" style="width:${widthCh}ch" aria-label="Question ${item.q}" autocomplete="off" spellcheck="false" />
            ${helpers.escape(item.secondAfter)}
          </p>
          <p class="muted-text">${helpers.escape(item.note)}</p>
          ${warning}
        </article>
      `;
    }).join("");

    return `
      <section class="exam-panel part-four">
        ${helpers.partHeader(part)}
        ${helpers.instruction(part.instruction)}
        <div class="transform-list">${cards}</div>
      </section>
    `;
  },

  afterRender(part, state, helpers) {
    document.querySelectorAll(".transform-input[data-q]").forEach(input => {
      const resize = () => {
        input.style.width = `${Math.min(42, Math.max(16, input.value.length + 3))}ch`;
      };
      input.addEventListener("focus", () => helpers.goToQuestion(Number(input.dataset.q), { render: false }));
      input.addEventListener("input", () => {
        resize();
        helpers.setAnswer(part.id, Number(input.dataset.q), input.value, { render: false });
      });
      resize();
    });
    const active = document.querySelector(`.transform-input[data-q="${helpers.getCurrentQuestionNumber()}"]`);
    if (active) {
      active.scrollIntoView({ behavior: "smooth", block: "center" });
      setTimeout(() => active.focus({ preventScroll: true }), 40);
    }
  }
};

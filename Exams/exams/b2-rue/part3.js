window.PartRenderers = window.PartRenderers || {};

window.PartRenderers.part3 = {
  render(part, state, helpers) {
    const activeQ = helpers.getCurrentQuestionNumber();
    const rootByQuestion = Object.fromEntries(part.items.map(item => [item.q, item.root]));
    const passage = part.text.map(chunk => {
      if (chunk.type === "text") return helpers.escape(chunk.value);
      const value = helpers.getAnswer(part.id, chunk.q) || "";
      const root = rootByQuestion[chunk.q] || "";
      return `<span class="inline-keyword-wrap" data-root="${helpers.escapeAttr(root)}"><input class="inline-input ${activeQ === chunk.q ? "active" : ""}" data-q="${chunk.q}" value="${helpers.escapeAttr(value)}" placeholder="${chunk.q}" maxlength="32" aria-label="Question ${chunk.q}" /></span>`;
    }).join("");

    const keywords = part.items.map(item => `
      <button class="keyword-item ${activeQ === item.q ? "active" : ""}" data-keyword-q="${item.q}">
        <span>${item.q}</span><span class="keyword-root">${helpers.escape(item.root)}</span>
      </button>
    `).join("");

    return `
      <section class="exam-panel part-three">
        ${helpers.partHeader(part)}
        ${helpers.instruction(part.instruction)}
        <div class="word-formation-grid">
          <article class="article-card">
            <h3>${helpers.escape(part.articleTitle)}</h3>
              <p>${passage}</p>
          </article>
          <aside class="keyword-list" aria-label="Keyword list">
            <h3>Words given</h3>
            ${keywords}
          </aside>
        </div>
      </section>
    `;
  },

  afterRender(part, state, helpers) {
    const syncActive = q => {
      document.querySelectorAll(".inline-input[data-q]").forEach(el => el.classList.toggle("active", Number(el.dataset.q) === q));
      document.querySelectorAll("[data-keyword-q]").forEach(el => el.classList.toggle("active", Number(el.dataset.keywordQ) === q));
    };
    document.querySelectorAll(".inline-input[data-q]").forEach(input => {
      input.addEventListener("focus", () => {
        const q = Number(input.dataset.q);
        helpers.goToQuestion(q, { render: false });
        syncActive(q);
      });
      input.addEventListener("input", () => helpers.setAnswer(part.id, Number(input.dataset.q), input.value.trim(), { render: false }));
    });
    document.querySelectorAll("[data-keyword-q]").forEach(button => {
      button.addEventListener("click", () => helpers.goToQuestion(Number(button.dataset.keywordQ)));
    });
    const active = document.querySelector(`.inline-input[data-q="${helpers.getCurrentQuestionNumber()}"]`);
    if (active) {
      active.scrollIntoView({ behavior: "smooth", block: "center" });
      setTimeout(() => active.focus({ preventScroll: true }), 40);
    }
  }
};

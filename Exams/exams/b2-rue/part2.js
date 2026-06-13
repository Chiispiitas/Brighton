window.PartRenderers = window.PartRenderers || {};

window.PartRenderers.part2 = {
  render(part, state, helpers) {
    const activeQ = helpers.getCurrentQuestionNumber();
    const passage = part.text.map(chunk => {
      if (chunk.type === "text") return helpers.escape(chunk.value);
      const value = helpers.getAnswer(part.id, chunk.q) || "";
      return `<input class="inline-input ${activeQ === chunk.q ? "active" : ""}" data-q="${chunk.q}" value="${helpers.escapeAttr(value)}" placeholder="${chunk.q}" maxlength="24" aria-label="Question ${chunk.q}" />`;
    }).join("");

    return `
      <section class="exam-panel part-two">
        ${helpers.partHeader(part)}
        ${helpers.instruction(part.instruction)}
        <article class="article-card">
          <h3>${helpers.escape(part.articleTitle)}</h3>
          <p>${passage}</p>
        </article>
      </section>
    `;
  },

  afterRender(part, state, helpers) {
    document.querySelectorAll(".inline-input[data-q]").forEach(input => {
      input.addEventListener("focus", () => helpers.goToQuestion(Number(input.dataset.q), { render: false }));
      input.addEventListener("input", () => helpers.setAnswer(part.id, Number(input.dataset.q), input.value.trim(), { render: false }));
    });
    const active = document.querySelector(`.inline-input[data-q="${helpers.getCurrentQuestionNumber()}"]`);
    if (active) {
      active.scrollIntoView({ behavior: "smooth", block: "center" });
      setTimeout(() => active.focus({ preventScroll: true }), 40);
    }
  }
};

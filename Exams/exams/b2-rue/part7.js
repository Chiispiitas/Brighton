window.PartRenderers = window.PartRenderers || {};

window.PartRenderers.part7 = {
  render(part, state, helpers) {
    const activeQ = helpers.getCurrentQuestionNumber();
    const texts = part.texts.map(text => `
      <article class="person-text">
        <h3>${helpers.escape(text.name)} — ${helpers.escape(text.heading)}</h3>
        <p>${helpers.escape(text.text)}</p>
      </article>
    `).join("");

    const questions = part.items.map(item => {
      const selected = helpers.getAnswer(part.id, item.q);
      const options = part.texts.map(text => `
        <label class="match-row ${selected === text.id ? "selected" : ""}">
          <input type="radio" name="q${item.q}" value="${text.id}" ${selected === text.id ? "checked" : ""} />
          <span>${helpers.escape(text.name)}</span>
        </label>
      `).join("");
      return `
        <article class="question-card ${activeQ === item.q ? "active" : ""}" data-card-q="${item.q}">
          <h4><span class="q-badge">${item.q}</span> ${helpers.escape(item.statement)}</h4>
          <div class="match-group" data-q="${item.q}">${options}</div>
        </article>
      `;
    }).join("");

    return `
      <section class="exam-panel part-seven">
        ${helpers.partHeader(part)}
        ${helpers.instruction(part.instruction)}
        <div class="split-two">
          <section class="white-card split-column">
            <h3>${helpers.escape(part.articleTitle)}</h3>
            <div class="texts-list">${texts}</div>
          </section>
          <aside class="question-stack part-seven-questions split-column">${questions}</aside>
        </div>
      </section>
    `;
  },

  afterRender(part, state, helpers) {
    document.querySelectorAll(".match-group").forEach(group => {
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
  }
};

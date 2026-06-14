"use strict";
/* ==============================================
     Brighton English School
     Made by: David Santana
============================================== */

window.PartRenderers = window.PartRenderers || {};

window.PartRenderers.part1 = {
  render(part, state, helpers) {
    const activeQ = helpers.getCurrentQuestionNumber();
    const passage = part.text.map(chunk => {
      if (chunk.type === "text") return helpers.escape(chunk.value);
      const answer = helpers.getAnswer(part.id, chunk.q);
      const item = part.items.find(i => i.q === chunk.q);
      const display = answer ? item.options[answer] : "";
      const classes = ["cloze-gap"];
      if (answer) classes.push("answered");
      if (activeQ === chunk.q) classes.push("active");
      return `<button class="${classes.join(" ")}" data-gap="${chunk.q}" aria-label="Question ${chunk.q}, ${answer ? "answered" : "unanswered"}"><span class="gap-number">${chunk.q}</span>${display ? `<span class="gap-answer">${helpers.escape(display)}</span>` : ""}</button>`;
    }).join("");

    return `
      <section class="exam-panel part-one">
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
    document.querySelectorAll(".cloze-gap").forEach(btn => {
      btn.addEventListener("click", event => {
        event.stopPropagation();
        const q = Number(btn.dataset.gap);
        helpers.goToQuestion(q, { render: false });
        openPanel(btn, q, part, helpers);
      });
    });

    const active = document.querySelector(`.cloze-gap[data-gap="${helpers.getCurrentQuestionNumber()}"]`);
    if (active) active.scrollIntoView({ behavior: "smooth", block: "center", inline: "center" });

    /* ---------------------------------------------- 
    OPEN PANEL 
    ---------------------------------------------- */
    function openPanel(anchor, q, partData, helpers) {
      closePanel();
      const item = partData.items.find(i => i.q === q);
      const selected = helpers.getAnswer(partData.id, q);
      const panel = document.createElement("div");
      panel.className = "choice-popover";
      panel.setAttribute("role", "dialog");
      panel.innerHTML = `
        <div class="popover-title">Question ${q}</div>
        <div class="popover-options">
          ${Object.entries(item.options).map(([letter, text]) => `
            <button class="option-btn ${selected === letter ? "selected" : ""}" data-choice="${letter}">
              ${helpers.escape(text)}
            </button>
          `).join("")}
        </div>
        <button class="clear-choice" data-clear="true">Clear answer</button>
      `;
      document.body.appendChild(panel);
      const rect = anchor.getBoundingClientRect();
      const panelRect = panel.getBoundingClientRect();
      const top = Math.max(10, rect.top - panelRect.height - 14);
      const left = Math.min(window.innerWidth - panelRect.width - 12, Math.max(12, rect.left));
      panel.style.top = `${top}px`;
      panel.style.left = `${left}px`;

      panel.addEventListener("click", event => {
        event.stopPropagation();
        const choiceBtn = event.target.closest("[data-choice]");
        const clearBtn = event.target.closest("[data-clear]");
        if (choiceBtn) {
          helpers.setAnswer(partData.id, q, choiceBtn.dataset.choice);
          closePanel();
        }
        if (clearBtn) {
          helpers.setAnswer(partData.id, q, "");
          closePanel();
        }
      });

      setTimeout(() => document.addEventListener("click", closePanel, { once: true }), 0);
    }

    /* ---------------------------------------------- 
    CLOSE PANEL 
    ---------------------------------------------- */
    function closePanel() {
      document.querySelectorAll(".choice-popover").forEach(el => el.remove());
    }
  }
};

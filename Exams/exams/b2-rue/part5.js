"use strict";
/* ==============================================
     Brighton English School
     Made by: David Santana
============================================== */

window.PartRenderers = window.PartRenderers || {};

function renderPart5Highlights(text, highlights, helpers) {
  let html = helpers.escape(text);

  (highlights || []).forEach(reference => {
    const value = typeof reference === "string" ? reference : reference?.text;
    if (!value) return;

    const escapedValue = helpers.escape(value);
    html = html.replace(
      escapedValue,
      `<mark class="source-reference-highlight">${escapedValue}</mark>`
    );
  });

  return html;
}

function renderPart5Paragraph(text, paragraphNumber, part, helpers) {
  const references = (part.sourceReferences || []).filter(reference =>
    Number(reference.paragraph) === paragraphNumber
  );

  const lineReference = references.find(reference => reference.type === "line");
  const regularHighlights = references.filter(reference => reference.type === "highlight");

  if (!lineReference?.text || !text.includes(lineReference.text)) {
    return `<p>${renderPart5Highlights(text, regularHighlights, helpers)}</p>`;
  }

  const lineStart = text.indexOf(lineReference.text);
  const before = text.slice(0, lineStart);
  const sourceLine = text.slice(lineStart, lineStart + lineReference.text.length);
  const after = text.slice(lineStart + lineReference.text.length);

  const beforeHtml = renderPart5Highlights(before, regularHighlights, helpers);
  const lineHtml = renderPart5Highlights(sourceLine, lineReference.highlights || [], helpers);
  const afterHtml = renderPart5Highlights(after, regularHighlights, helpers);
  const lineNumber = Number(lineReference.line);

  return `
    <p>
      ${beforeHtml}${Number.isFinite(lineNumber) ? `<sup class="source-line-number">${lineNumber}</sup>` : ""}
      <u class="source-line-reference">${lineHtml}</u>${afterHtml}
    </p>
  `;
}

window.PartRenderers.part5 = {
  render(part, state, helpers) {
    const activeQ = helpers.getCurrentQuestionNumber();
    const text = part.text
      .map((paragraph, index) => renderPart5Paragraph(paragraph, index + 1, part, helpers))
      .join("");

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
        if (!event.target.matches("input")) {
          helpers.goToQuestion(Number(card.dataset.cardQ), { render: false });
        }
      });
    });

    helpers.attachDivider("part5", ".split-grid[data-resizable='part5']", "part5Left");
  }
};

/* Read-only student-paper review. Uses the same question source as each test. */
(() => {
  const cache = new Map();
  const escape = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  function load(test) {
    if (cache.has(test.testId)) return cache.get(test.testId);
    const operation = new Promise((resolve, reject) => {
      const frame = document.createElement('iframe');
      frame.hidden = true;
      frame.setAttribute('sandbox', 'allow-scripts');
      frame.setAttribute('aria-hidden', 'true');
      const nonce = crypto.randomUUID();
      const script = new URL('test-data.js', new URL(test.relativeUrl, location.href));
      if (script.origin !== location.origin) return reject(new Error('Invalid test source.'));
      let timer;
      const finish = (error, data) => { clearTimeout(timer); window.removeEventListener('message', receive); frame.remove(); error ? reject(error) : resolve(data); };
      const receive = event => {
        if (event.source !== frame.contentWindow || event.data?.nonce !== nonce) return;
        const data = event.data.data;
        if (data?.testId !== test.testId || !Array.isArray(data.pages)) return finish(new Error('Test source could not be loaded.'));
        finish(null, data);
      };
      window.addEventListener('message', receive);
      timer = setTimeout(() => finish(new Error('Test source took too long to load.')), 15000);
      frame.srcdoc = `<script src="${escape(script.href)}"><\/script><script>parent.postMessage({nonce:${JSON.stringify(nonce)},data:window.BRIGHTON_TEST_DATA},'*')<\/script>`;
      document.body.append(frame);
    });
    cache.set(test.testId, operation);
    operation.catch(() => cache.delete(test.testId));
    return operation;
  }
  function render(data, details, key) {
    const byQuestion = new Map(details.map(item => [Number(item.question), item]));
    return `<div class="test-paper-review"><p class="paper-legend">✓ Correct answer · Your answer is labelled on each question. This review cannot change the submission.</p>${data.pages.map((page, index) => {
      const passage = page.passage;
      return `<section class="paper-page"><header><span class="eyebrow">Page ${index + 1}</span><h3>${escape(page.title || page.label)}</h3><p>${escape(page.instructions)}</p></header>
        ${passage ? `<article class="paper-passage"><h4>${escape(passage.title)}</h4>${passage.byline ? `<p>${escape(passage.byline)}</p>` : ''}${(passage.paragraphs || []).map(p => `<p>${escape(p)}</p>`).join('')}</article>` : ''}
        ${page.questions.map(question => {
          const detail = byQuestion.get(Number(question.q)) || {};
          const selected = String(detail.answer || '').trim().toUpperCase();
          const correct = (key.answers?.[question.q]?.answers || []).map(x => String(x).toUpperCase());
          const state = !selected ? 'Unanswered' : detail.correct ? 'Correct' : 'Incorrect';
          let options = question.options.map((text, i) => ({text, value:String.fromCharCode(65 + i)}));
          const order = ['true','false','not enough information'];
          if (options.length === 3 && order.every(text => options.some(o => o.text.trim().toLowerCase() === text))) options.sort((a,b) => order.indexOf(a.text.trim().toLowerCase()) - order.indexOf(b.text.trim().toLowerCase()));
          return `<article class="paper-question" data-review-question="${question.q}"><div class="paper-question-head"><strong class="paper-number">${question.q}</strong><p>${escape(question.text)}</p><span class="paper-state">${state}</span></div>${question.visual ? renderVisual(question.visual) : ''}<div class="paper-options">${options.map((option, i) => {
            const chosen = selected === option.value, right = correct.includes(option.value);
            return `<div class="paper-option ${right ? 'is-correct' : ''} ${chosen ? 'is-selected' : ''} ${chosen && !right ? 'is-wrong' : ''}" data-option-value="${option.value}"><strong>${String.fromCharCode(65+i)}</strong><span>${escape(option.text)}</span><span class="paper-option-label">${right ? '✓ Correct answer' : ''}${right && chosen ? ' · ' : ''}${chosen ? 'Your answer' : ''}</span></div>`;
          }).join('')}</div>${!selected ? '<p class="muted">No answer submitted.</p>' : ''}</article>`;
        }).join('')}</section>`;
    }).join('')}</div>`;
  }
  window.BrightonTestPaperReview = {load, render};
  function renderVisual(type) {
    if (type === "tablet") {
      return `<div class="question-visual" aria-label="Picture of a tablet">
        <svg viewBox="0 0 120 72" role="img" aria-hidden="true">
          <rect x="15" y="8" width="90" height="56" rx="7" fill="#32373f"/>
          <rect x="21" y="14" width="78" height="43" rx="3" fill="#dfe9ec"/>
          <rect x="27" y="20" width="31" height="18" rx="2" fill="#91b9bd"/>
          <rect x="62" y="20" width="31" height="5" rx="2" fill="#aeb7bd"/>
          <rect x="62" y="29" width="25" height="4" rx="2" fill="#c6cdd1"/>
          <circle cx="60" cy="60" r="2.3" fill="#d9dde0"/>
        </svg>
      </div>`;
    }
    if (type === "umbrella") {
      return `<div class="question-visual" aria-label="Picture of an umbrella">
        <svg viewBox="0 0 120 72" role="img" aria-hidden="true">
          <path d="M18 40 Q31 16 58 16 Q87 16 102 40 L18 40Z" fill="#4e555d"/>
          <path d="M18 40 Q29 29 39 40 Q49 29 59 40 Q70 29 80 40 Q91 29 102 40" fill="#3d444b"/>
          <path d="M59 17 V54 Q59 64 50 64 Q45 64 43 59" fill="none" stroke="#3d444b" stroke-width="4" stroke-linecap="round"/>
        </svg>
      </div>`;
    }
    return "";
  }


})();

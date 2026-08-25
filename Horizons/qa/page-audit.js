/* Horizons A1 — browser-side layout audit.
   Development only. Load this script explicitly when auditing HTML pages.
   It does not modify production content; it reports and annotates issues. */

(() => {
  const report = {
    errors: [],
    warnings: [],
    pages: 0,
    exercises: 0,
    placeholders: 0
  };

  const error = (code, message, element) => {
    report.errors.push({ code, message, element });
    if (element) element.classList.add('hz-qa-overflow');
  };

  const warn = (code, message, element) => {
    report.warnings.push({ code, message, element });
  };

  const pages = [...document.querySelectorAll('.hz-page')];
  report.pages = pages.length;

  // Duplicate IDs.
  const ids = new Map();
  document.querySelectorAll('[id]').forEach((el) => {
    if (!ids.has(el.id)) ids.set(el.id, []);
    ids.get(el.id).push(el);
  });
  ids.forEach((els, id) => {
    if (els.length > 1) error('duplicate-id', `Duplicate id: ${id}`, els[0]);
  });

  pages.forEach((page, pageIndex) => {
    const content = page.querySelector('.hz-page__content');
    if (content && (content.scrollHeight > content.clientHeight + 2 || content.scrollWidth > content.clientWidth + 2)) {
      error('page-overflow', `Page ${page.dataset.page || pageIndex + 1} overflows its fixed content frame.`, content);
    }

    const exercises = [...page.querySelectorAll('.hz-exercise')];
    report.exercises += exercises.length;

    // Exercise sequence should increase top-to-bottom within the page.
    const numbers = exercises.map((ex) => Number(ex.querySelector('.hz-exercise-number')?.textContent.trim())).filter(Number.isFinite);
    for (let i = 1; i < numbers.length; i += 1) {
      if (numbers[i] <= numbers[i - 1]) {
        error('exercise-order', `Exercise numbering is not increasing on page ${page.dataset.page || pageIndex + 1}.`, exercises[i]);
      }
    }

    // All sibling exercises should belong to a vertical lane, not a page-level grid.
    exercises.forEach((exercise) => {
      const lane = exercise.closest('.hz-exercises, .hz-exercise-flow');
      if (!lane) {
        error('exercise-lane', 'Numbered exercise is not inside .hz-exercises / .hz-exercise-flow.', exercise);
      }

      let parent = exercise.parentElement;
      while (parent && parent !== lane && parent !== page) {
        const style = getComputedStyle(parent);
        if (style.display === 'grid' && !parent.classList.contains('hz-exercise__body')) {
          warn('exercise-grid', 'Exercise is nested in a grid before reaching its vertical lane. Verify exercises are not side by side.', exercise);
          break;
        }
        parent = parent.parentElement;
      }
    });
  });

  // Image accessibility.
  document.querySelectorAll('img').forEach((img) => {
    if (!img.hasAttribute('alt')) {
      warn('missing-alt', `Image missing alt attribute: ${img.getAttribute('src') || '(no src)'}`, img);
    }
  });

  // Development placeholders should be resolved before final publication.
  const placeholders = [...document.querySelectorAll('.hz-photo-placeholder, .hz-media-placeholder')];
  report.placeholders = placeholders.length;
  placeholders.forEach((el) => warn('placeholder', 'Development image placeholder still present.', el));

  // Semantic production IDs: demos are ignored; production exercises should be stable.
  document.querySelectorAll('.hz-exercise[id]').forEach((exercise) => {
    if (!exercise.id.startsWith('DEMO-') && !/^HZN-A1-U\d{2}-L[A-D]-E\d{2}$/.test(exercise.id)) {
      warn('exercise-id-format', `Unexpected exercise ID format: ${exercise.id}`, exercise);
    }
  });

  // QR physical-size heuristic using CSS pixels (browser-dependent, so warning only).
  document.querySelectorAll('.hz-qr-slot').forEach((qr) => {
    const rect = qr.getBoundingClientRect();
    if (rect.width < 40 || rect.height < 40) {
      warn('qr-size', 'QR slot may be too small for reliable print scanning.', qr);
    }
  });

  window.HorizonsAudit = report;

  const summary = `[Horizons audit] ${report.pages} pages · ${report.exercises} exercises · ${report.errors.length} errors · ${report.warnings.length} warnings · ${report.placeholders} placeholders`;
  if (report.errors.length) console.error(summary, report);
  else if (report.warnings.length) console.warn(summary, report);
  else console.info(summary, report);
})();

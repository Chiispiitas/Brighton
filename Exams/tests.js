(() => {
  const levelMenu = document.getElementById('levelMenu');
  const unitMenu = document.getElementById('unitMenu');
  const levelButtons = Array.from(document.querySelectorAll('.test-level-button'));
  const unitCards = Array.from(document.querySelectorAll('.unit-test-card'));
  const backToLevels = document.getElementById('backToLevels');
  const selectedLevelLabel = document.getElementById('selectedLevelLabel');
  const pageTitle = document.getElementById('testsPageTitle');
  const pageIntro = document.getElementById('testsPageIntro');
  const toast = document.getElementById('testToast');
  const config = window.BRIGHTON_SITE_CONFIG || {};
  const tests = Array.isArray(config.FALLBACK_TESTS) ? config.FALLBACK_TESTS : [];

  let activeLevelButton = null;

  function openLevel(levelButton) {
    const level = String(levelButton.dataset.level || '').trim();
    if (!level) return;

    activeLevelButton = levelButton;
    levelMenu.hidden = true;
    unitMenu.hidden = false;

    selectedLevelLabel.textContent = `${level} level`;
    pageTitle.textContent = `${level} Tests`;
    pageIntro.textContent = 'Choose a unit test. You can open it, copy the student link, or go directly to its results.';

    renderUnitCards(level);
    backToLevels.focus({ preventScroll: true });
  }

  function closeLevel() {
    unitMenu.hidden = true;
    levelMenu.hidden = false;
    pageTitle.textContent = 'Choose your level';
    pageIntro.textContent = 'Select a CEFR level to continue to the available unit ranges.';

    if (activeLevelButton) activeLevelButton.focus({ preventScroll: true });
  }

  function renderUnitCards(level) {
    unitCards.forEach((card) => {
      const baseUnits = card.dataset.units || '';

      // Personal Best A1 has a Units 5–7 term test instead of Units 5–8,
      // and the book ends at Unit 10, so Units 9–12 does not apply to A1.
      const units = level === 'A1' && baseUnits === '5-8' ? '5-7' : baseUnits;
      const hiddenForLevel = level === 'A1' && baseUnits === '9-12';
      card.hidden = hiddenForLevel;
      if (hiddenForLevel) return;

      const test = findTest(level, units);
      card.className = 'unit-test-card';

      if (!test) {
        card.classList.add('coming-soon');
        card.innerHTML = `
          <div class="unit-test-card-head">
            <span class="tag status-tag">Coming soon</span>
            <span class="unit-test-level">${escapeHtml(level)}</span>
          </div>
          <div class="unit-test-card-copy">
            <p class="unit-test-kicker">Units</p>
            <h3>${escapeHtml(displayUnits(units))}</h3>
            <p class="muted">No test has been added for this unit range yet.</p>
          </div>
        `;
        return;
      }

      const studentUrl = resolveTestUrl(test);
      const resultsUrl = `test-results.html?testId=${encodeURIComponent(test.testId || '')}`;
      card.classList.add('available');
      card.innerHTML = `
        <div class="unit-test-card-head">
          <span class="tag">Available</span>
          <span class="unit-test-level">${escapeHtml(test.level || level)}</span>
        </div>
        <div class="unit-test-card-copy">
          <p class="unit-test-kicker">Units ${escapeHtml(displayUnits(test.unitRange || units))}</p>
          <h3>${escapeHtml(test.title || `${level} Units ${displayUnits(units)} Test`)}</h3>
          <p class="muted">${escapeHtml(test.description || 'Brighton digital unit test.')}</p>
        </div>
        <div class="unit-test-meta">
          <span class="tag">${Number(test.totalQuestions || 0)} questions</span>
          <span class="tag">${Number(test.maxScore || 0)} points</span>
        </div>
        <div class="unit-test-actions">
          <a class="primary-btn" href="${escapeAttr(studentUrl)}" target="_blank" rel="noopener">Open test</a>
          <button class="secondary-btn" type="button" data-copy-student-link="${escapeAttr(studentUrl)}">Copy student link</button>
          <a class="secondary-btn" href="${escapeAttr(resultsUrl)}">Results</a>
        </div>
      `;
    });

    bindCardActions();
  }

  function bindCardActions() {
    document.querySelectorAll('[data-copy-student-link]').forEach((button) => {
      button.addEventListener('click', async () => {
        const url = button.getAttribute('data-copy-student-link') || '';
        if (!url || url === '#') {
          showToast('Student link is not configured');
          return;
        }

        try {
          await navigator.clipboard.writeText(url);
          showToast('Student link copied');
        } catch {
          if (copyWithFallback(url)) showToast('Student link copied');
          else window.prompt('Copy this student link:', url);
        }
      });
    });
  }

  function findTest(level, units) {
    return tests.find((test) => test.level === level && test.unitRange === units && test.isActive !== false);
  }

  function resolveTestUrl(test) {
    const target = String(test.shareUrl || test.iframeUrl || test.relativeUrl || '').trim();
    if (!target) return '#';
    try {
      return new URL(target, window.location.href).href;
    } catch {
      return target;
    }
  }

  function copyWithFallback(text) {
    try {
      const input = document.createElement('textarea');
      input.value = text;
      input.setAttribute('readonly', '');
      input.style.position = 'fixed';
      input.style.opacity = '0';
      document.body.appendChild(input);
      input.select();
      const success = document.execCommand('copy');
      input.remove();
      return success;
    } catch {
      return false;
    }
  }

  function displayUnits(value) {
    return String(value || '').replace('-', '–');
  }

  function escapeHtml(value) {
    return String(value ?? '').replace(/[&<>\"]/g, (char) => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;'
    }[char]));
  }

  function escapeAttr(value) {
    return escapeHtml(value).replace(/'/g, '&#39;');
  }

  function showToast(message) {
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add('show');
    clearTimeout(showToast.timer);
    showToast.timer = setTimeout(() => toast.classList.remove('show'), 1800);
  }

  levelButtons.forEach((button) => button.addEventListener('click', () => openLevel(button)));
  backToLevels.addEventListener('click', closeLevel);
})();

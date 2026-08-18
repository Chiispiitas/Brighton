(() => {
  const levelMenu = document.getElementById('levelMenu');
  const unitMenu = document.getElementById('unitMenu');
  const levelButtons = Array.from(document.querySelectorAll('.test-level-button'));
  const unitButtons = Array.from(document.querySelectorAll('.unit-option-button'));
  const backToLevels = document.getElementById('backToLevels');
  const selectedLevelLabel = document.getElementById('selectedLevelLabel');
  const pageTitle = document.getElementById('testsPageTitle');
  const pageIntro = document.getElementById('testsPageIntro');
  const availabilityNote = document.getElementById('testAvailabilityNote');
  const config = window.BRIGHTON_SITE_CONFIG || {};
  const tests = Array.isArray(config.FALLBACK_TESTS) ? config.FALLBACK_TESTS : [];

  let activeLevelButton = null;

  function openLevel(levelButton) {
    const level = levelButton.dataset.level;
    if (!level) return;

    activeLevelButton = levelButton;
    levelMenu.hidden = true;
    unitMenu.hidden = false;

    selectedLevelLabel.textContent = `${level} level`;
    pageTitle.textContent = `${level} Tests`;
    pageIntro.textContent = 'Choose the unit range you want to open.';
    availabilityNote.textContent = '';

    unitButtons.forEach((button) => {
      const units = button.dataset.units;
      const available = Boolean(findTest(level, units));
      button.dataset.level = level;
      button.classList.toggle('available', available);
      button.classList.toggle('coming-soon', !available);
      button.setAttribute('aria-label', `${level} tests, Units ${units}${available ? '' : ', coming soon'}`);
    });

    backToLevels.focus({ preventScroll: true });
  }

  function closeLevel() {
    unitMenu.hidden = true;
    levelMenu.hidden = false;
    pageTitle.textContent = 'Choose your level';
    pageIntro.textContent = 'Select a CEFR level to continue to the available unit ranges.';
    availabilityNote.textContent = '';

    if (activeLevelButton) activeLevelButton.focus({ preventScroll: true });
  }

  function findTest(level, units) {
    return tests.find((test) => test.level === level && test.unitRange === units && test.isActive !== false);
  }

  function openUnit(button) {
    const level = button.dataset.level;
    const units = button.dataset.units;
    const test = findTest(level, units);

    if (!test) {
      availabilityNote.textContent = `${level} Units ${units.replace('-', '–')} is not available yet.`;
      return;
    }

    const target = String(test.relativeUrl || '').trim();
    if (!target) {
      availabilityNote.textContent = 'This test is configured but does not have a page yet.';
      return;
    }
    window.location.href = target;
  }

  levelButtons.forEach((button) => button.addEventListener('click', () => openLevel(button)));
  unitButtons.forEach((button) => button.addEventListener('click', () => openUnit(button)));
  backToLevels.addEventListener('click', closeLevel);
})();

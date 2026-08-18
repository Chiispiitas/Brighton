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
  const actionPanel = document.getElementById('testActionPanel');
  const selectedTestMeta = document.getElementById('selectedTestMeta');
  const selectedTestTitle = document.getElementById('selectedTestTitle');
  const selectedTestDescription = document.getElementById('selectedTestDescription');
  const copyStudentLinkBtn = document.getElementById('copyStudentLinkBtn');
  const openSelectedTestBtn = document.getElementById('openSelectedTestBtn');
  const toast = document.getElementById('testToast');
  const config = window.BRIGHTON_SITE_CONFIG || {};
  const tests = Array.isArray(config.FALLBACK_TESTS) ? config.FALLBACK_TESTS : [];

  let activeLevelButton = null;
  let selectedTest = null;
  let selectedUnitButton = null;

  function openLevel(levelButton) {
    const level = levelButton.dataset.level;
    if (!level) return;

    activeLevelButton = levelButton;
    selectedTest = null;
    selectedUnitButton = null;
    levelMenu.hidden = true;
    unitMenu.hidden = false;
    actionPanel.hidden = true;

    selectedLevelLabel.textContent = `${level} level`;
    pageTitle.textContent = `${level} Tests`;
    pageIntro.textContent = 'Choose the unit range you want to open.';
    availabilityNote.textContent = '';

    unitButtons.forEach((button) => {
      const units = button.dataset.units;
      const available = Boolean(findTest(level, units));
      button.dataset.level = level;
      button.classList.remove('selected');
      button.classList.toggle('available', available);
      button.classList.toggle('coming-soon', !available);
      button.setAttribute('aria-label', `${level} tests, Units ${units}${available ? '' : ', coming soon'}`);
    });

    backToLevels.focus({ preventScroll: true });
  }

  function closeLevel() {
    unitMenu.hidden = true;
    levelMenu.hidden = false;
    actionPanel.hidden = true;
    selectedTest = null;
    selectedUnitButton = null;
    pageTitle.textContent = 'Choose your level';
    pageIntro.textContent = 'Select a CEFR level to continue to the available unit ranges.';
    availabilityNote.textContent = '';

    unitButtons.forEach((button) => button.classList.remove('selected'));
    if (activeLevelButton) activeLevelButton.focus({ preventScroll: true });
  }

  function findTest(level, units) {
    return tests.find((test) => test.level === level && test.unitRange === units && test.isActive !== false);
  }

  function selectUnit(button) {
    const level = button.dataset.level;
    const units = button.dataset.units;
    const test = findTest(level, units);

    unitButtons.forEach((item) => item.classList.remove('selected'));

    if (!test) {
      selectedTest = null;
      selectedUnitButton = null;
      actionPanel.hidden = true;
      availabilityNote.textContent = `${level} Units ${displayUnits(units)} is not available yet.`;
      return;
    }

    const target = String(test.relativeUrl || '').trim();
    if (!target) {
      selectedTest = null;
      selectedUnitButton = null;
      actionPanel.hidden = true;
      availabilityNote.textContent = 'This test is configured but does not have a page yet.';
      return;
    }

    selectedTest = test;
    selectedUnitButton = button;
    button.classList.add('selected');
    availabilityNote.textContent = '';

    selectedTestMeta.textContent = `${test.level || level} · Units ${displayUnits(test.unitRange || units)}`;
    selectedTestTitle.textContent = test.title || `${level} Units ${displayUnits(units)} Test`;
    selectedTestDescription.textContent = test.description || 'Copy the student link before opening the test, or open it here for preview.';
    actionPanel.hidden = false;

    requestAnimationFrame(() => {
      actionPanel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    });
  }

  function getSelectedTestUrl() {
    if (!selectedTest) return '';
    const target = String(selectedTest.relativeUrl || '').trim();
    if (!target) return '';
    try {
      return new URL(target, window.location.href).href;
    } catch {
      return target;
    }
  }

  async function copyStudentLink() {
    const url = getSelectedTestUrl();
    if (!url) {
      showToast('Choose an available test first');
      return;
    }

    try {
      await navigator.clipboard.writeText(url);
      showToast('Student link copied');
    } catch {
      const copied = copyWithFallback(url);
      if (copied) showToast('Student link copied');
      else window.prompt('Copy this student link:', url);
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

  function openSelectedTest() {
    const url = getSelectedTestUrl();
    if (!url) {
      showToast('Choose an available test first');
      return;
    }
    window.location.href = url;
  }

  function displayUnits(value) {
    return String(value || '').replace('-', '–');
  }

  function showToast(message) {
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add('show');
    clearTimeout(showToast.timer);
    showToast.timer = setTimeout(() => toast.classList.remove('show'), 1800);
  }

  levelButtons.forEach((button) => button.addEventListener('click', () => openLevel(button)));
  unitButtons.forEach((button) => button.addEventListener('click', () => selectUnit(button)));
  backToLevels.addEventListener('click', closeLevel);
  copyStudentLinkBtn?.addEventListener('click', copyStudentLink);
  openSelectedTestBtn?.addEventListener('click', openSelectedTest);
})();

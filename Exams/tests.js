(() => {
  const levelMenu = document.getElementById('levelMenu');
  const unitMenu = document.getElementById('unitMenu');
  const levelButtons = Array.from(document.querySelectorAll('.test-level-button'));
  const unitButtons = Array.from(document.querySelectorAll('.unit-option-button'));
  const backToLevels = document.getElementById('backToLevels');
  const selectedLevelLabel = document.getElementById('selectedLevelLabel');
  const pageTitle = document.getElementById('testsPageTitle');
  const pageIntro = document.getElementById('testsPageIntro');

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

    unitButtons.forEach((button) => {
      button.dataset.level = level;
      button.setAttribute('aria-label', `${level} tests, Units ${button.dataset.units}`);
    });

    backToLevels.focus({ preventScroll: true });
  }

  function closeLevel() {
    unitMenu.hidden = true;
    levelMenu.hidden = false;
    pageTitle.textContent = 'Choose your level';
    pageIntro.textContent = 'Select a CEFR level to continue to the available unit ranges.';

    if (activeLevelButton) {
      activeLevelButton.focus({ preventScroll: true });
    }
  }

  levelButtons.forEach((button) => {
    button.addEventListener('click', () => openLevel(button));
  });

  backToLevels.addEventListener('click', closeLevel);
})();

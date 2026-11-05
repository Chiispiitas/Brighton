// Finite interface feedback. Never animate a character or a container holding one.
const reduced = matchMedia('(prefers-reduced-motion: reduce)');
const protectedArt = '.character,.avatar,[data-avatar-static]';
const running = new Set();
const ease = 'cubic-bezier(.2,.8,.2,1)';
export function animateUI(element, frames, options = {}) {
  if (!element || reduced.matches || element.closest(protectedArt) || element.querySelector(protectedArt)) return;
  const animation = element.animate(frames, {duration:280, easing:ease, ...options});
  running.add(animation);
  const release = () => running.delete(animation);
  animation.addEventListener('finish', release, {once:true});
  animation.addEventListener('cancel', release, {once:true});
  return animation;
}
reduced.addEventListener('change', () => {
  if (reduced.matches) for (const animation of running) animation.cancel();
});
function screen(root) {
  const question = root.querySelector('[data-question-id]');
  if (question) return 'question:' + question.dataset.questionId;
  if (root.querySelector('.game-page')) return 'game:' + root.querySelector('.activity-title')?.textContent;
  if (root.querySelector('.result-page')) return 'result';
  return root.querySelector('.app-shell') ? 'page:' + root.querySelector('.main-content')?.firstElementChild?.className : root.querySelector('.welcome') ? 'welcome' : 'boot';
}
function tokenPositions(root) {
  const positions = new Map();
  for (const button of root.querySelectorAll('[data-token]:not(:disabled),[data-remove-token]')) {
    positions.set(button.dataset.removeToken ?? button.dataset.token, {
      rect:button.getBoundingClientRect(), selected:button.hasAttribute('data-remove-token')
    });
  }
  return positions;
}
const keyedControls = '[data-memory],[data-match-left],[data-match-right],[data-choice],.chunk-option';
function controlKey(element) {
  for (const name of ['memory','matchLeft','matchRight','choice']) {
    if (element.dataset[name] !== undefined) return name + ':' + element.dataset[name];
  }
  return 'chunk:' + element.querySelector('input')?.value;
}
export function captureUI(root) {
  return {
    screen:screen(root), tokens:tokenPositions(root),
    track:root.querySelector('.activity-track i')?.style.width,
    feedback:!!root.querySelector('.answer-feedback'),
    controls:new Map([...root.querySelectorAll(keyedControls)].map(el => [controlKey(el),el.className])),
    metrics:[...root.querySelectorAll('.topbar-metrics .metric b')].map(el => el.textContent)
  };
}
function arrive(element, delay = 0) {
  animateUI(element, [{opacity:0,transform:'translateY(10px)'},{opacity:1,transform:'translateY(0)'}], {delay,fill:'backwards'});
}
export function markControls(root) {
  for (const button of root.querySelectorAll('button')) {
    if (!button.matches('.path-stop,.sidebar-person') && !button.closest(protectedArt) && !button.querySelector(protectedArt)) {
      button.dataset.uiMotion = '';
    }
  }
}
export function enhanceMotion(root, before) {
  markControls(root);
  if (reduced.matches) return;
  const changedScreen = before.screen !== screen(root);
  if (changedScreen) {
    // Animate text and control sections separately, so neighbouring cast stays still.
    const sections = root.querySelectorAll('.hero-copy,.page-heading>div,.profile-heading,.practice-toolbar,.pick-heading,.mix-launch,.grammar-shelf,.profile-details,.question-body>h1,.question-cue,.question-passage,.question-listen,#text-answer-form,.sentence-builder,.game-intro>h1,.game-intro>p,.result-page>h1,.result-page>p,.result-stats,.result-actions,.welcome-story>h1,.welcome-story>p,.redeem-panel');
    let delay = 0;
    for (const section of sections) {
      const rect = section.getBoundingClientRect();
      if (rect.bottom+scrollY > 0 && rect.top+scrollY < innerHeight) {arrive(section,delay);delay = Math.min(90,delay+20);}
    }
    for (const badge of root.querySelectorAll('.lesson-marker,.mini-lesson')) {
      const rect=badge.getBoundingClientRect();
      if (rect.top+scrollY < innerHeight && rect.bottom+scrollY > 0) {
        const transform = getComputedStyle(badge).transform, rest = transform === 'none' ? '' : transform;
        animateUI(badge,[{transform:rest+' scale(.85)',opacity:.3},{transform:rest+' scale(1.05)',opacity:1,offset:.65},{transform:rest+' scale(1)'}]);
      }
    }
  }
  // DOM is rebuilt after a response; carry only the previous progress value across.
  const track = root.querySelector('.activity-track i');
  if (track && before.track !== undefined && before.track !== track.style.width) {
    animateUI(track,[{width:before.track},{width:track.style.width}],{duration:360});
  }
  if (!before.feedback && root.querySelector('.answer-feedback')) arrive(root.querySelector('.answer-feedback'));
  if (!changedScreen) {
    for (const control of root.querySelectorAll(keyedControls)) {
      const previous = before.controls.get(controlKey(control));
      if (previous === undefined || previous === control.className) continue;
      if (control.matches('.memory-card')) {
        animateUI(control,[{transform:'scaleX(.86)'},{transform:'scaleX(1)'}],{duration:220});
      } else if (control.matches('.chunk-option')) {
        animateUI(control.querySelector('.chunk-check'),[{transform:'scale(.75)'},{transform:'scale(1.12)',offset:.65},{transform:'scale(1)'}]);
      } else if (control.matches('.selected,.matched,.correct')) {
        animateUI(control,[{transform:'scale(.97)'},{transform:'scale(1.025)',offset:.65},{transform:'scale(1)'}]);
      }
    }
    for (const button of root.querySelectorAll('[data-token]:not(:disabled),[data-remove-token]')) {
      const old=before.tokens.get(button.dataset.removeToken ?? button.dataset.token);
      if (!old) continue;
      const selected=button.hasAttribute('data-remove-token'),rect=button.getBoundingClientRect();
      if (old.selected !== selected || (selected && Math.abs(old.rect.x-rect.x)+Math.abs(old.rect.y-rect.y)>1)) {
        animateUI(button,[{transform:`translate(${old.rect.x-rect.x}px,${old.rect.y-rect.y}px)`},{transform:'translate(0,0)'}],{duration:240});
      }
    }
  }
  root.querySelectorAll('.topbar-metrics .metric b').forEach((metric,index) => {
    if (before.metrics[index] !== undefined && before.metrics[index] !== metric.textContent) {
      animateUI(metric.parentElement,[{transform:'scale(.94)'},{transform:'scale(1.08)',offset:.6},{transform:'scale(1)'}]);
    }
  });
}
export function moveTabIndicator(tabs, active) {
  if (!active) return;
  let indicator=tabs.querySelector('.ui-tab-indicator');
  const old=indicator?.getBoundingClientRect();
  if (!indicator) {
    indicator=document.createElement('span');indicator.className='ui-tab-indicator';indicator.setAttribute('aria-hidden','true');tabs.append(indicator);
  }
  indicator.getAnimations().forEach(animation=>animation.cancel());
  indicator.style.left=active.offsetLeft+'px';indicator.style.top=active.offsetTop+'px';
  indicator.style.width=active.offsetWidth+'px';indicator.style.height=active.offsetHeight+'px';
  if (old) {
    const next=indicator.getBoundingClientRect();
    if (Math.abs(old.x-next.x)+Math.abs(old.y-next.y)+Math.abs(old.width-next.width)>.5) animateUI(indicator,[{transform:`translate(${old.x-next.x}px,${old.y-next.y}px)`,width:old.width+'px'},{transform:'translate(0,0)',width:next.width+'px'}],{duration:240});
  }
}

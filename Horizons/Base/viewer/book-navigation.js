(() => {
  const book = document.getElementById('hz-book');
  if (!book || document.querySelector('.hz-reader-nav')) return;
  const pages = [...book.querySelectorAll('.hz-page')];
  if (!pages.length) return;
  const nav = document.createElement('nav');
  nav.className = 'hz-reader-nav';
  nav.setAttribute('aria-label', 'Book navigation');
  nav.innerHTML = '<label for="hz-reader-jump">Horizons A1</label><select id="hz-reader-jump" aria-label="Go to a lesson"></select><button type="button" aria-label="Previous page">‹</button><output aria-live="off"></output><button type="button" aria-label="Next page">›</button>';
  const select = nav.querySelector('select');
  const [previous, next] = nav.querySelectorAll('button');
  const output = nav.querySelector('output');
  const starts = [];
  let current = 0;
  pages.forEach((page, i) => {
    page.id ||= `page-${page.dataset.page}`;
    const header = page.querySelector('.hz-lesson-header');
    if (header || (page.classList.contains('hz-credits-page') && !starts.some(x => x.credits))) {
      const code = header?.querySelector('.hz-lesson-tab__id')?.textContent.trim();
      const title = header?.querySelector('.hz-lesson-title')?.textContent.trim() || 'Image credits';
      const option = new Option(code ? `${code} · ${title}` : title, String(i));
      select.add(option);starts.push({i, credits:!header});
    }
  });
  function sync(i) {
    current = Math.max(0, Math.min(pages.length - 1, i));
    previous.disabled = current === 0;next.disabled = current === pages.length - 1;
    output.textContent = `p. ${pages[current].dataset.page}`;
    const first = starts.filter(x => x.i <= current).at(-1);
    if (first) select.value = String(first.i);
  }
  function go(i) {
    sync(i);pages[current].scrollIntoView({block:'start',behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth'});
    history.replaceState(null,'',`#${pages[current].id}`);
  }
  select.addEventListener('change',() => go(Number(select.value)));
  previous.addEventListener('click',() => go(current-1));next.addEventListener('click',() => go(current+1));
  document.body.append(nav);
  let queued = false;
  addEventListener('scroll',() => {if(queued)return;queued=true;requestAnimationFrame(() => {queued=false;let chosen=0;for(let i=0;i<pages.length;i++){if(pages[i].getBoundingClientRect().top < innerHeight*.45)chosen=i;else break;}sync(chosen);});},{passive:true});
  const target=pages.findIndex(x=>`#${x.id}`===location.hash);
  sync(target>=0?target:0);if(target>=0)requestAnimationFrame(()=>pages[target].scrollIntoView({block:'start'}));
})();

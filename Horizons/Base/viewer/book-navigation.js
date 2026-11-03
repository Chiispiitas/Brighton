(() => {
  const book = document.getElementById('hz-book');
  if (!book || document.querySelector('.hz-reader-nav')) return;
  const pages = [...book.querySelectorAll('.hz-page')];
  if (!pages.length) return;
  const nav = document.createElement('nav');
  nav.className = 'hz-reader-nav';
  nav.setAttribute('aria-label', 'Book navigation');
  nav.innerHTML = '<label for="hz-reader-jump">Horizons A1</label><select id="hz-reader-jump" aria-label="Go to a section"></select><button type="button" aria-label="Previous page">‹</button><output aria-live="off"></output><button type="button" aria-label="Next page">›</button>';
  const select = nav.querySelector('select');
  const [previous, next] = nav.querySelectorAll('button');
  const output = nav.querySelector('output');
  const starts = [];
  let current = 0;
  pages.forEach((page, i) => {
    page.id ||= `page-${page.dataset.page}`;
    const practicePage = page.classList.contains('hz-practice-page');
    const header = practicePage ? null : page.querySelector('.hz-lesson-header');
    const sections = practicePage ? [...page.querySelectorAll('.lp-section[data-practice-start="true"]')] : [];
    if (sections.length) {
      sections.forEach(section => {
        const option = new Option(section.dataset.practiceTitle, section.id);
        select.add(option);starts.push({i, target:section, value:section.id});
      });
      return;
    }
    const practice = practicePage && page.dataset.practiceStart === 'true';
    const editorial = page.dataset.bookStart === 'true';
    const credits = page.classList.contains('hz-credits-page');
    if (header || practice || editorial || (credits && !starts.some(x => x.credits))) {
      const code = header?.querySelector('.hz-lesson-tab__id')?.textContent.trim();
      const title = header?.querySelector('.hz-lesson-title')?.textContent.trim() || (practice ? page.dataset.practiceTitle : page.dataset.bookTitle || (credits ? 'Image credits' : 'Book section'));
      const option = new Option(code ? `${code} · ${title}` : title, page.id);
      select.add(option);starts.push({i, target:page, value:page.id, credits});
    }
  });
  function sync(i) {
    current = Math.max(0, Math.min(pages.length - 1, i));
    previous.disabled = current === 0;next.disabled = current === pages.length - 1;
    output.textContent = pages[current].dataset.pageLabel || `p. ${pages[current].dataset.page}`;
    // A second lesson visible lower on the page is not the active reading anchor.
    const readingEdge = Math.max(100, nav.getBoundingClientRect().bottom + 40);
    const first = starts.filter(x => x.i < current || (x.i === current && x.target.getBoundingClientRect().top < readingEdge)).at(-1) || starts.find(x => x.i === current);
    if (first) select.value = first.value;
  }
  function go(i, target = pages[i]) {
    sync(i);target.scrollIntoView({block:'start',behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth'});
    history.replaceState(null,'',`#${target.id}`);
  }
  select.addEventListener('change',() => {const entry=starts.find(x=>x.value===select.value);if(entry)go(entry.i,entry.target);});
  previous.addEventListener('click',() => go(current-1));next.addEventListener('click',() => go(current+1));
  document.body.append(nav);
  let queued = false;
  addEventListener('scroll',() => {if(queued)return;queued=true;requestAnimationFrame(() => {queued=false;let chosen=0;for(let i=0;i<pages.length;i++){if(pages[i].getBoundingClientRect().top < innerHeight*.45)chosen=i;else break;}sync(chosen);});},{passive:true});
  const hashId = (() => {try{return decodeURIComponent(location.hash.slice(1));}catch{return '';}})();
  const anchored = hashId ? document.getElementById(hashId) : null;
  const target=pages.findIndex(x=>x===anchored || x.contains(anchored));
  sync(target>=0?target:0);if(target>=0)requestAnimationFrame(()=>(anchored || pages[target]).scrollIntoView({block:'start'}));
})();

// Runs before styles so a saved dark theme never flashes the light page.
(()=>{let theme='light',motion=true;try{theme=localStorage.getItem('hz-theme')||'light';motion=localStorage.getItem('hz-animations')!=='off'}catch{}const dark=theme==='dark'||theme==='system'&&matchMedia('(prefers-color-scheme: dark)').matches;document.documentElement.dataset.theme=dark?'dark':'light';document.documentElement.dataset.animations=motion?'on':'off';document.documentElement.style.colorScheme=dark?'dark':'only light';document.querySelector('meta[name=color-scheme]')?.setAttribute('content',dark?'dark':'only light')})();

// Remove obsolete page-level testing tags; retain functional query parameters and routes.
(()=>{const url=new URL(location.href);if(url.searchParams.has('v')){url.searchParams.delete('v');history.replaceState(history.state,'',url)}})();

const media=matchMedia('(prefers-reduced-motion: reduce)'),events=new EventTarget();
export const animationsEnabled=()=>document.documentElement.dataset.animations!=='off';
export const motionPreference={get matches(){return !animationsEnabled()||media.matches},addEventListener:(type,fn)=>events.addEventListener(type,fn),removeEventListener:(type,fn)=>events.removeEventListener(type,fn)};
media.addEventListener('change',()=>events.dispatchEvent(new Event('change')));
export function setAnimationsEnabled(enabled){try{localStorage.setItem('hz-animations',enabled?'on':'off')}catch{}document.documentElement.dataset.animations=enabled?'on':'off';events.dispatchEvent(new Event('change'))}
export function themePreference(){try{return localStorage.getItem('hz-theme')||'light'}catch{return'light'}}
export function setTheme(value){const theme=['light','dark','system'].includes(value)?value:'light';try{localStorage.setItem('hz-theme',theme)}catch{}const dark=theme==='dark'||theme==='system'&&matchMedia('(prefers-color-scheme: dark)').matches;document.documentElement.dataset.theme=dark?'dark':'light';document.documentElement.style.colorScheme=dark?'dark':'only light';document.querySelector('meta[name=color-scheme]')?.setAttribute('content',dark?'dark':'only light');document.querySelector('meta[name=theme-color]')?.setAttribute('content',dark?'#17232f':'#ad195a')}
matchMedia('(prefers-color-scheme: dark)').addEventListener('change',()=>{if(themePreference()==='system')setTheme('system')});

setTheme(themePreference());

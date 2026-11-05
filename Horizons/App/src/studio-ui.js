import {animateUI,markControls,moveTabIndicator} from './ui-motion.js?v=pico4';
let selectedTab='skin';
let tabResize;
const bubble=document.createElement('div');bubble.id='path-bubble';bubble.className='path-bubble';bubble.setAttribute('popover','auto');bubble.setAttribute('role','dialog');bubble.setAttribute('aria-label','Activity details');document.body.append(bubble);
export function closePathBubble(){bubble.getAnimations().forEach(a=>a.cancel());if(bubble.matches(':popover-open'))bubble.hidePopover();}
export function openPathBubble(content,anchor,event){
 bubble.getAnimations().forEach(a=>a.cancel());
 bubble.innerHTML=content.replace('id="dialog-title"','id="path-bubble-title"');bubble.setAttribute('aria-labelledby','path-bubble-title');bubble.showPopover();
 const a=anchor?.getBoundingClientRect(),x=event?.clientX||a?.left+a?.width/2||innerWidth/2,y=event?.clientY||a?.bottom||100,r=bubble.getBoundingClientRect();
 const left=Math.max(12,Math.min(x-r.width/2,innerWidth-r.width-12)),below=y+18+r.height<innerHeight-12;
 bubble.style.left=left+'px';bubble.style.top=(below?y+18:Math.max(12,y-r.height-18))+'px';bubble.dataset.side=below?'below':'above';bubble.style.setProperty('--tip-x',Math.max(20,Math.min(x-left,r.width-20))+'px');
 markControls(bubble);bubble.getAnimations().forEach(a=>a.cancel());bubble.style.transformOrigin=`${x-left}px ${below?'0%':'100%'}`;animateUI(bubble,[{opacity:0,transform:'scale(.92)'},{opacity:1,transform:'scale(1.015)',offset:.7},{opacity:1,transform:'scale(1)'}],{duration:240});
 if(event?.detail===0)bubble.querySelector('button')?.focus();
}
bubble.addEventListener('click',event=>{const start=event.target.closest('[data-start-path]');if(start){closePathBubble();const button=document.createElement('button');button.dataset.startActivity=start.dataset.startPath;button.hidden=true;document.getElementById('app').append(button);button.click();button.remove();}if(event.target.closest('[data-dialog-close]'))closePathBubble();});
function scrollState(){const hero=document.querySelector('.learn-hero');document.body.classList.toggle('path-scrolled',!!hero&&hero.getBoundingClientRect().bottom<24);}
window.addEventListener('scroll',()=>{scrollState();closePathBubble();},{passive:true});window.addEventListener('resize',closePathBubble);
export function enhanceShell(xp,streak,icon,avatar={},manifest={}){
 tabResize?.disconnect();
 closePathBubble();
 const header=document.querySelector('.topbar');
 const metrics='<span class="metric">'+icon('spark')+'<b>'+streak+'</b><span>'+(streak===1?'day':'days')+'</span></span><span class="metric">'+icon('star')+'<b>'+xp+'</b><span>XP</span></span>';
 if(header&&!header.querySelector('.topbar-metrics')){const stats=document.createElement('div');stats.className='topbar-metrics';stats.setAttribute('aria-label','Streak and XP');stats.innerHTML=metrics;header.insertBefore(stats,header.querySelector('.top-avatar'));}
 const workspace=document.querySelector('.workspace');if(workspace&&document.querySelector('.learn-hero')){const floating=document.createElement('div');floating.className='path-floating';floating.innerHTML='<span class="floating-unit">Unit 1</span><div class="floating-metrics" aria-label="Streak and XP">'+metrics+'</div>';workspace.append(floating);}scrollState();
 const options=document.querySelector('.avatar-options');if(!options)return;
 document.querySelector('.avatar-studio-spark')?.remove();const preview=document.querySelector('#avatar-preview');preview.style.background=manifest.avatar?.background?.find(c=>c.id===avatar.background)?.swatch||'#fff1dc';const sparkle=document.createElement('img');sparkle.src=new URL('../assets/art/avatar-change-sparkles-v1.png',import.meta.url).href;sparkle.className='avatar-change-spark';sparkle.alt='';preview.append(sparkle);
 const panels=[...options.querySelectorAll('fieldset')],tabs=document.createElement('div');tabs.className='avatar-tabs';tabs.setAttribute('role','tablist');tabs.setAttribute('aria-label','Avatar options');
 const select=id=>{selectedTab=id;for(const panel of panels)panel.hidden=panel.id!=='avatar-panel-'+id;for(const tab of tabs.querySelectorAll('button')){const active=tab.dataset.avatarTab===id;tab.setAttribute('aria-selected',active);tab.tabIndex=active?0:-1;}moveTabIndicator(tabs,tabs.querySelector('[aria-selected=true]'));};
 panels.forEach((panel,index)=>{const legend=panel.querySelector('legend'),first=panel.querySelector('[data-avatar-group]'),id=first?.dataset.avatarGroup||String(index);panel.id='avatar-panel-'+id;panel.setAttribute('role','tabpanel');panel.setAttribute('aria-labelledby','avatar-tab-'+id);legend.classList.add('sr-only');const tab=document.createElement('button');tab.type='button';tab.id='avatar-tab-'+id;tab.dataset.avatarTab=id;tab.textContent=legend.textContent;tab.setAttribute('role','tab');tab.setAttribute('aria-controls',panel.id);tab.addEventListener('click',()=>select(id));tab.addEventListener('keydown',event=>{if(!['ArrowLeft','ArrowRight','Home','End'].includes(event.key))return;event.preventDefault();const buttons=[...tabs.querySelectorAll('button')],i=buttons.indexOf(tab),n=event.key==='Home'?0:event.key==='End'?buttons.length-1:(i+(event.key==='ArrowRight'?1:-1)+buttons.length)%buttons.length;select(buttons[n].dataset.avatarTab);buttons[n].focus();});tabs.append(tab);});options.prepend(tabs);if(!panels.some(p=>p.id==='avatar-panel-'+selectedTab))selectedTab=tabs.firstElementChild?.dataset.avatarTab;select(selectedTab);
 tabResize=new ResizeObserver(()=>{if(tabs.isConnected)moveTabIndicator(tabs,tabs.querySelector('[aria-selected=true]'));});tabResize.observe(tabs);for(const tab of tabs.querySelectorAll('button'))tabResize.observe(tab);
}
export function avatarFeedback(){const spark=document.querySelector('#avatar-preview .avatar-change-spark');animateUI(spark,[{opacity:0,transform:'scale(.7)'},{opacity:1,transform:'scale(1)',offset:.3},{opacity:0,transform:'scale(1.12)'}],{duration:600});}

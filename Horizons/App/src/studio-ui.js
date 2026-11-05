import {requestAvatarFeedback} from './avatar-motion.js?v=pathfix1';
import {animateUI,markControls,moveTabIndicator} from './ui-motion.js?v=pathfix1';
let selectedTab='skin';
let tabResize;
const bubble=document.createElement('div');bubble.id='path-bubble';bubble.className='path-bubble';bubble.setAttribute('popover','auto');bubble.setAttribute('role','dialog');bubble.setAttribute('aria-label','Activity details');document.body.append(bubble);
let bubbleRequest=0,bubblePreparing=false,bubbleSpace;
export function closePathBubble(){
 ++bubbleRequest;bubblePreparing=false;
 bubble.getAnimations().forEach(a=>a.cancel());if(bubble.matches(':popover-open'))bubble.hidePopover();
}
export async function openPathBubble(content,anchor,event){
 closePathBubble();const request=++bubbleRequest;bubblePreparing=true;
 bubble.innerHTML=content.replace('id="dialog-title"','id="path-bubble-title"');bubble.setAttribute('aria-labelledby','path-bubble-title');
 bubble.style.visibility='hidden';bubble.showPopover();
 const measured=bubble.getBoundingClientRect(),viewport=window.visualViewport;
 const nav=document.querySelector('.mobile-nav'),navRect=nav?.getBoundingClientRect();
 const viewportBottom=(viewport?.offsetTop||0)+(viewport?.height||innerHeight)-12;
 const safeBottom=Math.min(navRect?.height?navRect.top-12:Infinity,viewportBottom);
 const original=anchor?.getBoundingClientRect();if(!original){closePathBubble();return;}
 const gap=anchor.classList.contains('landmark-stop')?36:12;
 const overflow=Math.max(0,original.bottom+gap+measured.height-safeBottom);
 if(overflow){
  const max=Math.max(0,document.documentElement.scrollHeight-innerHeight),needed=Math.max(0,scrollY+overflow-max);
  if(needed){if(!bubbleSpace?.isConnected){bubbleSpace=document.createElement('div');bubbleSpace.dataset.pathDetailsSpace='';bubbleSpace.setAttribute('aria-hidden','true');bubbleSpace.style.cssText='grid-column:1/-1;pointer-events:none;overflow-anchor:none';anchor.closest('.learning-path').append(bubbleSpace);}bubbleSpace.style.height=((parseFloat(bubbleSpace.style.height)||0)+needed+2)+'px';}
  window.scrollBy({top:overflow,behavior:'instant'});
 }
 // Let any minimum reveal scroll settle; reserved room survives switching/closing details.
 await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));
 if(request!==bubbleRequest||!anchor.isConnected||!bubble.matches(':popover-open'))return;
 const a=anchor.getBoundingClientRect(),r=bubble.getBoundingClientRect(),x=a.left+a.width/2;
 const left=Math.max(12,Math.min(x-r.width/2,innerWidth-r.width-12));
 bubble.style.left=left+'px';bubble.style.top=(a.bottom+gap)+'px';bubble.dataset.side='below';bubble.style.setProperty('--tip-x',Math.max(20,Math.min(x-left,r.width-20))+'px');
 bubblePreparing=false;bubble.style.visibility='visible';
 markControls(bubble);bubble.getAnimations().forEach(a=>a.cancel());bubble.style.transformOrigin=`${x-left}px 0%`;animateUI(bubble,[{transform:'scale(.92)'},{transform:'scale(1.015)',offset:.7},{transform:'scale(1)'}],{duration:240});
 if(event?.detail===0)bubble.querySelector('button')?.focus({preventScroll:true});
}
bubble.addEventListener('toggle',()=>{if(!bubble.matches(':popover-open'))closePathBubble();});
window.addEventListener('keydown',event=>{if(event.key==='Escape')closePathBubble();});
bubble.addEventListener('click',event=>{const start=event.target.closest('[data-start-path]');if(start){if(start.disabled)return;start.disabled=true;const id=start.dataset.startPath;closePathBubble();const button=document.createElement('button');button.dataset.startActivity=id;button.hidden=true;document.getElementById('app').append(button);button.click();button.remove();}if(event.target.closest('[data-dialog-close]'))closePathBubble();});
function scrollState(){const hero=document.querySelector('.learn-hero');document.body.classList.toggle('path-scrolled',!!hero&&hero.getBoundingClientRect().bottom<24);}
window.addEventListener('scroll',()=>{scrollState();if(!bubblePreparing)closePathBubble();},{passive:true});window.addEventListener('resize',closePathBubble);
export function enhanceShell(xp,streak,icon,avatar={},manifest={}){
 tabResize?.disconnect();bubbleSpace?.remove();bubbleSpace=null;
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
export function avatarFeedback(){requestAvatarFeedback(document.querySelector('#avatar-preview [data-avatar-static]'),'customize');const spark=document.querySelector('#avatar-preview .avatar-change-spark');animateUI(spark,[{opacity:0,transform:'scale(.7)'},{opacity:1,transform:'scale(1)',offset:.3},{opacity:0,transform:'scale(1.12)'}],{duration:600});}

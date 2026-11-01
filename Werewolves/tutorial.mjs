import { TutorialGame, TUTORIAL_ROLES } from './tutorial-model.mjs';

const names={villager:'Villager',werewolf:'Werewolf',girl:'Little Girl',fortune:'Fortune Teller',witch:'Witch',hunter:'Hunter'};
const summaries={villager:'Discuss and vote during the day.',werewolf:'Choose a victim together with your pack.',girl:'Spy, flip the coin, or stay asleep.',fortune:'Privately check one living player’s role.',witch:'Practise healing and optional poison.',hunter:'Choose your final target after elimination.'};

export function createTutorial({root,role,present,notify,closeModal}){
  let game=null, playing=false, timers=[], entering=false, startedAt=0;
  const clear=()=>{timers.forEach(clearTimeout);timers=[];};
  const pause=()=>{
    playing=false;clear();root.classList.remove('demo-playing');
    const button=root.querySelector('#demo-watch');
    if(button){button.textContent='Watch demo';button.setAttribute('aria-pressed','false');}
  };
  const later=(fn,delay)=>timers.push(setTimeout(fn,delay));
  function choose(){
    pause();game=null;closeModal();history.replaceState(null,'','?tutorial');
    root.className='tutorial-mode';
    root.innerHTML=`<section class="tutorial-intro"><div><div class="eyebrow">Learn to play</div><h1>Choose a role</h1><p>Practise with the same village, cards and controls used in a game. Try each action yourself, or watch the animated demonstration.</p><p class="tutorial-safe">Practice uses sample players. Your real game and room code stay saved.</p></div><a class="secondary" href="./">Back to game</a></section><div class="tutorial-roles">${TUTORIAL_ROLES.map(r=>`<button class="tutorial-role" data-lesson="${r}"><img src="assets/${r}-card.webp" alt=""><span><b>${names[r]}</b><small>${summaries[r]}</small><em>Start tutorial →</em></span></button>`).join('')}</div><section class="tutorial-basics"><h2>Before the first night</h2><p>The host creates a room and shares the code. Four to twelve players join on their own devices. Everyone checks their secret card and presses Ready.</p><p>Night order: Fortune Teller → Werewolves → Little Girl → Witch → dawn. Missing roles are skipped. Day one is for discussion; voting starts on day two.</p></section>`;
    root.querySelectorAll('[data-lesson]').forEach(b=>b.onclick=()=>start(b.dataset.lesson));
    window.scrollTo({top:0,behavior:'instant'});
  }
  function start(r){pause();game=new TutorialGame(r);history.replaceState(null,'',`?tutorial=${r}`);load(0);}
  function load(index){clear();closeModal();entering=true;startedAt=Date.now();present(game.load(index));if(playing)schedule();else root.querySelector('#lesson-title')?.focus({preventScroll:true});}
  function decorate(){
    if(!game)return;
    root.classList.add('tutorial-mode');root.classList.toggle('demo-playing',playing);
    const {step,index,steps,role:r}=game;
    root.querySelector('.room-tools').innerHTML='<span class="demo-badge">Practice game</span><a class="quiet" href="./">Exit tutorial</a>';
    root.querySelector('.room-head .room-code')?.remove();
    root.insertAdjacentHTML('afterbegin',`<section class="lesson-chrome" style="--elapsed:-${Math.max(0,Date.now()-startedAt)}ms" aria-label="${names[r]} tutorial"><div class="lesson-role"><img src="assets/${r}-icon.webp" alt=""><div><span>${names[r]} tutorial · Slide ${index+1} of ${steps.length}</span><h2 id="lesson-title" tabindex="-1">${step.title}</h2></div><button class="quiet" id="demo-roles">All roles</button></div><p class="lesson-copy">${step.text}</p><div class="lesson-feedback" role="status" aria-live="polite">${game.feedback||'Try the highlighted controls, or use Next to explore the example.'}</div><div class="lesson-controls"><button class="secondary" id="demo-prev" ${index?'':'disabled'}>← Back</button><button class="primary" id="demo-next">${index===steps.length-1?'Finish tutorial':'Next →'}</button><button class="quiet" id="demo-watch" aria-pressed="${playing}">${playing?'Pause demo':'Watch demo'}</button><button class="quiet" id="demo-replay">Replay slide</button><span class="lesson-dots" aria-label="Slides">${steps.map((s,i)=>`<button data-slide="${i}" aria-label="Slide ${i+1}: ${s.title}" ${i===index?'aria-current="step"':''}>${i+1}</button>`).join('')}</span></div><div class="lesson-timer" aria-hidden="true"><i></i></div></section>`);
    root.querySelector('#demo-roles').onclick=choose;
    root.querySelector('#demo-prev').onclick=()=>{pause();load(index-1);};
    root.querySelector('#demo-next').onclick=()=>{pause();if(index===steps.length-1)finish();else load(index+1);};
    root.querySelector('#demo-replay').onclick=()=>{pause();load(index);};
    root.querySelector('#demo-watch').onclick=()=>{if(playing)pause();else{playing=true;load(index);}};
    root.querySelectorAll('[data-slide]').forEach(b=>b.onclick=()=>{pause();load(Number(b.dataset.slide));});
    const target=root.querySelector(step.focus)||(step.scene==='card'?root.querySelector('#ready'):null);target?.classList.add('tutorial-focus');
    if(entering){root.querySelector('.room-layout')?.classList.add('lesson-enter');entering=false;}
    if(game.completed)root.querySelector('.lesson-feedback').classList.add('lesson-success');
  }
  function perform(selector,value){
    if(!playing||!game)return;
    const element=root.querySelector(selector);
    if(!element||element.disabled)return;
    root.querySelectorAll('.demo-cursor-target').forEach(el=>el.classList.remove('demo-cursor-target'));
    element.classList.add('demo-cursor-target');
    element.scrollIntoView({block:'center',behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});
    if(value!==undefined){element.value=value;element.dispatchEvent(new Event('change',{bubbles:true}));}
    else element.click();
  }
  function schedule(){
    for(const [delay,selector,value] of game.step.play)later(()=>perform(selector,value),delay);
    later(()=>{if(!playing||!game)return;if(game.index===game.steps.length-1){pause();finish();}else load(game.index+1);},9500);
  }
  function finish(){
    const r=game.role;pause();closeModal();
    root.className='tutorial-mode';
    root.innerHTML=`<section class="tutorial-complete"><img src="assets/${r}-card.webp" alt="${names[r]} card"><div><div class="eyebrow">Tutorial complete</div><h1>${names[r]}</h1><p>You can replay the examples, learn another role, or return to the game.</p><div class="lesson-controls"><button class="primary" id="demo-again">Replay tutorial</button><button class="secondary" id="demo-others">Choose another role</button><a class="secondary" href="./">Back to game</a></div></div></section>`;
    root.querySelector('#demo-again').onclick=()=>start(r);root.querySelector('#demo-others').onclick=choose;
    window.scrollTo({top:0,behavior:'smooth'});
  }
  root.addEventListener('pointerdown',event=>{if(event.isTrusted&&playing&&!event.target.closest('#demo-watch'))pause();},{capture:true});
  document.addEventListener('visibilitychange',()=>{if(document.hidden)pause();});
  document.addEventListener('keydown',event=>{
    if(!game||!root.querySelector('.lesson-chrome')||document.querySelector('dialog[open]')||event.target.closest('input,select,textarea,button,a,summary'))return;
    if(event.key==='ArrowRight'){event.preventDefault();root.querySelector('#demo-next').click();}
    if(event.key==='ArrowLeft'&&game.index){event.preventDefault();root.querySelector('#demo-prev').click();}
  });
  const controller={decorate,command:body=>{
    try{present(game.act(body));return true;}catch(error){notify(error.message);return false;}
  },start:()=>{if(TUTORIAL_ROLES.includes(role))start(role);else choose();}};
  return controller;
}

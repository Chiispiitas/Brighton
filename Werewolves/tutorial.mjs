import { TutorialGame, TUTORIAL_ROLES } from './tutorial-model.mjs?v=spying-3';

const names={villager:'Villager',werewolf:'Werewolf',girl:'Little Girl',fortune:'Fortune Teller',witch:'Witch',hunter:'Hunter'};
const summaries={villager:'Discuss and vote.',werewolf:'Agree on a victim with your pack.',girl:'Spy or stay asleep.',fortune:'Check one player’s role.',witch:'Heal or poison a player.',hunter:'Make a final choice after elimination.'};
const boardScenes=new Set(['pack','split','agreed','fortune','vote','wolf-vote','hunter','last-wolf','dawn','eliminated','hunter-result','witch-dawn']);
const quietScenes=new Set(['dawn','eliminated','hunter-result','witch-dawn']);

export function createTutorial({root,role,present,notify,closeModal}){
  document.body.classList.add('tutorial-page');
  let game=null, playing=false, timers=[], entering=false, performing=false;
  const clear=()=>{timers.forEach(clearTimeout);timers=[];};
  const later=(fn,delay)=>timers.push(setTimeout(fn,delay));
  function pause(){
    playing=false;clear();root.classList.remove('demo-playing');
    const button=root.querySelector('#demo-watch');
    if(button){button.textContent='Show me';button.setAttribute('aria-pressed','false');}
  }
  function choose(){
    pause();game=null;closeModal();history.replaceState(null,'','?tutorial');
    root.className='tutorial-mode tutorial-menu';
    root.innerHTML=`<section class="tutorial-intro"><div><span class="tutorial-kicker">Learn to play</span><h1>Choose your role</h1><p>Practise each action with sample players. Use Show me whenever you need help.</p></div><a class="tutorial-exit" href="./">Back to game</a></section><div class="tutorial-roles">${TUTORIAL_ROLES.map(r=>`<button class="tutorial-role" data-lesson="${r}"><img src="assets/${r}-card.webp" alt=""><span><b>${names[r]}</b><small>${summaries[r]}</small></span><span class="role-arrow" aria-hidden="true">→</span></button>`).join('')}</div><details class="tutorial-basics"><summary>How does a game start?</summary><ol><li>The host shares a room code. Four to twelve players join on their own devices.</li><li>Everyone checks their card and presses Ready. At night, the host calls each role in turn.</li><li>Discuss in the morning. Voting starts on day two.</li></ol><p>Night order: Fortune Teller → Werewolves → Little Girl → Witch.</p></details><p class="tutorial-safe">These are separate practice examples. Your saved game stays unchanged.</p>`;
    root.querySelectorAll('[data-lesson]').forEach(b=>b.onclick=()=>start(b.dataset.lesson));
    window.scrollTo({top:0,behavior:'instant'});
  }
  function start(r){pause();game=new TutorialGame(r);history.replaceState(null,'',`?tutorial=${r}`);load(0);}
  function load(index){
    clear();closeModal();entering=true;present(game.load(index));
    if(!playing)root.querySelector('#lesson-title')?.focus({preventScroll:true});
  }
  function decorate(){
    if(!game)return;
    const {step,index,steps,role:r}=game;
    const scene=step.scene, layout=scene==='card'?'card':boardScenes.has(scene)?'board':'panel';
    const canShow=step.play.length>0&&scene!=='notes';
    root.classList.add('tutorial-mode');root.classList.toggle('demo-playing',playing);
    const nodes=[root.querySelector('.success-banner'),root.querySelector('.room-layout'),root.querySelector('.revealed-roles')].filter(Boolean);
    root.querySelector('.room-head')?.remove();
    const header=document.createElement('header');header.className='lesson-header';
    header.innerHTML=`<button class="tutorial-exit" id="demo-roles">← All roles</button><span class="lesson-role-name"><img src="assets/${r}-icon.webp" alt="">${names[r]}</span><span class="lesson-counter">Step ${index+1} of ${steps.length}</span>`;
    const shell=document.createElement('div');shell.className='lesson-shell';
    shell.innerHTML=`<aside class="lesson-coach"><span class="tutorial-kicker">${canShow?'Try it':'Remember'}</span><h1 id="lesson-title" tabindex="-1">${step.title}</h1><p class="lesson-copy">${step.text}</p>${canShow?`<button class="tutorial-show" id="demo-watch" aria-pressed="${playing}">${playing?'Stop example':'Show me'}</button>`:''}<details class="lesson-outline"><summary>Lesson steps</summary><ol>${steps.map((s,i)=>`<li><button data-slide="${i}" ${i===index?'aria-current="step"':''}>${s.title}</button></li>`).join('')}</ol></details></aside><section class="lesson-stage lesson-${layout} ${quietScenes.has(scene)?'lesson-observe':''}" data-scene="${scene}" aria-label="Practice example"><header class="practice-header"><span>${layout==='card'?'Your secret card':scene==='notes'?'Your private result':layout==='board'?'Example village':r==='witch'?'Your potions':'Your night action'}</span><button class="tutorial-exit" id="demo-replay">Reset example</button></header><div class="lesson-example"></div><div class="lesson-result ${game.feedback?'has-result':''}" role="status" aria-live="polite">${game.feedback?`<span aria-hidden="true">${game.completed?'✓':'→'}</span><p>${game.feedback}</p>`:''}</div></section>`;
    const stage=shell.querySelector('.lesson-example');nodes.forEach(node=>stage.append(node));
    const nav=document.createElement('nav');nav.className='lesson-navigation';nav.setAttribute('aria-label','Tutorial navigation');
    nav.innerHTML=`<button class="tutorial-back" id="demo-prev" ${index?'':'disabled'}>← Previous</button><div class="lesson-progress" aria-hidden="true">${steps.map((_,i)=>`<i class="${i<=index?'is-done':''}"></i>`).join('')}</div><button class="tutorial-next" id="demo-next">${index===steps.length-1?'Finish lesson':'Next step →'}</button>`;
    root.prepend(header);root.append(shell,nav);
    root.querySelector('#demo-roles').onclick=choose;
    root.querySelector('#demo-prev').onclick=()=>{pause();load(index-1);};
    root.querySelector('#demo-next').onclick=()=>{pause();if(index===steps.length-1)finish();else load(index+1);};
    root.querySelector('#demo-replay').onclick=()=>{pause();load(index);};
    root.querySelector('#demo-watch')?.addEventListener('click',()=>{if(playing)pause();else demonstrate();});
    root.querySelectorAll('[data-slide]').forEach(b=>b.onclick=()=>{pause();load(Number(b.dataset.slide));});
    if(scene==='notes'){
      const notes=root.querySelector('.notes');if(notes)notes.open=true;
    }
    if(game.completed){
      const sleep=root.querySelector('.sleep');
      if(sleep){
        const title=sleep.querySelector('h3');if(title)title.textContent='Done';
        const help=sleep.querySelector('p');if(help)help.textContent='Choose Next step when you are ready.';
      }
      if(scene==='card'){
        root.querySelector('.private-card').innerHTML=`<img class="role-card" src="assets/${r}-card.webp" alt="${names[r]} card"><div class="role-title">${names[r]}</div><span class="tutorial-ready">✓ Ready</span>`;
      }
    }
    const packButton=root.querySelector('#pack-continue');
    if(packButton){packButton.textContent='Continue the night';packButton.hidden=scene!=='agreed';}
    if(['pack','split','agreed'].includes(scene)&&game.raw.phase==='werewolf'){
      const label=document.createElement('span');const agreed=game.snapshot().packDecision.agreed;
      label.className=`practice-pack-status ${agreed?'is-agreed':''}`;label.textContent=agreed?'Choices match':'Choices must match';
      root.querySelector('.practice-header').insertBefore(label,root.querySelector('#demo-replay'));
    }
    const sample=game.snapshot();
    for(const player of sample.players){
      const house=root.querySelector(`[data-player="${player.id}"]`);
      if(player.pack&&player.id!==sample.me.id){
        house?.classList.add('tutorial-packmate');
        const status=house?.querySelector('.nameplate>small');if(status&&player.alive)status.textContent='Packmate';
      }
      const marker=house?.querySelector('.pack-marker');
      if(marker){
        const choices=(sample.packChoices||[]).filter(choice=>choice.target===player.id).map(choice=>choice.wolfId===sample.me.id?'You':sample.players.find(p=>p.id===choice.wolfId)?.name);
        marker.textContent=`${choices.join(' + ')} chose ${player.name}`;
      }
    }
    let target=root.querySelector(step.focus)||(scene==='card'?root.querySelector('#ready'):null);
    if(target?.hidden||scene==='pack')target=root.querySelector('[data-player="p2"]');
    target?.classList.add('tutorial-focus');
    const targetLabel=root.querySelector('#target-name');if(targetLabel?.textContent==='Choose a house in the village')targetLabel.textContent='Select a house';
    if(entering){root.querySelector('.lesson-stage').classList.add('lesson-enter');entering=false;}
    if(playing)root.querySelector('#demo-watch')?.focus({preventScroll:true});
  }
  function perform(selector,value){
    if(!playing||!game)return;
    const element=root.querySelector(selector);if(!element||element.disabled)return;
    root.querySelectorAll('.demo-cursor-target').forEach(el=>el.classList.remove('demo-cursor-target'));
    element.classList.add('demo-cursor-target');
    element.scrollIntoView({block:'nearest',behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});
    performing=true;
    try{
      if(value!==undefined){element.value=value;element.dispatchEvent(new Event('change',{bubbles:true}));}
      else element.click();
    }finally{performing=false;}
  }
  function demonstrate(){
    playing=true;load(game.index);
    for(const [delay,selector,value] of game.step.play)later(()=>perform(selector,value),delay);
    const last=Math.max(...game.step.play.map(action=>action[0]));
    // Demonstrate only this example. The learner chooses when to continue.
    later(pause,last+650);
  }
  function finish(){
    const r=game.role;pause();closeModal();root.className='tutorial-mode';
    root.innerHTML=`<section class="tutorial-complete"><img src="assets/${r}-card.webp" alt="${names[r]} card"><span class="tutorial-kicker">Lesson finished</span><h1>${names[r]}</h1><p>You’re ready to try this role in a game.</p><div><button class="tutorial-next" id="demo-others">Choose another role</button><button class="tutorial-back" id="demo-again">Replay lesson</button></div><a class="tutorial-exit" href="./">Back to game</a></section>`;
    root.querySelector('#demo-again').onclick=()=>start(r);root.querySelector('#demo-others').onclick=choose;
    window.scrollTo({top:0,behavior:'smooth'});
  }
  root.addEventListener('pointerdown',event=>{if(event.isTrusted&&playing&&!event.target.closest('#demo-watch'))pause();},{capture:true});
  root.addEventListener('change',event=>{if(event.isTrusted&&playing&&!performing)pause();},{capture:true});
  root.addEventListener('keydown',event=>{if(event.isTrusted&&playing&&['Enter',' '].includes(event.key)&&!event.target.closest('#demo-watch'))pause();},{capture:true});
  root.addEventListener('click',event=>{
    if(!event.target.closest('[data-player]'))return;
    const button=root.querySelector('#confirm-target');
    if(button&&!button.disabled){button.classList.add('tutorial-focus');button.scrollIntoView({block:'nearest',behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});}
  });
  document.addEventListener('visibilitychange',()=>{if(document.hidden)pause();});
  document.addEventListener('keydown',event=>{
    if(!game||!root.querySelector('.lesson-shell')||document.querySelector('dialog[open]')||event.target.closest('input,select,textarea,button,a,summary'))return;
    if(event.key==='ArrowRight'){event.preventDefault();root.querySelector('#demo-next').click();}
    if(event.key==='ArrowLeft'&&game.index){event.preventDefault();root.querySelector('#demo-prev').click();}
  });
  return {decorate,command:body=>{
    try{
      present(game.act(body));
      if(game.completed)root.querySelector('.lesson-result')?.scrollIntoView({block:'nearest',behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});
      return true;
    }catch(error){
      const result=root.querySelector('.lesson-result');
      if(result){result.classList.add('has-result','is-error');result.setAttribute('role','alert');result.textContent=error.message;}
      else notify(error.message);
      return false;
    }
  },start:()=>{if(TUTORIAL_ROLES.includes(role))start(role);else choose();}};
}

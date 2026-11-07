import { createRoom, command, view, CARD_DEFS, cardGroups } from './server/engine.mjs';
import { esc } from './board.mjs';

const HOST='practice-host',YOU='practice-alex';
export const LESSONS={
  miner:{name:'Miner',art:'miner',summary:'Build a tunnel and find the gold.',steps:[
    {title:'Your secret role',text:'You are a miner. Reveal your role privately. Your goal is to connect the ladder to the gold.',scene:'role',role:'miner'},
    {title:'Place a tunnel',text:'Choose the straight tunnel. Tap an outlined space beside the ladder, then confirm the placement.',scene:'place',def:'straight-ew',action:{type:'play',x:1,y:0}},
    {title:'Rotate 180°',text:'Choose the turning tunnel, then Rotate 180°. Preview the space to the right of the ladder and confirm. Cards stay upright or upside down.',scene:'rotate',def:'corner-ne',action:{type:'play',x:1,y:0,rotation:180}},
    {title:'Reach the gold',text:'One tunnel is missing. Play your straight tunnel in the gap before the middle goal. Reaching the gold ends the round immediately.',scene:'win',def:'straight-ew',action:{type:'play',x:7,y:0}},
    {title:'Keep the reward private',text:'The miners choose gold one at a time. Your gold stays private until all three rounds finish. Visit Gold and rounds to practise choosing.',scene:'result'}]},
  saboteur:{name:'Saboteur',art:'saboteur',summary:'Block the route while keeping your role secret.',steps:[
    {title:'Your secret role',text:'You are a saboteur. Reveal your card privately. You win the round if every hand empties before the tunnel reaches gold.',scene:'role',role:'saboteur'},
    {title:'Stop a tunnel',text:'Choose the blocked straight tunnel. Place it to the right of the ladder. The stone between the two ends prevents a route through this card.',scene:'dead',def:'dead-ew',role:'saboteur',action:{type:'play',x:1,y:0}},
    {title:'Break a tool',text:'Choose Break pick. Select Rowan, then confirm. Any player can use this card; using it does not reveal your role.',scene:'break',def:'break-pick',role:'saboteur',action:{type:'play',target:'p2',tool:'pick'}},
    {title:'Discard one card',text:'Sometimes a card is unhelpful. Select it, choose Discard, then confirm. The discard stays face down. Draw one replacement and end your turn.',scene:'discard',def:'straight-ns',role:'saboteur',action:{type:'discard'}}]},
  tools:{name:'Tools',art:'break-pick',summary:'Break tools and repair one matching tool.',steps:[
    {title:'Break another player’s tool',text:'Choose Break pick and select Rowan. Confirm to break their pickaxe. They can still use actions or discard, but cannot place a tunnel.',scene:'break',def:'break-pick',action:{type:'play',target:'p2',tool:'pick'}},
    {title:'Repair your tool',text:'Your pickaxe is broken. Select Repair pick, choose yourself, then confirm. You may repair yourself or another player.',scene:'repair',def:'repair-pick',action:{type:'play',target:'p1',tool:'pick'}},
    {title:'Choose one repair',text:'This card shows two tools, but fixes only one. Choose Rowan, then Lantern, and confirm. Their cart stays broken.',scene:'double-repair',def:'repair-lantern-cart',action:{type:'play',target:'p2',tool:'lantern'}}]},
  map:{name:'Map',art:'map',summary:'Look at one hidden goal privately.',steps:[
    {title:'Inspect a goal',text:'Choose Map. Tap the middle face-down goal on the board, then confirm. You alone learn what is there.',scene:'map',def:'map',action:{type:'play',target:'goal-1'}},
    {title:'Keep a private note',text:'The middle goal contains gold in this example. Your map notes keep the result. The goal remains hidden on the shared screen.',scene:'map-note'}]},
  rockfall:{name:'Rockfall',art:'rockfall',summary:'Remove a tunnel and see what disconnects.',steps:[
    {title:'Remove one tunnel',text:'Select Rockfall. Tap the tunnel immediately right of the ladder, then confirm. You cannot remove the ladder or a goal.',scene:'rockfall',def:'rockfall',action:{type:'play',x:1,y:0}},
    {title:'Reconnect to the ladder',text:'The remaining tunnel is disconnected. Choose the straight tunnel and place it in the gap. New tunnels must always connect back to the ladder.',scene:'reconnect',def:'straight-ew',action:{type:'play',x:1,y:0}}]},
  gold:{name:'Gold and rounds',art:'gold-3',summary:'Choose rewards and finish a three-round game.',steps:[
    {title:'Choose your reward',text:'Miners win this example. The finder chooses first, then miners choose counterclockwise. Select one gold card. Gold cards drawn equal the number of miners.',scene:'gold',action:{type:'chooseGold',cardId:'practice-gold-3'}},
    {title:'Saboteur rewards',text:'One saboteur receives 4 nuggets after a failed mine. With two or three, each gets 3; with four, each gets 2. Miners get none that round.',scene:'sab-result'},
    {title:'A new role each round',text:'After the reward, the host starts the next round. Everyone gets a new hand and a new secret role. Your collected gold stays with you.',scene:'new-round'},
    {title:'The most gold wins',text:'After round three, all totals become public. The highest total wins. Equal highest totals share the victory.',scene:'finished'}]}
};
let serial=0;
const card=(defId,id='practice-card')=>({...CARD_DEFS[defId],id,groups:cardGroups(CARD_DEFS[defId])});
const tile=(defId,x,y)=>({kind:'path',defId,cardId:`example-${x}-${y}`,x,y,rotation:0,groups:cardGroups(CARD_DEFS[defId])});
export function fixture(step){
  let raw=createRoom('123456',HOST,'Teacher');
  for(const [key,name] of [[YOU,'Alex'],['practice-rowan','Rowan'],['practice-ivy','Ivy']])raw=command(raw,key,{type:'join',name,requestId:`practice-join-${++serial}`},()=>.4);
  raw=command(raw,HOST,{type:'start',expectedVersion:raw.version,requestId:`practice-start-${++serial}`},()=>.4);
  const me=raw.players[0];me.role=step.role||'miner';raw.players[1].role='miner';raw.players[2].role=me.role==='saboteur'?'miner':'saboteur';raw.turnId=me.id;
  me.hand=step.def?[card(step.def)]:[card('straight-ew')];
  raw.players[1].hand=[card('straight-ns','other-one')];raw.players[2].hand=[card('corner-ne','other-two')];
  raw.board=raw.board.map(g=>g.kind==='goal'?{...g,gold:g.id==='goal-1',groups:g.id==='goal-1'?[['n','e','s','w']]:[['n','w']]}:g);
  raw.log=[{round:1,text:'Fictional practice. No room is connected.'}];
  if(['repair'].includes(step.scene))me.broken=['pick'];
  if(step.scene==='double-repair')raw.players[1].broken=['lantern','cart'];
  if(['rockfall','reconnect'].includes(step.scene)){raw.board.push(tile('straight-ew',2,0));if(step.scene==='rockfall')raw.board.push(tile('straight-ew',1,0));}
  if(['win','result'].includes(step.scene)){for(let x=1;x<7;x++)raw.board.push(tile('straight-ew',x,0));if(step.scene==='result')raw=command(raw,YOU,{type:'play',cardId:me.hand[0].id,x:7,y:0,rotation:0,expectedVersion:raw.version,requestId:`practice-win-${++serial}`},()=>.4);}
  if(step.scene==='map-note')me.notes=[{goalId:'goal-1',gold:true,groups:[['n','e','s','w']]}];
  if(step.scene==='gold'){
    raw.phase='gold';raw.turnId=null;raw.result={winner:'miners',finderId:me.id,reason:'gold',round:1};
    raw.goldChoice={playerId:me.id,order:[me.id,raw.players[1].id],options:[{id:'practice-gold-1',value:1},{id:'practice-gold-3',value:3}]};
  }
  if(step.scene==='sab-result'){raw.phase='roundEnd';raw.turnId=null;raw.result={winner:'saboteurs',finderId:null,reason:'exhausted',round:1};raw.players[2].gold=[{id:'example-reward',value:3},{id:'example-reward2',value:1}];}
  if(step.scene==='new-round'){raw.round=2;me.role='saboteur';raw.players[2].role='miner';me.gold=[{id:'kept-gold',value:3}];}
  if(step.scene==='finished'){raw.round=3;raw.phase='finished';raw.turnId=null;raw.result={winner:'miners',round:3,reason:'gold'};me.gold=[{id:'one',value:3},{id:'two',value:3}];raw.players[1].gold=[{id:'three',value:3},{id:'four',value:2}];raw.players[2].gold=[{id:'five',value:3},{id:'six',value:3}];}
  return raw;
}
export async function createTutorial(api){
  let lesson=null,index=0,raw=null,completed=false,feedback='',demoTimers=[],demonstrating=false;
  const cancel=()=>{demoTimers.forEach(clearTimeout);demoTimers=[];demonstrating=false;};
  const schedule=(fn,ms)=>demoTimers.push(setTimeout(fn,matchMedia('(prefers-reduced-motion:reduce)').matches?0:ms));
  const step=()=>LESSONS[lesson].steps[index];
  function menu(){
    cancel();lesson=null;document.body.className='tutorial-mode';api.root.className='tutorial-menu';history.replaceState(null,'','?tutorial');
    api.root.innerHTML=`<section class="tutorial-intro"><div><span class="eyebrow">Learn to play</span><h1>A little practice first</h1><p>Choose a lesson. Try each action on a fictional board, or use Show me. Move on whenever you are ready.</p></div><a class="quiet" href="./">Back to game ↗</a></section><div class="lesson-grid">${Object.entries(LESSONS).map(([key,l])=>`<button class="lesson-option" data-lesson="${key}"><img src="assets/cards/${l.art}.webp" alt=""><div><h2>${l.name}</h2><p>${l.summary}</p><small>${l.steps.length} steps · start lesson →</small></div></button>`).join('')}</div><p class="tutorial-safe">Practice never joins a room, sends game requests, or changes your saved game.</p>`;
    api.root.querySelectorAll('[data-lesson]').forEach(b=>b.onclick=()=>start(b.dataset.lesson));
  }
  function start(name){if(!LESSONS[name])return menu();lesson=name;index=0;load(0);}
  function load(i){cancel();api.closeModal();index=i;completed=false;feedback='';raw=fixture(step());api.resetSelection();api.resetBoard();api.setReveal(step().scene!=='role');history.replaceState(null,'',`?tutorial=${lesson}`);api.render(view(raw,YOU));window.scrollTo({top:0,behavior:'instant'});}
  function decorate(){
    if(!lesson)return;const current=step();
    const existing=[api.root.querySelector('.turn-banner'),api.root.querySelector('.room-layout'),...api.root.querySelectorAll('.result-banner,.gold-choice')].filter(Boolean);
    api.root.querySelector('.lesson-header')?.remove();api.root.querySelector('.lesson-shell')?.remove();api.root.querySelector('.lesson-navigation')?.remove();
    const head=document.createElement('div');head.className='lesson-header';head.innerHTML=`<button class="quiet" id="all-lessons">← All lessons</button><span>${esc(LESSONS[lesson].name)} · Step ${index+1} of ${LESSONS[lesson].steps.length}</span><a class="quiet" href="./">Exit practice</a>`;
    const shell=document.createElement('div');shell.className='lesson-shell';shell.innerHTML=`<aside class="lesson-coach"><span class="eyebrow">${current.action||current.scene==='role'?'Try it':'Take a look'}</span><h1 id="lesson-title" tabindex="-1">${esc(current.title)}</h1><p>${esc(current.text)}</p>${current.action||current.scene==='role'?`<button class="secondary show-me" id="show-me">${demonstrating?'Showing…':'Show me'}</button>`:''}<details class="lesson-steps" open><summary>Lesson steps</summary><ol>${LESSONS[lesson].steps.map((s,i)=>`<li><button data-step="${i}" ${i===index?'aria-current="step"':''}>${esc(s.title)}</button></li>`).join('')}</ol></details></aside><section class="lesson-stage scene-${esc(current.scene)} ${current.scene==='role'?'role-only':''} ${!current.action&&current.scene!=='role'?'observe-only':''}" aria-label="Fictional practice example"><div class="practice-reset"><button id="reset-example" class="quiet">↶ Reset example</button></div><div class="practice-content"></div><div class="lesson-feedback" role="status" aria-live="polite">${esc(feedback)}</div></section>`;
    const stage=shell.querySelector('.practice-content');existing.forEach(n=>stage.append(n));
    if(current.scene==='finished')stage.querySelector('.room-sidebar')?.style.setProperty('display','block');
    const nav=document.createElement('div');nav.className='lesson-navigation';nav.innerHTML=`<button class="secondary" id="previous-step" ${index?'':'disabled'}>← Previous</button><span class="lesson-dots" aria-hidden="true">${LESSONS[lesson].steps.map((_,i)=>`<i class="${i<=index?'done':''}"></i>`).join('')}</span><button class="primary" id="next-step">${index===LESSONS[lesson].steps.length-1?'Finish lesson':'Next step →'}</button>`;
    api.root.prepend(head);api.root.append(shell,nav);
    api.root.querySelector('#all-lessons').onclick=menu;api.root.querySelector('#reset-example').onclick=()=>load(index);
    api.root.querySelector('#previous-step').onclick=()=>load(index-1);api.root.querySelector('#next-step').onclick=()=>index===LESSONS[lesson].steps.length-1?menu():load(index+1);
    api.root.querySelectorAll('[data-step]').forEach(b=>b.onclick=()=>load(Number(b.dataset.step)));
    api.root.querySelector('#show-me')?.addEventListener('click',demonstrate);
    if(current.scene==='map-note'){const notes=api.root.querySelector('.private-notes');if(notes)notes.open=true;}
  }
  function act(body){
    try{raw=command(raw,YOU,{...body,expectedVersion:raw.version,requestId:`practice-action-${++serial}`},()=>.4);completed=true;
      feedback=body.type==='chooseGold'?'You kept that gold card. Your total is private.':body.type==='discard'?'One card discarded privately. You drew a replacement; your turn ended.':kindOf(body)==='map'?'Goal 2 contains gold. Your note is private.':step().scene==='double-repair'?'Rowan’s lantern works again. Their cart is still broken.':step().scene==='dead'?'The blocked tunnel is placed. Its two ends do not connect.':step().scene==='win'?'The tunnel reached gold. Miners win this round.':step().scene==='break'?'Rowan’s pickaxe is broken. Your card was replaced and your turn ended.':step().scene==='repair'?'Your pickaxe works again. You can place tunnels on a later turn.':step().scene==='rockfall'?'The tunnel is removed. The farther tunnel is now disconnected.':'Card played. You drew a replacement and your turn ended.';
      api.resetSelection();api.render(view(raw,YOU));return true;
    }catch(e){api.toast(e.message);return false;}
  }
  function kindOf(body){return raw.players[0].notes.length&&body.type==='play'&&step().scene==='map'?'map':'';}
  function demonstrate(){
    cancel();if(completed)load(index);demonstrating=true;const action=step().action;
    if(step().scene==='role'){api.root.querySelector('#reveal')?.click();feedback='Your role is visible only on your device. Hide it when you finish.';completed=true;demonstrating=false;api.render(view(raw,YOU));return;}
    if(action?.type==='chooseGold'){api.root.querySelector(`[data-gold="${action.cardId}"]`)?.click();demonstrating=false;return;}
    const me=raw.players[0];api.selectCard(me.hand[0].id);
    schedule(()=>{
      if(action.rotation===180)api.root.querySelector('#rotate')?.click();
      if(action.type==='discard'){api.root.querySelector('#discard')?.click();schedule(()=>document.querySelector('#confirm-discard')?.click(),400);}
      else {if(action.x!==undefined)api.chooseCell(action.x,action.y);if(action.target)api.chooseTarget(action.target,action.tool);schedule(()=>api.root.querySelector('#confirm-card')?.click(),500);}
      demonstrating=false;
    },400);
  }
  return {start,decorate,act,get raw(){return raw;},get currentStep(){return step();}};
}

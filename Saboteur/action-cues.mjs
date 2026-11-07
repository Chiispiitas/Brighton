// Consume only the public log and board. Never inspect hands, notes or gold values.
export function publicActionCues(previous,next) {
  if(!previous || previous.code!==next.code || next.version<=previous.version)return [];
  const before=previous.log||[],after=next.log||[];
  let overlap=Math.min(before.length,after.length);
  while(overlap && !before.slice(-overlap).every((e,i)=>JSON.stringify(e)===JSON.stringify(after[i])))overlap--;
  return after.slice(overlap).flatMap(e=>{
    const text=e.text||'';
    const kind=/ broke /.test(text)?'break':/ repaired /.test(text)?'repair':/ removed a tunnel/.test(text)?'rockfall':/ discarded /.test(text)?'discard':/ chose a gold card/.test(text)?'reward':/win this round|Three rounds complete/.test(text)?'result':/gold has been found|goal contains stone/.test(text)?'reveal':/^Round \d/.test(text)?'deal':null;
    if(!kind)return [];
    const target=(next.players||[]).find(p=>text.includes(`${p.name}’s`));
    const removed=kind==='rockfall'?(previous.board||[]).find(t=>t.kind==='path'&&!(next.board||[]).some(n=>n.x===t.x&&n.y===t.y)):null;
    return [{kind,text,targetId:target?.id,...(removed?{x:removed.x,y:removed.y}:{})}];
  });
}
export function animatePublicAction(cue) {
  const icons={break:'⛏',repair:'✓',rockfall:'◆',discard:'▰',reward:'✦',result:'✦',reveal:'◉',deal:'▰'};
  const notice=document.createElement('div');notice.className=`public-action-cue cue-${cue.kind}`;notice.setAttribute('role','status');
  const icon=document.createElement('span');icon.className='public-action-icon';icon.setAttribute('aria-hidden','true');icon.textContent=icons[cue.kind];
  const text=document.createElement('span');text.textContent=cue.text;notice.append(icon,text);document.body.append(notice);
  const target=cue.targetId?[...document.querySelectorAll('[data-public-player]')].find(n=>n.dataset.publicPlayer===cue.targetId):null;
  target?.classList.add(`action-${cue.kind}`);
  if(cue.kind==='rockfall'){
    const world=document.querySelector('.board-world'),tile=document.querySelector('[data-tile="0,0"]');
    if(world&&tile){const dust=document.createElement('span');dust.className='rockfall-dust';dust.textContent='◆ · ◆';dust.style.left=`${parseFloat(tile.style.left)+cue.x*78}px`;dust.style.top=`${parseFloat(tile.style.top)+cue.y*120}px`;world.append(dust);setTimeout(()=>dust.remove(),2200);}
  }
  setTimeout(()=>{notice.remove();target?.classList.remove(`action-${cue.kind}`);},3000);
}

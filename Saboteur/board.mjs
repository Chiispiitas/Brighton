export const esc = value => String(value ?? '').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const POINTS={N:[50,0],E:[100,50],S:[50,100],W:[0,50],n:[50,0],e:[100,50],s:[50,100],w:[0,50],0:[50,0],1:[100,50],2:[50,100],3:[0,50]};
export const TOOL_NAMES={pick:'Pickaxe',pickaxe:'Pickaxe',lamp:'Lantern',lantern:'Lantern',cart:'Mine cart',wagon:'Mine cart'};
export function cardName(card){return card?.name||({path:'Tunnel',break:'Broken tool',repair:'Repair tool',map:'Map',rockfall:'Rockfall',gold:'Gold'}[card?.kind||card?.type])||'Card';}
function groups(card){
  if(card?.groups)return card.groups;
  if(card?.connections)return card.connections;
  if(card?.edges)return [card.edges];
  return [['N','E','S','W']];
}
export function pathSvg(card,rotation=0){
  const gs=groups(card).map(g=>typeof g==='string'?g.split(''):g);
  const paths=gs.map(g=>{
    const points=g.map(x=>POINTS[x]).filter(Boolean);if(!points.length)return '';
    if(points.length===1){const [x,y]=points[0];return `M${x} ${y}L${x===0?28:x===100?72:50} ${y===0?28:y===100?72:50}`;}
    return points.map(([x,y])=>`M${x} ${y}Q50 50 50 50`).join('');
  }).join('');
  return `<svg class="tunnel-svg" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true"><g transform="rotate(${rotation} 50 50)"><path d="${paths}" fill="none" stroke="#33271f" stroke-width="26" stroke-linejoin="round" stroke-linecap="butt"/><path d="${paths}" fill="none" stroke="#ead8ad" stroke-width="18" stroke-linejoin="round" stroke-linecap="butt"/><path d="${paths}" fill="none" stroke="#baa174" stroke-width="1.5" stroke-dasharray="2 5"/>${gs.filter(g=>g.length===1).map(g=>{const p=POINTS[g[0]];return p?`<path d="${p[1]===0?'M39 28H61':p[1]===100?'M39 72H61':p[0]===0?'M28 39V61':'M72 39V61'}" stroke="#32251c" stroke-width="5"/>`:'';}).join('')}</g></svg>`;
}
function cardArt(card){
  const type=card?.kind||card?.type||'path';
  if(card?.defId)return `<img class="physical-card" src="assets/cards/${esc(card.defId)}.webp" alt="" style="transform:rotate(${card.rotation||0}deg)">`;
  if(type==='path')return pathSvg(card,card.rotation||0);
  const tools=(card.tools||[card.tool]).filter(Boolean), names={pick:'repair-pick',lantern:'repair-lantern',lamp:'repair-lantern',cart:'repair-cart'};
  const pictures=['map','rockfall','gold'].includes(type)?[type==='gold'?'gold-1':type]:tools.map(t=>names[t]||t);
  return `<span class="action-art action-${esc(type)}" aria-hidden="true">${pictures.map(p=>`<img src="assets/cards/${esc(p)}.webp" alt="">`).join('')}${type==='break'?'<em>×</em>':type==='repair'?'<em>+</em>':''}</span>`;
}
export function cardHtml(card,{selected=false,button=true,rotation=0,small=false,hidden=false}={}){
  const tag=button?'button':'div';const id=card?.id||'';
  return `<${tag} class="game-card ${small?'small-card':''} ${selected?'selected':''} ${hidden?'card-back':''} ${esc(card?.kind||card?.type||'')}" ${button?`type="button" data-card="${esc(id)}" aria-pressed="${selected}"`:''} ${hidden?'aria-label="Hidden card"':`aria-label="${esc(cardName(card))}"`}>
  ${hidden?'<span class="back-emblem" aria-hidden="true">⛏</span>':`<span class="card-face" style="--rotation:${rotation}deg">${cardArt({...card,rotation})}</span><span class="card-label">${esc(cardName(card))}</span>`}</${tag}>`;
}
export function boardHtml(){return `<section class="board-panel" aria-label="Tunnel board"><div class="board-toolbar"><span class="board-caption">The mine</span><div class="board-controls"><button class="icon-button" data-zoom="out" aria-label="Zoom out">−</button><button data-zoom="fit" class="fit-button">Fit board</button><button class="icon-button" data-zoom="in" aria-label="Zoom in">+</button></div></div><div class="board-viewport" tabindex="0" aria-label="Tunnel board. Drag to move; use zoom buttons to change scale."><div class="board-world"></div></div><p class="board-feedback" role="status">Select a tunnel card to see placements.</p></section>`;}
export function cardVisual(cell){
  if(cell.kind==='start')return {id:'start',rotation:0};
  if(cell.kind==='goal'){
    if(cell.gold)return {id:'goal-gold',rotation:0};
    const ports=(cell.groups||[]).flat().sort().join('');
    return ({en:{id:'goal-stone-ne',rotation:0},sw:{id:'goal-stone-ne',rotation:180},nw:{id:'goal-stone-nw',rotation:0},es:{id:'goal-stone-nw',rotation:180}})[ports]||{id:'goal-stone-nw',rotation:0};
  }
  return {id:cell.defId,rotation:cell.rotation||0};
}
function tileArt(cell){
  const {id,rotation}=cardVisual(cell);
  return id?`<img class="physical-card" src="assets/cards/${esc(id)}.webp" alt="" style="transform:rotate(${rotation}deg)">`:pathSvg(cell,0);
}
export class TunnelBoard{
  constructor(root,{onCell=()=>{},onGoal=()=>{},onTile=()=>{}}={}){
    this.root=root;this.viewport=root.querySelector('.board-viewport');this.world=root.querySelector('.board-world');this.onCell=onCell;this.onGoal=onGoal;this.onTile=onTile;this.scale=.82;this.x=22;this.y=18;this.pointers=new Map();this.lastClick=0;this.dragged=false;this.fitted=false;
    root.querySelectorAll('[data-zoom]').forEach(b=>b.onclick=()=>b.dataset.zoom==='fit'?this.fit():this.zoom(b.dataset.zoom==='in'?1.2:1/1.2));
    this.viewport.addEventListener('pointerdown',e=>{if(e.button!==0)return;this.pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});this.start={x:e.clientX,y:e.clientY};this.dragged=false;this.viewport.setPointerCapture(e.pointerId);});
    this.viewport.addEventListener('pointermove',e=>{if(!this.pointers.has(e.pointerId))return;const old=this.pointers.get(e.pointerId);const before=[...this.pointers.values()];this.pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});const after=[...this.pointers.values()];if(this.pointers.size===2){const dist=p=>Math.hypot(p[0].x-p[1].x,p[0].y-p[1].y);this.zoom(dist(after)/Math.max(1,dist(before)));this.dragged=true;}else {this.x+=e.clientX-old.x;this.y+=e.clientY-old.y;if(Math.hypot(e.clientX-this.start.x,e.clientY-this.start.y)>6)this.dragged=true;this.transform();}});
    const up=e=>{const dragged=this.dragged;this.pointers.delete(e.pointerId);if(!dragged&&e.type==='pointerup'){const target=document.elementFromPoint(e.clientX,e.clientY)?.closest('[data-cell],[data-goal],[data-tile]');if(target?.dataset.cell){const [x,y]=target.dataset.cell.split(',').map(Number);this.onCell(x,y);}else if(target?.dataset.goal)this.onGoal(target.dataset.goal);else if(target?.dataset.tile){const [x,y]=target.dataset.tile.split(',').map(Number);this.onTile(x,y);}}};
    this.viewport.addEventListener('pointerup',up);this.viewport.addEventListener('pointercancel',up);
    this.viewport.addEventListener('wheel',e=>{if(e.ctrlKey||e.metaKey){e.preventDefault();this.zoom(e.deltaY<0?1.1:1/1.1);}}, {passive:false});
    this.viewport.addEventListener('keydown',e=>{const offsets={ArrowLeft:[30,0],ArrowRight:[-30,0],ArrowUp:[0,30],ArrowDown:[0,-30]};if(offsets[e.key]){e.preventDefault();this.x+=offsets[e.key][0];this.y+=offsets[e.key][1];this.transform();}else if(['+','='].includes(e.key))this.zoom(1.15);else if(e.key==='-')this.zoom(1/1.15);});
    this.world.addEventListener('click',e=>{if(e.detail!==0)return;const t=e.target.closest('[data-cell],[data-goal],[data-tile]');if(t?.dataset.cell){const [x,y]=t.dataset.cell.split(',').map(Number);this.onCell(x,y);}else if(t?.dataset.goal)this.onGoal(t.dataset.goal);else if(t?.dataset.tile){const [x,y]=t.dataset.tile.split(',').map(Number);this.onTile(x,y);}});
  }
  transform(){this.world.style.transform=`translate(${this.x}px,${this.y}px) scale(${this.scale})`;}
  zoom(factor){const old=this.scale;this.scale=Math.max(.25,Math.min(1.8,old*factor));const cx=this.viewport.clientWidth/2,cy=this.viewport.clientHeight/2;this.x=cx-(cx-this.x)*this.scale/old;this.y=cy-(cy-this.y)*this.scale/old;this.transform();}
  fit(){if(!this.viewport.clientWidth||!this.viewport.clientHeight)return;const w=this.bounds.width*78,h=this.bounds.height*120;this.scale=Math.max(.25,Math.min(1.05,(this.viewport.clientWidth-32)/w,(this.viewport.clientHeight-32)/h));this.x=(this.viewport.clientWidth-w*this.scale)/2;this.y=(this.viewport.clientHeight-h*this.scale)/2;this.transform();this.fitted=true;}
  focusOn(x,y,minScale=.62){if(!this.viewport.clientWidth)return;this.scale=Math.max(this.scale,minScale);this.x=this.viewport.clientWidth/2-((x-this.bounds.minX)*78+39)*this.scale;this.y=this.viewport.clientHeight/2-((y-this.bounds.minY)*120+60)*this.scale;this.transform();}
  update(state,{placements=[],selectedCell=null,selectedCard=null,rotation=0,actionType=null,actionTarget=null}={}){
    let tiles=Array.isArray(state.board)?state.board:Object.entries(state.board||{}).map(([key,v])=>({...v,x:v.x??Number(key.split(',')[0]),y:v.y??Number(key.split(',')[1])}));
    const goals=state.goals||tiles.filter(t=>t.kind==='goal');tiles=tiles.filter(t=>t.kind!=='goal');const all=[...tiles,...goals,...placements,{x:0,y:0},{x:8,y:-2},{x:8,y:2}];
    const minX=Math.min(...all.map(t=>t.x)),maxX=Math.max(...all.map(t=>t.x)),minY=Math.min(...all.map(t=>t.y)),maxY=Math.max(...all.map(t=>t.y));
    this.bounds={minX,minY,width:maxX-minX+1,height:maxY-minY+1};
    const pos=(x,y)=>`left:${(x-minX)*78}px;top:${(y-minY )*120}px`;
    const distinct=new Map(placements.map(p=>[`${p.x},${p.y}`,p]));
    this.world.style.width=`${this.bounds.width*78}px`;this.world.style.height=`${this.bounds.height*120}px`;
    this.world.innerHTML=`<div class="mine-grid" style="width:100%;height:100%"></div>${tiles.map(t=>{
      const c=t.card||t,active=actionType==='rockfall'&&t.kind!=='start',tag=active?'button':'div',chosen=active&&actionTarget?.x===t.x&&actionTarget?.y===t.y;return `<${tag} class="board-tile ${t.start||t.kind==='start'?'start-tile':''} ${active?'target-tile':''} ${chosen?'chosen-target':''}" data-tile="${t.x},${t.y}" ${active?`aria-label="Remove tunnel at column ${t.x}, row ${t.y}" aria-pressed="${chosen}"`:''} style="${pos(t.x,t.y)}">${t.start||t.kind==='start'?'<span class="start-label">START</span>':''}${tileArt(c)}</${tag}>`;
    }).join('')}${goals.map((g,i)=>{const active=actionType==='map'&&!g.revealed,tag=active?'button':'div',chosen=active&&actionTarget?.id===g.id;return `<${tag} class="board-tile goal-tile ${g.revealed?'revealed':''} ${active?'target-tile':''} ${chosen?'chosen-target':''}" data-goal="${esc(g.id??i)}" ${active?`aria-label="Inspect goal ${i+1}" aria-pressed="${chosen}"`:''} style="${pos(g.x??8,g.y??(i-1)*2)}">${g.revealed?tileArt(g):`<img class="physical-card" src="assets/cards/back.webp" alt=""><span class="goal-number">${i+1}</span><span class="goal-mark">?</span>`}</${tag}>`;}).join('')}${[...distinct.values()].map(p=>{const selected=selectedCell?.x===p.x&&selectedCell?.y===p.y;return `<button class="placement ${selected?'preview-cell':''}" data-cell="${p.x},${p.y}" style="${pos(p.x,p.y)}" aria-label="Place tunnel at column ${p.x}, row ${p.y}" aria-pressed="${selected}">${selected&&selectedCard?tileArt({...selectedCard,rotation}):'+'}</button>`;}).join('')}`;
    if(!this.fitted)this.fit();else this.transform();
    this.root.querySelector('.board-feedback').textContent=selectedCell?'Placement preview. Confirm to play this card.':actionType==='map'?'Choose a face-down goal card to inspect privately.':actionType==='rockfall'?'Choose a tunnel to remove. The start and goals stay.':placements.length?`${distinct.size} legal spaces · choose one to preview.`:(selectedCard?.kind||selectedCard?.type)==='path'?'No legal spaces in this orientation. Try Rotate or discard.':'Select a tunnel card to see placements.';
  }
}

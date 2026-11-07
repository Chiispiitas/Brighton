// Only public inspection facts belong here; no goal contents or private notes.
export function newInspections(previous, next) {
  if (!previous || previous.code !== next.code) return [];
  return (next.log || []).filter(e => e.kind === 'inspection' && Number.isInteger(e.version) && e.version > previous.version && e.version <= next.version);
}
let animatedPlacement = '';
export function notifyPlacement(placement) {
  const tile=[...document.querySelectorAll('[data-tile]')].find(el=>el.dataset.tile===`${placement.x},${placement.y}`);
  const rect=tile?.getBoundingClientRect();
  if(rect?.width && rect.top>=0 && rect.bottom<=innerHeight && rect.left>=0 && rect.right<=innerWidth) return;
  const notice=document.createElement('div');notice.className='inspection-cursor inspection-message';notice.setAttribute('role','status');notice.textContent=`${placement.actorName} placed a tunnel`;document.body.append(notice);setTimeout(()=>notice.remove(),3200);
}
export function labelPlacement(state) {
  const placement=state.lastPlacement;
  if (!placement) return;
  const tile=[...document.querySelectorAll('[data-tile]')].find(el=>el.dataset.tile===`${placement.x},${placement.y}`);
  if (!tile) return;
  const label=document.createElement('span'); label.className='placement-label'; label.textContent=placement.actorName; tile.append(label);
  const id=`${state.code}:${placement.version}`;
  if (animatedPlacement!==id) { tile.classList.add('card-arriving'); animatedPlacement=id; }
}
export function notifyInspection(event) {
  const goal = [...document.querySelectorAll('[data-goal]')].find(el => el.dataset.goal === event.goalId);
  const rect = goal?.getBoundingClientRect();
  const visible = rect && rect.width && rect.height && rect.top >= 0 && rect.bottom <= innerHeight && rect.left >= 0 && rect.right <= innerWidth;
  const marker = document.createElement('div');
  marker.className = `inspection-cursor ${visible ? 'on-goal' : 'inspection-message'}`;
  marker.setAttribute('role','status');
  marker.setAttribute('aria-live','polite');
  const cursor = document.createElement('span'); cursor.className='inspection-pointer'; cursor.setAttribute('aria-hidden','true'); cursor.textContent='➤';
  const label = document.createElement('span'); label.textContent=`${event.actorName} inspected goal ${event.goalNumber}`;
  marker.append(cursor,label);
  if (visible) { marker.style.left=`${Math.min(innerWidth-250, Math.max(12,rect.left+rect.width/2))}px`; marker.style.top=`${Math.max(12,rect.top+rect.height/2)}px`; goal.classList.add('inspection-highlight'); }
  document.body.append(marker);
  setTimeout(()=>{marker.remove();goal?.classList.remove('inspection-highlight');},3200);
}

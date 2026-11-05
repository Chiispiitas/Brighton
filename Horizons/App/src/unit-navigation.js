// Register only implemented units with real destinations; no placeholder curriculum.
export const unitRoutes=[{id:1,label:'Unit 1',href:'#learn'}];
export function adjacentUnit(units,current,direction){const index=units.findIndex(unit=>unit.id===current);return index<0?null:units[index+direction]||null;}
export function updateBoundary(button,atEdge,neighbor){
 const wasGoto=button.classList.contains('unit-goto');
 button.disabled=atEdge&&!neighbor;button.hidden=button.disabled;button.classList.toggle('unit-goto',!!(atEdge&&neighbor));
 button.dataset.unitHref=atEdge&&neighbor?neighbor.href:'';
 if(atEdge&&neighbor){button.textContent='Go to '+neighbor.label;button.setAttribute('aria-label','Go to '+neighbor.label);}
 else{if(wasGoto)button.innerHTML=button.dataset.arrowMarkup;button.setAttribute('aria-label',Number(button.dataset.pathPan)<0?'Scroll path left':'Scroll path right');}
}

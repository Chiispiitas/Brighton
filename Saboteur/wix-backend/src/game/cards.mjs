// The 67-card draw pile of the original base game; start/goals are separate.
export const TOOLS = ['pick', 'lantern', 'cart'];
export const CARD_DEFS = {};
const define = (defId, name, kind, count, extra = {}) => {
  CARD_DEFS[defId] = Object.freeze({ defId, name, kind, count, ...extra });
};
define('cross', 'Crossroads', 'path', 5, { groups: [['n','e','s','w']] });
define('tee-east', 'Three-way tunnel', 'path', 5, { groups: [['n','e','s']] });
define('tee-north', 'Three-way tunnel', 'path', 5, { groups: [['n','e','w']] });
define('corner-ne', 'Turning tunnel', 'path', 5, { groups: [['n','e']] });
define('corner-nw', 'Turning tunnel', 'path', 4, { groups: [['n','w']] });
define('straight-ns', 'Straight tunnel', 'path', 4, { groups: [['n','s']] });
define('straight-ew', 'Straight tunnel', 'path', 3, { groups: [['e','w']] });
define('dead-n', 'Dead end', 'path', 1, { groups: [['n']] });
define('dead-e', 'Dead end', 'path', 1, { groups: [['e']] });
define('dead-ne', 'Blocked turn', 'path', 1, { groups: [['n'],['e']] });
define('dead-nw', 'Blocked turn', 'path', 1, { groups: [['n'],['w']] });
define('dead-ns', 'Blocked straight tunnel', 'path', 1, { groups: [['n'],['s']] });
define('dead-ew', 'Blocked straight tunnel', 'path', 1, { groups: [['e'],['w']] });
define('dead-nes', 'Blocked three-way tunnel', 'path', 1, { groups: [['n'],['e'],['s']] });
define('dead-new', 'Blocked three-way tunnel', 'path', 1, { groups: [['n'],['e'],['w']] });
define('dead-cross', 'Blocked crossroads', 'path', 1, { groups: [['n'],['e'],['s'],['w']] });
for (const tool of TOOLS) {
  define(`break-${tool}`, `Break ${tool}`, 'break', 3, { tools: [tool] });
  define(`repair-${tool}`, `Repair ${tool}`, 'repair', 2, { tools: [tool] });
}
define('repair-pick-lantern', 'Repair pick or lantern', 'repair', 1, { tools: ['pick','lantern'] });
define('repair-pick-cart', 'Repair pick or cart', 'repair', 1, { tools: ['pick','cart'] });
define('repair-lantern-cart', 'Repair lantern or cart', 'repair', 1, { tools: ['lantern','cart'] });
define('map', 'Map', 'map', 6);
define('rockfall', 'Rockfall', 'rockfall', 3);
export const DECK = Object.freeze(Object.values(CARD_DEFS).flatMap(def => Array(def.count).fill(def.defId)));
export const GOLD_VALUES = Object.freeze([...Array(16).fill(1), ...Array(8).fill(2), ...Array(4).fill(3)]);
const opposite = { n: 's', e: 'w', s: 'n', w: 'e' };
export function cardGroups(card, rotation = 0) {
  const def = typeof card === 'string' ? CARD_DEFS[card] : card;
  const groups = def?.groups || CARD_DEFS[def?.defId]?.groups || [];
  return groups.map(group => group.map(edge => rotation === 180 ? opposite[edge] : edge));
}
export function makeCard(defId, id) {
  return { ...CARD_DEFS[defId], id, groups: CARD_DEFS[defId].groups?.map(g => [...g]) };
}

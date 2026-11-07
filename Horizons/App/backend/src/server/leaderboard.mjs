// Weekly competition uses immutable, server-graded attempt XP. No client score writes.
export const RANKS=['Wood','Stone','Iron','Gold','Diamond','Obsidian','Masters'];
export function weekAt(value){const d=new Date(value);d.setUTCHours(0,0,0,0);d.setUTCDate(d.getUTCDate()-((d.getUTCDay()+6)%7));return d.toISOString();}
const endOf=week=>new Date(Date.parse(week)+7*86400000).toISOString();
const seed=value=>{let h=2166136261;for(const c of value)h=Math.imul(h^c.charCodeAt(0),16777619);return h>>>0;};
const names=['Cedar Fox','Mango Finch','River Otter','Indigo Owl','Coral Kite','Hazel Lynx','Sunny Wren','Mint Panda','Amber Robin','Fern Koala','Maple Hare','Peach Seal','Olive Deer','Lemon Lark','Blue Badger','Plum Puffin','Poppy Finch','Silver Newt','Ruby Moth','Teal Gecko'];
export function createLeaderboard(store,{now,idFor,collections:C}){
 const T=C.throttle;
 async function once(id,value,scope){try{return await store.create(T,id,value,scope);}catch(error){const row=await store.get(T,id);if(!row)throw error;return row;}}
 async function join(profileId,week){
  const key=await idFor('league-member:'+week+':'+profileId),known=await store.get(T,key);if(known)return known;
  const scope='league-week:'+week;
  const all=await store.list(T,scope),lobbies=[...new Set(all.map(x=>x.lobby))].sort();
  // Fill existing human groups first, independent of rank. Random slot order avoids fixed seating.
  for(let group=0;group<=lobbies.length+1;group++){
   const lobby=lobbies[group]||week+':'+group;
   for(let j=0;j<20;j++){
    const slot=(j+seed(profileId+week))%20,id=await idFor('league-slot:'+lobby+':'+slot);
    const seat=await once(id,{kind:'league-seat',week,lobby,slot,profileId},scope);
    if(seat.profileId!==profileId)continue;
    return once(key,{kind:'league-member',week,lobby,slot,profileId},'league-profile:'+profileId);
   }
  }
  throw Error('No competition seat available');
 }
 async function rowsFor(member,at){
  const seats=(await store.list(T,'league-week:'+member.week)).filter(x=>x.lobby===member.lobby);
  const humans=[];
  for(const seat of seats){
   const pointer=await store.get(T,await idFor('league-member:'+member.week+':'+seat.profileId));
   if(!pointer||pointer.lobby!==seat.lobby||pointer.slot!==seat.slot||humans.some(x=>x.profileId===seat.profileId))continue;
   const [profile,events]=await Promise.all([store.get(C.profiles,seat.profileId),store.list(C.attempts,seat.profileId)]);
   if(!profile)continue;
   const xp=events.filter(e=>e.createdAt>=member.week&&e.createdAt<endOf(member.week)).reduce((n,e)=>n+Math.max(0,Number(e.xp)||0),0);
   humans.push({profileId:seat.profileId,id:await idFor('league-public:'+seat.profileId),name:profile.displayName,avatar:profile.avatar,xp,bot:false,slot:seat.slot});
  }
  const occupied=new Set(humans.map(x=>x.slot)),phase=Math.max(0,Math.min(1,(Date.parse(at)-Date.parse(member.week))/(7*86400000)));
  const rows=[...humans];
  for(let slot=0;slot<20;slot++)if(!occupied.has(slot)){
   const s=seed(member.lobby+':'+slot),target=150+s%751;
   rows.push({id:'practice-'+slot,name:names[(slot+seed(member.lobby))%names.length],avatar:{body:s%2?'female':'male',skin:'skin-'+(1+s%6),hair:'hair-'+(1+s%12),hairColor:['color-black','color-brown','color-auburn','color-blond'][s%4],outfit:'outfit-'+(1+s%10),background:['bg-cream','bg-sky','bg-mint','bg-rose'][s%4],accessory:s%3?'none':'accessory-1'},xp:Math.floor(target*phase/5)*5,bot:true,slot});
  }
  rows.sort((a,b)=>b.xp-a.xp||seed(a.id+member.week)-seed(b.id+member.week));
  return rows.map((r,i)=>({...r,position:i+1}));
 }
 async function enrollHumans(week,at){
  if(typeof store.scan!=='function')return;
  async function scanAll(collection){const rows=[];for(let offset=0;offset<20000;offset+=100){const page=await store.scan(collection,offset,100);rows.push(...page);if(page.length<100)return rows;}throw Error('Competition account inventory exceeds safe paging bound');}
  const [codes,claims]=await Promise.all([scanAll(C.codes),scanAll(C.claims)]);
  const eligible=new Set(codes.filter(c=>!c.disabled&&['individual','production'].includes(c.kind)).map(c=>c.id));
  const humans=[...new Set(claims.filter(c=>eligible.has(c.codeId)&&c.bookId==='horizons-a1'&&c.expiresAt>at).map(c=>c.profileId))].sort((a,b)=>seed(a+week)-seed(b+week));
  for(const id of humans)if(await store.get(C.profiles,id))await join(id,week);
 }
 async function get(profileId){
  const at=now(),week=weekAt(at);await enrollHumans(week,at);const member=await join(profileId,week),history=(await store.list(T,'league-profile:'+profileId)).filter(x=>x.week<week).sort((a,b)=>a.week.localeCompare(b.week));
  let rank=0,lastResult=null;
  for(const past of history){
   const resultId=await idFor('league-result:'+past.week+':'+profileId);let result=await store.get(T,resultId);
   if(!result){const rows=await rowsFor(past,endOf(past.week)),me=rows.find(r=>r.profileId===profileId),cutoff=Math.max(1,Math.ceil(rows.length*.25));result=await once(resultId,{week:past.week,position:me?.position||20,xp:me?.xp||0,promoted:!!me&&me.xp>=100&&me.position<=cutoff},'league-results:'+profileId);}
   const advanced=result.promoted&&rank<RANKS.length-1;if(advanced)rank++;lastResult={...result,promoted:advanced};
  }
  const rows=await rowsFor(member,at),cutoff=Math.max(1,Math.ceil(rows.length*.25));
  return {ok:true,week,endsAt:endOf(week),rank,rankName:RANKS[rank],nextRank:RANKS[rank+1]||null,cutoff,minimumXp:100,lastResult,rows:rows.map(({profileId:id,slot,...r})=>({...r,self:id===profileId}))};
 }
 return {get,join};
}

import type { APIRoute } from 'astro';
import { items } from '@wix/data';
import { auth } from '@wix/essentials';
import { createRoom, command, view, publicLobby, needsTick, GameError } from '../../game/engine.mjs';

export const prerender = false;
const COLLECTION = 'DrawGuessStates';
const ORIGINS = new Set(['https://exams.bebrighton.net', 'http://localhost:4177', 'http://127.0.0.1:4177']);
const insert = auth.elevate(items.insert);
const query = auth.elevate(items.query);
const bulkRemove = auth.elevate(items.bulkRemove);
const cache = new Map<string, { state: any; until: number }>();
const pending = new Map<string, Promise<any>>();
const random = () => crypto.getRandomValues(new Uint32Array(1))[0] / 4294967296;
async function digest(token: string) {
  const bytes = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(token));
  return [...new Uint8Array(bytes)].map(x => x.toString(16).padStart(2, '0')).join('');
}
async function latest(code: string, fresh = false) {
  if (!fresh && cache.get(code)?.until! > Date.now()) return cache.get(code)!.state;
  if (!fresh && pending.has(code)) return pending.get(code);
  const load = (async () => {
    const r = await query(COLLECTION).eq('roomCode', code).descending('version').limit(1).find({ consistentRead: true });
    if (!r.items?.length) throw new GameError('Room not found. Check the six-digit code.', 404);
    const state = JSON.parse(r.items[0].state);
    if (state.expiresAt < Date.now()) throw new GameError('This room has expired. Create a new room.', 410);
    if (!cache.has(code) || cache.get(code)!.state.version <= state.version) cache.set(code, { state, until: Date.now() + 850 });
    if (cache.size > 100) cache.delete(cache.keys().next().value!);
    return state;
  })();
  if (!fresh) pending.set(code, load);
  try { return await load; } finally { if (!fresh) pending.delete(code); }
}
async function persist(state: any) {
  await insert(COLLECTION, { _id: `${state.code}-${state.version}`, roomCode: state.code,
    version: state.version, listed: state.version === 0 && state.listed, state: JSON.stringify(state), expiresAt: new Date(state.expiresAt) });
  if (!cache.has(state.code) || cache.get(state.code)!.state.version <= state.version) cache.set(state.code, { state, until: Date.now() + 850 });
}
async function compact(state: any) {
  // Keep a short collision/retry window, rather than storing an entire game history.
  // Cleanup is best effort; a cleanup failure never changes a successfully committed action.
  try {
    if (state.version > 9 && state.version % 8 === 0) {
      const old = await query(COLLECTION).eq('roomCode', state.code).gt('version', 0).lt('version', state.version - 8).limit(100).find({ consistentRead: true });
      if (old.items.length) await bulkRemove(COLLECTION, old.items.map((x: any) => x._id));
    }
    if (state.version === 0) {
      const expired = await query(COLLECTION).lt('expiresAt', new Date()).limit(100).find({ consistentRead: true });
      if (expired.items.length) await bulkRemove(COLLECTION, expired.items.map((x: any) => x._id));
    }
  } catch (error: any) { console.error('Saboteur retention cleanup', error?.message); }
}
function headers(request: Request) {
  const origin = request.headers.get('Origin') || '';
  return { 'Content-Type': 'application/json', 'Cache-Control': 'no-store', 'Vary': 'Origin',
    ...(ORIGINS.has(origin) ? { 'Access-Control-Allow-Origin': origin } : {}),
    'Access-Control-Allow-Methods': 'POST, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type',
    'X-Content-Type-Options': 'nosniff' };
}
export const OPTIONS: APIRoute = ({ request }) => new Response(null, { status: 204, headers: headers(request) });
export const GET: APIRoute = ({ request }) => Response.json({ app: 'Brighton Draw & Guess', protocol: 1, capacity: 36 }, { headers: headers(request) });

const writes = new Map<string, Promise<unknown>>();
async function write<T>(code: string, action: () => Promise<T>) {
  const previous = writes.get(code) || Promise.resolve();
  const current = previous.catch(() => {}).then(action);
  writes.set(code,current);
  try { return await current; } finally {
    if(writes.get(code)===current) writes.delete(code);
  }
}
async function mutate(code: string, key: string, input: any) {
  return write(code,async () => {
    for(let attempt=0;attempt<15;attempt++){
      const old=await latest(code,true);
      const next=command(old,key,input,Date.now(),random);
      if(next===old) return old;
      try {
        await persist(next);
        await compact(next);
        return next;
      } catch(error) {
        const newest=await latest(code,true);
        if(newest.version<=old.version) throw error;
        await new Promise(resolve=>setTimeout(resolve,15+Math.floor(random()*95)));
      }
    }
    throw new GameError('The room is busy. Please retry.',503);
  });
}
let directory: { until: number; rooms: any[] } = {until:0,rooms:[]};
async function listRooms(){
  if(directory.until>Date.now()) return directory.rooms;
  const registered=await query(COLLECTION).eq('listed',true).gt('expiresAt',new Date()).descending('_createdDate').limit(18).find();
  const checked=await Promise.allSettled(registered.items.map(async item=>publicLobby(await latest(item.roomCode))));
  const rooms=checked.flatMap(result=>result.status==='fulfilled'&&result.value?[result.value]:[]);
  directory={until:Date.now()+2000,rooms};
  return rooms;
}
export const POST: APIRoute = async ({ request }) => {
  const h=headers(request);
  const json=(data:unknown,status=200)=>Response.json(data,{headers:h,status});
  try {
    const origin=request.headers.get('Origin');
    if(origin&&!ORIGINS.has(origin)&&origin!==new URL(request.url).origin) throw new GameError('Origin not allowed.',403);
    if(Number(request.headers.get('Content-Length')||0)>32768) throw new GameError('Request too large.',413);
    const body=await request.text();
    if(body.length>32768) throw new GameError('Request too large.',413);
    let input:any;
    try {input=JSON.parse(body);} catch {throw new GameError('Invalid request.');}
    if(!input||typeof input.type!=='string') throw new GameError('Invalid request.');
    if(input.type==='list') return json({rooms:await listRooms()});
    const code=String(input.code||'');
    if(!/^\d{6}$/.test(code)) throw new GameError('Enter a six-digit room code.');
    if(typeof input.token!=='string'||!/^[a-f0-9]{64}$/.test(input.token)) throw new GameError('Your room key is missing.',401);
    const key=await digest(input.token);
    const projection=(state:any)=>view(state,key,{boardVersion:input.boardVersion});
    if(input.type==='create'){
      const state=createRoom(code,key,input.name,input);
      try{await persist(state);} catch(error){
        let current;
        try {current=await latest(code,true);} catch(readError) {
          if(readError instanceof GameError && readError.status===404) throw error;
          throw readError;
        }
        if(current.host===key) return json(projection(current));
        throw new GameError('That room code is taken. Try again.',409);
      }
      await compact(state);
      directory.until=0;
      return json(projection(state));
    }
    if(input.type==='state'){
      let state=await latest(code);
      if(!state.players.some((player: { key: string; removed?: boolean })=>player.key===key&&!player.removed)) throw new GameError('Join this room first.',403);
      if(needsTick(state)) state=await mutate(code,'clock',{type:'tick',requestId:'clock-'+state.version});
      return json(projection(state));
    }
    if(input.type==='tick') throw new GameError('Unsupported action.',400);
    const state=await mutate(code,key,input);
    if(['start','reset','join','leave','settings','kick','ban','voteKick'].includes(input.type)) directory.until=0;
    return json(projection(state));
  } catch(error){
    if(error instanceof GameError) return json({error:error.message},error.status);
    console.error('Draw & Guess storage error',error instanceof Error?error.message:String(error));
    return json({error:'The room service is busy. Try again shortly.'},503);
  }
};

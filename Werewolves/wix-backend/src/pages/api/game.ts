import type { APIRoute } from 'astro';
import { items } from '@wix/data';
import { auth } from '@wix/essentials';
import { createRoom, command, view, GameError } from '../../game/engine.mjs';

export const prerender = false;
const COLLECTION = 'WerewolvesStates';
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
    if (!r.items?.length) throw new GameError('Village not found. Check the six-digit code.', 404);
    const state = JSON.parse(r.items[0].state);
    if (state.expiresAt < Date.now()) throw new GameError('This room has expired. Create a new village.', 410);
    cache.set(code, { state, until: Date.now() + 1800 });
    if (cache.size > 100) cache.delete(cache.keys().next().value!);
    return state;
  })();
  if (!fresh) pending.set(code, load);
  try { return await load; } finally { if (!fresh) pending.delete(code); }
}
async function persist(state: any) {
  await insert(COLLECTION, { _id: `${state.code}-${state.version}`, roomCode: state.code,
    version: state.version, state: JSON.stringify(state), expiresAt: new Date(state.expiresAt) });
  cache.set(state.code, { state, until: Date.now() + 1800 });
}
async function compact(state: any) {
  // Keep a short collision/retry window, rather than storing an entire game history.
  // Cleanup is best effort; a cleanup failure never changes a successfully committed action.
  try {
    if (state.version > 9 && state.version % 8 === 0) {
      const old = await query(COLLECTION).eq('roomCode', state.code).lt('version', state.version - 8).limit(100).find({ consistentRead: true });
      if (old.items.length) await bulkRemove(COLLECTION, old.items.map((x: any) => x._id));
    }
    if (state.version === 0) {
      const expired = await query(COLLECTION).lt('expiresAt', new Date()).limit(100).find({ consistentRead: true });
      if (expired.items.length) await bulkRemove(COLLECTION, expired.items.map((x: any) => x._id));
    }
  } catch (error: any) { console.error('Werewolves retention cleanup', error?.message); }
}
function headers(request: Request) {
  const origin = request.headers.get('Origin') || '';
  return { 'Content-Type': 'application/json', 'Cache-Control': 'no-store', 'Vary': 'Origin',
    ...(ORIGINS.has(origin) ? { 'Access-Control-Allow-Origin': origin } : {}),
    'Access-Control-Allow-Methods': 'POST, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type',
    'X-Content-Type-Options': 'nosniff' };
}
export const OPTIONS: APIRoute = ({ request }) => new Response(null, { status: 204, headers: headers(request) });
export const POST: APIRoute = async ({ request }) => {
  const h = headers(request);
  try {
    const origin = request.headers.get('Origin');
    if (origin && !ORIGINS.has(origin) && origin !== new URL(request.url).origin) throw new GameError('This origin is not allowed.', 403);
    if (Number(request.headers.get('Content-Length') || 0) > 8192) throw new GameError('Request too large.', 413);
    const text = await request.text(); if (text.length > 8192) throw new GameError('Request too large.', 413);
    let b: any; try { b = JSON.parse(text); } catch { throw new GameError('Invalid request.'); }
    if (typeof b.token !== 'string' || !/^[a-f0-9]{64}$/.test(b.token)) throw new GameError('Your room key is missing. Rejoin the village.', 401);
    const hash = await digest(b.token), code = String(b.code || '');
    if (!/^\d{6}$/.test(code)) throw new GameError('Enter a six-digit village code.');
    if (b.type === 'create') {
      const state = createRoom(code, hash, b.name);
      try { await persist(state); await compact(state); }
      catch (error) {
        // A network retry of creation returns the original host room, without overwriting it.
        try { const old = await latest(code, true); if (old.host === hash) return new Response(JSON.stringify(view(old, hash)), { headers: h }); }
        catch (readError) { if (!(readError instanceof GameError)) throw readError; }
        throw new GameError('That village code is in use. Try creating again.', 409);
      }
      return new Response(JSON.stringify(view(state, hash)), { headers: h });
    }
    if (b.type === 'state') return new Response(JSON.stringify(view(await latest(code), hash)), { headers: h });
    for (let attempt = 0; attempt < 8; attempt++) {
      const old = await latest(code, true);
      const state = command(old, hash, b, random);
      if (state.version === old.version) return new Response(JSON.stringify(view(state, hash)), { headers: h });
      try {
        await persist(state);
        await compact(state);
        return new Response(JSON.stringify(view(state, hash)), { headers: h });
      } catch (error) {
        const newest = await latest(code, true);
        if (newest.version <= old.version) throw error;
        if (attempt === 7) throw new GameError('The village is busy. Please try your action again.', 409);
      }
    }
    throw new GameError('Please retry.', 409);
  } catch (error: any) {
    const known = error instanceof GameError;
    if (!known) console.error('Werewolves storage error', error?.message);
    return new Response(JSON.stringify({ error: known ? error.message : 'The village could not connect to its records. Please retry in a moment.' }), { status: known ? error.status : 503, headers: h });
  }
};

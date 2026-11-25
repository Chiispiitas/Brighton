import type { APIRoute } from 'astro';
import { items } from '@wix/data';
import { auth } from '@wix/essentials';
import { createRoom, command, view, GameError } from '../../game/engine.mjs';

export const prerender = false;

const COLLECTION = 'MatchingBloxxStates';
const ROOM = 'room';
const origins = new Set(['https://exams.bebrighton.net', 'http://localhost:4177', 'http://127.0.0.1:4177']);
const sharedActions = new Set(['join', 'start', 'finish']);
const playerActions = new Set(['answer', 'drop', 'steady', 'gust', 'next']);
const insert = auth.elevate(items.insert);
const query = auth.elevate(items.query);
const remove = auth.elevate(items.bulkRemove);
interface Row {
  _id: string;
  roomCode: string;
  lane: string;
  version: number;
  state: string;
  expiresAt: Date;
}
interface Entry {
  generation: string;
  value: any;
  together?: boolean;
  receipts?: Record<string, string>;
}
function read(row: Row): Entry { return JSON.parse(row.state); }
function headers(request: Request) {
  const origin = request.headers.get('Origin') || '';
  return {
    'Content-Type': 'application/json', 'Cache-Control': 'no-store', 'Vary': 'Origin',
    ...(origins.has(origin) ? { 'Access-Control-Allow-Origin': origin } : {}),
    'Access-Control-Allow-Methods': 'POST, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type',
    'X-Content-Type-Options': 'nosniff'
  };
}
function makeRow(code: string, lane: string, version: number, entry: Entry, expiry: number): Row {
  // The permanent first row reserves the six-digit code. Other IDs are unique to this room generation.
  const id = lane === ROOM && version === 0 ? code : [code,entry.generation,lane,version].join('-');
  return { _id: id, roomCode: code, lane, version, state: JSON.stringify(entry), expiresAt: new Date(expiry) };
}

const cached = new Map<string, { until: number; rows: Promise<Row[]> }>();
async function loadRows(code: string): Promise<Row[]> {
  const result = await query(COLLECTION).eq('roomCode', code).eq('lane', ROOM)
    .descending('version').limit(1).find({ consistentRead: true });
  if (!result.items.length) throw new GameError('Room not found. Check the six-digit code.', 404);
  const head = result.items[0] as Row;
  if (read(head).together) return [head];
  // Load individual checkpoints from rooms opened with the first service release.
  const previous = await query(COLLECTION).eq('roomCode', code).limit(1000).find({ consistentRead: true });
  return previous.items as Row[];
}
function rowsFor(code: string, fresh: boolean): Promise<Row[]> {
  if (fresh) return loadRows(code);
  const previous = cached.get(code);
  if (previous && previous.until > Date.now()) return previous.rows;
  const rows = loadRows(code);
  cached.set(code, { until: Date.now() + 1100, rows });
  if (cached.size > 120) cached.delete(cached.keys().next().value!);
  rows.catch(() => { if (cached.get(code)?.rows === rows) cached.delete(code); });
  return rows;
}
function unpack(rows: Row[], code: string) {
  const single = rows[0];
  if (single && single.lane === ROOM && read(single).together) {
    const entry = read(single);
    if (entry.value.expiresAt <= Date.now()) throw new GameError('This room has expired.', 410);
    return { room: entry.value, head: single, generation: entry.generation, receipts: entry.receipts || {} };
  }
  const initial = rows.find(row => row._id === code);
  if (!initial) throw new GameError('Room not found. Check the six-digit code.', 404);
  const generation = read(initial).generation;
  const lanes = new Map<string, Row>([[ROOM, initial]]);
  const active = rows.filter(row => row._id === code || row._id.startsWith(code + '-' + generation + '-'));
  for (const row of active) {
    if (row.version > (lanes.get(row.lane)?.version ?? -1)) lanes.set(row.lane, row);
  }
  const room = read(lanes.get(ROOM)!).value;
  if (room.expiresAt <= Date.now()) throw new GameError('This room has expired.', 410);
  // A teacher who has ended the game sees exactly the scores they closed on.
  if (room.phase !== 'finished') {
    room.players = room.players.map((player: any) => {
      const current = lanes.get(player.id);
      return current ? read(current).value : player;
    });
  }
  return { room, head: lanes.get(ROOM)!, generation, receipts: {} as Record<string, string> };
}
async function digest(token: unknown): Promise<string> {
  if (typeof token !== 'string' || !/^[0-9a-f]{64}$/.test(token)) throw new GameError('Your room key is missing.', 401);
  const hash = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(token));
  return Array.from(new Uint8Array(hash), byte => byte.toString(16).padStart(2, '0')).join('');
}
function cleanup(ids: string[]) {
  // Cleanup does not participate in committing an action. A later request can prune leftovers.
  if (!ids.length) return Promise.resolve();
  return remove(COLLECTION, ids).catch(() => {});
}
async function pruneExpired() {
  try {
    const expired = await query(COLLECTION).lt('expiresAt', new Date()).limit(200).find({ consistentRead: true });
    await cleanup(expired.items.map(row => row._id!));
  } catch { /* A failed sweep is retried when another room opens. */ }
}
async function create(code: string, actor: string, presenter: string) {
  if (actor === presenter) throw new GameError('The presenter needs a separate key.', 400);
  const room = createRoom(code, actor, presenter, Date.now(), crypto.getRandomValues(new Uint32Array(1))[0]);
  const generation = crypto.getRandomValues(new Uint32Array(1))[0].toString(16);
  const row = makeRow(code, ROOM, 0, { generation, value: room, together: true }, room.expiresAt);
  try { await insert(COLLECTION, row); }
  catch (err) {
    let rows: Row[];
    try { rows = await loadRows(code); }
    catch (readError) {
      if (readError instanceof GameError && readError.status === 404) throw err;
      throw readError;
    }
    try {
      const existing = unpack(rows, code).room;
      if (existing.host === actor && existing.presenter === presenter) return view(existing, actor);
    } catch (error) {
      if (!(error instanceof GameError) || error.status !== 410) throw error;
    }
    throw new GameError('That room code is taken. Try another code.', 409);
  }
  cached.delete(code);
  await pruneExpired();
  return view(room, actor);
}
interface Move {
  actor: string;
  input: any;
  time: number;
  resolve: (response: any) => void;
  reject: (error: unknown) => void;
}
interface Queue {
  moves: Move[];
  scheduled: boolean;
  nextWrite: number;
}
const rooms = new Map<string, Queue>();

async function commit(code: string, moves: Move[]) {
  for (let attempt = 0; attempt < 40; attempt++) {
    const { room, head, generation, receipts } = unpack(await loadRows(code), code);
    const accepted: Move[] = [];
    const refused = new Map<Move, unknown>();
    let changed = false;
    for (const move of moves) {
      const { actor, input } = move;
      try {
        const id = typeof input.requestId === 'string' && /^[\w-]{1,96}$/.test(input.requestId)
          ? input.requestId : '';
        const joined = input.type === 'join' && room.players.some((p: any) => p.key === actor);
        if ((!id || receipts[actor] !== id) && !joined) {
          command(room, actor, input.type, input, move.time);
          if (id) receipts[actor] = id;
          changed = true;
        }
        accepted.push(move);
      } catch (error) { refused.set(move, error); }
    }
    if (changed) {
      // Everyone who acted in this window shares a single durable CMS write. The
      // immutable version ID serializes colliding batches from separate Wix workers.
      const version = head.version + 1;
      const next = makeRow(code, ROOM, version, { generation, value: room, together: true, receipts }, room.expiresAt);
      try { await insert(COLLECTION, next); }
      catch (err) {
        const newest = unpack(await loadRows(code), code).head;
        if (newest.version < version) throw err;
        await new Promise(resolve => setTimeout(resolve, 35 + Math.random() * 200));
        continue;
      }
      cached.delete(code);
      if (version % 10 === 0) {
        const ids: string[] = [];
        for (let n = Math.max(1, version - 11); n <= version - 2; n++) ids.push([code,generation,ROOM,n].join('-'));
        await cleanup(ids);
      }
    }
    for (const move of accepted) move.resolve(view(room, move.actor));
    for (const [move, error] of refused) move.reject(error);
    return;
  }
  throw new GameError('The room is busy. Please try again.', 503);
}
function schedule(code: string, queue: Queue) {
  if (queue.scheduled) return;
  queue.scheduled = true;
  const delay = Math.max(90, queue.nextWrite - Date.now());
  setTimeout(async () => {
    const moves = queue.moves.splice(0);
    queue.nextWrite = Date.now() + 1400;
    try { await commit(code, moves); }
    catch (error) { for (const move of moves) move.reject(error); }
    finally {
      queue.scheduled = false;
      if (queue.moves.length) schedule(code, queue);
      // Retain the cadence between nearby taps; do not retain idle rooms.
      else setTimeout(() => {
        if (rooms.get(code) === queue && !queue.scheduled && !queue.moves.length) rooms.delete(code);
      }, 1600);
    }
  }, delay);
}
function mutate(code: string, actor: string, input: any): Promise<any> {
  if (!sharedActions.has(input.type) && !playerActions.has(input.type)) throw new GameError('Unknown game action.', 400);
  const queue = rooms.get(code) || { moves: [], nextWrite: 0, scheduled: false };
  rooms.set(code, queue);
  return new Promise((resolve, reject) => {
    queue.moves.push({actor, input, time: Date.now(), resolve, reject});
    schedule(code, queue);
  });
}

export const GET: APIRoute = ({ request }) => Response.json(
  { app: 'Matching Bloxx', protocol: 1, capacity: 36 }, { headers: headers(request) }
);
export const OPTIONS: APIRoute = ({ request }) => new Response(null, { status: 204, headers: headers(request) });
export const POST: APIRoute = async ({ request }) => {
  const send = (data: unknown, status = 200) => Response.json(data, { status, headers: headers(request) });
  try {
    const origin = request.headers.get('Origin');
    if (origin && !origins.has(origin) && origin !== new URL(request.url).origin) throw new GameError('Origin not allowed.', 403);
    if (Number(request.headers.get('Content-Length') || 0) > 8192) throw new GameError('Request too large.', 413);
    const text = await request.text();
    if (text.length > 8192) throw new GameError('Request too large.', 413);
    let input: any;
    try { input = JSON.parse(text); } catch { throw new GameError('Invalid request.', 400); }
    if (!input || typeof input.type !== 'string') throw new GameError('Invalid request.', 400);
    const code = String(input.code || '');
    if (!/^\d{6}$/.test(code)) throw new GameError('Enter a six-digit room code.', 400);
    const actor = await digest(input.token);
    if (input.type === 'create') return send(await create(code, actor, await digest(input.presenterToken)));
    if (input.type === 'state') return send(view(unpack(await rowsFor(code, false), code).room, actor));
    return send(await mutate(code, actor, input));
  } catch (error) {
    if (error instanceof GameError) return send({ error: error.message }, error.status);
    console.error('Matching Bloxx room storage', error instanceof Error ? error.message : String(error));
    return send({ error: 'The room service is busy. Please try again.' }, 503);
  }
};

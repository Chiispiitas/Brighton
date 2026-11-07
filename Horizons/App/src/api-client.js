const DEFAULT_ENDPOINT = 'https://headless-hphybypweny-chiispiitas-140b.wix-site-host.com/api/horizons';
const COOKIE = 'hz_companion_session';
const appPath = new URL('../', import.meta.url).pathname;
export class APIError extends Error {
  constructor(message, status = 0, code = '') { super(message); this.name = 'APIError'; this.status = status; this.code = code; }
}
export function getSessionToken() {
  const value = document.cookie.split('; ').find(item => item.startsWith(`${COOKIE}=`));
  return value ? decodeURIComponent(value.slice(COOKIE.length + 1)) : '';
}
function rememberToken(token, expiresAt) {
  const expiry = Date.parse(expiresAt || '') || Date.now() + 30 * 86400000;
  const maxAge = Math.max(0, Math.min(366 * 86400, Math.floor((expiry - Date.now()) / 1000)));
  document.cookie = `${COOKIE}=${encodeURIComponent(token)}; Path=${appPath}; Max-Age=${maxAge}; SameSite=Lax${location.protocol === 'https:' ? '; Secure' : ''}`;
}
export function forgetSession() { document.cookie = `${COOKIE}=; Path=${appPath}; Max-Age=0; SameSite=Lax${location.protocol === 'https:' ? '; Secure' : ''}`; }
function normalise(body) { return body?.data && typeof body.data === 'object' ? body.data : body; }
async function request(action, data = {}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 35000);
  let response, body;
  try {
    response = await fetch(window.HORIZONS_CONFIG?.apiEndpoint || DEFAULT_ENDPOINT, {
      method: 'POST', credentials: 'omit', signal: controller.signal,
      headers: {'Content-Type': 'application/json', ...(getSessionToken() ? {'X-Requested-With': getSessionToken()} : {})},
      body: JSON.stringify({action, ...data})
    });
    body = await response.json();
  } catch (error) {
    throw new APIError(error.name === 'AbortError' ? 'The request timed out. Please try again.' : 'We could not reach your book. Check your connection and try again.');
  } finally { clearTimeout(timeout); }
  const result = normalise(body);
  if (!response.ok || body?.ok === false || body?.success === false || body?.error) {
    if (response.status === 401) forgetSession();
    const issue = body?.error;
    throw new APIError(body?.message || issue?.message || (typeof issue === 'string' ? issue : 'Something went wrong. Please try again.'), response.status, issue?.code || body?.code || '');
  }
  if (result?.token) rememberToken(result.token, result.sessionExpiresAt);
  return result;
}
export const api = {
  getSession: () => request('getSession'),
  redeem: code => request('redeem', {code: code.trim()}),
  linkBook: code => request('linkBook', {code: code.trim()}),
  updateProfile: patch => request('updateProfile', {patch}),
  saveAttempt: attempt => request('saveAttempt', {attempt}),
  listChallenges:()=>request('listChallenges'),
  createChallenge:(targetId,requestId)=>request('createChallenge',{targetId,requestId}),
  openChallenge:challengeId=>request('openChallenge',{challengeId}),
  declineChallenge:challengeId=>request('declineChallenge',{challengeId}),
  submitChallenge:(challengeId,answers)=>request('submitChallenge',{challengeId,answers}),
  getSocialHome: () => request('getSocialHome'),
  getPublicProfile: targetId => request('getPublicProfile',{targetId}),
  setFollow: (targetId,following) => request('setFollow',{targetId,following}),
  searchPeople: query => request('searchPeople',{query}),
  getLeaderboard: () => request('getLeaderboard'),
  getProgress: () => request('getProgress'),
  signOut: async () => { try { await request('signOut'); } finally { forgetSession(); } }
};

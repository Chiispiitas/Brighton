export function createDispatcher(handlers, metadata = {}) {
  const routes = new Map();
  for (const [name, handler] of Object.entries(handlers)) {
    const match = /^(get|post|use)_([A-Za-z0-9]+)$/.exec(name);
    if (!match || typeof handler !== 'function') continue;
    const [, method, path] = match;
    if (!routes.has(path)) routes.set(path, {});
    routes.get(path)[method.toUpperCase()] = handler;
  }
  return async (request, route) => {
    const entry = routes.get(route);
    const headers = { 'Content-Type': 'application/json', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' };
    if (!entry) return new Response(JSON.stringify({ success: false, error: 'Unknown assessment route.' }), { status: 404, headers });
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: { ...headers, 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': Object.keys(entry).filter(x => x !== 'USE').join(', ') + ', OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type, Authorization' } });
    }
    const handler = entry[request.method];
    if (!handler) return new Response(JSON.stringify({ success: false, error: 'Method not allowed.' }), { status: 405, headers: { ...headers, Allow: Object.keys(entry).filter(x => x !== 'USE').join(', ') } });
    if (Number(request.headers.get('Content-Length') || 0) > 14000000) return new Response('{}', { status: 413, headers });
    try {
      const text = request.method === 'GET' ? '' : await request.text();
      if (text.length > 14000000) return new Response('{}', { status: 413, headers });
      const legacy = {
        method: request.method,
        query: Object.fromEntries(new URL(request.url).searchParams),
        headers: Object.fromEntries(request.headers),
        body: { text: async () => text, json: async () => JSON.parse(text) }
      };
      const result = await handler(legacy);
      if (!(result instanceof Response)) throw new Error('Invalid assessment response');
      const final = new Response(result.body, result);
      final.headers.set('Cache-Control', 'no-store');
      final.headers.set('X-Content-Type-Options', 'nosniff');
      if (route === 'brightonBackendHealth') {
        const data = JSON.parse(await final.text());
        return new Response(JSON.stringify({ ...data, deployment: metadata }), { status: final.status, headers: final.headers });
      }
      return final;
    } catch (error) {
      console.error('Assessment dispatch failed', route, error?.message);
      return new Response(JSON.stringify({ success: false, error: 'The assessment service could not complete the request. Please retry.' }), { status: 503, headers: { ...headers, 'Access-Control-Allow-Origin': '*' } });
    }
  };
}


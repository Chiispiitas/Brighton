// Runs the repository's actual Velo handlers against an isolated CMS substitute.
// Quotas count find/insert/update calls, including reads hidden inside saves.
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { randomUUID } = require('node:crypto');
const clone = value => structuredClone(value);
module.exports = function createWixSimulator({ readLimit = Infinity, writeLimit = Infinity, windowMs = 60000 } = {}) {
  const collections = new Map(), operations = [], errors = [];
  const stats = { reads: 0, writes: 0, readLimits: 0, writeLimits: 0 };
  let limitsEnabled = true;
  function consume(kind) {
    const now = Date.now(), limit = kind === 'read' ? readLimit : writeLimit;
    const recent = operations.filter(op => op.kind === kind && now - op.at < windowMs);
    if (limitsEnabled && recent.length >= limit) {
      stats[kind + 'Limits']++;
      throw new Error('WDE0014: Requests per minute quota exceeded.');
    }
    operations.push({ kind, at: now }); stats[kind + 's']++;
  }
  function table(name) { if (!collections.has(name)) collections.set(name, new Map()); return collections.get(name); }
  const wixData = {
    query(name) {
      let filter, sort, limit = 100;
      return {
        eq(field, value) { filter = [field, value]; return this; },
        descending(field) { sort = field; return this; },
        limit(value) { limit = value; return this; },
        async find() {
          consume('read');
          let items = [...table(name).values()].filter(item => !filter || item[filter[0]] === filter[1]);
          if (sort) items.sort((a, b) => +new Date(b[sort]) - +new Date(a[sort]));
          return { items: clone(items.slice(0, limit)) };
        }
      };
    },
    async insert(name, item) {
      consume('write'); const row = { ...clone(item), _id: randomUUID(), _updatedDate: new Date() };
      table(name).set(row._id, row); return clone(row);
    },
    async update(name, item) {
      consume('write'); const row = { ...clone(item), _updatedDate: new Date() };
      table(name).set(row._id, row); return clone(row);
    }
  };
  const context = vm.createContext({ wixData, Date, JSON,
    console: { error: (...args) => errors.push(args.map(String).join(' ')) },
    ok: value => ({ status: 200, ...value }), badRequest: value => ({ status: 400, ...value }),
    serverError: value => ({ status: 500, ...value }), response: value => value });
  function load(name, names) {
    const source = fs.readFileSync(path.join(__dirname, '../wix-backend', name), 'utf8')
      .replace(/^import[\s\S]*?;\s*/gm, '').replace(/\bexport /g, '');
    return vm.runInContext(`(() => { ${source}\nreturn { ${names.join(', ')} }; })()`, context);
  }
  const core = load('core.js', ['jsonOK', 'jsonBadRequest', 'jsonServerError', 'cleanText', 'cleanNumber', 'cleanDate', 'parseJson', 'readJsonBody', 'findOne', 'upsertOne']);
  Object.assign(context, core);
  const api = load('spelling-bee.js', ['getSession', 'saveSession', 'getJudges', 'saveJudge', 'getCommand', 'saveCommand']);
  const methods = { spellingBeeSession: ['getSession', 'saveSession'], spellingBeeJudge: ['getJudges', 'saveJudge'], spellingBeeCommand: ['getCommand', 'saveCommand'] };
  return { stats, operations, errors, collections,
    enableLimits(value) { limitsEnabled = value; },
    async request(endpoint, method, code, body) {
      const handler = methods[endpoint]?.[method === 'POST' ? 1 : 0];
      if (!handler) throw new Error('Unexpected backend route: ' + endpoint);
      const result = await api[handler]({ query: { sessionCode: code }, body: { json: async () => clone(body) } });
      return { status: result.status, json: JSON.parse(result.body) };
    }
  };
};

import { dataClient } from './client.js';

// Business modules validate class codes/session ownership before calling this
// server-only adapter. Never export generic CMS operations through HTTP routes.
function options(value = {}) {
  const { suppressAuth, ...supported } = value;
  return supported;
}
export default {
  query(collection) { return dataClient().items.query(collection); },
  get(collection, id, opts) { return dataClient().items.get(collection, id, options(opts)); },
  insert(collection, item, opts) { return dataClient().items.insert(collection, item, options(opts)); },
  update(collection, item, opts) { return dataClient().items.update(collection, item, options(opts)); },
  remove(collection, id, opts) { return dataClient().items.remove(collection, id, options(opts)); }
};


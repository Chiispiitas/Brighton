import * as handlers from '../../../generated/http-functions.js';
import manifest from '../../../generated/manifest.json';
import { createDispatcher } from '../../../runtime/dispatch.js';
export const prerender = false;
const dispatch = createDispatcher(handlers, { runtime: 'wix-headless', siteId: '06a80236-67d7-4837-b4c8-2a62b29ee79b', sourceHashes: manifest });
export const ALL = ({ request, params }) => dispatch(request, params.route);


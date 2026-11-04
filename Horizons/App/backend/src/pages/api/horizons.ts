import type {APIRoute} from 'astro';
import {createApplication} from '../../server/application.mjs';
import {wixStore} from '../../server/wix-store';
const application=createApplication(wixStore);
export const ALL:APIRoute=({request})=>application.handle(request);

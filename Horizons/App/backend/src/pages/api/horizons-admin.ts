import type {APIRoute} from 'astro';
import {createAdminApplication} from '../../server/admin-application.mjs';
import {wixStore} from '../../server/wix-store';
const application=createAdminApplication(wixStore);
export const ALL:APIRoute=({request})=>application.handle(request);

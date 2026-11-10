import { createClient, AppStrategy } from '@wix/sdk';
import { items } from '@wix/data';
import { secrets } from '@wix/secrets';

let client;
export function dataClient() {
  if (client) return client;
  const appId = process.env.ASSESSMENT_DATA_APP_ID;
  const appSecret = process.env.ASSESSMENT_DATA_APP_SECRET;
  const instanceId = process.env.ASSESSMENT_DATA_INSTANCE_ID;
  if (!appId || !appSecret || !instanceId) throw new Error('Assessment record access is not configured');
  client = createClient({ auth: AppStrategy({ appId, appSecret, instanceId }), modules: { items, secrets } });
  return client;
}

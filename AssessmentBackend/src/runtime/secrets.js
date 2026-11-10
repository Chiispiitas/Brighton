import { dataClient } from './client.js';
export default {
  async getSecret(name) { return (await dataClient().secrets.getSecretValue(name)).value; }
};


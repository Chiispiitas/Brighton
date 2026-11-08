import fs from 'node:fs';
import {platformListening} from '../content/listening-scripts.mjs';
fs.writeFileSync(new URL('../assets/audio/platform-listening-v1/plan.json',import.meta.url),JSON.stringify(Object.values(platformListening),null,2)+'\n');

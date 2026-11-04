import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');fs.mkdirSync(path.join(root,'src/content'),{recursive:true});
for(const name of['unit1.mjs','engine.mjs','source-banks.mjs'])fs.copyFileSync(path.join(root,'../content',name),path.join(root,'src/content',name));
console.log('Synced the reviewed Unit1 content engine into the self-contained backend source.');

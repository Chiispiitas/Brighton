import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
const root=new URL('./',import.meta.url).pathname.replace(/^\/(\w:)/,'$1');
const cx=vm.createContext({window:{}});vm.runInContext(fs.readFileSync(root+'item-bank.js','utf8'),cx);
const m=cx.window.BRIGHTON_PLACEMENT_MODULES;
const bands=['prea1','a1','a2'];
let count=0;
for(const l of bands)for(const r of bands)for(const a of bands)for(const s of bands){
 let pictures=[],prompts=[],passages=[];
 for(const id of ['calibration-01','lang-'+l,'reading-'+r,'listening-'+a,'speaking-'+s]){
  const mod=m[id];
  for(const i of mod.items||[mod]){
   const image=i.image||mod.image;if(image)pictures.push(image);
   for(const o of i.options||[])if(o.image)pictures.push(o.image);
   if(i.prompt)prompts.push(i.prompt);
   if(i.passage)passages.push(i.passage);
  }
 }
 assert.equal(pictures.length,24);
 assert.equal(new Set(pictures).size,pictures.length,`Repeated picture on ${l}/${r}/${a}/${s}`);
 // Generic instructions are varied below; repeated exact prompts fail this check.
 assert.equal(new Set(prompts).size,prompts.length,`Repeated prompt on ${l}/${r}/${a}/${s}`);
 assert.equal(new Set(passages).size,4);
 for(const pic of pictures)assert.ok(fs.existsSync(root+pic),pic);
 count++;
}
for(const mod of Object.values(m))for(const i of mod.items||[]){
 assert.equal(new Set(i.options.map(o=>o.text)).size,3);
 if(i.audio)assert.ok(fs.statSync(root+i.audio).size>10000);
}
console.log(`PASS: ${count} combinations, 24 distinct pictures per attempt, no repeated prompts or passages, all media present.`);

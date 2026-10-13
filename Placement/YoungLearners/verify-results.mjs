import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
const source=fs.readFileSync(new URL('./wix-backend/young-placement.js',import.meta.url),'utf8').replace(/^import[\s\S]*?;\s*$/gm,'').replace(/export /g,'');
const key='a-test-key-with-at-least-thirty-two-characters';
let queries=0,purges=0;
const sessions=[
 {_id:'1',studentName:'Sam',status:'completed',finalLevel:'A1',completedAt:'2026-10-13T12:00:00Z'},
 {_id:'2',studentName:'Ann',status:'active',provisionalLevel:'PRE-A1',startedAt:'2026-10-13T13:00:00Z'}
];
const context=vm.createContext({console,Date,Buffer,setTimeout,clearTimeout,
 wixSecretsBackend:{getSecret:async()=>key},response:args=>args,
 readJsonBody:async req=>req.payload||{},
 wixData:{query:collection=>{queries++;assert.equal(collection,'BrightonYoungPlacementSessions');return {limit(){return this;},find:async()=>({items:sessions})};}}
});
vm.runInContext(source,context);
context.purgeCheck=()=>purges++;
vm.runInContext('purgeStalePlacementSessions=async()=>purgeCheck()',context);
for(const fn of ['getPlacementResults','getPlacementDashboardResult']){
 for(const payload of [{},{teacherKey:'wrong-key-that-is-long-enough'}]){
  const result=await context[fn]({payload});
  assert.equal(result.status,401);assert.equal(result.headers['Cache-Control'],'no-store');
  assert.ok(!result.body.includes('Sam'));
 }
}
assert.equal(queries,0);assert.equal(purges,0);
let result=await context.getPlacementResults({payload:{teacherKey:key,status:'completed',level:'A1',student:'sa'}});
assert.equal(result.status,200);assert.equal(result.headers['Cache-Control'],'no-store');
assert.deepEqual(JSON.parse(result.body).results.map(x=>x.studentName),['Sam']);
result=await context.getPlacementResults({payload:{teacherKey:key,student:'missing'}});
assert.equal(JSON.parse(result.body).results.length,0);
context.wixData.get=async(collection,id)=>{assert.equal(collection,'BrightonYoungPlacementSessions');return sessions.find(s=>s._id===id);};
context.wixData.query=collection=>({
 eq(field,id){assert.equal(field,'sessionId');assert.equal(id,'1');return this;},
 limit(){return this;},
 find:async()=>({items:collection==='BrightonYoungPlacementSpeaking'?[{
  promptId:'yl-sp-a1-01',transcript:'I can see a dog.',speakingLevel:'A1',
  metricsJson:JSON.stringify({composite:4.5,assessment:{fluency:{score:4,evidence:['Clear short answer.']}}})
 }]:[{moduleId:'reading-a1',correct:true,responseTimeMs:2000}]})
});
vm.runInContext('buildResultSummary=async()=>({finalLevel:"A1",skills:{}})',context);
result=await context.getPlacementDashboardResult({payload:{teacherKey:key,sessionId:'1'}});
assert.equal(result.status,200);
const detail=JSON.parse(result.body);
assert.equal(detail.result.finalLevel,'A1');assert.equal(detail.speaking.transcript,'I can see a dog.');
assert.equal(detail.speaking.assessment.fluency.score,4);assert.equal(detail.modules[0].correct,1);
const html=fs.readFileSync(new URL('./results.html',import.meta.url),'utf8');
const js=fs.readFileSync(new URL('./results.js',import.meta.url),'utf8');
assert.ok(html.includes('id="dashboardContent" hidden'));
assert.ok(!html.includes('<option>B1</option>'));
assert.ok(js.includes('brightonYoungPlacementResults'));
assert.ok(js.includes('brightonYoungPlacementDashboardResult'));
assert.ok(!js.includes('localStorage')&&!js.includes('sessionStorage'));
assert.ok(!js.includes('url.searchParams'));
console.log('PASS: unauthorized requests cannot query records; teacher filters, no-store responses, hidden dashboard, and isolated routes verified.');

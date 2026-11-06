// Derive the compact flow report from the successful current full proof.
// Do not replay the identical backend flow solely to refresh its report.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
const root=path.resolve(new URL('..',import.meta.url).pathname.replace(/^\/([A-Za-z]:)/,'$1'));
const source='reports/streak-v2-motion.json',bytes=fs.readFileSync(path.join(root,source)),motion=JSON.parse(bytes);
assert.equal(motion.pass,true);assert.equal(motion.sourceUnchangedDuringRun,true);
for(const {file,sha256} of motion.sourceBinding)assert.equal(crypto.createHash('sha256').update(fs.readFileSync(path.join(root,file))).digest('hex'),sha256,'Motion evidence is stale: '+file);
const fields=['savedRoundFlow','failedSaveNoCelebration','lostResponseRetryRecovered','repeatRoundNoCelebration','loginReloadNoCelebration','persistedSeenGuard','actualNormalFlowContinueAfterComplete','noEarlyKeyboardSkip','hiddenScreenDefersSeen'];
for(const key of fields)assert.equal(motion[key],true,key);
fs.writeFileSync(path.join(root,'reports/streak-v2-flow.json'),JSON.stringify({pass:true,scope:motion.scope,derivation:'This scoped report is extracted from the current successful full motion proof, which actually reran these synthetic backend/app flow cases. It is not a separate redundant test run.',derivedFrom:source,sourceReportSha256:crypto.createHash('sha256').update(bytes).digest('hex'),sourceBinding:motion.sourceBinding,...Object.fromEntries(fields.map(key=>[key,motion[key]])),apiCalls:motion.apiCalls,errors:motion.errors},null,2)+'\n');
console.log('Derived current flow evidence from verified full proof; all bound source bytes still match.');

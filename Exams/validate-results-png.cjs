const fs=require('fs');const path=require('path');const assert=require('assert/strict');const {JSDOM}=require('jsdom');const {createCanvas}=require('@napi-rs/canvas');
const wait=()=>new Promise(r=>setTimeout(r,30));
(async()=>{
for(const page of ['results','test-results']){
 const dom=new JSDOM(fs.readFileSync(path.join(__dirname,page+'.html'),'utf8'),{url:'https://example.test/Exams/'+page+'.html',runScripts:'outside-only'});const w=dom.window;const d=w.document;const canvases=new WeakMap();const files=[];const painted=[];let fail=false;
 w.HTMLCanvasElement.prototype.getContext=function(){if(!canvases.has(this)){const canvas=createCanvas(this.width,this.height);canvases.set(this,canvas);const ctx=canvas.getContext('2d');const draw=ctx.fillText.bind(ctx);ctx.fillText=(text,...args)=>{painted.push(String(text));return draw(text,...args)};}return canvases.get(this).getContext('2d');};
 w.HTMLCanvasElement.prototype.toBlob=function(callback){const buffer=canvases.get(this).toBuffer('image/png');assert.equal(buffer.subarray(0,8).toString('hex'),'89504e470d0a1a0a');assert.ok(this.height<=12000);if(process.env.PNG_QA_DIR){fs.mkdirSync(process.env.PNG_QA_DIR,{recursive:true});fs.writeFileSync(path.join(process.env.PNG_QA_DIR,page+'-'+files.length+'.png'),buffer);}callback(fail?null:new w.Blob([buffer],{type:'image/png'}));};
 w.URL.createObjectURL=blob=>{assert.equal(blob.type,'image/png');return 'blob:qa'};w.URL.revokeObjectURL=()=>{};w.HTMLAnchorElement.prototype.click=function(){files.push(this.download)};
 d.querySelector('#classIdInput').value='F-42';d.querySelector('#studentInput').value='Alex';
 w.eval(fs.readFileSync(path.join(__dirname,'results-png.js'),'utf8'));
 const button=d.querySelector('#downloadPngBtn');button.click();await wait();assert.equal(files.length,0);assert.match(d.querySelector('#toast').textContent,/Load results/);assert.equal(button.disabled,false);
 const count=d.querySelector('#resultsBody').closest('table').querySelectorAll('thead th').length;
 const cells=['Alex Sample','F-42','B2 Listening Practice Test 3','24/10/2026','27/30','90%','Part 1: 7/8 · Part 2: 9/10 · Part 3: 5/5 · Part 4: 6/7','40 min'];
 d.querySelector('#resultsBody').innerHTML='<tr>'+Array.from({length:count},(_,i)=>'<td>'+(i===count-1?'<button>Details</button>':cells[i])+'</td>').join('')+'</tr>';
 button.click();assert.equal(button.disabled,true);await wait();assert.equal(files.length,1);assert.match(files[0],/results-F-42.png$/);assert.ok(painted.includes('Alex Sample'));assert.ok(painted.includes('27/30'));assert.ok(!painted.includes('Details'));assert.equal(button.disabled,false);
 const details=d.querySelector('#detailsContent');details.innerHTML='<div class="detail-box"><span>Student</span><strong>Alex Sample</strong></div><h3>Writing assessment</h3><p>Teacher saved</p><label><span>Content</span><input aria-label="Question 1 Content" value="4"></label><p>Feedback: clear, well-organised writing.</p>';
 d.querySelector('#downloadDetailsPngBtn').click();await wait();assert.equal(files.length,2);assert.ok(painted.includes('Question 1 Content: 4'));assert.ok(painted.includes('Teacher saved'));
 // Tall filtered classes must export all rows without exceeding browser canvas limits.
 const row=d.querySelector('#resultsBody').innerHTML;d.querySelector('#resultsBody').innerHTML=row.repeat(210);button.click();await wait();assert.ok(files.length>3);assert.ok(files.slice(2).every(x=>/-\d+\.png$/.test(x)));
 fail=true;const before=files.length;button.click();await wait();assert.equal(files.length,before);assert.equal(button.disabled,false);assert.match(d.querySelector('#toast').textContent,/Could not create PNG/);
 dom.window.close();console.log(page+': empty state, PNG signature, filtered table, marks, detail values, long multi-image report, filename, busy state and failure recovery passed.');
}
})().catch(e=>{console.error(e);process.exitCode=1});

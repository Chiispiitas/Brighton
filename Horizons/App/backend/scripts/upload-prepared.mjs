import fs from 'node:fs';
if(process.stdin.isTTY)process.stdin.setRawMode(true);
process.stdout.write('Ready for upload configuration on hidden stdin.\n');
let input='',processing=false;process.stdin.setEncoding('utf8');process.stdin.on('data',async chunk=>{if(processing)return;input+=chunk;if(!/[\r\n]/.test(input))return;processing=true;try{
 process.stdin.pause();const config=JSON.parse(input.trim());const results=[];
 for(const entry of config.files){const bytes=fs.readFileSync(entry.path);const response=await fetch(entry.url,{method:'PUT',headers:{'Content-Type':'application/zip','Content-Length':String(bytes.length)},body:bytes});if(!response.ok)throw new Error(`Upload returned ${response.status}`);results.push({file:entry.name,bytes:bytes.length,status:response.status});}
 console.log(JSON.stringify({uploaded:results}));process.exitCode=0;
}catch(error){console.error('The prepared upload failed: '+error.message);process.exitCode=1;}finally{input='';if(process.stdin.isTTY)process.stdin.setRawMode(false);process.stdin.pause();process.stdin.unref?.();}});

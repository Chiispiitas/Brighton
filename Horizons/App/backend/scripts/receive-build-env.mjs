import crypto from 'node:crypto';
import fs from 'node:fs';
const {privateKey,publicKey}=crypto.generateKeyPairSync('rsa',{modulusLength:2048});
console.log(JSON.stringify({publicJwk:publicKey.export({format:'jwk'})}));
let input='';process.stdin.setEncoding('utf8');process.stdin.on('data',chunk=>{input+=chunk;if(!input.includes('\n'))return;try{
 const data=JSON.parse(input.trim()),key=crypto.privateDecrypt({key:privateKey,oaepHash:'sha256'},Buffer.from(data.wrappedKey,'base64'));
 const bytes=Buffer.from(data.ciphertext,'base64'),decipher=crypto.createDecipheriv('aes-256-gcm',key,Buffer.from(data.iv,'base64'));
 decipher.setAuthTag(bytes.subarray(-16));const plain=Buffer.concat([decipher.update(bytes.subarray(0,-16)),decipher.final()]);const variables=JSON.parse(plain.toString());
 fs.writeFileSync('.env.local',Object.entries(variables).map(([key,value])=>`${key}=${JSON.stringify(value)}`).join('\n')+'\n');
 console.log(JSON.stringify({written:'.env.local',keys:Object.keys(variables),secretsPrinted:false}));process.exit(0);
}catch(error){console.error('Encrypted build configuration could not be received.');process.exit(1);}});

import test from 'node:test';
import assert from 'node:assert/strict';
import {createAdminAuth,ADMIN_CONFIG_ID} from '../src/server/admin-auth.mjs';
import {COLLECTIONS} from '../src/server/application.mjs';
test('admin authentication is isolated, expiring, revocable and rate limited',async()=>{
 const rows=new Map(),store={async get(c,id){return rows.get(c+id)||null},async create(c,id,v){if(rows.has(c+id))throw Error('exists');rows.set(c+id,v)},async put(c,id,v){rows.set(c+id,v)}};
 const salt=crypto.getRandomValues(new Uint8Array(24)),material=await crypto.subtle.importKey('raw',new TextEncoder().encode('fictional-test-password'),'PBKDF2',false,['deriveBits']);
 const bytes=new Uint8Array(await crypto.subtle.deriveBits({name:'PBKDF2',hash:'SHA-256',salt,iterations:100000},material,256));
 const b64=value=>btoa(String.fromCharCode(...value));rows.set(COLLECTIONS.throttle+ADMIN_CONFIG_ID,{username:'test-admin',algorithm:'PBKDF2-SHA256',iterations:100000,salt:b64(salt),hash:b64(bytes)});
 let time='2026-11-06T12:00:00Z';const auth=createAdminAuth(store,{now:()=>time});
 await assert.rejects(auth.requireAdmin('learner-session-token'));
 await assert.rejects(auth.login('test-admin','wrong','source'));
 const result=await auth.login('test-admin','fictional-test-password','source');assert.equal((await auth.requireAdmin(result.token)).username,'test-admin');assert.ok(!JSON.stringify([...rows.values()]).includes(result.token));
 await auth.logout(result.token);await assert.rejects(auth.requireAdmin(result.token));
 const expired=await auth.login('test-admin','fictional-test-password','source');time='2026-11-07T00:00:00Z';await assert.rejects(auth.requireAdmin(expired.token));
 for(let i=0;i<10;i++)await assert.rejects(auth.login('test-admin','wrong','blocked'));
 await assert.rejects(auth.login('test-admin','fictional-test-password','blocked'),e=>e.status===429);
});

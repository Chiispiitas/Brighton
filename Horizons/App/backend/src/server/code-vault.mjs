const configId='horizons-code-vault-key-v1',enc=new TextEncoder();
const b64=bytes=>btoa(String.fromCharCode(...new Uint8Array(bytes))),un64=s=>Uint8Array.from(atob(s),c=>c.charCodeAt(0));
export function createCodeVault(store,{collection,idFor}){
 async function key(){let row=await store.get(collection,configId);if(!row){const generated={key:b64(crypto.getRandomValues(new Uint8Array(32)))};try{await store.create(collection,configId,generated,'code-vault-config');row=generated}catch(error){row=await store.get(collection,configId);if(!row)throw error}}return crypto.subtle.importKey('raw',un64(row.key),'AES-GCM',false,['encrypt','decrypt'])}
 const entryId=id=>idFor('code-vault:'+id);
 async function has(id){return !!await store.get(collection,await entryId(id))}
 async function save(id,raw){if(await idFor('code:'+raw)!==id)throw Error('El texto no coincide con la llave existente.');const iv=crypto.getRandomValues(new Uint8Array(12)),ciphertext=await crypto.subtle.encrypt({name:'AES-GCM',iv,additionalData:enc.encode(id)},await key(),enc.encode(raw));await store.put(collection,await entryId(id),{kind:'code-vault',codeId:id,iv:b64(iv),ciphertext:b64(ciphertext)},'code-vault')}
 async function reveal(id){const row=await store.get(collection,await entryId(id));if(!row)return null;const plain=await crypto.subtle.decrypt({name:'AES-GCM',iv:un64(row.iv),additionalData:enc.encode(id)},await key(),un64(row.ciphertext));const code=new TextDecoder().decode(plain);if(await idFor('code:'+code)!==id)throw Error('No se pudo verificar la llave.');return code}
 return{has,save,reveal};
}

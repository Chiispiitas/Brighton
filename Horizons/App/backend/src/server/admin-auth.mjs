import {idFor, COLLECTIONS} from './application.mjs';
const encode=new TextEncoder();
export const ADMIN_CONFIG_ID='horizons-administrator-v1';
export class AdminError extends Error{constructor(status,message){super(message);this.status=status;}}
const reject=()=>{throw new AdminError(401,'Usuario o contraseña incorrectos.');};
const unbase64=value=>Uint8Array.from(atob(value),c=>c.charCodeAt(0));
function equal(a,b){let difference=a.length^b.length;for(let i=0;i<Math.max(a.length,b.length);i++)difference|=(a[i]||0)^(b[i]||0);return difference===0;}
export function createAdminAuth(store,{now=()=>new Date().toISOString()}={}){
 async function login(username,password,source){
  if(typeof username!=='string'||typeof password!=='string'||username.length>100||password.length>256)reject();
  const window=Math.floor(Date.parse(now())/900000),key=await idFor('admin-login:'+source+':'+window);let reserved=false;
  for(let slot=0;slot<10;slot++){
   const id=key+'-'+slot;
   try{await store.create(COLLECTIONS.throttle,id,{kind:'admin-login',createdAt:now()},'admin-login');reserved=true;break;}
   catch(error){if(!await store.get(COLLECTIONS.throttle,id))throw error;}
  }
  if(!reserved)throw new AdminError(429,'Demasiados intentos. Espera unos minutos.');
  const account=await store.get(COLLECTIONS.throttle,ADMIN_CONFIG_ID);
  if(!account||account.disabled||account.algorithm!=='PBKDF2-SHA256')reject();
  const material=await crypto.subtle.importKey('raw',encode.encode(password),'PBKDF2',false,['deriveBits']);
  const result=new Uint8Array(await crypto.subtle.deriveBits({name:'PBKDF2',hash:'SHA-256',salt:unbase64(account.salt),iterations:account.iterations},material,256));
  if(!equal(encode.encode(username),encode.encode(account.username))||!equal(result,unbase64(account.hash)))reject();
  const token=Array.from(crypto.getRandomValues(new Uint8Array(32)),x=>x.toString(16).padStart(2,'0')).join('');
  const id=await idFor('admin-session:'+token),expiresAt=new Date(Date.parse(now())+8*3600000).toISOString();
  await store.create(COLLECTIONS.throttle,id,{kind:'admin-session',username:account.username,createdAt:now(),expiresAt,revoked:false},'admin-session');
  return{token,expiresAt,username:account.username};
 }
 async function requireAdmin(token){
  if(typeof token!=='string'||!/^[a-f0-9]{64}$/.test(token))reject();
  const id=await idFor('admin-session:'+token),session=await store.get(COLLECTIONS.throttle,id);
  if(!session||session.kind!=='admin-session'||session.revoked||Date.parse(session.expiresAt)<=Date.parse(now()))reject();
  const account=await store.get(COLLECTIONS.throttle,ADMIN_CONFIG_ID);
  if(!account||account.disabled||account.username!==session.username)reject();
  return{id,...session};
 }
 async function logout(token){const session=await requireAdmin(token);await store.put(COLLECTIONS.throttle,session.id,{...session,revoked:true},'admin-session');}
 return{login,requireAdmin,logout};
}

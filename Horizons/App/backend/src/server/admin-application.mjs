import {createCodeVault} from './code-vault.mjs';
import {createAdminAuth,AdminError} from './admin-auth.mjs';
import {createContentRepository} from './admin-content-repository.mjs';
import {COLLECTIONS,idFor,BOOKS,aggregateProgress} from './application.mjs';
const origins=new Set(['https://exams.bebrighton.net','https://chiispiitas.github.io']);
const clean=(value,max=100)=>String(value??'').trim().slice(0,max);
const fail=(status,message)=>{throw Object.assign(Error(message),{status});};
export function createAdminApplication(store,{now=()=>new Date().toISOString(),allowLocal=false}={}){
 const vault=createCodeVault(store,{collection:COLLECTIONS.throttle,idFor});
 const auth=createAdminAuth(store,{now}),content=createContentRepository(store);
 const allowed=origin=>origins.has(origin)||(allowLocal&&/^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin));
 async function audit(actor,action,target,details={}){await store.create(COLLECTIONS.throttle,'admin-audit-'+crypto.randomUUID(),{kind:'admin-audit',actor,action,target,details,createdAt:now()},'admin-audit');}
 async function handle(request){
  const origin=request.headers.get('Origin')||'',ownOrigin=new URL(request.url).origin;
  const headers={'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff',...(allowed(origin)||origin===ownOrigin?{'Access-Control-Allow-Origin':origin,'Vary':'Origin','Access-Control-Allow-Headers':'Content-Type, X-Requested-With','Access-Control-Allow-Methods':'POST, OPTIONS'}:{})};
  const json=(value,status=200)=>new Response(JSON.stringify(value),{status,headers});
  try{
   if(origin!==ownOrigin&&!allowed(origin))return json({ok:false,message:'Origen no permitido.'},403);
   if(request.method==='OPTIONS')return new Response(null,{status:204,headers});
   if(request.method!=='POST')return json({ok:false,message:'Usa la consola administrativa.'},405);
   const text=await request.text();if(text.length>260000)fail(413,'Solicitud demasiado grande.');
   let body;try{body=JSON.parse(text);}catch{fail(400,'JSON no válido.');}if(!body||typeof body!=='object'||Array.isArray(body))fail(400,'Solicitud no válida.');
   const source=request.headers.get('cf-connecting-ip')||request.headers.get('x-forwarded-for')?.split(',')[0]||'unknown';
   if(body.action==='login')return json({ok:true,...await auth.login(body.username,body.password,source)});
   const token=request.headers.get('X-Requested-With')||'',admin=await auth.requireAdmin(token),actor=admin.username;
   if(body.action==='logout'){await auth.logout(token);return json({ok:true});}
   if(body.action==='session')return json({ok:true,username:actor,expiresAt:admin.expiresAt});
   if(body.action==='catalog')return json({ok:true,catalog:await content.catalog()});
   if(body.action==='publish'){
    const previous=await content.current();const next=await content.publish(body.patches,body.expectedRevision,actor);
    return json({ok:true,revision:next.revision,previous:previous.revision});
   }
   if(body.action==='contentHistory'){const rows=await store.list(COLLECTIONS.throttle,'admin-content'),links=await store.list(COLLECTIONS.throttle,'admin-audit'),published=new Set(links.filter(r=>r.kind==='admin-content-publication').map(r=>r.next));return json({ok:true,versions:rows.filter(r=>published.has(r.revision)).map(r=>({revision:r.revision,previous:r.previous,createdAt:r.createdAt,actor:r.actor})).sort((a,b)=>b.createdAt.localeCompare(a.createdAt))});}
   if(body.action==='restoreContent'){const version=await content.version(body.revision),next=await content.publish(version.patches,body.expectedRevision,actor);return json({ok:true,revision:next.revision});}
   if(body.action==='list'){
    const table=['users','codes','audit'].includes(body.table)?{users:COLLECTIONS.profiles,codes:COLLECTIONS.codes,audit:COLLECTIONS.throttle}[body.table]:null;if(!table)fail(400,'Lista no válida.');
    const offset=Math.max(0,Math.floor(Number(body.offset)||0));if(offset>20000)fail(400,'Página no válida.');
    let rows=body.table==='audit'?(await store.list(table,'admin-audit')).sort((a,b)=>(b.createdAt||'').localeCompare(a.createdAt||'')).slice(offset,offset+100):await store.scan(table,offset,100);
    if(body.table==='users')rows=rows.map(({id,displayName,createdAt,updatedAt,defaultBookId})=>({id,displayName,createdAt,updatedAt,defaultBookId}));
    if(body.table==='codes')rows=await Promise.all(rows.map(async row=>({id:row.id,label:row.label||'',bookId:row.bookId,disabled:!!row.disabled,codeHint:row.codeHint||'Texto original no conservado',revealAvailable:await vault.has(row.id),claim:await store.get(COLLECTIONS.claims,row.id)})));
    return json({ok:true,rows,offset,hasMore:rows.length===100});
   }
   if(body.action==='user'){
    const profile=await store.get(COLLECTIONS.profiles,clean(body.id,100));if(!profile)fail(404,'Alumno no encontrado.');
    const [events,claims]=await Promise.all([store.list(COLLECTIONS.attempts,profile.id),store.list(COLLECTIONS.claims,profile.id)]);
    const books=await Promise.all(claims.map(async c=>{const issue=await store.get(COLLECTIONS.codes,c.codeId);return{...c,label:issue?.label||'',disabled:!issue||!!issue.disabled,status:!issue||issue.disabled?'revoked':Date.parse(c.expiresAt)<=Date.parse(now())?'expired':'active'};}));
    return json({ok:true,profile,books,progress:aggregateProgress(events,now(),profile.timeZone),recentActivity:events.sort((a,b)=>b.createdAt.localeCompare(a.createdAt)).slice(0,100).map(({id,activityId,lessonId,createdAt,xp,answers})=>({id,activityId,lessonId,createdAt,xp,correct:answers.filter(a=>a.correct).length,total:answers.length}))});
   }
   if(body.action==='revealCode'){
    const id=clean(body.id,100);if(!await store.get(COLLECTIONS.codes,id))fail(404,'Llave no encontrada.');const code=await vault.reveal(id);if(!code)fail(404,'El original de esta llave todavía no se ha recuperado.');await audit(actor,'reveal-code',id,{});return json({ok:true,code});
   }
   if(body.action==='recoverCode'){
    const code=clean(body.code,80).toUpperCase(),id=await idFor('code:'+code);if(body.id&&body.id!==id)fail(400,'El original no coincide con esta llave.');if(!await store.get(COLLECTIONS.codes,id))fail(404,'No coincide con una llave existente.');await vault.save(id,code);await audit(actor,'recover-code',id,{});return json({ok:true,id});
   }
   if(body.action==='createCode'){
    if(!BOOKS[body.bookId])fail(400,'Libro no válido.');
    const code='HZ-'+(body.bookId==='horizons-a1'?'A1':'A2')+'-'+Array.from(crypto.getRandomValues(new Uint8Array(10)),x=>x.toString(16).padStart(2,'0')).join('').toUpperCase(),id=await idFor('code:'+code),label=clean(body.label);
    await audit(actor,'create-code',id,{bookId:body.bookId,label});
    await store.create(COLLECTIONS.codes,id,{bookId:body.bookId,label,kind:'individual',disabled:false,codeHint:'…'+code.slice(-4),createdAt:now()},'issued');
    await vault.save(id,code);return json({ok:true,id,code,label,bookId:body.bookId});
   }
   if(body.action==='updateCode'){
    const id=clean(body.id,100),row=await store.get(COLLECTIONS.codes,id);if(!row)fail(404,'Llave no encontrada.');
    if(typeof body.disabled!=='boolean'||typeof body.label!=='string')fail(400,'Etiqueta y estado no válidos.');
    if(body.bookId!==undefined&&body.bookId!==row.bookId&&(await store.get(COLLECTIONS.claims,id)))fail(409,'No se puede cambiar el libro de una llave ya vinculada.');
    const bookId=body.bookId||row.bookId;if(!BOOKS[bookId])fail(400,'Libro no válido.');
    await audit(actor,'update-code',id,{before:{label:row.label||'',disabled:!!row.disabled,bookId:row.bookId},after:{label:clean(body.label),disabled:body.disabled,bookId}});
    await store.put(COLLECTIONS.codes,id,{...row,label:clean(body.label),disabled:body.disabled,bookId,updatedAt:now()},'issued');
    return json({ok:true});
   }
   if(body.action==='revokeSessions'){
    const id=clean(body.id,100),profile=await store.get(COLLECTIONS.profiles,id);if(!profile)fail(404,'Alumno no encontrado.');
    const sessions=await store.list(COLLECTIONS.sessions,id);await audit(actor,'revoke-learner-sessions',id,{count:sessions.length});
    for(const session of sessions){const sessionId=session.id;if(!sessionId)continue;await store.put(COLLECTIONS.sessions,sessionId,{...session,revoked:true},id);}
    return json({ok:true,revoked:sessions.filter(s=>s.id).length});
   }
   return json({ok:false,message:'Acción no disponible.'},400);
  }catch(error){const status=error.status||503;return json({ok:false,message:status===503?'No se pudo completar la operación. Vuelve a intentarlo.':error.message},status);}
 }
 return{handle};
}

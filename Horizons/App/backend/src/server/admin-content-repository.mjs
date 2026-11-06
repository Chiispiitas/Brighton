import {createEngine} from '../content/engine.mjs';
import {validateContentPatches,editableCatalog,contentSnapshot} from '../content/admin-content.mjs';
import {COLLECTIONS} from './application.mjs';
export function createContentRepository(store){
 const id=revision=>'admin-content-version-'+revision,link=revision=>'admin-content-next-'+revision;
 let hint='base';
 async function version(revision='base'){
  if(revision==='base')return{revision:'base',patches:{}};
  if(!/^[a-f0-9-]{36}$/.test(revision))throw Error('Versión de contenido no válida.');
  const row=await store.get(COLLECTIONS.throttle,id(revision));if(!row||row.kind!=='admin-content-version')throw Error('Versión de contenido no disponible.');return row;
 }
 async function current(){for(let i=0;i<1000;i++){const row=await store.get(COLLECTIONS.throttle,link(hint));if(!row)return version(hint);hint=row.next;}throw Error('Historial de contenido demasiado largo.');}
 async function publish(patches,expected,actor){
  const snapshot=validateContentPatches(patches),engine=createEngine(snapshot);if(engine.validateContent().length)throw Object.assign(Error('Contenido incompleto.'),{status:400});
  for(const set of snapshot.grammarSets)engine.buildQuiz({mode:'grammar',grammarSetIds:[set.id],count:512,seed:1});
  const previous=await current();if(previous.revision!==expected)throw Object.assign(Error('Otra sesión publicó cambios. Recarga antes de editar.'),{status:409});
  const revision=crypto.randomUUID(),row={kind:'admin-content-version',revision,patches,actor,createdAt:new Date().toISOString(),previous:expected};
  await store.create(COLLECTIONS.throttle,id(revision),row,'admin-content');
  try{await store.create(COLLECTIONS.throttle,link(expected),{kind:'admin-content-publication',next:revision,actor,createdAt:row.createdAt},'admin-audit');}catch(error){if(await store.get(COLLECTIONS.throttle,link(expected)))throw Object.assign(Error('Conflicto de publicación. Recarga los cambios.'),{status:409});throw error;}
  hint=revision;return row;
 }
 return {version,current,publish,async engine(revision){const row=await version(revision);return createEngine(contentSnapshot(row.patches));},async catalog(){const row=await current();return{...row,...editableCatalog(row.patches)};}};
}

import * as canonical from './unit1.mjs';
import {normalizeAnswer} from './answer-matching.mjs';
const invalid=message=>Object.assign(new Error(message),{status:400});
const clone=value=>JSON.parse(JSON.stringify(value));
const collections=['vocabulary','chunks','grammarSets','challengeQuestions'];
const original=Object.fromEntries(collections.map(kind=>[kind,clone(canonical[kind])]));
const editable={vocabulary:['term','spanish','meaning','example','aliases'],chunks:['title','description'],grammarSets:['title','description','questions'],challengeQuestions:['prompt','correctText','answer','accepted','distractors','tokens','explanation','passage']};
export function contentSnapshot(patches={}){
 const result={...canonical};
 for(const kind of collections){result[kind]=clone(original[kind]);for(const row of result[kind])Object.assign(row,patches[kind]?.[row.id]||{});}
 for(const [rows,map]of[['vocabulary','wordById'],['chunks','chunkById'],['grammarSets','grammarSetById']])result[map]=Object.fromEntries(result[rows].map(row=>[row.id,row]));
 return result;
}
export function validateContentPatches(patches){
 if(!patches||typeof patches!=='object'||Array.isArray(patches)||JSON.stringify(patches).length>240000)throw invalid('Contenido demasiado grande o no válido.');
 for(const kind of Object.keys(patches)){
  if(!collections.includes(kind)||!patches[kind]||typeof patches[kind]!=='object'||Array.isArray(patches[kind]))throw invalid('Tipo de pool no válido.');
  for(const [id,patch]of Object.entries(patches[kind])){
   const base=original[kind].find(row=>row.id===id);if(!base)throw invalid('Identificador desconocido: '+id);
   if(!patch||typeof patch!=='object'||Array.isArray(patch)||Object.keys(patch).some(key=>!editable[kind].includes(key)))throw invalid('Solo se pueden editar campos de contenido; los identificadores y recursos se conservan.');
   if(kind==='vocabulary'&&patch.term&&patch.term!==base.term)throw invalid('Cambiar el término inglés requiere una nueva grabación. Puedes editar pistas, ejemplos y sinónimos.');
   const row={...base,...patch};
   if(kind==='vocabulary'&&(!row.spanish?.trim()||!row.term?.trim()))throw invalid('La palabra necesita término y pista española.');
   if(kind==='grammarSets'){
    if(!Array.isArray(row.questions)||row.questions.length!==base.questions.length||row.questions.some((q,i)=>q.id!==base.questions[i].id))throw invalid('Conserva todos los identificadores de preguntas y su orden.');
    row.questions.forEach((q,i)=>{const old=base.questions[i];for(const key of Object.keys(q))if(!['prompt','correctText','answer','accepted','distractors','tokens','explanation','passage'].includes(key)&&JSON.stringify(q[key])!==JSON.stringify(old[key]))throw invalid('No cambies tipo, identidad, audio o recursos de una pregunta.');validateQuestion(q)});
   }
   if(kind==='challengeQuestions')validateQuestion(row);
   if(row.aliases&&(!Array.isArray(row.aliases)||row.aliases.some(x=>typeof x!=='string'||x.length>300)))throw invalid('Sinónimos no válidos.');
   for(const [key,value]of Object.entries(patch))if(typeof value==='string'&&(value.length>12000||/<\/?script\b/i.test(value)))throw invalid('Texto demasiado largo o no válido: '+key);
  }
 }
 return contentSnapshot(patches);
}
function validateQuestion(q){
 if(!q.prompt?.trim()||!q.explanation?.trim())throw invalid('Pregunta y explicación son obligatorias.');
 const answer=q.correctText??q.answer;
 if(typeof answer!=='string'||!answer.trim())throw invalid('Falta la respuesta correcta.');
 if(!Array.isArray(q.accepted)||q.accepted.some(x=>typeof x!=='string')||!q.accepted.some(x=>normalizeAnswer(x)===normalizeAnswer(answer)))throw invalid('Las respuestas aceptadas deben incluir la respuesta correcta.');
 if(q.type==='choice'&&(!Array.isArray(q.distractors)||q.distractors.length<1||q.distractors.some(x=>typeof x!=='string'||!x.trim()||q.accepted.some(a=>normalizeAnswer(a)===normalizeAnswer(x)))||new Set(q.distractors.map(x=>normalizeAnswer(x))).size!==q.distractors.length))throw invalid('Distractores duplicados, vacíos o equivalentes a una respuesta válida.');
 if(q.type==='order'&&(!Array.isArray(q.tokens)||q.tokens.some(x=>typeof x!=='string')||normalizeAnswer(q.tokens.join(' '))!==normalizeAnswer(answer)))throw invalid('Las fichas deben reconstruir la respuesta correcta.');
}
export function editableCatalog(patches={}){
 const snapshot=contentSnapshot(patches);
 return {revisionFields:editable,pools:collections.map(kind=>({kind,items:snapshot[kind].map(row=>({id:row.id,title:row.title||row.term||row.prompt,lesson:row.lessonId||row.lessonIds?.join(', ')||'',referenceAudio:row.audio||null,fields:Object.fromEntries(editable[kind].filter(key=>key in row).map(key=>[key,row[key]]))}))}))};
}
export function applyClientContent(patches={}){
 const snapshot=contentSnapshot(patches);
 for(const kind of collections)for(let i=0;i<canonical[kind].length;i++){for(const key of Object.keys(canonical[kind][i]))delete canonical[kind][i][key];Object.assign(canonical[kind][i],snapshot[kind][i]);}
 return snapshot;
}

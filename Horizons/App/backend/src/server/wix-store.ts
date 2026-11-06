import {items} from '@wix/data';
import {auth} from '@wix/essentials';
// ADMIN-only collections are reached only after this application's authorization.
const get=auth.elevate(items.get),insert=auth.elevate(items.insert),save=auth.elevate(items.save),query=auth.elevate(items.query);
export const wixStore={
 async scan(collection:string,offset=0,limit=100){
  const page=await query(collection,{filter:{},paging:{limit,offset}},{consistentRead:true});
  return (page.items||[]).map((row:Record<string,unknown>)=>({id:String(row._id),...JSON.parse(String(row.payload||'{}'))}));
 },
 async get(collection:string,id:string){
  try{const row=await get(collection,id,{consistentRead:true});return row?.payload?JSON.parse(String(row.payload)):null;}
  catch(error:any){if(error?.httpStatus===404||error?.status===404||/WDE0073|WD_ITEM_NOT_FOUND|Item.*not found/i.test(String(error?.message)))return null;throw error;}
 },
 async create(collection:string,id:string,value:any,scopeKey:string){
  const row=await insert(collection,{_id:id,scopeKey,payload:JSON.stringify(value),updatedAt:new Date()});
  if(!row?.payload)throw new Error('The private CMS did not acknowledge creation.');return JSON.parse(String(row.payload));
 },
 async put(collection:string,id:string,value:any,scopeKey:string){
  const row=await save(collection,{_id:id,scopeKey,payload:JSON.stringify(value),updatedAt:new Date()});
  if(!row?.payload)throw new Error('The private CMS did not acknowledge the save.');return JSON.parse(String(row.payload));
 },
 async list(collection:string,scopeKey:string){
  const output:any[]=[];
  for(let offset=0;offset<20000;offset+=1000){
   const page=await query(collection,{filter:{scopeKey:{$eq:scopeKey}},paging:{limit:1000,offset}},{consistentRead:true});
   const rows=page.items||[];output.push(...rows.map((row:any)=>({id:String(row._id),...JSON.parse(String(row.payload))})));
   if(rows.length<1000)return output;
  }
  throw new Error('Learning history needs archival before it can be loaded safely.');
 }
};

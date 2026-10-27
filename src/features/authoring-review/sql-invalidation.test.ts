import { expect, it } from 'vitest';
import { createSqlAuthoring } from './sql-adapter';
const id=(n:number)=>`00000000-0000-0000-0000-${String(n).padStart(12,'0')}`;
const signal=()=>new AbortController().signal;
const page={serverNow:new Date().toISOString(),rows:[{id:id(2),name:'PRIVATE GROUP',supervisor_id:id(1),starts_at:new Date().toISOString(),ends_at:new Date(Date.now()+3600000).toISOString(),supervised_from:new Date().toISOString(),revision:1}],next:null};
it('clears cached group authorization, rejects late success/failure, and requires a new explicit authorized group read',async()=>{
 let invalidate=()=>{}, calls=0;
 let next: (()=>Promise<unknown>)|undefined;
 const adapter=createSqlAuthoring({id:id(1),name:'SYNTHETIC',role:'supervisor'}, {
  subscribe(fn){invalidate=fn;return ()=>{};},
  async rpc(){calls++;return next?next():structuredClone(page);},
 },{parts:[],practicals:[],references:[]},true);
 const release=adapter.subscribe!(()=>{}), scope={actorId:id(1),groupId:id(2)};
 try {
  await adapter.groups(id(1),undefined,signal());await adapter.context(scope,signal());
  invalidate();const before=calls;
  await expect(adapter.context(scope,signal())).rejects.toMatchObject({reason:'denied'});expect(calls).toBe(before);
  for(const outcome of ['success','failure']){
   let resolve!:(v:unknown)=>void,reject!:(e:unknown)=>void;
   next=()=>new Promise((yes,no)=>{resolve=yes;reject=no;});
   const pending=adapter.groups(id(1),undefined,signal()).then(()=>false,e=>e.reason);
   invalidate();if(outcome==='success')resolve(page);else reject({code:'08006'});
   expect(await pending).toBe('denied');await expect(adapter.context(scope,signal())).rejects.toMatchObject({reason:'denied'});
  }
  next=undefined;await adapter.groups(id(1),undefined,signal());await adapter.context(scope,signal());
  next=async()=>{throw {code:'42501'};};
  await expect(adapter.context(scope,signal())).rejects.toMatchObject({reason:'denied'});
  next=undefined;const last=calls;await expect(adapter.context(scope,signal())).rejects.toMatchObject({reason:'denied'});expect(calls).toBe(last);
 }finally{release();}
});

import {test} from 'node:test';
import assert from 'node:assert/strict';
import {randomBytes} from 'node:crypto';
import {syntheticJournal,reconcileSynthetic} from './rad085-erasure-recovery.mjs';
const id=n=>`00000000-0000-0000-0000-${String(n).padStart(12,'0')}`;
function fixture(actions=['account-delete','sharing-withdraw']) {
 const journal=syntheticJournal(randomBytes(32)), events=[];
 let head={sequence:0,mac:journal.genesis};
 for(const [i,action] of actions.entries()) { const e=journal.event(head,{operation:id(i+1),target:id(i+20),action,at:'2026-10-26T00:00:00.000Z'});events.push(e);head={sequence:e.sequence,mac:e.mac}; }
 const applied=new Set(), state={closed:false,oldCapabilities:true};
 const ports={quarantine:async()=>{state.closed=true;return true;},revokeAll:async()=>{state.oldCapabilities=false;return true;},seal:async()=>head,
 page:async(after,limit)=>events.slice(after,after+limit),apply:async e=>{applied.add(e.operation);return true;},verify:async e=>applied.has(e.operation),
 maintainAndVerify:async()=>true,verifyRevoked:async()=>!state.oldCapabilities,latest:async()=>head};
 return {journal,events,head,applied,state,ports};
}
const run=f=>reconcileSynthetic({contract:'rad085-synthetic-reconciliation/1',...f,pageSize:1});
test('all supported restrictive effects are signed, paged, replayed and repeatable',async()=>{
 const f=fixture(['account-delete','sharing-withdraw','appointment-revoke','group-end','member-leave','account-stop','assignment-close']);
 assert.equal((await run(f)).sequence,7);assert.equal((await run(f)).sequence,7);assert.equal(f.applied.size,7);assert.equal(f.state.closed,true);assert.equal(f.state.oldCapabilities,false);
});
for(const [name,change] of [
 ['missing head',f=>f.ports.seal=async()=>null],
 ['missing journal',f=>f.ports.page=async()=>[]],
 ['truncated journal',f=>f.ports.page=async(after)=>after===0?[f.events[0]]:[]],
 ['gap',f=>f.ports.page=async()=>[f.events[1]]],
 ['forged event',f=>f.events[0]={...f.events[0],target:id(999)}],
 ['extra personal data',f=>f.events[0]={...f.events[0],name:'SYNTHETIC'}],
 ['failed quarantine',f=>f.ports.quarantine=async()=>false],
 ['failed invalidation',f=>f.ports.revokeAll=async()=>false],
 ['failed replay',f=>f.ports.apply=async()=>false],
 ['failed effect verification',f=>f.ports.verify=async()=>false],
 ['failed maintenance',f=>f.ports.maintainAndVerify=async()=>false],
 ['old capability remains',f=>f.ports.verifyRevoked=async()=>false],
 ['stale latest checkpoint',f=>f.ports.latest=async()=>({sequence:1,mac:f.events[0].mac})],
 ['head advanced during recovery',f=>f.ports.latest=async()=>({sequence:3,mac:'a'.repeat(64)})],
 ['second pass substitution',f=>{let calls=0;const p=f.ports.page;f.ports.page=async(...args)=>++calls>2?[]:p(...args);}],
]) test(`fails closed: ${name}`,async()=>{const f=fixture();change(f);await assert.rejects(()=>run(f));assert.equal(f.state.closed,name==='failed quarantine'?false:true);});
test('failure after a committed effect resumes by restrictive idempotent replay',async()=>{
 const f=fixture();const apply=f.ports.apply;let once=true;
 f.ports.apply=async e=>{await apply(e);if(e.sequence===1&&once){once=false;throw Error('synthetic_ack_lost');}return true;};
 await assert.rejects(()=>run(f));assert.equal(f.applied.size,1);assert.equal(f.state.closed,true);
 assert.equal((await run(f)).status,'synthetic-verified');assert.equal(f.applied.size,2);
});
test('rejects unsupported grants, identity payloads, weak keys and unchecked ceilings',async()=>{
 assert.throws(()=>syntheticJournal(new Uint8Array(2)));
 const f=fixture();assert.throws(()=>f.journal.event(f.head,{operation:id(10),target:id(11),action:'grant',at:'2026-10-26T00:00:00.000Z'}));
 await assert.rejects(()=>reconcileSynthetic({contract:'production',...f}));
 await assert.rejects(()=>reconcileSynthetic({contract:'rad085-synthetic-reconciliation/1',...f,maxEvents:1}));
});
test('an externally authenticated empty genesis is distinct from missing evidence',async()=>{assert.equal((await run(fixture([]))).sequence,0);});

test('independent durable evidence refuses unresolved mutation intents and removes synthetic keys/files on close',async()=>{
 const {openSyntheticRecoveryEvidence}=await import('./rad085-erasure-recovery.mjs');const store=await openSyntheticRecoveryEvidence();
 try {
  assert.equal(store.head().sequence,0);
  store.prepare({operation:id(1),target:id(2),action:'account-delete',at:'2026-10-26T00:00:00.000Z'});
  assert.throws(()=>store.head(),/reconciliation_closed/);
  assert.throws(()=>store.complete(id(1),false),/reconciliation_closed/);
  assert.throws(()=>store.head(),/reconciliation_closed/);
  const e=store.complete(id(1),true);assert.equal(store.journal.verify(e),true);assert.equal(store.head().sequence,1);assert.deepEqual(store.page(0,1),[e]);
 }finally{store.close();}
 assert.throws(()=>store.head(),/reconciliation_closed/);
});

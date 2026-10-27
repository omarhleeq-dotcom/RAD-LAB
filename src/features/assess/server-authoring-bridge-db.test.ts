import { expect, it } from 'vitest';
import type { Client } from 'pg';
import { openRad085Database, fixtureId as id } from './rad085-local-db';
import { authoringBridge } from './server-authoring-bridge';
import { postgresAuthoringBridge } from './server-authoring-bridge-postgres';
import type { AssessmentPublication, ContentReview } from './server-contracts';
import { createSqlAuthoring, draftToSql } from '../authoring-review/sql-adapter';
import { localPartCatalog, localPracticalCatalog } from '../authoring-review/catalog';
import { newDraft, newMCQ, newPart, newPractical, totalPoints } from '../authoring-review/draft';
import { ASSESS_EVALUATOR, resolveCase } from './server-validation';
const signal = () => new AbortController().signal;
const parts = localPartCatalog(), practicals = localPracticalCatalog(), catalog = { parts, practicals };
const refs = [...parts.map(p=>({key:p.id,revision:p.caseRef.version})),...practicals.map(p=>({key:p.caseRef.id,revision:p.caseRef.version}))];
const review: ContentReview = { sources: [{reference:'SYNTHETIC engineering fixture only',licenceEvidence:'Own test content; no external source or medical licence asserted'}], reviewedBy:'SYNTHETIC independent engineering review fixture', reviewedAt:'2026-10-26T00:00:00.000Z', scope:'Engineering contract test only; no medical approval, source validation or approved background asserted' };
async function fixture(track: 'mixed' | 'full-practical' = 'mixed') {
 const db = await openRad085Database();
 try {
  for(let n=1;n<=5;n++) await db.admin.query(`insert into auth.users values($1,$2,now(),'{"display_name":"SYNTHETIC integration","consent_version":"2026-10-16"}')`,[id(n),`bridge${n}@example.test`]);
  await db.admin.query("update public.profiles set status='approved',role=case when user_id=$1 then 'owner' else 'participant' end",[id(1)]);
  for(const n of [2,3]) await db.rpc(1,'appointment_v1',[id(n),true]);
  await db.admin.query('update assess.sharing_policy set required_version=$1,text_digest=$2',['SYNTHETIC/1','b'.repeat(64)]);
  await db.rpc(4,'sharing_consent_v1',['SYNTHETIC/1','b'.repeat(64),true]);
  const g=await db.rpc<{id:string;code:string}>(2,'supervisor_group_v1',['create',null,null,'SYNTHETIC integrated group',new Date(Date.now()+3600000).toISOString()]);
  const request=await db.rpc<{id:string;revision:number}>(4,'join_request_v1',[g.code]); await db.rpc(2,'join_decide_v1',[request.id,request.revision,'approve']);
  for(const p of parts) await db.admin.query('insert into assess.authoring_references values($1,$2,$3,$4,$5,$6,true)',[p.id,'simulator-part',p.caseRef.version,p.caseRef.id,p.caseRef.version,ASSESS_EVALUATOR]);
  for(const p of practicals) await db.admin.query('insert into assess.authoring_references values($1,$2,$3,$4,$5,$6,true)',[p.caseRef.id,'full-practical',p.caseRef.version,p.caseRef.id,p.caseRef.version,p.evaluatorVersion]);
  const a=createSqlAuthoring({id:id(2),name:'SYNTHETIC supervisor',role:'supervisor'},{rpc:(name,args)=>db.rpc(2,name,args)}, {...catalog,references:refs},true),scope={actorId:id(2),groupId:g.id};
  await a.groups(id(2),undefined,signal());
  const d=newDraft(track);d.name='SYNTHETIC '+track;
  d.items=track==='mixed'?[newMCQ(),newPart(parts[0]!.id)]:[newPractical(practicals[0]!)];
  for(const item of d.items){item.prompt='SYNTHETIC engineering task';item.authoring={author:'SYNTHETIC author fixture',reference:'Engineering fixture only',licenceNotes:'Own test text; no medical licence',notes:'No clinical approval'};if(item.type==='single-choice')item.correctOptionId=item.options[0]!.id;}
  const saved=await a.save(scope,d,signal());
  const publication: AssessmentPublication={schemaVersion:1,assessment:{schemaVersion:1,ref:{id:d.id,version:'1'},name:d.name,track,maximum:track==='mixed'?totalPoints(d):'1',policy:d.policy,items:saved.items.map(item=>{
   const base={schemaVersion:1 as const,ref:{id:item.id,version:'1'},contentLanguage:'en' as const,prompt:item.prompt};
   if(item.type==='single-choice')return {...base,type:'single-choice' as const,options:item.options};
   if(item.type==='full-practical')return {...base,type:'full-practical' as const,caseRef:item.caseRef};
   const p=parts.find(p=>p.id===item.partId)!;return {...base,type:'simulator-part' as const,presentation:{controls:Object.keys(p.view.controls),sceneElements:[]}};
  })} as AssessmentPublication['assessment'],itemMarks:saved.items.map(i=>({item:{id:i.id,version:'1'},maximum:i.type==='full-practical'?'1':i.maximum})),privateItems:saved.items.map(item=>{
   const base={schemaVersion:1 as const,ref:{id:item.id,version:'1'},review:structuredClone(review)};
   if(item.type==='single-choice')return {...base,type:'single-choice' as const,correctOptionId:item.correctOptionId};
   if(item.type==='full-practical')return {...base,type:'full-practical' as const,caseRef:item.caseRef,evaluatorVersion:item.evaluatorVersion};
   const p=parts.find(p=>p.id===item.partId)!,c=resolveCase(p.caseRef,ASSESS_EVALUATOR);
   return {...base,type:'simulator-part' as const,caseRef:p.caseRef,evaluatorVersion:ASSESS_EVALUATOR,fixedSettings:structuredClone(c.initialSettings),mutablePaths:Object.keys(p.view.controls),criteria:[{ruleId:p.ruleId,part:p.part,maximum:item.maximum}]};
  })};
  async function provision(doc=publication,digest?:string){
   const r=(await db.admin.query('select digest from assess.authoring_revisions where draft_id=$1 and revision=1',[d.id])).rows[0];
   await db.admin.query('insert into assess.authoring_reviewed_packages values($1,1,$2,$3) on conflict(draft_id,draft_revision) do update set source_digest=excluded.source_digest,document=excluded.document',[d.id,digest??r.digest,JSON.stringify(doc)]);
  }
  const port=postgresAuthoringBridge(()=>db.connect(),id(2),g.id),bridge=authoringBridge(port,catalog);
  return {...db,a,scope,saved,publication,provision,port,bridge};
 }catch(e){await db.close();throw e;}
}
for(const track of ['mixed','full-practical'] as const)it(`integrates ${track}: saved revision -> trusted review -> existing candidate/install -> exact link -> assignment -> close`,async()=>{
 const f=await fixture(track);try{
  await expect(f.bridge.publish(f.saved.id,1)).rejects.toMatchObject({code:'55000'});
  expect((await f.admin.query('select * from assess.versions')).rows).toHaveLength(0);
  await f.provision();const result=await f.bridge.publish(f.saved.id,1);
  expect(await f.port.receipt(f.saved.id,1)).toBe(result.version);
  const replay=await f.bridge.publish(f.saved.id,1);expect(replay).toEqual(result);
  const race=await Promise.all([f.bridge.publish(f.saved.id,1),f.bridge.publish(f.saved.id,1)]);expect(race).toEqual([result,result]);
  const review=await f.a.prepare(f.scope,f.saved,signal());expect(review.targetCount).toBe(1);expect(review.targets.rows[0]!.id).toBe(id(4));
  await f.a.confirm(f.scope,review.token,signal());await f.a.confirm(f.scope,review.token,signal());
  const assignment=(await f.a.assignments!(f.scope,undefined,signal())).rows[0]!;await f.a.close!(f.scope,assignment,signal());
  expect((await f.a.assignments!(f.scope,undefined,signal())).rows[0]!.closedAt).not.toBeNull();
  expect((await f.admin.query('select * from assess.versions')).rows).toHaveLength(1);expect((await f.admin.query('select * from assess.publications')).rows).toHaveLength(1);expect((await f.admin.query('select * from assess.targets')).rows).toHaveLength(1);
  const link=(await f.admin.query(`select l.*,r.digest,p.document from assess.authoring_publication_links l join assess.authoring_revisions r on r.draft_id=l.draft_id and r.revision=l.draft_revision join assess.publications p on p.version_id=l.version_id`)).rows[0];
  expect(link.source_digest).toBe(link.digest);expect(link.version_id).toBe(result.version);expect(link.document).toEqual(f.publication);
 }finally{await f.close();}
},30000);
it('bridge rejects missing/stale review, altered keys, case/reference versions, wrong writer/group and revoked permission without candidates',async()=>{
 const f=await fixture();try{
  await f.provision(f.publication,'c'.repeat(64));await expect(f.bridge.publish(f.saved.id,1)).rejects.toMatchObject({code:'55000'});
  const changed=structuredClone(f.publication);changed.assessment.name='Altered';await f.provision(changed);await expect(f.bridge.publish(f.saved.id,1)).rejects.toThrow('revision_mismatch');
  const bad=structuredClone(f.publication);bad.privateItems[0]!.review.reviewedBy='';await f.provision(bad);await expect(f.bridge.publish(f.saved.id,1)).rejects.toThrow();
  const wrongKey=structuredClone(f.publication), key=wrongKey.privateItems[0]!; if(key.type!=='single-choice')throw Error(); key.correctOptionId='unreviewed';await f.provision(wrongKey);await expect(f.bridge.publish(f.saved.id,1)).rejects.toThrow('key_mismatch');
  const wrongEvaluator=structuredClone(f.publication), practical=wrongEvaluator.privateItems.find(i=>i.type==='simulator-part')!;if(practical.type!=='simulator-part')throw Error();practical.evaluatorVersion='stale';await f.provision(wrongEvaluator);await expect(f.bridge.publish(f.saved.id,1)).rejects.toThrow('Unsupported pinned');
  await f.provision();const part=f.saved.items.find(i=>i.type==='simulator-part')!;if(part.type!=='simulator-part')throw Error();
  await f.admin.query("update assess.authoring_references set revision='stale' where key=$1",[part.partId]);await expect(f.bridge.publish(f.saved.id,1)).rejects.toMatchObject({code:'55000'});
  await f.admin.query('update assess.authoring_references set revision=$2 where key=$1',[part.partId,refs.find(r=>r.key===part.partId)!.revision]);
  const other=authoringBridge(postgresAuthoringBridge(()=>f.connect(),id(3),f.scope.groupId),catalog);await expect(other.publish(f.saved.id,1)).rejects.toMatchObject({code:'42501'});
  await f.a.save(f.scope,{...f.saved,name:'Newer revision'},signal());await expect(f.bridge.publish(f.saved.id,1)).rejects.toMatchObject({code:'40001'});
  expect((await f.admin.query('select * from assess.versions')).rows).toHaveLength(0);
  await f.rpc(1,'appointment_v1',[id(2),false]);await expect(f.bridge.publish(f.saved.id,1)).rejects.toMatchObject({code:'42501'});
 }finally{await f.close();}
},30000);
it('new internal capability is not accessible to API roles or worker and cannot install unrelated candidates',async()=>{
 const f=await fixture();try{
  for(const who of [1,2,3,4,'anon','worker'] as const){
   for(const fn of ['authoring_bridge_read_v1','authoring_bridge_candidate_v1','authoring_bridge_bind_v1','authoring_bridge_install_v1']){
    const args=fn==='authoring_bridge_read_v1'?[f.scope.groupId,f.saved.id,1]:fn==='authoring_bridge_install_v1'?[f.scope.groupId,f.saved.id,1,id(999),'{}',null]:[f.scope.groupId,f.saved.id,1,id(999)];
    await expect(f.rpc(who,fn,args)).rejects.toMatchObject({code:'42501'});
   }
   await expect(f.transaction(who,c=>c.query('select * from assess.authoring_reviewed_packages'))).rejects.toMatchObject({code:'42501'});

  }
  for (const role of ['anon','authenticated','assess_worker']) {
   const restricted=await f.connect();try {await restricted.query(`set session authorization ${role}`);await expect(restricted.query('set role assess_authoring_bridge')).rejects.toMatchObject({code:'42501'});} finally {await restricted.end();}
  }
  await expect(f.rpc(2,'content_submit_v1',[JSON.stringify(f.publication)])).rejects.toMatchObject({code:'42501'});
  await f.provision();const c=await f.connect();try{
   await c.query('begin');await c.query('set local role assess_authoring_bridge');await c.query("select set_config('request.jwt.claim.sub',$1,true)",[id(2)]);
   await expect(c.query('select assess.content_install_v1($1,$2)',[id(999),'{}'])).rejects.toMatchObject({code:'42501'});await c.query('rollback');
   await c.query('begin');await c.query('set local role assess_authoring_bridge');await c.query("select set_config('request.jwt.claim.sub',$1,true)",[id(2)]);
   await expect(c.query('select assess.authoring_bridge_install_v1($1,$2,1,$3,$4,null)',[f.scope.groupId,f.saved.id,id(999),'{}'])).rejects.toMatchObject({code:'42501'});await c.query('rollback');
  }finally{await c.end();}
  const role=(await f.admin.query("select rolcanlogin,rolinherit,rolsuper,rolbypassrls from pg_roles where rolname='assess_authoring_bridge'")).rows[0];expect(Object.values(role)).toEqual([false,false,false,false]);
 }finally{await f.close();}
},30000);
it('install/link rollback and lost COMMIT acknowledgement reconcile by read without repeating publication',async()=>{
 const f=await fixture();try{
  await f.provision();
  const rollback=authoringBridge({transaction:(d,r,run)=>f.port.transaction(d,r,tx=>run({...tx,async bind(){throw Error('synthetic link failure');}}))},catalog);
  await expect(rollback.publish(f.saved.id,1)).rejects.toThrow('link failure');
  for(const table of ['versions','content_submissions','publications','authoring_publication_links'])expect((await f.admin.query(`select * from assess.${table}`)).rows).toHaveLength(0);
  let commits=0;
  const lost=postgresAuthoringBridge(async()=>{
   const c=await f.connect();return new Proxy(c,{get(target,prop){if(prop==='query')return async (...args:unknown[])=>{const value=await (target.query as (...a:unknown[])=>Promise<unknown>).apply(target,args);if(args[0]==='commit'){commits++;throw Error('synthetic ACK lost after COMMIT');}return value;};const value=Reflect.get(target,prop);return typeof value==='function'?value.bind(target):value;}}) as Client;
  },id(2),f.scope.groupId);
  await expect(authoringBridge(lost,catalog).publish(f.saved.id,1)).rejects.toThrow('ACK lost');expect(commits).toBe(1);
  const receipt=await f.port.receipt(f.saved.id,1);expect(receipt).toMatch(/^[a-f0-9-]{36}$/);
  expect((await f.bridge.publish(f.saved.id,1)).version).toBe(receipt);expect((await f.admin.query('select * from assess.versions')).rows).toHaveLength(1);
  const raw=draftToSql(f.saved,refs);expect(raw.document.revision).toBe(1);
 }finally{await f.close();}
},30000);

it('unpublished reviewed packages follow deletion of their private draft revision without blocking cleanup',async()=>{
 const f=await fixture();try{
  await f.provision();await f.admin.query('delete from assess.authoring_drafts where id=$1',[f.saved.id]);
  expect((await f.admin.query('select * from assess.authoring_reviewed_packages')).rows).toHaveLength(0);
  expect((await f.admin.query('select * from assess.versions')).rows).toHaveLength(0);
 }finally{await f.close();}
},30000);

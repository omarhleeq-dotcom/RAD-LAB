import { readFileSync } from 'node:fs';
import { Client } from 'pg';
import { expect, it } from 'vitest';
import { openRad085Database, fixtureId as id } from './rad085-local-db';
import { openSyntheticRecoveryEvidence, reconcileSynthetic } from '../../../scripts/assess/rad085-erasure-recovery.mjs';

// Owner-approved SQL is applied only inside this disposable fixture, after the three sources.
const proposedSql = () => readFileSync('docs/archive/RAD-085_ERASURE_SQL_PROPOSAL_2026-10-26.patch','utf8').split('\n').filter(l=>l.startsWith('+')&&!l.startsWith('+++')).map(l=>l.slice(1)).join('\n');
type Db = Awaited<ReturnType<typeof fixture>>;
async function fixture() {
 const db=await openRad085Database();
 try {
  const sql=readFileSync('supabase/manual/rad085-account-erasure-local.sql','utf8');
  expect(sql.trimEnd()).toBe(proposedSql().trimEnd());
  await db.admin.query(sql);
  await db.admin.query('alter table auth.users add column banned_until timestamptz; create table auth.sessions(user_id uuid); create table auth.refresh_tokens(user_id text)');
  for(let n=1;n<=8;n++)await db.admin.query("insert into auth.users(id,email,email_confirmed_at,raw_user_meta_data) values($1,$2,now(),'{\"display_name\":\"SYNTHETIC\",\"consent_version\":\"2026-10-24\"}')",[id(n),`erasure${n}@example.test`]);
  await db.admin.query("update public.profiles set status='approved',role=case when user_id=$1 then 'owner' else 'participant' end",[id(1)]);
  for(const n of [2,3])await db.rpc(1,'appointment_v1',[id(n),true]);
  await db.admin.query("update assess.sharing_policy set required_version='SYNTHETIC',text_digest=repeat('b',64)");
  for(const n of [4,5]){await db.rpc(n,'sharing_consent_v1',['SYNTHETIC','b'.repeat(64),true]);await db.rpc(n,'consent_v2',['assess-pilot-2026-10-20-v2']);}
  const g=await db.rpc<{id:string;code:string}>(2,'supervisor_group_v1',['create',null,null,'SYNTHETIC shared',new Date(Date.now()+3600000)]);
  for(const n of [4,5]){const r=await db.rpc<{id:string;revision:number}>(n,'join_request_v1',[g.code]);await db.rpc(2,'join_decide_v1',[r.id,r.revision,'approve']);}
  const privateGroup=await db.rpc<{id:string}>(3,'supervisor_group_v1',['create',null,null,'SYNTHETIC private',new Date(Date.now()+3600000)]);
  return {...db,g,privateGroup};
 }catch(e){await db.close();throw e;}
}
async function pending(db:Db,who:number,age=true) {
 await db.transaction(1,c=>c.query("select public.owner_account_deletion_v1('deactivate',$1)",[id(who)]));
 if(age)await db.admin.query("update public.c2_account_deletions set requested_at=clock_timestamp()-interval '31 days' where user_id=$1",[id(who)]);
}
const finalise=(db:Db,who:number|'anon'|'worker'=1)=>db.transaction(who,c=>c.query("select public.owner_account_deletion_v1('finalise',null,null,1) v"));
async function seedDraft(db:Db,writer=3,n=200,published=true) {
 const group=writer===3?db.privateGroup.id:db.g.id;
 const doc={schemaVersion:1,id:id(n),revision:0,name:'SYNTHETIC',track:'mixed',policy:{},items:[]};
 await db.rpc(writer,'draft_save_v1',[group,id(n),0,doc]);
 await db.rpc(writer,'draft_save_v1',[group,id(n),1,{...doc,revision:1}]);
 await db.admin.query("insert into assess.authoring_reviewed_packages select draft_id,revision,digest,'{}' from assess.authoring_revisions where draft_id=$1",[id(n)]);
 if(!published)return;
 await db.admin.query("insert into assess.versions(id,owner_id,assessment_id,version,name,track,available) values($1,$2,$3,'2','SYNTHETIC','mixed',true)",[id(n+100),id(writer),id(n)]);
 await db.admin.query("insert into assess.content_submissions values($1,null,'installed');",[id(n+100)]);
 await db.admin.query("insert into assess.publications values($1,'{}','{}',clock_timestamp())",[id(n+100)]);
 await db.admin.query('insert into assess.authoring_publication_links select $2,draft_id,revision,digest from assess.authoring_revisions where draft_id=$1 and revision=2',[id(n),id(n+100)]);
 // Minimal administrative FK fixture: not clinical publication or a new content installer.
 await db.admin.query(`insert into assess.assignment_reviews(id,writer_id,group_id,group_revision,appointment_revision,draft_id,draft_revision,version_id,source_digest,expires_at,created_at)
 select $1,$2,$3,1,1,draft_id,revision,$4,digest,clock_timestamp()+interval '5 minutes',clock_timestamp() from assess.authoring_revisions where draft_id=$5 and revision=2`,[id(n+200),id(writer),group,id(n+100),id(n)]);
}
async function session(db:Db,user:number,n:number,assignment:string) {
 await db.admin.query(`insert into assess.sessions(id,assignment_id,user_id,ordinal,state,started_at,submitted_at,expires_at) values($1,$2,$3,1,'graded',clock_timestamp(),clock_timestamp(),clock_timestamp()+interval '6 months')`,[id(n),assignment,id(user)]);
 await db.admin.query("insert into assess.results values($1,1,1,1,'SYNTHETIC','mixed','hidden');",[id(n)]);
 await db.admin.query("insert into assess.receipts values($1,$2,'SYNTHETIC','{}')",[id(n),id(n+10)]);
 await db.admin.query("insert into assess.session_details values($1,'{}','{}','{}','[]')",[id(n)]);
}
async function assignment(db:Db) {
 await db.admin.query("insert into assess.versions(id,owner_id,assessment_id,version,name,track,available) values($1,$2,$3,'1','SYNTHETIC','mixed',true)",[id(500),id(2),id(501)]);
 await db.admin.query("insert into assess.assignments(id,owner_id,version_id) values($1,$2,$3)",[id(502),id(2),id(500)]);
 await db.admin.query('insert into assess.targets values($1,$2),($1,$3)',[id(502),id(4),id(5)]);
 return id(502);
}

it('erases student personal rows through existing C2 and cascades, retaining another student and assigned version',async()=>{
 const db=await fixture();
 try {
  const a=await assignment(db);await session(db,4,600,a);await session(db,5,601,a);
  await db.admin.query("insert into public.attempts(id,user_id,attempt_no,exam_id,case_id,definition_version,settings,result,locale) values($1,$2,1,'SYNTHETIC','SYNTHETIC','1','{}','{}','en')",[id(700),id(4)]);
  await db.admin.query("insert into public.feedback(user_id,exam_id,attempt_id,text) values($1,'SYNTHETIC',$2,'SYNTHETIC note')",[id(4),id(700)]);
  await db.admin.query("insert into public.events(user_id,type) values($1,'heartbeat')",[id(4)]);
  await db.admin.query("insert into public.c2_survey_rounds(id,version_id) select $1,id from public.c2_survey_versions where survey_type='General'",[id(701)]);
  await db.admin.query("insert into public.c2_survey_responses(user_id,round_id,state,answered_at,answers) values($1,$2,'answered',clock_timestamp(),$3)",[id(4),id(701),JSON.stringify({rating:3})]);
  await db.admin.query('insert into auth.sessions values($1)',[id(4)]);await db.admin.query('insert into auth.refresh_tokens values($1)',[id(4)]);
  await pending(db,4,false);
  expect((await finalise(db)).rows[0].v.processed).toBe(0);
  expect((await db.admin.query('select * from auth.sessions')).rows).toEqual([]);
  await db.admin.query("update public.c2_account_deletions set requested_at=clock_timestamp()-interval '31 days'");
  expect((await finalise(db)).rows[0].v.processed).toBe(1);
  expect((await finalise(db)).rows[0].v.processed).toBe(0);
  await expect(db.rpc('worker','finish_v1',[id(600),id(999),'1','1'])).rejects.toMatchObject({code:'40001'});
  for(const table of ['profiles','attempts','feedback','events','c2_account_deletions','c2_survey_responses'])expect((await db.admin.query(`select count(*)::int n from public.${table} where user_id=$1`,[id(4)])).rows[0].n).toBe(0);
  for(const table of ['sharing_consents','memberships','membership_periods','group_join_requests','join_request_throttles','practice_recordings','targets','sessions','reservations','account_stops','consents'])expect((await db.admin.query(`select count(*)::int n from assess.${table} where user_id=$1`,[id(4)])).rows[0].n).toBe(0);
  expect((await db.admin.query('select id from auth.users where id=$1',[id(4)])).rows).toEqual([]);
  for(const table of ['results','receipts','session_details'])expect((await db.admin.query(`select session_id from assess.${table} order by session_id`)).rows).toEqual([{session_id:id(601)}]);
  expect((await db.admin.query('select id from assess.assignments')).rows).toEqual([{id:a}]);
  expect((await db.admin.query('select user_id from assess.targets')).rows).toEqual([{user_id:id(5)}]);
 }finally{await db.close();}
},30000);

it('unlinks unassigned publications and temporary reviews before erasing an isolated writer, with missing receipts supported',async()=>{
 const db=await fixture();
 try {
  await seedDraft(db);await seedDraft(db,3,210,false);
  // This preview targets the writer only, and its receipt/period must disappear with it.
  await db.admin.query('insert into assess.membership_periods(id,group_id,user_id,joined_at) values($1,$2,$3,clock_timestamp())',[id(900),db.privateGroup.id,id(3)]);
  await db.admin.query('insert into assess.assignment_review_targets values($1,$2,$3,clock_timestamp())',[id(400),id(3),id(900)]);
  await pending(db,3);
  const preview=await db.rpc<{blocked:boolean;counts:{links:number;revisions:number}}>(1,'account_erasure_preview_v1',[id(3)]);
  expect(preview.blocked).toBe(false);expect(preview.counts.links).toBe(1);expect(preview.counts.revisions).toBe(4);
  // A downstream failure rolls back unlinking and account erasure together.
  await db.admin.query("create function public.synthetic_fail_delete() returns trigger language plpgsql as $$begin raise exception 'SYNTHETIC injected'; end$$;create trigger synthetic_failure before delete on auth.users for each row execute function public.synthetic_fail_delete()");
  await expect(finalise(db)).rejects.toMatchObject({code:'P0001'});
  expect((await db.admin.query('select * from assess.authoring_publication_links')).rowCount).toBe(1);
  expect((await db.admin.query('select * from assess.assignment_reviews')).rowCount).toBe(1);
  await db.admin.query('drop trigger synthetic_failure on auth.users;drop function public.synthetic_fail_delete()');
  expect((await finalise(db)).rows[0].v.processed).toBe(1);
  for(const table of ['authoring_drafts','authoring_revisions','authoring_reviewed_packages','authoring_publication_links','assignment_reviews','assignment_review_targets','publications','content_submissions','versions'])expect((await db.admin.query(`select count(*)::int n from assess.${table}`)).rows[0].n).toBe(0);
  expect((await db.admin.query('select id from assess.groups')).rows).toEqual([{id:db.g.id}]);
  expect((await db.admin.query('select user_id from assess.memberships order by user_id')).rows).toEqual([{user_id:id(4)},{user_id:id(5)}]);
 }finally{await db.close();}
},30000);

it('blocks shared writer deletion, denies unauthorized callers, and preserves original policy guards',async()=>{
 const db=await fixture();
 try {
  await seedDraft(db,2);const a=await assignment(db);await session(db,5,601,a);await pending(db,2);
  const before=(await db.admin.query('select * from assess.results')).rows;
  // Confirmed receipt + scope are additional independent blockers, even if a group ends.
  await db.admin.query('update assess.assignment_reviews set assignment_id=$1 where id=$2',[a,id(400)]);
  await db.admin.query('insert into assess.assignment_scopes values($1,$2,$3,$4)',[a,db.g.id,id(2),id(400)]);
  expect((await db.rpc<{blocked:boolean}>(1,'account_erasure_preview_v1',[id(2)])).blocked).toBe(true);
  await expect(finalise(db)).rejects.toMatchObject({code:'55000'});
  expect((await db.admin.query('select * from assess.results')).rows).toEqual(before);
  expect((await db.admin.query('select * from assess.assignment_scopes')).rowCount).toBe(1);
  expect((await db.admin.query('select * from assess.authoring_publication_links')).rowCount).toBe(1);
  expect((await db.admin.query('select status from public.profiles where user_id=$1',[id(2)])).rows[0].status).toBe('suspended');
  for(const who of [3,4,'worker','anon'] as const){await expect(finalise(db,who)).rejects.toMatchObject({code:'42501'});await expect(db.rpc(who,'account_erasure_preview_v1',[id(2)])).rejects.toMatchObject({code:'42501'});}
  for(const who of [1,3,4,'worker','anon'] as const)await expect(db.rpc(who,'erase_account_v1',[id(2)])).rejects.toMatchObject({code:'42501'});
  await expect(db.rpc(1,'account_erasure_preview_v1',[id(1)])).rejects.toMatchObject({code:'42501'});
  await expect(db.transaction(1,c=>c.query("select public.owner_account_deletion_v1('deactivate',$1)",[id(1)]))).rejects.toMatchObject({code:'42501'});
 }finally{await db.close();}
},30000);

it('serializes finalisation against scope writers, retries after lock failure without partial deletion',async()=>{
 const db=await fixture();const lock=await db.connect('synthetic-erase-lock');
 try {
  await seedDraft(db);await pending(db,3);
  await lock.query('begin');await lock.query('select * from assess.scope_lock for share');
  await expect(db.transaction(1,async c=>{await c.query("set local lock_timeout='100ms'");return c.query("select public.owner_account_deletion_v1('finalise',null,null,1)");})).rejects.toMatchObject({code:'55P03'});
  expect((await db.admin.query('select * from assess.authoring_publication_links')).rowCount).toBe(1);
  await lock.query('rollback');expect((await finalise(db)).rows[0].v.processed).toBe(1);
 }finally{await lock.query('rollback');await db.close();}
},30000);

it('restores a pre-delete/pre-withdraw PostgreSQL template snapshot, reconciles separately anchored effects while access stays closed',async()=>{
 const db=await fixture();let restored:Client|undefined;const evidence=await openSyntheticRecoveryEvidence();
 try {
  await assignment(db);await session(db,4,600,id(502));await session(db,5,601,id(502));
  // Real PostgreSQL database snapshot. No dump-tool/provider/PITR claim; roles are cluster-global.
  await db.admin.query('create database rad085_before template postgres');
  const journal=evidence.journal;
  const intent=(operation:number,action:string,target:string)=>{evidence.prepare({operation:id(operation),action,target,at:new Date().toISOString()});};
  await pending(db,4);intent(800,'account-delete',id(4));await finalise(db);
  expect((await db.admin.query('select id from auth.users where id=$1',[id(4)])).rowCount).toBe(0);evidence.complete(id(800),true);
  intent(801,'sharing-withdraw',id(5));await db.rpc(5,'sharing_consent_v1',[null,null,false]);evidence.complete(id(801),true);
  intent(802,'appointment-revoke',id(2));await db.rpc(1,'appointment_v1',[id(2),false]);evidence.complete(id(802),true);
  await db.admin.query('create database rad085_restored template rad085_before');
  restored=new Client({...db.poolConfig('postgres'),database:'rad085_restored'});await restored.connect();const c=restored;
  expect((await c.query('select id from auth.users where id=$1',[id(4)])).rowCount).toBe(1);
  expect((await c.query('select user_id from assess.sharing_consents where user_id=$1',[id(5)])).rowCount).toBe(1);
  const quarantine={closed:true,epoch:0,cache:['SYNTHETIC stale data'],capability:true};const oldEpoch=quarantine.epoch;
  const rpc=async(who:number,sql:string,args:unknown[]=[])=>{await c.query('begin');try{await c.query('set local role authenticated');await c.query("select set_config('request.jwt.claim.sub',$1,true)",[id(who)]);await c.query(sql,args);await c.query('commit');return true;}catch(e){await c.query('rollback');throw e;}};
  const ports={quarantine:async()=>{quarantine.closed=true;return true;},revokeAll:async()=>{quarantine.epoch++;quarantine.cache=[];quarantine.capability=false;return true;},seal:async()=>evidence.head(),
   page:async(after:number,limit:number)=>evidence.page(after,limit),
   apply:async(e:ReturnType<typeof evidence.page>[number])=>{
    if(e.action==='account-delete') {
     // Fixture admin is the restore operator. API owner deliberately lacks this EXECUTE.
     await c.query('begin');try{await c.query("select set_config('request.jwt.claim.sub',$1,true)",[id(1)]);await c.query('select assess.erase_account_v1($1)',[e.target]);await c.query('commit');return true;}catch(error){await c.query('rollback');throw error;}
    }
    if(e.action==='sharing-withdraw')return rpc(5,'select assess.sharing_consent_v1(null,null,false)');
    return rpc(1,'select assess.appointment_v1($1,false)',[e.target]);
   },verify:async(e:ReturnType<typeof evidence.page>[number])=>{
    const table=e.action==='account-delete'?'auth.users':e.action==='sharing-withdraw'?'assess.sharing_consents':'assess.supervisor_appointments';
    const key=e.action==='account-delete'?'id':'user_id';const extra=e.action==='appointment-revoke'?' and revoked_at is null':'';
    return (await c.query(`select * from ${table} where ${key}=$1${extra}`,[e.target])).rowCount===0;
   },maintainAndVerify:async()=>{
    await c.query('begin');try{await c.query('set local role assess_worker');await c.query('select assess.maintain_v1(100)');await c.query('commit');}catch(e){await c.query('rollback');throw e;}
    return (await c.query('select id from assess.sessions where expires_at<=clock_timestamp()')).rowCount===0;
   },verifyRevoked:async()=>!quarantine.capability&&quarantine.cache.length===0&&quarantine.epoch>oldEpoch,latest:async()=>evidence.head()};
  const run=()=>reconcileSynthetic({contract:'rad085-synthetic-reconciliation/1',journal,ports,pageSize:1});
  const fullPage=ports.page;ports.page=async()=>[];await expect(run()).rejects.toThrow('reconciliation_closed');expect(quarantine.closed).toBe(true);ports.page=fullPage;
  const realApply=ports.apply;let fail=true;ports.apply=async e=>{const ok=await realApply(e);if(e.action==='account-delete'&&fail){fail=false;throw Error('SYNTHETIC lost ACK');}return ok;};
  await expect(run()).rejects.toThrow('SYNTHETIC lost ACK');expect(quarantine.closed).toBe(true);
  expect((await run()).status).toBe('synthetic-verified');
  expect((await c.query('select id from auth.users where id=$1',[id(4)])).rowCount).toBe(0);
  expect((await c.query('select session_id from assess.results')).rows).toEqual([{session_id:id(601)}]);
  expect(quarantine.epoch>oldEpoch).toBe(true); // Old callback cannot write into a new epoch.
  expect(quarantine.cache).toEqual([]);expect(quarantine.closed).toBe(true); // Protocol never opens service.
 }finally{evidence.close();if(restored)await restored.end();await db.close();}
},30000);

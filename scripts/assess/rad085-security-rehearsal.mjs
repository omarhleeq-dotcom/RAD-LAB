// Synthetic, disposable Unix-socket clusters only. No provider/URL/credential input.
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';
import { mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { pathToFileURL } from 'node:url';

const require = createRequire('/tmp/radlab-ops-postgres/package.json');
const id = n => `00000000-0000-0000-0000-${String(n).padStart(12,'0')}`;
const files = ['20261026000100_assess_supervisor_scope.sql','20261026000200_assess_authoring_drafts.sql','20261026000300_assess_assignment_review.sql'];
// RAD085-D3-DEFERRED-20261027: preserve the historical three-source audit's input ceiling.
const auditedHead='99bc07c72544ffb3a40c12b98c23a415b7d26246';
const sha = s => createHash('sha256').update(s).digest('hex');
const toolsDir = '/tmp/rad085-pgtools/postgres-REL_18_0/src/bin';
export async function rehearse({baseline=false,lockWitnessOnly=false}={}) {
 const sql = f => baseline&&files.includes(f)?execFileSync('git',['show',`${auditedHead}:supabase/migrations/${f}`],{encoding:'utf8'}):readFileSync(`supabase/migrations/${f}`,'utf8');
 const {Client} = require('pg');
 const binaries = await import(require.resolve('@embedded-postgres/linux-x64'));
 const childEnv = {PATH:process.env.PATH,LD_LIBRARY_PATH:join(dirname(binaries.initdb),'../lib')};
 const clusters = [], clients = new Set(), artifacts = mkdtempSync(join(tmpdir(),'rad085-backup-'));
 const evidence = {contract:'rad085-security-rehearsal/1',source:baseline?auditedHead:'working-tree',provider:false,worker:false,files:files.map(file=>({file,sha256:sha(sql(file))})),checks:{},findings:{}};
 async function cluster() {
  const dir=mkdtempSync(join(tmpdir(),'rad085-review-')), data=join(dir,'data');
  const ctl=args=>execFileSync(binaries.pg_ctl,['-D',data,...args],{env:childEnv,stdio:'pipe',timeout:15000});
  execFileSync(binaries.initdb,['-D',data,'-A','trust','-U','postgres','--no-locale','--encoding=UTF8'],{env:childEnv,stdio:'pipe',timeout:15000});
  clusters.push({dir,ctl});
  ctl(['-l',join(dir,'server.log'),'-o',`-F -c listen_addresses='' -k ${dir} -p 55432 -c log_statement=none`,'-w','start']);
  async function connect(database='postgres') {
   const c=new Client({host:dir,port:55432,user:'postgres',database,password:'',ssl:false,connectionTimeoutMillis:5000,query_timeout:10000});
   await c.connect();clients.add(c);return c;
  }
  return {dir,connect,admin:await connect()};
 }
 const scalar=async(c,q,args=[])=>Object.values((await c.query(q,args)).rows[0])[0];
 async function as(c,role,user,body) {
  await c.query('begin');
  try {await c.query(`set local role ${role}`);await c.query("select set_config('request.jwt.claim.sub',$1,true)",[user]);const v=await body(c);await c.query('commit');return v;}
  catch(e){await c.query('rollback');throw e;}
 }
 const rpc=(c,user,name,args=[])=>as(c,'authenticated',id(user),c=>scalar(c,`select assess.${name}(${args.map((_,i)=>'$'+(i+1)).join(',')})`,args));
 async function denied(run,code='42501') {await assert.rejects(run,e=>e.code===code);}
 try {
  const source=await cluster(), c=source.admin;
  evidence.postgres=await scalar(c,'select version()');
  await c.query(`create role anon nologin;create role authenticated nologin;create schema auth;
   create table auth.users(id uuid primary key,email text,email_confirmed_at timestamptz,raw_user_meta_data jsonb);
   create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
   grant usage on schema auth to authenticated,anon;grant execute on function auth.uid() to authenticated,anon;`);
  // Historical replay constructs ONLY the synthetic pre-upgrade fixture; never a provider plan.
  for(const f of readdirSync('supabase/migrations').filter(f=>f.endsWith('.sql')&&f<'20261026000100').sort())await c.query(sql(f));
  await c.query(readFileSync('scripts/assess/rad085-application-inventory.sql','utf8'));
  for(let n=1;n<=4;n++)await c.query('insert into auth.users values($1,$2,now(),$3)',[id(n),`synthetic${n}@example.test`,JSON.stringify({display_name:'SYNTHETIC',consent_version:'2026-10-16'})]);
  await c.query("update public.profiles set status='approved',role=case when user_id=$1 then 'owner' else 'participant' end",[id(1)]);
  const legacy=await rpc(c,1,'group_write_v1',[null,'SYNTHETIC legacy',false]);
  await rpc(c,1,'members_write_v1',[legacy,[id(4)],true]);
  await c.query("insert into public.attempts(id,user_id,attempt_no,exam_id,case_id,definition_version,settings,result,locale) values($1,$2,1,'synthetic','synthetic','v1','{}','{}','en')",[id(90),id(4)]);
  const candidate=(n,track='mixed')=>JSON.stringify({assessment:{schemaVersion:1,ref:{id:id(n),version:'1'},name:'SYNTHETIC',track}});
  const oldFunction=await scalar(c,"select prosrc from pg_proc where oid='assess.content_submit_v1(jsonb)'::regprocedure");
  const workerBefore=(await c.query("select n.nspname,p.proname,pg_get_function_identity_arguments(p.oid) args,has_function_privilege('assess_worker',p.oid,'EXECUTE') allowed from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname in ('public','assess') order by 1,2,3")).rows;
  for(const track of ['mixed','full-practical'])await rpc(c,1,'content_submit_v1',[candidate(track==='mixed'?100:101,track)]);
  await denied(()=>rpc(c,2,'content_submit_v1',[candidate(102)]));
  const states=[];
  for(let i=0;i<3;i++) {
   const bad=sql(files[i]).replace(/commit;\s*$/i,"select 1/0; commit;");
   await denied(()=>c.query(bad),'22012');
   assert.equal((await c.query('rollback')).command,'ROLLBACK');
   const present=await scalar(c,"select array[to_regclass('assess.scope_lock') is not null,to_regclass('assess.authoring_drafts') is not null,to_regclass('assess.assignment_reviews') is not null]");
   assert.deepEqual(present,[i>0,i>1,false]);states.push({failed:files[i],committed:files.slice(0,i),present});
   await c.query(sql(files[i]));
  }
  evidence.checks.failedMigrations=states;
  await c.query(readFileSync('scripts/assess/rad085-application-inventory.sql','utf8'));
  evidence.checks.inventoryReadOnlyPrePost=true;
  const newFunction=await scalar(c,"select prosrc from pg_proc where oid='assess.content_submit_v1(jsonb)'::regprocedure");
  const bridgeFinalCheck="  -- The bridge may have waited on the assessment advisory lock or INSERT constraints.\n  if gid is not null then perform assess.supervised_group_v1(gid); end if;\n";
  assert.equal(newFunction.replace(bridgeFinalCheck,'').slice(newFunction.indexOf('  if p_document is null')),oldFunction.slice(oldFunction.indexOf('  if p_document is null')));
  const workerAfter=(await c.query("select n.nspname,p.proname,pg_get_function_identity_arguments(p.oid) args,has_function_privilege('assess_worker',p.oid,'EXECUTE') allowed from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname in ('public','assess') order by 1,2,3")).rows;
  for(const prior of workerBefore)assert.deepEqual(workerAfter.find(r=>r.nspname===prior.nspname&&r.proname===prior.proname&&r.args===prior.args),prior);
  for(const added of workerAfter.filter(r=>!workerBefore.some(p=>p.nspname===r.nspname&&p.proname===r.proname&&p.args===r.args)))assert.equal(added.allowed,false);
  evidence.checks.workerPrivilegesUnchanged=true;
  for(const track of ['mixed','full-practical'])await rpc(c,1,'content_submit_v1',[candidate(track==='mixed'?103:104,track)]);
  await denied(()=>rpc(c,2,'content_submit_v1',[candidate(105)]));
  await denied(()=>rpc(c,1,'content_submit_v1',[candidate(103)]),'23505');
  for(const role of ['anon','assess_worker'])await denied(()=>as(c,role,'',c=>scalar(c,'select assess.content_submit_v1($1)',[candidate(106)])));
  assert.equal(await scalar(c,'select count(*)::int from assess.practice_recordings'),0);
  assert.equal(await scalar(c,'select count(*)::int from assess.memberships where group_id=$1 and period_id is null',[legacy]),1);
  await rpc(c,1,'members_write_v1',[legacy,[id(4)],false]);await rpc(c,1,'members_write_v1',[legacy,[id(4)],true]);
  evidence.checks.legacyCompatibility=true;
  await denied(()=>rpc(c,1,'content_submit_v1',[null]),'22023');
  await denied(()=>rpc(c,1,'content_submit_v1',[candidate(107,'unsupported')]),'22023');
  await c.query("update public.profiles set status='suspended' where user_id=$1",[id(1)]);
  await denied(()=>rpc(c,1,'content_submit_v1',[candidate(108)]));
  await c.query("update public.profiles set status='approved' where user_id=$1",[id(1)]);
  for(const role of ['anon','authenticated','assess_worker']) {
   const r=await source.connect();await r.query(`set session authorization ${role}`);
   await denied(()=>r.query('set role assess_authoring_bridge'));await r.end();clients.delete(r);
  }
  assert.equal(await scalar(c,"select count(*)::int from pg_auth_members where roleid='assess_authoring_bridge'::regrole or member='assess_authoring_bridge'::regrole"),0);
  assert.equal(await scalar(c,"select rolcanlogin or rolinherit or rolsuper or rolbypassrls or rolcreaterole or rolcreatedb or rolreplication from pg_roles where rolname='assess_authoring_bridge'"),false);
  for(const role of ['anon','authenticated','assess_worker','assess_authoring_bridge']) {
   for(const table of ['authoring_reviewed_packages','authoring_drafts','authoring_publication_links'])await denied(()=>as(c,role,id(2),c=>c.query(`select * from assess.${table}`)));
  }
  evidence.checks.roleBoundary=true;
  await rpc(c,1,'appointment_v1',[id(2),true]);
  await c.query("update assess.sharing_policy set required_version='SYNTHETIC',text_digest=repeat('b',64)");
  await rpc(c,4,'sharing_consent_v1',['SYNTHETIC','b'.repeat(64),true]);
  const group=await rpc(c,2,'supervisor_group_v1',['create',null,null,'SYNTHETIC managed',new Date(Date.now()+3600000)]);
  const request=await rpc(c,4,'join_request_v1',[group.code]);await rpc(c,2,'join_decide_v1',[request.id,request.revision,'approve']);
  // Account-finalisation compatibility: owner context triggers the managed-membership guard.
  // Execute the same cascading auth deletion through a fixture-only SECURITY DEFINER.
  await c.query("create function public.rad085_fixture_delete(u uuid) returns void language sql security definer set search_path='' as $$delete from auth.users where id=u$$");
  async function deleteTrial() {
   await c.query('begin');
   try {
    await c.query('set local role authenticated');await c.query("select set_config('request.jwt.claim.sub',$1,true)",[id(1)]);
    await c.query('select public.rad085_fixture_delete($1)',[id(4)]);await c.query('reset role');
    assert.equal(await scalar(c,'select count(*)::int from auth.users where id=$1',[id(4)]),0);return 'deleted';
   }catch(e){if(e.code)return e.code;throw e;}finally{await c.query('rollback');}
  }
  assert.equal(await deleteTrial(),baseline?'42501':'deleted');
  await c.query('drop function public.rad085_fixture_delete(uuid)');
  assert.equal(await scalar(c,'select count(*)::int from auth.users where id=$1',[id(4)]),1);
  evidence.findings.ownerManagedMemberDelete=baseline?'42501; whole deletion rolled back':'fixed; cascading account deletion allowed';
  // Reproduce expiry after an actual lock wait. SQL-only minimal reviewed fixture, not publication approval.
  await c.query("insert into assess.authoring_references values('synthetic-part','simulator-part','1','synthetic','1','synthetic',true)");
  const draft={schemaVersion:1,id:id(200),revision:0,name:'SYNTHETIC',track:'mixed',policy:{},items:[{id:'x',type:'simulator-part',prompt:'SYNTHETIC',partId:'synthetic-part',maximum:'1',authoring:{}}]};
  await rpc(c,2,'draft_save_v1',[group.id,id(200),0,JSON.stringify(draft),'[{"key":"synthetic-part","revision":"1"}]']);
  const bridgeDocument={assessment:{schemaVersion:1,name:'SYNTHETIC',ref:{id:id(200),version:'1'},track:'mixed'}};
  await c.query(`insert into assess.authoring_reviewed_packages select draft_id,revision,digest,$2 from assess.authoring_revisions where draft_id=$1`,[id(200),JSON.stringify(bridgeDocument)]);
  const blocker=await source.connect(), reader=await source.connect();
  // Move the fixture clock boundary without mutating protected SQL.
  await c.query('alter table assess.groups disable trigger assess_managed_group');
  await c.query("update assess.groups set ends_at=clock_timestamp()+interval '1 second' where id=$1",[group.id]);
  await c.query('alter table assess.groups enable trigger assess_managed_group');
  await blocker.query('begin');await blocker.query("select * from assess.authoring_references for update");
  const started=performance.now();
  const pending=as(reader,'assess_authoring_bridge',id(2),c=>scalar(c,'select assess.authoring_bridge_read_v1($1,$2,1)',[group.id,id(200)])).then(value=>({value}),e=>({code:e.code}));
  const pid=reader.processID;
  let blocked=false;
  for(let n=0;n<100;n++){if(await scalar(c,'select cardinality(pg_blocking_pids($1))>0',[pid])){blocked=true;break;}await new Promise(r=>setTimeout(r,10));}
  assert.equal(blocked,true);
  await c.query("select pg_sleep(greatest(0,extract(epoch from (ends_at-clock_timestamp())))+0.05) from assess.groups where id=$1",[group.id]);
  await blocker.query('commit');const outcome=await pending;
  if(baseline)assert.ok(outcome.value?.snapshot);else assert.equal(outcome.code,'55000');
  assert.equal(await scalar(c,'select clock_timestamp()>ends_at from assess.groups where id=$1',[group.id]),true);
  evidence.findings.bridgeReadAfterExpiry={returned:baseline,waitMs:Math.round(performance.now()-started)};
  await denied(()=>as(c,'assess_authoring_bridge',id(2),c=>scalar(c,'select assess.authoring_bridge_read_v1($1,$2,1)',[group.id,id(200)])),'55000');
  // Apply the REVIEW PROPOSAL to temporary copies, never to protected repository files.
  const proposalDir=join(artifacts,'proposal');mkdirSync(proposalDir);
  for(const path of ['supabase/migrations/'+files[0],'supabase/migrations/'+files[2],'scripts/pages/frontend-schema.json']){
   mkdirSync(dirname(join(proposalDir,path)),{recursive:true});writeFileSync(join(proposalDir,path),execFileSync('git',['show',`${auditedHead}:${path}`]));
  }
  execFileSync('patch',['--batch','--fuzz=0','-p1','-d',proposalDir],{input:readFileSync('docs/archive/RAD-085_SQL_AUDIT_PROPOSAL_2026-10-26.patch'),stdio:['pipe','pipe','pipe']});
  for(const file of [files[0],files[2]])assert.equal(readFileSync(join(proposalDir,'supabase/migrations',file),'utf8'),readFileSync('supabase/migrations/'+file,'utf8'));
  const names=['membership_period_v1','authoring_bridge_read_v1','authoring_bridge_candidate_v1','authoring_bridge_install_v1','authoring_bridge_bind_v1','content_submit_v1'];
  const originals=[];
  for(const name of names){
   const file=name==='membership_period_v1'?files[0]:files[2];
   const pattern=new RegExp('create (?:or replace )?function assess\\.'+name+'\\([\\s\\S]*?end \\$\\$;');
   const original=sql(file).match(pattern)?.[0],proposed=readFileSync(join(proposalDir,'supabase/migrations',file),'utf8').match(pattern)?.[0];
   assert.ok(original);assert.ok(proposed);originals.push(original.replace('create function','create or replace function'));
   await c.query(proposed.replace('create function','create or replace function'));
  }
  // Exercise the trigger itself in an owner context, not only the RPC owner_id check.
  await c.query("create function public.rad085_fixture_member_delete(g uuid,u uuid) returns void language sql security definer set search_path='' as $$delete from assess.memberships where group_id=g and user_id=u$$");
  await denied(()=>as(c,'authenticated',id(1),c=>scalar(c,'select public.rad085_fixture_member_delete($1,$2)',[group.id,id(4)])));
  await c.query('drop function public.rad085_fixture_member_delete(uuid,uuid)');
  await c.query("create function public.rad085_fixture_delete(u uuid) returns void language sql security definer set search_path='' as $$delete from auth.users where id=u$$");
  await c.query('begin');await c.query('set local role authenticated');await c.query("select set_config('request.jwt.claim.sub',$1,true)",[id(1)]);
  await c.query('select public.rad085_fixture_delete($1)',[id(4)]);
  await c.query('reset role');assert.equal(await scalar(c,'select count(*)::int from auth.users where id=$1',[id(4)]),0);
  await c.query('rollback');await c.query('drop function public.rad085_fixture_delete(uuid)');
  await c.query('alter table assess.groups disable trigger assess_managed_group');
  await c.query("update assess.groups set ends_at=clock_timestamp()+interval '1 second' where id=$1",[group.id]);
  await c.query('alter table assess.groups enable trigger assess_managed_group');
  await blocker.query('begin');await blocker.query('select * from assess.authoring_references for update');
  const proposedPending=as(reader,'assess_authoring_bridge',id(2),c=>scalar(c,'select assess.authoring_bridge_read_v1($1,$2,1)',[group.id,id(200)])).then(()=>({code:'unexpected-success'}),e=>({code:e.code}));
  blocked=false;
  for(let n=0;n<100;n++){if(await scalar(c,'select cardinality(pg_blocking_pids($1))>0',[pid])){blocked=true;break;}await new Promise(r=>setTimeout(r,10));}
  assert.equal(blocked,true);
  await c.query("select pg_sleep(greatest(0,extract(epoch from (ends_at-clock_timestamp())))+0.05) from assess.groups where id=$1",[group.id]);
  await blocker.query('commit');assert.equal((await proposedPending).code,'55000');
  evidence.checks.proposedFixesOnlyInSyntheticDatabase=true;
  for(const original of originals)await c.query(original);
  async function expireDuring(lock,query,args) {
   await c.query('alter table assess.groups disable trigger assess_managed_group');
   await c.query("update assess.groups set ends_at=clock_timestamp()+interval '1 second' where id=$1",[group.id]);
   await c.query('alter table assess.groups enable trigger assess_managed_group');
   await blocker.query('begin');await blocker.query(lock);
   const pending=as(reader,'assess_authoring_bridge',id(2),c=>scalar(c,query,args)).then(value=>({value}),e=>({code:e.code}));
   let blocked=false;
   for(let n=0;n<100;n++){if(await scalar(c,'select cardinality(pg_blocking_pids($1))>0',[pid])){blocked=true;break;}await new Promise(r=>setTimeout(r,10));}
   assert.equal(blocked,true);
   await c.query("select pg_sleep(greatest(0,extract(epoch from (ends_at-clock_timestamp())))+0.05) from assess.groups where id=$1",[group.id]);
   await blocker.query('commit');const result=await pending;
   if(baseline)assert.equal(result.code,undefined);else assert.equal(result.code,'55000');
   return result;
  }
  const submitted=await expireDuring(`select pg_advisory_xact_lock(hashtextextended('${id(200)}',0))`,'select assess.content_submit_v1($1)',[JSON.stringify(bridgeDocument)]);
  if(submitted.value){await c.query('delete from assess.content_submissions where version_id=$1',[submitted.value]);await c.query('delete from assess.versions where id=$1',[submitted.value]);}
  assert.equal(await scalar(c,'select count(*)::int from assess.versions where assessment_id=$1',[id(200)]),0);
  evidence.checks.expiryAfterAdvisoryWaitRejected=!baseline;
  await c.query("insert into assess.versions(id,owner_id,assessment_id,version,name,track,available) values($1,$2,$3,'1','SYNTHETIC','mixed',true)",[id(300),id(2),id(200)]);
  await c.query("insert into assess.content_submissions values($1,null,'installed');",[id(300)]);
  await c.query("insert into assess.publications values($1,$2,'{}',clock_timestamp())",[id(300),JSON.stringify(bridgeDocument)]);
  await expireDuring(`select * from assess.versions where id='${id(300)}' for update`,'select assess.authoring_bridge_bind_v1($1,$2,1,$3)',[group.id,id(200),id(300)]);
  assert.equal(await scalar(c,'select count(*)::int from assess.authoring_publication_links'),baseline?1:0);
  await c.query('delete from assess.authoring_publication_links where version_id=$1',[id(300)]);
  for(const table of ['publications','content_submissions'])await c.query(`delete from assess.${table} where version_id=$1`,[id(300)]);
  await c.query('delete from assess.versions where id=$1',[id(300)]);
  evidence.checks.expiryAfterVersionWaitRejected=!baseline;
  // FK retention blocker, using an explicitly administrative relationship fixture only.
  // It is not evidence of reviewed/installed content or a successful publisher.
  await c.query('begin');
  await c.query("insert into assess.versions(id,owner_id,assessment_id,version,name,track) values($1,$2,$3,'1','SYNTHETIC FK-only','mixed')",[id(300),id(2),id(200)]);
  await c.query('insert into assess.authoring_publication_links select $2,draft_id,revision,digest from assess.authoring_revisions where draft_id=$1',[id(200),id(300)]);
  await c.query('savepoint deletion');
  await denied(()=>c.query('delete from assess.authoring_drafts where id=$1',[id(200)]),'23503');
  await c.query('rollback to savepoint deletion');await c.query('rollback');
  evidence.findings.linkedDraftRetention='23503; no approved erasure/retention procedure for links/reviews';
  // Global serialization measurement across unrelated callers, deliberately tiny sample.
  await blocker.query('begin');await blocker.query('select * from assess.scope_lock for update');
  const lockStart=performance.now();const waits=rpc(reader,4,'sharing_consent_v1',[]);
  for(let n=0;n<100;n++){if(await scalar(c,'select cardinality(pg_blocking_pids($1))>0',[pid]))break;await new Promise(r=>setTimeout(r,10));}
  await blocker.query('commit');await waits;
  evidence.checks.globalLockWaitMs=Math.round(performance.now()-lockStart);
  evidence.checks.databaseBytes=await scalar(c,'select pg_database_size(current_database())::text');
  if (!lockWitnessOnly) {
  // Dumps use explicit local sockets, no inherited PG*, no passwords, no remote destinations.
  const run=(bin,args)=>execFileSync(join(toolsDir,bin.startsWith('pg_')?'pg_dump':'psql',bin),args,{env:{PATH:process.env.PATH},stdio:'pipe',timeout:30000});
  const args=['-h',source.dir,'-p','55432','-U','postgres'];
  const archive=join(artifacts,'synthetic.dump'),roles=join(artifacts,'roles.sql');
  run('pg_dump',[...args,'-d','postgres','-Fc','-f',archive]);
  run('pg_dumpall',[...args,'--roles-only','--no-role-passwords','-f',roles]);
  evidence.checks.archiveBytes=statSync(archive).size;
  const restored=await cluster();
  // Fresh cluster already has bootstrap postgres; remove only that CREATE from synthetic globals.
  const globals=readFileSync(roles,'utf8').replace(/^CREATE ROLE postgres;\n/m,'').replace(/^\\(?:un)?restrict [A-Za-z0-9]+\n/gm,'');
  await restored.admin.query(globals);
  run('pg_restore',['-h',restored.dir,'-p','55432','-U','postgres','-d','postgres','--exit-on-error',archive]);
  async function inventory(db) {
   const tables=(await db.query("select schemaname,tablename from pg_tables where schemaname in ('assess','public','auth') order by 1,2")).rows;
   const data={};for(const t of tables)data[t.schemaname+'.'+t.tablename]=await scalar(db,`select coalesce(jsonb_agg(to_jsonb(t) order by to_jsonb(t)::text),'[]') from ${t.schemaname}.${t.tablename} t`);
   return {data,
    tables:(await db.query("select n.nspname,c.relname,c.relrowsecurity,c.relforcerowsecurity,c.relowner::regrole::text,coalesce(c.relacl,acldefault('r',c.relowner))::text relacl from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname in ('assess','public','auth') and c.relkind='r' order by 1,2")).rows,
    functions:(await db.query("select n.nspname,p.proname,pg_get_function_identity_arguments(p.oid),p.proowner::regrole::text,p.prosecdef,p.proconfig,p.proacl::text,p.prosrc from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname in ('assess','public','auth') order by 1,2,3")).rows,
    constraints:(await db.query("select n.nspname,c.relname,k.conname,pg_get_constraintdef(k.oid,true) from pg_constraint k join pg_class c on c.oid=k.conrelid join pg_namespace n on n.oid=c.relnamespace where n.nspname in ('assess','public','auth') order by 1,2,3")).rows,
    policies:(await db.query("select schemaname,tablename,policyname,permissive,roles,cmd,qual,with_check from pg_policies order by 1,2,3")).rows,
    roles:(await db.query("select rolname,rolsuper,rolinherit,rolcreaterole,rolcreatedb,rolcanlogin,rolreplication,rolbypassrls from pg_roles order by rolname")).rows,
    schemas:(await db.query("select nspname,nspowner::regrole::text,nspacl::text from pg_namespace where nspname in ('assess','public','auth') order by 1")).rows,
    defaults:(await db.query('select defaclrole::regrole::text,defaclnamespace::regnamespace::text,defaclobjtype,defaclacl::text from pg_default_acl order by 1,2,3')).rows,
    triggers:(await db.query("select n.nspname,c.relname,t.tgname,t.tgenabled,pg_get_triggerdef(t.oid,true) definition from pg_trigger t join pg_class c on c.oid=t.tgrelid join pg_namespace n on n.oid=c.relnamespace where not t.tgisinternal and n.nspname in ('public','assess','auth') order by 1,2,3")).rows,
    indexes:(await db.query("select schemaname,tablename,indexname,indexdef from pg_indexes where schemaname in ('public','assess','auth') order by 1,2,3")).rows,
    memberships:(await db.query('select roleid::regrole::text,member::regrole::text,admin_option,inherit_option,set_option from pg_auth_members order by 1,2')).rows};
  }
  const before=await inventory(c),after=await inventory(restored.admin);
  for(const key of Object.keys(before))assert.deepEqual(after[key],before[key],`restore mismatch: ${key}`);
  for(const db of [c,restored.admin])for(const row of (await db.query("select schemaname,sequencename from pg_sequences where schemaname in ('public','assess','auth') order by 1,2")).rows){
   const name=row.schemaname+'.'+row.sequencename;
   const value=(await db.query(`select last_value,is_called from ${name}`)).rows;
   const peer=db===c?restored.admin:c;assert.deepEqual(value,(await peer.query(`select last_value,is_called from ${name}`)).rows);
  }
  await denied(()=>rpc(restored.admin,2,'content_submit_v1',[candidate(999)]));
  assert.equal(await scalar(restored.admin,'select enabled from assess.launch_gate'),false);
  evidence.checks.dumpRestoreExact=true;
  evidence.checks.restoreVersion=run('pg_dump',['--version']).toString().trim();
  }
 } finally {
  await Promise.allSettled([...clients].map(c=>c.end()));
  for(const {dir,ctl} of clusters.reverse()){ctl(['-m','fast','-w','stop']);rmSync(dir,{recursive:true,force:true});}
  rmSync(artifacts,{recursive:true,force:true});
 }
 evidence.cleanup=true;return evidence;
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href) {
 if(![3,4].includes(process.argv.length)||process.argv[2]!=='--synthetic-disposable'||(process.argv[3]&&process.argv[3]!=='--baseline'))throw Error('synthetic-disposable flag required; optional baseline only; no connection arguments supported');
 console.log(JSON.stringify(await rehearse({baseline:process.argv[3]==='--baseline'}),null,2));
}

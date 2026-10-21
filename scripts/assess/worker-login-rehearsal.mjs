// Destructive synthetic QA ONLY: new disposable DB, no URL/DSN, no production selectors.
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import {openLocalDatabase} from './local-database.mjs';

let db,phase='configuration',outcome='STOP',cleanup=true;
const checks=[],clients=new Set();
try {
 const args=process.argv.slice(2);
 assert.equal(args.length,2);
 assert.equal(args[0],'--synthetic-disposable');
 const backend=args[1]==='--backend=pglite'?'pglite':args[1]==='--backend=postgres'?'postgres':null;
 assert(backend);
 phase='setup'; db=await openLocalDatabase(backend);
 const {exec,query}=db;
 const provision=readFileSync('supabase/manual/assess-worker-login-provision.sql','utf8');
 const revoke=readFileSync('supabase/manual/assess-worker-login-revoke.sql','utf8');
 const inspect=readFileSync('supabase/checks/assess-worker-login-ready.sql','utf8');
 const inspection=inspect.slice(inspect.indexOf('with target as ('),inspect.lastIndexOf(';\nrollback;'));
 const marker='-- TERMINATION PHASE:';
 const revocation=revoke.slice(0,revoke.indexOf(marker));
 const termination=revoke.slice(revoke.indexOf(marker));
 const database=(await query('select current_database() as name'))[0].name;
 async function selectTarget(target,action,selectedDatabase=database) {
  await query("select set_config('assess.worker_login_target',$1,false),set_config('assess.worker_login_action',$2,false),set_config('assess.worker_login_database',$3,false)",[target,action,selectedDatabase]);
 }
 async function reject(sql) {await assert.rejects(()=>exec(sql));await exec('rollback');}
 async function facts(){await exec('begin read only');try{return (await query(inspection))[0];}finally{await exec('rollback');}}
 const before=await query('select enabled from assess.launch_gate');
 phase='guards';
 await reject(provision);
 await selectTarget('postgres','provision-reviewed'); await reject(provision);
 await selectTarget('assess_job_a;drop role postgres','provision-reviewed'); await reject(provision);
 await selectTarget('assess_job_a','provision-reviewed','wrong_database');await reject(provision);
 await selectTarget('assess_job_a','provision-reviewed');
 await exec('update assess.launch_gate set enabled=true');await reject(provision);await exec('update assess.launch_gate set enabled=false');
 assert.equal((await query("select count(*)::int n from pg_roles where rolname='assess_job_a'"))[0].n,0);
 checks.push('ack-name-database-and-closed-gate-guards');
 phase='provision';await exec(provision);
 let row=await facts();assert.equal(row.staged_catalogue_valid,true);assert.equal(row.active_catalogue_valid,false);
 assert.equal(row.credential_verified,false);assert.equal(row.pooler_verified,false);
 // Default PostgreSQL PUBLIC TEMP is visible, not silently revoked or declared least-privilege complete.
 assert.equal(row.public_surface_review_required,true);
 await reject(provision);assert.equal((await facts()).staged_catalogue_valid,true);
 await selectTarget('assess_job_b','provision-reviewed');
 await reject(provision.replace('end\n$provision$;',"raise exception 'synthetic rollback';\nend\n$provision$;"));
 assert.equal((await query("select count(*)::int n from pg_roles where rolname='assess_job_b'"))[0].n,0);
 await exec(provision);
 checks.push('provision-exception-rolls-back-role-and-grants');
 checks.push('disabled-passwordless-expired-staging','replay-refused-and-rotation-slot','public-temp-surface-reported');
 phase='postconditions';await selectTarget('assess_job_a','provision-reviewed');
 await exec('grant select on assess.sessions to assess_job_a');assert.equal((await facts()).staged_catalogue_valid,false);
 await exec('revoke select on assess.sessions from assess_job_a');
 await exec('grant select(id) on assess.sessions to assess_job_a');assert.equal((await facts()).staged_catalogue_valid,false);
 await exec('revoke select(id) on assess.sessions from assess_job_a');
 await exec('grant authenticated to assess_job_a');assert.equal((await facts()).staged_catalogue_valid,false);await exec('revoke authenticated from assess_job_a');
 await exec('alter role assess_job_a inherit');assert.equal((await facts()).staged_catalogue_valid,false);await exec('alter role assess_job_a noinherit');
 await exec('grant assess_worker to assess_job_a with admin true');assert.equal((await facts()).staged_catalogue_valid,false);
 await exec('grant assess_worker to assess_job_a with admin false');
 assert.equal((await facts()).staged_catalogue_valid,true);
 checks.push('catalogue-detects-direct-column-grants-extra-role-inherit-admin');
 phase='activation-synthetic-only';
 // Fixtures only. No production secret is read or emitted; real activation is a separate review gate.
 await exec("alter role assess_job_a login password 'synthetic-only-not-a-credential' valid until 'infinity'");
 assert.equal((await facts()).active_catalogue_valid,false);
 await exec("alter role assess_job_a valid until '1970-01-01'");assert.equal((await facts()).active_catalogue_valid,false);
 await exec(`alter role assess_job_a valid until '${new Date(Date.now()+86400000).toISOString()}'`);
 assert.equal((await facts()).active_catalogue_valid,true);
 checks.push('active-catalogue-rejects-infinite-and-expired-credentials');
 if(backend==='postgres') {
  phase='real-sessions';
  const require=createRequire(process.env.ASSESS_POSTGRES_MANIFEST??'/tmp/radlab-ops-postgres/package.json');
  const {Client}=require('pg');
  const socket=(await query('show unix_socket_directories'))[0].unix_socket_directories;
  async function connect(user){const c=new Client({host:socket,port:55432,user,database,password:'',ssl:false,connectionTimeoutMillis:5000,query_timeout:5000});clients.add(c);c.on('error',()=>{});await c.connect();return c;}
  const victim=await connect('assess_job_a');
  const oldPid=(await victim.query('select pg_backend_pid() pid')).rows[0].pid;
  await victim.query('begin');await victim.query('set local role assess_worker');
  await victim.query('select assess.health_v1()');await victim.query('commit');
  assert.equal((await victim.query('select current_user role')).rows[0].role,'assess_job_a');
  await assert.rejects(()=>victim.query('select * from assess.sessions'),{code:'42501'});
  await assert.rejects(()=>victim.query('set role postgres'),{code:'42501'});
  await exec("alter role assess_job_b login valid until 'infinity'");
  const other=await connect('assess_job_b');
  await victim.query('begin');await victim.query('set local role assess_worker');
  await selectTarget('assess_job_a','revoke-reviewed');
  await exec(revocation); // separate COMMIT first
  // NOLOGIN and REVOKE alone leave the existing physical session connected.
  assert.equal((await victim.query('select pg_backend_pid() pid')).rows[0].pid,oldPid);
  await victim.query('select assess.health_v1()'); // Already-set role survives membership revocation until killed.
  await assert.rejects(()=>connect('assess_job_a'),{code:'28000'});
  await exec('create role assess_no_signal nologin;set role assess_no_signal');
  await reject(termination);await exec('reset role');
  assert.equal((await victim.query('select pg_backend_pid() pid')).rows[0].pid,oldPid);
  checks.push('kill-permission-failure-retains-committed-containment');
  await exec(termination);
  await assert.rejects(()=>victim.query('select 1'));
  assert.equal((await query('select count(*)::int n from pg_stat_activity where usename=$1',['assess_job_a']))[0].n,0);
  assert.equal((await other.query('select current_user role')).rows[0].role,'assess_job_b');
  await assert.rejects(()=>connect('assess_job_a'),{code:'28000'});
  checks.push('restricted-real-session-role-reset-and-denials','nologin-alone-keeps-existing-session','committed-revoke-blocks-new-login','terminate-kills-existing-session-only','unrelated-login-survives');
 } else {
  // PGlite tests catalogue transitions, never pretends to prove network session termination.
  await selectTarget('assess_job_a','revoke-reviewed');await exec(revocation);
  checks.push('catalogue-revoke-only-no-session-kill-claim');
 }
 phase='revoked-catalogue';
 row=await facts();assert.equal(row.active_catalogue_valid,false);assert.equal(row.staged_catalogue_valid,false);
 assert.equal((await query("select count(*)::int n from pg_auth_members m join pg_roles r on r.oid=m.member where r.rolname='assess_job_a'"))[0].n,0);
 // Containment is repeatable; the role is retained for audit, never dropped/reassigned.
 await exec(revocation);
 await selectTarget('postgres','revoke-reviewed');await reject(revocation);
 await selectTarget('assess_job_b','revoke-reviewed');await exec("comment on role assess_job_b is 'unmanaged-fixture'");await reject(revocation);
 assert.deepEqual(await query('select enabled from assess.launch_gate'),before);
 for(const table of ['attempts','events','feedback'])assert.equal((await query(`select count(*)::int n from public.${table}`))[0].n,0);
 checks.push('unmanaged-admin-target-refused','repeatable-containment-without-drop','gate-and-practice-untouched');
 outcome='PASS';phase='complete';
} catch { /* phase only; no raw SQL, errors, settings or credential material */ }
finally {
 const ended=await Promise.allSettled([...clients].map(c=>c.end()));
 if(ended.some(r=>r.status==='rejected')){cleanup=false;outcome='STOP';phase='cleanup_failed';}
 if(db){try{await db.close();}catch{cleanup=false;outcome='STOP';phase='cleanup_failed';}}
}
console.log(JSON.stringify({contract:'assess-worker-login-rehearsal/1',outcome,code:phase,checks,cleanup,providerVerified:false,runtimeOrLaunchVerified:false}));
process.exitCode=outcome==='PASS'?0:1;

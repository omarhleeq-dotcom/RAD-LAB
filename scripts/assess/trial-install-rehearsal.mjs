// Destructive fault injection ONLY in disposable local databases.
import assert from 'node:assert/strict';
import { buildTrialInstallPackage } from './trial-install.mjs';
import { openLocalDatabase } from './local-database.mjs';
let db,phase='configuration',outcome='STOP',cleanup=true;const checks=[];
try{
 const args=process.argv.slice(2);
 assert.equal(args.length,3);assert(args.includes('--synthetic-disposable'));
 const backend=args.find(a=>a.startsWith('--backend='))?.slice(10),lineEndings=args.find(a=>a.startsWith('--line-endings='))?.slice(15);
 assert(['pglite','postgres'].includes(backend));assert(['lf','crlf'].includes(lineEndings));
 phase='reference';const files=await buildTrialInstallPackage();
 phase='setup';db=await openLocalDatabase(backend,{lineEndings,through:'pre-rad085'});
 await db.exec("create role assess_job_a nologin noinherit valid until '2000-01-01';grant assess_worker to assess_job_a");
 const id=n=>`00000000-0000-0000-0000-${String(n).padStart(12,'0')}`;
 for(const n of [1,2,3])await db.query('insert into auth.users values($1,$2,now(),$3)',[id(n),`synthetic${n}@example.test`,JSON.stringify({display_name:'Synthetic'})]);
 await db.exec(`update public.profiles set status='approved';update public.profiles set role='owner' where user_id='${id(1)}'`);
 for(const n of [2,3])await db.port('authenticated',id(n)).call('consent_v2',{p_version:'assess-pilot-2026-10-20-v2'});
 const consents=await db.query('select * from assess.consents order by user_id,version');
 const run=name=>db.exec(files[name+'.sql']);
 const reject=async(change,restore,step='install')=>{
  await db.exec(change);await assert.rejects(()=>run(step));await db.exec('rollback');
  if(step==='install')assert.equal((await db.query("select to_regclass('assess.trial_scope')::text t"))[0].t,null);
  await db.exec(restore);
 };
 phase='preconditions';await run('preinstall');checks.push('exact-baseline');
 await reject("alter function assess.health_v1() rename to health_modified_v1", "alter function assess.health_modified_v1() rename to health_v1");
 await reject("create or replace function assess.health_v1() returns jsonb language sql as $$select '{}'::jsonb$$", "-- restored below");
 // Restore from a fresh disposable reference: never adopt the observed body/hash.
 const ref=await openLocalDatabase(backend,{lineEndings,through:'pre-rad085'});
 try{await db.exec((await ref.query("select pg_get_functiondef('assess.health_v1()'::regprocedure) d"))[0].d);}finally{await ref.close();}
 await reject('grant execute on function assess.health_v1() to authenticated','revoke execute on function assess.health_v1() from authenticated');
 await reject('alter table assess.sessions disable trigger all','alter table assess.sessions enable trigger all');
 await reject('alter role assess_job_a login','alter role assess_job_a nologin');
 await reject('update assess.launch_gate set enabled=true','update assess.launch_gate set enabled=false');
 await reject("set default_transaction_isolation='repeatable read'","set default_transaction_isolation='read committed'");
 checks.push('body-signature-acl-trigger-login-gate-isolation-rejected','failed-install-atomic');
 phase='rollback-after-ddl';
 const first=files['install.sql'].indexOf('do $verify$'),second=files['install.sql'].indexOf('do $verify$',first+1);
 const broken=files['install.sql'].slice(0,second)+"alter function assess.trial_enter_v1(uuid) security invoker;\n"+files['install.sql'].slice(second);
 await assert.rejects(()=>db.exec(broken));await db.exec('rollback');
 assert.equal((await db.query("select to_regclass('assess.trial_scope')::text t"))[0].t,null);
 checks.push('postcondition-failure-rolls-back-DDL');
 phase='install';await run('install');await run('postinstall');
 assert.equal((await db.query('select count(*)::int n from assess.trial_scope'))[0].n,0);
 for(const who of ['anon','authenticated','assess_worker']){
  assert.equal((await db.query("select has_table_privilege($1,'assess.trial_scope','SELECT,INSERT,UPDATE,DELETE,TRUNCATE') allowed",[who]))[0].allowed,false);
 }
 for(const who of ['anon','authenticated'])assert.equal((await db.query("select has_function_privilege($1,'assess.trial_claim_v1(uuid)','EXECUTE') allowed",[who]))[0].allowed,false);
 await assert.rejects(()=>db.port('assess_worker').call('trial_health_v1',{p_trial:'00000000-0000-0000-0000-000000000090'}));
 checks.push('dormant-no-scope-gate-and-login-closed','private-control-and-worker-only-wrappers','dormant-worker-stops');
 phase='postconditions';
 phase='post-acl';await reject('grant select on assess.trial_scope to authenticated','revoke select on assess.trial_scope from authenticated','postinstall');
 phase='post-trigger';await reject('alter trigger assess_trial_write_guard on assess.sessions rename to zzz_trial_write_guard','alter trigger zzz_trial_write_guard on assess.sessions rename to assess_trial_write_guard','postinstall');
 phase='post-definer';await reject("alter function assess.trial_enter_v1(uuid) security invoker","alter function assess.trial_enter_v1(uuid) security definer",'postinstall');
 phase='reinstall';await run('postinstall');await assert.rejects(()=>run('install'));await db.exec('rollback');
 await run('postinstall');checks.push('postinstall-acl-trigger-order-definer-rejected','no-reinstall-or-repair');
 assert.deepEqual(await db.query('select * from assess.consents order by user_id,version'),consents);
 checks.push('existing-consents-unchanged');
 phase='complete';outcome='PASS';
}catch{/* No raw SQL, fixture or private fields in witness. */}
finally{try{if(db)await db.close();}catch{cleanup=false;phase='cleanup_failed';outcome='STOP';}}
console.log(JSON.stringify({contract:'assess-trial-install-rehearsal/1',outcome,code:phase,checks,cleanup,runtimeOrLaunchVerified:false}));
if(outcome!=='PASS')process.exitCode=1;

import { spawnSync } from "node:child_process";
import { expect,it } from "vitest";
it("derives exact reviewed references, preserves original pins and rejects semantic, permission and NOT NULL drift",()=>{
 const source=`
 import assert from 'node:assert/strict';
 import {createHash} from 'node:crypto';
 import {buildTrialInstallPackage,reviewedOwnerListBody,reviewedCatalogSql} from './scripts/assess/trial-install.mjs';
 import {buildOwnerListDetailSql} from './scripts/assess/trial-catalog-diff.mjs';
 import {openLocalDatabase} from './scripts/assess/local-database.mjs';
 const files=await buildTrialInstallPackage({profile:'reviewed-pg17-v1'});
 const original=await buildTrialInstallPackage();
 assert.equal(createHash('sha256').update(original['preinstall.sql']).digest('hex'),'186ea18ad1f45166aa788c944627c66503ec8b0db68f20666db66347d0c6359c');
 await assert.rejects(()=>buildTrialInstallPackage({profile:'unknown'}));
 const refs=JSON.parse(files['reference.json']);assert.equal(refs.contract,'assess-trial-install-reference/2');
 assert.equal(refs.before.length,4);assert.equal(refs.after.length,8);
 const db=await openLocalDatabase('pglite',{through:'pre-rad085'});
 try{
  await db.exec("create role assess_job_a nologin noinherit valid until '2000-01-01';grant assess_worker to assess_job_a");
  const run=async(name,crlf=false)=>db.exec(crlf?files[name+'.sql'].replaceAll('\\n','\\r\\n'):files[name+'.sql']);
  await run('preinstall');
  const routines=await db.query("select proname,prosrc,pg_get_functiondef(oid) def from pg_proc where pronamespace='public'::regnamespace and proname=any($1::text[])",[['can_read_training','handle_new_user','owner_page_v1','set_participant_status','training_page_v1_with_comparison','training_page_v1','owner_list_participants']]);
  const owner=routines.find(r=>r.proname==='owner_list_participants');
  // Explicit source reflow only: split after p.status and p.last_seen_at.
  const wrapped=reviewedOwnerListBody(owner.prosrc);
  assert.equal(createHash('md5').update(wrapped).digest('hex'),'30a7a3fd013ed6af5b2712f1479171e6');
  assert.throws(()=>reviewedOwnerListBody('unknown'));
  for(const r of routines)await db.exec(r.def.replace(r.prosrc,()=>r.proname==='owner_list_participants'?wrapped:r.prosrc.replaceAll('\\n','\\r\\n')));
  assert.equal((await db.query("select md5(pg_get_functiondef('public.owner_list_participants()'::regprocedure)) h"))[0].h,'d3a10b1b03d5284b7ee6208f82a064a9');
  await run('preinstall',true);
  // SQL Editor may convert file LF to CRLF: expected source must survive unchanged.
  const detail=(await buildOwnerListDetailSql()).replaceAll('\\n','\\r\\n');
  await db.exec(detail.slice(0,detail.indexOf('with expected')));
  const d=(await db.query(detail.slice(detail.indexOf('with expected'),detail.lastIndexOf('rollback;')).replace(/;\\s*$/,'')))[0].diagnostic;
  await db.exec('rollback');assert.equal(d.expected.lfBodyHash,createHash('md5').update(owner.prosrc).digest('hex'));
  const before=(await db.query(reviewedCatalogSql))[0].catalog;
  const reject=async(change,restore)=>{await db.exec(change);await assert.rejects(()=>run('install'),{code:'55000'});await db.exec('rollback');assert.equal((await db.query("select to_regclass('assess.trial_scope')::text t"))[0].t,null);await db.exec(restore);};
  await reject(owner.def.replace(owner.prosrc,()=>wrapped.replace('owner only','changed guard')),owner.def.replace(owner.prosrc,()=>wrapped));
  await reject('grant execute on function public.owner_list_participants() to anon','revoke execute on function public.owner_list_participants() from anon');
  await reject('alter table assess.sessions alter column started_at drop not null','alter table assess.sessions alter column started_at set not null');
  await reject('alter table assess.sessions disable trigger all','alter table assess.sessions enable trigger all');
  await reject('alter role assess_job_a login','alter role assess_job_a nologin');
  await reject('update assess.launch_gate set enabled=true','update assess.launch_gate set enabled=false');
  assert.deepEqual((await db.query(reviewedCatalogSql))[0].catalog,before);
  // Recheck after DDL; any failed postcondition rolls the installation back.
  const sql=files['install.sql'],first=sql.indexOf('do $verify$'),second=sql.indexOf('do $verify$',first+1);
  await assert.rejects(()=>db.exec(sql.slice(0,second)+'alter function assess.trial_enter_v1(uuid) security invoker;'+sql.slice(second)),{code:'55000'});
  await db.exec('rollback');assert.equal((await db.query("select to_regclass('assess.trial_scope')::text t"))[0].t,null);
  // Actual pasted CRLF payload must match the independently derived after references.
  await run('install',true);await run('postinstall',true);
  assert.equal((await db.query('select count(*)::int n from assess.trial_scope'))[0].n,0);
  assert.equal((await db.query('select enabled from assess.launch_gate'))[0].enabled,false);
  assert.equal((await db.query("select rolcanlogin from pg_roles where rolname='assess_job_a'"))[0].rolcanlogin,false);
  await assert.rejects(()=>run('install'));await db.exec('rollback');await run('postinstall');
 }finally{await db.close()}
 console.log(JSON.stringify({outcome:'PASS',cleanup:true}));`;
 const child=spawnSync(process.execPath,["--input-type=module","-e",source],{encoding:"utf8",timeout:180000,maxBuffer:100000});
 expect(child.status,child.stdout+child.stderr).toBe(0);expect(JSON.parse(child.stdout)).toEqual({outcome:"PASS",cleanup:true});
},185000);

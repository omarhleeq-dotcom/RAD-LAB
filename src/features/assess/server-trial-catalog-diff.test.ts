import { spawnSync } from "node:child_process";
import { expect,it } from "vitest";
it("pinpoints catalog fields read-only, accepts existing references, bounds output and never prints function bodies",()=>{
 const source=`
 import assert from 'node:assert/strict';
 import {buildCatalogDiffSql} from './scripts/assess/trial-catalog-diff.mjs';
 import {catalogSql,buildTrialInstallPackage} from './scripts/assess/trial-install.mjs';
 import {openLocalDatabase} from './scripts/assess/local-database.mjs';
 import {createHash} from 'node:crypto';
 const sql=await buildCatalogDiffSql();
 const read=async db=>{await db.exec(sql.slice(0,sql.indexOf('with reference')));try{return (await db.query(sql.slice(sql.indexOf('with reference'),sql.lastIndexOf('rollback;')).replace(/;\\s*$/,'')))[0].diagnostic;}finally{await db.exec('rollback')}};
 for(const lineEndings of ['lf','crlf']){
  const db=await openLocalDatabase('pglite',{lineEndings});
  try{
   let result=await read(db);assert.equal(result.referenceMatched,true);assert.equal(result.totalDifferences,0);
   // Allowed extra public extension functions must be treated just like preinstall.
   await db.exec("create function public.synthetic_extension() returns integer language sql as $$select 1$$");
   assert.equal((await read(db)).referenceMatched,true);
   const original=(await db.query("select pg_get_functiondef('assess.health_v1()'::regprocedure) d"))[0].d;
   await db.exec("create or replace function assess.health_v1() returns jsonb language sql as $$select jsonb_build_object('PRIVATE DIAGNOSTIC TEST',1)$$;alter function assess.health_v1() set synthetic.token='PRIVATE CONFIG';grant execute on function assess.health_v1() to authenticated;grant select on assess.versions to authenticated;alter trigger assess_assignment_terminal on assess.assignments rename to zzz_synthetic_terminal");
   const before=(await db.query(catalogSql))[0].catalog;
   result=await read(db);assert.equal(result.referenceMatched,false);assert.equal(result.truncated,false);
   for(const [kind,idPart,field] of [['function','assess.health_v1','body'],['function','assess.health_v1','acl'],['function','assess.health_v1','config'],['table','assess.versions','acl'],['table','assess.versions','effectiveAcl'],['table','assess.assignments','triggers']])assert(result.differences.some(d=>d.kind===kind&&d.object.startsWith(idPart)&&d.field===field),field);
   assert(!JSON.stringify(result).includes('PRIVATE'));assert.deepEqual((await db.query(catalogSql))[0].catalog,before);
   await db.exec(original);await db.exec('revoke execute on function assess.health_v1() from authenticated;revoke select on assess.versions from authenticated;alter trigger zzz_synthetic_terminal on assess.assignments rename to assess_assignment_terminal');
   assert.equal((await read(db)).referenceMatched,true);
   await db.exec('drop function assess.health_v1()');result=await read(db);
   assert(result.differences.some(d=>d.field==='presence'&&d.expected===true&&d.observed===false));
   await db.exec(original);await db.exec('revoke all on function assess.health_v1() from public,anon,authenticated,assess_worker;grant execute on function assess.health_v1() to assess_worker');
   assert.equal((await read(db)).referenceMatched,true);
   for(let n=0;n<101;n++)await db.exec('create function assess.synthetic_extra_'+n+'() returns integer language sql as $$select 1$$');
   result=await read(db);assert.equal(result.totalDifferences,101);assert.equal(result.truncated,true);assert.equal(result.differences.length,100);
   await db.exec('set role authenticated');await assert.rejects(()=>read(db),{code:'42501'});await db.exec('rollback;reset role');
  }finally{await db.close();}
 }
 const packageFiles=await buildTrialInstallPackage();assert.equal(createHash('sha256').update(packageFiles['preinstall.sql']).digest('hex'),'186ea18ad1f45166aa788c944627c66503ec8b0db68f20666db66347d0c6359c');
 console.log(JSON.stringify({outcome:'PASS'}));`;
 const child=spawnSync(process.execPath,["--input-type=module","-e",source],{encoding:"utf8",timeout:60000,maxBuffer:100000});
 expect(child.status,child.stdout+child.stderr).toBe(0);expect(JSON.parse(child.stdout)).toEqual({outcome:"PASS"});
},65000);
it("isolates owner-list formatting from changed source without exposing provider literals",()=>{
 const source=`
 import assert from 'node:assert/strict';
 import {buildOwnerListDetailSql} from './scripts/assess/trial-catalog-diff.mjs';
 import {openLocalDatabase} from './scripts/assess/local-database.mjs';
 const sql=await buildOwnerListDetailSql(),db=await openLocalDatabase('pglite');
 const read=async()=>{await db.exec(sql.slice(0,sql.indexOf('with expected')));try{return (await db.query(sql.slice(sql.indexOf('with expected'),sql.lastIndexOf('rollback;')).replace(/;\\s*$/,'')))[0].diagnostic;}finally{await db.exec('rollback')}};
 try{
  const original=(await db.query("select prosrc,pg_get_functiondef(oid) def from pg_proc where oid='public.owner_list_participants()'::regprocedure"))[0];
  const replace=body=>db.exec(original.def.replace(original.prosrc,body));
  let r=await read();assert.equal(r.matchesLfSource,true);assert.equal(r.totalLineDifferences,0);assert.equal(r.diagnosticOnly,true);
  await replace(original.prosrc.replaceAll('\\n','\\r\\n'));r=await read();assert.equal(r.matchesCrlfSource,true);assert.equal(r.matchesAfterCrlfToLf,true);assert.equal(r.totalLineDifferences,0);
  await replace(original.prosrc.split('\\n').map(l=>'  '+l).join('\\n'));r=await read();assert.equal(r.matchesLfSource,false);assert.equal(r.matchesNonblankTrimmedLines,true);assert(r.totalLineDifferences>0);
  await replace(original.prosrc.replace('owner only','PRIVATE LITERAL'));r=await read();assert.equal(r.matchesNonblankTrimmedLines,false);assert(!JSON.stringify(r).includes('PRIVATE'));assert(r.lineDifferences.some(d=>d.observedPresent&&d.matchingExpectedLines.length===0));
  await replace('-- PRIVATE COMMENT\\n'.repeat(100)+original.prosrc);r=await read();assert.equal(r.truncated,true);assert.equal(r.lineDifferences.length,64);assert(!JSON.stringify(r).includes('PRIVATE'));
  await replace(' '.repeat(32769)+original.prosrc);await assert.rejects(read,{code:'54000'});await db.exec('rollback');
  await replace(original.prosrc);await db.exec('set role authenticated');await assert.rejects(read,{code:'42501'});await db.exec('rollback;reset role');
 }finally{await db.close()}
 console.log(JSON.stringify({outcome:'PASS'}));`;
 const child=spawnSync(process.execPath,["--input-type=module","-e",source],{encoding:"utf8",timeout:30000,maxBuffer:100000});
 expect(child.status,child.stdout+child.stderr).toBe(0);expect(JSON.parse(child.stdout)).toEqual({outcome:"PASS"});
},35000);
it("reproduces the reported 28 representation differences without adopting the unknown owner-list source",()=>{
 const source=`
 import assert from 'node:assert/strict';import {openLocalDatabase} from './scripts/assess/local-database.mjs';
 const db=await openLocalDatabase('pglite');
 const functions={
 can_read_training:['6b60ecbd6c86359bfabc8312c4f7acdd','c77394f625b2b0b2f059d38565723772'],
 handle_new_user:['e8a4f67e42ddd6af61714445a845b1bc','6fbc9fb0ac13256b4c9a2f2494820fe7'],
 owner_page_v1:['f87029192c68d23adc980792c5314088','6254c83e5d283abc0609c5e47b0674de'],
 set_participant_status:['a76bc2aa6e129f38f96f980e5101a685','db0657e89b3e0ab0357a0fdd48603c72'],
 training_page_v1_with_comparison:['fbbdf995e15fdb7c3be22787d01cee6c','a500b968ad3f857064935310eb8f2e6f'],
 training_page_v1:['14dee356fc3a35504e71c88e464fb33a','6986d1193610200ec07d66060c8b8538']};
 const constraints={account_stops:'feb37a02bf240e7e430873c6fdb96fac',assignments:'8693e854e2d9b3f55ef73795e358227e',consents:'1cbd5774d3be0a81ecc062e186c318e2',content_submissions:'fcd967a2be0916d2caef27127bb38c06',groups:'5155ccb1923bfa1b7d14784268332c63',launch_gate:'548ac9da33d4861130123da0e5557096',memberships:'c9e662fc2ab81195f39e4cd9e648d340',practical_presentations:'6c69243d40c69c833197a8693e6f89a2',publications:'922080e6119b414bafc4f3152442a297',receipts:'99fb4f6d2d1bd0c1a15163121514adb1',reservations:'6539b9630be67afe8b60db425a8658cb',results:'fd960f04b7c253d7d052ac91b0ce8701',session_details:'d3feb1df7c65918be9f41e74d98b5923',sessions:'2f9d2fe68b733fa1e174a98fa6880099',targets:'1d39adac28da74a087913c86cf4b0fc8',versions:'4b6c15adb85a27b51e7f665431aa1527'};
 try{
  await db.exec("set search_path=''");
  for(const [name,pair] of Object.entries(functions)){
   const f=(await db.query("select p.oid,pg_get_functiondef(p.oid) def from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname=$1",[name]))[0];
   await db.exec(f.def.replaceAll('\\n','\\r\\n'));
   const actual=(await db.query('select md5(prosrc) b,md5(pg_get_functiondef(oid)) d from pg_proc where oid=$1',[f.oid]))[0];assert.deepEqual([actual.b,actual.d],pair);
  }
  for(const [table,hash] of Object.entries(constraints)){
   const actual=(await db.query("select md5(coalesce(jsonb_agg(pg_get_constraintdef(oid) order by conname),'[]'::jsonb)::text) h from pg_constraint where conrelid=$1::regclass and contype<>'n'",['assess.'+table]))[0];assert.equal(actual.h,hash);
  }
  const original=(await db.query("select prosrc,pg_get_functiondef(oid) def from pg_proc where oid='public.owner_list_participants()'::regprocedure"))[0];
  for(const body of [original.prosrc,original.prosrc.replaceAll('\\n','\\r\\n')]){
   await db.exec(original.def.replace(original.prosrc,body));const actual=(await db.query("select md5(prosrc) h from pg_proc where oid='public.owner_list_participants()'::regprocedure"))[0];assert.notEqual(actual.h,'30a7a3fd013ed6af5b2712f1479171e6');
  }
 }finally{await db.close()}
 console.log(JSON.stringify({outcome:'PASS'}));`;
 const child=spawnSync(process.execPath,["--input-type=module","-e",source],{encoding:"utf8",timeout:30000,maxBuffer:100000});
 expect(child.status,child.stdout+child.stderr).toBe(0);expect(JSON.parse(child.stdout)).toEqual({outcome:"PASS"});
},35000);

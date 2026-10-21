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

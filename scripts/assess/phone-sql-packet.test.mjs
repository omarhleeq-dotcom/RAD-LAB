// Synthetic PostgreSQL only; neither test nor generator accepts a remote connection.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { openLocalDatabase } from './local-database.mjs';
import { B_MIGRATION, SIGNATURES, backupSql, countsSql, cleanCatalogues, functionStep, lineBoundedParts, precheckSql, progressSql, renderPacket, sha256, smokeSql, transport } from './phone-sql-packet.mjs';
const read = p => readFileSync(p,'utf8');
const m4 = ['20261026000100_assess_supervisor_scope.sql','20261026000200_assess_authoring_drafts.sql','20261026000300_assess_assignment_review.sql','20261027000100_assess_management_erasure.sql'];
test('parts preserve all bytes and split only at line boundaries; oversized single lines fail closed',()=>{
 assert.deepEqual(lineBoundedParts('abc\ndef\nxyz',8),['abc\n','def\nxyz']);
 assert.equal(lineBoundedParts('a'.repeat(14999))[0].length,14999);
 assert.throws(()=>lineBoundedParts('a'.repeat(15000)),/oversized_line/);
 assert.throws(()=>lineBoundedParts('x',15001),/invalid_part_limit/);
 const input='first\r\nsecond\nthird\n';assert.equal(lineBoundedParts(input,9).join(''),input);
});
test('function steps encode exact Unicode/newline bytes, validate digests/signature and count wrapper overhead',()=>{
 const definition="CREATE OR REPLACE FUNCTION assess.synthetic() RETURNS text LANGUAGE sql AS $function$\nselect 'اسم\nثلاثي';\n$function$;\n";
 const spec={signature:'assess.synthetic()',definition,fromDigest:'a'.repeat(64),toDigest:sha256(definition)};
 const step=functionStep(spec);assert(!/[\r\n]/.test(step));assert(step.length<15000);
 assert.equal(Buffer.from(step.match(/decode\('([^']+)'/)[1],'base64').toString('utf8'),definition);
 assert.match(step,/to_regprocedure/);assert.match(step,/launch_gate/);assert.match(step,/fresh.proacl IS DISTINCT FROM old.proacl/);
 assert.throws(()=>functionStep({...spec,signature:"x'); DROP TABLE public.profiles;--"}),/invalid_reviewed/);
 assert.throws(()=>functionStep({...spec,toDigest:'b'.repeat(64)}),/invalid_reviewed/);
 const huge=definition+' '.repeat(12000);assert.throws(()=>functionStep({...spec,definition:huge,toDigest:sha256(huge)}),/oversized_function/);
});
for(const history of ['lf','crlf'])test(`PostgreSQL ${history}: encoded apply gives exact readiness; paste drift is detected; rollback restores all M1-M4 definitions/ACLs/config exactly`,async()=>{
 const catalogues=await cleanCatalogues();
 const db=await openLocalDatabase('postgres',{through:'pre-rad085',lineEndings:history,allMigrationLineEndings:true});
 const ready=async file=>{
  const sql=read('supabase/checks/'+file);
  await db.exec(sql.slice(0,sql.indexOf('with objects')));
  try{return await db.query(sql.slice(sql.indexOf('with objects'),sql.lastIndexOf('rollback;')));}finally{await db.exec('rollback');}
 };
 const allReady=async file=>{const rows=await ready(file);assert.equal(rows.length,13);assert.deepEqual(rows.filter(r=>!r.ready),[]);};
 const functions=()=>db.query("select p.oid,p.oid::regprocedure::text signature,pg_get_functiondef(p.oid) definition,p.proowner,p.proacl::text acl,p.proconfig from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname in ('public','assess') order by 2");
 const rows=()=>db.query("select (select jsonb_agg(to_jsonb(p) order by p.user_id) from public.profiles p) profiles,(select jsonb_agg(to_jsonb(g) order by g.id) from assess.groups g) groups,(select to_jsonb(p) from assess.sharing_policy p) policy");
 try{
  // History CRLF; the three repaired live M1-M4 target functions have clean LF bytes.
  for(const file of m4)await db.exec(read('supabase/migrations/'+file));
  await db.exec(read('supabase/manual/rad085-sharing-policy-live-p1.sql'));
  await db.exec("insert into auth.users values('00000000-0000-0000-0000-000000000001','synthetic@example.test',now(),'{\"display_name\":\"Synthetic Three Name\"}')");
  const original=await functions(),data=await rows();
  await allReady('rad085-d3-ready.sql');
  const pre=await db.query(precheckSql.slice(precheckSql.indexOf('select version'),precheckSql.lastIndexOf('rollback;')));await db.exec('rollback');
  for(const [k,v] of Object.entries(pre[0]))if(k!=='postgres_version')assert.equal(v,true,k);
  const backup=backupSql.slice(backupSql.indexOf('with rows'),backupSql.indexOf('select p.oid::regprocedure'));
  const [saved]=await db.query(backup);assert.equal(saved.export_complete_under_5000,true);assert(saved.affected_rows.some(r=>r.row.display_name==='Synthetic Three Name'));
  const apply=transport(catalogues).join('\n'),rollback=transport(catalogues,true).join('\n');
  for(const step of [...transport(catalogues),...transport(catalogues,true)])assert(step.length<15000);
  await db.exec(apply);await allReady('rad085-p1-b-ready.sql');
  await db.exec(apply);await allReady('rad085-p1-b-ready.sql'); // Idempotent retry only at exact known state.
  assert.deepEqual(await rows(),data);
  const changed=await functions();assert.equal(changed.filter((r,i)=>r.definition!==original[i].definition).length,3);
  // Closed gate and missing target checks apply to both directions.
  await db.exec('update assess.launch_gate set enabled=true');await assert.rejects(db.exec(apply),/launch_gate must be closed/);await db.exec('rollback');
  await assert.rejects(db.exec(rollback),/launch_gate must be closed/);await db.exec('rollback');await db.exec('update assess.launch_gate set enabled=false');
  await db.exec('begin;alter function assess.join_request_v1(text) rename to synthetic_missing');
  await assert.rejects(db.exec(transport(catalogues)[2]),/replacement missing/);await db.exec('rollback');
  // A same-name/body drift cannot sneak through a retry.
  const def=changed.find(r=>r.signature==='assess.join_request_v1(text)').definition;
  await db.exec(def.replace('begin','begin null;'));
  await assert.rejects(db.exec(apply),/source drift/);await db.exec('rollback');await db.exec(def);
  await db.exec(rollback);await allReady('rad085-d3-ready.sql');assert.deepEqual(await functions(),original);assert.deepEqual(await rows(),data);
  // Monaco auto-indent simulation changes prosrc. No whitespace-stripped readiness.
  for(const row of catalogues.after)await db.exec(row.definition.replaceAll('\n','\n    '));
  const drift=await ready('rad085-p1-b-ready.sql');assert.deepEqual(drift.filter(r=>!r.ready).map(r=>r.kind),['functions']);
  await assert.rejects(db.exec(rollback),/source drift/);await db.exec('rollback');
  for(const row of catalogues.after)await db.exec(row.definition); // Local recovery only; never an owner paste instruction.
  await db.exec(rollback);await allReady('rad085-d3-ready.sql');assert.deepEqual(await functions(),original);
  const packet=renderPacket(catalogues);for(const match of packet.matchAll(/```sql\n([\s\S]*?)\n```/g))assert(match[1].length<15000);
  // All standalone queries compile; progress shows exactly M1-M4 again.
  const p=progressSql(catalogues);const progress=await db.query(p.slice(p.indexOf('select sig'),p.lastIndexOf('rollback;')));assert(progress.every(r=>r.m1_m4_exact&&!r.b_exact));
  await db.exec(smokeSql);await db.exec(countsSql);assert.equal(read('supabase/migrations/'+B_MIGRATION).match(/create or replace function/gi).length,3);
 }finally{await db.close();}
});
test('checked-in phone packet is reproducible from the clean local catalogue',async()=>{
 const catalogues=await cleanCatalogues();assert.equal(SIGNATURES.length,3);
 assert.equal(renderPacket(catalogues),read('docs/RAD-085_P1_B_PHONE_PACKET.md'));
});

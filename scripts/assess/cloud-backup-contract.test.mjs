import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { nativeFixture } from './cloud-backup-fixture.mjs';
import { readInventory,grantPacket,readyPacket,assertReader,sha,constructorGrants } from '../ops/cloud-backup-contract.mjs';
test('actual scoped packet: dry-run, additive policies, exact grants, no RPC/SET ROLE/write/default grants; drift rolls back',{timeout:120000},async()=>{
 const f=await nativeFixture();try{
  const a=f.admin;await a.query(`create schema assess;create table assess.launch_gate(enabled boolean);insert into assess.launch_gate values(false);
   revoke create on schema public from public;revoke temporary on database postgres from public;
   create role provider_owner nologin;create schema provider authorization provider_owner;
   create table provider.rows(id int primary key,body text);alter table provider.rows owner to provider_owner;
   alter table provider.rows enable row level security;alter table provider.rows force row level security;
   create policy existing_read on provider.rows for select to provider_owner using(id>0);
   insert into provider.rows values(1,'SYNTHETIC'),(2,'SYNTHETIC_TWO');
   create sequence provider.seq;select setval('provider.seq',40,true);
   select lo_from_bytea(42000,decode('00feff','hex'));
   create function assess.unauthorized() returns int language sql security definer as $$select 1$$;revoke all on function assess.unauthorized() from public;`);
  const inv=await readInventory(a),packet=grantPacket(inv);
  const constructorAccess="select r.rolname,p.oid::regprocedure::text f,has_function_privilege(r.oid,p.oid,'EXECUTE') ok from pg_roles r cross join pg_proc p where r.rolname<>'assess_backup' and p.oid in ('lo_create(oid)'::regprocedure,'lo_creat(integer)'::regprocedure,'lo_from_bytea(oid,bytea)'::regprocedure) order by 1,2";
  const constructorBefore=(await a.query(constructorAccess)).rows;
  const old=(await a.query("select row_to_json(p) p from pg_policy p order by oid")).rows;
  await a.query(packet);assert.equal((await a.query("select count(*) n from pg_roles where rolname='assess_backup'")).rows[0].n,'0');
  await a.query("set radlab.backup_apply='reviewed-select-only'");await a.query(packet);
  assert.equal(sha(await readInventory(a)),sha(inv));assert.deepEqual((await a.query(constructorAccess)).rows,constructorBefore);
  await a.query('begin;set local role provider_owner');await assert.rejects(a.query(constructorGrants(inv)),/constructor ownership unavailable/);await a.query('rollback');
  const original=(await a.query("select row_to_json(p) p from pg_policy p where polname='existing_read' order by oid")).rows;assert.deepEqual(original,old);
  const readiness=(await a.query(readyPacket(inv))).flatMap(x=>x.rows);assert.deepEqual(readiness.filter(r=>r.ok!==true).map(r=>r.check_name),[]);
  await a.query("alter role assess_backup login valid until 'infinity'");const reader=await f.connect('assess_backup');await assertReader(reader,inv);
  assert.equal((await reader.query('select count(*) n from provider.rows')).rows[0].n,'2');assert.equal((await reader.query("select encode(lo_get(42000),'hex') b")).rows[0].b,'00feff');
  for(const q of ["insert into provider.rows values(3,'bad')","update provider.rows set body='bad'","delete from provider.rows","truncate provider.rows","select nextval('provider.seq')","select setval('provider.seq',3)",'create table public.bad(id int)','alter table provider.rows disable row level security','select assess.unauthorized()','set role postgres','set role provider_owner'])await assert.rejects(reader.query(q),{code:'42501'});
  assert.equal((await a.query("select count(*) n from pg_auth_members where member='assess_backup'::regrole or roleid='assess_backup'::regrole")).rows[0].n,'0');
  assert.equal((await a.query("select count(*) n from pg_default_acl cross join lateral aclexplode(defaclacl) x where x.grantee='assess_backup'::regrole")).rows[0].n,'0');
  await a.query('alter role assess_backup nologin;create table public.drift(x int)');
  await assert.rejects(a.query(packet));await a.query('rollback');assert.equal((await a.query("select has_table_privilege('assess_backup','public.drift','SELECT') ok")).rows[0].ok,false);
  assert.throws(()=>execFileSync(process.execPath,['scripts/ops/prepare-cloud-backup.mjs','--apply'],{stdio:'pipe'}));
 }finally{await f.close();}
});
test('known PUBLIC LOB constructor gap is real: source role can write outside read-only transaction; readiness must STOP',{timeout:120000},async()=>{
 const {readerFixture}=await import('./cloud-backup-fixture.mjs');const f=await readerFixture();
 for(const name of ['lo_create(oid)','lo_creat(integer)','lo_from_bytea(oid,bytea)']){await f.admin.query('revoke execute on function '+name+' from '+f.inventory.roleNames.filter(n=>n!=='postgres').map(n=>'\"'+n+'\"').join(','));await f.admin.query('grant execute on function '+name+' to public');}
 try{
  for(const q of ['select lo_create(0)','select lo_creat(-1)',"select lo_from_bytea(0,decode('ff','hex'))"]){
   await f.reader.query('begin read only');await assert.rejects(f.reader.query(q),{code:'25006'});await f.reader.query('rollback');
   await f.reader.query('begin');assert.equal((await f.reader.query(q)).rowCount,1);await f.reader.query('rollback');
  }
  const constructors=(await f.admin.query("select oid::regprocedure::text f from pg_proc where oid in ('lo_create(oid)'::regprocedure,'lo_creat(integer)'::regprocedure,'lo_from_bytea(oid,bytea)'::regprocedure) and has_function_privilege('assess_backup',oid,'EXECUTE') order by 1")).rows;
  assert.equal(constructors.length,3);
  await assert.rejects(assertReader(f.reader,f.inventory),/privileges/);
  await f.reader.end();await f.admin.query('alter role assess_backup nologin');
  await f.admin.query("set radlab.backup_apply='reviewed-select-only'");await f.admin.query(grantPacket(await readInventory(f.admin)));
  await f.admin.query("alter role assess_backup login valid until 'infinity'");const corrected=await f.connect('assess_backup');
  for(const q of ['select lo_create(0)','select lo_creat(-1)',"select lo_from_bytea(0,decode('ff','hex'))"])await assert.rejects(corrected.query(q),{code:'42501'});
 }finally{await f.close();}
});

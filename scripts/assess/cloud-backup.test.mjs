// Real synthetic dump/encryption/restore; required tools installed by the existing DB CI lane.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync,mkdirSync,readFileSync,writeFileSync,readdirSync,existsSync,rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createHash } from 'node:crypto';
import pg from 'pg';
import { backupArchive,main } from '../ops/cloud-backup.mjs';
import { prepareRolesSql } from '../ops/laptop-restore-test.mjs';
test('default dry-run reads no credential; unknown flags fail',async()=>{
 assert.deepEqual(await main([]),{contract:'rad105-encrypted-backup/1',dryRun:true,connections:0,uploads:0});
 await assert.rejects(main(['--enable']));
 const context=JSON.parse(execFileSync(process.execPath,['scripts/ops/build-cloud-backup.mjs'],{encoding:'utf8'}));
 try{const m=JSON.parse(readFileSync(join(context.output,'manifest.json'),'utf8'));assert.equal(m.privateKeyIncluded,false);assert.equal(m.defaultDryRun,true);assert.deepEqual(readdirSync(context.output).sort(),['Dockerfile','age','backup-main.cjs','backup.cjs','manifest.json']);
 const r=execFileSync(process.execPath,[join(context.output,'backup-main.cjs')],{encoding:'utf8'});assert.equal(JSON.parse(r).connections,0);
 }finally{rmSync(context.output,{recursive:true,force:true});}
});
test('SELECT-only RLS policy: complete real encrypted dump/restore, exact ACL/data/sequence, no key in job, failure cleanup', {timeout:120000},async()=>{
 const root=mkdtempSync(join(tmpdir(),'rad105-backup-test-'));
 const bin=process.env.RAD105_TEST_PG_BIN??readdirSync('/usr/lib/postgresql').sort().map(v=>`/usr/lib/postgresql/${v}/bin`).find(b=>existsSync(b+'/initdb'));
 assert.ok(bin,'required PostgreSQL tools');
 const as=process.getuid()===0?['runuser','-u','postgres','--']:[];
 const run=(program,args,options={})=>execFileSync(as[0]??program,as.length?[...as.slice(1),program,...args]:args,{stdio:'pipe',...options});
 if(as.length)execFileSync('chown',['postgres',root]);
 let started=false,restoreStarted=false,admin,backup,restored;
 try{
  run(bin+'/initdb',['-D',root+'/db','-A','trust','-U','postgres','--no-locale','--encoding=UTF8']);
  run(bin+'/pg_ctl',['-D',root+'/db','-l',root+'/postgres.log','-o',`-F -c listen_addresses='' -k ${root} -p 55435`,'-w','start']);started=true;
  const connect=async(user='postgres',database='postgres')=>{const c=new pg.Client({host:root,port:55435,user,database});await c.connect();return c;};
  admin=await connect();
  await admin.query(`create role synthetic_owner nologin noinherit;create role synthetic_reader nologin noinherit;
   alter role synthetic_owner set search_path to public;
   grant synthetic_reader to synthetic_owner with admin false,inherit false,set true;
   create role assess_backup login noinherit nosuperuser nocreatedb nocreaterole nobypassrls noreplication;
   revoke create on schema public from public;revoke temporary on database postgres from public;
   create table public.plain(id int primary key,body text);insert into public.plain values(1,'SYNTHETIC_ONE'),(2,'SYNTHETIC_TWO');
   create sequence public.serial;select setval('public.serial',37,true);
   create table public.private(id int primary key references public.plain(id),payload bytea);insert into public.private values(1,decode('00ff4142','hex'));
   alter table public.private enable row level security;alter table public.private force row level security;
   grant usage on schema public to assess_backup;grant select on public.plain,public.private,public.serial to assess_backup;
   create policy assess_backup_read on public.private for select to assess_backup using(true);
   select lo_from_bytea(42000,decode('000102feff','hex'));grant select on large object 42000 to assess_backup;
   alter table public.plain owner to synthetic_owner;alter table public.private owner to synthetic_owner;
   alter sequence public.serial owner to synthetic_owner;alter large object 42000 owner to synthetic_owner;
   alter default privileges for role synthetic_owner in schema public grant select on tables to synthetic_reader;`);
  const expected=[{s:'public',t:'plain',k:'r',r:false},{s:'public',t:'private',k:'r',r:true},{s:'public',t:'serial',k:'S',r:false}];
  const inventorySha256=createHash('sha256').update(JSON.stringify(expected)).digest('hex');
  const keys=execFileSync('age-keygen',[],{encoding:'utf8',stdio:'pipe'});const recipient=/public key: (age1\w+)/i.exec(keys)?.[1];
  // age-keygen prints identity to stdout and recipient to stderr; derive public key without ever handing identity to backupArchive.
  const identity=join(root,'identity');writeFileSync(identity,keys,{mode:0o600});
  const publicKey=recipient??execFileSync('age-keygen',['-y',identity],{encoding:'utf8'}).trim();
  backup=await connect('assess_backup');
  const env={...process.env,PATH:bin+':'+process.env.PATH,PGHOST:root,PGPORT:'55435',PGUSER:'assess_backup',PGDATABASE:'postgres',PGSSLMODE:'disable'};
  let encrypted;
  const c={recipient:publicKey,planLimitBytes:500000000,inventorySha256};
  const result=await backupArchive(c,backup,{root,env,upload:async(file,name)=>{assert.match(name,/^daily\/.*\.tar\.age$/);encrypted=readFileSync(file);}});
  assert.equal(result.outcome,'COMPLETE');assert.equal(result.tables,2);assert.ok(encrypted);assert.ok(!encrypted.includes(Buffer.from('SYNTHETIC_ONE')));
  assert.equal(readdirSync(root).filter(x=>x.startsWith('assess-backup-')).length,0);
  writeFileSync(join(root,'backup.age'),encrypted);
  execFileSync('age',['--decrypt','--identity',identity,'--output',join(root,'bundle.tar'),join(root,'backup.age')],{stdio:'pipe'});
  mkdirSync(join(root,'restore'));execFileSync('tar',['-C',join(root,'restore'),'-xf',join(root,'bundle.tar')]);
  const meta=JSON.parse(readFileSync(join(root,'restore','metadata.json'),'utf8'));assert.deepEqual(meta.inventory,expected);
  const sums=JSON.parse(readFileSync(join(root,'restore','checksums.json'),'utf8'));
  for(const[f,h]of Object.entries(sums))assert.equal(createHash('sha256').update(readFileSync(join(root,'restore',f))).digest('hex'),h);
  const rolesSql=readFileSync(join(root,'restore','roles.sql'),'utf8');assert.doesNotMatch(rolesSql,/PASSWORD\s+'/i);
  // A fresh cluster has neither synthetic application roles nor assess_backup.
  // Reuse the strict RAD-086 role reconciliation, then restore ownership/ACLs.
  run(bin+'/initdb',['-D',root+'/restore-db','-A','trust','-U','postgres','--no-locale','--encoding=UTF8']);
  run(bin+'/pg_ctl',['-D',root+'/restore-db','-l',root+'/restore-postgres.log','-o',`-F -c listen_addresses='' -k ${root} -p 55436`,'-w','start']);restoreStarted=true;
  const restoreEnv={...env,PGPORT:'55436',PGUSER:'postgres'};
  execFileSync(bin+'/psql',['-X','-q','-v','ON_ERROR_STOP=1','-d','postgres'],{env:restoreEnv,input:prepareRolesSql(rolesSql),stdio:'pipe'});
  restored=new pg.Client({host:root,port:55436,user:'postgres',database:'postgres'});await restored.connect();
  await restored.query('create database restored template template0');await restored.end();
  execFileSync('pg_restore',['--exit-on-error','--dbname=restored',join(root,'restore','project.dump')],{env:restoreEnv,stdio:'pipe'});
  restored=new pg.Client({host:root,port:55436,user:'postgres',database:'restored'});await restored.connect();
  const roleState=`select to_jsonb(r)-array['oid','rolpassword'] state from pg_roles r where rolname !~ '^pg_' order by rolname`;
  assert.deepEqual((await restored.query(roleState)).rows,(await admin.query(roleState)).rows);
  const members=`select g.rolname role,u.rolname member,a.rolname grantor,m.admin_option,m.inherit_option,m.set_option
   from pg_auth_members m join pg_roles g on g.oid=m.roleid join pg_roles u on u.oid=m.member join pg_roles a on a.oid=m.grantor order by 1,2,3`;
  assert.deepEqual((await restored.query(members)).rows,(await admin.query(members)).rows);
  const defaults=`select r.rolname,d.defaclnamespace::regnamespace::text schema,d.defaclobjtype,d.defaclacl::text acl from pg_default_acl d join pg_roles r on r.oid=d.defaclrole order by 1,2,3`;
  assert.deepEqual((await restored.query(defaults)).rows,(await admin.query(defaults)).rows);
  for(const table of ['plain','private'])assert.deepEqual((await restored.query(`table public.${table} order by id`)).rows,(await admin.query(`table public.${table} order by id`)).rows);
  assert.deepEqual((await restored.query('table public.serial')).rows,(await admin.query('table public.serial')).rows);
  assert.equal((await restored.query("select encode(lo_get(42000),'hex') b")).rows[0].b,'000102feff');
  const acl=`select relname,relowner::regrole::text owner,relacl::text,relrowsecurity,relforcerowsecurity from pg_class where relnamespace='public'::regnamespace and relname in ('plain','private','serial') order by 1`;
  assert.deepEqual((await restored.query(acl)).rows,(await admin.query(acl)).rows);
  const lobAcl="select oid,lomowner::regrole::text owner,lomacl::text from pg_largeobject_metadata order by oid";
  assert.deepEqual((await restored.query(lobAcl)).rows,(await admin.query(lobAcl)).rows);
  assert.deepEqual((await restored.query("select policyname,roles,cmd,qual from pg_policies where schemaname='public' order by policyname")).rows,(await admin.query("select policyname,roles,cmd,qual from pg_policies where schemaname='public' order by policyname")).rows);
  for(const sql of ['insert into public.plain values(3,\'bad\')','select nextval(\'public.serial\')','create table public.bad(x int)','set role postgres'])await assert.rejects(backup.query(sql),{code:'42501'});
  await assert.rejects(backupArchive({...c,inventorySha256:'0'.repeat(64)},backup,{root,env,upload:async()=>assert.fail('must not upload')}),/backup_snapshot/);
  await assert.rejects(backupArchive(c,backup,{root,env,upload:async()=>{throw Error('SYNTHETIC_PRIVATE_ERROR');}}),/backup_upload/);
  await admin.query("create function public.synthetic_writer() returns int language plpgsql security definer as $$begin insert into public.plain values(9,'bad');return 1;end$$");
  await assert.rejects(backupArchive(c,backup,{root,env,upload:async()=>assert.fail('must not upload')}),/backup_privileges/);
  await admin.query('drop function public.synthetic_writer()');
  await admin.query('create policy restrict_backup on public.private as restrictive for select to assess_backup using(false)');
  await assert.rejects(backupArchive(c,backup,{root,env,upload:async()=>assert.fail('must not upload')}),/backup_snapshot/);
  assert.equal(readdirSync(root).filter(x=>x.startsWith('assess-backup-')).length,0);
 }finally{
  await Promise.allSettled([admin,backup,restored].filter(Boolean).map(c=>c.end()));
  if(restoreStarted)run(bin+'/pg_ctl',['-D',root+'/restore-db','-m','fast','-w','stop']);
  if(started)run(bin+'/pg_ctl',['-D',root+'/db','-m','fast','-w','stop']);rmSync(root,{recursive:true,force:true});
 }
});

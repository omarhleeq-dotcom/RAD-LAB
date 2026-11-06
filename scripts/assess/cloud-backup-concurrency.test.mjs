// Real native commands and real concurrent connections. No provider/clock bypass.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFile,execFileSync } from 'node:child_process';
import { promisify } from 'node:util';
import { writeFileSync,readFileSync,mkdirSync,readdirSync } from 'node:fs';
import { join } from 'node:path';
import pg from 'pg';
import { readerFixture } from './cloud-backup-fixture.mjs';
import { backupArchive } from '../ops/cloud-backup.mjs';
const execute=promisify(execFile);
async function proof(change,{expectedFailure}={}){
 const f=await readerFixture();let encrypted,changed=false;const waits=[];
 try{
  const identity=join(f.root,'owner-identity');writeFileSync(identity,execFileSync('age-keygen',[],{stdio:'pipe'}),{mode:0o600});
  const recipient=execFileSync('age-keygen',['-y',identity],{encoding:'utf8'}).trim();
  const runAsync=async(program,args,options)=>{
   if(!changed&&program==='pg_dump'){changed=true;await change(f,waits);}
   if(change.roles&&program==='pg_dumpall'){
    await f.admin.query('alter role provider_owner connection limit 1');
    try{return await execute(program,args,options);}finally{await f.admin.query('alter role provider_owner connection limit -1');}
   }
   return execute(program,args,options);
  };
  const run=()=>backupArchive({recipient,planLimitBytes:500000000,inventorySha256:f.inventorySha256},f.reader,{root:f.root,env:f.env,runAsync,upload:async file=>{encrypted=readFileSync(file);}});
  if(expectedFailure){await assert.rejects(run(),new RegExp('backup_'+expectedFailure));assert.equal(encrypted,undefined);return;}
  assert.equal((await run()).outcome,'COMPLETE');assert.ok(encrypted);
  const archive=join(f.root,'backup.age');writeFileSync(archive,encrypted);
  execFileSync('age',['--decrypt','--identity',identity,'--output',join(f.root,'data.tar'),archive],{stdio:'pipe'});
  mkdirSync(join(f.root,'restore'));execFileSync('tar',['-C',join(f.root,'restore'),'-xf',join(f.root,'data.tar')]);
  const meta=JSON.parse(readFileSync(join(f.root,'restore','metadata.json'),'utf8'));
  assert.equal(meta.counts.find(c=>c.t==='rows').rows,'10');
  assert.equal(meta.sequences[0].archive.last_value,'101');
  await f.admin.query('create database restored template template0');
  execFileSync('pg_restore',['--exit-on-error','--dbname=restored',join(f.root,'restore','project.dump')],{env:{...f.env,PGUSER:'postgres'},stdio:'pipe'});
  const target=new pg.Client({host:f.root,user:'postgres',database:'restored'});await target.connect();
  try{
   assert.equal((await target.query('select count(*) n from public.rows')).rows[0].n,'10');
   assert.equal((await target.query('select body from public.rows where id=1')).rows[0].body,'SYNTHETIC_1');
   assert.equal((await target.query('select last_value::text v from public.rows_id_seq')).rows[0].v,'101');
   assert.equal((await target.query("select encode(lo_get(42000),'hex') v")).rows[0].v,'000102ff');
  }finally{await target.end();}
 }finally{
  await Promise.allSettled(waits);assert.equal(readdirSync(f.root).filter(n=>n.startsWith('assess-backup-')).length,0);await f.close();
 }
}
test('concurrent DML and large-object update retain snapshot; actual archived sequence advancement restores', {timeout:120000},()=>proof(async f=>{
 await f.admin.query("insert into public.rows values(999,'AFTER_SNAPSHOT');update public.rows set body='CHANGED_AFTER_SNAPSHOT' where id=1;select nextval('public.rows_id_seq');select lo_put(42000,0,decode('aabbccdd','hex'))");
}));
test('sequence reset below start/owned-column floor refuses publication and cleans', {timeout:120000},()=>proof(async f=>{await f.admin.query("select setval('public.rows_id_seq',2,true)");},{expectedFailure:'sequences'}));
test('queued relation DDL causes bounded dump STOP; no blind retry', {timeout:120000},()=>proof(async(f,waits)=>{
 const c=await f.connect();const waiting=c.query('alter table public.rows add column after_snapshot int');waits.push(waiting);
 for(let n=0;;n++){const q=await f.admin.query("select count(*) n from pg_stat_activity where wait_event_type='Lock' and query like 'alter table public.rows%'");if(q.rows[0].n==='1')break;if(n>100)throw Error('DDL did not block');await new Promise(r=>setTimeout(r,10));}
},{expectedFailure:'dump'}));
test('schema ABA changes tuple identity and refuses even after body reset', {timeout:120000},()=>proof(async f=>{
 await f.admin.query('create or replace function public.fixture_fn() returns int language sql immutable as $$select 2$$;create or replace function public.fixture_fn() returns int language sql immutable as $$select 1$$;');
},{expectedFailure:'consistency'}));
const roleABA=async()=>{};roleABA.roles=true;
test('role archive read during attribute change is rejected after role reset: actual restore differs from snapshot', {timeout:120000},()=>proof(roleABA,{expectedFailure:'roles'}));

test('concurrent enum schema change refuses publication and cleans', {timeout:120000},()=>proof(async f=>{await f.admin.query("alter type public.backup_state add value 'changed'");},{expectedFailure:'consistency'}));

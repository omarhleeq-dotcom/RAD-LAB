// S4 scheduled backup. No connection/secret read by default. The job receives only
// an age PUBLIC recipient; private identities never enter this process or image.
import { execFileSync, execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { createReadStream, readFileSync, writeFileSync, mkdtempSync, mkdirSync, rmSync, statSync, statfsSync, fstatSync, openSync, closeSync, constants } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { randomUUID } from 'node:crypto';
import pg from 'pg';
import { AGE_RECIPIENT, quoteIdent, stamp, sha256File } from './laptop-backup-lib.mjs';
import { sizeSignal } from '../assess/selfservice-ops-plan.mjs';
import { readInventory,sha,dataRelations,qualified,literal,assertReader,fence,roleMetadata,rolesSql } from './cloud-backup-contract.mjs';
import { prepareRolesSql } from './laptop-restore-test.mjs';
const asyncExec=promisify(execFile);
// Role probe is a separate, private, socket-only PostgreSQL cluster in memory.
// Its local bootstrap never connects to the source. No decryption key is needed.
async function proveRoles(expected,file,dir,env,run,runAsync){
 const name=expected.bootstrap;if(typeof name!=='string'||!/^[A-Za-z_][A-Za-z0-9_]{0,62}$/.test(name)||!expected.roles.some(r=>r.rolname===name&&r.rolsuper))throw Error();
 const probe=join(dir,'role-probe'),data=join(probe,'data');let started=false;
 const local={...env,PGHOST:probe,PGPORT:'5432',PGUSER:name,PGDATABASE:'postgres',PGSSLMODE:'verify-full'};
 try{
  mkdirSync(probe,{mode:0o700});
  await runAsync('initdb',['-D',data,'-U',name,'--auth-local=trust','--auth-host=reject','--no-locale','--encoding=UTF8','--wal-segsize=1'],{env:local,timeout:60000,maxBuffer:1048576});
  run('pg_ctl',['-D',data,'-l',join(probe,'server.log'),'-o',`-c listen_addresses='' -c shared_buffers=4MB -c max_connections=10 -c max_wal_size=32MB -c min_wal_size=2MB -c TimeZone=UTC -k ${probe}`,'-w','start'],{env:local,stdio:'pipe',timeout:60000});started=true;
  await runAsync('psql',['-X','-q','-v','ON_ERROR_STOP=1','-d','postgres','-f',file+'.checked'],{env:local,timeout:60000,maxBuffer:1048576});
  const result=run('psql',['-X','-q','-At','--host',probe,'--port','5432','--username',name,'--dbname','postgres','-v','ON_ERROR_STOP=1','-c',rolesSql.replaceAll('$1',literal(''))],{env:local,stdio:'pipe',timeout:30000});
  if(sha(JSON.parse(String(result).trim()))!==sha(expected))throw Error();
 }finally{
  if(started)run('pg_ctl',['-D',data,'-m','immediate','-w','stop'],{env:local,stdio:'pipe',timeout:30000});
  rmSync(probe,{recursive:true,force:true});
 }
}
export function sequenceValues(sql){
 const entries=[];
 for(const line of sql.split('\n'))if(line.startsWith('SELECT pg_catalog.setval(')){
  const m=/^SELECT pg_catalog\.setval\('((?:[^']|'')*)', (-?[0-9]+), (true|false)\);$/.exec(line);if(!m)throw Error('sequence_archive');
  entries.push({name:m[1].replaceAll("''","'"),last_value:m[2],is_called:m[3]==='true'});
 }
 return entries;
}
export async function backupArchive(c,db,{run=execFileSync,runAsync=asyncExec,upload,root='/work',env,now=new Date()}={}) {
 let stage='config',dir;
 try{
  if(!c||!AGE_RECIPIENT.test(c.recipient)||!Number.isSafeInteger(c.planLimitBytes)||c.planLimitBytes<1||
   !/^[a-f0-9]{64}$/.test(c.inventorySha256)||!upload||!env)throw Error();
  dir=mkdtempSync(join(root,'assess-backup-'));
  stage='privileges';
  const initial=await readInventory(db);
  try{await assertReader(db,initial);}catch(error){if(['coverage','full_rows','large_objects'].includes(error.message))stage='snapshot';throw error;}
  stage='snapshot';if(sha(initial)!==c.inventorySha256)throw Error();
  const before=await fence(db);
  stage='snapshot';await db.query('begin isolation level repeatable read read only');
  await db.query("set local statement_timeout='120s';set local lock_timeout='5s';set local row_security=on;set local TimeZone='UTC'");
  const inventory=await readInventory(db);if(sha(inventory)!==c.inventorySha256||await fence(db)!==before)throw Error();
  // Hold ACCESS SHARE on every required data table: DML continues; conflicting
  // relation DDL waits or causes a bounded STOP. No table/admin write privilege.
  for(const r of dataRelations(inventory).filter(r=>r.k!=='S'))await db.query(`lock table ${qualified(r)} in access share mode`);
  const roles=await roleMetadata(db),counts=[],sequences=[];
  for(const r of dataRelations(inventory)){
   const {s,t,k}=r,name=qualified(r);
   if(k==='S'){
    const spec=(await db.query(`select q.seqincrement::text,q.seqcycle,format('%I.%I',n.nspname,c.relname) name,
     dn.nspname ds,dc.relname dt,a.attname da from pg_sequence q join pg_class c on c.oid=q.seqrelid join pg_namespace n on n.oid=c.relnamespace
     left join pg_depend d on d.classid='pg_class'::regclass and d.objid=c.oid and d.refclassid='pg_class'::regclass and d.deptype in ('a','i')
     left join pg_class dc on dc.oid=d.refobjid left join pg_namespace dn on dn.oid=dc.relnamespace left join pg_attribute a on a.attrelid=dc.oid and a.attnum=d.refobjsubid where q.seqrelid=$1::regclass`,[name])).rows[0];
    if(!spec||BigInt(spec.seqincrement)<=0n||spec.seqcycle)throw Error();
    const state=(await db.query(`select last_value::text,is_called from ${name}`)).rows[0];
    let floor=null;if(spec.ds&&spec.dt&&spec.da)floor=(await db.query(`select max(${quoteIdent(spec.da)})::text n from ${quoteIdent(spec.ds)}.${quoteIdent(spec.dt)}`)).rows[0].n;
    sequences.push({s,t,k,name:spec.name,start:state,floor});continue;
   }
   counts.push({s,t,k,rows:(await db.query(`select count(*)::text n from ${name}`)).rows[0].n});
  }
  const largeObjects=[];for(const l of inventory.largeObjects){
   const r=(await db.query(`select octet_length(lo_get($1::oid))::text bytes,md5(lo_get($1::oid)) md5`,[l.id])).rows[0];largeObjects.push({...l,...r});
  }
  const {snapshot,version,bytes}=(await db.query("select pg_export_snapshot() snapshot,current_setting('server_version_num')::int version,pg_database_size(current_database())::text bytes")).rows[0];
  if(!/^[0-9A-F-]{8,40}$/.test(snapshot))throw Error();
  const major=Math.floor(version/10000),tool=String(run('pg_dump',['--version'],{env,stdio:'pipe'}));
  if(Number(/(\d+)\./.exec(tool)?.[1])!==major)throw Error();
  stage='dump';
  // Explicit RLS export is safe only after checking the exact true SELECT policy for EVERY protected table.
  await runAsync('pg_dump',['--format=custom','--create','--enable-row-security','--lock-wait-timeout=5s',`--snapshot=${snapshot}`,'--file',join(dir,'project.dump')],{env,timeout:3600000,maxBuffer:1048576});
  stage='sequences';
  const toc=String(run('pg_restore',['--list',join(dir,'project.dump')],{env,stdio:'pipe',maxBuffer:10485760}));
  // Every ordinary data table must actually appear in the native archive.
  // Unsupported/extension-owned omissions fail, even when the table is empty.
  for(const r of dataRelations(inventory).filter(r=>r.k==='r'))if(!toc.split('\n').some(l=>l.includes(' TABLE DATA '+r.s+' '+r.t+' ')))throw Error();
  if(inventory.largeObjects.length&&!/ (?:BLOBS|BLOB DATA) /.test(toc))throw Error();
  writeFileSync(join(dir,'sequence.list'),toc.split('\n').filter(l=>/^\d+; .* SEQUENCE SET /.test(l)).join('\n')+'\n',{mode:0o600});
  run('pg_restore',['--use-list',join(dir,'sequence.list'),'--file',join(dir,'sequence.sql'),join(dir,'project.dump')],{env,stdio:'pipe',timeout:60000});
  const values=sequenceValues(readFileSync(join(dir,'sequence.sql'),'utf8'));
  if(values.length!==sequences.length||new Set(values.map(v=>v.name)).size!==values.length)throw Error();
  for(const s of sequences){const value=values.find(v=>v.name===s.name);if(!value)throw Error();
   if(BigInt(value.last_value)<BigInt(s.start.last_value)||(s.start.is_called&&!value.is_called&&value.last_value===s.start.last_value)||
    (s.floor!==null&&(value.is_called?BigInt(value.last_value)<BigInt(s.floor):BigInt(value.last_value)<=BigInt(s.floor))))throw Error();
   s.archive={last_value:value.last_value,is_called:value.is_called};
  }
  stage='roles';
  await runAsync('pg_dumpall',['--roles-only','--no-role-passwords','--file',join(dir,'roles.sql')],{env,timeout:600000,maxBuffer:1048576});
  writeFileSync(join(dir,'roles.sql.checked'),prepareRolesSql(readFileSync(join(dir,'roles.sql'),'utf8')),{mode:0o600});
  await proveRoles(roles,join(dir,'roles.sql'),dir,env,run,runAsync);
  // Fresh READ COMMITTED catalogue check after native exports/probe. No blind
  // repair/retry: a changing schema/role envelope never publishes an archive.
  await db.query('commit');stage='consistency';
  if(await fence(db)!==before||sha(await readInventory(db))!==c.inventorySha256)throw Error();
  const signal=sizeSignal(Number(bytes),c.planLimitBytes);
  writeFileSync(join(dir,'metadata.json'),JSON.stringify({contract:'rad105-encrypted-backup/2',inventory,counts,sequences,largeObjects,roles,serverVersion:version,consistency:{rows:'exported-snapshot',sequences:'archive positions; ascending noncycling high-water and owned-column floor checked',roles:'actual native role SQL restored against snapshot metadata',catalogue:'stable bounded envelope; DDL/role drift STOP'},...signal})+'\n',{mode:0o600});
  const sums={};for(const f of ['project.dump','roles.sql','metadata.json'])sums[f]=await sha256File(join(dir,f));
  writeFileSync(join(dir,'checksums.json'),JSON.stringify(sums)+'\n',{mode:0o600});
  stage='encrypt';
  run('tar',['-C',dir,'-cf',join(dir,'bundle.tar'),'project.dump','roles.sql','metadata.json','checksums.json'],{stdio:'pipe',timeout:600000});
  run('age',['--recipient',c.recipient,'--output',join(dir,'backup.age'),join(dir,'bundle.tar')],{stdio:'pipe',timeout:600000});
  stage='upload';
  const file=join(dir,'backup.age'),sha256=await sha256File(file);
  await upload(file,`daily/${stamp(now)}-${randomUUID()}.tar.age`);
  return {contract:'rad105-encrypted-backup/2',outcome:'COMPLETE',coverage:'all-pinned-database-objects',providerRecoveryVerified:false,encryptedBytes:statSync(file).size,sha256,tables:counts.length,...signal};
 }catch{try{await db.query('rollback');}catch{/* no replay */}throw Error('backup_'+stage);}
 finally{if(dir)rmSync(dir,{recursive:true,force:true});}
}
export async function main(args=process.argv.slice(2)) {
 if(args.length===0)return {contract:'rad105-encrypted-backup/2',dryRun:true,connections:0,uploads:0};
 if(args.length!==1||args[0]!=='--run')throw Error('arguments');
 // Runtime only: fixed Secret Manager mount, O_NOFOLLOW; no URL/env/argv credential fallback.
 const path='/run/secrets/assess-backup.json',fd=openSync(path,constants.O_RDONLY|constants.O_NOFOLLOW);let c;
 try{const stat=fstatSync(fd);if(!stat.isFile()||stat.size<1||stat.size>65536)throw Error();c=JSON.parse(readFileSync(fd,'utf8'));}finally{closeSync(fd);}
 const keys=['bucket','ca','database','host','inventorySha256','password','planLimitBytes','port','recipient','user'];
 if(!c||Object.keys(c).sort().join()!==keys.sort().join()||c.user!=='assess_backup'||c.database!=='postgres'||c.port!==5432||
  c.host!=='db.vlacestfruxooznrcjqc.supabase.co'||typeof c.password!=='string'||!c.password||/[\r\n]/.test(c.password)||!c.ca?.includes('-----BEGIN CERTIFICATE-----')||
  !/^[a-z0-9][a-z0-9-]{1,61}[a-z0-9]$/.test(c.bucket)||statfsSync('/work').type!==0x01021994)throw Error('configuration');
 const env={...process.env};for(const key of Object.keys(env))if(key.startsWith('PG'))delete env[key];
 const dir=mkdtempSync('/work/credentials-');let db;
 try{
  const ca=join(dir,'ca.crt'),pass=join(dir,'pgpass');writeFileSync(ca,c.ca,{mode:0o600});
  writeFileSync(pass,`${c.host}:5432:postgres:assess_backup:${c.password.replaceAll('\\','\\\\').replaceAll(':','\\:')}\n`,{mode:0o600});
  Object.assign(env,{PGHOST:c.host,PGPORT:'5432',PGDATABASE:'postgres',PGUSER:'assess_backup',PGSSLMODE:'verify-full',PGSSLROOTCERT:ca,PGPASSFILE:pass,PGOPTIONS:'-c search_path= -c TimeZone=UTC'});
  db=new pg.Client({host:c.host,port:5432,database:'postgres',user:'assess_backup',password:c.password,ssl:{ca:c.ca,rejectUnauthorized:true},options:'-c search_path= -c TimeZone=UTC',connectionTimeoutMillis:15000});
  await db.connect();
  return await backupArchive(c,db,{env,upload:async(file,name)=>{
   const token=await fetch('http://metadata.google.internal/computeMetadata/v1/instance/service-accounts/default/token',{headers:{'Metadata-Flavor':'Google'}});
   if(!token.ok)throw Error();const {access_token}=await token.json();
   const response=await fetch(`https://storage.googleapis.com/upload/storage/v1/b/${c.bucket}/o?uploadType=media&name=${encodeURIComponent(name)}&ifGenerationMatch=0`,{
    method:'POST',headers:{authorization:'Bearer '+access_token,'content-type':'application/octet-stream','content-length':String(statSync(file).size)},body:createReadStream(file),duplex:'half'});
   if(!response.ok)throw Error();
  }});
 }finally{if(db)await db.end();rmSync(dir,{recursive:true,force:true});}
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href)main().then(x=>process.stdout.write(JSON.stringify(x)+'\n')).catch(()=>{process.stdout.write('{"contract":"rad105-encrypted-backup/2","outcome":"STOP"}\n');process.exitCode=1;});

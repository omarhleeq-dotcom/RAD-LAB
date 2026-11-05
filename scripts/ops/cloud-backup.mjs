// S4 scheduled backup. No connection/secret read by default. The job receives only
// an age PUBLIC recipient; private identities never enter this process or image.
import { execFileSync, execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { createReadStream, readFileSync, writeFileSync, mkdtempSync, rmSync, statSync, statfsSync, fstatSync, openSync, closeSync, constants } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { randomUUID, createHash } from 'node:crypto';
import pg from 'pg';
import { AGE_RECIPIENT, quoteIdent, stamp, sha256File } from './laptop-backup-lib.mjs';
import { sizeSignal } from '../assess/selfservice-ops-plan.mjs';
const asyncExec=promisify(execFile);
const inventorySql=`select n.nspname s,c.relname t,c.relkind k,c.relrowsecurity r from pg_class c join pg_namespace n on n.oid=c.relnamespace
 where n.nspname not in ('pg_catalog','information_schema') and n.nspname !~ '^pg_toast' and c.relkind in ('r','p','S') order by 1,2`;
const digest=value=>createHash('sha256').update(JSON.stringify(value)).digest('hex');
export async function backupArchive(c,db,{run=execFileSync,runAsync=asyncExec,upload,root='/work',env,now=new Date()}={}) {
 let stage='config',dir;
 try{
  if(!c||!AGE_RECIPIENT.test(c.recipient)||!Number.isSafeInteger(c.planLimitBytes)||c.planLimitBytes<1||
   !/^[a-f0-9]{64}$/.test(c.inventorySha256)||!upload||!env)throw Error();
  dir=mkdtempSync(join(root,'assess-backup-'));
  stage='privileges';
  const role=(await db.query(`select current_user u,session_user s,rolsuper,rolinherit,rolcreatedb,rolcreaterole,rolreplication,rolbypassrls,
   exists(select 1 from pg_auth_members where member=r.oid) member from pg_roles r where rolname=current_user`)).rows[0];
  if(role.u!=='assess_backup'||role.s!==role.u||Object.entries(role).some(([k,v])=>!['u','s'].includes(k)&&v!==false))throw Error();
  const bad=(await db.query(`select exists(select 1 from pg_class c join pg_namespace n on n.oid=c.relnamespace where
   n.nspname not in ('pg_catalog','information_schema') and n.nspname !~ '^pg_toast' and c.relkind in ('r','p','v','m','f') and
   has_table_privilege(current_user,c.oid,'INSERT,UPDATE,DELETE,TRUNCATE,REFERENCES,TRIGGER')) or
   has_database_privilege(current_user,current_database(),'CREATE,TEMP') or exists(select 1 from pg_namespace where
   nspname not like 'pg_%' and nspname<>'information_schema' and has_schema_privilege(current_user,oid,'CREATE')) bad`)).rows[0].bad;
  if(bad)throw Error();
  stage='snapshot';await db.query('begin isolation level repeatable read read only');
  await db.query("set local statement_timeout='120s';set local lock_timeout='5s';set local row_security=on");
  const inventory=(await db.query(inventorySql)).rows;
  if(!inventory.length||digest(inventory)!==c.inventorySha256)throw Error();
  const counts=[];
  for(const {s,t,k,r}of inventory){
   const name=quoteIdent(s)+'.'+quoteIdent(t);
   if(k==='S'){
    // SELECT only (no USAGE/UPDATE/nextval). Sequence state is non-MVCC: no concurrent schema/sequence changes permitted in restore proof.
    counts.push({s,t,k,state:(await db.query(`select last_value::text,is_called from ${name}`)).rows[0]});continue;
   }
   if(r){
    const policies=(await db.query(`select p.polpermissive,p.polcmd,p.polroles::text,pg_get_expr(p.polqual,p.polrelid) q,
     (select oid from pg_roles where rolname=current_user)::text role, (p.polroles && array[0::oid,(select oid from pg_roles where rolname=current_user)]) applies from pg_policy p where p.polrelid=$1::regclass`,[name])).rows;
    if(!policies.some(p=>p.polpermissive&&p.polcmd==='r'&&p.polroles==='{'+p.role+'}'&&p.q==='true')||
     policies.some(p=>!p.polpermissive&&p.applies&&['r','*'].includes(p.polcmd)))throw Error();
   }
   counts.push({s,t,k,rows:(await db.query(`select count(*)::text n from ${name}`)).rows[0].n});
  }
  const {snapshot,version,bytes}=(await db.query("select pg_export_snapshot() snapshot,current_setting('server_version_num')::int version,pg_database_size(current_database())::text bytes")).rows[0];
  if(!/^[0-9A-F-]{8,40}$/.test(snapshot))throw Error();
  const major=Math.floor(version/10000),tool=String(run('pg_dump',['--version'],{env,stdio:'pipe'}));
  if(Number(/(\d+)\./.exec(tool)?.[1])!==major)throw Error();
  stage='dump';
  // Explicit RLS export is safe only after checking the exact true SELECT policy for EVERY protected table.
  await runAsync('pg_dump',['--format=custom','--enable-row-security',`--snapshot=${snapshot}`,'--file',join(dir,'project.dump')],{env,timeout:3600000,maxBuffer:1048576});
  await db.query('commit');
  stage='roles';run('pg_dumpall',['--roles-only','--no-role-passwords','--file',join(dir,'roles.sql')],{env,stdio:'pipe',timeout:600000});
  const signal=sizeSignal(Number(bytes),c.planLimitBytes);
  writeFileSync(join(dir,'metadata.json'),JSON.stringify({contract:'rad105-encrypted-backup/1',inventory,counts,serverVersion:version,...signal})+'\n',{mode:0o600});
  const sums={};for(const f of ['project.dump','roles.sql','metadata.json'])sums[f]=await sha256File(join(dir,f));
  writeFileSync(join(dir,'checksums.json'),JSON.stringify(sums)+'\n',{mode:0o600});
  stage='encrypt';
  run('tar',['-C',dir,'-cf',join(dir,'bundle.tar'),'project.dump','roles.sql','metadata.json','checksums.json'],{stdio:'pipe',timeout:600000});
  run('age',['--recipient',c.recipient,'--output',join(dir,'backup.age'),join(dir,'bundle.tar')],{stdio:'pipe',timeout:600000});
  stage='upload';
  const file=join(dir,'backup.age'),sha256=await sha256File(file);
  await upload(file,`daily/${stamp(now)}-${randomUUID()}.tar.age`);
  return {contract:'rad105-encrypted-backup/1',outcome:'COMPLETE',encryptedBytes:statSync(file).size,sha256,tables:counts.filter(x=>x.k!=='S').length,...signal};
 }catch{try{await db.query('rollback');}catch{/* no replay */}throw Error('backup_'+stage);}
 finally{if(dir)rmSync(dir,{recursive:true,force:true});}
}
export async function main(args=process.argv.slice(2)) {
 if(args.length===0)return {contract:'rad105-encrypted-backup/1',dryRun:true,connections:0,uploads:0};
 if(args.length!==1||args[0]!=='--run')throw Error('arguments');
 // Runtime only: fixed Secret Manager mount, O_NOFOLLOW; no URL/env/argv credential fallback.
 const path='/run/secrets/assess-backup.json',fd=openSync(path,constants.O_RDONLY|constants.O_NOFOLLOW);let c;
 try{if(fstatSync(fd).size>65536)throw Error();c=JSON.parse(readFileSync(fd,'utf8'));}finally{closeSync(fd);}
 const keys=['bucket','ca','database','host','inventorySha256','password','planLimitBytes','port','recipient','user'];
 if(!c||Object.keys(c).sort().join()!==keys.sort().join()||c.user!=='assess_backup'||c.database!=='postgres'||c.port!==5432||
  c.host!=='db.vlacestfruxooznrcjqc.supabase.co'||typeof c.password!=='string'||!c.password||/[\r\n]/.test(c.password)||!c.ca?.includes('-----BEGIN CERTIFICATE-----')||
  !/^[a-z0-9][a-z0-9-]{1,61}[a-z0-9]$/.test(c.bucket)||statfsSync('/work').type!==0x01021994)throw Error('configuration');
 const env={...process.env};for(const key of Object.keys(env))if(key.startsWith('PG'))delete env[key];
 const dir=mkdtempSync('/work/credentials-');let db;
 try{
  const ca=join(dir,'ca.crt'),pass=join(dir,'pgpass');writeFileSync(ca,c.ca,{mode:0o600});
  writeFileSync(pass,`${c.host}:5432:postgres:assess_backup:${c.password.replaceAll('\\','\\\\').replaceAll(':','\\:')}\n`,{mode:0o600});
  Object.assign(env,{PGHOST:c.host,PGPORT:'5432',PGDATABASE:'postgres',PGUSER:'assess_backup',PGSSLMODE:'verify-full',PGSSLROOTCERT:ca,PGPASSFILE:pass});
  db=new pg.Client({host:c.host,port:5432,database:'postgres',user:'assess_backup',password:c.password,ssl:{ca:c.ca,rejectUnauthorized:true},connectionTimeoutMillis:15000});
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
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href)main().then(x=>process.stdout.write(JSON.stringify(x)+'\n')).catch(()=>{process.stdout.write('{"contract":"rad105-encrypted-backup/1","outcome":"STOP"}\n');process.exitCode=1;});

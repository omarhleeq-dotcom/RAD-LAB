// Required actual backup image. Synthetic production catalogue and private fake
// metadata/GCS only; no provider, published port, real secret or private age key.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { readFileSync,writeFileSync,rmSync,mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { productionFixture } from './cloud-backup-fixture.mjs';
import { readInventory,grantPacket,sha,literal,qualified,roleMetadata } from '../ops/cloud-backup-contract.mjs';
import { prepareRolesSql } from '../ops/laptop-restore-test.mjs';
import { restorePlan,tocEntries } from '../ops/restore-event-triggers.mjs';
const read=p=>readFileSync(p,'utf8');
const id=n=>'00000000-0000-0000-0000-'+String(n).padStart(12,'0');
test('pinned production backup image: least privilege, actual RLS dump/TLS/restore/upload failure and cleanup', {timeout:840000},async()=>{
 const f=await productionFixture(),{docker,su,owner,root,prefix,owned,volumes,images}=f;
 const contexts=[];let proof;
 const db={query:async(sql,values=[])=>{
  if(/^set /i.test(sql))return{rows:[]};
  const statement=sql.replace(/\$(\d+)/g,(_,n)=>values[Number(n)-1]===null?'null':literal(values[Number(n)-1]));
  return{rows:await f.query(statement)};
 }};
 try{
  const before=await readInventory(db);
  console.log('BACKUP_INVENTORY_CALIBRATION '+JSON.stringify(before));
  // The same compiler emits the committed packet; pending first calibration is
  // a final assertion failure, never a skipped coverage/permission proof.
  const packet=grantPacket(before);
  assert.ok(owner("set radlab.expected_gate='closed';"+read('supabase/checks/selfservice-s4-rad085-review-ready.sql')).split('\n').every(s=>s.endsWith('|t')));
  const oldPolicies=su("select md5(coalesce(jsonb_agg(to_jsonb(p) order by oid)::text,'[]')) from pg_policy p");
  su(packet);assert.equal(su("select count(*) from pg_roles where rolname='assess_backup'"),'0');
  su("set radlab.backup_apply='reviewed-select-only';"+packet);
  assert.equal(su("select md5(coalesce(jsonb_agg(to_jsonb(p) order by oid)::text,'[]')) from pg_policy p where polname<>'assess_backup_read_v1'"),oldPolicies);
  assert.equal(sha(await readInventory(db)),sha(before));
  const post=owner("set radlab.expected_gate='closed';"+read('supabase/checks/selfservice-s4-rad085-review-ready.sql'));
  console.log('BACKUP_CORE_FINGERPRINT_CALIBRATION '+post.replaceAll('\n',';'));
  // Actual provider-owned rows. No real participant, exam or provider setting.
  su(`insert into auth.users(id,email,raw_user_meta_data) values('${id(1)}','backup@example.test','{"display_name":"SYNTHETIC Backup Account"}');
   insert into auth.audit_log_entries(id,payload) values('${id(2)}','{"synthetic":true}');
   insert into auth.refresh_tokens(id,token,user_id) values(41,'SYNTHETIC_TOKEN','${id(1)}');select setval('auth.refresh_tokens_id_seq',50,true);
   insert into storage.buckets(id,name) values('synthetic-backup','synthetic-backup');
   select vault.create_secret('SYNTHETIC_VAULT_VALUE','synthetic-backup-key','Synthetic fixture only');`);
  // Drift: the committed base pin must reject a newly created required LOB.
  su("select lo_from_bytea(42000,decode('000102feff','hex'))");
  assert.throws(()=>su("set radlab.backup_apply='reviewed-select-only';"+packet));
  const withLob=await readInventory(db);
  su("set radlab.backup_apply='reviewed-select-only';"+grantPacket(withLob));
  const password='SYNTHETIC_BACKUP_ONLY_12345678901234567890';
  su(`set log_statement='none';set log_min_error_statement='panic';set password_encryption='scram-sha-256';alter role assess_backup login password ${literal(password)} valid until 'infinity';`);
  for(let i=0;i<2;i++)contexts.push(JSON.parse(execFileSync(process.execPath,['scripts/ops/build-cloud-backup.mjs'],{encoding:'utf8'})).output);
  assert.equal(read(join(contexts[0],'manifest.json')),read(join(contexts[1],'manifest.json')));
  const manifest=JSON.parse(read(join(contexts[0],'manifest.json')));
  assert.equal(manifest.privateKeyIncluded,false);assert.equal(manifest.defaultDryRun,true);
  const image=prefix+'-image:local';images.add(image);docker(['build','--network=none','-t',image,contexts[0]]);
  const info=JSON.parse(docker(['image','inspect',image]))[0];assert.equal(info.Config.User,'postgres');assert.deepEqual(info.Config.Entrypoint,['node','/app/backup-main.cjs']);
  const plain=prefix+'-dry';owned.add(plain);
  assert.deepEqual(JSON.parse(docker(['run','--name',plain,'--network=none','--read-only','--cap-drop=ALL',image])),{contract:'rad105-encrypted-backup/2',dryRun:true,connections:0,uploads:0});
  const secrets=prefix+'-config',mockVolume=prefix+'-mock';for(const v of [secrets,mockVolume]){docker(['volume','create',v]);volumes.add(v);}
  execFileSync('openssl',['req','-x509','-newkey','rsa:2048','-nodes','-days','1','-subj','/CN=storage.googleapis.com','-addext','subjectAltName=DNS:storage.googleapis.com','-keyout',join(root,'gcs.key'),'-out',join(root,'gcs.crt')],{stdio:'pipe'});
  const config={host:f.host,port:5432,database:'postgres',user:'assess_backup',password,ca:f.ca,bucket:'synthetic-backup-bucket',recipient:'',inventorySha256:sha(withLob),planLimitBytes:500000000};
  // Owner identity remains on the host; only its public recipient enters the job.
  const identity=join(root,'owner-identity');writeFileSync(identity,execFileSync('age-keygen',[],{stdio:'pipe'}),{mode:0o600});config.recipient=execFileSync('age-keygen',['-y',identity],{encoding:'utf8'}).trim();
  let writes=0;
  const volumeWrite=(volume,files)=>{const name=prefix+'-init-'+(++writes);owned.add(name);docker(['run','-i','--name',name,'--network=none','--read-only','--user=0:0','--cap-drop=ALL','--cap-add=CHOWN','--mount',`type=volume,src=${volume},dst=/v`,'--entrypoint=node',image,'-e',
   "const fs=require('fs');let s='';process.stdin.on('data',b=>s+=b);process.stdin.on('end',()=>{const files=JSON.parse(s);fs.chmodSync('/v',0o700);for(const[k,v]of Object.entries(files)){fs.writeFileSync('/v/'+k,v,{mode:0o600});fs.chownSync('/v/'+k,999,999);}fs.chownSync('/v',999,999);});"],JSON.stringify(files));};
  const setConfig=c=>volumeWrite(secrets,{'assess-backup.json':JSON.stringify(c),'storage-ca.pem':read(join(root,'gcs.crt'))});setConfig(config);
  volumeWrite(mockVolume,{'gcs.key':read(join(root,'gcs.key')),'gcs.crt':read(join(root,'gcs.crt'))});
  const mock=prefix+'-metadata';owned.add(mock);
  const source=`const fs=require('fs'),http=require('http'),https=require('https');let fail=false,attempts=0;const serve=(q,r)=>{
   if(q.url==='/state'){if(q.method==='POST'){fail=true;try{fs.unlinkSync('/v/backup.age')}catch{}}r.end(JSON.stringify({fail,attempts}));return;}
   if(q.url.startsWith('/computeMetadata/v1/')){if(q.headers['metadata-flavor']!=='Google'){r.writeHead(403);r.end();return;}r.end(JSON.stringify({access_token:'SYNTHETIC_TOKEN'}));return;}
   if(q.headers.authorization!=='Bearer SYNTHETIC_TOKEN'||!q.url.includes('ifGenerationMatch=0')){r.writeHead(403);r.end();return;}
   attempts++;if(fail){q.resume();r.writeHead(503);r.end();return;}const chunks=[];q.on('data',b=>chunks.push(b));q.on('end',()=>{fs.writeFileSync('/v/backup.age',Buffer.concat(chunks),{mode:0o600});r.end('{}');});};
   http.createServer(serve).listen(80);https.createServer({key:fs.readFileSync('/v/gcs.key'),cert:fs.readFileSync('/v/gcs.crt')},serve).listen(443);`;
  docker(['run','-d','--name',mock,'--network',f.network,'--network-alias','metadata.google.internal','--network-alias','storage.googleapis.com','--read-only','--cap-drop=ALL','--cap-add=NET_BIND_SERVICE','--mount',`type=volume,src=${mockVolume},dst=/v`,'--entrypoint=node',image,'-e',source]);
  for(let n=0;;n++){try{docker(['exec',mock,'node','-e',"fetch('http://127.0.0.1/state').then(r=>{if(!r.ok)process.exit(1)}).catch(()=>process.exit(1))"]);break;}catch{if(n>=100)throw Error('mock startup');await new Promise(r=>setTimeout(r,25));}}
  let runs=0;
  const run=(extra=[],entry)=>{const name=prefix+'-job-'+(++runs);owned.add(name);const args=['run','--name',name,'--network',f.network,'--read-only','--cap-drop=ALL','--security-opt=no-new-privileges','--memory=1g','--cpus=1','--pids-limit=128','--tmpfs','/work:rw,noexec,nosuid,nodev,uid=999,gid=999,mode=0700,size=512m','--mount',`type=volume,src=${secrets},dst=/run/secrets,readonly`,'-e','NODE_EXTRA_CA_CERTS=/run/secrets/storage-ca.pem',...extra];if(entry)args.push('--entrypoint=node');args.push(image,...(entry?['-e',entry]:['--run']));
   let output,status=0;try{output=docker(args);}catch(e){status=e.status;output=String(e.stdout??'');}assert.ok(!output.includes(password));return{status,output,report:JSON.parse(output.trim().split('\n').at(-1))};};
  const inspect=`const fs=require('fs');console.log(JSON.stringify({uid:process.getuid(),type:fs.statfsSync('/work').type,mode:fs.statSync('/work').mode&511,files:fs.readdirSync('/app').sort(),mounts:fs.readdirSync('/run/secrets').sort()}));`;
  const shape=run([],inspect).report;assert.equal(shape.uid,999);assert.equal(shape.type,0x01021994);assert.equal(shape.mode,0o700);assert.deepEqual(shape.mounts,['assess-backup.json','storage-ca.pem']);assert.deepEqual(shape.files,['backup-main.cjs','backup.cjs','manifest.json']);
  // Negative privileges through the actual image, fixed secret binding and verified TLS.
  const negative=`const fs=require('fs'),cp=require('child_process');const c=JSON.parse(fs.readFileSync('/run/secrets/assess-backup.json','utf8'));
   const escape=x=>String(x).split(String.fromCharCode(92)).join(String.fromCharCode(92,92)).split(':').join(String.fromCharCode(92)+':');
   fs.writeFileSync('/work/ca',c.ca,{mode:0o600});fs.writeFileSync('/work/pass',[c.host,c.port,c.database,c.user,c.password].map(escape).join(':')+String.fromCharCode(10),{mode:0o600});
   const env={...process.env,PGHOST:c.host,PGPORT:String(c.port),PGDATABASE:c.database,PGUSER:c.user,PGSSLMODE:'verify-full',PGSSLROOTCERT:'/work/ca',PGPASSFILE:'/work/pass'};
   const queries=["set role postgres","set role supabase_admin","select assess.worker_health_v2()","select * from vault.decrypted_secrets","insert into storage.buckets(id,name) values('bad','bad')","select nextval('auth.refresh_tokens_id_seq')","select setval('auth.refresh_tokens_id_seq',1)","select lo_put(42000,0,decode('ff','hex'))"];
   try{for(const q of queries){const r=cp.spawnSync('psql',['-X','-q','-v','ON_ERROR_STOP=1','-v','VERBOSITY=verbose','-c',q],{env,encoding:'utf8'});if(r.status===0||!r.stderr.includes('42501'))throw Error('negative privilege failed');}console.log(JSON.stringify({denied:queries.length}));}finally{fs.rmSync('/work/ca',{force:true});fs.rmSync('/work/pass',{force:true});}`;
  assert.equal(run([],negative).report.denied,8);
  const successful=run();assert.equal(successful.status,0);assert.equal(successful.report.outcome,'COMPLETE',successful.output);assert.equal(successful.report.providerRecoveryVerified,false);
  assert.equal(su("select count(*) from pg_stat_activity where usename='assess_backup'"),'0');
  const b64=docker(['exec',mock,'node','-e',"process.stdout.write(require('fs').readFileSync('/v/backup.age').toString('base64'))"]);writeFileSync(join(root,'backup.age'),Buffer.from(b64,'base64'));
  execFileSync('age',['--decrypt','--identity',identity,'--output',join(root,'bundle.tar'),join(root,'backup.age')],{stdio:'pipe'});mkdirSync(join(root,'restore'));execFileSync('tar',['-C',join(root,'restore'),'-xf',join(root,'bundle.tar')]);
  const archive=join(root,'restore','project.dump'),metadata=JSON.parse(read(join(root,'restore','metadata.json'))),sums=JSON.parse(read(join(root,'restore','checksums.json')));
  for(const[file,hash]of Object.entries(sums))assert.equal(createHash('sha256').update(readFileSync(join(root,'restore',file))).digest('hex'),hash);
  // Fresh pinned provider cluster; reuse RAD-086's exact event-trigger two-pass plan.
  const target=prefix+'-restore';owned.add(target);
  const {containerArgs}=await import('../ops/laptop-restore-test.mjs');docker(containerArgs(target,{datlocprovider:'i',datlocale:'en-US',datcollate:'en_US.UTF-8',datctype:'en_US.UTF-8'}));
  for(let n=0;;n++){try{if(docker(['logs',target]).includes('PostgreSQL init process complete; ready for start up.')){docker(['exec',target,'pg_isready','-U','supabase_admin']);break;}}catch{/* bounded startup */}if(n>=90)throw Error('restore startup');await new Promise(r=>setTimeout(r,1000));}
  const targetSql=(sql,database='postgres')=>docker(['exec','-i',target,'psql','-X','-q','-At','-v','ON_ERROR_STOP=1','-U','supabase_admin','-d',database,'-f','-'],sql).trim();
  targetSql(prepareRolesSql(read(join(root,'restore','roles.sql'))));
  targetSql('drop database postgres with (force);','template1');
  const toc=docker(['exec','-i',target,'pg_restore','--list'],readFileSync(archive));
  const roleFlags=new Map(JSON.parse(targetSql("select json_agg(json_build_array(rolname,rolsuper)) from pg_roles")));
  const plan=restorePlan(toc,roleFlags);assert.equal(plan.count,tocEntries(toc).length);
  const list=join(root,'first.list');writeFileSync(list,plan.first);docker(['cp',list,target+':/tmp/first.list']);
  docker(['exec','-i',target,'pg_restore','--exit-on-error','--create','--use-list=/tmp/first.list','-U','supabase_admin','--dbname=template1'],readFileSync(archive));
  for(const e of plan.second){writeFileSync(list,e.line);docker(['cp',list,target+':/tmp/one.list']);const sql=docker(['exec','-i',target,'pg_restore','--use-list=/tmp/one.list','--file=-'],readFileSync(archive));targetSql('set role '+e.owner+';'+sql,'postgres');}
  for(const r of metadata.counts)assert.equal(targetSql(`select count(*) from ${qualified(r)}`,'postgres'),r.rows);
  for(const s of metadata.sequences)assert.equal(targetSql(`select last_value::text||'|'||is_called from ${qualified(s)}`,'postgres'),s.archive.last_value+'|'+(s.archive.is_called?'true':'false'));
  for(const l of metadata.largeObjects)assert.equal(targetSql(`select octet_length(lo_get(${l.id}))::text||'|'||md5(lo_get(${l.id}))`,'postgres'),l.bytes+'|'+l.md5);
  assert.equal(targetSql("select count(*) from auth.users",'postgres'),'1');assert.equal(targetSql("select count(*) from vault.secrets",'postgres'),'1');
  // These are ciphertext bytes; no Vault decrypt function or age identity in job.
  assert.equal(targetSql("select md5(secret) from vault.secrets",'postgres'),su('select md5(secret) from vault.secrets'));
  const restoredAdapter={query:async(sql,values=[])=>{if(/^set /i.test(sql))return{rows:[]};return{rows:JSON.parse(targetSql("set search_path='';set TimeZone='UTC';select coalesce(jsonb_agg(q),'[]') from ("+sql.replace(/\$(\d+)/g,(_,n)=>literal(values[Number(n)-1]))+") q",'postgres'))};}};
  assert.equal(sha(await readInventory(restoredAdapter)),sha(withLob));
  assert.deepEqual(await roleMetadata(restoredAdapter),metadata.roles);
  setConfig({...config,ca:read(join(root,'gcs.crt'))});const tls=run();assert.notEqual(tls.status,0);assert.equal(tls.report.outcome,'STOP');setConfig(config);
  docker(['exec',mock,'node','-e',"fetch('http://127.0.0.1/state',{method:'POST'}).then(r=>{if(!r.ok)process.exit(1)})"]);
  const failed=run();assert.notEqual(failed.status,0);assert.equal(failed.report.outcome,'STOP');assert.equal(su("select count(*) from pg_stat_activity where usename='assess_backup'"),'0');
  assert.throws(()=>docker(['exec',mock,'node','-e',"require('fs').statSync('/v/backup.age')"]));
  // Last assertion gates candidate calibration; no proof above can be skipped.
  assert.deepEqual(JSON.parse(read('supabase/manual/selfservice-backup-read.inventory.json')),before,'independent inventory calibration must be recorded');
  assert.equal(read('supabase/manual/selfservice-backup-read.sql'),packet,'committed packet must be compiler-identical');
  proof={contract:'rad105-backup-image-rehearsal/2',outcome:'PASS',imageId:info.Id,inventorySha256:sha(before),tables:metadata.counts.length,providerEvidence:false};
 }finally{
  for(const c of contexts)rmSync(c,{recursive:true,force:true});await f.close();
 }
 console.log(JSON.stringify({...proof,cleanup:true}));
});

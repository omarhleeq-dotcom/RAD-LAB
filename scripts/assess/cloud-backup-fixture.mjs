// Synthetic, socket-only native fixture. Never accepts a provider/URL selector.
import { execFileSync } from 'node:child_process';
import { mkdtempSync,readdirSync,existsSync,rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import pg from 'pg';
export async function nativeFixture(){
 const root=mkdtempSync(join(tmpdir(),'rad105-backup-contract-'));
 const bin=process.env.RAD105_TEST_PG_BIN??readdirSync('/usr/lib/postgresql').sort().map(v=>`/usr/lib/postgresql/${v}/bin`).find(b=>existsSync(b+'/initdb'));
 if(!bin)throw Error('required PostgreSQL tools');
 const as=process.getuid()===0?['runuser','-u','postgres','--']:[];
 const run=(program,args)=>execFileSync(as[0]??program,as.length?[...as.slice(1),program,...args]:args,{stdio:'pipe'});
 if(as.length)execFileSync('chown',['postgres',root]);
 run(bin+'/initdb',['-D',root+'/db','-A','trust','-U','postgres','--no-locale','--encoding=UTF8']);
 run(bin+'/pg_ctl',['-D',root+'/db','-l',root+'/server.log','-o',`-F -c listen_addresses='' -k ${root}`,'-w','start']);
 const clients=[];
 const connect=async(user='postgres')=>{const c=new pg.Client({host:root,user,database:'postgres',options:'-c TimeZone=UTC'});await c.connect();clients.push(c);return c;};
 const admin=await connect();
 return{root,bin,admin,connect,env:{...process.env,PATH:bin+':'+process.env.PATH,PGHOST:root,PGUSER:'assess_backup',PGDATABASE:'postgres',PGSSLMODE:'disable',PGOPTIONS:'-c TimeZone=UTC'},
 async close(){await Promise.allSettled(clients.map(c=>c.end()));run(bin+'/pg_ctl',['-D',root+'/db','-m','immediate','-w','stop']);rmSync(root,{recursive:true,force:true});}};
}

export async function readerFixture(){
 const f=await nativeFixture();
 const {readInventory,grantPacket,sha}=await import('../ops/cloud-backup-contract.mjs');
 await f.admin.query(`create schema assess;create table assess.launch_gate(enabled boolean);insert into assess.launch_gate values(false);
  revoke create on schema public from public;revoke temporary on database postgres from public;
  create role provider_owner nologin;create type public.backup_state as enum ('ready');
  create table public.rows(id bigserial primary key,body text);insert into public.rows(body) select 'SYNTHETIC_'||n from generate_series(1,10) n;
  alter table public.rows owner to provider_owner;alter table public.rows enable row level security;alter table public.rows force row level security;
  select setval('public.rows_id_seq',100,true);select lo_from_bytea(42000,decode('000102ff','hex'));
  create function public.fixture_fn() returns int language sql immutable as $$select 1$$;`);
 const inventory=await readInventory(f.admin);
 await f.admin.query("set radlab.backup_apply='reviewed-select-only'");await f.admin.query(grantPacket(inventory));
 await f.admin.query("alter role assess_backup login valid until 'infinity'");
 const reader=await f.connect('assess_backup');
 return{...f,reader,inventory,inventorySha256:sha(inventory)};
}

// Pinned, byte-exact no-data production fixture, same loader/initializers as W4.
// All names/volumes/networks below are owned by this rehearsal; never provider APIs.
export async function productionFixture(){
 const {randomBytes}=await import('node:crypto');
 const {readFileSync,mkdirSync,writeFileSync}=await import('node:fs');
 const {containerArgs,prepareRolesSql,IMAGE}=await import('../ops/laptop-restore-test.mjs');
 const prefix='rad105-backup-'+randomBytes(5).toString('hex'),root=mkdtempSync(join(tmpdir(),prefix+'-'));
 const env={...process.env,BUILDX_CONFIG:join(root,'buildx')};mkdirSync(env.BUILDX_CONFIG);
 for(const key of ['DOCKER_HOST','DOCKER_CONTEXT','DOCKER_TLS','DOCKER_TLS_VERIFY','DOCKER_CERT_PATH'])delete env[key];
 const docker=(args,input,timeout=240000)=>execFileSync('docker',['--host=unix:///var/run/docker.sock',...args],{env,input,stdio:'pipe',timeout,maxBuffer:64*1024*1024}).toString();
 const network=prefix+'-net',db=prefix+'-source',owned=new Set(),volumes=new Set(),images=new Set();let networkCreated=false;
 const read=p=>readFileSync(p,'utf8');
 const su=(sql,database='postgres')=>docker(['exec','-i',db,'psql','-X','-q','-At','-v','ON_ERROR_STOP=1','-U','supabase_admin','-d',database,'-f','-'],sql).trim();
 const owner=sql=>docker(['exec','-i',db,'psql','-X','-q','-At','-v','ON_ERROR_STOP=1','-h','127.0.0.1','-U','postgres','-d','postgres','-f','-'],sql).trim();
 async function close(){
  for(const name of owned)try{docker(['rm','-fv',name]);}catch{/* recheck below */}
  for(const name of volumes)try{docker(['volume','rm',name]);}catch{/* recheck below */}
  if(networkCreated)docker(['network','rm',network]);
  for(const name of images)docker(['image','rm','-f',name]);
  for(const name of owned){let exists=false;try{docker(['container','inspect',name]);exists=true;}catch{/* absent */}if(exists)throw Error('backup container cleanup');}
  for(const name of volumes){let exists=false;try{docker(['volume','inspect',name]);exists=true;}catch{/* absent */}if(exists)throw Error('backup volume cleanup');}
  rmSync(root,{recursive:true,force:true});
 }
 try{
  docker(['network','create','--internal',network]);networkCreated=true;
  const host='db.vlacestfruxooznrcjqc.supabase.co';
  const args=containerArgs(db,{datlocprovider:'i',datlocale:'en-US',datcollate:'en_US.UTF-8',datctype:'en_US.UTF-8'});
  args.splice(args.indexOf('--network'),2,'--network',network,'--network-alias',host);owned.add(db);docker(args);
  for(let n=0;;n++){try{if(docker(['logs',db]).includes('PostgreSQL init process complete; ready for start up.')){docker(['exec',db,'pg_isready','-U','supabase_admin']);break;}}catch{/* bounded startup */}if(n>=90)throw Error('production fixture startup');await new Promise(r=>setTimeout(r,1000));}
  if(su('show server_version_num')!=='170011')throw Error('pinned server version');
  const base='supabase/fixtures/production-schema-2026-11-01/';su(prepareRolesSql(read(base+'roles.sql')));
  su('drop database postgres with (force);','template1');
  docker(['exec',db,'createdb','-U','supabase_admin','-O','postgres','-T','template0','--encoding=UTF8','--locale-provider=icu','--icu-locale=en-US','--lc-collate=en_US.UTF-8','--lc-ctype=en_US.UTF-8','postgres']);
  let schema=read(base+'schema.sql');
  for(const[,trigger,role]of schema.matchAll(/^ALTER EVENT TRIGGER ([a-z_][a-z0-9_]*) OWNER TO ([a-z_][a-z0-9_]*);$/gm))if(su(`select rolsuper from pg_roles where rolname='${role}'`)==='f')schema=schema.replace(new RegExp(`^CREATE EVENT TRIGGER ${trigger} ON [\\s\\S]*?^ALTER EVENT TRIGGER ${trigger} OWNER TO ${role};$`,'gm'),block=>`SET ROLE ${role};\n${block}\nRESET ROLE;`);
  su(schema);
  for(const[file,table]of [['20261020000700_assess_lifecycle.sql','launch_gate'],['20261026000100_assess_supervisor_scope.sql','scope_lock'],['20261027000100_assess_management_erasure.sql','erasure_fk_contract'],['20261026000100_assess_supervisor_scope.sql','sharing_policy']]){
   const lines=[...read('supabase/migrations/'+file).matchAll(new RegExp(`^insert into assess\\.${table} [^;]+;`,'gm'))];if(lines.length!==1)throw Error('reviewed singleton initializer');owner(lines[0][0]);
  }
  owner(read('supabase/manual/rad085-sharing-policy-live-p1.sql'));
  su('grant pg_signal_backend to postgres;');
  const manifest=JSON.parse(read('scripts/pages/frontend-schema.json'));
  for(const file of manifest.requiredMigrations.filter(f=>f>='20261030000100_rad062_full_name.sql'))owner(read('supabase/migrations/'+file));
  owner(read('supabase/manual/assess-grading-worker-provision.sql'));
  owner(read('supabase/manual/assess-grading-worker-public-temp.sql'));
  owner("set radlab.worker_switch_authorized='apply-reviewed-v2';"+read('supabase/manual/selfservice-worker-v2-switch.sql'));
  const cert=join(root,'source.crt'),key=join(root,'source.key');
  execFileSync('openssl',['req','-x509','-newkey','rsa:2048','-nodes','-days','1','-subj','/CN='+host,'-addext','subjectAltName=DNS:'+host,'-keyout',key,'-out',cert],{stdio:'pipe'});
  docker(['exec','-u','root',db,'mkdir','-p','/etc/rad105-backup-tls']);
  for(const file of ['source.key','source.crt'])docker(['cp',join(root,file),db+':/etc/rad105-backup-tls/'+file]);
  docker(['exec','-u','root',db,'sh','-c','chown -R postgres:postgres /etc/rad105-backup-tls && chmod 600 /etc/rad105-backup-tls/source.key']);
  docker(['exec','-u','root',db,'sed','-i','-e','1i hostssl postgres assess_backup samenet scram-sha-256','-e','1i host all assess_backup all reject','/etc/postgresql/pg_hba.conf']);
  su("alter system set ssl='on';alter system set ssl_cert_file='/etc/rad105-backup-tls/source.crt';alter system set ssl_key_file='/etc/rad105-backup-tls/source.key';select pg_reload_conf();");
  // Query helper executes only inside this isolated Docker network via psql.
  const query=async sql=>JSON.parse(su("set search_path='';set TimeZone='UTC';select coalesce(jsonb_agg(q),'[]'::jsonb) from ("+sql+") q"));
  return{root,prefix,network,db,host,ca:read(cert),docker,su,owner,owned,volumes,images,query,read,writeFileSync,IMAGE,close};
 }catch(e){await close();throw e;}
}

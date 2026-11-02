// Synthetic-only transport. No URL, remote socket, JWT, provider or credential selector.
import { PGlite } from '@electric-sql/pglite';
import { createRequire } from 'node:module';
import { existsSync, mkdtempSync, readFileSync, readdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';
import assert from 'node:assert/strict';
// Production-version regression, separate from RAD-086's full Supabase restore image.
const IMAGE='postgres:17.11-bookworm@sha256:839fbb5a4942a7758dd93e18b42ea5649807491a0545b5eeeb8f0b8bb11857a5';
import { localeArgs } from '../ops/laptop-backup-lib.mjs';

export async function openLocalDatabase(backend, {through='historical-b',lineEndings='lf',allMigrationLineEndings=false,locale='C',productionVersion=false}={}) {
  if(!['pglite','postgres'].includes(backend))throw new Error('invalid_backend');
  // A finite migration ceiling exists only for destructive synthetic upgrade QA.
  if(!['latest','historical-m09','historical-b','f','pre-rad085'].includes(through))throw new Error('invalid_migration_ceiling');
  if(!['lf','crlf'].includes(lineEndings))throw new Error('invalid_line_endings');
  if(typeof allMigrationLineEndings!=='boolean')throw new Error('invalid_all_migration_line_endings');
  // Finite synthetic regression matrix; ICU must never fall back to libc.
  if(!['C','en_US.UTF-8','icu-en-US'].includes(locale)||(locale!=='C'&&backend!=='postgres'))throw new Error('invalid_locale');
  if(typeof productionVersion!=='boolean'||(productionVersion&&backend!=='postgres')||(locale==='icu-en-US'&&!productionVersion))throw new Error('invalid_production_version');
  const localeIdentity={datlocprovider:locale==='icu-en-US'?'i':'c',datlocale:locale==='icu-en-US'?'en-US':null,datcollate:locale==='C'?'C':'en_US.UTF-8',datctype:locale==='C'?'C':'en_US.UTF-8'};
  let container;
  const docker=(args)=>{
    const env={...process.env};
    for(const key of ['DOCKER_HOST','DOCKER_CONTEXT','DOCKER_TLS','DOCKER_TLS_VERIFY','DOCKER_CERT_PATH'])delete env[key];
    return execFileSync('docker',['--host=unix:///var/run/docker.sock',...args],{env,stdio:'pipe',timeout:15000});
  };
  // B7 opts into CRLF for ALL history; default preserves older mixed-line-ending witnesses.
  let db,admin,dir,ctl,started=false;
  const clients=new Set();
  async function close() {
    const ended=await Promise.allSettled([...clients].map(c=>c.end()));
    if(db)await db.close();
    // Do not remove a running cluster if shutdown fails. The caller emits only a code.
    if(container){docker(['rm','-f',container]);container=null;started=false;}
    if(started&&existsSync(join(dir,'data','postmaster.pid'))){ctl(['-m','fast','-w','stop']);started=false;}
    if(dir)rmSync(dir,{recursive:true,force:true});
    if(ended.some(r=>r.status==='rejected'))throw new Error('cleanup_failed');
  }
  try {
    let connect;
    if(backend==='pglite')db=new PGlite();
    else {
      // QA dependencies live outside the repository; this manifest selects packages, never a DB.
      const require=createRequire(process.env.ASSESS_POSTGRES_MANIFEST??'/tmp/radlab-ops-postgres/package.json');
      const {Client}=require('pg');
      dir=mkdtempSync(join(tmpdir(),'radlab-assess-ops-'));
      const data=join(dir,'data');
      let database='postgres';
      if(productionVersion){
        // initdb resolves the invoking UID; expose only the host's public account map.
        const common=['run','--rm','--pull','never','--network=none','--user',`${process.getuid()}:${process.getgid()}`,'--mount','type=bind,src=/etc/passwd,dst=/etc/passwd,readonly','--mount',`type=bind,src=${dir},dst=${dir}`,'--entrypoint'];
        docker([...common,'initdb',IMAGE,'-D',data,'-A','trust','-U','postgres','--no-locale','--encoding=UTF8']);
        container=`rad062-local-${process.pid}-${dir.split('-').at(-1).toLowerCase()}`;
        docker(['run','-d','--pull','never','--name',container,'--network=none','--user',`${process.getuid()}:${process.getgid()}`,'--mount',`type=bind,src=${dir},dst=${dir}`,'--entrypoint','postgres',IMAGE,
          '-D',data,'-F','-c',"listen_addresses=",'-k',dir,'-p','55432','-c','log_min_messages=panic','-c','log_min_error_statement=panic','-c','log_statement=none','-c','log_parameter_max_length=0','-c','log_parameter_max_length_on_error=0']);
        for(let n=0;;n++){
          try{docker(['exec',container,'pg_isready','-h',dir,'-p','55432','-U','postgres']);break;}
          catch(e){if(n===9)throw e;await new Promise(r=>setTimeout(r,1000));}
        }
        docker(['exec',container,'createdb','-h',dir,'-p','55432','-U','postgres','-T','template0','--encoding=UTF8',...localeArgs(localeIdentity),'rad062_locale']);
        database='rad062_locale';
      }else{
        const {initdb,pg_ctl}=await import(require.resolve('@embedded-postgres/linux-x64'));
        ctl=args=>execFileSync(pg_ctl,['-D',data,...args],{stdio:'pipe',timeout:15000});
        execFileSync(initdb,['-D',data,'-A','trust','-U','postgres',locale==='C'?'--no-locale':'--locale='+locale,'--encoding=UTF8'],{stdio:'pipe',timeout:15000});
        // Mode-0700 directory, Unix socket only. All connection fields explicit; no inherited PG URL.
        started=true; // Cleanup also covers a partially acknowledged start.
        ctl(['-l',join(dir,'postgres.log'),'-o',`-F -c listen_addresses='' -k ${dir} -p 55432 -c log_min_messages=panic -c log_min_error_statement=panic -c log_statement=none -c log_parameter_max_length=0 -c log_parameter_max_length_on_error=0`,'-w','-t','10','start']);
      }
      connect=async()=>{
        const c=new Client({host:dir,port:55432,user:'postgres',database,password:'',ssl:false,connectionTimeoutMillis:10000,query_timeout:10000});
        clients.add(c);await c.connect();return c;
      };
      admin=await connect();
      // Assert before any schema fixture or migration is installed.
      const identity=(await admin.query("select datlocprovider,datlocale,datcollate,datctype,pg_encoding_to_char(encoding) encoding from pg_database where datname=current_database()")).rows[0];
      assert.deepEqual(identity,{...localeIdentity,encoding:'UTF8'},'STOP target locale');
      if(productionVersion)assert.equal((await admin.query("select current_setting('server_version_num')::int version")).rows[0].version,170011,'STOP production version');
    }
    const query=async(sql,args=[])=>db?(await db.query(sql,args)).rows:(await admin.query(sql,args)).rows;
    const exec=async sql=>{if(db)await db.exec(sql);else await admin.query(sql);};
    await exec(`create role anon nologin;create role authenticated nologin;create role service_role nologin;
      create schema auth;create table auth.users(id uuid primary key,email text,email_confirmed_at timestamptz,raw_user_meta_data jsonb);
      create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
      grant usage on schema auth to authenticated,anon;grant execute on function auth.uid() to authenticated,anon;`);
    // Existing no-option callers are historical B/explicit-upgrade witnesses.
    // Only explicit latest models the full currently required production schema.
    const required=JSON.parse(readFileSync('scripts/pages/frontend-schema.json','utf8')).requiredMigrations;
    const ceiling=through==='historical-m09'?'20261102000200':through==='historical-b'?'20261030000100':through==='pre-rad085'?'20261026000100':'20261020001100';
    if(through==='latest' && required.includes('20261102000200_rad059_emergency_alternate.sql')) await exec('create role assess_job_a nologin;create role assess_job_b nologin;');
    for(const file of readdirSync('supabase/migrations').filter(f=>f.endsWith('.sql')&&(through==='latest'?required.includes(f):f<ceiling)).sort()) {
      const sql=readFileSync(`supabase/migrations/${file}`,'utf8');
      try { await exec(lineEndings==='crlf'&&(allMigrationLineEndings||file>='20261020000600')?sql.replaceAll('\n','\r\n'):sql); }
      catch(error){throw Object.assign(new Error(`migration_failed:${file}:SQLSTATE=${error.code??'unavailable'}`,{cause:error}),{code:error.code});}
    }
    function port(role,user='') {
      if(!['anon','authenticated','assess_worker'].includes(role)||
        (role==='authenticated'?!/^[0-9a-f-]{36}$/.test(user):user!==''))throw new Error('invalid_local_identity');
      return {async call(name,args) {
        if(!/^[a-z][a-z0-9_]*$/.test(name)||Object.keys(args).some(k=>!/^p_[a-z0-9_]+$/.test(k)))throw new Error('invalid_local_rpc');
        const sql=`select assess.${name}(${Object.keys(args).map((k,i)=>`${k}=>$${i+1}`).join(',')}) v`;
        let committing=false;
        const invoke=async tx=>{
          await tx.query(`set local role ${role}`);
          await tx.query("select set_config('request.jwt.claim.sub',$1,true)",[user]);
          const value=(await tx.query(sql,Object.values(args))).rows[0].v;
          committing=true;return value;
        };
        if(db)return db.transaction(invoke).catch(error=>{
          // PGlite has completed its local rollback. A completed invocation could
          // instead have failed at COMMIT, so it must remain uncertain.
          if(!committing)Object.defineProperty(error,'writeOutcome',{value:'rolled_back'});
          throw error;
        });
        // Separate connections/transactions even when two workers share this local port object.
        const c=await connect();
        try{await c.query('begin');const value=await invoke(c);await c.query('commit');return value;}
        catch(error){await c.query('rollback');if(!committing)Object.defineProperty(error,'writeOutcome',{value:'rolled_back'});throw error;}
        finally{await c.end();clients.delete(c);}
      }};
    }
    return {query,exec,port,close};
  }catch(error){
    try{await close();}catch{throw Object.assign(new Error('cleanup_failed'),{code:'cleanup_failed'});}
    throw error;
  }
}

// Synthetic-only transport. No URL, remote socket, JWT, provider or credential selector.
import { PGlite } from '@electric-sql/pglite';
import { createRequire } from 'node:module';
import { existsSync, mkdtempSync, readFileSync, readdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';

export async function openLocalDatabase(backend, {through='latest',lineEndings='lf',allMigrationLineEndings=false}={}) {
  if(!['pglite','postgres'].includes(backend))throw new Error('invalid_backend');
  // A finite migration ceiling exists only for destructive synthetic upgrade QA.
  if(!['latest','f','pre-rad085'].includes(through))throw new Error('invalid_migration_ceiling');
  if(!['lf','crlf'].includes(lineEndings))throw new Error('invalid_line_endings');
  if(typeof allMigrationLineEndings!=='boolean')throw new Error('invalid_all_migration_line_endings');
  // B7 opts into CRLF for ALL history; default preserves older mixed-line-ending witnesses.
  let db,admin,dir,ctl,started=false;
  const clients=new Set();
  async function close() {
    const ended=await Promise.allSettled([...clients].map(c=>c.end()));
    if(db)await db.close();
    // Do not remove a running cluster if shutdown fails. The caller emits only a code.
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
      const {initdb,pg_ctl}=await import(require.resolve('@embedded-postgres/linux-x64'));
      dir=mkdtempSync(join(tmpdir(),'radlab-assess-ops-'));
      const data=join(dir,'data');
      ctl=args=>execFileSync(pg_ctl,['-D',data,...args],{stdio:'pipe',timeout:15000});
      execFileSync(initdb,['-D',data,'-A','trust','-U','postgres','--no-locale','--encoding=UTF8'],{stdio:'pipe',timeout:15000});
      // Mode-0700 directory, Unix socket only. All connection fields explicit; no inherited PG URL.
      started=true; // Cleanup also covers a partially acknowledged start.
      ctl(['-l',join(dir,'postgres.log'),'-o',`-F -c listen_addresses='' -k ${dir} -p 55432 -c log_min_messages=panic -c log_min_error_statement=panic -c log_statement=none -c log_parameter_max_length=0 -c log_parameter_max_length_on_error=0`,'-w','-t','10','start']);
      connect=async()=>{
        const c=new Client({host:dir,port:55432,user:'postgres',database:'postgres',password:'',ssl:false,connectionTimeoutMillis:10000,query_timeout:10000});
        clients.add(c);await c.connect();return c;
      };
      admin=await connect();
    }
    const query=async(sql,args=[])=>db?(await db.query(sql,args)).rows:(await admin.query(sql,args)).rows;
    const exec=async sql=>{if(db)await db.exec(sql);else await admin.query(sql);};
    await exec(`create role anon nologin;create role authenticated nologin;
      create schema auth;create table auth.users(id uuid primary key,email text,email_confirmed_at timestamptz,raw_user_meta_data jsonb);
      create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
      grant usage on schema auth to authenticated,anon;grant execute on function auth.uid() to authenticated,anon;`);
    // RAD085-D3-DEFERRED-20261027: the historical ceiling excludes all four deferred sources.
    for(const file of readdirSync('supabase/migrations').filter(f=>f.endsWith('.sql')&&(through==='latest'||(through==='pre-rad085'?!['20261026000100_assess_supervisor_scope.sql','20261026000200_assess_authoring_drafts.sql','20261026000300_assess_assignment_review.sql','20261027000100_assess_management_erasure.sql'].includes(f):f<'20261020001100'))).sort()) {
      const sql=readFileSync(`supabase/migrations/${file}`,'utf8');
      await exec(lineEndings==='crlf'&&(allMigrationLineEndings||file>='20261020000600')?sql.replaceAll('\n','\r\n'):sql);
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

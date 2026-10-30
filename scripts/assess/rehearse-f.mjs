// Disposable PostgreSQL only. External QA packages; no production URL, credentials, TCP listener or Docker.
// npm install --prefix /tmp/radlab-f-postgres embedded-postgres@18.4.0-beta.17 pg@8.23.1
// ASSESS_POSTGRES_MANIFEST=/tmp/radlab-f-postgres/package.json node --import ./scripts/assess/node-loader.mjs scripts/assess/rehearse-f.mjs
import {createRequire} from 'node:module';
import {mkdtempSync,readFileSync,readdirSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {execFileSync} from 'node:child_process';
import {strict as assert} from 'node:assert';
import {attemptService,publicationService,runAssessJobs} from '../../src/features/assess/server-service.ts';
const require=createRequire(process.env.ASSESS_POSTGRES_MANIFEST??'/tmp/radlab-f-postgres/package.json');
const {Client}=require('pg');
const {initdb,pg_ctl}=await import(require.resolve('@embedded-postgres/linux-x64'));
const dir=mkdtempSync(join(tmpdir(),'radlab-assess-f-')),data=join(dir,'data'),clients=[];
const uid=n=>`00000000-0000-0000-0000-${String(n).padStart(12,'0')}`;
let started=false;
const ctl=args=>execFileSync(pg_ctl,['-D',data,...args],{stdio:'pipe'});
async function connect(){const c=new Client({host:dir,port:55432,user:'postgres',database:'postgres',password:'',ssl:false});await c.connect();clients.push(c);return c;}
function port(c,role,user='',hold=false){return {async call(name,args){
 if(!/^[a-z0-9_]+$/.test(name))throw new Error('Invalid fixture RPC');
 await c.query('begin');try{await c.query(`set local role ${role}`);await c.query("select set_config('request.jwt.claim.sub',$1,true)",[user]);const r=await c.query(`select assess.${name}(${Object.values(args).map((_,i)=>`$${i+1}`).join(',')}) v`,Object.values(args));if(hold)await c.query('select pg_sleep(0.15)');await c.query('commit');return r.rows[0].v;}catch(e){await c.query('rollback');throw e;}
}};}
try{
 execFileSync(initdb,['-D',data,'-A','trust','-U','postgres','--no-locale','--encoding=UTF8'],{stdio:'pipe'});
 // Socket in a mode-0700 mkdtemp directory. No TCP listener, provider selector or inherited PG settings.
 ctl(['-l',join(dir,'postgres.log'),'-o',`-F -c listen_addresses='' -k ${dir} -p 55432`,'-w','-t','10','start']);started=true;
 const admin=await connect();await admin.query(`create role anon nologin;create role authenticated nologin;create schema auth;create table auth.users(id uuid primary key,email text,email_confirmed_at timestamptz,raw_user_meta_data jsonb);create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;grant usage on schema auth to authenticated,anon;grant execute on function auth.uid() to authenticated,anon;`);
 // F witnesses consent_v1 before the separately witnessed retention-v2 upgrade.
 const deferred=JSON.parse(readFileSync('scripts/pages/frontend-schema.json','utf8')).deferredMigrations;
 for(const f of readdirSync('supabase/migrations').filter(f=>f.endsWith('.sql')&&!Object.hasOwn(deferred,f)&&f<'20261020001100').sort())await admin.query(readFileSync(`supabase/migrations/${f}`,'utf8'));
 for(const n of [1,2,3])await admin.query('insert into auth.users values($1,$2,now(),$3)',[uid(n),`synthetic${n}@example.test`,JSON.stringify({display_name:'Synthetic'})]);
 await admin.query(`update public.profiles set status='approved';update public.profiles set role='owner' where user_id='${uid(1)}';`);
 const student=port(await connect(),'authenticated',uid(2)),held=port(await connect(),'authenticated',uid(2),true),other=port(await connect(),'authenticated',uid(3)),owner=port(await connect(),'authenticated',uid(1)),worker=port(await connect(),'assess_worker'),worker2=port(await connect(),'assess_worker');
 const review={sources:[{reference:'Synthetic alphabet',licenceEvidence:'Own fixture'}],reviewedBy:'Engineering fixture',reviewedAt:'2026-10-20T00:00:00.000Z',scope:'Non-clinical test only'};
 const item={schemaVersion:1,ref:{id:'q',version:'1'},type:'single-choice',contentLanguage:'en',prompt:'Choose a synthetic letter',options:[{id:'a',text:'A'},{id:'b',text:'B'}]};
 const pub={schemaVersion:1,assessment:{schemaVersion:1,ref:{id:uid(10),version:'1'},name:'Synthetic alphabet',track:'mixed',maximum:'10',policy:{durationSeconds:3600,maxAttempts:2,gradeVisibility:'hidden'},items:[item]},itemMarks:[{item:item.ref,maximum:'10'}],privateItems:[{schemaVersion:1,ref:item.ref,type:'single-choice',correctOptionId:'a',review}]};
 await admin.query(`insert into assess.versions(id,owner_id,assessment_id,version,name,track,available) values($1,$2,$1,'1','Synthetic alphabet','mixed',true)`,[uid(10),uid(1)]);await publicationService(worker).install(uid(10),pub);
 const assignment=await owner.call('assign_v1',{p_version:uid(10),p_users:[uid(2),uid(3)],p_groups:[]});
 const cat=await admin.query(readFileSync('supabase/checks/assess-history-ready.sql','utf8'));assert.equal(cat[1].rows[0].launch_gate_closed,true);
 await admin.query('update assess.launch_gate set enabled=true'); // freshly created disposable cluster only
 await assert.rejects(()=>attemptService(student).start(assignment,uid(100)),{code:'denied'});
 const accept={p_version:'assess-pilot-2026-10-20-v1'};
 assert.deepEqual(await Promise.all([held.call('consent_v1',accept),student.call('consent_v1',accept)]),[{accepted:true},{accepted:true}]);
 const stamp=(await admin.query('select accepted_at from assess.consents')).rows;await student.call('consent_v1',accept);assert.deepEqual((await admin.query('select accepted_at from assess.consents')).rows,stamp);
 assert.equal((await admin.query('select count(*)::int n from assess.consents')).rows[0].n,1);assert.deepEqual(await other.call('consent_v1',{}),{accepted:false});
 const [a,b]=await Promise.all([attemptService(held).start(assignment,uid(100)),attemptService(student).start(assignment,uid(100))]);assert.equal(a.attemptId,b.attemptId);
 const cmd=JSON.stringify({schemaVersion:1,attemptId:a.attemptId,operationId:uid(101),expectedRevision:0,action:{type:'submit'}});
 await Promise.all([attemptService(held).command(cmd),attemptService(student).command(cmd)]);const jobs=await Promise.all([runAssessJobs(worker,1),runAssessJobs(worker2,1)]);assert.equal(jobs[0].graded+jobs[1].graded,1);
 const page=await student.call('history_page_v1',{p_after:null,p_limit:20});assert.equal(page.rows.length,1);assert.deepEqual(page.rows[0].grade,{visibility:'hidden'});assert.equal(Object.keys(page.rows[0]).length,4);assert.deepEqual(await other.call('history_page_v1',{}),{rows:[],next:null});
 await admin.query('update assess.sessions set expires_at=clock_timestamp() where id=$1',[a.attemptId]);
 const [empty,m1,m2]=await Promise.all([student.call('history_page_v1',{}),worker.call('maintain_v1',{p_limit:1}),worker2.call('maintain_v1',{p_limit:1})]);assert.deepEqual(empty,{rows:[],next:null});assert.equal(m1.purged+m2.purged,1);assert.equal((await worker.call('maintain_v1',{p_limit:1})).purged,0);
 assert.equal((await admin.query('select used from assess.reservations')).rows[0].used,1);assert.equal((await admin.query('select count(*)::int n from assess.results')).rows[0].n,0);
 assert.equal((await admin.query('select count(*)::int n from assess.session_details')).rows[0].n,0);assert.equal((await admin.query('select count(*)::int n from public.attempts')).rows[0].n,0);
 console.log(JSON.stringify({contract:'assess-f-rehearsal/1',backend:'postgres-parallel',version:(await admin.query('show server_version')).rows[0].server_version,outcome:'PASS',checks:['missing-consent-denied','parallel-consent-once','retry-preserves-acceptance-time','parallel-start-submit-workers','four-field-hidden-history','identity-isolation','expiry-read-versus-two-purgers','purge-idempotency','reservation-survives','no-details-or-practice-write'],runtimeOrLaunchVerified:false}));
}finally{
 await Promise.allSettled(clients.map(c=>c.end()));if(started)ctl(['-m','fast','-w','stop']);rmSync(dir,{recursive:true,force:true});
}

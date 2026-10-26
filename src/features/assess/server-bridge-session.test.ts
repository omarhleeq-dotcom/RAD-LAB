import { expect, it } from 'vitest';
import { Pool } from 'pg';
import { openRad085Database, fixtureId as id } from './rad085-local-db';
import { bridgeSessionHost, type BridgePrincipal } from './server-bridge-session';
import { authoringBridge } from './server-authoring-bridge';
import { newDraft, newMCQ } from '../authoring-review/draft';
import type { AssessmentPublication } from './server-contracts';
const catalog = { parts: [], practicals: [] };
const service = 'synthetic_bridge_login';
async function fixture() {
 const db = await openRad085Database();
 let pool: Pool | undefined;
 try {
  for (let n=1;n<=4;n++) await db.admin.query(`insert into auth.users values($1,$2,now(),'{"display_name":"SYNTHETIC","consent_version":"2026-10-16"}')`,[id(n),`session${n}@example.test`]);
  await db.admin.query("update public.profiles set status='approved',role=case when user_id=$1 then 'owner' else 'participant' end",[id(1)]);
  await db.rpc(1,'appointment_v1',[id(2),true]); await db.rpc(1,'appointment_v1',[id(3),true]);
  const g=await db.rpc<{id:string}>(2,'supervisor_group_v1',['create',null,null,'SYNTHETIC',new Date(Date.now()+3600000).toISOString()]);
  const d=newDraft(), q=newMCQ(); d.name='SYNTHETIC letters'; q.prompt='SYNTHETIC A'; q.correctOptionId=q.options[0]!.id;
  q.authoring={author:'SYNTHETIC',reference:'Own letters',licenceNotes:'Own engineering fixture',notes:'No medical content'}; d.items=[q];
  await db.rpc(2,'draft_save_v1',[g.id,d.id,0,JSON.stringify(d),'[]']); d.revision=1;
  const publication: AssessmentPublication={schemaVersion:1,assessment:{schemaVersion:1,ref:{id:d.id,version:'1'},name:d.name,track:'mixed',maximum:'1',policy:d.policy,items:[{schemaVersion:1,ref:{id:q.id,version:'1'},type:'single-choice',contentLanguage:'en',prompt:q.prompt,options:q.options}]},itemMarks:[{item:{id:q.id,version:'1'},maximum:'1'}],privateItems:[{schemaVersion:1,ref:{id:q.id,version:'1'},type:'single-choice',correctOptionId:q.correctOptionId,review:{sources:[{reference:'Own synthetic letters',licenceEvidence:'Own non-medical engineering fixture'}],reviewedBy:'SYNTHETIC independent engineering review',reviewedAt:'2026-10-26T00:00:00.000Z',scope:'Engineering only; no medical approval'}}]};
  await db.admin.query('insert into assess.authoring_reviewed_packages select draft_id,revision,digest,$2 from assess.authoring_revisions where draft_id=$1',[d.id,JSON.stringify(publication)]);
  // Fixture-only, socket trust authentication. No password/secret or operational role.
  await db.admin.query(`create role ${service} login noinherit nosuperuser nobypassrls nocreatedb nocreaterole noreplication; grant assess_authoring_bridge to ${service} with inherit false, set true, admin false`);
  pool=new Pool(db.poolConfig(service)); pool.on('error',()=>{});
  const principals=new Map<string,BridgePrincipal>([['synthetic-A',{subject:id(2),group:g.id,expiresAt:Date.now()+3600000}],['synthetic-B',{subject:id(3),group:g.id,expiresAt:Date.now()+3600000}]]);
  const host=bridgeSessionHost(pool,service,async credential=>{const p=principals.get(credential);if(!p)throw Error('unauthenticated');return {...p};});
  const session=await host.open('synthetic-A');
  return {...db,pool,host,session,principals,d,g,bridge:authoringBridge(session.port,catalog),async close(){await host.disconnect();await db.close();}};
 } catch(e) {await pool?.end();await db.close();throw e;}
}
async function blocked(f: Awaited<ReturnType<typeof fixture>>, pid?: number) {
 for(let n=0;n<100;n++) {
  const rows=(await f.admin.query("select pid from pg_stat_activity where usename=$1 and cardinality(pg_blocking_pids(pid))>0",[service])).rows;
  if(rows.some(r=>pid===undefined||r.pid===pid))return;
  await new Promise(r=>setTimeout(r,10));
 }
 throw Error('expected real PostgreSQL lock wait');
}
async function clean(f: Awaited<ReturnType<typeof fixture>>) {
 const c=await f.pool.connect();
 try {
  const pid=(await c.query('select pg_backend_pid() pid')).rows[0].pid;
  expect((await f.admin.query('select state from pg_stat_activity where pid=$1',[pid])).rows[0].state).toBe('idle');
  const r=(await c.query("select session_user,current_user,current_setting('request.jwt.claim.sub',true) claim,current_setting('request.jwt.claims',true) claims,current_setting('application_name') app,current_setting('transaction_isolation') isolation")).rows[0];
  expect(r.claims??'').toBe('');expect(r.app).not.toBe('stale-borrower');
  expect(r.current_user).toBe(service); expect(r.session_user).toBe(service);expect(r.claim??'').toBe('');expect(r.isolation).toBe('read committed');
  // An open failed/idle transaction would report BEGIN instead of this fresh BEGIN.
  expect((await c.query('begin')).command).toBe('BEGIN');await c.query('rollback');
  return (await c.query('select pg_backend_pid() pid')).rows[0].pid as number;
 }finally{c.release();}
}
it('narrow LOGIN, NOLOGIN versus existing sessions, membership denial and service boundary',async()=>{
 const f=await fixture();try{
  for(const role of ['anon','authenticated','assess_worker']){
   const c=await f.connect('synthetic-denial');try{
    await c.query(`set session authorization ${role}`);
    await expect(c.query('set role assess_authoring_bridge')).rejects.toMatchObject({code:'42501'});
    await expect(c.query(`grant assess_authoring_bridge to ${role}`)).rejects.toMatchObject({code:'42501'});
    await expect(c.query('select assess.authoring_bridge_read_v1($1,$2,1)',[f.g.id,f.d.id])).rejects.toMatchObject({code:'42501'});
   }finally{await c.end();}
  }
  await expect(f.connect('no-login','assess_authoring_bridge')).rejects.toMatchObject({code:'28000'});
  const c=await f.pool.connect();try{
   await expect(c.query('select * from assess.authoring_reviewed_packages')).rejects.toMatchObject({code:'42501'});
   await expect(c.query('set role assess_worker')).rejects.toMatchObject({code:'42501'});
   await expect(c.query(`grant assess_authoring_bridge to authenticated`)).rejects.toMatchObject({code:'42501'});
   await f.admin.query(`alter role ${service} nologin`);
   await expect(f.connect('new-denied',service)).rejects.toMatchObject({code:'28000'});
   expect((await c.query('select 1 v')).rows[0].v).toBe(1); // NOLOGIN does not kill an open connection.
  }finally{c.release();}
  await f.admin.query(`alter role ${service} login`);
  await expect(f.host.open('forged-user-and-group')).rejects.toThrow();
  await f.admin.query(`revoke assess_authoring_bridge from ${service}`);
  await expect(f.session.port.receipt(f.d.id,1)).rejects.toThrow('denied');
 }finally{await f.close();}
},30000);
it('reuses one physical connection across users, success, failure and cancellation with no role/claims/transaction residue',async()=>{
 const f=await fixture();try{
  const pid=await clean(f);
  const dirty=await f.pool.connect();await dirty.query('set role assess_authoring_bridge');await dirty.query("select set_config('request.jwt.claim.sub',$1,false),set_config('request.jwt.claims',$2,false),set_config('application_name','stale-borrower',false)",[id(3),JSON.stringify({sub:id(3)})]);await dirty.query('begin');dirty.release();
  expect(await f.session.port.receipt(f.d.id,1)).toBeNull();expect(await clean(f)).toBe(pid);
  const b=await f.host.open('synthetic-B');await expect(b.port.receipt(f.d.id,1)).rejects.toMatchObject({code:'42501'});expect(await clean(f)).toBe(pid);
  await expect(f.session.port.transaction(f.d.id,1,async()=>{throw Error('rollback');})).rejects.toThrow('rollback');expect(await clean(f)).toBe(pid);
  await expect(f.session.port.transaction(f.d.id,1,async()=>{f.session.close();})).rejects.toThrow();
  const fresh=await f.host.open('synthetic-A');expect(await fresh.port.receipt(f.d.id,1)).toBeNull();expect(await clean(f)).not.toBe(pid);
  const result=await authoringBridge(fresh.port,catalog).publish(f.d.id,1);expect(await fresh.port.receipt(f.d.id,1)).toBe(result.version);await clean(f);
 }finally{await f.close();}
},30000);
for(const event of ['revocation','channel-loss','changed-principal'] as const)it(`interrupts lock wait on ${event}, rolls back and never retries a write`,async()=>{
 const f=await fixture();try{
  const lock=await f.connect();try{
   await lock.query('begin');await lock.query('select * from assess.authoring_reviewed_packages for update');
   let invalidations=0;f.session.subscribe(()=>invalidations++);
   const pending=f.bridge.publish(f.d.id,1).then(()=>false,()=>true);await blocked(f);
   if(event==='revocation')f.host.revoke(p=>p.subject===id(2));
   else if(event==='channel-loss')f.host.disconnect();
   else {f.principals.set('synthetic-A',{subject:id(3),group:f.g.id,expiresAt:Date.now()+3600000});await lock.query('rollback');}
   expect(await pending).toBe(true);expect(invalidations).toBe(1);
   await lock.query('rollback');
   expect((await f.admin.query('select * from assess.versions')).rows).toHaveLength(0);
   expect((await f.admin.query('select * from assess.authoring_publication_links')).rows).toHaveLength(0);
   await expect(f.bridge.publish(f.d.id,1)).rejects.toThrow(); // no reconnect with an old capability
   if(event==='revocation'){const fresh=await f.host.open('synthetic-B');await expect(fresh.port.receipt(f.d.id,1)).rejects.toMatchObject({code:'42501'});}
  }finally{await lock.end();}
 }finally{await f.close();}
},30000);
for(const change of ['appointment','suspension','end'] as const)it(`rechecks ${change} committed ahead of a waiting request`,async()=>{
 const f=await fixture();try{
  const lock=await f.connect();try{
   await lock.query('begin');await lock.query('set local role authenticated');await lock.query("select set_config('request.jwt.claim.sub',$1,true)",[id(1)]);
   if(change==='appointment')await lock.query('select assess.appointment_v1($1,false)',[id(2)]);
   else {
    await lock.query('reset role');await lock.query('select * from assess.scope_lock for update');
    if(change==='suspension')await lock.query("update public.profiles set status='suspended' where user_id=$1",[id(2)]);
    else await lock.query('update assess.groups set ended_at=clock_timestamp() where id=$1',[f.g.id]);
   }
   const pending=f.bridge.publish(f.d.id,1).then(()=>undefined,e=>e.code);await blocked(f);await lock.query('commit');
   expect(await pending).toBe(change==='end'?'55000':'42501');await clean(f);
   await expect(f.session.port.receipt(f.d.id,1)).rejects.toMatchObject({code:change==='end'?'55000':'42501'});
   expect((await f.admin.query('select * from assess.versions')).rows).toHaveLength(0);
  }finally{await lock.end();}
 }finally{await f.close();}
},30000);
for(const when of ['before','after'] as const)it(`lost ACK ${when} COMMIT reconciles explicitly without another mutation`,async()=>{
 const f=await fixture();try{
  let commits=0;
  f.pool.once('acquire',client=>{
   const original=client.query.bind(client) as (...args:unknown[])=>Promise<unknown>;
   client.query=(async (...args:unknown[])=>{
    if(args[0]==='commit'){
     commits++;
     if(when==='after')await original(...args);
     throw Error('ACK lost '+when+' COMMIT');
    }
    return original(...args);
   }) as typeof client.query;
  });
  await expect(f.bridge.publish(f.d.id,1)).rejects.toThrow('ACK lost');expect(commits).toBe(1);
  for(let n=0;n<2;n++)expect(Boolean(await f.session.port.receipt(f.d.id,1))).toBe(when==='after');
  for(const table of ['versions','publications','authoring_publication_links'])expect((await f.admin.query(`select * from assess.${table}`)).rows).toHaveLength(when==='after'?1:0);
  await clean(f);
 }finally{await f.close();}
},30000);

it('concurrent writes serialize on the reused connection; disconnect destroys idle connections and prevents reopening',async()=>{
 const f=await fixture();try{
  const pid=await clean(f);
  const results=await Promise.all([f.bridge.publish(f.d.id,1),f.bridge.publish(f.d.id,1)]);
  expect(results[0]).toEqual(results[1]);expect(await clean(f)).toBe(pid);
  expect((await f.admin.query('select * from assess.publications')).rows).toHaveLength(1);
  await f.host.disconnect();
  // pool.end closes the socket; observe PostgreSQL processing the disconnect as well.
  let gone=false;for(let n=0;n<100;n++){if(!(await f.admin.query('select 1 from pg_stat_activity where pid=$1',[pid])).rowCount){gone=true;break;}await new Promise(r=>setTimeout(r,10));}
  expect(gone).toBe(true);
  await expect(f.host.open('synthetic-A')).rejects.toThrow('denied');
 }finally{await f.close();}
},30000);
it('rejects expired sessions, a changed authenticated group and an unsafe service login',async()=>{
 const f=await fixture();try{
  f.principals.set('expired',{subject:id(2),group:f.g.id,expiresAt:Date.now()-1});
  await expect(f.host.open('expired')).rejects.toThrow('denied');
  f.principals.set('synthetic-A',{subject:id(2),group:id(999),expiresAt:Date.now()+3600000});
  await expect(f.session.port.receipt(f.d.id,1)).rejects.toThrow('denied');
  f.principals.set('synthetic-A',{subject:id(2),group:f.g.id,expiresAt:Date.now()+3600000});
  const fresh=await f.host.open('synthetic-A');await f.admin.query(`alter role ${service} inherit`);
  await expect(fresh.port.receipt(f.d.id,1)).rejects.toThrow('denied');
  expect(f.pool.totalCount).toBe(0);
 }finally{await f.close();}
},30000);
it('consent withdrawal ahead of lock acquisition rejects frozen targets and confirmation without assignment',async()=>{
 const f=await fixture();try{
  await f.admin.query("update assess.sharing_policy set required_version='SYNTHETIC',text_digest=repeat('b',64)");
  await f.rpc(4,'sharing_consent_v1',['SYNTHETIC','b'.repeat(64),true]);
  const group=(await f.rpc<{rows:{id:string;revision:number}[]}>(2,'scope_page_v1',['groups'])).rows.find(g=>g.id===f.g.id)!;
  // Read the generated code solely in the isolated administrative fixture.
  const created=await f.rpc<{id:string;code:string}>(2,'supervisor_group_v1',['rotate',f.g.id,group.revision]);
  const request=await f.rpc<{id:string;revision:number}>(4,'join_request_v1',[created.code]);await f.rpc(2,'join_decide_v1',[request.id,request.revision,'approve']);
  await f.bridge.publish(f.d.id,1);
  const review=await f.rpc<{token:string}>(2,'assignment_prepare_v1',[f.g.id,f.d.id,1,crypto.randomUUID()]);
  const lock=await f.connect();try{
   await lock.query('begin');await lock.query('set local role authenticated');await lock.query("select set_config('request.jwt.claim.sub',$1,true)",[id(4)]);
   await lock.query('select assess.sharing_consent_v1(null,null,false)');
   const pending=f.rpc(2,'assignment_confirm_v1',[review.token],'synthetic-consent-wait').then(()=>undefined,e=>e.code);
   let observed=false;
   for(let n=0;n<100;n++){
    if((await f.admin.query("select 1 from pg_stat_activity where application_name='synthetic-consent-wait' and cardinality(pg_blocking_pids(pid))>0")).rowCount){observed=true;break;}
    await new Promise(r=>setTimeout(r,10));
   }
   expect(observed).toBe(true);await lock.query('commit');expect(await pending).toBe('40001');
   await expect(f.rpc(2,'assignment_targets_v1',[review.token])).rejects.toMatchObject({code:'40001'});
   expect((await f.admin.query('select * from assess.assignments')).rows).toHaveLength(0);
  }finally{await lock.end();}
 }finally{await f.close();}
},30000);
it('an administrative change outside the connected channel waits behind the bridge and applies to the next request',async()=>{
 const f=await fixture();try{
  let revoke!:Promise<unknown>;
  await f.session.port.transaction(f.d.id,1,async()=>{
   revoke=f.rpc(1,'appointment_v1',[id(2),false],'synthetic-admin-after-bridge');
   let observed=false;
   for(let n=0;n<100;n++){
    if((await f.admin.query("select 1 from pg_stat_activity where application_name='synthetic-admin-after-bridge' and cardinality(pg_blocking_pids(pid))>0")).rowCount){observed=true;break;}
    await new Promise(r=>setTimeout(r,10));
   }
   expect(observed).toBe(true);
  });
  await revoke;await expect(f.session.port.receipt(f.d.id,1)).rejects.toMatchObject({code:'42501'});
 }finally{await f.close();}
},30000);
for(const boundary of ['committed','released'] as const)it(`suppresses a late response when revoked at ${boundary}; reconciliation stays explicit`,async()=>{
 const f=await fixture();try{
  let discards=0, commits=0;
  f.pool.once('acquire',client=>{
   const original=client.query.bind(client) as (...args:unknown[])=>Promise<unknown>;
   client.query=(async(...args:unknown[])=>{
    const value=await original(...args);
    if(args[0]==='commit'){commits++;if(boundary==='committed')f.host.revoke(p=>p.subject===id(2));}
    if(args[0]==='discard all'&&++discards===2&&boundary==='released')f.host.revoke(p=>p.subject===id(2));
    return value;
   }) as typeof client.query;
  });
  await expect(f.bridge.publish(f.d.id,1)).rejects.toThrow();expect(commits).toBe(1);
  await expect(f.session.port.receipt(f.d.id,1)).rejects.toThrow('denied');
  // A new successfully authenticated capability is required, even if rights are restored.
  const fresh=await f.host.open('synthetic-A');
  expect(await fresh.port.receipt(f.d.id,1)).toMatch(/^[a-f0-9-]{36}$/);
  expect((await f.admin.query('select * from assess.publications')).rows).toHaveLength(1);
 }finally{await f.close();}
},30000);
it('session expiry interrupts an already open lock wait without a new request or polling',async()=>{
 const f=await fixture();try{
  f.principals.set('short',{subject:id(2),group:f.g.id,expiresAt:Date.now()+1000});
  const short=await f.host.open('short'),lock=await f.connect();try{
   await lock.query('begin');await lock.query('select * from assess.authoring_reviewed_packages for update');
   const pending=authoringBridge(short.port,catalog).publish(f.d.id,1).then(()=>false,()=>true);await blocked(f);
   expect(await pending).toBe(true);await lock.query('rollback');
   expect((await f.admin.query('select * from assess.versions')).rows).toHaveLength(0);
   await expect(short.port.receipt(f.d.id,1)).rejects.toThrow('denied');
  }finally{await lock.end();}
 }finally{await f.close();}
},30000);

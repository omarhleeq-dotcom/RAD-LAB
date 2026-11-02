/** Separate connections and pg_blocking_pids witness both lock directions; no timing guess. */
import { describe, expect, it } from 'vitest';
import type { Client } from 'pg';
import { fixture, modes, id, scores, finalize, blocked, type Db } from './rad062-m09-fixture';
async function begin(db: Db, user = 2) {
 const c = await db.connect(); await c.query('begin');
 await c.query("select set_config('request.jwt.claim.sub',$1,true)",[id(user)]); return c;
}
const grade = (c: Client, s: string, operation: string) => operation === 'score'
 ? c.query('select assess.manual_score_v1($1,$2,1,$3,\'correction\')',[s,id(201),JSON.stringify([{item:{id:'w0',version:'1'},score:'2'}])])
 : c.query('select assess.manual_finalize_v1($1,$2,1)',[s,id(300)]);
async function mutate(c: Client, kind: string, db: Db) {
 if(kind==='revocation') await c.query('select assess.appointment_v1($1,false)',[id(2)]);
 if(kind==='archive') await c.query("select assess.supervisor_group_v1('end',$1,(select scope_revision from assess.groups where id=$1))",[db.group]);
 if(kind==='freeze') await c.query('select assess.freeze_v2()');
 if(kind==='D3') {
  await c.query("select pg_advisory_xact_lock(hashtextextended('rad062-capacity',0))");
  const inv=(await c.query('select assess.d3_inventory_v1($1) v',[id(2)])).rows[0].v;
  await c.query("insert into assess.erasure_rights(user_id,content_digest,disposition,reviewed_by) values($1,$2,'no-personal-data',$3) on conflict(user_id) do update set content_digest=excluded.content_digest",[id(2),inv.contentDigest,id(1)]);
  await c.query('select assess.transfer_management_d3_v1($1,$2)',[id(2),inv.inventoryDigest]);
 }
}
describe.each(modes)('M09 lock barriers %s',mode=>{
 for(const operation of ['score','finalize']) for(const kind of ['revocation','archive','D3','freeze']) for(const first of ['grading','mutation']) {
  it(`${operation} vs ${kind}, ${first} commits first without deadlock or stale scope`,async()=>{
   const {db,s}=await fixture(mode); const g=await begin(db),m=await begin(db,kind==='archive'?2:1);
   try {
    await scores(db,s);
    if(kind==='D3') await db.admin.query("insert into public.c2_account_deletions(user_id,restore_status,previous_banned_until) values($1,'approved','-infinity')",[id(2)]);
    if(first==='grading') {
     await grade(g,s,operation);
     const pid=(await g.query('select pg_backend_pid() pid')).rows[0].pid;
     const waiting=Promise.allSettled([mutate(m,kind,db)]); await blocked(db,pid);
     await g.query('commit'); expect((await waiting)[0].status).toBe('fulfilled'); await m.query('commit');
     expect((await db.admin.query('select operation_count from assess.manual_work_v1')).rows[0]?.operation_count??null).toBe(operation==='score'?2:null);
     expect((await db.admin.query('select count(*)::int n from assess.results')).rows[0].n).toBe(operation==='finalize'?1:0);
    } else {
     await mutate(m,kind,db);
     const pid=(await m.query('select pg_backend_pid() pid')).rows[0].pid;
     const waiting=Promise.allSettled([grade(g,s,operation)]); await blocked(db,pid);
     await m.query('commit'); expect((await waiting)[0]).toMatchObject({status:'rejected',reason:{code:kind==='freeze'?'55000':'42501'}});
     await g.query('rollback');
     expect((await db.admin.query('select operation_count from assess.manual_work_v1')).rows[0].operation_count).toBe(1);
     expect((await db.admin.query('select count(*)::int n from assess.results')).rows[0].n).toBe(0);
    }
   } finally {await g.query('rollback');await m.query('rollback');await g.end();await m.end();await db.close();}
  },120000);
 }
 for(const operation of ['score','finalize']) for(const clock of ['ends_at','168h']) {
  it(`${operation} rechecks ${clock} after a witnessed profile wait`,async()=>{
   const {db,s}=await fixture(mode); const hold=await begin(db,1);
   try {
    await scores(db,s);
    // The clock boundary is configured ONLY after PostgreSQL proves the wait.
    // Keep the same 500ms window and test timeout; no race with fixture startup.
    if(clock==='ends_at') await db.admin.query('alter table assess.groups disable trigger assess_managed_group');
    await hold.query('select 1 from public.profiles where user_id=$1 for update',[id(3)]);
    const pid=(await hold.query('select pg_backend_pid() pid')).rows[0].pid;
    const waiting=Promise.allSettled([operation==='score'?scores(db,s,1,201):finalize(db,s)]); await blocked(db,pid);
    if(clock==='ends_at') await hold.query("update assess.groups set ends_at=clock_timestamp()+interval '500 milliseconds' where id=$1",[db.group]);
    else await hold.query("update assess.sessions set submitted_at=clock_timestamp()-interval '7 days'+interval '500 milliseconds' where id=$1",[s]);
    for(let i=0;i<100;i++) {
     const crossed=(await hold.query(clock==='ends_at'?'select ends_at<=clock_timestamp() ok from assess.groups where id=$1':"select submitted_at+interval '7 days'<=clock_timestamp() ok from assess.sessions where id=$1",[clock==='ends_at'?db.group:s])).rows[0].ok;
     if(crossed) break;
     if(i===99) throw Error('clock boundary did not cross');
     await new Promise(r=>setTimeout(r,10));
    }
    await hold.query('commit'); expect((await waiting)[0]).toMatchObject({status:'rejected',reason:{code:clock==='ends_at'?'42501':'55000'}});
    expect((await db.admin.query('select operation_count from assess.manual_work_v1')).rows[0].operation_count).toBe(1);
    expect((await db.admin.query('select count(*)::int n from assess.results')).rows[0].n).toBe(0);
   } finally {await hold.query('rollback');await hold.end();await db.close();}
  },120000);
 }
 for(const operation of ['score','finalize']) for(const clock of ['ends_at','168h']) {
  it(`${operation} rolls back writes when ${clock} crosses at the commit barrier`,async()=>{
   const {db,s}=await fixture(mode);const hold=await begin(db,1),g=await begin(db);
   try {
    await scores(db,s);
    // Compile the real endpoint on this connection before arming a short clock.
    // Roll back every warm-up effect; the measured call is a fresh operation.
    await g.query('savepoint warm');await grade(g,s,operation);await g.query('rollback to savepoint warm');
    await db.admin.query(`create function assess.m09_commit_barrier() returns trigger language plpgsql as $$ begin perform pg_advisory_xact_lock(9109); return new; end $$`);
    await db.admin.query(`create trigger m09_commit_barrier before insert on assess.${operation==='score'?'manual_events_v1':'results'} for each row execute function assess.m09_commit_barrier()`);
    await hold.query('select pg_advisory_xact_lock(9109)');
    if(clock==='ends_at') {await db.admin.query('alter table assess.groups disable trigger assess_managed_group');await db.admin.query("update assess.groups set ends_at=clock_timestamp()+interval '500 milliseconds' where id=$1",[db.group]);}
    else await db.admin.query("update assess.sessions set submitted_at=clock_timestamp()-interval '7 days'+interval '500 milliseconds' where id=$1",[s]);
    const pid=(await hold.query('select pg_backend_pid() pid')).rows[0].pid;
    const waiting=Promise.allSettled([grade(g,s,operation)]);await blocked(db,pid);
    for(let i=0;i<100;i++) {
     const crossed=(await hold.query(clock==='ends_at'?'select ends_at<=clock_timestamp() ok from assess.groups where id=$1':"select submitted_at+interval '7 days'<=clock_timestamp() ok from assess.sessions where id=$1",[clock==='ends_at'?db.group:s])).rows[0].ok;
     if(crossed) break;
     if(i===99) throw Error('clock boundary did not cross');
     await new Promise(r=>setTimeout(r,10));
    }
    await hold.query('commit');expect((await waiting)[0]).toMatchObject({status:'rejected',reason:{code:clock==='ends_at'?'42501':'55000'}});
    await g.query('rollback');
    expect((await db.admin.query('select operation_count from assess.manual_work_v1')).rows[0].operation_count).toBe(1);
    expect((await db.admin.query('select count(*)::int n from assess.manual_events_v1')).rows[0].n).toBe(1);
    expect((await db.admin.query('select count(*)::int n from assess.results')).rows[0].n).toBe(0);
   }finally{await g.query('rollback');await g.end();await hold.query('rollback');await hold.end();await db.close();}
  },120000);
 }
 it('D3 erases only the grader identity after rights clearance and transfer, retaining another student result',async()=>{
  const {db,s}=await fixture(mode);
  try {
   await scores(db,s); await finalize(db,s);
   const result=(await db.admin.query('select * from assess.results')).rows;
   await db.admin.query("insert into public.c2_account_deletions(user_id,restore_status,previous_banned_until) values($1,'approved','-infinity')",[id(2)]);
   const c=await begin(db,1);
   try {await mutate(c,'D3',db);await c.query('select assess.erase_account_d3_v1($1)',[id(2)]);await c.query('commit');} finally {await c.query('rollback');await c.end();}
   expect((await db.admin.query('select * from assess.results')).rows).toEqual(result);
   expect((await db.admin.query('select final_grader_id from assess.manual_final_receipts_v1')).rows[0].final_grader_id).toBeNull();
   expect((await db.admin.query('select user_id from public.profiles where user_id=$1',[id(2)])).rows).toEqual([]);
   await expect(db.rpc(2,'manual_queue_v1')).rejects.toMatchObject({code:'42501'});
   for(const run of [()=>db.rpc(2,'manual_read_v1',[s]),()=>scores(db,s,0,200),()=>finalize(db,s),()=>db.rpc(2,'manual_receipt_v1',[s])]) await expect(run()).rejects.toMatchObject({code:'42501'});
   expect(await db.rpc(1,'manual_receipt_v1',[s])).toMatchObject({final_grader_id:null});
  } finally {await db.close();}
 },120000);
});

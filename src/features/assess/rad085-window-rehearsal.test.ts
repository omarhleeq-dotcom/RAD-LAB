import {describe,expect,it} from 'vitest';
import {readFileSync} from 'node:fs';
import {catalogueFixture,modes,sql} from './rad062-m09-fixture';
const {productionShapeSql}=await import('../../../scripts/assess/'+'rad085-production-shape.mjs') as {productionShapeSql:()=>string};
const {inspectWindow,windowStopLine}=await import('../../../scripts/assess/'+'rad085-window-rehearsal.mjs') as {
 windowStopLine:(error:unknown)=>string;
 inspectWindow:(db:import('pg').Client)=>Promise<Record<string,number>>;
};
async function prepareWindow(admin:import('pg').Client){
   await admin.query(`alter table auth.users add column if not exists banned_until timestamptz;
    create table if not exists auth.sessions(user_id uuid);create table if not exists auth.refresh_tokens(user_id uuid);`);
   await admin.query(sql());
   await admin.query(readFileSync('supabase/manual/rad085-sharing-policy-live-p1.sql','utf8'));
   await admin.query("reset rad085.sharing_phase");
   await admin.query(`do $$begin
    if not exists(select 1 from pg_roles where rolname='assess_job_a') then create role assess_job_a nologin;end if;
    if not exists(select 1 from pg_roles where rolname='assess_job_b') then create role assess_job_b nologin;end if;
   end$$;`);
   await admin.query(productionShapeSql());
}
describe.each(modes)('owner 0200 then 0300 rehearsal %s',mode=>{
 it('checks M09, refuses the reverse order atomically, then proves both successors and preserved baseline',async()=>{
  const db=await catalogueFixture(mode);
  try {
   await prepareWindow(db.admin);
   expect(await inspectWindow(db.admin)).toEqual({pre_m09_checks:10,order_refused:1,refusal_unchanged:1,
    alternate_committed:1,alternate_ready:1,review_committed:1,review_ready:1,unchanged_checks:8,
    baseline_preserved:1,reviewed_added_fks:7});
  } finally {await db.close();}
 },120000);
 it('STOP names the inspectWindow step and only false preflight names, with no driver/body/row output',async()=>{
  const db=await catalogueFixture(mode);
  try {
   await prepareWindow(db.admin);
   await db.admin.query("revoke references on public.events from service_role;create function public.rad085_private_canary() returns text language sql as $$select 'PRIVATE_BODY_CANARY'::text$$");
   let stop:unknown;
   try{await inspectWindow(db.admin);}catch(e){stop=e;}
   expect(windowStopLine(stop)).toBe('STOP rad085_window_rehearsal; inspectWindow=0300_preflight; false_preflight=functions,relations; inspect locally with the owner; no live action authorized');
   expect(String(stop)).not.toMatch(/PRIVATE|SELECT|pg_proc/);
   expect((await db.admin.query("select to_regclass('assess.pilot_write_usage') v")).rows[0].v).toBeNull();
  } finally {await db.close();}
 },120000);
 it('refuses an M08 backup before creating any window object',async()=>{
  const db=await catalogueFixture(mode);
  try {
   await expect(inspectWindow(db.admin)).rejects.toThrow('inspectWindow=m09_checks');
   expect((await db.admin.query("select to_regnamespace('emergency') v")).rows[0].v).toBeNull();
  } finally {await db.close();}
 },120000);
});

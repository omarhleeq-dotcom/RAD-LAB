import {describe,expect,it} from 'vitest';
import {readFileSync} from 'node:fs';
import {catalogueFixture,modes,sql} from './rad062-m09-fixture';
const {inspectWindow}=await import('../../../scripts/assess/'+'rad085-window-rehearsal.mjs') as {
 inspectWindow:(db:import('pg').Client)=>Promise<Record<string,number>>;
};
describe.each(modes)('owner 0200 then 0300 rehearsal %s',mode=>{
 it('checks M09, refuses the reverse order atomically, then proves both successors and preserved baseline',async()=>{
  const db=await catalogueFixture(mode);
  try {
   await db.admin.query(`alter table auth.users add column if not exists banned_until timestamptz;
    create table if not exists auth.sessions(user_id uuid);create table if not exists auth.refresh_tokens(user_id uuid);`);
   await db.admin.query(sql());
   await db.admin.query(readFileSync('supabase/manual/rad085-sharing-policy-live-p1.sql','utf8'));
   await db.admin.query("reset rad085.sharing_phase");
   await db.admin.query(`do $$begin
    if not exists(select 1 from pg_roles where rolname='assess_job_a') then create role assess_job_a nologin;end if;
    if not exists(select 1 from pg_roles where rolname='assess_job_b') then create role assess_job_b nologin;end if;
   end$$;`);
   expect(await inspectWindow(db.admin)).toEqual({pre_m09_checks:10,order_refused:1,refusal_unchanged:1,
    alternate_committed:1,alternate_ready:1,review_committed:1,review_ready:1,unchanged_checks:8,
    baseline_preserved:1,reviewed_added_fks:7});
  } finally {await db.close();}
 },120000);
 it('refuses an M08 backup before creating any window object',async()=>{
  const db=await catalogueFixture(mode);
  try {
   await expect(inspectWindow(db.admin)).rejects.toThrow('required_check_failed:');
   expect((await db.admin.query("select to_regnamespace('emergency') v")).rows[0].v).toBeNull();
  } finally {await db.close();}
 },120000);
});

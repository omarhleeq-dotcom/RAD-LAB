import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import type { QueryResult } from 'pg';
import { catalogueFixture, modes, id } from './rad062-m09-fixture';

const health = readFileSync('supabase/checks/rad059-backlog-health.sql', 'utf8');
describe.each(modes)('RAD-059 aggregate read and timeout design witness %s', mode => {
 it('counts cumulative ages and holds, emits no identities, and uses a read-only transaction', async () => {
  const db = await catalogueFixture(mode);
  try {
   await db.admin.query("insert into assess.versions(id,owner_id,assessment_id,version,name,track,available) values($1,$2,$1,'1','SYNTHETIC','mixed',true)", [id(50), id(1)]);
   await db.admin.query('insert into assess.assignments(id,owner_id,version_id) values($1,$2,$3)', [id(51), id(1), id(50)]);
   await db.rpc(3, 'consent_v2', ['assess-pilot-2026-10-20-v2']);
   const ages = [0, 119, 120, 143, 144, 166, 167, 168, 169];
   for (const [index, age] of ages.entries()) await db.admin.query(`insert into assess.sessions
    (id,assignment_id,user_id,ordinal,state,started_at,deadline,submitted_at)
    values($1,$2,$3,$4,'awaiting-manual',now()-interval '180 hours',now()+interval '1 hour',now()-$5*interval '1 hour')`, [id(100 + index), id(51), id(3), index + 1, age]);
   await db.admin.query(`insert into assess.sessions
    (id,assignment_id,user_id,ordinal,state,started_at,deadline,submitted_at,emergency_held_at)
    values($1,$2,$3,10,'grading-failed',now()-interval '180 hours',now()+interval '1 hour',now()-interval '180 hours',now())`, [id(120), id(51), id(3)]);
   const before = (await db.admin.query('select to_jsonb(s) row from assess.sessions s order by id')).rows;
   const results = await db.admin.query(health.replace('rollback;', "select current_setting('transaction_read_only') read_only; rollback;")) as unknown as QueryResult[];
   const rows = results.flatMap(result => result.rows);
   expect(rows).toHaveLength(2);
   expect(rows[0]).toEqual({ awaiting_manual: '9', awaiting_manual_ge_120h: '7', awaiting_manual_ge_144h: '5', awaiting_manual_ge_167h: '3', awaiting_manual_ge_168h: '2', awaiting_manual_missing_submission: '0', held: '1', oldest_submitted_at: expect.any(Date) });
   expect(rows[1]).toEqual({ read_only: 'on' });
   const oldest = (await db.admin.query("select min(submitted_at) oldest from assess.sessions where state='awaiting-manual'")).rows[0].oldest;
   expect(rows[0]!.oldest_submitted_at).toEqual(oldest);
   expect((await db.admin.query('select to_jsonb(s) row from assess.sessions s order by id')).rows).toEqual(before);
   expect(health).toContain("set local lock_timeout='2s'");
   expect(health).toContain("set local statement_timeout='5s'");
  } finally { await db.close(); }
 }, 120000);

 it('proves function-local statement_timeout cannot implement independent per-phase deadlines', async () => {
  const db = await catalogueFixture(mode);
  try {
   await db.admin.query(`create function pg_temp.rad059_timeout_probe() returns boolean language plpgsql set statement_timeout='50ms'
    as $$begin perform pg_sleep(0.15); return true; end$$`);
   const start = performance.now();
   expect((await db.admin.query('select pg_temp.rad059_timeout_probe() ok')).rows[0].ok).toBe(true);
   expect(performance.now() - start).toBeGreaterThanOrEqual(140);
   await db.admin.query(`create function pg_temp.rad059_caught_timeout_probe() returns boolean language plpgsql as $$
    begin begin perform pg_sleep(0.3); exception when query_canceled then null; end;
    perform pg_sleep(0.2); return true; end$$`);
   await db.admin.query("set statement_timeout='100ms'");
   const second = performance.now();
   expect((await db.admin.query('select pg_temp.rad059_caught_timeout_probe() ok')).rows[0].ok).toBe(true);
   expect(performance.now() - second).toBeGreaterThanOrEqual(280);
   await db.admin.query('set statement_timeout=0');
  } finally { await db.close(); }
 }, 120000);
});

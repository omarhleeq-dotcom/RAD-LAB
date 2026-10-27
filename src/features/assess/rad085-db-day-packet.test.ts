// RAD085-DB-DAY packet witnesses (B2/B4/B5): every SQL file the owner pastes is read-only, runs on a
// disposable synthetic PostgreSQL, covers every table, and gives the documented result. No provider.
import { readFileSync, readdirSync } from 'node:fs';
import type { Client } from 'pg';
import { expect, it } from 'vitest';
import { openRad085Database, fixtureId as id } from './rad085-local-db';

const MANUAL = 'supabase/manual/';
const BACKUP = `${MANUAL}rad085-db-day-backup/`;
const read = (p: string) => readFileSync(p, 'utf8');
const code = (sql: string) => sql.split('\n').filter(l => !l.trim().startsWith('--')).join('\n');
// Runs the file exactly as pasted, inside a read-only transaction, and returns the rows of its SELECT.
async function run(c: Client, file: string) {
 const sql = read(file);
 expect(code(sql)).not.toMatch(/\b(insert|update|delete|drop|alter|create|grant|revoke|truncate|set)\b/i);
 await c.query('begin read only');
 try { return (await c.query(sql)).rows as Record<string, unknown>[]; } finally { await c.query('rollback'); }
}
const baseTables = async (c: Client) => (await c.query(`select n.nspname||'.'||c.relname t from pg_class c join pg_namespace n on n.oid=c.relnamespace
 where n.nspname in ('public','assess') and c.relkind in ('r','p') order by 1`)).rows.map(r => r.t as string);
const files = readdirSync(BACKUP).filter(f => f.endsWith('.sql')).sort();

async function seed(c: Client) {
 await c.query('alter table auth.users add column banned_until timestamptz, add column created_at timestamptz default now(); create table auth.sessions(user_id uuid); create table auth.refresh_tokens(user_id text)');
 for (let n = 1; n <= 4; n++) await c.query("insert into auth.users values($1,$2,now(),'{\"display_name\":\"SYNTHETIC\",\"consent_version\":\"2026-10-24\"}')", [id(n), `pk-${n}@example.test`]);
 await c.query("update public.profiles set status='approved',role=case when user_id=$1 then 'owner' else 'participant' end", [id(1)]);
 await c.query("insert into public.attempts(id,user_id,attempt_no,exam_id,case_id,definition_version,settings,result,locale) values($1,$2,1,'synthetic','synthetic','v1','{}','{}','en')", [id(90), id(2)]);
 await c.query("insert into public.feedback(user_id,exam_id,attempt_id,text) values($1,'SYNTHETIC',$2,'SYNTHETIC note')", [id(2), id(90)]);
 await c.query("insert into public.events(user_id,type,payload) values($1,'heartbeat','{}')", [id(2)]);
 await c.query("insert into assess.groups(owner_id,name) values($1,'SYNTHETIC legacy group')", [id(1)]);
}

it('B2 backup queries cover every pre-DB-day table, are read-only, and export exactly the counted rows', async () => {
 let tables: string[] = [];
 const db = await openRad085Database(async c => {
  await seed(c);
  tables = await baseTables(c);
  const counts = new Map((await run(c, `${BACKUP}00-counts-before.sql`)).map(r => [r.table as string, Number(r.row_count)]));
  // Every table that exists is counted, nothing else is, and auth.users is the only extra.
  expect([...counts.keys()].sort()).toEqual([...tables, 'auth.users'].sort());
  expect(counts.get('public.attempts')).toBe(1);
  const covered = new Set<string>();
  for (const f of files.filter(f => !f.startsWith('00-'))) {
   const rows = await run(c, `${BACKUP}${f}`);
   const m = /^\d+-(.+)\.sql$/.exec(f)![1]!;
   if (m === 'catalogue-functions-triggers') {
    expect(rows.some(r => r.kind === 'function' && /owner_account_deletion_v1/.test(String(r.name)))).toBe(true);
    expect(rows.some(r => r.kind === 'trigger' && /on_auth_user_created/.test(String(r.name)))).toBe(true);
    continue;
   }
   const table = m === 'auth-users-minimal' ? 'auth.users' : m.replace('-', '.');
   covered.add(table);
   expect(rows.length, table).toBe(counts.get(table));
   if (table === 'auth.users') {
    expect(Object.keys(rows[0]!)).toEqual(['id', 'email', 'created_at', 'banned_until', 'consent_version']);
    expect(JSON.stringify(rows)).not.toMatch(/password|token|SYNTHETIC"/i);
   }
  }
  expect([...covered].sort()).toEqual([...tables, 'auth.users'].sort());
 });
 await db.close();
 expect(tables.length).toBeGreaterThanOrEqual(26);
}, 120000);

it('B5 pre-check is all true on the pre-DB-day catalogue and shows recent activity (not quiet) for fresh rows', async () => {
 const db = await openRad085Database(async c => {
  await seed(c);
  const [r] = await run(c, `${MANUAL}rad085-db-day-precheck.sql`);
  for (const [k, v] of Object.entries(r!)) if (k.endsWith('_ok')) expect(v, k).toBe(true);
  expect(Number(r!.recent_attempts_60m)).toBe(1);
  expect(Number(r!.recent_feedback_60m)).toBe(1);
  expect(Number(r!.recent_events_15m)).toBe(1);
  // A body drift on one of the four rollback-restored functions turns exactly that column false.
  await c.query("create or replace function assess.close_assignment_v1(p_assignment uuid) returns void language plpgsql security definer set search_path='' as $$ begin null; end $$");
  const [d] = await run(c, `${MANUAL}rad085-db-day-precheck.sql`);
  expect(d).toMatchObject({ close_assignment_body_ok: false, terminal_body_ok: true, content_submit_body_ok: true, owner_account_deletion_body_ok: true });
 });
 await db.close();
}, 120000);

it('B4 progress, after-counts and smoke queries are read-only and true after the four sources and the initializer', async () => {
 let before: Awaited<ReturnType<typeof run>> = [];
 const db = await openRad085Database(async c => { await seed(c); before = await run(c, `${BACKUP}00-counts-before.sql`); });
 try {
  // Packet steps 9 and 11: the same readiness file, with the one extra first line the packet prescribes.
  const ready = async (first: string) => {
   const r = await db.admin.query(`${first}\n${read('supabase/checks/rad085-d3-ready.sql')}`);
   // Several statements: the simple protocol returns one result per statement; the SELECT is the last with columns.
   const results = r as unknown as { fields: unknown[]; rows: { kind: string; ready: boolean }[] }[];
   return [...results].reverse().find(x => x.fields.length)!.rows;
  };
  const pre = await ready("set rad085.sharing_phase = 'pre-initializer';");
  expect(pre).toHaveLength(13);
  expect(pre.filter(r => !r.ready)).toEqual([]);
  expect(pre.map(r => r.kind)).toContain('sharing_policy:pre-initializer');
  const [p0] = await run(db.admin, `${MANUAL}rad085-db-day-progress.sql`);
  expect(p0).toMatchObject({ m1_scope: true, m2_drafts: true, m3_review: true, m4_d3: true, sharing_policy_set: false, launch_gate_closed: true });
  await db.admin.query(read(`${MANUAL}rad085-sharing-policy-live-p1.sql`));
  const post = await ready('reset rad085.sharing_phase;');
  expect(post).toHaveLength(13);
  expect(post.filter(r => !r.ready)).toEqual([]);
  expect(post.map(r => r.kind)).toContain('sharing_policy:initialized');
  expect((await run(db.admin, `${MANUAL}rad085-db-day-progress.sql`))[0]).toMatchObject({ sharing_policy_set: true, new_triggers_expected_3_after_m1: '3' });
  // The owner's practice save from the site, with the live trigger.
  await db.admin.query("insert into public.attempts(id,user_id,attempt_no,exam_id,case_id,definition_version,settings,result,locale) values($1,$2,2,'synthetic','synthetic','v1','{}','{}','en')", [id(91), id(1)]);
  const [s] = await run(db.admin, `${MANUAL}rad085-db-day-smoke.sql`);
  for (const [k, v] of Object.entries(s!)) if (k.endsWith('_ok')) expect(v, k).toBe(true);
  expect(s!.newest_attempt_id).toBe(id(91));
  expect(Number(s!.attempts_total_expect_before_plus_1)).toBe(Number(before.find(r => r.table === 'public.attempts')!.row_count) + 1);
  // After-counts list every base table now present; pre-existing tables never shrink.
  const after = new Map((await run(db.admin, `${MANUAL}rad085-db-day-counts-after.sql`)).map(r => [r.table as string, Number(r.row_count)]));
  expect([...after.keys()].sort()).toEqual([...(await baseTables(db.admin)), 'auth.users'].sort());
  for (const r of before) expect(after.get(r.table as string)!, String(r.table)).toBeGreaterThanOrEqual(Number(r.row_count));
  expect(after.get('assess.scope_lock')).toBe(1);
  expect(after.get('assess.sharing_policy')).toBe(1);
  // A legacy attempt has no receipt, so the smoke check cannot be satisfied by old rows.
  await db.admin.query("insert into public.attempts(id,user_id,attempt_no,exam_id,case_id,definition_version,settings,result,locale,started_at) values($1,$2,3,'synthetic','synthetic','v1','{}','{}','en',now()+interval '1 minute')", [id(92), id(1)]);
  await db.admin.query('delete from assess.practice_recordings where attempt_id=$1', [id(92)]);
  expect((await run(db.admin, `${MANUAL}rad085-db-day-smoke.sql`))[0]).toMatchObject({ newest_has_receipt_ok: false });
 } finally { await db.close(); }
}, 120000);

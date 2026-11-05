/** RAD-105 P1: staged exam-window SQL on synthetic PostgreSQL only. Never a provider connection. */
import { expect, it } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { fixture, id, type Db, type Session } from './selfservice-fixture';
import manifest from '../../../scripts/pages/frontend-schema.json';

const dir = 'supabase/staged/self-service/';
const p1 = () => readFileSync(dir + 'p1-windows.sql', 'utf8');
const rev = async (db: Db) => (await db.admin.query('select revision from assess.assignments where id=$1', [id(51)])).rows[0].revision as number;
const iso = (ms: number) => new Date(Date.now() + ms).toISOString();
const setWindow = (db: Db, r: number, opens: string, closes: string, user = 2) => db.call<number>('assignment_window_set_v1', [id(51), r, opens, closes], user);
const start = (db: Db, op = 100) => db.call<Session>('start_v2', [id(51), id(op)], 3);

it('staged files are digest-pinned and outside the applied manifest and migrations', () => {
 const pins = JSON.parse(readFileSync(dir + 'MANIFEST.json', 'utf8')) as { status: string; files: Record<string, string> };
 expect(pins.status).toBe('staged');
 expect(Object.keys(pins.files).sort()).toEqual(readdirSync(dir).filter(f => f !== 'MANIFEST.json').sort());
 for (const [file, sha] of Object.entries(pins.files)) {
  expect(createHash('sha256').update(readFileSync(dir + file)).digest('hex'), file).toBe(sha);
  expect(readdirSync('supabase/migrations')).not.toContain(file);
  expect(JSON.stringify(manifest)).not.toContain(file);
 }
});

it('P1 windows: server-clock open/close, truncation at closes_at, schedule rules, scoped reads, gate and identity inventory unchanged', async () => {
 const db = await fixture();
 try {
  // Requires the closed gate.
  await db.admin.query('update assess.launch_gate set enabled=true');
  await expect(db.admin.query(p1())).rejects.toMatchObject({ code: '55000' });
  await db.admin.query('rollback; update assess.launch_gate set enabled=false');
  const before = (await db.admin.query("select md5(string_agg(p.oid::regprocedure::text||md5(p.prosrc),',' order by p.oid::regprocedure::text)) m from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='assess' and p.proname<>'start_v2'")).rows[0].m;
  await db.admin.query(p1());
  // Only start_v2 changed among the pre-existing assess functions.
  const after = (await db.admin.query("select md5(string_agg(p.oid::regprocedure::text||md5(p.prosrc),',' order by p.oid::regprocedure::text)) m from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='assess' and p.proname<>'start_v2' and p.proname not in ('window_guard_v1','window_deadline_v1','assignment_window_set_v1','my_windows_v1','assignment_status_v1')")).rows[0].m;
  expect(after).toBe(before);
  expect((await db.admin.query('select count(*)::int c from assess.launch_gate where not enabled')).rows[0].c).toBe(1); // gate still closed
  expect((await db.admin.query("select has_function_privilege('authenticated','assess.window_guard_v1(uuid)','EXECUTE') a,has_function_privilege('authenticated','assess.assignment_window_set_v1(uuid,integer,timestamptz,timestamptz)','EXECUTE') b")).rows[0]).toEqual({ a: false, b: true });
  await db.admin.query('update assess.launch_gate set enabled=true'); // synthetic starts only

  // No window: nothing starts. Future window: still nothing.
  await expect(start(db)).rejects.toMatchObject({ message: expect.stringContaining('exam window closed') });
  let r = await rev(db);
  await expect(setWindow(db, r, iso(-2 * 60000), iso(3600000), 3)).rejects.toMatchObject({ code: '42501' }); // student
  await expect(setWindow(db, r, iso(0), iso(8 * 86400000))).rejects.toMatchObject({ code: '22023' }); // > 7 days
  await expect(setWindow(db, r, iso(-3600000), iso(3600000))).rejects.toMatchObject({ code: '22023' }); // starts in the past
  await expect(setWindow(db, r + 5, iso(600000), iso(3600000))).rejects.toMatchObject({ code: '40001' }); // stale revision
  r = await setWindow(db, r, iso(3600000), iso(7200000));
  expect(r).toBe(await rev(db));
  await expect(start(db)).rejects.toMatchObject({ message: expect.stringContaining('exam window closed') });

  // Before opening a supervisor may move it; make it open now for 30 minutes (duration is 3600 s).
  r = await setWindow(db, r, iso(0), iso(1800000));
  const s = await start(db);
  const row = (await db.admin.query('select s.deadline,w.closes_at from assess.sessions s join assess.assignment_windows w on w.assignment_id=s.assignment_id where s.id=$1', [s.attemptId])).rows[0];
  expect(new Date(row.deadline).getTime()).toBe(new Date(row.closes_at).getTime()); // truncated at closes_at, not +3600 s

  // Open window: start is fixed, shortening is refused once attempts exist, extending is allowed.
  await expect(setWindow(db, r, iso(600000), iso(3000000))).rejects.toMatchObject({ code: '55000' });
  const opens = (await db.admin.query('select opens_at from assess.assignment_windows')).rows[0].opens_at.toISOString() as string;
  await expect(setWindow(db, r, opens, iso(900000))).rejects.toMatchObject({ code: '55000' }); // shortening with attempts
  r = await setWindow(db, r, opens, iso(2400000)); // extending is allowed

  // Scoped reads.
  const mine = await db.call<Array<{ assignmentId: string }>>('my_windows_v1', [[id(51)]], 3);
  expect(mine.map(x => x.assignmentId)).toEqual([id(51)]);
  expect(await db.call('my_windows_v1', [[id(51)]], 2)).toEqual([]); // supervisor is not a target
  await expect(db.call('my_windows_v1', [Array.from({ length: 101 }, () => id(51))], 3)).rejects.toMatchObject({ code: '22023' });
  const status = await db.call<{ counts: Record<string, number>; rows: Array<{ state: string }> }>('assignment_status_v1', [id(51), null, 50], 2);
  expect(status.counts).toMatchObject({ notStarted: 0, inProgress: 1, submitted: 0, graded: 0, missed: 0 });
  expect(status.rows).toHaveLength(1);
  await expect(db.call('assignment_status_v1', [id(51), null, 50], 3)).rejects.toMatchObject({ code: '42501' });
  await expect(db.call('assignment_status_v1', [id(51), null, 201], 2)).rejects.toMatchObject({ code: '22023' });

  // After the window ends the guard refuses a new start and status reports the target as in a finished window.
  await db.admin.query("update assess.assignment_windows set opens_at=now()-interval '2 hours',closes_at=now()-interval '1 hour'");
  await expect(start(db, 101)).rejects.toMatchObject({ message: expect.stringContaining('exam window closed') });
  await expect(setWindow(db, await rev(db), iso(0), iso(3600000))).rejects.toMatchObject({ code: '55000' });

  // Change limit: ten edits before opening, the eleventh is refused.
  await db.admin.query("delete from assess.assignment_windows");
  r = await setWindow(db, await rev(db), iso(3600000), iso(7200000));
  for (let n = 0; n < 10; n++) r = await setWindow(db, r, iso(3600000 + n * 1000), iso(7200000));
  await expect(setWindow(db, r, iso(3600000), iso(7200000))).rejects.toMatchObject({ code: '54000' });

  // Cancel before opening is the existing close; a closed assignment cannot be rescheduled.
  await db.call('assignment_close_v2', [id(51), r], 2);
  await expect(setWindow(db, await rev(db), iso(3600000), iso(7200000))).rejects.toMatchObject({ code: '55000' });

  // Erasure identity inventory is unaffected by the new table (no profile references).
  const inv = await db.admin.query("select to_regprocedure('assess.d3_fk_inventory_v1()') f");
  if (inv.rows[0].f) expect((await db.admin.query('select (select inventory from assess.erasure_fk_contract where singleton)=assess.d3_fk_inventory_v1() ok')).rows[0].ok).toBe(true);
 } finally { await db.close(); }
}, 300000);

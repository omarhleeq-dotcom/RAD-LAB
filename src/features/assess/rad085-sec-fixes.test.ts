// RAD085-SEC-FIXES-20261027: independent adversarial witnesses for SEC-01..SEC-03 on a
// disposable local PostgreSQL cluster. Synthetic accounts only; no provider, URL or secret.
import { appendFileSync, readFileSync } from 'node:fs';
import { expect, it } from 'vitest';
import { openRad085Database, fixtureId as id } from './rad085-local-db';

type Db = Awaited<ReturnType<typeof openRad085Database>>;
const OWNER = 1, OWNER2 = 2, SUP_A = 3, SUP_B = 4, STUDENTS = 36;
const student = (k: number) => 5 + k;
const evidence = (name: string, value: unknown) => {
 if (process.env.RAD085_SEC_EVIDENCE) appendFileSync(process.env.RAD085_SEC_EVIDENCE, JSON.stringify({ name, value }) + '\n');
};
async function sqlstate(run: Promise<unknown>) {
 try { await run; return 'ok'; } catch (e) { return (e as { code?: string }).code ?? String(e); }
}
async function base() {
 const db = await openRad085Database();
 try {
  await db.admin.query('alter table auth.users add column banned_until timestamptz; create table auth.sessions(user_id uuid); create table auth.refresh_tokens(user_id text)');
  for (let n = 1; n <= student(STUDENTS - 1); n++) await db.admin.query("insert into auth.users(id,email,email_confirmed_at,raw_user_meta_data) values($1,$2,now(),'{\"display_name\":\"SYNTHETIC\",\"consent_version\":\"2026-10-24\"}')", [id(n), `sec-${n}@example.test`]);
  await db.admin.query("update public.profiles set status='approved',role=case when user_id in ($1,$2) then 'owner' else 'participant' end", [id(OWNER), id(OWNER2)]);
  for (const n of [SUP_A, SUP_B]) await db.rpc(OWNER, 'appointment_v1', [id(n), true]);
  await db.admin.query(readFileSync('supabase/manual/rad085-sharing-policy-live-p1.sql', 'utf8'));
  for (let k = 0; k < STUDENTS; k++) await consent(db, student(k), true);
  return db;
 } catch (e) { await db.close(); throw e; }
}
async function consent(db: Db, n: number, accept: boolean) {
 const p = (await db.admin.query('select required_version,text_digest from assess.sharing_policy')).rows[0];
 return db.rpc(n, 'sharing_consent_v1', accept ? [p.required_version, p.text_digest, true] : [null, null, false]);
}
const group = (db: Db, sup: number, ends = new Date(Date.now() + 3600000)) =>
 db.rpc<{ id: string; revision: number; code: string }>(sup, 'supervisor_group_v1', ['create', null, null, `SYNTHETIC ${sup}`, ends]);
const revision = async (db: Db, gid: string) => (await db.admin.query('select scope_revision from assess.groups where id=$1', [gid])).rows[0].scope_revision as number;
const join = (db: Db, n: number, code: string) => db.rpc<{ outcome: string; id: string; revision: number }>(n, 'join_request_v1', [code]);
const approve = (db: Db, sup: number, r: { id: string; revision: number }) => db.rpc(sup, 'join_decide_v1', [r.id, r.revision, 'approve']);
type Page = { rows: { id: string; user_id?: string; state?: string; revision?: number }[]; total: number | null; next: string | null };
const page = (db: Db, sup: number, kind: string, gid: string, after: string | null = null, limit = 20) => db.rpc<Page>(sup, 'scope_page_v1', [kind, gid, after, limit]);
const closure = async (db: Db, aid: string) => (await db.admin.query('select closed_at,revision from assess.assignments where id=$1', [aid])).rows[0] as { closed_at: Date | null; revision: number };

// Issued scope rows are inserted by the superuser fixture; only the RPCs under test run as callers.
let serial = 0;
async function issued(db: Db, sup: number, gid: string, draft: string) {
 const n = ++serial, version = id(2000 + n), aid = id(3000 + n), review = id(4000 + n);
 await db.admin.query("insert into assess.versions(id,owner_id,assessment_id,version,name,track,available) values($1,$2,$1,'1','SYNTHETIC','mixed',true)", [version, id(sup)]);
 await db.admin.query('insert into assess.assignments(id,owner_id,version_id,source_group_ids) values($1,$2,$3,$4)', [aid, id(sup), version, [gid]]);
 await db.admin.query(`insert into assess.assignment_reviews(id,writer_id,group_id,group_revision,appointment_revision,draft_id,draft_revision,version_id,source_digest,expires_at,created_at,assignment_id)
  select $1,$2,$3,1,1,draft_id,revision,$4,digest,clock_timestamp()+interval '5 minutes',clock_timestamp(),$5 from assess.authoring_revisions where draft_id=$6`, [review, id(sup), gid, version, aid, draft]);
 await db.admin.query('insert into assess.assignment_scopes values($1,$2,$3,$4)', [aid, gid, id(sup), review]);
 return { aid, review };
}
async function draft(db: Db, sup: number, gid: string, n: number) {
 const doc = { schemaVersion: 1, id: id(1000 + n), revision: 0, name: 'SYNTHETIC', track: 'mixed', policy: {}, items: [] };
 await db.rpc(sup, 'draft_save_v1', [gid, id(1000 + n), 0, doc]);
 return id(1000 + n);
}
const close = (db: Db, who: number, aid: string, rev = 1) => db.rpc(who, 'assignment_close_v2', [aid, rev]);
const replay = (db: Db, who: number, review: string) => db.rpc<string>(who, 'assignment_confirm_v1', [review]);

it('SEC-01: after end, close and replay are rejected with closed_at unchanged; they work before end; owner path stays separate', async () => {
 const db = await base();
 try {
  const g = await group(db, SUP_A), d = await draft(db, SUP_A, g.id, 1);
  const [a1, a2, a3, a4] = [await issued(db, SUP_A, g.id, d), await issued(db, SUP_A, g.id, d), await issued(db, SUP_A, g.id, d), await issued(db, SUP_A, g.id, d)];
  expect(await sqlstate(close(db, SUP_A, a1.aid))).toBe('ok');
  expect((await closure(db, a1.aid)).closed_at).not.toBeNull();
  expect(await replay(db, SUP_A, a2.review)).toBe(a2.aid);
  await db.rpc(SUP_A, 'supervisor_group_v1', ['end', g.id, await revision(db, g.id)]);
  const before = await closure(db, a3.aid);
  const after = {
   closeOpen: await sqlstate(close(db, SUP_A, a3.aid)),
   closeAlreadyClosed: await sqlstate(close(db, SUP_A, a1.aid)),
   replay: await sqlstate(replay(db, SUP_A, a2.review)),
  };
  evidence('SEC-01 after end', after);
  expect(after).toEqual({ closeOpen: '55000', closeAlreadyClosed: '55000', replay: '55000' });
  expect(await closure(db, a3.aid)).toEqual(before);
  expect(before.closed_at).toBeNull();
  // The owner/D3-manager path is separate: an owner who manages the assignment may close it.
  await db.admin.query('insert into assess.assignment_managers values($1,$2)', [a4.aid, id(OWNER)]);
  expect(await sqlstate(close(db, OWNER, a4.aid))).toBe('ok');
  expect((await closure(db, a4.aid)).closed_at).not.toBeNull();
 } finally { await db.close(); }
}, 60000);

it('SEC-01: after ends_at passes without an explicit end, close and replay are rejected and closed_at is unchanged', async () => {
 const db = await base();
 try {
  const ends = new Date(Date.now() + 6000);
  const g = await group(db, SUP_B, ends), d = await draft(db, SUP_B, g.id, 2);
  const b1 = await issued(db, SUP_B, g.id, d), b2 = await issued(db, SUP_B, g.id, d);
  expect(await replay(db, SUP_B, b2.review)).toBe(b2.aid);
  await db.admin.query('select pg_sleep(greatest(0,extract(epoch from $1::timestamptz-clock_timestamp()))::float8+0.05)', [ends]);
  const after = { close: await sqlstate(close(db, SUP_B, b1.aid)), replay: await sqlstate(replay(db, SUP_B, b2.review)) };
  evidence('SEC-01 after ends_at', after);
  expect(after).toEqual({ close: '55000', replay: '55000' });
  expect(await closure(db, b1.aid)).toMatchObject({ closed_at: null, revision: 1 });
 } finally { await db.close(); }
}, 60000);

it('SEC-01: revoked appointment, another supervisor, a foreign group and an injected failure all leave the assignment open', async () => {
 const db = await base();
 try {
  const ga = await group(db, SUP_A), gb = await group(db, SUP_B), d = await draft(db, SUP_A, ga.id, 3);
  const c1 = await issued(db, SUP_A, ga.id, d), c2 = await issued(db, SUP_A, ga.id, d), c3 = await issued(db, SUP_A, ga.id, d);
  // A scope row pointing at another supervisor's group must not authorize the issuer.
  await db.admin.query('update assess.assignment_scopes set group_id=$2 where assignment_id=$1', [c3.aid, gb.id]);
  await db.admin.query(`create function public.synthetic_fail() returns trigger language plpgsql as $$ begin raise exception 'injected' using errcode='P0001'; end $$;
   create trigger synthetic_fail after update on assess.assignments for each row when (new.id='${c2.aid}') execute function public.synthetic_fail()`);
  const outcomes = {
   otherSupervisor: await sqlstate(close(db, SUP_B, c1.aid)),
   foreignGroup: await sqlstate(close(db, SUP_A, c3.aid)),
   injectedFailure: await sqlstate(close(db, SUP_A, c2.aid)),
  };
  await db.rpc(OWNER, 'appointment_v1', [id(SUP_A), false]);
  Object.assign(outcomes, { revokedClose: await sqlstate(close(db, SUP_A, c1.aid)), revokedReplay: await sqlstate(replay(db, SUP_A, c1.review)) });
  evidence('SEC-01 denial and rollback', outcomes);
  expect(outcomes).toEqual({ otherSupervisor: '42501', foreignGroup: '42501', injectedFailure: 'P0001', revokedClose: '42501', revokedReplay: '42501' });
  for (const a of [c1, c2, c3]) expect(await closure(db, a.aid)).toMatchObject({ closed_at: null, revision: 1 });
 } finally { await db.close(); }
}, 60000);

it('SEC-02: leave and withdraw hide the student from members and requests; rejoin shows only a new pending request', async () => {
 const db = await base();
 try {
  const g = await group(db, SUP_A);
  const [leaver, withdrawer] = [student(0), student(1)];
  for (const n of [leaver, withdrawer]) await approve(db, SUP_A, await join(db, n, g.code));
  const approved = { members: (await page(db, SUP_A, 'members', g.id)).rows.map(r => r.id).sort(), requests: (await page(db, SUP_A, 'requests', g.id)).rows };
  expect(approved).toEqual({ members: [id(leaver), id(withdrawer)].sort(), requests: [] });
  await db.rpc(leaver, 'group_leave_v1', [g.id]);
  const afterLeave = { members: (await page(db, SUP_A, 'members', g.id)).rows.map(r => r.id), requests: (await page(db, SUP_A, 'requests', g.id)).rows.map(r => r.user_id) };
  expect(afterLeave.members).toEqual([id(withdrawer)]); expect(afterLeave.requests).toEqual([]);
  await consent(db, withdrawer, false);
  const afterWithdraw = { members: (await page(db, SUP_A, 'members', g.id)).rows, requests: (await page(db, SUP_A, 'requests', g.id)).rows };
  expect(afterWithdraw).toEqual({ members: [], requests: [] });
  // The decided rows still exist for the owner/audit; only the supervisor DTO hides them.
  expect((await db.admin.query("select count(*)::int n from assess.group_join_requests where group_id=$1 and state='approved'", [g.id])).rows[0].n).toBe(2);
  const old = (await db.admin.query('select id,revision from assess.group_join_requests where user_id=$1', [id(leaver)])).rows[0];
  const again = await join(db, leaver, g.code);
  const rejoin = await page(db, SUP_A, 'requests', g.id);
  evidence('SEC-02 leave/withdraw/rejoin', { afterLeave, afterWithdraw, rejoin: rejoin.rows });
  expect(rejoin.rows).toEqual([{ id: again.id, user_id: id(leaver), state: 'pending', revision: again.revision }]);
  expect(again.revision).toBeGreaterThan(old.revision);
  // Pending gives no access: not a member and no practice visibility.
  await db.admin.query("insert into public.attempts(user_id,attempt_no,exam_id,case_id,definition_version,settings,result,locale) values($1,1,'synthetic','synthetic','v1','{}','{\"total\":1}','en')", [id(leaver)]);
  expect((await page(db, SUP_A, 'members', g.id)).rows).toEqual([]);
  expect((await page(db, SUP_A, 'practice', g.id)).rows).toEqual([]);
  // A pending request is also hidden while its account is ineligible (stop, suspension, no consent).
  const fresh = student(2), w = await join(db, fresh, g.code);
  expect(w.outcome).toBe('pending');
  const users = async () => (await page(db, SUP_A, 'requests', g.id)).rows.map(r => r.user_id).sort();
  expect(await users()).toEqual([id(leaver), id(fresh)].sort());
  await db.admin.query('insert into assess.account_stops(user_id) values($1)', [id(fresh)]);
  expect(await users()).toEqual([id(leaver)]);
  await db.admin.query('delete from assess.account_stops where user_id=$1', [id(fresh)]);
  await db.admin.query("update public.profiles set status='suspended' where user_id=$1", [id(fresh)]);
  expect(await users()).toEqual([id(leaver)]);
  await db.admin.query("update public.profiles set status='approved' where user_id=$1", [id(fresh)]);
  await consent(db, fresh, false);
  expect(await users()).toEqual([id(leaver)]);
  // Re-consent after an approved membership restores the member (new window), not a request.
  await consent(db, withdrawer, true);
  expect((await join(db, withdrawer, g.code)).outcome).toBe('member');
  expect((await page(db, SUP_A, 'members', g.id)).rows.map(r => r.id)).toEqual([id(withdrawer)]);
  expect(await users()).toEqual([id(leaver)]);
 } finally { await db.close(); }
}, 60000);

it('SEC-02: two groups stay isolated, and count/paging filter eligibility before the page boundary', async () => {
 const db = await base();
 try {
  const ga = await group(db, SUP_A), gb = await group(db, SUP_B);
  const inA = Array.from({ length: 25 }, (_, k) => student(k)), inB = Array.from({ length: 5 }, (_, k) => student(25 + k));
  const requests = new Map<number, { id: string; revision: number }>();
  for (const n of inA) requests.set(n, await join(db, n, ga.code));
  for (const n of inB) await join(db, n, gb.code);
  // 10 of A's requesters withdraw: the first page must still be 10 eligible rows.
  for (const n of inA.slice(0, 10)) await consent(db, n, false);
  const p1 = await page(db, SUP_A, 'requests', ga.id, null, 10), p2 = await page(db, SUP_A, 'requests', ga.id, p1.next, 10);
  const eligible = inA.slice(10).map(n => requests.get(n)!.id).sort();
  expect(p1.rows.length).toBe(10); expect(p1.next).toBe(p1.rows[9]!.id);
  expect(p2.rows.length).toBe(5); expect(p2.next).toBeNull();
  expect([...p1.rows, ...p2.rows].map(r => r.id)).toEqual(eligible);
  // Approve 12 of the eligible ones; members total is computed before paging.
  for (const n of inA.slice(10, 22)) await approve(db, SUP_A, (await page(db, SUP_A, 'requests', ga.id, null, 100)).rows.find(r => r.user_id === id(n)) as { id: string; revision: number });
  for (const n of inA.slice(10, 12)) await db.rpc(n, 'group_leave_v1', [ga.id]);
  const m1 = await page(db, SUP_A, 'members', ga.id, null, 5), m2 = await page(db, SUP_A, 'members', ga.id, m1.next, 5);
  expect([m1.total, m2.total]).toEqual([10, 10]); expect(m1.rows.length).toBe(5); expect(m2.rows.length).toBe(5);
  expect((await page(db, SUP_A, 'members', ga.id, m2.rows[4]!.id, 5)).rows).toEqual([]);
  expect((await page(db, SUP_A, 'requests', ga.id, null, 100)).rows.map(r => r.user_id).sort()).toEqual(inA.slice(22).map(n => id(n)).sort());
  const isolation = {
   aReadsB: await sqlstate(page(db, SUP_A, 'requests', gb.id)), bReadsA: await sqlstate(page(db, SUP_B, 'members', ga.id)),
   limit0: await sqlstate(page(db, SUP_A, 'requests', ga.id, null, 0)), limit101: await sqlstate(page(db, SUP_A, 'requests', ga.id, null, 101)),
   studentReadsGroup: await sqlstate(page(db, inA[15]!, 'requests', ga.id)),
  };
  evidence('SEC-02 isolation and paging', { isolation, firstPage: p1.rows.length, secondPage: p2.rows.length, membersTotal: m1.total });
  expect(isolation).toEqual({ aReadsB: '42501', bReadsA: '42501', limit0: '22023', limit101: '22023', studentReadsGroup: '42501' });
  expect((await page(db, SUP_B, 'requests', gb.id, null, 100)).rows.map(r => r.user_id).sort()).toEqual(inB.map(n => id(n)).sort());
 } finally { await db.close(); }
}, 90000);

const c2 = (db: Db, actor: number, action: string, target: number | null = null) =>
 db.transaction(actor, async c => (await c.query('select public.owner_account_deletion_v1($1,$2) v', [action, target === null ? null : id(target)])).rows[0].v);

it('SEC-03: an owner with an Assess stop can still list, deactivate, restore and finalise; Assess itself stays stopped', async () => {
 const db = await base();
 try {
  await db.rpc(OWNER, 'disable_account_v1', [id(OWNER)]);
  expect((await db.admin.query('select count(*)::int n from assess.account_stops where user_id=$1', [id(OWNER)])).rows[0].n).toBe(1);
  const [restored, finalised] = [student(0), student(1)];
  const outcomes = {
   deactivate: await sqlstate(c2(db, OWNER, 'deactivate', restored)),
   list: await sqlstate(c2(db, OWNER, 'list')),
   restore: await sqlstate(c2(db, OWNER, 'restore', restored)),
   deactivateSecond: await sqlstate(c2(db, OWNER, 'deactivate', finalised)),
   d3List: await sqlstate(db.rpc(OWNER, 'account_management_v1', ['list'])),
   d3Preview: await sqlstate(db.rpc(OWNER, 'account_management_v1', ['preview', id(finalised)])),
   assessStillStopped: await sqlstate(db.rpc(OWNER, 'scope_page_v1', ['appointments', null, null, 20])),
  };
  expect((await db.admin.query('select status from public.profiles where user_id=$1', [id(restored)])).rows[0].status).toBe('approved');
  await db.admin.query("update public.c2_account_deletions set requested_at=clock_timestamp()-interval '31 days' where user_id=$1", [id(finalised)]);
  const result = await c2(db, OWNER, 'finalise');
  Object.assign(outcomes, { finalise: result });
  evidence('SEC-03 stopped owner', outcomes);
  expect(outcomes).toEqual({ deactivate: 'ok', list: 'ok', restore: 'ok', deactivateSecond: 'ok', d3List: 'ok', d3Preview: 'ok', assessStillStopped: '42501', finalise: { processed: 1 } });
  expect((await db.admin.query('select count(*)::int n from auth.users where id=$1', [id(finalised)])).rows[0].n).toBe(0);
 } finally { await db.close(); }
}, 60000);

it('SEC-03: self/last-owner protection, non-owner denial and batch rollback still hold for a stopped owner', async () => {
 const db = await base();
 try {
  await db.rpc(OWNER, 'disable_account_v1', [id(OWNER)]);
  const denied = {
   self: await sqlstate(c2(db, OWNER, 'deactivate', OWNER)),
   participant: await sqlstate(c2(db, student(0), 'deactivate', student(1))),
   stoppedParticipant: await (async () => { await db.admin.query('insert into assess.account_stops(user_id) values($1)', [id(student(2))]); return sqlstate(c2(db, student(2), 'list')); })(),
  };
  // Synthetic inconsistent state: the only other owner is already pending deletion.
  await db.admin.query("insert into public.c2_account_deletions(user_id,restore_status,previous_banned_until) values($1,'approved','-infinity')", [id(OWNER)]);
  Object.assign(denied, { lastOwner: await sqlstate(c2(db, OWNER, 'deactivate', OWNER2)) });
  await db.admin.query('delete from public.c2_account_deletions where user_id=$1', [id(OWNER)]);
  // Injected failure in the second of two due erasures rolls the whole batch back.
  for (const n of [student(3), student(4)]) await c2(db, OWNER, 'deactivate', n);
  await db.admin.query("update public.c2_account_deletions set requested_at=clock_timestamp()-interval '31 days'-(case when user_id=$1 then interval '1 second' else interval '0' end)", [id(student(3))]);
  await db.admin.query(`create function public.synthetic_erase_fail() returns trigger language plpgsql as $$ begin raise exception 'injected' using errcode='P0001'; end $$;
   create trigger synthetic_erase_fail before delete on auth.users for each row when (old.id='${id(student(4))}') execute function public.synthetic_erase_fail()`);
  Object.assign(denied, { injectedBatch: await sqlstate(c2(db, OWNER, 'finalise')) });
  evidence('SEC-03 protections', denied);
  expect(denied).toEqual({ self: '42501', participant: '42501', stoppedParticipant: '42501', lastOwner: '42501', injectedBatch: 'P0001' });
  expect((await db.admin.query('select count(*)::int n from auth.users where id = any($1)', [[id(student(3)), id(student(4))]])).rows[0].n).toBe(2);
  expect((await db.admin.query('select count(*)::int n from public.c2_account_deletions where user_id = any($1)', [[id(student(3)), id(student(4))]])).rows[0].n).toBe(2);
 } finally { await db.close(); }
}, 60000);

it('SEC-03: deletion management keeps the scope -> profile lock order and re-checks the approved owner after waiting', async () => {
 const db = await base();
 try {
  await db.rpc(OWNER, 'disable_account_v1', [id(OWNER)]);
  const holder = await db.connect('sec03-holder');
  await holder.query('begin'); await holder.query('select 1 from assess.scope_lock for share');
  let settled = false;
  const waiting = sqlstate(c2(db, OWNER, 'deactivate', student(0))).finally(() => { settled = true; });
  await db.admin.query('select pg_sleep(0.3)');
  const blocked = (await db.admin.query("select count(*)::int n from pg_stat_activity where application_name='rad085-rpc' and wait_event_type='Lock'")).rows[0].n;
  expect(settled).toBe(false); expect(blocked).toBeGreaterThan(0);
  // Demote the caller while it waits: the post-wait owner re-check must reject it.
  await holder.query("update public.profiles set role='participant' where user_id=$1", [id(OWNER)]);
  await holder.query('commit');
  const outcome = await waiting;
  evidence('SEC-03 lock order', { blockedBehindScopeLock: blocked > 0, afterDemotion: outcome });
  expect(outcome).toBe('42501');
  expect((await db.admin.query('select count(*)::int n from public.c2_account_deletions')).rows[0].n).toBe(0);
 } finally { await db.close(); }
}, 60000);

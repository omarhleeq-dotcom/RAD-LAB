import {spawnSync} from "node:child_process";
import { readFileSync } from 'node:fs';
import { expect, it } from 'vitest';
import { openRad085Database, fixtureId as id } from './rad085-local-db';

it('RAD-085 migrations apply over legacy data without inventing consent or Practice timestamps', async () => {
 const db = await openRad085Database(async c => {
  await c.query("insert into auth.users values($1,'old@example.test',now(),'{}')", [id(1)]);
  await c.query("insert into public.attempts(id,user_id,attempt_no,exam_id,case_id,definition_version,settings,result,locale) values($1,$2,1,'synthetic','synthetic','v1','{}','{}','en')", [id(90), id(1)]);
 });
 try {
  expect((await db.admin.query('select * from assess.practice_recordings')).rows).toEqual([]);
  expect((await db.admin.query('select * from assess.sharing_consents')).rows).toEqual([]);
  expect((await db.admin.query('select required_version,text_digest from assess.sharing_policy')).rows).toEqual([{ required_version: null, text_digest: null }]);
  expect((await db.admin.query('select enabled from assess.launch_gate')).rows).toEqual([{ enabled: false }]);
  expect((await db.admin.query('select id from public.attempts')).rows).toEqual([{ id: id(90) }]);
  expect(readFileSync('scripts/pages/frontend-schema.json', 'utf8')).toContain('20261026000100_assess_supervisor_scope.sql');
 } finally { await db.close(); }
}, 30000);

type Db = Awaited<ReturnType<typeof openRad085Database>>;
type Group = { id: string; revision: number; code: string };
type Request = { outcome: string; id: string; revision: number };
type Page = { rows: Record<string, unknown>[]; total: number; next: string | null };
const digest = 'a'.repeat(64);
async function fixture() {
 const db = await openRad085Database();
 try {
  for (let n = 1; n <= 34; n++) await db.admin.query("insert into auth.users values($1,$2,now(),'{\"display_name\":\"Synthetic duplicate name\",\"consent_version\":\"2026-10-16\"}')", [id(n), `synthetic${n}@example.test`]);
  await db.admin.query("update public.profiles set status='approved'");
  await db.admin.query("update public.profiles set role='owner' where user_id in ($1,$2)", [id(1), id(34)]);
  await db.admin.query("update public.profiles set status='suspended' where user_id=$1", [id(32)]);
  await db.rpc(1, 'appointment_v1', [id(2), true]); await db.rpc(1, 'appointment_v1', [id(3), true]);
  await db.admin.query('update assess.sharing_policy set required_version=$1,text_digest=$2', ['synthetic-sharing-only/1', digest]);
  for (let n = 4; n <= 31; n++) await db.rpc(n, 'sharing_consent_v1', ['synthetic-sharing-only/1', digest, true]);
  const create = (supervisor = 2, name = 'Synthetic group') => db.rpc<Group>(supervisor, 'supervisor_group_v1', ['create', null, null, name, new Date(Date.now() + 3600000).toISOString()]);
  const revision = async (group: Group) => (await db.admin.query<{ r: number }>('select scope_revision r from assess.groups where id=$1', [group.id])).rows[0]!.r;
  const request = (student: number, group: Group) => db.rpc<Request>(student, 'join_request_v1', [group.code]);
  const join = async (student: number, group: Group, supervisor = 2) => {
   const r = await request(student, group); expect(r.outcome).toBe('pending');
   await db.rpc(supervisor, 'join_decide_v1', [r.id, r.revision, 'approve']); return r;
  };
  const page = (who: number | 'anon' | 'worker', kind: string, group?: Group, after: string | null = null, limit = 20) => db.rpc<Page>(who, 'scope_page_v1', [kind, group?.id ?? null, after, limit]);
  return { ...db, create, revision, request, join, page };
 } catch (error) { await db.close(); throw error; }
}
function draft(n = 200, track = 'mixed', revision = 0) {
 const common = { id: id(n + 1), prompt: 'SYNTHETIC ALPHA', authoring: { author: 'Synthetic', reference: 'Engineering test only', licenceNotes: 'No clinical content', notes: '' } };
 return { schemaVersion: 1, id: id(n), revision, name: 'Synthetic SQL scope fixture', track,
  policy: { durationSeconds: 1800, maxAttempts: 1, gradeVisibility: 'hidden' },
  items: track === 'mixed' ? [{ ...common, type: 'single-choice', maximum: '1', options: [{ id: 'a', text: 'ALPHA' }, { id: 'b', text: 'BETA' }], correctOptionId: 'a' }]
   : [{ ...common, type: 'full-practical', caseRef: { id: 'synthetic-case', version: 'case-v1' }, evaluatorVersion: 'synthetic-evaluator' }] };
}
async function saved(db: Db, group: Group, n = 200, who = 2) {
 return db.rpc<{ id: string; revision: number; document: ReturnType<typeof draft> }>(who, 'draft_save_v1', [group.id, id(n), 0, draft(n)]);
}
/** SQL authorization fixture ONLY, not evidence of clinical review or a working publisher.
 * Uses the privileged isolated test connection. No API can perform these writes.
 */
async function seedBinding(db: Db, draftId: string, revision = 1, version = 300) {
 const r = (await db.admin.query<{ document: ReturnType<typeof draft>; digest: string; writer_id: string }>(`select r.document,r.digest,d.writer_id from assess.authoring_revisions r join assess.authoring_drafts d on d.id=r.draft_id where r.draft_id=$1 and r.revision=$2`, [draftId, revision])).rows[0]!;
 await db.admin.query("insert into assess.versions(id,owner_id,assessment_id,version,name,track,available) values($1,$2,$3,$4,'Synthetic SQL scope only',$5,true)", [id(version), r.writer_id, draftId, String(revision), r.document.track]);
 await db.admin.query("insert into assess.content_submissions values($1,null,'installed')", [id(version)]);
 await db.admin.query("insert into assess.publications values($1,$2,'{}',clock_timestamp())", [id(version), JSON.stringify({ assessment: { schemaVersion: 1, name: 'Synthetic SQL scope only', track: r.document.track } })]);
 await db.admin.query('insert into assess.authoring_publication_links values($1,$2,$3,$4)', [id(version), draftId, revision, r.digest]);
 return id(version);
}
async function practice(db: Db, student: number, n: number) {
 await db.transaction(student, c => c.query(`insert into public.attempts(id,user_id,attempt_no,exam_id,case_id,definition_version,settings,result,locale,finished_at)
 values($1,$2,1,'synthetic','synthetic','v1','{}','{"total":37}','en','2000-01-01')`, [id(n), id(student)]));
}

it('separates appointments from owner power and denies direct access to every new table/helper', async () => {
 const db = await fixture();
 try {
  const g = await db.create(), other = await db.create(3);
  const legacyGroup = await db.rpc<string>(1, 'group_write_v1', [null, 'Synthetic unmanaged group', false]);
  await db.rpc(1, 'group_write_v1', [legacyGroup, null, true]);
  expect((await db.admin.query('select id from assess.groups where id=$1', [legacyGroup])).rows).toEqual([]);

  await expect(db.rpc(2, 'appointment_v1', [id(4), true])).rejects.toMatchObject({ code: '42501' });
  await expect(db.rpc(1, 'appointment_v1', [id(1), true])).rejects.toMatchObject({ code: '22023' });
  for (const who of ['anon', 'worker', 2, 3, 4, 32, 33] as const) {
   await expect(db.rpc(who, 'group_write_v1', [null, 'forbidden', false])).rejects.toMatchObject({ code: '42501' });
   await expect(db.rpc(who, 'scope_page_v1', ['appointments'])).rejects.toMatchObject({ code: '42501' });
  }
  for (const fn of ['owner_surveys_v1', 'set_participant_status']) {
   await expect(db.transaction(2, c => c.query(fn === 'set_participant_status' ? 'select public.set_participant_status($1,$2)' : 'select public.owner_surveys_v1($1)', fn === 'set_participant_status' ? [id(4), 'suspended'] : ['versions']))).rejects.toMatchObject({ code: '42501' });
  }
  expect((await db.page(2, 'groups')).rows.map(r => r.id)).toEqual([g.id]);
  expect((await db.page(3, 'groups')).rows.map(r => r.id)).toEqual([other.id]);
  await expect(db.page(2, 'members', other)).rejects.toMatchObject({ code: '42501' });
  for (const who of ['anon', 'worker', 1, 2, 3, 4, 32, 33] as const) {
   const tables = ['supervisor_appointments', 'membership_periods', 'group_join_codes', 'group_join_requests', 'join_request_throttles', 'sharing_policy', 'sharing_consents', 'practice_recordings', 'authoring_references', 'authoring_drafts', 'authoring_revisions', 'authoring_publication_links', 'assignment_reviews', 'assignment_review_targets', 'assignment_scopes', 'scope_lock'];
   for (const table of tables) for (const sql of [`select * from assess.${table}`, `delete from assess.${table}`]) await expect(db.transaction(who, c => c.query(sql))).rejects.toMatchObject({ code: '42501' });
   await expect(db.rpc(who, 'visible_members_v1', [g.id])).rejects.toMatchObject({ code: '42501' });
   await expect(db.rpc(who, 'linked_version_v1', [id(200), 1])).rejects.toMatchObject({ code: '42501' });
  }
  expect((await db.admin.query<{ relrowsecurity: boolean }>("select relrowsecurity from pg_class where relnamespace='assess'::regnamespace and relkind='r'")).rows.every(r => r.relrowsecurity)).toBe(true);
  await db.transaction(2, async c => { expect((await c.query('select public.is_owner() v')).rows[0].v).toBe(false); });
  await db.rpc(1, 'appointment_v1', [id(2), false]);
  await expect(db.page(2, 'members', g)).rejects.toMatchObject({ code: '42501' });
  expect((await db.page(2, 'groups')).rows).toEqual([]);
  await expect(db.rpc(2, 'supervisor_group_v1', ['create', null, null, 'forbidden', new Date(Date.now() + 10000)])).rejects.toMatchObject({ code: '42501' });
 } finally { await db.close(); }
}, 30000);

it('enforces consent, code rotation/revocation/throttling and join/decision/cancel/leave revisions', async () => {
 const db = await fixture();
 try {
  const g = await db.create();
  await expect(db.rpc(33, 'join_request_v1', [g.code])).rejects.toMatchObject({ code: '42501' });
  await expect(db.rpc(33, 'sharing_consent_v1', ['invented', digest, true])).rejects.toMatchObject({ code: '55000' });
  expect((await db.rpc<{ accepted: boolean }>(33, 'sharing_consent_v1')).accepted).toBe(false);
  const request = await db.request(4, g), retry = await db.request(4, g); expect(retry).toEqual(request);
  expect((await db.page(2, 'members', g)).total).toBe(0);
  await expect(db.rpc(3, 'join_decide_v1', [request.id, request.revision, 'approve'])).rejects.toMatchObject({ code: '42501' });
  await expect(db.rpc(5, 'join_decide_v1', [request.id, request.revision, 'cancel'])).rejects.toMatchObject({ code: '42501' });
  await db.rpc(4, 'join_decide_v1', [request.id, request.revision, 'cancel']);
  await expect(db.rpc(2, 'join_decide_v1', [request.id, request.revision, 'approve'])).rejects.toMatchObject({ code: '40001' });
  const renewed = await db.request(4, g); expect(renewed.revision).toBeGreaterThan(request.revision);
  await db.rpc(2, 'join_decide_v1', [renewed.id, renewed.revision, 'reject']);
  const third = await db.request(4, g); await db.rpc(2, 'join_decide_v1', [third.id, third.revision, 'approve']);
  expect((await db.page(2, 'members', g)).total).toBe(1);
  expect((await db.request(4, g)).outcome).toBe('member');
  await db.rpc(4, 'group_leave_v1', [g.id]); await db.rpc(4, 'group_leave_v1', [g.id]);
  expect((await db.page(2, 'members', g)).total).toBe(0);
  const rotated = await db.rpc<Group>(2, 'supervisor_group_v1', ['rotate', g.id, await db.revision(g)]);
  expect(rotated.code).not.toBe(g.code);
  expect(await db.rpc(5, 'join_request_v1', [g.code])).toEqual({ outcome: 'unavailable' });
  const g2 = { ...g, ...rotated }; const pending = await db.request(5, g2);
  await db.rpc(2, 'supervisor_group_v1', ['revoke-code', g.id, await db.revision(g)]);
  expect(await db.rpc(6, 'join_request_v1', [rotated.code])).toEqual({ outcome: 'unavailable' });
  await db.rpc(2, 'supervisor_group_v1', ['end', g.id, await db.revision(g)]);
  await expect(db.rpc(2, 'join_decide_v1', [pending.id, pending.revision, 'approve'])).rejects.toMatchObject({ code: '55000' });
  await expect(db.page(2, 'members', g)).rejects.toMatchObject({ code: '55000' });
  for (let n = 0; n < 12; n++) expect(await db.rpc(6, 'join_request_v1', ['x'.repeat(64)])).toEqual({ outcome: 'unavailable' });
  expect((await db.admin.query('select used from assess.join_request_throttles where user_id=$1', [id(6)])).rows[0].used).toBe(10);
  await db.admin.query('update assess.sharing_policy set required_version=null,text_digest=null');
  await expect(db.rpc(7, 'sharing_consent_v1', ['synthetic-sharing-only/1', digest, true])).rejects.toMatchObject({ code: '55000' });
 } finally { await db.close(); }
}, 30000);

it('filters membership and Practice before counts/pages and never restores a prior period after rejoin/reappointment', async () => {
 const db = await fixture();
 try {
  const g = await db.create(), other = await db.create(3);
  // Receipt before admission remains hidden even though the client forged finished_at.
  await practice(db, 4, 800);
  for (let who = 4; who <= 27; who++) { await db.join(who, g); await practice(db, who, 800 + who); }
  await db.join(4, other, 3); await practice(db, 4, 900);
  expect((await db.page(2, 'practice', g)).total).toBe(25);
  const first = await db.page(2, 'members', g); expect(first.total).toBe(24); expect(first.rows).toHaveLength(20);
  const second = await db.page(2, 'members', g, first.next); expect(second.rows).toHaveLength(4); expect(second.total).toBe(24);
  expect(new Set([...first.rows, ...second.rows].map(r => r.id)).size).toBe(24);
  expect((await db.page(3, 'members', other)).total).toBe(1);
  expect((await db.page(3, 'practice', other)).rows.map(r => r.id)).toEqual([id(900)]);
  await expect(db.page(2, 'practice', other)).rejects.toMatchObject({ code: '42501' });
  await expect(db.page(2, 'practice', g, null, 101)).rejects.toMatchObject({ code: '22023' });
  await db.rpc(4, 'group_leave_v1', [g.id]);
  expect((await db.page(2, 'practice', g)).total).toBe(23);
  await db.join(4, g); expect((await db.page(2, 'practice', g)).total).toBe(23);
  await practice(db, 4, 901); expect((await db.page(2, 'practice', g)).total).toBe(24);
  await db.rpc(4, 'sharing_consent_v1', [null, null, false]); expect((await db.page(2, 'members', g)).total).toBe(23);
  await db.rpc(4, 'sharing_consent_v1', ['synthetic-sharing-only/1', digest, true]); expect((await db.page(2, 'practice', g)).total).toBe(23);
  await db.admin.query("update public.profiles set status='suspended' where user_id=$1", [id(5)]);
  expect((await db.page(2, 'members', g)).total).toBe(23); expect((await db.page(2, 'practice', g)).total).toBe(22);
  await db.rpc(1, 'appointment_v1', [id(2), false]); await db.rpc(1, 'appointment_v1', [id(2), true]);
  expect((await db.page(2, 'practice', g)).total).toBe(0);
  const periods = (await db.admin.query('select * from assess.membership_periods where group_id=$1 and user_id=$2 order by joined_at', [g.id, id(4)])).rows;
  expect(periods).toHaveLength(2); expect(periods[0].left_at).not.toBeNull(); expect(periods[1].left_at).toBeNull();
  const repeatable = await db.connect('rad085-repeatable');
  await repeatable.query('begin isolation level repeatable read');
  await repeatable.query('set local role authenticated');
  await repeatable.query("select set_config('request.jwt.claim.sub',$1,true)", [id(2)]);
  await expect(repeatable.query("select assess.scope_page_v1('members',$1)", [g.id])).rejects.toMatchObject({ code: '55000' });
  await repeatable.query('rollback');
 } finally { await db.close(); }
}, 30000);

it('keeps mixed and practical drafts separate, private and revision/ref pinned; cannot publish or bind through an API', async () => {
 const db = await fixture();
 try {
  const g = await db.create(), other = await db.create(3);
  const s = await saved(db, g);
  await expect(db.rpc(3, 'draft_page_v1', [g.id, s.id])).rejects.toMatchObject({ code: '42501' });
  await expect(db.rpc(4, 'draft_page_v1', [g.id, s.id])).rejects.toMatchObject({ code: '42501' });
  await expect(db.rpc(2, 'draft_page_v1', [other.id, s.id])).rejects.toMatchObject({ code: '42501' });
  await expect(db.rpc(2, 'draft_save_v1', [g.id, s.id, 0, draft()])).rejects.toMatchObject({ code: '40001' });
  const updated = await db.rpc<{ revision: number }>(2, 'draft_save_v1', [g.id, s.id, 1, { ...s.document, name: 'Synthetic updated' }]); expect(updated.revision).toBe(2);
  await expect(db.rpc(2, 'draft_save_v1', [g.id, s.id, 1, s.document])).rejects.toMatchObject({ code: '40001' });
  await db.admin.query("insert into assess.authoring_references values('synthetic-case','full-practical','case-v1','synthetic-case','case-v1','synthetic-evaluator',true)");
  const practical = draft(210, 'full-practical'); const refs = [{ key: 'synthetic-case', revision: 'case-v1' }];
  await db.rpc(2, 'draft_save_v1', [g.id, practical.id, 0, practical, JSON.stringify(refs)]);
  await expect(db.rpc(2, 'draft_save_v1', [g.id, id(220), 0, { ...practical, id: id(220), items: draft().items }, '[]'])).rejects.toMatchObject({ code: '22023' });
  await expect(db.rpc(2, 'draft_save_v1', [g.id, id(221), 0, { ...practical, id: id(221), items: practical.items.map(i => ({ ...i, maximum: '1' })) }, JSON.stringify(refs)])).rejects.toMatchObject({ code: '22023' });
  await expect(db.rpc(2, 'draft_save_v1', [g.id, id(222), 0, { ...practical, id: id(222), items: practical.items.map(i => ({ ...i, caseRef: { id: 'synthetic-case', version: 'stale' } })) }, JSON.stringify(refs)])).rejects.toMatchObject({ code: '55000' });
  await expect(db.rpc(2, 'draft_save_v1', [g.id, id(223), 0, { ...draft(223), items: Array(201).fill(draft().items[0]) }])).rejects.toMatchObject({ code: '22023' });
  await expect(db.rpc(2, 'draft_save_v1', [g.id, id(224), 0, { ...draft(224), name: 'x'.repeat(131073) }])).rejects.toMatchObject({ code: '22023' });
  await expect(db.rpc(2, 'assignment_prepare_v1', [g.id, s.id, 2, id(400)])).rejects.toMatchObject({ code: '55000' });
  await expect(db.rpc(2, 'content_submit_v1', [{}])).rejects.toMatchObject({ code: '42501' });
  await expect(db.rpc(2, 'content_install_v1', [id(300), {}])).rejects.toMatchObject({ code: '42501' });
  expect((await db.admin.query('select count(*)::int n from assess.publications')).rows[0].n).toBe(0);
 } finally { await db.close(); }
}, 30000);

it('atomically freezes assignment scope/version/targets, revalidates changes, supports replay and limits close to issuer', async () => {
 const db = await fixture();
 try {
  const g = await db.create(); for (let n = 4; n <= 27; n++) await db.join(n, g);
  const s = await saved(db, g); await seedBinding(db, s.id);
  const prepare = (operation: number) => db.rpc<{ targetCount: number; token: string; targetDigest: string }>(2, 'assignment_prepare_v1', [g.id, s.id, 1, id(operation)]);
  const review = await prepare(400); expect(review.targetCount).toBe(24); expect(review.targetDigest).toMatch(/^[a-f0-9]{64}$/);
  const retried = await prepare(400); expect({ ...retried, serverNow: null }).toEqual({ ...review, serverNow: null });
  const first = await db.rpc<Page>(2, 'assignment_targets_v1', [review.token, null, 20]); expect(first.rows).toHaveLength(20);
  expect((await db.rpc<Page>(2, 'assignment_targets_v1', [review.token, first.next, 20])).rows).toHaveLength(4);
  await expect(db.rpc(3, 'assignment_confirm_v1', [review.token])).rejects.toMatchObject({ code: '42501' });
  await db.rpc(4, 'group_leave_v1', [g.id]);
  for (const fn of ['assignment_confirm_v1', 'assignment_targets_v1']) await expect(db.rpc(2, fn, [review.token])).rejects.toMatchObject({ code: '40001' });
  await expect(prepare(400)).rejects.toMatchObject({ code: '40001' });
  const second = await prepare(401); expect(second.targetCount).toBe(23);
  await db.admin.query("update assess.assignment_reviews set expires_at=clock_timestamp()-interval '1 second' where id=$1", [id(401)]);
  await expect(db.rpc(2, 'assignment_confirm_v1', [second.token])).rejects.toMatchObject({ code: '55000' });
  const third = await prepare(402);
  await db.rpc(5, 'sharing_consent_v1', [null, null, false]);
  await expect(db.rpc(2, 'assignment_confirm_v1', [third.token])).rejects.toMatchObject({ code: '40001' });
  await db.rpc(5, 'sharing_consent_v1', ['synthetic-sharing-only/1', digest, true]);
  const fourth = await prepare(403);
  const aid = await db.rpc<string>(2, 'assignment_confirm_v1', [fourth.token]);
  expect(await db.rpc(2, 'assignment_confirm_v1', [fourth.token])).toBe(aid);
  const targets = (await db.admin.query('select user_id from assess.targets where assignment_id=$1 order by user_id', [aid])).rows;
  expect(targets).toHaveLength(23);
  await db.rpc(6, 'group_leave_v1', [g.id]); await db.join(28, g);
  expect((await db.admin.query('select user_id from assess.targets where assignment_id=$1 order by user_id', [aid])).rows).toEqual(targets);
  expect(await db.rpc(6, 'assigned_version_v1', [aid])).toMatchObject({ assignmentId: aid });
  await expect(db.rpc(28, 'assigned_version_v1', [aid])).rejects.toMatchObject({ code: '42501' });
  await expect(db.rpc(3, 'assignment_close_v2', [aid, 1])).rejects.toMatchObject({ code: '42501' });
  await expect(db.rpc(1, 'assignment_close_v2', [aid, 1])).rejects.toMatchObject({ code: '42501' });
  await expect(db.rpc(2, 'assignment_close_v2', [aid, 99])).rejects.toMatchObject({ code: '40001' });
  expect((await db.rpc<Page>(2, 'assignment_page_v2', [g.id])).rows[0]).toMatchObject({ id: aid, closed_at: null });
  await db.rpc(2, 'assignment_close_v2', [aid, 1]); await db.rpc(2, 'assignment_close_v2', [aid, 1]);
  expect((await db.rpc<Page>(2, 'assignment_page_v2', [g.id])).rows[0]?.closed_at).not.toBeNull();
  expect((await db.admin.query('select user_id from assess.targets where assignment_id=$1 order by user_id', [aid])).rows).toEqual(targets);
  await db.admin.query("insert into assess.versions(id,owner_id,assessment_id,version,name,track,available) values($1,$2,$1,'1','Synthetic owner','mixed',true)", [id(350), id(1)]);
  const ownerAssignment = await db.rpc<string>(1, 'assign_v1', [id(350), [id(4)], []]);
  expect((await db.rpc<Page>(1, 'assignment_page_v2')).rows[0]).toMatchObject({ id: ownerAssignment, closed_at: null });
  await db.rpc(1, 'assignment_close_v2', [ownerAssignment, 1]);
  expect((await db.rpc<Page>(1, 'assignment_page_v2')).rows[0]?.closed_at).not.toBeNull();
 } finally { await db.close(); }
}, 30000);

async function held(db: Db, who: number) {
 const c = await db.connect('rad085-held'); await c.query('begin'); await c.query('set local role authenticated');
 await c.query("select set_config('request.jwt.claim.sub',$1,true)", [id(who)]); return c;
}
async function blocked(db: Db, label: string) {
 const deadline = Date.now() + 3000;
 do {
  const rows = (await db.admin.query<{ waiting: boolean }>("select wait_event_type='Lock' and cardinality(pg_blocking_pids(pid))>0 waiting from pg_stat_activity where application_name=$1", [label])).rows;
  if (rows.some(r => r.waiting)) return;
  await new Promise(resolve => setTimeout(resolve, 5));
 } while (Date.now() < deadline);
 throw Error(`No PostgreSQL lock wait observed for ${label}`);
}
// Both connections are real PostgreSQL sessions; a measured pg_blocking_pids wait,
// rather than serial awaits or elapsed delay, proves each serialization boundary.
it('serializes readers with accept/leave/end/revoke in both orders on independent PostgreSQL connections', async () => {
 const db = await fixture();
 try {
  const g = await db.create(); const req = await db.request(4, g);
  const acceptance = await held(db, 2);
  await acceptance.query('select assess.join_decide_v1($1,$2,$3)', [req.id, req.revision, 'approve']);
  const waitingRead = db.rpc<Page>(2, 'scope_page_v1', ['members', g.id], 'rad085-after-accept');
  await blocked(db, 'rad085-after-accept'); await acceptance.query('commit'); expect((await waitingRead).total).toBe(1);
  await practice(db, 4, 810);
  const read = await held(db, 2); expect((await read.query("select assess.scope_page_v1('practice',$1) v", [g.id])).rows[0].v.total).toBe(1);
  const leave = db.rpc(4, 'group_leave_v1', [g.id], 'rad085-leave-wait'); await blocked(db, 'rad085-leave-wait');
  await read.query('commit'); await leave; expect((await db.page(2, 'practice', g)).total).toBe(0);
  await db.join(4, g); expect((await db.page(2, 'practice', g)).total).toBe(0);
  const leaving = await held(db, 4); await leaving.query('select assess.group_leave_v1($1)', [g.id]);
  const afterLeave = db.rpc<Page>(2, 'scope_page_v1', ['members', g.id], 'rad085-after-leave');
  await blocked(db, 'rad085-after-leave'); await leaving.query('commit'); expect((await afterLeave).total).toBe(0);
  const readEnd = await held(db, 2); await readEnd.query("select assess.scope_page_v1('members',$1)", [g.id]);
  const end = db.rpc(2, 'supervisor_group_v1', ['end', g.id, await db.revision(g)], 'rad085-end-wait');
  await blocked(db, 'rad085-end-wait'); await readEnd.query('commit'); await end;
  await expect(db.page(2, 'members', g)).rejects.toMatchObject({ code: '55000' });
  const g2 = await db.create(); await db.join(5, g2);
  const readRevoke = await held(db, 2); await readRevoke.query("select assess.scope_page_v1('members',$1)", [g2.id]);
  const revoke = db.rpc(1, 'appointment_v1', [id(2), false], 'rad085-revoke-wait');
  await blocked(db, 'rad085-revoke-wait'); await readRevoke.query('commit'); await revoke;
  await expect(db.page(2, 'members', g2)).rejects.toMatchObject({ code: '42501' });
  await db.rpc(1, 'appointment_v1', [id(2), true]);
  const revoking = await held(db, 1); await revoking.query('select assess.appointment_v1($1,false)', [id(2)]);
  // Observe and handle the expected denial before releasing the writer (no unhandled rejection).
  const afterRevoke = db.rpc(2, 'scope_page_v1', ['members', g2.id], 'rad085-after-revoke').then(value => ({ value, code: '' }), (error: { code: string }) => ({ value: null, code: error.code }));
  await blocked(db, 'rad085-after-revoke'); await revoking.query('commit'); expect((await afterRevoke).code).toBe('42501');
  await db.rpc(1, 'appointment_v1', [id(2), true]);
  const ending = await held(db, 2); await ending.query('select assess.supervisor_group_v1($1,$2,$3)', ['end', g2.id, await db.revision(g2)]);
  const afterEnd = db.rpc(2, 'scope_page_v1', ['members', g2.id], 'rad085-after-end').then(value => ({ value, code: '' }), (error: { code: string }) => ({ value: null, code: error.code }));
  await blocked(db, 'rad085-after-end'); await ending.query('commit'); expect((await afterEnd).code).toBe('55000');
 } finally { await db.close(); }
}, 30000);

it('serializes concurrent draft saves, decisions and confirm/replay against membership/revocation changes', async () => {
 const db = await fixture();
 try {
  const g = await db.create(); await db.join(4, g);
  const s = await saved(db, g); await seedBinding(db, s.id);
  const firstWriter = await held(db, 2);
  await firstWriter.query('select assess.draft_save_v1($1,$2,$3,$4)', [g.id, s.id, 1, s.document]);
  const conflict = db.rpc(2, 'draft_save_v1', [g.id, s.id, 1, s.document], 'rad085-draft-wait').then(() => '', (error: { code: string }) => error.code);
  await blocked(db, 'rad085-draft-wait'); await firstWriter.query('commit'); expect(await conflict).toBe('40001');
  // A separate current revision requires its own independently installed binding.
  await seedBinding(db, s.id, 2, 301);
  const request = await db.request(5, g); const decision = await held(db, 2);
  await decision.query('select assess.join_decide_v1($1,$2,$3)', [request.id, request.revision, 'approve']);
  const duplicate = db.rpc(2, 'join_decide_v1', [request.id, request.revision, 'approve'], 'rad085-decision-wait').then(() => '', (error: { code: string }) => error.code);
  await blocked(db, 'rad085-decision-wait'); await decision.query('commit'); expect(await duplicate).toBe('40001');
  await db.rpc(2, 'assignment_prepare_v1', [g.id, s.id, 2, id(410)]);
  const leaving = await held(db, 4); await leaving.query('select assess.group_leave_v1($1)', [g.id]);
  const stale = db.rpc(2, 'assignment_confirm_v1', [id(410)], 'rad085-confirm-leave').then(() => '', (error: { code: string }) => error.code);
  await blocked(db, 'rad085-confirm-leave'); await leaving.query('commit'); expect(await stale).toBe('40001');
  expect((await db.admin.query('select count(*)::int n from assess.assignments')).rows[0].n).toBe(0);
  await db.rpc(2, 'assignment_prepare_v1', [g.id, s.id, 2, id(411)]);
  const confirming = await held(db, 2); const aid = (await confirming.query('select assess.assignment_confirm_v1($1) v', [id(411)])).rows[0].v;
  const replay = db.rpc<string>(2, 'assignment_confirm_v1', [id(411)], 'rad085-confirm-replay');
  await blocked(db, 'rad085-confirm-replay'); await confirming.query('commit'); expect(await replay).toBe(aid);
  expect((await db.admin.query('select count(*)::int n from assess.assignments')).rows[0].n).toBe(1);
  const before = (await db.admin.query('select user_id from assess.targets where assignment_id=$1', [aid])).rows;
  expect(before).toEqual([{ user_id: id(5) }]);
  await db.rpc(5, 'group_leave_v1', [g.id]); expect((await db.admin.query('select user_id from assess.targets where assignment_id=$1', [aid])).rows).toEqual(before);
  await db.join(6, g);
  await db.rpc(2, 'assignment_prepare_v1', [g.id, s.id, 2, id(412)]);
  const revoking = await held(db, 1); await revoking.query('select assess.appointment_v1($1,false)', [id(2)]);
  const denied = db.rpc(2, 'assignment_confirm_v1', [id(412)], 'rad085-confirm-revoke').then(() => '', (error: { code: string }) => error.code);
  await blocked(db, 'rad085-confirm-revoke'); await revoking.query('commit'); expect(await denied).toBe('42501');
 } finally { await db.close(); }
}, 30000);

it('expanded schema rejects historical staging and preserves legacy ownership, paging and closure semantics', async () => {
 const db=await fixture();
 try {
  const results=await db.admin.query(readFileSync('supabase/checks/assess-staging-ready.sql','utf8'));
  const batches=Array.isArray(results)?results:[results];
  const witness=batches.flatMap(r=>r.rows).find(r=>r.contract==='assess-staging-catalogue/1');
  expect(witness.catalogue_ready).toBe(false); expect(witness.no_unreviewed_relations).toBe(false);
  expect(witness.runtime_or_launch_verified).toBe(false);
  const legacy=await db.rpc<string>(1,'group_write_v1',[null,'Legacy synthetic',false]);
  await db.rpc(1,'members_write_v1',[legacy,[id(4),id(5)],true]);
  expect(await db.rpc(1,'owner_page_v1',['members',legacy,'',null,1])).toMatchObject({rows:[{id:id(4)}],next:id(4)});
  await expect(db.rpc(34,'members_write_v1',[legacy,[id(6)],true])).rejects.toMatchObject({code:'42501'});
  await db.rpc(1,'members_write_v1',[legacy,[id(4)],false]);
  expect((await db.admin.query('select period_id from assess.memberships where group_id=$1',[legacy])).rows).toEqual([{period_id:null}]);
  await db.rpc(1,'group_write_v1',[legacy,null,true]);
  expect((await db.admin.query('select id from assess.groups where id=$1',[legacy])).rows).toEqual([]);
 } finally {await db.close();}
},30000);

async function assignedFixture(db: Awaited<ReturnType<typeof fixture>>, base=600) {
 const group=await db.create(); await db.join(4,group); const d=await saved(db,group,base);
 await seedBinding(db,d.id,1,base+10); await db.rpc(2,'assignment_prepare_v1',[group.id,d.id,1,id(base+20)]);
 const assignment=await db.rpc<string>(2,'assignment_confirm_v1',[id(base+20)]);
 await db.rpc(4,'consent_v2',['assess-pilot-2026-10-20-v2']);
 return {group,d,assignment};
}
async function graded(db: Db, assignment:string,n:number, visibility='hidden', offset='0 seconds', expiry='1 hour') {
 await db.admin.query(`insert into assess.sessions(id,assignment_id,user_id,ordinal,state,started_at,submitted_at,expires_at)
 values($1,$2,$3,$4,'graded',clock_timestamp()+$5::interval,clock_timestamp(),clock_timestamp()+$6::interval)`,[id(n),assignment,id(4),n,offset,expiry]);
 await db.admin.query("insert into assess.results values($1,7,2,10,'SYNTHETIC', 'mixed',$2)",[id(n),visibility]);
}
it('results enforce issuer, current period, start window, hidden grades and server expiry before count and paging', async()=>{
 const db=await fixture();try {
  const {group,assignment}=await assignedFixture(db);
  await graded(db,assignment,700); await graded(db,assignment,701,'after-submission');
  await graded(db,assignment,702,'after-submission','-1 day'); await graded(db,assignment,703,'after-submission','0 seconds','-1 second');
  const result=await db.rpc<Page>(2,'supervisor_results_v1',[group.id,null,1]);
  expect(result.total).toBe(2); expect(result.rows).toHaveLength(1);expect(result.rows[0]?.grade).toEqual({visibility:'hidden'});
  const next=await db.rpc<Page>(2,'supervisor_results_v1',[group.id,result.next,1]);
  expect(next.total).toBe(2);expect(next.rows[0]?.grade).toEqual({visibility:'shown',earnedNumerator:'7',earnedDenominator:'2',maximum:'10'});
  await expect(db.rpc(3,'supervisor_results_v1',[group.id])).rejects.toMatchObject({code:'42501'});
  for(const who of [4,32,'anon','worker'] as const)await expect(db.rpc(who,'supervisor_results_v1',[group.id])).rejects.toMatchObject({code:'42501'});
  await db.rpc(4,'group_leave_v1',[group.id]);expect((await db.rpc<Page>(2,'supervisor_results_v1',[group.id])).total).toBe(0);
  await db.join(4,group);expect((await db.rpc<Page>(2,'supervisor_results_v1',[group.id])).total).toBe(0);
  await db.rpc(1,'appointment_v1',[id(2),false]); await expect(db.rpc(2,'supervisor_results_v1',[group.id])).rejects.toMatchObject({code:'42501'});
 }finally{await db.close();}
},30000);

it('revalidates publication/reference changes and rolls back partial target installation; deletion never bypasses terminal retention',async()=>{
 const db=await fixture();try{
  const group=await db.create();await db.join(4,group);const d=await saved(db,group);
  await seedBinding(db,d.id); const prepare=(n:number)=>db.rpc(2,'assignment_prepare_v1',[group.id,d.id,1,id(n)]);
  await prepare(450);await db.admin.query('update assess.versions set available=false where id=$1',[id(300)]);
  await expect(db.rpc(2,'assignment_confirm_v1',[id(450)])).rejects.toMatchObject({code:'55000'});
  await db.admin.query('update assess.versions set available=true where id=$1',[id(300)]);
  await db.admin.query("insert into assess.authoring_references values('part-synthetic','simulator-part','p1','synthetic-case','case-v1','synthetic-evaluator',true)");
  const part={...draft(230),items:[{id:id(231),type:'simulator-part',prompt:'SYNTHETIC',maximum:'1',partId:'part-synthetic',authoring:{author:'Synthetic',reference:'Engineering only',licenceNotes:'No clinical content',notes:''}}]};
  const refs=JSON.stringify([{key:'part-synthetic',revision:'p1'}]);
  await db.rpc(2,'draft_save_v1',[group.id,part.id,0,part,refs]);await seedBinding(db,part.id,1,310);
  await db.rpc(2,'assignment_prepare_v1',[group.id,part.id,1,id(451)]);
  await db.admin.query("update assess.authoring_references set revision='p2'");
  await expect(db.rpc(2,'assignment_confirm_v1',[id(451)])).rejects.toMatchObject({code:'55000'});
  await prepare(452);
  await db.admin.query(`create function assess.synthetic_fail_target() returns trigger language plpgsql as $$begin raise exception 'synthetic target failure' using errcode='23514'; end$$;
   create trigger synthetic_target_failure before insert on assess.targets for each row execute function assess.synthetic_fail_target()`);
  await expect(db.rpc(2,'assignment_confirm_v1',[id(452)])).rejects.toMatchObject({code:'23514'});
  expect((await db.admin.query('select count(*)::int n from assess.assignments')).rows[0].n).toBe(0);
  expect((await db.admin.query('select assignment_id from assess.assignment_reviews where id=$1',[id(452)])).rows[0].assignment_id).toBeNull();
  await db.admin.query('drop trigger synthetic_target_failure on assess.targets;drop function assess.synthetic_fail_target()');
  const aid=await db.rpc<string>(2,'assignment_confirm_v1',[id(452)]);
  await db.rpc(2,'assignment_close_v2',[aid,1]);
  await expect(db.admin.query('delete from assess.assignments where id=$1',[aid])).rejects.toMatchObject({code:'42501'});
  await db.admin.query('delete from auth.users where id=$1',[id(4)]);
  expect((await db.admin.query('select * from assess.memberships where user_id=$1',[id(4)])).rows).toEqual([]);
  expect((await db.admin.query('select * from assess.assignment_review_targets where user_id=$1',[id(4)])).rows).toEqual([]);
  expect((await db.admin.query('select * from assess.targets where user_id=$1',[id(4)])).rows).toEqual([]);
 }finally{await db.close();}
},30000);

it('server expiry after waiting and status/policy changes block confirmation without side effects',async()=>{
 const db=await fixture();try{
  const g=await db.create();await db.join(4,g);const d=await saved(db,g);await seedBinding(db,d.id);
  for(const n of [460,461,462]) await db.rpc(2,'assignment_prepare_v1',[g.id,d.id,1,id(n)]);
  const lock=await held(db,2);await lock.query("select assess.scope_page_v1('members',$1)",[g.id]);
  const pending=db.rpc(2,'assignment_confirm_v1',[id(460)],'rad085-expiry-wait').then(()=>'',(e:{code:string})=>e.code);
  await blocked(db,'rad085-expiry-wait');
  await db.admin.query("update assess.assignment_reviews set expires_at=clock_timestamp()-interval '1 second' where id=$1",[id(460)]);
  await lock.query('commit');expect(await pending).toBe('55000');
  await db.admin.query("update public.profiles set status='suspended' where user_id=$1",[id(4)]);
  await expect(db.rpc(2,'assignment_confirm_v1',[id(461)])).rejects.toMatchObject({code:'40001'});
  await db.admin.query("update public.profiles set status='approved' where user_id=$1",[id(4)]);
  await db.admin.query("update assess.sharing_policy set required_version='synthetic-policy/2'");
  await expect(db.rpc(2,'assignment_confirm_v1',[id(462)])).rejects.toMatchObject({code:'40001'});
  expect((await db.admin.query('select count(*)::int n from assess.assignments')).rows[0].n).toBe(0);
 }finally{await db.close();}
},30000);

it('historical trial source attestation accepts only its exact old schema and rejects the expanded schema',()=>{
 const code=`import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';
 import {openLocalDatabase} from './scripts/assess/local-database.mjs';
 import {buildTrialInstallPackage} from './scripts/assess/trial-install.mjs';
 const db=await openLocalDatabase('pglite',{through:'pre-rad085'});
 try {await db.exec("create role assess_job_a nologin noinherit valid until '2000-01-01';grant assess_worker to assess_job_a");const files=await buildTrialInstallPackage();await db.exec(files['preinstall.sql']);await db.exec('rollback');
 for(const f of ['20261026000100_assess_supervisor_scope.sql','20261026000200_assess_authoring_drafts.sql','20261026000300_assess_assignment_review.sql'])await db.exec(readFileSync('supabase/migrations/'+f,'utf8'));
 await assert.rejects(()=>db.exec(files['preinstall.sql']),{code:'55000'});await db.exec('rollback');
 }finally{await db.close();}`;
 const r=spawnSync(process.execPath,['--input-type=module','-e',code],{encoding:'utf8',timeout:20000});expect(r.status,r.stderr).toBe(0);
},30000);

it('draft revisions, ended scope and suspended/revoked staff deny pending confirmation; managed legacy writes cannot bypass periods',async()=>{
 const db=await fixture();try{
  const g=await db.create();await db.join(4,g);const d=await saved(db,g);await seedBinding(db,d.id);
  await db.rpc(2,'assignment_prepare_v1',[g.id,d.id,1,id(470)]);
  await db.rpc(2,'draft_save_v1',[g.id,d.id,1,d.document]);
  await expect(db.rpc(2,'assignment_confirm_v1',[id(470)])).rejects.toMatchObject({code:'40001'});
  await seedBinding(db,d.id,2,301);await db.rpc(2,'assignment_prepare_v1',[g.id,d.id,2,id(471)]);
  await db.admin.query("update public.profiles set role='owner' where user_id=$1",[id(2)]);
  await expect(db.rpc(2,'members_write_v1',[g.id,[id(5)],true])).rejects.toMatchObject({code:'42501'});
  await expect(db.rpc(2,'group_write_v1',[g.id,null,true])).rejects.toMatchObject({code:'42501'});
  await db.admin.query("update public.profiles set role='participant',status='suspended' where user_id=$1",[id(2)]);
  await expect(db.rpc(2,'assignment_confirm_v1',[id(471)])).rejects.toMatchObject({code:'42501'});
  await db.rpc(1,'appointment_v1',[id(2),false]);
  await db.admin.query("update public.profiles set status='approved' where user_id=$1",[id(2)]);
  await db.rpc(1,'appointment_v1',[id(2),true]);
  await expect(db.rpc(2,'assignment_confirm_v1',[id(471)])).rejects.toMatchObject({code:'40001'});
  await db.rpc(2,'assignment_prepare_v1',[g.id,d.id,2,id(472)]);
  await db.rpc(2,'supervisor_group_v1',['end',g.id,await db.revision(g)]);
  await expect(db.rpc(2,'assignment_confirm_v1',[id(472)])).rejects.toMatchObject({code:'55000'});
  expect((await db.admin.query('select count(*)::int n from assess.assignments')).rows[0].n).toBe(0);
 }finally{await db.close();}
},30000);

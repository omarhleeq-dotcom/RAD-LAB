/** S2 behavioural witnesses on isolated PostgreSQL; no provider or secret connection. */
import { expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { fixture, id, type Db, type Session } from './selfservice-fixture';
import { mixedFixture } from '../../../scripts/assess/d-fixture';
import { practicalFixture } from '../../../scripts/assess/e-fixture';
import type { AssessmentPublicationV2, GradingClaimV2 } from './server-contracts-v2';
import { validatePublicationV2, leafValues, settingsSpec } from './server-validation';
import { gradePublicationV2 } from './server-grader-v2';
import { CASES } from '@/data/cases';
import { createEmergencyPort } from '@/features/emergency/browser-adapter';

const { productionShapeSql } = await import('../../../scripts/assess/' + 'rad085-production-shape.mjs') as { productionShapeSql: () => string };
const migration = '20261105000300_rad105_selfservice_s2.sql';
const sql = (f: string) => readFileSync('supabase/migrations/' + f, 'utf8');
const iso = (ms: number) => new Date(Date.now() + ms).toISOString();
const start = (db: Db, op: number, assignment = id(51)) => db.rpc<Session>(3, 'start_v2', [assignment, id(op)]);
const revision = async (db: Db) => (await db.admin.query('select revision from assess.assignments where id=$1', [id(51)])).rows[0].revision as number;
async function setup() {
 const db = await fixture(['20261030000700_rad062_manual_grading.sql', '20261030000800_rad062_erasure_operations.sql',
  '20261102000100_rad062_supervisor_grading_authorization.sql']);
 try {
  await db.admin.query('create role assess_job_a nologin;create role assess_job_b nologin');
  for (const f of ['20261102000200_rad059_emergency_alternate.sql']) await db.admin.query(sql(f));
  await db.admin.query(productionShapeSql());
  await db.admin.query(sql('20261102000300_rad085_rights_write_disclosures.sql'));
  for(const f of ['20261105000100_rad105_windows.sql','20261105000200_rad105_witness.sql',migration]) await db.admin.query(sql(f));
  await db.admin.query("update public.profiles set consent_version='2026-10-15',consented_at=clock_timestamp()");
  await db.rpc(3, 'consent_v3', ['assess-written-2026-11-02-v3']);
  return db;
 } catch (e) { await db.close(); throw e; }
}

it('S2 installs closed, retains private tables, exact worker operations, identity inventory and pool code', async () => {
 const db = await setup();
 try {
  expect((await db.admin.query('select enabled from assess.assessment_notify_settings')).rows).toEqual([{ enabled: false }]);
  expect((await db.admin.query('select inventory=assess.d3_fk_inventory_v1() ok from assess.erasure_fk_contract')).rows).toEqual([{ ok: true }]);
  for (const name of ['all_students_assignments', 'assignment_accommodations', 'stop_active_attempts', 'assessment_notices', 'assessment_notify_settings']) {
   expect((await db.admin.query("select has_table_privilege('authenticated',$1,'SELECT,INSERT,UPDATE,DELETE') allowed", ['assess.' + name])).rows[0].allowed).toBe(false);
  }
  await expect(db.rpc(3, 'quiz_permission_v1', [id(2), true])).rejects.toMatchObject({ code: '42501' });
  await expect(db.rpc(2, 'notice_switch_v1', [true])).rejects.toMatchObject({ code: '42501' });
  expect(await db.rpc(2, 'pool_recommendation_v1', [id(50)])).toEqual({ version: 1, selected: 2, available: 3, recommended: true, defaultWindowSeconds: 7200, maxWindowSeconds: 604800 });
  await expect(db.rpc(3, 'pool_recommendation_v1', [id(50)])).rejects.toMatchObject({ code: '42501' });
  await db.rpc(2, 'assignment_schedule_v2', [id(51), await revision(db), iso(60000), null]);
  await db.transaction(1, c => c.query('select public.emergency_alternate_set_v1($1)', [id(2)]));
  const port = createEmergencyPort(async name => {
   if (name !== 'emergency_alternate_read_v1') throw Error('unexpected test RPC');
   return db.transaction(1, async c => (await c.query('select public.emergency_alternate_read_v1() v')).rows[0].v);
  });
  expect((await port.owner()).audit.map(r => r.action)).toEqual(['appoint']); // actual unchanged browser parser
  expect(await db.rpc(1, 'selfservice_audit_v1', [null, 50])).toEqual([expect.objectContaining({ action: 'window' })]);
  await expect(db.rpc(2, 'selfservice_audit_v1', [null, 50])).rejects.toMatchObject({ code: '42501' });
 } finally { await db.close(); }
}, 300000);

it('C4: separate audience, owner always, permission defaults OFF/revocation, server recipients, replay, scoped schedule/read/close and audit', async () => {
 const db = await setup();
 try {
  // Trusted synthetic installation uses the existing immutable author-revision association.
  await db.admin.query("insert into assess.content_submissions(version_id,state) values($1,'installed')", [id(50)]);
  await db.admin.query('insert into assess.authoring_publication_links select $1,draft_id,revision,digest from assess.authoring_revisions order by revision desc limit 1', [id(50)]);
  for (let n = 4; n <= 7; n++) await db.admin.query('insert into auth.users(id,email,raw_user_meta_data) values($1,$2,$3)', [id(n), `synthetic${n}@example.invalid`, { display_name: 'SYNTHETIC Student Name', consent_version: '2026-10-15' }]);
  await db.admin.query("update public.profiles set status='approved' where user_id in ($1,$2,$3)", [id(4), id(5), id(7)]);
  for (const n of [4, 6, 7]) await db.admin.query("insert into assess.consents(user_id,version) values($1,'assess-written-2026-11-02-v3')", [id(n)]);
  await db.admin.query('update public.profiles set consented_at=null where user_id=$1', [id(7)]);
  const args = [id(50), id(60), iso(60000), null];
  await expect(db.rpc(2, 'quiz_publish_v1', args)).rejects.toMatchObject({ code: '42501' });
  await db.rpc(1, 'quiz_permission_v1', [id(2), true]);
  const aid = await db.rpc<string>(2, 'quiz_publish_v1', args); expect(aid).toBe(id(60));
  expect(await db.rpc(2, 'quiz_publish_v1', args)).toBe(aid);
  expect((await db.admin.query('select user_id from assess.targets where assignment_id=$1 order by user_id', [aid])).rows).toEqual([{ user_id: id(3) }, { user_id: id(4) }]);
  expect((await db.admin.query('select source_group_ids,audience from assess.assignments where id=$1', [aid])).rows[0]).toEqual({ source_group_ids: [], audience: 'all-students' });
  // Group assignment remains separate even for the identical immutable version and issuer.
  expect((await db.admin.query('select count(*)::int n from assess.assignments where version_id=$1', [id(50)])).rows[0].n).toBe(2);
  await expect(db.admin.query('insert into assess.assignments(owner_id,version_id) values($1,$2)', [id(2), id(50)])).rejects.toMatchObject({ code: '23505' });
  expect(await db.rpc(3, 'my_windows_v1', [[aid]])).toHaveLength(1);
  expect(await db.rpc(2, 'quiz_page_v1', [null, 50])).toHaveLength(1);
  await expect(db.rpc(3, 'quiz_page_v1', [null, 50])).rejects.toMatchObject({ code: '42501' });
  await expect(db.rpc(3, 'assignment_status_v1', [aid, null, 50])).rejects.toMatchObject({ code: '42501' });
  await db.rpc(1, 'quiz_permission_v1', [id(2), false]);
  await expect(db.rpc(2, 'quiz_publish_v1', args)).rejects.toMatchObject({ code: '42501' });
  // Owner needs no all-students grant or supervisor appointment.
  expect(await db.rpc(1, 'quiz_publish_v1', [id(50), id(61), iso(120000), null])).toBe(id(61));
  await db.rpc(2, 'assignment_schedule_v2', [aid, 1, iso(120000), null]);
  await expect(db.rpc(3, 'quiz_close_v1', [aid, 2])).rejects.toMatchObject({ code: '42501' });
  await db.rpc(2, 'quiz_close_v1', [aid, 2]);
  await db.rpc(1, 'quiz_permission_v1', [id(2), true]);
  await db.rpc(1, 'appointment_v1', [id(2), false]);
  await db.rpc(1, 'appointment_v1', [id(2), true]);
  expect((await db.admin.query('select all_students from assess.supervisor_appointments where user_id=$1', [id(2)])).rows[0].all_students).toBe(false);
  expect((await db.admin.query("select count(*)::int n from emergency.audit where action='quiz-publish'")).rows[0].n).toBe(2);
 } finally { await db.close(); }
}, 300000);

it('notification dispatch: OFF before secret access, targeted eligibility, consent revocation, rescheduling, cancellation and deduplication', async () => {
 const db = await setup();
 try {
  // Replace only the private provider boundary with a synthetic sink; no Vault or network exists.
  await db.admin.query(`create table public.synthetic_notices(email text,opens_at timestamptz);
   create or replace function assess.notice_post_v1(p_email text,p_opens timestamptz) returns bigint
   language plpgsql security definer set search_path='' set timezone='UTC' as $$begin
    insert into public.synthetic_notices values(p_email,p_opens); return 105; end$$;`);
  await db.rpc(2, 'assignment_schedule_v2', [id(51), await revision(db), iso(600000), null]);
  expect((await db.admin.query('select assess.notice_dispatch_v1() n')).rows[0].n).toBe(0);
  expect((await db.admin.query('select count(*)::int n from public.synthetic_notices')).rows[0].n).toBe(0);
  await db.rpc(2, 'consent_v3', ['assess-written-2026-11-02-v3']); // eligible but never targeted
  await db.rpc(1, 'notice_switch_v1', [true]);
  await db.admin.query("delete from assess.consents where user_id=$1 and version='assess-written-2026-11-02-v3'", [id(3)]);
  expect((await db.admin.query('select assess.notice_dispatch_v1() n')).rows[0].n).toBe(0);
  await db.rpc(3, 'consent_v3', ['assess-written-2026-11-02-v3']);
  await db.admin.query("update public.profiles set status='pending' where user_id=$1", [id(3)]);
  expect((await db.admin.query('select assess.notice_dispatch_v1() n')).rows[0].n).toBe(0);
  await db.admin.query("update public.profiles set status='approved' where user_id=$1", [id(3)]);
  const opens = iso(1200000);
  await db.rpc(2, 'assignment_schedule_v2', [id(51), await revision(db), opens, null]);
  expect((await db.admin.query('select assess.notice_dispatch_v1() n')).rows[0].n).toBe(1);
  expect((await db.admin.query('select email,opens_at from public.synthetic_notices')).rows).toEqual([{ email: 'synthetic3@example.invalid', opens_at: new Date(opens) }]);
  expect((await db.admin.query('select assess.notice_dispatch_v1() n')).rows[0].n).toBe(0);
  await db.rpc(2, 'assignment_schedule_v2', [id(51), await revision(db), iso(1800000), null]);
  expect((await db.admin.query('select assess.notice_dispatch_v1() n')).rows[0].n).toBe(0);
  await db.admin.query('insert into assess.assignments(id,owner_id,version_id) values($1,$2,$3)', [id(65),id(1),id(50)]);
  await db.admin.query('insert into assess.targets values($1,$2)', [id(65),id(3)]);
  await db.rpc(1, 'assignment_schedule_v2', [id(65),1,iso(600000),null]);
  await db.rpc(1, 'assignment_close_v2', [id(65),2]);
  expect((await db.admin.query('select assess.notice_dispatch_v1() n')).rows[0].n).toBe(0);
  await db.admin.query('delete from assess.targets where assignment_id=$1', [id(65)]);
  // Queue cleanup follows the existing target erasure boundary, with no address stored there.
  await db.admin.query('delete from assess.targets where assignment_id=$1 and user_id=$2', [id(51), id(3)]);
  expect((await db.admin.query('select count(*)::int n from assess.assessment_notices')).rows[0].n).toBe(0);
 } finally { await db.close(); }
}, 300000);

it.each(['questions', 'mixed', 'full-practical'] as const)('%s: S2 publish/window/accommodation/start/submit/grade/result through the real DB lane', async track => {
 const db = await setup();
 try {
  const base = track === 'full-practical' ? practicalFixture() : mixedFixture();
  if (track === 'questions') {
   base.assessment.items = base.assessment.items.filter(i => i.type === 'single-choice');
   base.privateItems = base.privateItems.filter(i => i.type === 'single-choice');
   base.itemMarks = base.itemMarks.filter(m => base.assessment.items.some(i => i.ref.id === m.item.id));
  }
  base.assessment.maximum = base.itemMarks.reduce((n, m) => n + Number(m.maximum), 0).toString();
  const pub = validatePublicationV2({ ...base, schemaVersion: 2,
   assessment: { ...base.assessment, ref: { id: id(80), version: '1' }, schemaVersion: 2, items: base.assessment.items.map(i => ({ ...i, schemaVersion: 2 })) },
   privateItems: base.privateItems.map(k => { const { review, ...key } = k; return { ...key, schemaVersion: 2,
    provenance: k.type === 'single-choice' ? { kind: 'uploader-authored', reviewStatus: 'no-medical-review', sources: review.sources, licenceNotes: 'Synthetic only', authorDisplayName: null } : { kind: 'simulator-reviewed', review } }; }),
  }).publication as AssessmentPublicationV2;
  const specs = Object.fromEntries(pub.privateItems.map(k => {
   if (k.type === 'single-choice' || k.type === 'written-answer') return [k.ref.id, {}];
   const c = CASES.find(c => c.id === k.caseRef.id)!;
   return [k.ref.id, k.type === 'full-practical' ? settingsSpec(c) : Object.fromEntries(k.mutablePaths.map(p => [p, settingsSpec(c)[p]!]))];
  }));
  // Engineering installation reuses a real draft revision/link; no clinical review is claimed.
  await db.admin.query("insert into assess.versions(id,owner_id,assessment_id,version,name,track,schema_version,available) values($1,$2,$3,'1','SYNTHETIC',$4,2,true)", [id(80), id(2), id(80), base.assessment.track]);
  await db.admin.query('insert into assess.publications values($1,$2,$3,clock_timestamp())', [id(80), pub, specs]);
  await db.admin.query("insert into assess.content_submissions(version_id,state) values($1,'installed')", [id(80)]);
  await db.admin.query('insert into assess.authoring_publication_links select $1,draft_id,revision,digest from assess.authoring_revisions order by revision desc limit 1', [id(80)]);
  const aid = await db.rpc<string>(1, 'quiz_publish_v1', [id(80), id(81), iso(0), null]);
  await db.rpc(1, 'extra_time_v1', [aid, id(3), 60]);
  await db.admin.query('update assess.launch_gate set enabled=true');
  const session = await start(db, 82, aid);
  let revision = session.ack.revision;
  for (const k of pub.privateItems) {
   const answer = k.type === 'single-choice' ? { type: k.type, optionId: k.correctOptionId } : k.type !== 'written-answer' ? { type: k.type,
    values: leafValues(k.type === 'simulator-part' ? k.fixedSettings : CASES.find(c => c.id === k.caseRef.id)!.initialSettings, specs[k.ref.id]!) } : null;
   const ack = await db.rpc<{ revision: number }>(3, 'command_v2', [session.attemptId, id(90 + revision), revision, { type: 'save', item: k.ref, answer }]);
   revision = ack.revision;
  }
  await db.rpc(3, 'command_v2', [session.attemptId, id(110), revision, { type: 'submit' }]);
  const claim = await db.call<GradingClaimV2>('claim_v2'); expect(claim.attemptId).toBe(session.attemptId);
  const grade = gradePublicationV2(claim.publication, claim.answers, claim.locked);
  await db.call('finish_v2', [claim.attemptId, claim.token, grade.numerator, grade.denominator]);
  expect(await db.rpc(3, 'result_v2', [session.attemptId])).toMatchObject({ grade: { visibility: 'hidden' } });
  expect((await db.admin.query('select count(*)::int n from assess.session_details')).rows[0].n).toBe(0);
 } finally { await db.close(); }
}, 300000);

it('extra time: own targeted student, bounds, starts, active attempts, window extension, no revival or shortening, audit', async () => {
 const db = await setup();
 try {
  await db.rpc(2, 'assignment_schedule_v2', [id(51), await revision(db), iso(0), null]);
  expect((await db.admin.query("select extract(epoch from closes_at-opens_at)::int seconds from assess.assignment_windows")).rows[0].seconds).toBe(7200);
  await expect(db.rpc(3, 'extra_time_v1', [id(51), id(3), 60])).rejects.toMatchObject({ code: '42501' });
  await expect(db.rpc(2, 'extra_time_v1', [id(51), id(1), 60])).rejects.toMatchObject({ code: '42501' });
  for (const n of [-1, 86401, null]) await expect(db.rpc(2, 'extra_time_v1', [id(51), id(3), n])).rejects.toMatchObject({ code: '22023' });
  await db.rpc(2, 'extra_time_v1', [id(51), id(3), 600]);
  await db.admin.query('update assess.launch_gate set enabled=true');
  const s = await start(db, 100);
  const row = async () => (await db.admin.query('select deadline,started_at from assess.sessions where id=$1', [s.attemptId])).rows[0];
  let r = await row(); expect(r.deadline.getTime() - r.started_at.getTime()).toBe(4200000);
  await db.rpc(2, 'extra_time_v1', [id(51), id(3), 900]);
  r = await row(); expect(r.deadline.getTime() - r.started_at.getTime()).toBe(4500000);
  await expect(db.rpc(2, 'extra_time_v1', [id(51), id(3), 600])).rejects.toMatchObject({ code: '55000' });
  await db.rpc(2, 'extra_time_v1', [id(51), id(3), 86400]);
  expect((await db.admin.query('select s.deadline=w.closes_at ok from assess.sessions s join assess.assignment_windows w on w.assignment_id=s.assignment_id')).rows[0].ok).toBe(true);
  const opens = (await db.admin.query('select opens_at from assess.assignment_windows')).rows[0].opens_at;
  await db.rpc(2, 'assignment_window_set_v1', [id(51), await revision(db), opens, iso(10800000)]);
  expect((await row()).deadline.getTime()).toBeGreaterThan(r.deadline.getTime());
  expect((await db.admin.query('select s.deadline=w.closes_at ok from assess.sessions s join assess.assignment_windows w on w.assignment_id=s.assignment_id')).rows[0].ok).toBe(true);
  await expect(db.rpc(2, 'assignment_window_set_v1', [id(51), await revision(db), opens, iso(8 * 86400000)])).rejects.toMatchObject({ code: '22023' });
  await db.admin.query("update assess.sessions set deadline=clock_timestamp()-interval '1 second'");
  await expect(db.rpc(2, 'extra_time_v1', [id(51), id(3), 86400])).rejects.toMatchObject({ code: '55000' });
  expect((await db.admin.query("select count(*)::int n from emergency.audit where action='extra-time'")).rows[0].n).toBe(3);
 } finally { await db.close(); }
}, 300000);

it('stop evidence distinguishes ACTIVE from grading/failed/held; alternate typed Resume never releases captured ACTIVE; replacement is bounded and audited', async () => {
 const db = await setup();
 try {
  await db.rpc(2, 'assignment_schedule_v2', [id(51), await revision(db), iso(0), null]);
  await db.admin.query('update assess.launch_gate set enabled=true');
  const first = await start(db, 100);
  await db.admin.query('select assess.freeze_v2(); update assess.launch_gate set enabled=false');
  expect((await db.admin.query('select session_id from assess.stop_active_attempts')).rows).toEqual([{ session_id: first.attemptId }]);
  // A failed attempt, later held by another stop, has no authoritative ACTIVE transition proof.
  await db.admin.query(`insert into assess.sessions(id,assignment_id,user_id,ordinal,lifecycle_version,state,started_at,submitted_at,deadline,failed_at)
   values($1,$2,$3,10,2,'grading-failed',clock_timestamp(),clock_timestamp(),clock_timestamp(),clock_timestamp())`, [id(160), id(51), id(3)]);
  await db.admin.query('select assess.freeze_v2()');
  await expect(db.rpc(2, 'new_attempt_v1', [id(51), id(160)])).rejects.toMatchObject({ code: '55000' });
  await expect(db.rpc(3, 'new_attempt_v1', [id(51), first.attemptId])).rejects.toMatchObject({ code: '42501' });
  await expect(db.rpc(2, 'owner_resume_v1', ['RESUME ASSESS'])).rejects.toMatchObject({ code: '42501' });
  await db.admin.query('update emergency.appointment set user_id=$1,revoked_at=null where singleton', [id(2)]);
  await expect(db.rpc(2, 'owner_resume_v1', ['resume'])).rejects.toMatchObject({ code: '22023' });
  await expect(db.rpc(2, 'witness_accept_v1', ['ACCEPT RESTORED DATABASE'])).rejects.toMatchObject({ code: '42501' });
  expect(await db.rpc(2, 'owner_resume_v1', ['RESUME ASSESS'])).toMatchObject({ heldActive: 1, gateOpen: true });
  expect((await db.admin.query('select state,emergency_held_at is not null held from assess.sessions where id=$1', [first.attemptId])).rows[0]).toEqual({ state: 'grading-failed', held: true });
  // Remove the deliberately unrelated failure so it cannot mask new-start semantics.
  await db.admin.query('delete from assess.sessions where id=$1', [id(160)]);
  await expect(start(db, 101)).rejects.toMatchObject({ code: '55000' });
  await db.rpc(2, 'new_attempt_v1', [id(51), first.attemptId]);
  await db.rpc(2, 'new_attempt_v1', [id(51), first.attemptId]);
  const second = await start(db, 102); expect(second.attemptId).not.toBe(first.attemptId);
  expect((await db.admin.query("select count(*)::int n from emergency.audit where action='new-attempt'")).rows[0].n).toBe(1);
  // Each subsequent grant requires a new authoritative stop; fourth grant fails.
  let previous = second;
  for (let n = 0; n < 3; n++) {
   await db.admin.query('select assess.freeze_v2()');
   if (n === 2) await expect(db.rpc(2, 'new_attempt_v1', [id(51), previous.attemptId])).rejects.toMatchObject({ code: '54000' });
   else { await db.rpc(2, 'new_attempt_v1', [id(51), previous.attemptId]); previous = await start(db, 103 + n); }
  }
  await db.admin.query('update emergency.appointment set revoked_at=clock_timestamp()');
  await expect(db.rpc(2, 'owner_resume_v1', ['RESUME ASSESS'])).rejects.toMatchObject({ code: '42501' });
 } finally { await db.close(); }
}, 300000);

it('historical ambiguous holds are never inferred ACTIVE or auto-released; known non-active holds may resume', async () => {
 const db = await setup();
 try {
  await db.rpc(2, 'assignment_schedule_v2', [id(51), await revision(db), iso(0), null]);
  await db.admin.query('update assess.launch_gate set enabled=true');
  const s = await start(db, 100);
  await db.rpc(3, 'command_v2', [s.attemptId, id(101), s.ack.revision, { type: 'submit' }]);
  await db.admin.query('select assess.freeze_v2()');
  expect((await db.admin.query('select was_active from assess.stop_active_attempts')).rows).toEqual([{ was_active: false }]);
  await expect(db.rpc(2, 'new_attempt_v1', [id(51), s.attemptId])).rejects.toMatchObject({ code: '55000' });
  expect(await db.rpc(1, 'owner_resume_v1', ['RESUME ASSESS'])).toMatchObject({ released: 1, heldActive: 0 });
  await db.admin.query('select assess.freeze_v2();delete from assess.stop_active_attempts'); // simulate a pre-S2 hold without evidence
  expect(await db.rpc(1, 'owner_resume_v1', ['RESUME ASSESS'])).toMatchObject({ released: 0, stillHeld: 1 });
  await expect(db.rpc(2, 'new_attempt_v1', [id(51), s.attemptId])).rejects.toMatchObject({ code: '55000' });
 } finally { await db.close(); }
}, 300000);

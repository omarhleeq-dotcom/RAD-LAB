/** Real isolated PostgreSQL only: current schema first, then explicit M01–M08. */
import { expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { rad062Fixture, syntheticDraft, id } from './rad062-test-fixture';
import { publicationFromDraftV2, type BridgeSnapshotV2 } from './server-authoring-bridge-v2';
import type { GradingClaimV2 } from './server-contracts-v2';
import manifest from '../../../scripts/pages/frontend-schema.json';
const file = '20261030000800_rad062_erasure_operations.sql';
const read = (path: string) => readFileSync(path, 'utf8');
const m08 = () => read('supabase/migrations/' + file);
const later = ['manual_foundation_freeze', 'lifecycle_v2', 'manual_grading'];
const temporary = ['session_details', 'pool_selections_v2', 'capacity_reservations_v1', 'manual_work_v1', 'manual_item_scores_v1', 'manual_events_v1', 'receipts'];
async function packageDb(apply = true) {
 const db = await rad062Fixture(4);
 try {
  for (const [n, part] of later.entries()) await db.admin.query(read(`supabase/migrations/20261030000${n + 5}00_rad062_${part}.sql`));
  if (apply) await db.admin.query(m08());
  return db;
 } catch (e) { await db.close(); throw e; }
}
async function fixture() {
 const db = await packageDb();
 try {
  await db.admin.query("update public.profiles set display_name='ERASE Account Name' where user_id=$1", [id(2)]);
  const draft = syntheticDraft(); draft.policy.durationSeconds = 3600;
  draft.items.push({ id: 'w', type: 'written-answer', prompt: 'SYNTHETIC written', maximum: '2', provenance: structuredClone(draft.items[0]!.provenance) });
  const saved = await db.save(draft);
  const snap = await db.call<BridgeSnapshotV2>('authoring_bridge_read_v2', [db.group, draft.id, saved.document.revision]);
  const publication = publicationFromDraftV2(snap, []);
  const candidate = await db.call('content_submit_v2', [db.group, draft.id, 1, publication]);
  const document = (await db.admin.query('select document from assess.content_candidates_v2 where id=$1', [candidate])).rows[0].document;
  await db.admin.query("insert into assess.versions(id,owner_id,assessment_id,version,name,track,schema_version,available) values($1,$2,$3,'1','SYNTHETIC','mixed',2,true)", [id(50), id(2), publication.assessment.ref.id]);
  await db.admin.query('insert into assess.publications values($1,$2,$3,now())', [id(50), document, { q: {}, w: {} }]);
  await db.admin.query('insert into assess.assignments(id,owner_id,version_id,source_group_ids) values($1,$2,$3,$4)', [id(51), id(2), id(50), [db.group]]);
  await db.admin.query('insert into assess.targets values($1,$2),($1,$3)', [id(51), id(3), id(2)]);
  for (const u of [2, 3]) await db.rpc(u, 'consent_v2', ['assess-pilot-2026-10-20-v2']);
  await db.admin.query('update assess.launch_gate set enabled=true');
  const start = async (user = 3, operation = 100) => {
   const { attemptId: s } = await db.rpc<{ attemptId: string }>(user, 'start_v2', [id(51), id(operation)]);
   await db.rpc(user, 'command_v2', [s, id(operation + 1), 0, { type: 'save', item: { id: 'w', version: '1' }, answer: { type: 'written-answer', text: ' literal جواب 😀\n ' } }]);
   await db.rpc(user, 'command_v2', [s, id(operation + 2), 1, { type: 'submit' }]);
   return s;
  };
  const s = await start();
  const complete = async (session = s) => {
   const c = await db.rpc<GradingClaimV2>('worker', 'claim_v2'); expect(c.attemptId).toBe(session);
   await db.rpc('worker', 'finish_v2', [session, c.token, '1', '1']);
  };
  const score = async (session = s, operation = 200) => db.call('manual_score_v1', [session, id(operation), 0, JSON.stringify([{ item: { id: 'w', version: '1' }, score: '2' }]), 'initial'], 2);
  const finalize = async (session = s, operation = 300) => db.call('manual_finalize_v1', [session, id(operation), 1], 2);
  return { db, s, start, complete, score, finalize };
 } catch (e) { await db.close(); throw e; }
}
const functions = "select oid,oid::regprocedure::text signature,prosrc,proacl,proowner,proconfig from pg_proc where pronamespace in ('assess'::regnamespace,'public'::regnamespace) order by oid";
it('current schema stays v1; M08 requires M07; missing entry or erasure anchor rolls the entire migration back', async () => {
 const current = await rad062Fixture(0);
 try {
  expect(await current.rpc('worker', 'claim_v1')).toBeNull();
  await expect(current.admin.query(m08())).rejects.toMatchObject({ code: '55000' }); await current.admin.query('rollback');
 } finally { await current.close(); }
 for (const anchor of ['begin\n', ' delete from auth.users where id=p_user;']) {
  const db = await packageDb(false);
  try {
   const sig = 'assess.erase_account_d3_v1(uuid)';
   const def = (await db.admin.query('select pg_get_functiondef($1::regprocedure) def', [sig])).rows[0].def as string;
   expect(def).toContain(anchor);
   await db.admin.query(def.replace(anchor, anchor === 'begin\n' ? 'BEGIN\n' : ' DELETE FROM auth.users WHERE id=p_user;'));
   const before = (await db.admin.query(functions)).rows;
   await expect(db.admin.query(m08())).rejects.toMatchObject({ code: 'P0001' }); await db.admin.query('rollback');
   expect((await db.admin.query(functions)).rows).toEqual(before);
   expect((await db.admin.query("select to_regprocedure('assess.recover_v2(uuid)') f")).rows[0].f).toBeNull();
  } finally { await db.close(); }
 }
}, 30000);
it('whole M01–M08 readiness passes with a closed gate; source, ACL, relation and identity drift fail it', async () => {
 const db = await packageDb();
 try {
  const sql = read('supabase/checks/rad062-ready.sql');
  const rows = (await db.admin.query(sql)).rows;
  expect(rows).toHaveLength(5); expect(rows.every(r => r.ok === true)).toBe(true);
  for (const drift of [
   "create or replace function assess.health_v2() returns jsonb language sql security definer set search_path='' as $$ select '{}'::jsonb $$",
   'grant execute on function assess.freeze_v2() to authenticated',
   'alter table assess.manual_events_v1 disable row level security',
   'alter table assess.sessions disable trigger rad062_emergency_hold',
   'grant select(answers) on assess.session_details to authenticated',
   'create table public.test_unknown_identity(user_id uuid references public.profiles(user_id))',
  ]) {
   await db.admin.query('begin'); await db.admin.query(drift);
   expect((await db.admin.query(sql)).rows.some(r => !r.ok)).toBe(true);
   await db.admin.query('rollback');
  }
 } finally { await db.close(); }
}, 20000);
it('M08 grants exactly the planned public entrypoints and preserves v1 OIDs/attributes/bodies except enumerated D3 patches', async () => {
 const db = await packageDb(false);
 try {
  const before = (await db.admin.query(functions)).rows;
  await db.admin.query(m08());
  const after = (await db.admin.query(functions)).rows;
  const patched = ['owner_account_deletion_v1', 'account_management_v1', 'transfer_management_d3_v1', 'erase_account_d3_v1', 'd3_needs_transfer_v1', 'd3_shared_group_v1', 'd3_inventory_v1', 'authoring_write_guard_v1'];
  const granted = {
   authenticated: ['start_v2', 'read_session_v2', 'read_mixed_session_v2', 'read_practical_session_v2', 'command_v2', 'result_v2', 'draft_save_v2', 'draft_page_v2', 'manual_queue_v1', 'manual_read_v1', 'manual_score_v1', 'manual_finalize_v1', 'manual_receipt_v1', 'recover_v2'],
   assess_worker: ['claim_v2', 'finish_v2', 'fail_v2', 'maintain_v2', 'health_v2', 'day5_warnings_v2', 'day5_ack_v2'],
   assess_authoring_bridge: ['authoring_bridge_read_v2', 'content_submit_v2'],
  };
  for (const row of before) {
   const next = after.find(r => r.oid === row.oid); expect(next).toBeDefined();
   expect(next).toMatchObject({ oid: row.oid, proowner: row.proowner, proconfig: row.proconfig });
   if (!patched.some(n => row.signature.startsWith(n + '(') || row.signature.startsWith('assess.' + n + '('))) expect(next!.prosrc).toBe(row.prosrc);
   if (!Object.values(granted).flat().some(n => row.signature.startsWith('assess.' + n + '(') || row.signature.startsWith(n + '('))) expect(next!.proacl).toEqual(row.proacl);
  }
  const runtime = (await db.admin.query(`select p.oid,p.proname,p.oid::regprocedure::text signature from pg_proc p where p.pronamespace='assess'::regnamespace`)).rows;
  for (const role of ['anon', 'authenticated', 'assess_worker', 'assess_authoring_bridge']) {
   const baseline = new Set(before.filter(r => runtime.some(p => p.oid === r.oid)).map(r => r.oid));
   for (const fn of runtime) {
    const was = before.find(r => r.oid === fn.oid);
    const isPackage = !baseline.has(fn.oid) || Object.values(granted).flat().includes(fn.proname) || fn.proname.startsWith('manual_');
    if (!isPackage) continue;
    const expected = role === 'anon' ? false : (granted[role as keyof typeof granted] ?? []).includes(fn.proname);
    expect((await db.admin.query("select has_function_privilege($1,$2::oid,'execute') ok", [role, fn.oid])).rows[0].ok, `${role}:${fn.signature}:${was?.signature}`).toBe(expected);
   }
   for (const table of ['authoring_provenance_v2', 'content_candidates_v2', 'authoring_holds_v1', 'pool_fences_v2', ...temporary.filter(t => !['session_details', 'receipts'].includes(t)), 'manual_final_receipts_v1'])
    expect((await db.admin.query(`select has_table_privilege($1,'assess.${table}','select,insert,update,delete') ok`, [role])).rows[0].ok).toBe(false);
  }
  expect((await db.admin.query("select rolcanlogin from pg_roles where rolname='assess_worker'")).rows[0].rolcanlogin).toBe(false);
  expect(await db.rpc('worker', 'claim_v1')).toBeNull();
 } finally { await db.close(); }
}, 20000);
it('day5 warning includes failed/held attempts, retries failed delivery, ACK is idempotent; day7 void deletes every temporary store', async () => {
 const { db, s } = await fixture();
 try {
  await db.rpc('worker', 'fail_v2', [s, (await db.rpc<GradingClaimV2>('worker', 'claim_v2')).token]);
  await db.admin.query("update assess.sessions set submitted_at=clock_timestamp()-interval '119 hours' where id=$1", [s]);
  expect((await db.rpc<{ rows: unknown[] }>('worker', 'day5_warnings_v2')).rows).toEqual([]);
  await db.admin.query("update assess.sessions set submitted_at=clock_timestamp()-interval '120 hours' where id=$1", [s]);
  await db.call('freeze_v2');
  const due = await db.rpc<{ rows: { id: string; written_count: number }[] }>('worker', 'day5_warnings_v2', [null, 1]);
  expect(due.rows).toHaveLength(1); expect(due.rows[0]).toMatchObject({ id: s, written_count: 1 });
  expect(JSON.stringify(due)).not.toMatch(/answer|literal|score|email|user_id/);
  expect(await db.rpc('worker', 'day5_warnings_v2', [null, 1])).toEqual(due); // no channel ACK
  expect((await db.rpc('worker', 'health_v2'))).toMatchObject({ failed: 1, held: 1, alert: 1, warningDue: 1, voidDue: 0 });
  await db.rpc('worker', 'day5_ack_v2', [s]);
  const sent = (await db.admin.query('select warning_sent_at from assess.manual_work_v1')).rows;
  await db.rpc('worker', 'day5_ack_v2', [s]);
  expect((await db.admin.query('select warning_sent_at from assess.manual_work_v1')).rows).toEqual(sent);
  expect((await db.rpc<{ rows: unknown[] }>('worker', 'day5_warnings_v2')).rows).toEqual([]);
  // Hold guard deliberately forbids timer mutation. Release only in this synthetic clock fixture.
  await db.admin.query("update assess.sessions set emergency_held_at=null,submitted_at=clock_timestamp()-interval '168 hours' where id=$1", [s]);
  await db.call('freeze_v2');
  expect(await db.rpc('worker', 'health_v2')).toMatchObject({ voidDue: 1 });
  await expect(db.rpc('worker', 'day5_ack_v2', [s])).rejects.toMatchObject({ code: '55000' });
  expect(await db.rpc('worker', 'maintain_v2', [1])).toMatchObject({ voided: 1, purged: 1 });
  for (const table of [...temporary, 'manual_final_receipts_v1', 'results']) expect((await db.admin.query(`select count(*)::int n from assess.${table}`)).rows[0].n).toBe(0);
 } finally { await db.close(); }
}, 20000);
it.each([false, true])('recovery after freeze preserves answers and manual work, automatic_complete=%s; never reopens final attempts', async automatic => {
 const { db, s, complete, score, finalize } = await fixture();
 try {
  await db.admin.query("update public.profiles set role='owner' where user_id=$1", [id(2)]);
  if (automatic) { await complete(); await score(); }
  const answer = (await db.admin.query('select * from assess.session_details')).rows;
  const work = (await db.admin.query('select * from assess.manual_work_v1')).rows;
  const time = (await db.admin.query('select started_at,deadline,submitted_at from assess.sessions')).rows;
  await db.admin.query('update assess.launch_gate set enabled=false');
  await db.call('freeze_v2');
  await expect(db.rpc('worker', 'recover_v2', [s])).rejects.toMatchObject({ code: '42501' });
  await expect(db.rpc(1, 'recover_v2', [s])).rejects.toMatchObject({ code: '42501' });
  await db.rpc(2, 'recover_v2', [s]);
  expect((await db.admin.query('select state,emergency_held_at from assess.sessions')).rows[0]).toEqual({ state: automatic ? 'awaiting-manual' : 'grading', emergency_held_at: null });
  expect((await db.admin.query('select * from assess.session_details')).rows).toEqual(answer);
  expect((await db.admin.query('select * from assess.manual_work_v1')).rows).toEqual(work);
  expect((await db.admin.query('select started_at,deadline,submitted_at from assess.sessions')).rows).toEqual(time);
  expect((await db.admin.query('select enabled from assess.launch_gate')).rows[0].enabled).toBe(false);
  if (automatic) expect(await db.rpc('worker', 'claim_v2')).toBeNull();
  else { await complete(); await score(); }
  await finalize();
  const final = (await db.admin.query('select * from assess.results')).rows;
  await db.call('freeze_v2');
  await expect(db.rpc(2, 'recover_v2', [s])).rejects.toMatchObject({ code: '55000' });
  expect((await db.admin.query('select * from assess.results')).rows).toEqual(final);
 } finally { await db.close(); }
}, 20000);
it('health reports awaiting/manual deadlines and active overdue; maintenance bounds expiry, preserves finals until expiry and isolates legacy data', async () => {
 const { db, s, complete, start, score, finalize } = await fixture();
 try {
  await db.admin.query("update public.profiles set role='owner' where user_id=$1", [id(2)]);
  await complete(); await score(); await finalize();
  const final = (await db.admin.query('select * from assess.results')).rows;
  const pending = await start(3, 110); await complete(pending);
  await db.admin.query("update assess.sessions set submitted_at=clock_timestamp()-interval '6 days' where id=$1", [pending]);
  expect(await db.rpc('worker', 'health_v2')).toEqual({ failed: 0, alert: 0, held: 0, awaitingManual: 1, warningDue: 1, voidDue: 0, overdue: 0, purgeDue: 0 });
  for (const bad of [null, 0, 101]) {
   await expect(db.rpc('worker', 'maintain_v2', [bad])).rejects.toMatchObject({ code: '22023' });
   await expect(db.rpc('worker', 'day5_warnings_v2', [null, bad])).rejects.toMatchObject({ code: '22023' });
  }
  const { attemptId: active } = await db.rpc<{ attemptId: string }>(2, 'start_v2', [id(51), id(120)]);
  await db.admin.query("update assess.sessions set deadline=clock_timestamp()-interval '25 hours' where id=$1", [active]);
  expect(await db.rpc('worker', 'health_v2')).toMatchObject({ overdue: 1 });
  expect(await db.rpc('worker', 'maintain_v2', [1])).toMatchObject({ expired: 1, failed: 1, voided: 0 });
  expect((await db.admin.query('select * from assess.results where session_id=$1', [s])).rows).toEqual(final);
  // Plain grading and awaiting-manual both expire; unrelated v1 survives v2 maintenance.
  await db.admin.query("update assess.sessions set state='grading',submitted_at=clock_timestamp()-interval '7 days' where id=$1", [active]);
  await db.admin.query("update assess.sessions set submitted_at=clock_timestamp()-interval '7 days' where id=$1", [pending]);
  await db.admin.query("insert into assess.versions(id,owner_id,assessment_id,version,name,track,available) values($1,$2,$1,'1','LEGACY','mixed',true)", [id(60), id(1)]);
  await db.admin.query('insert into assess.assignments(id,owner_id,version_id) values($1,$2,$3)', [id(61), id(1), id(60)]);
  await db.admin.query("insert into assess.sessions(id,assignment_id,user_id,ordinal,state,started_at,submitted_at) values($1,$2,$3,1,'grading',now(),now()-interval '8 days')", [id(62), id(61), id(3)]);
  expect(await db.rpc('worker', 'health_v2')).toMatchObject({ voidDue: 2 });
  expect(await db.rpc('worker', 'maintain_v2', [1])).toMatchObject({ voided: 1 });
  expect(await db.rpc('worker', 'maintain_v2', [1])).toMatchObject({ voided: 1 });
  expect((await db.admin.query('select state from assess.sessions where id=$1', [id(62)])).rows[0].state).toBe('grading');
  expect((await db.admin.query('select * from assess.results where session_id=$1', [s])).rows).toEqual(final);
  await db.admin.query("update assess.sessions set expires_at=clock_timestamp()-interval '1 second' where id=$1", [s]);
  await db.admin.query('update assess.assignments set closed_at=clock_timestamp() where id=$1', [id(51)]);
  expect(await db.rpc('worker', 'health_v2')).toMatchObject({ purgeDue: 1 });
  expect(await db.rpc('worker', 'maintain_v2', [1])).toMatchObject({ reservationsPurged: 1 });
  expect(await db.rpc('worker', 'maintain_v2', [1])).toMatchObject({ reservationsPurged: 1 });
  expect((await db.admin.query('select count(*)::int n from assess.reservations where assignment_id=$1', [id(51)])).rows[0].n).toBe(0);
  expect((await db.admin.query('select closed_at from assess.assignments where id=$1', [id(51)])).rows[0].closed_at).not.toBeNull();
  expect((await db.admin.query('select * from assess.manual_final_receipts_v1 where session_id=$1', [s])).rowCount).toBe(0);
  expect((await db.admin.query('select * from assess.results where session_id=$1', [s])).rowCount).toBe(0);
  await db.rpc('worker', 'maintain_v1', [1]);
  expect((await db.admin.query('select * from assess.sessions where id=$1', [id(62)])).rowCount).toBe(0);
 } finally { await db.close(); }
}, 20000);
it('management transfer and erasure during awaiting-manual cover every v2 store, preserve other students and anonymize final responsibility', async () => {
 const { db, s, start, complete, score, finalize } = await fixture();
 try {
  // Author, reviewer, student, temporary/final grader all refer to the same erased account.
  await db.save(syntheticDraft(20));
  await db.admin.query('update assess.authoring_drafts set writer_id=$1 where id=$2', [id(3), id(20)]);
  await db.admin.query("update assess.authoring_provenance_v2 set author_id=$1,author_display_name='SYNTHETIC Third Name',reviewer_id=$2,reviewed_by='ERASE Reviewer Name',reviewed_at='2026-10-30T00:00:00.000Z' where draft_id=$3", [id(3), id(2), id(20)]);
  await db.admin.query("insert into assess.authoring_holds_v1 values($1,1,'rights')", [id(10)]);
  await db.admin.query('insert into assess.authoring_reviewed_packages select r.draft_id,r.revision,r.digest,c.document from assess.authoring_revisions r join assess.content_candidates_v2 c on c.draft_id=r.draft_id and c.revision=r.revision where r.draft_id=$1', [id(10)]);
  await db.admin.query("update public.profiles set role='owner' where user_id=$1", [id(2)]);
  await complete(); await score(); await finalize(); // other student's final receipt identifies grader2
  const final = (await db.admin.query('select * from assess.results where session_id=$1', [s])).rows;
  const pendingOther = await start(3, 110); await complete(pendingOther); await score(pendingOther, 210);
  const ownFinal = await start(2, 130); await complete(ownFinal); await score(ownFinal, 230); await finalize(ownFinal, 330);
  const own = await start(2, 120); await complete(own); await score(own, 220); // awaiting-manual
  expect((await db.admin.query("select state from assess.sessions where id=$1", [own])).rows[0].state).toBe('awaiting-manual');
  await db.admin.query("insert into public.c2_account_deletions(user_id,restore_status,previous_banned_until) values($1,'approved','-infinity')", [id(2)]);
  const preview = await db.call<{ inventoryDigest: string; contentDigest: string }>('d3_inventory_v1', [id(2)], 1);
  await expect(db.call('transfer_management_d3_v1', [id(2), preview.inventoryDigest], 1)).rejects.toMatchObject({ code: '55000' });
  await db.admin.query("insert into assess.erasure_rights(user_id,content_digest,disposition,reviewed_by) values($1,$2,'no-personal-data',$3)", [id(2), preview.contentDigest, id(1)]);
  await db.call('transfer_management_d3_v1', [id(2), preview.inventoryDigest], 1);
  expect((await db.admin.query('select manager_id from assess.assignment_managers where assignment_id=$1', [id(51)])).rows[0].manager_id).toBe(id(1));
  // Fail after provenance/temporary grader minimisation; the whole account
  // erasure must roll back, including identities, until Auth deletion commits.
  await db.admin.query("create function assess.test_abort_erasure() returns trigger language plpgsql as $$ begin raise exception 'synthetic erase abort'; end $$; create trigger test_abort_erasure before delete on auth.users for each row execute function assess.test_abort_erasure()");
  await expect(db.call('erase_account_d3_v1', [id(2)], 1)).rejects.toMatchObject({ code: 'P0001' });
  expect((await db.admin.query('select count(*)::int n from assess.authoring_provenance_v2 where author_id=$1', [id(2)])).rows[0].n).toBeGreaterThan(0);
  expect((await db.admin.query('select final_grader_id from assess.manual_final_receipts_v1 where session_id=$1', [s])).rows[0].final_grader_id).toBe(id(2));
  await db.admin.query('drop trigger test_abort_erasure on auth.users');
  await db.call('erase_account_d3_v1', [id(2)], 1);
  expect((await db.admin.query('select * from auth.users where id=$1', [id(2)])).rowCount).toBe(0);
  expect((await db.admin.query('select * from public.profiles where user_id=$1', [id(2)])).rowCount).toBe(0);
  for (const table of [...temporary, 'manual_final_receipts_v1', 'results'])
   expect((await db.admin.query(`select * from assess.${table} where session_id=any($1::uuid[])`, [[own, ownFinal]])).rowCount).toBe(0);
  expect((await db.admin.query('select * from assess.results where session_id=$1', [s])).rows).toEqual(final);
  expect((await db.admin.query('select final_grader_id from assess.manual_final_receipts_v1 where session_id=$1', [s])).rows[0].final_grader_id).toBeNull();
  for (const table of ['manual_events_v1', 'manual_item_scores_v1']) expect((await db.admin.query(`select count(*)::int n from assess.${table} where grader_id=$1`, [id(2)])).rows[0].n).toBe(0);
  expect((await db.admin.query('select * from assess.authoring_provenance_v2 where author_id=$1 or reviewer_id=$1 or reviewed_by=$2', [id(2), 'ERASE Reviewer Name'])).rowCount).toBe(0);
  expect((await db.admin.query('select reviewer_id,reviewed_by,reviewed_at from assess.authoring_provenance_v2 where draft_id=$1', [id(20)])).rows[0]).toEqual({ reviewer_id: null, reviewed_by: null, reviewed_at: null });
  // Held shared revision/candidate retained under rights clearance, writer erased.
  expect((await db.admin.query('select writer_id from assess.authoring_drafts where id=$1', [id(10)])).rows[0].writer_id).toBeNull();
  expect((await db.admin.query('select * from assess.content_candidates_v2 where draft_id=$1', [id(10)])).rowCount).toBe(1);
  expect((await db.admin.query('select * from assess.authoring_revisions where draft_id=$1', [id(10)])).rowCount).toBe(1);
  expect((await db.admin.query('select * from assess.authoring_reviewed_packages where draft_id=$1', [id(10)])).rowCount).toBe(1);
  for (const table of ['authoring_drafts', 'authoring_revisions', 'authoring_reviewed_packages', 'authoring_holds_v1', 'authoring_provenance_v2', 'content_candidates_v2', 'pool_fences_v2', ...temporary, 'manual_final_receipts_v1']) {
   const serialized = JSON.stringify((await db.admin.query(`select to_jsonb(t) row from assess.${table} t`)).rows);
   expect(serialized).not.toContain(id(2)); expect(serialized).not.toMatch(/ERASE Account Name|ERASE Reviewer Name/);
  }
  expect((await db.admin.query('select owner_id from assess.assignments where id=$1', [id(51)])).rows[0].owner_id).toBeNull();
  const manual = await db.rpc<{ items: { answer: string }[] }>(1, 'manual_read_v1', [pendingOther]);
  expect(manual.items[0]!.answer).toBe(' literal جواب 😀\n ');
  await db.call('freeze_v2'); await db.rpc(1, 'recover_v2', [pendingOther]);
  await db.rpc(1, 'manual_finalize_v1', [pendingOther, id(340), 1]);
  expect((await db.admin.query('select inventory=assess.d3_fk_inventory_v1() ok from assess.erasure_fk_contract')).rows[0].ok).toBe(true);
 } finally { await db.close(); }
}, 20000);
it('private unshared drafts/revisions/candidates/provenance cascade away; recovery/deadline rechecks after row locks; v1 maintenance ignores v2', async () => {
 const { db, s, complete } = await fixture();
 try {
  await db.admin.query("update public.profiles set role='owner' where user_id=$1", [id(2)]);
  await complete(); await db.call('freeze_v2');
  const blocker = await db.connect();
  try {
   await blocker.query('begin'); await blocker.query('select 1 from assess.sessions where id=$1 for update', [s]);
   const waiting = Promise.allSettled([db.rpc(2, 'recover_v2', [s])]);
   for (let n = 0; n < 300; n++) {
    if ((await db.admin.query("select exists(select 1 from pg_stat_activity where wait_event_type='Lock' and query like 'select assess.recover_v2%') ok")).rows[0].ok) break;
    if (n === 299) throw Error('missing recovery lock witness');
    await new Promise(resolve => setTimeout(resolve, 10));
   }
   await blocker.query("update assess.sessions set emergency_held_at=null,submitted_at=clock_timestamp()-interval '7 days' where id=$1", [s]);
   await blocker.query('commit');
   expect((await waiting)[0]).toMatchObject({ status: 'rejected', reason: { code: '55000' } });
  } finally { await blocker.query('rollback'); await blocker.end(); }
  await db.rpc('worker', 'maintain_v1');
  expect((await db.admin.query('select count(*)::int n from assess.session_details where session_id=$1', [s])).rows[0].n).toBe(1);
  expect(await db.rpc('worker', 'health_v1')).toEqual({ failed: 0, alert: 0, overdue: 0, purgeDue: 0 });
  await db.rpc('worker', 'maintain_v2');
 } finally { await db.close(); }
 const privateDb = await packageDb();
 try {
  const d = syntheticDraft(); const saved = await privateDb.save(d);
  const snap = await privateDb.call<BridgeSnapshotV2>('authoring_bridge_read_v2', [privateDb.group, d.id, saved.document.revision]);
  await privateDb.call('content_submit_v2', [privateDb.group, d.id, 1, publicationFromDraftV2(snap, [])]);
  await privateDb.call('erase_account_d3_v1', [id(2)], 1);
  for (const table of ['authoring_drafts', 'authoring_revisions', 'content_candidates_v2', 'authoring_provenance_v2'])
   expect((await privateDb.admin.query(`select count(*)::int n from assess.${table}`)).rows[0].n).toBe(0);
 } finally { await privateDb.close(); }
}, 20000);
it('the normal C2 finalise entrypoint erases a due v2 student and all answers atomically', async () => {
 const { db, s, complete } = await fixture();
 try {
  await complete();
  // The common engineering fixture has four Auth columns; C2 also uses this
  // provider-owned ban field. Add only the synthetic Auth surface needed here.
  await db.admin.query('alter table auth.users add column banned_until timestamptz');
  await db.admin.query("select set_config('request.jwt.claim.sub',$1,false)", [id(1)]);
  await db.admin.query("select public.owner_account_deletion_v1('deactivate',$1)", [id(3)]);
  await db.admin.query("update public.c2_account_deletions set requested_at=clock_timestamp()-interval '31 days' where user_id=$1", [id(3)]);
  expect((await db.admin.query("select public.owner_account_deletion_v1('finalise') result")).rows[0].result).toEqual({ processed: 1 });
  for (const table of [...temporary, 'manual_final_receipts_v1', 'results'])
   expect((await db.admin.query(`select * from assess.${table} where session_id=$1`, [s])).rowCount).toBe(0);
  expect((await db.admin.query('select * from auth.users where id=$1', [id(3)])).rowCount).toBe(0);
 } finally { await db.close(); }
}, 20000);
it('an unassigned rights-held draft transfers its containing group, preserves evidence and erases the author identity', async () => {
 const db = await packageDb();
 try {
  await db.save(syntheticDraft());
  await db.admin.query("insert into assess.authoring_holds_v1 values($1,1,'rights')", [id(10)]);
  await db.admin.query("insert into public.c2_account_deletions(user_id,restore_status,previous_banned_until) values($1,'approved','-infinity')", [id(2)]);
  await expect(db.call('erase_account_d3_v1', [id(2)], 1)).rejects.toMatchObject({ code: '55000' });
  const inv = await db.call<{ contentDigest: string; inventoryDigest: string }>('d3_inventory_v1', [id(2)], 1);
  await db.admin.query("insert into assess.erasure_rights(user_id,content_digest,disposition,reviewed_by) values($1,$2,'no-personal-data',$3)", [id(2), inv.contentDigest, id(1)]);
  await db.call('transfer_management_d3_v1', [id(2), inv.inventoryDigest], 1);
  await db.call('erase_account_d3_v1', [id(2)], 1);
  expect((await db.admin.query('select owner_id,supervisor_id from assess.groups where id=$1', [db.group])).rows[0]).toEqual({ owner_id: null, supervisor_id: null });
  expect((await db.admin.query('select writer_id from assess.authoring_drafts where id=$1', [id(10)])).rows[0].writer_id).toBeNull();
  expect((await db.admin.query('select * from assess.authoring_holds_v1')).rowCount).toBe(1);
  expect((await db.admin.query('select * from assess.authoring_revisions')).rowCount).toBe(1);
  expect((await db.admin.query('select * from assess.authoring_provenance_v2')).rowCount).toBe(0);
 } finally { await db.close(); }
}, 20000);
it('M08 required; required bytes/checks, promoted guard/marker and BOTH unchanged emergency packets', () => {
 const base = JSON.parse(execFileSync('git', ['show', '023ec84c15bfd744f317ec079e2587d90e099414:scripts/pages/frontend-schema.json'], { encoding: 'utf8' }));
 expect(manifest.requiredMigrations).toEqual([...base.requiredMigrations, ...base.guardedFeatures.rad062.migrations]); expect(manifest.checks).toEqual([...base.checks.map((p: string) => p === 'supabase/checks/rad085-p1-b-ready.sql' ? 'supabase/checks/rad062-p1-b-ready.sql' : p), 'supabase/checks/rad062-ready.sql']);
 expect(manifest.checks).toContain('supabase/checks/rad062-ready.sql');
 expect(manifest.guardedFeatures.rad062.migrationSha256[file]).toBe(createHash('sha256').update(m08()).digest('hex'));
 expect(manifest.guardedFeatures.rad062.migrations).toContain(file);
 for (const path of [...base.requiredMigrations.map((f: string) => 'supabase/migrations/' + f), ...base.checks,
  'src/features/assess/rad062-availability.ts', 'src/features/supervisor/p1-availability.ts',
  'supabase/manual/assess-emergency-stop.sql', 'supabase/checks/assess-emergency-stopped.sql', 'scripts/assess/emergency-stop-packet.mjs', 'docs/RAD-059_PHONE_PACKET.md',
  'supabase/manual/assess-emergency-stop-v2.sql', 'supabase/checks/assess-emergency-stopped-v2.sql', 'scripts/assess/emergency-stop-v2-packet.mjs', 'docs/RAD-062_P05_PHONE_PACKET.md'])
  expect(readFileSync(path)).toEqual(path === 'src/features/assess/rad062-availability.ts' ? Buffer.from(execFileSync('git', ['show', '023ec84c15bfd744f317ec079e2587d90e099414:' + path], { encoding: 'utf8' }).replace('RAD062_AVAILABLE: boolean = false', 'RAD062_AVAILABLE: boolean = true')) : execFileSync('git', ['show', (path === 'scripts/assess/emergency-stop-packet.mjs' ? '3f8a90810a58ebbc2603184f7f6bdd6eab5d5e31' : '023ec84c15bfd744f317ec079e2587d90e099414') + ':' + path]));
 const expectedMarker = createHash('sha256').update('https://vlacestfruxooznrcjqc.supabase.co\n');
 for (const migration of [...manifest.requiredMigrations].sort()) expectedMarker.update(migration + '\0').update(readFileSync('supabase/migrations/' + migration)).update('\0');
 for (const check of manifest.checks) expectedMarker.update(readFileSync(check));
 expect(execFileSync(process.execPath, ['scripts/pages/pilot-schema-gate.mjs', '--print-marker'], { encoding: 'utf8', env: { ...process.env, NEXT_PUBLIC_SUPABASE_URL: 'https://vlacestfruxooznrcjqc.supabase.co' } }).trim())
  .toBe('pilot-v1:' + expectedMarker.digest('hex'));
}, 20000);

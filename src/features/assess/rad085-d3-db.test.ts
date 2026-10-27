import { mkdtempSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { Client } from 'pg';
import { expect, it } from 'vitest';
import { openRad085Database, fixtureId as id } from './rad085-local-db';
import { openSyntheticRecoveryEvidence } from '../../../scripts/assess/rad085-erasure-recovery.mjs';

type Db = Awaited<ReturnType<typeof fixture>>;
async function fixture(shared = true, content = true, closed = true) {
 const db = await openRad085Database();
 try {
  await db.admin.query('alter table auth.users add column banned_until timestamptz; create table auth.sessions(user_id uuid); create table auth.refresh_tokens(user_id text)');
  for (let n = 1; n <= 8; n++) await db.admin.query("insert into auth.users(id,email,email_confirmed_at,raw_user_meta_data) values($1,$2,now(),'{\"display_name\":\"SYNTHETIC\",\"consent_version\":\"2026-10-24\"}')", [id(n), `d3-${n}@example.test`]);
  await db.admin.query("update public.profiles set status='approved',role=case when user_id in ($1,$2) then 'owner' else 'participant' end", [id(1), id(6)]);
  for (const n of [2, 3]) await db.rpc(1, 'appointment_v1', [id(n), true]);
  await db.admin.query(readFileSync('supabase/manual/rad085-sharing-policy-live-p1.sql', 'utf8'));
  const policy = (await db.admin.query('select required_version,text_digest from assess.sharing_policy')).rows[0];
  for (const n of [4, 5]) await db.rpc(n, 'sharing_consent_v1', [policy.required_version, policy.text_digest, true]);
  for (const n of [4, 5]) await db.rpc(n, 'consent_v2', ['assess-pilot-2026-10-20-v2']);
  const g = await db.rpc<{ id: string; code: string }>(2, 'supervisor_group_v1', ['create', null, null, 'SYNTHETIC group', new Date(Date.now() + 3600000)]);
  if (shared) for (const n of [4, 5]) {
   const r = await db.rpc<{ id: string; revision: number }>(n, 'join_request_v1', [g.code]);
   await db.rpc(2, 'join_decide_v1', [r.id, r.revision, 'approve']);
  }
  if (content) {
   const doc = { schemaVersion: 1, id: id(200), revision: 0, name: 'SYNTHETIC required attribution', track: 'mixed', policy: {}, items: [] };
   await db.rpc(2, 'draft_save_v1', [g.id, id(200), 0, doc]);
   await db.admin.query("insert into assess.versions(id,owner_id,assessment_id,version,name,track,available) values($1,$2,$3,'1','SYNTHETIC','mixed',true)", [id(300), id(2), id(200)]);
   await db.admin.query("insert into assess.content_submissions values($1,null,'installed')", [id(300)]);
   await db.admin.query("insert into assess.publications values($1,'{\"credit\":\"Required synthetic attribution\"}','{}',clock_timestamp())", [id(300)]);
   await db.admin.query("insert into assess.authoring_reviewed_packages select draft_id,revision,digest,'{\"credit\":\"Required synthetic attribution\"}' from assess.authoring_revisions where draft_id=$1", [id(200)]);
   await db.admin.query("insert into assess.practical_presentations values($1,'{}')", [id(300)]);
   await db.admin.query('insert into assess.authoring_publication_links select $1,draft_id,revision,digest from assess.authoring_revisions where draft_id=$2', [id(300), id(200)]);
   await db.admin.query("insert into assess.assignments(id,owner_id,version_id,source_group_ids) values($1,$2,$3,$4)", [id(400), id(2), id(300), [g.id]]);
   await db.admin.query('insert into assess.targets values($1,$2),($1,$3)', [id(400), id(4), id(5)]);
   await db.admin.query(`insert into assess.assignment_reviews(id,writer_id,group_id,group_revision,appointment_revision,draft_id,draft_revision,version_id,source_digest,expires_at,created_at,assignment_id)
    select $1,$2,$3,1,1,draft_id,revision,$4,digest,clock_timestamp()+interval '5 minutes',clock_timestamp(),$5 from assess.authoring_revisions where draft_id=$6`, [id(450), id(2), g.id, id(300), id(400), id(200)]);
   await db.admin.query('insert into assess.assignment_scopes values($1,$2,$3,$4)', [id(400), g.id, id(2), id(450)]);
   for (const n of [4, 5]) {
    await db.admin.query("insert into assess.sessions(id,assignment_id,user_id,ordinal,state,started_at,submitted_at,expires_at) values($1,$2,$3,1,'graded',clock_timestamp(),clock_timestamp(),clock_timestamp()+interval '6 months')", [id(500 + n), id(400), id(n)]);
    await db.admin.query("insert into assess.results values($1,1,1,1,'SYNTHETIC','mixed','hidden')", [id(500 + n)]);
   }
   if (closed) await db.rpc(2, 'assignment_close_v2', [id(400), 1]);
  }
  return { ...db, g };
 } catch (e) { await db.close(); throw e; }
}
const c2 = (db: Db, action: string, who = 2, actor = 1) => db.transaction(actor, async c => (await c.query('select public.owner_account_deletion_v1($1,$2) v', [action, id(who)])).rows[0].v);
async function pending(db: Db, who = 2, untilDeadline = '2 seconds') {
 await c2(db, 'deactivate', who);
 // One synthetic clock origin, set before transfer. Never extend/rewrite a receipt's requested_at.
 await db.admin.query("update public.c2_account_deletions set requested_at=clock_timestamp()-interval '30 days'+$2::interval where user_id=$1", [id(who), untilDeadline]);
}
type Inventory = { inventoryDigest: string; contentDigest: string; contentReviewRequired: boolean };
const preview = (db: Db, who = 2) => db.rpc<Inventory>(1, 'account_management_v1', ['preview', id(who)]);
async function clearance(db: Db, inv: Inventory, who = 2) {
 await db.admin.query("insert into assess.erasure_rights(user_id,content_digest,disposition,reviewed_by) values($1,$2,'minimum-required-attribution',$3) on conflict(user_id) do update set content_digest=excluded.content_digest", [id(who), inv.contentDigest, id(1)]);
}
async function transfer(db: Db, who = 2) {
 const inv = await preview(db, who); if (inv.contentReviewRequired) await clearance(db, inv, who);
 await db.rpc(1, 'account_management_v1', ['transfer', id(who), inv.inventoryDigest]); return inv;
}
async function deadline(db: Db) {
 // Actual PostgreSQL clock + wait, not a replaced clock or weakened C2 expectation.
 await db.admin.query("select pg_sleep(greatest(0,extract(epoch from(requested_at+interval '30 days'-clock_timestamp())))::float8+0.01) from public.c2_account_deletions");
}
async function retained(db: Db) {
 const out: Record<string, unknown> = {};
 for (const table of ['results', 'sessions', 'targets', 'membership_periods', 'memberships', 'publications', 'authoring_revisions', 'authoring_publication_links', 'authoring_reviewed_packages', 'practical_presentations']) out[table] = (await db.admin.query(`select to_jsonb(x) v from assess.${table} x order by to_jsonb(x)::text`)).rows;
 out.assignment = (await db.admin.query("select to_jsonb(a)-'owner_id' v from assess.assignments a")).rows;
 return out;
}
it('O2 initializer is byte-identical, idempotent, rejects drift and rolls back without inventing acceptance', async () => {
 const db = await fixture(false, false);
 try {
  const sql = readFileSync('supabase/manual/rad085-sharing-policy-live-p1.sql', 'utf8');
  const payload = readFileSync('docs/RAD-085_SHARING_LIVE_P1_PROPOSAL.patch', 'utf8').split('\n').filter(l => l.startsWith('+') && !l.startsWith('+++')).map(l => l.slice(1)).join('\n') + '\n';
  expect(sql).toBe(payload);
  const before = (await db.admin.query('select * from assess.sharing_consents')).rows;
  await db.admin.query(sql); await db.admin.query(sql);
  expect((await db.admin.query('select * from assess.sharing_consents')).rows).toEqual(before);
  await db.admin.query("update assess.sharing_policy set required_version='unknown'");
  await expect(db.admin.query(sql)).rejects.toMatchObject({ code: '55000' }); await db.admin.query('rollback');
  expect((await db.admin.query('select required_version from assess.sharing_policy')).rows[0].required_version).toBe('unknown');
  await db.admin.query('begin'); await db.admin.query("update assess.sharing_policy set required_version=null,text_digest=null"); await db.admin.query('rollback');
  expect((await db.admin.query('select required_version from assess.sharing_policy')).rows[0].required_version).toBe('unknown');
 } finally { await db.close(); }
}, 30000);
it.each([true, false])('transfers before day 30, uses normal C2 afterward and preserves others, attribution and closed_at (closed=%s)', async closed => {
 const db = await fixture(true, true, closed);
 try {
  await db.rpc(5, 'sharing_consent_v1', [null, null, false]); // Withdrawal does not drop frozen targets/results.
  const before = await retained(db); await pending(db); const inv = await transfer(db);
  expect((await c2(db, 'finalise')).processed).toBe(0);
  expect((await db.admin.query("select transferred_at<requested_at+interval '30 days' ok from assess.erasure_transfers")).rows[0].ok).toBe(true);
  await expect(db.rpc(2, 'scope_page_v1', ['groups'])).rejects.toMatchObject({ code: '42501' });
  // Explicit refresh after an unknown ACK yields the same receipt, no second transfer.
  expect(await db.rpc(1, 'account_management_v1', ['transfer', id(2), inv.inventoryDigest])).toEqual({ transferred: true, replayed: true });
  await deadline(db); expect((await c2(db, 'finalise')).processed).toBe(1);
  expect((await c2(db, 'finalise')).processed).toBe(0);
  expect(await retained(db)).toEqual(before);
  for (const table of ['groups', 'versions', 'assignments']) expect((await db.admin.query(`select owner_id from assess.${table}`)).rows[0].owner_id).toBeNull();
  for (const table of ['group_managers', 'version_managers', 'assignment_managers']) expect((await db.admin.query(`select manager_id from assess.${table}`)).rows).toEqual([{ manager_id: id(1) }]);
  expect((await db.admin.query('select writer_id from assess.authoring_drafts')).rows[0].writer_id).toBeNull();
  expect((await db.admin.query('select writer_id from assess.assignment_reviews')).rows[0].writer_id).toBeNull();
  expect((await db.admin.query('select supervisor_id from assess.assignment_scopes')).rows[0].supervisor_id).toBeNull();
  expect((await db.admin.query('select * from auth.users where id=$1', [id(2)])).rowCount).toBe(0);
  expect((await db.admin.query('select * from assess.erasure_transfers')).rowCount).toBe(0);
  if (closed) await expect(db.admin.query('update assess.assignments set owner_id=$1', [id(1)])).rejects.toMatchObject({ code: '42501' });
 } finally { await db.close(); }
}, 30000);
it('student-only C2 still has its recovery window; an unpublished private supervisor also erases', async () => {
 for (const who of [4, 2]) {
  const db = await fixture(false, false);
  try {
   await pending(db, who);
   if (who === 2) expect((await preview(db)).contentReviewRequired).toBe(false); // Nothing retained: no transfer/clearance needed.
   expect((await c2(db, 'finalise', who)).processed).toBe(0);
   await deadline(db); expect((await c2(db, 'finalise', who)).processed).toBe(1);
   expect((await db.admin.query('select * from auth.users where id=$1', [id(who)])).rowCount).toBe(0);
   expect((await db.admin.query('select * from assess.results')).rowCount).toBe(0);
   if (who === 2) expect((await db.admin.query('select * from assess.groups')).rowCount).toBe(0);
  } finally { await db.close(); }
 }
}, 30000);
it('keeps self/last-owner and private ACL protection, rejects unresolved attribution, stale inventory and new FKs', async () => {
 const db = await fixture();
 try {
  await expect(c2(db, 'deactivate', 1)).rejects.toMatchObject({ code: '42501' });
  await db.admin.query("update public.profiles set status='suspended' where user_id=$1", [id(6)]);
  await expect(c2(db, 'deactivate', 1)).rejects.toThrow(/last owner/);
  await expect(c2(db, 'deactivate', 6, 6)).rejects.toMatchObject({ code: '42501' });
  await pending(db, 2, '1 day'); const inv = await preview(db);
  await expect(db.rpc(1, 'account_management_v1', ['transfer', id(2), inv.inventoryDigest])).rejects.toMatchObject({ code: '55000' });
  expect((await db.admin.query('select * from assess.group_managers')).rowCount).toBe(0);
  await clearance(db, inv); await db.admin.query('update assess.assignments set revision=revision+1');
  await expect(db.rpc(1, 'account_management_v1', ['transfer', id(2), inv.inventoryDigest])).rejects.toMatchObject({ code: '40001' });
  for (const who of [1, 3, 4, 'anon', 'worker'] as const) {
   for (const [name, args] of [['erase_account_d3_v1', [id(2)]], ['transfer_management_d3_v1', [id(2), inv.inventoryDigest]], ['d3_inventory_v1', [id(2)]]] as const) await expect(db.rpc(who, name, [...args])).rejects.toMatchObject({ code: '42501' });
  }
  for (const who of [3, 4, 'anon', 'worker'] as const) await expect(db.rpc(who, 'account_management_v1', ['preview', id(2)])).rejects.toMatchObject({ code: '42501' });
  await db.admin.query('create table public.synthetic_new_fk(user_id uuid references public.profiles(user_id))');
  await expect(preview(db)).rejects.toMatchObject({ code: '55000' });
  await db.admin.query('drop table public.synthetic_new_fk; create table auth.synthetic_new_fk(user_id uuid references auth.users(id))');
  await expect(preview(db)).rejects.toMatchObject({ code: '55000' });
 } finally { await db.close(); }
}, 30000);
it('reports/escalates transfer at day 25 and overdue day 30/37 without extending requested_at or allowing late transfer', async () => {
 const db = await fixture(true, false);
 try {
  await pending(db, 2, '-8 days'); const inv = await preview(db);
  const before = (await db.admin.query('select requested_at from public.c2_account_deletions')).rows;
  const ops = await db.rpc<{ rows: { transfer_alert: boolean; finalise_due: boolean; overdue: boolean }[] }>(1, 'account_management_v1', ['list']);
  expect(ops.rows[0]).toMatchObject({ transfer_alert: true, finalise_due: true, overdue: true });
  await expect(db.rpc(1, 'account_management_v1', ['transfer', id(2), inv.inventoryDigest])).rejects.toMatchObject({ code: '55000' });
  await expect(c2(db, 'finalise')).rejects.toMatchObject({ code: '55000' });
  expect((await db.admin.query('select requested_at from public.c2_account_deletions')).rows).toEqual(before);
 } finally { await db.close(); }
}, 30000);
it('rolls back complete identity minimisation on failure and serialises scope changes before transfer/finalise', async () => {
 const db = await fixture(); const lock = await db.connect('d3-synthetic-lock');
 try {
  await pending(db); const inv = await preview(db); await clearance(db, inv);
  await lock.query('begin'); await lock.query('select * from assess.scope_lock for share');
  await expect(db.transaction(1, async c => { await c.query("set local lock_timeout='100ms'"); await c.query("select assess.account_management_v1('transfer',$1,$2)", [id(2), inv.inventoryDigest]); })).rejects.toMatchObject({ code: '55P03' });
  expect((await db.admin.query('select * from assess.group_managers')).rowCount).toBe(0);
  await lock.query('rollback'); await db.rpc(1, 'account_management_v1', ['transfer', id(2), inv.inventoryDigest]); await deadline(db);
  const before = await retained(db);
  await db.admin.query("create function public.synthetic_d3_failure() returns trigger language plpgsql as $$begin raise exception 'SYNTHETIC rollback'; end$$; create trigger synthetic_d3_failure before delete on auth.users for each row execute function public.synthetic_d3_failure()");
  await expect(c2(db, 'finalise')).rejects.toMatchObject({ code: 'P0001' });
  expect(await retained(db)).toEqual(before);
  expect((await db.admin.query('select owner_id from assess.assignments')).rows[0].owner_id).toBe(id(2));
  expect((await db.admin.query('select erasing_xid from assess.erasure_transfers')).rows[0].erasing_xid).toBeNull();
  await db.admin.query('drop trigger synthetic_d3_failure on auth.users; drop function public.synthetic_d3_failure()');
  expect((await c2(db, 'finalise')).processed).toBe(1);
 } finally { await lock.query('rollback'); await db.close(); }
}, 30000);
it('restores a pre-request PostgreSQL snapshot and verifies external encrypted evidence before replaying management/erasure twice', async () => {
 const db = await fixture(), evidence = await openSyntheticRecoveryEvidence(); let restored: Client | undefined;
 const receiptDir = mkdtempSync(join(tmpdir(), 'rad085-d3-encrypted-'));
 try {
  // Backup predates even the original deletion request and management transfer.
  await db.admin.query('create database d3_before template postgres');
  await pending(db); const inv = await preview(db); await clearance(db, inv);
  await db.rpc(1, 'account_management_v1', ['transfer', id(2), inv.inventoryDigest]);
  // JSON timestamps preserve all six PostgreSQL fractional digits, unlike JS Date.
  const receipt = (await db.admin.query('select to_jsonb(t) v from assess.erasure_transfers t')).rows[0].v;
  const rights = (await db.admin.query('select to_jsonb(r) v from assess.erasure_rights r')).rows[0].v;
  const before = await retained(db); await deadline(db);
  evidence.prepare({ operation: id(980), action: 'account-delete', target: id(2), at: new Date().toISOString() });
  // A lost ACK leaves an unresolved external intent until explicit state inspection.
  await c2(db, 'finalise'); expect(() => evidence.head()).toThrow();
  expect((await db.admin.query("select clock_timestamp()<=($1::timestamptz+interval '37 days') ok", [receipt.requested_at])).rows[0].ok).toBe(true);
  expect((await db.admin.query('select * from auth.users where id=$1', [id(2)])).rowCount).toBe(0);
  evidence.complete(id(980), true);
  const head = evidence.head(), event = evidence.page(0, 1)[0]!;
  expect(evidence.journal.verify(event)).toBe(true); expect(event.target).toBe(id(2));
  const key = randomBytes(32), iv = randomBytes(12), cipher = createCipheriv('aes-256-gcm', key, iv);
  cipher.setAAD(Buffer.from(head.mac));
  const encrypted = Buffer.concat([cipher.update(JSON.stringify({ receipt, rights, operation: event.operation })), cipher.final()]);
  const tag = cipher.getAuthTag(), file = join(receiptDir, 'completed-transfer.enc');
  writeFileSync(file, Buffer.concat([iv, tag, encrypted]), { mode: 0o600 });
  expect(statSync(file).mode & 0o777).toBe(0o600);
  const decrypt = (bytes: Buffer, mac: string) => {
   const decipher = createDecipheriv('aes-256-gcm', key, bytes.subarray(0, 12));
   decipher.setAuthTag(bytes.subarray(12, 28)); decipher.setAAD(Buffer.from(mac));
   return JSON.parse(Buffer.concat([decipher.update(bytes.subarray(28)), decipher.final()]).toString('utf8'));
  };
  const bytes = readFileSync(file), corrupt = Buffer.from(bytes); corrupt[corrupt.length - 1] = (corrupt[corrupt.length - 1] ?? 0) ^ 1;
  expect(() => decrypt(corrupt, head.mac)).toThrow();
  expect(() => decrypt(bytes, '0'.repeat(64))).toThrow();
  expect(evidence.head()).toEqual(head); // Latest independently anchored head, outside snapshot.
  const verified = decrypt(bytes, head.mac);
  expect(verified.operation).toBe(event.operation); expect(verified.receipt.user_id).toBe(event.target);
  await db.admin.query('create database d3_restored template d3_before');
  restored = new Client({ ...db.poolConfig('postgres'), database: 'd3_restored' }); await restored.connect();
  // Privileged isolated restore operator ONLY, after verifying the latest external
  // journal's completed transfer and deletion. No API can supply a replay timestamp.
  for (let pass = 0; pass < 2; pass++) {
   await restored.query('begin'); await restored.query("select set_config('request.jwt.claim.sub',$1,true)", [id(1)]);
   if (pass === 0) {
    await restored.query("select public.owner_account_deletion_v1('deactivate',$1)", [id(2)]);
    // Restore the authenticated ORIGINAL request time, never a renewed live window.
    await restored.query('update public.c2_account_deletions set requested_at=$2 where user_id=$1', [id(2), verified.receipt.requested_at]);
    await restored.query('insert into assess.erasure_rights(user_id,content_digest,disposition,reviewed_by,reviewed_at) values($1,$2,$3,$4,$5)',
     [id(2), verified.rights.content_digest, verified.rights.disposition, verified.rights.reviewed_by, verified.rights.reviewed_at]);
    await restored.query('select assess.transfer_management_d3_v1($1,$2,$3)', [id(2), verified.receipt.inventory_digest, verified.receipt.transferred_at]);
   }
   await restored.query('select assess.erase_account_d3_v1($1)', [id(2)]); await restored.query('commit');
  }
  expect((await restored.query('select * from auth.users where id=$1', [id(2)])).rowCount).toBe(0);
  expect((await restored.query('select to_jsonb(x) v from assess.results x order by to_jsonb(x)::text')).rows).toEqual(before.results);
  expect((await restored.query("select to_jsonb(a)-'owner_id' v from assess.assignments a")).rows).toEqual(before.assignment);
 } finally { await restored?.end(); await db.close(); evidence.close(); rmSync(receiptDir, { recursive: true, force: true }); }
}, 30000);

it('lets the owner close a transferred open assignment without changing authorship or targets', async () => {
 const db = await fixture(true, true, false);
 try {
  await pending(db, 2, '1 day'); await transfer(db);
  const targets = (await db.admin.query('select * from assess.targets order by user_id')).rows;
  await db.rpc(1, 'assignment_close_v2', [id(400), 1]);
  expect((await db.admin.query('select closed_at is not null closed,owner_id from assess.assignments')).rows[0]).toEqual({ closed: true, owner_id: id(2) });
  expect((await db.admin.query('select * from assess.targets order by user_id')).rows).toEqual(targets);
  const listing = await db.rpc<{ rows: { id: string }[] }>(1, 'assignment_page_v2'); expect(listing.rows.map(r => r.id)).toContain(id(400));
 } finally { await db.close(); }
}, 30000);
it('binds nullable appointment/join-decision provenance and rejects an over-ceiling inventory without truncation', async () => {
 const db = await fixture();
 try {
  await db.admin.query('update assess.supervisor_appointments set appointed_by=$1 where user_id=$2', [id(2), id(3)]);
  await pending(db); await transfer(db); await deadline(db); await c2(db, 'finalise');
  expect((await db.admin.query('select appointed_by from assess.supervisor_appointments where user_id=$1', [id(3)])).rows[0].appointed_by).toBeNull();
  expect((await db.admin.query('select decided_by from assess.group_join_requests')).rows.every(r => r.decided_by === null)).toBe(true);
  await db.admin.query("insert into assess.groups(owner_id,name) select $1,'SYNTHETIC bounded inventory' from generate_series(1,1001)", [id(3)]);
  await expect(preview(db, 3)).rejects.toMatchObject({ code: '54000' });
 } finally { await db.close(); }
}, 30000);
it('checks complete D3/C2 catalogue read-only and rejects an unreviewed FK at installation', async () => {
 const db = await fixture(false, false);
 try {
  const results = await db.admin.query(readFileSync('supabase/checks/rad085-d3-ready.sql', 'utf8'));
  const flags = (results as unknown as { rows: { ready: boolean }[] }[]).find(r => r.rows.length)?.rows;
  // RAD085-SEC-FIXES-20261027 SEC-05: +effective privileges, role attributes/memberships, scope lock, sharing policy.
  expect(flags?.length).toBe(13); expect(flags?.every(r => r.ready)).toBe(true);
  await db.admin.query("create table assess.synthetic_drift(id uuid)");
  const drift = await db.admin.query(readFileSync('supabase/checks/rad085-d3-ready.sql', 'utf8'));
  expect((drift as unknown as { rows: { ready: boolean }[] }[]).find(r => r.rows.length)?.rows.some(r => !r.ready)).toBe(true);
 } finally { await db.close(); }
 await expect(openRad085Database(async c => { await c.query('create table public.synthetic_new_fk(user_id uuid references public.profiles(user_id))'); })).rejects.toMatchObject({ code: '55000' });
}, 30000);
it('runs the exact restored-database authorization script and rolls back every synthetic account', async () => {
 const db = await fixture(false, false);
 try {
  await db.admin.query(readFileSync('scripts/assess/rad085-restored-authorization.sql', 'utf8'));
  expect((await db.admin.query("select count(*)::int n from auth.users where id::text like 'f0850000-0000-0000-0000-%'")).rows[0].n).toBe(0);
 } finally { await db.close(); }
}, 30000);

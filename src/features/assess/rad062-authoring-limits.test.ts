import { expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { AUTHORING_LIMITS_V1, authoringCapacityHint } from './authoring-limits';
import { rad062Fixture, syntheticDraft, migration, id } from './rad062-test-fixture';
import manifest from '../../../scripts/pages/frontend-schema.json';

it('M03 is deferred, UI remains dormant, server/client policy agrees at exact boundaries', async () => {
 const db = await rad062Fixture(2);
 try {
  expect((await db.admin.query("select to_regprocedure('assess.authoring_cleanup_v1(integer,boolean)') v")).rows[0].v).toBeNull();
  const before = (await db.admin.query("select oid,prosrc,proacl,proconfig,proowner from pg_proc where pronamespace='assess'::regnamespace and proname like '%_v1' order by oid")).rows;
  await db.admin.query(migration(3));
  expect((await db.admin.query("select oid,prosrc,proacl,proconfig,proowner from pg_proc where pronamespace='assess'::regnamespace and proname like '%_v1' and oid=any($1::oid[]) order by oid", [before.map(r => r.oid)])).rows).toEqual(before);
  expect(await db.call('authoring_limits_v1')).toEqual(AUTHORING_LIMITS_V1);
  for (const n of [4194303, 4194304, 4194305, 8388607, 8388608]) {
   const hint = await db.call<{ authorWarning: boolean }>('authoring_admission_v1', [n - 1, n, 299999999]);
   expect(hint.authorWarning).toBe(n >= 4194304);
   expect(authoringCapacityHint(n)).toBe(n >= 8388608 ? 'stop-growth' : n >= 4194304 ? 'warn' : 'normal');
  }
  await expect(db.call('authoring_admission_v1', [8388608, 8388609, 0])).rejects.toMatchObject({ code: '54000' });
  // Existing over-quota content can shrink; admission never prevents attempt settlement.
  await expect(db.call('authoring_admission_v1', [9000000, 8999999, 450000000])).resolves.toMatchObject({ databaseAction: 'stop-growth-and-start' });
  for (const [size, action] of [[299999999, 'normal'], [300000000, 'warn-owner'], [349999999, 'warn-owner'], [350000000, 'review-and-reduce-batches'], [399999999, 'review-and-reduce-batches']] as const) expect(await db.call('authoring_admission_v1', [0, 1, size])).toMatchObject({ databaseAction: action });
  await expect(db.call('authoring_admission_v1', [0, 1, 400000000])).rejects.toMatchObject({ code: '54000' });
  for (const role of ['anon', 'authenticated', 'assess_worker', 'assess_authoring_bridge']) expect((await db.admin.query("select has_function_privilege($1,'assess.authoring_cleanup_v1(integer,boolean)','execute') v", [role])).rows[0].v).toBe(false);
 } finally { await db.close(); }
 const name = '20261030000300_rad062_authoring_limits.sql';
 expect(manifest.deferredMigrations[name].sha256).toBe(createHash('sha256').update(readFileSync('supabase/migrations/' + name)).digest('hex'));
 expect(manifest.requiredMigrations).not.toContain(name);
});
it('three drafts across groups and ten revisions are atomic under competing saves; v1 remains callable', async () => {
 const db = await rad062Fixture();
 try {
  const second = (await db.rpc<{ id: string }>(2, 'supervisor_group_v1', ['create', null, null, 'SYNTHETIC second group', new Date(Date.now() + 3600000).toISOString()])).id;
  const legacy = { ...syntheticDraft(11), schemaVersion: 1, items: [] };
  await db.save(syntheticDraft(10));
  await db.rpc(2, 'draft_save_v1', [second, id(11), 0, legacy, '[]']);
  const create = await Promise.allSettled([db.save(syntheticDraft(12)), db.save(syntheticDraft(13), second)]);
  expect(create.filter(r => r.status === 'fulfilled')).toHaveLength(1);
  expect(create.filter(r => r.status === 'rejected')).toMatchObject([{ reason: { code: '54000' } }]);
  let d = (await db.call<{ document: ReturnType<typeof syntheticDraft> }>('draft_page_v2', [db.group, id(10)])).document;
  for (let n = 1; n < 9; n++) d = (await db.save(d)).document;
  const same = await Promise.allSettled([db.save(d), db.save(d)]);
  expect(same.filter(r => r.status === 'fulfilled')).toHaveLength(1);
  expect(same.filter(r => r.status === 'rejected')).toMatchObject([{ reason: { code: '40001' } }]);
  d = (same.find(r => r.status === 'fulfilled') as PromiseFulfilledResult<{ document: typeof d }>).value.document;
  await expect(db.save(d)).rejects.toMatchObject({ code: '54000' });
  expect((await db.admin.query('select count(*)::int n from assess.authoring_revisions where draft_id=$1', [d.id])).rows[0].n).toBe(10);
  await expect(db.rpc(2, 'draft_save_v1', [second, id(11), 1, { ...legacy, revision: 1 }, '[]'])).resolves.toMatchObject({ revision: 2 });
  await expect(db.rpc(2, 'draft_save_v1', [db.group, id(20), 0, { ...legacy, id: id(20) }, '[]'])).rejects.toMatchObject({ code: '54000' });
 } finally { await db.close(); }
});
it('64 KiB counts server-serialized document and refs; package writes cannot bypass the cap', async () => {
 const db = await rad062Fixture();
 try {
  const d = syntheticDraft();
  // Valid JSON metadata padded via many option texts, not an invalid oversized prompt.
  const item = d.items[0]!; if (item.type !== 'single-choice') throw Error('fixture');
  item.options = Array.from({ length: 14 }, (_, n) => ({ id: 'o' + n, text: 'x'.repeat(4500) })); item.correctOptionId = 'o0';
  const size = async () => (await db.admin.query('select octet_length(jsonb_set($1::jsonb,\'{revision}\',\'1\')::text)+2 n', [d])).rows[0].n as number;
  item.options[0]!.text += 'x'.repeat(65536 - await size());
  const saved = await db.save(d); expect(await size()).toBe(65536);
  const tooBig = structuredClone(saved.document); const i = tooBig.items[0]!; if (i.type !== 'single-choice') throw Error('fixture'); i.options[0]!.text += 'x';
  await expect(db.save(tooBig)).rejects.toMatchObject({ code: '54000' });
  await expect(db.admin.query("insert into assess.content_candidates_v2(draft_id,revision,source_digest,document) values($1,1,'x',jsonb_build_object('data',repeat('x',65536)))", [d.id])).rejects.toMatchObject({ code: '54000' });
 } finally { await db.close(); }
});
it('real serialized 4 MiB warning and 8 MiB save race include legacy retained data', async () => {
 const db = await rad062Fixture(2);
 try {
  // Existing legacy references have no storage constraint in the historical schema.
  // Retain them unchanged; new v2 writes must account for them without truncation.
  await db.admin.query("insert into assess.authoring_drafts values($1,$2,$3,'mixed',1,'{\"schemaVersion\":1,\"items\":[]}',jsonb_build_array(repeat('x',4100000)),now())", [id(30), id(2), db.group]);
  await db.admin.query(migration(3));
  const d = syntheticDraft(); const first = await db.save(d); expect(first.capacity.authorWarning).toBe(false);
  // Administrative fixture adjustment represents already-retained legacy data only.
  await db.admin.query('alter table assess.authoring_drafts disable trigger rad062_quota_check');
  await db.admin.query("update assess.authoring_drafts set refs=jsonb_build_array(repeat('x',4194304)) where id=$1", [id(30)]);
  await db.admin.query('alter table assess.authoring_drafts enable trigger rad062_quota_check');
  const next = await db.save(first.document); expect(next.capacity.authorWarning).toBe(true);
  const other = syntheticDraft(11); await db.save(other);
  // Leave room for one revision+provenance package across the two draft lines.
  const logicalDelta = (await db.admin.query("select octet_length(to_jsonb(r)::text)+(select sum(octet_length(to_jsonb(p)::text)) from assess.authoring_provenance_v2 p where p.draft_id=r.draft_id and p.revision=r.revision) n from assess.authoring_revisions r where draft_id=$1 and revision=2", [d.id])).rows[0].n;
  const usage = Number(await db.call('authoring_usage_v1', [id(2)]));
  await db.admin.query('alter table assess.authoring_drafts disable trigger rad062_quota_check');
  await db.admin.query("update assess.authoring_drafts set refs=jsonb_build_array(repeat('x',$2::integer)) where id=$1", [id(30), 4194304 + 8388608 - usage - Math.ceil(Number(logicalDelta) * 1.5)]);
  await db.admin.query('alter table assess.authoring_drafts enable trigger rad062_quota_check');
  other.revision = 1;
  const race = await Promise.allSettled([db.save(next.document), db.save(other)]);
  expect(race.filter(r => r.status === 'fulfilled')).toHaveLength(1);
  expect(race.filter(r => r.status === 'rejected')).toMatchObject([{ reason: { code: '54000' } }]);
  expect(Number(await db.call('authoring_usage_v1', [id(2)]))).toBeLessThanOrEqual(8388608);
 } finally { await db.close(); }
});
it('cleanup is explicit, bounded, >30 days, protects current/latest3, links, rights and unknown dependencies', async () => {
 const db = await rad062Fixture();
 try {
  const d = syntheticDraft(); d.items = [];
  let saved = (await db.save(d)).document;
  for (let n = 1; n < 8; n++) saved = (await db.save(saved)).document;
  await db.admin.query("update assess.authoring_revisions set created_at=now()-interval '31 days' where draft_id=$1", [d.id]);
  await db.admin.query("update assess.authoring_revisions set created_at=now()-interval '29 days' where draft_id=$1 and revision=2", [d.id]);
  await db.admin.query("insert into assess.authoring_holds_v1 values($1,3,'rights'),($1,4,'emergency')", [d.id]);
  expect(await db.call('authoring_cleanup_v1', [100, true])).toMatchObject({ dryRun: true, revisions: 2 });
  expect((await db.admin.query('select count(*)::int n from assess.authoring_revisions')).rows[0].n).toBe(8);
  expect(await db.call('authoring_cleanup_v1', [1, false])).toMatchObject({ revisions: 1, examined: 1 });
  await db.call('authoring_cleanup_v1', [100, false]);
  expect((await db.admin.query('select revision from assess.authoring_revisions order by revision')).rows.map(r => r.revision)).toEqual([2, 3, 4, 6, 7, 8]);
  await db.admin.query('create table assess.synthetic_unknown_link(draft_id uuid,revision integer,foreign key(draft_id,revision) references assess.authoring_revisions)');
  await expect(db.call('authoring_cleanup_v1', [100, false])).rejects.toMatchObject({ code: '55000' });
  await expect(db.call('authoring_cleanup_v1', [101, false])).rejects.toMatchObject({ code: '22023' });
  expect((await db.admin.query('select enabled from assess.launch_gate')).rows[0].enabled).toBe(false);
 } finally { await db.close(); }
});
it('cleanup never removes published/assigned/attempted evidence and rechecks a concurrent publisher', async () => {
 const db = await rad062Fixture();
 try {
  const d = syntheticDraft(); d.items = [];
  let saved = (await db.save(d)).document;
  for (let n = 1; n < 5; n++) saved = (await db.save(saved)).document;
  await db.admin.query("update assess.authoring_revisions set created_at=now()-interval '31 days'");
  await db.admin.query("insert into assess.versions(id,owner_id,assessment_id,version,name,track) values($1,$2,$3,'1','SYNTHETIC','mixed')", [id(50), id(2), d.id]);
  const publisher = await db.connect();
  try {
   await publisher.query('begin'); await publisher.query('select id from assess.authoring_drafts where id=$1 for update', [d.id]);
   const cleanup = db.call('authoring_cleanup_v1', [100, false]);
   await publisher.query('insert into assess.authoring_publication_links select $1,draft_id,revision,digest from assess.authoring_revisions where draft_id=$2 and revision=1', [id(50), d.id]);
   await publisher.query('commit');
   expect(await cleanup).toMatchObject({ revisions: 0 });
  } finally { await publisher.end(); }
  await db.admin.query('insert into assess.assignments(id,owner_id,version_id) values($1,$2,$3)', [id(51), id(2), id(50)]);
  await db.rpc(3, 'consent_v2', ['assess-pilot-2026-10-20-v2']);
  await db.admin.query("insert into assess.sessions(id,assignment_id,user_id,ordinal,state,started_at) values($1,$2,$3,1,'active',now())", [id(52), id(51), id(3)]);
  expect(await db.call('authoring_cleanup_v1', [100, false])).toMatchObject({ revisions: 0 });
  expect((await db.admin.query('select count(*)::int n from assess.authoring_revisions')).rows[0].n).toBe(5);
 } finally { await db.close(); }
});

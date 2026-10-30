import { expect, it } from 'vitest';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { rad062Fixture, syntheticDraft, migration, id } from './rad062-test-fixture';
import type { AuthoringDraftV2 } from './contracts-v2';
import type { BridgeSnapshotV2 } from './server-authoring-bridge-v2';
import type { AssessmentPublicationV2 } from './server-contracts-v2';
import { publicationFromDraftV2 } from './server-authoring-bridge-v2';
import { validatePublicationV2, validatePublication } from './server-validation';
import { randomPoolMaximum } from './random-pool';
import manifest from '../../../scripts/pages/frontend-schema.json';
const poolDraft = (size = 2): AuthoringDraftV2 => {
 const d = syntheticDraft(); const q = d.items[0]!; if (q.type !== 'single-choice') throw Error('fixture');
 d.randomPool = { version: 1, size };
 d.items = [0, 1, 2, 3].map(n => ({ ...structuredClone(q), id: 'q' + n, maximum: n === 0 ? '1.250' : '1.25', ...(n === 0 ? { shuffleOptions: false } : {}), options: ['a', 'b', 'c', 'd'].map(id => ({ id, text: 'SYNTHETIC ' + id })) }));
 d.items.push(...[0, 1].map(n => ({ id: 'w' + n, type: 'written-answer' as const, prompt: 'SYNTHETIC fixed written ' + n, maximum: String(3 + n), provenance: structuredClone(q.provenance) })));
 return d;
};
type Db = Awaited<ReturnType<typeof rad062Fixture>>;
async function staged(db: Db, d = poolDraft()) {
 const saved = await db.save(d);
 const stored = await db.call<BridgeSnapshotV2>('authoring_bridge_read_v2', [db.group, d.id, saved.document.revision]);
 const publication = publicationFromDraftV2(stored, []);
 const candidate = await db.call('content_submit_v2', [db.group, d.id, saved.document.revision, publication]);
 return { publication, candidate };
}
async function installed(db: Db, publication: AssessmentPublicationV2) {
 await db.admin.query("insert into assess.versions(id,owner_id,assessment_id,version,name,track,schema_version,available) values($1,$2,$3,'1','SYNTHETIC','mixed',2,true)", [id(50), id(2), publication.assessment.ref.id]);
 await db.admin.query('insert into assess.publications(version_id,document,specs) values($1,$2,$3)', [id(50), publication, Object.fromEntries(publication.assessment.items.map(i => [i.ref.id, {}]))]);
 await db.admin.query('insert into assess.assignments(id,owner_id,version_id) values($1,$2,$3)', [id(51), id(2), id(50)]);
 await db.admin.query('insert into assess.targets values($1,$2)', [id(51), id(3)]);
 await db.rpc(3, 'consent_v2', ['assess-pilot-2026-10-20-v2']);
}
async function session(db: Db, n = 60) {
 await db.admin.query("insert into assess.sessions(id,assignment_id,user_id,ordinal,state,started_at) values($1,$2,$3,$4,'active',now())", [id(n), id(51), id(3), n]);
}
type Dto = { attemptId: string; assessment: AssessmentPublicationV2['assessment'] };
it('M04 is deferred; current schema then M01-M04 leave v1 OIDs/bodies/ACL/config unchanged and no runtime grants', async () => {
 const db = await rad062Fixture(0);
 try {
  expect((await db.admin.query("select to_regprocedure('assess.pool_start_v2(uuid)') v")).rows[0].v).toBeNull();
  await db.admin.query(migration(1)); await db.admin.query(migration(2)); await db.admin.query(migration(3));
  const before = (await db.admin.query("select oid,prosrc,proacl,proconfig,proowner from pg_proc where pronamespace='assess'::regnamespace and proname like '%_v1' order by oid")).rows;
  await db.admin.query(migration(4));
  expect((await db.admin.query("select oid,prosrc,proacl,proconfig,proowner from pg_proc where oid=any($1::oid[]) order by oid", [before.map(r => r.oid)])).rows).toEqual(before);
  for (const role of ['anon', 'authenticated', 'assess_worker', 'assess_authoring_bridge']) {
   expect((await db.admin.query("select has_function_privilege($1,'assess.pool_start_v2(uuid)','execute') v", [role])).rows[0].v).toBe(false);
   expect((await db.admin.query("select has_table_privilege($1,'assess.pool_selections_v2','select') v", [role])).rows[0].v).toBe(false);
  }
  expect((await db.admin.query('select inventory=assess.d3_fk_inventory_v1() ok from assess.erasure_fk_contract')).rows[0].ok).toBe(true);
  const legacy = { ...syntheticDraft(20), schemaVersion: 1, items: [] };
  await expect(db.rpc(2, 'draft_save_v1', [db.group, id(20), 0, legacy, '[]'])).resolves.toMatchObject({ revision: 1 });
 } finally { await db.close(); }
 const file = '20261030000400_rad062_random_pool.sql';
 expect(manifest.deferredMigrations[file].sha256).toBe(createHash('sha256').update(readFileSync('supabase/migrations/' + file)).digest('hex'));
 expect(manifest.requiredMigrations).not.toContain(file);
});
it('server draft, publication and TS validators reject invalid K, mixed points and written/options misuse; exact decimals agree', async () => {
 const db = await rad062Fixture(4);
 try {
  for (const size of [0, -1, 1.5, 5]) await expect(db.save(poolDraft(size))).rejects.toMatchObject({ code: '22023' });
  for (const version of ['1', 2, null]) { const bad = poolDraft(); Object.assign(bad.randomPool!, { version }); await expect(db.save(bad)).rejects.toMatchObject({ code: '22023' }); }
  const mixed = poolDraft(); const q = mixed.items[1]!; if (q.type !== 'single-choice') throw Error('fixture'); q.maximum = '2';
  await expect(db.save(mixed)).rejects.toMatchObject({ code: '22023' });
  const written = poolDraft(); Object.assign(written.items.at(-1)!, { shuffleOptions: false }); await expect(db.save(written)).rejects.toMatchObject({ code: '22023' });
  const { publication } = await staged(db);
  expect(publication.assessment.maximum).toBe('9.500'); expect(validatePublicationV2(publication).publication).toEqual(publication);
  expect(() => validatePublication(publication)).toThrow();
  for (const size of [0, 5, 1.5]) { const bad = structuredClone(publication); bad.assessment.randomPool!.size = size; expect(() => validatePublicationV2(bad)).toThrow(); }
  const bad = structuredClone(publication); bad.itemMarks[1]!.maximum = '1.251'; expect(() => validatePublicationV2(bad)).toThrow();
  const forged = structuredClone(publication); forged.assessment.maximum = '12'; await expect(db.call('content_submit_v2', [db.group, id(10), 1, forged])).rejects.toMatchObject({ code: '22023' });
  expect(randomPoolMaximum([{ id: 'a', type: 'single-choice', maximum: '0.1' }, { id: 'b', type: 'single-choice', maximum: '0.10' }], { version: 1, size: 1 })).toBe('0.10');
 } finally { await db.close(); }
});
it('competing start/replay/resume return one stored selection; DTO/details/specs never contain unselected questions or keys', async () => {
 const db = await rad062Fixture(4);
 try {
  const { publication } = await staged(db); await installed(db, publication);
  const starter = await db.connect();
  let calls: Dto[];
  try {
   await starter.query('begin'); await starter.query("select set_config('request.jwt.claim.sub',$1,true)", [id(3)]);
   await starter.query("insert into assess.sessions(id,assignment_id,user_id,ordinal,state,started_at) values($1,$2,$3,1,'active',now())", [id(60), id(51), id(3)]);
   const first = (await starter.query<{ v: Dto }>('select assess.pool_start_v2($1) v', [id(60)])).rows[0]!.v;
   const replay = db.call<Dto>('pool_start_v2', [id(60)], 3), resume = db.call<Dto>('pool_resume_v2', [id(60)], 3);
   await starter.query('commit'); calls = [first, ...await Promise.all([replay, resume])];
  } finally { await starter.end(); }
  expect(calls[1]).toEqual(calls[0]); expect(calls[2]).toEqual(calls[0]);
  const dto = calls[0]!; const chosen = dto.assessment.items.map(i => i.ref.id);
  expect(chosen.filter(i => i.startsWith('q'))).toHaveLength(2); expect(new Set(chosen).size).toBe(4);
  expect(chosen.slice(2)).toEqual(['w0', 'w1']); expect(dto.assessment.randomPool).toBeUndefined();
  expect(JSON.stringify(dto)).not.toMatch(/correctOptionId|privateItems|provenance|reviewedBy|shuffleOptions/);
  const row = (await db.admin.query('select selection,publication,specs from assess.pool_selections_v2 c join assess.session_details d using(session_id) where c.session_id=$1', [id(60)])).rows[0];
  expect(row.selection.map((i: { id: string }) => i.id)).toEqual(chosen);
  for (const unselected of ['q0', 'q1', 'q2', 'q3'].filter(i => !chosen.includes(i))) {
   expect(JSON.stringify(row)).not.toContain('"' + unselected + '"'); expect(Object.keys(row.specs)).not.toContain(unselected);
  }
  expect(await db.call('pool_resume_v2', [id(60)], 3)).toEqual(dto);
  await expect(db.call('pool_resume_v2', [id(60)], 2)).rejects.toMatchObject({ code: '42501' });
  // Test-only grant exercises the real student DTO while table reads remain denied.
  await db.admin.query('grant execute on function assess.pool_resume_v2(uuid) to authenticated');
  expect(await db.rpc(3, 'pool_resume_v2', [id(60)])).toEqual(dto);
  await db.admin.query('revoke execute on function assess.pool_resume_v2(uuid) from authenticated');
  await db.admin.query('delete from assess.targets where user_id=$1', [id(3)]);
  await expect(db.call('pool_resume_v2', [id(60)], 3)).rejects.toMatchObject({ code: '42501' });
  expect((await db.admin.query('select count(*)::int n from assess.pool_selections_v2')).rows[0].n).toBe(1);
 } finally { await db.close(); }
});
it('K=N contains every pool question, written stays fixed, option opt-out is exact and orders persist through resume and disappear with final details', async () => {
 const db = await rad062Fixture(4);
 try {
  const { publication } = await staged(db, poolDraft(4)); await installed(db, publication); await session(db);
  const seeded = await db.connect(); let dto: Dto;
  try {
   await seeded.query('begin'); await seeded.query("select set_config('request.jwt.claim.sub',$1,true),setseed(0.123)", [id(3)]);
   dto = (await seeded.query<{ v: Dto }>('select assess.pool_start_v2($1) v', [id(60)])).rows[0]!.v; await seeded.query('commit');
  } finally { await seeded.end(); }
  expect(dto.assessment.items.slice(0, 4).map(i => i.ref.id)).not.toEqual(['q0', 'q1', 'q2', 'q3']);
  const shuffled = dto.assessment.items.find(i => i.ref.id === 'q1')!; if (shuffled.type !== 'single-choice') throw Error('fixture');
  expect(shuffled.options.map(o => o.id)).not.toEqual(['a', 'b', 'c', 'd']);
  expect(dto.assessment.items.map(i => i.ref.id).sort()).toEqual(['q0', 'q1', 'q2', 'q3', 'w0', 'w1']);
  const optOut = dto.assessment.items.find(i => i.ref.id === 'q0')!; if (optOut.type !== 'single-choice') throw Error('fixture');
  expect(optOut.options.map(o => o.id)).toEqual(['a', 'b', 'c', 'd']);
  expect(await db.call('pool_resume_v2', [id(60)], 3)).toEqual(dto);
  expect((await db.admin.query('select bytes>0 ok from assess.capacity_reservations_v1 where session_id=$1', [id(60)])).rows[0].ok).toBe(true);
  await db.admin.query("update assess.sessions set state='graded' where id=$1", [id(60)]);
  await db.admin.query('delete from assess.session_details where session_id=$1', [id(60)]);
  expect((await db.admin.query('select count(*)::int n from assess.pool_selections_v2')).rows[0].n).toBe(0);
  expect((await db.admin.query('select count(*)::int n from assess.capacity_reservations_v1')).rows[0].n).toBe(0);
  await expect(db.call('pool_resume_v2', [id(60)], 3)).rejects.toMatchObject({ code: '55000' });
 } finally { await db.close(); }
});
it('new version before start is allowed; start fences replacement/assignment even after attempt retention, and publishes race atomically', async () => {
 const db = await rad062Fixture(4);
 try {
  const { publication } = await staged(db); await installed(db, publication);
  await db.admin.query("insert into assess.versions(id,owner_id,assessment_id,version,name,track,schema_version) values($1,$2,$3,'2','SYNTHETIC','mixed',2)", [id(53), id(2), id(10)]);
  // Competing publish and first attempt use the same transaction lock; either
  // publication commits before start or it is rejected. Nothing partially replaces.
  const publisher = await db.connect();
  try {
   const competing = await Promise.allSettled([
    session(db),
    publisher.query("insert into assess.versions(id,owner_id,assessment_id,version,name,track,schema_version) values($1,$2,$3,'3','SYNTHETIC','mixed',2)", [id(54), id(2), id(10)]),
   ]);
   expect(competing[0]!.status).toBe('fulfilled');
   if (competing[1]!.status === 'rejected') expect(competing[1]!.reason).toMatchObject({ code: '55000' });
   expect((await db.admin.query('select started,version_id from assess.pool_fences_v2 where assessment_id=$1', [id(10)])).rows[0]).toEqual({ started: true, version_id: id(50) });
  } finally { await publisher.end(); }
  await db.call('pool_start_v2', [id(60)], 3);
  await expect(db.admin.query("insert into assess.versions(id,owner_id,assessment_id,version,name,track,schema_version) values($1,$2,$3,'4','SYNTHETIC','mixed',2)", [id(56), id(2), id(10)])).rejects.toMatchObject({ code: '55000' });
  await expect(db.admin.query('update assess.publications set document=document where version_id=$1', [id(50)])).rejects.toMatchObject({ code: '55000' });
  await expect(db.admin.query('insert into assess.assignments(id,owner_id,version_id) values($1,$2,$3)', [id(55), id(2), id(53)])).rejects.toMatchObject({ code: '55000' });
  await db.admin.query('delete from assess.sessions where id=$1', [id(60)]);
  await expect(db.admin.query("insert into assess.versions(id,owner_id,assessment_id,version,name,track,schema_version) values($1,$2,$3,'4','SYNTHETIC','mixed',2)", [id(56), id(2), id(10)])).rejects.toMatchObject({ code: '55000' });
 } finally { await db.close(); }
});
it('fixed written items match across students; reserved capacity rejects an atomic new start but never blocks replay', async () => {
 const db = await rad062Fixture(4);
 try {
  const { publication } = await staged(db); await installed(db, publication); await session(db);
  const first = await db.call<Dto>('pool_start_v2', [id(60)], 3);
  await db.admin.query('insert into assess.targets values($1,$2)', [id(51), id(2)]);
  await db.rpc(2, 'consent_v2', ['assess-pilot-2026-10-20-v2']);
  await db.admin.query("insert into assess.sessions(id,assignment_id,user_id,ordinal,state,started_at) values($1,$2,$3,1,'active',now())", [id(61), id(51), id(2)]);
  const second = await db.call<Dto>('pool_start_v2', [id(61)], 2);
  expect(second.assessment.items.filter(i => i.type === 'written-answer')).toEqual(first.assessment.items.filter(i => i.type === 'written-answer'));
  expect(second.assessment.maximum).toBe(first.assessment.maximum);
  await db.admin.query("update assess.sessions set state='graded' where id=$1", [id(61)]);
  await db.admin.query('delete from assess.session_details where session_id=$1', [id(61)]);
  // Reserved peak, not disk-filling or an inherited database selector.
  await db.admin.query('update assess.capacity_reservations_v1 set bytes=100000000');
  for (const n of [70, 71, 72]) {
   await db.admin.query("insert into assess.sessions(id,assignment_id,user_id,ordinal,state,started_at) values($1,$2,$3,$4,'graded',now())", [id(n), id(51), id(3), n]);
   await db.admin.query("insert into assess.session_details(session_id,publication,specs) values($1,'{}','{}')", [id(n)]);
   await db.admin.query('insert into assess.capacity_reservations_v1 values($1,100000000)', [id(n)]);
  }
  expect(await db.call('pool_resume_v2', [id(60)], 3)).toEqual(first);
  const c = await db.connect();
  try {
   await c.query('begin'); await c.query("select set_config('request.jwt.claim.sub',$1,true)", [id(2)]);
   await c.query("insert into assess.sessions(id,assignment_id,user_id,ordinal,state,started_at) values($1,$2,$3,2,'active',now())", [id(80), id(51), id(2)]);
   await expect(c.query('select assess.pool_start_v2($1)', [id(80)])).rejects.toMatchObject({ code: '54000' });
   await c.query('rollback');
  } finally { await c.end(); }
  expect((await db.admin.query('select count(*)::int n from assess.sessions where id=$1', [id(80)])).rows[0].n).toBe(0);
  expect((await db.admin.query('select enabled from assess.launch_gate')).rows[0].enabled).toBe(false);
 } finally { await db.close(); }
});
it('publication storage itself rejects K>N and unequal points before any publication can commit', async () => {
 const db = await rad062Fixture(4);
 try {
  const { publication } = await staged(db);
  for (const kind of ['size', 'points'] as const) {
   const bad = structuredClone(publication);
   if (kind === 'size') bad.assessment.randomPool!.size = 5; else bad.itemMarks[1]!.maximum = '2';
   await db.admin.query('begin');
   try {
    await db.admin.query("insert into assess.versions(id,owner_id,assessment_id,version,name,track,schema_version,available) values($1,$2,$3,'1','SYNTHETIC','mixed',2,true)", [id(50), id(2), id(10)]);
    await expect(db.admin.query("insert into assess.publications(version_id,document,specs) values($1,$2,'{}')", [id(50), bad])).rejects.toMatchObject({ code: '22023' });
   } finally { await db.admin.query('rollback'); }
  }
  expect((await db.admin.query('select count(*)::int n from assess.publications')).rows[0].n).toBe(0);
 } finally { await db.close(); }
});
it('concurrent pool saves at 64 KiB and competing package writers cannot bypass either byte cap', async () => {
 const db = await rad062Fixture(4);
 try {
  const d = poolDraft();
  for (const item of d.items) if (item.type === 'single-choice') for (const o of item.options) o.text = 'x'.repeat(3800);
  const size = async () => (await db.admin.query("select octet_length(jsonb_set($1::jsonb,'{revision}','1')::text)+2 n", [d])).rows[0].n as number;
  let remaining = 65536 - await size(); expect(remaining).toBeGreaterThan(0);
  for (const item of d.items) if (item.type === 'single-choice') for (const o of item.options) { const add = Math.min(remaining, 5000 - o.text.length); o.text += 'x'.repeat(add); remaining -= add; }
  expect(remaining).toBe(0); expect(await size()).toBe(65536);
  const oversized = structuredClone(d); oversized.id = id(11);
  const q = oversized.items.find(i => i.type === 'single-choice' && i.options.some(o => o.text.length < 5000))!;
  if (q.type !== 'single-choice') throw Error('fixture'); q.options.find(o => o.text.length < 5000)!.text += 'x';
  const saves = await Promise.allSettled([db.save(d), db.save(oversized)]);
  expect(saves.filter(r => r.status === 'fulfilled')).toHaveLength(1);
  expect(saves.filter(r => r.status === 'rejected')).toMatchObject([{ reason: { code: '54000' } }]);
  expect((await db.admin.query('select count(*)::int n from assess.authoring_drafts where id=$1', [id(11)])).rows[0].n).toBe(0);
  const a = await db.connect(), b = await db.connect();
  try {
   const writes = await Promise.allSettled([
    a.query("insert into assess.authoring_reviewed_packages values($1,1,$2,jsonb_build_object('data',repeat('x',35000)))", [d.id, 'a'.repeat(64)]),
    b.query("insert into assess.content_candidates_v2(draft_id,revision,source_digest,document) values($1,1,$2,jsonb_build_object('data',repeat('x',35000)))", [d.id, 'a'.repeat(64)]),
   ]);
   expect(writes.filter(r => r.status === 'fulfilled')).toHaveLength(1);
   expect(writes.filter(r => r.status === 'rejected')).toMatchObject([{ reason: { code: '54000' } }]);
  } finally { await a.end(); await b.end(); }
 } finally { await db.close(); }
});

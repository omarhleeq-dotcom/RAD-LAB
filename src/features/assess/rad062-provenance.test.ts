import { expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import type { AuthoringDraftV2 } from './contracts-v2';
import type { BridgeSnapshotV2 } from './server-authoring-bridge-v2';
import { authoringBridgeV2, publicationFromDraftV2 } from './server-authoring-bridge-v2';
import { postgresAuthoringBridgeV2 } from './server-authoring-bridge-v2-postgres';
import { validateProvenanceV2 } from './provenance-v2';
import { readPublicationV2, validatePublicationV2 } from './server-validation-v2';
import { validatePublication } from './server-validation';
import { openRad085Database, fixtureId as id } from './rad085-local-db';
import { localPartCatalog } from '../authoring-review/catalog';
import { mixedFixture } from '../../../scripts/assess/d-fixture';
import manifest from '../../../scripts/pages/frontend-schema.json';
const source = { reference: 'SYNTHETIC own engineering fixture', licenceEvidence: 'Own test content only; no medical licence asserted' };
const input = { kind: 'uploader-authored' as const, reviewStatus: 'no-medical-review' as const, sources: [source], licenceNotes: 'SYNTHETIC recorded licence notes' };
const author = 'SYNTHETIC Three Names';
const draft = (): AuthoringDraftV2 => ({ schemaVersion: 2, id: id(10), revision: 0, name: 'SYNTHETIC provenance', track: 'mixed', policy: { durationSeconds: null, maxAttempts: 1, gradeVisibility: 'hidden' }, items: [
 { id: 'mcq', type: 'single-choice', prompt: 'SYNTHETIC task', maximum: '1.25', options: [{ id: 'a', text: 'A' }, { id: 'b', text: 'B' }], correctOptionId: 'a', provenance: structuredClone(input) },
 { id: 'written', type: 'written-answer', prompt: 'SYNTHETIC written task', maximum: '2', provenance: structuredClone(input) },
] });
function stored(): BridgeSnapshotV2 { const d = draft(); d.revision = 1; return { snapshot: { document: d, refs: [], digest: 'a'.repeat(64) }, items: Object.fromEntries(d.items.map(i => [i.id, { provenance: { ...input, authorDisplayName: author }, reviewedKey: null }])) }; }
it('client and server reject forged review or author, require per-item source/licence and distinguish real simulator review', () => {
 for (const field of ['reviewedBy', 'reviewedAt', 'authorDisplayName', 'authoredByAccountId', 'review']) expect(() => validateProvenanceV2({ ...input, [field]: 'forged' }, 'single-choice', true)).toThrow();
 for (const bad of [{ ...input, sources: [] }, { ...input, sources: [{ reference: source.reference }] }, { ...input, sources: [{ licenceEvidence: source.licenceEvidence }] }, { ...input, licenceNotes: '' }]) expect(() => validateProvenanceV2(bad, 'written-answer', true)).toThrow();
 expect(() => validateProvenanceV2(input, 'simulator-part', true)).toThrow();
 expect(() => validateProvenanceV2({ kind: 'simulator-reviewed' }, 'simulator-part')).toThrow();
 expect(validateProvenanceV2({ kind: 'simulator-reviewed' }, 'full-practical', true)).toEqual({ kind: 'simulator-reviewed' });
});
it('v2 preserves provenance, marks and written contracts; v1 reviews remain byte identical and v1 rejects v2', () => {
 const p = publicationFromDraftV2(stored(), []);
 expect(p.assessment.maximum).toBe('3.25');
 expect(validatePublicationV2(p).publication).toEqual(p);
 expect(p.privateItems[0]!.provenance).toEqual({ ...input, authorDisplayName: author });
 expect(() => validatePublication(p)).toThrow();
 const v1 = mixedFixture(); const bytes = JSON.stringify(v1);
 expect(readPublicationV2(v1).publication).toEqual(v1); expect(JSON.stringify(v1)).toBe(bytes);
 for (const field of ['reviewedBy', 'reviewedAt']) { const forged = structuredClone(p); Object.assign(forged.privateItems[0]!.provenance, { [field]: 'forged' }); expect(() => validatePublicationV2(forged)).toThrow(); }
 const missing = structuredClone(p); missing.privateItems = missing.privateItems.slice(1); expect(() => validatePublicationV2(missing)).toThrow();
});
it('v2 preserves genuine pinned simulator review/source/licence without extending it to uploaded questions', () => {
 const v1 = mixedFixture();
 const p = { ...v1, schemaVersion: 2, assessment: { ...v1.assessment, schemaVersion: 2, items: v1.assessment.items.map(i => ({ ...i, schemaVersion: 2 })) }, privateItems: v1.privateItems.map(k => { const { review, ...key } = k; return { ...key, schemaVersion: 2, provenance: k.type === 'single-choice' ? { ...input, authorDisplayName: author } : { kind: 'simulator-reviewed', review } }; }) };
 expect(validatePublicationV2(p).publication.privateItems[1]!.provenance).toEqual({ kind: 'simulator-reviewed', review: v1.privateItems[1]!.review });
 const bad = structuredClone(p); bad.privateItems[1]!.provenance = { ...input, authorDisplayName: author }; expect(() => validatePublicationV2(bad)).toThrow();
});
it('M02 is required with unchanged required/check bytes; no operational v2 or UI capability', () => {
 const file = '20261030000200_rad062_provenance_v2.sql';
 expect(manifest.guardedFeatures.rad062.migrationSha256[file]).toBe(createHash('sha256').update(readFileSync('supabase/migrations/' + file)).digest('hex'));
 expect(manifest.requiredMigrations).toContain(file); expect(manifest.guardedFeatures.rad062.migrations).toContain(file);
 expect(readFileSync('src/features/assess/rad062-availability.ts', 'utf8')).toContain('RAD062_AVAILABLE: boolean = true');
});
it('isolated PostgreSQL current schema then explicit M01+M02: server name, forgery, v1 preservation, private stage and D3 erasure', async () => {
 const db = await openRad085Database();
 const sql = (f: string) => readFileSync('supabase/migrations/' + f, 'utf8');
 try {
  await db.admin.query(sql('20261028000100_p1_short_codes_names.sql'));
  expect((await db.admin.query("select to_regprocedure('assess.content_submit_v2(uuid,uuid,integer,jsonb)') v")).rows[0].v).toBeNull();
  for (const n of [1, 2, 3]) await db.admin.query('insert into auth.users values($1,$2,now(),$3)', [id(n), 'never-author-from-email@example.invalid', { display_name: n === 2 ? author : 'SYNTHETIC Account Name' }]);
  await db.admin.query("update public.profiles set status='approved',role=case when user_id=$1 then 'owner' else 'participant' end", [id(1)]);
  await db.rpc(1, 'appointment_v1', [id(2), true]);
  const g = await db.rpc<{ id: string }>(2, 'supervisor_group_v1', ['create', null, null, 'SYNTHETIC group', new Date(Date.now() + 3600000).toISOString()]);
  const legacy = { ...draft(), schemaVersion: 1, id: id(11), items: draft().items.slice(0, 1).map(i => { const { provenance: _p, ...item } = i; void _p; return { ...item, authoring: { author: 'SYNTHETIC old author', reference: source.reference, licenceNotes: source.licenceEvidence, notes: 'Engineering only' } }; }) };
  await db.rpc(2, 'draft_save_v1', [g.id, id(11), 0, legacy, JSON.stringify([])]);
  const oldPackage = mixedFixture(); oldPackage.assessment = { ...oldPackage.assessment, ref: { id: id(11), version: '1' }, items: oldPackage.assessment.items.slice(0, 1) } as typeof oldPackage.assessment;
  oldPackage.privateItems = oldPackage.privateItems.slice(0, 1); oldPackage.itemMarks = oldPackage.itemMarks.slice(0, 1);
  await db.admin.query('insert into assess.authoring_reviewed_packages select draft_id,revision,digest,$1 from assess.authoring_revisions where draft_id=$2', [oldPackage, id(11)]);
  const before = (await db.admin.query("select oid,proname,prosrc,proacl,proconfig,proowner from pg_proc where pronamespace='assess'::regnamespace and proname in ('content_submit_v1','draft_save_v1','validate_draft_v1','authoring_bridge_read_v1','authoring_bridge_bind_v1','content_install_v1') order by oid")).rows;
  await db.admin.query(sql('20261030000100_rad062_full_name.sql'));
  await db.admin.query(sql('20261030000200_rad062_provenance_v2.sql'));
  expect((await db.admin.query("select oid,proname,prosrc,proacl,proconfig,proowner from pg_proc where pronamespace='assess'::regnamespace and proname in ('content_submit_v1','draft_save_v1','validate_draft_v1','authoring_bridge_read_v1','authoring_bridge_bind_v1','content_install_v1') order by oid")).rows).toEqual(before);
  for (const role of ['anon', 'authenticated', 'assess_worker', 'assess_authoring_bridge']) {
   expect((await db.admin.query("select has_function_privilege($1,'assess.content_submit_v2(uuid,uuid,integer,jsonb)','execute') v", [role])).rows[0].v).toBe(false);
   expect((await db.admin.query("select has_table_privilege($1,'assess.authoring_provenance_v2','select') v", [role])).rows[0].v).toBe(false);
  }
  await db.admin.query("select set_config('request.jwt.claim.sub',$1,false)", [id(2)]);
  const save = async (d = draft()) => (await db.admin.query('select assess.draft_save_v2($1,$2,0,$3,\'[]\') v', [g.id, d.id, d])).rows[0].v;
  for (const field of ['reviewedBy', 'reviewedAt', 'authorDisplayName', 'authoredByAccountId']) { const forged = draft(); Object.assign(forged.items[0]!.provenance, { [field]: 'FORGED' }); await expect(save(forged)).rejects.toMatchObject({ code: '22023' }); }
  for (const sources of [[], [{ reference: source.reference }], [{ licenceEvidence: source.licenceEvidence }]]) { const bad = draft(); Object.assign(bad.items[0]!.provenance, { sources }); await expect(save(bad)).rejects.toMatchObject({ code: '22023' }); }
  await save();
  const oldRead = (await db.admin.query('select assess.authoring_bridge_read_v2($1,$2,1) v', [g.id, id(11)])).rows[0].v;
  expect(oldRead.reviewed.publication).toEqual(oldPackage);
  expect(readPublicationV2(oldRead.reviewed.publication).publication).toEqual(oldPackage);
  const page = await db.rpc<{ rows: { id: string }[] }>(2, 'draft_page_v1', [g.id]); expect(page.rows.map(r => r.id)).toEqual([id(11)]);
  await expect(db.rpc(2, 'draft_page_v1', [g.id, id(10)])).rejects.toMatchObject({ code: '42501' });
  const downgrade = { ...legacy, id: id(10), revision: 1 }; await expect(db.rpc(2, 'draft_save_v1', [g.id, id(10), 1, downgrade, JSON.stringify([])])).rejects.toMatchObject({ code: '22023' });

  const read = async () => (await db.admin.query<{ v: BridgeSnapshotV2 }>('select assess.authoring_bridge_read_v2($1,$2,1) v', [g.id, id(10)])).rows[0]!.v;
  const s = await read(); expect(s.items.mcq!.provenance).toEqual({ ...input, authorDisplayName: author });
  expect(JSON.stringify(s.snapshot.document)).not.toContain(author);
  const publication = publicationFromDraftV2(s, []);
  const submit = async (p = publication) => (await db.admin.query('select assess.content_submit_v2($1,$2,1,$3) v', [g.id, id(10), p])).rows[0].v as string;
  const forged = structuredClone(publication); Object.assign(forged.privateItems[0]!.provenance, { reviewedBy: 'FORGED' }); await expect(submit(forged)).rejects.toMatchObject({ code: '22023' });
  const candidate = await submit(); expect(await submit()).toBe(candidate);
  const bridge = authoringBridgeV2({ transaction: async (_d, _r, run) => run(await read(), submit) }, []);
  expect((await bridge.stage(id(10), 1)).candidate).toBe(candidate);
  // The actual role remains denied until the complete package is reviewed.
  await expect(authoringBridgeV2(postgresAuthoringBridgeV2(() => db.connect(), id(2), g.id), []).stage(id(10), 1)).rejects.toMatchObject({ code: '42501' });
  // A local-only capability grant exercises the actual injected port; source SQL grants nothing.
  await db.admin.query('grant execute on function assess.authoring_bridge_read_v2(uuid,uuid,integer),assess.content_submit_v2(uuid,uuid,integer,jsonb) to assess_authoring_bridge');
  expect((await authoringBridgeV2(postgresAuthoringBridgeV2(() => db.connect(), id(2), g.id), []).stage(id(10), 1)).candidate).toBe(candidate);
  await db.admin.query('revoke execute on function assess.authoring_bridge_read_v2(uuid,uuid,integer),assess.content_submit_v2(uuid,uuid,integer,jsonb) from assess_authoring_bridge');
  // Simulator review must be supplied by a trusted private process, never the uploader.
  const key = mixedFixture().privateItems[1]!;
  if (key.type !== 'simulator-part') throw Error('fixture');
  const parts = localPartCatalog(), part = parts.find(p => p.caseRef.id === key.caseRef.id && p.ruleId === key.criteria[0]!.ruleId && p.part === key.criteria[0]!.part)!;
  await db.admin.query('insert into assess.authoring_references values($1,$2,$3,$4,$5,$6,true)', [part.id, 'simulator-part', part.caseRef.version, part.caseRef.id, part.caseRef.version, key.evaluatorVersion]);
  const sim = { ...draft(), id: id(12), items: [{ id: 'sim', type: 'simulator-part', prompt: 'SYNTHETIC simulator task', maximum: '1', partId: part.id, provenance: { kind: 'simulator-reviewed' } }] };
  await db.admin.query("select assess.draft_save_v2($1,$2,0,$3,$4)", [g.id, id(12), sim, JSON.stringify([{ key: part.id, revision: part.caseRef.version }])]);
  const simRead = async () => (await db.admin.query< {v: BridgeSnapshotV2} >('select assess.authoring_bridge_read_v2($1,$2,1) v', [g.id, id(12)])).rows[0]!.v;
  await expect(simRead()).rejects.toMatchObject({ code: '55000' });
  const { review, ...privateKey } = key;
  const reviewed = { ...privateKey, schemaVersion: 2, ref: { id: 'sim', version: '1' }, provenance: { kind: 'simulator-reviewed', review } };
  await db.admin.query('select assess.record_simulator_review_v2($1,1,$2,$3,$4)', [id(12), 'sim', id(3), reviewed]);
  const reviewRow = (await db.admin.query('select reviewed_key,reviewed_by,reviewed_at from assess.authoring_provenance_v2 where draft_id=$1', [id(12)])).rows[0];
  expect(JSON.stringify(reviewRow.reviewed_key)).not.toMatch(/reviewedBy|reviewedAt/); expect(reviewRow.reviewed_by).toBe(review.reviewedBy);
  const simPublication = publicationFromDraftV2(await simRead(), parts);
  expect(simPublication.privateItems[0]!.provenance).toEqual({ kind: 'simulator-reviewed', review });
  await db.admin.query('select assess.content_submit_v2($1,$2,1,$3)', [g.id, id(12), simPublication]);
  const rows = (await db.admin.query('select document from assess.content_candidates_v2')).rows;
  expect(JSON.stringify(rows)).not.toMatch(/authorDisplayName|reviewedBy|reviewedAt|never-author-from-email/);
  expect((await db.admin.query('select inventory=assess.d3_fk_inventory_v1() ok from assess.erasure_fk_contract')).rows[0].ok).toBe(true);
  // Mutable attribution participates in the existing D3 content clearance digest.
  const inventory = async () => (await db.admin.query('select assess.d3_inventory_v1($1) v', [id(2)])).rows[0].v;
  const original = await inventory(); await db.admin.query("update assess.authoring_provenance_v2 set author_display_name='Changed Three Names'"); expect((await inventory()).contentDigest).not.toBe(original.contentDigest);
  await db.admin.query("select set_config('request.jwt.claim.sub',$1,false)", [id(1)]);
  await db.admin.query('select assess.erase_account_d3_v1($1)', [id(3)]);
  expect((await db.admin.query('select reviewed_by,reviewed_at from assess.authoring_provenance_v2 where draft_id=$1', [id(12)])).rows[0]).toEqual({ reviewed_by: null, reviewed_at: null });
  await expect(simRead()).rejects.toMatchObject({ code: '42501' }); // current bound owner cannot impersonate uploader
  await db.admin.query("select set_config('request.jwt.claim.sub',$1,false)", [id(2)]);
  await expect(simRead()).rejects.toMatchObject({ code: '55000' });
  await db.admin.query("select set_config('request.jwt.claim.sub',$1,false)", [id(1)]);
  // Unshared/unassigned owned content follows the existing no-transfer deletion path.
  await db.admin.query('select assess.erase_account_d3_v1($1)', [id(2)]);
  expect((await db.admin.query('select count(*)::int n from assess.authoring_provenance_v2')).rows[0].n).toBe(0);
  expect((await db.admin.query('select count(*)::int n from assess.content_candidates_v2')).rows[0].n).toBe(0);
  expect((await db.admin.query('select enabled from assess.launch_gate')).rows[0].enabled).toBe(false);
 } finally { await db.close(); }
}, 30000);

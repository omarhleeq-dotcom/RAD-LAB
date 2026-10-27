import { expect, it } from 'vitest';
import { fixtureId as id, openRad085Database } from '../assess/rad085-local-db';
import { localPartCatalog, localPracticalCatalog } from './catalog';
import { createSqlAuthoring, draftToSql } from './sql-adapter';
import { newDraft, newMCQ, newPart, newPractical, studentPreview } from './draft';
import type { Person } from './contracts';
const signal = () => new AbortController().signal;
const parts = localPartCatalog(), practicals = localPracticalCatalog();
const references = [...parts.map(p => ({ key: p.id, revision: p.caseRef.version })), ...practicals.map(p => ({ key: p.caseRef.id, revision: p.caseRef.version }))];
async function fixture() {
 const db = await openRad085Database();
 try {
  for (let n = 1; n <= 4; n++) await db.admin.query("insert into auth.users values($1,$2,now(),'{\"display_name\":\"Synthetic P2\",\"consent_version\":\"2026-10-16\"}')", [id(n), `p2${n}@example.test`]);
  await db.admin.query("update public.profiles set status='approved',role=case when user_id=$1 then 'owner' else 'participant' end", [id(1)]);
  for (const n of [2, 3]) await db.rpc(1, 'appointment_v1', [id(n), true]);
  // Test-only registry: no licence, review or runtime registry is manufactured.
  for (const p of parts) await db.admin.query('insert into assess.authoring_references values($1,$2,$3,$4,$5,$6,true)', [p.id, 'simulator-part', p.caseRef.version, p.caseRef.id, p.caseRef.version, 'synthetic-part-test']);
  for (const p of practicals) await db.admin.query('insert into assess.authoring_references values($1,$2,$3,$4,$5,$6,true)', [p.caseRef.id, 'full-practical', p.caseRef.version, p.caseRef.id, p.caseRef.version, p.evaluatorVersion]);
  const g = await db.rpc<{ id: string }>(2, 'supervisor_group_v1', ['create', null, null, 'Synthetic P2', new Date(Date.now() + 3600000).toISOString()]);
  const changes = new Set<() => void>();
  const invalidate = () => { for (const fn of changes) fn(); };
  function adapter(who = 2, intercept?: (name: string) => Promise<void>) {
   const self: Person = { id: id(who), role: who === 1 ? 'owner' : who === 4 ? 'student' : 'supervisor', name: `Synthetic ${who}` };
   return createSqlAuthoring(self, { async rpc(name, args) { const result = await db.rpc(who, name, args); await intercept?.(name); return result; }, subscribe(fn) { changes.add(fn); return () => { changes.delete(fn); }; } }, { parts, practicals, references });
  }
  const a = adapter(), scope = { actorId: id(2), groupId: g.id };
  await a.groups(id(2), undefined, signal());
  return { ...db, a, adapter, scope, invalidate };
 } catch (e) { await db.close(); throw e; }
}
for (const track of ['mixed', 'full-practical'] as const) it(`real SQL ${track}: incomplete create/list/open/edit and competing tabs preserve the winning revision`, async () => {
 const f = await fixture();
 try {
  const d = newDraft(track); if (track === 'mixed') delete d.track;
  d.items = track === 'mixed' ? [newMCQ(), newPart(parts[0]!.id)] : [newPractical(practicals[0]!)];
  const saved = await f.a.save(f.scope, d, signal());
  expect(saved).toMatchObject({ track, revision: 1, name: '' }); expect(d.revision).toBe(0);
  const list = await f.a.drafts!(f.scope, undefined, signal());
  expect(list.rows).toEqual([{ id: d.id, track, revision: 1, name: '' }]);
  expect(JSON.stringify(list)).not.toContain('correctOptionId'); expect(JSON.stringify(list)).not.toContain('authoring');
  const b = f.adapter(); await b.groups(id(2), undefined, signal());
  const tab2 = await b.open!(f.scope, d.id, signal());
  const edits = { ...saved, name: 'Synthetic winner' }, losing = { ...tab2, name: 'Retain my edits' };
  const results = await Promise.allSettled([f.a.save(f.scope, edits, signal()), b.save(f.scope, losing, signal())]);
  expect(results.filter(r => r.status === 'fulfilled')).toHaveLength(1);
  expect(results.filter(r => r.status === 'rejected').map(r => r.status === 'rejected' && r.reason.reason)).toEqual(['conflict']);
  expect((await f.a.open!(f.scope, d.id, signal())).revision).toBe(2); expect(losing.name).toBe('Retain my edits');
  await expect(f.a.save(f.scope, { ...await f.a.open!(f.scope, d.id, signal()), track: track === 'mixed' ? 'full-practical' : 'mixed', items: [] }, signal())).rejects.toMatchObject({ reason: 'conflict' });
  const mixed = newDraft(track); mixed.items = track === 'mixed' ? [newPractical(practicals[0]!)] : [newMCQ()];
  await expect(f.a.save(f.scope, mixed, signal())).rejects.toMatchObject({ reason: 'invalid' });
  await expect(f.a.prepare(f.scope, saved, signal())).rejects.toMatchObject({ reason: 'denied' });
  expect((await f.admin.query('select * from assess.assignments')).rows).toHaveLength(0);
 } finally { await f.close(); }
}, 30000);

it('lost ACK after COMMIT is never retried; explicit read reconciles the same identity and revision', async () => {
 const f = await fixture();
 try {
  let writes = 0; const lost = f.adapter(2, async name => { if (name === 'draft_save_v1') { writes++; throw Error('ACK lost after commit'); } });
  await lost.groups(id(2), undefined, signal()); const d = newDraft();
  await expect(lost.save(f.scope, d, signal())).rejects.toMatchObject({ reason: 'offline' });
  expect(writes).toBe(1); const stored = await f.a.open!(f.scope, d.id, signal());
  expect(stored.revision).toBe(1); expect((await f.a.drafts!(f.scope, undefined, signal())).rows).toHaveLength(1);
  await expect(f.a.save(f.scope, d, signal())).rejects.toMatchObject({ reason: 'conflict' });
  expect((await f.admin.query('select * from assess.authoring_revisions')).rows).toHaveLength(1);
 } finally { await f.close(); }
}, 30000);

it('writer/group/role/expiry isolation, late scope invalidation, revoked appointment and unapproved account deny access', async () => {
 const f = await fixture();
 try {
  const saved = await f.a.save(f.scope, newDraft(), signal());
  const otherGroup = await f.rpc<{ id: string }>(2, 'supervisor_group_v1', ['create', null, null, 'Other group', new Date(Date.now()+3600000).toISOString()]);
  await f.a.groups(id(2), undefined, signal());
  await expect(f.a.open!({ ...f.scope, groupId: otherGroup.id }, saved.id, signal())).rejects.toMatchObject({ reason: 'denied' });
  for (const who of [1, 3, 4, 'anon', 'worker'] as const) await expect(f.rpc(who, 'draft_page_v1', [f.scope.groupId, saved.id])).rejects.toMatchObject({ code: '42501' });
  await expect(f.a.drafts!({ ...f.scope, actorId: id(1) }, undefined, signal())).rejects.toMatchObject({ reason: 'denied' });
  let release!: () => void, held!: () => void; const reached = new Promise<void>(r => { held = r; });
  const late = f.adapter(2, async name => { if (name === 'draft_page_v1') { held(); await new Promise<void>(r => { release = r; }); } });
  await late.groups(id(2), undefined, signal()); const unsub = late.subscribe!(() => {});
  const pending = late.open!(f.scope, saved.id, signal()); await reached;
  await f.rpc(1, 'appointment_v1', [id(2), false]); f.invalidate(); release();
  await expect(pending).rejects.toMatchObject({ reason: 'denied' }); unsub();
  await expect(f.a.save(f.scope, saved, signal())).rejects.toMatchObject({ reason: 'denied' });
  await f.rpc(1, 'appointment_v1', [id(2), true]);
  await f.admin.query("update public.profiles set status='pending' where user_id=$1", [id(2)]);
  await expect(f.a.open!(f.scope, saved.id, signal())).rejects.toMatchObject({ reason: 'denied' });
  await f.admin.query("update public.profiles set status='approved' where user_id=$1", [id(2)]);
  const short = await f.rpc<{ id: string }>(2, 'supervisor_group_v1', ['create', null, null, 'Expiring', new Date(Date.now()+150).toISOString()]);
  await f.a.groups(id(2), undefined, signal()); await new Promise(r => setTimeout(r, 180));
  await expect(f.a.drafts!({ ...f.scope, groupId: short.id }, undefined, signal())).rejects.toMatchObject({ reason: 'denied' });
 } finally { await f.close(); }
}, 30000);

it('real SQL enforces reference freshness, item/option/byte/storage/revision/page limits without tightening incomplete draft requirements', async () => {
 const f = await fixture();
 try {
  const d = newDraft(); d.items = [newPart(parts[0]!.id)];
  await f.admin.query('update assess.authoring_references set active=false where key=$1', [parts[0]!.id]);
  await expect(f.a.save(f.scope, d, signal())).rejects.toMatchObject({ reason: 'expired' });
  await f.admin.query('update assess.authoring_references set active=true,revision=$2 where key=$1', [parts[0]!.id, 'changed']);
  await expect(f.a.save(f.scope, d, signal())).rejects.toMatchObject({ reason: 'expired' });
  const wrong = newDraft('full-practical'); wrong.items = [{ ...newPractical(practicals[0]!), evaluatorVersion: 'synthetic-not-current' }];
  await expect(f.a.save(f.scope, wrong, signal())).rejects.toMatchObject({ reason: 'expired' });
  const bad = newDraft(); bad.items = Array.from({ length: 201 }, () => newMCQ());
  await expect(f.a.save(f.scope, bad, signal())).rejects.toMatchObject({ reason: 'invalid' });
  bad.items = [newMCQ()]; const mcq = bad.items[0]!; if (mcq.type !== 'single-choice') throw Error();
  mcq.options = Array.from({ length: 51 }, (_, n) => ({ id: String(n), text: '' }));
  await expect(f.a.save(f.scope, bad, signal())).rejects.toMatchObject({ reason: 'invalid' });
  bad.items = Array.from({ length: 20 }, () => ({ ...newMCQ(), prompt: 'X'.repeat(10000) }));
  await expect(f.a.save(f.scope, bad, signal())).rejects.toMatchObject({ reason: 'invalid' });
  const saved = [];
  for (let n = 0; n < 5; n++) saved.push(await f.a.save(f.scope, newDraft(), signal()));
  await expect(f.a.save(f.scope, newDraft(), signal())).rejects.toMatchObject({ reason: 'invalid' });
  const p = await f.rpc<{ rows: { id: string }[]; next: string }>(2, 'draft_page_v1', [f.scope.groupId, null, null, 2]);
  const q = await f.rpc<{ rows: { id: string }[] }>(2, 'draft_page_v1', [f.scope.groupId, null, p.next, 2]);
  expect(p.rows).toHaveLength(2); expect(q.rows).toHaveLength(2); expect(q.rows.some(r => p.rows.some(x => r.id === x.id))).toBe(false);
  for (const limit of [0, 101]) await expect(f.rpc(2, 'draft_page_v1', [f.scope.groupId, null, null, limit])).rejects.toMatchObject({ code: '22023' });
  let current = await f.a.save(f.scope, { ...saved[0]!, items: Array.from({ length: 200 }, () => newMCQ()) }, signal());
  expect(current.items).toHaveLength(200);
  const atOptionLimit = newMCQ(); atOptionLimit.options = Array.from({ length: 50 }, (_, n) => ({ id: String(n), text: '' }));
  current = await f.a.save(f.scope, { ...current, items: [atOptionLimit] }, signal());
  expect(current.items[0]).toMatchObject({ type: 'single-choice', options: expect.arrayContaining([{ id: '49', text: '' }]) });
  for (let n = 3; n < 100; n++) current = await f.a.save(f.scope, current, signal());
  expect(current.revision).toBe(100); await expect(f.a.save(f.scope, current, signal())).rejects.toMatchObject({ reason: 'invalid' });
  expect((await f.admin.query('select count(*)::int n from assess.authoring_revisions where draft_id=$1', [current.id])).rows[0].n).toBe(100);
 } finally { await f.close(); }
}, 30000);

it('SQL-loaded private author data never enters the existing student whitelist', async () => {
 const f = await fixture();
 try {
  for (const track of ['mixed', 'full-practical'] as const) {
   const d = newDraft(track), i = track === 'mixed' ? newMCQ() : newPractical(practicals[0]!);
   d.name = 'Synthetic tokens'; i.prompt = 'Adjust synthetic controls'; i.authoring = { author: 'PRIVATE-AUTHOR', reference: 'PRIVATE-SOURCE', licenceNotes: 'UNVERIFIED', notes: 'PRIVATE-NOTES' };
   if (i.type === 'single-choice') i.correctOptionId = i.options[0]!.id;
   d.items = [i]; const stored = await f.a.save(f.scope, d, signal());
   const json = JSON.stringify(studentPreview(stored, parts, practicals));
   for (const word of ['correctOptionId', 'authoring', 'PRIVATE', 'UNVERIFIED', 'reviewedBy', 'rubric', 'maximum', 'evaluatorVersion']) expect(json).not.toContain(word);
   expect(draftToSql(stored, references).document.track).toBe(track);
  }
 } finally { await f.close(); }
}, 30000);

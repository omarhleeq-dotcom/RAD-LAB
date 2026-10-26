import { expect, it } from 'vitest';
import { openRad085Database, fixtureId as id } from '../assess/rad085-local-db';
import { installMixedContent } from '../assess/server-presentation';
import { createSqlAuthoring } from './sql-adapter';
import { newDraft, newMCQ } from './draft';
import type { Draft } from './contracts';
const signal = () => new AbortController().signal;
async function fixture() {
 const db = await openRad085Database();
 try {
  for (let n = 1; n <= 5; n++) await db.admin.query(`insert into auth.users values($1,$2,now(),'{"display_name":"Synthetic letters","consent_version":"2026-10-16"}')`, [id(n), `assign${n}@example.test`]);
  await db.admin.query("update public.profiles set status='approved',role=case when user_id=$1 then 'owner' else 'participant' end", [id(1)]);
  for (const n of [2, 3]) await db.rpc(1, 'appointment_v1', [id(n), true]);
  await db.admin.query('update assess.sharing_policy set required_version=$1,text_digest=$2', ['SYNTHETIC/1', 'a'.repeat(64)]);
  for (const n of [4, 5]) await db.rpc(n, 'sharing_consent_v1', ['SYNTHETIC/1', 'a'.repeat(64), true]);
  const g = await db.rpc<{ id: string; code: string }>(2, 'supervisor_group_v1', ['create', null, null, 'SYNTHETIC assignment group', new Date(Date.now()+3600000).toISOString()]);
  async function join(n: number) { const r = await db.rpc<{ id: string; revision: number }>(n, 'join_request_v1', [g.code]); await db.rpc(2, 'join_decide_v1', [r.id, r.revision, 'approve']); }
  await join(4);
  const listeners = new Set<() => void>();
  function adapter(who = 2, intercept?: (name: string) => Promise<void>) {
   return createSqlAuthoring({ id: id(who), name: 'SYNTHETIC', role: 'supervisor' }, { async rpc(name, args) { const value = await db.rpc(who, name, args); await intercept?.(name); return value; }, subscribe(fn) { listeners.add(fn); return () => { listeners.delete(fn); }; } }, { parts: [], practicals: [], references: [] }, true);
  }
  const a = adapter(), scope = { actorId: id(2), groupId: g.id }; await a.groups(id(2), undefined, signal());
  const d = newDraft(), q = newMCQ(); d.name = 'SYNTHETIC alphabet'; q.prompt = 'SYNTHETIC alpha'; q.correctOptionId = q.options[0]!.id; q.authoring = { author: 'Engineering fixture', reference: 'Own letters', licenceNotes: 'Own synthetic text', notes: '' }; d.items = [q];
  const saved = await a.save(scope, d, signal());
  /** Authorization fixture, NOT the unavailable supervisor candidate channel.
   * Existing validator+installer run on a pending synthetic candidate. Metadata/link
   * seeded by isolated admin only; never represent this as an integrated publisher. */
  async function installFixture(draft: Draft = saved) {
   const item = draft.items[0]!; if (item.type !== 'single-choice') throw Error();
   const ref = { id: item.id, version: String(draft.revision) };
   const doc = { schemaVersion: 1, assessment: { schemaVersion: 1, ref: { id: draft.id, version: String(draft.revision) }, name: draft.name, track: 'mixed', maximum: '1', policy: draft.policy, items: [{ schemaVersion: 1, ref, type: 'single-choice', contentLanguage: 'en', prompt: item.prompt, options: item.options }] }, itemMarks: [{ item: ref, maximum: '1' }], privateItems: [{ schemaVersion: 1, ref, type: 'single-choice', correctOptionId: item.correctOptionId, review: { sources: [{ reference: 'Own synthetic letters', licenceEvidence: 'Own test fixture only' }], reviewedBy: 'SYNTHETIC independent engineering fixture', reviewedAt: '2026-10-26T00:00:00.000Z', scope: 'Synthetic alphabet; no clinical approval' } }] };
   const v = crypto.randomUUID();
   await db.admin.query('begin');
   try {
    await db.admin.query('insert into assess.versions(id,owner_id,assessment_id,version,name,track) values($1,$2,$3,$4,$5,$6)', [v,id(2),draft.id,String(draft.revision),draft.name,'mixed']);
    await db.admin.query('insert into assess.content_submissions(version_id,document) values($1,$2)', [v,JSON.stringify(doc)]);
    await installMixedContent({ async call<T>(name: string, args: Record<string, unknown>) { return (await db.admin.query<{v:T}>(`select assess.${name}(${Object.keys(args).map((_,i)=>'$'+(i+1)).join(',')}) v`, Object.values(args))).rows[0]!.v; } }, v);
    await db.admin.query('insert into assess.authoring_publication_links select $1,draft_id,revision,digest from assess.authoring_revisions where draft_id=$2 and revision=$3', [v,draft.id,draft.revision]);
    await db.admin.query('commit'); return v;
   } catch (e) { await db.admin.query('rollback'); throw e; }
  }
  return { ...db, a, adapter, scope, saved, installFixture, join, invalidate() { for (const fn of listeners) fn(); } };
 } catch (e) { await db.close(); throw e; }
}
it('assignment opt-in stays closed without an installed link; existing validators+installer feed a separate authorization fixture', async () => {
 const f = await fixture(); try {
  await expect(f.a.prepare(f.scope, f.saved, signal())).rejects.toMatchObject({ reason: 'expired' });
  expect((await f.admin.query('select * from assess.assignments')).rows).toHaveLength(0);
  await f.installFixture(); const review = await f.a.prepare(f.scope, f.saved, signal());
  expect(review.targetCount).toBe(1); expect(review.targets.rows).toEqual([{ id: id(4), name: 'Synthetic letters' }]); expect(review.remainingMs).toBeGreaterThan(0);
  await f.a.confirm(f.scope, review.token, signal()); await f.a.confirm(f.scope, review.token, signal());
  let issued = (await f.a.assignments!(f.scope, undefined, signal())).rows[0]!;
  expect(issued.closedAt).toBeNull(); await expect(f.a.close!(f.scope, { ...issued, revision: issued.revision+1 }, signal())).rejects.toMatchObject({ reason: 'conflict' });
  await f.a.close!(f.scope, issued, signal()); await f.a.close!(f.scope, issued, signal()); issued = (await f.a.assignments!(f.scope, undefined, signal())).rows[0]!;
  expect(issued.closedAt).not.toBeNull(); expect((await f.admin.query('select * from assess.targets')).rows).toHaveLength(1); expect((await f.admin.query('select * from assess.assignments')).rows).toHaveLength(1);
  expect((await f.a.context(f.scope, signal())).group.id).toBe(f.scope.groupId);
 } finally { await f.close(); }
}, 30000);
it('snapshot rejects changed membership, draft revision and permission; late response cannot restore targets', async () => {
 const f = await fixture(); try {
  await f.installFixture(); const review = await f.a.prepare(f.scope, f.saved, signal()); await f.join(5);
  await expect(f.a.targets(f.scope, review.token, undefined, signal())).rejects.toMatchObject({ reason: 'conflict' });
  await expect(f.a.confirm(f.scope, review.token, signal())).rejects.toMatchObject({ reason: 'conflict' });
  expect((await f.admin.query('select * from assess.assignments')).rows).toHaveLength(0);
  const next = await f.a.prepare(f.scope, f.saved, signal());
  await f.a.save(f.scope, { ...f.saved, name: 'Edited after snapshot' }, signal());
  await expect(f.a.confirm(f.scope, next.token, signal())).rejects.toMatchObject({ reason: 'conflict' });
  await expect(f.rpc(3, 'assignment_targets_v1', [next.token])).rejects.toMatchObject({ code: '42501' });
  await expect(f.rpc(4, 'assignment_confirm_v1', [next.token])).rejects.toMatchObject({ code: '42501' });
  await f.rpc(1, 'appointment_v1', [id(2), false]);
  await expect(f.a.assignments!(f.scope, undefined, signal())).rejects.toMatchObject({ reason: 'denied' });
 } finally { await f.close(); }
}, 30000);
it('lost prepare/confirm/close ACK has no automatic mutation replay; explicit recovery retains operation identity', async () => {
 const f = await fixture(); try {
  await f.installFixture(); const counts = new Map<string,number>(); let fault = 'assignment_prepare_v1';
  const a = f.adapter(2, async name => { counts.set(name,(counts.get(name)??0)+1); if (name===fault) { fault=''; throw Error('synthetic lost ACK after COMMIT'); } });
  await a.groups(id(2), undefined, signal());
  await expect(a.prepare(f.scope, f.saved, signal())).rejects.toMatchObject({ reason: 'offline' });
  expect(counts.get('assignment_prepare_v1')).toBe(1); expect((await f.admin.query('select * from assess.assignment_reviews')).rows).toHaveLength(1);
  const review = await a.prepare(f.scope, f.saved, signal()); expect((await f.admin.query('select * from assess.assignment_reviews')).rows).toHaveLength(1);
  fault = 'assignment_confirm_v1'; await expect(a.confirm(f.scope, review.token, signal())).rejects.toMatchObject({ reason: 'offline' });
  expect(counts.get('assignment_confirm_v1')).toBe(1); const issued = (await a.assignments!(f.scope, undefined, signal())).rows[0]!;
  await a.confirm(f.scope, review.token, signal()); expect((await f.admin.query('select * from assess.assignments')).rows).toHaveLength(1);
  fault = 'assignment_close_v2'; await expect(a.close!(f.scope, issued, signal())).rejects.toMatchObject({ reason: 'offline' }); expect(counts.get('assignment_close_v2')).toBe(1);
  expect((await a.assignments!(f.scope, undefined, signal())).rows[0]!.closedAt).not.toBeNull();
 } finally { await f.close(); }
}, 30000);
it('expiry, rollback on unique conflict, isolation and late invalidation use the real SQL boundary', async () => {
 const f = await fixture(); try {
  await f.installFixture(); const review = await f.a.prepare(f.scope, f.saved, signal());
  await f.admin.query("update assess.assignment_reviews set expires_at=clock_timestamp()-interval '1 second' where id=$1", [review.token]);
  await expect(f.a.confirm(f.scope, review.token, signal())).rejects.toMatchObject({ reason: 'expired' });
  const current = await f.a.prepare(f.scope, f.saved, signal()); await f.a.confirm(f.scope, current.token, signal());
  const duplicate = await f.a.prepare(f.scope, f.saved, signal()); await expect(f.a.confirm(f.scope, duplicate.token, signal())).rejects.toMatchObject({ reason: 'conflict' });
  expect((await f.admin.query('select * from assess.assignment_scopes')).rows).toHaveLength(1); expect((await f.admin.query('select assignment_id from assess.assignment_reviews where id=$1',[duplicate.token])).rows[0].assignment_id).toBeNull();
  await expect(f.rpc(3,'assignment_close_v2',[(await f.a.assignments!(f.scope,undefined,signal())).rows[0]!.id,0])).rejects.toMatchObject({code:'42501'});
  let held!:()=>void,release!:()=>void; const reached = new Promise<void>(r=>held=r);
  const late = f.adapter(2,async name=>{if(name==='assignment_page_v2'){held(); await new Promise<void>(r=>release=r);}});
  await late.groups(id(2),undefined,signal()); const off=late.subscribe!(()=>{}); const pending=late.assignments!(f.scope,undefined,signal()); await reached; f.invalidate(); release();
  await expect(pending).rejects.toMatchObject({reason:'denied'}); off();
 } finally { await f.close(); }
},30000);

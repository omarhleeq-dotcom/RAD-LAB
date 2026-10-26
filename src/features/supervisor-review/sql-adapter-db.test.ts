import { expect, it } from 'vitest';
import { fixtureId as id, openRad085Database } from '../assess/rad085-local-db';
import { createSqlReview, type ScopeTransport } from './sql-adapter';
import type { Command, Person, Query, ReviewAdapter } from './contracts';

const signal = () => new AbortController().signal;
async function fixture(configured = true) {
 const db = await openRad085Database();
 try {
  for (let n = 1; n <= 28; n++) await db.admin.query("insert into auth.users values($1,$2,now(),'{\"display_name\":\"Synthetic P1\",\"consent_version\":\"2026-10-16\"}')", [id(n), `synthetic${n}@example.test`]);
  await db.admin.query("update public.profiles set status='approved',role=case when user_id=$1 then 'owner' else 'participant' end", [id(1)]);
  if (configured) {
   await db.admin.query("update assess.sharing_policy set required_version='synthetic-test-only',text_digest=$1", ['a'.repeat(64)]);
   // Synthetic selves only, via the real self-consent RPC. Never a product default.
   for (let n = 4; n <= 28; n++) await db.rpc(n, 'sharing_consent_v1', ['synthetic-test-only', 'a'.repeat(64), true]);
  }
  const changes = new Set<() => void>();
  const invalidate = () => { for (const fn of changes) fn(); };
  const calls: { who: number; name: string; args: unknown[] }[] = [];
  function adapter(who: number, intercept?: (name: string) => Promise<void>) {
   const self: Person = { id: id(who), name: `Synthetic ${who}`, role: who === 1 ? 'owner' : who <= 3 ? 'supervisor' : 'student' };
   const transport: ScopeTransport = {
    async rpc(name, args, abort) {
     abort.throwIfAborted(); calls.push({ who, name, args });
     const write = !['scope_page_v1', 'sharing_consent_v1'].includes(name);
     if (write) invalidate();
     try { const result = await db.rpc(who, name, args); await intercept?.(name); return result; }
     finally { if (write) invalidate(); }
    },
    subscribe(fn) { changes.add(fn); return () => { changes.delete(fn); }; },
   };
   return createSqlReview(self, transport);
  }
  const owner = adapter(1), supervisor = adapter(2), student = adapter(4), other = adapter(3);
  const run = (a: ReviewAdapter, c: Command) => a.execute(a.accounts[0]!.id, c, signal());
  const read = (a: ReviewAdapter, q: Partial<Query> = {}) => a.read({ actorId: a.accounts[0]!.id, ...q }, signal());
  const create = async () => {
   await run(owner, { kind: 'appoint', personId: id(2) });
   const receipt = await run(supervisor, { kind: 'create', name: 'Synthetic P1 group', endsAt: Date.now() + 3600000 });
   const group = (await read(supervisor)).groups.rows[0]!; return { group, code: receipt.code! };
  };
  const join = async (code: string, a = student) => {
   await run(a, { kind: 'join', code }); const request = (await read(a)).requests.rows.find(r => r.status === 'pending')!;
   await run(supervisor, { kind: 'approve', requestId: request.id, revision: request.revision }); return request;
  };
  const practice = (who: number, n: number) => db.transaction(who, c => c.query(`insert into public.attempts(id,user_id,attempt_no,exam_id,case_id,definition_version,settings,result,locale,finished_at)
   values($1,$2,1,'synthetic','synthetic','v1','{}','{"total":37,"private":"never-project"}','en','2000-01-01')`, [id(n), id(who)]));
  return { ...db, adapter, owner, supervisor, student, other, run, read, create, join, practice, calls, invalidate };
 } catch (error) { await db.close(); throw error; }
}
it('P1 SQL adapter completes owner/supervisor/student lifecycle, revision conflicts, retries and one-time codes', async () => {
 const f = await fixture();
 try {
  const { group: g, code } = await f.create(); expect(code).toMatch(/^[a-f0-9]{64}$/);
  expect((await f.read(f.owner)).people.rows[0]).toMatchObject({ id: id(2), appointed: true });
  expect(JSON.stringify(await f.read(f.supervisor))).not.toContain(code);
  await f.run(f.student, { kind: 'join', code }); await f.run(f.student, { kind: 'join', code });
  let r = (await f.read(f.student)).requests.rows[0]!;
  expect((await f.read(f.student)).requests.rows).toHaveLength(1); expect((await f.read(f.student)).isMember).toBeNull();
  await f.run(f.student, { kind: 'cancel', requestId: r.id, revision: r.revision });
  await f.run(f.student, { kind: 'join', code }); r = (await f.read(f.student)).requests.rows[0]!;
  await f.run(f.supervisor, { kind: 'reject', requestId: r.id, revision: r.revision });
  await expect(f.run(f.supervisor, { kind: 'approve', requestId: r.id, revision: r.revision })).rejects.toMatchObject({ reason: 'conflict' });
  await f.join(code); await f.practice(4, 100);
  let d = await f.read(f.supervisor, { groupId: g.id });
  expect(d.members.total).toBe(1); expect(d.results.total).toBe(1); expect(d.results.rows[0]).toMatchObject({ score: '37', kind: 'practice' });
  expect(JSON.stringify(d)).not.toContain('never-project'); expect(d.results.rows[0]!.at).toBeGreaterThan(Date.parse('2026-01-01'));
  await expect(f.run(f.supervisor, { kind: 'rotate', groupId: g.id, revision: g.revision })).rejects.toMatchObject({ reason: 'conflict' });
  await f.run(f.student, { kind: 'leave', groupId: g.id }); await f.run(f.student, { kind: 'leave', groupId: g.id });
  d = await f.read(f.supervisor, { groupId: g.id }); expect(d.members.total).toBe(0); expect(d.results.total).toBe(0);
  await f.join(code); expect((await f.read(f.supervisor, { groupId: g.id })).results.total).toBe(0);
  await f.practice(4, 101); d = await f.read(f.supervisor, { groupId: g.id }); expect(d.results.total).toBe(1);
  const rotated = await f.run(f.supervisor, { kind: 'rotate', groupId: g.id, revision: d.group!.revision });
  await expect(f.run(f.adapter(5), { kind: 'join', code })).rejects.toMatchObject({ reason: 'invalid' });
  d = await f.read(f.supervisor, { groupId: g.id }); await f.run(f.supervisor, { kind: 'revoke-code', groupId: g.id, revision: d.group!.revision });
  await expect(f.run(f.adapter(5), { kind: 'join', code: rotated.code! })).rejects.toMatchObject({ reason: 'invalid' });
  d = await f.read(f.supervisor, { groupId: g.id }); await f.run(f.supervisor, { kind: 'end', groupId: g.id, revision: d.group!.revision });
  await expect(f.read(f.supervisor, { groupId: g.id })).rejects.toMatchObject({ reason: 'denied' });
  expect((await f.read(f.supervisor)).groups.rows).toEqual([]);
  expect(f.calls.every(c => c.args[0] !== id(c.who) || c.name === 'appointment_v1')).toBe(true);
 } finally { await f.close(); }
}, 30000);

it('P1 SQL pages/counts isolate memberships and recordings before UUID keyset paging', async () => {
 const f = await fixture();
 try {
  const { group: g, code } = await f.create();
  for (let n = 4; n <= 28; n++) { await f.join(code, f.adapter(n)); await f.practice(n, 100 + n); }
  await f.practice(3, 199); // Unrelated user, never in the visible total.
  let d = await f.read(f.supervisor, { groupId: g.id });
  expect(d.members.total).toBe(25); expect(d.results.total).toBe(25); expect(d.members.rows).toHaveLength(20); expect(d.results.rows).toHaveLength(20);
  const first = d.results.rows.map(r => r.id);
  d = await f.read(f.supervisor, { groupId: g.id, membersCursor: d.members.next!, resultsCursor: d.results.next! });
  expect(d.members.rows).toHaveLength(5); expect(d.results.rows).toHaveLength(5); expect(d.results.total).toBe(25);
  expect(d.results.rows.some(r => first.includes(r.id))).toBe(false);
  await f.run(f.owner, { kind: 'appoint', personId: id(3) });
  await expect(f.read(f.other, { groupId: g.id })).rejects.toMatchObject({ reason: 'denied' });
  expect((await f.read(f.student, { groupId: g.id })).results.rows).toEqual([]);
  await expect(f.run(f.other, { kind: 'appoint', personId: id(5) })).rejects.toMatchObject({ reason: 'denied' });
  await expect(f.read(f.supervisor, { actorId: id(1) })).rejects.toMatchObject({ reason: 'denied' });
  await f.rpc(4, 'sharing_consent_v1', [null, null, false]);
  expect((await f.read(f.supervisor, { groupId: g.id })).results.total).toBe(24);
  await f.run(f.owner, { kind: 'revoke', personId: id(2) });
  await expect(f.read(f.supervisor, { groupId: g.id })).rejects.toMatchObject({ reason: 'denied' });
  await f.run(f.owner, { kind: 'appoint', personId: id(2) });
  expect((await f.read(f.supervisor, { groupId: g.id })).results.total).toBe(0);
 } finally { await f.close(); }
}, 30000);

it('unconfigured sharing stays closed without synthesizing acceptance; expired groups hide all pages', async () => {
 const f = await fixture(false);
 try {
  const { group: g, code } = await f.create();
  expect((await f.read(f.student)).sharing).toBe(false);
  await expect(f.run(f.student, { kind: 'join', code })).rejects.toMatchObject({ reason: 'denied' });
  expect((await f.admin.query('select * from assess.sharing_consents')).rows).toEqual([]);
  expect(f.calls.filter(c => c.name === 'sharing_consent_v1').every(c => c.args.length === 0)).toBe(true);
  // Wait for an actual server boundary, without changing immutable group provenance.
  await f.run(f.supervisor, { kind: 'create', name: 'Synthetic short group', endsAt: Date.now() + 150 });
  const short = (await f.read(f.supervisor)).groups.rows.find(g => g.name === 'Synthetic short group')!;
  await new Promise(resolve => setTimeout(resolve, 180));
  await expect(f.read(f.supervisor, { groupId: short.id })).rejects.toMatchObject({ reason: 'denied' });
  expect((await f.read(f.supervisor, { groupId: g.id })).results.total).toBe(0);
 } finally { await f.close(); }
}, 30000);

it('a scope change between real RPC pages discards the assembled snapshot, and a lost ACK is not retried', async () => {
 const f = await fixture();
 try {
  const { group: g, code } = await f.create(); await f.join(code); await f.practice(4, 100);
  const racing = f.adapter(2, async name => { if (name === 'scope_page_v1') await f.run(f.owner, { kind: 'revoke', personId: id(2) }); });
  await expect(f.read(racing, { groupId: g.id })).rejects.toMatchObject({ reason: 'denied' });
  await f.run(f.owner, { kind: 'appoint', personId: id(2) });
  let count = 0;
  const lost = createSqlReview(f.student.accounts[0]!, { async rpc(name, args) { count++; await f.rpc(4, name, args); throw Error('ACK lost'); } });
  await expect(f.run(lost, { kind: 'leave', groupId: g.id })).rejects.toMatchObject({ reason: 'offline' });
  expect(count).toBe(1); expect((await f.read(f.supervisor, { groupId: g.id })).members.total).toBe(0);
  await f.run(f.student, { kind: 'leave', groupId: g.id });
 } finally { await f.close(); }
}, 30000);

it('validates a code receipt outside the first group page without scanning and pages owner appointments', async () => {
 const f = await fixture();
 try {
  await f.run(f.owner, { kind: 'appoint', personId: id(2) });
  const receipts = [];
  for (let n = 0; n < 21; n++) receipts.push(await f.run(f.supervisor, { kind: 'create', name: `Synthetic group ${n}`, endsAt: Date.now() + 3600000 }));
  const first = (await f.read(f.supervisor)).groups;
  expect(first.rows).toHaveLength(20); expect(first.next).not.toBeNull();
  const outside = receipts.find(r => !first.rows.some(g => g.id === r.groupId))!;
  const rotated = await f.run(f.supervisor, { kind: 'rotate', groupId: outside.groupId!, revision: 1 });
  const before = f.calls.length, snapshot = await f.read(f.supervisor);
  expect(snapshot.codeGroupId).toBe(outside.groupId); expect(rotated.code).toMatch(/^[a-f0-9]{64}$/);
  expect(snapshot.groups.rows.some(g => g.id === outside.groupId)).toBe(false);
  expect(f.calls.slice(before).map(c => c.args[0])).toEqual(['groups', 'members']);
  expect((await f.read(f.supervisor, { groupsCursor: first.next! })).groups.rows).toHaveLength(1);
  for (let n = 5; n <= 28; n++) await f.run(f.owner, { kind: 'appoint', personId: id(n) });
  const appointments = (await f.read(f.owner)).people;
  expect(appointments.rows).toHaveLength(20);
  expect((await f.read(f.owner, { peopleCursor: appointments.next! })).people.rows).toHaveLength(5);
 } finally { await f.close(); }
}, 30000);

it('transport failures and malformed projections never become successful snapshots', async () => {
 const self: Person = { id: id(2), name: 'Synthetic', role: 'supervisor' };
 for (const value of [null, { version: 1, rows: 'invalid', next: null, serverNow: new Date().toISOString(), visibleUntil: null }]) {
  const a = createSqlReview(self, { rpc: async () => value });
  await expect(a.read({ actorId: self.id }, signal())).rejects.toMatchObject({ reason: 'offline' });
 }
 const a = createSqlReview(self, { rpc: async () => { throw { code: 'PGRST202', message: 'private' }; } });
 await expect(a.read({ actorId: self.id }, signal())).rejects.toMatchObject({ reason: 'offline' });
 const aborted = new AbortController(); aborted.abort();
 await expect(a.read({ actorId: self.id }, aborted.signal)).rejects.toMatchObject({ name: 'AbortError' });
});

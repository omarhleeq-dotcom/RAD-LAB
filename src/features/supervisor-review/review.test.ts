// @vitest-environment jsdom
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { createElement } from 'react';
import { afterEach, describe, expect, it } from 'vitest';
import { LocalSupervisorReview, ReviewSession } from './ReviewSession';
import { createSyntheticReview } from './synthetic';
import type { Command, Query } from './contracts';
import { copy } from './copy';
Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
const signal = () => new AbortController().signal;
function fixture() {
 let now = Date.now();
 const f = createSyntheticReview({ delay: 0, now: () => now });
 const owner = f.adapter.accounts[0]!, supervisor = f.adapter.accounts[1]!, other = f.adapter.accounts[2]!, student = f.adapter.accounts[3]!;
 return { ...f, owner, supervisor, other, student, advance: (ms: number) => { now += ms; }, read: (q: Query) => f.adapter.read(q, signal()), run: (actor: string, c: Command) => f.adapter.execute(actor, c, signal()) };
}
afterEach(() => { document.body.innerHTML = ''; });
describe('local supervisor contract', () => {
 it('bounds lists and isolates supervisors before paging and results', async () => {
  const f = fixture(), a = await f.read({ actorId: f.supervisor.id }), b = await f.read({ actorId: f.other.id });
  expect(a.groups.rows).toHaveLength(1); expect(b.groups.rows[0]!.id).not.toBe(a.groups.rows[0]!.id);
  const q = { actorId: f.supervisor.id, groupId: a.groups.rows[0]!.id }, data = await f.read(q);
  expect(data.members.rows).toHaveLength(20); expect(data.members.next).toBe('20');
  expect((await f.read({ ...q, membersCursor: data.members.next! })).members.rows).toHaveLength(4);
  expect(data.results.rows).toHaveLength(20); expect(data.results.rows.some(r => r.score.includes('OLD'))).toBe(false);
  expect(data.results.rows.filter(r => r.kind === 'exam').every(r => r.groupId === q.groupId && r.supervisorId === f.supervisor.id)).toBe(true);
  expect((await f.read({ ...q, actorId: f.other.id })).results.rows).toEqual([]);
  expect((await f.read({ ...q, actorId: f.student.id })).results.rows).toEqual([]);
 });
 it('code rotation, idempotent pending, cancel, reject, approval and rejoin windows', async () => {
  const f = fixture(), g = (await f.read({ actorId: f.supervisor.id })).groups.rows[0]!;
  await f.run(f.student.id, { kind: 'leave', groupId: g.id });
  const old = (await f.run(f.supervisor.id, { kind: 'rotate', groupId: g.id, revision: g.revision })).code!;
  await expect(f.run(f.supervisor.id, { kind: 'rotate', groupId: g.id, revision: g.revision })).rejects.toMatchObject({ reason: 'conflict' });
  const updated = (await f.read({ actorId: f.supervisor.id, groupId: g.id })).group!;
  const code = (await f.run(f.supervisor.id, { kind: 'rotate', groupId: g.id, revision: updated.revision })).code!;
  await expect(f.run(f.student.id, { kind: 'join', code: old })).rejects.toMatchObject({ reason: 'invalid' });
  for (const decision of ['cancel', 'reject', 'approve'] as const) {
   await f.run(f.student.id, { kind: 'join', code }); await f.run(f.student.id, { kind: 'join', code });
   const pending = (await f.read({ actorId: f.student.id })).requests.rows.filter(r => r.status === 'pending'); expect(pending).toHaveLength(1);
   const r = pending[0]!; await f.run(decision === 'cancel' ? f.student.id : f.supervisor.id, { kind: decision, requestId: r.id, revision: r.revision });
   await expect(f.run(f.supervisor.id, { kind: 'approve', requestId: r.id, revision: r.revision })).rejects.toMatchObject({ reason: 'conflict' });
  }
  const data = await f.read({ actorId: f.supervisor.id, groupId: g.id });
  expect(data.results.rows.some(r => r.studentId === f.student.id)).toBe(false);
 });
 it('owner assignment, expiry, revocation and cancellation fail closed', async () => {
  const f = fixture(), g = (await f.read({ actorId: f.supervisor.id })).groups.rows[0]!;
  await expect(f.run(f.supervisor.id, { kind: 'appoint', personId: f.other.id })).rejects.toMatchObject({ reason: 'denied' });
  await f.run(f.owner.id, { kind: 'revoke', personId: f.supervisor.id });
  expect((await f.read({ actorId: f.supervisor.id, groupId: g.id })).members.rows).toEqual([]);
  await expect(f.run(f.supervisor.id, { kind: 'rotate', groupId: g.id, revision: g.revision })).rejects.toMatchObject({ reason: 'denied' });
  await f.run(f.owner.id, { kind: 'appoint', personId: f.supervisor.id });
  f.expire(); expect((await f.read({ actorId: f.supervisor.id, groupId: g.id })).results.rows).toEqual([]);
  await expect(f.run(f.supervisor.id, { kind: 'end', groupId: g.id, revision: g.revision })).rejects.toMatchObject({ reason: 'expired' });
  const controller = new AbortController(); controller.abort();
  await expect(f.adapter.execute(f.supervisor.id, { kind: 'create', name: 'cancelled', endsAt: Date.now() + 9e9 }, controller.signal)).rejects.toMatchObject({ name: 'AbortError' });
 });
 it('creates bounded group metadata, reveals code only on mutation, handles end and invalid dates', async () => {
  const f = fixture();
  await expect(f.run(f.supervisor.id, { kind: 'create', name: 'bad', endsAt: 0 })).rejects.toMatchObject({ reason: 'invalid' });
  const created = await f.run(f.supervisor.id, { kind: 'create', name: 'New synthetic group', endsAt: Date.now() + 86400000 }); expect(created.code).toMatch(/^DEMO-/);
  const g = (await f.read({ actorId: f.supervisor.id })).groups.rows.find(g => g.name === 'New synthetic group')!;
  const data = await f.read({ actorId: f.supervisor.id, groupId: g.id }); expect(data.members.rows).toEqual([]); expect(JSON.stringify(data)).not.toContain(created.code);
  await f.run(f.student.id, { kind: 'join', code: created.code! });
  await f.run(f.supervisor.id, { kind: 'end', groupId: g.id, revision: g.revision });
  await expect(f.run(f.student.id, { kind: 'join', code: created.code! })).rejects.toMatchObject({ reason: 'invalid' });
 });
 it('drops expired results and has explicit synthetic failure and conflict', async () => {
  const f = fixture(), g = (await f.read({ actorId: f.supervisor.id })).groups.rows[0]!; f.advance(86400001);
  expect((await f.read({ actorId: f.supervisor.id, groupId: g.id })).results.rows).toEqual([]);
  f.scenario('offline'); await expect(f.read({ actorId: f.supervisor.id })).rejects.toMatchObject({ reason: 'offline' });
  f.scenario('conflict'); await expect(f.run(f.supervisor.id, { kind: 'end', groupId: g.id, revision: g.revision })).rejects.toMatchObject({ reason: 'conflict' });
 });
});
async function settle() { await act(async () => { await new Promise(r => setTimeout(r, 65)); }); }
it('actual UI switches accounts, clears old rows synchronously and aborts a slow response', async () => {
 const host = document.createElement('div'); document.body.append(host); const root = createRoot(host);
 await act(async () => { root.render(createElement(LocalSupervisorReview)); }); await settle();
 // P1-USABILITY-F3: automatic opening adds a second scoped read; wait for its visible card.
 for (let n = 0; n < 20 && !host.querySelector('button[aria-label]'); n++) await settle();
 // P1-USABILITY-F3: group cards expose the group name as the button's accessible name.
 const group = [...host.querySelectorAll('button')].find(b => b.getAttribute('aria-label')?.includes('Synthetic group'))!;
 await act(async () => group.click()); await settle(); expect(host.textContent).toContain(copy.en.results);
 const scenario = host.querySelectorAll('select')[1]!;
 await act(async () => { scenario.value = 'slow'; scenario.dispatchEvent(new Event('change', { bubbles: true })); });
 expect(host.textContent).not.toContain(copy.en.results); expect(host.textContent).toContain(copy.en.loading);
 const accounts = host.querySelector('select')!;
 await act(async () => { accounts.value = accounts.options[0]!.value; accounts.dispatchEvent(new Event('change', { bubbles: true })); });
 await act(async () => { scenario.value = 'normal'; scenario.dispatchEvent(new Event('change', { bubbles: true })); }); await settle();
 expect(host.textContent).toContain(copy.en.owner); expect(host.textContent).not.toContain(copy.en.results);
 await act(async () => root.unmount());
});
it('UI hides results at their visibility deadline without requiring a click', async () => {
 const f = fixture(), g = (await f.read({ actorId: f.supervisor.id })).groups.rows[0]!;
 const adapter = { ...f.adapter, read: async (...args: Parameters<typeof f.adapter.read>) => { const d = await f.adapter.read(...args); return { ...d, visibilityUntil: d.now + 150 }; } };
 const host = document.createElement('div'); document.body.append(host); const root = createRoot(host);
 await act(async () => root.render(createElement(ReviewSession, { adapter, actorId: f.supervisor.id, groupId: g.id, locale: 'en', selectGroup: () => {} }))); await settle();
 expect(host.textContent).toContain(copy.en.results);
 await act(async () => { await new Promise(r => setTimeout(r, 160)); });
 expect(host.textContent).not.toContain(copy.en.results); expect(host.textContent).toContain(copy.en.expired);
 await act(async () => root.unmount());
});

it('keeps an empty group visible when expiry exceeds the browser timer maximum', async () => {
 const f = fixture();
 await f.run(f.supervisor.id, { kind: 'create', name: 'Long-lived synthetic group', endsAt: Date.now() + 60 * 86400000 });
 const g = (await f.read({ actorId: f.supervisor.id })).groups.rows.find(g => g.name === 'Long-lived synthetic group')!;
 const host = document.createElement('div'); document.body.append(host); const root = createRoot(host);
 await act(async () => root.render(createElement(ReviewSession, { adapter: f.adapter, actorId: f.supervisor.id, groupId: g.id, locale: 'en', selectGroup: () => {} }))); await settle();
 expect(host.textContent).toContain('Long-lived synthetic group'); expect(host.textContent).not.toContain(copy.en.expired);
 await act(async () => root.unmount());
});

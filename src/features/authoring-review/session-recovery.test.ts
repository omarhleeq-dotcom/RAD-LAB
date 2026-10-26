// @vitest-environment jsdom
import { act, createElement } from 'react';
import { createRoot } from 'react-dom/client';
import { expect, it } from 'vitest';
import { AuthoringSession } from './Session';
import { createAuthoringFixture } from './synthetic';
import { localPartCatalog } from './catalog';
import { newDraft } from './draft';
import { ReviewError } from '../supervisor-review/contracts';
import { copy, sqlCopy } from './copy';
Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
const wait = () => act(async () => { await new Promise(r => setTimeout(r, 20)); });
for (const reason of ['conflict', 'offline'] as const) it(`retains local edits after ${reason}, verifies without mutation, then clears them on scope loss and ignores late replies`, async () => {
 const f = createAuthoringFixture(localPartCatalog(), { delay: 0 }); const a = f.adapter;
 const actorId = a.accounts[0]!.id, group = (await a.groups(actorId, undefined, new AbortController().signal)).rows[0]!;
 const scope = { actorId, groupId: group.id }, local = { ...newDraft(), name: 'LOCAL-PRIVATE' }, remote = { ...local, name: 'REMOTE-PRIVATE', revision: 2 };
 let writes = 0, reads = 0, invalidate = () => {};
 const adapter = { ...a, service: 'sql' as const, context: async () => ({ group, now: Date.now(), draft: local }), subscribe(fn: () => void) { invalidate = fn; return () => {}; },
  async save() { writes++; throw new ReviewError(reason); }, async drafts() { reads++; return { rows: [{ id: local.id, track: 'mixed' as const, name: remote.name, revision: 2 }], next: null }; },
  async open() { reads++; return remote; },
 };
 const host = document.createElement('div'); document.body.append(host); const root = createRoot(host);
 const click = async (name: string) => { const button = [...host.querySelectorAll('button')].find(b => b.textContent === name); expect(button, name).toBeTruthy(); await act(async () => button!.click()); await wait(); };
 try {
  await act(async () => root.render(createElement(AuthoringSession, { adapter, scope, locale: 'en' }))); await wait();
  await click(sqlCopy.en.save!); expect(writes).toBe(1); expect(host.textContent).toContain(copy.en.recovery);
  expect(host.querySelectorAll('textarea')).toHaveLength(0); // empty draft has no item textareas; retained copy is hidden until authorization.
  await click(copy.en.verify); expect(writes).toBe(1); expect(reads).toBeGreaterThan(1);
  const values = [...host.querySelectorAll('textarea')].map(n => n.value).join(' '); expect(values).toContain('LOCAL-PRIVATE'); expect(values).toContain('REMOTE-PRIVATE');
  await click(copy.en.editVerified); expect((host.querySelector('input') as HTMLInputElement).value).toBe('REMOTE-PRIVATE');
  expect([...host.querySelectorAll('button')].find(b => b.textContent === sqlCopy.en.save!)!.disabled).toBe(true);
  expect([...host.querySelectorAll('button')].find(b => b.textContent === copy.en.draftList)!.disabled).toBe(true);
  // A scope signal clears both the editor and the recovery buffer, including private copies.
  await act(async () => invalidate());
  expect(host.textContent).toContain(copy.en.denied); expect(host.querySelectorAll('input,textarea,svg')).toHaveLength(0);
  await wait(); expect(host.textContent).not.toContain('REMOTE-PRIVATE');
 } finally { await act(async () => root.unmount()); host.remove(); }
});

it('replacing an adapter clears private state before a reply and ignores a late reply after invalidation', async () => {
 const f = createAuthoringFixture([], { delay: 0 }), a = f.adapter, actorId = a.accounts[0]!.id;
 const group = (await a.groups(actorId, undefined, new AbortController().signal)).rows[0]!;
 let invalidate = () => {}, release!: (value: { group: typeof group; now: number; draft: ReturnType<typeof newDraft> }) => void;
 const adapter = { ...a, service: 'sql' as const, subscribe(fn: () => void) { invalidate = fn; return () => {}; }, context: async () => new Promise<{ group: typeof group; now: number; draft: ReturnType<typeof newDraft> }>(r => { release = r; }) };
 const host = document.createElement('div'), root = createRoot(host);
 try {
  const old = { ...adapter, context: async () => ({ group, now: Date.now(), draft: { ...newDraft(), name: 'OLD-PRIVATE' } }) };
  await act(async () => root.render(createElement(AuthoringSession, { adapter: old, scope: { actorId, groupId: group.id }, locale: 'ar' }))); await wait();
  expect((host.querySelector('input') as HTMLInputElement).value).toBe('OLD-PRIVATE');
  await act(async () => root.render(createElement(AuthoringSession, { adapter, scope: { actorId, groupId: group.id }, locale: 'ar' })));
  expect(host.querySelectorAll('input,textarea')).toHaveLength(0);
  await act(async () => invalidate()); await act(async () => release({ group, now: Date.now(), draft: { ...newDraft(), name: 'LATE-PRIVATE' } }));
  expect(host.textContent).toContain(copy.ar.denied); expect(host.querySelectorAll('input,textarea,svg')).toHaveLength(0); expect(host.textContent).not.toContain('LATE-PRIVATE');
 } finally { await act(async () => root.unmount()); }
});

it('pending open disables creation, and cancellation of an uncertain save preserves a private copy without replay', async () => {
 const f = createAuthoringFixture([], { delay: 0 }), a = f.adapter, actorId = a.accounts[0]!.id;
 const group = (await a.groups(actorId, undefined, new AbortController().signal)).rows[0]!, draft = { ...newDraft(), name: 'CANCEL-PRIVATE', revision: 1 };
 let opened!: (d: typeof draft) => void, saved!: (d: typeof draft) => void, writes = 0;
 const adapter = { ...a, service: 'sql' as const, context: async () => ({ group, now: Date.now() }),
  drafts: async () => ({ rows: [{ id: draft.id, name: draft.name, track: 'mixed' as const, revision: 1 }], next: null }),
  open: async () => new Promise<typeof draft>(r => { opened = r; }),
  save: async () => { writes++; return new Promise<typeof draft>(r => { saved = r; }); },
 };
 const host = document.createElement('div'), root = createRoot(host);
 const button = (label: string) => [...host.querySelectorAll('button')].find(b => b.textContent === label)!;
 try {
  await act(async () => root.render(createElement(AuthoringSession, { adapter, scope: { actorId, groupId: group.id }, locale: 'en' }))); await wait();
  await act(async () => [...host.querySelectorAll('button')].find(b => b.textContent?.startsWith(draft.name))!.click());
  expect(button(sqlCopy.en.create!).disabled).toBe(true);
  await act(async () => opened(draft));
  await act(async () => button(sqlCopy.en.save!).click()); expect(writes).toBe(1);
  await act(async () => button(copy.en.cancel).click());
  expect(host.textContent).toContain(copy.en.recovery); expect(host.querySelectorAll('input,textarea')).toHaveLength(0);
  await act(async () => saved({ ...draft, revision: 2 }));
  expect(host.textContent).toContain(copy.en.recovery); expect(writes).toBe(1);
 } finally { await act(async () => root.unmount()); }
});

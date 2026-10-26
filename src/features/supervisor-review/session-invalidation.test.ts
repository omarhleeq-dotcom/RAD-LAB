// @vitest-environment jsdom
import { act, createElement } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, expect, it } from 'vitest';
import { ReviewSession } from './ReviewSession';
import { createSyntheticReview } from './synthetic';
import type { Snapshot } from './contracts';
import { copy } from './copy';
Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
afterEach(() => { document.body.innerHTML = ''; });
it.each(['revocation', 'leave', 'end'])('clears on %s invalidation and rejects a transport response that ignores AbortSignal', async () => {
 const fixture = createSyntheticReview({ delay: 0 }), actor = fixture.adapter.accounts[1]!;
 const group = (await fixture.adapter.read({ actorId: actor.id }, new AbortController().signal)).groups.rows[0]!;
 const data = await fixture.adapter.read({ actorId: actor.id, groupId: group.id }, new AbortController().signal);
 const pending: ((d: Snapshot) => void)[] = [];
 let invalidate: (() => void) | undefined;
 const adapter = { ...fixture.adapter,
  read: () => new Promise<Snapshot>(resolve => { pending.push(resolve); }),
  subscribe(fn: () => void) { invalidate = fn; return () => { invalidate = undefined; }; },
 };
 const host = document.createElement('div'); document.body.append(host); const root = createRoot(host);
 await act(async () => root.render(createElement(ReviewSession, { adapter, actorId: actor.id, groupId: group.id, selectGroup: () => {}, locale: 'en' })));
 await act(async () => pending.shift()!(data)); expect(host.textContent).toContain(copy.en.results);
 await act(async () => host.querySelector('button')!.click()); expect(host.textContent).not.toContain(copy.en.results);
 await act(async () => invalidate!()); expect(host.textContent).toContain(copy.en.denied);
 await act(async () => pending.shift()!(data)); expect(host.textContent).not.toContain(copy.en.results);
 await act(async () => host.querySelector('button')!.click());
 await act(async () => root.unmount());
 await act(async () => pending.shift()!(data)); expect(host.textContent).toBe(''); expect(invalidate).toBeUndefined();
});

it('a failed refresh clears a previously displayed result and a newer refresh wins over an older response', async () => {
 const fixture = createSyntheticReview({ delay: 0 }), actor = fixture.adapter.accounts[1]!;
 const group = (await fixture.adapter.read({ actorId: actor.id }, new AbortController().signal)).groups.rows[0]!;
 const data = await fixture.adapter.read({ actorId: actor.id, groupId: group.id }, new AbortController().signal);
 const pending: { resolve: (d: Snapshot) => void; reject: (e: Error) => void }[] = [];
 const adapter = { ...fixture.adapter, read: () => new Promise<Snapshot>((resolve, reject) => { pending.push({ resolve, reject }); }) };
 const host = document.createElement('div'); document.body.append(host); const root = createRoot(host);
 await act(async () => root.render(createElement(ReviewSession, { adapter, actorId: actor.id, groupId: group.id, selectGroup: () => {}, locale: 'ar' })));
 await act(async () => pending.shift()!.resolve(data));
 await act(async () => host.querySelector('button')!.click());
 await act(async () => pending.shift()!.reject(Error('private diagnostic')));
 expect(host.textContent).toContain(copy.ar.offline); expect(host.textContent).not.toContain(copy.ar.results);
 await act(async () => host.querySelector('button')!.click()); const old = pending.shift()!;
 await act(async () => host.querySelector('button')!.click());
 await act(async () => pending.shift()!.resolve({ ...data, members: { rows: [], next: null }, results: { rows: [], next: null } }));
 await act(async () => old.resolve(data)); expect(host.textContent).not.toContain('7 / 10');
 await act(async () => root.unmount());
});

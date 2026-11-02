// @vitest-environment jsdom
import { act, createElement } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, expect, it, vi } from 'vitest';
import { ReviewSession, SUPERVISOR_DATA_TTL_MS } from '../supervisor-review/ReviewSession';
import { ReviewError, type ReviewAdapter, type Snapshot } from '../supervisor-review/contracts';
import { appCopy } from '../supervisor-review/copy';
Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
const actor = { id: 'supervisor', name: 'Supervisor', role: 'supervisor' as const };
const group = { id: 'group', name: 'Private group', supervisorId: actor.id, startsAt: 0, supervisedFrom: 0, endsAt: 4102444800000, revision: 1 };
function snapshot(visibilityAge = Infinity): Snapshot {
 return { now: Date.now(), visibilityUntil: Date.now() + visibilityAge, appointed: true, isMember: null,
  people: { rows: [], next: null }, groups: { rows: [group], next: null }, group,
  requests: { rows: [{ id: 'request', groupId: group.id, studentId: 'student', studentName: 'Private applicant', status: 'pending', revision: 1 }], next: null },
  members: { rows: [{ id: 'student', name: 'Private student', joinedAt: 0 }], next: null },
  results: { rows: [{ id: 'result', studentId: 'student', studentName: 'Private result name', kind: 'practice', at: Date.now(), score: '7 / 10', visibleUntil: 4102444800000 }], next: null } };
}
let root: Root | undefined;
afterEach(async () => { if (root) await act(async () => root!.unmount()); root = undefined; vi.useRealTimers(); document.body.innerHTML = ''; });
async function mount(data = snapshot()) {
 vi.useFakeTimers();
 const read = vi.fn<ReviewAdapter['read']>().mockResolvedValue(data);
 const adapter: ReviewAdapter = { accounts: [actor], read, execute: vi.fn().mockResolvedValue({ code: 'PRIVATE-CODE' }) };
 const host = document.createElement('div'); document.body.append(host); root = createRoot(host);
 const render = async (locale: 'en' | 'ar' = 'en') => act(async () => root!.render(createElement(ReviewSession, { adapter, actorId: actor.id, groupId: group.id, selectGroup: () => {}, locale, text: appCopy[locale] })));
 await render();
 const refresh = async () => act(async () => host.querySelector('button')!.click());
 return { host, read, adapter, render, refresh };
}
function cleared(host: HTMLElement) {
 for (const secret of ['Private applicant', 'Private student', 'Private result name', 'Private group', '7 / 10', 'PRIVATE-CODE']) expect(host.textContent).not.toContain(secret);
}
it.each([Infinity, SUPERVISOR_DATA_TTL_MS * 2])('hides names/results at exactly the TTL with no background read (server age %s)', async age => {
 const { host, read } = await mount(snapshot(age));
 expect(host.textContent).toContain('7 / 10');
 await act(async () => vi.advanceTimersByTime(SUPERVISOR_DATA_TTL_MS - 1)); expect(host.textContent).toContain('Private student');
 await act(async () => vi.advanceTimersByTime(1)); cleared(host); expect(host.textContent).toContain(appCopy.en.refreshToView);
 await act(async () => vi.advanceTimersByTime(SUPERVISOR_DATA_TTL_MS * 4)); expect(read).toHaveBeenCalledTimes(1);
});
it('starts a fresh lifetime only after a successful re-read and does not extend it for a pending locale re-read', async () => {
 const { host, read, refresh, render } = await mount();
 await act(async () => vi.advanceTimersByTime(SUPERVISOR_DATA_TTL_MS - 1));
 let resolve!: (value: Snapshot) => void;
 read.mockImplementationOnce(() => new Promise(r => { resolve = r; })); await refresh(); cleared(host);
 await act(async () => vi.advanceTimersByTime(SUPERVISOR_DATA_TTL_MS)); cleared(host);
 await act(async () => resolve(snapshot())); expect(host.textContent).toContain('7 / 10');
 await act(async () => vi.advanceTimersByTime(SUPERVISOR_DATA_TTL_MS - 1));
 read.mockImplementationOnce(() => new Promise(() => {})); await render('ar');
 await act(async () => vi.advanceTimersByTime(1)); cleared(host); expect(host.textContent).toContain(appCopy.ar.refreshToView);
});
it('keeps an earlier group/result visibility deadline', async () => {
 const { host, read } = await mount(snapshot(5000));
 await act(async () => vi.advanceTimersByTime(5000)); cleared(host); expect(host.textContent).toContain(appCopy.en.expired); expect(read).toHaveBeenCalledTimes(1);
});
it.each(['withdrawn', 'left', 'ended'] as const)('clears everything immediately on a denied re-read (%s)', async cause => {
 const { host, read, refresh } = await mount();
 // Keep a one-time code and success receipt alongside the loaded data.
 await act(async () => Array.from(host.querySelectorAll('button')).find(b => b.textContent === appCopy.en.rotate)!.click());
 expect(host.textContent).toContain('PRIVATE-CODE'); expect(host.textContent).toContain(appCopy.en.success);
 read.mockRejectedValueOnce(new ReviewError(cause === 'ended' ? 'expired' : 'denied'));
 await refresh(); cleared(host); expect(host.textContent).not.toContain(appCopy.en.success);
 expect(host.textContent).toContain(cause === 'ended' ? appCopy.en.expired : appCopy.en.denied);
 await act(async () => vi.advanceTimersByTime(SUPERVISOR_DATA_TTL_MS)); cleared(host); expect(read).toHaveBeenCalledTimes(3);
});
it('a denial discards confirmation state and cannot be undone by an older transport response', async () => {
 const { host, read, refresh } = await mount();
 await act(async () => Array.from(host.querySelectorAll('button')).find(b => b.textContent === appCopy.en.end)!.click());
 expect(host.textContent).toContain(appCopy.en.confirmEnd);
 let resolve!: (value: Snapshot) => void;
 read.mockImplementationOnce(() => new Promise(r => { resolve = r; })); await refresh();
 read.mockRejectedValueOnce(new ReviewError('denied')); await refresh();
 await act(async () => resolve(snapshot())); cleared(host); expect(host.textContent).not.toContain(appCopy.en.confirmEnd);
 expect(host.textContent).toContain(appCopy.en.denied);
});

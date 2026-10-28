// @vitest-environment jsdom
import { act, createElement, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, expect, it, vi } from 'vitest';
import { ReviewSession } from './ReviewSession';
import { JoinCodePanel, SupervisorReview } from './SupervisorReview';
import { copy } from './copy';
import type { Person, ReviewAdapter, Snapshot } from './contracts';
Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
afterEach(() => { document.body.innerHTML = ''; vi.restoreAllMocks(); });
const t = copy.en;
const self: Person = { id: 'supervisor', name: 'Supervisor', role: 'supervisor' };
const group = { id: 'group', name: 'Same name', supervisorId: self.id, startsAt: Date.now(), supervisedFrom: Date.now(), endsAt: Date.now() + 3600000, revision: 1 };
const blank = () => ({ rows: [], next: null });
function snapshot(): Snapshot { return { now: Date.now(), appointed: true, isMember: true, people: blank(), groups: { rows: [group], next: null }, requests: blank(), members: blank(), results: blank(), visibilityUntil: Infinity }; }
function mount() { const host = document.createElement('div'); document.body.append(host); return { host, root: createRoot(host) }; }
function click(host: HTMLElement, text: string) { const b = [...host.querySelectorAll('button')].find(b => b.textContent === text); expect(b, text).toBeTruthy(); b!.click(); }
it.each(['end', 'leave', 'revoke'] as const)('F6: successful %s clears selection before re-reading and shows success', async kind => {
 const { host, root } = mount(); let ended = false; const reads: (string | undefined)[] = [];
 const actor = { ...self, role: kind === 'leave' ? 'student' as const : kind === 'revoke' ? 'owner' as const : 'supervisor' as const };
 const adapter: ReviewAdapter = { accounts: [actor], async read(q) { reads.push(q.groupId); if (ended && q.groupId) throw Error('stale selected group'); const d = snapshot(); d.group = q.groupId ? group : undefined; if (kind === 'revoke') d.people = { rows: [{ ...self, appointed: true }], next: null }; return d; }, async execute(_, c) { expect(c.kind).toBe(kind); ended = true; return {}; } };
 function View() { const [selected, select] = useState('group'); return createElement(ReviewSession, { adapter, actorId: actor.id, groupId: selected, selectGroup: select, locale: 'en' }); }
 await act(async () => root.render(createElement(View)));
 await act(async () => click(host, t[kind]));
 await act(async () => click(host, t[kind === 'end' ? 'confirmEnd' : kind === 'leave' ? 'confirmLeave' : 'confirmRevoke']));
 expect(reads.at(-1)).toBe(''); expect(host.textContent).toContain(t.success); expect(host.textContent).not.toContain(t.denied); expect(host.textContent).not.toContain(t.offline);
 await act(async () => root.unmount());
});
it('F1: refresh keeps the one-time receipt until Done; F3: first group opens automatically', async () => {
 const { host, root } = mount(); const adapter: ReviewAdapter = { accounts: [self], async read(q) { return { ...snapshot(), group: q.groupId ? group : undefined }; }, async execute() { return { code: 'one-time-code', groupId: group.id }; } };
 function View() { const [selected, select] = useState<string>(); return createElement(ReviewSession, { adapter, actorId: self.id, groupId: selected, selectGroup: select, locale: 'en' }); }
 await act(async () => root.render(createElement(View))); expect(host.querySelector('[aria-pressed=true]')).toBeTruthy();
 await act(async () => click(host, t.rotate)); expect(host.textContent).toContain('one-time-code');
 await act(async () => click(host, t.retry)); expect(host.textContent).toContain('one-time-code');
 await act(async () => click(host, t.done)); expect(host.textContent).not.toContain('one-time-code');
 await act(async () => root.unmount());
});
it('F1: copy confirms, native sharing receives code, unsupported sharing copies, cancellation keeps panel', async () => {
 const { host, root } = mount(), writeText = vi.fn().mockResolvedValue(undefined), share = vi.fn().mockResolvedValue(undefined);
 Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText } });
 Object.defineProperty(navigator, 'share', { configurable: true, value: share });
 await act(async () => root.render(createElement(JoinCodePanel, { code: 'ABC12345', t, done: vi.fn() })));
 await act(async () => click(host, t.copyCode)); expect(writeText).toHaveBeenCalledWith('ABC12345'); expect(host.textContent).toContain(t.copied);
 await act(async () => click(host, t.shareCode)); expect(share).toHaveBeenCalledWith({ title: t.code, text: 'ABC12345' });
 share.mockRejectedValueOnce(new DOMException('cancel', 'AbortError')); await act(async () => click(host, t.shareCode)); expect(host.textContent).toContain('ABC12345'); expect(writeText).toHaveBeenCalledTimes(1);
 Object.defineProperty(navigator, 'share', { configurable: true, value: undefined }); await act(async () => click(host, t.shareCode)); expect(writeText).toHaveBeenCalledTimes(2);
 await act(async () => root.unmount());
});
it('F4/F7: unselected group has a selection hint; student UUIDs never appear', async () => {
 const { host, root } = mount(); const data = snapshot();
 const props = { actor: self, t, data, act: () => {}, paging: () => {}, selectGroup: () => {}, confirm: () => {}, cancel: () => {}, locale: 'en' };
 await act(async () => root.render(createElement(SupervisorReview, props))); expect(host.textContent).toContain(t.selectGroupHint); expect(host.textContent).not.toContain(t.empty + t.requests);
 const uuid = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'; data.group = group; data.requests.rows = [{ id: 'request', studentId: uuid, groupId: group.id, status: 'pending', revision: 1 }]; data.members.rows = [{ id: uuid, name: uuid, joinedAt: Date.now() }];
 await act(async () => root.render(createElement(SupervisorReview, props))); expect(host.textContent).not.toContain(uuid); expect(host.textContent).toContain('Student 1');
 await act(async () => root.unmount());
});

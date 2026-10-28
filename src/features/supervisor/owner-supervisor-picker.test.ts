// @vitest-environment jsdom
import { act, createElement } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { NextIntlClientProvider } from 'next-intl';
import { afterEach, expect, it, vi } from 'vitest';
import en from '../../../messages/en.json';
import ar from '../../../messages/ar.json';
import { CONSENT_VERSION } from '../pilot/consent';
import { ReviewError, type ReviewAdapter, type Snapshot } from '../supervisor-review/contracts';
import { OwnerSupervisorPicker, appointmentReason } from './OwnerSupervisorPicker';
import { P1View } from './P1Session';
const f = vi.hoisted(() => ({ rpc: vi.fn(), user: 'owner' }));
vi.mock('../pilot/SessionGate', () => ({ useSessionAccount: () => ({ state: { kind: 'signedIn', userId: f.user, profile: { role: 'owner', status: 'approved' }, consentVersion: CONSENT_VERSION } }) }));
vi.mock('../pilot/client', () => ({ getPilotClient: async () => ({ rpc: f.rpc }) }));
Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
let root: Root | undefined;
afterEach(async () => { if (root) await act(async () => root!.unmount()); root = undefined; document.body.innerHTML = ''; vi.clearAllMocks(); f.user = 'owner'; });
const id = (n: number) => `00000000-0000-0000-0000-${String(n).padStart(12, '0')}`;
const row = (n: number, extra = {}) => ({ user_id: id(n), participant_code: `SYN-${n}`, role: 'participant', status: 'approved', name: `Synthetic ${n}`, email: `synthetic${n}@example.test`, created_at: '2026-01-01', last_seen_at: null, ...extra });
const page = (rows = [row(2)], next: unknown = null) => ({ version: 1, rows, counts: { pending: 0, approved: 25, suspended: 0 }, next, boundary: '2026-01-01' });
const snapshot: Snapshot = { service: 'sql', now: Date.now(), appointed: null, isMember: null, people: { rows: [], next: null }, groups: { rows: [], next: null }, requests: { rows: [], next: null }, members: { rows: [], next: null }, results: { rows: [], next: null }, visibilityUntil: Infinity };
function adapter(): ReviewAdapter { return { accounts: [{ id: 'owner', name: 'Synthetic owner', role: 'owner' }], read: vi.fn(async () => snapshot), execute: vi.fn(async () => ({})), readAppointment: vi.fn(async () => false) }; }
async function mount(child: React.ReactNode, locale: 'en' | 'ar' = 'en') {
 const host = document.createElement('div'); document.body.append(host); root = createRoot(host);
 const props = { locale, messages: locale === 'en' ? en : ar, children: child };
 await act(async () => root!.render(createElement(NextIntlClientProvider, props)));
 return host;
}
const click = async (b: HTMLElement) => act(async () => b.click());
function button(host: HTMLElement, text: string) { return [...host.querySelectorAll('button')].find(b => b.textContent === text)!; }
it.each(['en', 'ar'] as const)('searches by name/email on the server and replaces bounded pages in %s', async locale => {
 const m = locale === 'en' ? en : ar;
 f.rpc.mockResolvedValueOnce({ data: page([row(2)], { id: id(2), rank: 1 }), error: null }).mockResolvedValueOnce({ data: page([row(24)]), error: null }).mockResolvedValue({ data: page([row(25)]), error: null });
 const a = adapter(), host = await mount(createElement(OwnerSupervisorPicker, { adapter: a, act: vi.fn(), locale }), locale);
 expect(f.rpc).toHaveBeenLastCalledWith('owner_account_directory_v1', { p_search: '', p_status: 'approved', p_cursor: null, p_boundary: null, p_limit: 20 });
 await click(button(host, m.owner.dashboard.next));
 expect(f.rpc.mock.calls.at(-1)![1]).toMatchObject({ p_cursor: { id: id(2), rank: '1' }, p_boundary: '2026-01-01', p_limit: 20 });
 expect(host.textContent).not.toContain('synthetic2@example.test'); expect(host.textContent).toContain('synthetic24@example.test');
 for (const value of ['Synthetic 25', 'synthetic25@example.test']) {
  const input = host.querySelector('input')!;
  await act(async () => { Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!.call(input, ` ${value} `); input.dispatchEvent(new Event('input', { bubbles: true })); });
  await act(async () => host.querySelector('form')!.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true })));
  expect(f.rpc.mock.calls.at(-1)![1]).toMatchObject({ p_search: value, p_status: 'approved', p_cursor: null, p_boundary: null, p_limit: 20 });
 }
 expect(host.querySelector('select')).toBeNull(); expect(host.querySelector('input[name=person]')).toBeNull();
});
it('confirms name and email, cancels without mutation and restores keyboard focus; Escape also cancels', async () => {
 f.rpc.mockResolvedValue({ data: page(), error: null }); const actCommand = vi.fn(), a = adapter();
 const host = await mount(createElement(OwnerSupervisorPicker, { adapter: a, act: actCommand, locale: 'en' }));
 const appoint = button(host, en.supervisor.appoint); await click(appoint);
 const dialog = host.querySelector('[role=alertdialog]')!;
 expect(dialog.textContent).toContain('Synthetic 2'); expect(dialog.textContent).toContain('synthetic2@example.test');
 expect(document.activeElement?.textContent).toBe(en.supervisor.confirmAction); expect(actCommand).not.toHaveBeenCalled();
 await click(button(host, en.supervisor.cancelAction)); expect(document.activeElement).toBe(appoint); expect(host.querySelector('[role=alertdialog]')).toBeNull();
 await click(appoint); await act(async () => host.querySelector('[role=alertdialog]')!.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true })));
 expect(actCommand).not.toHaveBeenCalled(); await click(appoint); await click(button(host, en.supervisor.confirmAction));
 expect(actCommand).toHaveBeenCalledExactlyOnceWith({ kind: 'appoint', personId: id(2) });
});
it('disables owners, nonapproved accounts and already appointed people with associated reasons; fails closed on lookup failure', async () => {
 f.rpc.mockResolvedValue({ data: page([row(1, { role: 'owner' }), row(2, { status: 'pending' }), row(3), row(4)]), error: null });
 const a = adapter(); a.readAppointment = vi.fn(async person => { if (person === id(4)) throw Error('offline'); return true; });
 const host = await mount(createElement(OwnerSupervisorPicker, { adapter: a, act: vi.fn(), locale: 'en' }));
 for (const text of [en.supervisor.appointmentOwner, en.supervisor.appointmentNotApproved, en.supervisor.appointmentAlready, en.supervisor.offline]) expect(host.textContent).toContain(text);
 for (const b of [...host.querySelectorAll('button[aria-describedby]')]) { expect((b as HTMLButtonElement).disabled).toBe(true); expect(host.querySelector(`[id="${b.getAttribute('aria-describedby')}"]`)).not.toBeNull(); }
 expect(a.readAppointment).toHaveBeenCalledTimes(2);
 const person = { userId: id(5), role: 'participant', status: 'suspended' } as Parameters<typeof appointmentReason>[0];
 expect(appointmentReason(person, false)).toBe('appointmentNotApproved');
});
it.each(['denied', 'conflict'] as const)('refreshes the appointments and directory after server %s while retaining the existing copy', async reason => {
 f.rpc.mockResolvedValue({ data: page(), error: null }); const a = adapter(); a.execute = vi.fn(async () => { throw new ReviewError(reason); });
 const host = await mount(createElement(P1View, { adapter: a, actorId: 'owner', locale: 'en' }));
 await click(button(host, en.supervisor.appoint)); await click(button(host, en.supervisor.confirmAction));
 expect(a.execute).toHaveBeenCalledTimes(1); expect(host.querySelector('[role=alert]')?.textContent).toBe(en.supervisor[reason]);
 expect(a.read).toHaveBeenCalledTimes(2); expect(f.rpc).toHaveBeenCalledTimes(2); expect(host.textContent).toContain('synthetic2@example.test');
});
it('ignores late directory/appointment replies after unmount', async () => {
 let resolve!: (v: boolean) => void;
 f.rpc.mockResolvedValue({ data: page(), error: null }); const a = adapter(); a.readAppointment = vi.fn((_p, signal) => { expect(signal.aborted).toBe(false); return new Promise<boolean>(r => { resolve = r; }); });
 const host = await mount(createElement(OwnerSupervisorPicker, { adapter: a, act: vi.fn(), locale: 'en' }));
 expect(button(host, en.supervisor.appoint).disabled).toBe(true);
 const signal = vi.mocked(a.readAppointment!).mock.calls[0]![1];
 await act(async () => root!.unmount()); root = undefined; expect(signal.aborted).toBe(true); await act(async () => resolve(true));
});

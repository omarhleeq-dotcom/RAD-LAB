// @vitest-environment jsdom
import { act, createElement } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, expect, it, vi } from 'vitest';
import en from '../../../messages/en.json';
const f = vi.hoisted(() => ({ available: true, appointed: false, role: 'participant', status: 'approved', user: '00000000-0000-0000-0000-000000000004', fail: false, client: vi.fn(), calls: vi.fn() }));
vi.mock('./p1-availability', () => ({ get P1_AVAILABLE() { return f.available; } }));
vi.mock('../pilot/config', () => ({ PILOT: true }));
vi.mock('../pilot/SessionGate', () => {
 const account = () => ({ state: { kind: 'signedIn', userId: f.user, profile: { role: f.role, status: f.status }, consentVersion: '2026-10-24' } });
 return { useSessionAccount: account, useOptionalSessionAccount: account };
});
vi.mock('next-intl', () => ({ useLocale: () => 'en' }));
vi.mock('../pilot/client', () => ({ getPilotClient: f.client }));
import { P1Session, P1SupervisorScope, useSupervisorAppointment } from './P1Session';
Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
afterEach(() => { document.body.innerHTML = ''; f.available = true; f.role = 'participant'; f.status = 'approved'; f.appointed = false; f.fail = false; vi.clearAllMocks(); });
function Nav() { return useSupervisorAppointment() ? createElement('a', { href: '/supervisor' }, 'Supervisor') : null; }
async function mount() {
 f.client.mockResolvedValue({ schema: () => ({ rpc: f.calls }) });
 f.calls.mockImplementation(() => ({ abortSignal: async () => {
  if (f.fail) throw Error('PRIVATE database stack and raw error');
  return { data: { version: 1, appointed: f.appointed, rows: [], next: null, total: 0, serverNow: new Date().toISOString(), visibleUntil: null }, error: null };
 } }));
 const host = document.createElement('div'); document.body.append(host); const root = createRoot(host);
 await act(async () => { root.render(createElement(P1SupervisorScope, null, createElement(Nav), createElement(P1Session, { role: 'supervisor' }))); await new Promise(r => setTimeout(r, 30)); });
 await act(async () => { await new Promise(r => setTimeout(r, 30)); });
 return { host, root };
}
it.each([false, true])('uses appointment metadata even with zero groups and no probe RPC (appointed=%s)', async appointed => {
 f.appointed = appointed; const { host, root } = await mount();
 expect(!!host.querySelector('a[href="/supervisor"]')).toBe(appointed);
 expect(host.textContent?.includes(en.supervisor.notSupervisor)).toBe(!appointed);
 expect(f.calls.mock.calls.every(([name, args]) => name === 'scope_page_v1' && args.p_kind === 'groups')).toBe(true);
 await act(async () => root.unmount());
});
it('hides immediately on identity/status loss, and rechecks revocation on visibility return', async () => {
 f.appointed = true; const { host, root } = await mount(); expect(host.querySelector('a')).not.toBeNull();
 f.appointed = false;
 await act(async () => { document.dispatchEvent(new Event('visibilitychange')); await new Promise(r => setTimeout(r, 30)); });
 await act(async () => { await new Promise(r => setTimeout(r, 30)); });
 expect(host.querySelector('a')).toBeNull(); expect(host.textContent).toContain(en.supervisor.notSupervisor);
 f.status = 'suspended';
 await act(async () => root.render(createElement(P1SupervisorScope, null, createElement(Nav), createElement(P1Session, { role: 'supervisor' }))));
 expect(host.querySelector('a')).toBeNull(); expect(host.textContent).toContain(en.supervisor.notSupervisor);
 await act(async () => root.unmount());
});
it('shows a safe service message on failure and never prints a raw error', async () => {
 f.fail = true; const { host, root } = await mount();
 expect(host.textContent).toContain(en.supervisor.offline); expect(host.textContent).not.toContain('PRIVATE'); expect(host.querySelector('a')).toBeNull();
 await act(async () => root.unmount());
});
it.each(['owner', 'deferred'])('does not acquire the client for %s', async mode => {
 if (mode === 'owner') f.role = 'owner'; else f.available = false;
 const { host, root } = await mount(); expect(f.client).not.toHaveBeenCalled(); expect(host.querySelector('a')).toBeNull();
 if (mode === 'owner') expect(host.textContent).toContain(en.supervisor.notSupervisor);
 await act(async () => root.unmount());
});

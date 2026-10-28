// @vitest-environment jsdom
import { act, createElement } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, expect, it, vi } from 'vitest';
import { CONSENT_VERSION } from '../pilot/consent';
import manifest from '../../../scripts/pages/frontend-schema.json';
import { sharingPolicy } from '../supervisor-review/sharing-policy';
import en from '../../../messages/en.json';
import ar from '../../../messages/ar.json';
const fixture = vi.hoisted(() => ({ available: false, role: 'participant', status: 'approved', userId: '00000000-0000-0000-0000-000000000004', calls: vi.fn(), client: vi.fn() }));
vi.mock('./p1-availability', async importOriginal => {
 const original = await importOriginal<typeof import('./p1-availability')>();
 return { ...original, get P1_AVAILABLE() { return fixture.available; } };
});
vi.mock('../pilot/config', () => ({ PILOT: true }));
vi.mock('../pilot/SessionGate', () => ({ useSessionAccount: () => ({ state: { kind: 'signedIn', userId: fixture.userId, profile: { role: fixture.role, status: fixture.status }, consentVersion: CONSENT_VERSION } }) }));
vi.mock('next-intl', () => ({ useLocale: () => 'en' }));
vi.mock('../pilot/client', () => ({ getPilotClient: fixture.client }));
import { p1Available, P1_MIGRATIONS } from './p1-availability';
import { P1Session } from './P1Session';
import { bindP1 } from './p1-live';
Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
afterEach(() => { document.body.innerHTML = ''; fixture.available = false; fixture.role = 'participant'; fixture.status = 'approved'; vi.clearAllMocks(); });
const signal = () => new AbortController().signal;
it('derives availability from all three classifications, without an environment bypass', () => {
 expect(p1Available(manifest)).toBe(true); // RAD085-DB-DAY-PROMOTION-20261027: the repository manifest is promoted.
 const promoted = { requiredMigrations: [...manifest.requiredMigrations, ...P1_MIGRATIONS], deferredMigrations: {} };
 expect(p1Available(promoted)).toBe(true);
 for (const file of P1_MIGRATIONS) {
  expect(p1Available({ ...promoted, deferredMigrations: { [file]: {} } })).toBe(false);
  expect(p1Available({ ...promoted, requiredMigrations: promoted.requiredMigrations.filter(f => f !== file) })).toBe(false);
 }
});
it('renders nothing and makes zero client/RPC calls while deferred, even for an approved owner', async () => {
 fixture.role = 'owner'; fixture.client.mockImplementation(() => { throw Error('must not acquire client'); });
 const host = document.createElement('div'), root = createRoot(host);
 await act(async () => root.render(createElement(P1Session, { role: 'owner' })));
 expect(host.innerHTML).toBe(''); expect(fixture.client).not.toHaveBeenCalled(); expect(fixture.calls).not.toHaveBeenCalled();
 await act(async () => root.unmount());
});
it('renders and binds the required-manifest state, clearing it synchronously when approval is lost', async () => {
 fixture.available = p1Available({ requiredMigrations: [...manifest.requiredMigrations, ...P1_MIGRATIONS], deferredMigrations: {} });
 fixture.client.mockResolvedValue({ schema: () => ({ rpc: fixture.calls }) });
 fixture.calls.mockImplementation((name: string) => ({ abortSignal: async () => ({ data: name === 'sharing_consent_v1' ? { version: sharingPolicy.version, textDigest: sharingPolicy.digest, accepted: false } : { version: 1, rows: [], next: null, serverNow: new Date().toISOString(), visibleUntil: null }, error: null }) }));
 const host = document.createElement('div'), root = createRoot(host);
 await act(async () => { root.render(createElement(P1Session, { role: 'student' })); await new Promise(r => setTimeout(r, 30)); });
 await act(async () => { await new Promise(r => setTimeout(r, 30)); });
 expect(host.textContent).toContain(en.supervisor.consentText);
 expect(host.querySelector<HTMLInputElement>('input[type=checkbox]')?.checked).toBe(false);
 expect(fixture.calls.mock.calls.map(c => c[0])).toEqual(['sharing_consent_v1', 'scope_page_v1']);
 fixture.status = 'suspended';
 await act(async () => root.render(createElement(P1Session, { role: 'student' })));
 expect(host.innerHTML).toBe('');
 await act(async () => root.unmount());
});
it('maps positional review operations to named authenticated assess RPC arguments without actor substitution', async () => {
 const abortSignal = vi.fn().mockResolvedValue({ data: null, error: null });
 fixture.calls.mockReturnValue({ abortSignal }); const schema = vi.fn().mockReturnValue({ rpc: fixture.calls });
 fixture.client.mockResolvedValue({ schema });
 const self = { id: fixture.userId, role: 'owner' as const, name: 'Synthetic' }, adapter = await bindP1(self), s = signal();
 await adapter.execute(self.id, { kind: 'appoint', personId: '00000000-0000-0000-0000-000000000002' }, s);
 expect(schema).toHaveBeenCalledWith('assess');
 expect(fixture.calls).toHaveBeenCalledExactlyOnceWith('appointment_v1', { p_user: '00000000-0000-0000-0000-000000000002', p_appoint: true });
 expect(abortSignal).toHaveBeenCalledWith(s);
 await expect(adapter.execute('other', { kind: 'appoint', personId: self.id }, s)).rejects.toMatchObject({ reason: 'denied' });
 expect(fixture.calls).toHaveBeenCalledTimes(1);
});
it('keeps both owner-approved sharing texts byte-identical in the messages and versioned source', () => {
 expect(en.supervisor.consentText).toBe(sharingPolicy.en); expect(ar.supervisor.consentText).toBe(sharingPolicy.ar);
});
it('keeps a selected group on its server page instead of falling back to the first twenty groups', async () => {
 const { P1View } = await import('./P1Session');
 const read = vi.fn(async (query: import('../supervisor-review/contracts').Query) => {
  const second = query.groupsCursor === 'page-two';
  const group = { id: second ? 'two' : 'one', name: second ? 'Second page group' : 'First page group', supervisorId: fixture.userId, startsAt: Date.now(), supervisedFrom: Date.now(), endsAt: Date.now() + 60000, revision: 1 };
  if (query.groupId && query.groupId !== group.id) throw Error('wrong groups page');
  return { now: Date.now(), appointed: true, isMember: null, people: { rows: [], next: null }, groups: { rows: [group], next: second ? null : 'page-two' }, ...(query.groupId ? { group } : {}), requests: { rows: [], next: null }, members: { rows: [], next: null }, results: { rows: [], next: null }, visibilityUntil: Infinity };
 });
 const adapter = { accounts: [{ id: fixture.userId, role: 'supervisor' as const, name: 'Synthetic' }], read, execute: vi.fn() };
 const host = document.createElement('div'), root = createRoot(host);
 await act(async () => root.render(createElement(P1View, { adapter, actorId: fixture.userId, locale: 'en' })));
 const next = [...host.querySelectorAll('button')].find(b => b.textContent === en.supervisor.next)!;
 await act(async () => next.click());
 const group = [...host.querySelectorAll('button')].find(b => b.textContent === 'Second page group')!;
 await act(async () => group.click());
 expect(read.mock.calls.at(-1)![0]).toMatchObject({ groupId: 'two', groupsCursor: 'page-two' });
 expect(host.textContent).toContain(en.supervisor.results);
 await act(async () => root.unmount());
});

// RAD085-OWNER-APPOINT-PICKER-20261028: exact bounded appointment read uses current authenticated transport.
it('wires picker appointment status through the existing P1 scope RPC with limit one', async () => {
 const abortSignal = vi.fn().mockResolvedValue({ data: { version: 1, rows: [], next: null }, error: null });
 fixture.calls.mockReturnValue({ abortSignal });
 fixture.client.mockResolvedValue({ schema: () => ({ rpc: fixture.calls }) });
 const adapter = await bindP1({ id: fixture.userId, role: 'owner', name: 'Synthetic owner' }), s = signal();
 expect(await adapter.readAppointment!('00000000-0000-0000-0000-000000000026', s)).toBe(false);
 expect(fixture.calls).toHaveBeenCalledExactlyOnceWith('scope_page_v1', { p_kind: 'appointments', p_group: null, p_after: '00000000-0000-0000-0000-000000000025', p_limit: 1 });
 expect(abortSignal).toHaveBeenCalledWith(s);
});

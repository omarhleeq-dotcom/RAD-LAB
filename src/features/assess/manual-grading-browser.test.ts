// @vitest-environment jsdom
import { act, createElement, type ReactNode } from 'react';
import { createRoot } from 'react-dom/client';
import { NextIntlClientProvider } from 'next-intl';
import { expect, it, vi } from 'vitest';
import messages from '../../../messages/en.json';
import { ManualGradingEntry } from './ManualGradingEntry';
const auth = vi.hoisted(() => ({ state: { kind: 'signedIn', userId: 'actor', profile: { status: 'approved', role: 'participant' } }, supervisor: false, invalidate: () => {} }));
vi.mock('../pilot/SessionGate', () => ({ useSessionAccount: () => ({ state: auth.state }) }));
vi.mock('../supervisor/P1Session', () => ({ useSupervisorAppointment: () => auth.supervisor }));
vi.mock('./manual-grading-data', () => ({ connectManualGrading: vi.fn(async (_actor, invalidate) => {
 auth.invalidate = invalidate;
 return { port: { queue: async () => ({ rows: [], next: null }) }, close: vi.fn() };
}) }));
Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
function localized(children: ReactNode) { const props = { locale: 'en', messages: messages, children }; return createElement(NextIntlClientProvider, props); }
it('entry is restricted to existing approved supervisor/owner and clears its mounted screen on auth invalidation', async () => {
 const host = document.createElement('div'); document.body.append(host); const root = createRoot(host);
 const render = () => act(async () => root.render(localized( createElement(ManualGradingEntry))));
 try {
  await render(); expect(host.textContent).toBe('');
  auth.supervisor = true; await render(); expect(host.textContent).toContain(messages.manualGrading.title);
  await act(async () => auth.invalidate()); expect(host.querySelector('[data-testid="manual-grading"]')).toBeNull();
  auth.supervisor = false; auth.state.profile.role = 'owner'; auth.state.userId = 'owner'; await render(); expect(host.textContent).toContain(messages.manualGrading.title);
  auth.state.profile.status = 'suspended'; await render(); expect(host.textContent).toBe('');
 } finally { await act(async () => root.unmount()); host.remove(); }
});

// @vitest-environment jsdom
import { act, createElement as h, useState } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { NextIntlClientProvider } from 'next-intl';
import { beforeEach, afterEach, expect, it, vi } from 'vitest';
import en from '../../../messages/en.json';
import { P1SupervisorScope, useSupervisorAppointment } from '../supervisor/P1Session';
import { QuestionImport } from './QuestionImport';
import { newDraft } from '../authoring-review/draft';
const mock = vi.hoisted(() => ({ appointed: true, fail: '', read: vi.fn(), resolve: undefined as undefined | (() => void), delay: false }));
vi.mock('../supervisor/p1-availability', () => ({ P1_AVAILABLE: true }));
vi.mock('../pilot/config', () => ({ PILOT: true }));
vi.mock('../pilot/consent', () => ({ needsConsent: () => false }));
vi.mock('../pilot/SessionGate', () => ({ useOptionalSessionAccount: () => ({ state: { kind: 'signedIn', userId: 'supervisor', profile: { status: 'approved', role: 'participant' } } }) }));
vi.mock('../supervisor/p1-live', () => ({ bindP1: async () => ({ read: mock.read }) }));
Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
let host: HTMLDivElement, root: Root;
function Editor() {
 const [draft, setDraft] = useState(newDraft()), [batch, setBatch] = useState({ reference: 'Synthetic source', licenceNotes: 'Own work' });
 return h('div', null, h('input', { 'aria-label': 'Unsaved draft', value: draft.name, onChange: (e: React.ChangeEvent<HTMLInputElement>) => setDraft({ ...draft, name: e.target.value }) }), h(QuestionImport, { draft, change: setDraft, actorId: 'supervisor', batch, setBatch, onPending: () => {} }));
}
function Gate() { return useSupervisorAppointment() ? h(Editor) : h('p', null, 'Hidden'); }
async function visibility(value: 'hidden' | 'visible') { await act(async () => { Object.defineProperty(document, 'visibilityState', { configurable: true, value }); document.dispatchEvent(new Event('visibilitychange')); }); }
async function fill(element: HTMLInputElement | HTMLTextAreaElement, value: string) { await act(async () => { Object.getOwnPropertyDescriptor(element instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype, 'value')!.set!.call(element, value); element.dispatchEvent(new Event('input', { bubbles: true })); }); }
beforeEach(async () => {
 mock.appointed = true; mock.fail = ''; mock.delay = false;
 mock.read.mockReset().mockImplementation(async () => { if (mock.delay) await new Promise<void>(resolve => { mock.resolve = resolve; }); if (mock.fail) throw { reason: mock.fail }; return { appointed: mock.appointed }; });
 host = document.createElement('div'); document.body.append(host); root = createRoot(host);
 await act(async () => root.render(h(NextIntlClientProvider, { locale: 'en', messages: en, children: h(P1SupervisorScope, { children: h(Gate) }) })));
});
afterEach(async () => { await act(async () => root.unmount()); host.remove(); vi.restoreAllMocks(); });
it('imports a file selected after hidden → visible, including while revalidation is pending', async () => {
 const input = host.querySelector('input[type=file]') as HTMLInputElement;
 await visibility('hidden'); mock.delay = true; await visibility('visible');
 expect(host.querySelector('input[type=file]')).toBe(input);
 await act(async () => { Object.defineProperty(input, 'files', { configurable: true, value: [{ name: 'phone.csv', size: 70, arrayBuffer: async () => new TextEncoder().encode('Question,A,B,Answer\nPhone file?,Yes,No,A').buffer }] }); input.dispatchEvent(new Event('change', { bubbles: true })); });
 expect(host.textContent).toContain('Phone file?'); await act(async () => mock.resolve!());
 expect(host.textContent).toContain('Phone file?');
});
it('retains an unsaved draft and pending preview through hidden → visible and a transient offline answer', async () => {
 await fill(host.querySelector('input[aria-label="Unsaved draft"]')!, 'Unsaved phone draft');
 await fill(host.querySelector('textarea.font-mono')!, 'Question\tA\tB\tAnswer\nPending phone row?\tYes\tNo\tA');
 await act(async () => [...host.querySelectorAll('button')].find(b => b.textContent === en.assessImport.previewPaste)!.click());
 await visibility('hidden'); mock.fail = 'offline'; await visibility('visible');
 expect((host.querySelector('input[aria-label="Unsaved draft"]') as HTMLInputElement).value).toBe('Unsaved phone draft');
 expect(host.textContent).toContain('Pending phone row?');
});
it('hides authoring on confirmed revocation on return', async () => {
 await visibility('hidden'); mock.appointed = false; await visibility('visible');
 expect(host.querySelector('input[type=file]')).toBeNull(); expect(host.textContent).toBe('Hidden');
});
it('hides authoring on confirmed expiry on return', async () => {
 await visibility('hidden'); mock.fail = 'expired'; await visibility('visible');
 expect(host.querySelector('input[type=file]')).toBeNull();
});

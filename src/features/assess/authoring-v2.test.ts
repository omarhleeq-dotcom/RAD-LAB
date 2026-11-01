// @vitest-environment jsdom
import { act, createElement, useState } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { NextIntlClientProvider } from 'next-intl';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import en from '../../../messages/en.json';
import { QuestionImport } from './QuestionImport';
import { clearAuthoringBatchMemory, readImportNotes, writeImportNotes } from './import-preferences';
import { createSqlAuthoringV2 } from '../authoring-review/sql-adapter';
import { newDraft } from '../authoring-review/draft';
import { draftToV2, rowToQuestion } from './import-validator';
import { useAccount } from '../pilot/useAccount';
const mocked = vi.hoisted(() => ({ event: undefined as undefined | ((event: string, session: null) => void), signOut: vi.fn(async () => ({ error: null as unknown })) }));
vi.mock('../pilot/client', () => ({ getPilotClient: () => Promise.resolve({ auth: { getSession: async () => ({ data: { session: null } }), onAuthStateChange: (callback: typeof mocked.event) => { mocked.event = callback; return { data: { subscription: { unsubscribe: vi.fn() } } }; }, signOut: mocked.signOut } }) }));
Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
// React.createElement supplies children in its third argument.
const IntlProvider = NextIntlClientProvider as React.ComponentType<React.PropsWithChildren<Omit<React.ComponentProps<typeof NextIntlClientProvider>, 'children'>>>;
const batch = { reference: 'Private synthetic source', licenceNotes: 'Own engineering material' };
const row = { Question: 'Synthetic question?', A: 'True', B: 'False', Answer: 'A' };
const id = (n: number) => `00000000-0000-4000-8000-${String(n).padStart(12, '0')}`;
let host: HTMLDivElement, root: Root;
beforeEach(() => { host = document.createElement('div'); document.body.append(host); root = createRoot(host); localStorage.clear(); mocked.signOut.mockReset().mockResolvedValue({ error: null }); });
afterEach(async () => { await act(async () => root.unmount()); host.remove(); vi.restoreAllMocks(); });
async function render(node: React.ReactNode) { await act(async () => root.render(node)); }
async function fill(element: HTMLInputElement | HTMLTextAreaElement, value: string) {
 await act(async () => { Object.getOwnPropertyDescriptor(element instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype, 'value')!.set!.call(element, value); element.dispatchEvent(new Event('input', { bubbles: true })); });
}
it('persists only this owner’s notes, clears a previous owner on read, rejects forged envelopes and clears without a session', () => {
 writeImportNotes('owner-a', batch); expect(readImportNotes('owner-a')).toEqual(batch);
 expect(JSON.parse(localStorage.getItem('radlab:assess-import:v1:owner-a')!)).toMatchObject({ userId: 'owner-a' });
 expect(readImportNotes('owner-b')).toEqual({ reference: '', licenceNotes: '' }); expect(localStorage.length).toBe(0);
 localStorage.setItem('radlab:assess-import:v1:owner-b', JSON.stringify({ userId: 'owner-a', ...batch })); expect(readImportNotes('owner-b').reference).toBe(''); expect(localStorage.length).toBe(0);
 writeImportNotes('owner-a', batch); expect(readImportNotes(null).reference).toBe(''); expect(localStorage.length).toBe(0);
 localStorage.setItem('unrelated', 'keep'); clearAuthoringBatchMemory(); expect(localStorage.getItem('unrelated')).toBe('keep');
});
it('isolates storage failures for reads, writes and clears', () => {
 for (const method of ['getItem', 'setItem', 'removeItem', 'key'] as const) {
  const spy = vi.spyOn(Storage.prototype, method).mockImplementation(() => { throw Error('Storage denied'); });
  expect(() => writeImportNotes('a', batch)).not.toThrow(); expect(() => clearAuthoringBatchMemory()).not.toThrow(); expect(() => readImportNotes('a')).not.toThrow(); spy.mockRestore();
 }
});
it('clears at successful sign-out and at SIGNED_OUT from another tab or session expiry, despite throwing storage', async () => {
 let account: ReturnType<typeof useAccount> | undefined;
 function Hook() { account = useAccount('https://example.invalid/en/account'); return null; }
 await render(createElement(Hook));
 writeImportNotes('owner-a', batch); await act(async () => account!.signOut()); expect(localStorage.length).toBe(0);
 writeImportNotes('owner-a', batch); await act(async () => mocked.event!('SIGNED_OUT', null)); expect(localStorage.length).toBe(0);
 writeImportNotes('owner-a', batch); const denied = vi.spyOn(Storage.prototype, 'key').mockImplementation(() => { throw Error('Storage denied'); });
 await expect(act(async () => account!.signOut())).resolves.not.toThrow(); await expect(act(async () => mocked.event!('SIGNED_OUT', null))).resolves.not.toThrow(); denied.mockRestore();
 writeImportNotes('owner-a', batch); mocked.signOut.mockResolvedValueOnce({ error: { message: 'failed' } }); await act(async () => account!.signOut()); expect(readImportNotes('owner-a')).toEqual(batch);
});
it('validates the entire batch before one v2 save and keeps attribution out of the wire; stale ACKs and scope loss fail closed', async () => {
 const writes: unknown[][] = []; let denied = false, stale = false;
 const transport = { async rpc(operation: string, args: unknown[]) {
  if (denied) throw { code: '42501' };
  if (operation === 'scope_page_v1') return { serverNow: new Date().toISOString(), next: null, rows: [{ id: id(2), name: 'SYNTHETIC group', supervisor_id: id(1), starts_at: new Date().toISOString(), supervised_from: new Date().toISOString(), ends_at: new Date(Date.now() + 3600000).toISOString(), revision: 1 }] };
  if (operation === 'draft_save_v2') { writes.push(args); const document = JSON.parse(args[3] as string); document.revision += stale ? 2 : 1; return { id: document.id, revision: document.revision, document, refs: [] }; }
  throw Error('Unexpected RPC ' + operation);
 } };
 const adapter = createSqlAuthoringV2({ id: id(1), role: 'supervisor', name: 'Client Name Ignored' }, transport), scope = { actorId: id(1), groupId: id(2) }, signal = new AbortController().signal;
 await adapter.groups(id(1), undefined, signal);
 const draft = { ...newDraft(), name: 'SYNTHETIC draft', items: [rowToQuestion(row, batch), rowToQuestion(row, batch)], randomPool: { version: 1 as const, size: 2 } };
 const bad = structuredClone(draft); bad.items[1]!.correctOptionId = '';
 await expect(adapter.save(scope, bad, signal)).rejects.toThrow(); expect(writes).toHaveLength(0);
 const saved = await adapter.save(scope, draft, signal); expect(saved.revision).toBe(1); expect(writes).toHaveLength(1); expect(JSON.parse(writes[0]![3] as string)).toEqual(draftToV2(draft)); expect(JSON.stringify(writes)).not.toMatch(/authorDisplayName|Client Name Ignored/);
 stale = true; await expect(adapter.save(scope, saved, signal)).rejects.toMatchObject({ reason: 'invalid' }); expect(writes).toHaveLength(2); // An uncertain ACK is never replayed.
 let invalidated = false; const off = adapter.subscribe!(() => { invalidated = true; }); denied = true;
 await expect(adapter.save(scope, saved, signal)).rejects.toMatchObject({ reason: 'denied' }); expect(invalidated).toBe(true); off();
});
it('shows every source row and error, blocks partial append, and permits an explicit exclusion', async () => {
 let accepted = 0;
 function Harness() {
  const [draft, setDraft] = useState({ ...newDraft(), name: 'SYNTHETIC import', randomPool: { version: 1 as const, size: 1 } }), [notes, setNotes] = useState(batch);
  return createElement(IntlProvider, { locale: 'en', messages: en }, createElement(QuestionImport, { draft, actorId: 'a', batch: notes, setBatch: setNotes, onPending: () => {}, change: d => { accepted++; setDraft({ ...d, randomPool: d.randomPool! }); } }));
 }
 await render(createElement(Harness));
 const paste = host.querySelector('textarea.font-mono') as HTMLTextAreaElement;
 await fill(paste, 'Question\tA\tB\tAnswer\nGood?\tYes\tNo\tA\nBad?\tYes\tNo\tC');
 const button = (label: string) => [...host.querySelectorAll('button')].find(b => b.textContent === label)!;
 await act(async () => button(en.assessImport.previewPaste).click());
 expect(host.querySelectorAll('fieldset')).toHaveLength(2); expect(host.textContent).toContain('Answer must be'); expect(button(en.assessImport.addValidated).disabled).toBe(true); expect(accepted).toBe(0);
 await act(async () => (host.querySelectorAll('input[type=checkbox]')[1] as HTMLInputElement).click());
 expect(button(en.assessImport.addValidated).disabled).toBe(false); await act(async () => button(en.assessImport.addValidated).click()); expect(accepted).toBe(1); expect(host.querySelectorAll('fieldset')).toHaveLength(0);
});

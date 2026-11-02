// @vitest-environment jsdom
import { act, createElement } from 'react';
import { createRoot } from 'react-dom/client';
import { NextIntlClientProvider } from 'next-intl';
import { expect, it, vi } from 'vitest';
import en from '../../../messages/en.json';
import ar from '../../../messages/ar.json';
import { ManualGradingPanel } from './ManualGradingPanel';
import { ManualGradingController } from './manual-grading';
import { createManualGradingPort, type ManualTransport } from './manual-grading-data';
import type { ManualFinalReceipt, ManualRead } from './server-manual-contracts';
Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
const attempt = '11111111-1111-1111-1111-111111111111';
const receipt: ManualFinalReceipt = { session_id: attempt, final_operation_id: attempt, expected_grading_revision: 1, final_grading_revision: 2, finalized_at: new Date().toISOString(), final_grader_id: attempt, operation_count: 1, grader_count: 1, outcome: 'finalized', policy_version: 1 };
function fixture({ code = '55000', operation = 'score', final = false, receiptFails = false, receiptCode, queueFails = false }: { code?: string; operation?: 'score' | 'finalize'; final?: boolean; receiptFails?: boolean; receiptCode?: string; queueFails?: boolean } = {}) {
 let rejected = false;
 const writes: { name: string; args: Record<string, unknown> }[] = [];
 const read: ManualRead = { attemptId: attempt, gradingRevision: 1, operationCount: 1, finalizeBefore: new Date(Date.now() + 3600000).toISOString(), items: [{ item: { id: 'w', version: '1' }, prompt: 'Question', answer: '  Verbatim answer\n  ', maximum: '3', score: '1' }] };
 const transport: ManualTransport = { async call<T>(name: string, args: Record<string, unknown>) {
  if (name === 'manual_queue_v1') {
   if (rejected && queueFails) throw Error('queue response lost');
   return { rows: rejected ? [] : [{ id: attempt, assignment_id: attempt, submitted_at: '', finalize_before: read.finalizeBefore, grading_revision: 1 }], next: null } as T;
  }
  if (name === 'manual_read_v1') return read as T;
  if (name === 'manual_receipt_v1') {
   if (rejected && receiptFails) { if (receiptCode) throw { code: receiptCode }; if (code === '55000') throw { code }; throw Error('receipt response lost'); }
   return (rejected && final ? receipt : null) as T;
  }
  if (name === `manual_${operation}_v1`) {
   writes.push({ name, args: structuredClone(args) }); rejected = true;
   if (code) throw { code, message: 'private server details' };
   throw Error('transport response lost');
  }
  throw Error('unexpected test RPC');
 } };
 return { port: createManualGradingPort(transport), writes, read };
}
const click = async (host: HTMLElement, text: string) => act(async () => {
 const button = [...host.querySelectorAll('button')].find(b => b.textContent === text);
 expect(button, text).toBeTruthy(); expect(button!.disabled).toBe(false); button!.click();
});
it.each(['en', 'ar'] as const)('%s: a definite score 55000 returns to the queue, clears pending, exposes Back and never offers same-operation retry', async locale => {
 const f = fixture({ receiptFails: true }), messages = locale === 'en' ? en : ar, copy = messages.manualGrading;
 const host = document.createElement('div'); document.body.append(host); const root = createRoot(host);
 const props = { locale, messages, children: createElement(ManualGradingPanel, { port: f.port }) };
 try {
  await act(async () => root.render(createElement(NextIntlClientProvider, props)));
  await act(async () => host.querySelector<HTMLButtonElement>('li button')!.click());
  await act(async () => {
   const input = host.querySelector('input')!; Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!.call(input, '2'); input.dispatchEvent(new Event('input', { bubbles: true }));
  });
  await click(host, copy.save);
  expect(host.textContent).toContain(copy.errors.closed); expect(host.textContent).toContain(copy.empty);
  expect(host.textContent).not.toContain(copy.retrySame); expect(host.textContent).not.toContain(copy.uncertain);
  expect(host.querySelector('input')).toBeNull(); expect(host.querySelector('[data-testid="written-answer"]')).toBeNull();
  await click(host, copy.back); expect(f.writes).toHaveLength(1); expect(host.textContent).toContain(copy.empty);
 } finally { await act(async () => root.unmount()); host.remove(); }
});
it.each(['en', 'ar'] as const)('%s: finalize 55000 with an existing receipt shows final and clears pending', async locale => {
 const f = fixture({ operation: 'finalize', final: true }), messages = locale === 'en' ? en : ar, copy = messages.manualGrading;
 const host = document.createElement('div'); document.body.append(host); const root = createRoot(host);
 const props = { locale, messages, children: createElement(ManualGradingPanel, { port: f.port }) };
 try {
  await act(async () => root.render(createElement(NextIntlClientProvider, props)));
  await act(async () => host.querySelector<HTMLButtonElement>('li button')!.click());
  await click(host, copy.finalize); await click(host, copy.confirmFinalize);
  expect(host.textContent).toContain(copy.final); expect(host.textContent).toContain(copy.receipt);
  expect(host.textContent).not.toContain(copy.retrySame); expect(host.textContent).not.toContain(copy.errors.closed);
  expect(host.querySelector('input')).toBeNull(); expect(f.writes).toHaveLength(1);
  expect([...host.querySelectorAll('button')].some(b => b.textContent === copy.back && !b.disabled)).toBe(true);
 } finally { await act(async () => root.unmount()); host.remove(); }
});
it.each(['55000', 'XX000', 'P0001', 'PGRST500'])('coded rejection %s clears pending even if the follow-up receipt read fails', async code => {
 const f = fixture({ code, receiptFails: true }), c = new ManualGradingController(f.port, false, () => {});
 await c.open(attempt); c.edit(0, '2'); await c.save();
 expect(c.state.pending).toBeNull(); expect(c.state.busy).toBe(false);
 await c.retry(); expect(f.writes).toHaveLength(1);
});
it('closed returns to an escapable queue even when both follow-up reads fail', async () => {
 const f = fixture({ receiptFails: true, queueFails: true }), c = new ManualGradingController(f.port, false, () => {});
 await c.open(attempt); c.edit(0, '2'); await c.save();
 expect(c.state).toMatchObject({ pending: null, attempt: null, read: null, drafts: [], issue: 'closed', busy: false, suspended: false });
});
it('closed score with a receipt shows final, rather than guessing from the SQLSTATE', async () => {
 const f = fixture({ final: true }), c = new ManualGradingController(f.port, false, () => {});
 await c.open(attempt); c.edit(0, '2'); await c.save();
 expect(c.state.pending).toBeNull(); expect(c.state.receipt).toEqual(receipt); expect(c.state.issue).toBeNull();
});
it('transport failure without a code retains the same operation and payload for replay', async () => {
 const f = fixture({ code: '' }), c = new ManualGradingController(f.port, false, () => {});
 await c.open(attempt); c.edit(0, '2'); await c.save();
 expect(c.state.pending?.kind).toBe('score'); expect(c.state.issue).toBe('unavailable');
 await c.retry(); expect(f.writes).toHaveLength(2); expect(f.writes[0]).toEqual(f.writes[1]);
});
it('an unrelated coded receipt lookup failure cannot settle a transport-uncertain write', async () => {
 const f = fixture({ code: '', receiptFails: true, receiptCode: 'XX000' }), c = new ManualGradingController(f.port, false, () => {});
 await c.open(attempt); c.edit(0, '2'); await c.save(); expect(c.state.pending?.kind).toBe('score');
 await c.retry(); expect(f.writes[0]).toEqual(f.writes[1]); expect(c.state.pending?.kind).toBe('score');
});
it('a definite response arriving after suspend still clears the rejected operation', async () => {
 const f = fixture(); let reject!: (error: unknown) => void;
 const port = { ...f.port, score: () => new Promise<never>((_, no) => { reject = no; }) };
 const c = new ManualGradingController(port, false, () => {});
 await c.open(attempt); c.edit(0, '2'); const saving = c.save(); c.suspend();
 const error = await f.port.score({ schemaVersion: 1, attemptId: attempt, operationId: attempt, expectedGradingRevision: 1, scores: [], reason: 'correction' }).catch(error => error);
 reject(error); await saving; expect(c.state.pending).toBeNull(); expect(c.state.suspended).toBe(true);
});
it.each([null, undefined])('an absent transport code (%s) remains uncertain', async code => {
 const port = createManualGradingPort({ call: vi.fn().mockRejectedValue({ code }) });
 await expect(port.read(attempt)).rejects.toMatchObject({ kind: 'unavailable', uncertain: true });
});

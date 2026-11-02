// @vitest-environment jsdom
import { act, createElement, type ReactNode } from 'react';
import { createRoot } from 'react-dom/client';
import { NextIntlClientProvider } from 'next-intl';
import { describe, expect, it } from 'vitest';
import en from '../../../messages/en.json';
import { fixture, id, modes, literal, type Db } from './rad062-m09-fixture';
import { createManualGradingPort } from './manual-grading-data';
import { ManualGradingController } from './manual-grading';
import { ManualGradingPanel } from './ManualGradingPanel';
Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
function localized(children: ReactNode) { const props = { locale: 'en', messages: en, children }; return createElement(NextIntlClientProvider, props); }
function binding(db: Db, actor: number, drop = false) {
 const operations: string[] = [];
 return { operations, port: createManualGradingPort({ async call<T>(name: string, args: Record<string, unknown>) {
  const values = Object.values(args).map(v => Array.isArray(v) ? JSON.stringify(v) : v);
  if (name === 'manual_score_v1') operations.push(String(args.p_operation));
  const result = await db.rpc<T>(actor, name, values);
  if (drop && name === 'manual_score_v1') { drop = false; throw Error('synthetic dropped response after COMMIT'); }
  return result;
 } }) };
}
describe.each(modes)('grading screen against real M09 %s', mode => {
 it('renders list, verbatim answer, exact scoring/editing, explicit finalization and safe receipt', async () => {
  const { db, s } = await fixture(mode); const host = document.createElement('div'); document.body.append(host); const root = createRoot(host);
  const { port } = binding(db, 2);
  const idle = async () => { for (let n = 0; n < 500 && host.textContent?.includes(en.manualGrading.busy); n++) await act(async () => { await new Promise(r => setTimeout(r, 10)); }); expect(host.textContent).not.toContain(en.manualGrading.busy); };
  const click = async (text: string) => { await act(async () => { const b = [...host.querySelectorAll('button')].find(b => b.textContent === text)!; expect(b, text).toBeTruthy(); expect(b.disabled).toBe(false); b.click(); }); await idle(); };
  const enter = async (value: string) => act(async () => { const input = host.querySelector('input')!; Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!.call(input, value); input.dispatchEvent(new Event('input', { bubbles: true })); });
  try {
   await act(async () => root.render(localized( createElement(ManualGradingPanel, { port }))));
   await idle();
   await act(async () => host.querySelector<HTMLButtonElement>('li button')!.click()); await idle();
   expect(host.querySelector('[data-testid="written-answer"]')?.textContent).toBe(literal);
   const main = host.cloneNode(true) as HTMLElement; main.querySelectorAll('details').forEach(e => e.remove());
   for (const identity of ['SYNTHETIC Account Name','synthetic3@example.invalid',id(3),s]) expect(main.textContent).not.toContain(identity);
   await enter('1.000001'); await click(en.manualGrading.save); await enter('3.000001'); await click(en.manualGrading.save);
   await click(en.manualGrading.finalize); await click(en.manualGrading.confirmFinalize);
   expect(host.textContent).toContain(en.manualGrading.final); expect(host.querySelector('input')).toBeNull();
   await expect(port.score({ schemaVersion: 1, attemptId: s, operationId: id(900), expectedGradingRevision: 2, scores: [{ item: { id: 'w0', version: '1' }, score: '0' }], reason: 'correction' })).rejects.toMatchObject({ kind: 'closed', uncertain: false });
   expect(await port.receipt(s)).toMatchObject({ operation_count: 2, outcome: 'finalized' });
  } finally { await act(async () => root.unmount()); host.remove(); await db.close(); }
 }, 120000);
 it('dropped COMMIT ACK replays the same operation; server cap still permits finalization', async () => {
  const { db, s } = await fixture(mode);
  try {
   const { port, operations } = binding(db, 2, true), c = new ManualGradingController(port, false, () => {});
   await c.open(s); c.edit(0, '1.000001'); await c.save(); expect(c.state.pending?.kind).toBe('score');
   await c.retry(); expect(operations[0]).toBe(operations[1]); expect(c.state.read?.operationCount).toBe(1);
   for (let n = 1; n < 100; n++) { c.edit(0, n % 2 ? '0' : '1'); await c.save(); }
   expect(c.state.read?.operationCount).toBe(100);
   await expect(port.score({ schemaVersion: 1, attemptId: s, operationId: id(901), expectedGradingRevision: 100, scores: [{ item: { id: 'w0', version: '1' }, score: '0' }], reason: 'correction' })).rejects.toMatchObject({ kind: 'limit' });
   await c.finalize(); expect(c.state.receipt).toMatchObject({ operation_count: 100, outcome: 'finalized' });
  } finally { await db.close(); }
 }, 120000);
 it('other supervisor and student denied; owner explicit rescue only after supervisor loses scope', async () => {
  const { db, s } = await fixture(mode);
  try {
   await db.admin.query("insert into auth.users values($1,'other@example.invalid',now(),$2)",[id(4),{display_name:'Other Synthetic Supervisor'}]);
   await db.admin.query("update public.profiles set status='approved' where user_id=$1",[id(4)]); await db.rpc(1,'appointment_v1',[id(4),true]);
   for (const actor of [3,4]) {
    const c = new ManualGradingController(binding(db,actor).port,false,()=>{}); await c.open(s); expect(c.state.issue).toBe('denied'); expect(c.state.read).toBeNull();
   }
   const c = new ManualGradingController(binding(db,1).port,true,()=>{}); await c.open(s); expect(c.state.issue).toBe('denied');
   await db.rpc(1,'appointment_v1',[id(2),false]); await c.open(s); expect(c.state.read?.attemptId).toBe(s);
   c.edit(0,'2'); await c.save(); expect(c.state.read?.operationCount).toBe(0);
   c.confirmTakeover(true); await c.save(); expect(c.state.read?.operationCount).toBe(1); await c.finalize(); expect(c.state.receipt?.outcome).toBe('finalized');
  } finally { await db.close(); }
 }, 120000);
});

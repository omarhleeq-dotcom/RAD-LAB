// @vitest-environment jsdom
import { act, createElement, type ReactNode } from 'react';
import { createRoot } from 'react-dom/client';
import { NextIntlClientProvider } from 'next-intl';
import { expect, it, vi } from 'vitest';
import en from '../../../messages/en.json';
import ar from '../../../messages/ar.json';
import { ManualGradingPanel } from './ManualGradingPanel';
import { GradingError, type ManualGradingPort } from './manual-grading-data';
import type { ManualFinalReceipt, ManualRead } from './server-manual-contracts';
Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
function localized(locale: 'en' | 'ar', messages: typeof en, children: ReactNode) { const props = { locale, messages, children }; return createElement(NextIntlClientProvider, props); }
const attempt = '11111111-1111-1111-1111-111111111111', assignment = '22222222-2222-2222-2222-222222222222';
const literal = '  العربية e\u0301 😀 <b>NO HTML</b>\n\t  LTR  ';
function fixture() {
 const read: ManualRead = { attemptId: attempt, gradingRevision: 0, operationCount: 0, finalizeBefore: new Date(Date.now() + 3600000).toISOString(), items: [{ item: { id: 'secret-item-ref', version: '1' }, prompt: literal, answer: literal, maximum: '3.000001', score: null }] };
 let receipt: ManualFinalReceipt | null = null, denied = false;
 const port: ManualGradingPort = {
  async queue() { return { rows: [{ id: attempt, assignment_id: assignment, submitted_at: '', finalize_before: read.finalizeBefore, grading_revision: 0 }], next: null }; },
  async read() { if (denied) throw new GradingError('denied'); return structuredClone(read); },
  async receipt() { if (denied) throw new GradingError('denied'); return receipt; },
  async score(c) { read.items[0]!.score = c.scores[0]!.score; read.gradingRevision++; read.operationCount++; return { operationId: c.operationId, gradingRevision: read.gradingRevision }; },
  async finalize(_, op, revision) { return receipt = { session_id: attempt, final_operation_id: op, expected_grading_revision: revision, final_grading_revision: revision + 1, finalized_at: new Date().toISOString(), final_grader_id: '33333333-3333-3333-3333-333333333333', operation_count: read.operationCount, grader_count: 1, outcome: 'finalized', policy_version: 1 }; },
 };
 return { port, deny: () => { denied = true; } };
}
it.each(['en', 'ar'] as const)('%s: rendered blind queue → literal read → score/edit → separate confirm → receipt', async locale => {
 const messages = locale === 'ar' ? ar : en, copy = messages.manualGrading;
 const f = fixture(), host = document.createElement('div'); document.body.append(host); const root = createRoot(host);
 const click = async (text: string) => act(async () => {
  const b = [...host.querySelectorAll('button')].find(b => b.textContent === text); expect(b, text).toBeTruthy(); expect(b!.disabled).toBe(false); b!.click();
 });
 const input = async (value: string) => act(async () => {
  const e = host.querySelector('input')!; Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!.call(e, value); e.dispatchEvent(new Event('input', { bubbles: true }));
 });
 try {
  await act(async () => root.render(localized(locale, messages, createElement(ManualGradingPanel, { port: f.port }))));
  expect(host.querySelectorAll('li button')).toHaveLength(1);
  expect(host.textContent).not.toContain(attempt);
  await act(async () => host.querySelector<HTMLButtonElement>('li button')!.click());
  expect(host.querySelector('[data-testid="written-answer"]')?.textContent).toBe(literal); expect(host.querySelector('[data-testid="written-answer"] b')).toBeNull();
  const main = host.cloneNode(true) as HTMLElement; main.querySelectorAll('details').forEach(e => e.remove());
  expect(main.textContent).not.toMatch(/[0-9a-f]{8}(-[0-9a-f]{4}){3}-[0-9a-f]{12}|SYNTHETIC Account Name|synthetic3@example.invalid|secret-item-ref/);
  expect(host.querySelector('details')?.open).toBe(false); expect(host.querySelector('[data-testid="manual-grading"]')?.getAttribute('dir')).toBe(locale === 'ar' ? 'rtl' : 'ltr');
  await input('3.000002'); expect(host.querySelector('[aria-invalid="true"]')).toBeTruthy();
  await input('1.000001'); await click(copy.save); await input('0'); await click(copy.save);
  await click(copy.finalize); expect(host.textContent).toContain(copy.confirm); await click(copy.cancel);
  await click(copy.finalize); await click(copy.confirmFinalize);
  expect(host.textContent).toContain(copy.final); expect(host.textContent).toContain(copy.receipt); expect(host.querySelector('input')).toBeNull(); expect(host.textContent).not.toContain(literal); expect(host.textContent).not.toContain('33333333-3333-3333-3333-333333333333');
 } finally { await act(async () => root.unmount()); host.remove(); }
});
it('hides answers while away, reauthorizes on resume, and clears denied data', async () => {
 const f = fixture(), host = document.createElement('div'); document.body.append(host); const root = createRoot(host);
 try {
  await act(async () => root.render(localized('en', en, createElement(ManualGradingPanel, { port: f.port }))));
  await act(async () => host.querySelector<HTMLButtonElement>('li button')!.click()); expect(host.textContent).toContain(literal);
  vi.spyOn(document, 'hidden', 'get').mockReturnValue(true);
  await act(async () => document.dispatchEvent(new Event('visibilitychange'))); expect(host.textContent).not.toContain(literal);
  f.deny(); await act(async () => host.querySelector<HTMLButtonElement>('button')!.click());
  expect(host.textContent).toContain(en.manualGrading.errors.denied); expect(host.textContent).not.toContain(literal);
 } finally { vi.restoreAllMocks(); await act(async () => root.unmount()); host.remove(); }
});

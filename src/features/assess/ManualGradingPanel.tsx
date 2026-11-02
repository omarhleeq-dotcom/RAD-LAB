"use client";
import { useEffect, useRef, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { ManualGradingController, validManualScore } from './manual-grading';
import type { ManualGradingPort } from './manual-grading-data';

const button = 'min-h-11 max-w-full rounded border border-line px-4 py-2 break-words disabled:opacity-60';
const literalStyle = { whiteSpace: 'pre-wrap', overflowWrap: 'anywhere', unicodeBidi: 'plaintext' } as const;
export function ManualGradingPanel({ port, owner = false }: { port: ManualGradingPort; owner?: boolean }) {
 const t = useTranslations('manualGrading'), locale = useLocale();
 const [, redraw] = useState(0);
 const [controller] = useState(() => new ManualGradingController(port, owner, () => redraw(n => n + 1)));
 const [confirm, setConfirm] = useState(false);
 const firstScore = useRef<HTMLInputElement>(null), takeover = useRef<HTMLInputElement>(null);
 const s = controller.state;
 useEffect(() => {
  void controller.queue();
  const hide = () => { if (document.hidden) { controller.suspend(); setConfirm(false); } };
  const pagehide = () => controller.suspend();
  document.addEventListener('visibilitychange', hide); window.addEventListener('pagehide', pagehide);
  return () => { document.removeEventListener('visibilitychange', hide); window.removeEventListener('pagehide', pagehide); controller.clear(); };
 }, [controller]);
 useEffect(() => {
  if (!s.read) return;
  const timeout = setTimeout(() => controller.clear(), Math.max(0, Math.min(2147483647, Date.parse(s.read.finalizeBefore) - Date.now())));
  return () => clearTimeout(timeout);
 }, [controller, s.read]);
 const date = (value: string) => new Date(value).toLocaleString(locale, { timeZone: 'Asia/Amman' });
 const needsTakeover = owner && !s.takeover;
 const fix = () => {
  if (needsTakeover) takeover.current?.focus();
  else (document.querySelector<HTMLInputElement>('[data-testid="manual-grading"] input[aria-invalid="true"]') ?? firstScore.current)?.focus();
 };
 const saveReason = s.pending ? 'uncertain' : s.read && s.read.operationCount >= 100 ? 'cap' : needsTakeover ? 'takeoverRequired' : !controller.valid ? 'invalidScores' : !controller.dirty ? 'saved' : null;
 const finalReason = s.pending ? 'uncertain' : needsTakeover ? 'takeoverRequired' : !controller.valid ? 'invalidScores' : controller.dirty ? 'saveFirst' : null;
 return <section className="mt-6 min-w-0 max-w-full space-y-5" lang={locale} dir={locale === 'ar' ? 'rtl' : 'ltr'} aria-label={t('title')} data-testid="manual-grading">
  <h2 className="text-xl font-semibold">{t('title')}</h2><p>{t('blind')}</p>
  {s.issue && <p role="alert">{t(`errors.${s.issue}`)}</p>}
  {s.busy && <p role="status">{t('busy')}</p>}
  {s.suspended ? <><p>{t('suspended')}</p><button className={button} onClick={() => void controller.refresh()}>{t('resume')}</button></> : <>
   {!s.attempt && <>
    {!s.queue && !s.busy && <button className={button} onClick={() => void controller.queue()}>{t('refresh')}</button>}
    {s.queue?.rows.length === 0 && <p>{t('empty')}</p>}
    <ul className="space-y-3">{s.queue?.rows.map((row, index) => <li key={row.id}>
     <button className={`${button} w-full text-start`} disabled={s.busy} onClick={() => void controller.open(row.id)}>
      <span className="block font-semibold">{t('answerSet', { n: index + 1 })}</span>
      <span className="block">{t('deadline')} <time dateTime={row.finalize_before}>{date(row.finalize_before)}</time></span>
     </button>
    </li>)}</ul>
    {s.queue?.next && <button className={button} disabled={s.busy} onClick={() => void controller.queue(true)}>{t('more')}</button>}
   </>}
   {(s.attempt || s.issue === 'closed') && <>
    {!s.pending && <button className={button} disabled={s.busy} onClick={() => { controller.clear(false); setConfirm(false); void controller.queue(); }}>{t('back')}</button>}
    {s.attempt && !s.read && !s.receipt && !s.busy && <button className={button} onClick={() => void controller.refresh()}>{t('refresh')}</button>}
   </>}
   {s.read && <>
    <p className="font-semibold">{t('deadline')} <time dateTime={s.read.finalizeBefore}>{date(s.read.finalizeBefore)}</time> · {t('timeZone')}</p>
    <p>{t('revision', { n: s.read.gradingRevision })} · {t('operations', { n: s.read.operationCount })}</p>
    <p>{t('expiry')}</p>
    {owner && <label className="flex min-h-11 items-start gap-3"><input ref={takeover} type="checkbox" checked={s.takeover} disabled={s.busy || !!s.pending} onChange={e => controller.confirmTakeover(e.target.checked)}/>{t('takeover')}</label>}
    {s.read.items.map((item, index) => <article key={JSON.stringify(item.item)} className="min-w-0 space-y-3 rounded border border-line p-4">
     <h3 className="font-semibold">{t('question', { n: index + 1 })}</h3>
     <div dir="auto" style={literalStyle}>{item.prompt}</div>
     <p>{t('maximum', { n: item.maximum })}</p>
     <p className="font-semibold">{t('answer')}</p><div dir="auto" style={literalStyle} data-testid="written-answer">{item.answer}</div>
     <label className="block" htmlFor={`manual-score-${index}`}>{t('score', { n: item.maximum })}</label>
     <input id={`manual-score-${index}`} ref={index === 0 ? firstScore : undefined} className="block min-h-11 w-full min-w-0 rounded border border-line bg-panel p-2" type="text" inputMode="decimal" dir="ltr" value={s.drafts[index] ?? ''} disabled={s.busy || !!s.pending || s.read!.operationCount >= 100} aria-describedby={`manual-score-help-${index}`} aria-invalid={!validManualScore(s.drafts[index] ?? '', item.maximum)} onChange={e => { controller.edit(index, e.target.value); setConfirm(false); }}/>
     <p id={`manual-score-help-${index}`}>{t(s.read!.operationCount >= 100 ? 'cap' : 'decimalHint')}</p>
    </article>)}
    {saveReason && <p id="manual-save-reason">{t(saveReason)} {['invalidScores', 'takeoverRequired'].includes(saveReason) && <button className="underline min-h-11" onClick={fix}>{t('fix')}</button>}</p>}
    <button className={`${button} bg-paper font-semibold`} disabled={s.busy || !!saveReason} aria-describedby={saveReason ? 'manual-save-reason' : undefined} onClick={() => void controller.save()}>{t('save')}</button>
    <div className="space-y-3 rounded border-2 border-bad p-4" aria-label={t('finalize')}>
     <h3 className="font-semibold">{t('finalize')}</h3><p>{t('finalWarning')}</p>
     {finalReason && <p id="manual-final-reason">{t(finalReason)} {finalReason !== 'uncertain' && <button className="underline min-h-11" onClick={finalReason === 'saveFirst' ? () => document.querySelector<HTMLButtonElement>('[data-testid="manual-grading"] button.bg-paper')?.focus() : fix}>{t('fix')}</button>}</p>}
     {!confirm ? <button className={button} disabled={s.busy || !!finalReason} aria-describedby={finalReason ? 'manual-final-reason' : undefined} onClick={() => setConfirm(true)}>{t('finalize')}</button> : <div role="group" aria-label={t('confirm')}>
      <p>{t('confirm')}</p><button className={`${button} text-bad`} disabled={s.busy} onClick={() => { setConfirm(false); void controller.finalize(); }}>{t('confirmFinalize')}</button> <button className={button} disabled={s.busy} onClick={() => setConfirm(false)}>{t('cancel')}</button>
     </div>}
    </div>
   </>}
   {s.receipt && <div role="status" className="space-y-3 rounded border border-line p-4"><h3 className="font-semibold">{t('final')}</h3><p>{t('finalWarning')}</p><p>{t('receipt')} <time dateTime={s.receipt.finalized_at}>{date(s.receipt.finalized_at)}</time></p><p>{t('revision', { n: s.receipt.final_grading_revision })} · {t('operations', { n: s.receipt.operation_count })}</p></div>}
   {s.pending && <div role="alert"><p>{t('uncertain')}</p><button className={button} disabled={s.busy} onClick={() => void controller.retry()}>{t('retrySame')}</button></div>}
   {s.attempt && <details className="min-w-0 break-all"><summary className="min-h-11 cursor-pointer">{t('details')}</summary><p>{t('attemptRef')} <bdi>{s.attempt}</bdi></p>{s.queue?.rows.find(r => r.id === s.attempt) && <p>{t('assignmentRef')} <bdi>{s.queue.rows.find(r => r.id === s.attempt)!.assignment_id}</bdi></p>}</details>}
  </>}
 </section>;
}

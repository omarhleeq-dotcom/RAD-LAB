import { useEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import type { AuthoringViewProps } from '../authoring-review/AuthoringView';
import type { Draft, DraftItem } from '../authoring-review/contracts';
import { newMCQ } from '../authoring-review/draft';
import { QuestionImport, QuestionShuffle } from './QuestionImport';
import { readImportNotes, writeImportNotes } from './import-preferences';
import { authoringV2Issues, draftToV2, questionToRow, validateAssessImportRowV1, type BatchNotes } from './import-validator';
const control = 'min-h-11 max-w-full rounded-lg border border-line bg-panel px-3 py-2 disabled:opacity-50';
const field = `${control} mt-1 block w-full`;
/** Local navigation only: all input/preview panels stay mounted between steps. */
export function AuthoringFlow({ draft: d, t, busy, dirty, saveBlocked, actorId, change, save, preview, discard, discarding, keep, confirmDiscard }: AuthoringViewProps & { actorId: string }) {
 const heading = useRef<HTMLHeadingElement>(null);
 const a = useTranslations('assessImport'), [step, setStep] = useState<2 | 3 | 4>(d.items.length ? 4 : 2), [method, setMethod] = useState<'upload' | 'paste' | 'write'>('upload');
 useEffect(() => { heading.current?.focus(); }, [step]);
 const [batch, setBatch] = useState(() => readImportNotes(actorId)), [pending, setPending] = useState(false), [attempted, setAttempted] = useState(false);
 const [autoPool, setAutoPool] = useState(d.randomPool === undefined);
 const [manualId, setManualId] = useState<string>();
 const manual = d.items.find(i => i.id === manualId), count = d.items.length, k = d.randomPool?.size ?? count;
 const kInvalid = !Number.isInteger(k) || k < 1 || k > count;
 const issues = authoringV2Issues(d);
 let sizeError = false; if (!issues.length) { try { draftToV2(d); } catch { sizeError = true; } }
 function update(item: DraftItem) { change({ ...d, items: d.items.map(i => i.id === item.id ? item : i) }); }
 function updateBatch(value: BatchNotes) {
  setBatch(value); writeImportNotes(actorId, value);
  change({ ...d, items: d.items.map(i => ({ ...i, authoring: { ...i.authoring, reference: i.authoring.reference === batch.reference ? value.reference : i.authoring.reference, licenceNotes: i.authoring.licenceNotes === batch.licenceNotes ? value.licenceNotes : i.authoring.licenceNotes } })) });
 }
 function choose(value: typeof method) {
  setMethod(value); setAttempted(false);
  if (value === 'write' && (!manual || !manualIssues.length)) {
   const item = { ...newMCQ(), shuffleOptions: true, authoring: { author: '', ...batch, notes: '' } };
   setManualId(item.id); change({ ...d, items: [...d.items, item], ...(!autoPool && d.randomPool ? {} : { randomPool: { version: 1, size: count + 1 } }) });
  }
  setStep(3);
 }
 function template(event: React.MouseEvent<HTMLAnchorElement>) {
  event.preventDefault();
  const blob = new Blob(['Question,A,B,C,D,Answer,Points,Reference\r\nExample question?,Option A,Option B,Option C,Option D,A,1,Your source\r\n'], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob), anchor = document.createElement('a'); anchor.href = url; anchor.download = 'questions-template.csv'; anchor.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
 }
 const manualIssues = manual?.type === 'single-choice' ? validateAssessImportRowV1(questionToRow(manual), manual.authoring).issues : [];
 return <section className="min-w-0 space-y-4" aria-label={t.draft}>
  <h3 ref={heading} className="text-xl font-semibold" tabIndex={-1}>{a('step', { n: step })} · {a(step === 2 ? 'chooseMethod' : step === 3 ? 'previewStep' : 'saveStep')}</h3>
  <fieldset disabled={busy} className="min-w-0 space-y-4">
   <div hidden={step !== 2} className="space-y-4">
    <div className="grid gap-3 sm:grid-cols-3">{(['upload', 'paste', 'write'] as const).map(value => <button key={value} type="button" className={`${control} min-h-16 text-lg font-semibold`} onClick={() => choose(value)}>{a(`method.${value}`)}</button>)}</div>
    <a className="inline-flex min-h-11 items-center underline" href="#template" download="questions-template.csv" onClick={template}>{a('template')}</a>
    {count > 0 && <button type="button" className={control} onClick={() => setStep(4)}>{a('saveStep')}</button>}
   </div>
   <div hidden={step !== 3} className="min-w-0 space-y-4">
    <div hidden={method === 'write'}><QuestionImport draft={d} change={change} actorId={actorId} batch={batch} setBatch={setBatch} onPending={setPending} method={method === 'write' ? 'upload' : method} defaultPool={autoPool} onPrepared={() => setStep(4)}/></div>
    <div hidden={method !== 'write'} className="min-w-0 space-y-4">
     {manual?.type === 'single-choice' && <>
      <label className="block">{t.prompt}<textarea className={field} lang="en" dir="ltr" maxLength={10000} value={manual.prompt} onChange={e => update({ ...manual, prompt: e.target.value })}/></label>
      {manual.options.map((option, n) => <div key={option.id}><label className="block">{t.option} {n + 1}<input className={field} lang="en" dir="ltr" maxLength={5000} value={option.text} onChange={e => update({ ...manual, options: manual.options.map(o => o.id === option.id ? { ...o, text: e.target.value } : o) })}/></label><button type="button" className={control} disabled={manual.options.length <= 2} onClick={() => update({ ...manual, options: manual.options.filter(o => o.id !== option.id), correctOptionId: manual.correctOptionId === option.id ? '' : manual.correctOptionId })}>{t.removeOption} {n + 1}</button></div>)}
      <button type="button" className={control} disabled={manual.options.length >= 50} onClick={() => update({ ...manual, options: [...manual.options, { id: crypto.randomUUID(), text: '' }] })}>{t.addOption}</button>
      <label className="block">{t.correct}<select className={field} value={manual.correctOptionId} onChange={e => update({ ...manual, correctOptionId: e.target.value })}><option value="">{t.chooseKey}</option>{manual.options.map((o, n) => <option key={o.id} value={o.id}>{n + 1}. {o.text.slice(0, 80)}</option>)}</select></label>
      <label className="block">{t.points}<input className={field} dir="ltr" inputMode="decimal" maxLength={16} value={manual.maximum} onChange={e => update({ ...manual, maximum: e.target.value })}/></label>
      <QuestionShuffle checked={manual.shuffleOptions ?? true} change={shuffleOptions => update({ ...manual, shuffleOptions })}/>
      <details><summary className={`${control} cursor-pointer`}>{a('sourceDetails')}</summary>{(['reference', 'licenceNotes'] as const).map(key => <label key={key} className="block">{t[key]}<textarea className={field} lang="en" dir="ltr" maxLength={2000} value={manual.authoring[key]} onChange={e => { const value = { ...manual.authoring, [key]: e.target.value }; update({ ...manual, authoring: value }); setBatch(value); writeImportNotes(actorId, value); }}/></label>)}</details>
      {attempted && manualIssues.length > 0 && <ul role="alert">{manualIssues.map((issue, n) => <li key={n}>{issue.column}: {a(`rowErrors.${issue.code}`)}</li>)}</ul>}
      <button type="button" className={control} onClick={() => { setAttempted(true); if (!manualIssues.length) { setAttempted(false); setStep(4); } }}>{a('next')}</button>
     </>}
    </div>
   </div>
   <div hidden={step !== 4} className="space-y-4">
    <p role="status">{a('questionCount', { n: count })} · {dirty || d.revision === 0 ? t.dirty : t.saved}</p>
    <label className="block">{t.name}<input className={field} lang="en" dir="ltr" maxLength={200} value={d.name} onChange={e => change({ ...d, name: e.target.value })}/></label>
    <label className="block">{a('questionsPerStudent', { n: count })}<input aria-label={a('poolSize')} className={field} dir="ltr" type="number" min={1} step={1} value={k} onChange={e => { setAutoPool(false); change({ ...d, randomPool: { version: 1, size: Number(e.target.value) } }); }}/></label>
    <p className="text-sm text-muted">{a(d.items.every(i => i.type === 'single-choice' && i.shuffleOptions === false) ? 'shuffleOff' : d.items.some(i => i.type === 'single-choice' && i.shuffleOptions === false) ? 'shuffleMixed' : 'shuffleOn')}</p>
    {kInvalid && <p role="alert">{a('draftErrors.pool_size_exceeds_questions')}</p>}
    <details><summary className={`${control} cursor-pointer`}>{a('sourceDetails')}</summary><div className="space-y-3">
     <p>{a('memoryHelp')}</p>
     <label className="block">{a('batchReference')}<textarea className={field} lang="en" dir="ltr" maxLength={2000} value={batch.reference} onChange={e => updateBatch({ ...batch, reference: e.target.value })}/></label>
     <label className="block">{a('batchLicence')}<textarea className={field} lang="en" dir="ltr" maxLength={2000} value={batch.licenceNotes} onChange={e => updateBatch({ ...batch, licenceNotes: e.target.value })}/></label>
     {d.items.map((i, n) => <fieldset key={i.id}><legend>{t.item} {n + 1}</legend>{(['reference', 'licenceNotes'] as const).map(key => <label key={key} className="block">{t[key]}<textarea className={field} lang="en" dir="ltr" maxLength={2000} value={i.authoring[key]} onChange={e => update({ ...i, authoring: { ...i.authoring, [key]: e.target.value } })}/></label>)}</fieldset>)}
    </div></details>
    <details><summary className={`${control} cursor-pointer`}>{a('rulesHelp')}</summary><p>{a('shuffleQuestions')}</p><p>{a('replacement')}</p><p>{t.reviewHint}</p><p>{a('closedGate')}</p><p>{a('draftErrors.limit')}</p><p>{a('rowErrors.points')}</p></details>
    {attempted && (issues.length > 0 || sizeError) && <ul role="alert">{issues.map((issue, n) => <li key={n}>{issue.path}: {a(`draftErrors.${issue.message}`)}</li>)}{sizeError && <li>{a('errors.documentLimit')}</li>}</ul>}

    <details><summary className={`${control} cursor-pointer text-sm`}>{a('more')}</summary><div className="space-y-3">
     <label className="block">{t.duration}<input className={field} dir="ltr" type="number" min={1} max={604800} step={1} value={d.policy.durationSeconds ?? ''} onChange={e => change({ ...d, policy: { ...d.policy, durationSeconds: e.target.value === '' ? null : Number(e.target.value) } })}/></label>
     <label className="block">{t.attempts}<input className={field} dir="ltr" type="number" min={1} max={1000} step={1} value={d.policy.maxAttempts} onChange={e => change({ ...d, policy: { ...d.policy, maxAttempts: Number(e.target.value) } })}/></label>
     <label className="block">{t.visibility}<select className={field} value={d.policy.gradeVisibility} onChange={e => change({ ...d, policy: { ...d.policy, gradeVisibility: e.target.value as Draft['policy']['gradeVisibility'] } })}><option value="hidden">{t.hidden}</option><option value="after-submission">{t.shown}</option></select></label>
     <div className="space-y-2">{d.items.map((i, n) => <div key={i.id} className="flex flex-wrap gap-2"><span className="min-w-0 break-words">{t.item} {n + 1}: {i.prompt}</span><button type="button" className={control} onClick={() => { setManualId(i.id); setMethod('write'); setStep(3); }}>{a('fix')}</button><button type="button" className={control} onClick={() => { const items = d.items.filter(item => item.id !== i.id); change({ ...d, items, ...(autoPool ? { randomPool: { version: 1, size: items.length } } : {}) }); }}>{t.remove}</button></div>)}</div>
     <button type="button" className={control} disabled={pending} onClick={preview}>{t.preview}</button><button type="button" className={control} onClick={discard}>{t.discard}</button>
     {discarding && <div role="group" aria-label={t.confirmDiscard}><button type="button" className={control} onClick={confirmDiscard}>{t.confirmDiscard}</button><button type="button" className={control} onClick={keep}>{t.keep}</button></div>}
    </div></details>
   </div>
   {step !== 2 && <div className="flex items-center justify-between gap-3"><button type="button" className={control} onClick={() => { setAttempted(false); setStep(step === 4 ? 3 : 2); }}>{a('back')}</button>{step === 4 && <button type="button" className={"min-h-11 rounded-lg border border-brand bg-brand px-4 py-2 font-semibold text-on-brand hover:bg-brand-strong disabled:opacity-50"} disabled={saveBlocked || pending || kInvalid} onClick={() => { setAttempted(true); if (!issues.length && !sizeError) save(); }}>{t.save}</button>}</div>}
  </fieldset>
 </section>;
}

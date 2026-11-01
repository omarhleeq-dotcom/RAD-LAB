import { useEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import type { Draft } from '../authoring-review/contracts';
import { IMPORT_LIMITS, ImportError, MISSING_CACHED_VALUE, parseDelimited, parseImportFile } from './import-parser';
import { authoringV2Issues, draftToV2, importTableRows, rowToQuestion, validateAssessImportRowV1, type BatchNotes, type ImportRow } from './import-validator';
import { writeImportNotes } from './import-preferences';
const field = 'mt-1 block min-h-11 w-full max-w-full rounded border border-line bg-panel p-2';
const button = 'min-h-11 max-w-full rounded border border-line px-3 py-2 disabled:opacity-50';
type PreviewRow = { row: number; values: ImportRow; licenceNotes: string; excluded: boolean };
export function QuestionImport({ draft, change, actorId, batch, setBatch, onPending }: { draft: Draft; change(value: Draft): void; actorId: string; batch: BatchNotes; setBatch(value: BatchNotes): void; onPending(value: boolean): void }) {
 const t = useTranslations('assessImport'), [paste, setPaste] = useState(''), [rows, setRows] = useState<PreviewRow[]>([]), [error, setError] = useState(''), [loading, setLoading] = useState(false);
 const generation = useRef(0);
 useEffect(() => () => { generation.current++; }, []);
 useEffect(() => { onPending(loading || rows.length > 0 || !!paste.trim() || !!error); }, [loading, rows.length, paste, error, onPending]);
 const updateBatch = (value: BatchNotes) => { setBatch(value); writeImportNotes(actorId, value); };
 function preview(table: string[][]) { const values = importTableRows(table); if (!values.length) throw new ImportError('malformed'); setRows(values.map(r => ({ ...r, values: { ...r.values, Reference: r.values.Reference?.trim() ? r.values.Reference : batch.reference }, licenceNotes: batch.licenceNotes, excluded: false }))); }
 async function file(value?: File) {
  if (!value) return; const operation = ++generation.current; setError(''); setRows([]); setLoading(true);
  try { const table = await parseImportFile(value); if (operation === generation.current) preview(table); }
  catch (e) { if (operation === generation.current) setError(e instanceof ImportError ? e.code : 'malformed'); }
  finally { if (operation === generation.current) setLoading(false); }
 }
 const validation = rows.map(r => validateAssessImportRowV1(r.values, { reference: batch.reference, licenceNotes: r.licenceNotes }));
 const included = rows.filter(r => !r.excluded), valid = included.length > 0 && rows.every((r, n) => r.excluded || !validation[n]!.issues.length);
 function update(index: number, value: PreviewRow) { setRows(rows.map((r, n) => n === index ? value : r)); setError(''); }
 function append() {
  if (!valid) return;
  try {
   const items = included.map(r => rowToQuestion(r.values, { reference: batch.reference, licenceNotes: r.licenceNotes }));
   const next = { ...draft, items: [...draft.items, ...items] };
   // Validate the complete draft and pool before changing even local draft state.
   draftToV2(next); change(next); setRows([]); setPaste(''); setError(''); writeImportNotes(actorId, batch);
  } catch (e) { setError(e instanceof Error && e.message === 'documentLimit' ? 'documentLimit' : 'draftInvalid'); }
 }
 const issues = authoringV2Issues(draft); let sizeError = false;
 if (!issues.length) { try { draftToV2(draft); } catch { sizeError = true; } }
 return <section className="min-w-0 space-y-4 rounded border border-line p-3" aria-label={t('importTitle')}>
  <h3 className="text-lg font-semibold">{t('importTitle')}</h3><p>{t('localOnly')}</p><p lang="en" dir="ltr" className="break-words">Question, A, B, C…AX, Answer, Points, Reference</p><p>{t('columnsHelp')}</p>
  <div className="grid gap-3 sm:grid-cols-2">
   <label>{t('batchReference')}<textarea aria-label={t('batchReference')} lang="en" dir="ltr" className={field} maxLength={2000} value={batch.reference} onChange={e => updateBatch({ ...batch, reference: e.target.value })}/></label>
   <label>{t('batchLicence')}<textarea aria-label={t('batchLicence')} lang="en" dir="ltr" className={field} maxLength={2000} value={batch.licenceNotes} onChange={e => updateBatch({ ...batch, licenceNotes: e.target.value })}/></label>
  </div><p>{t('memoryHelp')}</p>
  <label className="block">{t('paste')}<textarea aria-label={t('paste')} className={`${field} min-h-32 font-mono`} lang="en" dir="ltr" maxLength={IMPORT_LIMITS.bytes} value={paste} onChange={e => setPaste(e.target.value)}/></label>
  <button type="button" className={button} disabled={loading || !paste.trim()} onClick={() => { generation.current++; setRows([]); setError(''); try { preview(parseDelimited(paste, '\t')); } catch (e) { setError(e instanceof ImportError ? e.code : 'malformed'); } }}>{t('previewPaste')}</button>
  <div className="space-y-2 rounded border border-dashed border-line p-3" onDragOver={e => e.preventDefault()} onDrop={e => { e.preventDefault(); if (e.dataTransfer.files.length !== 1) { setError('fileType'); return; } void file(e.dataTransfer.files[0]); }}>
   <label className="block">{t('file')}<input className={`${field} text-sm`} type="file" accept=".xlsx,.csv" disabled={loading} onChange={e => { void file(e.target.files?.[0]); e.target.value = ''; }}/></label><p>{t('drop')}</p>
  </div>
  {loading && <p role="status">{t('loading')}</p>}{error && <p role="alert">{t(`errors.${error}`)}</p>}
  {error && !rows.length && <button type="button" className={button} onClick={() => { setError(''); setPaste(''); }}>{t('cancel')}</button>}
  {rows.length > 0 && <section className="space-y-4" aria-label={t('preview')}><h4 className="font-semibold">{t('preview')} · {included.length}/{rows.length}</h4><p>{t('previewHelp')}</p>
   {rows.map((row, n) => <fieldset key={row.row} className="min-w-0 space-y-3 rounded border border-line p-3"><legend>{t('row')} {row.row}</legend>
    <label className="flex min-h-11 items-center gap-2"><input type="checkbox" checked={row.excluded} onChange={e => update(n, { ...row, excluded: e.target.checked })}/>{t('exclude')}</label>
    {validation[n]!.issues.length > 0 && !row.excluded && <ul role="alert" className="space-y-1">{validation[n]!.issues.map((issue, i) => <li key={i}><bdi>{issue.column}</bdi>: {t(`rowErrors.${issue.code}`)}</li>)}</ul>}
    <div className="grid min-w-0 gap-3 sm:grid-cols-2">{Object.entries(row.values).map(([key, value]) => <label className={key === 'Question' ? 'sm:col-span-2' : ''} key={key}><span lang="en">{key}</span><textarea aria-label={key} className={field} lang="en" dir="ltr" value={value.replaceAll(MISSING_CACHED_VALUE, '')} onChange={e => update(n, { ...row, values: { ...row.values, [key]: e.target.value } })}/></label>)}
     {!('Reference' in row.values) && <label>{t('reference')}<textarea aria-label={t('reference')} className={field} lang="en" dir="ltr" value={row.values.Reference ?? batch.reference} onChange={e => update(n, { ...row, values: { ...row.values, Reference: e.target.value } })}/></label>}
     <label>{t('licence')}<textarea aria-label={t('licence')} className={field} lang="en" dir="ltr" value={row.licenceNotes} maxLength={2000} onChange={e => update(n, { ...row, licenceNotes: e.target.value })}/></label>
    </div>
   </fieldset>)}
   <button type="button" className={button} disabled={!valid || loading} onClick={append}>{t('addValidated')}</button>
   <button type="button" className={button} onClick={() => { setRows([]); setPaste(''); setError(''); }}>{t('cancel')}</button>
  </section>}
  <label className="block">{t('poolSize')} · N={draft.items.filter(i => i.type === 'single-choice').length}<input className={field} dir="ltr" type="number" min={1} step={1} value={draft.randomPool?.size ?? draft.items.length} onChange={e => change({ ...draft, randomPool: { version: 1, size: Number(e.target.value) } })}/></label>
  <p>{t('shuffleQuestions')}</p><p>{t('replacement')}</p>
  {(issues.length > 0 || sizeError) && <div role="alert"><ul className="space-y-1">{issues.map((issue, n) => <li key={n}><bdi>{issue.path}</bdi>: {t(`draftErrors.${issue.message}`)}</li>)}{sizeError && <li>{t('errors.documentLimit')}</li>}</ul></div>}
 </section>;
}
export function QuestionShuffle({ checked, change }: { checked: boolean; change(value: boolean): void }) {
 const t = useTranslations('assessImport');
 return <label className="flex min-h-11 items-center gap-2"><input type="checkbox" checked={checked} onChange={e => change(e.target.checked)}/>{t('shuffleOptions')}</label>;
}

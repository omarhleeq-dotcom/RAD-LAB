import { FixReason, QuestionPreview } from './QuestionPreview';
import { useEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import type { Draft } from '../authoring-review/contracts';
import { IMPORT_LIMITS, ImportError, MISSING_CACHED_VALUE, parseDelimited, parseImportFile } from './import-parser';
import { draftToV2, importTableRows, questionToRow, rowToQuestion, validateAssessImportRowV1, type BatchNotes, type ImportRow } from './import-validator';
import { readImportNotes, rememberImportField, writeImportNotes } from './import-preferences';
const field = 'mt-1 block min-h-11 w-full max-w-full rounded border border-line bg-panel p-2';
const button = 'min-h-11 max-w-full rounded border border-line px-3 py-2 disabled:opacity-50';
type PreviewRow = { row: number; values: ImportRow; licenceNotes: string; excluded: boolean };
export function QuestionImport({ draft, change, actorId, authorName = '', batch, setBatch, onPending, method, onPrepared, defaultPool }: { draft: Draft; change(value: Draft): void; actorId: string; authorName?: string; batch: BatchNotes; setBatch(value: BatchNotes): void; onPending(value: boolean): void; method?: 'upload' | 'paste'; onPrepared?(): void; defaultPool?: boolean }) {
 const t = useTranslations('assessImport'), [paste, setPaste] = useState(''), [rows, setRows] = useState<PreviewRow[]>([]), [error, setError] = useState(''), [loading, setLoading] = useState(false), [prepared, setPrepared] = useState(false);
 const previousBatch = useRef(batch);
 const generation = useRef(0), input = useRef<HTMLInputElement>(null), stagedIds = useRef<string[]>([]);
 useEffect(() => () => { generation.current++; }, []);
 useEffect(() => { onPending(loading || !prepared && (rows.length > 0 || !!paste.trim() || !!error)); }, [loading, rows.length, paste, error, prepared, onPending]);
 useEffect(() => {
  const previous = previousBatch.current; previousBatch.current = batch;
  if (previous.reference === batch.reference && previous.licenceNotes === batch.licenceNotes) return;
  setRows(current => current.map(r => ({ ...r, values: { ...r.values, Reference: r.values.Reference === previous.reference ? batch.reference : r.values.Reference ?? '' }, licenceNotes: r.licenceNotes === previous.licenceNotes ? batch.licenceNotes : r.licenceNotes })));
 }, [batch]);
 // Edits made at Save (or through More) must also appear when returning to the staged preview.
 useEffect(() => {
  if (!prepared || !stagedIds.current.length) return;
  setRows(current => {
   let includedIndex = 0;
   return current.map(row => {
    if (row.excluded) return row;
    const id = stagedIds.current[includedIndex++], item = draft.items.find(i => i.id === id);
    return item?.type === 'single-choice' ? { ...row, values: questionToRow(item), licenceNotes: item.authoring.licenceNotes } : { ...row, excluded: true };
   });
  });
 }, [draft, prepared]);
 function updateBatch(value: BatchNotes) { setBatch(value); writeImportNotes(actorId, value, authorName); setPrepared(false); }
 function preview(table: string[][]) {
  const values = importTableRows(table); if (!values.length) throw new ImportError('malformed');
  const notes = authorName ? readImportNotes(actorId, authorName) : batch;
  if (authorName) setBatch(notes);
  stagedIds.current = []; setPrepared(false);
  setRows(values.map(r => ({ ...r, values: { ...r.values, Reference: r.values.Reference?.trim() ? r.values.Reference : notes.reference }, licenceNotes: notes.licenceNotes, excluded: false })));
 }
 async function file(value?: File) {
  if (!value) return; const operation = ++generation.current; setError(''); setLoading(true); setPrepared(false);
  try { const table = await parseImportFile(value); if (operation === generation.current) preview(table); }
  catch (e) { if (operation === generation.current) setError(e instanceof ImportError ? e.code : 'malformed'); }
  finally { if (operation === generation.current) setLoading(false); }
 }
 const validation = rows.map(r => validateAssessImportRowV1(r.values, { reference: batch.reference, licenceNotes: r.licenceNotes }));
 const included = rows.filter(r => !r.excluded), valid = included.length > 0 && rows.every((r, n) => r.excluded || !validation[n]!.issues.length);
 function update(index: number, value: PreviewRow) { setRows(rows.map((r, n) => n === index ? value : r)); setError(''); setPrepared(false); }
 function append() {
  if (!valid || error) return;
  if (prepared) { onPrepared?.(); return; }
  try {
   const items = included.map(r => rowToQuestion(r.values, { reference: batch.reference, licenceNotes: r.licenceNotes }));
   const base = draft.items.filter(i => !stagedIds.current.includes(i.id));
   const next = { ...draft, items: [...base, ...items], ...(!(defaultPool ?? !draft.randomPool) ? {} : { randomPool: { version: 1 as const, size: base.length + items.length } }) };
   // The flow stages rows locally; the unchanged complete v2 validator gates its only Save.
   // Standalone/legacy consumers still check the complete draft before appending.
   if (!onPrepared) draftToV2(next);
   change(next);
   if (onPrepared) { stagedIds.current = items.map(i => i.id); setPrepared(true); onPrepared(); }
   else { setRows([]); setPaste(''); setError(''); }
  } catch (e) { setError(e instanceof Error && e.message === 'documentLimit' ? 'documentLimit' : 'draftInvalid'); }
 }
 function cancel() { generation.current++; setLoading(false); setRows([]); setPaste(''); setError(''); setPrepared(false); stagedIds.current = []; }
 return <section className="min-w-0 space-y-4 rounded border border-line p-3" aria-label={t('importTitle')}>
  {!method && <h3 className="text-lg font-semibold">{t('importTitle')}</h3>}
  {rows.length > 0 && <section aria-label={t('preview')}><QuestionPreview rows={rows} issues={validation.map(v=>v.issues)} exclude={n=>update(n,{...rows[n]!,excluded:!rows[n]!.excluded})} next={append} blocked={!valid||loading||!!error} blockedReason={loading ? t('loading') : error ? t(`errors.${error}`) : undefined} nextLabel={onPrepared?t('next'):t('addValidated')} edit={n=>(
    <div  className="grid min-w-0 gap-3 sm:grid-cols-2">{Object.entries(rows[n]!.values).filter(([key]) => key !== 'Reference').map(([key, value]) => <label className={key === 'Question' ? 'sm:col-span-2' : ''} key={key}><span lang="en">{key}</span><textarea aria-label={key} className={field} lang="en" dir="ltr" value={value.replaceAll(MISSING_CACHED_VALUE, '')} onChange={e => update(n, { ...rows[n]!, values: { ...rows[n]!.values, [key]: e.target.value } })}/></label>)}
     <details className="sm:col-span-2"><summary className={`${button} cursor-pointer`}>{t('sourceDetails')}</summary><label>{t('reference')}<span className="block text-sm text-muted">{t('referenceHint')}</span><textarea aria-label={t('reference')} className={field} lang="en" dir="ltr" value={rows[n]!.values.Reference ?? batch.reference} onChange={e => { update(n, { ...rows[n]!, values: { ...rows[n]!.values, Reference: e.target.value } }); rememberImportField(actorId, 'reference', e.target.value, authorName); }}/></label><label>{t('licence')}<span className="block text-sm text-muted">{t('licenceHint')}</span><textarea aria-label={t('licence')} className={field} lang="en" dir="ltr" value={rows[n]!.licenceNotes} maxLength={2000} onChange={e => { update(n, { ...rows[n]!, licenceNotes: e.target.value }); rememberImportField(actorId, 'licenceNotes', e.target.value, authorName); }}/></label></details>
    </div>
)}/></section>}
  <details><summary className={`${button} cursor-pointer`}>{t('importHelp')}</summary><p>{t('localOnly')}</p><p lang="en" dir="ltr" className="break-words">Question, A, B, C…AX, Answer, Points, Reference</p><p>{t('columnsHelp')}</p><p>{t('previewHelp')}</p></details>
  <div hidden={method === 'upload' || rows.length > 0}>
   <label className="block">{t('paste')}<textarea id="import-paste" aria-label={t('paste')} className={`${field} min-h-32 font-mono`} lang="en" dir="ltr" maxLength={IMPORT_LIMITS.bytes} value={paste} onChange={e => { setPaste(e.target.value); setPrepared(false); }}/></label>
   {(loading || !paste.trim()) && <FixReason target="import-paste">{t(loading ? 'loading' : 'pasteReason')}</FixReason>}
   <button type="button" className={button} disabled={loading || !paste.trim()} onClick={() => { generation.current++; setError(''); try { preview(parseDelimited(paste, '\t')); } catch (e) { setError(e instanceof ImportError ? e.code : 'malformed'); } }}>{t('previewPaste')}</button>
  </div>
  <div hidden={method === 'paste' || rows.length > 0} className="space-y-2 rounded border border-dashed border-line p-3" onDragOver={e => e.preventDefault()} onDrop={e => { e.preventDefault(); if (e.dataTransfer.files.length !== 1) { setError('fileType'); return; } void file(e.dataTransfer.files[0]); }}>
   <button type="button" className={button} disabled={loading} onClick={() => input.current?.click()}>{t('file')}</button>
   <input ref={input} hidden aria-label={t('file')} type="file" accept=".xlsx,.csv" disabled={loading} onChange={e => { void file(e.target.files?.[0]); e.target.value = ''; }}/><p className="hidden sm:block">{t('drop')}</p>
  </div>
  {loading && <p role="status">{t('loading')}</p>}{error && <p role="alert">{t(`errors.${error}`)}</p>}
  {(rows.length > 0 || !method) && <details><summary className={`${button} cursor-pointer`}>{t('sourceDetails')}</summary>
   <div className="grid gap-3 sm:grid-cols-2">
    <label>{t('batchReference')}<span className="block text-sm text-muted">{t('referenceHint')}</span><textarea aria-label={t('batchReference')} lang="en" dir="ltr" className={field} maxLength={2000} value={batch.reference} onChange={e => updateBatch({ ...batch, reference: e.target.value })}/></label>
    <label>{t('batchLicence')}<span className="block text-sm text-muted">{t('licenceHint')}</span><textarea aria-label={t('batchLicence')} lang="en" dir="ltr" className={field} maxLength={2000} value={batch.licenceNotes} onChange={e => updateBatch({ ...batch, licenceNotes: e.target.value })}/></label>
   </div><p>{t('memoryHelp')}</p>
  </details>}
  {(error || rows.length > 0 || paste) && <button type="button" className={button} onClick={cancel}>{t('cancel')}</button>}
 </section>;
}
export function QuestionShuffle({ checked, change }: { checked: boolean; change(value: boolean): void }) {
 const t = useTranslations('assessImport');
 return <label className="flex min-h-11 items-center gap-2"><input type="checkbox" checked={checked} onChange={e => change(e.target.checked)}/>{t('shuffleOptions')}</label>;
}

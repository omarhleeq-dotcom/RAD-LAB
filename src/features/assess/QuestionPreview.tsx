import { Fragment, useEffect, useId, useRef, useState, useSyncExternalStore, type ReactNode } from 'react';
import { useTranslations } from 'next-intl';
import { OPTION_COLUMNS, type ImportRow, type RowIssue } from './import-validator';
const button = 'min-h-11 min-w-11 rounded border border-line px-3 py-2 disabled:opacity-50';
const subscribe = (fn: () => void) => { const media = window.matchMedia?.('(min-width: 768px)'); media?.addEventListener('change', fn); return () => media?.removeEventListener('change', fn); };
/** Open the relevant collapsed controls before focusing the correction target. */
export function FixReason({ target, children }: { target: string; children: ReactNode }) {
 return <a className="block min-h-11 underline" href={`#${target}`} onClick={event => {
  const element = document.getElementById(target); if (!element) return; event.preventDefault();
  for (let parent: HTMLElement | null = element; parent; parent = parent.parentElement) if (parent instanceof HTMLDetailsElement) parent.open = true;
  if (element instanceof HTMLDetailsElement) element.open = true;
  element.querySelectorAll('details').forEach(details => { details.open = true; });
  const input = element.matches('input,textarea,select') ? element : element.querySelector<HTMLElement>('input,textarea,select,button');
  (input ?? element).focus(); element.scrollIntoView?.({ block: 'center' });
 }}>{children}</a>;
}
export type PreviewItem = { row: number; values: ImportRow; excluded: boolean };
export function QuestionPreview({ rows, issues, edit, exclude, next, blocked, blockedReason, nextLabel }: { rows: PreviewItem[]; issues: RowIssue[][]; edit(index: number): ReactNode; exclude(index: number): void; next(): void; blocked: boolean; blockedReason?: string; nextLabel: string }) {
 const t = useTranslations('assessImport'), desktop = useSyncExternalStore(subscribe, () => window.matchMedia?.('(min-width: 768px)').matches ?? false, () => false);
 const [page, setPage] = useState(0), [opened, setOpened] = useState<number>(), [editing, setEditing] = useState<number>();
 const reasonId = useId();
 const [fixColumn, setFixColumn] = useState<string>();
 const dialog = useRef<HTMLDialogElement>(null);
 const ordered = rows.map((row, n) => ({ row, n })).sort((a,b) => Number(!b.row.excluded && !!issues[b.n]!.length) - Number(!a.row.excluded && !!issues[a.n]!.length) || a.row.row-b.row.row);
 const pages = Math.max(1, Math.ceil(rows.length/10)), current = Math.min(page, pages-1), visible = ordered.slice(current*10,current*10+10);
 const selected = rows.findIndex(r => r.row === opened);
 useEffect(() => { if (!desktop && selected >= 0) dialog.current?.showModal(); else if (dialog.current?.open) dialog.current.close(); }, [desktop, selected]);
 useEffect(() => {
  if (editing === undefined) return;
  const scope = !desktop && selected >= 0 ? dialog.current : document;
  const element = scope?.querySelector<HTMLElement>(`[data-edit-row="${editing}"]`);
  if (fixColumn === 'Reference' || fixColumn === 'Licence') element?.querySelectorAll('details').forEach(details => { details.open = true; });
  const labels = Array.from(element?.querySelectorAll<HTMLTextAreaElement>('textarea') ?? []);
  const field = labels.find(label => label.getAttribute('aria-label') === (fixColumn === 'Reference' ? t('reference') : fixColumn === 'Licence' ? t('licence') : fixColumn));
  (field ?? element?.querySelector<HTMLElement>('textarea,input'))?.focus();
 }, [editing, fixColumn, desktop, selected, t]);
 function answer(row: PreviewItem) { const key = row.values.Answer?.trim() ?? ''; return `${row.values[key]?.trim() ? '✓' : '⚠'} ${key} · ${row.values[key] ?? t('rowErrors.answer')}`; }
 function details(row: PreviewItem, n: number) {
  return <div className="min-w-0 space-y-2 p-3">
   <p lang="en" dir="ltr" className="break-words">{row.values.Question}</p>
   <ul lang="en" dir="ltr">{OPTION_COLUMNS.filter(key => row.values[key]?.trim()).map(key => <li className="break-words" key={key}>{key === row.values.Answer?.trim() ? '✓ ' : ''}{key} · {row.values[key]}</li>)}</ul>
   <p lang="en" dir="ltr">Points: {row.values.Points?.trim() || '1'}</p><p lang="en" dir="ltr" className="break-words">Reference: {row.values.Reference}</p>
   {!!issues[n]!.length && !row.excluded && <div role="alert"><ul>{issues[n]!.map((issue,i) => <li key={i}>⚠ <bdi>{issue.column}</bdi>: {t(`rowErrors.${issue.code}`)}</li>)}</ul></div>}
   <button className={button} type="button" onClick={() => { setFixColumn(undefined); setEditing(editing === row.row ? undefined : row.row); }}>{t(issues[n]!.length && !row.excluded ? 'fix' : 'edit')}</button>
   <label className="inline-flex min-h-11 items-center gap-2"><input type="checkbox" checked={row.excluded} onChange={() => exclude(n)}/>{t('exclude')}</label>
   <div data-edit-row={row.row} hidden={editing !== row.row}>{edit(n)}</div>
  </div>;
 }
 function actions(row: PreviewItem) { return <button type="button" className={button} aria-label={t('detailsRow',{n:row.row})} aria-expanded={opened===row.row} onClick={() => setOpened(opened===row.row?undefined:row.row)}>⋯</button>; }
 function fixRow(n: number, column: string) { setFixColumn(column); const orderedIndex = ordered.findIndex(value => value.n === n); setPage(Math.floor(orderedIndex / 10)); setOpened(rows[n]!.row); setEditing(rows[n]!.row); }
 const grouped = new Map<string, { issue: RowIssue; rows: number[] }>();
 rows.forEach((row, n) => { if (!row.excluded) issues[n]!.forEach(issue => { const key = `${issue.column}:${issue.code}`; const group = grouped.get(key) ?? { issue, rows: [] }; group.rows.push(n); grouped.set(key, group); }); });
 const reasons = blocked ? <div className="space-y-1">{blockedReason && <p role="status">{blockedReason}</p>}{!rows.some(r => !r.excluded) && <p>{t('noIncludedRows')}</p>}{Array.from(grouped, ([key, group]) => <button type="button" className="block min-h-11 text-start underline" key={key} onClick={() => fixRow(group.rows[0]!, group.issue.column)}>{group.issue.code === 'required' && ['Reference', 'Licence'].includes(group.issue.column) ? t(group.issue.column === 'Reference' ? 'referenceRows' : 'licenceRows', { n: group.rows.length }) : `${group.issue.column}: ${t(`rowErrors.${group.issue.code}`)} · ${t('fixRows', { n: group.rows.length })}`}</button>)}</div> : null;
 const nextButton = <button type="button" className={`${button} font-semibold`} disabled={blocked} aria-describedby={blocked ? reasonId : undefined} onClick={next}>{nextLabel}</button>;
 return <>
  <div className="flex flex-wrap items-center justify-between gap-2"><h4 className="font-semibold">{t('summary',{ready:rows.filter((r,n)=>!r.excluded&&!issues[n]!.length).length,errors:rows.filter((r,n)=>!r.excluded&&issues[n]!.length).length})}</h4>{nextButton}</div>
  <div id={reasonId} aria-live="polite">{reasons}</div>
  {desktop ? <table className="w-full table-fixed text-start"><thead><tr><th className="w-14 text-start">#</th><th className="text-start">{t('questionColumn')}</th><th className="text-start">{t('answerColumn')}</th><th className="w-14"><span className="sr-only">{t('more')}</span></th></tr></thead><tbody>{visible.map(({row,n}) => <Fragment key={row.row}><tr className="border-b border-line"><td>{row.row}</td><td><div lang="en" dir="ltr" className="truncate">{row.values.Question}</div></td><td><div lang="en" dir="ltr" className="truncate">{answer(row)}</div></td><td>{actions(row)}</td></tr>{((issues[n]!.length>0&&!row.excluded)||opened===row.row)&&<tr><td colSpan={4}><fieldset className={issues[n]!.length?'border border-red-600':''}><legend>{t('row')} {row.row}</legend>{details(row,n)}</fieldset></td></tr>}</Fragment>)}</tbody></table> : <ul className="divide-y divide-line">{visible.map(({row,n}) => <li key={row.row}><div className="flex items-center gap-2 py-1"><div className="min-w-0 flex-1"><div className="flex gap-2"><span>#{row.row}</span><span lang="en" dir="ltr" className="truncate">{row.values.Question}</span></div><p lang="en" dir="ltr" className="truncate">{answer(row)}</p></div>{actions(row)}</div>{!!issues[n]!.length&&!row.excluded&&<fieldset className="border border-red-600"><legend>⚠ {t('row')} {row.row}</legend>{details(row,n)}</fieldset>}</li>)}</ul>}
  <nav className="flex items-center justify-center gap-3" aria-label={t('pagination')}><button type="button" className={button} aria-label={t('previousPage')} disabled={!current} onClick={()=>setPage(current-1)}>‹</button><span>{t('page',{page:current+1,pages})}</span><button type="button" className={button} aria-label={t('nextPage')} disabled={current===pages-1} onClick={()=>setPage(current+1)}>›</button></nav>
  {!desktop && <div className="sticky bottom-0 z-10 border-t border-line bg-panel p-2 text-end">{nextButton}{reasons}</div>}
  {!desktop && <dialog ref={dialog} className="fixed inset-x-0 bottom-0 top-auto m-0 max-h-[80dvh] w-full max-w-none overflow-auto rounded-t-xl border border-line bg-panel p-3 text-ink" aria-label={t('preview')} onClose={()=>setOpened(undefined)}><button type="button" className={button} onClick={()=>dialog.current?.close()}>{t('close')}</button>{selected>=0&&details(rows[selected]!,selected)}</dialog>}
 </>;
}

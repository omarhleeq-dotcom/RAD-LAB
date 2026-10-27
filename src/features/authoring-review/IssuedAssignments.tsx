import { useEffect, useRef, useState } from 'react';
import type { AuthoringAdapter, IssuedAssignment, Page, Scope } from './contracts';
import { ReviewError } from '../supervisor-review/contracts';
const control = 'min-h-11 max-w-full rounded-lg border border-line bg-panel px-4 py-2';
export const assignmentCopy = {
 en: { title: 'Issued assignments', refresh: 'Read assignments', close: 'Close assignment', confirm: 'Confirm assignment closure', keep: 'Keep open', closed: 'Closed at (UTC)', open: 'Open', uncertain: 'The action may have committed. Read assignments before another explicit action. No automatic retry.', denied: 'Assignment scope unavailable. Read again after verifying permission.', next: 'Next page', first: 'First page', hint: 'Closure stops new attempts. Targets and results remain. Ending the group is a separate action.' },
 ar: { title: 'الإسنادات الصادرة', refresh: 'قراءة الإسنادات', close: 'إغلاق الإسناد', confirm: 'تأكيد إغلاق الإسناد', keep: 'إبقاء الإسناد مفتوحًا', closed: 'أُغلق في (UTC)', open: 'مفتوح', uncertain: 'قد يكون الإجراء نُفذ. اقرأ الإسنادات قبل إجراء صريح آخر. لا إعادة تلقائية.', denied: 'نطاق الإسناد غير متاح. تحقق من الصلاحية ثم أعد القراءة.', next: 'الصفحة التالية', first: 'الصفحة الأولى', hint: 'الإغلاق يمنع بدء محاولات جديدة ويحفظ المستهدفين والنتائج. إنهاء المجموعة إجراء مستقل.' },
};
/** No automatic read after a mutation error, and no automatic mutation under any condition. */
export function IssuedAssignments({ adapter, scope, locale }: { adapter: AuthoringAdapter; scope: Scope; locale: 'en' | 'ar' }) {
 const t = assignmentCopy[locale], [page, setPage] = useState<Page<IssuedAssignment>>(), [selected, setSelected] = useState<IssuedAssignment>(), [busy, setBusy] = useState(false), [error, setError] = useState<string>(), [cursor, setCursor] = useState<string>();
 const active = useRef<AbortController | null>(null), alive = useRef(false);
 useEffect(() => { alive.current = true; return () => { alive.current = false; active.current?.abort(); }; }, []);
 useEffect(() => adapter.subscribe?.(() => { active.current?.abort(); setPage(undefined); setSelected(undefined); setBusy(false); setError(t.denied); }), [adapter, t]);
 async function run(mutate: boolean, after?: string) {
  if (busy) return;
  active.current?.abort(); const c = new AbortController(); active.current = c; setBusy(true); setError(undefined); setPage(undefined);
  const current = () => alive.current && active.current === c && !c.signal.aborted;
  try {
   if (mutate) await adapter.close!(scope, selected!, c.signal);
   const result = await adapter.assignments!(scope, after, c.signal);
   if (current()) { setPage(result); setSelected(undefined); setCursor(after); }
  } catch (e) { if (current()) { setSelected(undefined); setError(e instanceof ReviewError && ['denied', 'expired'].includes(e.reason) ? t.denied : t.uncertain); } }
  finally { if (current()) setBusy(false); }
 }
 return <section className="space-y-3 rounded-xl border border-line p-4" aria-label={t.title}><h2 className="text-xl">{t.title}</h2><p>{t.hint}</p>{error && <p role="alert">{error}</p>}
  <button className={control} disabled={busy} onClick={() => void run(false)}>{t.refresh}</button>
  {page && <><ul className="space-y-3">{page.rows.map(a => <li className="space-y-2 break-words" key={a.id}><p>{a.name} · {a.closedAt ? `${t.closed}: ${a.closedAt}` : t.open}</p>{!a.closedAt && <button className={control} disabled={busy} onClick={() => setSelected(a)}>{t.close}</button>}</li>)}</ul><div className="flex flex-wrap gap-2"><button className={control} disabled={busy || !cursor} onClick={() => void run(false)}>{t.first}</button><button className={control} disabled={busy || !page.next} onClick={() => void run(false, page.next!)}>{t.next}</button></div></>}
  {selected && <div role="group" aria-label={t.confirm} className="flex flex-wrap gap-2"><button className={control} disabled={busy} onClick={() => void run(true, cursor)}>{t.confirm}</button><button className={control} disabled={busy} onClick={() => setSelected(undefined)}>{t.keep}</button></div>}
 </section>;
}

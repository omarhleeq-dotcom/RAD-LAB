import { useEffect, useRef, useState } from 'react';
import type { AssignmentReview, AuthoringAdapter, Draft, Group, Page, ReviewFixture, Scope, StudentPreviewData } from './contracts';
import { ReviewError } from '../supervisor-review/contracts';
import { draftIssues, newDraft, studentPreview, type Issue } from './draft';
import { AuthoringView } from './AuthoringView';
import { StudentPreview } from './StudentPreview';
import { copy, type Copy } from './copy';
const control = 'min-h-11 max-w-full rounded-lg border border-line bg-panel px-4 py-2 text-sm';
const failure = (e: unknown, t: Copy) => e instanceof ReviewError ? t[e.reason === 'offline' ? 'error' : e.reason] : t.error;
/** Every await is guarded even if a future adapter ignores AbortSignal. */
function ScopedSession({ adapter, scope, locale }: { adapter: AuthoringAdapter; scope: Scope; locale: 'en' | 'ar' }) {
 const t = copy[locale];
 const [context, setContext] = useState<{ group: Group; now: number; receivedAt: number }>();
 const [draft, setDraft] = useState<Draft>(), [baseline, setBaseline] = useState<Draft>();
 const [preview, setPreview] = useState<StudentPreviewData>(), [plan, setPlan] = useState<AssignmentReview>();
 const [issues, setIssues] = useState<Issue[]>([]), [error, setError] = useState<string>(), [busy, setBusy] = useState(false), [receipt, setReceipt] = useState(false), [discarding, setDiscarding] = useState(false);
 const active = useRef<AbortController | null>(null), mounted = useRef(false), region = useRef<HTMLDivElement>(null), container = useRef<HTMLDivElement>(null);
 const current = (c: AbortController) => mounted.current && active.current === c && !c.signal.aborted;
 function clear() { setDraft(undefined); setBaseline(undefined); setPreview(undefined); setPlan(undefined); setIssues([]); setReceipt(false); setDiscarding(false); }
 useEffect(() => {
  mounted.current = true; const c = new AbortController(); active.current = c;
  adapter.context(scope, c.signal).then(data => { if (current(c)) { setContext({ ...data, receivedAt: performance.now() }); setDraft(data.draft); setBaseline(data.draft); } }).catch(e => { if (current(c)) setError(failure(e, t)); });
  return () => { mounted.current = false; c.abort(); active.current?.abort(); };
 }, [adapter, scope, t]);
 useEffect(() => {
  if (!context) return;
  const duration = Math.min(context.group.endsAt - context.now - (performance.now() - context.receivedAt), plan ? plan.expiresAt - Date.now() : Infinity), start = performance.now();
  let timer: ReturnType<typeof setTimeout>;
  const tick = () => {
   const remaining = duration - (performance.now() - start);
   if (remaining > 0) { timer = setTimeout(tick, Math.min(remaining, 2147483647)); return; }
   active.current?.abort(); clear(); setContext(undefined); setBusy(false); setError(t.expired);
  };
  tick(); return () => clearTimeout(timer);
 }, [context, plan, t]);
 useEffect(() => { if (preview) region.current?.querySelector<HTMLElement>('h2')?.focus(); }, [preview]);
 async function operation<T>(run: (signal: AbortSignal) => Promise<T>, accept: (value: T) => void) {
  if (busy) return;
  active.current?.abort(); const c = new AbortController(); active.current = c; setBusy(true); setError(undefined); setReceipt(false); setPreview(undefined); setDiscarding(false);
  try { const value = await run(c.signal); if (current(c)) accept(value); }
  catch (e) { if (current(c)) { clear(); setContext(undefined); setError(failure(e, t)); } }
  finally { if (current(c)) setBusy(false); }
 }
 function cancel() { active.current?.abort(); clear(); setContext(undefined); setBusy(false); setError(t.cancelled); }
 function change(d: Draft) { setDraft(d); setPreview(undefined); setPlan(undefined); setIssues([]); setReceipt(false); setDiscarding(false); }
 function validate() { const found = draftIssues(draft!, adapter.parts); setIssues(found); return !found.length; }
 if (!context) return <div className="space-y-3">{error ? <p role="alert">{error}</p> : <><p role="status">{t.loading}</p><button className={control} onClick={cancel}>{t.cancel}</button></>}</div>;
 return <div ref={container} className="space-y-5"><h2 className="text-xl break-words">{context.group.name}</h2>{error && <p role="alert">{error}</p>}
  {busy && <div><p role="status">{t.busy}</p><button className={control} onClick={cancel}>{t.cancel}</button></div>}
  {preview ? <div ref={region}><StudentPreview data={preview} t={t} locale={locale} close={() => { setPreview(undefined); requestAnimationFrame(() => [...(container.current?.querySelectorAll('button') ?? [])].find(b => b.textContent === t.preview)?.focus()); }}/></div> :
   draft ? <AuthoringView draft={draft} parts={adapter.parts} t={t} busy={busy} dirty={JSON.stringify(draft) !== JSON.stringify(baseline)} issues={issues} plan={plan} receipt={receipt} discarding={discarding} change={change}
    save={() => void operation(s => adapter.save(scope, draft, s), d => { setDraft(d); setBaseline(d); setPlan(undefined); })}
    preview={() => { if (validate()) { setPlan(undefined); setPreview(studentPreview(draft, adapter.parts)); } }}
    prepare={() => { if (validate()) void operation(s => adapter.prepare(scope, draft, s), setPlan); }}
    confirm={() => plan && void operation(s => adapter.confirm(scope, plan.token, s), () => { setPlan(undefined); setReceipt(true); })}
    cancelReview={() => setPlan(undefined)} paging={cursor => plan && void operation(s => adapter.targets(scope, plan.token, cursor, s), targets => setPlan({ ...plan, targets }))}
    discard={() => setDiscarding(true)} keep={() => setDiscarding(false)} confirmDiscard={() => { change(baseline ? structuredClone(baseline) : newDraft()); }}/>
   : <button className={control} onClick={() => { setDraft(newDraft()); setBaseline(undefined); }}>{t.create}</button>}
 </div>;
}
export function AuthoringSession(props: { adapter: AuthoringAdapter; scope: Scope; locale: 'en' | 'ar' }) {
 return <ScopedSession key={`${props.scope.actorId}:${props.scope.groupId}`} {...props}/>;
}
function GroupPicker({ adapter, actorId, select, t }: { adapter: AuthoringAdapter; actorId: string; select(id: string): void; t: Copy }) {
 const [data, setData] = useState<Page<Group>>(), [cursor, setCursor] = useState<string>(), [error, setError] = useState<string>();
 useEffect(() => { const c = new AbortController(); adapter.groups(actorId, cursor, c.signal).then(d => { if (!c.signal.aborted) setData(d); }).catch(e => { if (!c.signal.aborted) setError(failure(e, t)); }); return () => c.abort(); }, [adapter, actorId, cursor, t]);
 function page(value?: string) { setData(undefined); setError(undefined); setCursor(value); }
 return <section className="space-y-3"><h2 className="text-xl">{t.group}</h2>{error && <p role="alert">{error}</p>}{!data && !error && <p role="status">{t.loading}</p>}{data && <><div className="flex flex-wrap gap-2">{data.rows.map(g => <button key={g.id} className={control} onClick={() => select(g.id)}>{g.name}</button>)}</div>{!data.rows.length && <p>{t.empty}</p>}<div className="flex gap-2"><button className={control} disabled={!cursor} onClick={() => page()}>{t.first}</button><button className={control} disabled={!data.next} onClick={() => page(data.next!)}>{t.next}</button></div></>}</section>;
}
/** Local harness entry only. No app route, product navigation, auth or live adapter imports. */
export function LocalAuthoringReview({ fixture, locale = 'en' }: { fixture: ReviewFixture; locale?: 'en' | 'ar' }) {
 const [actorId, setActorId] = useState(fixture.adapter.accounts[0]!.id), [groupId, setGroupId] = useState<string>(), [epoch, setEpoch] = useState(0);
 const t = copy[locale], scope = groupId ? { actorId, groupId } : undefined;
 return <main className="platform-page mx-auto max-w-5xl space-y-6 px-4 py-8"><header className="space-y-3"><h1 className="text-3xl font-bold">{t.title}</h1><p className="rounded-xl border border-line bg-panel p-4">{t.notice}</p></header>
  <section className="space-y-4"><label className="block">{t.account}<select className={`${control} mt-1 block w-full`} value={actorId} onChange={e => { setActorId(e.target.value); setGroupId(undefined); }}>{fixture.adapter.accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}</select></label>
   <label className="block">{t.scenario}<select className={`${control} mt-1 block w-full`} onChange={e => { fixture.scenario(e.target.value as Parameters<ReviewFixture['scenario']>[0]); setEpoch(v => v + 1); }}><option value="normal">{t.normal}</option><option value="slow">{t.slow}</option><option value="offline">{t.offline}</option><option value="conflict">{t.concurrent}</option></select></label>
   <div className="flex flex-wrap gap-2"><button className={control} onClick={() => setEpoch(v => v + 1)}>{t.refresh}</button><button className={control} onClick={() => { fixture.expire(); setEpoch(v => v + 1); }}>{t.expire}</button><button className={control} onClick={() => { fixture.revoke(actorId); setEpoch(v => v + 1); }}>{t.revoke}</button></div>
  </section>
  <GroupPicker key={`${actorId}:${epoch}`} adapter={fixture.adapter} actorId={actorId} select={setGroupId} t={t}/>
  {scope && <AuthoringSession key={`${actorId}:${groupId}:${epoch}`} adapter={fixture.adapter} scope={scope} locale={locale}/>}
 </main>;
}

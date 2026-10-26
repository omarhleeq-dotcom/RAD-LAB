import { useEffect, useId, useMemo, useRef, useState } from 'react';
import type { AssignmentReview, AuthoringAdapter, Draft, DraftSummary, Group, Page, ReviewFixture, Scope, StudentPreviewData } from './contracts';
import { ReviewError } from '../supervisor-review/contracts';
import { draftIssues, newDraft, studentPreview, type Issue } from './draft';
import { AuthoringView } from './AuthoringView';
import { StudentPreview } from './StudentPreview';
import { copy, sqlCopy, type Copy } from './copy';
const control = 'min-h-11 max-w-full rounded-lg border border-line bg-panel px-4 py-2 text-sm';
const failure = (e: unknown, t: Copy) => e instanceof ReviewError ? t[e.reason === 'offline' ? 'error' : e.reason] : t.error;
/** Every await is guarded even if a future adapter ignores AbortSignal. */
function ScopedSession({ adapter, scope, locale }: { adapter: AuthoringAdapter; scope: Scope; locale: 'en' | 'ar' }) {
 const recoveryId = useId();
 const t = useMemo(() => adapter.service === 'sql' ? { ...copy[locale], ...sqlCopy[locale] } : copy[locale], [adapter, locale]);
 const [context, setContext] = useState<{ group: Group; now: number; receivedAt: number }>();
 const [draft, setDraft] = useState<Draft>(), [baseline, setBaseline] = useState<Draft>();
 const [preview, setPreview] = useState<StudentPreviewData>(), [plan, setPlan] = useState<AssignmentReview>();
 const [issues, setIssues] = useState<Issue[]>([]), [error, setError] = useState<string>(), [busy, setBusy] = useState(false), [receipt, setReceipt] = useState(false), [discarding, setDiscarding] = useState(false);
 const [drafts, setDrafts] = useState<Page<DraftSummary>>(), [cursor, setCursor] = useState<string>();
 const [recovery, setRecovery] = useState<{ local: Draft; remote?: Draft; checked: boolean; resolved: boolean }>();
 const active = useRef<AbortController | null>(null), mounted = useRef(false), region = useRef<HTMLDivElement>(null), container = useRef<HTMLDivElement>(null);
 const current = (c: AbortController) => mounted.current && active.current === c && !c.signal.aborted;
 function clear() { setDraft(undefined); setBaseline(undefined); setPreview(undefined); setPlan(undefined); setIssues([]); setReceipt(false); setDiscarding(false); setDrafts(undefined); setRecovery(undefined); }
 useEffect(() => {
  mounted.current = true; const c = new AbortController(); active.current = c; const started = performance.now();
  Promise.all([adapter.context(scope, c.signal), adapter.drafts?.(scope, cursor, c.signal)]).then(([data, list]) => { if (current(c)) { setContext({ ...data, receivedAt: started }); setDraft(data.draft); setBaseline(data.draft); setDrafts(list); } }).catch(e => { if (current(c)) { clear(); setContext(undefined); setError(failure(e, t)); } });
  return () => { mounted.current = false; c.abort(); active.current?.abort(); };
 }, [adapter, scope, t, cursor]);
 useEffect(() => adapter.subscribe?.(() => { active.current?.abort(); clear(); setContext(undefined); setBusy(false); setError(t.denied); }), [adapter, t]);
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
  catch (e) { if (current(c)) { if (adapter.service === 'sql' && draft && e instanceof ReviewError && ['conflict', 'offline', 'invalid'].includes(e.reason)) { setRecovery({ local: structuredClone(draft), checked: false, resolved: false }); setPreview(undefined); setPlan(undefined); } else { clear(); setContext(undefined); } setError(failure(e, t)); } }
  finally { if (current(c)) setBusy(false); }
 }
 function cancel() { active.current?.abort(); if (adapter.service === 'sql' && draft) { setRecovery({ local: structuredClone(draft), checked: false, resolved: false }); setPreview(undefined); setPlan(undefined); } else { clear(); setContext(undefined); } setBusy(false); setError(t.cancelled); }
 function change(d: Draft) { setDraft(d); setPreview(undefined); setPlan(undefined); setIssues([]); setReceipt(false); setDiscarding(false); }
 function validate() { const found = draftIssues(draft!, adapter.parts, adapter.practicals); setIssues(found); return !found.length; }
 async function verify() {
  const started = performance.now();
  active.current?.abort(); const c = new AbortController(); active.current = c; setBusy(true);
  try {
   const data = await adapter.context(scope, c.signal), list = await adapter.drafts!(scope, undefined, c.signal);
   const found = list.rows.find(d => d.id === recovery!.local.id);
   const remote = found ? await adapter.open!(scope, found.id, c.signal) : undefined;
   if (current(c)) { setContext({ ...data, receivedAt: started }); setDrafts(list); setRecovery({ local: recovery!.local, remote, checked: true, resolved: false }); setError(undefined); }
  } catch (e) { if (current(c)) { if (!(e instanceof ReviewError) || !['offline', 'conflict'].includes(e.reason)) { clear(); setContext(undefined); } setError(failure(e, t)); } }
  finally { if (current(c)) setBusy(false); }
 }
 const recoveryPanel = recovery && <section className="space-y-3 rounded-xl border border-line p-4" aria-label={t.recovery}>
  <h2 className="text-xl">{t.recovery}</h2><p>{t.recoveryHint}</p>
  {!recovery.resolved && <button className={control} disabled={busy} onClick={() => void verify()}>{t.verify}</button>}
  {recovery.resolved && <button className={control} disabled={busy} onClick={() => setRecovery(undefined)}>{t.dismissRecovery}</button>}
  {recovery.checked && <><label className="block" htmlFor={`${recoveryId}-local`}>{t.localCopy}</label><textarea id={`${recoveryId}-local`} className={`${control} block w-full`} dir="ltr" readOnly value={JSON.stringify(recovery.local, null, 2)}/>
   <label className="block" htmlFor={`${recoveryId}-server`}>{t.serverCopy}</label><textarea id={`${recoveryId}-server`} className={`${control} block w-full`} dir="ltr" readOnly value={recovery.remote ? JSON.stringify(recovery.remote, null, 2) : t.notStored}/>
   {!recovery.resolved && <button className={control} disabled={busy} onClick={() => { const d = recovery.remote ?? recovery.local; setDraft(structuredClone(d)); setBaseline(recovery.remote); setRecovery({ ...recovery, resolved: true }); }}>{t.editVerified}</button>}</>}
 </section>;
 if (!context || recovery && !recovery.checked && (error === t.error || error === t.cancelled)) return <div className="space-y-3">{recoveryPanel}{error ? <p role="alert">{error}</p> : <><p role="status">{t.loading}</p><button className={control} onClick={cancel}>{t.cancel}</button></>}</div>;
 return <div ref={container} className="space-y-5"><h2 className="text-xl break-words">{context.group.name}</h2>{error && <p role="alert">{error}</p>}{recoveryPanel}
  {adapter.drafts && !draft && !recovery && <section aria-label={t.draftList} className="space-y-3"><h2 className="text-xl">{t.draftList}</h2>{drafts?.rows.map(d => <button key={d.id} className={control} disabled={busy} onClick={() => void operation(s => adapter.open!(scope, d.id, s), value => { setDraft(value); setBaseline(value); })}>{d.name || t.untitled} · {d.track} · {t.revision}: {d.revision}</button>)}<div className="flex gap-2"><button className={control} disabled={busy || !cursor} onClick={() => setCursor(undefined)}>{t.first}</button><button className={control} disabled={busy || !drafts?.next} onClick={() => setCursor(drafts!.next!)}>{t.next}</button></div></section>}
  {adapter.drafts && draft && <button className={control} disabled={busy || JSON.stringify(draft) !== JSON.stringify(baseline) || !!recovery} onClick={() => void operation(s => adapter.drafts!(scope, cursor, s), list => { setDrafts(list); setDraft(undefined); setBaseline(undefined); setRecovery(undefined); })}>{t.draftList}</button>}
  {busy && <div><p role="status">{t.busy}</p><button className={control} onClick={cancel}>{t.cancel}</button></div>}
  {preview ? <div ref={region}><StudentPreview data={preview} t={t} locale={locale} close={() => { setPreview(undefined); requestAnimationFrame(() => [...(container.current?.querySelectorAll('button') ?? [])].find(b => b.textContent === t.preview)?.focus()); }}/></div> :
   draft ? <AuthoringView draft={draft} parts={adapter.parts} practicals={adapter.practicals} t={t} busy={busy || !!recovery && !recovery.resolved} assignments={adapter.service !== 'sql'} saveBlocked={!!recovery} dirty={JSON.stringify(draft) !== JSON.stringify(baseline)} issues={issues} plan={plan} receipt={receipt} discarding={discarding} change={change}
    save={() => void operation(s => adapter.save(scope, draft, s), d => { setDraft(d); setBaseline(d); setPlan(undefined); })}
    preview={() => { if (validate()) { setPlan(undefined); setPreview(studentPreview(draft, adapter.parts, adapter.practicals)); } }}
    prepare={() => { if (validate()) void operation(s => adapter.prepare(scope, draft, s), setPlan); }}
    confirm={() => plan && void operation(s => adapter.confirm(scope, plan.token, s), () => { setPlan(undefined); setReceipt(true); })}
    cancelReview={() => setPlan(undefined)} paging={cursor => plan && void operation(s => adapter.targets(scope, plan.token, cursor, s), targets => setPlan({ ...plan, targets }))}
    discard={() => setDiscarding(true)} keep={() => setDiscarding(false)} confirmDiscard={() => { change(baseline ? structuredClone(baseline) : newDraft(draft.track)); }}/>
   : <div className="flex flex-wrap gap-2"><button className={control} disabled={busy} onClick={() => { setDraft(newDraft()); setBaseline(undefined); }}>{t.create}</button><button className={control} disabled={busy || !adapter.practicals?.length} onClick={() => { setDraft(newDraft('full-practical')); setBaseline(undefined); }}>{t.createPractical}</button></div>}
 </div>;
}
/** A replacement authenticated adapter remounts before any old private state is displayed. */
function useAdapterIdentity(adapter: AuthoringAdapter) {
 const [identity, setIdentity] = useState({ adapter, generation: 0 });
 if (identity.adapter !== adapter) setIdentity({ adapter, generation: identity.generation + 1 });
 return identity.generation;
}
export function AuthoringSession(props: { adapter: AuthoringAdapter; scope: Scope; locale: 'en' | 'ar' }) {
 const generation = useAdapterIdentity(props.adapter);
 return <ScopedSession key={`${props.scope.actorId}:${props.scope.groupId}:${generation}`} {...props}/>;
}
export function GroupPicker(props: { adapter: AuthoringAdapter; actorId: string; select(id: string): void; t: Copy }) {
 const generation = useAdapterIdentity(props.adapter);
 return <ScopedGroupPicker key={`${props.actorId}:${generation}`} {...props}/>;
}
function ScopedGroupPicker({ adapter, actorId, select, t }: { adapter: AuthoringAdapter; actorId: string; select(id: string): void; t: Copy }) {
 const [data, setData] = useState<Page<Group>>(), [cursor, setCursor] = useState<string>(), [error, setError] = useState<string>();
 useEffect(() => { const c = new AbortController(); const release = adapter.subscribe?.(() => { c.abort(); setData(undefined); setError(t.denied); }); adapter.groups(actorId, cursor, c.signal).then(d => { if (!c.signal.aborted) setData(d); }).catch(e => { if (!c.signal.aborted) setError(failure(e, t)); }); return () => { c.abort(); release?.(); }; }, [adapter, actorId, cursor, t]);
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

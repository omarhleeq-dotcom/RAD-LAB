import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { ReviewError, type Command, type Query, type ReviewAdapter, type Snapshot } from './contracts';
import { copy, type ReviewCopy } from './copy';
import { control, SupervisorReview } from './SupervisorReview';
import { createSyntheticReview } from './synthetic';
type Props = { adapter: ReviewAdapter; actorId: string; groupId?: string; selectGroup: (id: string) => void; locale: 'en' | 'ar'; text?: ReviewCopy };
export function ReviewSession(props: Props) {
 return <Session key={props.actorId} {...props}/>;
}
function Session({ adapter, actorId, groupId, selectGroup, locale, text }: Props) {
 const t = text ?? copy[locale], actor = adapter.accounts.find(p => p.id === actorId);
 const [pages, setPages] = useState<Query>({ actorId, groupId });
 // Preserve the groups page when selecting one of its rows. Per-group cursors
 // cannot follow a different group; the derived query clears its data immediately.
 const query = useMemo<Query>(() => ({ ...pages, actorId, groupId,
  ...(pages.groupId !== groupId ? { requestsCursor: undefined, membersCursor: undefined, resultsCursor: undefined } : {}),
 }), [pages, actorId, groupId]);
 const [loaded, setLoaded] = useState<{ value: Snapshot; adapter: ReviewAdapter; query: Query; revision: number }>(), [error, setError] = useState<string>(), [busy, setBusy] = useState(false), [revision, setRevision] = useState(0), [receipt, setReceipt] = useState<{ code?: string; groupId?: string }>(), [confirming, setConfirming] = useState<Command>();
 const data = loaded?.adapter === adapter && loaded.query === query && loaded.revision === revision ? loaded.value : undefined;
 const request = useRef<AbortController | null>(null), action = useRef<AbortController | null>(null), mounted = useRef(true), generation = useRef(0), applying = useRef(false);
 useLayoutEffect(() => {
  mounted.current = true;
  return () => { mounted.current = false; request.current?.abort(); action.current?.abort(); };
 }, []);
 useLayoutEffect(() => adapter.subscribe?.(() => {
  generation.current++; request.current?.abort(); setLoaded(undefined); setReceipt(undefined); setConfirming(undefined);
  if (!applying.current) setError(t.denied);
 }), [adapter, t]);
 useLayoutEffect(() => {
  const controller = new AbortController(), version = ++generation.current;
  request.current?.abort(); request.current = controller;
  adapter.read(query, controller.signal).then(value => {
   if (mounted.current && !controller.signal.aborted && version === generation.current) setLoaded({ value, adapter, query, revision });
  }).catch(e => {
   if (mounted.current && !controller.signal.aborted && version === generation.current) { setLoaded(undefined); setReceipt(undefined); setError(e instanceof ReviewError ? t[e.reason] : t.offline); }
  });
  return () => { controller.abort(); };
 }, [adapter, query, revision, t]);
 useEffect(() => {
  if (!data || !Number.isFinite(data.visibilityUntil)) return;
  const started = performance.now();
  let timer: ReturnType<typeof setTimeout>;
  const tick = () => {
   const remaining = data.visibilityUntil - data.now - (performance.now() - started);
   if (remaining > 0) { timer = setTimeout(tick, Math.min(remaining, 2147483647)); return; }
   generation.current++; request.current?.abort(); setLoaded(undefined); setReceipt(undefined); setConfirming(undefined); setError(t.expired);
  };
  tick(); return () => clearTimeout(timer);
 }, [data, t]);
 function chooseGroup(id: string) { generation.current++; request.current?.abort(); setLoaded(undefined); setReceipt(undefined); setConfirming(undefined); setError(undefined); selectGroup(id); }
 function refresh() { generation.current++; request.current?.abort(); setLoaded(undefined); setReceipt(undefined); setConfirming(undefined); setError(undefined); setRevision(v => v + 1); }
 async function execute(command: Command) {
  if (applying.current) return;
  applying.current = true; generation.current++; request.current?.abort();
  const controller = new AbortController(); action.current = controller;
  setLoaded(undefined); setReceipt(undefined); setError(undefined); setConfirming(undefined); setBusy(true);
  try { const result = await adapter.execute(actorId, command, controller.signal); if (mounted.current && !controller.signal.aborted) { setReceipt(result); setError(undefined); setRevision(v => v + 1); } }
  catch (e) { if (mounted.current && !controller.signal.aborted) setError(e instanceof ReviewError ? t[e.reason] : t.offline); }
  finally { applying.current = false; if (mounted.current && !controller.signal.aborted) setBusy(false); }
 }
 function act(c: Command) { if (c.kind === 'end' || c.kind === 'revoke' || c.kind === 'leave' || c.kind === 'revoke-code') setConfirming(c); else void execute(c); }
 if (!actor) return <p role="alert">{t.denied}</p>;
 return <div className="space-y-4"><div className="flex flex-wrap gap-2"><button className={control} onClick={refresh} disabled={busy}>{t.retry}</button>{groupId && <button className={control} disabled={busy} onClick={() => chooseGroup('')}>{t.group}</button>}</div>{error && <p role="alert">{error}</p>}{!data && !error && <p role="status">{busy ? t.saving : t.loading}</p>}{data && <SupervisorReview t={t} actor={actor} data={data} code={receipt?.groupId && data.codeGroupId !== receipt.groupId ? undefined : receipt?.code} locale={locale} act={act} confirming={confirming} confirm={() => confirming && void execute(confirming)} cancel={() => setConfirming(undefined)} selectGroup={chooseGroup} paging={(key, value) => { generation.current++; request.current?.abort(); setLoaded(undefined); setReceipt(undefined); setConfirming(undefined); setPages(q => ({ ...q, groupId, [key]: value })); }}/>}</div>;
}
/** Mounted only by the local review harness. Never imported by app routes or pilot auth. */
export function LocalSupervisorReview({ locale = 'en' }: { locale?: 'en' | 'ar' }) {
 const [fixture] = useState(() => createSyntheticReview());
 const [actorId, setActorId] = useState(fixture.adapter.accounts[1]!.id), [groupId, setGroupId] = useState<string>(), [epoch, setEpoch] = useState(0);
 const t = copy[locale];
 return <main className="platform-page mx-auto max-w-5xl space-y-6 px-4 py-8"><header className="space-y-3"><h1 className="text-3xl font-bold">{t.title}</h1><p className="rounded-xl border border-line bg-panel p-4">{t.notice}</p></header><section className="space-y-3"><h2 className="text-xl font-semibold">{t.controls}</h2><label className="block">{t.account}<select value={actorId} className={`${control} mt-1 block w-full`} onChange={e => { setActorId(e.target.value); setGroupId(undefined); }}>{fixture.adapter.accounts.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select></label><label className="block">{t.scenario}<select className={`${control} mt-1 block w-full`} onChange={e => { fixture.scenario(e.target.value as 'normal' | 'slow' | 'offline' | 'conflict'); setEpoch(v => v + 1); }}><option value="normal">{t.normal}</option><option value="slow">{t.slow}</option><option value="offline">{t.error}</option><option value="conflict">{t.conflictMode}</option></select></label><div className="flex flex-wrap gap-2"><button className={control} onClick={() => { fixture.expire(); setEpoch(v => v + 1); }}>{t.expire}</button><button className={control} onClick={() => { fixture.revoke(actorId); setEpoch(v => v + 1); }}>{t.revokeScenario}</button></div></section><ReviewSession key={`${actorId}:${groupId}:${epoch}`} adapter={fixture.adapter} actorId={actorId} groupId={groupId} selectGroup={setGroupId} locale={locale}/><details className="rounded-xl border border-line bg-panel p-4"><summary className="min-h-11 cursor-pointer">{t.consent}</summary><p>{t.consentText}</p></details></main>;
}

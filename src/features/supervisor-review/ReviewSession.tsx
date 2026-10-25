import { useEffect, useRef, useState } from 'react';
import { ReviewError, type Command, type Query, type ReviewAdapter, type Snapshot } from './contracts';
import { copy } from './copy';
import { control, SupervisorReview } from './SupervisorReview';
import { createSyntheticReview } from './synthetic';
export function ReviewSession({ adapter, actorId, groupId, selectGroup, locale }: { adapter: ReviewAdapter; actorId: string; groupId?: string; selectGroup: (id: string) => void; locale: 'en' | 'ar' }) {
 const t = copy[locale], actor = adapter.accounts.find(p => p.id === actorId)!;
 const [query, setQuery] = useState<Query>({ actorId, groupId });
 const [data, setData] = useState<Snapshot>(), [error, setError] = useState<string>(), [busy, setBusy] = useState(false), [revision, setRevision] = useState(0), [code, setCode] = useState<string>(), [confirming, setConfirming] = useState<Command>();
 const request = useRef<AbortController | null>(null), mounted = useRef(true);
 useEffect(() => { mounted.current = true; return () => { mounted.current = false; request.current?.abort(); }; }, []);
 useEffect(() => {
  const controller = new AbortController(); request.current?.abort(); request.current = controller;
  adapter.read(query, controller.signal).then(setData).catch(e => { if (!controller.signal.aborted) setError(e instanceof ReviewError ? t[e.reason] : t.offline); });
  return () => controller.abort();
 }, [adapter, query, revision, t]);
 // Hide before painting a response beyond the nearest visibility boundary. Remount also cancels reads/actions.
 useEffect(() => {
  if (!data || !Number.isFinite(data.visibilityUntil)) return;
  const started = performance.now();
  let timer: ReturnType<typeof setTimeout>;
  const tick = () => {
   const remaining = data.visibilityUntil - data.now - (performance.now() - started);
   if (remaining > 0) { timer = setTimeout(tick, Math.min(remaining, 2147483647)); return; }
   setData(undefined); setCode(undefined); setError(t.expired); request.current?.abort();
  };
  tick();
  return () => clearTimeout(timer);
 }, [data, t]);
 function refresh() { setData(undefined); setCode(undefined); setError(undefined); setRevision(v => v + 1); }
 async function execute(command: Command) {
  if (busy) return;
  request.current?.abort(); const controller = new AbortController(); request.current = controller;
  setData(undefined); setCode(undefined); setError(undefined); setConfirming(undefined); setBusy(true);
  try { const result = await adapter.execute(actorId, command, controller.signal); if (mounted.current && !controller.signal.aborted) { setCode(result.code); setRevision(v => v + 1); } }
  catch (e) { if (mounted.current && !controller.signal.aborted) setError(e instanceof ReviewError ? t[e.reason] : t.offline); }
  finally { if (mounted.current && !controller.signal.aborted) setBusy(false); }
 }
 function act(c: Command) { if (c.kind === 'end' || c.kind === 'revoke' || c.kind === 'leave') setConfirming(c); else void execute(c); }
 return <div className="space-y-4"><button className={control} onClick={refresh} disabled={busy}>{t.retry}</button>{error && <p role="alert">{error}</p>}{!data && !error && <p role="status">{busy ? t.saving : t.loading}</p>}{data && <SupervisorReview t={t} actor={actor} data={data} code={code} locale={locale} act={act} confirming={confirming} confirm={() => confirming && void execute(confirming)} cancel={() => setConfirming(undefined)} selectGroup={selectGroup} paging={(key, value) => { setData(undefined); setCode(undefined); setConfirming(undefined); setQuery(q => ({ ...q, [key]: value })); }}/>}</div>;
}
/** Mounted only by the local review harness. Never imported by app routes or pilot auth. */
export function LocalSupervisorReview({ locale = 'en' }: { locale?: 'en' | 'ar' }) {
 const [fixture] = useState(() => createSyntheticReview());
 const [actorId, setActorId] = useState(fixture.adapter.accounts[1]!.id), [groupId, setGroupId] = useState<string>(), [epoch, setEpoch] = useState(0);
 const t = copy[locale];
 return <main className="platform-page mx-auto max-w-5xl space-y-6 px-4 py-8"><header className="space-y-3"><h1 className="text-3xl font-bold">{t.title}</h1><p className="rounded-xl border border-line bg-panel p-4">{t.notice}</p></header><section className="space-y-3"><h2 className="text-xl font-semibold">{t.controls}</h2><label className="block">{t.account}<select value={actorId} className={`${control} mt-1 block w-full`} onChange={e => { setActorId(e.target.value); setGroupId(undefined); }}>{fixture.adapter.accounts.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select></label><label className="block">{t.scenario}<select className={`${control} mt-1 block w-full`} onChange={e => { fixture.scenario(e.target.value as 'normal' | 'slow' | 'offline' | 'conflict'); setEpoch(v => v + 1); }}><option value="normal">{t.normal}</option><option value="slow">{t.slow}</option><option value="offline">{t.error}</option><option value="conflict">{t.conflictMode}</option></select></label><div className="flex flex-wrap gap-2"><button className={control} onClick={() => { fixture.expire(); setEpoch(v => v + 1); }}>{t.expire}</button><button className={control} onClick={() => { fixture.revoke(actorId); setEpoch(v => v + 1); }}>{t.revokeScenario}</button></div></section><ReviewSession key={`${actorId}:${groupId}:${epoch}`} adapter={fixture.adapter} actorId={actorId} groupId={groupId} selectGroup={setGroupId} locale={locale}/><details className="rounded-xl border border-line bg-panel p-4"><summary className="min-h-11 cursor-pointer">{t.consent}</summary><p>{t.consentText}</p></details></main>;
}

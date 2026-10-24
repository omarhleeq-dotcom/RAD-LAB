"use client";
import { useEffect, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { EXAMS, getExam } from "@/data/exams";
import { localize } from "@/lib/localized";
import { Link } from "@/i18n/navigation";
import { ResultDisclosure } from "@/features/evaluation/ResultDisclosure";
import { useSavedResults } from "./useSavedResults";
import { rankLastResults, savedExamResults } from "./saved-results";
import { PILOT } from "./config";
import { useSessionAccount } from "./SessionGate";
import { comparableAttempts, comparisonMessage, type Trainee, type TrainingAttempt, type TrainingExam, type TrainingRequest } from "./training";
import { TrainingReadStatus, trainingButton as button, useTraining } from "./TrainingSummary";

function useTrainingLabels() {
  const t = useTranslations("training"), locale = useLocale();
  return { t, date: (value: string) => new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeStyle: "short" }).format(new Date(value)),
    exam: (id: string) => { const def = getExam(id); return def ? localize(def.title, locale) : t("archivedExam"); } };
}
function useSavedReason() {
  const locale = useLocale(), t = useTranslations("training");
  return (a: TrainingAttempt) => {
    if (a.result.passed) return "";
    if (!a.result.critical.length) return t("noCriticalSaved");
    return a.result.critical.map(id => {
      const label = getExam(a.exam)?.scoring.criticalFindings.find(f => f.id === id)?.label;
      return label ? localize(label, locale) : t("unknownCriticalSaved");
    }).join(" / ");
  };
}
function Results({ rows }: { rows: TrainingAttempt[] }) {
  const { t, date } = useTrainingLabels();
  const locale = useLocale(), reason = useSavedReason();
  const categories = useTranslations("categories");
  const points = comparableAttempts(rows);
  const message = comparisonMessage(rows);
  const [active, setActive] = useState<TrainingAttempt | null>(null);
  const xy = points.map((a, i) => [90 + i * 470 / Math.max(1, points.length - 1), 155 - a.result.total * 1.25]);
  const pointText = (a: TrainingAttempt) => `${date(a.time)} · ${t("scoreValue", { score: a.result.total })} · ${a.result.passed ? "✓" : "✕"} ${t(a.result.passed ? "passedShort" : "notPassedShort")}${reason(a) ? ` · ${reason(a)}` : ""}`;
  return <>
    <h4 className="mt-3 font-semibold">{t("trend")}</h4>
    <div className="training-intro mt-1"><p className="text-sm text-muted">{t("trendShort")}</p><ResultDisclosure title={<span aria-hidden="true">ⓘ</span>} label={t("aboutChart")}><p>{t("trendHint")}</p></ResultDisclosure></div>
    {points.length >= 2 ? <figure className="my-3 rounded-lg border border-line bg-paper p-2" data-testid="training-chart">
      <div className="saved-chart">
        <svg viewBox="0 0 600 190" role="img" aria-label={t("chartLabel")} className="w-full" style={{ direction: "ltr" }}>
          {[0, 50, 100].map(value => <g key={value}><text x="55" y={160 - value * 1.25} textAnchor="end" fontSize="24" fill="currentColor">{value}</text><line x1="75" y1={155 - value * 1.25} x2="575" y2={155 - value * 1.25} stroke="currentColor" opacity="0.15" /></g>)}
          <polyline points={xy.map(p => p.join(",")).join(" ")} fill="none" stroke="currentColor" opacity=".4" strokeWidth="2" />
          <text x="90" y="185" fontSize="24" fill="currentColor">{t("earlier")}</text><text x="560" y="185" textAnchor="end" fontSize="24" fill="currentColor">{t("later")}</text>
        </svg>
        {xy.map(([x, y], i) => <button key={points[i]!.id} type="button" className={`saved-chart-point ${points[i]!.result.passed ? "is-passed" : "is-failed"}`}
          style={{ left: `${x! / 6}%`, top: `${y! / 1.9}%` }} aria-label={pointText(points[i]!)} aria-pressed={active?.id === points[i]!.id}
          onClick={() => setActive(points[i]!)} onFocus={() => setActive(points[i]!)}>{points[i]!.result.passed ? "✓" : "✕"}</button>)}
      </div>
      <figcaption className="text-sm">{t("chartCount", { count: points.length })}</figcaption>
      <p role="status" className="mt-2 text-sm min-h-11">{active ? pointText(active) : t("tapPoint")}</p>
    </figure> : <p className="my-3 rounded-md bg-paper p-3" data-testid="training-chart-reason">{t(message!)}</p>}
    {points.length >= 2 && points.length < rows.length && <p className="my-3 text-sm text-muted" data-testid="training-chart-separated">{t("separateComparison")}</p>}
    <ul className="divide-y divide-line" data-testid="training-history">
      {rows.map(a => <li key={a.id} data-testid="training-attempt">
        <ResultDisclosure title={<span className="attempt-line"><time dateTime={a.time}>{new Intl.DateTimeFormat(locale, { dateStyle: "short" }).format(new Date(a.time))}</time><span>· <bdi>{a.result.total}</bdi> ·</span><span className={a.result.passed ? "is-passed" : "is-failed"} aria-label={t(a.result.passed ? "passedShort" : "notPassedShort")}>{a.result.passed ? "✓" : "✕"}</span>{!a.result.passed && <span className="attempt-reason" title={reason(a)}>· {reason(a)}</span>}</span>}>
          <p className="text-sm">{pointText(a)}</p><p className="mt-2 text-sm text-muted">{t("savedResult")}</p>
          <h5 className="mt-3 font-semibold">{t("categories")}</h5>
          {a.result.categories.length ? <dl className="mt-2 space-y-2">{a.result.categories.map((c, i) => <div key={i}><dt className="text-sm">{categories.has(c.c) ? categories(c.c) : t("otherCategory")}</dt><dd><bdi>{c.earned} / {c.weight}</bdi><meter className="block w-full" min={0} max={c.weight} value={c.earned} aria-label={categories.has(c.c) ? categories(c.c) : t("otherCategory")} /></dd></div>)}</dl> : <p>{t("noCategories")}</p>}
        </ResultDisclosure>
      </li>)}
    </ul>
  </>;
}
function Paged({ request, onPerson, onExam }: { request: TrainingRequest; onPerson?: (p: Trainee) => void; onExam?: (e: string) => void }) {
  const { t, date, exam } = useTrainingLabels();
  const [position, setPosition] = useState<{ cursor: Record<string, string> | null; boundary: string | null }>({ cursor: null, boundary: null });
  const { page, error, retry } = useTraining({ ...request, ...position });
  const heading = useRef<HTMLHeadingElement>(null), moved = useRef(false);
  useEffect(() => { if ((page || error) && moved.current) { heading.current?.focus(); moved.current = false; } }, [page, error]);
  function first() { moved.current = true; setPosition({ cursor: null, boundary: null }); retry(); }
  return <section className="mt-5" aria-busy={!page && !error} data-testid={`training-${request.view}`}>
    <div className="flex flex-wrap items-center justify-between gap-3"><h2 ref={heading} tabIndex={-1} className="text-xl font-semibold">{t(request.view === "people" ? "trainees" : request.view === "exams" ? "byExam" : "history")}</h2><button type="button" className={button} onClick={first}>{t(position.cursor ? "first" : "refresh")}</button></div>
    {!page ? <TrainingReadStatus error={error} retry={retry} /> : <>
      {page.rows.length === 0 && <p role="status" className="mt-3 text-sm text-muted">{t("empty")}</p>}
      {request.view === "history" ? (page.rows.length ? <Results rows={page.rows as TrainingAttempt[]} /> : null) : <ul className="mt-4 grid gap-3 sm:grid-cols-2">
        {request.view === "people" ? (page.rows as Trainee[]).map((p) => <li key={p.id} className="min-w-0 rounded-lg border border-line bg-panel p-4">
          <h3 className="text-lg font-semibold"><button className="min-h-11 max-w-full text-start text-brand underline [overflow-wrap:anywhere]" onClick={() => onPerson?.(p)}><bdi>{p.name ?? t("unnamed")}</bdi></button></h3>
          <p className="break-all text-sm text-muted"><bdi>{p.email}</bdi></p><p className="mt-2 text-sm">{t(`status.${p.status}`)}</p>
          <p className="mt-2">{t("personCounts", { attempts: p.attempts, exams: p.exams })}</p><p className="mt-2 text-sm text-muted">{t("latest")}: {p.latest ? date(p.latest) : t("none")}</p>
        </li>) : (page.rows as TrainingExam[]).map((e) => <li key={e.exam} className="rounded-lg border border-line bg-panel p-4"><h3 className="text-lg font-semibold"><button className="min-h-11 text-start text-brand underline" onClick={() => onExam?.(e.exam)}>{exam(e.exam)}</button></h3><p className="mt-2">{t("attemptCount", { count: e.attempts })}</p><p className="mt-2 text-sm text-muted">{date(e.latest)}</p></li>)}
      </ul>}
      {page.next && <button className={`mt-5 ${button}`} onClick={() => { moved.current = true; setPosition({ cursor: page.next, boundary: page.boundary }); }}>{t("next")}</button>}
    </>}
  </section>;
}
function PersonTraining({ request }: { request: TrainingRequest }) {
  const { t, date, exam } = useTrainingLabels();
  const { data, error, refresh, loadOlder, busy } = useSavedResults(request.user ?? null, request.scope, request.days);
  const groups = savedExamResults(data?.rows ?? []);
  const ranked = rankLastResults(data?.rows ?? []);
  const registered = new Set(EXAMS.map(e => e.id));
  const passed = data?.rows.filter(r => r.result.passed).length ?? 0;
  const strongest = ranked.at(-1), weakest = ranked[0];
  return <section className="mt-4" aria-busy={busy || (!data && !error)}>
    <div className="flex items-center justify-between gap-3"><h2>{t("overall")}</h2>{data && <button type="button" className={button} disabled={busy} onClick={refresh}>{t("refresh")}</button>}</div>
    {!data ? <TrainingReadStatus error={error} retry={refresh} /> : <>
      <div className="overall-card" data-testid="training-overall">
        <p className="text-lg font-semibold">{t("passedOf", { passed, count: data.rows.length })}</p>
        <p>{t("examsOf", { count: groups.filter(g => registered.has(g.exam)).length, available: EXAMS.length })}</p>
        {strongest && <p>{t("strongest")}: {exam(strongest.exam)} · <bdi>{strongest.last.result.total}</bdi> {strongest.last.result.passed ? "✓" : "✕"}</p>}
        {weakest && <p>{t("weakest")}: {exam(weakest.exam)} · <bdi>{weakest.last.result.total}</bdi> {weakest.last.result.passed ? "✓" : "✕"}</p>}
        <p className="text-sm text-muted">{t(data.next ? "coveredRange" : "allSavedRange", { count: data.rows.length, total: data.summary.attempts, from: data.rows.at(-1) ? date(data.rows.at(-1)!.time) : t("none"), to: date(data.boundary) })}</p>
      </div>
      <ResultDisclosure title={t("showAll")} className="rounded-lg border border-line bg-panel">
        {groups.length === 0 ? <p>{t("empty")}</p> : <ul className="saved-exam-grid">{groups.map(g => <li key={g.exam} className="saved-exam-card">
          <h3>{exam(g.exam)}</h3>
          <p className="mt-2">{t("lastScore")}: <bdi>{g.last.result.total}</bdi> <span className={`saved-verdict ${g.last.result.passed ? "is-passed" : "is-failed"}`}>{g.last.result.passed ? "✓" : "✕"} {t(g.last.result.passed ? "passedShort" : "notPassedShort")}</span></p>
          <p>{t("bestScore")}: <bdi>{g.best}</bdi> · {t("attemptCount", { count: g.rows.length })}</p>
          <ResultDisclosure title={t("examDetails")}><Results rows={g.rows} /></ResultDisclosure>
        </li>)}</ul>}
      </ResultDisclosure>
      {data.next && <button type="button" className={`mt-4 ${button}`} disabled={busy} onClick={loadOlder}>{t("loadOlder")}</button>}
    </>}
  </section>;
}
function Workspace({ userId, owner }: { userId: string; owner: boolean }) {
  const { t } = useTrainingLabels();
  const [scope, setScope] = useState<"own" | "all">(owner ? "all" : "own");
  const [days, setDays] = useState<number | null>(null);
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState({ search: "", status: "" });
  const [person, setPerson] = useState<Trainee | null>(null);
  return <>
    {owner && <div className="my-5 flex flex-wrap gap-3" role="group" aria-label={t("scope")}>
      {(["all", "own"] as const).map((s) => <button key={s} aria-pressed={scope === s} className={`${button} ${scope === s ? "bg-paper ring-2 ring-brand" : ""}`} onClick={() => { setScope(s); setPerson(null); }}>{t(s === "all" ? "follow" : "mine")}</button>)}
      <Link href="/owner" className={button}>{t("manage")}</Link>
    </div>}
    <label className="mt-4 block">{t("period")}<select className="ms-3 rounded-md border border-line bg-panel px-3 py-2" value={days ?? ""} onChange={(e) => setDays(e.target.value ? Number(e.target.value) : null)}><option value="">{t("allTime")}</option>{[7, 30, 90].map((d) => <option key={d} value={d}>{t("days", { count: d })}</option>)}</select></label>
    {scope === "own" ? <PersonTraining key={`own-${days}`} request={{ view: "exams", scope: "own", user: userId, days }} /> : <>
      <div hidden={person !== null}>
        <form className="mt-5 flex flex-wrap items-end gap-3" onSubmit={(e) => { e.preventDefault(); setFilters((f) => ({ ...f, search: search.trim() })); }}>
          <label className="min-w-0 flex-1">{t("search")}<input type="search" maxLength={100} value={search} onChange={(e) => setSearch(e.target.value)} className="mt-1 block w-full rounded-md border border-line bg-panel px-3 py-2" /></label>
          <label>{t("accountStatus")}<select className="mt-1 block rounded-md border border-line bg-panel px-3 py-2" value={filters.status} onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value }))}><option value="">{t("allStatus")}</option>{["approved", "pending", "suspended"].map((s) => <option key={s} value={s}>{t(`status.${s}`)}</option>)}</select></label>
          <button className={button}>{t("apply")}</button>
        </form>
        <Paged key={JSON.stringify([filters, days])} request={{ view: "people", scope: "all", days, ...filters }} onPerson={setPerson} />
      </div>
      {person && <div className="mt-5"><button className={button} onClick={() => setPerson(null)}>{t("backPeople")}</button><h2 className="mt-4 text-2xl font-semibold [overflow-wrap:anywhere]"><bdi>{person.name ?? t("unnamed")}</bdi></h2><p className="break-all text-sm text-muted"><bdi>{person.email}</bdi></p><PersonTraining key={`${person.id}-${days}`} request={{ view: "exams", scope: "all", user: person.id, days }} /></div>}
    </>}
  </>;
}
export function MyAttempts() {
  const t = useTranslations("training");
  const { state } = useSessionAccount();
  if (!PILOT) return <p data-testid="training-off">{t("notEnabled")}</p>;
  if (state.kind !== "signedIn" || state.profile.status !== "approved") return <p role="status">{t("loading")}</p>;
  return <Workspace key={`${state.userId}-${state.profile.role}`} userId={state.userId} owner={state.profile.role === "owner"} />;
}

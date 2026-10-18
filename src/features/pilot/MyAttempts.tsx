"use client";
import { useEffect, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { getExam } from "@/data/exams";
import { localize } from "@/lib/localized";
import { Link } from "@/i18n/navigation";
import { PILOT } from "./config";
import { useSessionAccount } from "./SessionGate";
import { comparableAttempts, type Trainee, type TrainingAttempt, type TrainingExam, type TrainingRequest } from "./training";
import { SummaryCards, TrainingReadStatus, trainingButton as button, useTraining } from "./TrainingSummary";

function useTrainingLabels() {
  const t = useTranslations("training"), locale = useLocale();
  return { t, date: (value: string) => new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeStyle: "short" }).format(new Date(value)),
    exam: (id: string) => { const def = getExam(id); return def ? localize(def.title, locale) : t("archivedExam"); } };
}
function Results({ rows }: { rows: TrainingAttempt[] }) {
  const { t, date } = useTrainingLabels();
  const categories = useTranslations("categories");
  const points = comparableAttempts(rows);
  const values = points.map((a) => a.result.total);
  const low = Math.min(0, ...values), high = Math.max(100, ...values);
  const xy = points.map((a, i) => [30 + i * 540 / Math.max(1, points.length - 1), 150 - (a.result.total - low) / (high - low) * 120]);
  return <>
    <h3 className="mt-5 text-lg font-semibold">{t("trend")}</h3>
    <p className="mt-2 text-sm text-muted">{t("trendHint")}</p>
    {points.length >= 2 ? <figure className="my-4 rounded-lg border border-line bg-paper p-3" data-testid="training-chart">
      <svg viewBox="0 0 600 190" role="img" aria-label={t("chartLabel")} className="w-full" style={{ direction: "ltr" }}>
        <line x1="30" y1="150" x2="570" y2="150" stroke="currentColor" opacity="0.3" />
        <polyline points={xy.map((p) => p.join(",")).join(" ")} fill="none" stroke="currentColor" strokeWidth="3" />
        {xy.map(([x, y], i) => <circle key={points[i]!.id} cx={x} cy={y} r="4" fill="currentColor"><title>{date(points[i]!.time)}: {points[i]!.result.total}</title></circle>)}
        <text x="30" y="180" fontSize="12" fill="currentColor">{t("earlier")}</text><text x="570" y="180" textAnchor="end" fontSize="12" fill="currentColor">{t("later")}</text>
      </svg>
      <figcaption className="text-sm">{t("chartCount", { count: points.length })}</figcaption>
      <details className="mt-2"><summary className="cursor-pointer py-2 text-brand">{t("chartValues")}</summary><ol className="space-y-2">{points.map((a) => <li key={a.id}>{date(a.time)} · <bdi>{a.result.total}</bdi></li>)}</ol></details>
    </figure> : <p className="my-4 rounded-md bg-paper p-3">{t("notComparable")}</p>}
    <ul className="mt-4 divide-y divide-line" data-testid="training-history">
      {rows.map((a) => <li key={a.id} className="py-4" data-testid="training-attempt">
        <details>
          <summary className="cursor-pointer rounded-md py-2 text-brand"><time dateTime={a.time}>{date(a.time)}</time> · {t("scoreValue", { score: a.result.total })} · {t(a.result.passed ? "passed" : "notPassed")}</summary>
          <p className="mt-2 text-sm text-muted">{t("savedResult")}</p>
          <h4 className="mt-3 font-semibold">{t("categories")}</h4>
          {a.result.categories.length ? <dl className="mt-2 grid gap-2 sm:grid-cols-2">{a.result.categories.map((c, i) => <div key={i} className="rounded-md bg-paper p-3"><dt>{categories.has(c.c) ? categories(c.c) : t("otherCategory")}</dt><dd><bdi>{c.earned} / {c.weight}</bdi></dd></div>)}</dl> : <p>{t("noCategories")}</p>}
          {a.result.critical.length > 0 && <p className="mt-3">{t("critical", { count: a.result.critical.length })}</p>}
        </details>
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
      <p role="status" className="mt-3 text-sm text-muted">{t(page.rows.length ? "pageCount" : "empty", { count: page.rows.length })}</p>
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
  const { t, exam } = useTrainingLabels();
  const [selected, setSelected] = useState<string | null>(null);
  const { page, error, retry } = useTraining({ ...request, view: "summary" });
  return <div>
    {selected === null && (page?.summary ? <SummaryCards data={page.summary} /> : <TrainingReadStatus error={error} retry={retry} />)}
    <div hidden={selected !== null}><Paged request={{ ...request, view: "exams" }} onExam={setSelected} /></div>
    {selected && <div><button className={button} onClick={() => setSelected(null)}>{t("backExams")}</button><h2 className="mt-4 text-xl font-semibold">{exam(selected)}</h2><Paged key={selected} request={{ ...request, view: "history", exam: selected }} /></div>}
  </div>;
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

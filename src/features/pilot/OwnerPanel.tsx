"use client";

// The owner's participant list with approve / suspend buttons (RAD-044a). Visible content depends on RLS + the database functions, not on
// this component: a non-owner who opens the page just gets "not allowed" because `owner_page_v1()` refuses them.
import { useTranslations } from "next-intl";
import { useState } from "react";
import { Link } from "@/i18n/navigation";
import type { ProfileStatus } from "./account-state";
import { getPilotClient } from "./client";
import { PILOT } from "./config";
import { CsvBar, ParticipantActivity } from "./OwnerActivity";
import { EMPTY_FILTERS, type Cursor, type OwnerFilters } from "./owner-data";
import { actionsFor, formatStamp, lastActivity, needsConfirmedEmail, type Participant, parseParticipants } from "./owner-state";
import { useAccount } from "./useAccount";
import { useOwnerData } from "./useOwnerData";
import { OwnerAssessPanel } from "@/features/assess/OwnerAssessPanel";

const badge: Record<ProfileStatus, string> = { pending: "bg-signal/30 text-ink", approved: "bg-ok/20 text-ink", suspended: "bg-bad/20 text-ink" };
const btn = "rounded-md border border-line px-3 py-1.5 text-sm font-medium hover:bg-paper disabled:opacity-60";

export function OwnerPanel() {
  const t = useTranslations("owner");
  const tt = useTranslations("training");
  const { state } = useAccount("");
  const [filters, setFilters] = useState<OwnerFilters>(EMPTY_FILTERS);
  const [cursor, setCursor] = useState<Cursor | null>(null);
  const [boundary, setBoundary] = useState<string | null>(null);
  const [error, setError] = useState<"load" | "action" | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [warn, setWarn] = useState<string | null>(null);

  const ownerId = state.kind === "signedIn" ? state.userId : "";
  const isOwner = state.kind === "signedIn" && state.profile.role === "owner" && state.profile.status === "approved";

  // The list is fetched in an effect (inside a promise callback); buttons ask for a re-fetch by bumping `version`.
  const [version, setVersion] = useState(0);
  const reload = () => { setCursor(null); setBoundary(null); setVersion((v) => v + 1); };

  const data = useOwnerData(isOwner, version, "participants", { ...filters, from: "", to: "" }, cursor, boundary);
  const ready = data.kind === "ready" ? data.page : null;
  const rows = ready ? parseParticipants(ready.rows) : null;
  const changeFilters = (f: OwnerFilters) => { setFilters(f); setCursor(null); setBoundary(null); };

  // Fixed numeric form (YYYY-MM-DD HH:mm, the owner's local time): Intl's Arabic output carries bidi marks that scramble the order.
  const when = (iso: string | null) => (iso === null ? t("never") : formatStamp(new Date(iso)));

  async function setStatus(p: Participant, target: ProfileStatus) {
    if (needsConfirmedEmail(p, target) && warn !== p.userId) return setWarn(p.userId); // first click only warns
    setBusy(p.userId);
    setWarn(null);
    const client = await getPilotClient();
    const { error: err } = (await client?.rpc("set_participant_status", { target: p.userId, new_status: target })) ?? { error: new Error("off") };
    setBusy(null);
    if (err) return setError("action");
    setError(null);
    reload();
  }

  if (!PILOT) return <p data-testid="owner-off" className="text-muted">{t("notEnabled")}</p>;
  if (state.kind === "loading") return <p role="status" className="text-muted">{t("loading")}</p>;
  if (state.kind === "signedOut") {
    return (
      <p data-testid="owner-signed-out">
        {t("signInFirst")} <Link href="/account" className="text-brand underline">{t("goAccount")}</Link>
      </p>
    );
  }
  if (!isOwner) return <p role="alert" data-testid="owner-denied" className="rounded-md border border-bad/40 bg-bad/10 px-3 py-2 text-bad">{t("denied")}</p>;

  const pending = ready?.pending ?? 0;
  return (
    <section aria-labelledby="owner-list" data-testid="owner-list">
      <p className="mb-4"><Link href="/training" className="text-brand underline">{tt("follow")}</Link></p>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 id="owner-list" className="text-xl font-semibold">{t("participants")}</h2>
        <button type="button" className={btn} onClick={reload}>{t("refresh")}</button>
      </div>
      {rows && <p className="mt-2 text-sm text-muted" data-testid="owner-summary">{t("summary", { total: ready?.total ?? 0, pending })}</p>}
      {error && <p role="alert" data-testid="owner-error" className="mt-3 rounded-md border border-bad/40 bg-bad/10 px-3 py-2 text-bad">{t(`errors.${error}`)}</p>}
      {data.kind === "error" && <p role="alert" data-testid="owner-data-error" className="mt-3 rounded-md border border-bad/40 bg-bad/10 px-3 py-2 text-bad">{t("errors.data")}</p>}
      <div className="my-3 flex flex-wrap gap-3">
        <label className="text-sm">{t("paging.participant")}
          <select data-testid="filter-participant" className="block max-w-full rounded border border-line bg-panel p-2" value={filters.participant}
            onChange={(e) => changeFilters({ ...filters, participant: e.target.value, participantCode: rows?.find((p) => p.userId === e.target.value)?.code ?? "" })}>
            <option value="">{t("paging.allParticipants")}</option>
            {filters.participant && !rows?.some((p) => p.userId === filters.participant) && <option value={filters.participant}>{filters.participantCode}</option>}
            {(rows ?? []).map((p) => <option key={p.userId} value={p.userId}>{p.code}</option>)}
          </select>
        </label>
        {(["exam", "from", "to"] as const).map((key) => <label key={key} className="text-sm">{t(`paging.${key}`)}
          <input data-testid={`filter-${key}`} type={key === "from" || key === "to" ? "date" : "text"} className="block max-w-full rounded border border-line bg-panel p-2" value={filters[key].slice(0, key === "from" || key === "to" ? 10 : undefined)}
            onChange={(e) => changeFilters({ ...filters, [key]: e.target.value ? key === "from" || key === "to" ? `${e.target.value}T${key === "to" ? "23:59:59.999999" : "00:00:00"}Z` : e.target.value : "" })} />
        </label>)}
      </div>
      <CsvBar key={JSON.stringify(filters)} filters={filters} />
      {ready && rows && rows.length !== ready.rows.length && <p role="status">{t("activity.skipped", { count: ready.rows.length - rows.length })}</p>}
      {data.kind === "loading" && <p role="status">{t("loading")}</p>}
      <div className="my-3 flex gap-2">
        <button className={btn} onClick={reload}>{t("paging.first")}</button>
        <button data-testid="participants-next" className={btn} disabled={!ready?.next} onClick={() => { setCursor(ready!.next); setBoundary(ready!.boundary); }}>{t("paging.next")}</button>
      </div>
      {rows?.length === 0 && <p className="mt-4 text-muted">{t("empty")}</p>}
      <ul className="mt-4 space-y-3">
        {(rows ?? []).map((p) => {
          const actions = actionsFor(p, ownerId);
          return (
            <li key={p.userId} data-testid={`participant-${p.code}`} className="rounded-lg border border-line bg-panel p-4">
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                <span dir="ltr" className="font-medium">{p.email}</span>
                <span dir="ltr" className="rounded bg-paper px-2 py-0.5 font-mono text-sm">{p.code}</span>
                <span className={`rounded-full px-2.5 py-0.5 text-sm font-medium ${badge[p.status]}`}>{t(`status.${p.status}`)}</span>
                {p.role === "owner" && <span className="text-sm text-muted">{t("ownerTag")}</span>}
              </div>
              <dl className="mt-2 grid gap-x-6 gap-y-1 text-sm text-muted sm:grid-cols-3">
                <div><dt className="inline">{t("emailLabel")}: </dt><dd className="inline">{p.emailConfirmed ? t("confirmed") : <strong className="text-warn">{t("unconfirmed")}</strong>}</dd></div>
                <div><dt className="inline">{t("registered")}: </dt><dd dir="ltr" className="inline">{when(p.createdAt)}</dd></div>
                <div><dt className="inline">{t("lastActivity")}: </dt><dd dir="ltr" className="inline">{when(lastActivity(p))}</dd></div>
              </dl>
              <ParticipantActivity key={`${p.userId}-${version}-${JSON.stringify(filters)}`} code={p.code} userId={p.userId} filters={filters} version={version} />
              {actions.length > 0 && (
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  {actions.map((a) => (
                    <button key={a} type="button" disabled={busy === p.userId} data-testid={`act-${a}-${p.code}`} className={btn} onClick={() => void setStatus(p, a)}>
                      {warn === p.userId && a === "approved" ? t("confirmApprove") : t(`actions.${a}`)}
                    </button>
                  ))}
                  {warn === p.userId && <span role="alert" className="text-sm text-warn">{t("warnUnconfirmed")}</span>}
                </div>
              )}
            </li>
          );
        })}
      </ul>
      <OwnerAssessPanel key={ownerId} />
    </section>
  );
}

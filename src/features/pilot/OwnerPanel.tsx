"use client";

// The owner's participant list with approve / suspend buttons (RAD-044a). Visible content depends on RLS + the database functions, not on
// this component: a non-owner who opens the page just gets "not allowed" because `owner_list_participants()` refuses them.
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { Link } from "@/i18n/navigation";
import type { ProfileStatus } from "./account-state";
import { getPilotClient } from "./client";
import { PILOT } from "./config";
import { actionsFor, formatStamp, lastActivity, needsConfirmedEmail, type Participant, parseParticipants } from "./owner-state";
import { useAccount } from "./useAccount";

const badge: Record<ProfileStatus, string> = { pending: "bg-signal/30 text-ink", approved: "bg-ok/20 text-ink", suspended: "bg-bad/20 text-ink" };
const btn = "rounded-md border border-line px-3 py-1.5 text-sm font-medium hover:bg-paper disabled:opacity-60";

export function OwnerPanel() {
  const t = useTranslations("owner");
  const { state } = useAccount("");
  const [rows, setRows] = useState<Participant[] | null>(null);
  const [error, setError] = useState<"load" | "action" | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [warn, setWarn] = useState<string | null>(null);

  const ownerId = state.kind === "signedIn" ? state.userId : "";
  const isOwner = state.kind === "signedIn" && state.profile.role === "owner" && state.profile.status === "approved";

  // The list is fetched in an effect (inside a promise callback); buttons ask for a re-fetch by bumping `version`.
  const [version, setVersion] = useState(0);
  const reload = () => setVersion((v) => v + 1);

  useEffect(() => {
    if (!isOwner) return;
    let cancelled = false;
    void getPilotClient()?.then(async (client) => {
      const { data, error: err } = await client.rpc("owner_list_participants");
      if (cancelled) return;
      if (err) return setError("load");
      setError(null);
      setRows(parseParticipants(data));
    });
    return () => {
      cancelled = true;
    };
  }, [isOwner, version]);

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

  const pending = (rows ?? []).filter((p) => p.status === "pending").length;
  return (
    <section aria-labelledby="owner-list" data-testid="owner-list">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 id="owner-list" className="text-xl font-semibold">{t("participants")}</h2>
        <button type="button" className={btn} onClick={reload}>{t("refresh")}</button>
      </div>
      {rows && <p className="mt-2 text-sm text-muted" data-testid="owner-summary">{t("summary", { total: rows.length, pending })}</p>}
      {error && <p role="alert" data-testid="owner-error" className="mt-3 rounded-md border border-bad/40 bg-bad/10 px-3 py-2 text-bad">{t(`errors.${error}`)}</p>}
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
    </section>
  );
}

"use client";

// Password reset screens (RAD-046): ask for a link, and choose a new password after following it. Messages: `account.forgot` / `account.reset`.
// The page never says whether an address has an account (Supabase answers the same either way); the password rule is the sign-up rule.
import { useTranslations } from "next-intl";
import { type FormEvent, useState } from "react";
import { type AuthErrorKey, passwordProblem } from "./account-state";
import type { ActionResult } from "./useAccount";

const field = "mt-1 block w-full rounded-md border border-line bg-panel px-3 py-2 text-base";
const primary = "rounded-md bg-brand px-4 py-2 font-semibold text-white hover:bg-brand-strong disabled:opacity-60";
const secondary = "rounded-md border border-line px-4 py-2";
const box = "rounded-lg border border-line bg-panel p-5";
type FormError = AuthErrorKey | "passwordShort" | "passwordClasses" | "passwordMismatch";

export function ForgotForm({ onRequest, onBack }: { onRequest: (email: string) => Promise<ActionResult>; onBack: () => void }) {
  const t = useTranslations("account");
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<FormError | null>(null);
  const [sentTo, setSentTo] = useState<string | null>(null);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    const result = await onRequest(email.trim());
    setBusy(false);
    if (!result.ok) return setError(result.error);
    setSentTo(email.trim());
  }

  if (sentTo) {
    return (
      <section className={box} data-testid="forgot-sent" aria-labelledby="forgot-sent-title">
        <h2 id="forgot-sent-title" className="text-xl font-semibold">{t("forgot.sentTitle")}</h2>
        <p className="mt-2">{t("forgot.sentBody", { email: sentTo })}</p>
        <p className="mt-2 text-sm text-muted">{t("forgot.sentSpam")}</p>
        <button type="button" className={`mt-4 ${secondary}`} onClick={onBack}>{t("forgot.back")}</button>
      </section>
    );
  }
  return (
    <section className={box} data-testid="forgot-form" aria-labelledby="forgot-title">
      <h2 id="forgot-title" className="text-xl font-semibold">{t("forgot.title")}</h2>
      <p className="mt-2 text-muted">{t("forgot.body")}</p>
      <form onSubmit={(e) => void submit(e)} noValidate className="mt-4 max-w-md space-y-4">
        <label className="block">
          {t("email")}
          <input type="email" required dir="ltr" autoComplete="email" inputMode="email" className={field} value={email} onChange={(e) => setEmail(e.target.value)} />
        </label>
        {error && <p role="alert" data-testid="forgot-error" className="rounded-md border border-bad/40 bg-bad/10 px-3 py-2 text-bad">{t(`errors.${error}`)}</p>}
        <div className="flex flex-wrap gap-3">
          <button type="submit" disabled={busy || !email} className={primary}>{busy ? t("working") : t("forgot.submit")}</button>
          <button type="button" className={secondary} onClick={onBack}>{t("forgot.back")}</button>
        </div>
      </form>
    </section>
  );
}

export function RecoveryForm({ onSave, onDone }: { onSave: (password: string) => Promise<ActionResult>; onDone: () => void }) {
  const t = useTranslations("account");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<FormError | null>(null);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    const problem = passwordProblem(password);
    if (problem) return setError(problem === "short" ? "passwordShort" : "passwordClasses");
    if (password !== confirm) return setError("passwordMismatch");
    setBusy(true);
    const result = await onSave(password);
    setBusy(false);
    if (!result.ok) return setError(result.error);
    setPassword("");
    setConfirm("");
    onDone();
  }

  return (
    <section className={box} data-testid="reset-form" aria-labelledby="reset-title">
      <h2 id="reset-title" className="text-xl font-semibold">{t("reset.title")}</h2>
      <p className="mt-2 text-muted">{t("reset.body")}</p>
      <form onSubmit={(e) => void submit(e)} noValidate className="mt-4 max-w-md space-y-4">
        <label className="block">
          {t("reset.newPassword")}
          <input type="password" required dir="ltr" autoComplete="new-password" className={field} value={password} onChange={(e) => setPassword(e.target.value)} aria-describedby="reset-pw-hint" />
        </label>
        <p id="reset-pw-hint" className="text-sm text-muted">{t("passwordHint")}</p>
        <label className="block">
          {t("reset.confirm")}
          <input type="password" required dir="ltr" autoComplete="new-password" className={field} value={confirm} onChange={(e) => setConfirm(e.target.value)} />
        </label>
        {error && <p role="alert" data-testid="reset-error" className="rounded-md border border-bad/40 bg-bad/10 px-3 py-2 text-bad">{t(`errors.${error}`)}</p>}
        <button type="submit" disabled={busy || !password || !confirm} className={primary}>{busy ? t("working") : t("reset.submit")}</button>
      </form>
    </section>
  );
}

/** The link in the e-mail was expired, already used, or did not create a session. */
export function LinkProblem({ onRequestNew }: { onRequestNew: () => void }) {
  const t = useTranslations("account");
  return (
    <section className={box} data-testid="reset-link-problem" aria-labelledby="reset-link-title">
      <h2 id="reset-link-title" className="text-xl font-semibold">{t("reset.linkErrorTitle")}</h2>
      <p role="alert" className="mt-2">{t("reset.linkErrorBody")}</p>
      <button type="button" className={`mt-4 ${primary}`} onClick={onRequestNew}>{t("reset.requestNew")}</button>
    </section>
  );
}

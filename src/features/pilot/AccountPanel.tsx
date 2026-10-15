"use client";

// The account page body (RAD-041b): sign in / create account, "waiting for approval", approved, suspended. Messages: namespace `account`.
import { useLocale, useTranslations } from "next-intl";
import { type FormEvent, useState } from "react";
import { Link } from "@/i18n/navigation";
import { type AuthErrorKey, passwordProblem } from "./account-state";
import { PILOT } from "./config";
import { needsConsent } from "./consent";
import { useAccount } from "./useAccount";

type Mode = "signIn" | "signUp";
const field = "mt-1 block w-full rounded-md border border-line bg-panel px-3 py-2 text-base";
const primary = "rounded-md bg-brand px-4 py-2 font-semibold text-white hover:bg-brand-strong disabled:opacity-60";

export function AccountPanel() {
  const t = useTranslations("account");
  const locale = useLocale();
  const redirectTo = typeof window === "undefined" ? "" : `${window.location.origin}/${locale}/account`;
  const { state, signIn, signUp, signOut, retry, acceptTerms } = useAccount(redirectTo);
  const [mode, setMode] = useState<Mode>("signIn");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<AuthErrorKey | "passwordShort" | "passwordClasses" | "passwordMismatch" | null>(null);
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [agreed, setAgreed] = useState(false);
  const [acceptFailed, setAcceptFailed] = useState(false);

  if (!PILOT) {
    return <p data-testid="account-off" className="rounded-lg border border-dashed border-line bg-paper p-5 text-muted">{t("notEnabled")}</p>;
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (mode === "signUp") {
      if (!agreed) return;
      const problem = passwordProblem(password);
      if (problem) return setError(problem === "short" ? "passwordShort" : "passwordClasses");
      if (password !== confirm) return setError("passwordMismatch");
    }
    setBusy(true);
    const result = mode === "signIn" ? await signIn(email.trim(), password) : await signUp(email.trim(), password);
    setBusy(false);
    if (!result.ok) return setError(result.error);
    setPassword("");
    setConfirm("");
    if (mode === "signUp") setSentTo(email.trim());
  }

  if (state.kind === "loading") return <p role="status" className="text-muted">{t("loading")}</p>;

  if (state.kind === "profileError") {
    return (
      <div className="rounded-lg border border-line bg-panel p-5" data-testid="account-profile-error">
        <p role="alert">{t("profileError")}</p>
        <div className="mt-4 flex gap-3">
          <button type="button" className={primary} onClick={() => void retry()}>{t("retry")}</button>
          <button type="button" className="rounded-md border border-line px-4 py-2" onClick={() => void signOut()}>{t("signOut")}</button>
        </div>
      </div>
    );
  }

  if (state.kind === "signedIn") {
    const { status, code } = state.profile;
    return (
      <>
      {needsConsent(state.consentVersion) && (
        <section className="mb-4 rounded-lg border border-signal bg-signal/10 p-5" data-testid="consent-card" aria-labelledby="consent-title">
          <h2 id="consent-title" className="text-lg font-semibold">{t("consent.title")}</h2>
          <p className="mt-2">{t("consent.body")}</p>
          <p className="mt-2"><Link href="/terms" target="_blank" rel="noopener" className="text-brand underline">{t("termsLink")}</Link></p>
          <label className="mt-3 flex items-start gap-2">
            <input type="checkbox" className="mt-1 size-5" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} />
            <span>{t("consent.agree")}</span>
          </label>
          {acceptFailed && <p role="alert" className="mt-2 text-bad">{t("consent.failed")}</p>}
          <button type="button" disabled={!agreed} className={`mt-3 ${primary}`} onClick={() => void acceptTerms().then((ok) => setAcceptFailed(!ok))}>{t("consent.accept")}</button>
        </section>
      )}
      <section className="rounded-lg border border-line bg-panel p-5" data-testid={`account-${status}`} aria-labelledby="acct-status">
        <p className="text-sm text-muted">{t("signedInAs")} <span dir="ltr" className="font-medium text-ink">{state.email}</span></p>
        <h2 id="acct-status" className="mt-2 text-xl font-semibold">{t(`status.${status}.title`)}</h2>
        <p className="mt-2">{t(`status.${status}.body`)}</p>
        <p className="mt-3 text-sm">{t("codeLabel")} <span dir="ltr" className="rounded bg-paper px-2 py-0.5 font-mono">{code}</span></p>
        <div className="mt-5 flex flex-wrap items-center gap-3">
          <button type="button" className="rounded-md border border-line px-4 py-2" onClick={() => void signOut()}>{t("signOut")}</button>
          {state.profile.role === "owner" && status === "approved" && (
            <Link href="/owner" data-testid="owner-link" className="text-brand underline">{t("ownerLink")}</Link>
          )}
        </div>
        <p className="mt-4 text-sm"><Link href="/terms" target="_blank" rel="noopener" className="text-brand underline">{t("termsLink")}</Link></p>
      </section>
      </>
    );
  }

  if (sentTo) {
    return (
      <section className="rounded-lg border border-line bg-panel p-5" data-testid="account-check-email" aria-labelledby="acct-sent">
        <h2 id="acct-sent" className="text-xl font-semibold">{t("checkEmail.title")}</h2>
        <p className="mt-2">{t("checkEmail.body", { email: sentTo })}</p>
        <p className="mt-2 text-sm text-muted">{t("checkEmail.spam")}</p>
        <button type="button" className="mt-4 rounded-md border border-line px-4 py-2" onClick={() => { setSentTo(null); setMode("signIn"); }}>{t("checkEmail.back")}</button>
      </section>
    );
  }

  return (
    <section className="rounded-lg border border-line bg-panel p-5" aria-labelledby="acct-form">
      <div role="tablist" aria-label={t("title")} className="mb-4 flex gap-2">
        {(["signIn", "signUp"] as const).map((m) => (
          <button
            key={m}
            type="button"
            role="tab"
            aria-selected={mode === m}
            className={`rounded-md border px-4 py-2 font-medium ${mode === m ? "border-brand bg-brand text-white" : "border-line"}`}
            onClick={() => { setMode(m); setError(null); }}
          >
            {t(`tabs.${m}`)}
          </button>
        ))}
      </div>
      <h2 id="acct-form" className="sr-only">{t(`tabs.${mode}`)}</h2>
      <form onSubmit={(e) => void submit(e)} noValidate className="max-w-md space-y-4">
        <label className="block">
          {t("email")}
          <input type="email" required dir="ltr" autoComplete="email" inputMode="email" className={field} value={email} onChange={(e) => setEmail(e.target.value)} />
        </label>
        <label className="block">
          {t("password")}
          <input type="password" required dir="ltr" autoComplete={mode === "signIn" ? "current-password" : "new-password"} className={field} value={password} onChange={(e) => setPassword(e.target.value)} aria-describedby={mode === "signUp" ? "pw-hint" : undefined} />
        </label>
        {mode === "signUp" && (
          <>
            <p id="pw-hint" className="text-sm text-muted">{t("passwordHint")}</p>
            <label className="block">
              {t("confirmPassword")}
              <input type="password" required dir="ltr" autoComplete="new-password" className={field} value={confirm} onChange={(e) => setConfirm(e.target.value)} />
            </label>
            <label className="flex items-start gap-2">
              <input type="checkbox" required className="mt-1 size-5" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} data-testid="agree-terms" />
              <span>{t("agreePrefix")} <Link href="/terms" target="_blank" rel="noopener" className="text-brand underline">{t("termsLink")}</Link></span>
            </label>
          </>
        )}
        {error && <p role="alert" data-testid="account-error" className="rounded-md border border-bad/40 bg-bad/10 px-3 py-2 text-bad">{t(`errors.${error}`)}</p>}
        <button type="submit" disabled={busy || !email || !password || (mode === "signUp" && !agreed)} className={primary}>{busy ? t("working") : t(`submit.${mode}`)}</button>
      </form>
    </section>
  );
}

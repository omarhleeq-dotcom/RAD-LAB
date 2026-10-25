"use client";

import { useState, type ReactNode } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { PILOT } from "./config";
import { needsConsent } from "./consent";
import { useSessionAccount } from "./SessionGate";
import { TermsContent } from "./TermsContent";

const primary = "min-h-11 rounded-md bg-brand px-4 py-2 font-semibold text-white hover:bg-brand-strong disabled:opacity-60";

/** The same consent wording and account action in both entry points. No separate profile writer. */
export function ConsentPrompt({ acceptTerms, fullPage = false, busy = false, onAcceptingChange }: { onAcceptingChange?: (busy: boolean) => void; acceptTerms: () => Promise<boolean>; fullPage?: boolean; busy?: boolean }) {
  const t = useTranslations("account");
  const [agreed, setAgreed] = useState(false);
  const [accepting, setAccepting] = useState(false);
  const [failed, setFailed] = useState(false);
  const Title = fullPage ? "h1" : "h2";
  async function accept() {
    setAccepting(true);
    onAcceptingChange?.(true);
    setFailed(false);
    try { setFailed(!await acceptTerms()); }
    catch { setFailed(true); }
    finally { setAccepting(false); onAcceptingChange?.(false); }
  }
  return <section className="mb-4 rounded-lg border border-signal bg-signal/10 p-5" data-testid="consent-card" aria-labelledby="consent-title">
    <Title id="consent-title" className="text-xl font-semibold">{t("consent.title")}</Title>
    <p className="mt-2">{t("consent.body")}</p>
    <p className="mt-2"><Link href="/terms" target="_blank" rel="noopener" className="text-brand underline">{t("termsLink")}</Link></p>
    <label className="mt-3 flex items-start gap-2">
      <input type="checkbox" className="mt-1 size-5 shrink-0" checked={agreed} disabled={accepting || busy} onChange={(e) => setAgreed(e.target.checked)} />
      <span>{t("consent.agree")}</span>
    </label>
    {failed && <p role="alert" className="mt-2 text-bad">{t("consent.failed")}</p>}
    <button type="button" disabled={!agreed || accepting || busy} className={`mt-3 ${primary}`} onClick={() => void accept()}>{accepting ? t("working") : t("consent.accept")}</button>
  </section>;
}

/** Replaces the entire shell without navigating, so path, query and fragment survive acceptance. */
export function ConsentGate({ children }: { children: ReactNode }) {
  const { state, acceptTerms, signOut } = useSessionAccount();
  const t = useTranslations("account");
  const [accepting, setAccepting] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [failed, setFailed] = useState(false);
  if (!PILOT) return children;
  if (state.kind === "loading") return <main id="main-content"><p role="status" className="mx-auto max-w-3xl px-4 py-10">{t("loading")}</p></main>;
  if (state.kind !== "signedIn" || !needsConsent(state.consentVersion)) return children;
  async function leave() {
    setLeaving(true);
    setFailed(false);
    try { await signOut(); }
    catch { setFailed(true); }
    finally { setLeaving(false); }
  }
  return <main id="main-content" tabIndex={-1} className="min-h-dvh px-4 py-10 outline-none" data-testid="consent-gate">
    <div className="mx-auto max-w-3xl">
      <ConsentPrompt acceptTerms={acceptTerms} fullPage busy={leaving} onAcceptingChange={setAccepting} />
      {failed && <p role="alert" className="mb-3 text-bad">{t("errors.network")}</p>}
      <button type="button" disabled={leaving || accepting} className="min-h-11 rounded-md border border-line bg-panel px-4 py-2 font-semibold disabled:opacity-60" onClick={() => void leave()}>{leaving ? t("working") : t("signOut")}</button>
      <details open className="mt-6 rounded-lg border border-line bg-panel">
        <summary className="cursor-pointer px-4 py-3 font-semibold text-brand">{t("termsLink")}</summary>
        <TermsContent nested />
      </details>
    </div>
  </main>;
}

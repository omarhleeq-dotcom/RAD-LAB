"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { C2Participant } from "./C2Session";
import { useSessionAccount } from "./SessionGate";

/** Owners manage rounds; only participants use the existing survey reader. */
export function FeedbackContent() {
  const { state } = useSessionAccount();
  const t = useTranslations("c2");
  if (state.kind === "signedIn" && state.profile.role === "owner") {
    return <section className="space-y-3 rounded-lg border border-line bg-panel p-4" data-testid="owner-feedback">
      <p>{t("ownerFeedback")}</p>
      <Link href="/owner" className="inline-block min-h-11 rounded-md border border-line px-4 py-2 font-semibold text-brand underline">{t("ownerPanel")}</Link>
    </section>;
  }
  return <C2Participant />;
}

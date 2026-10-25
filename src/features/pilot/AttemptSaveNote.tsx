"use client";

import { useSyncExternalStore } from "react";
import { useTranslations } from "next-intl";
import { useOptionalSessionAccount } from "./SessionGate";
import { savedAttempt } from "./saved-attempt";

/** Saving is asynchronous: the note disappears only when the recorder confirms persistence. */
export function AttemptSaveNote() {
  const account = useOptionalSessionAccount();
  const saved = useSyncExternalStore(savedAttempt.subscribe, savedAttempt.get, () => null);
  const t = useTranslations("result");
  if (account?.state.kind !== "signedIn" || account.state.profile.role !== "participant" || saved?.status === "saved") return null;
  return <p role="status" data-testid="attempt-not-saved" className="mb-4 rounded-md border border-signal bg-signal/10 px-4 py-3 text-sm">{t("attemptNotSaved")}</p>;
}

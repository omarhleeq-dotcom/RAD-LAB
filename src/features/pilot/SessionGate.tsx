"use client";

import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from "react";
import { useLocale, useTranslations } from "next-intl";
import { usePathname, useRouter } from "next/navigation";
import { recoveryFromHash } from "./account-state";
import { PILOT } from "./config";
import { PilotSessionKeeper } from "./PilotSessionKeeper";
import { accountDestination, sessionAccess } from "./session-access";
import { useAccount } from "./useAccount";

type SessionAccount = ReturnType<typeof useAccount> & { recovery: ReturnType<typeof recoveryFromHash>; consumeRecovery: () => void };
const AccountContext = createContext<SessionAccount | null>(null);

export function useSessionAccount() {
  const account = useContext(AccountContext);
  if (!account) throw new Error("Account UI requires SessionProvider");
  return account;
}

/** For the site shell: it lives inside the provider but outside the gate. */
export function useOptionalSessionAccount() {
  return useContext(AccountContext);
}

export function SessionProvider({ children }: { children: ReactNode }) {
  const locale = useLocale();
  const redirectTo = typeof window === "undefined" ? "" : `${window.location.origin}/${locale}/account`;
  // Preserve reset-link intent before the client consumes its fragment while consent hides the account page.
  const [recovery, setRecovery] = useState(() => typeof window === "undefined" ? null : recoveryFromHash(window.location.hash));
  const consumeRecovery = useCallback(() => setRecovery(null), []);
  const account = useAccount(redirectTo);
  return (
    <AccountContext.Provider value={{ ...account, recovery, consumeRecovery }}>
      {PILOT && account.state.kind === "signedIn" && <PilotSessionKeeper profileStatus={account.state.profile.status} />}
      {children}
    </AccountContext.Provider>
  );
}

export function SessionGate({ children }: { children: ReactNode }) {
  const locale = useLocale();
  const t = useTranslations("account");
  const pathname = usePathname();
  const router = useRouter();
  const { state } = useSessionAccount();
  const access = sessionAccess(Boolean(PILOT), pathname, state);

  useEffect(() => {
    if (access === "account") {
      router.replace(accountDestination(locale, `${window.location.pathname}${window.location.search}${window.location.hash}`));
    }
  }, [access, locale, pathname, router]);

  return access === "allow" ? <>{children}</> : <p role="status" className="mx-auto max-w-3xl px-4 py-10">{t("loading")}</p>;
}

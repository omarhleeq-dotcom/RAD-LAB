// Static-site UI policy only: exported HTML, scripts and assets remain downloadable.
import policy from "./access-policy.json";
import { routing } from "@/i18n/routing";
import type { AccountState } from "./useAccount";

export function routeWithoutLocale(path: string): string {
  const [, locale, ...rest] = path.split("/");
  return routing.locales.some((value) => value === locale) ? `/${rest.join("/")}`.replace(/\/$/, "") || "/" : path;
}

export function sessionAccess(enabled: boolean, path: string, state: AccountState): "allow" | "wait" | "account" {
  if (!enabled || policy.publicRoutes.includes(routeWithoutLocale(path))) return "allow";
  if (state.kind === "loading") return "wait";
  return state.kind === "signedIn" && state.profile.status === "approved" ? "allow" : "account";
}

/** Only a local, locale-prefixed destination; never an auth loop or an external redirect. */
export function safeReturnPath(value: string | null): string | null {
  if (!value || !value.startsWith("/") || value.startsWith("//") || /[\\\u0000-\u0020]/.test(value)) return null;
  const url = new URL(value, "https://local.invalid");
  if (url.origin !== "https://local.invalid" || !routing.locales.some((locale) => url.pathname === `/${locale}` || url.pathname.startsWith(`/${locale}/`))) return null;
  if (routeWithoutLocale(url.pathname) === "/account") return null;
  return `${url.pathname}${url.search}${url.hash}`;
}

export function accountDestination(locale: string, path: string): string {
  return `/${locale}/account?returnTo=${encodeURIComponent(safeReturnPath(path) ?? `/${locale}`)}`;
}

"use client";

import { useSyncExternalStore } from "react";
import { useTranslations } from "next-intl";
import { DEFAULT_THEME, saveTheme, type Theme } from "@/lib/theme";

const subscribe = (notify: () => void) => {
  window.addEventListener("radlab:theme", notify);
  return () => window.removeEventListener("radlab:theme", notify);
};
const current = (): Theme => (document.documentElement.getAttribute("data-theme") === "light" ? "light" : "dark");

/** Dark/light switch (F7): a real button whose name stays "Dark theme" and whose pressed state says whether dark is on. */
export function ThemeToggle() {
  const t = useTranslations("shell");
  const theme = useSyncExternalStore(subscribe, current, () => DEFAULT_THEME);
  const dark = theme === "dark";
  return (
    <button type="button" className="theme-toggle" aria-pressed={dark} aria-label={t("theme")} data-testid="theme-toggle" onClick={() => saveTheme(dark ? "light" : "dark")}>
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        {dark ? <path d="M20 14.5A8 8 0 0 1 9.5 4 8 8 0 1 0 20 14.5Z" /> : <><circle cx="12" cy="12" r="4" /><path d="M12 2v2m0 16v2M2 12h2m16 0h2M4.9 4.9l1.4 1.4m11.4 11.4 1.4 1.4m0-14.2-1.4 1.4M6.3 17.7l-1.4 1.4" /></>}
      </svg>
      <span>{t("themeShort")}</span>
    </button>
  );
}

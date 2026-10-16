"use client";

import { useEffect, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import { useLocale, useTranslations } from "next-intl";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { MODALITIES } from "@/data/modalities";
import { PILOT } from "@/features/pilot/config";
import { Link, usePathname } from "@/i18n/navigation";
import { localize } from "@/lib/localized";

function Icon({ kind }: { kind: string }) {
  const paths: Record<string, string> = {
    home: "m3 11 9-8 9 8M5 10v11h5v-7h4v7h5V10",
    library: "M3 4h7l2 2 2-2h7v16h-7l-2 2-2-2H3zM12 6v16",
    account: "M16 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0ZM4 21v-3a6 6 0 0 1 6-6h4a6 6 0 0 1 6 6v3",
    assess: "M6 3h9l4 4v14H5V3h1M14 3v5h5M8 12h8M8 16h6",
    learn: "M3 4h7l2 2 2-2h7v16h-7l-2 2-2-2H3zM12 6v16",
    credits: "M6 3h9l4 4v14H5V3h1M14 3v5h5M8 12h8M8 16h8",
  };
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={paths[kind] ?? paths.library} /></svg>;
}
export function AppShell({ children }: { children: ReactNode }) {
  const t = useTranslations("shell");
  const tc = useTranslations("common");
  const locale = useLocale();
  const pathname = usePathname();
  const dialog = useRef<HTMLDialogElement>(null);
  const [open, setOpen] = useState(false);
  const workspace = pathname.endsWith("/practice") || pathname.startsWith("/simulation/");
  const available = MODALITIES.filter((modality) => modality.status === "available");
  const entries = [
    { href: "/", label: tc("home"), icon: "home" },
    ...available.map((modality) => ({ href: `/${modality.id}`, label: available.length === 1 ? t("library") : `${t("library")} · ${localize(modality.name, locale)}`, icon: "library" })),
    ...(PILOT ? [{ href: "/account", label: t("account"), icon: "account" }] : []),
    { label: t("assess"), icon: "assess" },
    { label: t("learn"), icon: "learn" },
    { href: "/credits", label: tc("creditsLink"), icon: "credits" },
  ];
  const close = () => dialog.current?.close();
  const trapFocus = (event: KeyboardEvent<HTMLDialogElement>) => {
    if (event.key !== "Tab") return;
    const controls = [...event.currentTarget.querySelectorAll<HTMLElement>('a[href], button:not([disabled]), [tabindex="0"]')].filter((node) => node.getClientRects().length > 0);
    const first = controls[0], last = controls.at(-1);
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
  };
  useEffect(() => { dialog.current?.close(); }, [pathname]);
  useEffect(() => {
    const desktop = matchMedia("(min-width: 1024px)");
    const resized = () => { if (desktop.matches) dialog.current?.close(); };
    desktop.addEventListener("change", resized);
    return () => desktop.removeEventListener("change", resized);
  }, []);
  const logo = <Link href="/" className="site-logo" aria-label={tc("appName")} onClick={close}><span dir="ltr">RAD<span>·</span>LAB</span></Link>;
  const navigation = <nav aria-label={t("navigation")} className="site-nav">{entries.map((entry) => {
    const active = entry.href === "/" ? pathname === "/" : !!entry.href && (pathname === entry.href || pathname.startsWith(`${entry.href}/`));
    return entry.href ? <Link key={entry.href} href={entry.href} aria-current={active ? "page" : undefined} onClick={close} data-testid={entry.href === "/account" ? "account-link" : undefined}>
      <Icon kind={entry.icon} /><span>{entry.label}</span>
    </Link> : <span key={entry.icon} className="nav-planned" aria-disabled="true"><Icon kind={entry.icon} /><span>{entry.label}</span><small>{tc("comingSoon")}</small></span>;
  })}</nav>;
  return <div className="site-layout" data-workspace={workspace || undefined}>
    <header className="site-header site-chrome">
      <div className="site-topbar">
        <div className="site-brand-group">
          <button type="button" className="menu-toggle" aria-label={t("openMenu")} aria-haspopup="dialog" aria-controls="mobile-navigation" aria-expanded={open} data-testid="menu-toggle" onClick={() => { dialog.current?.showModal(); setOpen(true); }}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M3 6h18M3 12h18M3 18h18" /></svg></button>
          {logo}
        </div>
        <div className="site-top-actions">{workspace && <Link href={available[0] ? `/${available[0].id}` : "/"} className="workspace-library">{t("library")}</Link>}<LanguageSwitcher /></div>
      </div>
      <p role="note" data-testid="preview-banner" className="site-preview"><span aria-hidden="true">ⓘ</span> {tc("previewBanner")}</p>
    </header>
    <aside className="desktop-sidebar site-chrome">{navigation}</aside>
    <dialog ref={dialog} id="mobile-navigation" className="mobile-drawer site-chrome" aria-labelledby="mobile-nav-title" onKeyDown={trapFocus} onClose={() => setOpen(false)} onClick={(event) => { if (event.target === event.currentTarget) close(); }}>
      <div className="drawer-panel">
        <div className="drawer-top"><button type="button" className="drawer-close" aria-label={t("closeMenu")} onClick={close} autoFocus>×</button>{logo}<LanguageSwitcher /></div>
        <h2 id="mobile-nav-title" className="sr-only">{t("navigation")}</h2>
        {navigation}
      </div>
    </dialog>
    <div className="site-main">{children}</div>
    <footer className="site-footer site-chrome"><p role="note">{tc("disclaimer")} <Link href="/credits">{tc("creditsLink")}</Link></p></footer>
  </div>;
}

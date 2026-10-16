"use client";

import { useEffect, useId, useRef, useState, useSyncExternalStore } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { localize } from "@/lib/localized";
import { ExamGraphic } from "./ExamGraphic";
import { LIBRARY_REGIONS, filterLibrary, graphicOf, uniformlyProvisional, type LibrarySection } from "./library";

// Each category is a navigation step: browser Back restores the category cards.
// Preserve Next's history metadata so exam navigation and Forward continue to work.
function subscribeCategory(notify: () => void) {
  window.addEventListener("hashchange", notify);
  window.addEventListener("popstate", notify);
  return () => { window.removeEventListener("hashchange", notify); window.removeEventListener("popstate", notify); };
}
const currentCategory = () => new URLSearchParams(window.location.hash.slice(1)).get("category") ?? "";
const serverCategory = () => "";
function selectCategory(region: string) {
  const url = new URL(window.location.href);
  url.hash = region ? new URLSearchParams({ category: region }).toString() : "";
  window.history.pushState(window.history.state, "", url);
  window.dispatchEvent(new HashChangeEvent("hashchange"));
}

export function ExamCatalogue({ sections }: { sections: readonly LibrarySection[] }) {
  const t = useTranslations("library");
  const tc = useTranslations("common");
  const th = useTranslations("home");
  const locale = useLocale();
  const inputId = useId();
  const headingId = useId();
  const searchInput = useRef<HTMLInputElement>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  const categoryButtons = useRef<Record<string, HTMLButtonElement | null>>({});
  const previousRegion = useRef("");
  const [query, setQuery] = useState("");
  const region = useSyncExternalStore(subscribeCategory, currentCategory, serverCategory);
  const selected = sections.find((section) => section.region.id === region);
  const planned = LIBRARY_REGIONS.filter((entry) => entry.status === "planned");
  const items = selected ? filterLibrary([selected], query, region).flatMap((section) => section.items) : [];
  const sharedWarning = uniformlyProvisional(items);
  useEffect(() => {
    if (region) heading.current?.focus();
    else if (previousRegion.current) categoryButtons.current[previousRegion.current]?.focus();
    previousRegion.current = region;
  }, [region]);
  const clear = () => { setQuery(""); searchInput.current?.focus(); };
  if (!selected) return <section className="library-categories" aria-labelledby={headingId} data-testid="library-categories">
    <h2 id={headingId}>{t("chooseCategory")}</h2>
    <ul className="category-grid">
      {sections.map(({ region: entry, items: exams }) => <li key={entry.id}>
        <button type="button" className="category-choice" data-region={entry.id} ref={(node) => { categoryButtons.current[entry.id] = node; }} onClick={() => { setQuery(""); selectCategory(entry.id); }}>
          <div className="exam-art"><ExamGraphic kind={entry.graphic ?? graphicOf(exams[0]!)} /></div>
          <span className="category-choice-label">{localize(entry.name, locale)}<span aria-hidden="true">←</span></span>
        </button>
      </li>)}
      {planned.map((entry) => <li key={entry.id} className="category-planned" data-testid={`planned-category-${entry.id}`}>
        <div className="exam-art"><ExamGraphic kind={entry.graphic ?? "generic"} /></div>
        <div className="category-planned-label"><h3>{localize(entry.name, locale)}</h3><span className="category-soon">{tc("comingSoon")}</span></div>
      </li>)}
    </ul>
  </section>;
  return <div className="library-browser">
    <section className="library-section" data-testid={`library-region-${selected.region.id}`} aria-labelledby={headingId}>
      <h2 id={headingId} ref={heading} tabIndex={-1}>{localize(selected.region.name, locale)}</h2>
      <div className="library-search"><label htmlFor={inputId}>{t("search")}</label><div className="search-field"><svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="10" cy="10" r="7" /><path d="m16 16 5 5" /></svg><input ref={searchInput} id={inputId} type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder={t("searchPlaceholder")} autoComplete="off" /></div></div>
      <div className="library-results-meta"><p role="status" aria-live="polite">{t("resultCount", { count: items.length })}</p>{query && <button className="clear-filters" type="button" onClick={clear}>{t("clear")}</button>}</div>
      {sharedWarning && <p role="note" className="library-notice">{th("provisionalNotice")}</p>}
      {items.length === 0 ? <section className="library-empty"><h3>{t("emptyTitle")}</h3><p>{t("emptyBody")}</p><button type="button" className="platform-button" onClick={clear}>{t("clear")}</button></section> : <ul className="exam-grid">{items.map((exam) => <li key={exam.id} className="exam-card" data-testid={`exam-${exam.id}`}>
        <div className="exam-art"><ExamGraphic kind={graphicOf(exam)} /></div>
        <div className="exam-card-body"><h3>{localize(exam.title, locale)}</h3>
          <p className="exam-meta"><span>{t("caseCount", { count: exam.caseCount })}</span>{exam.provisional && !sharedWarning && <span className="provisional-chip">{tc("provisionalBadge")}</span>}</p>
          <Link href={exam.href} className="platform-button">{t("open")}<span className="sr-only"> — {localize(exam.title, locale)}</span><span aria-hidden="true">←</span></Link>
        </div>
      </li>)}</ul>}
    </section>
  </div>;
}

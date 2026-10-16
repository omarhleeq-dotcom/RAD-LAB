"use client";

import { useId, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { localize } from "@/lib/localized";
import { ExamGraphic } from "./ExamGraphic";
import { filterLibrary, graphicOf, uniformlyProvisional, type LibrarySection } from "./library";

export function ExamCatalogue({ sections }: { sections: readonly LibrarySection[] }) {
  const t = useTranslations("library");
  const tc = useTranslations("common");
  const th = useTranslations("home");
  const locale = useLocale();
  const inputId = useId();
  const searchInput = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [region, setRegion] = useState("");
  const visible = filterLibrary(sections, query, region);
  const items = visible.flatMap((section) => section.items);
  const sharedWarning = uniformlyProvisional(items);
  const reset = () => { setQuery(""); setRegion(""); searchInput.current?.focus(); };
  return <div className="library-browser">
    <div className="library-search"><label htmlFor={inputId}>{t("search")}</label><div className="search-field"><svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="10" cy="10" r="7" /><path d="m16 16 5 5" /></svg><input ref={searchInput} id={inputId} type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder={t("searchPlaceholder")} autoComplete="off" /></div></div>
    <div className="library-filters" role="group" aria-label={t("regions")}>
      <button type="button" aria-pressed={region === ""} onClick={() => setRegion("")}>{t("all")}</button>
      {sections.map(({ region: entry }) => <button type="button" key={entry.id} data-region={entry.id} aria-pressed={region === entry.id} onClick={() => setRegion(entry.id)}>{localize(entry.name, locale)}</button>)}
    </div>
    <div className="library-results-meta"><p role="status" aria-live="polite">{t("resultCount", { count: items.length })}</p>{(query || region) && <button className="clear-filters" type="button" onClick={reset}>{t("clear")}</button>}</div>
    {sharedWarning && <p role="note" className="library-notice">{th("provisionalNotice")}</p>}
    {visible.length === 0 ? <section className="library-empty"><h2>{t("emptyTitle")}</h2><p>{t("emptyBody")}</p><button type="button" className="platform-button" onClick={reset}>{t("clear")}</button></section> : visible.map(({ region: entry, items: exams }) => <section className="library-section" key={entry.id} data-testid={`library-region-${entry.id}`} aria-labelledby={`region-${entry.id}`}>
      <h2 id={`region-${entry.id}`}>{localize(entry.name, locale)}</h2>
      <ul className="exam-grid">{exams.map((exam) => <li key={exam.id} className="exam-card" data-testid={`exam-${exam.id}`}>
        <div className="exam-art"><ExamGraphic kind={graphicOf(exam)} /></div>
        <div className="exam-card-body"><h3>{localize(exam.title, locale)}</h3>
          <p className="exam-meta"><span>{t("caseCount", { count: exam.caseCount })}</span>{exam.provisional && !sharedWarning && <span className="provisional-chip">{tc("provisionalBadge")}</span>}</p>
          <Link href={exam.href} className="platform-button">{t("open")}<span className="sr-only"> — {localize(exam.title, locale)}</span><span aria-hidden="true">←</span></Link>
        </div>
      </li>)}</ul>
    </section>)}
  </div>;
}

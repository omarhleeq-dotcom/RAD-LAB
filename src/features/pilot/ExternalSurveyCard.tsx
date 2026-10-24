"use client";
// Retained for possible later research use; deliberately not mounted in the live app.
import {useTranslations} from 'next-intl';
import {SURVEY_URL,surveyHref} from './survey';
export function ExternalSurveyCard({code,status,surveyOpened}:{code:string;status:string;surveyOpened:()=>Promise<unknown>}) {
 const t=useTranslations('account');
 const primary='rounded-md bg-brand px-4 py-2 font-semibold text-white hover:bg-brand-strong disabled:opacity-60';
 return <>
      {SURVEY_URL && status === "approved" && (
        <section className="mb-4 rounded-lg border border-line bg-panel p-5" data-testid="survey-card" aria-labelledby="survey-title">
          <h2 id="survey-title" className="text-lg font-semibold">{t("survey.title")}</h2>
          <p className="mt-2">{t("survey.body")}</p>
          <a
            href={surveyHref(SURVEY_URL, code)}
            target="_blank"
            rel="noopener noreferrer"
            data-testid="survey-link"
            className={`mt-3 inline-block ${primary}`}
            onClick={() => void surveyOpened()}
          >
            {t("survey.open")}
          </a>
        </section>
      )}
 </>;
}

"use client";

import { useTranslations } from "next-intl";

// Number of paragraphs (keys p1…pN) per section of the `terms` messages.
const SECTIONS = [["keep", 4], ["why", 3], ["who", 7], ["protect", 1], ["howLong", 4], ["rights", 3], ["patients", 6]] as const;

export function TermsContent({ nested = false }: { nested?: boolean }) {
  const t = useTranslations("terms");
  const Title = nested ? "h2" : "h1";
  const SectionTitle = nested ? "h3" : "h2";
  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <Title className="text-3xl font-bold">{t("title")}</Title>
      <p data-testid="terms-draft" className="mt-4 rounded-md border border-signal bg-signal/10 px-3 py-2 text-sm">{t("draft")}</p>
      <p className="mt-4 text-lg">{t("lead")}</p>
      {SECTIONS.map(([key, count]) => (
        <section key={key} className="mt-8" aria-labelledby={`terms-${key}`}>
          <SectionTitle id={`terms-${key}`} className="text-xl font-semibold">{t(`${key}.title`)}</SectionTitle>
          <ul className="mt-3 list-disc space-y-2 ps-6">
            {Array.from({ length: count }, (_, i) => (
              <li key={i}>{t(`${key}.p${i + 1}` as `${typeof key}.p1`)}</li>
            ))}
          </ul>
        </section>
      ))}
      <p className="mt-8 rounded-md border border-line bg-paper px-3 py-2">{t("closing")}</p>
    </div>
  );
}

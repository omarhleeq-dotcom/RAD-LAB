import { hasLocale } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { C2Participant } from "@/features/pilot/C2Session";
import { TrainingSummary } from "@/features/pilot/TrainingSummary";
import { routing } from "@/i18n/routing";
export default async function HomePage({ params }: PageProps<"/[locale]">) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);
  return <div className="platform-page home-dashboard" data-testid="home-dashboard"><TrainingSummary /><C2Participant reminder/></div>;
}

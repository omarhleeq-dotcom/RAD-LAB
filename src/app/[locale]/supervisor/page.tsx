import { hasLocale } from 'next-intl';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { routing } from '@/i18n/routing';
import { P1_AVAILABLE } from '@/features/supervisor/p1-availability';
import { P1Session } from '@/features/supervisor/P1Session';

export async function generateMetadata({ params }: PageProps<'/[locale]/supervisor'>) {
 const { locale } = await params;
 const t = await getTranslations({ locale, namespace: 'supervisor' });
 return { title: t('title') };
}
export default async function SupervisorPage({ params }: PageProps<'/[locale]/supervisor'>) {
 const { locale } = await params;
 if (!hasLocale(routing.locales, locale) || !P1_AVAILABLE) notFound();
 setRequestLocale(locale);
 const t = await getTranslations('supervisor');
 return <div className="mx-auto max-w-5xl px-4 py-10"><h1 className="text-3xl font-bold">{t('title')}</h1><P1Session role="supervisor"/></div>;
}

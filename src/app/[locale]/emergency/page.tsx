import {hasLocale} from 'next-intl';
import {getTranslations,setRequestLocale} from 'next-intl/server';
import {notFound} from 'next/navigation';
import {routing} from '@/i18n/routing';
import {EmergencyPage} from '@/features/emergency/EmergencySession';

export async function generateMetadata({params}:PageProps<'/[locale]/emergency'>) {
 const {locale}=await params;
 const t=await getTranslations({locale,namespace:'emergency'});
 return {title:t('pageTitle'),robots:{index:false,follow:false}};
}
export default async function Page({params}:PageProps<'/[locale]/emergency'>) {
 const {locale}=await params;
 if(!hasLocale(routing.locales,locale))notFound();
 setRequestLocale(locale);
 const t=await getTranslations('emergency');
 return <div className="mx-auto max-w-3xl px-4 py-10"><h1 className="text-3xl font-bold">{t('pageTitle')}</h1><EmergencyPage/></div>;
}

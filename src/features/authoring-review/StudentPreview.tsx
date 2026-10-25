import { useState } from 'react';
import { NextIntlClientProvider } from 'next-intl';
import { PracticalControls } from '../assess/PracticalControls';
import { PartControls } from '../assess/PartControls';
import en from '../../../messages/en.json';
import ar from '../../../messages/ar.json';
import type { StudentPreviewData } from './contracts';
import type { Copy } from './copy';
const button = 'min-h-11 rounded-lg border border-line bg-panel px-4 py-2 text-sm';
/** Receives only the projected student DTO; never a draft or adapter. Answers die on unmount. */
export function StudentPreview({ data, t, locale, close }: { data: StudentPreviewData; t: Copy; locale: 'en' | 'ar'; close(): void }) {
 const [index, setIndex] = useState(0);
 const [answers, setAnswers] = useState<Record<string, string>>({});
 const [values, setValues] = useState<Record<string, Record<string, unknown>>>({});
 return <section aria-label={t.previewTitle} className="space-y-5 rounded-xl border border-line bg-panel p-4">
  <h2 tabIndex={-1} autoFocus className="text-xl font-semibold">{t.previewTitle}</h2><p>{t.previewHint}</p>
  <button className={button} onClick={close}>{t.closePreview}</button>
  <div lang="en" dir="ltr" className="space-y-5"><h3 className="text-lg font-semibold break-words">{data.name}</h3>
   <nav lang={locale} dir={locale === 'ar' ? 'rtl' : 'ltr'} aria-label={t.item} className="flex flex-wrap gap-2">{data.items.map((item, n) => <button key={item.ref.id} className={button} aria-current={index === n ? 'step' : undefined} onClick={() => setIndex(n)}>{t.item} {n + 1}</button>)}</nav>
   {data.items.slice(index, index + 1).map(item => <fieldset key={item.ref.id} className="min-w-0 rounded-lg border border-line p-4">
    <legend className="max-w-full break-words px-2">{index + 1}. {item.prompt}</legend>
    {item.type === 'full-practical' ? <NextIntlClientProvider locale={locale} messages={{ assess: (locale === 'ar' ? ar : en).assess }} timeZone="UTC"><p lang={locale} dir={locale === 'ar' ? 'rtl' : 'ltr'}>{t.sceneBoundary}</p><PracticalControls view={item.practicalView!} values={values[item.ref.id] ?? item.practicalView!.initial} disabled={false} onChange={v => setValues(old => ({ ...old, [item.ref.id]: v }))}/></NextIntlClientProvider> : item.type === 'single-choice' ? item.options.map(option => <label key={option.id} className="flex min-h-11 items-center gap-3 break-words"><input type="radio" name={item.ref.id} value={option.id} checked={answers[item.ref.id] === option.id} onChange={() => setAnswers(a => ({ ...a, [item.ref.id]: option.id }))}/><span className="min-w-0 break-words">{option.text}</span></label>) :
     <NextIntlClientProvider locale={locale} messages={{ assess: { part: (locale === 'ar' ? ar : en).assess.part } }} timeZone="UTC"><PartControls item={item} view={item.view!} values={values[item.ref.id] ?? item.view!.initial} disabled={false} onChange={v => setValues(old => ({ ...old, [item.ref.id]: v }))}/></NextIntlClientProvider>}
   </fieldset>)}
  </div>
 </section>;
}

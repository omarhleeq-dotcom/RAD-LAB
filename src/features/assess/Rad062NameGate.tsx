import { useEffect, useState, type ReactNode } from 'react';
import { useLocale } from 'next-intl';
import { useSessionAccount } from '../pilot/SessionGate';
import { getPilotClient } from '../pilot/client';
import { validFullName } from '../pilot/full-name';

const copy = {
 en: { name: 'Full name', help: 'Before entering Assess, enter at least three words containing letters, up to 100 characters.', save: 'Save name', retry: 'Retry', loading: 'Loading…', error: 'Unable to save or verify your name. Please try again.' },
 ar: { name: 'الاسم الكامل', help: 'قبل دخول Assess، أدخل ثلاث كلمات تحتوي حروفًا على الأقل، بحد 100 حرف.', save: 'حفظ الاسم', retry: 'إعادة المحاولة', loading: 'جارٍ التحميل…', error: 'تعذر حفظ الاسم أو التحقق منه. أعد المحاولة.' },
};
async function complete() {
 const client = await getPilotClient();
 if (!client) throw Error('unavailable');
 const { data, error } = await client.schema('assess').rpc('name_entry_v1');
 if (error || typeof data !== 'boolean') throw Error('unavailable');
 return data;
}
export function Rad062NameGate({ children }: { children: ReactNode }) {
 const { state, saveName } = useSessionAccount(), locale = useLocale() === 'ar' ? 'ar' : 'en', t = copy[locale];
 const [name, setName] = useState(() => state.kind === 'signedIn' ? state.displayName ?? '' : '');
 const [ready, setReady] = useState<boolean | null>(null), [busy, setBusy] = useState(false), [error, setError] = useState(false);
 useEffect(() => {
  let cancelled = false;
  void complete().then(value => { if (!cancelled) setReady(value); }).catch(() => { if (!cancelled) setError(true); });
  return () => { cancelled = true; };
 }, []);
 async function verify(save: boolean) {
  setBusy(true); setError(false);
  try {
   if (save && (!validFullName(name) || !await saveName(name))) throw Error('invalid name');
   setReady(await complete());
  } catch { setError(true); } finally { setBusy(false); }
 }
 if (ready) return children;
 return <section lang={locale} dir={locale === 'ar' ? 'rtl' : 'ltr'} className="mt-6 space-y-4">
  {error && <p role="alert">{t.error}</p>}
  {ready === null ? <><p role="status">{t.loading}</p>{error && <button disabled={busy} className="min-h-11 rounded border border-line px-3" onClick={() => void verify(false)}>{t.retry}</button>}</> :
   <form className="space-y-4" onSubmit={event => { event.preventDefault(); void verify(true); }}>
    <p id="rad062-name-help">{t.help}</p>
    <label className="block">{t.name}<input className="block min-h-11 w-full rounded border border-line px-3" value={name} onChange={event => setName(event.target.value)} autoComplete="name" aria-describedby="rad062-name-help" required disabled={busy}/></label>
    <button className="min-h-11 rounded border border-line px-3" disabled={busy || !validFullName(name)}>{t.save}</button>
   </form>}
 </section>;
}
